import logging
import re
import urllib.parse
import uuid
from datetime import datetime, timezone
from typing import Any

import fitz
import httpx
from bs4 import BeautifulSoup
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.college import College
from app.models.document import Document
from app.models.scraped_page import ScrapedPage
from app.models.syllabus import SyllabusEntry
from app.services.storage import storage_service

logger = logging.getLogger("syllabus_extractor")

COMMON_CURRICULUM_PATHS = [
    "/curriculum-syllabus.php",
    "/curriculum-syllabus",
    "/syllabus.php",
    "/syllabus",
    "/curriculum.php",
    "/curriculum",
    "/academics/curriculum",
    "/academics/syllabus",
    "/academics",
    "/course-structure",
    "/scheme-syllabus",
    "/syllabus-archive",
]

COURSE_KEYWORDS: dict[str, list[str]] = {
    "cse": ["cse", "computer science", "cs", "comp sc", "cse-aiml"],
    "it": ["information technology", "it"],
    "ece": ["electronics & communication", "ece", "electronics and communication"],
    "ee": ["electrical engineering", "ee"],
    "me": ["mechanical engineering", "me", "mechanical"],
    "ce": ["civil engineering", "ce", "civil"],
    "aiml": ["artificial intelligence", "aiml", "ai & ml", "ai"],
    "cst": ["computer science & technology", "cst"],
    "bca": ["bca", "bachelor of computer applications"],
    "mca": ["mca", "master of computer applications"],
    "bba": ["bba", "bachelor of business administration"],
    "mba": ["mba", "master of business administration"],
}

ROMAN_MAP = {
    "1": "I", "2": "II", "3": "III", "4": "IV",
    "5": "V", "6": "VI", "7": "VII", "8": "VIII"
}


def _get_semester_regexes(semester: str | int) -> list[re.Pattern]:
    s = str(semester).strip()
    roman = ROMAN_MAP.get(s, s)
    patterns = [
        rf"(?:1st|2nd|3rd|4th|5th|6th|7th|8th|\d+)?\s*(?:year)?\s*{s}(?:st|nd|rd|th)?\s*semester",
        rf"semester\s*[-–:]?\s*{s}(?:st|nd|rd|th)?\b",
        rf"sem\s*[-–:]?\s*{s}\b",
        rf"semester\s*[-–:]?\s*{roman}\b",
        rf"sem\s*[-–:]?\s*{roman}\b",
        rf"{s}(?:st|nd|rd|th)\s*sem\b",
        rf"{roman}\s*sem\b",
    ]
    return [re.compile(p, re.IGNORECASE) for p in patterns]


