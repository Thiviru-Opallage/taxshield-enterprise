import random, time, uuid, datetime as dt
import requests

URL = "http://127.0.0.1:8000/events"
STATES = ["CA", "TX", "NY", "FL", "WA", "IL"]
RD_COMMITS = ["prototype new fraud model", "experiment with caching algorithm",
              "benchmark ML inference latency", "research new encryption approach"]
OTHER_COMMITS = ["fix login typo", "update README", "bump dependency versions",
                 "change button colour"]

def make_event():
    kind = random.choice(["github", "aws", "stripe"])
    if kind == "github":
        payload = {"message": random.choice(RD_COMMITS + OTHER_COMMITS),
                   "author": random.choice(["asha", "ravi", "mei"]),
                   "hours": round(random.uniform(0.5, 8), 1)}
    elif kind == "aws":
        payload = {"service": random.choice(["EC2 GPU training", "SageMaker experiment",
                                             "S3 storage", "CloudFront"]),
                   "cost_usd": round(random.uniform(20, 2000), 2)}
    else:
        payload = {"state": random.choice(STATES),
                   "amount_usd": round(random.uniform(10, 5000), 2)}
    return {"id": str(uuid.uuid4()), "source": kind,
            "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
            "payload": payload}

if __name__ == "__main__":
    random.seed(42)  # same events every run, so your demo is repeatable
    for _ in range(30):
        e = make_event()
        requests.post(URL, json=e)
        print("sent", e["source"], e["payload"])
        time.sleep(0.3)