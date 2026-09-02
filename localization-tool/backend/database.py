"""Database models and SQLAlchemy setup."""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session

DATABASE_URL = "sqlite:///./localization.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    start_url = Column(String(500), nullable=False)
    target_language = Column(String(10), nullable=False, default="es")
    source_language = Column(String(10), nullable=False, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pages = relationship("Page", back_populates="project", cascade="all, delete-orphan")
    text_segments = relationship("TextSegment", back_populates="project", cascade="all, delete-orphan")


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    title = Column(Text, nullable=True)
    detected_language = Column(String(10), default="en")
    html_content = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, completed, failed
    is_included = Column(Boolean, nullable=False, default=True)
    word_count = Column(Integer, default=0)
    content_type = Column(String(50), default="unknown")  # article, navigation, footer, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="pages")
    text_segments = relationship("TextSegment", back_populates="page", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_pages_project_included", "project_id", "is_included"),
    )


class TextSegment(Base):
    __tablename__ = "text_segments"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=True)
    source_hash = Column(String(64), nullable=False)  # SHA256 hash
    translation_status = Column(String(20), default="pending")  # pending, in_progress, completed, tm_reused
    llm_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    page = relationship("Page", back_populates="text_segments")
    project = relationship("Project", back_populates="text_segments")

    __table_args__ = (
        Index("idx_textsegments_source_hash", "source_hash"),
        Index("idx_textsegments_project_status", "project_id", "translation_status"),
    )


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
