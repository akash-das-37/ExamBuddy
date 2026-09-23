import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import async_session_factory
from app.models.college import College
from app.models.pyq import PYQQuestion
from app.models.student import Student
from app.models.syllabus import SyllabusEntry, TopicImportanceScore
from app.schemas.analysis import (
    ComputeImportanceResponse,
    PYQQuestionSnippet,
    StudyReportResponse,
    StudyTier,
    TopicImportanceItem,
)

logger = logging.getLogger("analysis_service")

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "then", "of", "to", "in", "on", "for", "with",
    "by", "at", "from", "as", "is", "was", "are", "were", "be", "been", "have", "has", "had",
    "do", "does", "did", "what", "which", "who", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now", "explain",
    "describe", "discuss", "derive", "write", "differentiate", "distinguish", "short", "notes",
    "note", "define", "briefly", "detail", "with", "diagram", "neat", "example", "examples"
}


def _tokenize(text: str) -> set[str]:
    """Extract significant lowercase alphanumeric tokens, stripping common exam question stopwords."""
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return {w for w in words if w not in STOPWORDS}


def _calculate_overlap_score(q_tokens: set[str], topic_tokens: set[str]) -> float:
    """Compute token intersection similarity between a question and a topic."""
    if not q_tokens or not topic_tokens:
        return 0.0
    intersection = q_tokens.intersection(topic_tokens)
    if not intersection:
        return 0.0
    # Overlap relative to topic size (precision for that topic)
    return len(intersection) / len(topic_tokens)


async def match_pyqs_to_topics(college_id: uuid.UUID, subject: str) -> int:
    """
    Match all unmatched PYQ questions in a subject to their corresponding syllabus topics.
    Updates matched_topic_id and match_confidence in the database.
    """
    async with async_session_factory() as session:
        # 1. Fetch syllabus topics
        topic_stmt = select(SyllabusEntry).where(
            SyllabusEntry.college_id == college_id,
            SyllabusEntry.subject.ilike(f"%{subject}%"),
        )
        topics = (await session.execute(topic_stmt)).scalars().all()
        if not topics:
            logger.info("No syllabus topics found for subject '%s' in college %s", subject, college_id)
            return 0

        # Precompute topic token sets
        topic_token_map = {}
        for t in topics:
            combined_desc = f"{t.topic_title} {t.topic_description or ''}"
            topic_token_map[t.id] = _tokenize(combined_desc)

        # 2. Fetch PYQ questions
        pyq_stmt = select(PYQQuestion).where(
            PYQQuestion.college_id == college_id,
            PYQQuestion.subject.ilike(f"%{subject}%"),
        )
        questions = (await session.execute(pyq_stmt)).scalars().all()

        matched_count = 0
        for q in questions:
            q_tokens = _tokenize(q.question_text)
            best_topic_id = None
            best_score = 0.0

            for t_id, t_tokens in topic_token_map.items():
                score = _calculate_overlap_score(q_tokens, t_tokens)
                if score > best_score:
                    best_score = score
                    best_topic_id = t_id

            # Require minimum overlap threshold (e.g. at least 1-2 core technical terms matching)
            if best_topic_id and best_score >= 0.08:
                q.matched_topic_id = best_topic_id
                q.match_confidence = round(min(0.95, 0.5 + (best_score * 0.5)), 2)
                matched_count += 1
            elif not q.matched_topic_id and topics:
                # If low lexical match, assign default top candidate with lower confidence
                q.matched_topic_id = topics[0].id
                q.match_confidence = 0.35
                matched_count += 1

        await session.commit()

    logger.info("Matched %d PYQ questions to topics for subject '%s'", matched_count, subject)
    return matched_count


