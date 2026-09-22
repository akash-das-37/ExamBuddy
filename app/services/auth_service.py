import uuid
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.college import College
from app.models.student import Student
from app.schemas.auth import SignupRequest


def _normalize_base_url(url: str) -> str:
    """Extract scheme + netloc from a URL to use as the canonical college base_url."""
    parsed = urlparse(str(url))
    # Remove trailing slash, keep scheme + host
    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


async def signup(data: SignupRequest, db: AsyncSession) -> tuple[Student, str]:
    """
    Create a new student account.
    - Upserts the college by base_url (creates if not found).
    - Hashes the password and creates the student.
    - Returns (student, access_token).
    Raises HTTPException 409 if email already exists.
    """
    # Check for duplicate email
    existing = await db.execute(
        select(Student).where(Student.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Upsert college by base_url
    base_url = _normalize_base_url(str(data.college_url))
    result = await db.execute(
        select(College).where(College.base_url == base_url)
    )
    college = result.scalar_one_or_none()

    if college is None:
        college = College(base_url=base_url)
        db.add(college)
        await db.flush()  # Assign college.id before using it

    # Create student
    student = Student(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        college_id=college.id,
        course=data.course,
        branch=data.branch,
        semester=data.semester,
    )
    db.add(student)
    await db.flush()  # Assign student.id

    # Generate JWT
    token = create_access_token(data={"sub": str(student.id)})

    return student, token


async def login(email: str, password: str, db: AsyncSession) -> tuple[Student, str]:
    """
    Authenticate a student by email + password.
    Returns (student, access_token).
    Raises HTTPException 401 on failure.
    """
    result = await db.execute(select(Student).where(Student.email == email))
    student = result.scalar_one_or_none()

    if student is None or not verify_password(password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token = create_access_token(data={"sub": str(student.id)})
    return student, token
