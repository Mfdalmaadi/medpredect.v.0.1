from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


class PatientRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, patient_id: str) -> Patient | None:
        return self.db.get(Patient, patient_id)

    def get_owned_by_id(self, patient_id: str, doctor_id: str) -> Patient | None:
        stmt = select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
        return self.db.scalar(stmt)

    def get_by_medical_identifier(self, doctor_id: str, medical_identifier: str) -> Patient | None:
        stmt = select(Patient).where(
            Patient.doctor_id == doctor_id,
            Patient.medical_identifier == medical_identifier,
        )
        return self.db.scalar(stmt)

    def list_all(self, *, skip: int = 0, limit: int = 100) -> list[Patient]:
        stmt = select(Patient).order_by(Patient.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.scalars(stmt))

    def list_by_doctor(self, doctor_id: str, *, skip: int = 0, limit: int = 100) -> list[Patient]:
        stmt = (
            select(Patient)
            .where(Patient.doctor_id == doctor_id)
            .order_by(Patient.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def count_all(self) -> int:
        stmt = select(func.count()).select_from(Patient)
        return int(self.db.scalar(stmt) or 0)

    def count_by_doctor(self, doctor_id: str) -> int:
        stmt = select(func.count()).select_from(Patient).where(Patient.doctor_id == doctor_id)
        return int(self.db.scalar(stmt) or 0)

    def create(self, data: PatientCreate, doctor_id: str) -> Patient:
        patient_data = data.model_dump(exclude={"doctor_id"})
        patient = Patient(**patient_data, doctor_id=doctor_id)
        self.db.add(patient)
        self.db.flush()
        self.db.refresh(patient)
        return patient

    def update(self, patient: Patient, data: PatientUpdate) -> Patient:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)

        self.db.add(patient)
        self.db.flush()
        self.db.refresh(patient)
        return patient

    def delete(self, patient: Patient) -> None:
        self.db.delete(patient)
        self.db.flush()
