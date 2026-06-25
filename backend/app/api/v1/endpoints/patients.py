from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_doctor_or_admin
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientList, PatientRead, PatientUpdate
from app.services.patient_service import PatientService

router = APIRouter()


@router.post(
    "",
    response_model=PatientRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create patient",
)
def create_patient(
    payload: PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PatientRead:
    return PatientService(db, request.state.ip_address).create_patient(payload, current_user)


@router.get(
    "",
    response_model=PatientList,
    summary="List patients",
)
def list_patients(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PatientList:
    return PatientService(db).list_patients(current_user, skip=skip, limit=limit)


@router.get(
    "/{patient_id}",
    response_model=PatientRead,
    summary="Get patient",
)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PatientRead:
    return PatientService(db).get_patient(patient_id, current_user)


@router.patch(
    "/{patient_id}",
    response_model=PatientRead,
    summary="Update patient",
)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> PatientRead:
    return PatientService(db, request.state.ip_address).update_patient(patient_id, payload, current_user)


@router.delete(
    "/{patient_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete patient",
)
def delete_patient(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> Response:
    PatientService(db, request.state.ip_address).delete_patient(patient_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
