import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { BilingualEditor } from '../components/BilingualEditor';
import type { TextSegment, Page } from '../types';

export function Editor() {
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get('page');
  const [page, setPage] = useState<Page | null>(null);
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!pageId) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/pages/${pageId}`).then((r) => r.json()),
      fetch(`/api/pages/${pageId}/segments`).then((r) => r.json()),
    ])
      .then(([pageData, segmentsData]) => {
        setPage(pageData);
        setSegments(segmentsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pageId]);

  const handleSegmentUpdate = async (id: number, targetText: string) => {
    setSegments((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, target_text: targetText, translation_status: 'completed' } : s
      )
    );

    try {
      await fetch(`/api/segments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_text: targetText }),
      });
    } catch (err) {
      console.error('Failed to update segment:', err);
    }
  };

  const handleTranslateSegment = async (id: number) => {
    setIsTranslating(true);
    try {
      const res = await fetch(`/api/segments/${id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment_id: id }),
      });
      const data = await res.json();
      setSegments((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                target_text: data.target_text,
                translation_status: data.translation_status,
              }
            : s
        )
      );
    } catch (err) {
      console.error('Failed to translate segment:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateAll = async () => {
    if (!page) return;
    setIsTranslating(true);
    try {
      // Translate each segment
      for (const segment of segments) {
        if (!segment.target_text) {
          await handleTranslateSegment(segment.id);
        }
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    // Already saved on each update, but trigger a final save
    try {
      const promises = segments.map((s) =>
        fetch(`/api/segments/${s.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_text: s.target_text }),
        })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading editor...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!page) {
    return (
      <DashboardLayout>
        <div className="card p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No page selected</h2>
          <p className="text-gray-500">Select a page from the dashboard to start editing.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <BilingualEditor
        page={page}
        segments={segments}
        onSegmentUpdate={handleSegmentUpdate}
        onTranslateSegment={handleTranslateSegment}
        onTranslateAll={handleTranslateAll}
        onSave={handleSave}
        isTranslating={isTranslating}
      />
    </DashboardLayout>
  );
}