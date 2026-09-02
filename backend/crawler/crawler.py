"""Main crawler module with hybrid BeautifulSoup + Playwright strategy."""
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from .static_parser import parse_page, extract_links
from .playwright_fallback import fetch_with_playwright, PLAYWRIGHT_AVAILABLE


class Crawler:
    """Hybrid crawler that uses BeautifulSoup for static pages and Playwright for JS-rendered pages."""

    def __init__(self, max_pages: int = 50, timeout: int = 30):
        self.max_pages = max_pages
        self.timeout = timeout * 1000
        self.visited_urls: set = set()
        self.results: List[Dict[str, Any]] = []

    async def fetch_page(self, url: str, use_playwright: bool = False) -> Optional[str]:
        """Fetch a page using HTTP or Playwright."""
        if use_playwright and PLAYWRIGHT_AVAILABLE:
            html = await fetch_with_playwright(url, self.timeout)
            if html:
                return html

        try:
            async with httpx.AsyncClient(timeout=self.timeout / 1000, follow_redirects=True) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return response.text
                elif response.status_code == 404:
                    return None
                else:
                    return None
        except Exception:
            return None

    async def crawl(self, start_url: str) -> List[Dict[str, Any]]:
        """Crawl starting from a URL, extracting text and metadata from up to max_pages."""
        self.visited_urls = set()
        self.results = []
        urls_to_visit = [start_url]
        base_domain = urlparse(start_url).netloc

        while urls_to_visit and len(self.visited_urls) < self.max_pages:
            url = urls_to_visit.pop(0)

            if url in self.visited_urls:
                continue

            self.visited_urls.add(url)

            html = await self.fetch_page(url, use_playwright=False)

            if not html:
                self.results.append({
                    "url": url,
                    "title": None,
                    "detected_language": "en",
                    "text_content": "",
                    "word_count": 0,
                    "content_type": "unknown",
                    "status": "failed"
                })
                continue

            title, detected_language, text_content, word_count, content_type = parse_page(html, url)
            self.results.append({
                "url": url,
                "title": title,
                "detected_language": detected_language,
                "text_content": text_content,
                "word_count": word_count,
                "content_type": content_type,
                "html_content": html,
                "status": "completed"
            })

            internal_links = extract_links(html, url, self.max_pages)
            for link in internal_links:
                if link not in self.visited_urls and urlparse(link).netloc == base_domain:
                    urls_to_visit.append(link)

        return self.results

    def get_results(self) -> List[Dict[str, Any]]:
        """Return the crawl results."""
        return self.results
