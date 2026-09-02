"""Pydantic schemas for API requests/responses."""
from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    start_url: HttpUrl
    target_language: str = "es"
    source_language: str = "en"


class ProjectResponse(BaseModel):
    id: int
    name: str
    start_url: str
    target_language: str
    source_language: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PageResponse(BaseModel):
    id: int
    project_id: int
    url: str
    title: Optional[str] = None
    detected_language: str
    status: str
    is_included: bool
    word_count: int
    content_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PageUpdate(BaseModel):
    is_included: bool


class CrawlRequest(BaseModel):
    project_id: int
    max_pages: int = 50
    include_media: bool = False


class CrawlResponse(BaseModel):
    total: int
    completed: int
    failed: int


class TextSegmentResponse(BaseModel):
    id: int
    page_id: int
    project_id: int
    source_text: str
    target_text: Optional[str] = None
    source_hash: str
    translation_status: str
    llm_response: Optional[str] = None

    class Config:
        from_attributes = True


class BatchTranslateRequest(BaseModel):
    target_language: str
    batch_size: int = 10


class TranslateSegmentRequest(BaseModel):
    segment_id: int


class TranslationResponse(BaseModel):
    id: int
    source_text: str
    target_text: str
    source_hash: str
    translation_status: str


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"