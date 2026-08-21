from datetime import datetime, timedelta
from uuid import UUID

import requests

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Report, User, ReportFollow
from app.schemas import ReportCreate, ReportResponse, ReportUpdate
from app.services.geocoding import get_location_details
from app.services.push_notifications import notify_nearby_users
from app.services.push_notifications import notify_report_followers


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# ============================================================
# REPORT LIST
# ============================================================

@router.get("/")
def list_reports(
    category: str | None = None,
    resolved: bool | None = None,
    priority: str | None = None,
    date: str | None = None,
    sort: str = "newest",

    city: str | None = None,
    district: str | None = None,

    # Pagination
    skip: int = Query(
        0,
        ge=0,
    ),

    limit: int = Query(
        10,
        ge=1,
        le=50,
    ),

    db: Session = Depends(get_db),
):
    query = db.query(Report)

    # --------------------------------------------------------
    # Category filter
    # --------------------------------------------------------

    if category and category != "all":
        query = query.filter(
            Report.category == category
        )

    # --------------------------------------------------------
    # Resolved / unresolved filter
    # --------------------------------------------------------

    if resolved is True:
        query = query.filter(
            Report.progress == 100
        )

    elif resolved is False:
        query = query.filter(
            Report.progress < 100
        )

    # --------------------------------------------------------
    # Priority filter
    # --------------------------------------------------------

    if priority:
        query = query.filter(
            Report.priority == priority
        )


    # --------------------------------------------------------
    # City filter
    # --------------------------------------------------------

    if city:
        query = query.filter(
            Report.city == city
        )

    # --------------------------------------------------------
    # District filter
    # --------------------------------------------------------

    if district:
        query = query.filter(
            Report.district == district
        )

    # --------------------------------------------------------
    # Date filter
    # --------------------------------------------------------

    if date:
        now = datetime.utcnow()

        if date == "today":
            start = now.replace(
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

            query = query.filter(
                Report.created_at >= start
            )

        elif date == "7d":
            start = now - timedelta(days=7)

            query = query.filter(
                Report.created_at >= start
            )

        elif date == "30d":
            start = now - timedelta(days=30)

            query = query.filter(
                Report.created_at >= start
            )

    # --------------------------------------------------------
    # Sorting
    # --------------------------------------------------------

    if sort == "oldest":

        query = query.order_by(
            Report.created_at.asc(),
            Report.id.asc(),
        )

    elif sort == "most_viewed":

        query = query.order_by(
            Report.view_count.desc(),
            Report.created_at.desc(),
            Report.id.desc(),
        )

    else:

        # Default: newest
        query = query.order_by(
            Report.created_at.desc(),
            Report.id.desc(),
        )

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    print(
        f"REPORTS PAGINATION -> "
        f"skip={skip}, limit={limit}"
    )

    reports = (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )

    print(
        f"REPORTS RETURNED -> "
        f"{len(reports)}"
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return [
        {
            "id": str(report.id),
            "title": report.title,
            "description": report.description,
            "category": report.category,

            "latitude": report.latitude,
            "longitude": report.longitude,

            "city": report.city,
            "municipality": report.municipality,
            "district": report.district,
            "neighborhood": report.neighborhood,
            "address": report.address,

            "status": report.status,
            "progress": report.progress,
            "priority": report.priority,
            "view_count": report.view_count,
            "follower_count": report.follower_count or 0,

            "created_at": (
                report.created_at.isoformat()
                if report.created_at
                else None
            ),
        }
        for report in reports
    ]


# ============================================================
# MAP REPORT LIST
# ============================================================

@router.get("/map")
def list_map_reports(
    north: float | None = Query(None, ge=-90, le=90),
    south: float | None = Query(None, ge=-90, le=90),
    east: float | None = Query(None, ge=-180, le=180),
    west: float | None = Query(None, ge=-180, le=180),
    city: str | None = None,
    district: str | None = None,
    category: str | None = None,
    resolved: bool | None = None,
    priority: str | None = None,
    date: str | None = None,
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Return map markers and whether the user should zoom in further."""

    bounds = (north, south, east, west)
    has_any_bound = any(value is not None for value in bounds)
    has_all_bounds = all(value is not None for value in bounds)

    if has_any_bound and not has_all_bounds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Harita alanı için dört sınırın tamamı gereklidir.",
        )

    if has_all_bounds:
        assert north is not None
        assert south is not None
        assert east is not None
        assert west is not None

        if south >= north or west >= east:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Harita sınırları geçerli değil.",
            )

    query = db.query(Report)

    if has_all_bounds:
        query = query.filter(
            Report.latitude >= south,
            Report.latitude <= north,
            Report.longitude >= west,
            Report.longitude <= east,
        )

    if city:
        query = query.filter(Report.city == city)

    if district:
        query = query.filter(Report.district == district)

    if category and category != "all":
        query = query.filter(Report.category == category)

    if resolved is True:
        query = query.filter(Report.progress == 100)
    elif resolved is False:
        query = query.filter(Report.progress < 100)

    if priority:
        query = query.filter(Report.priority == priority)

    if date:
        now = datetime.utcnow()

        if date == "today":
            start = now.replace(
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )
            query = query.filter(Report.created_at >= start)
        elif date == "7d":
            query = query.filter(
                Report.created_at >= now - timedelta(days=7)
            )
        elif date == "30d":
            query = query.filter(
                Report.created_at >= now - timedelta(days=30)
            )

    fetched_reports = (
        query
        .order_by(
            Report.created_at.desc(),
            Report.id.desc(),
        )
        .limit(limit + 1)
        .all()
    )
    has_more = len(fetched_reports) > limit
    reports = fetched_reports[:limit]

    return {
        "reports": [
            {
                "id": str(report.id),
                "title": report.title,
                "description": report.description,
                "category": report.category,
                "latitude": report.latitude,
                "longitude": report.longitude,
                "city": report.city,
                "municipality": report.municipality,
                "district": report.district,
                "neighborhood": report.neighborhood,
                "address": report.address,
                "status": report.status,
                "progress": report.progress,
                "priority": report.priority,
                "view_count": report.view_count,
                "follower_count": report.follower_count or 0,
                "created_at": (
                    report.created_at.isoformat()
                    if report.created_at
                    else None
                ),
            }
            for report in reports
        ],
        "has_more": has_more,
        "max_results": limit,
    }


# ============================================================
# MAP OVERVIEW
# ============================================================

@router.get("/map/summary")
def get_map_summary(
    db: Session = Depends(get_db),
):
    """Return complete map totals without transferring report content."""

    total_reports = db.query(func.count(Report.id)).scalar() or 0
    location_rows = (
        db.query(
            Report.city,
            Report.district,
            func.count(Report.id).label("count"),
        )
        .group_by(Report.city, Report.district)
        .all()
    )
    category_rows = (
        db.query(
            Report.category,
            func.count(Report.id).label("count"),
        )
        .group_by(Report.category)
        .order_by(func.count(Report.id).desc())
        .all()
    )

    cities: dict[str, dict] = {}

    for raw_city, raw_district, count in location_rows:
        city = (raw_city or "").strip() or "Bilinmeyen il"
        district = (raw_district or "").strip() or "Bilinmeyen ilçe"
        city_item = cities.setdefault(
            city,
            {
                "city": city,
                "count": 0,
                "districts": {},
            },
        )
        city_item["count"] += int(count)
        city_item["districts"][district] = (
            city_item["districts"].get(district, 0) + int(count)
        )

    city_response = []

    for city_item in cities.values():
        city_response.append(
            {
                "city": city_item["city"],
                "count": city_item["count"],
                "districts": sorted(
                    [
                        {
                            "district": district,
                            "count": count,
                        }
                        for district, count in city_item["districts"].items()
                    ],
                    key=lambda item: item["count"],
                    reverse=True,
                ),
            }
        )

    city_response.sort(
        key=lambda item: item["count"],
        reverse=True,
    )

    return {
        "total_reports": int(total_reports),
        "cities": city_response,
        "categories": [
            {
                "category": category or "other",
                "count": int(count),
            }
            for category, count in category_rows
        ],
    }


# ============================================================
# CREATE REPORT
# ============================================================

@router.post(
    "/",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    report_create: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    location = {
        "city": None,
        "municipality": None,
        "district": None,
        "neighborhood": None,
        "address": None,
    }

    try:
        location = get_location_details(
            report_create.latitude,
            report_create.longitude,
        )

        print(
            "GEOLOCATION RESULT:",
            location,
        )

    except Exception as error:
        # Reverse geocoding başarısız olursa
        # rapor oluşturmayı engellemiyoruz.
        print(
            "GEOLOCATION ERROR:",
            error,
        )

    report = Report(
        user_id=current_user.id,

        title=report_create.title,
        description=report_create.description,
        category=report_create.category,

        latitude=report_create.latitude,
        longitude=report_create.longitude,

        city=location["city"],
        municipality=location["municipality"],
        district=location["district"],
        neighborhood=location["neighborhood"],
        address=location["address"],
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    notify_nearby_users(db, report, current_user)

    return report


# ============================================================
# GENERAL STATISTICS
# ============================================================

@router.get("/statistics")
def get_statistics(
    db: Session = Depends(get_db),
):
    print("STATISTICS REQUEST")

    # --------------------------------------------------------
    # Total reports
    # --------------------------------------------------------

    total_reports = (
        db.query(Report)
        .count()
    )

    # --------------------------------------------------------
    # Resolved reports
    # --------------------------------------------------------

    resolved_reports = (
        db.query(Report)
        .filter(
            Report.progress == 100
        )
        .count()
    )

    # --------------------------------------------------------
    # Pending reports
    # --------------------------------------------------------

    pending_reports = (
        db.query(Report)
        .filter(
            Report.progress < 100
        )
        .count()
    )

    # --------------------------------------------------------
    # Average progress
    # --------------------------------------------------------

    average_progress = (
        db.query(
            func.avg(Report.progress)
        )
        .scalar()
    )

    if average_progress is None:
        average_progress = 0

    # --------------------------------------------------------
    # Resolution rate
    # --------------------------------------------------------

    if total_reports > 0:
        resolution_rate = (
            resolved_reports
            / total_reports
            * 100
        )
    else:
        resolution_rate = 0

    result = {
        "total_reports": total_reports,
        "resolved_reports": resolved_reports,
        "pending_reports": pending_reports,
        "average_progress": round(
            float(average_progress),
            2,
        ),
        "resolution_rate": round(
            float(resolution_rate),
            2,
        ),
    }

    print(
        "STATISTICS RESULT:",
        result,
    )

    return result


# ============================================================
# SCOPE STATISTICS
# ============================================================

@router.get("/statistics/scope")
def get_scope_statistics(
    city: str | None = None,
    district: str | None = None,
    db: Session = Depends(get_db),
):
    """Return aggregate data for a report scope without loading its reports."""

    query = db.query(Report)

    if city:
        query = query.filter(Report.city == city)

    if district:
        query = query.filter(Report.district == district)

    summary = query.with_entities(
        func.count(Report.id).label("total_reports"),
        func.coalesce(
            func.sum(
                case(
                    (Report.progress == 100, 1),
                    else_=0,
                )
            ),
            0,
        ).label("resolved_reports"),
        func.coalesce(
            func.avg(Report.progress),
            0,
        ).label("average_progress"),
    ).one()

    total_reports = int(summary.total_reports or 0)
    resolved_reports = int(summary.resolved_reports or 0)

    category_rows = (
        query.with_entities(
            Report.category,
            func.count(Report.id).label("count"),
        )
        .group_by(Report.category)
        .order_by(func.count(Report.id).desc())
        .all()
    )

    return {
        "total_reports": total_reports,
        "resolved_reports": resolved_reports,
        "pending_reports": total_reports - resolved_reports,
        "average_progress": round(
            float(summary.average_progress or 0),
            2,
        ),
        "resolution_rate": round(
            resolved_reports / total_reports * 100
            if total_reports
            else 0,
            2,
        ),
        "categories": [
            {
                "category": category,
                "count": int(count),
            }
            for category, count in category_rows
        ],
    }


# ============================================================
# TOP STATISTICS
# ============================================================

@router.get("/statistics/top")
def get_top_statistics(
    period: str = "all",
    db: Session = Depends(get_db),
):
    if period not in {
        "all",
        "month",
        "week",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Geçersiz dönem. "
                "all, month veya week "
                "kullanılmalı."
            ),
        )

    query = db.query(Report)

    # --------------------------------------------------------
    # PERIOD FILTER
    # --------------------------------------------------------

    if period == "week":
        start = (
            datetime.utcnow()
            - timedelta(days=7)
        )

        query = query.filter(
            Report.created_at >= start
        )

    elif period == "month":
        start = (
            datetime.utcnow()
            - timedelta(days=30)
        )

        query = query.filter(
            Report.created_at >= start
        )

    # --------------------------------------------------------
    # EN ÇOK ŞİKAYET EDİLEN KATEGORİ
    # --------------------------------------------------------

    top_category = (
        query
        .with_entities(
            Report.category,
            func.count(
                Report.id
            ).label("count"),
        )
        .group_by(
            Report.category
        )
        .order_by(
            func.count(
                Report.id
            ).desc()
        )
        .first()
    )

    # --------------------------------------------------------
    # EN ÇOK ŞİKAYET OLAN İL
    # --------------------------------------------------------

    top_city = (
        query
        .filter(
            Report.city.isnot(None),
            Report.city != "",
        )
        .with_entities(
            Report.city,
            func.count(
                Report.id
            ).label("count"),
        )
        .group_by(
            Report.city
        )
        .order_by(
            func.count(
                Report.id
            ).desc()
        )
        .first()
    )

    # --------------------------------------------------------
    # ÖNCELİK DAĞILIMI
    # --------------------------------------------------------

    priority_results = (
        query
        .with_entities(
            Report.priority,
            func.count(
                Report.id
            ).label("count"),
        )
        .group_by(
            Report.priority
        )
        .all()
    )

    # Her zaman tüm önceliklerin
    # response içinde bulunmasını sağlıyoruz.
    priority_counts = {
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    for priority, count in priority_results:
        if priority in priority_counts:
            priority_counts[
                priority
            ] = count

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    result = {
        "top_category": (
            {
                "category": top_category[0],
                "count": top_category[1],
            }
            if top_category
            else None
        ),

        "top_city": (
            {
                "city": top_city[0],
                "count": top_city[1],
            }
            if top_city
            else None
        ),

        "priority_counts": (
            priority_counts
        ),
    }

    print(
        "TOP STATISTICS:",
        result,
    )

    return result


# ============================================================
# CATEGORY STATISTICS
# ============================================================

@router.get("/statistics/category")
def get_category_statistics(
    db: Session = Depends(get_db),
):
    print(
        "CATEGORY STATISTICS REQUEST"
    )

    results = (
        db.query(
            Report.category,
            func.count(
                Report.id
            ).label("count"),
        )
        .group_by(
            Report.category
        )
        .all()
    )

    response = [
        {
            "category": category,
            "count": count,
        }
        for category, count in results
    ]

    # En çok rapor bulunan kategori üstte
    response.sort(
        key=lambda item: item["count"],
        reverse=True,
    )

    print(
        "CATEGORY STATISTICS RESULT:",
        response,
    )

    return response


# LOCATION SEARCH
# ============================================================

@router.get("/search")
def search_location(
    query: str,
):
    url = (
        "https://nominatim.openstreetmap.org/search"
    )

    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "tr",
    }

    headers = {
        "User-Agent": "SorunVar/1.0",
    }

    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    if not data:
        return {
            "message": "Location not found"
        }

    result = data[0]

    return {
        "name": result["display_name"],
        "latitude": float(
            result["lat"]
        ),
        "longitude": float(
            result["lon"]
        ),
        "latitudeDelta": 0.08,
        "longitudeDelta": 0.08,
    }


# ============================================================
# LOCATION SUGGESTIONS
# ============================================================

@router.get("/search/suggestions")
def search_suggestions(
    query: str = Query(
        ...,
        min_length=2,
    ),
):
    url = (
        "https://nominatim.openstreetmap.org/search"
    )

    params = {
        "q": query,
        "format": "jsonv2",
        "countrycodes": "tr",
        "limit": 8,
        "addressdetails": 1,
        "extratags": 1,
        "namedetails": 1,
    }

    headers = {
        "User-Agent": "SorunVar/1.0",
    }

    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=10,
    )

    response.raise_for_status()

    results = response.json()

    suggestions = []

    for item in results:
        address = item.get(
            "address",
            {},
        )

        municipality = (
            address.get("municipality")
            or address.get("city_district")
            or address.get("town")
            or address.get("city")
            or address.get("county")
        )

        city = (
            address.get("city")
            or address.get("state")
            or address.get("province")
            or municipality
        )

        if not municipality:
            continue

        name = (
            f"{municipality} Belediyesi, "
            f"{city}"
        )

        suggestions.append(
            {
                "name": name,
                "city": city,
                "municipality": municipality,
                "latitude": float(
                    item["lat"]
                ),
                "longitude": float(
                    item["lon"]
                ),
            }
        )

    # --------------------------------------------------------
    # Duplicate temizleme
    # --------------------------------------------------------

    unique = []
    seen = set()

    for suggestion in suggestions:
        if suggestion["name"] not in seen:
            unique.append(suggestion)
            seen.add(
                suggestion["name"]
            )

    # --------------------------------------------------------
    # Yazılan metinle başlayanları öne al
    # --------------------------------------------------------

    q = query.lower()

    unique.sort(
        key=lambda item: (
            not item["name"]
            .lower()
            .startswith(q),
            len(item["name"]),
        )
    )

    return unique


# ============================================================
# FOLLOW REPORT
# ============================================================

@router.patch("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: UUID,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if report.user_id != current_user.id and current_user.role not in {"admin", "municipality"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu raporu güncelleme yetkiniz yok.")

    changes = report_update.model_dump(exclude_unset=True) if hasattr(report_update, "model_dump") else report_update.dict(exclude_unset=True)
    if not changes:
        return report

    for key, value in changes.items():
        setattr(report, key, value)

    db.add(report)
    db.commit()
    db.refresh(report)
    notify_report_followers(
        db,
        report,
        "Takip ettiğiniz sorun güncellendi",
        f"Durum: {report.status}, ilerleme: %{report.progress}",
        current_user.id,
    )
    return report

@router.post("/{report_id}/follow")
def follow_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    existing_follow = (
        db.query(ReportFollow)
        .filter(
            ReportFollow.report_id
            == report_id,
            ReportFollow.user_id
            == current_user.id,
        )
        .first()
    )

    if existing_follow:
        return {
            "following": True,
            "follower_count":
                report.follower_count
                or 0,
        }

    follow = ReportFollow(
        report_id=report_id,
        user_id=current_user.id,
    )

    db.add(follow)

    report.follower_count = (
        report.follower_count or 0
    ) + 1

    db.commit()
    db.refresh(report)

    return {
        "following": True,
        "follower_count":
            report.follower_count,
    }


# ============================================================
# UNFOLLOW REPORT
# ============================================================

@router.delete("/{report_id}/follow")
def unfollow_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    existing_follow = (
        db.query(ReportFollow)
        .filter(
            ReportFollow.report_id
            == report_id,
            ReportFollow.user_id
            == current_user.id,
        )
        .first()
    )

    if not existing_follow:
        return {
            "following": False,
            "follower_count":
                report.follower_count
                or 0,
        }

    db.delete(existing_follow)

    report.follower_count = max(
        (report.follower_count or 0) - 1,
        0,
    )

    db.commit()
    db.refresh(report)

    return {
        "following": False,
        "follower_count":
            report.follower_count,
    }


# ============================================================
# GET SINGLE REPORT
# ============================================================

@router.get("/{report_id}")
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
):
    report = (
        db.query(Report)
        .filter(
            Report.id == report_id
        )
        .first()
    )

    if not report:
        return {
            "message": "Report not found"
        }

    return {
        "id": str(report.id),
        "title": report.title,
        "description": report.description,
        "category": report.category,

        "latitude": report.latitude,
        "longitude": report.longitude,

        "city": report.city,
        "municipality": report.municipality,
        "district": report.district,
        "neighborhood": report.neighborhood,
        "address": report.address,

        "status": report.status,
        "progress": report.progress,
        "priority": report.priority,
        "view_count": report.view_count,
        "follower_count":
            report.follower_count or 0,

        "created_at": (
            report.created_at.isoformat()
            if report.created_at
            else None
        ),

        "updated_at": (
            report.updated_at.isoformat()
            if report.updated_at
            else None
        ),

        "image_urls": [
            image.image_url
            for image in report.images
        ],
    }
