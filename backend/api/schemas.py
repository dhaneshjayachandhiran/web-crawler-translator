"""Pydantic schemas for API requests and responses."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    start_url: str
    target_language: str = "es"
    source_language: str = "en"


class ProjectResponse(BaseModel):
    id: int
    name: str
    start_url: str
    target_language: str
    source_language: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PageResponse(BaseModel):
    id: int
    project_id: int
    url: str
    title: Optional[str] = None
    detected_language: str = "en"
    status: str = "pending"
    is_included: bool = True
    word_count: int = 0
    content_type: str = "unknown"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PageUpdate(BaseModel):
    is_included: Optional[bool] = None
    title: Optional[str] = None


class CrawlRequest(BaseModel):
    project_id: int
    max_pages: int = 50
    include_media: bool = False


class CrawlResponse(BaseModel):
    project_id: int
    pages_crawled: int
    pages_succeeded: int
    pages_failed: int
    status: str


class TranslateProjectRequest(BaseModel):
    target_language: str = "es"
    batch_size: int = 10


class TranslateSegmentRequest(BaseModel):
    segment_id: int


class TranslationResponse(BaseModel):
    segment_id: int
    source_text: str
    target_text: str
    translation_status: str
    used_tm: bool = False


class TextSegmentResponse(BaseModel):
    id: int
    page_id: int
    project_id: int
    source_text: str
    target_text: Optional[str] = None
    source_hash: str
    translation_status: str

    class Config:
        from_attributes = True