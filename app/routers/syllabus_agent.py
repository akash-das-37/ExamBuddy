"""
Syllabus Agent API Router

Endpoints:
  POST /api/college/connect          — Register/update a college URL for a student
  POST /api/syllabus/discover        — Run the AI agent to find the original syllabus document
  GET  /api/syllabus/current         — Get the current cached syllabus document
  POST /api/syllabus/refresh         — Force re-scan of the college portal
  GET  /api/syllabus/{id}            — Get a specific syllabus document record

IMPORTANT: These endpoints NEVER generate or modify syllabus documents.
           They only discover and return the original document URL from the college.
"""
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import AnyHttpUrl, BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_student
from app.db import get_db
from app.models.college import College
from app.models.student import Student
from app.models.syllabus_document import SyllabusDocument
from app.services.syllabus_agent import (
    get_cached_syllabus_document,
    save_syllabus_document,
    syllabus_agent,
    _validate_college_url,
)

router = APIRouter(prefix="/syllabus-agent", tags=["Syllabus Agent"])


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class CollegeConnectRequest(BaseModel):
    """Request to register/update a college portal URL for the authenticated student."""
    college_url: str = Field(..., description="College portal URL (e.g. https://gnit.ac.in)")
    college_name: str | None = Field(None, description="Human-readable college name (optional)")

    @field_validator("college_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        url = v.strip()
        if not url:
            raise ValueError("college_url cannot be empty")
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        return url


class CollegeConnectResponse(BaseModel):
    message: str
    college_id: uuid.UUID
    college_url: str
    college_name: str | None


class DiscoverRequest(BaseModel):
    """
    Request the AI agent to discover the original syllabus document
    for the student's current semester from the college portal.
    """
    course: str | None = Field(None, description="Override course (e.g. B.Tech). Uses student profile if not provided.")
    branch: str | None = Field(None, description="Override branch (e.g. CSE). Uses student profile if not provided.")
    semester: int | None = Field(None, description="Override semester number. Uses student profile if not provided.")
    academic_year: str | None = Field(None, description="Academic session (e.g. 2026-27)")
    force_refresh: bool = Field(False, description="Re-crawl even if a cached result exists")


class SyllabusDocumentResponse(BaseModel):
    """API response shape for a discovered syllabus document."""
    id: uuid.UUID
    college_id: uuid.UUID
    title: str | None
    document_url: str
    source_page_url: str | None
    file_type: str
    course: str | None
    branch: str | None
    semester: str | None
    academic_year: str | None
    regulation: str | None
    confidence_score: float
    match_reasons: list[str]
    is_verified: bool
    verification_reason: str | None
    is_reachable: bool
    source: str
    last_verified_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_db(cls, doc: SyllabusDocument) -> "SyllabusDocumentResponse":
        import json
        reasons: list[str] = []
        if doc.match_reasons:
            try:
                reasons = json.loads(doc.match_reasons)
            except Exception:
                reasons = [doc.match_reasons]
        return cls(
            id=doc.id,
            college_id=doc.college_id,
            title=doc.title,
            document_url=doc.document_url,
            source_page_url=doc.source_page_url,
            file_type=doc.file_type,
            course=doc.course,
            branch=doc.branch,
            semester=doc.semester,
            academic_year=doc.academic_year,
            regulation=doc.regulation,
            confidence_score=round(doc.confidence_score, 2),
            match_reasons=reasons,
            is_verified=doc.is_verified,
            verification_reason=doc.verification_reason,
            is_reachable=doc.is_reachable,
            source=doc.source,
            last_verified_at=doc.last_verified_at,
            created_at=doc.created_at,
        )


class DiscoverResponse(BaseModel):
    found: bool
    status: str  # "found" | "not_found" | "cached" | "error"
    message: str
    syllabus_document: SyllabusDocumentResponse | None = None
    # Progress/detail fields shown in the UI
    pages_scanned: int | None = None
    candidates_found: int | None = None


class ProgressUpdate(BaseModel):
    step: str
    message: str


# ---------------------------------------------------------------------------
# Background discovery task
# ---------------------------------------------------------------------------

async def _run_discovery_and_save(
    college_url: str,
    college_id: uuid.UUID,
    course: str,
    branch: str,
    semester: str,
    academic_year: str | None,
    doc_id: uuid.UUID | None = None,
) -> None:
    """
    Background task: run the syllabus agent and persist results.
    Used when client fires-and-forgets; polling happens via GET /current.
    """
    from app.db import async_session_factory

    discovery_result = await syllabus_agent.discover_syllabus(
        college_url=college_url,
        course=course,
        branch=branch,
        semester=semester,
        academic_year=academic_year,
    )

    if discovery_result.get("found"):
        async with async_session_factory() as db:
            await save_syllabus_document(
                db=db,
                college_id=college_id,
                course=course,
                branch=branch,
                semester=semester,
                academic_year=academic_year,
                discovery_result=discovery_result,
            )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/college/connect", response_model=CollegeConnectResponse)
async def connect_college(
    payload: CollegeConnectRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Register or update the student's college portal URL.
    Validates the URL, blocks private/localhost addresses (SSRF protection),
    and creates/updates the College record linked to the student.
    """
    try:
        clean_url, base_url = _validate_college_url(payload.college_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    # Lookup or create College record
    stmt = select(College).where(College.base_url == base_url)
    college = (await db.execute(stmt)).scalar_one_or_none()

    if not college:
        college = College(
            name=payload.college_name,
            base_url=base_url,
            scrape_status="idle",
        )
        db.add(college)
        await db.flush()
    elif payload.college_name:
        college.name = payload.college_name

    # Update student's college
    current_student.college_id = college.id
    current_student.college = college
    await db.commit()
    await db.refresh(college)

    return CollegeConnectResponse(
        message="College portal connected successfully.",
        college_id=college.id,
        college_url=base_url,
        college_name=college.name,
    )


@router.post("/discover", response_model=DiscoverResponse)
async def discover_syllabus(
    payload: DiscoverRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    AI Agent: Crawl the student's registered college portal and find the
    original syllabus document (PDF/DOC/DOCX) for the current semester.

    This endpoint:
    1. Checks the cache first (unless force_refresh=True)
    2. If no cache, runs the discovery agent synchronously
    3. Returns the ORIGINAL document URL — nothing is generated or altered

    The student must have a college_url in their profile (set via /college/connect).
    """
    # Resolve academic profile from student + overrides
    college_id = current_student.college_id
    college = await db.get(College, college_id)

    if not college or not college.base_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No college portal URL configured. "
                "Please connect your college portal first via /syllabus-agent/college/connect"
            ),
        )

    course = payload.course or current_student.course or "B.Tech"
    branch = payload.branch or current_student.branch or "CSE"
    semester = str(payload.semester or current_student.semester or 1)
    academic_year = payload.academic_year
    college_url = college.base_url

    # --- Cache check ---
    if not payload.force_refresh:
        cached = await get_cached_syllabus_document(db, college_id, course, branch, semester)
        if cached:
            return DiscoverResponse(
                found=True,
                status="cached",
                message=f"✅ Syllabus loaded from cache (last verified: {cached.last_verified_at}).",
                syllabus_document=SyllabusDocumentResponse.from_db(cached),
            )

    # --- Run discovery agent ---
    progress_log: list[str] = []

    def on_progress(msg: str):
        progress_log.append(msg)

    discovery_result = await syllabus_agent.discover_syllabus(
        college_url=college_url,
        course=course,
        branch=branch,
        semester=semester,
        academic_year=academic_year,
        on_progress=on_progress,
    )

    if not discovery_result.get("found"):
        return DiscoverResponse(
            found=False,
            status="not_found",
            message=discovery_result.get("error") or (
                f"Syllabus not found for {course} {branch} — Semester {semester}. "
                "The college portal may not have a downloadable document, or the URL may be incorrect."
            ),
        )

    # Save to DB
    saved_doc = await save_syllabus_document(
        db=db,
        college_id=college_id,
        course=course,
        branch=branch,
        semester=semester,
        academic_year=academic_year,
        discovery_result=discovery_result,
    )

    return DiscoverResponse(
        found=True,
        status="found",
        message=f"✅ Official syllabus found on {college_url}. Original document URL preserved.",
        syllabus_document=SyllabusDocumentResponse.from_db(saved_doc),
    )


