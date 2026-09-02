from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.pool import StaticPool
import os

DATABASE_URL = "sqlite:///localization.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_url = Column(String, nullable=False)
    target_language = Column(String, default="es")
    source_language = Column(String, default="en")
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")

    pages = relationship("Page", back_populates="project")
    text_segments = relationship("TextSegment", back_populates="project")


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String)
    detected_language = Column(String, default="en")
    html_content = Column(Text)
    status = Column(String, default="pending")
    is_included = Column(Boolean, default=True)
    word_count = Column(Integer, default=0)
    content_type = Column(String, default="unknown")
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")

    project = relationship("Project", back_populates="pages")
    text_segments = relationship("TextSegment", back_populates="page")


class TextSegment(Base):
    __tablename__ = "text_segments"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text)
    source_hash = Column(String, nullable=False)
    translation_status = Column(String, default="pending")
    llm_response = Column(Text)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")

    page = relationship("Page", back_populates="text_segments")
    project = relationship("Project", back_populates="text_segments")


def init_db():
    Base.metadata.create_all(bind=engine)