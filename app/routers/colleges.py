import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.college import College
from app.models.document import Document
from app.models.scraped_page import ScrapedPage
from app.services.crawler import crawl_college

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
