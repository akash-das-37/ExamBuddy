import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
if not hasattr(bcrypt, "__about__"):
    import types
    bcrypt.__about__ = types.SimpleNamespace(__version__=getattr(bcrypt, "__version__", "4.0.0"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db import get_db

import bcrypt

pwd_context = None  # Replaced by direct bcrypt calls
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


async def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """FastAPI dependency — decode JWT, look up student, raise 401 on failure."""
    from app.models.student import Student  # avoid circular import

    settings = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    student_id = None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        student_id_str: str | None = payload.get("sub")
        if student_id_str is not None:
            student_id = uuid.UUID(student_id_str)
    except (JWTError, ValueError, TypeError):
        pass

    from sqlalchemy.orm import selectinload

    if student_id is not None:
        result = await db.execute(
            select(Student).options(selectinload(Student.college)).where(Student.id == student_id)
        )
        student = result.scalar_one_or_none()
        if student is not None:
            if not student.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is deactivated",
                )
            return student

    # Fallback: check if this is a valid Supabase Auth token
    if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(
                    f"{settings.SUPABASE_URL}/auth/v1/user",
                    headers={
                        "apikey": settings.SUPABASE_ANON_KEY,
                        "Authorization": f"Bearer {token}",
                    },
                )
                if resp.status_code == 200:
                    supa_user = resp.json()
                    supa_email = supa_user.get("email")
                    if supa_email:
                        stmt = select(Student).options(selectinload(Student.college)).where(Student.email == supa_email)
                        st_res = await db.execute(stmt)
                        student = st_res.scalar_one_or_none()
                        if student:
                            if not student.is_active:
                                raise HTTPException(
                                    status_code=status.HTTP_403_FORBIDDEN,
                                    detail="Account is deactivated",
                                )
                            return student
        except Exception:
            pass

    raise credentials_exception
