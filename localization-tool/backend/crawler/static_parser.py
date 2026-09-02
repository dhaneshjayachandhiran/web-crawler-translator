"""Static HTML parser using BeautifulSoup."""
import re
from typing import List, Optional, Set
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup


def extract_text_content(soup: BeautifulSoup) -> str:
    """Extract visible text content from HTML."""
    # Remove script and style elements
    for script in soup(["script", "style", "noscript", "meta", "link"]):
        script.decompose()

    # Get text
    text = soup.get_text(separator=" ", strip=True)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_title(soup: BeautifulSoup) -> Optional[str]:
    """Extract page title."""
    title_tag = soup.find("title")
    if title_tag:
        return title_tag.get_text(strip=True)
    return None


def detect_language(soup: BeautifulSoup) -> str:
    """Detect page language from HTML lang attribute."""
    html_tag = soup.find("html")
    if html_tag and html_tag.get("lang"):
        return html_tag.get("lang")[:2].lower()
    return "en"


def extract_links(soup: BeautifulSoup, base_url: str, base_domain: str) -> List[str]:
    """Extract internal links from page."""
    links = []
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        # Skip anchor links
        if href.startswith("#"):
            continue
        # Skip mailto, tel, javascript
        if href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        # Skip media files
        if re.search(r"\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf|zip|doc|docx)$", href, re.I):
            continue

        absolute_url = urljoin(base_url, href)
        parsed = urlparse(absolute_url)

        # Only include same domain
        if parsed.netloc == base_domain:
            # Normalize URL (remove fragment)
            normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if parsed.query:
                normalized += f"?{parsed.query}"
            links.append(normalized)

    return list(set(links))  # Deduplicate


def extract_text_segments(soup: BeautifulSoup) -> List[str]:
    """Extract translatable text segments from visible elements."""
    segments = []

    # Target elements that typically contain translatable text
    target_tags = [
        "p", "h1", "h2", "h3", "h4", "h5", "h6",
        "span", "div", "li", "td", "th", "a", "button",
        "label", "legend", "figcaption", "blockquote",
        "cite", "q", "dd", "dt", "summary", "caption"
    ]

    for tag in soup.find_all(target_tags):
        # Skip if element has no text or only whitespace
        text = tag.get_text(strip=True)
        if not text or len(text) < 2:
            continue

        # Skip if element is hidden
        style = tag.get("style", "")
        if "display: none" in style or "visibility: hidden" in style:
            continue

        # Skip if element is in a script/style/noscript
        if tag.find_parent(["script", "style", "noscript"]):
            continue

        # Skip very long texts (likely not translatable UI text)
        if len(text) > 5000:
            continue

        segments.append(text)

    # Deduplicate while preserving order
    seen = set()
    unique_segments = []
    for seg in segments:
        if seg not in seen:
            seen.add(seg)
            unique_segments.append(seg)

    return unique_segments


def classify_content_type(url: str, title: Optional[str], text: str) -> str:
    """Heuristic classification of content type."""
    url_lower = url.lower()
    title_lower = (title or "").lower()

    if any(x in url_lower for x in ["/blog", "/article", "/post", "/news"]):
        return "article"
    if any(x in url_lower for x in ["/nav", "/menu", "/header", "/footer"]):
        return "navigation"
    if any(x in url_lower for x in ["/contact", "/about", "/team"]):
        return "static"
    if "footer" in title_lower or "footer" in url_lower:
        return "footer"
    if "header" in title_lower or "header" in url_lower:
        return "header"
    if "nav" in title_lower or "menu" in title_lower:
        return "navigation"

    # Check text content
    if len(text) > 2000:
        return "article"
    if len(text) < 200:
        return "ui"

    return "content"