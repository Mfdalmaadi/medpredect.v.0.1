from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.user import UserRole
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr = Field(examples=["doctor@example.com"])
    password: str = Field(min_length=8, max_length=128, examples=["Password123"])
    role: UserRole = Field(examples=[UserRole.DOCTOR])
    specialization: str | None = Field(default=None, min_length=1, max_length=120, examples=["Endocrinology"])
    license_number: str | None = Field(default=None, min_length=1, max_length=120, examples=["LIC-123456"])
    hospital: str | None = Field(default=None, min_length=1, max_length=160, examples=["Central Hospital"])

    @model_validator(mode="after")
    def require_doctor_profile(self) -> "RegisterRequest":
        if self.role == UserRole.DOCTOR:
            missing = [
                field
                for field in ("specialization", "license_number", "hospital")
                if not getattr(self, field)
            ]
            if missing:
                raise ValueError(f"Doctor registration requires: {', '.join(missing)}.")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "doctor@example.com",
                    "password": "Password123",
                    "role": "doctor",
                    "specialization": "Endocrinology",
                    "license_number": "LIC-123456",
                    "hospital": "Central Hospital",
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


class RegisterResponse(BaseModel):
    user: UserRead
    message: str


class LogoutResponse(BaseModel):
    message: str = "Logout accepted. Token revocation storage will be added in a later phase."
