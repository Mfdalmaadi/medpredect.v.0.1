from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    LogoutResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenPair,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    return AuthService(db, request.state.ip_address).register(payload)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login with email and password",
)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> AuthResponse:
    return AuthService(db, request.state.ip_address).login(payload)


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Refresh access token",
)
def refresh_token(payload: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)) -> TokenPair:
    return AuthService(db, request.state.ip_address).refresh(payload)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Prepare logout",
)
def logout(payload: LogoutRequest, request: Request, db: Session = Depends(get_db)) -> LogoutResponse:
    AuthService(db, request.state.ip_address).prepare_logout()
    return LogoutResponse()
