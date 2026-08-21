from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, AuthResponse
from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


def create_user_token(user: User) -> str:
    return create_access_token({"sub": str(user.id), "email": user.email})


@router.post("/register", response_model=AuthResponse)
def register(user_create: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_create.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta zaten kayıtlı.",
        )
 
    new_user = User(
        name=user_create.name,
        email=user_create.email.lower(),
        password_hash=hash_password(user_create.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_user_token(new_user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
    }


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

    access_token = create_user_token(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }
