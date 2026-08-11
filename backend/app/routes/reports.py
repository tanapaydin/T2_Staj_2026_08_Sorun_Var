from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Report, User
from app.schemas import ReportCreate, ReportResponse


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# ============================================================
# REPORTS
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
    # Filters
    # --------------------------------------------------------

    if category and category != "all":
        query = query.filter(
            Report.category == category
        )

    if resolved is True:
        query = query.filter(
            Report.progress == 100
        )

    elif resolved is False:
        query = query.filter(
            Report.progress < 100
        )

    if priority:
        query = query.filter(
            Report.priority == priority
        )

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

        # newest
        query = query.order_by(
            Report.created_at.desc(),
            Report.id.desc(),
        )

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    reports = (
        query
        .offset(skip)
        .limit(limit)
        .all()
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
# REPORT STATISTICS
# ============================================================

@router.get("/statistics")
def get_statistics(
    db: Session = Depends(get_db),
):
    print("STATISTICS REQUEST")

    total_reports = (
        db.query(Report)
        .count()
    )

    resolved_reports = (
        db.query(Report)
        .filter(
            Report.progress == 100
        )
        .count()
    )

    pending_reports = (
        db.query(Report)
        .filter(
            Report.progress < 100
        )
        .count()
    )

    average_progress = (
        db.query(
            func.avg(Report.progress)
        )
        .scalar()
    )

    if average_progress is None:
        average_progress = 0

    if total_reports > 0:
        resolution_rate = (
            resolved_reports /
            total_reports
        ) * 100
    else:
        resolution_rate = 0

    result = {
        "total_reports": total_reports,
        "resolved_reports": resolved_reports,
        "pending_reports": pending_reports,
        "average_progress": float(
            average_progress
        ),
        "resolution_rate": float(
            resolution_rate
        ),
    }

    print(
        "STATISTICS RESULT:",
        result
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
            func.count(Report.id)
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

    print(
        "CATEGORY STATISTICS RESULT:",
        response
    )

    return response
