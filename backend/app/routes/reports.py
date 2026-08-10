from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import requests

from app.database import get_db
from app.models import Report

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/")
def list_reports(
    category: str | None = None,
    resolved: bool | None = None,
    priority: str | None = None,
    date: str | None = None,
    sort: str = "newest",
    db: Session = Depends(get_db),
):
    query = db.query(Report)

    # Category filter
    if category and category != "all":
        query = query.filter(Report.category == category)

    # Resolved / unresolved filter
    if resolved is True:
        query = query.filter(Report.progress == 100)
    elif resolved is False:
        query = query.filter(Report.progress < 100)

    # Priority filter
    if priority:
        query = query.filter(Report.priority == priority)

    # Date filter
    if date:
        now = datetime.utcnow()

        if date == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(Report.created_at >= start)

        elif date == "7d":
            query = query.filter(Report.created_at >= now - timedelta(days=7))

        elif date == "30d":
            query = query.filter(Report.created_at >= now - timedelta(days=30))

    # Sorting
    if sort == "oldest":
        query = query.order_by(Report.created_at.asc())
    elif sort == "most_viewed":
        query = query.order_by(Report.view_count.desc())
    else:
        query = query.order_by(Report.created_at.desc())

    reports = query.all()

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
            "created_at": report.created_at,
        }
        for report in reports
    ]


@router.get("/statistics")
def report_statistics(db: Session = Depends(get_db)):
    total_reports = db.query(func.count(Report.id)).scalar() or 0

    resolved_reports = (
        db.query(func.count(Report.id))
        .filter(Report.progress == 100)
        .scalar()
        or 0
    )

    pending_reports = (
        db.query(func.count(Report.id))
        .filter(Report.progress < 100)
        .scalar()
        or 0
    )

    average_progress = (
        db.query(func.avg(Report.progress)).scalar()
        or 0
    )

    resolution_rate = (
        (resolved_reports / total_reports) * 100
        if total_reports > 0
        else 0
    )

    return {
        "total_reports": total_reports,
        "resolved_reports": resolved_reports,
        "pending_reports": pending_reports,
        "average_progress": round(float(average_progress), 1),
        "resolution_rate": round(float(resolution_rate), 1),
    }


@router.get("/statistics/category")
def category_statistics(db: Session = Depends(get_db)):
    results = (
        db.query(
            Report.category,
            func.count(Report.id).label("count")
        )
        .group_by(Report.category)
        .all()
    )

    return [
        {
            "category": category,
            "count": count,
        }
        for category, count in results
    ]


@router.get("/search")
def search_location(query: str):
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "tr",
    }

    headers = {
        "User-Agent": "SorunVar/1.0"
    }

    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=10,
    )

    data = response.json()

    if not data:
        return {"message": "Location not found"}

    result = data[0]

    return {
        "name": result["display_name"],
        "latitude": float(result["lat"]),
        "longitude": float(result["lon"]),
        "latitudeDelta": 0.08,
        "longitudeDelta": 0.08,
    }


@router.get("/search/suggestions")
def search_suggestions(query: str = Query(..., min_length=2)):
    url = "https://nominatim.openstreetmap.org/search"

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
        "User-Agent": "SorunVar/1.0"
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
        address = item.get("address", {})

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

        name = f"{municipality} Belediyesi, {city}"

        suggestions.append(
            {
                "name": name,
                "latitude": float(item["lat"]),
                "longitude": float(item["lon"]),
            }
        )

    # Aynı belediyeyi tekrar etme
    unique = []
    seen = set()

    for s in suggestions:
        if s["name"] not in seen:
            unique.append(s)
            seen.add(s["name"])

    # Yazılan metinle başlayanları öne al
    q = query.lower()

    unique.sort(
        key=lambda x: (
            not x["name"].lower().startswith(q),
            len(x["name"]),
        )
    )

    return unique


@router.get("/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        return {"message": "Report not found"}

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
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }