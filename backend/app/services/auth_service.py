from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, TokenPair
from app.schemas.user import UserCreate
from app.services.audit_service import AuditService


class AuthService:
    def __init__(self, db: Session, ip_address: str | None = None) -> None:
        self.db = db
        self.ip_address = ip_address
        self.users = UserRepository(db)
        self.audit = AuditService(db)

    def register(self, data: RegisterRequest) -> AuthResponse:
        existing_user = self.users.get_by_email(data.email)
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )

        user = self.users.create(
            UserCreate(
                email=data.email,
                password_hash=hash_password(data.password),
                role=data.role,
                is_active=True,
            )
        )
        self.audit.log_action(
            user_id=user.id,
            action="register",
            resource=f"users:{user.id}",
            ip_address=self.ip_address,
        )
        self.db.commit()
        return self._build_auth_response(user)

    def login(self, data: LoginRequest) -> AuthResponse:
        user = self.users.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This user account is inactive.",
            )

        self.audit.log_action(
            user_id=user.id,
            action="login",
            resource=f"users:{user.id}",
            ip_address=self.ip_address,
        )
        self.db.commit()
        return self._build_auth_response(user)

    def refresh(self, data: RefreshTokenRequest) -> TokenPair:
        try:
            payload = decode_refresh_token(data.refresh_token)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            ) from exc

        user = self.users.get_by_id(payload["sub"])
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        return self._build_token_pair(user)

    def prepare_logout(self) -> None:
        return None

    def _build_auth_response(self, user: User) -> AuthResponse:
        token_pair = self._build_token_pair(user)
        return AuthResponse(
            access_token=token_pair.access_token,
            refresh_token=token_pair.refresh_token,
            token_type=token_pair.token_type,
            user=user,
        )

    def _build_token_pair(self, user: User) -> TokenPair:
        return TokenPair(
            access_token=create_access_token(subject=user.id, role=user.role.value),
            refresh_token=create_refresh_token(subject=user.id, role=user.role.value),
        )
