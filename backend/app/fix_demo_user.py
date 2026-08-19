from app.database import SessionLocal
from app.models import User
from app.utils.security import hash_password


def fix_demo_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@sorunvar.com").first()
        if not user:
            print("Demo user not found.")
            return

        if user.password_hash and user.password_hash != "demo_hash":
            print("Demo user already has a real password hash.")
            return

        new_hash = hash_password("demo123")
        user.password_hash = new_hash
        db.add(user)
        db.commit()
        print("Demo user password updated to 'demo123'.")
    finally:
        db.close()


if __name__ == "__main__":
    fix_demo_user()
