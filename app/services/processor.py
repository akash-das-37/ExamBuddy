import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.db import async_session_factory
from app.models.college import College
from app.models.document import Document
from app.models.notice import Notice
from app.models.pyq import PYQQuestion
from app.models.scraped_page import ScrapedPage
from app.models.syllabus import SyllabusEntry
from app.schemas.extraction import ProcessDocumentsResponse
from app.services.llm_service import llm_service

logger = logging.getLogger("processor")


async def _get_or_create_document_for_page(
    session, college_id: uuid.UUID, page: ScrapedPage
) -> Document:
    """Ensure a Document record exists for an HTML page so child entries have a source_document_id."""
    stmt = select(Document).where(
        Document.college_id == college_id,
        Document.scraped_page_id == page.id,
    )
    doc = (await session.execute(stmt)).scalar_one_or_none()
    if not doc:
        doc = Document(
            college_id=college_id,
            scraped_page_id=page.id,
            file_url=page.url,
            file_type="html",
            document_type=page.page_type,
            extracted_text=page.extracted_text,
            content_hash=page.content_hash,
            created_at=datetime.now(timezone.utc),
            last_seen_at=datetime.now(timezone.utc),
        )
        session.add(doc)
        await session.flush()
    return doc


async def process_college_documents(
    college_id: uuid.UUID,
    force_reprocess: bool = False,
) -> ProcessDocumentsResponse:
    """
    Scan all documents and scraped pages for a college, classify their contents via LLM,
    and populate syllabus_entries, pyq_questions, and notices.
    """
    logger.info("Starting document processing for college %s (force=%s)", college_id, force_reprocess)

    processed_count = 0
    syllabus_created = 0
    pyq_created = 0
    notices_created = 0

    # 1. Process unclassified Document records (e.g. downloaded PDFs)
    async with async_session_factory() as session:
        query = select(Document).where(Document.college_id == college_id)
        if not force_reprocess:
            query = query.where(Document.document_type == "unclassified")
        documents = (await session.execute(query)).scalars().all()
        doc_ids = [d.id for d in documents]

    for doc_id in doc_ids:
        async with async_session_factory() as session:
            doc = await session.get(Document, doc_id)
            if not doc or not doc.extracted_text or len(doc.extracted_text.strip()) < 30:
                continue

            # Classify
            classification = await llm_service.classify_document(
                text=doc.extracted_text,
                filename_or_url=doc.file_url,
            )
            doc.document_type = classification.doc_type

            # Extract by document type
            if classification.doc_type == "syllabus":
                topics = await llm_service.extract_syllabus_entries(
                    text=doc.extracted_text,
                    course_hint=classification.course or "",
                    semester_hint=classification.semester or "",
                    subject_hint=classification.subject or "",
                )
                for t in topics:
                    entry = SyllabusEntry(
                        college_id=college_id,
                        course=t.course or classification.course or "General",
                        semester=str(t.semester or classification.semester or "1"),
                        subject=t.subject or classification.subject or "Core",
                        topic_title=t.topic_title,
                        topic_description=t.topic_description,
                        source_document_id=doc.id,
                    )
                    session.add(entry)
                    syllabus_created += 1

            elif classification.doc_type == "pyq":
                questions = await llm_service.extract_pyq_questions(
                    text=doc.extracted_text,
                    subject_hint=classification.subject or "",
                    year_hint=classification.exam_year or "",
                )
                for q in questions:
                    pyq_item = PYQQuestion(
                        college_id=college_id,
                        subject=q.subject or classification.subject or "Core",
                        exam_year=str(q.exam_year or classification.exam_year or "Unknown"),
                        question_text=q.question_text,
                        marks=q.marks,
                        source_document_id=doc.id,
                    )
                    session.add(pyq_item)
                    pyq_created += 1

            elif classification.doc_type == "notice":
                notice_data = await llm_service.extract_notice(
                    text=doc.extracted_text,
                    title_hint=doc.file_url.split("/")[-1],
                )
                notice_record = Notice(
                    college_id=college_id,
                    source_document_id=doc.id,
                    title=notice_data.title,
                    content=notice_data.content_summary,
                    target_courses={"courses": notice_data.target_courses} if notice_data.target_courses else None,
                    target_semesters={"semesters": notice_data.target_semesters} if notice_data.target_semesters else None,
                )
                session.add(notice_record)
                notices_created += 1

            await session.commit()
            processed_count += 1

    # 2. Process unclassified ScrapedPage records (HTML pages)
    async with async_session_factory() as session:
        page_query = select(ScrapedPage).where(ScrapedPage.college_id == college_id)
        if not force_reprocess:
            page_query = page_query.where(ScrapedPage.page_type == "unclassified")
        pages = (await session.execute(page_query)).scalars().all()
        page_ids = [p.id for p in pages]

    for p_id in page_ids:
        async with async_session_factory() as session:
            page = await session.get(ScrapedPage, p_id)
            if not page or not page.extracted_text or len(page.extracted_text.strip()) < 40:
                continue

            classification = await llm_service.classify_document(
                text=page.extracted_text,
                filename_or_url=page.url,
            )
            page.page_type = classification.doc_type

            # Only extract structured items for non-other categories
            if classification.doc_type in ("syllabus", "pyq", "notice"):
                doc_record = await _get_or_create_document_for_page(session, college_id, page)

                if classification.doc_type == "syllabus":
                    topics = await llm_service.extract_syllabus_entries(
                        text=page.extracted_text,
                        course_hint=classification.course or "",
                        semester_hint=classification.semester or "",
                        subject_hint=classification.subject or "",
                    )
                    for t in topics:
                        entry = SyllabusEntry(
                            college_id=college_id,
                            course=t.course or classification.course or "General",
                            semester=str(t.semester or classification.semester or "1"),
                            subject=t.subject or classification.subject or "Core",
                            topic_title=t.topic_title,
                            topic_description=t.topic_description,
                            source_document_id=doc_record.id,
                        )
                        session.add(entry)
                        syllabus_created += 1

                elif classification.doc_type == "pyq":
                    questions = await llm_service.extract_pyq_questions(
                        text=page.extracted_text,
                        subject_hint=classification.subject or "",
                        year_hint=classification.exam_year or "",
                    )
                    for q in questions:
                        pyq_item = PYQQuestion(
                            college_id=college_id,
                            subject=q.subject or classification.subject or "Core",
                            exam_year=str(q.exam_year or classification.exam_year or "Unknown"),
                            question_text=q.question_text,
                            marks=q.marks,
                            source_document_id=doc_record.id,
                        )
                        session.add(pyq_item)
                        pyq_created += 1

                elif classification.doc_type == "notice":
                    notice_data = await llm_service.extract_notice(
                        text=page.extracted_text,
                        title_hint=page.url.split("/")[-1],
                    )
                    notice_record = Notice(
                        college_id=college_id,
                        source_document_id=doc_record.id,
                        title=notice_data.title,
                        content=notice_data.content_summary,
                        target_courses={"courses": notice_data.target_courses} if notice_data.target_courses else None,
                        target_semesters={"semesters": notice_data.target_semesters} if notice_data.target_semesters else None,
                    )
                    session.add(notice_record)
                    notices_created += 1

            await session.commit()
            processed_count += 1

    logger.info(
        "Finished document processing for college %s: %d processed, %d syllabus topics, %d PYQs, %d notices",
        college_id,
        processed_count,
        syllabus_created,
        pyq_created,
        notices_created,
    )

    return ProcessDocumentsResponse(
        message="Document processing completed successfully",
        college_id=college_id,
        documents_processed=processed_count,
        syllabus_entries_created=syllabus_created,
        pyq_questions_created=pyq_created,
        notices_created=notices_created,
    )