async def compute_topic_importance(college_id: uuid.UUID, subject: str) -> ComputeImportanceResponse:
    """
    Compute recency-weighted importance scores for all syllabus topics in a subject.
    Saves scores and reasoning to topic_importance_scores.
    """
    # 1. Ensure PYQs are matched first
    pyqs_matched = await match_pyqs_to_topics(college_id, subject)

    current_year = datetime.now().year

    async with async_session_factory() as session:
        # 2. Fetch topics with their matched PYQs
        stmt = (
            select(SyllabusEntry)
            .options(selectinload(SyllabusEntry.pyq_matches))
            .where(
                SyllabusEntry.college_id == college_id,
                SyllabusEntry.subject.ilike(f"%{subject}%"),
            )
        )
        topics = (await session.execute(stmt)).scalars().all()
        if not topics:
            return ComputeImportanceResponse(
                message=f"No syllabus topics found for subject '{subject}'",
                college_id=college_id,
                subject=subject,
                topics_scored=0,
                pyqs_matched=pyqs_matched,
            )

        raw_scores = []
        for t in topics:
            matched = t.pyq_matches or []
            freq = len(matched)
            recency_score = 0.0
            years_seen = []

            for q in matched:
                try:
                    q_year = int(re.findall(r"\d{4}", str(q.exam_year))[0])
                except (IndexError, ValueError):
                    q_year = current_year - 3
                years_seen.append(q_year)

                year_diff = max(0, current_year - q_year)
                # Recency decay formula: recent years carry much more weight
                recency_weight = 1.0 / (1.0 + 0.25 * year_diff)
                # Marks weighting: 10 marks is baseline 1.0; 15 marks is 1.5
                marks_weight = (q.marks or 10) / 10.0
                recency_score += recency_weight * marks_weight

            raw_scores.append((t, freq, recency_score, sorted(set(years_seen))))

        # 3. Normalize scores between 0 and 100
        max_raw = max((item[2] for item in raw_scores), default=0.0)

        topics_scored = 0
        for t, freq, rec_score, years in raw_scores:
            if max_raw > 0:
                normalized = round((rec_score / max_raw) * 90.0 + (10.0 if freq > 0 else 0.0), 1)
            else:
                normalized = 10.0 if freq > 0 else 0.0

            # Generate reasoning summary
            if freq > 0:
                recent_str = ", ".join(str(y) for y in years[-3:])
                reasoning = (
                    f"Frequently tested: appeared {freq} time(s) across past exam papers "
                    f"(recent in {recent_str}). High priority for semester exams."
                )
            else:
                reasoning = (
                    "No direct past exam questions found on record. Review core definitions and fundamental principles."
                )

            # Check existing score record to update or insert
            score_stmt = select(TopicImportanceScore).where(
                TopicImportanceScore.syllabus_entry_id == t.id
            )
            existing_score = (await session.execute(score_stmt)).scalar_one_or_none()

            now = datetime.now(timezone.utc)
            if existing_score:
                existing_score.frequency_count = freq
                existing_score.recency_weighted_score = round(rec_score, 2)
                existing_score.final_importance_score = normalized
                existing_score.reasoning_summary = reasoning
                existing_score.computed_at = now
            else:
                new_score = TopicImportanceScore(
                    syllabus_entry_id=t.id,
                    frequency_count=freq,
                    recency_weighted_score=round(rec_score, 2),
                    final_importance_score=normalized,
                    reasoning_summary=reasoning,
                    computed_at=now,
                )
                session.add(new_score)
            topics_scored += 1

        await session.commit()

    return ComputeImportanceResponse(
        message="Topic importance scores successfully computed",
        college_id=college_id,
        subject=subject,
        topics_scored=topics_scored,
        pyqs_matched=pyqs_matched,
    )


