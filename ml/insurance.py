"""Parametric insurance simulation. SIMULATED — no underwriter, no coverage.

If the audit-risk probability is below the binding threshold, the module
issues a simulated binder with a policy ID and a premium computed from a
transparent formula. Every output is tagged simulated=true so the dashboard
cannot show it as real.
"""
import hashlib
from datetime import date

BIND_THRESHOLD = 0.05   # binding rule from the Gate 1 plan
BASE_PREMIUM = 4800.0   # fixed platform fee component


def quote(risk_probability: float, claim_amount_usd: float) -> dict:
    """Return a simulated quote/binder decision.

    Premium formula (stated openly):
      premium = BASE_PREMIUM + claim * (0.06 + 2.5 * risk_probability)
    """
    premium = BASE_PREMIUM + claim_amount_usd * (0.06 + 2.5 * risk_probability)
    binds = risk_probability < BIND_THRESHOLD
    seed = f"{risk_probability:.4f}|{claim_amount_usd:.2f}|{date.today().isoformat()}"
    policy_id = "SIM-" + hashlib.sha256(seed.encode()).hexdigest()[:10].upper()
    return {
        "simulated": True,
        "disclaimer": "SIMULATED binder — no underwriter, no real coverage, "
                      "demonstration only",
        "binds": binds,
        "policy_id": policy_id if binds else None,
        "premium_usd": round(premium, 2) if binds else None,
        "bind_threshold": BIND_THRESHOLD,
        "audit_risk_probability": risk_probability,
        "premium_formula": "4800 + claim * (0.06 + 2.5 * risk_probability)",
        "claim_amount_usd": round(claim_amount_usd, 2),
        "status": ("binder issued (simulated)" if binds
                   else "declined — audit risk at or above "
                        f"{BIND_THRESHOLD:.0%} bind threshold"),
    }
