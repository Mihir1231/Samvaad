"""Signed, expiring session tokens (HMAC-SHA256) for admin/faculty login."""
from __future__ import annotations

import base64
import hashlib
import hmac
import time
from typing import Optional

TOKEN_TTL_SECONDS = 24 * 60 * 60  # 24 hours


def _sign(secret: str, payload: str) -> str:
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


def create_token(secret: str, email: str) -> str:
    payload = f"{email}:{int(time.time())}"
    signature = _sign(secret, payload)
    return base64.urlsafe_b64encode(f"{payload}:{signature}".encode()).decode()


def verify_token(secret: str, token: str) -> Optional[str]:
    """Returns the email if the token is validly signed and not expired, else None."""
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        email, issued_at, signature = decoded.rsplit(":", 2)
        expected_payload = f"{email}:{issued_at}"
        expected_signature = _sign(secret, expected_payload)
        if not hmac.compare_digest(signature, expected_signature):
            return None
        if time.time() - int(issued_at) > TOKEN_TTL_SECONDS:
            return None
        return email
    except Exception:
        return None
