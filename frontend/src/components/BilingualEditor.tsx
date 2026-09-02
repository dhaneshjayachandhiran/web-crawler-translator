import { useState, useEffect, useMemo } from 'react';
import { cn } from '../lib/utils';
import { TextSegmentRow } from './TextSegmentRow';
import { LivePreviewIframe } from './LivePreviewIframe';
import { Button } from './BulkActions';
import { Languages, Save, Sparkles } from 'lucide-react';
import type { TextSegment, Page } from '../types';
import { LANGUAGE_NAMES } from '../types';

interface BilingualEditorProps {
  page: Page;
  segments: TextSegment[];
  onSegmentUpdate: (id: number, targetText: string) => void;
  onTranslateSegment: (id: number) => void;
  onTranslateAll: () => void;
  onSave: () => void;
  isTranslating?: boolean;
}

export function BilingualEditor({
  page,
  segments,
  onSegmentUpdate,
  onTranslateSegment,
  onTranslateAll,
  onSave,
  isTranslating = false,
}: BilingualEditorProps) {
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Build translations map for live preview
  useEffect(() => {
    const map: Record<string, string> = {};
    segments.forEach((segment) => {
      if (segment.target_text) {
        map[segment.source_text] = segment.target_text;
      }
    });
    setTranslations(map);
  }, [segments]);

  const completedCount = useMemo(
    () => segments.filter((s) => s.translation_status === 'completed' || s.translation_status === 'tm_reused').length,
    [segments]
  );

  const totalCount = segments.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{page.title || 'Untitled'}</h2>
              <p className="text-sm text-gray-500">
                {LANGUAGE_NAMES[page.detected_language] || page.detected_language} → {LANGUAGE_NAMES['es']}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {completedCount} / {totalCount}
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={onSave}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="default"
              onClick={onTranslateAll}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Translating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Translate All
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Segments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-700">Text Segments</h3>
            <span className="text-xs text-gray-500">{segments.length} segments</span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
            {segments.map((segment) => (
              <TextSegmentRow
                key={segment.id}
                segment={segment}
                onTargetChange={onSegmentUpdate}
                onTranslate={onTranslateSegment}
                isTranslating={isTranslating}
              />
            ))}
            {segments.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-gray-500">No text segments found for this page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
            <span className="text-xs text-gray-500">Updates in real-time</span>
          </div>
          <LivePreviewIframe
            htmlContent={page.html_content || ''}
            translations={translations}
            className="sticky top-20"
          />
        </div>
      </div>
    </div>
  );
}