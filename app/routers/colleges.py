import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.college import College
from app.models.document import Document
from app.models.notice import Notice
from app.models.pyq import PYQQuestion
from app.models.scraped_page import ScrapedPage
from app.models.syllabus import SyllabusEntry
from app.schemas.extraction import (
    NoticeResponse,
    ProcessDocumentsResponse,
    PYQQuestionResponse,
    SyllabusEntryResponse,
)
from app.services.crawler import crawl_college
from app.services.processor import process_college_documents

router = APIRouter(prefix="/colleges", tags=["Colleges"])


class ScrapeStatusResponse(BaseModel):
    college_id: uuid.UUID
    base_url: str
    scrape_status: str
    last_scraped_at: datetime | None
    total_pages_scraped: int
    total_documents_found: int


class TriggerScrapeResponse(BaseModel):
    message: str
    college_id: uuid.UUID
    status: str


class TriggerProcessingResponse(BaseModel):
    message: str
    college_id: uuid.UUID
    status: str


@router.post(
    "/{college_id}/trigger-scrape",
    response_model=TriggerScrapeResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_scrape(
    college_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    force: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger an asynchronous crawl of the college website via BackgroundTasks.
    The response returns immediately with 202 Accepted.
    """
    college = await db.get(College, college_id)
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"College with id {college_id} not found",
        )

    if college.scrape_status == "running" and not force:
        return TriggerScrapeResponse(
            message="Scrape is already in progress for this college",
            college_id=college.id,
            status=college.scrape_status,
        )

    # Enqueue background crawl task
    background_tasks.add_task(crawl_college, college.id, force=force)

    return TriggerScrapeResponse(
        message="College crawl task has been queued",
        college_id=college.id,
        status="running",
    )


@router.get("/{college_id}/scrape-status", response_model=ScrapeStatusResponse)
async def get_scrape_status(
    college_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Check the current scraping status, last scrape timestamp,
    and page/document statistics for a given college.
    """
    college = await db.get(College, college_id)
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"College with id {college_id} not found",
        )

    # Count scraped pages
    pages_count = (
        await db.scalar(
            select(func.count(ScrapedPage.id)).where(ScrapedPage.college_id == college_id)
        )
        or 0
    )

    # Count documents
    docs_count = (
        await db.scalar(
            select(func.count(Document.id)).where(Document.college_id == college_id)
        )
        or 0
    )

    return ScrapeStatusResponse(
        college_id=college.id,
        base_url=college.base_url,
        scrape_status=college.scrape_status,
        last_scraped_at=college.last_scraped_at,
        total_pages_scraped=pages_count,
        total_documents_found=docs_count,
    )


@router.post(
    "/{college_id}/process-documents",
    response_model=TriggerProcessingResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_document_processing(
    college_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    force_reprocess: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """
    Enqueue LLM classification and structured extraction for all collected documents.
    Extracts syllabus topics, previous year questions, and notices.
    """
    college = await db.get(College, college_id)
    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"College with id {college_id} not found",
        )

    background_tasks.add_task(process_college_documents, college.id, force_reprocess=force_reprocess)

    return TriggerProcessingResponse(
        message="Document processing & extraction task has been queued",
        college_id=college.id,
        status="processing_queued",
    )


@router.get("/{college_id}/syllabus", response_model=list[SyllabusEntryResponse])
async def get_college_syllabus(
    college_id: uuid.UUID,
    course: str | None = Query(None, description="Filter by course name (e.g. B.Tech Computer Science)"),
    semester: str | None = Query(None, description="Filter by semester (e.g. 5)"),
    subject: str | None = Query(None, description="Filter by subject (e.g. Operating Systems)"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve extracted syllabus entries for a college, with optional filters."""
    query = select(SyllabusEntry).where(SyllabusEntry.college_id == college_id)
    if course:
        query = query.where(SyllabusEntry.course.ilike(f"%{course}%"))
    if semester:
        query = query.where(SyllabusEntry.semester == str(semester))
    if subject:
        query = query.where(SyllabusEntry.subject.ilike(f"%{subject}%"))

    entries = (await db.execute(query)).scalars().all()
    return entries


@router.get("/{college_id}/pyqs", response_model=list[PYQQuestionResponse])
async def get_college_pyqs(
    college_id: uuid.UUID,
    subject: str | None = Query(None, description="Filter by subject title"),
    exam_year: str | None = Query(None, description="Filter by exam year (e.g. 2023)"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve previous year exam questions extracted for a college."""
    query = select(PYQQuestion).where(PYQQuestion.college_id == college_id)
    if subject:
        query = query.where(PYQQuestion.subject.ilike(f"%{subject}%"))
    if exam_year:
        query = query.where(PYQQuestion.exam_year == str(exam_year))

    questions = (await db.execute(query)).scalars().all()
    return questions


@router.get("/{college_id}/notices", response_model=list[NoticeResponse])
async def get_college_notices(
    college_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve extracted notices and circulars for a college."""
    query = select(Notice).where(Notice.college_id == college_id).order_by(Notice.detected_at.desc())
    notices = (await db.execute(query)).scalars().all()
    return notices
