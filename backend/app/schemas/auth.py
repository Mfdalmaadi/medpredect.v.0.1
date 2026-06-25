from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr = Field(examples=["doctor@example.com"])
    password: str = Field(min_length=8, max_length=128, examples=["Password123"])
    role: UserRole = Field(examples=[UserRole.DOCTOR])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "doctor@example.com",
                    "password": "Password123",
                    "role": "doctor",
                }
            ]
        }
    }


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["doctor@example.com"])
    password: str = Field(examples=["Password123"])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "doctor@example.com",
                    "password": "Password123",
                }
            ]
        }
    }


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])


class LogoutRequest(BaseModel):
    refresh_token: str = Field(examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(TokenPair):
    user: UserRead


class LogoutResponse(BaseModel):
    message: str = "Logout accepted. Token revocation storage will be added in a later phase."
