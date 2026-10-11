"""Simplified multi-state economic nexus calculator.

Sums Stripe sales events per state and compares against each state's economic
nexus threshold (researched from official state revenue sites — see
data/nexus_states.json for sources and verification status).

KNOWN SIMPLIFICATIONS (stated in the dashboard and README):
  - ignores product taxability and exemptions
  - ignores local/city rates (state rate only)
  - ignores marketplace-facilitator collection duties
  - ignores physical-presence nexus (offices, employees, inventory)
  - "exposure" = total sales in a triggered state x state rate, which assumes
    NO tax was collected — an upper bound, not a filing recommendation
"""
import json
import os

STATES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "nexus_states.json")

APPROACHING_PCT = 0.8


def load_states() -> dict:
    with open(STATES_PATH, encoding="utf-8") as f:
        return json.load(f)


def compute_nexus(sales_events: list[dict]) -> dict:
    """sales_events: [{"state": "CA", "amount_usd": 1234.5}, ...]"""
    cfg = load_states()
    by_state: dict[str, dict] = {}
    for e in sales_events:
        st = (e.get("state") or "").upper()
        if len(st) != 2:
            continue
        bucket = by_state.setdefault(st, {"sales_usd": 0.0, "transactions": 0})
        bucket["sales_usd"] += float(e.get("amount_usd") or 0)
        bucket["transactions"] += 1

    results = []
    for s in cfg["states"]:
        agg = by_state.get(s["code"], {"sales_usd": 0.0, "transactions": 0})
        sales, txn = agg["sales_usd"], agg["transactions"]

        dollar_hit = s["threshold_dollars"] is not None and sales >= s["threshold_dollars"]
        txn_hit = (s["threshold_transactions"] is not None
                   and txn >= s["threshold_transactions"])
        triggered = dollar_hit or txn_hit

        if triggered:
            status = "triggered"
        elif sales >= s["threshold_dollars"] * APPROACHING_PCT:
            status = "approaching"
        else:
            status = "clear"

        pct = round(sales / s["threshold_dollars"], 3) if s["threshold_dollars"] else 0.0
        results.append({
            "code": s["code"], "name": s["name"], "status": status,
            "sales_usd": round(sales, 2), "transactions": txn,
            "threshold_dollars": s["threshold_dollars"],
            "threshold_transactions": s["threshold_transactions"],
            "lookback": s["lookback"],
            "pct_of_threshold": pct,
            "state_rate": s["state_rate"], "rate_note": s["rate_note"],
            "estimated_exposure_usd": round(sales * s["state_rate"], 2)
            if triggered else 0.0,
            "verified": s["verified"],
            "unverified_note": s.get("unverified_note"),
            "source_urls": s["source_urls"],
        })

    triggered = [r for r in results if r["status"] == "triggered"]
    return {
        "states": results,
        "total_sales_usd": round(sum(r["sales_usd"] for r in results), 2),
        "total_transactions": sum(r["transactions"] for r in results),
        "triggered_states": [r["code"] for r in triggered],
        "total_exposure_usd": round(sum(r["estimated_exposure_usd"] for r in results), 2),
        "simplifications": [
            "ignores product taxability and exemptions",
            "ignores local/city rates (state rate only)",
            "ignores marketplace-facilitator collection",
            "ignores physical-presence nexus",
            "exposure assumes zero tax collected (upper bound)",
        ],
    }
