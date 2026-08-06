import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, UUID
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_url = Column(Text, nullable=True)
    role = Column(String, default="citizen")
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reports = relationship("Report", back_populates="user")
    comments = relationship("Comment", back_populates="user")


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)

    latitude = Column(DOUBLE_PRECISION, nullable=False)
    longitude = Column(DOUBLE_PRECISION, nullable=False)

    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    priority = Column(String, default="medium")

    view_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="reports")
    images = relationship(
        "ReportImage",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    comments = relationship(
        "Comment",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    history = relationship(
        "ReportStatusHistory",
        back_populates="report",
        cascade="all, delete-orphan",
    )


class ReportImage(Base):
    __tablename__ = "report_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    report_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reports.id"),
        nullable=False,
    )

    image_url = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="images")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    report_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reports.id"),
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    text = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="comments")
    user = relationship("User", back_populates="comments")


class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    report_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reports.id"),
        nullable=False,
    )

    progress = Column(Integer, nullable=False)

    status_text = Column(Text, nullable=False)

    changed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="history")