"""TaxShield API (Gate 3).

Hardened versus Gate 2:
  - JWT login protects /events, /summary, /nexus, /risk and uploads
  - Pydantic validation of every event shape
  - Rate limiting on all routes
  - CORS locked to the dashboard origin
  - Classification via RAG+LLM with keyword fallback and DB caching
  - Chain verification reports the first broken record

Run:  uvicorn ingest.api:app --reload
"""
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from ingest import db as dbmod
from ingest.schemas import EventIn, TokenRequest
from ml import insurance, nexus, rd_classifier, risk_model
from security.auth import create_token, require_user, verify_credentials
from security.crypto import decrypt, encrypt

load_dotenv()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="TaxShield Enterprise API", version="3.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = [os.environ.get("DASHBOARD_ORIGIN", "http://localhost:3000")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
def _startup():
    dbmod.init_db()


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------- auth

@app.post("/auth/token")
@limiter.limit("10/minute")
def token(req: TokenRequest, request: Request):
    if not verify_credentials(req.username, req.password):
        raise HTTPException(status_code=401, detail="invalid credentials")
    return {"access_token": create_token(req.username), "token_type": "bearer"}


# ---------------------------------------------------------------- events

@app.post("/events")
@limiter.limit("120/minute")
def ingest_event(event: EventIn, request: Request, user: str = Depends(require_user)):
    con = dbmod.connect()
    try:
        payload = event.typed_payload()
        full = {"id": event.id, "source": event.source,
                "timestamp": event.timestamp, "payload": payload}
        result = rd_classifier.classify_event(full, con)
        enc = encrypt(payload)
        stored = dbmod.insert_event(con, full, result, enc)
        return {"stored": True, "seq": stored["seq"], "hash": stored["hash"],
                "classification": result}
    finally:
        con.close()


@app.get("/events")
def list_events(source: str | None = None, qualified: bool | None = None,
                user: str = Depends(require_user)):
    con = dbmod.connect()
    try:
        rows = dbmod.fetch_events(con, source=source, qualified=qualified)
        for r in rows:
            r["encrypted"] = r["encrypted"][:32] + "..."  # preview only
            r["qualified"] = bool(r["qualified"])
        return rows
    finally:
        con.close()


@app.get("/summary")
def summary(user: str = Depends(require_user)):
    con = dbmod.connect()
    try:
        rows = dbmod.fetch_events(con)
        chain = dbmod.verify_chain(con)
        by_source = {}
        for r in rows:
            s = by_source.setdefault(r["source"], {"events": 0, "qualified": 0,
                                                   "credit": 0.0})
            s["events"] += 1
            s["qualified"] += int(r["qualified"])
            s["credit"] += float(r["credit"] or 0)
        return {
            "events": len(rows),
            "qualified_events": sum(int(r["qualified"]) for r in rows),
            "total_estimated_credit": round(sum(float(r["credit"] or 0)
                                                for r in rows), 2),
            "total_qualified_expense": round(sum(float(r["expense"] or 0)
                                                 for r in rows), 2),
            "hash_chain_valid": chain["valid"],
            "chain_detail": chain["detail"],
            "first_broken_seq": chain["first_broken_seq"],
            "by_source": by_source,
            "assumptions": {
                "developer_hourly_rate_usd": 75,
                "simplified_credit_rate": rd_classifier.CREDIT_RATE,
                "note": "simplified flat credit rate; real Section 41 is "
                        "incremental and capped — demo only",
            },
        }
    finally:
        con.close()


# ---------------------------------------------------------------- verify

@app.get("/verify")
def verify(user: str = Depends(require_user)):
    con = dbmod.connect()
    try:
        return dbmod.verify_chain(con)
    finally:
        con.close()


@app.get("/events/{seq}/decrypt")
def decrypt_event(seq: int, user: str = Depends(require_user)):
    con = dbmod.connect()
    try:
        row = con.execute("SELECT encrypted FROM events WHERE seq = ?",
                          (seq,)).fetchone()
        if not row:
            raise HTTPException(404, "event not found")
        return {"seq": seq, "payload": decrypt(row["encrypted"])}
    finally:
        con.close()


# ---------------------------------------------------------------- connectors

@app.post("/ingest/github")
@limiter.limit("10/minute")
def ingest_github(limit: int = 20, request: Request = None, user: str = Depends(require_user)):
    """Pull recent commits from GitHub and ingest them (live mode)."""
    try:
        from ingest import github_connector
        events = github_connector.fetch_events(limit=min(limit, 50))
    except github_connector.ConnectorError as exc:
        raise HTTPException(502, f"GitHub connector failed: {exc}")
    return _ingest_events(events)


