"""Translation Memory service with SHA256 hashing for deduplication."""
import hashlib
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from database import TextSegment


class TranslationMemoryService:
    """Manages translation memory lookups and storage."""

    @staticmethod
    def compute_source_hash(source_text: str) -> str:
        """Compute SHA256 hash of source text for deduplication."""
        return hashlib.sha256(source_text.encode("utf-8")).hexdigest()

    @staticmethod
    def lookup_translation(
        db: Session,
        project_id: int,
        source_hash: str
    ) -> Optional[Tuple[str, str]]:
        """Look up a translation by source hash.

        Returns: (target_text, source_text) or None if not found.
        """
        segment = db.query(TextSegment).filter(
            TextSegment.project_id == project_id,
            TextSegment.source_hash == source_hash,
            TextSegment.target_text.isnot(None)
        ).first()

        if segment:
            return segment.target_text, segment.source_text
        return None

    @staticmethod
    def store_translation(
        db: Session,
        project_id: int,
        page_id: int,
        source_text: str,
        target_text: str,
        source_hash: Optional[str] = None
    ) -> TextSegment:
        """Store a translation in the database."""
        if source_hash is None:
            source_hash = TranslationMemoryService.compute_source_hash(source_text)

        segment = TextSegment(
            project_id=project_id,
            page_id=page_id,
            source_text=source_text,
            target_text=target_text,
            source_hash=source_hash,
            translation_status="completed"
        )
        db.add(segment)
        db.commit()
        db.refresh(segment)
        return segment