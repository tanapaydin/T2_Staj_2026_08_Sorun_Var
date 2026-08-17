from datetime import datetime, timedelta, timezone
import time

from app.database import get_db
from app.models import Report, User
from app.services.geocoding import get_location_details

LOCATIONS = ['Istanbul Kadikoy|40.9917|29.0293', 'Istanbul Besiktas|41.0430|29.0094', 'Istanbul Sisli|41.0602|28.9877', 'Istanbul Uskudar|41.0262|29.0157', 'Istanbul Bakirkoy|40.9804|28.8747', 'Istanbul Maltepe|40.9357|29.1304', 'Ankara Cankaya|39.9208|32.8541', 'Ankara Kecioren|39.9795|32.8663', 'Ankara Mamak|39.9308|32.9165', 'Ankara Yenimahalle|39.9690|32.7460', 'Ankara Etimesgut|39.9634|32.6320', 'Ankara Sincan|39.9690|32.5820', 'Izmir Konak|38.4192|27.1287', 'Izmir Karsiyaka|38.4610|27.1100', 'Izmir Bornova|38.4697|27.2176', 'Izmir Buca|38.3740|27.1742', 'Izmir Gaziemir|38.3242|27.1297', 'Izmir Bayrakli|38.4622|27.1683', 'Bursa Osmangazi|40.1950|29.0600', 'Bursa Nilufer|40.2120|28.9860', 'Bursa Yildirim|40.1850|29.0900', 'Bursa Mudanya|40.3760|28.8820', 'Bursa Inegol|40.0780|29.5150', 'Bursa Gursu|40.2180|29.1840', 'Antalya Muratpasa|36.8841|30.7056', 'Antalya Kepez|36.9386|30.7124', 'Antalya Konyaalti|36.8704|30.6360', 'Antalya Aksu|36.9530|30.8500', 'Antalya Dosemealti|37.0230|30.6040', 'Antalya Manavgat|36.7867|31.4427', 'Adana Seyhan|36.9914|35.3308', 'Adana Cukurova|37.0580|35.2010', 'Adana Yuregir|37.0260|35.3900', 'Adana Saricam|37.0250|35.4250', 'Adana Kozan|37.4550|35.8150', 'Adana Ceyhan|37.0280|35.8160', 'Konya Selcuklu|37.8746|32.4932', 'Konya Meram|37.8380|32.4360', 'Konya Karatay|37.8660|32.5140', 'Konya Eregli|37.5130|34.0460', 'Konya Beysehir|37.6770|31.7240', 'Konya Aksehir|38.3570|31.4160', 'Gaziantep Sahinbey|37.0490|37.3780', 'Gaziantep Sehitkamil|37.0910|37.3810', 'Gaziantep Nizip|37.0090|37.7940', 'Gaziantep Islahiye|37.0260|36.6310', 'Gaziantep Oguzeli|36.9650|37.5120', 'Gaziantep Araban|37.4250|37.6890', 'Kocaeli Izmit|40.7654|29.9408', 'Kocaeli Gebze|40.8028|29.4307', 'Kocaeli Darica|40.7670|29.3720', 'Kocaeli Kartepe|40.7550|30.0170', 'Kocaeli Korfez|40.7780|29.7390', 'Kocaeli Golcuk|40.7160|29.8220', 'Mersin Mezitli|36.7770|34.5350', 'Mersin Yenisehir|36.7900|34.6200', 'Mersin Toroslar|36.8700|34.5550', 'Mersin Akdeniz|36.8000|34.6250', 'Mersin Tarsus|36.9160|34.8950', 'Mersin Silifke|36.3770|33.9340', 'Kayseri Melikgazi|38.7340|35.4880', 'Kayseri Kocasinan|38.7440|35.4700', 'Kayseri Talas|38.6900|35.5530', 'Kayseri Develi|38.3900|35.4920', 'Kayseri Incesu|38.6200|35.1920', 'Kayseri Hacilar|38.6500|35.4520', 'Diyarbakir Kayapinar|37.9440|40.1770', 'Diyarbakir Yenisehir|37.9140|40.2200', 'Diyarbakir Baglar|37.9120|40.1680', 'Diyarbakir Sur|37.9140|40.2300', 'Diyarbakir Bismil|37.8480|40.6630', 'Diyarbakir Ergani|38.2690|39.7590', 'Samsun Atakum|41.3330|36.2220', 'Samsun Ilkadim|41.2860|36.3310', 'Samsun Canik|41.2850|36.3500', 'Samsun Tekkekoy|41.2080|36.4570', 'Samsun Bafra|41.5670|35.9060', 'Samsun Terme|41.2090|36.9730', 'Eskisehir Odunpazari|39.7650|30.5200', 'Eskisehir Tepebasi|39.7830|30.5060', 'Eskisehir Sivrihisar|39.4500|31.5350', 'Eskisehir Cifteler|39.3830|31.0400', 'Eskisehir Alpu|39.7700|30.9600', 'Eskisehir Mahmudiye|39.4900|30.9900', 'Trabzon Ortahisar|41.0027|39.7168', 'Trabzon Akcaabat|41.0180|39.5700', 'Trabzon Yomra|40.9550|39.8600', 'Trabzon Arsin|40.9500|39.9250', 'Trabzon Of|40.9400|40.2600', 'Trabzon Vakfikebir|41.0460|39.2760', 'Sakarya Adapazari|40.7800|30.4000', 'Sakarya Serdivan|40.7750|30.3650', 'Sakarya Erenler|40.7600|30.4100', 'Sakarya Arifiye|40.7100|30.3600', 'Sakarya Sapanca|40.6910|30.2670', 'Sakarya Hendek|40.7950|30.7450', 'Denizli Merkezefendi|37.8050|29.0500', 'Denizli Pamukkale|37.7700|29.0900', 'Denizli Acipayam|37.4250|29.5100', 'Denizli Civril|38.3000|29.7400', 'Denizli Tavas|37.5750|29.0700', 'Denizli Buldan|38.0450|28.8300', 'Balikesir Karesi|39.6500|27.8900', 'Balikesir Altieylul|39.6500|27.8800', 'Balikesir Bandirma|40.3520|27.9760', 'Balikesir Edremit|39.5950|26.9250', 'Balikesir Ayvalik|39.3180|26.6950', 'Balikesir Burhaniye|39.5010|26.9770', 'Manisa Yunusemre|38.6200|27.4200', 'Manisa Sehzadeler|38.6100|27.4300', 'Manisa Turgutlu|38.5000|27.7000', 'Manisa Akhisar|38.9200|27.8400', 'Manisa Salihli|38.4800|28.1400', 'Manisa Soma|39.1800|27.6100', 'Aydin Efeler|37.8450|27.8450', 'Aydin Kusadasi|37.8600|27.2570', 'Aydin Nazilli|37.9150|28.3200', 'Aydin Didim|37.3850|27.2650', 'Aydin Soke|37.7500|27.4100', 'Aydin Incirliova|37.8500|27.7200', 'Mugla Mentese|37.2150|28.3650', 'Mugla Bodrum|37.0350|27.4300', 'Mugla Fethiye|36.6220|29.1150', 'Mugla Marmaris|36.8550|28.2750', 'Mugla Milas|37.3150|27.7800', 'Mugla Dalaman|36.7700|28.8000', 'Tekirdag Suleymanpasa|40.9780|27.5110', 'Tekirdag Corlu|41.1600|27.8000', 'Tekirdag Cerkezkoy|41.2860|27.9990', 'Tekirdag Kapakli|41.3300|27.9700', 'Tekirdag Muratli|41.1750|27.5100', 'Tekirdag Saray|41.4450|27.9220', 'Hatay Antakya|36.2020|36.1600', 'Hatay Defne|36.2100|36.1500', 'Hatay Iskenderun|36.5850|36.1750', 'Hatay Arsuz|36.4100|35.8900', 'Hatay Samandag|36.0850|35.9800', 'Hatay Reyhanli|36.2670|36.5670', 'Erzurum Yakutiye|39.9000|41.2700', 'Erzurum Palandoken|39.8650|41.2850', 'Erzurum Aziziye|39.9500|41.1000', 'Erzurum Oltu|40.5500|41.9900', 'Erzurum Horasan|40.0400|42.1700', 'Erzurum Pasinler|39.9800|41.6700', 'Malatya Battalgazi|38.3650|38.3100', 'Malatya Yesilyurt|38.3050|38.2500', 'Malatya Akcadag|38.3420|37.9700', 'Malatya Darende|38.5550|37.5000', 'Malatya Dogansehir|38.0900|37.8900', 'Malatya Hekimhan|38.8200|37.9300']

