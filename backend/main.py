from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import asyncio

from database import engine, SessionLocal, Project, Page, TextSegment, init_db
from crawler.crawler import Crawler
from services.translation_service import TranslationService
from api.routes import router
from api.schemas import ProjectCreate, ProjectResponse, PageResponse, CrawlRequest, CrawlResponse

# Initialize database
init_db()

app = FastAPI(title="Website Localization Automation Tool", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health", status_code=200)
async def health_check():
    return {"status": "healthy", "service": "localization-tool"}


@app.post("/crawl", response_model=CrawlResponse)
async def start_crawl(
    request: CrawlRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start a new crawl for a project."""
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    async def run_crawl():
        crawler = Crawler(max_pages=request.max_pages)
        results = await crawler.crawl(project.start_url)

        for result in results:
            page = Page(
                project_id=project.id,
                url=result["url"],
                title=result["title"],
                detected_language=result["detected_language"],
                html_content=result.get("html_content", ""),
                status=result["status"],
                is_included=True,
                word_count=result["word_count"],
                content_type=result["content_type"]
            )
            db.add(page)
            db.commit()
            db.refresh(page)

            if result["text_content"] and result["text_content"].strip():
                from services.tm_service import TranslationMemoryService
                source_hash = TranslationMemoryService.compute_source_hash(result["text_content"])
                segment = TextSegment(
                    page_id=page.id,
                    project_id=project.id,
                    source_text=result["text_content"],
                    target_text=None,
                    source_hash=source_hash,
                    translation_status="pending"
                )
                db.add(segment)
                db.commit()

    background_tasks.add_task(run_crawl)

    return {
        "project_id": request.project_id,
        "pages_crawled": 0,
        "pages_succeeded": 0,
        "pages_failed": 0,
        "status": "started"
    }


@app.get("/pages", response_model=List[PageResponse])
async def list_pages(db: Session = Depends(get_db)):
    """List all pages."""
    pages = db.query(Page).all()
    return pages


@app.get("/api/pages/{id}", response_model=PageResponse)
async def get_page(id: int, db: Session = Depends(get_db)):
    """Get a specific page."""
    page = db.query(Page).filter(Page.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@app.patch("/api/pages/{id}")
async def update_page(
    id: int,
    is_included: bool,
    db: Session = Depends(get_db)
):
    """Toggle the is_included status of a page."""
    page = db.query(Page).filter(Page.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    page.is_included = is_included
    db.commit()
    db.refresh(page)

    return {"id": page.id, "is_included": page.is_included}


@app.post("/api/projects/{id}/translate")
async def translate_project(
    id: int,
    request: TranslateProjectRequest,
    db: Session = Depends(get_db)
):
    """Batch translate all included pages for a project."""
    translation_service = TranslationService(db)
    result = await translation_service.batch_translate(
        project_id=id,
        target_language=request.target_language,
        batch_size=request.batch_size
    )
    return result


@app.post("/api/segments/{id}/translate")
async def translate_segment(
    id: int,
    request: TranslateSegmentRequest,
    db: Session = Depends(get_db)
):
    """Translate a single segment."""
    translation_service = TranslationService(db)
    result = await translation_service.translate_segment(
        segment_id=id,
        target_language="es"  # This should come from project config
    )
    return result


@app.get("/cdn/loc.js")
async def get_loc_js():
    """Serve the localization JavaScript file."""
    try:
        with open("backend/cdn/loc.js", "r") as f:
            content = f.read()
        return content
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="loc.js not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)