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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'default',
          'border border-gray-300 bg-white hover:bg-gray-50 focus:ring-gray-400': variant === 'outline',
          'bg-transparent hover:bg-gray-100 focus:ring-gray-400': variant === 'ghost',
          'px-2.5 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}