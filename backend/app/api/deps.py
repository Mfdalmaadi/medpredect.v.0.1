from collections.abc import Generator
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.permissions import require_admin_role, require_roles
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.services.ml_service import MLArtifactsNotFoundError, MLService

bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
        ) from exc

    user = UserRepository(db).get_by_id(payload["sub"])
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
        )

    return user


def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    require_roles(current_user, [UserRole.DOCTOR])
    return current_user


def require_patient(current_user: User = Depends(get_current_user)) -> User:
    require_roles(current_user, [UserRole.PATIENT])
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    require_admin_role(current_user)
    return current_user


def require_doctor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    require_roles(current_user, [UserRole.DOCTOR])
    return current_user


def require_patient_or_admin(current_user: User = Depends(get_current_user)) -> User:
    require_roles(current_user, [UserRole.PATIENT])
    return current_user


def require_authenticated(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@lru_cache
def _get_cached_ml_service() -> MLService:
    return MLService()


def get_ml_service() -> MLService:
    try:
        return _get_cached_ml_service()
    except MLArtifactsNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model artifacts are not available. Train the model before using prediction endpoints.",
        ) from exc
