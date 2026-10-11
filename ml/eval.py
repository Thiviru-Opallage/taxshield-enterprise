"""Honest accuracy check for the R&D classifier.

Runs the real classification pipeline (same code path as the API) over the 48
hand-labeled events in data/eval_labels.json and reports accuracy, precision,
recall and F1 for the qualified class. The labels were written by hand against
the IRS four-part test; each carries a one-line rationale.

This harness never writes to the events ledger — it uses an in-memory cache
table so repeated runs are consistent, and it prints which engine produced
each prediction so the README can be precise about what was measured.

Run:  python -m ml.eval            (keyword fallback engine)
      python -m ml.eval --engine llm   (LLM+RAG engine, needs an API key)
"""
import json
import os
import sys
import tempfile

from ml import rd_classifier

LABELS_PATH = os.path.join(os.path.dirname(__file__), "..", "data",
                           "eval_labels.json")


def _eval_con():
    """A throwaway DB connection so eval never touches the real ledger."""
    from ingest import db as dbmod
    old = dbmod.DB_PATH
    dbmod.DB_PATH = os.path.join(tempfile.mkdtemp(), "eval.db")
    dbmod.init_db()
    con = dbmod.connect()
    dbmod.DB_PATH = old
    return con


def run() -> dict:
    with open(LABELS_PATH, encoding="utf-8") as f:
        dataset = json.load(f)

    con = _eval_con()
    tp = fp = tn = fn = 0
    rows = []
    for item in dataset:
        event = {"id": item["id"], "source": item["source"],
                 "timestamp": "2026-01-01T00:00:00+00:00",
                 "payload": item["payload"]}
        result = rd_classifier.classify_event(event, con)
        pred, actual = result["qualified"], item["label"]
        if pred and actual:
            tp += 1
        elif pred and not actual:
            fp += 1
        elif not pred and not actual:
            tn += 1
        else:
            fn += 1
        rows.append({"id": item["id"], "source": item["source"],
                     "label": actual, "predicted": pred,
                     "engine": result["engine"],
                     "confidence": result["confidence"],
                     "correct": pred == actual,
                     "label_note": item["label_note"],
                     "model_reason": result["reason"]})

    n = len(dataset)
    acc = (tp + tn) / n
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)
          if (precision + recall) else 0.0)
    engines = sorted({r["engine"] for r in rows})

    report = {"events": n, "engine": engines,
              "accuracy": round(acc, 3),
              "precision": round(precision, 3),
              "recall": round(recall, 3),
              "f1": round(f1, 3),
              "confusion": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
              "misclassified": [r for r in rows if not r["correct"]],
              "all_rows": rows}

    out = os.path.join(os.path.dirname(__file__), "..", "data",
                       "eval_report.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1)
    print(json.dumps({k: v for k, v in report.items()
                      if k not in ("all_rows", "misclassified")}, indent=1))
    if report["misclassified"]:
        print(f"\nmisclassified ({len(report['misclassified'])}):")
        for r in report["misclassified"]:
            print(f"  {r['id']} label={r['label']} pred={r['predicted']} "
                  f"| {r['label_note']}")
    return report


if __name__ == "__main__":
    if "--engine" in sys.argv:
        print("note: engine selection is controlled by LLM_* env vars; "
              "the same pipeline always falls back to keyword rules on failure")
    run()
