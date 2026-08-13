from datetime import datetime, timedelta

import requests

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Report, User
from app.schemas import ReportCreate, ReportResponse


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
        #
        # created_at aynı olan kayıtların sırasının
        # değişmemesi için id de kullanılıyor.
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
            "category": report.category,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "status": report.status,
            "progress": report.progress,
            "priority": report.priority,
            "view_count": report.view_count,
            "created_at": (
                report.created_at.isoformat()
                if report.created_at
                else None
            ),
        }
        for report in reports
    ]


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
    report = Report(
        user_id=current_user.id,
        title=report_create.title,
        description=report_create.description,
        category=report_create.category,
        latitude=report_create.latitude,
        longitude=report_create.longitude,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

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
            func.count(Report.id).label(
                "count"
            ),
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


# ============================================================
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
        "status": report.status,
        "progress": report.progress,
        "priority": report.priority,
        "view_count": report.view_count,
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
    }
