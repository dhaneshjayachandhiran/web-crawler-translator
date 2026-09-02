"""Translation service with LLM integration and TM lookup."""
import asyncio
import os
import time
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from database import TextSegment, Page, Project
from .tm_service import TranslationMemoryService

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class TranslationService:
    """Handles translation with TM lookup and LLM fallback."""

    def __init__(self, db: Session):
        self.db = db
        self.tm_service = TranslationMemoryService()
        self._last_request_time = 0
        self._rate_limit_delay = 1.0  # 1 request per second

    async def _call_llm(self, source_text: str, target_language: str, source_language: str = "en") -> str:
        """Call the LLM API for translation."""
        if not OPENAI_AVAILABLE:
            return source_text

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return source_text

        # Rate limiting
        elapsed = time.time() - self._last_request_time
        if elapsed < self._rate_limit_delay:
            await asyncio.sleep(self._rate_limit_delay - elapsed)

        self._last_request_time = time.time()

        try:
            client = AsyncOpenAI(api_key=api_key)
            prompt = f"""Translate the following text from {source_language} to {target_language}.
Only return the translated text, nothing else.
If the text is empty or contains only whitespace, return an empty string.

Text to translate:
{source_text}"""

            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return source_text

    async def translate_segment(
        self,
        segment_id: int,
        target_language: str
    ) -> Dict[str, Any]:
        """Translate a single text segment with TM lookup."""
        segment = self.db.query(TextSegment).filter(TextSegment.id == segment_id).first()
        if not segment:
            return {"error": "Segment not found"}

        source_hash = self.tm_service.compute_source_hash(segment.source_text)

        # Check TM first
        tm_result = self.tm_service.lookup_translation(self.db, segment.project_id, source_hash)
        if tm_result:
            target_text, _ = tm_result
            segment.target_text = target_text
            segment.translation_status = "tm_reused"
            self.db.commit()
            return {
                "segment_id": segment_id,
                "source_text": segment.source_text,
                "target_text": target_text,
                "translation_status": "tm_reused",
                "used_tm": True
            }

        # Not in TM, call LLM
        segment.translation_status = "in_progress"
        self.db.commit()

        project = self.db.query(Project).filter(Project.id == segment.project_id).first()
        source_language = project.source_language if project else "en"

        target_text = await self._call_llm(segment.source_text, target_language, source_language)

        segment.target_text = target_text
        segment.translation_status = "completed"
        self.db.commit()

        # Store in TM for future use
        self.tm_service.store_translation(
            self.db,
            segment.project_id,
            segment.page_id,
            segment.source_text,
            target_text,
            source_hash
        )

        return {
            "segment_id": segment_id,
            "source_text": segment.source_text,
            "target_text": target_text,
            "translation_status": "completed",
            "used_tm": False
        }

    async def batch_translate(
        self,
        project_id: int,
        target_language: str,
        batch_size: int = 10
    ) -> Dict[str, Any]:
        """Batch translate all included pages for a project."""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"error": "Project not found"}

        # Get all included pages
        pages = self.db.query(Page).filter(
            Page.project_id == project_id,
            Page.is_included == True
        ).all()

        total_segments = 0
        translated_segments = 0
        tm_reused = 0

        for page in pages:
            segments = self.db.query(TextSegment).filter(
                TextSegment.page_id == page.id,
                TextSegment.translation_status.in_(["pending", "in_progress"])
            ).all()

            for segment in segments:
                total_segments += 1
                result = await self.translate_segment(segment.id, target_language)
                if result.get("used_tm"):
                    tm_reused += 1
                translated_segments += 1

        return {
            "project_id": project_id,
            "total_segments": total_segments,
            "translated_segments": translated_segments,
            "tm_reused": tm_reused,
            "target_language": target_language
        }