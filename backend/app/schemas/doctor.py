from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DoctorBase(BaseModel):
    specialization: str = Field(min_length=1, max_length=120, examples=["Endocrinology"])
    license_number: str = Field(min_length=1, max_length=120, examples=["LIC-123456"])
    hospital: str = Field(min_length=1, max_length=160, examples=["Central Hospital"])


class DoctorCreate(DoctorBase):
    user_id: str


class DoctorRead(DoctorBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
