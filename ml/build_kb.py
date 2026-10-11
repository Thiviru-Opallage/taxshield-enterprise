"""Build the Section 41 knowledge base from official IRS sources.

Sources (official, free, public-domain US government works):
  1. Instructions for Form 6765 (Credit for Increasing Research Activities) — PDF
  2. IRS Audit Technique Guide for IRC Section 41 — selected HTML sections
  3. IRS audit guidelines on the process of experimentation for software — HTML

The text is split into paragraph chunks (30-60+ per document set) with source
attribution and written to data/kb_chunks.json, which ml/rag.py indexes.

Run once:  python -m ml.build_kb
(The PDF is cached on disk afterwards; chunks.json is committed to the repo so
a clean clone needs no network for retrieval.)
"""
import json
import os
import re

import httpx
from pypdf import PdfReader

PDF_SOURCES = {
    "IRS Instructions for Form 6765 (Credit for Increasing Research Activities)":
        "https://www.irs.gov/pub/irs-pdf/i6765.pdf",
}

HTML_SOURCES = {
    "IRS Section 41 Audit Technique Guide - Qualified Research Activities":
        "https://www.irs.gov/businesses/audit-techniques-guide-credit-for-increasing-research-activities-ie-research-tax-credit-irc-ss-41-qualified-research-activities",
    "IRS Section 41 Audit Technique Guide - Qualified Research Expenses":
        "https://www.irs.gov/businesses/audit-techniques-guide-credit-for-increasing-research-activities-ie-research-tax-credit-irc-ss-41-qualified-research-expenses",
    "IRS Section 41 Audit Technique Guide - Substantiation and Recordkeeping":
        "https://www.irs.gov/businesses/audit-techniques-guide-credit-for-increasing-research-activities-ie-research-tax-credit-irc-ss-41-substantiation-and-recordkeeping",
    "IRS Section 41 Audit Technique Guide - Introduction":
        "https://www.irs.gov/businesses/audit-techniques-guide-credit-for-increasing-research-activities-ie-research-tax-credit-irc-ss41-introduction",
    "IRS Audit Guidelines - Process of Experimentation for Software":
        "https://www.irs.gov/businesses/audit-guidelines-on-the-application-of-the-process-of-experimentation-for-all-software",
}

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUT_PATH = os.path.join(DATA_DIR, "kb_chunks.json")
CACHE_DIR = os.path.join(DATA_DIR, "kb_pdfs")

MIN_CHUNK = 120
MAX_CHUNK = 900


def _get(url: str, dest: str | None = None) -> bytes:
    if dest and os.path.exists(dest) and os.path.getsize(dest) > 10_000:
        with open(dest, "rb") as f:
            return f.read()
    r = httpx.get(url, follow_redirects=True, timeout=60,
                  headers={"User-Agent": "TaxShield-Student-Project/1.0"})
    r.raise_for_status()
    if dest:
        with open(dest, "wb") as f:
            f.write(r.content)
    return r.content


def _pdf_text(data: bytes) -> str:
    import io
    reader = PdfReader(io.BytesIO(data))
    return "\n\n".join(f"[page {i + 1}] {p.extract_text() or ''}"
                       for i, p in enumerate(reader.pages))


def _html_text(data: bytes) -> str:
    """Strip an irs.gov page down to its article body."""
    html = data.decode("utf-8", errors="ignore")
    # Isolate the main content if present, then strip tags.
    m = re.search(r"<main[^>]*>(.*?)</main>", html, re.DOTALL | re.IGNORECASE)
    body = m.group(1) if m else html
    body = re.sub(r"<(script|style|nav|header|footer)[^>]*>.*?</\1>", " ",
                  body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r"<br\s*/?>|</p>|</li>|</h[1-6]>|</div>", "\n\n", body,
                  flags=re.IGNORECASE)
    body = re.sub(r"<[^>]+>", " ", body)
    body = (body.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&quot;", '"').replace("&#39;", "'")
                .replace("&sect;", "Section").replace("&rsquo;", "'")
                .replace("&ldquo;", '"').replace("&rdquo;", '"'))
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in body.split("\n")]
    return "\n\n".join(ln for ln in lines if len(ln) > 40)


def _chunk(text: str) -> list[str]:
    paras = [re.sub(r"\s+", " ", p).strip()
             for p in re.split(r"\n\s*\n", text)]
    chunks, buf = [], ""
    for p in paras:
        if len(p) < 40 or p.startswith("[page ") and len(p) < 60:
            # keep page markers attached to following text instead of alone
            if len(p) < 40:
                continue
        if len(buf) + len(p) < MAX_CHUNK:
            buf = (buf + "\n\n" + p).strip()
        else:
            if len(buf) >= MIN_CHUNK:
                chunks.append(buf)
            buf = p
    if len(buf) >= MIN_CHUNK:
        chunks.append(buf)
    final = []
    for c in chunks:
        if len(c) <= MAX_CHUNK:
            final.append(c)
            continue
        sents = re.split(r"(?<=[.;]) ", c)
        cur = ""
        for s in sents:
            if len(cur) + len(s) > MAX_CHUNK and cur:
                final.append(cur.strip())
                cur = s
            else:
                cur = (cur + " " + s).strip()
        if cur:
            final.append(cur.strip())
    return final


def build() -> list[dict]:
    os.makedirs(CACHE_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    chunks = []

    for source_name, url in PDF_SOURCES.items():
        pdf_path = os.path.join(CACHE_DIR,
                                re.sub(r"[^A-Za-z0-9]+", "_", source_name)[:60] + ".pdf")
        print(f"fetching PDF: {url}")
        text = _pdf_text(_get(url, pdf_path))
        for c in _chunk(text):
            chunks.append({"id": f"{len(chunks):03d}", "source": source_name,
                           "source_url": url, "text": c})

    for source_name, url in HTML_SOURCES.items():
        print(f"fetching HTML: {url}")
        try:
            text = _html_text(_get(url))
        except httpx.HTTPError as exc:
            print(f"  SKIPPED ({exc}) — continuing with other sources")
            continue
        for c in _chunk(text):
            chunks.append({"id": f"{len(chunks):03d}", "source": source_name,
                           "source_url": url, "text": c})

    if len(chunks) < 15:
        raise SystemExit(f"only {len(chunks)} chunks built — IRS fetch failed, "
                         "check network or URLs")

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=1, ensure_ascii=False)
    print(f"wrote {len(chunks)} chunks -> {OUT_PATH}")
    return chunks


if __name__ == "__main__":
    build()
