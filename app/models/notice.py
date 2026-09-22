import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class Notice(Base, UUIDMixin):
    __tablename__ = "notices"

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_document_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(1000), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    target_courses: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    target_semesters: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    college = relationship("College", back_populates="notices")
    source_document = relationship("Document", back_populates="notice")
    notification_logs = relationship("NotificationLog", back_populates="notice")

    __table_args__ = (
        Index("ix_notices_detected_at", "detected_at"),
    )


class NotificationLog(Base, UUIDMixin):
    __tablename__ = "notification_log"

    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    notice_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("notices.id", ondelete="CASCADE"),
        nullable=False,
    )
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    delivery_status: Mapped[str] = mapped_column(
        String(50), default="pending", server_default="pending", nullable=False
    )
    email_provider_message_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    # Relationships
    student = relationship("Student", back_populates="notification_logs")
    notice = relationship("Notice", back_populates="notification_logs")