@router.get("/current", response_model=DiscoverResponse)
async def get_current_syllabus(
    course: str | None = Query(None),
    branch: str | None = Query(None),
    semester: int | None = Query(None),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current cached syllabus document for the authenticated student.
    Does NOT re-scrape — use POST /discover for that.
    """
    college_id = current_student.college_id
    resolved_course = course or current_student.course or "B.Tech"
    resolved_branch = branch or current_student.branch or "CSE"
    resolved_semester = str(semester or current_student.semester or 1)

    cached = await get_cached_syllabus_document(
        db, college_id, resolved_course, resolved_branch, resolved_semester
    )

    if not cached:
        return DiscoverResponse(
            found=False,
            status="not_found",
            message=(
                f"No cached syllabus found for {resolved_branch} Semester {resolved_semester}. "
                "Use POST /syllabus-agent/discover to scan the college portal."
            ),
        )

    return DiscoverResponse(
        found=True,
        status="cached",
        message="✅ Official syllabus document ready.",
        syllabus_document=SyllabusDocumentResponse.from_db(cached),
    )


@router.post("/refresh", response_model=DiscoverResponse)
async def refresh_syllabus(
    course: str | None = Query(None),
    branch: str | None = Query(None),
    semester: int | None = Query(None),
    academic_year: str | None = Query(None),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Force re-scan of the college portal to find a fresh syllabus document.
    Equivalent to POST /discover with force_refresh=True.
    """
    from app.services.syllabus_agent import DiscoverRequest as _DR  # local import to avoid circular
    return await discover_syllabus(
        payload=DiscoverRequest(
            course=course,
            branch=branch,
            semester=semester,
            academic_year=academic_year,
            force_refresh=True,
        ),
        current_student=current_student,
        db=db,
    )


@router.get("/{doc_id}", response_model=SyllabusDocumentResponse)
async def get_syllabus_document(
    doc_id: uuid.UUID,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a specific syllabus document record by ID.
    Includes the original document URL from the college website.
    """
    doc = await db.get(SyllabusDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus document not found.")

    # Ensure the document belongs to the student's college
    if doc.college_id != current_student.college_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This syllabus document does not belong to your college.",
        )

    return SyllabusDocumentResponse.from_db(doc)


@router.get("/", response_model=list[SyllabusDocumentResponse])
async def list_syllabus_documents(
    branch: str | None = Query(None),
    semester: str | None = Query(None),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    List all discovered syllabus documents for the student's college.
    Useful for exploring what the agent has found.
    """
    query = select(SyllabusDocument).where(
        SyllabusDocument.college_id == current_student.college_id
    )
    if branch:
        query = query.where(SyllabusDocument.branch.ilike(f"%{branch}%"))
    if semester:
        query = query.where(SyllabusDocument.semester == str(semester))

    query = query.order_by(SyllabusDocument.confidence_score.desc())
    docs = (await db.execute(query)).scalars().all()
    return [SyllabusDocumentResponse.from_db(d) for d in docs]
