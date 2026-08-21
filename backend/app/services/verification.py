import random
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import VerificationCode
from app.utils.security import hash_password, verify_password

CODE_EXPIRY_MINUTES = 3
CODE_LENGTH = 6


def generate_code() -> str:
    return "".join(random.choices(string.digits, k=CODE_LENGTH))


def create_verification_code(
    db: Session,
    email: str,
    purpose: str,
    user_id=None,
) -> str:
    normalized_email = email.lower()

    # Invalidate any earlier unused codes for the same email/purpose.
    db.query(VerificationCode).filter(
        VerificationCode.email == normalized_email,
        VerificationCode.purpose == purpose,
        VerificationCode.consumed.is_(False),
    ).update({"consumed": True})

    code = generate_code()
    record = VerificationCode(
        user_id=user_id,
        email=normalized_email,
        code_hash=hash_password(code),
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES),
    )
    db.add(record)
    db.flush()

    return code


def resolve_verification_code(
    db: Session,
    purpose: str,
    code: str,
    email: str | None = None,
    user_id=None,
) -> VerificationCode | None:
    query = db.query(VerificationCode).filter(
        VerificationCode.purpose == purpose,
        VerificationCode.consumed.is_(False),
    )

    if email:
        query = query.filter(VerificationCode.email == email.lower())
    if user_id:
        query = query.filter(VerificationCode.user_id == user_id)

    now = datetime.now(timezone.utc)

    for record in query.order_by(VerificationCode.created_at.desc()).all():
        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            continue
        if verify_password(code, record.code_hash):
            record.consumed = True
            db.add(record)
            db.commit()
            return record

    return None
