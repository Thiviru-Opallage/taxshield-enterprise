"""One-command local run: seed the DB, start the API, (optionally) the dashboard.

Usage:
    python run.py                 # seed + start API on :8000
    python run.py --no-seed       # start API without reseeding
    python run.py --dashboard     # also start the Next.js dashboard on :3000
"""
import argparse
import os
import shutil
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable


def api_healthy() -> bool:
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


def dashboard_up() -> bool:
    try:
        with urllib.request.urlopen("http://127.0.0.1:3000", timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-seed", action="store_true")
    ap.add_argument("--dashboard", action="store_true",
                    help="also start the Next.js dashboard")
    args = ap.parse_args()

    if not os.path.exists(os.path.join(ROOT, ".env")):
        print("No .env found. Copy .env.example to .env and set TAXSHIELD_KEY.")
        sys.exit(1)

    if not args.no_seed:
        print("==> seeding demo database")
        subprocess.run([PY, "-m", "ensurepip"], capture_output=True)
        subprocess.run([PY, os.path.join(ROOT, "scripts", "seed.py"), "--reset"],
                       cwd=ROOT, check=True)

    api = None  # only set when *we* start it (and only then can we wait on it)

    if api_healthy():
        print("API already running on :8000 — not starting another")
    else:
        print("==> starting API on http://127.0.0.1:8000")
        api = subprocess.Popen([PY, "-m", "uvicorn", "ingest.api:app",
                                "--port", "8000"], cwd=ROOT)
        for _ in range(30):
            if api_healthy():
                break
            time.sleep(0.5)
        else:
            print("API failed to start; check the log above")
            sys.exit(1)

    print("API healthy. Login: demo@taxshield.local / demo1234 (from .env)")

    if args.dashboard:
        web = os.path.join(ROOT, "dashboard", "web")
        if os.path.exists(os.path.join(web, "node_modules")):
            npm = shutil.which("npm")
            if npm is None:
                print("npm not found on PATH — install Node.js, then run:\n"
                      "  cd dashboard/web && npm run dev")
            elif dashboard_up():
                print("Dashboard already running on :3000 — not starting another. "
                      "Open http://localhost:3000")
            else:
                print("==> starting dashboard on http://localhost:3000")
                # On Windows npm is npm.cmd; CreateProcess can't run .cmd
                # directly, so go through cmd.exe when needed.
                cmd = [npm, "run", "dev", "--", "-p", "3000"]
                if npm.lower().endswith((".cmd", ".bat")):
                    cmd = [os.environ.get("COMSPEC", "cmd.exe"), "/c"] + cmd
                subprocess.run(cmd, cwd=web)
        else:
            print("dashboard deps missing — run: cd dashboard/web && npm install")

    if api is None:
        # API was already running (started elsewhere); nothing left to wait on.
        return

    try:
        api.wait()
    except KeyboardInterrupt:
        print("\nshutting down")


if __name__ == "__main__":
    main()
