import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class SignupRequest(BaseModel):
    """Request body for POST /auth/signup."""
    name: str = Field(..., min_length=1, max_length=255, examples=["Jane Doe"])
    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["SecurePass123!"])
    college_url: HttpUrl = Field(..., examples=["https://example-college.edu"])
    course: str = Field(..., min_length=1, max_length=255, examples=["Computer Science"])
    branch: str = Field(..., min_length=1, max_length=255, examples=["CSE"])
    semester: int = Field(..., ge=1, le=12, examples=[5])


class LoginRequest(BaseModel):
    """Request body for POST /auth/login."""
    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., examples=["SecurePass123!"])


class TokenResponse(BaseModel):
    """Response body containing a JWT access token."""
    access_token: str
    token_type: str = "bearer"


class StudentResponse(BaseModel):
    """Public student profile — returned from /auth/me and signup."""
    id: uuid.UUID
    name: str
    email: str
    college_id: uuid.UUID
    course: str
    branch: str
    semester: int
    email_notifications_enabled: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
