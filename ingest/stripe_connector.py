"""Stripe connector: map TEST-MODE payments to TaxShield sales events.

Uses the Stripe REST API directly with a test secret key (sk_test_...) from
.env as STRIPE_TEST_KEY. Test mode is free and touches no real money.
Payments carry the customer's billing state in metadata["state"] (two-letter
code) — set that when creating test payments, e.g. via the Stripe CLI or
dashboard "Create test payment" with metadata state=CA.
"""
import os
import uuid

import httpx
from dotenv import load_dotenv

load_dotenv()

API = "https://api.stripe.com/v1"


class ConnectorError(Exception):
    pass


def fetch_events(limit: int = 20) -> list[dict]:
    """Fetch recent successful test-mode payments as TaxShield sales events."""
    key = os.environ.get("STRIPE_TEST_KEY", "").strip()
    if not key:
        raise ConnectorError("set STRIPE_TEST_KEY (sk_test_...) in .env")
    if not key.startswith("sk_test_"):
        raise ConnectorError("STRIPE_TEST_KEY must be a TEST key (sk_test_...); "
                             "live keys are refused on purpose")

    try:
        r = httpx.get(f"{API}/charges", timeout=20,
                      auth=(key, ""),
                      params={"limit": min(limit, 50), "paid": "true"})
    except httpx.HTTPError as exc:
        raise ConnectorError(f"network error: {exc}")
    if r.status_code != 200:
        raise ConnectorError(f"Stripe API returned {r.status_code}: "
                             f"{r.json().get('error', {}).get('message', '')}")

    events = []
    for ch in r.json().get("data", []):
        meta = ch.get("metadata", {})
        billing = ch.get("billing_details", {}) or {}
        address = billing.get("address", {}) or {}
        state = (meta.get("state") or address.get("state") or "").upper()[:2]
        if not state:
            state = "XX"  # unknown — nexus engine ignores non-state codes
        events.append({
            "id": ch.get("id", str(uuid.uuid4())),
            "source": "stripe",
            "timestamp": __import__("datetime").datetime.fromtimestamp(
                ch["created"], __import__("datetime").timezone.utc
            ).isoformat(),
            "payload": {
                "state": state,
                "amount_usd": round((ch.get("amount") or 0) / 100.0, 2),
                "payment_id": ch.get("id"),
                "status": "succeeded" if ch.get("paid") else "unpaid",
            },
        })
    return events
