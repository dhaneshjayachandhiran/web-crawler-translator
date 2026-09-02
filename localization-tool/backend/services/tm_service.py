"""Translation Memory service with SHA256 hashing."""
import hashlib
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from database import TextSegment


class TranslationMemoryService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def compute_hash(text: str) -> str:
        """Compute SHA256 hash of source text."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def find_existing_translation(self, source_hash: str, project_id: int) -> Optional[str]:
        """Find existing translation for a source hash in the same project."""
        segment = (
            self.db.query(TextSegment)
            .filter(
                TextSegment.source_hash == source_hash,
                TextSegment.project_id == project_id,
                TextSegment.target_text.isnot(None),
                TextSegment.translation_status.in_(["completed", "tm_reused"]),
            )
            .first()
        )
        return segment.target_text if segment else None

    def get_tm_stats(self, project_id: int) -> Dict:
        """Get translation memory statistics for a project."""
        total = (
            self.db.query(TextSegment)
            .filter(TextSegment.project_id == project_id)
            .count()
        )
        translated = (
            self.db.query(TextSegment)
            .filter(
                TextSegment.project_id == project_id,
                TextSegment.target_text.isnot(None),
            )
            .count()
        )
        tm_reused = (
            self.db.query(TextSegment)
            .filter(
                TextSegment.project_id == project_id,
                TextSegment.translation_status == "tm_reused",
            )
            .count()
        )
        return {
            "total_segments": total,
            "translated_segments": translated,
            "tm_reused_count": tm_reused,
            "coverage": round(translated / total * 100, 1) if total > 0 else 0,
        }

    def get_unique_source_hashes(self, project_id: int) -> List[str]:
        """Get all unique source hashes with translations for a project."""
        segments = (
            self.db.query(TextSegment.source_hash, TextSegment.target_text)
            .filter(
                TextSegment.project_id == project_id,
                TextSegment.target_text.isnot(None),
            )
            .distinct(TextSegment.source_hash)
            .all()
        )
        return {h: t for h, t in segments if t}

    def bulk_update_tm_status(self, segment_ids: List[int], status: str):
        """Bulk update translation status for segments."""
        self.db.query(TextSegment).filter(TextSegment.id.in_(segment_ids)).update(
            {"translation_status": status}, synchronize_session=False
        )
        self.db.commit()