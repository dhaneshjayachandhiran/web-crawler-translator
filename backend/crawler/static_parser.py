"""Static HTML parser using BeautifulSoup for text extraction."""
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Optional, Tuple, List, Set


def extract_title(html: str) -> Optional[str]:
    """Extract the page title from HTML."""
    try:
        soup = BeautifulSoup(html, "html5lib")
        title_tag = soup.find("title")
        if title_tag and title_tag.get_text(strip=True):
            return title_tag.get_text(strip=True)
        return None
    except Exception:
        return None


def detect_language(html: str, url: str) -> str:
    """Detect the language of the page from HTML attributes or content."""
    try:
        soup = BeautifulSoup(html, "html5lib")
        # Check <html lang="...">
        html_tag = soup.find("html")
        if html_tag and html_tag.get("lang"):
            lang = html_tag.get("lang")
            return lang.split("-")[0] if "-" in lang else lang

        # Check <meta name="language" content="...">
        meta_lang = soup.find("meta", attrs={"name": "language"})
        if meta_lang and meta_lang.get("content"):
            lang = meta_lang.get("content")
            return lang.split("-")[0] if "-" in lang else lang

        # Check <meta http-equiv="content-language" content="...">
        meta_cl = soup.find("meta", attrs={"http-equiv": "content-language"})
        if meta_cl and meta_cl.get("content"):
            lang = meta_cl.get("content")
            return lang.split("-")[0] if "-" in lang else lang

        # Fallback: check first <p> or <div> with lang attribute
        for tag in soup.find_all(attrs={"lang": True}):
            lang = tag.get("lang")
            if lang:
                return lang.split("-")[0] if "-" in lang else lang

        return "en"
    except Exception:
        return "en"


def extract_text_content(html: str) -> str:
    """Extract visible text content from HTML, excluding scripts and styles."""
    try:
        soup = BeautifulSoup(html, "html5lib")

        # Remove script and style elements
        for element in soup(["script", "style", "noscript", "header", "footer", "nav", "svg"]):
            element.decompose()

        # Get text from body or entire document
        body = soup.find("body")
        if body:
            text = body.get_text(separator=" ", strip=True)
        else:
            text = soup.get_text(separator=" ", strip=True)

        # Clean up whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text
    except Exception:
        return ""


def count_words(text: str) -> int:
    """Count the number of words in text."""
    if not text:
        return 0
    words = text.split()
    return len(words)


def detect_content_type(html: str) -> str:
    """Heuristically determine the content type of a page."""
    try:
        soup = BeautifulSoup(html, "html5lib")

        # Check for article/blog content
        if soup.find("article") or soup.find(class_=re.compile(r"article|blog|post", re.I)):
            return "article"

        # Check for product/e-commerce
        if soup.find(class_=re.compile(r"product|price|cart|shop", re.I)):
            return "product"

        # Check for navigation-heavy pages
        nav_count = len(soup.find_all("nav"))
        if nav_count > 1:
            return "navigation"

        # Check for form-heavy pages
        form_count = len(soup.find_all("form"))
        if form_count > 1:
            return "form"

        # Check for landing page
        if soup.find(class_=re.compile(r"hero|banner|landing", re.I)):
            return "landing"

        # Default
        return "page"
    except Exception:
        return "unknown"


def extract_links(html: str, base_url: str, max_pages: int = 50) -> List[str]:
    """Extract internal links from HTML, filtering out external/media/anchor links."""
    try:
        soup = BeautifulSoup(html, "html5lib")
        base_domain = urlparse(base_url).netloc
        links: Set[str] = set()

        for a_tag in soup.find_all("a", href=True):
            href = a_tag.get("href")
            if not href:
                continue

            # Skip anchor links
            if href.startswith("#"):
                continue

            # Skip external links
            parsed = urlparse(href)
            if parsed.netloc and parsed.netloc != base_domain:
                continue

            # Skip media files
            if re.search(r"\.(jpg|jpeg|png|gif|svg|pdf|mp4|mp3|wav|zip|doc|docx|xls|xlsx)$", href, re.I):
                continue

            # Build absolute URL
            absolute_url = urljoin(base_url, href)

            # Ensure it's on the same domain
            if urlparse(absolute_url).netloc == base_domain:
                # Remove fragment
                absolute_url = absolute_url.split("#")[0]
                links.add(absolute_url)

        return list(links)[:max_pages]
    except Exception:
        return []


def parse_page(html: str, url: str) -> Tuple[Optional[str], str, str, int, str]:
    """Parse a page and extract all relevant information.

    Returns: (title, detected_language, text_content, word_count, content_type)
    """
    title = extract_title(html)
    detected_language = detect_language(html, url)
    text_content = extract_text_content(html)
    word_count = count_words(text_content)
    content_type = detect_content_type(html)

    return title, detected_language, text_content, word_count, content_type