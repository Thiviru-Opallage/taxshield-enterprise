"""Security + pipeline test suite.

Covers what Gate 3 asks for: crypto round trips, wrong-key failure, hash-chain
tamper detection, plus auth, validation, nexus math and the CSV parser.
Run:  pytest -q
"""
import os
import tempfile

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

# Point the DB at a throwaway file BEFORE importing app modules.
_tmpdir = tempfile.mkdtemp()
os.environ["TAXSHIELD_DB"] = os.path.join(_tmpdir, "test.db")
os.environ["TAXSHIELD_KEY"] = "6f" * 32
os.environ["JWT_SECRET"] = "test-secret-" + "x" * 32  # 32+ bytes per RFC 7518
os.environ["LLM_PROVIDER"] = "none"

from ingest import api, db as dbmod            # noqa: E402
from ingest.schemas import EventIn             # noqa: E402
from ml import classifier, nexus, rd_classifier  # noqa: E402
from security import auth                      # noqa: E402
from security.crypto import (GENESIS, chain_hash, decrypt, encrypt)  # noqa: E402

client = TestClient(api.app)


# ---------------------------------------------------------------- crypto

def test_encrypt_decrypt_roundtrip():
    payload = {"message": "prototype new model", "hours": 4, "author": "asha"}
    assert decrypt(encrypt(payload)) == payload


def test_ciphertext_is_unique_per_call():
    payload = {"a": 1}
    assert encrypt(payload) != encrypt(payload)  # fresh nonce each time


def test_wrong_key_fails(monkeypatch):
    token = encrypt({"x": 1})
    monkeypatch.setenv("TAXSHIELD_KEY", "ab" * 32)
    import importlib
    import security.crypto as crypto
    importlib.reload(crypto)
    with pytest.raises(Exception):
        crypto.decrypt(token)
    importlib.reload(crypto)  # restore correct key for later tests


def test_tampered_ciphertext_fails_decrypt():
    token = encrypt({"x": 1})
    raw = token[:-4] + ("AAAA" if token[-4:] != "AAAA" else "BBBB")
    with pytest.raises(Exception):
        decrypt(raw)


# ---------------------------------------------------------------- hash chain

def test_chain_detects_payload_tamper():
    a = encrypt({"n": 1})
    b = encrypt({"n": 2})
    h1 = chain_hash(GENESIS, a)
    h2 = chain_hash(h1, b)
    # Attacker edits row 1's ciphertext but leaves hashes alone.
    forged = encrypt({"n": 99})
    assert chain_hash(GENESIS, forged) != h1 or forged != a
    # Verification as the API does it:
    assert chain_hash(GENESIS, forged) != h1  # row 1 fails immediately


def test_chain_detects_row_reorder():
    a, b = encrypt({"n": 1}), encrypt({"n": 2})
    h1, h2 = chain_hash(GENESIS, a), chain_hash(chain_hash(GENESIS, a), b)
    # Swap the two rows: row1=b, row2=a
    assert b != a
    assert chain_hash(GENESIS, b) != h1  # first row already breaks


def test_verify_chain_on_real_db():
    dbmod.init_db()
    con = dbmod.connect()
    con.execute("DELETE FROM events")
    con.commit()
    ev = {"id": "t1", "source": "stripe", "timestamp": "t", "payload": {}}
    for i in range(3):
        ev = {"id": f"t{i}", "source": "stripe", "timestamp": "t",
              "payload": {"state": "CA", "amount_usd": 100 + i}}
        dbmod.insert_event(con, ev, {"qualified": False, "confidence": 1.0,
                                     "reason": "sales", "rule_cited": "",
                                     "qualified_expense_usd": 0,
                                     "estimated_credit": 0, "engine": "test"},
                           encrypt(ev["payload"]))
    assert dbmod.verify_chain(con)["valid"] is True
    # Tamper with row 2 directly in the DB.
    con.execute("UPDATE events SET encrypted = ? WHERE seq = 2",
                (encrypt({"state": "NY", "amount_usd": 999}),))
    con.commit()
    result = dbmod.verify_chain(con)
    assert result["valid"] is False
    assert result["first_broken_seq"] == 2
    con.close()


# ---------------------------------------------------------------- auth

def test_login_and_token_flow():
    r = client.post("/auth/token",
                    json={"username": os.environ["DEMO_USER"] if "DEMO_USER" in os.environ else "demo@taxshield.local",
                          "password": os.environ.get("DEMO_PASSWORD", "demo1234")})
    assert r.status_code == 200
    token = r.json()["access_token"]
    payload = pyjwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
    assert payload["sub"]


def test_bad_password_rejected():
    r = client.post("/auth/token",
                    json={"username": "demo@taxshield.local", "password": "nope"})
    assert r.status_code == 401


def test_protected_routes_require_token():
    for path in ("/events", "/summary", "/verify", "/nexus", "/risk"):
        assert client.get(path).status_code == 401, path


