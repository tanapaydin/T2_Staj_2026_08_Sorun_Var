import os

import requests


GEOAPIFY_API_KEY = os.getenv(
    "GEOAPIFY_API_KEY"
)


REGION_KEYWORDS = [
    "bölgesi",
    "region",
]


def clean_text(
    value: str | None,
) -> str | None:
    if not value:
        return None

    value = value.strip()

    return value or None


def normalize_city(
    value: str | None,
) -> str | None:
    if not value:
        return None

    value = value.strip()

    suffixes = [
        " Merkez İlçe",
        " Merkez",
        " Belediyesi",
    ]

    for suffix in suffixes:
        if value.endswith(suffix):
            value = value[
                : -len(suffix)
            ].strip()

    return value or None


def is_region(
    value: str | None,
) -> bool:
    if not value:
        return False

    lowered = value.strip().lower()

    return any(
        keyword in lowered
        for keyword in REGION_KEYWORDS
    )


def get_location_details(
    latitude: float,
    longitude: float,
) -> dict[str, str | None]:

    if not GEOAPIFY_API_KEY:
        raise RuntimeError(
            "GEOAPIFY_API_KEY tanımlı değil."
        )

    response = requests.get(
        "https://api.geoapify.com/v1/geocode/reverse",
        params={
            "lat": latitude,
            "lon": longitude,
            "apiKey": GEOAPIFY_API_KEY,
            "lang": "tr",
            "format": "json",
        },
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    results = (
        data.get("features")
        or data.get("results")
        or []
    )

    if not results:
        print(
            "GEOAPIFY EMPTY RESPONSE:",
            data,
        )

        return {
            "city": None,
            "municipality": None,
            "district": None,
            "neighborhood": None,
            "address": None,
        }

    first_result = results[0]

    properties = first_result.get(
        "properties",
        first_result,
    )

    print(
        "GEOAPIFY PROPERTIES:",
        properties,
    )

    # =========================================================
    # HAM ALANLAR
    # =========================================================

    state = clean_text(
        properties.get("state")
    )

    county = clean_text(
        properties.get("county")
    )

    raw_city = clean_text(
        properties.get("city")
    )

    town = clean_text(
        properties.get("town")
    )

    county_district = clean_text(
        properties.get(
            "county_district"
        )
    )

    raw_district = clean_text(
        properties.get("district")
    )

    city_district = clean_text(
        properties.get("city_district")
    )

    # =========================================================
    # İL / İLÇE
    # =========================================================

    city = None
    district = None

    normalized_raw_city = normalize_city(
        raw_city
    )

    normalized_county = normalize_city(
        county
    )

    # ---------------------------------------------------------
    # 1) STATE BÖLGE İSE
    #
    # Örnek:
    #
    # state  = İç Anadolu Bölgesi
    # county = Ankara
    # city   = Etimesgut
    #
    # => Ankara / Etimesgut
    #
    # Örnek:
    #
    # state  = Marmara Bölgesi
    # county = Bursa
    # city   = Nilüfer
    #
    # => Bursa / Nilüfer
    # ---------------------------------------------------------

    if is_region(state) and county:

        city = normalized_county

        if (
            normalized_raw_city
            and normalized_raw_city != city
        ):
            district = (
                normalized_raw_city
            )

    # ---------------------------------------------------------
    # 2) STATE DOĞRUDAN İL İSE
    #
    # Örnek:
    #
    # state  = Ankara
    # county = Çankaya
    # city   = Ankara
    #
    # => Ankara / Çankaya
    #
    # Örnek:
    #
    # state  = İstanbul
    # county = Fatih
    # city   = İstanbul
    #
    # => İstanbul / Fatih
    # ---------------------------------------------------------

    elif state and county:

        city = normalize_city(
            state
        )

        district = normalized_county

    # ---------------------------------------------------------
    # 3) STATE YOKSA
    # ---------------------------------------------------------

    else:

        if (
            normalized_county
            and normalized_raw_city
            and normalized_county
            != normalized_raw_city
        ):
            city = normalized_county

            district = (
                normalized_raw_city
            )

        elif normalized_county:

            city = normalized_county

            district = (
                town
                or county_district
            )

        elif normalized_raw_city:

            city = normalized_raw_city

    # =========================================================
    # İLÇE FALLBACK
    # =========================================================

    if not district:

        district = (
            town
            or county_district
            or raw_district
            or city_district
        )

    if district:
        district = district.strip()

        district_lower = (
            district
            .lower()
            .replace("ı", "i")
            .replace("ş", "s")
            .replace("ğ", "g")
            .replace("ç", "c")
            .replace("ö", "o")
            .replace("ü", "u")
        )

        # Belediye sınırı ilçe değildir.
        if "belediye siniri" in district_lower:
            district = None

    # İl ve ilçe aynıysa ilçe bilgisini sil.
    if city and district:

        if (
            normalize_city(district)
            == normalize_city(city)
        ):
            district = None

    # =========================================================
    # MAHALLE
    # =========================================================

    neighborhood = clean_text(
        properties.get("suburb")
        or properties.get(
            "neighbourhood"
        )
        or properties.get(
            "neighborhood"
        )
        or properties.get(
            "quarter"
        )
    )

    # =========================================================
    # BELEDİYE
    # =========================================================

    municipality = None

    # =========================================================
    # ADRES
    # =========================================================

    address = clean_text(
        properties.get("formatted")
    )

    result = {
        "city": city,
        "municipality": municipality,
        "district": district,
        "neighborhood": neighborhood,
        "address": address,
    }

    print(
        "NORMALIZED LOCATION:",
        result,
    )

    return result