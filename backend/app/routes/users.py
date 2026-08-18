from fastapi import APIRouter, Depends, Response, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Report, Comment, ReportFollow, ReportStatusHistory
from app.schemas import UserResponse

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


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Remove reports created by the user (Report cascade will remove images, comments, history)
    try:
        db.query(Report).filter(Report.user_id == current_user.id).delete(synchronize_session=False)

        # Remove comments authored by the user on other reports
        db.query(Comment).filter(Comment.user_id == current_user.id).delete(synchronize_session=False)

        # Remove status history items changed by this user
        db.query(ReportStatusHistory).filter(ReportStatusHistory.changed_by == current_user.id).delete(synchronize_session=False)

        # Finally remove the user record (load with this session to avoid cross-session issues)
        user = db.query(User).filter(User.id == current_user.id).first()
        if user:
            db.delete(user)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kullanıcı silinirken hata oluştu.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)

