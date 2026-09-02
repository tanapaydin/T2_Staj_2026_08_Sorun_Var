from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification, User
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(notification.id),
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "report_id": str(notification.report_id)
            if notification.report_id
            else None,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
        }
        for notification in notifications
    ]


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bildirim bulunamadı.",
        )

    notification.is_read = True
    db.commit()

    return {"message": "Bildirim okundu."}


@router.patch("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update(
            {"is_read": True},
            synchronize_session=False,
        )
    )

    db.commit()

    return {"message": "Tüm bildirimler okundu."}
