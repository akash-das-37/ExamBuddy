import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.db import async_session_factory
from app.models.college import College
from app.models.notice import Notice, NotificationLog
from app.models.student import Student
from app.services.email_service import build_notice_email, email_service

logger = logging.getLogger("notification_service")


def _matches_target_list(target_data: list | dict | None, student_value: str | int) -> bool:
    """Check if student value matches targeted criteria, or if notice is broadcast to all."""
    if not target_data:
        return True

    # If JSON is stored as {"courses": [...]} or raw list
    items: list = []
    if isinstance(target_data, dict):
        items = target_data.get("courses") or target_data.get("semesters") or []
    elif isinstance(target_data, list):
        items = target_data

    if not items:
        return True

    student_str = str(student_value).strip().lower()

    for item in items:
        item_str = str(item).strip().lower()
        if item_str in ("all", "all courses", "all semesters", "general", "*"):
            return True
        # Exact match or substring match
        if item_str == student_str or item_str in student_str or student_str in item_str:
            return True

        # Extract pure digits for semester matching (e.g. "Sem 5" vs 5)
        item_digits = re.findall(r"\d+", item_str)
        student_digits = re.findall(r"\d+", student_str)
        if item_digits and student_digits and item_digits[0] == student_digits[0]:
            return True

    return False


def is_student_eligible_for_notice(student: Student, notice: Notice) -> bool:
    """Determine if a notice is relevant to a student based on active status, preferences, course, and semester."""
    if not student.is_active or not student.email_notifications_enabled:
        return False

    if student.college_id != notice.college_id:
        return False

    # Check course / branch relevance
    course_match = _matches_target_list(notice.target_courses, student.course) or _matches_target_list(
        notice.target_courses, student.branch
    )
    if not course_match:
        return False

    # Check semester relevance
    semester_match = _matches_target_list(notice.target_semesters, student.semester)
    if not semester_match:
        return False

    return True


async def dispatch_notice_alerts(notice_id: uuid.UUID) -> int:
    """
    Find all relevant students for a given notice, prevent duplicate notifications,
    dispatch emails, and log the delivery to NotificationLog.
    """
    logger.info("Evaluating alert dispatch for notice %s", notice_id)

    async with async_session_factory() as session:
        notice = await session.get(Notice, notice_id)
        if not notice:
            logger.error("Notice %s not found for alert dispatch", notice_id)
            return 0

        college = await session.get(College, notice.college_id)
        college_name = college.name or "Your College" if college else "Your College"

        # Query all active students with email notifications turned on for this college
        stmt = (
            select(Student)
            .where(
                Student.college_id == notice.college_id,
                Student.is_active.is_(True),
                Student.email_notifications_enabled.is_(True),
            )
        )
        students = (await session.execute(stmt)).scalars().all()

        # Find already notified students for deduplication
        log_stmt = select(NotificationLog.student_id).where(
            NotificationLog.notice_id == notice_id
        )
        already_notified = set((await session.execute(log_stmt)).scalars().all())

    dispatched_count = 0

    for student in students:
        if student.id in already_notified:
            logger.debug("Student %s already notified about notice %s; skipping", student.id, notice_id)
            continue

        if not is_student_eligible_for_notice(student, notice):
            continue

        # Build email content
        subject = f"[{college_name}] Notice Alert: {notice.title[:80]}"
        html_body, text_body = build_notice_email(
            student_name=student.name,
            notice_title=notice.title,
            notice_content=notice.content or "",
            college_name=college_name,
        )

        try:
            msg_id = await email_service.send_email(
                to_email=student.email,
                subject=subject,
                html_content=html_body,
                text_content=text_body,
            )
            delivery_status = "sent" if not msg_id.startswith("mock_") else "mocked"
        except Exception as e:
            logger.error("Failed to send notice email to %s: %s", student.email, e)
            msg_id = None
            delivery_status = "failed"

        # Log notification in DB
        async with async_session_factory() as write_session:
            log_record = NotificationLog(
                student_id=student.id,
                notice_id=notice.id,
                sent_at=datetime.now(timezone.utc),
                delivery_status=delivery_status,
                email_provider_message_id=msg_id,
            )
            write_session.add(log_record)
            await write_session.commit()

        if delivery_status in ("sent", "mocked"):
            dispatched_count += 1

    logger.info("Dispatched %d alert emails for notice %s", dispatched_count, notice_id)
    return dispatched_count


async def dispatch_pending_college_notices(college_id: uuid.UUID) -> int:
    """Scan all notices for a college and dispatch alerts for any unnotified students."""
    async with async_session_factory() as session:
        notices = (
            await session.execute(select(Notice).where(Notice.college_id == college_id))
        ).scalars().all()
        notice_ids = [n.id for n in notices]

    total_dispatched = 0
    for n_id in notice_ids:
        total_dispatched += await dispatch_notice_alerts(n_id)

    return total_dispatched
