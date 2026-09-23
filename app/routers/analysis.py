import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_student
from app.db import get_db
from app.models.college import College
from app.models.student import Student
from app.models.syllabus import SyllabusEntry
from app.schemas.analysis import (
    ComputeImportanceResponse,
    PYQQuestionSnippet,
    StudyReportResponse,
    TopicImportanceItem,
)
from app.services.analysis_service import (
    compute_topic_importance,
    generate_student_study_report,
)

router = APIRouter(tags=["Exam Analysis & Study Reports"])


@router.post(
    "/analysis/{subject}/compute",
    response_model=ComputeImportanceResponse,
    status_code=status.HTTP_200_OK,
)
async def trigger_compute_importance(
    subject: str,
    college_id: uuid.UUID = Query(..., description="ID of the college to compute analysis for"),
    db: AsyncSession = Depends(get_db),
):
    """
    Match PYQ exam questions to syllabus topics and compute recency-weighted importance scores.
    """
    college = await db.get(College, college_id)
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"College with id {college_id} not found",
        )

    result = await compute_topic_importance(college_id, subject)
    return result


@router.get(
    "/analysis/{subject}/ranked-topics",
    response_model=list[TopicImportanceItem],
)
async def get_ranked_topics(
    subject: str,
    college_id: uuid.UUID = Query(..., description="ID of the college"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all syllabus topics for a subject ranked by historical exam importance score.
    """
    stmt = (
        select(SyllabusEntry)
        .options(
            selectinload(SyllabusEntry.importance_scores),
            selectinload(SyllabusEntry.pyq_matches),
        )
        .where(
            SyllabusEntry.college_id == college_id,
            SyllabusEntry.subject.ilike(f"%{subject}%"),
        )
    )
    entries = (await db.execute(stmt)).scalars().all()

    items = []
    for e in entries:
        score_obj = e.importance_scores[0] if e.importance_scores else None
        final_score = score_obj.final_importance_score if score_obj else 0.0
        freq = score_obj.frequency_count if score_obj else len(e.pyq_matches or [])
        rec_score = score_obj.recency_weighted_score if score_obj else 0.0
        reasoning = score_obj.reasoning_summary if score_obj else "Topic identified from curriculum."

        priority = "High Priority" if final_score >= 65.0 else ("Medium Priority" if final_score >= 35.0 else "Low Priority")

        snippets = [
            PYQQuestionSnippet(
                id=q.id,
                exam_year=q.exam_year,
                question_text=q.question_text[:250],
                marks=q.marks,
                match_confidence=q.match_confidence,
            )
            for q in (e.pyq_matches or [])
        ]

        items.append(
            TopicImportanceItem(
                syllabus_entry_id=e.id,
                topic_title=e.topic_title,
                topic_description=e.topic_description,
                subject=e.subject,
                course=e.course,
                semester=e.semester,
                frequency_count=freq,
                recency_weighted_score=rec_score,
                final_importance_score=final_score,
                priority_level=priority,
                reasoning_summary=reasoning,
                matched_questions=snippets[:3],
            )
        )

    items.sort(key=lambda x: x.final_importance_score, reverse=True)
    return items


@router.get(
    "/students/me/study-report",
    response_model=StudyReportResponse,
)
async def get_my_study_report(
    subject: str = Query(..., description="Subject name to generate exam prep report for"),
    current_student: Student = Depends(get_current_student),
):
    """
    Generate an actionable, 3-tiered study report for the authenticated student
    matching their college, course, and semester.
    """
    report = await generate_student_study_report(current_student, subject)
    return report
