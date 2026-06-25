from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


USERS = [
    {
        "email": "admin@medpredict.com",
        "password": "Admin123!",
        "role": UserRole.ADMIN,
    },
    {
        "email": "doctor@medpredict.com",
        "password": "Doctor123!",
        "role": UserRole.DOCTOR,
    },
    {
        "email": "patient@medpredict.com",
        "password": "Patient123!",
        "role": UserRole.PATIENT,
    },
]


def seed_users() -> None:
    db = SessionLocal()

    try:
        for user_data in USERS:
            existing = (
                db.query(User)
                .filter(User.email == user_data["email"])
                .first()
            )

            if existing:
                print(f"Skipping {user_data['email']} (already exists)")
                continue

            user = User(
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
                is_active=True,
            )

            db.add(user)

        db.commit()
        print("Users seeded successfully.")

    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_users()