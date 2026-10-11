"""The R&D classifier: retrieval + LLM + safe parsing + keyword fallback + cache.

Flow for each event:
  1. Check the SQLite classification cache (repeat demos never call the API twice).
  2. Retrieve the 3-4 most relevant IRS Section 41 rule chunks (TF-IDF).
  3. Ask the LLM to judge the event against those rules, JSON only.
  4. Parse safely; on ANY failure fall back to the keyword rules.
  5. Compute the credit from qualified expense using the stated simplified rate.

Every result carries an `engine` field so the dashboard and README can be honest
about which engine produced a number.
"""
import hashlib
import json

from ml import classifier as fallback
from ml import llm as llm_client
from ml import rag

CREDIT_RATE = fallback.CREDIT_RATE  # 0.14 simplified rate, stated in the dashboard

PROMPT_TEMPLATE = """You are an R&D tax credit analyst applying IRS Section 41 \
to a software company's operational event.

EVENT:
- source: {source}
- details: {details}

RELEVANT IRS SECTION 41 RULES (quoted from official IRS guidance):
{rules}

Answer with ONE JSON object and nothing else, using exactly this schema:
{{"qualified": true|false, "confidence": 0.0-1.0, "reason": "one sentence",
  "rule_cited": "short quote or paraphrase of the governing rule",
  "qualified_expense_usd": number}}

Rules for your judgment:
- Qualified research must eliminate technological uncertainty, rely on hard \
sciences/technology, and be systematic/experimental (the four-part test).
- Routine bug fixes, cosmetic changes, data collection, and maintenance are NOT \
qualified.
- qualified_expense_usd is the portion of the event's cost that is a qualified \
research expense (0 if not qualified).
- If the event is a sales/payment event, it is never an R&D expense."""


def _fingerprint(event: dict) -> str:
    blob = json.dumps({"src": event["source"], "p": event["payload"]},
                      sort_keys=True)
    return hashlib.sha256(blob.encode()).hexdigest()


def _expense_of(event: dict) -> float:
    p = event["payload"]
    if event["source"] == "github":
        return round(p["hours"] * fallback.HOURLY_RATE, 2)
    if event["source"] == "aws":
        return round(p["cost_usd"], 2)
    return 0.0


def classify_event(event: dict, con) -> dict:
    """Classify one event with caching. `con` is a DB connection (for the cache)."""
    from ingest import db as dbmod  # avoid import cycle at module load

    fp = _fingerprint(event)
    cached = dbmod.cache_get(con, fp)
    if cached:
        cached["cached"] = True
        return cached

    result = _classify_uncached(event)
    dbmod.cache_put(con, fp, result)
    return result


def _classify_uncached(event: dict) -> dict:
    # Sales events never need an LLM call: they are not R&D expenses.
    if event["source"] == "stripe":
        return {"qualified": False, "confidence": 1.0,
                "reason": "sales event — not an R&D expense (used for nexus instead)",
                "rule_cited": "IRC section 41 applies to research expenditures, not sales",
                "qualified_expense_usd": 0.0, "estimated_credit": 0.0,
                "engine": "rule", "cached": False}

    expense = _expense_of(event)
    chunks = rag.retrieve(_query_text(event), k=4)

    prompt = PROMPT_TEMPLATE.format(
        source=event["source"],
        details=json.dumps(event["payload"], ensure_ascii=False),
        rules="\n\n".join(f"[{c['source']}]: {c['text'][:600]}"
                          for c in chunks) or "(no rules retrieved)")

    parsed = llm_client.parse_llm_json(llm_client.call_llm(prompt))
    if parsed is not None:
        # Never let the LLM claim more expense than the event actually carries.
        q_exp = min(parsed["qualified_expense_usd"], expense) if parsed["qualified"] else 0.0
        return {"qualified": parsed["qualified"],
                "confidence": parsed["confidence"],
                "reason": parsed["reason"],
                "rule_cited": parsed["rule_cited"],
                "qualified_expense_usd": round(q_exp, 2),
                "estimated_credit": round(q_exp * CREDIT_RATE, 2),
                "engine": "llm-rag", "cached": False}

    # Fallback path: keyword rules + the retrieved rule text as citation context.
    fb = fallback.classify(event)
    if fb["qualified"] and chunks:
        fb["rule_cited"] = (fb["rule_cited"] + " | retrieved: "
                            + chunks[0]["source"])
    fb["cached"] = False
    return fb


def _query_text(event: dict) -> str:
    p = event["payload"]
    if event["source"] == "github":
        return f"software development commit: {p['message']}"
    if event["source"] == "aws":
        return f"cloud computing cost: {p.get('service', '')} {p.get('usage_type', '')}"
    return "sales payment"
