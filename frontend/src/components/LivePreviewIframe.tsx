import { useMemo } from 'react';
import { cn } from '../lib/utils';

interface LivePreviewIframeProps {
  htmlContent: string;
  translations: Record<string, string>;
  className?: string;
}

export function LivePreviewIframe({
  htmlContent,
  translations,
  className,
}: LivePreviewIframeProps) {
  // Apply translations to HTML content
  const transformedHtml = useMemo(() => {
    if (!htmlContent) return '';

    let content = htmlContent;

    // Replace translations in the HTML
    Object.entries(translations).forEach(([key, value]) => {
      // Simple text replacement - in production, use proper DOM manipulation
      content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return content;
  }, [htmlContent, translations]);

  const iframeContent = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 16px;
              background: #fff;
              line-height: 1.6;
            }
            img { max-width: 100%; height: auto; }
            a { color: #4f46e5; }
          </style>
        </head>
        <body>
          ${transformedHtml}
        </body>
      </html>
    `;
  }, [transformedHtml]);

  return (
    <div className={cn('relative rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-medium text-gray-500">Live Preview</span>
      </div>
      <iframe
        srcDoc={iframeContent}
        className="w-full h-full min-h-[400px] border-0"
        title="Live Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}