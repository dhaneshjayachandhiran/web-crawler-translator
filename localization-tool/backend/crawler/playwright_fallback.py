"""Playwright fallback for JavaScript-rendered pages."""
import asyncio
from typing import Optional
from playwright.async_api import async_playwright


async def fetch_with_playwright(url: str, timeout: int = 30000) -> Optional[str]:
    """Fetch page content using Playwright headless browser."""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            page.set_default_timeout(timeout)

            await page.goto(url, wait_until="networkidle")
            content = await page.content()
            await browser.close()
            return content
    except Exception as e:
        print(f"Playwright error for {url}: {e}")
        return None


async def fetch_multiple_with_playwright(urls: list, timeout: int = 30000) -> dict:
    """Fetch multiple pages concurrently with Playwright."""
    results = {}
    semaphore = asyncio.Semaphore(3)  # Limit concurrent browsers

    async def fetch_one(url: str):
        async with semaphore:
            content = await fetch_with_playwright(url, timeout)
            results[url] = content

    await asyncio.gather(*[fetch_one(url) for url in urls])
    return results