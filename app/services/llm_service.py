import json
import logging
import re
from typing import Any

from anthropic import AsyncAnthropic

from app.core.config import get_settings
from app.schemas.extraction import (
    DocumentClassification,
    ExtractedNotice,
    ExtractedPYQQuestion,
    ExtractedSyllabusTopic,
)

logger = logging.getLogger("llm_service")
settings = get_settings()


def _clean_json_response(raw_text: str) -> str:
    """Extract clean JSON substring from model response (handles ```json fences)."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _truncate_text(text: str, max_chars: int = 40000) -> str:
    """Truncate text to fit within token boundaries while retaining start and middle/end."""
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n\n...[content truncated for length]...\n\n" + text[-half:]


class LLMService:
    """Interface to Anthropic Claude for document classification and data extraction."""

    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.fast_model = settings.ANTHROPIC_FAST_MODEL
        self.extract_model = settings.ANTHROPIC_EXTRACT_MODEL

        self.is_configured = bool(
            self.api_key
            and self.api_key.strip()
            and self.api_key != "your-anthropic-api-key-here"
        )
        if self.is_configured:
            self.client = AsyncAnthropic(api_key=self.api_key)
        else:
            logger.warning(
                "ANTHROPIC_API_KEY not configured or placeholder detected. Operating in mock fallback mode."
            )
            self.client = None

    async def classify_document(self, text: str, filename_or_url: str = "") -> DocumentClassification:
        """
        Classify document text into: syllabus, pyq, notice, or other.
        Infers course, semester, subject, and exam_year where available.
        """
        if not self.is_configured or self.client is None:
            return self._mock_classify(text, filename_or_url)

        sample = _truncate_text(text, max_chars=12000)
        prompt = f"""You are an academic document analyzer for college exams and courseware.
Analyze the following document sample and filename/URL, and classify it.

Filename / URL: {filename_or_url}

Document Sample:
\"\"\"
{sample}
\"\"\"

Respond with a valid JSON object matching this schema:
{{
  "doc_type": "syllabus" | "pyq" | "notice" | "other",
  "confidence": float between 0.0 and 1.0,
  "summary": "Brief 1-2 sentence description",
  "course": "Degree or Course name (e.g. B.Tech Computer Science, BCA, or null)",
  "semester": "Semester (e.g. 5, Semester 5, or null)",
  "subject": "Subject or Course Title (e.g. Operating Systems, or null)",
  "exam_year": "Exam year if PYQ (e.g. 2023, or null)"
}}
Only return the JSON object, nothing else."""

        try:
            response = await self.client.messages.create(
                model=self.fast_model,
                max_tokens=600,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text
            data = json.loads(_clean_json_response(raw))
            return DocumentClassification.model_validate(data)
        except Exception as e:
            logger.warning("Anthropic classify failed, using fallback: %s", e)
            return self._mock_classify(text, filename_or_url)

    async def extract_syllabus_entries(
        self,
        text: str,
        course_hint: str = "",
        semester_hint: str = "",
        subject_hint: str = "",
    ) -> list[ExtractedSyllabusTopic]:
        """Extract structured units and topics from syllabus document text."""
        if not self.is_configured or self.client is None:
            return self._mock_extract_syllabus(text, course_hint, semester_hint, subject_hint)

        sample = _truncate_text(text, max_chars=35000)
        prompt = f"""You are an expert curriculum parser.
Extract all topics, units, and modules from the following college syllabus text.
Course Context: {course_hint or 'Not specified'}
Semester Context: {semester_hint or 'Not specified'}
Subject Context: {subject_hint or 'Not specified'}

Syllabus Text:
\"\"\"
{sample}
\"\"\"

Respond ONLY with a JSON array of objects representing each individual study topic/module:
[
  {{
    "subject": "Name of the subject",
    "course": "Course/branch name or null",
    "semester": "Semester string (e.g. 5)",
    "unit_or_module": "Unit / Module title (e.g. Unit 1: Introduction)",
    "topic_title": "Concise topic title",
    "topic_description": "Key subtopics, algorithms, or points to study"
  }}
]
Extract at least 3-15 granular topics. Return ONLY valid JSON."""

        try:
            response = await self.client.messages.create(
                model=self.extract_model,
                max_tokens=2500,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text
            items = json.loads(_clean_json_response(raw))
            return [ExtractedSyllabusTopic.model_validate(item) for item in items]
        except Exception as e:
            logger.warning("Anthropic syllabus extraction failed, using fallback: %s", e)
            return self._mock_extract_syllabus(text, course_hint, semester_hint, subject_hint)

    async def extract_pyq_questions(
        self,
        text: str,
        subject_hint: str = "",
        year_hint: str = "",
    ) -> list[ExtractedPYQQuestion]:
        """Extract individual questions, marks, and year from Previous Year Question paper."""
        if not self.is_configured or self.client is None:
            return self._mock_extract_pyqs(text, subject_hint, year_hint)

        sample = _truncate_text(text, max_chars=35000)
        prompt = f"""You are an exam question extractor.
Parse all distinct questions from this college question paper text.
Subject Context: {subject_hint or 'Not specified'}
Year Context: {year_hint or 'Not specified'}

Exam Paper Text:
\"\"\"
{sample}
\"\"\"

