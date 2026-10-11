"""GitHub connector: pull commits from a repo and map them to TaxShield events.

Uses the GitHub REST API (free). A personal access token with read-only
Contents access goes in .env as GITHUB_TOKEN; public repos work without one
at a lower rate limit. Estimated dev hours per commit is a LABELLED ASSUMPTION
(GITHUB_HOURS_PER_COMMIT, default 1.5) — real time tracking needs a timesheet.
"""
import os
import uuid

import httpx
from dotenv import load_dotenv

load_dotenv()

API = "https://api.github.com"


class ConnectorError(Exception):
    pass


def fetch_events(limit: int = 20) -> list[dict]:
    """Fetch the most recent commits from GITHUB_REPO as TaxShield events."""
    repo = os.environ.get("GITHUB_REPO", "").strip()
    if not repo or repo.count("/") != 1:
        raise ConnectorError("set GITHUB_REPO=owner/repo in .env")

    token = os.environ.get("GITHUB_TOKEN", "").strip()
    headers = {"Accept": "application/vnd.github+json",
               "User-Agent": "TaxShield-Student-Project"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    hours = float(os.environ.get("GITHUB_HOURS_PER_COMMIT", "1.5"))
    url = f"{API}/repos/{repo}/commits"
    try:
        r = httpx.get(url, headers=headers, timeout=20,
                      params={"per_page": min(limit, 50)})
    except httpx.HTTPError as exc:
        raise ConnectorError(f"network error: {exc}")
    if r.status_code == 403 and "rate limit" in r.text.lower():
        raise ConnectorError("GitHub rate limit hit — add GITHUB_TOKEN to .env")
    if r.status_code == 404:
        raise ConnectorError(f"repo not found or private: {repo}")
    if r.status_code != 200:
        raise ConnectorError(f"GitHub API returned {r.status_code}")

    events = []
    import datetime as dt
    for c in r.json():
        commit = c.get("commit", {})
        events.append({
            "id": c.get("sha", str(uuid.uuid4())),
            "source": "github",
            "timestamp": commit.get("author", {}).get("date")
            or dt.datetime.now(dt.timezone.utc).isoformat(),
            "payload": {
                "message": (commit.get("message") or "").split("\n")[0][:500],
                "author": commit.get("author", {}).get("name", "unknown"),
                "hours": hours,  # labelled assumption, not measured time
                "repo": repo,
                "commit_sha": c.get("sha"),
                "url": c.get("html_url"),
            },
        })
    return events
