import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface BulkActionsProps {
  selectedCount: number;
  onInclude: () => void;
  onExclude: () => void;
  onTranslate: () => void;
  isTranslating?: boolean;
}

export function BulkActions({
  selectedCount,
  onInclude,
  onExclude,
  onTranslate,
  isTranslating = false,
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-10 mx-auto max-w-fit rounded-full bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg px-4 py-2 flex items-center gap-3">
      <span className="text-sm text-gray-600">
        {selectedCount} {selectedCount === 1 ? 'page' : 'pages'} selected
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onInclude}
          className="h-8 text-xs"
        >
          Include
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExclude}
          className="h-8 text-xs"
        >
          Exclude
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onTranslate}
          disabled={isTranslating}
          className="h-8 text-xs"
        >
          {isTranslating ? 'Translating...' : 'Translate'}
        </Button>
      </div>
    </div>
  );
}