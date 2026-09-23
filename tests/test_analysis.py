import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_access_token, hash_password
from app.db import async_session_factory
from app.models.college import College
from app.models.document import Document
from app.models.pyq import PYQQuestion
from app.models.student import Student
from app.models.syllabus import SyllabusEntry, TopicImportanceScore
from app.services.analysis_service import (
    compute_topic_importance,
    generate_student_study_report,
    match_pyqs_to_topics,
)


@pytest.mark.asyncio
async def test_match_pyqs_to_topics():
    async with async_session_factory() as session:
        college = College(
            name="Analysis Test Tech",
            base_url="https://analysistech.edu",
            scrape_status="idle",
        )
        session.add(college)
        await session.commit()
        await session.refresh(college)
        college_id = college.id

        doc = Document(
            college_id=college_id,
            file_url="https://analysistech.edu/doc1.pdf",
            file_type="pdf",
            document_type="syllabus",
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)

        # Add 2 syllabus topics
        t1 = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="4",
            subject="Algorithms",
            topic_title="Binary Search Trees and AVL Trees",
            topic_description="Balanced search trees, insertion, deletion, rotations, tree traversal algorithms",
            source_document_id=doc.id,
        )
        t2 = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="4",
            subject="Algorithms",
            topic_title="Dynamic Programming and Memoization",
            topic_description="Optimal substructure, knapsack problem, matrix chain multiplication, longest common subsequence",
            source_document_id=doc.id,
        )
        session.add_all([t1, t2])
        await session.commit()
        await session.refresh(t1)
        await session.refresh(t2)

        # Add 2 PYQ questions corresponding to those topics
        q1 = PYQQuestion(
            college_id=college_id,
            subject="Algorithms",
            exam_year="2024",
            question_text="Explain AVL tree rotations with a diagram. Show insertion into a binary search tree.",
            marks=10,
            source_document_id=doc.id,
        )
        q2 = PYQQuestion(
            college_id=college_id,
            subject="Algorithms",
            exam_year="2023",
            question_text="Solve the 0/1 Knapsack problem using dynamic programming memoization table.",
            marks=15,
            source_document_id=doc.id,
        )
        session.add_all([q1, q2])
        await session.commit()

    # Perform matching
    matched_count = await match_pyqs_to_topics(college_id, "Algorithms")
    assert matched_count == 2

    async with async_session_factory() as session:
        q_records = (await session.execute(
            select(PYQQuestion).where(PYQQuestion.college_id == college_id)
        )).scalars().all()

        for q in q_records:
            assert q.matched_topic_id is not None
            assert q.match_confidence is not None
            assert q.match_confidence > 0.0
            if "AVL tree" in q.question_text:
                assert q.matched_topic_id == t1.id
            if "Knapsack" in q.question_text:
                assert q.matched_topic_id == t2.id


@pytest.mark.asyncio
async def test_compute_topic_importance():
    async with async_session_factory() as session:
        college = College(
            name="Scoring University",
            base_url="https://scoringuni.edu",
            scrape_status="idle",
        )
        session.add(college)
        await session.commit()
        await session.refresh(college)
        college_id = college.id

        doc = Document(
            college_id=college_id,
            file_url="https://scoringuni.edu/os.pdf",
            file_type="pdf",
            document_type="syllabus",
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)

        # High frequency topic (2 questions: 2024 & 2023)
        t_high = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="5",
            subject="Operating Systems",
            topic_title="Process Synchronization and Semaphores",
            topic_description="Critical section problem, Peterson algorithm, mutex semaphores, dining philosophers",
            source_document_id=doc.id,
        )
        # Low frequency topic (1 older question: 2018)
        t_low = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="5",
            subject="Operating Systems",
            topic_title="Disk Scheduling Algorithms",
            topic_description="FCFS, SSTF, SCAN, C-SCAN, disk bandwidth",
            source_document_id=doc.id,
        )
        # Unasked topic (0 questions)
        t_none = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="5",
            subject="Operating Systems",
            topic_title="Distributed File Systems",
            topic_description="NFS, AFS, caching, naming",
            source_document_id=doc.id,
        )
        session.add_all([t_high, t_low, t_none])
        await session.commit()
        await session.refresh(t_high)
        await session.refresh(t_low)
        await session.refresh(t_none)

        q1 = PYQQuestion(
            college_id=college_id,
            subject="Operating Systems",
            exam_year="2024",
            question_text="Explain semaphores and solve the critical section problem.",
            marks=15,
            source_document_id=doc.id,
        )
        q2 = PYQQuestion(
            college_id=college_id,
            subject="Operating Systems",
            exam_year="2023",
            question_text="Discuss Peterson solution for process synchronization.",
            marks=10,
            source_document_id=doc.id,
        )
        q3 = PYQQuestion(
            college_id=college_id,
            subject="Operating Systems",
            exam_year="2018",
            question_text="Compare SSTF and SCAN disk scheduling algorithms.",
            marks=5,
            source_document_id=doc.id,
        )
        session.add_all([q1, q2, q3])
        await session.commit()

    resp = await compute_topic_importance(college_id, "Operating Systems")
    assert resp.topics_scored == 3
    assert resp.pyqs_matched == 3

    async with async_session_factory() as session:
        scores = (await session.execute(
            select(TopicImportanceScore)
        )).scalars().all()

        assert len(scores) == 3
        score_by_topic = {s.syllabus_entry_id: s for s in scores}

        # Process Synchronization should have higher score than Disk Scheduling due to frequency & recency
        assert score_by_topic[t_high.id].final_importance_score > score_by_topic[t_low.id].final_importance_score
        assert score_by_topic[t_high.id].frequency_count == 2
        assert "Frequently tested" in score_by_topic[t_high.id].reasoning_summary

        # Unasked topic should have minimal/zero score and appropriate reasoning
        assert score_by_topic[t_none.id].frequency_count == 0
        assert "No direct past exam questions" in score_by_topic[t_none.id].reasoning_summary


