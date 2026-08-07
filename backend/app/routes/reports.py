from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

import requests

from app.database import get_db
from app.models import Report

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)




@router.get("/")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()

    result = []

    for report in reports:
        result.append(
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
        )

    return result


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