"""SQLite storage layer: schema, migrations, hash-chain helpers, classification cache.

Keeps Gate 2 compatibility: the original `events` table keeps working; new
columns are added in place by migration so an existing taxshield.db survives.
"""
import os
import sqlite3
import json
from datetime import datetime, timezone

from security.crypto import GENESIS, chain_hash

DB_PATH = os.environ.get("TAXSHIELD_DB", "taxshield.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS events(
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE,
    source TEXT,
    timestamp TEXT,
    encrypted TEXT,
    qualified INTEGER,
    confidence REAL,
    reason TEXT,
    rule_cited TEXT,
    expense REAL,
    credit REAL,
    engine TEXT,
    prev_hash TEXT,
    hash TEXT
);
CREATE TABLE IF NOT EXISTS classification_cache(
    fingerprint TEXT PRIMARY KEY,
    result TEXT,
    created_at TEXT
);
"""

# Columns added after Gate 2 (present in old DBs but missing from new ones).
_MIGRATIONS = {
    "confidence": "REAL",
    "rule_cited": "TEXT",
    "expense": "REAL",
    "engine": "TEXT",
}


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db() -> None:
    con = connect()
    con.executescript(_SCHEMA)
    existing = {r["name"] for r in con.execute("PRAGMA table_info(events)")}
    for col, coltype in _MIGRATIONS.items():
        if col not in existing:
            con.execute(f"ALTER TABLE events ADD COLUMN {col} {coltype}")
    con.commit()
    con.close()


def last_hash(con: sqlite3.Connection) -> str:
    row = con.execute("SELECT hash FROM events ORDER BY seq DESC LIMIT 1").fetchone()
    return row["hash"] if row else GENESIS


def insert_event(con: sqlite3.Connection, event: dict, result: dict,
                 encrypted: str) -> dict:
    """Append one classified+encrypted event to the chain. Returns the stored row."""
    prev = last_hash(con)
    h = chain_hash(prev, encrypted)
    cur = con.execute(
        """INSERT INTO events(id, source, timestamp, encrypted, qualified,
               confidence, reason, rule_cited, expense, credit, engine,
               prev_hash, hash)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (event["id"], event["source"], event["timestamp"], encrypted,
         int(result["qualified"]), round(float(result.get("confidence", 0.0)), 3),
         result["reason"], result.get("rule_cited", ""),
         round(float(result.get("qualified_expense_usd", 0.0)), 2),
         round(float(result.get("estimated_credit", 0.0)), 2),
         result.get("engine", "unknown"), prev, h))
    con.commit()
    return {"seq": cur.lastrowid, "prev_hash": prev, "hash": h}


def fetch_events(con: sqlite3.Connection, source: str | None = None,
                 qualified: bool | None = None) -> list[dict]:
    sql = """SELECT seq, id, source, timestamp, encrypted, qualified, confidence,
                    reason, rule_cited, expense, credit, engine, hash, prev_hash
             FROM events"""
    clauses, params = [], []
    if source:
        clauses.append("source = ?")
        params.append(source)
    if qualified is not None:
        clauses.append("qualified = ?")
        params.append(int(qualified))
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY seq"
    return [dict(r) for r in con.execute(sql, params).fetchall()]


def verify_chain(con: sqlite3.Connection) -> dict:
    """Walk the whole chain. Returns validity plus the first broken record, if any."""
    rows = con.execute(
        "SELECT seq, encrypted, prev_hash, hash FROM events ORDER BY seq").fetchall()
    prev = GENESIS
    for r in rows:
        if r["prev_hash"] != prev:
            return {"valid": False, "events": len(rows),
                    "first_broken_seq": r["seq"],
                    "detail": "prev_hash link mismatch (ledger row reordered or replaced)"}
        if chain_hash(prev, r["encrypted"]) != r["hash"]:
            return {"valid": False, "events": len(rows),
                    "first_broken_seq": r["seq"],
                    "detail": "payload was modified after it was sealed "
                              "(recomputed hash does not match stored hash)"}
        prev = r["hash"]
    return {"valid": True, "events": len(rows), "first_broken_seq": None,
            "detail": "all records verify"}


def cache_get(con: sqlite3.Connection, fingerprint: str) -> dict | None:
    row = con.execute("SELECT result FROM classification_cache WHERE fingerprint = ?",
                      (fingerprint,)).fetchone()
    return json.loads(row["result"]) if row else None


def cache_put(con: sqlite3.Connection, fingerprint: str, result: dict) -> None:
    con.execute(
        "INSERT OR REPLACE INTO classification_cache(fingerprint, result, created_at)"
        " VALUES(?,?,?)",
        (fingerprint, json.dumps(result),
         datetime.now(timezone.utc).isoformat()))
    con.commit()
