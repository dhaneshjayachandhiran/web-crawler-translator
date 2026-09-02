"""Translation service with LLM integration."""
import os
import asyncio
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from openai import AsyncOpenAI
from database import TextSegment
from services.tm_service import TranslationMemoryService


class TranslationService:
    def __init__(self, db: Session):
        self.db = db
        self.tm_service = TranslationMemoryService(db)
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self._rate_limiter = asyncio.Semaphore(1)  # 1 request per second

    async def translate_segment(
        self,
        segment_id: int,
        target_language: str,
        source_language: str = "en",
    ) -> Optional[str]:
        """Translate a single segment with TM lookup."""
        segment = self.db.query(TextSegment).filter(TextSegment.id == segment_id).first()
        if not segment:
            return None

        # Check Translation Memory first
        tm_translation = self.tm_service.find_existing_translation(
            segment.source_hash, segment.project_id
        )
        if tm_translation:
            segment.target_text = tm_translation
            segment.translation_status = "tm_reused"
            self.db.commit()
            return tm_translation

        # Translate with LLM
        segment.translation_status = "in_progress"
        self.db.commit()

        try:
            translation = await self._call_llm(
                segment.source_text, target_language, source_language
            )
            segment.target_text = translation
            segment.translation_status = "completed"
            self.db.commit()
            return translation
        except Exception as e:
            segment.translation_status = "pending"
            segment.llm_response = f"Error: {str(e)}"
            self.db.commit()
            return None

    async def batch_translate(
        self,
        project_id: int,
        target_language: str,
        source_language: str = "en",
        batch_size: int = 10,
    ) -> Dict:
        """Batch translate all pending segments for a project."""
        # Get all pending segments for included pages
        segments = (
            self.db.query(TextSegment)
            .join(TextSegment.page)
            .filter(
                TextSegment.project_id == project_id,
                TextSegment.translation_status == "pending",
                TextSegment.page.has(is_included=True),
            )
            .all()
        )

        results = {"translated": 0, "tm_reused": 0, "failed": 0}

        # Process in batches
        for i in range(0, len(segments), batch_size):
            batch = segments[i : i + batch_size]
            await asyncio.gather(
                *[self.translate_segment(s.id, target_language, source_language) for s in batch]
            )

        # Count results
        for segment in segments:
            self.db.refresh(segment)
            if segment.translation_status == "completed":
                results["translated"] += 1
            elif segment.translation_status == "tm_reused":
                results["tm_reused"] += 1
            else:
                results["failed"] += 1

        return results

    async def _call_llm(
        self, text: str, target_language: str, source_language: str
    ) -> str:
        """Call LLM API for translation."""
        async with self._rate_limiter:
            # Rate limit: wait 1 second between requests
            await asyncio.sleep(1)

            language_names = {
                "en": "English",
                "es": "Spanish",
                "fr": "French",
                "de": "German",
                "it": "Italian",
                "pt": "Portuguese",
                "ja": "Japanese",
                "ko": "Korean",
                "zh": "Chinese",
                "ru": "Russian",
                "ar": "Arabic",
            }

            target_name = language_names.get(target_language, target_language)
            source_name = language_names.get(source_language, source_language)

            prompt = f"""Translate the following text from {source_name} to {target_name}.
Preserve formatting, HTML tags, and special characters.
Only return the translation, no explanations.

Text: {text}"""

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=2000,
            )

            return response.choices[0].message.content.strip()

    def get_translations_for_export(self, project_id: int, target_language: str) -> Dict[str, str]:
        """Get all translations for a project as a dictionary for loc.js."""
        segments = (
            self.db.query(TextSegment)
            .filter(
                TextSegment.project_id == project_id,
                TextSegment.target_text.isnot(None),
            )
            .all()
        )

        translations = {}
        for segment in segments:
            translations[segment.source_hash] = segment.target_text

        return translations