ISSUES = [('Yolda Derin Çukur Oluşmuş', 'Araçların geçişini zorlaştıran derin bir çukur oluşmuş. Özellikle akşam saatlerinde fark edilmesi zor oluyor.', 'road', 'high', 0, 'pending'), ('Kaldırım Taşları Yerinden Çıkmış', 'Kaldırımın bazı bölümlerindeki taşlar yerinden çıkmış ve yayaların takılmasına neden oluyor.', 'road', 'medium', 25, 'in_progress'), ('Sokak Lambası Çalışmıyor', 'Sokak üzerindeki aydınlatma direğinin lambası uzun süredir çalışmıyor ve gece bölge karanlık kalıyor.', 'lighting', 'high', 0, 'pending'), ('Park Aydınlatmaları Yetersiz', 'Park içerisindeki birkaç aydınlatma direği çalışmadığı için akşam saatlerinde görüş mesafesi oldukça azalıyor.', 'lighting', 'medium', 50, 'in_progress'), ('Çöp Konteyneri Taşmış', 'Çöp konteyneri tamamen dolmuş ve çevresine çöpler taşmış durumda. Bölgede kötü koku oluşuyor.', 'trash', 'high', 0, 'pending'), ('Çöp Toplama Gecikmiş', 'Sokaktaki çöp konteynerleri birkaç gündür boşaltılmamış ve yoğunluk nedeniyle çevreye çöp yayılmış.', 'trash', 'medium', 70, 'in_progress'), ('Kaldırıma İnşaat Molozu Bırakılmış', 'İnşaat çalışmasından kalan molozlar kaldırımın üzerine bırakılmış ve yaya geçişini ciddi şekilde daraltıyor.', 'construction', 'high', 0, 'pending'), ('İnşaat Alanında Güvenlik Önlemi Eksik', 'İnşaat alanının çevresindeki bariyerler yetersiz görünüyor ve yayaların çalışma alanına yaklaşması mümkün.', 'construction', 'high', 30, 'in_progress'), ('Su Borusu Patlamış', 'Yol kenarında patlayan su borusu nedeniyle kaldırım ve yol yüzeyine sürekli su akıyor.', 'water', 'high', 50, 'in_progress'), ('Yağmur Suyu Gideri Tıkalı', 'Yağmur sonrası su birikmesine neden olan tıkalı bir gider bulunuyor.', 'water', 'medium', 0, 'pending'), ('Trafik Işığı Arızalı', 'Kavşaktaki trafik ışıklarından biri düzgün çalışmıyor ve araçlar ile yayalar için geçiş karmaşası oluşturuyor.', 'traffic', 'high', 75, 'in_progress'), ('Yaya Geçidi Çizgileri Silinmiş', 'Yaya geçidinin çizgileri büyük ölçüde silinmiş ve sürücülerin geçidi fark etmesi zorlaşmış.', 'traffic', 'medium', 0, 'pending'), ('Hatalı Park Nedeniyle Yol Daralıyor', 'Araçların kaldırım ve yol kenarına düzensiz park etmesi trafik akışını zorlaştırıyor.', 'traffic', 'medium', 25, 'in_progress'), ('Parkta Kırık Banklar Var', 'Park içerisinde bazı bankların tahtaları kırılmış ve kullanılamaz hale gelmiş.', 'park', 'low', 0, 'pending'), ('Çocuk Parkındaki Salıncak Arızalı', 'Çocuk oyun alanındaki salıncağın bağlantı kısmında hasar görülüyor. Kullanım güvenli değil.', 'park', 'high', 100, 'resolved'), ('Gece Gürültüsü Şikayeti', 'Gece geç saatlere kadar devam eden yüksek sesli etkinlik nedeniyle çevrede rahatsızlık oluşuyor.', 'noise', 'medium', 0, 'pending'), ('Sokakta Başıboş Köpekler Var', 'Sokakta çok sayıda başıboş köpek bulunuyor. Özellikle çocukların kullandığı bölgede endişe yaratıyor.', 'animal', 'medium', 0, 'pending'), ('Yaralı Sokak Hayvanı Görüldü', 'Bölgede yaralı görünen bir sokak hayvanı bulunuyor ve acil yardım edilmesi gerekiyor.', 'animal', 'high', 50, 'in_progress'), ('Otobüs Durağı Hasarlı', 'Otobüs durağındaki oturma bölümü ve yan panel hasar görmüş durumda.', 'other', 'medium', 65, 'in_progress'), ('Bisiklet Yolu İşgali Var', 'Bisiklet yolu araçlar tarafından park alanı gibi kullanılıyor ve bisikletlilerin geçişini engelliyor.', 'traffic', 'medium', 0, 'pending'), ('Mahallede Yol Çalışması Yarım Kalmış', 'Kazı sonrası yolun bir bölümü düzgün şekilde kapatılmamış ve yüzeyde düzensizlik oluşmuş.', 'construction', 'high', 85, 'in_progress'), ('Sokak Levhası Yerinden Çıkmış', 'Sokak adı levhası hasar görmüş ve yerinden çıkmak üzere. Adres bulmayı zorlaştırıyor.', 'other', 'low', 0, 'pending'), ('Park Sulama Sistemi Sorunlu', 'Parkın bazı bölümlerinde sulama çalışmıyor ve yeşil alanlar kurumaya başlamış.', 'park', 'low', 30, 'in_progress'), ('Sokakta Su Birikintisi Oluşuyor', 'Yol eğimi ve gider problemi nedeniyle yağmurdan sonra aynı bölgede uzun süre su birikiyor.', 'water', 'medium', 100, 'resolved'), ('Kaldırımda Rampa Eksikliği Var', 'Kaldırım geçişinde erişilebilir rampa bulunmaması nedeniyle tekerlekli sandalye ve bebek arabalarının geçişi zorlaşıyor.', 'road', 'medium', 10, 'in_progress')]

