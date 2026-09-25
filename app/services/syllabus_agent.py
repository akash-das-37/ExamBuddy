"""
Syllabus Discovery Agent — the core backend service that:
  1. Validates and sanitizes the college portal URL (SSRF protection)
  2. Crawls the portal homepage + academic sub-pages
  3. Discovers links to PDF/DOC/DOCX syllabus documents
  4. Scores each candidate against the student's academic profile using AI matching
  5. Verifies the best-matching document is reachable and correct file type
  6. Stores the ORIGINAL document URL in SyllabusDocument (never downloads or alters it)
  7. Returns the cached result for subsequent requests

IMPORTANT RULE: This agent is an official-document DISCOVERY system.
                It does NOT generate, recreate, convert, or modify any document.
                The original college URL is preserved end-to-end.
"""
import json
import logging
import re
import socket
import urllib.parse
import urllib.robotparser
import uuid
from datetime import datetime, timezone
from ipaddress import ip_address, ip_network
from typing import Any

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.college import College
from app.models.syllabus_document import SyllabusDocument
from app.services.llm_service import llm_service

logger = logging.getLogger("syllabus_agent")

# ---------------------------------------------------------------------------
# Configuration / Limits
# ---------------------------------------------------------------------------
MAX_CRAWL_DEPTH = 4
MAX_PAGES = 80
MAX_DOCUMENTS = 100
REQUEST_TIMEOUT = 20.0
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
RATE_LIMIT_DELAY = 0.3  # seconds between requests

# Minimum confidence score to accept a document as the syllabus
# Lowered — merged/all-semester docs may not mention specific semester
MIN_CONFIDENCE_SCORE = 10.0

# ---------------------------------------------------------------------------
# Private IP / localhost ranges — block for SSRF protection
# ---------------------------------------------------------------------------
_PRIVATE_NETS = [
    ip_network("10.0.0.0/8"),
    ip_network("172.16.0.0/12"),
    ip_network("192.168.0.0/16"),
    ip_network("127.0.0.0/8"),
    ip_network("::1/128"),
    ip_network("fc00::/7"),
    ip_network("169.254.0.0/16"),  # link-local
]

# ---------------------------------------------------------------------------
# Keyword sets for link/page prioritization
# ---------------------------------------------------------------------------
DIRECT_SYLLABUS_KEYWORDS = [
    "syllabus", "syllabi", "curriculum", "course structure", "course-structure",
    "scheme-syllabus", "scheme_syllabus", "courseplan", "course-plan",
    "detailed syllabus", "detailed-syllabus", "prescribed syllabus",
    "all semester", "all-semester", "complete syllabus", "full syllabus",
]

ACADEMIC_PAGE_KEYWORDS = [
    "academic", "academics", "department", "departments", "programme", "programmes",
    "courses", "course", "undergraduate", "ug", "btech", "b.tech", "scheme",
    "regulation", "regulations", "study material", "downloads", "student corner",
    "r21", "r23", "r25", "r19", "r20", "r22", "r24",
    "makaut", "aktu", "rgpv", "vtu", "anna university", "sppu", "mumbai university",
]

DOCUMENT_PRIORITY_KEYWORDS = [
    "syllabus", "curriculum", "scheme", "regulation", "course", "structure",
    "programme", "btech", "b.tech", "semester", "sem", "year",
    "r21", "r23", "r25", "r19", "r20", "r22", "r24", "detailed", "prescribed",
    "complete", "all", "integrated", "consolidated",
]

EXCLUDE_KEYWORDS = [
    "result", "admit", "hall-ticket", "marksheet", "fee", "admission",
    "login", "portal", "gallery", "event", "events", "news", "contact", "about",
    "faculty", "staff", "placement", "placements", "hostel", "library", "anti-ragging",
    "grievance", "feedback", "alumni", "iqac", "naac", "tender", "summer-school",
    "conference", "apply-now", "apply now",
]


