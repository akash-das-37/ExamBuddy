import asyncio
import hashlib
import io
import logging
import re
import urllib.parse
import urllib.robotparser
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select

from app.core.config import get_settings
from app.db import async_session_factory
from app.models.college import College
from app.models.document import Document
from app.models.scraped_page import ScrapedPage
from app.services.storage import storage_service

logger = logging.getLogger("crawler")
settings = get_settings()

PRIORITY_KEYWORDS = [
    "syllabus",
    "curriculum",
    "notice",
    "circular",
    "notification",
    "exam",
    "question paper",
    "previous year",
    "pyq",
    "academic calendar",
]


def _sha256(text: str) -> str:
    """Compute sha256 hex digest for a string."""
    return hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()


def _normalize_url(url: str, base_url: str) -> str:
    """Resolve relative URLs, strip fragments, query parameters if appropriate, and clean."""
    joined = urllib.parse.urljoin(base_url, url)
    parsed = urllib.parse.urlparse(joined)
    # Strip fragment (#)
    cleaned = urllib.parse.urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, "")
    )
    return cleaned.rstrip("/")


def _is_same_domain(url: str, base_url: str) -> bool:
    """Check if url belongs to the same domain or subdomain as base_url."""
    base_netloc = urllib.parse.urlparse(base_url).netloc.lower()
    url_netloc = urllib.parse.urlparse(url).netloc.lower()
    return url_netloc == base_netloc or url_netloc.endswith("." + base_netloc)


def _compute_priority(url: str, anchor_text: str = "") -> int:
    """Calculate priority score for a link based on keywords. Higher number = higher priority."""
    target = f"{url.lower()} {anchor_text.lower()}"
    score = 0
    for kw in PRIORITY_KEYWORDS:
        if kw in target:
            score += 10
    return score


def extract_text_from_pdf(pdf_bytes: bytes) -> tuple[str, bool]:
    """
    Extract text from PDF using tiered strategy:
    1. PyMuPDF (fitz) - fast, efficient
    2. pdfplumber - robust fallback
    3. Tesseract OCR - for scanned image PDFs (only when text is empty/near-empty)
    Returns (extracted_text, ocr_used).
    """
    ocr_used = False
    extracted_text = ""

    # Tier 1: PyMuPDF (fitz)
    try:
        import fitz  # PyMuPDF

        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            parts = []
            for page in doc:
                parts.append(page.get_text() or "")
            extracted_text = "\n".join(parts).strip()
    except Exception as e:
        logger.warning("PyMuPDF extraction failed: %s", e)

    # Tier 2: pdfplumber fallback
    if len(extracted_text) < 50:
        try:
            import pdfplumber

            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                parts = []
                for page in pdf.pages:
                    parts.append(page.extract_text() or "")
                candidate = "\n".join(parts).strip()
                if len(candidate) > len(extracted_text):
                    extracted_text = candidate
        except Exception as e:
            logger.warning("pdfplumber fallback extraction failed: %s", e)

    # Tier 3: Tesseract OCR fallback for scanned PDFs
    if len(extracted_text) < 50:
        try:
            from PIL import Image
            import pytesseract
            import fitz

            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                ocr_parts = []
                for i, page in enumerate(doc):
                    if i >= 10:  # Safety limit for low-RAM machine to prevent freeze
                        break
                    pix = page.get_pixmap()
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    text = pytesseract.image_to_string(img)
                    if text:
                        ocr_parts.append(text)
                if ocr_parts:
                    extracted_text = "\n".join(ocr_parts).strip()
                    ocr_used = True
        except Exception as e:
            logger.warning("Tesseract OCR fallback skipped or failed: %s", e)

    return extracted_text, ocr_used


