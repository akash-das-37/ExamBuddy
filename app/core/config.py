from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # Database: SQLite async by default for low-RAM local dev; swap to PostgreSQL via env var
    DATABASE_URL: str = "sqlite+aiosqlite:///./exambuddy.db"

    # JWT
    JWT_SECRET_KEY: str = "change-me-to-a-long-random-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # App
    APP_NAME: str = "ExamBuddy"
    DEBUG: bool = True

    # Storage
    STORAGE_DIR: str = "./storage"

    # Crawler settings
    CRAWLER_MAX_DEPTH: int = 3
    CRAWLER_REQUEST_DELAY: float = 1.0
    CRAWLER_RECENCY_SKIP_HOURS: int = 24
    CRAWLER_USER_AGENT: str = "ExamBuddyBot/1.0 (+http://localhost:8000/bot-info)"

    # LLM Settings (Anthropic Claude API)
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_FAST_MODEL: str = "claude-3-5-haiku-20241022"
    ANTHROPIC_EXTRACT_MODEL: str = "claude-3-5-sonnet-20241022"
    LLM_MAX_INPUT_TOKENS: int = 25000

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — avoids re-reading .env on every call."""
    return Settings()
