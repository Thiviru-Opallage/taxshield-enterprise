"""Tamper-detection demo: edit one sealed row, watch the chain catch it.

This is the 20-second video moment: the ledger says VALID, we quietly modify a
stored payload, re-verify, and the API points at the exact record that broke.

Usage:
    python -m security.tamper_demo           # tamper, verify, report
    python -m security.tamper_demo --restore # re-run to heal via seed script

Works directly on the SQLite file (no API needed), so it demonstrates that the
tamper evidence lives in the DATA, not in the application's good graces.
"""
import argparse
import sqlite3
import sys

from security.crypto import chain_hash

DB = "taxshield.db"


def tamper(seq: int | None = None) -> int:
    """Modify one event's encrypted payload in place. Returns the seq hit."""
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    row = con.execute(
        "SELECT seq, encrypted FROM events ORDER BY seq LIMIT 1 OFFSET ?",
        (seq - 1,) if seq else (1,)).fetchone()
    if not row:
        print("no events to tamper with — run the seed script first")
        sys.exit(1)
    # Flip one base64 character: the ciphertext changes, the stored hash doesn't.
    enc = row["encrypted"]
    tampered = ("A" if enc[5] != "A" else "B") + enc[1:]
    con.execute("UPDATE events SET encrypted = ? WHERE seq = ?",
                (tampered, row["seq"]))
    con.commit()
    con.close()
    print(f"TAMPERED: event seq={row['seq']} encrypted payload was modified in "
          f"the database (hash column left untouched, as an attacker would)")
    return row["seq"]


def verify_report() -> None:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT seq, encrypted, prev_hash, hash FROM events "
                       "ORDER BY seq").fetchall()
    con.close()
    from security.crypto import GENESIS
    prev = GENESIS
    for r in rows:
        if r["prev_hash"] != prev or chain_hash(prev, r["encrypted"]) != r["hash"]:
            print(f"CHAIN STATUS: BROKEN — first broken record is seq={r['seq']}")
            print("  detail: stored hash no longer matches the payload; every "
                  "later record inherits the break via prev_hash")
            return
        prev = r["hash"]
    print("CHAIN STATUS: VALID — all records verify")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seq", type=int, default=None,
                    help="specific event seq to tamper (default: 2nd event)")
    ap.add_argument("--restore", action="store_true",
                    help="print restore instructions instead of tampering")
    args = ap.parse_args()
    if args.restore:
        print("The tamper is permanent by design (audit trail!). "
              "Restore with: python scripts/seed.py --reset")
    else:
        tamper(args.seq)
        verify_report()
