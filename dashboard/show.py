import requests

BASE = "http://127.0.0.1:8000"
rows = requests.get(f"{BASE}/events").json()
print(f"{'#':<4}{'source':<8}{'R&D?':<6}{'credit $':>10}  {'encrypted payload':<24}{'hash'}")
for r in rows:
    print(f"{r['seq']:<4}{r['source']:<8}{'YES' if r['qualified'] else 'no':<6}"
          f"{r['credit']:>10.2f}  {r['encrypted'][:20] + '..':<24}{r['hash'][:12]}")
print()
print(requests.get(f"{BASE}/summary").json())