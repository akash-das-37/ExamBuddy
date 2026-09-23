import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.db import async_session_factory
from app.models.college import College
from app.models.document import Document
from app.models.notice import Notice
from app.models.pyq import PYQQuestion
from app.models.syllabus import SyllabusEntry
from app.services.llm_service import llm_service
from app.services.processor import process_college_documents


@pytest.mark.asyncio
async def test_llm_service_classification_and_extraction():
    # 1. Test Syllabus Classification
    syllabus_sample = """
    DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
    COURSE STRUCTURE AND SYLLABUS FOR B.TECH (CSE) SEMESTER 5
    Subject: Operating Systems (CS502)
    Unit 1: Introduction to Operating Systems, Process Management and CPU Scheduling.
    Unit 2: Process Synchronization, Critical Section Problem, Semaphores and Deadlocks.
    Unit 3: Memory Management, Paging, Segmentation, Virtual Memory and Page Replacement.
    """
    cls_result = await llm_service.classify_document(syllabus_sample, "cs_sem5_syllabus.pdf")
    assert cls_result.doc_type == "syllabus"
    assert cls_result.confidence > 0.5

    # 2. Test Syllabus Extraction
    topics = await llm_service.extract_syllabus_entries(
        syllabus_sample,
        course_hint="B.Tech CSE",
        semester_hint="5",
        subject_hint="Operating Systems",
    )
    assert len(topics) >= 1
    assert any("Process" in t.topic_title or "Operating" in t.topic_title for t in topics)

    # 3. Test PYQ Classification & Extraction
    pyq_sample = """
    APEX ENGINEERING INSTITUTE - END SEMESTER EXAMINATION 2023
    Course: B.Tech CSE | Semester: 5 | Subject: Operating Systems
    Time: 3 Hours | Max Marks: 100
    Q1. Explain the difference between preemptive and non-preemptive CPU scheduling algorithms with examples. (10 marks)
    Q2. What is a Deadlock? Describe the four necessary conditions for a deadlock to occur and Banker's Algorithm. (10 marks)
    Q3. Explain Paging and Segmentation hardware architectures in memory management. (10 marks)
    """
    pyq_cls = await llm_service.classify_document(pyq_sample, "os_exam_2023.pdf")
    assert pyq_cls.doc_type == "pyq"

    questions = await llm_service.extract_pyq_questions(
        pyq_sample, subject_hint="Operating Systems", year_hint="2023"
    )
    assert len(questions) >= 1
    assert any("scheduling" in q.question_text.lower() or "deadlock" in q.question_text.lower() for q in questions)

    # 4. Test Notice Classification & Extraction
    notice_sample = """
    NOTICE - EXAMINATION DEPARTMENT
    Circular Ref: EXAM/2024/09
    All B.Tech Semester 5 students must submit their semester exam registration forms along with fees by October 25.
    Late submissions will attract a fine of Rs. 500.
    """
    notice_cls = await llm_service.classify_document(notice_sample, "notice_exam_reg.pdf")
    assert notice_cls.doc_type == "notice"

    notice_extracted = await llm_service.extract_notice(notice_sample, "notice_exam_reg.pdf")
    assert len(notice_extracted.title) > 0
    assert len(notice_extracted.content_summary) > 0


