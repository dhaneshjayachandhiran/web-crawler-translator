"""Playwright fallback for JavaScript-rendered pages."""
import asyncio
from typing import Optional
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


async def fetch_with_playwright(url: str, timeout: int = 30000) -> Optional[str]:
    """Fetch a URL using Playwright for JavaScript-rendered content.

    Returns the HTML content or None if Playwright is not available.
    """
    if not PLAYWRIGHT_AVAILABLE:
        return None

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            page.set_default_timeout(timeout)
            response = await page.goto(url, wait_until="networkidle")
            if response is None:
                await browser.close()
                return None
            html = await page.content()
            await browser.close()
            return html
    except Exception:
        return None
