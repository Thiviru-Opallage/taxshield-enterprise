"""Rule-based fallback classifier (Gate 2 logic, extended output shape).

This is what runs when no LLM key is configured or an LLM call fails.
It is intentionally simple and explainable — it is the safety net, not the brain.
"""
HOURLY_RATE = 75     # demo assumption: developer cost per hour
CREDIT_RATE = 0.14   # demo assumption: simplified Section 41 credit rate

RD_KEYWORDS = {
    "prototype": 0.9, "experiment": 0.9, "benchmark": 0.85, "research": 0.85,
    "model": 0.7, "algorithm": 0.8, "training": 0.75, "gpu": 0.65,
    "sagemaker": 0.65, "latency": 0.6, "encryption": 0.7, "inference": 0.7,
}
WEAK_KEYWORDS = {"refactor": 0.4, "optimize": 0.45, "poc": 0.6}


def classify(event: dict) -> dict:
    """Return {qualified, confidence, reason, rule_cited,
    qualified_expense_usd, estimated_credit, engine}."""
    p, src = event["payload"], event["source"]

    if src == "github":
        text = p["message"].lower()
        expense = round(p["hours"] * HOURLY_RATE, 2)
    elif src == "aws":
        text = (str(p.get("service", "")).lower() + " "
                + str(p.get("usage_type", "")).lower())
        expense = p["cost_usd"]
    else:
        # Sales events never qualify for R&D credit; they feed the nexus engine.
        return {"qualified": False, "confidence": 1.0,
                "reason": "sales event — not an R&D expense (used for nexus instead)",
                "rule_cited": "IRC section 41 applies to research expenditures, not sales",
                "qualified_expense_usd": 0.0, "estimated_credit": 0.0,
                "engine": "keyword-rules"}

    for kw, conf in RD_KEYWORDS.items():
        if kw in text:
            q = round(expense * CREDIT_RATE, 2)
            return {"qualified": True, "confidence": conf,
                    "reason": f"keyword '{kw}' suggests eligible R&D activity",
                    "rule_cited": "IRC section 41(b): qualified research expenses",
                    "qualified_expense_usd": expense, "estimated_credit": q,
                    "engine": "keyword-rules"}
    for kw, conf in WEAK_KEYWORDS.items():
        if kw in text:
            return {"qualified": False, "confidence": conf,
                    "reason": f"weak signal '{kw}' — possible R&D, needs review",
                    "rule_cited": "IRC section 41(d): four-part test not clearly met",
                    "qualified_expense_usd": 0.0, "estimated_credit": 0.0,
                    "engine": "keyword-rules"}
    return {"qualified": False, "confidence": 0.8,
            "reason": "no R&D signal found in event text",
            "rule_cited": "IRC section 41(d): routine data collection excluded",
            "qualified_expense_usd": 0.0, "estimated_credit": 0.0,
            "engine": "keyword-rules"}
