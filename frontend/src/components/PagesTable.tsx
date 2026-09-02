import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn, truncate, formatUrl } from '../lib/utils';
import { ContentTypeBadge } from './ContentTypeBadge';
import { TranslationStatusIndicator } from './TranslationStatusIndicator';
import { BulkActions } from './BulkActions';
import { Button } from './BulkActions';
import { ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal, Check } from 'lucide-react';
import type { Page } from '../types';
import { LANGUAGE_NAMES } from '../types';

interface PagesTableProps {
  pages: Page[];
  onToggleInclusion: (pageId: number, isIncluded: boolean) => void;
  onTranslate: (pageId: number) => void;
  selectedPages: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  isTranslating?: boolean;
}

export function PagesTable({
  pages,
  onToggleInclusion,
  onTranslate,
  selectedPages,
  onSelectionChange,
  isTranslating = false,
}: PagesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const itemsPerPage = 10;

  // Filter pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      if (filterLanguage !== 'all' && page.detected_language !== filterLanguage) return false;
      if (filterStatus !== 'all' && page.status !== filterStatus) return false;
      return true;
    });
  }, [pages, filterLanguage, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPages.slice(start, start + itemsPerPage);
  }, [filteredPages, currentPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedPages.size === paginatedPages.length) {
      const newSelected = new Set(selectedPages);
      paginatedPages.forEach((p) => newSelected.delete(p.id));
      onSelectionChange(newSelected);
    } else {
      const newSelected = new Set(selectedPages);
      paginatedPages.forEach((p) => newSelected.add(p.id));
      onSelectionChange(newSelected);
    }
  };

  const toggleSelect = (pageId: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    onSelectionChange(newSelected);
  };

  // Bulk action handlers
  const handleBulkInclude = () => {
    selectedPages.forEach((id) => onToggleInclusion(id, true));
  };

  const handleBulkExclude = () => {
    selectedPages.forEach((id) => onToggleInclusion(id, false));
  };

  const handleBulkTranslate = () => {
    selectedPages.forEach((id) => onTranslate(id));
  };

  const allSelected = paginatedPages.length > 0 && selectedPages.size === paginatedPages.length;
  const someSelected = selectedPages.size > 0 && selectedPages.size < paginatedPages.length;

  if (pages.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <ExternalLink className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
        <p className="text-gray-500">Create a project and start crawling to see pages here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={filterLanguage}
          onChange={(e) => {
            setFilterLanguage(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Languages</option>
          {[...new Set(pages.map((p) => p.detected_language))].map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_NAMES[lang] || lang}
            </option>
          ))}
        </select>

        <select
          className="input w-auto"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <span className="text-sm text-gray-500 ml-auto">
          {filteredPages.length} {filteredPages.length === 1 ? 'page' : 'pages'}
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                      allSelected
                        ? 'bg-primary-600 border-primary-600'
                        : someSelected
                        ? 'bg-primary-100 border-primary-600'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    {(allSelected || someSelected) && <Check className="w-3 h-3 text-white" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Page Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Words
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPages.map((page) => (
                <tr
                  key={page.id}
                  className={cn(
                    'hover:bg-gray-50/50 transition-colors',
                    !page.is_included && 'opacity-50'
                  )}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(page.id)}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        selectedPages.has(page.id)
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {selectedPages.has(page.id) && <Check className="w-3 h-3 text-white" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {page.title || 'Untitled'}
                      </p>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                      >
                        {formatUrl(page.url)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      {LANGUAGE_NAMES[page.detected_language] || page.detected_language}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{page.word_count.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ContentTypeBadge contentType={page.content_type} />
                  </td>
                  <td className="px-4 py-3">
                    <TranslationStatusIndicator status={page.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleInclusion(page.id, !page.is_included)}
                      >
                        {page.is_included ? 'Exclude' : 'Include'}
                      </Button>
                      <Link to={`/editor?page=${page.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedPages.size}
        onInclude={handleBulkInclude}
        onExclude={handleBulkExclude}
        onTranslate={handleBulkTranslate}
        isTranslating={isTranslating}
      />
    </div>
  );
}