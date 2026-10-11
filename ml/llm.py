"""Multi-provider LLM client with graceful absence.

Every provider has a free tier (or runs locally via Ollama). If no key is
configured, call_llm() returns None and the caller falls back to keyword rules.
Network failures and malformed responses also return None — the demo never dies
because an API is down.
"""
import json
import os
import re

import httpx
from dotenv import load_dotenv

load_dotenv()

TIMEOUT = httpx.Timeout(20.0, connect=5.0)


def _configured_provider() -> str | None:
    pref = os.environ.get("LLM_PROVIDER", "auto").lower()
    order = {
        "gemini": ["gemini"],
        "groq": ["groq"],
        "openai": ["openai"],
        "ollama": ["ollama"],
        "none": [],
    }.get(pref, ["gemini", "groq", "openai", "ollama"])
    for prov in order:
        if prov == "gemini" and os.environ.get("GEMINI_API_KEY"):
            return "gemini"
        if prov == "groq" and os.environ.get("GROQ_API_KEY"):
            return "groq"
        if prov == "openai" and os.environ.get("OPENAI_API_KEY"):
            return "openai"
        if prov == "ollama" and _ollama_available(
                os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")):
            return "ollama"
    return None


def _call_gemini(prompt: str) -> str | None:
    model = os.environ.get("LLM_MODEL") or "gemini-2.0-flash"
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{model}:generateContent")
    try:
        r = httpx.post(url, timeout=TIMEOUT,
                       params={"key": os.environ["GEMINI_API_KEY"]},
                       json={"contents": [{"parts": [{"text": prompt}]}]})
        r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None


def _call_openai_compatible(base: str, api_key: str | None, model: str,
                            prompt: str) -> str | None:
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        r = httpx.post(f"{base}/chat/completions", timeout=TIMEOUT, headers=headers,
                       json={"model": model,
                             "messages": [{"role": "user", "content": prompt}],
                             "temperature": 0})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    except Exception:
        return None


_ollama_alive: bool | None = None


def _ollama_available(base: str) -> bool:
    """One fast probe, cached — if Ollama isn't running, don't retry per event."""
    global _ollama_alive
    if _ollama_alive is None:
        try:
            r = httpx.get(f"{base}/api/tags",
                          timeout=httpx.Timeout(2.0, connect=1.5))
            _ollama_alive = r.status_code == 200
        except Exception:
            _ollama_alive = False
    return _ollama_alive


def call_llm(prompt: str) -> str | None:
    """Return raw model text, or None if unavailable/failed."""
    prov = _configured_provider()
    if prov is None:
        return None
    if prov == "gemini":
        return _call_gemini(prompt)
    if prov == "groq":
        model = os.environ.get("LLM_MODEL") or "llama-3.1-8b-instant"
        return _call_openai_compatible("https://api.groq.com/openai/v1",
                                       os.environ.get("GROQ_API_KEY"),
                                       model, prompt)
    if prov == "openai":
        model = os.environ.get("LLM_MODEL") or "gpt-4o-mini"
        return _call_openai_compatible("https://api.openai.com/v1",
                                       os.environ.get("OPENAI_API_KEY"),
                                       model, prompt)
    if prov == "ollama":
        base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.environ.get("OLLAMA_MODEL") or "llama3.2:3b"
        if not _ollama_available(base):
            return None
        return _call_openai_compatible(f"{base}/v1", None, model, prompt)
    return None


def parse_llm_json(text: str | None) -> dict | None:
    """Safely extract the JSON object from model output. None on any failure."""
    if not text:
        return None
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return None
    try:
        obj = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None
    # Validate shape so a hallucinated schema never reaches the ledger.
    if not isinstance(obj.get("qualified"), bool):
        return None
    try:
        obj["confidence"] = max(0.0, min(1.0, float(obj.get("confidence", 0.0))))
        obj["qualified_expense_usd"] = max(0.0, float(obj.get("qualified_expense_usd", 0.0)))
        obj["reason"] = str(obj.get("reason", ""))[:500]
        obj["rule_cited"] = str(obj.get("rule_cited", ""))[:300]
    except (TypeError, ValueError):
        return None
    return obj
