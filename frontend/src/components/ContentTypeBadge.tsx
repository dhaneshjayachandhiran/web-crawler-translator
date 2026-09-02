import { Badge } from './ui/badge';
import { CONTENT_TYPE_COLORS } from '../types';
import { cn } from '../lib/utils';

interface ContentTypeBadgeProps {
  contentType: string;
  className?: string;
}

export function ContentTypeBadge({ contentType, className }: ContentTypeBadgeProps) {
  const colorClass = CONTENT_TYPE_COLORS[contentType] || CONTENT_TYPE_COLORS.unknown;
  return (
    <Badge className={cn(colorClass, className)}>
      {contentType}
    </Badge>
  );
}