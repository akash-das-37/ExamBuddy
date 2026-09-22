# Import all models so Alembic (and SQLAlchemy metadata) can discover them.
from app.models.base import Base
from app.models.college import College
from app.models.student import Student
from app.models.scraped_page import ScrapedPage
from app.models.document import Document
from app.models.syllabus import SyllabusEntry, TopicImportanceScore
from app.models.pyq import PYQQuestion
from app.models.notice import Notice, NotificationLog

__all__ = [
    "Base",
    "College",
    "Student",
    "ScrapedPage",
    "Document",
    "SyllabusEntry",
    "TopicImportanceScore",
    "PYQQuestion",
    "Notice",
    "NotificationLog",
]
