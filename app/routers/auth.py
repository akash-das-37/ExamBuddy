from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_student
from app.db import get_db
from app.models.student import Student
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    StudentResponse,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a new student account.

    Looks up or creates the college by base_url, hashes the password,
    creates the student, and returns a JWT access token.
    """
    _student, token = await auth_service.signup(data, db)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate with email + password and receive a JWT access token.
    """
    _student, token = await auth_service.login(data.email, data.password, db)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=StudentResponse)
async def get_me(current_student: Student = Depends(get_current_student)):
    """
    Return the currently authenticated student's profile.
    """
    return current_student