DELAY_SECONDS = 0.35
RETRIES = 3


def main():
    db = next(get_db())
    try:
        user = db.query(User).order_by(User.created_at.asc()).first()
        if not user:
            raise RuntimeError("DB'de en az bir kullanıcı bulunmalı.")

        existing = {
            (r.title, round(float(r.latitude), 6), round(float(r.longitude), 6))
            for r in db.query(Report).all()
        }

        base = datetime.now(timezone.utc)
        added = 0
        skipped = 0
        failed = 0

        print("Seed başlangıcı. Hedef kayıt:", len(LOCATIONS))
        print("Kullanıcı:", user.id)

        for i, raw in enumerate(LOCATIONS, start=1):
            label, lat, lon = raw.split("|")
            lat = float(lat)
            lon = float(lon)
            title, description, category, priority, progress, status = ISSUES[(i - 1) % len(ISSUES)]

            key = (title, round(lat, 6), round(lon, 6))
            if key in existing:
                print(f"[{i}/{len(LOCATIONS)}] ATLANDI: {label}")
                skipped += 1
                continue

            location = None
            last_error = None
            for attempt in range(1, RETRIES + 1):
                try:
                    print(f"[{i}/{len(LOCATIONS)}] Geoapify {attempt}/{RETRIES}: {label}")
                    location = get_location_details(lat, lon)
                    if not location.get("city"):
                        raise RuntimeError("Geoapify city döndürmedi")
                    break
                except Exception as exc:
                    last_error = exc
                    print("  GEOAPIFY ERROR:", exc)
                    if attempt < RETRIES:
                        time.sleep(1.2)

            if not location:
                failed += 1
                print("  BAŞARISIZ, kayıt eklenmedi:", last_error)
                continue

            created_at = base - timedelta(
                days=(i * 3) + (i % 17),
                hours=(i * 5) % 24,
                minutes=(i * 11) % 60,
                seconds=i,
            )

            report = Report(
                user_id=user.id,
                title=title,
                description=description,
                category=category,
                city=location.get("city"),
                municipality=location.get("municipality"),
                district=location.get("district"),
                neighborhood=location.get("neighborhood"),
                address=location.get("address"),
                latitude=lat,
                longitude=lon,
                status=status,
                progress=progress,
                priority=priority,
                view_count=(i * 7) % 121,
                follower_count=(i * 3) % 9,
                created_at=created_at,
            )

            db.add(report)
            db.commit()
            db.refresh(report)

            existing.add(key)
            added += 1

            print("  EKLENDİ:", report.title)
            print("  KONUM:", location)
            print("  TARİH:", created_at.isoformat())
            time.sleep(DELAY_SECONDS)

        print("\n===== SEED TAMAMLANDI =====")
        print("Eklenen:", added)
        print("Atlanan:", skipped)
        print("Başarısız:", failed)

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()