from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate


class DoctorRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_license_number(self, license_number: str) -> Doctor | None:
        stmt = select(Doctor).where(Doctor.license_number == license_number)
        return self.db.scalar(stmt)

    def create(self, data: DoctorCreate) -> Doctor:
        doctor = Doctor(**data.model_dump())
        self.db.add(doctor)
        self.db.flush()
        self.db.refresh(doctor)
        return doctor
