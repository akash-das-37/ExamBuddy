from datetime import datetime

from sqlalchemy import DateTime, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class College(Base, UUIDMixin):
    __tablename__ = "colleges"

    name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    base_url: Mapped[str] = mapped_column(String(2048), unique=True, nullable=False)
    last_scraped_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    scrape_status: Mapped[str] = mapped_column(
        String(50), default="idle", server_default="idle", nullable=False
    )
    scrape_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    students = relationship("Student", back_populates="college")
    scraped_pages = relationship("ScrapedPage", back_populates="college")
    documents = relationship("Document", back_populates="college")
    syllabus_entries = relationship("SyllabusEntry", back_populates="college")
    syllabus_documents = relationship("SyllabusDocument", back_populates="college")
    pyq_questions = relationship("PYQQuestion", back_populates="college")
    notices = relationship("Notice", back_populates="college")
