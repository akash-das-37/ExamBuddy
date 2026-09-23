import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DocumentClassification(BaseModel):
    """Result of classifying a scraped page or downloaded document."""
    doc_type: Literal["syllabus", "pyq", "notice", "other"] = Field(
        ...,
        description="Category of the document: syllabus, pyq (previous year question paper), notice (circulars/announcements), or other."
    )
    confidence: float = Field(
        default=0.8,
        ge=0.0,
        le=1.0,
        description="Confidence score between 0.0 and 1.0"
    )
    summary: str = Field(
        ...,
        description="Brief 1-2 sentence description of what the document contains."
    )
    course: str | None = Field(
        default=None,
        description="Target degree or course if mentioned (e.g. B.Tech Computer Science, BCA, MBA)."
    )
    semester: str | None = Field(
        default=None,
        description="Semester if mentioned (e.g. 5, Semester 5, 3rd Sem)."
    )
    subject: str | None = Field(
        default=None,
        description="Academic subject or paper title (e.g. Operating Systems, Data Structures)."
    )
    exam_year: str | None = Field(
        default=None,
        description="Year of examination if PYQ (e.g. 2023, 2022)."
    )


class ExtractedSyllabusTopic(BaseModel):
    """A granular syllabus topic or sub-unit extracted from a syllabus document."""
    subject: str = Field(..., description="Subject name (e.g. Database Management Systems)")
    course: str | None = Field(default=None, description="Course name (e.g. B.Tech CSE)")
    semester: str = Field(default="1", description="Semester identifier (e.g. 5 or V)")
    unit_or_module: str | None = Field(default=None, description="Unit or Module name (e.g. Unit 2: SQL and Relational Algebra)")
    topic_title: str = Field(..., description="Clear title of the topic (e.g. Normalization and 3NF/BCNF)")
    topic_description: str | None = Field(default=None, description="Detailed sub-topics, algorithms, or concepts covered")


class ExtractedPYQQuestion(BaseModel):
    """An individual question extracted from a Previous Year Question (PYQ) paper."""
    subject: str = Field(..., description="Subject name (e.g. Database Management Systems)")
    exam_year: str = Field(default="Unknown", description="Year of the exam paper (e.g. 2023, 2022)")
    question_text: str = Field(..., description="Full text of the question including any options or code snippet")
    marks: int | None = Field(default=None, description="Marks allotted to this question if stated")


class ExtractedNotice(BaseModel):
    """A college notice, announcement, or circular."""
    title: str = Field(..., description="Headline or title of the notice")
    content_summary: str = Field(..., description="Summary of the notice content, deadlines, and action items")
    target_courses: list[str] | None = Field(default=None, description="List of courses affected (or null if all)")
    target_semesters: list[str] | None = Field(default=None, description="List of semesters affected (or null if all)")


# API Response Models
class SyllabusEntryResponse(BaseModel):
    id: uuid.UUID
    college_id: uuid.UUID
    course: str
    semester: str
    subject: str
    topic_title: str
    topic_description: str | None
    source_document_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PYQQuestionResponse(BaseModel):
    id: uuid.UUID
    college_id: uuid.UUID
    subject: str
    exam_year: str
    question_text: str
    marks: int | None
    source_document_id: uuid.UUID
    matched_topic_id: uuid.UUID | None = None
    match_confidence: float | None = None

    model_config = {"from_attributes": True}


class NoticeResponse(BaseModel):
    id: uuid.UUID
    college_id: uuid.UUID
    source_document_id: uuid.UUID | None
    title: str
    content: str | None
    detected_at: datetime
    target_courses: list[str] | dict | None = None
    target_semesters: list[str] | dict | None = None

    model_config = {"from_attributes": True}


class ProcessDocumentsResponse(BaseModel):
    message: str
    college_id: uuid.UUID
    documents_processed: int
    syllabus_entries_created: int
    pyq_questions_created: int
    notices_created: int