def test_forged_token_rejected():
    forged = pyjwt.encode({"sub": "x", "exp": 9999999999}, "w" * 40)
    r = client.get("/events", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


# ---------------------------------------------------------------- validation

def _token():
    return client.post("/auth/token", json={
        "username": os.environ.get("DEMO_USER", "demo@taxshield.local"),
        "password": os.environ.get("DEMO_PASSWORD", "demo1234")
    }).json()["access_token"]


def _post_event(event, token):
    return client.post("/events", json=event,
                       headers={"Authorization": f"Bearer {token}"})


def test_event_validation_rejects_bad_shapes():
    token = _token()
    bad = [
        {"id": "1", "source": "github", "timestamp": "t",
         "payload": {"message": "", "author": "a", "hours": 1}},       # empty msg
        {"id": "1", "source": "github", "timestamp": "t",
         "payload": {"message": "x", "author": "a", "hours": -1}},     # negative
        {"id": "1", "source": "stripe", "timestamp": "t",
         "payload": {"state": "CALIFORNIA", "amount_usd": 10}},        # bad state
        {"id": "1", "source": "aws", "timestamp": "t",
         "payload": {"service": "EC2", "cost_usd": -5}},               # negative
        {"id": "1", "source": "bitcoin", "timestamp": "t", "payload": {}},  # bad src
    ]
    for e in bad:
        assert _post_event(e, token).status_code == 422, e


def test_valid_event_accepted_and_chained():
    token = _token()
    e = {"id": "unit-ok-1", "source": "github", "timestamp": "2026-10-11",
         "payload": {"message": "prototype new model", "author": "a", "hours": 2}}
    r = _post_event(e, token)
    assert r.status_code == 200
    body = r.json()
    assert body["stored"] is True
    assert len(body["hash"]) == 64


# ---------------------------------------------------------------- classifier

def test_keyword_classifier_shapes():
    ev = {"source": "github",
          "payload": {"message": "experiment with caching", "hours": 2}}
    out = classifier.classify(ev)
    assert out["qualified"] is True
    assert out["estimated_credit"] == round(2 * 75 * 0.14, 2)
    assert "confidence" in out and "rule_cited" in out


def test_stripe_never_qualifies():
    ev = {"source": "stripe", "payload": {"state": "CA", "amount_usd": 100}}
    assert classifier.classify(ev)["qualified"] is False


def test_llm_json_parser_rejects_garbage():
    from ml.llm import parse_llm_json
    assert parse_llm_json(None) is None
    assert parse_llm_json("") is None
    assert parse_llm_json("no json here") is None
    assert parse_llm_json('{"qualified": "maybe"}') is None       # bad type
    assert parse_llm_json('{"qualified": true}') is not None      # minimal ok


# ---------------------------------------------------------------- nexus

def test_nexus_math():
    sales = [{"state": "WA", "amount_usd": 60000},
             {"state": "WA", "amount_usd": 50000},
             {"state": "CA", "amount_usd": 100000}]
    out = nexus.compute_nexus(sales)
    wa = next(s for s in out["states"] if s["code"] == "WA")
    ca = next(s for s in out["states"] if s["code"] == "CA")
    assert wa["status"] == "triggered"              # 110k >= 100k
    assert wa["transactions"] == 2
    assert ca["status"] == "clear"
    assert "WA" in out["triggered_states"]
    assert wa["estimated_exposure_usd"] == round(110000 * 0.065, 2)


def test_nexus_approaching_threshold():
    out = nexus.compute_nexus([{"state": "NC", "amount_usd": 85000}])
    nc = next(s for s in out["states"] if s["code"] == "NC")
    assert nc["status"] == "approaching"


# ---------------------------------------------------------------- aws csv

def test_aws_csv_parser():
    from ingest.aws_csv import parse_csv, CsvError
    good = ("date,service,usage_type,cost_usd\n"
            "2026-08-01,Amazon SageMaker,Training,120.50\n"
            "2026-08-02,Amazon S3,TimedStorage,10.00\n")
    events = parse_csv(good)
    assert len(events) == 2
    assert events[0]["payload"]["cost_usd"] == 120.5
    with pytest.raises(CsvError):
        parse_csv("date,service\n2026-01-01,x\n")          # missing column
    with pytest.raises(CsvError):
        parse_csv("date,service,cost_usd\n2026-01-01,x,abc\n")  # bad number
    with pytest.raises(CsvError):
        parse_csv("date,service,cost_usd\n")                # no rows


# ---------------------------------------------------------------- insurance

def test_insurance_binds_only_below_threshold():
    from ml import insurance
    low = insurance.quote(0.01, 10000)
    high = insurance.quote(0.20, 10000)
    assert low["binds"] is True and low["simulated"] is True
    assert high["binds"] is False
    assert "SIMULATED" in low["disclaimer"]


# ---------------------------------------------------------------- risk model

def test_risk_model_trains_and_scores():
    from ml import risk_model
    result = risk_model.train()
    assert os.path.exists(risk_model.MODEL_PATH)
    score = risk_model.score({"claim_size_pct": 0.3,
                              "documentation_completeness": 0.3,
                              "ledger_validity": 0.4})
    assert 0.0 <= score["audit_risk_probability"] <= 1.0
    assert "SYNTHETIC" in score["model"]
