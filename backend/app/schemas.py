#API Veri Tipi Tanımları
from datetime import datetime
import re
from uuid import UUID

from pydantic import BaseModel, EmailStr, validator


def validate_password_strength(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Şifre en fazla 72 byte olabilir.")

    requirements = {
        "büyük harf": re.search(r"[A-Z]", value),
        "küçük harf": re.search(r"[a-z]", value),
        "rakam": re.search(r"[0-9]", value),
        "özel karakter": re.search(r"[^A-Za-z0-9]", value),
    }
    missing = [label for label, match in requirements.items() if not match]
    if missing:
        raise ValueError(
            f"Şifrenizde en az bir {', en az bir '.join(missing)} bulunmalıdır."
        )

    return value


# ---------- AUTH ----------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

    @validator("password")
    def password_requirements(cls, value: str) -> str:
        return validate_password_strength(value)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    avatar_url: str | None = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @validator("new_password")
    def password_requirements(cls, value: str) -> str:
        return validate_password_strength(value)



class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    avatar_url: str | None = None
    role: str
    email_verified: bool
    push_notifications: bool
    location_notifications: bool
    email_notifications: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class AuthResponse(Token):
    user: UserResponse


class NotificationSettingsResponse(BaseModel):
    push_notifications: bool
    location_notifications: bool
    email_notifications: bool

    class Config:
        from_attributes = True


class NotificationSettingsUpdate(BaseModel):
    push_notifications: bool | None = None
    location_notifications: bool | None = None
    email_notifications: bool | None = None


class PushTokenRegister(BaseModel):
    token: str
    latitude: float | None = None
    longitude: float | None = None


# ---------- REPORT ----------

class ReportCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float


class ReportUpdate(BaseModel):
    status: str | None = None
    progress: int | None = None
class ReportImageResponse(BaseModel):

    id: UUID

    image_url: str

    created_at: datetime

    class Config:

        from_attributes = True

class ReportResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: str

    latitude: float
    longitude: float

    city: str | None = None
    municipality: str | None = None
    district: str | None = None
    neighborhood: str | None = None
    address: str | None = None

    status: str
    progress: int
    priority: str
    view_count: int
    follower_count: int
    created_at: datetime
    images: list[ReportImageResponse] = []
    class Config:
        from_attributes = True


# ---------- COMMENT ----------

class CommentCreate(BaseModel):
    report_id: UUID
    text: str


class CommentResponse(BaseModel):
    id: UUID
    report_id: UUID
    user_id: UUID
    text: str
    created_at: datetime

    class Config:
        from_attributes = True