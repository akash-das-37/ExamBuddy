import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.db import async_session_factory
from app.models.college import College
from app.models.notice import Notice, NotificationLog
from app.models.student import Student
from app.services.notification_service import (
    dispatch_notice_alerts,
    is_student_eligible_for_notice,
)


@pytest.mark.asyncio
async def test_notification_matching_and_filtering():
    college_id = uuid.uuid4()

    # 1. Student A: B.Tech CSE, Sem 5, notifications enabled
    student_a = Student(
        id=uuid.uuid4(),
        college_id=college_id,
        name="Alice Walker",
        email="alice@college.edu",
        password_hash="hash",
        course="B.Tech Computer Science",
        branch="CSE",
        semester=5,
        email_notifications_enabled=True,
        is_active=True,
    )

    # 2. Student B: B.Tech Mechanical, Sem 5, notifications enabled
    student_b = Student(
        id=uuid.uuid4(),
        college_id=college_id,
        name="Bob Miller",
        email="bob@college.edu",
        password_hash="hash",
        course="B.Tech Mechanical Engineering",
        branch="ME",
        semester=5,
        email_notifications_enabled=True,
        is_active=True,
    )

    # 3. Student C: B.Tech CSE, Sem 3, notifications enabled
    student_c = Student(
        id=uuid.uuid4(),
        college_id=college_id,
        name="Charlie Brown",
        email="charlie@college.edu",
        password_hash="hash",
        course="B.Tech Computer Science",
        branch="CSE",
        semester=3,
        email_notifications_enabled=True,
        is_active=True,
    )

    # 4. Student D: B.Tech CSE, Sem 5, notifications DISABLED
    student_d = Student(
        id=uuid.uuid4(),
        college_id=college_id,
        name="David Lee",
        email="david@college.edu",
        password_hash="hash",
        course="B.Tech Computer Science",
        branch="CSE",
        semester=5,
        email_notifications_enabled=False,
        is_active=True,
    )

    # Targeted notice: CSE Sem 5 only
    targeted_notice = Notice(
        id=uuid.uuid4(),
        college_id=college_id,
        title="CSE Sem 5 Mini-Project Submission",
        content="All 5th semester CSE students must submit project synopses by Friday.",
        target_courses=["CSE", "Computer Science"],
        target_semesters=["5", "Sem 5"],
    )

    assert is_student_eligible_for_notice(student_a, targeted_notice) is True
    assert is_student_eligible_for_notice(student_b, targeted_notice) is False  # Wrong course
    assert is_student_eligible_for_notice(student_c, targeted_notice) is False  # Wrong semester
    assert is_student_eligible_for_notice(student_d, targeted_notice) is False  # Notifications disabled

    # General notice: All courses & semesters
    general_notice = Notice(
        id=uuid.uuid4(),
        college_id=college_id,
        title="Campus Library Renovation Schedule",
        content="The central library will remain closed on Sunday.",
        target_courses=["All Courses"],
        target_semesters=None,
    )

    assert is_student_eligible_for_notice(student_a, general_notice) is True
    assert is_student_eligible_for_notice(student_b, general_notice) is True
    assert is_student_eligible_for_notice(student_c, general_notice) is True
    assert is_student_eligible_for_notice(student_d, general_notice) is False  # Notifications disabled


@pytest.mark.asyncio
async def test_dispatch_notice_alerts_deduplication():
    async with async_session_factory() as session:
        college = College(name="Tech Institute", base_url="https://tech.edu", scrape_status="idle")
        session.add(college)
        await session.commit()
        college_id = college.id

        student = Student(
            college_id=college_id,
            name="Emma Watson",
            email="emma.w@tech.edu",
            password_hash=hash_password("Pass123!"),
            course="B.Tech Computer Science",
            branch="CSE",
            semester=5,
            email_notifications_enabled=True,
            is_active=True,
        )
        session.add(student)

        notice = Notice(
            college_id=college_id,
            title="Important Lab Examination Guidelines",
            content="Read the safety manual and guidelines for practical labs.",
            target_courses=["CSE"],
            target_semesters=["5"],
        )
        session.add(notice)
        await session.commit()
        notice_id = notice.id
        student_id = student.id

    # 1. First dispatch: should send 1 email and record in NotificationLog
    dispatched_first = await dispatch_notice_alerts(notice_id)
    assert dispatched_first == 1

    async with async_session_factory() as session:
        logs = (
            await session.execute(
                select(NotificationLog).where(
                    NotificationLog.student_id == student_id,
                    NotificationLog.notice_id == notice_id,
                )
            )
        ).scalars().all()
        assert len(logs) == 1
        assert logs[0].delivery_status in ("sent", "mocked")
        assert logs[0].email_provider_message_id is not None

    # 2. Second dispatch: should detect existing log and NOT send again
    dispatched_second = await dispatch_notice_alerts(notice_id)
    assert dispatched_second == 0

    async with async_session_factory() as session:
        logs_after = (
            await session.execute(
                select(NotificationLog).where(
                    NotificationLog.student_id == student_id,
                    NotificationLog.notice_id == notice_id,
                )
            )
        ).scalars().all()
        assert len(logs_after) == 1  # Still exactly 1 log


@pytest.mark.asyncio
async def test_notification_api_endpoints(client: AsyncClient):
    # Setup student and college
    async with async_session_factory() as session:
        college = College(name="State University", base_url="https://state.edu", scrape_status="idle")
        session.add(college)
        await session.commit()

        student = Student(
            college_id=college.id,
            name="Daniel Craig",
            email="daniel.craig@state.edu",
            password_hash=hash_password("Secret123!"),
            course="B.Tech",
            branch="CSE",
            semester=5,
            email_notifications_enabled=True,
            is_active=True,
        )
        session.add(student)
        await session.commit()
        student_id = student.id
        college_id = college.id

        notice = Notice(
            college_id=college_id,
            title="Convocation Ceremony Date Announced",
            content="Annual convocation will be held on December 20th.",
        )
        session.add(notice)
        await session.commit()
        notice_id = notice.id

    token = create_access_token({"sub": str(student_id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET /notifications/me (initially empty)
    res_empty = await client.get("/notifications/me", headers=headers)
    assert res_empty.status_code == 200
    assert len(res_empty.json()) == 0

    # 2. Trigger dispatch
    await dispatch_notice_alerts(notice_id)

    # 3. GET /notifications/me (now contains 1 item)
    res_notifs = await client.get("/notifications/me", headers=headers)
    assert res_notifs.status_code == 200
    data = res_notifs.json()
    assert len(data) == 1
    assert data[0]["notice_title"] == "Convocation Ceremony Date Announced"
    assert data[0]["delivery_status"] in ("sent", "mocked")

    # 4. PATCH /notifications/preferences (disable)
    res_pref = await client.patch(
        "/notifications/preferences",
        json={"email_notifications_enabled": False},
        headers=headers,
    )
    assert res_pref.status_code == 200
    assert res_pref.json()["email_notifications_enabled"] is False

    # Verify student setting in DB
    async with async_session_factory() as session:
        refreshed = await session.get(Student, student_id)
        assert refreshed.email_notifications_enabled is False

    # 5. POST /notices/{id}/send-alerts
    res_trigger = await client.post(f"/notices/{notice_id}/send-alerts")
    assert res_trigger.status_code == 202
    assert res_trigger.json()["status"] == "dispatch_queued"
