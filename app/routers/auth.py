from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_student
from app.db import get_db
from app.models.student import Student
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    StudentResponse,
    TokenResponse,
    UpdateProfileRequest,
)
from app.services import auth_service
from app.services.crawler import crawl_college

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(
    data: SignupRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new student account.

    Looks up or creates the college by base_url, hashes the password,
    creates the student, and returns a JWT access token.
    If a new college was created, initiates an asynchronous crawl task.
    """
    _student, token, is_new_college = await auth_service.signup(data, db)
    if is_new_college:
        background_tasks.add_task(crawl_college, _student.college_id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate with email + password and receive a JWT access token.
    """
    _student, token = await auth_service.login(data.email, data.password, db)
    return TokenResponse(access_token=token)


from app.models.college import College
from sqlalchemy import select


def _format_student_response(student: Student) -> StudentResponse:
    resp = StudentResponse.model_validate(student)
    if student.college:
        resp.college_url = student.college.base_url
        resp.college_name = student.college.name
    return resp


@router.get("/me", response_model=StudentResponse)
async def get_me(current_student: Student = Depends(get_current_student)):
    """
    Return the currently authenticated student's profile.
    """
    return _format_student_response(current_student)


@router.patch("/me", response_model=StudentResponse)
async def update_me(
    data: UpdateProfileRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the currently authenticated student's profile fields.
    """
    if data.name is not None:
        current_student.name = data.name.strip()
    if data.course is not None:
        current_student.course = data.course.strip()
    if data.branch is not None:
        current_student.branch = data.branch.strip()
    if data.semester is not None:
        current_student.semester = data.semester
    if data.email_notifications_enabled is not None:
        current_student.email_notifications_enabled = data.email_notifications_enabled

    if data.college_url:
        clean_url = str(data.college_url).strip().rstrip("/")
        if not clean_url.startswith(("http://", "https://")):
            clean_url = f"https://{clean_url}"

        college_stmt = select(College).where(College.base_url == clean_url)
        college = (await db.execute(college_stmt)).scalar_one_or_none()
        if not college:
            college = College(
                name=data.college_name.strip() if data.college_name else None,
                base_url=clean_url,
                scrape_status="idle",
            )
            db.add(college)
            await db.flush()
        elif data.college_name:
            college.name = data.college_name.strip()

        current_student.college_id = college.id
        current_student.college = college
    elif data.college_name and current_student.college:
        current_student.college.name = data.college_name.strip()

    await db.commit()
    await db.refresh(current_student)
    return _format_student_response(current_student)

