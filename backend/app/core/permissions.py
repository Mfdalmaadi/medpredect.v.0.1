from collections.abc import Iterable

from fastapi import HTTPException, status

from app.models.user import User, UserRole


def has_role(user: User, roles: Iterable[UserRole]) -> bool:
    allowed_roles = set(roles)
    return user.role in allowed_roles


def is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN


def require_roles(user: User, roles: Iterable[UserRole]) -> None:
    if is_admin(user):
        return

    if not has_role(user, roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )


def require_admin_role(user: User) -> None:
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required.",
        )


def require_same_user_or_admin(current_user: User, target_user_id: str) -> None:
    if is_admin(current_user):
        return

    if current_user.id != target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own data.",
        )


def require_owner_or_admin(current_user: User, owner_id: str) -> None:
    if is_admin(current_user):
        return

    if current_user.id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this resource.",
        )
