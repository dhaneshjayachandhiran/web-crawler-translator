"""Main crawler logic with hybrid strategy."""
import asyncio
import hashlib
import httpx
from typing import List, Optional, Set
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from database import Page, TextSegment
from crawler.static_parser import (
    extract_text_content,
    extract_title,
    detect_language,
    extract_links,
    extract_text_segments,
    classify_content_type,
)
from crawler.playwright_fallback import fetch_with_playwright


class Crawler:
    def __init__(self, db: Session, project_id: int, max_pages: int = 50):
        self.db = db
        self.project_id = project_id
        self.max_pages = max_pages
        self.visited: Set[str] = set()
        self.to_visit: List[str] = []
        self.base_domain: Optional[str] = None
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)

    async def crawl(self, start_url: str) -> dict:
        """Start crawling from the given URL."""
        parsed = urlparse(start_url)
        self.base_domain = parsed.netloc
        self.to_visit = [start_url]

        stats = {"total": 0, "completed": 0, "failed": 0}

        while self.to_visit and stats["total"] < self.max_pages:
            url = self.to_visit.pop(0)

            if url in self.visited:
                continue

            self.visited.add(url)
            stats["total"] += 1

            try:
                await self._crawl_page(url)
                stats["completed"] += 1
            except Exception as e:
                stats["failed"] += 1
                print(f"Failed to crawl {url}: {e}")
                # Mark page as failed in DB
                self._mark_page_failed(url, str(e))

        await self.client.aclose()
        return stats

    async def _crawl_page(self, url: str):
        """Crawl a single page."""
        # Try static fetch first
        html_content = await self._fetch_static(url)

        # If static fetch fails or returns minimal content, try Playwright
        if not html_content or len(html_content) < 500:
            html_content = await fetch_with_playwright(url)

        if not html_content:
            raise Exception("Failed to fetch page content")

        # Parse with BeautifulSoup
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html_content, "lxml")

        # Extract data
        title = extract_title(soup)
        detected_lang = detect_language(soup)
        text_content = extract_text_content(soup)
        word_count = len(text_content.split())
        content_type = classify_content_type(url, title, text_content)
        links = extract_links(soup, url, self.base_domain)
        text_segments = extract_text_segments(soup)

        # Save page to database
        page = Page(
            project_id=self.project_id,
            url=url,
            title=title,
            detected_language=detected_lang,
            html_content=html_content,
            status="completed",
            is_included=True,
            word_count=word_count,
            content_type=content_type,
        )
        self.db.add(page)
        self.db.flush()  # Get page ID

        # Save text segments
        for segment_text in text_segments:
            source_hash = hashlib.sha256(segment_text.encode()).hexdigest()
            segment = TextSegment(
                page_id=page.id,
                project_id=self.project_id,
                source_text=segment_text,
                source_hash=source_hash,
                translation_status="pending",
            )
            self.db.add(segment)

        self.db.commit()

        # Add new links to queue
        for link in links:
            if link not in self.visited and link not in self.to_visit:
                self.to_visit.append(link)

    async def _fetch_static(self, url: str) -> Optional[str]:
        """Fetch page with httpx."""
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                return response.text
            elif response.status_code == 404:
                raise Exception("Page not found (404)")
            else:
                raise Exception(f"HTTP {response.status_code}")
        except httpx.TimeoutException:
            raise Exception("Request timeout")
        except Exception as e:
            raise Exception(f"Fetch error: {e}")

    def _mark_page_failed(self, url: str, error: str):
        """Mark a page as failed in the database."""
        page = Page(
            project_id=self.project_id,
            url=url,
            status="failed",
            html_content=error,
        )
        self.db.add(page)
        self.db.commit()


async def run_crawl(db: Session, project_id: int, start_url: str, max_pages: int = 50) -> dict:
    """Run crawler for a project."""
    crawler = Crawler(db, project_id, max_pages)
    return await crawler.crawl(start_url)