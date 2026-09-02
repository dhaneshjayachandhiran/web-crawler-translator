import { useState } from 'react';
import { cn } from '../lib/utils';
import { TranslationMemoryIndicator } from './TranslationMemoryIndicator';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import type { TextSegment } from '../types';

interface TextSegmentRowProps {
  segment: TextSegment;
  onTargetChange: (id: number, targetText: string) => void;
  onTranslate: (id: number) => void;
  isTranslating?: boolean;
}

export function TextSegmentRow({
  segment,
  onTargetChange,
  onTranslate,
  isTranslating = false,
}: TextSegmentRowProps) {
  const [localTarget, setLocalTarget] = useState(segment.target_text || '');

  const handleBlur = () => {
    if (localTarget !== segment.target_text) {
      onTargetChange(segment.id, localTarget);
    }
  };

  const isReused = segment.translation_status === 'tm_reused';

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 p-4 rounded-xl border transition-all',
        isReused
          ? 'bg-blue-50/50 border-blue-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      )}
    >
      {/* Source Text */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Source
        </label>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {segment.source_text}
          </p>
        </div>
        <TranslationMemoryIndicator
          sourceHash={segment.source_hash}
          isReused={isReused}
        />
      </div>

      {/* Target Text */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Target
        </label>
        <div className="relative">
          <textarea
            value={localTarget}
            onChange={(e) => setLocalTarget(e.target.value)}
            onBlur={handleBlur}
            disabled={isTranslating}
            className={cn(
              'w-full p-3 rounded-lg border text-sm resize-none min-h-[80px] transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              isReused
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-white border-gray-300 text-gray-900'
            )}
            placeholder="Enter translation..."
          />
          {isTranslating && (
            <div className="absolute right-3 top-3">
              <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={() => onTranslate(segment.id)}
          disabled={isTranslating}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            'hover:bg-primary-50 hover:text-primary-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'text-primary-600'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Get AI Suggestion
        </button>
      </div>
    </div>
  );
}