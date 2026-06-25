from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.scalar(stmt)

    def list(self, *, skip: int = 0, limit: int = 100) -> list[User]:
        stmt = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.scalars(stmt))

    def count(self) -> int:
        stmt = select(func.count()).select_from(User)
        return int(self.db.scalar(stmt) or 0)

    def count_by_role(self) -> dict[str, int]:
        stmt = select(User.role, func.count()).group_by(User.role)
        return {role.value: int(count) for role, count in self.db.execute(stmt).all()}

    def create(self, data: UserCreate) -> User:
        user = User(**data.model_dump())
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def set_active(self, user: User, is_active: bool) -> User:
        user.is_active = is_active
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def update(self, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user
