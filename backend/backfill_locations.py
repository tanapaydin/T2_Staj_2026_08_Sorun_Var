import time

from app.database import SessionLocal
from app.models import Report
from app.services.geocoding import get_location_details


def main():
    db = SessionLocal()

    try:
        reports = (
            db.query(Report)
            .order_by(Report.created_at.asc())
            .all()
        )

        print(
            f"Konum bilgisi yenilenecek rapor sayısı: {len(reports)}"
        )

        for index, report in enumerate(
            reports,
            start=1,
        ):
            print(
                f"[{index}/{len(reports)}] "
                f"{report.title}"
            )

            try:
                location = get_location_details(
                    report.latitude,
                    report.longitude,
                )

                report.city = location["city"]
                report.municipality = (
                    location["municipality"]
                )
                report.district = (
                    location["district"]
                )
                report.neighborhood = (
                    location["neighborhood"]
                )
                report.address = (
                    location["address"]
                )

                db.commit()

                print(
                    "  KONUM:",
                    location,
                )

            except Exception as error:
                db.rollback()

                print(
                    "  HATA:",
                    error,
                )

            time.sleep(0.3)

    finally:
        db.close()


if __name__ == "__main__":
    main()