class SyllabusExtractorService:
    """
    Automated discovery, PDF selection, and PyMuPDF-based table & module extraction
    for university/college syllabi.
    """

    async def discover_curriculum_pages(self, base_url: str) -> tuple[str | None, list[str]]:
        """
        Scan a college website to find its curriculum/syllabus portal page and all PDF links.
        """
        base = base_url.rstrip("/")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        found_page: str | None = None
        pdf_links: list[str] = []

        async with httpx.AsyncClient(
            headers=headers, follow_redirects=True, timeout=15.0, verify=False
        ) as client:
            # 1. Try common known curriculum endpoints
            for path in COMMON_CURRICULUM_PATHS:
                target_url = urllib.parse.urljoin(base, path)
                try:
                    resp = await client.get(target_url)
                    if resp.status_code == 200 and len(resp.text) > 400:
                        soup = BeautifulSoup(resp.text, "html.parser")
                        links = soup.find_all("a", href=True)
                        pdfs = [
                            urllib.parse.urljoin(target_url, a["href"])
                            for a in links
                            if a["href"].lower().endswith(".pdf")
                        ]
                        if pdfs:
                            logger.info("Found curriculum page %s with %d PDFs", target_url, len(pdfs))
                            return target_url, pdfs
                except Exception as e:
                    logger.debug("Failed checking candidate path %s: %s", target_url, e)
                    continue

            # 2. Check homepage navigation for syllabus links
            try:
                resp = await client.get(base)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for a in soup.find_all("a", href=True):
                        href = a["href"].strip()
                        text = a.get_text().lower()
                        href_lower = href.lower()
                        if any(k in text or k in href_lower for k in ["syllabus", "curriculum", "course structure", "academic scheme"]):
                            candidate_url = urllib.parse.urljoin(base, href)
                            if candidate_url.lower().endswith(".pdf"):
                                pdf_links.append(candidate_url)
                            else:
                                try:
                                    page_resp = await client.get(candidate_url)
                                    if page_resp.status_code == 200:
                                        page_soup = BeautifulSoup(page_resp.text, "html.parser")
                                        page_pdfs = [
                                            urllib.parse.urljoin(candidate_url, p["href"])
                                            for p in page_soup.find_all("a", href=True)
                                            if p["href"].lower().endswith(".pdf")
                                        ]
                                        if page_pdfs:
                                            return candidate_url, page_pdfs
                                except Exception:
                                    continue
            except Exception as e:
                logger.warning("Error scanning homepage for syllabus links: %s", e)

        return found_page, pdf_links

    def match_best_pdf(
        self, pdf_links: list[str], course: str, preferred_regulation: str | None = None
    ) -> str | None:
        """
        Score candidate PDF links based on course/branch keywords and regulation currency.
        Returns the URL of the most relevant syllabus PDF.
        """
        course_clean = course.lower().strip()
        keywords = [course_clean]

        for key, synonyms in COURSE_KEYWORDS.items():
            if key in course_clean or any(syn in course_clean for syn in synonyms):
                keywords.extend(synonyms)
                keywords.append(key)
        keywords = list(set(keywords))

        scored_candidates: list[tuple[int, str]] = []

        for link in pdf_links:
            score = 0
            link_lower = link.lower()

            # Course match
            for kw in keywords:
                if kw in link_lower:
                    score += 50
                    break

            # Regulation match: prefer requested or latest regulation (e.g. R25 > R23 > R21)
            if preferred_regulation and preferred_regulation.lower() in link_lower:
                score += 80

            reg_match = re.search(r"r(\d{2})", link_lower)
            if reg_match:
                score += int(reg_match.group(1))

            year_match = re.search(r"20(\d{2})", link_lower)
            if year_match:
                score += int(year_match.group(1))

            if "syllabus" in link_lower or "curriculum" in link_lower:
                score += 10

            if score > 0:
                scored_candidates.append((score, link))

        if not scored_candidates:
            # Fallback to any PDF mentioning curriculum/syllabus
            for link in pdf_links:
                if "syllabus" in link.lower() or "curriculum" in link.lower():
                    scored_candidates.append((10, link))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        return scored_candidates[0][1] if scored_candidates else None

    def extract_courses_from_pdf(
        self, pdf_bytes: bytes, semester: str
    ) -> dict[str, Any]:
        """
        Parse the PDF using PyMuPDF (fitz) to extract:
        1. Semester course table (codes, subjects, contact hours, credits, category).
        2. Granular module topics and syllabus sub-units from detailed section pages.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        sem_str = str(semester).strip()
        patterns = _get_semester_regexes(sem_str)

        extracted_courses: list[dict[str, Any]] = []
        semester_page_idx: int | None = None

        # Phase 1: Search first 25 pages for semester blueprint table
        for page_idx in range(min(25, len(doc))):
            page = doc[page_idx]
            text = page.get_text()

            matches_semester = any(
                p.search(text[:600]) or p.search(text) for p in patterns
            )
            if not matches_semester:
                continue

            tables = page.find_tables()
            if not tables:
                continue

            semester_page_idx = page_idx
            current_category = "Theory"

            for tab in tables:
                rows = tab.extract()
                for row in rows:
                    clean = [
                        c.replace("\n", " ").strip()
                        for c in row
                        if c and c.strip()
                    ]
                    if not clean:
                        continue

                    row_text = " ".join(clean)

                    # Course code regex: supports standard codes (CS301), codes with parentheses like EC(CS)301, M(CS)301,
                    # single-letter department codes (M201, M101), lab codes (CS391, EC(CS)391), and hyphenated codes (PCC-CS201)
                    code_pattern = re.compile(
                        r"\b([A-Za-z]{1,4}(?:\([A-Za-z]+\))?(?:-[A-Za-z0-9]+)?\s*\d{3,4}[A-Za-z]?)\b"
                    )
                    code_match = code_pattern.search(row_text)

                    # Only update category if row is a section header (no course code present)
                    if not code_match:
                        if "THEORY" in row_text.upper():
                            current_category = "Theory"
                        elif "PRACTICAL" in row_text.upper() or "SESSIONAL" in row_text.upper():
                            current_category = "Practical"
                        elif "MANDATORY" in row_text.upper():
                            current_category = "Mandatory"
                        elif "PROJECT" in row_text.upper():
                            current_category = "Project"
                        continue

                    code = code_match.group(1).replace(" ", "")

                    # Extract subject title
                    title = ""
                    for i, cell in enumerate(clean):
                        if code in cell:
                            if i + 1 < len(clean):
                                title = clean[i + 1]
                            break

                    if not title:
                        for cell in clean:
                            if (
                                cell != code
                                and len(cell) > 3
                                and not re.match(r"^[\d\.\-\s]+$", cell)
                                and not any(k in cell.upper() for k in ["MAJOR", "MINOR", "ENGG", "SCI", "HUM"])
                            ):
                                title = cell
                                break

                    if not title or len(title) < 2:
                        continue

                    # Extract credits & contact hours from trailing numeric values
                    numerics = [c for c in clean if re.match(r"^\d+(?:\.\d+)?$", c)]
                    hours = ""
                    credits = "3"
                    if len(numerics) >= 5:
                        hours = f"{numerics[-5]}L-{numerics[-4]}T-{numerics[-3]}P"
                        credits = numerics[-1]
                    elif len(numerics) >= 4:
                        hours = f"{numerics[-4]}L-{numerics[-3]}T-{numerics[-2]}P"
                        credits = numerics[-1]
                    elif len(numerics) >= 1:
                        credits = numerics[-1]

                    if not any(c["code"] == code for c in extracted_courses):
                        extracted_courses.append({
                            "code": code,
                            "title": title,
                            "category": current_category,
                            "hours": hours,
                            "credits": credits,
                            "page": page_idx + 1,
                            "modules": [],
                        })

            if extracted_courses:
                break

        # Phase 2: Search for detailed module syllabus sections across the document
        if extracted_courses:
            start_search = (semester_page_idx + 1) if semester_page_idx is not None else 10
            for course in extracted_courses:
                code = course["code"]
                course_modules: list[dict[str, str]] = []

                # Find the page where this course syllabus begins
                found_page = None
                for p_idx in range(start_search, len(doc)):
                    p_text = doc[p_idx].get_text()
                    escaped_code = re.escape(code)
                    if re.search(rf"(?:Course|Paper)\s*Code:\s*{escaped_code}\b", p_text, re.IGNORECASE) or (
                        code in p_text and ("Course Name:" in p_text or "Total Contact Hours" in p_text)
                    ):
                        found_page = p_idx
                        break

                if found_page is not None:
                    # Scan found_page and subsequent 3 pages for modules
                    combined = "\n".join([
                        doc[p].get_text()
                        for p in range(found_page, min(found_page + 4, len(doc)))
                    ])
                    lines = [line.strip() for line in combined.splitlines() if line.strip()]
                    for l_idx, line in enumerate(lines):
                        mod_match = re.match(
                            r"^(Module|Unit)\s*[-–:]?\s*(\d+|[IVXLCDM]+)[\s:–-]*(.+)$",
                            line,
                            re.IGNORECASE,
                        )
                        if mod_match:
                            unit_label = f"{mod_match.group(1)} {mod_match.group(2)}"
                            unit_title = mod_match.group(3).strip()
                            desc_lines = []
                            for d_idx in range(l_idx + 1, min(l_idx + 8, len(lines))):
                                next_line = lines[d_idx]
                                if re.match(r"^(Module|Unit|Course Outcome|CO\d|Reference|Text Book)", next_line, re.IGNORECASE):
                                    break
                                desc_lines.append(next_line)
                            desc = " ".join(desc_lines).strip()
                            course_modules.append({
                                "unit": unit_label,
                                "title": unit_title,
                                "description": desc or f"Core study modules and concepts for {unit_title}",
                            })
                    if course_modules:
                        course["modules"] = course_modules

        return {
            "semester": sem_str,
            "total_courses": len(extracted_courses),
            "courses": extracted_courses,
            "table_page": (semester_page_idx + 1) if semester_page_idx is not None else None,
        }

    async def search_and_import_syllabus(
        self,
        college_id: uuid.UUID,
        course: str,
        semester: str,
        db: AsyncSession,
        regulation: str | None = None,
        force_refresh: bool = False,
    ) -> dict[str, Any]:
        """
        Complete workflow:
        1. Find college & curriculum page.
        2. Match regulation PDF.
        3. Download & persist Document.
        4. Extract semester courses & modules with PyMuPDF.
        5. Populate SyllabusEntry records.
        """
        college = await db.get(College, college_id)
        if not college:
            raise ValueError(f"College with id {college_id} not found")

        # 1. Discover curriculum page & PDFs
        curriculum_page, pdf_links = await self.discover_curriculum_pages(college.base_url)
        if not pdf_links:
            stmt = select(ScrapedPage).where(ScrapedPage.college_id == college_id)
            pages = (await db.execute(stmt)).scalars().all()
            for p in pages:
                soup = BeautifulSoup(p.raw_html, "html.parser")
                for a in soup.find_all("a", href=True):
                    h = a["href"].strip()
                    if h.lower().endswith(".pdf"):
                        pdf_links.append(urllib.parse.urljoin(p.url, h))

        if not pdf_links:
            raise RuntimeError(
                f"No syllabus or curriculum PDF links could be discovered on {college.base_url}"
            )

        # 2. Pick best matching PDF for course and regulation
        best_pdf_url = self.match_best_pdf(pdf_links, course, regulation)
        if not best_pdf_url:
            best_pdf_url = pdf_links[0]

        logger.info("Selected syllabus PDF for %s Sem %s: %s", course, semester, best_pdf_url)

        # 3. Download PDF
        headers = {"User-Agent": "Mozilla/5.0"}
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30.0, verify=False) as client:
            resp = await client.get(best_pdf_url)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Failed to download syllabus PDF from {best_pdf_url} (status {resp.status_code})"
                )
            pdf_bytes = resp.content

        # 4. Save or retrieve Document in DB
        doc_stmt = select(Document).where(
            Document.college_id == college_id,
            Document.file_url == best_pdf_url,
        )
        doc = (await db.execute(doc_stmt)).scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if not doc:
            filename = f"syllabus_{course}_{semester}_{uuid.uuid4().hex[:8]}.pdf"
            storage_service.save_file(
                pdf_bytes, filename=filename, subfolder=f"colleges/{college_id}"
            )
            doc = Document(
                college_id=college_id,
                file_url=best_pdf_url,
                file_type="pdf",
                document_type="syllabus",
                created_at=now,
                last_seen_at=now,
            )
            db.add(doc)
            await db.flush()

        # 5. Extract courses & modules via PyMuPDF
        parsed_data = self.extract_courses_from_pdf(pdf_bytes, semester)
        courses = parsed_data.get("courses", [])

        if not courses:
            raise RuntimeError(
                f"No course table could be extracted for {course} Semester {semester} from {best_pdf_url}"
            )

        # 6. Delete previous entries if force_refresh
        if force_refresh:
            await db.execute(
                delete(SyllabusEntry).where(
                    SyllabusEntry.college_id == college_id,
                    SyllabusEntry.course.ilike(f"%{course}%"),
                    SyllabusEntry.semester == str(semester),
                )
            )

        # 7. Insert new SyllabusEntry records
        created_entries: list[SyllabusEntry] = []
        for c in courses:
            code = c["code"]
            title = c["title"]
            cat = c.get("category", "Theory")
            credits = c.get("credits", "3")
            hours = c.get("hours", "")
            modules = c.get("modules", [])

            hours_desc = f"Contact Hours: {hours}." if hours else ""
            blueprint_entry = SyllabusEntry(
                college_id=college_id,
                course=course,
                semester=str(semester),
                subject=title,
                topic_title=f"[{code}] {title} - Course Blueprint",
                topic_description=f"Category: {cat} | Credits: {credits} | {hours_desc} Officially approved curriculum by the Academic Board.",
                source_document_id=doc.id,
            )
            db.add(blueprint_entry)
            created_entries.append(blueprint_entry)

            for m in modules:
                mod_entry = SyllabusEntry(
                    college_id=college_id,
                    course=course,
                    semester=str(semester),
                    subject=title,
                    topic_title=f"[{code}] {m['unit']}: {m['title']}",
                    topic_description=m["description"],
                    source_document_id=doc.id,
                )
                db.add(mod_entry)
                created_entries.append(mod_entry)

        await db.commit()
        for e in created_entries:
            await db.refresh(e)

        return {
            "message": f"Successfully extracted {len(courses)} courses and {len(created_entries)} syllabus blueprints for {course} Sem {semester}.",
            "college_id": college_id,
            "course": course,
            "semester": str(semester),
            "source_pdf_url": best_pdf_url,
            "total_courses_found": len(courses),
            "total_entries_created": len(created_entries),
            "entries": created_entries,
        }


syllabus_extractor = SyllabusExtractorService()
