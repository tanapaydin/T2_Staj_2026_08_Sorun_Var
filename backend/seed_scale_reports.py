"""Add a deterministic 3000-report scale-test batch.

Each district anchor is verified once with Geoapify reverse geocoding. Reports
are then distributed in a small radius around that verified anchor, avoiding
thousands of redundant external API calls. Deterministic UUIDs make reruns
idempotent and allow the batch to be removed safely with ``--delete-batch``.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import random
import time
import uuid

from app.database import SessionLocal
from app.models import Report, User
from app.services.geocoding import get_location_details
from seed_reports import ISSUES


BATCH_NAMESPACE = uuid.UUID("73f5091c-cce1-4727-b0ca-fc976aa13e57")
REFERENCE_DATE = datetime(2026, 8, 21, 12, 0, tzinfo=timezone.utc)
RANDOM_SEED = 20260821
COORDINATE_JITTER = 0.0045
GEOAPIFY_RETRIES = 3
GEOAPIFY_DELAY_SECONDS = 0.12


@dataclass(frozen=True)
class Target:
    city: str
    district: str
    latitude: float
    longitude: float
    count: int

    @property
    def key(self) -> str:
        return f"{self.city}|{self.district}"


TARGETS = [
    # İstanbul: 1050 new reports. Esenyurt ends just above 500.
    Target("İstanbul", "Esenyurt", 41.0340, 28.6800, 510),
    Target("İstanbul", "Küçükçekmece", 41.0000, 28.8000, 90),
    Target("İstanbul", "Bağcılar", 41.0340, 28.8560, 80),
    Target("İstanbul", "Pendik", 40.8770, 29.2580, 70),
    Target("İstanbul", "Ümraniye", 41.0160, 29.1240, 70),
    Target("İstanbul", "Bahçelievler", 40.9970, 28.8500, 65),
    Target("İstanbul", "Sultangazi", 41.1070, 28.8720, 60),
    Target("İstanbul", "Kadıköy", 40.9917, 29.0293, 55),
    Target("İstanbul", "Üsküdar", 41.0262, 29.0157, 50),

    # Ankara: 1030 new reports. Existing Çankaya reports bring it to 510.
    Target("Ankara", "Çankaya", 39.9208, 32.8541, 506),
    Target("Ankara", "Keçiören", 39.9795, 32.8663, 100),
    Target("Ankara", "Yenimahalle", 39.9690, 32.7460, 85),
    Target("Ankara", "Mamak", 39.9308, 32.9165, 80),
    Target("Ankara", "Etimesgut", 39.9634, 32.6320, 75),
    Target("Ankara", "Sincan", 39.9690, 32.5820, 65),
    Target("Ankara", "Altındağ", 39.9540, 32.9000, 60),
    Target("Ankara", "Pursaklar", 40.0390, 32.8950, 34),
    Target("Ankara", "Gölbaşı", 39.7900, 32.8050, 25),

    # Remaining 920 reports, distributed roughly by metropolitan population.
    Target("İzmir", "Bornova", 38.4697, 27.2176, 65),
    Target("İzmir", "Buca", 38.3740, 27.1742, 55),
    Target("Bursa", "Osmangazi", 40.1950, 29.0600, 50),
    Target("Bursa", "Nilüfer", 40.2120, 28.9860, 40),
    Target("Antalya", "Kepez", 36.9386, 30.7124, 45),
    Target("Antalya", "Muratpaşa", 36.8841, 30.7056, 35),
    Target("Adana", "Seyhan", 36.9914, 35.3308, 35),
    Target("Adana", "Çukurova", 37.0580, 35.2010, 30),
    Target("Konya", "Selçuklu", 37.8746, 32.4932, 35),
    Target("Konya", "Meram", 37.8380, 32.4360, 30),
    Target("Gaziantep", "Şahinbey", 37.0490, 37.3780, 32),
    Target("Gaziantep", "Şehitkamil", 37.0910, 37.3810, 28),
    Target("Kocaeli", "Gebze", 40.8028, 29.4307, 27),
    Target("Kocaeli", "İzmit", 40.7654, 29.9408, 23),
    Target("Mersin", "Yenişehir", 36.7900, 34.6200, 27),
    Target("Mersin", "Mezitli", 36.7770, 34.5350, 23),
    Target("Diyarbakır", "Kayapınar", 37.9440, 40.1770, 22),
    Target("Diyarbakır", "Bağlar", 37.9120, 40.1680, 18),
    Target("Hatay", "Antakya", 36.2020, 36.1600, 19),
    Target("Hatay", "İskenderun", 36.5850, 36.1750, 16),
    Target("Manisa", "Yunusemre", 38.6200, 27.4200, 16),
    Target("Manisa", "Şehzadeler", 38.6100, 27.4300, 14),
    Target("Kayseri", "Melikgazi", 38.7340, 35.4880, 16),
    Target("Kayseri", "Kocasinan", 38.7440, 35.4700, 14),
    Target("Samsun", "Atakum", 41.3330, 36.2220, 16),
    Target("Samsun", "İlkadım", 41.2860, 36.3310, 14),
    Target("Balıkesir", "Karesi", 39.6500, 27.8900, 13),
    Target("Balıkesir", "Altıeylül", 39.6500, 27.8800, 12),
    Target("Aydın", "Efeler", 37.8450, 27.8450, 11),
    Target("Aydın", "Nazilli", 37.9150, 28.3200, 9),
    Target("Tekirdağ", "Çorlu", 41.1600, 27.8000, 11),
    Target("Tekirdağ", "Süleymanpaşa", 40.9780, 27.5110, 9),
    Target("Muğla", "Bodrum", 37.0350, 27.4300, 8),
    Target("Muğla", "Fethiye", 36.6220, 29.1150, 7),
    Target("Sakarya", "Adapazarı", 40.7800, 30.4000, 8),
    Target("Sakarya", "Serdivan", 40.7750, 30.3650, 7),
    Target("Denizli", "Merkezefendi", 37.8050, 29.0500, 8),
    Target("Denizli", "Pamukkale", 37.7700, 29.0900, 7),
    Target("Eskişehir", "Odunpazarı", 39.7650, 30.5200, 11),
    Target("Eskişehir", "Tepebaşı", 39.7830, 30.5060, 9),
    Target("Trabzon", "Ortahisar", 41.0027, 39.7168, 8),
    Target("Trabzon", "Akçaabat", 41.0180, 39.5700, 7),
    Target("Erzurum", "Yakutiye", 39.9000, 41.2700, 8),
    Target("Erzurum", "Palandöken", 39.8650, 41.2850, 7),
    Target("Malatya", "Yeşilyurt", 38.3050, 38.2500, 8),
    Target("Malatya", "Battalgazi", 38.3650, 38.3100, 7),
]


def report_id(target: Target, index: int) -> uuid.UUID:
    return uuid.uuid5(BATCH_NAMESPACE, f"{target.key}|{index}")


def all_batch_ids() -> list[uuid.UUID]:
    return [
        report_id(target, index)
        for target in TARGETS
        for index in range(target.count)
    ]


def verify_targets() -> None:
    total = sum(target.count for target in TARGETS)
    istanbul = sum(target.count for target in TARGETS if target.city == "İstanbul")
    ankara = sum(target.count for target in TARGETS if target.city == "Ankara")

    assert total == 3000, f"Expected 3000 reports, got {total}"
    assert istanbul == 1050, f"Expected 1050 İstanbul reports, got {istanbul}"
    assert ankara == 1030, f"Expected 1030 Ankara reports, got {ankara}"


def geocode_target(target: Target) -> dict[str, str | None]:
    last_error: Exception | None = None

    for attempt in range(1, GEOAPIFY_RETRIES + 1):
        try:
            location = get_location_details(
                target.latitude,
                target.longitude,
                verbose=False,
            )

            if not location.get("city"):
                raise RuntimeError("Geoapify city alanı döndürmedi")

            print(
                f"Geoapify {target.city}/{target.district}: "
                f"{location.get('city')}/{location.get('district')}"
            )
            time.sleep(GEOAPIFY_DELAY_SECONDS)
            return location
        except Exception as exc:
            last_error = exc
            print(
                f"Geoapify denemesi başarısız "
                f"({target.key}, {attempt}/{GEOAPIFY_RETRIES}): "
                f"{type(exc).__name__}"
            )
            if attempt < GEOAPIFY_RETRIES:
                time.sleep(1.0)

    error_type = type(last_error).__name__ if last_error else "UnknownError"
    raise RuntimeError(
        f"Geoapify doğrulaması başarısız: {target.key} ({error_type})"
    ) from None


def delete_batch() -> None:
    db = SessionLocal()

    try:
        deleted = (
            db.query(Report)
            .filter(Report.id.in_(all_batch_ids()))
            .delete(synchronize_session=False)
        )
        db.commit()
        print(f"Scale-test batch silindi: {deleted}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def seed() -> None:
    verify_targets()
    db = SessionLocal()

    try:
        users = db.query(User).order_by(User.id.asc()).all()

        if not users:
            raise RuntimeError("Raporları ilişkilendirmek için en az bir kullanıcı gerekli.")

        batch_ids = all_batch_ids()
        existing_ids = {
            row[0]
            for row in db.query(Report.id)
            .filter(Report.id.in_(batch_ids))
            .all()
        }
        missing_count = len(batch_ids) - len(existing_ids)

        if missing_count == 0:
            print("Scale-test batch zaten tamamen eklenmiş; yeni kayıt oluşturulmadı.")
            return

        needed_targets = [
            target
            for target in TARGETS
            if any(
                report_id(target, index) not in existing_ids
                for index in range(target.count)
            )
        ]

        print(f"Geoapify ile doğrulanacak ilçe merkezi: {len(needed_targets)}")
        locations = {
            target.key: geocode_target(target)
            for target in needed_targets
        }

        rng = random.Random(RANDOM_SEED)
        reports_to_add: list[Report] = []
        global_index = 0

        for target in TARGETS:
            location = locations.get(target.key)

            for index in range(target.count):
                item_id = report_id(target, index)
                latitude = target.latitude + rng.uniform(
                    -COORDINATE_JITTER,
                    COORDINATE_JITTER,
                )
                longitude = target.longitude + rng.uniform(
                    -COORDINATE_JITTER,
                    COORDINATE_JITTER,
                )
                issue = ISSUES[global_index % len(ISSUES)]
                title, description, category, priority, _, _ = issue
                age = timedelta(
                    days=rng.randint(0, 540),
                    hours=rng.randint(0, 23),
                    minutes=rng.randint(0, 59),
                    seconds=rng.randint(0, 59),
                )
                status_roll = rng.random()

                if status_roll < 0.18:
                    status = "resolved"
                    progress = 100
                elif status_roll < 0.72:
                    status = "in_progress"
                    progress = rng.choice([10, 20, 30, 40, 50, 60, 70, 80, 90])
                else:
                    status = "pending"
                    progress = 0

                if item_id not in existing_ids:
                    if not location:
                        raise RuntimeError(f"Geoapify verisi eksik: {target.key}")

                    reports_to_add.append(
                        Report(
                            id=item_id,
                            user_id=users[global_index % len(users)].id,
                            title=title,
                            description=description,
                            category=category,
                            city=target.city,
                            municipality=f"{target.district} Belediyesi",
                            district=target.district,
                            neighborhood=location.get("neighborhood"),
                            address=location.get("address"),
                            latitude=round(latitude, 7),
                            longitude=round(longitude, 7),
                            status=status,
                            progress=progress,
                            priority=priority,
                            view_count=rng.randint(0, 450),
                            follower_count=rng.randint(0, 35),
                            created_at=REFERENCE_DATE - age,
                        )
                    )

                global_index += 1

        if len(reports_to_add) != missing_count:
            raise RuntimeError(
                f"Hazırlanan kayıt sayısı uyuşmuyor: "
                f"{len(reports_to_add)} != {missing_count}"
            )

        db.add_all(reports_to_add)
        db.commit()
        print(f"Scale-test raporları eklendi: {len(reports_to_add)}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--delete-batch",
        action="store_true",
        help="Bu scriptin deterministik kimliklerle eklediği raporları siler.",
    )
    args = parser.parse_args()

    if args.delete_batch:
        delete_batch()
    else:
        seed()


if __name__ == "__main__":
    main()
