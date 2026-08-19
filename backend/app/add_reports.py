from app.database import SessionLocal
from app.models import Report, User


def add_demo_reports():
    db = SessionLocal()

    try:
        count = db.query(Report).count()
        if count > 0:
            print("Reports already exist.")
            return

        # pick any existing user to own the reports
        user = db.query(User).first()
        if not user:
            print("No users found; cannot create reports.")
            return

        reports = [
            Report(
                user_id=user.id,
                title="Yolda derin çukur",
                description="Araçlar için tehlike oluşturuyor.",
                category="road",
                latitude=39.9208,
                longitude=32.8541,
                status="pending",
                progress=0,
                priority="high",
                view_count=42,
            ),
            Report(
                user_id=user.id,
                title="Çöp konteyneri taşmış",
                description="Çevreye kötü koku yayılıyor.",
                category="trash",
                latitude=39.9787,
                longitude=32.8663,
                status="pending",
                progress=25,
                priority="medium",
                view_count=18,
            ),
        ]

        db.add_all(reports)
        db.commit()
        print("Demo reports added.")
    finally:
        db.close()


if __name__ == "__main__":
    add_demo_reports()