async def generate_student_study_report(
    student: Student,
    subject: str,
) -> StudyReportResponse:
    """
    Generate an actionable, tiered study report for a student based on their college,
    course, semester, and target subject.
    """
    # 1. Trigger scoring calculation to ensure up-to-date analysis
    await compute_topic_importance(student.college_id, subject)

    # 2. Query scored topics with relationships
    async with async_session_factory() as session:
        stmt = (
            select(SyllabusEntry)
            .options(
                selectinload(SyllabusEntry.importance_scores),
                selectinload(SyllabusEntry.pyq_matches),
            )
            .where(
                SyllabusEntry.college_id == student.college_id,
                SyllabusEntry.subject.ilike(f"%{subject}%"),
            )
        )
        entries = (await session.execute(stmt)).scalars().all()

    items: list[TopicImportanceItem] = []
    total_pyqs = 0

    for e in entries:
        score_obj = e.importance_scores[0] if e.importance_scores else None
        final_score = score_obj.final_importance_score if score_obj else 0.0
        freq = score_obj.frequency_count if score_obj else len(e.pyq_matches or [])
        rec_score = score_obj.recency_weighted_score if score_obj else 0.0
        reasoning = score_obj.reasoning_summary if score_obj else "Topic identified from curriculum."

        # Assign priority tier
        if final_score >= 65.0:
            priority = "High Priority"
        elif final_score >= 35.0:
            priority = "Medium Priority"
        else:
            priority = "Low Priority"

        # Format matched questions
        q_snippets = []
        for q in (e.pyq_matches or []):
            total_pyqs += 1
            q_snippets.append(
                PYQQuestionSnippet(
                    id=q.id,
                    exam_year=q.exam_year,
                    question_text=q.question_text[:250],
                    marks=q.marks,
                    match_confidence=q.match_confidence,
                )
            )

        items.append(
            TopicImportanceItem(
                syllabus_entry_id=e.id,
                topic_title=e.topic_title,
                topic_description=e.topic_description,
                subject=e.subject,
                course=e.course,
                semester=e.semester,
                frequency_count=freq,
                recency_weighted_score=rec_score,
                final_importance_score=final_score,
                priority_level=priority,
                reasoning_summary=reasoning,
                matched_questions=q_snippets[:4],  # include top sample questions
            )
        )

    # Sort descending by importance score
    items.sort(key=lambda x: x.final_importance_score, reverse=True)

    tier1 = [i for i in items if i.priority_level == "High Priority"]
    tier2 = [i for i in items if i.priority_level == "Medium Priority"]
    tier3 = [i for i in items if i.priority_level == "Low Priority"]

    # If all ended in one tier due to small sample, re-balance proportionally
    if items and not tier1 and not tier2:
        cutoff_high = max(1, len(items) // 3)
        tier1 = items[:cutoff_high]
        for i in tier1:
            i.priority_level = "High Priority"
        tier2 = items[cutoff_high : cutoff_high * 2]
        for i in tier2:
            i.priority_level = "Medium Priority"
        tier3 = items[cutoff_high * 2 :]
        for i in tier3:
            i.priority_level = "Low Priority"

    strategy = (
        f"Master the {len(tier1)} High-Priority topics first — these represent the core recurring questions "
        f"across previous exams. Then practice the {len(tier2)} Medium-Priority topics for comprehensive coverage. "
        f"Reserve the remaining {len(tier3)} topics for final quick revision."
    )

    tiers = [
        StudyTier(
            tier_name="Tier 1: High Priority (Must Master)",
            description="Frequently tested in recent semester exams. Focus on derivations, algorithms, and long-form answers.",
            topics=tier1,
        ),
        StudyTier(
            tier_name="Tier 2: Medium Priority (Core Coverage)",
            description="Standard curriculum topics that regularly appear as medium-mark subquestions.",
            topics=tier2,
        ),
        StudyTier(
            tier_name="Tier 3: Low Priority (Quick Review)",
            description="Concept check topics with low historical question frequency. Review definitions and high-level summaries.",
            topics=tier3,
        ),
    ]

    return StudyReportResponse(
        student_name=student.name,
        course=student.course,
        branch=student.branch,
        semester=student.semester,
        subject=subject,
        total_topics_analyzed=len(items),
        total_pyqs_analyzed=total_pyqs,
        high_priority_count=len(tier1),
        medium_priority_count=len(tier2),
        low_priority_count=len(tier3),
        suggested_revision_strategy=strategy,
        tiers=tiers,
        generated_at=datetime.now(timezone.utc),
    )
