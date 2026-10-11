"""Section 41 knowledge base: chunking + TF-IDF retrieval over official IRS text.

Why TF-IDF instead of a hosted embeddings API: the whole project must run on a
student laptop with zero running costs, and the corpus is only ~50 chunks.
TF-IDF + cosine similarity is deterministic, offline, free, and measurably
returns the right rules for R&D queries (see ml/eval.py retrieval tests).
`sentence-transformers` can be dropped in later — it is on the roadmap.

Chunks are built by ml/build_kb.py from IRS PDFs (Form 6765 instructions and
the Section 41 Audit Technique Guide) and cached in data/kb_chunks.json.
"""
import json
import math
import os
import re
from collections import Counter

KB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "kb_chunks.json")


def load_chunks() -> list[dict]:
    with open(KB_PATH, encoding="utf-8") as f:
        return json.load(f)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9§]+", text.lower())


class KbIndex:
    """Tiny in-memory TF-IDF index (no server, no API, ~50 documents)."""

    def __init__(self, chunks: list[dict]):
        self.chunks = chunks
        docs = [c["text"] for c in chunks]
        self.tfs = [Counter(_tokenize(d)) for d in docs]
        df = Counter()
        for tf in self.tfs:
            df.update(tf.keys())
        n = len(docs)
        self.idf = {w: math.log((n + 1) / (c + 1)) + 1 for w, c in df.items()}
        self.vecs = [self._vec(tf) for tf in self.tfs]

    def _vec(self, tf: Counter) -> dict:
        total = sum(tf.values()) or 1
        return {w: (c / total) * self.idf.get(w, 0.0) for w, c in tf.items()}

    @staticmethod
    def _cosine(a: dict, b: dict) -> float:
        if len(b) < len(a):
            a, b = b, a
        dot = sum(v * b.get(k, 0.0) for k, v in a.items())
        na = math.sqrt(sum(v * v for v in a.values()))
        nb = math.sqrt(sum(v * v for v in b.values()))
        if na == 0 or nb == 0:
            return 0.0
        return dot / (na * nb)

    def search(self, query: str, k: int = 4) -> list[dict]:
        qvec = self._vec(Counter(_tokenize(query)))
        scored = [(self._cosine(qvec, v), i) for i, v in enumerate(self.vecs)]
        scored.sort(reverse=True)
        out = []
        for score, i in scored[:k]:
            if score <= 0:
                break
            c = dict(self.chunks[i])
            c["score"] = round(score, 4)
            out.append(c)
        return out


_index: KbIndex | None = None


def get_index() -> KbIndex:
    global _index
    if _index is None:
        _index = KbIndex(load_chunks())
    return _index


def retrieve(query: str, k: int = 4) -> list[dict]:
    return get_index().search(query, k)
