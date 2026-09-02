import { STATUS_COLORS } from '../types';
import { cn } from '../lib/utils';

interface TranslationStatusIndicatorProps {
  status: 'pending' | 'in_progress' | 'completed' | 'tm_reused' | 'failed';
  className?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  tm_reused: 'TM Reused',
  failed: 'Failed',
};

const statusIcons: Record<string, JSX.Element> = {
  pending: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
    </svg>
  ),
  in_progress: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  completed: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  tm_reused: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  failed: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export function TranslationStatusIndicator({ status, className }: TranslationStatusIndicatorProps) {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const icon = statusIcons[status] || statusIcons.pending;
  const label = statusLabels[status] || status;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('flex items-center rounded-full p-1', colorClass)}>
        {icon}
      </span>
      <span className={cn('text-sm', colorClass.split(' ')[1])}>{label}</span>
    </div>
  );
}