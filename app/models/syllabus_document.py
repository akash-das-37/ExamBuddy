"""
SyllabusDocument model — stores metadata about a discovered and verified
original syllabus document from a college portal.

IMPORTANT: We NEVER generate, recreate, or modify the original document.
           We only store the URL that points back to the college's own file.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class SyllabusDocument(Base, UUIDMixin):
    """
    Stores a discovered, matched, and verified original syllabus document
    from the college/university website. This is NOT a generated document.
    The document_url always points to the college's own hosted file.
    """
    __tablename__ = "syllabus_documents"

    # --- Ownership / Association ---
    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Original Document Location ---
    document_url: Mapped[str] = mapped_column(
        String(2048),
        nullable=False,
        comment="Original URL of the document on the college website. Never altered.",
    )
    source_page_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
        comment="The college webpage where this document link was found.",
    )
    file_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pdf",
        comment="File extension: pdf, doc, docx",
    )

    # --- Academic Context ---
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    course: Mapped[str | None] = mapped_column(String(255), nullable=True)
    branch: Mapped[str | None] = mapped_column(String(255), nullable=True)
    semester: Mapped[str | None] = mapped_column(String(50), nullable=True)
    academic_year: Mapped[str | None] = mapped_column(String(50), nullable=True)
    regulation: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="e.g. R23, R25, NEP2020"
    )

    # --- AI Matching / Confidence ---
    confidence_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0,
        comment="Score 0–100 from the AI matching algorithm."
    )
    match_reasons: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="JSON-encoded list of reasons for the match score."
    )

    # --- Verification ---
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    verification_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_reachable: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )

    # --- Source Tracking ---
    source: Mapped[str] = mapped_column(
        String(50), default="college_website", server_default="college_website", nullable=False
    )

    # --- Cache / Freshness ---
    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # --- File Metadata (from HTTP headers, not from reading the file) ---
    content_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_type_header: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # --- Relationships ---
    college = relationship("College", back_populates="syllabus_documents")

    def to_api_dict(self) -> dict:
        """Return a safe dictionary for API responses."""
        return {
            "id": str(self.id),
            "college_id": str(self.college_id),
            "title": self.title,
            "document_url": self.document_url,
            "source_page_url": self.source_page_url,
            "file_type": self.file_type,
            "course": self.course,
            "branch": self.branch,
            "semester": self.semester,
            "academic_year": self.academic_year,
            "regulation": self.regulation,
            "confidence_score": round(self.confidence_score, 2),
            "match_reasons": self.match_reasons,
            "is_verified": self.is_verified,
            "verification_reason": self.verification_reason,
            "is_reachable": self.is_reachable,
            "source": self.source,
            "last_verified_at": self.last_verified_at.isoformat() if self.last_verified_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
