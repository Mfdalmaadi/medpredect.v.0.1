from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, role: str) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    return _create_token(
        subject=subject,
        role=role,
        token_type=ACCESS_TOKEN_TYPE,
        secret_key=settings.jwt_secret_key,
        expires_delta=expires_delta,
    )


def create_refresh_token(subject: str, role: str) -> str:
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    return _create_token(
        subject=subject,
        role=role,
        token_type=REFRESH_TOKEN_TYPE,
        secret_key=settings.jwt_refresh_secret_key,
        expires_delta=expires_delta,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    return _decode_token(token, settings.jwt_secret_key, ACCESS_TOKEN_TYPE)


def decode_refresh_token(token: str) -> dict[str, Any]:
    return _decode_token(token, settings.jwt_refresh_secret_key, REFRESH_TOKEN_TYPE)


def _create_token(
    *,
    subject: str,
    role: str,
    token_type: str,
    secret_key: str,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, secret_key, algorithm=settings.jwt_algorithm)


def _decode_token(token: str, secret_key: str, expected_type: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

    if payload.get("type") != expected_type:
        raise ValueError("Invalid token type")

    if not payload.get("sub"):
        raise ValueError("Invalid token subject")

    return payload
