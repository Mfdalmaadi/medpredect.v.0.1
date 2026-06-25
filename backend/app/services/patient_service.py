from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import is_admin
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.repositories.patient_repository import PatientRepository
from app.repositories.user_repository import UserRepository
from app.schemas.patient import PatientCreate, PatientList, PatientUpdate
from app.services.audit_service import AuditService


class PatientService:
    def __init__(self, db: Session, ip_address: str | None = None) -> None:
        self.db = db
        self.ip_address = ip_address
        self.patients = PatientRepository(db)
        self.users = UserRepository(db)
        self.audit = AuditService(db)

    def create_patient(self, data: PatientCreate, current_user: User) -> Patient:
        doctor_id = self._resolve_doctor_id_for_create(data, current_user)

        existing_patient = self.patients.get_by_medical_identifier(doctor_id, data.medical_identifier)
        if existing_patient is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A patient with this medical identifier already exists for this doctor.",
            )

        try:
            patient = self.patients.create(data, doctor_id)
            self.audit.log_action(
                user_id=current_user.id,
                action="patient_created",
                resource=f"patients:{patient.id}",
                ip_address=self.ip_address,
            )
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Patient could not be created because of a database constraint.",
            ) from exc

        return patient

    def get_patient(self, patient_id: str, current_user: User) -> Patient:
        patient = self.patients.get_by_id(patient_id) if is_admin(current_user) else self.patients.get_owned_by_id(
            patient_id,
            current_user.id,
        )
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
        return patient

    def list_patients(self, current_user: User, *, skip: int = 0, limit: int = 100) -> PatientList:
        if is_admin(current_user):
            items = self.patients.list_all(skip=skip, limit=limit)
            total = self.patients.count_all()
        else:
            items = self.patients.list_by_doctor(current_user.id, skip=skip, limit=limit)
            total = self.patients.count_by_doctor(current_user.id)

        return PatientList(items=items, total=total, skip=skip, limit=limit)

    def update_patient(self, patient_id: str, data: PatientUpdate, current_user: User) -> Patient:
        patient = self.get_patient(patient_id, current_user)

        new_medical_identifier = data.medical_identifier
        if new_medical_identifier and new_medical_identifier != patient.medical_identifier:
            existing_patient = self.patients.get_by_medical_identifier(patient.doctor_id, new_medical_identifier)
            if existing_patient is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A patient with this medical identifier already exists for this doctor.",
                )

        try:
            updated_patient = self.patients.update(patient, data)
            self.audit.log_action(
                user_id=current_user.id,
                action="patient_updated",
                resource=f"patients:{updated_patient.id}",
                ip_address=self.ip_address,
            )
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Patient could not be updated because of a database constraint.",
            ) from exc

        return updated_patient

    def delete_patient(self, patient_id: str, current_user: User) -> None:
        patient = self.get_patient(patient_id, current_user)
        resource = f"patients:{patient.id}"
        self.patients.delete(patient)
        self.audit.log_action(
            user_id=current_user.id,
            action="patient_deleted",
            resource=resource,
            ip_address=self.ip_address,
        )
        self.db.commit()

    def _resolve_doctor_id_for_create(self, data: PatientCreate, current_user: User) -> str:
        if not is_admin(current_user):
            return current_user.id

        if data.doctor_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="doctor_id is required when an admin creates a patient.",
            )

        doctor = self.users.get_by_id(data.doctor_id)
        if doctor is None or doctor.role != UserRole.DOCTOR or not doctor.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="doctor_id must reference an active doctor user.",
            )

        return doctor.id