Respond ONLY with a JSON array of extracted questions:
[
  {{
    "subject": "Subject name",
    "exam_year": "Exam year (e.g. 2023)",
    "question_text": "Full text of the question including any subparts (a, b)",
    "marks": integer marks or null
  }}
]
Extract every distinct numbered question. Return ONLY valid JSON."""

        try:
            response = await self.client.messages.create(
                model=self.extract_model,
                max_tokens=2500,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text
            items = json.loads(_clean_json_response(raw))
            return [ExtractedPYQQuestion.model_validate(item) for item in items]
        except Exception as e:
            logger.warning("Anthropic PYQ extraction failed, using fallback: %s", e)
            return self._mock_extract_pyqs(text, subject_hint, year_hint)

    async def extract_notice(self, text: str, title_hint: str = "") -> ExtractedNotice:
        """Extract title, content summary, and target audience from a notice/circular."""
        if not self.is_configured or self.client is None:
            return self._mock_extract_notice(text, title_hint)

        sample = _truncate_text(text, max_chars=10000)
        prompt = f"""You are a college administrative notice parser.
Extract the key notice details, dates, and student eligibility.
Title hint: {title_hint}

Notice Text:
\"\"\"
{sample}
\"\"\"

Respond ONLY with a JSON object:
{{
  "title": "Clear headline or title of notice",
  "content_summary": "Summary of what the notice announces, deadlines, and required actions",
  "target_courses": ["List", "of", "courses"] or null,
  "target_semesters": ["List", "of", "semesters"] or null
}}
Return ONLY valid JSON."""

        try:
            response = await self.client.messages.create(
                model=self.fast_model,
                max_tokens=600,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text
            data = json.loads(_clean_json_response(raw))
            return ExtractedNotice.model_validate(data)
        except Exception as e:
            logger.warning("Anthropic notice extraction failed, using fallback: %s", e)
            return self._mock_extract_notice(text, title_hint)

    # --- Heuristic / Mock Fallbacks (used when no API key or during offline testing) ---

    def _mock_classify(self, text: str, filename_or_url: str = "") -> DocumentClassification:
        combined = f"{filename_or_url.lower()} {text[:1000].lower()}"
        if any(k in combined for k in ["notice", "circular", "notification", "announcement"]):
            return DocumentClassification(
                doc_type="notice",
                confidence=0.88,
                summary="Official college notice or administrative announcement.",
            )
        elif any(k in combined for k in ["syllabus", "curriculum", "course structure", "scheme of study"]):
            return DocumentClassification(
                doc_type="syllabus",
                confidence=0.9,
                summary="Academic course syllabus detailing subject modules and units.",
                course="Computer Science",
                semester="5",
                subject="Core Computing",
            )
        elif any(k in combined for k in ["question paper", "pyq", "time: 3 hours", "time : 3 hours", "max marks", "max. marks", "marks:", "q.1", "q1.", "q 1.", "examination 20"]):
            return DocumentClassification(
                doc_type="pyq",
                confidence=0.85,
                summary="Previous year semester examination question paper.",
                subject="Core Computing",
                exam_year="2023",
            )
        return DocumentClassification(
            doc_type="other",
            confidence=0.7,
            summary="General college portal page or informational document.",
        )

    def _mock_extract_syllabus(
        self, text: str, course_hint: str, semester_hint: str, subject_hint: str
    ) -> list[ExtractedSyllabusTopic]:
        subject = subject_hint or "Computer Science"
        course = course_hint or "B.Tech CSE"
        semester = semester_hint or "5"

        lines = [line.strip() for line in text.splitlines() if len(line.strip()) > 10]
        topics = []
        for i, line in enumerate(lines[:8]):
            topics.append(
                ExtractedSyllabusTopic(
                    subject=subject,
                    course=course,
                    semester=semester,
                    unit_or_module=f"Module {i + 1}",
                    topic_title=line[:120],
                    topic_description=f"Detailed study elements covering {line[:80]}",
                )
            )

        if not topics:
            topics.append(
                ExtractedSyllabusTopic(
                    subject=subject,
                    course=course,
                    semester=semester,
                    unit_or_module="Unit 1",
                    topic_title="Core Concepts and Fundamentals",
                    topic_description="Foundational principles, architecture, and applications.",
                )
            )
        return topics

    def _mock_extract_pyqs(
        self, text: str, subject_hint: str, year_hint: str
    ) -> list[ExtractedPYQQuestion]:
        subject = subject_hint or "Computer Science"
        year = year_hint or "2023"

        # Regex match questions like "1.", "Q1", "Question 1"
        pattern = re.compile(r"(?:Q(?:uestion)?\s*\.?\s*\d+|^\d+[\.\)])\s*(.+?)(?=(?:Q(?:uestion)?\s*\.?\s*\d+|^\d+[\.\)])|$)", re.DOTALL | re.MULTILINE)
        matches = pattern.findall(text)

        questions = []
        for match in matches[:10]:
            clean_q = match.strip()
            if len(clean_q) > 15:
                questions.append(
                    ExtractedPYQQuestion(
                        subject=subject,
                        exam_year=year,
                        question_text=clean_q[:400],
                        marks=10,
                    )
                )

        if not questions:
            questions.append(
                ExtractedPYQQuestion(
                    subject=subject,
                    exam_year=year,
                    question_text="Explain the core architecture and fundamental principles in detail.",
                    marks=10,
                )
            )
        return questions

    def _mock_extract_notice(self, text: str, title_hint: str) -> ExtractedNotice:
        first_line = text.strip().split("\n")[0] if text.strip() else "Important College Announcement"
        title = title_hint or first_line[:150]
        return ExtractedNotice(
            title=title,
            content_summary=text[:400] if text else "Official notice for students.",
            target_courses=["All Courses"],
            target_semesters=["All Semesters"],
        )


# Singleton instance
llm_service = LLMService()
