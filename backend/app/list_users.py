from app.database import SessionLocal
from app.models import User


def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            print("No users found in DB.")
            return
        for u in users:
            print(f"id={u.id}, email={u.email}, password_hash={u.password_hash}")
    finally:
        db.close()


if __name__ == "__main__":
    list_users()
