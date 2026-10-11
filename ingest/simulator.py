"""Event simulator: the offline fallback for demos.

--source simulated (default): generates events locally, as in Gate 2.
--source live: pulls from the real connectors (GitHub, Stripe test mode, AWS
CSV) instead — requires the corresponding keys in .env.

Both modes POST through the authenticated API, so the demo exercises the same
JWT-protected path the dashboard uses.

Run:  python -m ingest.simulator [--count 30] [--source simulated|live]
"""
import argparse
import os
import random
import time
import uuid
import datetime as dt

import requests
from dotenv import load_dotenv

load_dotenv()

BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000")
STATES = ["CA", "TX", "NY", "FL", "WA", "IL", "MA", "CO", "GA", "NC"]

RD_COMMITS = [
    "prototype new fraud detection model",
    "experiment with sparse attention mechanism",
    "benchmark ML inference latency on GPU",
    "research new encryption approach for at-rest data",
    "prototype real-time feature store",
    "investigate quantization for edge inference",
]
OTHER_COMMITS = [
    "fix login typo", "update README", "bump dependency versions",
    "change button colour", "write unit tests for payment service",
    "rename variables for clarity",
]


def make_event() -> dict:
    kind = random.choice(["github", "aws", "stripe"])
    if kind == "github":
        is_rd = random.random() < 0.55
        payload = {"message": random.choice(RD_COMMITS if is_rd else OTHER_COMMITS),
                   "author": random.choice(["asha", "ravi", "mei"]),
                   "hours": round(random.uniform(0.5, 8), 1)}
    elif kind == "aws":
        rd_services = ["EC2 GPU training", "SageMaker experiment"]
        other_services = ["S3 storage", "CloudFront", "RDS database"]
        is_rd = random.random() < 0.5
        payload = {"service": random.choice(rd_services if is_rd else other_services),
                   "cost_usd": round(random.uniform(20, 2000), 2)}
    else:
        payload = {"state": random.choice(STATES),
                   "amount_usd": round(random.uniform(10, 5000), 2)}
    return {"id": str(uuid.uuid4()), "source": kind,
            "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
            "payload": payload}


def get_token() -> str:
    r = requests.post(f"{BASE}/auth/token", json={
        "username": os.environ.get("DEMO_USER", "demo@taxshield.local"),
        "password": os.environ.get("DEMO_PASSWORD", "demo1234")}, timeout=10)
    r.raise_for_status()
    return r.json()["access_token"]


def post_event(token: str, event: dict) -> None:
    requests.post(f"{BASE}/events", json=event,
                  headers={"Authorization": f"Bearer {token}"}, timeout=10)


def run_simulated(count: int) -> None:
    token = get_token()
    for _ in range(count):
        e = make_event()
        post_event(token, e)
        print("sent", e["source"], e["payload"])
        time.sleep(0.15)


def run_live() -> None:
    """Pull from real connectors via the API's ingest endpoints."""
    token = get_token()
    hdrs = {"Authorization": f"Bearer {token}"}
    for endpoint in ("/ingest/github", "/ingest/stripe"):
        try:
            r = requests.post(f"{BASE}{endpoint}?limit=15", headers=hdrs, timeout=30)
            print(endpoint, "->", r.status_code, r.json())
        except requests.RequestException as exc:
            print(endpoint, "failed:", exc)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="TaxShield event simulator")
    ap.add_argument("--count", type=int, default=30)
    ap.add_argument("--source", choices=["simulated", "live"],
                    default="simulated",
                    help="simulated = local generator; live = GitHub/Stripe APIs")
    args = ap.parse_args()
    random.seed(42)  # repeatable demo
    if args.source == "simulated":
        run_simulated(args.count)
    else:
        run_live()
