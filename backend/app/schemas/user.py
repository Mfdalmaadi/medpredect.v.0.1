from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole
    is_active: bool = True


class UserCreate(UserBase):
    password_hash: str = Field(min_length=20, max_length=255)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password_hash: str | None = Field(default=None, min_length=20, max_length=255)


class UserRead(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
