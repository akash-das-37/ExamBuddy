import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class PYQQuestionSnippet(BaseModel):
    id: uuid.UUID
    exam_year: str
    question_text: str
    marks: int | None
    match_confidence: float | None

    model_config = {"from_attributes": True}


class TopicImportanceItem(BaseModel):
    syllabus_entry_id: uuid.UUID
    topic_title: str
    topic_description: str | None
    subject: str
    course: str
    semester: str
    frequency_count: int
    recency_weighted_score: float
    final_importance_score: float = Field(..., description="Normalized score between 0 and 100")
    priority_level: str = Field(..., description="High Priority, Medium Priority, or Low Priority")
    reasoning_summary: str | None
    matched_questions: list[PYQQuestionSnippet] = []


class StudyTier(BaseModel):
    tier_name: str
    description: str
    topics: list[TopicImportanceItem]


class StudyReportResponse(BaseModel):
    student_name: str
    course: str
    branch: str
    semester: int
    subject: str
    total_topics_analyzed: int
    total_pyqs_analyzed: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    suggested_revision_strategy: str
    tiers: list[StudyTier]
    generated_at: datetime


class ComputeImportanceResponse(BaseModel):
    message: str
    college_id: uuid.UUID
    subject: str
    topics_scored: int
    pyqs_matched: int
