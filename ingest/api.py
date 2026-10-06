import sqlite3
from fastapi import FastAPI
from ml.classifier import classify
from security.crypto import encrypt, chain_hash, GENESIS

app = FastAPI()
DB = "taxshield.db"

def db():
    con = sqlite3.connect(DB)
    con.execute("""CREATE TABLE IF NOT EXISTS events(
        seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT, source TEXT,
        timestamp TEXT, encrypted TEXT, qualified INTEGER, reason TEXT,
        credit REAL, prev_hash TEXT, hash TEXT)""")
    return con

@app.post("/events")
def ingest(event: dict):
    con = db()
    last = con.execute("SELECT hash FROM events ORDER BY seq DESC LIMIT 1").fetchone()
    prev = last[0] if last else GENESIS
    result = classify(event)
    enc = encrypt(event["payload"])
    h = chain_hash(prev, enc)
    con.execute("""INSERT INTO events(id,source,timestamp,encrypted,qualified,
                   reason,credit,prev_hash,hash) VALUES(?,?,?,?,?,?,?,?,?)""",
                (event["id"], event["source"], event["timestamp"], enc,
                 int(result["qualified"]), result["reason"],
                 result["estimated_credit"], prev, h))
    con.commit(); con.close()
    return {"stored": True}

@app.get("/events")
def list_events():
    con = db(); con.row_factory = sqlite3.Row
    rows = con.execute("""SELECT seq,source,qualified,credit,reason,encrypted,hash
                          FROM events ORDER BY seq""").fetchall()
    con.close()
    return [dict(r) for r in rows]

@app.get("/summary")
def summary():
    con = db()
    rows = con.execute("""SELECT encrypted,prev_hash,hash,qualified,credit
                          FROM events ORDER BY seq""").fetchall()
    con.close()
    prev, ok = GENESIS, True
    for enc, p, h, _, _ in rows:
        if p != prev or chain_hash(prev, enc) != h:
            ok = False
            break
        prev = h
    return {"events": len(rows), "qualified_events": sum(r[3] for r in rows),
            "total_estimated_credit": round(sum(r[4] for r in rows), 2),
            "hash_chain_valid": ok}