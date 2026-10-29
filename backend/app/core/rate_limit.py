"""In-memory rate limits (one API process). Login is keyed by IP, chat by user."""
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import decode_access_token


def user_or_ip(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        user_id = decode_access_token(auth[7:])
        if user_id:
            return f"user:{user_id}"
    return get_remote_address(request)


limiter = Limiter(key_func=get_remote_address)
