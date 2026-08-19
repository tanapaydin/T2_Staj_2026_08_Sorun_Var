from app.database import SessionLocal
from app.models import User
from app.utils.security import hash_password


def set_password(email: str, new_password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return
        user.password_hash = hash_password(new_password)
        db.add(user)
        db.commit()
        print(f"Password for {email} set to '{new_password}'.")
    finally:
        db.close()


if __name__ == "__main__":
    # change these values if you want a different account or password
    set_password("testuser3@example.com", "demo123")
