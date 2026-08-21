from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegister,
    UserLogin,
    AuthResponse,
    MessageResponse,
    VerifyEmailRequest,
    ResendCodeRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
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
    prefix="/auth",
    tags=["Auth"],
)


def create_user_token(user: User) -> str:
    return create_access_token({"sub": str(user.id), "email": user.email})


def send_verification_code_email(email: str, code: str, subject: str, intro: str) -> None:
    send_email(
        to_email=email,
        subject=subject,
        body=(
            f"{intro}\n\n"
            f"Doğrulama kodunuz: {code}\n\n"
            f"Bu kod {CODE_EXPIRY_MINUTES} dakika içinde geçerliliğini yitirecektir."
        ),
    )


@router.post("/register", response_model=MessageResponse)
def register(user_create: UserRegister, db: Session = Depends(get_db)):
    normalized_email = user_create.email.lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta zaten kayıtlı.",
        )

    new_user = User(
        name=user_create.name,
        email=normalized_email,
        password_hash=hash_password(user_create.password),
        email_verified=False,
    )
    db.add(new_user)
    db.flush()

    code = create_verification_code(db, normalized_email, "register", user_id=new_user.id)
    send_verification_code_email(
        normalized_email,
        code,
        "Sorun Var - Hesap Doğrulama Kodu",
        "Hesabınızı doğrulamak için aşağıdaki kodu kullanın.",
    )
    db.commit()

    return {"message": "Doğrulama kodu e-posta adresinize gönderildi."}


@router.post("/verify-email", response_model=AuthResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    record = resolve_verification_code(db, "register", payload.code, email=payload.email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kod geçersiz veya süresi dolmuş.",
        )

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kullanıcı bulunamadı.")

    user.email_verified = True
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_user_token(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(payload: ResendCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu e-postaya kayıtlı bir hesap bulunamadı.",
        )

    if user.email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu hesap zaten doğrulanmış.")

    code = create_verification_code(db, user.email, "register", user_id=user.id)
    send_verification_code_email(
        user.email,
        code,
        "Sorun Var - Hesap Doğrulama Kodu",
        "Hesabınızı doğrulamak için aşağıdaki kodu kullanın.",
    )
    db.commit()

    return {"message": "Doğrulama kodu tekrar gönderildi."}


@router.post("/login", response_model=AuthResponse)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu e-posta adresine kayıtlı bir hesap bulunamadı.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Şifre yanlış.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="E-postanızı doğrulamanız gerekiyor.",
        )

    access_token = create_user_token(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu e-postaya kayıtlı bir hesap bulunamadı.",
        )

    code = create_verification_code(db, user.email, "password_reset", user_id=user.id)
    send_verification_code_email(
        user.email,
        code,
        "Sorun Var - Şifre Sıfırlama Kodu",
        "Şifrenizi sıfırlamak için aşağıdaki kodu kullanın.",
    )
    db.commit()

    return {"message": "Şifre sıfırlama kodu e-posta adresinize gönderildi."}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = resolve_verification_code(db, "password_reset", payload.code, email=payload.email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kod geçersiz veya süresi dolmuş.",
        )

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kullanıcı bulunamadı.")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()

    return {"message": "Şifreniz güncellendi."}
