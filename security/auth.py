"""JWT auth for the dashboard/API. Demo user comes from environment variables."""
import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-insecure-secret")
JWT_ALGO = "HS256"
TOKEN_TTL_HOURS = 8
DEMO_USER = os.environ.get("DEMO_USER", "demo@taxshield.local")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "demo1234")

_bearer = HTTPBearer(auto_error=False)


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def verify_credentials(username: str, password: str) -> bool:
    # Constant-time comparison so the demo login isn't trivially timing-attacked.
    import hmac
    user_ok = hmac.compare_digest(username, DEMO_USER)
    pass_ok = hmac.compare_digest(password, DEMO_PASSWORD)
    return user_ok and pass_ok


def require_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """FastAPI dependency: every protected route depends on this."""
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="missing bearer token; POST /auth/token first")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="token expired; log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="invalid token")
