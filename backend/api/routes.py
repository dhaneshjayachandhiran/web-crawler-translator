from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal, Project, Page, TextSegment
from api.schemas import ProjectCreate, ProjectResponse, PageResponse, PageUpdate, TextSegmentResponse
from services.translation_service import TranslationService
from services.tm_service import TranslationMemoryService

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    """List all projects."""
    projects = db.query(Project).all()
    return projects


@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project."""
    db_project = Project(
        name=project.name,
        start_url=project.start_url,
        target_language=project.target_language,
        source_language=project.source_language
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/projects/{id}", response_model=ProjectResponse)
async def get_project(id: int, db: Session = Depends(get_db)):
    """Get a specific project."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/projects/{id}")
async def delete_project(id: int, db: Session = Depends(get_db)):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.get("/pages", response_model=List[PageResponse])
async def get_pages(db: Session = Depends(get_db)):
    """List all pages."""
    pages = db.query(Page).all()
    return pages


@router.get("/pages/{id}", response_model=PageResponse)
async def get_page(id: int, db: Session = Depends(get_db)):
    """Get a specific page."""
    page = db.query(Page).filter(Page.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.patch("/api/pages/{id}")
async def toggle_page_inclusion(
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


@router.delete("/pages/{id}")
async def delete_page(id: int, db: Session = Depends(get_db)):
    """Delete a page."""
    page = db.query(Page).filter(Page.id == id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    db.delete(page)
    db.commit()
    return {"message": "Page deleted"}


@router.post("/api/projects/{id}/translate")
async def translate_project(
    id: int,
    target_language: str = "es",
    batch_size: int = 10,
    db: Session = Depends(get_db)
):
    """Batch translate all included pages for a project."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    translation_service = TranslationService(db)
    result = await translation_service.batch_translate(
        project_id=id,
        target_language=target_language,
        batch_size=batch_size
    )
    return result


@router.post("/api/segments/{id}/translate")
async def translate_segment(
    id: int,
    target_language: str = "es",
    db: Session = Depends(get_db)
):
    """Translate a single segment."""
    segment = db.query(TextSegment).filter(TextSegment.id == id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    translation_service = TranslationService(db)
    result = await translation_service.translate_segment(
        segment_id=id,
        target_language=target_language
    )
    return result


@router.get("/api/translations/{project_id}", response_model=List[TextSegmentResponse])
async def get_translations(project_id: int, db: Session = Depends(get_db)):
    """Get all translations for a project."""
    segments = db.query(TextSegment).filter(
        TextSegment.project_id == project_id,
        TextSegment.translation_status == "completed"
    ).all()
    return segments


@router.get("/cdn/loc.js")
async def serve_loc_js():
    """Serve the localization JavaScript file."""
    try:
        with open("backend/cdn/loc.js", "r") as f:
            content = f.read()
        return content
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="loc.js not found")