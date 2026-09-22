import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class SyllabusEntry(Base, UUIDMixin):
    __tablename__ = "syllabus_entries"

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
    )
    course: Mapped[str] = mapped_column(String(255), nullable=False)
    semester: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    topic_title: Mapped[str] = mapped_column(String(500), nullable=False)
    topic_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    college = relationship("College", back_populates="syllabus_entries")
    source_document = relationship("Document", back_populates="syllabus_entries")
    pyq_matches = relationship("PYQQuestion", back_populates="matched_topic")
    importance_scores = relationship("TopicImportanceScore", back_populates="syllabus_entry")


class TopicImportanceScore(Base, UUIDMixin):
    __tablename__ = "topic_importance_scores"

    syllabus_entry_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("syllabus_entries.id", ondelete="CASCADE"),
        nullable=False,
    )
    frequency_count: Mapped[int] = mapped_column(nullable=False, default=0)
    recency_weighted_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    final_importance_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    reasoning_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    syllabus_entry = relationship("SyllabusEntry", back_populates="importance_scores")
