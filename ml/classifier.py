HOURLY_RATE = 75     # demo assumption: developer cost per hour
CREDIT_RATE = 0.14   # demo assumption: simplified Section 41 credit rate
RD_KEYWORDS = ["prototype", "experiment", "benchmark", "research",
               "model", "algorithm", "training", "gpu", "sagemaker"]

def classify(event: dict) -> dict:
    p, src = event["payload"], event["source"]
    if src == "github":
        text, expense = p["message"].lower(), p["hours"] * HOURLY_RATE
    elif src == "aws":
        text, expense = p["service"].lower(), p["cost_usd"]
    else:
        return {"qualified": False, "reason": "sales event (nexus: future work)",
                "estimated_credit": 0.0}
    hit = next((k for k in RD_KEYWORDS if k in text), None)
    if hit:
        return {"qualified": True, "reason": f"matched '{hit}'",
                "estimated_credit": round(expense * CREDIT_RATE, 2)}
    return {"qualified": False, "reason": "routine work", "estimated_credit": 0.0}