from app.database import SessionLocal
from app.models import Report, User


def seed():
    db = SessionLocal()

    # Daha önce veri varsa tekrar ekleme
    if db.query(User).count() > 0:
        print("Seed already exists.")
        db.close()
        return
 
    # Demo kullanıcı
    demo_user = User(
        name="Demo User",
        email="demo@sorunvar.com",
        password_hash="demo_hash",
        role="citizen",
        email_verified=True,
    )

    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    reports = [
        Report(
            user_id=demo_user.id,
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
            user_id=demo_user.id,
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
        Report(
            user_id=demo_user.id,
            title="Sokak lambası arızalı",
            description="Gece görüşü çok düşük.",
            category="lighting",
            latitude=39.9593,
            longitude=32.8095,
            status="planning",
            progress=50,
            priority="medium",
            view_count=31,
        ),
        Report(
            user_id=demo_user.id,
            title="İnşaat nedeniyle yoğun toz",
            description="Mahallede nefes almak zorlaştı.",
            category="construction",
            latitude=39.9334,
            longitude=32.9171,
            status="scheduled",
            progress=75,
            priority="high",
            view_count=27,
        ),
    ]

    db.add_all(reports)
    db.commit()

    db.close()

    print("Seed completed successfully.")


if __name__ == "__main__":
    seed()