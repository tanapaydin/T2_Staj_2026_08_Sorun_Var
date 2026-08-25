from fastapi import APIRouter, Depends, Response, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    User,
    Report,
    Comment,
    ReportFollow,
    ReportStatusHistory,
    ReportImage,
    PushSubscription,
    VerificationCode,
)
from app.schemas import (
    AuthResponse,
    EmailChangeConfirm,
    EmailChangeRequest,
    MessageResponse,
    NotificationSettingsResponse,
    NotificationSettingsUpdate,
    PasswordUpdate,
    ProfileUpdate,
    PushTokenRegister,
    UserResponse,
)
from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.services.email_service import send_email
from app.services.verification import (
    CODE_EXPIRY_MINUTES,
    create_verification_code,
    resolve_verification_code,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    changes = (
        profile.model_dump(exclude_unset=True)
        if hasattr(profile, "model_dump")
        else profile.dict(exclude_unset=True)
    )

    if "name" in changes and not changes["name"].strip():
        raise HTTPException(status_code=400, detail="Ad alanı boş olamaz.")

    for key, value in changes.items():
        setattr(current_user, key, value.strip() if isinstance(value, str) and key == "name" else value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/email/request-change", response_model=MessageResponse)
def request_email_change(
    payload: EmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized_email = payload.new_email.lower()

    if normalized_email == current_user.email:
        raise HTTPException(status_code=400, detail="Yeni e-posta mevcut e-postanızla aynı.")

    existing_user = (
        db.query(User)
        .filter(User.email == normalized_email, User.id != current_user.id)
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")

    code = create_verification_code(db, normalized_email, "email_change", user_id=current_user.id)
    send_email(
        to_email=normalized_email,
        subject="Sorun Var - E-posta Değişikliği Doğrulama Kodu",
        body=(
            "E-posta adresinizi değiştirmek için aşağıdaki kodu kullanın.\n\n"
            f"Doğrulama kodunuz: {code}\n\n"
            f"Bu kod {CODE_EXPIRY_MINUTES} dakika içinde geçerliliğini yitirecektir."
        ),
    )
    db.commit()

    return {"message": "Doğrulama kodu yeni e-posta adresinize gönderildi."}


@router.post("/me/email/confirm-change", response_model=AuthResponse)
def confirm_email_change(
    payload: EmailChangeConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = resolve_verification_code(db, "email_change", payload.code, user_id=current_user.id)
    if not record:
        raise HTTPException(status_code=400, detail="Kod geçersiz veya süresi dolmuş.")

    existing_user = (
        db.query(User)
        .filter(User.email == record.email, User.id != current_user.id)
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")

    current_user.email = record.email
    current_user.email_verified = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    access_token = create_access_token(
        {"sub": str(current_user.id), "email": current_user.email}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": current_user,
    }


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def update_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre yanlış.")

    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()


@router.get("/me/notifications", response_model=NotificationSettingsResponse)
def notification_settings(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/me/notifications", response_model=NotificationSettingsResponse)
def update_notification_settings(
    settings: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if hasattr(settings, "model_dump"):
        changes = settings.model_dump(exclude_unset=True)
    else:
        changes = settings.dict(exclude_unset=True)
    for key, value in changes.items():
        setattr(current_user, key, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/push-token", status_code=status.HTTP_204_NO_CONTENT)
def register_push_token(
    registration: PushTokenRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(PushSubscription)
        .filter(PushSubscription.token == registration.token)
        .first()
    )

    if subscription is None:
        subscription = PushSubscription(token=registration.token)

    subscription.user_id = current_user.id
    if registration.latitude is not None:
        subscription.latitude = registration.latitude
    if registration.longitude is not None:
        subscription.longitude = registration.longitude
    db.add(subscription)
    db.commit()


@router.delete("/me/push-token", status_code=status.HTTP_204_NO_CONTENT)
def unregister_push_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(PushSubscription).filter(
        PushSubscription.token == token,
        PushSubscription.user_id == current_user.id,
    ).delete(synchronize_session=False)
    db.commit()


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
        db.query(VerificationCode).filter(
            VerificationCode.user_id == current_user.id
        ).delete(synchronize_session=False)

        owned_report_ids = [
            report_id
            for (report_id,) in db.query(Report.id)
            .filter(Report.user_id == current_user.id)
            .all()
        ]

        db.query(PushSubscription).filter(
            PushSubscription.user_id == current_user.id
        ).delete(synchronize_session=False)

        db.query(ReportFollow).filter(
            ReportFollow.user_id == current_user.id
        ).delete(synchronize_session=False)

        if owned_report_ids:
            db.query(ReportFollow).filter(
                ReportFollow.report_id.in_(owned_report_ids)
            ).delete(synchronize_session=False)
            db.query(ReportImage).filter(
                ReportImage.report_id.in_(owned_report_ids)
            ).delete(synchronize_session=False)
            db.query(Comment).filter(
                Comment.report_id.in_(owned_report_ids)
            ).delete(synchronize_session=False)
            db.query(ReportStatusHistory).filter(
                ReportStatusHistory.report_id.in_(owned_report_ids)
            ).delete(synchronize_session=False)
            db.query(Report).filter(
                Report.id.in_(owned_report_ids)
            ).delete(synchronize_session=False)

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

