from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.patient import Gender


class PatientBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100, examples=["Amina"])
    last_name: str = Field(min_length=1, max_length=100, examples=["Benali"])
    medical_identifier: str = Field(min_length=1, max_length=100, examples=["MED-2026-001"])
    date_of_birth: date = Field(examples=["1995-04-12"])
    gender: Gender = Field(examples=[Gender.FEMALE])
    phone: str | None = Field(default=None, max_length=30, examples=["+212600000000"])
    notes: str | None = Field(default=None, max_length=5000, examples=["Initial consultation."])

    @field_validator("date_of_birth")
    @classmethod
    def date_of_birth_must_not_be_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return value


class PatientCreate(PatientBase):
    doctor_id: str | None = Field(
        default=None,
        examples=["00000000-0000-0000-0000-000000000000"],
        description="Admin-only override. Doctors cannot assign patients to another doctor.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "first_name": "Amina",
                    "last_name": "Benali",
                    "medical_identifier": "MED-2026-001",
                    "date_of_birth": "1995-04-12",
                    "gender": "female",
                    "phone": "+212600000000",
                    "notes": "Initial consultation.",
                }
            ]
        }
    }


class PatientUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    medical_identifier: str | None = Field(default=None, min_length=1, max_length=100)
    date_of_birth: date | None = None
    gender: Gender | None = None
    phone: str | None = Field(default=None, max_length=30)
    notes: str | None = Field(default=None, max_length=5000)

    @field_validator("date_of_birth")
    @classmethod
    def date_of_birth_must_not_be_future(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return value


class PatientRead(PatientBase):
    id: str
    doctor_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientList(BaseModel):
    items: list[PatientRead]
    total: int
    skip: int
    limit: int