@pytest.mark.asyncio
async def test_ranked_topics_endpoint(client: AsyncClient):
    college_id = uuid.uuid4()
    async with async_session_factory() as session:
        college = College(
            id=college_id,
            name="Ranked Topics Institute",
            base_url="https://ranked.edu",
            scrape_status="idle",
        )
        session.add(college)
        await session.commit()

        doc = Document(
            college_id=college_id,
            file_url="https://ranked.edu/db.pdf",
            file_type="pdf",
            document_type="syllabus",
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)

        t1 = SyllabusEntry(
            college_id=college_id,
            course="B.Tech CSE",
            semester="3",
            subject="Database Systems",
            topic_title="Relational Normalization 1NF to BCNF",
            topic_description="Functional dependencies, normal forms",
            source_document_id=doc.id,
        )
        t2 = SyllabusEntry(
            college_id=college_id,
            course="B.Tech CSE",
            semester="3",
            subject="Database Systems",
            topic_title="Transactions and ACID Properties",
            topic_description="Concurrency control, two phase locking",
            source_document_id=doc.id,
        )
        session.add_all([t1, t2])
        await session.commit()
        await session.refresh(t1)
        await session.refresh(t2)

        # Pre-assign scores
        s1 = TopicImportanceScore(
            syllabus_entry_id=t1.id,
            frequency_count=4,
            recency_weighted_score=3.5,
            final_importance_score=92.0,
            reasoning_summary="Tested regularly in every exam.",
        )
        s2 = TopicImportanceScore(
            syllabus_entry_id=t2.id,
            frequency_count=1,
            recency_weighted_score=0.8,
            final_importance_score=40.0,
            reasoning_summary="Tested once in 2021.",
        )
        session.add_all([s1, s2])
        await session.commit()

    response = await client.get(
        f"/analysis/Database Systems/ranked-topics?college_id={college_id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Verify sorted descending
    assert data[0]["topic_title"] == "Relational Normalization 1NF to BCNF"
    assert data[0]["final_importance_score"] == 92.0
    assert data[0]["priority_level"] == "High Priority"
    assert data[1]["topic_title"] == "Transactions and ACID Properties"
    assert data[1]["final_importance_score"] == 40.0
    assert data[1]["priority_level"] == "Medium Priority"


@pytest.mark.asyncio
async def test_student_study_report_flow(client: AsyncClient):
    college_id = uuid.uuid4()
    student_id = uuid.uuid4()

    async with async_session_factory() as session:
        college = College(
            id=college_id,
            name="Prep College",
            base_url="https://prepcollege.edu",
            scrape_status="idle",
        )
        student = Student(
            id=student_id,
            college_id=college_id,
            name="Rahul Sharma",
            email="rahul.sharma@prepcollege.edu",
            password_hash=hash_password("ExamPass123!"),
            course="B.Tech Computer Science",
            branch="CSE",
            semester=6,
            is_active=True,
        )
        session.add_all([college, student])
        await session.commit()

        doc = Document(
            college_id=college_id,
            file_url="https://prepcollege.edu/cn.pdf",
            file_type="pdf",
            document_type="syllabus",
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)

        # Add 3 syllabus topics
        t1 = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="6",
            subject="Computer Networks",
            topic_title="Routing Algorithms (Dijkstra and Distance Vector)",
            topic_description="Link state routing, distance vector, Bellman-Ford, count to infinity",
            source_document_id=doc.id,
        )
        t2 = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="6",
            subject="Computer Networks",
            topic_title="TCP and UDP Transport Layer",
            topic_description="Three-way handshake, congestion control, flow control, sliding window",
            source_document_id=doc.id,
        )
        t3 = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="6",
            subject="Computer Networks",
            topic_title="Application Layer Protocols (DNS and HTTP)",
            topic_description="DNS resolution, HTTP request response methods, status codes",
            source_document_id=doc.id,
        )
        session.add_all([t1, t2, t3])
        await session.commit()
        await session.refresh(t1)

        # Add questions
        q1 = PYQQuestion(
            college_id=college_id,
            subject="Computer Networks",
            exam_year="2024",
            question_text="Explain Dijkstra link state routing algorithm with numerical example.",
            marks=15,
            source_document_id=doc.id,
        )
        q2 = PYQQuestion(
            college_id=college_id,
            subject="Computer Networks",
            exam_year="2023",
            question_text="Describe TCP three-way handshake and connection teardown.",
            marks=10,
            source_document_id=doc.id,
        )
        session.add_all([q1, q2])
        await session.commit()

    token = create_access_token({"sub": str(student_id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Request study report for subject
    response = await client.get(
        "/students/me/study-report?subject=Computer Networks",
        headers=headers,
    )
    assert response.status_code == 200
    report = response.json()

    assert report["student_name"] == "Rahul Sharma"
    assert report["course"] == "B.Tech Computer Science"
    assert report["subject"] == "Computer Networks"
    assert report["total_topics_analyzed"] == 3
    assert "suggested_revision_strategy" in report
    assert len(report["tiers"]) == 3

    tier_names = [tier["tier_name"] for tier in report["tiers"]]
    assert "Tier 1: High Priority (Must Master)" in tier_names
    assert "Tier 2: Medium Priority (Core Coverage)" in tier_names
    assert "Tier 3: Low Priority (Quick Review)" in tier_names

    # Check unauthenticated access
    unauth_response = await client.get(
        "/students/me/study-report?subject=Computer Networks"
    )
    assert unauth_response.status_code == 401
