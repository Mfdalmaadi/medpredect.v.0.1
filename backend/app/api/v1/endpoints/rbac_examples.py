from fastapi import APIRouter, Depends, Path

from app.api.deps import (
    require_admin,
    require_authenticated,
    require_doctor_or_admin,
    require_patient_or_admin,
)
from app.core.permissions import require_same_user_or_admin
from app.models.user import User

router = APIRouter()


@router.get(
    "/doctor-area",
    summary="Example: doctor or admin protected endpoint",
)
def doctor_area(current_user: User = Depends(require_doctor_or_admin)) -> dict[str, str]:
    return {
        "message": "Doctor-level access granted.",
        "user_id": current_user.id,
        "role": current_user.role.value,
    }


@router.get(
    "/patient-area",
    summary="Example: patient or admin protected endpoint",
)
def patient_area(current_user: User = Depends(require_patient_or_admin)) -> dict[str, str]:
    return {
        "message": "Patient-level access granted.",
        "user_id": current_user.id,
        "role": current_user.role.value,
    }


@router.get(
    "/admin-area",
    summary="Example: admin-only protected endpoint",
)
def admin_area(current_user: User = Depends(require_admin)) -> dict[str, str]:
    return {
        "message": "Admin access granted.",
        "user_id": current_user.id,
        "role": current_user.role.value,
    }


@router.get(
    "/users/{user_id}/own-data",
    summary="Example: owner or admin protected endpoint",
)
def own_data_example(
    user_id: str = Path(examples=["00000000-0000-0000-0000-000000000000"]),
    current_user: User = Depends(require_authenticated),
) -> dict[str, str]:
    require_same_user_or_admin(current_user, user_id)
    return {
        "message": "Own-data access granted.",
        "requested_user_id": user_id,
        "current_user_id": current_user.id,
        "role": current_user.role.value,
    }
