#API Veri Tipi Tanımları
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


# ---------- AUTH ----------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    avatar_url: str | None = None
    role: str
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- REPORT ----------

class ReportCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float


class ReportResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    status: str
    progress: int
    priority: str
    view_count: int
    created_at: datetime

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