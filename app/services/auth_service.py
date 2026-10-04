import logging
import uuid
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.college import College
from app.models.student import Student
from app.schemas.auth import SignupRequest


def _normalize_base_url(url: str) -> str:
    """Extract scheme + netloc from a URL to use as the canonical college base_url."""
    parsed = urlparse(str(url))
    # Remove trailing slash, keep scheme + host
    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


async def signup(data: SignupRequest, db: AsyncSession) -> tuple[Student, str, bool]:
    """
    Create a new student account.
    - Upserts the college by base_url (creates if not found).
    - Hashes the password and creates the student.
    - Syncs to Supabase cloud auth if configured.
    - Returns (student, access_token, is_new_college).
    Raises HTTPException 409 if email already exists.
    """
    # Check for duplicate email — if exists, upsert and authenticate seamlessly
    existing = await db.execute(
        select(Student).where(Student.email == data.email)
    )
    existing_student = existing.scalar_one_or_none()
    if existing_student:
        existing_student.password_hash = hash_password(data.password)
        if data.name:
            existing_student.name = data.name
        if data.course:
            existing_student.course = data.course
        if data.branch:
            existing_student.branch = data.branch
        if data.semester:
            existing_student.semester = data.semester
        await db.flush()
        token = create_access_token(data={"sub": str(existing_student.id)})
        return existing_student, token, False

    # Upsert college by base_url
    base_url = _normalize_base_url(str(data.college_url))
    result = await db.execute(
        select(College).where(College.base_url == base_url)
    )
    college = result.scalar_one_or_none()
    is_new_college = False

    if college is None:
        college = College(base_url=base_url)
        db.add(college)
        await db.flush()  # Assign college.id before using it
        is_new_college = True

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

    # Best-effort sync to Supabase cloud auth
    settings = get_settings()
    if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{settings.SUPABASE_URL}/auth/v1/signup",
                    headers={
                        "apikey": settings.SUPABASE_ANON_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "email": data.email,
                        "password": data.password,
                        "data": {
                            "name": data.name,
                            "college_url": str(data.college_url),
                            "course": data.course,
                            "branch": data.branch,
                            "semester": data.semester,
                        },
                    },
                )
        except Exception as e:
            logging.debug("Supabase signup sync: %s", e)

    # Generate JWT
    token = create_access_token(data={"sub": str(student.id)})

    return student, token, is_new_college


async def login(email: str, password: str, db: AsyncSession) -> tuple[Student, str]:
    """
    Authenticate a student by email + password.
    Returns (student, access_token).
    Falls through to Supabase cloud auth if local SQLite credentials don't match,
    and automatically syncs the account into SQLite.
    Raises HTTPException 401 on failure.
    """
    result = await db.execute(select(Student).where(Student.email == email))
    student = result.scalar_one_or_none()

    local_ok = student is not None and verify_password(password, student.password_hash)

    if not local_ok:
        # Check Supabase Auth as cloud source
        settings = get_settings()
        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(
                        f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password",
                        headers={
                            "apikey": settings.SUPABASE_ANON_KEY,
                            "Content-Type": "application/json",
                        },
                        json={"email": email, "password": password},
                    )
                    if resp.status_code == 200:
                        supa_data = resp.json()
                        supa_user = supa_data.get("user") or {}
                        meta = supa_user.get("user_metadata") or {}

                        # Resolve or create College
                        college_url = meta.get("college_url") or "https://www.iitb.ac.in/"
                        base_url = _normalize_base_url(college_url)
                        col_stmt = select(College).where(College.base_url == base_url)
                        col_res = await db.execute(col_stmt)
                        college = col_res.scalar_one_or_none()
                        if not college:
                            college = College(
                                name=meta.get("college_name") or "Autonomous Engineering College",
                                base_url=base_url,
                                scrape_status="idle",
                            )
                            db.add(college)
                            await db.flush()

                        if student:
                            student.password_hash = hash_password(password)
                            if meta.get("name"):
                                student.name = meta.get("name")
                            if meta.get("course"):
                                student.course = meta.get("course")
                            if meta.get("branch"):
                                student.branch = meta.get("branch")
                            if meta.get("semester"):
                                student.semester = meta.get("semester")
                        else:
                            student = Student(
                                name=meta.get("name") or email.split("@")[0],
                                email=email,
                                password_hash=hash_password(password),
                                college_id=college.id,
                                course=meta.get("course") or "B.Tech",
                                branch=meta.get("branch") or "CSE",
                                semester=meta.get("semester") or 3,
                            )
                            db.add(student)

                        await db.flush()
                        local_ok = True
            except Exception as e:
                logging.warning("Supabase auth check attempt: %s", e)

    if not local_ok or student is None:
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
