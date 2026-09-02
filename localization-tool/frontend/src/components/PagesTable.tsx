"use client";

import React, { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Page, CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS, ContentType } from "@/types";

interface PagesTableProps {
  pages: Page[];
  onToggleInclude: (id: number, included: boolean) => void;
  onTranslatePage: (pageId: number) => void;
  selectedIds: number[];
  onSelect: (id: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

export const PagesTable: React.FC<PagesTableProps> = ({
  pages,
  onToggleInclude,
  onTranslatePage,
  selectedIds,
  onSelect,
  onSelectAll,
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Page; direction: "asc" | "desc" } | null>(null);
  const [filter, setFilter] = useState({ search: "", status: "", language: "", contentType: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      if (filter.search) {
        const search = filter.search.toLowerCase();
        if (!page.url.toLowerCase().includes(search) &&
            !page.title?.toLowerCase().includes(search)) {
          return false;
        }
      }
      if (filter.status && page.status !== filter.status) return false;
      if (filter.language && page.detected_language !== filter.language) return false;
      if (filter.contentType && page.content_type !== filter.contentType) return false;
      return true;
    });
  }, [pages, filter]);

  const sortedPages = useMemo(() => {
    if (!sortConfig) return filteredPages;
    return [...filteredPages].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * direction;
      }
      return 0;
    });
  }, [filteredPages, sortConfig]);

  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPages.slice(start, start + itemsPerPage);
  }, [sortedPages, currentPage]);

  const totalPages = Math.ceil(sortedPages.length / itemsPerPage);

  const handleSort = (key: keyof Page) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ key }: { key: keyof Page }) => {
    if (sortConfig?.key !== key) return <ChevronUp className="w-4 h-4 text-muted-foreground" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  const allSelected = selectedIds.length === pages.length && pages.length > 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < pages.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.language} onValueChange={(v) => setFilter({ ...filter, language: v })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.contentType} onValueChange={(v) => setFilter({ ...filter, contentType: v })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="ui">UI</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("title")}>
                Title <SortIcon key="title" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("url")}>
                URL <SortIcon key="url" />
              </th>
              <th className="px-4 py-3 text-right font-medium text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("word_count")}>
                Words <SortIcon key="word_count" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("content_type")}>
                Type <SortIcon key="content_type" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("detected_language")}>
                Language <SortIcon key="detected_language" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("status")}>
                Status <SortIcon key="status" />
              </th>
              <th className="w-12 px-4 py-3 text-left font-medium text-sm text-muted-foreground">
                Included
              </th>
              <th className="w-24 px-4 py-3 text-right font-medium text-sm text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedPages.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  No pages found
                </td>
              </tr>
            ) : (
              paginatedPages.map((page) => (
                <tr key={page.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(page.id)}
                      onCheckedChange={(checked) => onSelect(page.id, checked as boolean)}
                      aria-label={`Select ${page.title || page.url}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate font-medium">{page.title || "Untitled"}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{page.url}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">{page.url}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                    {page.word_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={CONTENT_TYPE_COLORS[page.content_type as ContentType] || CONTENT_TYPE_COLORS.unknown}>
                      {CONTENT_TYPE_LABELS[page.content_type as ContentType] || page.content_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{page.detected_language}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[page.status] || STATUS_COLORS.pending}>
                      {STATUS_LABELS[page.status] || page.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={page.is_included}
                      onCheckedChange={(checked) => onToggleInclude(page.id, checked as boolean)}
                      aria-label={`Include ${page.title || page.url}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTranslatePage(page.id)}
                      disabled={page.status === "failed" || !page.is_included}
                    >
                      Translate
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedPages.length)} of {sortedPages.length} pages
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-20 text-center">
              {currentPage} / {totalPages}
            </span>
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
  );
};