@pytest.mark.asyncio
async def test_process_college_documents_end_to_end():
    async with async_session_factory() as session:
        college = College(
            name="Apex Institute of Technology",
            base_url="https://apex-tech.edu",
            scrape_status="idle",
        )
        session.add(college)
        await session.commit()
        college_id = college.id

        # Add an unclassified syllabus document
        doc_syllabus = Document(
            college_id=college_id,
            file_url="https://apex-tech.edu/syllabus/cs501.pdf",
            file_type="pdf",
            document_type="unclassified",
            extracted_text="""
            Syllabus: Data Structures and Algorithms
            Unit 1: Asymptotic Analysis and Big-O notation.
            Unit 2: Trees, Binary Search Trees, AVL Trees, and Red-Black Trees.
            Unit 3: Graphs, BFS, DFS, Dijkstra's algorithm, and Minimum Spanning Trees.
            """,
        )
        session.add(doc_syllabus)

        # Add an unclassified PYQ document
        doc_pyq = Document(
            college_id=college_id,
            file_url="https://apex-tech.edu/pyqs/dsa_2023.pdf",
            file_type="pdf",
            document_type="unclassified",
            extracted_text="""
            Semester Examination Question Paper 2023 - Data Structures
            Q1. Derive the time complexity of QuickSort in best, average, and worst cases. (10 marks)
            Q2. Explain AVL tree rotations with a step-by-step insertion example. (10 marks)
            """,
        )
        session.add(doc_pyq)

        # Add an unclassified notice document
        doc_notice = Document(
            college_id=college_id,
            file_url="https://apex-tech.edu/notices/midterm_circular.pdf",
            file_type="pdf",
            document_type="unclassified",
            extracted_text="""
            Notice: Mid-Term Examination Schedule Announced
            The mid-term exams for all courses will commence from November 15, 2024.
            """,
        )
        session.add(doc_notice)
        await session.commit()

    # Run processing pipeline
    result = await process_college_documents(college_id)
    assert result.documents_processed >= 3
    assert result.syllabus_entries_created >= 1
    assert result.pyq_questions_created >= 1
    assert result.notices_created >= 1

    # Verify SQLite database records
    async with async_session_factory() as session:
        # Check documents updated
        refreshed_docs = (
            await session.execute(select(Document).where(Document.college_id == college_id))
        ).scalars().all()
        types = [d.document_type for d in refreshed_docs]
        assert "syllabus" in types
        assert "pyq" in types
        assert "notice" in types

        # Check syllabus_entries populated
        entries = (
            await session.execute(select(SyllabusEntry).where(SyllabusEntry.college_id == college_id))
        ).scalars().all()
        assert len(entries) >= 1
        for e in entries:
            assert e.topic_title is not None
            assert e.college_id == college_id
            assert e.source_document_id is not None

        # Check pyq_questions populated
        questions = (
            await session.execute(select(PYQQuestion).where(PYQQuestion.college_id == college_id))
        ).scalars().all()
        assert len(questions) >= 1
        for q in questions:
            assert q.question_text is not None
            assert q.college_id == college_id

        # Check notices populated
        notices = (
            await session.execute(select(Notice).where(Notice.college_id == college_id))
        ).scalars().all()
        assert len(notices) >= 1


@pytest.mark.asyncio
async def test_colleges_extraction_api_endpoints(client: AsyncClient):
    # Setup college and some data
    async with async_session_factory() as session:
        college = College(
            name="Greenwood University",
            base_url="https://greenwood.edu",
            scrape_status="idle",
        )
        session.add(college)
        await session.commit()
        college_id = college.id

        doc = Document(
            college_id=college_id,
            file_url="https://greenwood.edu/syllabus.pdf",
            file_type="pdf",
            document_type="syllabus",
            extracted_text="Sample Syllabus",
        )
        session.add(doc)
        await session.flush()

        entry = SyllabusEntry(
            college_id=college_id,
            course="B.Tech Computer Science",
            semester="5",
            subject="Computer Networks",
            topic_title="OSI and TCP/IP Reference Models",
            topic_description="Layered architecture and protocol stack comparison",
            source_document_id=doc.id,
        )
        session.add(entry)

        pyq = PYQQuestion(
            college_id=college_id,
            subject="Computer Networks",
            exam_year="2023",
            question_text="Explain the 3-way handshake in TCP connection establishment.",
            marks=10,
            source_document_id=doc.id,
        )
        session.add(pyq)

        notice = Notice(
            college_id=college_id,
            source_document_id=doc.id,
            title="End Semester Lab Exam Schedule",
            content="Practical examinations will be conducted between Dec 1 and Dec 7.",
        )
        session.add(notice)
        await session.commit()

    # 1. GET /colleges/{id}/syllabus
    syl_resp = await client.get(f"/colleges/{college_id}/syllabus")
    assert syl_resp.status_code == 200
    syl_data = syl_resp.json()
    assert len(syl_data) == 1
    assert syl_data[0]["subject"] == "Computer Networks"
    assert syl_data[0]["topic_title"] == "OSI and TCP/IP Reference Models"

    # Filter test
    filtered_resp = await client.get(f"/colleges/{college_id}/syllabus?semester=5&subject=Networks")
    assert filtered_resp.status_code == 200
    assert len(filtered_resp.json()) == 1

    empty_filter_resp = await client.get(f"/colleges/{college_id}/syllabus?semester=2")
    assert empty_filter_resp.status_code == 200
    assert len(empty_filter_resp.json()) == 0

    # 2. GET /colleges/{id}/pyqs
    pyq_resp = await client.get(f"/colleges/{college_id}/pyqs")
    assert pyq_resp.status_code == 200
    pyq_data = pyq_resp.json()
    assert len(pyq_data) == 1
    assert "handshake" in pyq_data[0]["question_text"].lower()

    # 3. GET /colleges/{id}/notices
    notices_resp = await client.get(f"/colleges/{college_id}/notices")
    assert notices_resp.status_code == 200
    notices_data = notices_resp.json()
    assert len(notices_data) == 1
    assert "Lab Exam" in notices_data[0]["title"]

    # 4. POST /colleges/{id}/process-documents
    proc_resp = await client.post(f"/colleges/{college_id}/process-documents")
    assert proc_resp.status_code == 202
    assert proc_resp.json()["status"] == "processing_queued"
