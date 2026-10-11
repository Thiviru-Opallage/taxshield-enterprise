"""Seed script: reset the database and load a fixed demo dataset.

Produces a repeatable demo: the same 60 events every run (simulated seed 42),
including enough CA/WA sales to trigger nexus, plus GitHub and AWS activity
that exercises both the qualified and not-qualified classifier paths.

Usage:
    python scripts/seed.py            # load demo data (keeps existing events)
    python scripts/seed.py --reset    # wipe events first, then load
"""
import argparse
import os
import random
import sys
import uuid
import datetime as dt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ingest import db as dbmod                     # noqa: E402
from ingest.simulator import make_event            # noqa: E402
from ml import rd_classifier                       # noqa: E402
from security.crypto import encrypt                # noqa: E402

# Deterministic dataset: seed 42 + fixed timestamps makes every demo identical.
N_EVENTS = 60

# Nexus-triggering sales: CA needs >$500k to trigger; we seed $520k in 4 sales
# so the nexus screen has a "triggered" state out of the box.
BIG_SALES = [
    ("CA", 180000.00), ("CA", 150000.00), ("CA", 120000.00), ("CA", 70000.00),
    ("WA", 42000.00), ("WA", 38000.00),          # WA: $80k of $100k -> approaching
    ("NY", 210000.00), ("TX", 95000.00), ("IL", 31000.00),
]


def seed(reset: bool = False) -> int:
    dbmod.init_db()
    con = dbmod.connect()
    if reset:
        con.execute("DELETE FROM events")
        con.execute("DELETE FROM classification_cache")
        con.commit()
        print("database events cleared")

    random.seed(42)
    base = dt.datetime(2026, 10, 1, 9, 0, tzinfo=dt.timezone.utc)
    count = 0

    # 1. Big sales first, so the chain starts with a clear story.
    for i, (state, amount) in enumerate(BIG_SALES):
        ev = {"id": str(uuid.UUID(int=i + 1)), "source": "stripe",
              "timestamp": (base + dt.timedelta(hours=i)).isoformat(),
              "payload": {"state": state, "amount_usd": amount,
                          "payment_id": f"cs_test_seed{i:02d}",
                          "status": "succeeded"}}
        _store(con, ev)
        count += 1

    # 2. The usual simulated mix (github/aws/stripe), deterministic.
    for i in range(N_EVENTS - len(BIG_SALES)):
        ev = make_event()
        ts = base + dt.timedelta(hours=len(BIG_SALES) + i)
        ev["timestamp"] = ts.isoformat()
        _store(con, ev)
        count += 1

    con.close()
    print(f"seeded {count} events; run with --reset next time to reload clean")
    return count


def _store(con, ev: dict) -> None:
    result = rd_classifier.classify_event(ev, con)
    dbmod.insert_event(con, ev, result, encrypt(ev["payload"]))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", action="store_true",
                    help="delete existing events before seeding")
    args = ap.parse_args()
    seed(reset=args.reset)
