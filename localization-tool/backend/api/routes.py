"""API routes for the localization tool."""
import os
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, Project, Page, TextSegment, init_db
from api.schemas import (
    ProjectCreate, ProjectResponse,
    PageResponse, PageUpdate,
    CrawlRequest, CrawlResponse,
    TextSegmentResponse,
    BatchTranslateRequest, TranslateSegmentRequest,
    TranslationResponse, HealthResponse,
)
from services.translation_service import TranslationService
from services.tm_service import TranslationMemoryService

router = APIRouter()


@router.on_event("startup")
def startup_event():
    """Initialize database on startup."""
    init_db()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok")


# ========== Projects ==========
@router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    db_project = Project(
        name=project.name,
        start_url=project.start_url,
        target_language=project.target_language,
        source_language=project.source_language,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    """List all projects."""
    return db.query(Project).order_by(desc(Project.created_at)).all()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ========== Crawler ==========
@router.post("/crawl")
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Start crawling a project."""
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    async def run_crawl():
        from crawler.crawler import run_crawl as run_crawler
        # Need a new session for background task
        from database import SessionLocal
        bg_db = SessionLocal()
        try:
            await run_crawler(bg_db, project.id, project.start_url, request.max_pages)
        finally:
            bg_db.close()

    background_tasks.add_task(run_crawl)
    return {"status": "started", "project_id": project.id, "max_pages": request.max_pages}


# ========== Pages ==========
@router.get("/pages", response_model=List[PageResponse])
async def list_pages(
    project_id: int = None,
    db: Session = Depends(get_db),
):
    """List all pages, optionally filtered by project."""
    query = db.query(Page)
    if project_id:
        query = query.filter(Page.project_id == project_id)
    return query.order_by(Page.id).all()


@router.get("/pages/{page_id}", response_model=PageResponse)
async def get_page(page_id: int, db: Session = Depends(get_db)):
    """Get a specific page."""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.patch("/api/pages/{page_id}", response_model=PageResponse)
async def update_page(page_id: int, page_update: PageUpdate, db: Session = Depends(get_db)):
    """Update page inclusion status."""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    page.is_included = page_update.is_included
    db.commit()
    db.refresh(page)
    return page


# ========== Text Segments ==========
@router.get("/pages/{page_id}/segments", response_model=List[TextSegmentResponse])
async def get_page_segments(page_id: int, db: Session = Depends(get_db)):
    """Get all text segments for a page."""
    segments = (
        db.query(TextSegment)
        .filter(TextSegment.page_id == page_id)
        .all()
    )
    return segments


@router.patch("/segments/{segment_id}", response_model=TextSegmentResponse)
async def update_segment(segment_id: int, target_text: str, db: Session = Depends(get_db)):
    """Manually update a segment's target text."""
    segment = db.query(TextSegment).filter(TextSegment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    segment.target_text = target_text
    segment.translation_status = "completed"
    db.commit()
    db.refresh(segment)
    return segment


# ========== Translation ==========
@router.post("/api/projects/{project_id}/translate")
async def batch_translate(
    project_id: int,
    request: BatchTranslateRequest,
    db: Session = Depends(get_db),
):
    """Batch translate all segments for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    service = TranslationService(db)
    result = await service.batch_translate(
        project_id=project_id,
        target_language=request.target_language,
        source_language=project.source_language,
        batch_size=request.batch_size,
    )
    return result


@router.post("/api/segments/{segment_id}/translate", response_model=TranslationResponse)
async def translate_segment(segment_id: int, db: Session = Depends(get_db)):
    """Translate a single segment on demand."""
    segment = db.query(TextSegment).filter(TextSegment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    project = db.query(Project).filter(Project.id == segment.project_id).first()

    service = TranslationService(db)
    translation = await service.translate_segment(
        segment_id=segment_id,
        target_language=project.target_language,
        source_language=project.source_language,
    )

    db.refresh(segment)
    return segment


# ========== TM Stats ==========
@router.get("/projects/{project_id}/tm-stats")
async def get_tm_stats(project_id: int, db: Session = Depends(get_db)):
    """Get translation memory statistics."""
    service = TranslationMemoryService(db)
    return service.get_tm_stats(project_id)


# ========== CDN / loc.js ==========
@router.get("/cdn/loc.js")
async def get_loc_js(project_id: int = None, db: Session = Depends(get_db)):
    """Serve the loc.js publishing snippet."""
    js_path = os.path.join(os.path.dirname(__file__), "..", "cdn", "loc.js")

    if not os.path.exists(js_path):
        raise HTTPException(status_code=404, detail="loc.js not found")

    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()

    # If project_id provided, inject translations
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            service = TranslationService(db)
            translations = service.get_translations_for_export(
                project_id, project.target_language
            )
            # Inject translations as a global variable
            injection = f"\nwindow.LOC_TRANSLATIONS = {json.dumps(translations, ensure_ascii=False)};\nwindow.LOC_PROJECT_ID = {project_id};\nwindow.LOC_TARGET_LANG = '{project.target_language}';\n"
            js_content = js_content.replace("// __INJECT_TRANSLATIONS__", injection)

    from fastapi.responses import Response
    return Response(content=js_content, media_type="application/javascript")


@router.get("/cdn/translations/{project_id}")
async def get_translations(project_id: int, db: Session = Depends(get_db)):
    """Get translations as JSON for loc.js."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    service = TranslationService(db)
    translations = service.get_translations_for_export(
        project_id, project.target_language
    )

    return {
        "project_id": project_id,
        "target_language": project.target_language,
        "translations": translations,
    }