async def _fetch_with_playwright(url: str) -> str:
    """Render dynamic JavaScript-heavy page with Playwright headless Chromium."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="networkidle", timeout=15000)
            content = await page.content()
            await browser.close()
            return content
    except Exception as e:
        logger.warning("Playwright render failed for %s: %s", url, e)
        return ""


async def _fetch_robots_txt(client: httpx.AsyncClient, base_url: str) -> urllib.robotparser.RobotFileParser:
    """Fetch and parse robots.txt for the college domain."""
    rp = urllib.robotparser.RobotFileParser()
    robots_url = urllib.parse.urljoin(base_url, "/robots.txt")
    try:
        resp = await client.get(robots_url, timeout=10.0)
        if resp.status_code == 200:
            rp.parse(resp.text.splitlines())
        else:
            rp.allow_all = True
    except Exception as e:
        logger.info("Could not fetch robots.txt (%s); allowing crawl: %s", robots_url, e)
        rp.allow_all = True
    return rp


async def crawl_college(college_id: uuid.UUID, force: bool = False) -> None:
    """
    Crawl the website of a college.
    Designed for low RAM:
    - Processes and persists page-by-page
    - Prioritizes syllabus/notice/PYQ links
    - Requests + BeautifulSoup first, Playwright only as fallback
    - Tiered PDF extraction
    - Idempotent and resumable
    """
    logger.info("Starting crawl for college %s (force=%s)", college_id, force)

    async with async_session_factory() as session:
        college = await session.get(College, college_id)
        if not college:
            logger.error("College %s not found", college_id)
            return

        college.scrape_status = "running"
        await session.commit()

    base_url = college.base_url.rstrip("/")
    max_depth = settings.CRAWLER_MAX_DEPTH
    delay = settings.CRAWLER_REQUEST_DELAY
    recency_delta = timedelta(hours=settings.CRAWLER_RECENCY_SKIP_HOURS)

    # Queue item: (-priority, depth, url, anchor_text)
    queue = [(-100, 0, base_url, "home")]
    visited_urls: set[str] = set()

    headers = {
        "User-Agent": settings.CRAWLER_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
    }

    try:
        async with httpx.AsyncClient(
            headers=headers,
            follow_redirects=True,
            timeout=20.0,
            verify=False,  # Many Indian college portals have self-signed/expired certs
        ) as client:
            robots = await _fetch_robots_txt(client, base_url)

            while queue:
                # Sort queue by priority (-priority means highest score is at index 0)
                queue.sort(key=lambda x: x[0])
                _, depth, current_url, _ = queue.pop(0)

                if current_url in visited_urls:
                    continue
                visited_urls.add(current_url)

                # Check robots.txt
                if not robots.can_fetch(settings.CRAWLER_USER_AGENT, current_url):
                    logger.info("Robots.txt disallows %s; skipping", current_url)
                    continue

                # Check resumability: skip recent pages unless force=True
                async with async_session_factory() as check_session:
                    stmt = select(ScrapedPage).where(
                        ScrapedPage.college_id == college_id,
                        ScrapedPage.url == current_url,
                    )
                    existing_page = (await check_session.execute(stmt)).scalar_one_or_none()

                    if (
                        existing_page
                        and not force
                        and existing_page.last_seen_at
                        and (datetime.now(timezone.utc) - existing_page.last_seen_at) < recency_delta
                    ):
                        logger.debug("Skipping recently visited URL: %s", current_url)
                        continue

                # Rate limiting delay
                await asyncio.sleep(delay)

                try:
                    resp = await client.get(current_url)
                except Exception as e:
                    logger.warning("Failed to fetch %s: %s", current_url, e)
                    continue

                if resp.status_code != 200:
                    continue

                content_type = resp.headers.get("content-type", "").lower()

                # Handle PDF Document
                if "application/pdf" in content_type or current_url.lower().endswith(".pdf"):
                    pdf_bytes = resp.content
                    extracted_text, ocr_used = extract_text_from_pdf(pdf_bytes)
                    content_hash = _sha256(extracted_text if extracted_text else resp.text)

                    # Save to storage
                    filename = f"{uuid.uuid4().hex}_{urllib.parse.quote_plus(current_url.split('/')[-1] or 'doc.pdf')}"
                    storage_service.save_file(
                        pdf_bytes, filename=filename, subfolder=f"colleges/{college_id}"
                    )

                    now = datetime.now(timezone.utc)
                    async with async_session_factory() as write_session:
                        doc_stmt = select(Document).where(
                            Document.college_id == college_id,
                            Document.file_url == current_url,
                        )
                        existing_doc = (await write_session.execute(doc_stmt)).scalar_one_or_none()

                        if existing_doc:
                            existing_doc.last_seen_at = now
                            if existing_doc.content_hash != content_hash:
                                existing_doc.content_hash = content_hash
                                existing_doc.extracted_text = extracted_text
                                existing_doc.ocr_used = ocr_used
                                existing_doc.last_changed_at = now
                        else:
                            new_doc = Document(
                                college_id=college_id,
                                file_url=current_url,
                                file_type="pdf",
                                document_type="unclassified",
                                extracted_text=extracted_text,
                                content_hash=content_hash,
                                ocr_used=ocr_used,
                                created_at=now,
                                last_seen_at=now,
                                last_changed_at=now,
                            )
                            write_session.add(new_doc)
                        await write_session.commit()
                    continue

                # Handle HTML Page
                raw_html = resp.text
                soup = BeautifulSoup(raw_html, "html.parser")

                # Remove noise tags
                for tag in soup(["script", "style", "noscript", "svg"]):
                    tag.decompose()

                extracted_text = soup.get_text(separator="\n", strip=True)

                # Check if page is suspiciously empty (SPA / client-rendered)
                if len(extracted_text) < 150:
                    logger.info("Suspiciously short content (%d chars) for %s; attempting Playwright fallback", len(extracted_text), current_url)
                    pw_html = await _fetch_with_playwright(current_url)
                    if pw_html:
                        pw_soup = BeautifulSoup(pw_html, "html.parser")
                        for tag in pw_soup(["script", "style", "noscript", "svg"]):
                            tag.decompose()
                        pw_text = pw_soup.get_text(separator="\n", strip=True)
                        if len(pw_text) > len(extracted_text):
                            raw_html = pw_html
                            soup = pw_soup
                            extracted_text = pw_text

                content_hash = _sha256(extracted_text)
                now = datetime.now(timezone.utc)

                # Persist page to database immediately
                async with async_session_factory() as write_session:
                    stmt = select(ScrapedPage).where(
                        ScrapedPage.college_id == college_id,
                        ScrapedPage.url == current_url,
                    )
                    existing_page = (await write_session.execute(stmt)).scalar_one_or_none()

                    if existing_page:
                        existing_page.last_seen_at = now
                        if existing_page.content_hash != content_hash:
                            existing_page.content_hash = content_hash
                            existing_page.raw_html = raw_html
                            existing_page.extracted_text = extracted_text
                            existing_page.last_changed_at = now
                    else:
                        new_page = ScrapedPage(
                            college_id=college_id,
                            url=current_url,
                            content_hash=content_hash,
                            raw_html=raw_html,
                            extracted_text=extracted_text,
                            page_type="unclassified",
                            first_seen_at=now,
                            last_seen_at=now,
                            last_changed_at=now,
                        )
                        write_session.add(new_page)
                    await write_session.commit()

                # Extract and queue links if depth < max_depth
                if depth < max_depth:
                    for a in soup.find_all("a", href=True):
                        href = a["href"].strip()
                        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                            continue

                        resolved_url = _normalize_url(href, current_url)
                        if not _is_same_domain(resolved_url, base_url):
                            continue

                        anchor_text = a.get_text(strip=True)
                        priority = _compute_priority(resolved_url, anchor_text)

                        if resolved_url not in visited_urls:
                            queue.append((-priority, depth + 1, resolved_url, anchor_text))

        # Successfully finished crawl
        async with async_session_factory() as session:
            college = await session.get(College, college_id)
            if college:
                college.scrape_status = "idle"
                college.last_scraped_at = datetime.now(timezone.utc)
                await session.commit()
        logger.info("Finished crawl for college %s. Visited %d URLs.", college_id, len(visited_urls))

        # Auto-chain Phase 3 document processing & extraction
        try:
            from app.services.processor import process_college_documents
            await process_college_documents(college_id)
        except Exception as pe:
            logger.warning("Auto-processing documents after crawl failed: %s", pe)

        # Auto-chain targeted curriculum & syllabus discovery for enrolled students
        try:
            from app.models.student import Student
            from app.services.syllabus_extractor import syllabus_extractor
            async with async_session_factory() as session:
                students = (await session.execute(select(Student).where(Student.college_id == college_id))).scalars().all()
                processed_combos = set()
                for st in students:
                    target_course = st.branch or st.course or "CSE"
                    target_sem = str(st.semester or "2")
                    combo = (target_course.lower(), target_sem)
                    if combo not in processed_combos:
                        processed_combos.add(combo)
                        try:
                            await syllabus_extractor.search_and_import_syllabus(
                                college_id=college_id,
                                course=target_course,
                                semester=target_sem,
                                db=session,
                                force_refresh=False,
                            )
                        except Exception as se_err:
                            logger.info("Automatic syllabus extraction for %s Sem %s: %s", target_course, target_sem, se_err)
        except Exception as se:
            logger.warning("Auto syllabus extraction after crawl encountered error: %s", se)

    except Exception as e:
        logger.exception("Error during crawl for college %s: %s", college_id, e)
        async with async_session_factory() as session:
            college = await session.get(College, college_id)
            if college:
                college.scrape_status = "failed"
                await session.commit()
