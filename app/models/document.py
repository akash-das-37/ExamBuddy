import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class Document(Base, UUIDMixin):
    __tablename__ = "documents"

    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
    )
    scraped_page_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scraped_pages.id", ondelete="SET NULL"),
        nullable=True,
    )
    file_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "pdf", "html"
    document_type: Mapped[str] = mapped_column(
        String(50), default="unclassified", server_default="unclassified", nullable=False
    )
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_used: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    college = relationship("College", back_populates="documents")
    scraped_page = relationship("ScrapedPage", back_populates="documents")
    syllabus_entries = relationship("SyllabusEntry", back_populates="source_document")
    pyq_questions = relationship("PYQQuestion", back_populates="source_document")
    notice = relationship("Notice", back_populates="source_document", uselist=False)
