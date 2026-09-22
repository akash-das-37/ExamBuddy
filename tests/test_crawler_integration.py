import asyncio
import functools
import http.server
import shutil
import tempfile
import threading
from pathlib import Path
import pytest
from sqlalchemy import select

import fitz  # PyMuPDF
from app.db import async_session_factory
from app.models.college import College
from app.models.document import Document
from app.models.scraped_page import ScrapedPage
from app.services.crawler import crawl_college
from app.services.storage import storage_service


@pytest.fixture(scope="module")
def static_college_site():
    """Spin up a lightweight static HTTP server serving test pages and a test PDF."""
    temp_dir = tempfile.mkdtemp(prefix="college_site_")
    root = Path(temp_dir)

    # 1. robots.txt
    (root / "robots.txt").write_text("User-agent: *\nAllow: /\n", encoding="utf-8")

    # 2. index.html
    (root / "index.html").write_text(
        """<!DOCTYPE html>
<html>
<head><title>Apex Engineering Institute</title></head>
<body>
    <h1>Apex Engineering Institute</h1>
    <p>Welcome to the official portal for undergraduate and postgraduate studies.</p>
    <nav>
        <a href="/academics/syllabus.html">Official Syllabus & Curriculum (2024)</a>
        <a href="/notices.html">Examination Notice Board</a>
        <a href="/about.html">About Campus</a>
    </nav>
</body>
</html>
""",
        encoding="utf-8",
    )

    # 3. academics/syllabus.html
    academics_dir = root / "academics"
    academics_dir.mkdir(parents=True, exist_ok=True)
    (academics_dir / "syllabus.html").write_text(
        """<!DOCTYPE html>
<html>
<head><title>Computer Science Syllabus</title></head>
<body>
    <h1>Computer Science Curriculum & Syllabus</h1>
    <p>Detailed course breakdown for Semester 5 students:</p>
    <a href="/files/cs_sem5_syllabus.pdf">Download CS Sem 5 Syllabus PDF</a>
</body>
</html>
""",
        encoding="utf-8",
    )

    # 4. notices.html
    (root / "notices.html").write_text(
        """<!DOCTYPE html>
<html>
<head><title>Exam Circulars & Notices</title></head>
<body>
    <h1>Examination Circular & Important Notification</h1>
    <p>All 5th semester students must submit their examination registration forms before October 15th.</p>
</body>
</html>
""",
        encoding="utf-8",
    )

    # 5. about.html (low priority)
    (root / "about.html").write_text(
        """<!DOCTYPE html>
<html>
<head><title>About Us</title></head>
<body>
    <h1>About Our Campus</h1>
    <p>Established in 1998, offering world-class engineering education.</p>
</body>
</html>
""",
        encoding="utf-8",
    )

    # 6. Generate a dummy PDF with text using PyMuPDF
    files_dir = root / "files"
    files_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = files_dir / "cs_sem5_syllabus.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (50, 72),
        "Apex Institute: CS501 Data Structures and Algorithms Syllabus\nTopics: Dynamic Programming, Graph Theory, Greedy Algorithms.\nCredits: 4",
    )
    doc.save(str(pdf_path))
    doc.close()

    # Run HTTP Server on an open port
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=temp_dir)
    server = http.server.HTTPServer(("127.0.0.1", 0), handler)
    port = server.server_port
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    base_url = f"http://127.0.0.1:{port}"

    yield base_url

    # Teardown
    server.shutdown()
    server.server_close()
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.mark.asyncio
async def test_crawler_end_to_end(static_college_site):
    """Test crawler scrapes static pages, prioritizes syllabus/notices, extracts PDF text, and records to DB."""
    base_url = static_college_site

    # 1. Insert test college into DB
    async with async_session_factory() as session:
        college = College(
            name="Apex Engineering Institute",
            base_url=base_url,
            scrape_status="idle",
        )
        session.add(college)
        await session.commit()
        college_id = college.id

    # 2. Run crawl_college
    await crawl_college(college_id, force=True)

    # 3. Verify college status updated to idle with last_scraped_at
    async with async_session_factory() as session:
        refreshed = await session.get(College, college_id)
        assert refreshed is not None
        assert refreshed.scrape_status == "idle"
        assert refreshed.last_scraped_at is not None

        # 4. Verify scraped_pages
        pages_stmt = select(ScrapedPage).where(ScrapedPage.college_id == college_id)
        pages = (await session.execute(pages_stmt)).scalars().all()
        page_urls = [p.url for p in pages]

        # Home, syllabus, notices should have been crawled
        assert any(p.rstrip("/") == base_url.rstrip("/") or "index" in p for p in page_urls)
        assert any("syllabus.html" in p for p in page_urls)
        assert any("notices.html" in p for p in page_urls)

        # Check content hashes are populated
        for p in pages:
            assert p.content_hash is not None
            assert len(p.content_hash) == 64
            assert len(p.extracted_text or "") > 0

        # 5. Verify PDF document was discovered and extracted
        docs_stmt = select(Document).where(Document.college_id == college_id)
        docs = (await session.execute(docs_stmt)).scalars().all()
        assert len(docs) >= 1

        pdf_doc = next(d for d in docs if d.file_url.endswith("cs_sem5_syllabus.pdf"))
        assert pdf_doc.file_type == "pdf"
        assert "Data Structures and Algorithms" in (pdf_doc.extracted_text or "")
        assert pdf_doc.content_hash is not None

        # Check that storage file exists on disk
        stored_files = list(Path(storage_service.base_dir / f"colleges/{college_id}").glob("*.pdf"))
        assert len(stored_files) >= 1
