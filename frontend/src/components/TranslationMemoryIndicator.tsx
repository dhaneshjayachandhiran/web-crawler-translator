import { cn } from '../lib/utils';

interface TranslationMemoryIndicatorProps {
  sourceHash: string;
  isReused: boolean;
  className?: string;
}

export function TranslationMemoryIndicator({
  sourceHash,
  isReused,
  className,
}: TranslationMemoryIndicatorProps) {
  if (!isReused) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200',
        className
      )}
    >
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span className="text-xs font-medium text-blue-700">TM Reused</span>
      <span className="text-xs text-blue-500 font-mono">
        {sourceHash.slice(0, 8)}...
      </span>
    </div>
  );
}