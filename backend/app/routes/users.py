from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import UserResponse
from app.models import User, Report, ReportFollow

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

# ============================================================
# MY FOLLOWED REPORTS
# ============================================================

@router.get("/me/following")
def my_followed_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follows = (
        db.query(ReportFollow, Report)
        .join(
            Report,
            Report.id == ReportFollow.report_id,
        )
        .filter(
            ReportFollow.user_id == current_user.id
        )
        .order_by(
            ReportFollow.created_at.desc()
        )
        .all()
    )

    return [
        {
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
            "follower_count": report.follower_count or 0,
            "created_at": (
                report.created_at.isoformat()
                if report.created_at
                else None
            ),
            "followed_at": (
                follow.created_at.isoformat()
                if follow.created_at
                else None
            ),
        }
        for follow, report in follows
    ]