def _is_blocked_host(url: str) -> bool:
    """
    SSRF Protection: Block URLs that resolve to private/localhost addresses.
    Returns True if the URL should be blocked.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname or ""

        # Block common localhost forms
        if hostname in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
            return True

        # Block metadata service
        if hostname in ("169.254.169.254", "metadata.google.internal"):
            return True

        # Resolve and check IP
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for _family, _type, _proto, _canonname, sockaddr in addr_info:
                ip_str = sockaddr[0]
                ip = ip_address(ip_str)
                for net in _PRIVATE_NETS:
                    if ip in net:
                        logger.warning("SSRF blocked: %s resolves to private IP %s", url, ip_str)
                        return True
        except (socket.gaierror, ValueError):
            pass  # Can't resolve — allow, will fail on fetch

        return False
    except Exception:
        return False


def _validate_college_url(raw_url: str) -> tuple[str, str]:
    """
    Validate and normalize a college URL.
    Returns (clean_url, base_url).
    Raises ValueError for invalid or blocked URLs.
    """
    url = raw_url.strip().rstrip("/")
    if not url:
        raise ValueError("College URL cannot be empty.")

    # Auto-prefix https
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    parsed = urllib.parse.urlparse(url)

    # Must have a valid hostname
    if not parsed.netloc or not parsed.hostname:
        raise ValueError(f"Invalid URL format: {url}")

    # Reject non-HTTP schemes
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Only http/https URLs are allowed. Got: {parsed.scheme}")

    # SSRF protection
    if _is_blocked_host(url):
        raise ValueError(f"URL targets a private or localhost address: {url}")

    clean_url = url
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    return clean_url, base_url


def _is_same_domain(url: str, base_url: str) -> bool:
    """
    Check if url belongs to same domain/subdomain as base_url.
    Also allows document hosts commonly used by Indian colleges
    (e.g. affiliating universities like MAKAUT/AKTU/VTU, Google Drive,
    AWS S3, and CDN subdomains).
    """
    base_parsed = urllib.parse.urlparse(base_url)
    url_parsed = urllib.parse.urlparse(url)

    base_netloc = base_parsed.netloc.lower().lstrip("www.")
    url_netloc = url_parsed.netloc.lower().lstrip("www.")

    if url_netloc == base_netloc or url_netloc.endswith("." + base_netloc):
        return True

    # Allow affiliating university and trusted document hosts
    shared_doc_hosts = [
        "drive.google.com", "docs.google.com", "storage.googleapis.com",
        "amazonaws.com", "s3.amazonaws.com",
        "makautwb.ac.in", "makautexam.net", "wbut.ac.in",
        "aktu.ac.in", "vtu.ac.in", "annauniv.edu", "rgpv.ac.in",
        "unipune.ac.in", "mu.ac.in", "bput.ac.in", "csvtu.ac.in",
    ]
    if any(url_netloc == h or url_netloc.endswith("." + h) for h in shared_doc_hosts):
        return True

    return False


def _normalize_url(href: str, current_url: str) -> str:
    """Resolve relative href against current page URL, strip fragment."""
    joined = urllib.parse.urljoin(current_url, href)
    parsed = urllib.parse.urlparse(joined)
    return urllib.parse.urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, "")
    ).rstrip("/")


def _link_priority(url: str, anchor_text: str) -> int:
    """
    Score a link for relevance to syllabus discovery. Higher = prioritized first in crawl queue.
    Uses tiered keyword scoring to ensure direct syllabus pages jump to the front of the queue.
    """
    combined = f"{url.lower()} {anchor_text.lower()}"
    score = 0

    # Negative penalty for clearly irrelevant pages (admission, gallery, etc.)
    for ex in EXCLUDE_KEYWORDS:
        if ex in combined:
            score -= 60
            break

    # Tier 1: Direct syllabus / curriculum links — highest crawl priority
    for kw in DIRECT_SYLLABUS_KEYWORDS:
        if kw in combined:
            score += 90
            break

    # Tier 2: Academic, department, or programme pages
    for kw in ACADEMIC_PAGE_KEYWORDS:
        if kw in combined:
            score += 35
            break

    # Extra boost for direct document links
    if any(combined.endswith(ext) for ext in (".pdf", ".doc", ".docx")):
        score += 50

    return score


def _is_document_url(url: str) -> bool:
    """Check if a URL directly links to or serves a document file."""
    lower = url.lower()
    clean_path = lower.split("?")[0]
    if clean_path.endswith((".pdf", ".doc", ".docx")):
        return True

    # Check query params (e.g. ?file=CSE_syllabus.pdf or ?doc=syllabus.pdf)
    if any(ext in lower for ext in (".pdf", ".docx", ".doc")):
        parsed = urllib.parse.urlparse(lower)
        if any(ext in parsed.query for ext in (".pdf", ".docx", ".doc")):
            return True

    # Google Drive file viewer / uc links
    if "drive.google.com/file/d/" in lower or "drive.google.com/uc?" in lower:
        return True

    return False


def _get_file_type(url: str, content_type: str = "") -> str | None:
    """Determine file type from URL extension or content-type header."""
    lower_url = url.lower()
    if ".pdf" in lower_url or "application/pdf" in content_type:
        return "pdf"
    if ".docx" in lower_url or "officedocument.wordprocessingml" in content_type:
        return "docx"
    if ".doc" in lower_url or "application/msword" in content_type:
        return "doc"
    return None


# ---------------------------------------------------------------------------
# AI Matching / Confidence Scoring
# ---------------------------------------------------------------------------
ROMAN_MAP = {
    "1": "I", "2": "II", "3": "III", "4": "IV",
    "5": "V", "6": "VI", "7": "VII", "8": "VIII"
}

BRANCH_SYNONYMS: dict[str, list[str]] = {
    "cse": ["cse", "computer science", "cs", "comp sc", "computer science & engineering",
            "computer science engineering", "cse-aiml", "cst"],
    "it":  ["information technology", "it", "information tech"],
    "ece": ["electronics & communication", "ece", "electronics and communication",
            "ec", "electronics communication engineering"],
    "ee":  ["electrical engineering", "ee", "electrical", "eee",
            "electrical & electronics"],
    "me":  ["mechanical engineering", "me", "mechanical", "mech"],
    "ce":  ["civil engineering", "ce", "civil"],
    "aiml": ["artificial intelligence", "aiml", "ai & ml", "ai", "ai/ml", "ml"],
    "bca": ["bca", "bachelor of computer applications"],
    "mca": ["mca", "master of computer applications"],
}

COURSE_SYNONYMS = {
    "b.tech": ["b.tech", "btech", "bachelor of technology", "b tech"],
    "b.e.": ["b.e.", "be", "bachelor of engineering"],
    "m.tech": ["m.tech", "mtech", "master of technology"],
    "mca": ["mca"],
    "bca": ["bca"],
}


def _score_document(
    doc_url: str,
    surrounding_text: str,
    page_title: str,
    course: str,
    branch: str,
    semester: str | int,
    academic_year: str | None,
) -> tuple[float, list[str]]:
    """
    AI-style scoring of a candidate document.
    Returns (score 0-100, reasons).

    Scoring rubric:
        Official syllabus keyword  → +15
        Course match               → +20
        Branch match               → +25
        Semester-specific match    → +30
        Merged/all-semester doc    → +20  ← Indian colleges often have 1 PDF for all sems
        Academic year match        → +8
        PDF format preferred       → +5
        Regulation code match      → +7
        Negative: result/admit     → -40

    Key insight for Indian colleges:
        Many colleges publish a SINGLE combined PDF covering all 8 semesters.
        If the document doesn't mention any specific semester but mentions the
        branch/course + syllabus keywords, it's likely a merged document.
        We give it a bonus instead of a penalty.
    """
    score = 0.0
    reasons: list[str] = []

    combined = f"{doc_url.lower()} {surrounding_text.lower()} {page_title.lower()}"
    sem_str = str(semester).strip()
    roman = ROMAN_MAP.get(sem_str, sem_str)

    # 1. Official syllabus keyword — expanded for Indian universities
    syllabus_kws = [
        "syllabus", "syllabi", "curriculum", "scheme", "course structure",
        "regulation", "programme", "courseplan", "course plan", "detailed syllabus",
        "course outline", "course details", "teaching scheme", "credits",
        "l-t-p", "ltp", "obe", "outcome based", "prescribed syllabus",
        "academic syllabus", "semester syllabus", "yearly syllabus",
    ]
    if any(kw in combined for kw in syllabus_kws):
        score += 15
        reasons.append("Contains official syllabus keyword (+15)")

    # 2. Course match
    course_lower = (course or "").lower()
    course_syns = []
    for key, syns in COURSE_SYNONYMS.items():
        if any(s in course_lower for s in syns):
            course_syns = syns
            break
    if not course_syns:
        course_syns = [course_lower]

    if any(syn in combined for syn in course_syns):
        score += 20
        reasons.append(f"Matches course '{course}' (+20)")

    # 3. Branch match — use expanded synonyms
    branch_lower = (branch or "").lower()
    branch_syns = []
    for key, syns in BRANCH_SYNONYMS.items():
        if key == branch_lower or branch_lower in syns:
            branch_syns = syns
            break
    if not branch_syns:
        branch_syns = [branch_lower]

    if any(syn in combined for syn in branch_syns):
        score += 25
        reasons.append(f"Matches branch '{branch}' (+25)")

    # 4a. Specific semester match
    ordinal_map = {"1": "1st", "2": "2nd", "3": "3rd", "4": "4th",
                   "5": "5th", "6": "6th", "7": "7th", "8": "8th"}
    ordinal = ordinal_map.get(sem_str, sem_str)

    sem_patterns = [
        f"sem{sem_str}", f"sem-{sem_str}", f"sem {sem_str}",
        f"semester{sem_str}", f"semester {sem_str}", f"semester-{sem_str}",
        ordinal + " sem", ordinal + "sem",
        roman.lower() + " sem", roman.lower() + "sem",
        roman.lower() + " semester",
        f"s{sem_str}_", f"s{sem_str}.", f"s0{sem_str}",
    ]
    semester_found = any(p in combined for p in sem_patterns)
    if semester_found:
        score += 30
        reasons.append(f"Matches semester {sem_str} / {roman} (+30)")

    # 4b. Merged / all-semester document detection
    # Indian colleges commonly publish one PDF for all 8 semesters
    merged_patterns = [
        "all semester", "all semesters", "all sem", "complete syllabus",
        "complete curriculum", "consolidated", "integrated syllabus",
        "1 to 8", "1-8", "i to viii", "i-viii",
        "sem i to", "sem 1 to", "semester i to", "semester 1 to",
        "1st to", "first to eighth", "1st year to",
        "all years", "four year", "4 year", "four-year",
        "full syllabus", "entire syllabus", "complete course",
    ]
    is_merged = any(p in combined for p in merged_patterns)

    # Also detect merged: URL filename has no semester number but has branch name
    filename = doc_url.split("/")[-1].split("?")[0].lower()
    has_branch_in_filename = any(syn in filename for syn in branch_syns)
    has_no_sem_in_filename = not any(
        f"sem{i}" in filename or f"s{i}" in filename or f"sem-{i}" in filename
        for i in range(1, 9)
    )
    if has_branch_in_filename and has_no_sem_in_filename and not semester_found:
        is_merged = True

    if is_merged and not semester_found:
        score += 20
        reasons.append("Merged all-semester document — covers all semesters (+20)")

    # 4c. If it's on the college's syllabus/academics page but no semester, mild bonus
    academic_page_indicators = [
        "/academic", "/syllabus", "/curriculum", "/department",
        "/downloads", "/study", "/courses",
    ]
    if not semester_found and not is_merged:
        src_url = (surrounding_text + " " + page_title).lower()
        if any(ind in src_url or ind in combined for ind in academic_page_indicators):
            score += 5
            reasons.append("Found on academic/syllabus page (+5)")

    # 5. Regulation code match (very common in Indian colleges: R21, R23, NEP, etc.)
    reg_patterns = ["r21", "r23", "r19", "r20", "r22", "r24", "r25",
                    "regulation 20", "nep2020", "nep 2020",
                    "2021 regulation", "2023 regulation", "2025 regulation"]
    if any(r in combined for r in reg_patterns):
        score += 7
        reasons.append("Contains regulation code (R21/R23/etc.) (+7)")

    # 5b. Cohort-aware regulation bonus based on student semester
    sem_int = int(sem_str) if sem_str.isdigit() else 1
    target_scope = filename if any(f"r{yy}" in filename or f"20{yy}" in filename for yy in range(14, 30)) else combined
    if sem_int <= 2 and any(r in target_scope for r in ["r25", "2025", "r24", "2024"]):
        score += 4
        reasons.append("Matches expected regulation for 1st year cohort (+4)")
    elif 3 <= sem_int <= 4 and any(r in target_scope for r in ["r23", "2023", "r22", "2022"]):
        score += 4
        reasons.append("Matches expected regulation for 2nd year cohort (+4)")
    elif 5 <= sem_int <= 6 and any(r in target_scope for r in ["r21", "2021", "r20", "2020"]):
        score += 4
        reasons.append("Matches expected regulation for 3rd year cohort (+4)")
    elif sem_int >= 7 and any(r in target_scope for r in ["r21", "2021", "r18", "2018"]):
        score += 4
        reasons.append("Matches expected regulation for 4th year cohort (+4)")

    # 6. Academic year
    if academic_year and academic_year in combined:
        score += 8
        reasons.append(f"Matches academic year '{academic_year}' (+8)")

    # 7. PDF preferred
    if doc_url.lower().endswith(".pdf"):
        score += 5
        reasons.append("PDF format preferred (+5)")

    # 8. Hard penalty for non-syllabus documents
    negative_kws = ["result", "admit-card", "marksheet", "admit card", "hallticket",
                    "question paper", "answer key", "answer-key", "routine",
                    "timetable", "time-table", "notice", "circular",
                    "fee structure", "admission", "prospectus"]
    for nkw in negative_kws:
        if nkw in combined:
            score -= 40
            reasons.append(f"Negative: contains '{nkw}' (-40)")
            break

    return max(score, 0.0), reasons


# ---------------------------------------------------------------------------
# Main Agent Class
# ---------------------------------------------------------------------------

class SyllabusDiscoveryAgent:
    """
    An agent that crawls a college portal and discovers the original syllabus
    document (PDF/DOC/DOCX) for a given course/branch/semester combination.

    This agent NEVER downloads, modifies, or re-generates syllabus content.
    It only stores the original document URL from the college website.
    """

    def __init__(self):
        self._headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

    async def _fetch_robots(self, client: httpx.AsyncClient, base_url: str) -> urllib.robotparser.RobotFileParser:
        rp = urllib.robotparser.RobotFileParser()
        robots_url = urllib.parse.urljoin(base_url, "/robots.txt")
        try:
            resp = await client.get(robots_url, timeout=10.0)
            if resp.status_code == 200:
                rp.parse(resp.text.splitlines())
            else:
                rp.allow_all = True
        except Exception:
            rp.allow_all = True
        return rp

    async def _fetch_html(
        self, client: httpx.AsyncClient, url: str, robots: urllib.robotparser.RobotFileParser
    ) -> tuple[str, str]:
        """Fetch HTML page. Returns (html_text, final_url_after_redirects)."""
        if not robots.can_fetch("*", url):
            logger.debug("robots.txt disallows: %s", url)
            return "", url
        try:
            resp = await client.get(url, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 200:
                return resp.text, str(resp.url)
        except Exception as e:
            logger.debug("Fetch failed %s: %s", url, e)
        return "", url

    async def _verify_document(
        self, client: httpx.AsyncClient, doc_url: str
    ) -> tuple[bool, str, str | None, int | None]:
        """
        Verify a document URL is reachable.
        Returns (is_valid, file_type, content_type_header, content_length).

        Indian college servers are notoriously quirky:
        - Many return 403/405 on HEAD requests (but GET works fine)
        - Some block Range requests
        - SSL certs are often self-signed / expired
        - Servers may be slow — use generous timeouts

        Strategy: determine file type from URL first.
        If the URL clearly ends in .pdf/.doc/.docx, trust it
        unless we get a definitive 404/410 (file not found).
        """
        # Step 1: Determine file type from URL extension first
        file_type_from_url = _get_file_type(doc_url, "")
        if not file_type_from_url:
            return False, "", None, None

        try:
            # Step 2: Try HEAD first (lightweight)
            resp = await client.head(doc_url, timeout=REQUEST_TIMEOUT)

            # Definitive "not found" codes
            if resp.status_code in (404, 410, 400):
                logger.debug("Document not found (HTTP %d): %s", resp.status_code, doc_url)
                return False, "", None, None

            # 200/206 = confirmed reachable
            if resp.status_code in (200, 206):
                ct = resp.headers.get("content-type", "").lower()
                cl_str = resp.headers.get("content-length")
                content_length = int(cl_str) if cl_str and cl_str.isdigit() else None
                if content_length and content_length > MAX_FILE_SIZE_BYTES:
                    return False, "", ct, content_length
                file_type = _get_file_type(doc_url, ct) or file_type_from_url
                return True, file_type, ct, content_length

            # 403/405/501 = server blocks HEAD but file may exist (very common in India)
            # Trust the URL extension in this case
            if resp.status_code in (403, 405, 501, 302, 301):
                logger.debug(
                    "Server returned %d on HEAD (likely blocks HEAD method), "
                    "trusting URL extension: %s", resp.status_code, doc_url
                )
                return True, file_type_from_url, None, None

        except (httpx.ConnectError, httpx.RemoteProtocolError):
            # Server refused connection — truly unreachable
            return False, "", None, None
        except Exception:
            pass  # Fall through to GET attempt

        # Step 3: Fall back to GET with small Range header
        try:
            resp = await client.get(
                doc_url,
                headers={**self._headers, "Range": "bytes=0-2047"},
                timeout=REQUEST_TIMEOUT,
            )
            if resp.status_code in (404, 410, 400):
                return False, "", None, None
            if resp.status_code in (200, 206):
                ct = resp.headers.get("content-type", "").lower()
                cl_str = resp.headers.get("content-length")
                content_length = int(cl_str) if cl_str and cl_str.isdigit() else None
                file_type = _get_file_type(doc_url, ct) or file_type_from_url
                return True, file_type, ct, content_length
            # Any other non-4xx: trust the URL
            if resp.status_code < 400:
                return True, file_type_from_url, None, None
        except Exception as e:
            logger.debug("GET verification failed %s: %s", doc_url, e)

        # Step 4: Last resort — if URL clearly has a document extension, trust it
        # This handles servers that block all automated requests
        if file_type_from_url:
            logger.info(
                "Could not verify via HTTP but URL extension is .%s — trusting: %s",
                file_type_from_url, doc_url
            )
            return True, file_type_from_url, None, None

        return False, "", None, None

    def _extract_doc_links_from_html(
        self, html: str, page_url: str, base_url: str
    ) -> list[tuple[str, str]]:
        """
        Extract document links from an HTML page.
        Scans <a> tags, embedded <iframe>, <embed>, and <object> elements.
        Returns list of (doc_url, anchor_text).
        """
        soup = BeautifulSoup(html, "html.parser")
        docs: list[tuple[str, str]] = []
        seen: set[str] = set()

        # 1. Standard anchor tags
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue

            resolved = _normalize_url(href, page_url)
            if not _is_same_domain(resolved, base_url):
                continue
            if _is_blocked_host(resolved):
                continue

            anchor_text = a.get_text(strip=True)

            if _is_document_url(resolved) and resolved not in seen:
                seen.add(resolved)
                docs.append((resolved, anchor_text))

        # 2. Embedded PDF viewers (iframe, embed, object)
        for tag in soup.find_all(["iframe", "embed"], src=True):
            src = tag["src"].strip()
            if not src or src.startswith(("#", "javascript:")):
                continue
            resolved = _normalize_url(src, page_url)
            if not _is_same_domain(resolved, base_url) or _is_blocked_host(resolved):
                continue
            if _is_document_url(resolved) and resolved not in seen:
                seen.add(resolved)
                docs.append((resolved, tag.get("title", "") or "Embedded Syllabus"))

        for obj in soup.find_all("object", data=True):
            data = obj["data"].strip()
            if not data:
                continue
            resolved = _normalize_url(data, page_url)
            if not _is_same_domain(resolved, base_url) or _is_blocked_host(resolved):
                continue
            if _is_document_url(resolved) and resolved not in seen:
                seen.add(resolved)
                docs.append((resolved, "Embedded Document"))

        return docs

    def _extract_page_links(
        self, html: str, page_url: str, base_url: str
    ) -> list[tuple[str, str, int]]:
        """
        Extract internal page links for further crawling.
        Returns list of (url, anchor_text, priority_score).
        """
        soup = BeautifulSoup(html, "html.parser")
        links: list[tuple[str, str, int]] = []
        seen: set[str] = set()

        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue
            if _is_document_url(href):
                continue  # handled separately

            resolved = _normalize_url(href, page_url)
            if not _is_same_domain(resolved, base_url):
                continue
            if resolved in seen:
                continue
            seen.add(resolved)

            anchor_text = a.get_text(strip=True)
            priority = _link_priority(resolved, anchor_text)
            if priority > 0:
                links.append((resolved, anchor_text, priority))

        return links

    def _get_surrounding_text(self, html: str, doc_url: str, context_chars: int = 500) -> str:
        """
        Extract surrounding text near a document link.
        Walks up the DOM to capture parent table rows, list items, or card containers,
        ensuring department/branch and semester headers are captured.
        """
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup.find_all(["a", "iframe", "embed", "object"]):
            val = tag.get("href") or tag.get("src") or tag.get("data") or ""
            val = val.strip()
            if not val:
                continue
            if doc_url.endswith(val) or val in doc_url:
                # Find enclosing meaningful container (table row, card, section, list item)
                container = tag.find_parent(["tr", "li", "div", "section", "article"])
                if container and container.name == "li":
                    # Walk up one more level if li is inside a department div or card
                    container = container.find_parent(["div", "tr", "section"]) or container
                if container:
                    return " ".join(container.get_text(separator=" ", strip=True).split())[:context_chars]
                parent = tag.parent
                if parent:
                    return " ".join(parent.get_text(separator=" ", strip=True).split())[:context_chars]
        return ""

    async def discover_syllabus(
        self,
        college_url: str,
        course: str,
        branch: str,
        semester: str | int,
        academic_year: str | None = None,
        on_progress: Any = None,
    ) -> dict[str, Any]:
        """
        Main discovery workflow:
        1. Validate URL
        2. Crawl portal, prioritizing academic/syllabus pages
        3. Score all candidate documents
        4. Verify best match
        5. Return original document URL and metadata

        Returns dict with keys:
          found (bool), document_url, file_type, title, source_page_url,
          confidence_score, match_reasons, verification_reason, error
        """
        def _progress(msg: str):
            logger.info("[SyllabusAgent] %s", msg)
            if on_progress:
                on_progress(msg)

        result: dict[str, Any] = {
            "found": False,
            "document_url": None,
            "file_type": None,
            "title": None,
            "source_page_url": None,
            "confidence_score": 0.0,
            "match_reasons": [],
            "is_verified": False,
            "verification_reason": None,
            "error": None,
        }

        # --- Step 1: Validate URL ---
        try:
            _, base_url = _validate_college_url(college_url)
        except ValueError as e:
            result["error"] = str(e)
            return result

        _progress(f"🔗 Connecting to college portal: {base_url}")

        # Track all candidate documents: (score, doc_url, anchor_text, source_page_url, page_title)
        candidates: list[tuple[float, str, str, str, str, list[str]]] = []
        visited_urls: set[str] = set()
        visited_docs: set[str] = set()
        pages_crawled = 0

        # High-probability seed endpoints
        initial_seeds = [
            (base_url, "home", -100),
            (f"{base_url}/curriculum-syllabus.php", "curriculum-syllabus", -95),
            (f"{base_url}/curriculum.php", "curriculum", -95),
            (f"{base_url}/syllabus.php", "syllabus", -95),
            (f"{base_url}/academics/syllabus", "academics syllabus", -92),
            (f"{base_url}/academic/syllabus", "academic syllabus", -92),
            (f"{base_url}/curriculum", "curriculum", -90),
            (f"{base_url}/syllabus", "syllabus", -90),
            (f"{base_url}/academics", "academics", -85),
            (f"{base_url}/department.php", "departments", -80),
        ]
        # Priority queue: (-priority, depth, url, anchor_text)
        queue: list[tuple[int, int, str, str]] = [
            (prio, 0, u, anchor) for u, anchor, prio in initial_seeds
        ]

        async with httpx.AsyncClient(
            headers=self._headers,
            follow_redirects=True,
            timeout=REQUEST_TIMEOUT,
            verify=False,  # Many Indian college portals have self-signed certs
        ) as client:

            robots = await self._fetch_robots(client, base_url)

            # --- Step 2: Crawl ---
            while queue and pages_crawled < MAX_PAGES:
                queue.sort(key=lambda x: x[0])
                _, depth, current_url, anchor = queue.pop(0)

                if current_url in visited_urls:
                    continue
                visited_urls.add(current_url)

                _progress(f"🔍 Scanning: {current_url}")

                html, final_url = await self._fetch_html(client, current_url, robots)
                if not html:
                    continue

                pages_crawled += 1

                # Get page title for scoring
                soup_title = BeautifulSoup(html, "html.parser")
                page_title = ""
                title_tag = soup_title.find("title")
                if title_tag:
                    page_title = title_tag.get_text(strip=True)

                # --- Step 3: Collect document links from this page ---
                doc_links = self._extract_doc_links_from_html(html, final_url, base_url)
                for doc_url, doc_anchor in doc_links:
                    if doc_url in visited_docs or len(visited_docs) >= MAX_DOCUMENTS:
                        continue
                    visited_docs.add(doc_url)

                    surrounding = self._get_surrounding_text(html, doc_url)
                    score, reasons = _score_document(
                        doc_url, surrounding + " " + doc_anchor,
                        page_title, course, branch, semester, academic_year
                    )

                    if score > 0:
                        candidates.append((score, doc_url, doc_anchor, final_url, page_title, reasons))
                        _progress(f"📄 Found candidate (score={score:.0f}): {doc_url.split('/')[-1][:60]}")

                # --- Step 4: Queue more links if depth allows ---
                if depth < MAX_CRAWL_DEPTH:
                    page_links = self._extract_page_links(html, final_url, base_url)
                    for link_url, link_anchor, link_priority in page_links:
                        if link_url not in visited_urls:
                            queue.append((-link_priority, depth + 1, link_url, link_anchor))

                # Early exit if we have a very high-confidence match already
                if candidates:
                    best_score = max(c[0] for c in candidates)
                    if best_score >= 90:
                        _progress(f"✅ High-confidence match found (score={best_score:.0f}), stopping early.")
                        break

        _progress(f"📊 Crawl complete. Scanned {pages_crawled} pages, found {len(candidates)} document candidates.")

        if not candidates:
            result["error"] = (
                f"No syllabus documents found on {base_url}. "
                "The portal may require JavaScript rendering or login access."
            )
            return result

        # --- Step 5: Sort by score and verify top candidates ---
        candidates.sort(key=lambda x: x[0], reverse=True)

        for score, doc_url, doc_anchor, source_page_url, page_title, reasons in candidates[:5]:
            if score < MIN_CONFIDENCE_SCORE:
                break

            _progress(f"🔎 Verifying document: {doc_url.split('/')[-1][:60]} (score={score:.0f})")

            async with httpx.AsyncClient(
                headers=self._headers,
                follow_redirects=True,
                timeout=REQUEST_TIMEOUT,
                verify=False,
            ) as verify_client:
                is_valid, file_type, ct_header, content_length = await self._verify_document(
                    verify_client, doc_url
                )

            if not is_valid:
                _progress(f"⚠️ Document not reachable or invalid type, skipping: {doc_url}")
                continue

            # Determine document title
            filename = doc_url.split("/")[-1].split("?")[0]
            title = (
                doc_anchor.strip()
                or filename
                or f"{course} {branch} Semester {semester} Syllabus"
            )

            is_merged_doc = any("merged" in r.lower() or "all-semester" in r.lower() for r in reasons)
            if is_merged_doc:
                verification_reason = (
                    f"Official college domain ({base_url}) + "
                    f"{branch} (Merged all-semester curriculum covers Semester {semester}). "
                    f"Score: {score:.0f}/100. File: {file_type.upper()}"
                )
            else:
                verification_reason = (
                    f"Official college domain ({base_url}) + "
                    f"{branch} + Semester {semester} syllabus match. "
                    f"Score: {score:.0f}/100. File: {file_type.upper()}"
                )

            result.update({
                "found": True,
                "document_url": doc_url,
                "file_type": file_type,
                "title": title,
                "source_page_url": source_page_url,
                "confidence_score": score,
                "match_reasons": reasons,
                "is_verified": True,
                "verification_reason": verification_reason,
                "is_merged": is_merged_doc,
                "content_length": content_length,
                "content_type_header": ct_header,
            })

            _progress(f"✅ Verified syllabus document: {doc_url}")
            return result

        result["error"] = (
            f"Found {len(candidates)} document(s) on {base_url}, but none passed verification "
            f"for {course} {branch} Semester {semester}. "
            "Try refreshing or updating your academic profile."
        )
        return result


# ---------------------------------------------------------------------------
# Database Integration
# ---------------------------------------------------------------------------

async def get_cached_syllabus_document(
    db: AsyncSession,
    college_id: uuid.UUID,
    course: str,
    branch: str,
    semester: str,
) -> SyllabusDocument | None:
    """
    Retrieve a cached SyllabusDocument from DB.
    Checks for semester-specific match or a verified merged all-semester document.
    """
    from sqlalchemy import or_

    stmt = (
        select(SyllabusDocument)
        .where(
            SyllabusDocument.college_id == college_id,
            SyllabusDocument.branch.ilike(f"%{branch}%"),
            or_(
                SyllabusDocument.semester == str(semester),
                SyllabusDocument.semester.in_(["all", "all_semesters", "1-8", "all-semesters", "combined"]),
                SyllabusDocument.match_reasons.ilike("%merged%"),
                SyllabusDocument.verification_reason.ilike("%merged%"),
            ),
            SyllabusDocument.is_verified == True,  # noqa: E712
        )
        .order_by(SyllabusDocument.confidence_score.desc())
        .limit(1)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def save_syllabus_document(
    db: AsyncSession,
    college_id: uuid.UUID,
    course: str,
    branch: str,
    semester: str,
    academic_year: str | None,
    discovery_result: dict[str, Any],
) -> SyllabusDocument:
    """
    Save or update a discovered SyllabusDocument in the database.
    Only the original document URL is stored — no content is downloaded.
    """
    # Check if record already exists
    stmt = (
        select(SyllabusDocument)
        .where(
            SyllabusDocument.college_id == college_id,
            SyllabusDocument.document_url == discovery_result["document_url"],
        )
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()

    now = datetime.now(timezone.utc)
    reasons_json = json.dumps(discovery_result.get("match_reasons", []))

    if existing:
        existing.is_verified = discovery_result.get("is_verified", False)
        existing.is_reachable = discovery_result.get("found", False)
        existing.confidence_score = discovery_result.get("confidence_score", 0.0)
        existing.match_reasons = reasons_json
        existing.verification_reason = discovery_result.get("verification_reason")
        existing.last_verified_at = now
        existing.updated_at = now
        await db.commit()
        await db.refresh(existing)
        return existing

    # Create new record
    doc = SyllabusDocument(
        college_id=college_id,
        document_url=discovery_result["document_url"],
        source_page_url=discovery_result.get("source_page_url"),
        file_type=discovery_result.get("file_type", "pdf"),
        title=discovery_result.get("title"),
        course=course,
        branch=branch,
        semester=str(semester),
        academic_year=academic_year,
        confidence_score=discovery_result.get("confidence_score", 0.0),
        match_reasons=reasons_json,
        is_verified=discovery_result.get("is_verified", False),
        verification_reason=discovery_result.get("verification_reason"),
        is_reachable=discovery_result.get("found", False),
        source="college_website",
        last_verified_at=now,
        content_length=discovery_result.get("content_length"),
        content_type_header=discovery_result.get("content_type_header"),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


# Singleton agent instance
syllabus_agent = SyllabusDiscoveryAgent()