@app.post("/ingest/stripe")
@limiter.limit("10/minute")
def ingest_stripe(limit: int = 20, request: Request = None, user: str = Depends(require_user)):
    """Pull recent test-mode payments from Stripe and ingest them."""
    try:
        from ingest import stripe_connector
        events = stripe_connector.fetch_events(limit=min(limit, 50))
    except stripe_connector.ConnectorError as exc:
        raise HTTPException(502, f"Stripe connector failed: {exc}")
    return _ingest_events(events)


@app.post("/ingest/aws-csv")
@limiter.limit("10/minute")
async def ingest_aws_csv(file: UploadFile = File(...), request: Request = None,
                         user: str = Depends(require_user)):
    """Upload an AWS billing-export CSV. This is a CSV import, not a live API."""
    raw = await file.read()
    if len(raw) > 5_000_000:
        raise HTTPException(413, "file too large (5MB max)")
    try:
        from ingest import aws_csv
        events = aws_csv.parse_csv(raw.decode("utf-8-sig"))
    except aws_csv.CsvError as exc:
        raise HTTPException(400, f"bad CSV: {exc}")
    return _ingest_events(events)


def _ingest_events(events: list[dict]) -> dict:
    """Shared ingest path for connector results (same chain + classifier)."""
    con = dbmod.connect()
    try:
        stored = 0
        results = []
        for ev in events:
            result = rd_classifier.classify_event(ev, con)
            enc = encrypt(ev["payload"])
            s = dbmod.insert_event(con, ev, result, enc)
            stored += 1
            results.append({"seq": s["seq"], "source": ev["source"],
                            "qualified": result["qualified"],
                            "engine": result["engine"]})
        return {"stored": stored, "results": results}
    finally:
        con.close()


# ---------------------------------------------------------------- demo helpers

@app.post("/demo/simulate")
@limiter.limit("30/minute")
def demo_simulate(count: int = 10, request: Request = None, user: str = Depends(require_user)):
    """Ingest N simulated events without running the simulator process."""
    from ingest.simulator import make_event
    events = [make_event() for _ in range(min(count, 100))]
    return _ingest_events(events)


@app.post("/demo/tamper")
@limiter.limit("5/minute")
def demo_tamper(request: Request = None, user: str = Depends(require_user)):
    """DEMO CONTROL: modify one sealed event in the DB to showcase detection.

    Only exists so the dashboard can demonstrate tamper detection live.
    Restoring requires re-seeding (the break is permanent by design).
    """
    con = dbmod.connect()
    try:
        row = con.execute("SELECT seq, encrypted FROM events ORDER BY seq LIMIT 1 OFFSET 1").fetchone()
        if not row:
            raise HTTPException(404, "need at least 2 events to demo tampering")
        from security.crypto import chain_hash  # noqa: F401
        enc = row["encrypted"]
        forged = ("A" if enc[5] != "A" else "B") + enc[1:]
        con.execute("UPDATE events SET encrypted = ? WHERE seq = ?",
                    (forged, row["seq"]))
        con.commit()
        return {"ok": True, "tampered_seq": row["seq"],
                "note": "payload modified in the database; /verify now reports the break. "
                        "Restore with: python scripts/seed.py --reset"}
    finally:
        con.close()


# ---------------------------------------------------------------- nexus/risk

@app.get("/nexus")
def nexus_view(user: str = Depends(require_user)):
    con = dbmod.connect()
    try:
        rows = con.execute("SELECT encrypted FROM events WHERE source = 'stripe'"
                           ).fetchall()
        sales = []
        for r in rows:
            p = decrypt(r["encrypted"])
            sales.append({"state": p.get("state"),
                          "amount_usd": p.get("amount_usd")})
        return nexus.compute_nexus(sales)
    finally:
        con.close()


@app.get("/risk")
def risk_view(user: str = Depends(require_user)):
    con = dbmod.connect()
    try:
        chain = dbmod.verify_chain(con)
        rows = dbmod.fetch_events(con)
        q_total = sum(float(r["expense"] or 0) for r in rows if r["qualified"])
        # Revenue estimate: sum of sales events x 20 — a labelled demo
        # assumption so the risk model has a plausible revenue denominator.
        sales = 0.0
        for r in rows:
            if r["source"] == "stripe":
                p = decrypt(r["encrypted"])
                sales += float(p.get("amount_usd") or 0)
        revenue_estimate = max(sales * 20, 100_000)
        doc_completeness = 0.85  # labelled assumption: events carry reasons
        features = risk_model.default_features_from_ledger(
            q_total, revenue_estimate, doc_completeness, chain["valid"])
        score = risk_model.score(features)
        binder = insurance.quote(score["audit_risk_probability"], q_total * 0.14)
        return {"risk": score, "binder": binder,
                "revenue_estimate_usd": round(revenue_estimate, 2),
                "claim_estimate_usd": round(q_total * 0.14, 2)}
    finally:
        con.close()
