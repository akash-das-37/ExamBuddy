"""Initial schema — all tables for ExamBuddy

Revision ID: 001_initial_schema
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- colleges ---
    op.create_table(
        "colleges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(500), nullable=True),
        sa.Column("base_url", sa.String(2048), unique=True, nullable=False),
        sa.Column("last_scraped_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "scrape_status",
            sa.String(50),
            server_default="idle",
            nullable=False,
        ),
        sa.Column("scrape_config", postgresql.JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # --- students ---
    op.create_table(
        "students",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "college_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("colleges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("course", sa.String(255), nullable=False),
        sa.Column("branch", sa.String(255), nullable=False),
        sa.Column("semester", sa.Integer, nullable=False),
        sa.Column(
            "email_notifications_enabled",
            sa.Boolean,
            server_default="true",
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean,
            server_default="true",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )
    op.create_index("ix_students_email", "students", ["email"], unique=True)

    # --- scraped_pages ---
    op.create_table(
        "scraped_pages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "college_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("colleges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=True),
        sa.Column("raw_html", sa.Text, nullable=True),
        sa.Column("extracted_text", sa.Text, nullable=True),
        sa.Column(
            "page_type",
            sa.String(50),
            server_default="unclassified",
            nullable=False,
        ),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("last_changed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_scraped_pages_college_hash",
        "scraped_pages",
        ["college_id", "content_hash"],
    )

    # --- documents ---
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "college_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("colleges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "scraped_page_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("scraped_pages.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("file_url", sa.String(2048), nullable=False),
        sa.Column("file_type", sa.String(50), nullable=False),
        sa.Column(
            "document_type",
            sa.String(50),
            server_default="unclassified",
            nullable=False,
        ),
        sa.Column("extracted_text", sa.Text, nullable=True),
        sa.Column(
            "ocr_used",
            sa.Boolean,
            server_default="false",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # --- syllabus_entries ---
    op.create_table(
        "syllabus_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "college_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("colleges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("course", sa.String(255), nullable=False),
        sa.Column("semester", sa.String(50), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("topic_title", sa.String(500), nullable=False),
        sa.Column("topic_description", sa.Text, nullable=True),
        sa.Column(
            "source_document_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("documents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # --- pyq_questions ---
    op.create_table(
        "pyq_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "college_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("colleges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("exam_year", sa.String(10), nullable=False),
        sa.Column("question_text", sa.Text, nullable=False),
        sa.Column("marks", sa.Integer, nullable=True),
        sa.Column(
            "source_document_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("documents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "matched_topic_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("syllabus_entries.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("match_confidence", sa.Float, nullable=True),
    )

    # --- topic_importance_scores ---
    op.create_table(
        "topic_importance_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "syllabus_entry_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("syllabus_entries.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("frequency_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "recency_weighted_score", sa.Float, nullable=False, server_default="0"
        ),
        sa.Column(
            "final_importance_score", sa.Float, nullable=False, server_default="0"
        ),
        sa.Column("reasoning_summary", sa.Text, nullable=True),
        sa.Column(
            "computed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # --- notices ---
    op.create_table(
        "notices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "college_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("colleges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "source_document_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("documents.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("title", sa.String(1000), nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column(
            "detected_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("target_courses", postgresql.JSONB, nullable=True),
        sa.Column("target_semesters", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_notices_detected_at", "notices", ["detected_at"])

    # --- notification_log ---
    op.create_table(
        "notification_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "notice_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("notices.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sent_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "delivery_status",
            sa.String(50),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("email_provider_message_id", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("notification_log")
    op.drop_index("ix_notices_detected_at", table_name="notices")
    op.drop_table("notices")
    op.drop_table("topic_importance_scores")
    op.drop_table("pyq_questions")
    op.drop_table("syllabus_entries")
    op.drop_table("documents")
    op.drop_index("ix_scraped_pages_college_hash", table_name="scraped_pages")
    op.drop_table("scraped_pages")
    op.drop_index("ix_students_email", table_name="students")
    op.drop_table("students")
    op.drop_table("colleges")
