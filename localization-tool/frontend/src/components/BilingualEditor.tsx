"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TextSegment, Project, Page } from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BilingualEditorProps {
  projectId: number;
  onSave: () => void;
  onCancel: () => void;
}

export const BilingualEditor: React.FC<BilingualEditorProps> = ({
  projectId,
  onSave,
  onCancel,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [sourceLang, setSourceLang] = useState<string>("en");
  const [targetLang, setTargetLang] = useState<string>("es");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [previewContent, setPreviewContent] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Load project data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [proj, pageList] = await Promise.all([
          api.projects.get(projectId),
          api.pages.list(projectId),
        ]);
        setProject(proj);
        setPages(pageList);
        if (pageList.length > 0) {
          setSelectedPageId(pageList[0].id);
          setSourceLang(proj.source_language);
          setTargetLang(proj.target_language);
          loadPageSegments(pageList[0].id);
        }
      } catch (error) {
        console.error("Failed to load project data:", error);
      }
    };

    loadData();
  }, [projectId]);

  // Load segments for selected page
  const loadPageSegments = async (pageId: number) => {
    try {
      const segs = await api.segments.listByPage(pageId);
      setSegments(segs);
      setSelectedPageId(pageId);
    } catch (error) {
      console.error("Failed to load segments:", error);
    }
  };

  // Update preview iframe
  useEffect(() => {
    if (iframeRef.current && previewContent) {
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(previewContent);
          iframeDoc.close();
        }
      } catch (error) {
        console.error("Failed to update preview:", error);
      }
    }
  }, [previewContent]);

  // Handle language change
  const handleSourceLangChange = async (value: string) => {
    setSourceLang(value);
    // Update project in backend
    try {
      await api.projects.update(projectId, { source_language: value });
    } catch (error) {
      console.error("Failed to update source language:", error);
    }
  };

  const handleTargetLangChange = async (value: string) => {
    setTargetLang(value);
    // Update project in backend
    try {
      await api.projects.update(projectId, { target_language: value });
    } catch (error) {
      console.error("Failed to update target language:", error);
    }
  };

  // Translate single segment
  const translateSegment = async (segmentId: number) => {
    try {
      await api.translation.single(segmentId);
      // Refresh segments
      if (selectedPageId) {
        loadPageSegments(selectedPageId);
      }
    } catch (error) {
      console.error("Failed to translate segment:", error);
    }
  };

  // Translate all segments in project
  const translateAll = async () => {
    setIsTranslating(true);
    try {
      const result = await api.translation.batch(projectId, {
        target_language: targetLang,
        batch_size: 10,
      });
      console.log("Batch translation result:", result);
      // Refresh all pages
      if (pages.length > 0) {
        for (const page of pages) {
          await api.segments.listByPage(page.id);
        }
      }
      if (selectedPageId) {
        loadPageSegments(selectedPageId);
      }
    } catch (error) {
      console.error("Failed to batch translate:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Update preview content
  const updatePreview = async () => {
    if (!selectedPageId) return;
    
    setIsPreviewLoading(true);
    try {
      // Get the page HTML
      const page = pages.find(p => p.id === selectedPageId);
      if (!page || !page.html_content) {
        setPreviewContent("<p>No HTML content available</p>");
        return;
      }

      // Get translations for this project
      const translationsData = await api.cdn.translations(projectId);
      const translations = translationsData.translations;

      // Replace text in HTML
      let html = page.html_content;
      
      // Simple replacement - in production, this would be more sophisticated
      for (const [hash, translation] of Object.entries(translations)) {
        // Find the original text by hash (we'd need to store this mapping)
        // For now, we'll do a simple approach
        const segment = segments.find(s => s.source_hash === hash);
        if (segment && segment.target_text) {
          // Replace source text with target text in HTML
          // This is simplified - real implementation would be more precise
          const escapedSource = segment.source_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedSource, "g");
          html = html.replace(regex, segment.target_text);
        }
      }

      setPreviewContent(html);
    } catch (error) {
      console.error("Failed to update preview:", error);
      setPreviewContent("<p>Error loading preview</p>");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Watch for changes to update preview
  useEffect(() => {
    if (selectedPageId && !isTranslating) {
      updatePreview();
    }
  }, [selectedPageId, segments, targetLang]);

  if (!project) {
    return <div className="p-6">Loading project...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background/50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{project.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Source:</span>
            <Select value={sourceLang} onValueChange={handleSourceLangChange} className="w-20">
              <SelectTrigger>
                <SelectValue>{sourceLang.toUpperCase()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
            <span className="mx-2">→</span>
            <Select value={targetLang} onValueChange={handleTargetLangChange} className="w-20">
              <SelectTrigger>
                <SelectValue>{targetLang.toUpperCase()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Close
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="ml-2"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page Selector Sidebar */}
        <div className="w-64 border-r flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-medium">Pages</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPageId(null)}>
              All Pages
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {pages.map((page) => (
              <div
                key={page.id}
                className={cn(
                  "flex items-center px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedPageId === page.id ? "bg-primary/10 border-l-2 border-primary" : ""
                )}
                onClick={() => loadPageSegments(page.id)}
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground truncate max-w-xs">{page.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground truncate">{page.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[page.status] || STATUS_COLORS.pending} size="xs">
                    {STATUS_LABELS[page.status]}
                  </Badge>
                  <Checkbox
                    checked={page.is_included}
                    onCheckedChange={(checked) => {
                      api.pages.update(page.id, { is_included: checked as boolean });
                    }}
                    aria-label={`Include ${page.title}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Segments List */}
          <div className="flex-1 overflow-y-auto border-b p-4">
            {segments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No text segments found</p>
                {selectedPageId && (
                  <Button variant="outline" size="sm" onClick={() => {
                    // Trigger re-crawl or refresh
                    loadPageSegments(selectedPageId);
                  }}>
                    Refresh
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {segments.map((segment) => (
                  <div key={segment.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    {/* Source Panel */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground mb-1">Source ({sourceLang.toUpperCase()})</div>
                      <div className="whitespace-pre-wrap break-words text-sm text-muted-foreground bg-background/50 p-3 rounded border">
                        {segment.source_text}
                      </div>
                    </div>

                    {/* Target Panel */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-foreground">Target ({targetLang.toUpperCase()})</div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge
                            className={cn(
                              segment.translation_status === "tm_reused"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : segment.translation_status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : segment.translation_status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            )}
                            size="xs"
                          >
                            {segment.translation_status === "tm_reused" ? "TM" : 
                             segment.translation_status === "completed" ? "Done" : 
                             segment.translation_status === "in_progress" ? "Translating..." : "Pending"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => translateSegment(segment.id)}
                            disabled={isTranslating || segment.translation_status === "in_progress"}
                          >
                            Translate
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          value={segment.target_text || ""}
                          onChange={(e) => {
                            const targetText = e.target.value;
                            api.segments.update(segment.id, targetText);
                            // Update preview when text changes
                            updatePreview();
                          }}
                          placeholder="Enter translation..."
                          className="w-full min-h-[80px] resize-none border border-input bg-background px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isTranslating}
                        />
                        {segment.llm_response && (
                          <div className="absolute bottom-0 left-0 right-0 px-3 py-1 text-xs text-muted-foreground bg-background/50">
                            LLM: {segment.llm_response}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="flex-1 border-t overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-medium">Live Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={updatePreview}
                  disabled={isPreviewLoading}
                >
                  {isPreviewLoading ? "Updating..." : "Refresh Preview"}
                </Button>
                <Checkbox
                  checked={true}
                  onCheckedChange={() => {}}
                  disabled
                  aria-label="Auto-update"
                />
                <span className="text-xs text-muted-foreground">Auto-update</span>
              </div>
            </div>
            <div className="flex-1 relative">
              {isPreviewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <div className="text-muted-foreground">Loading preview...</div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Live preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Translation Progress Bar */}
      {isTranslating && (
        <div className="border-t px-4 py-3 bg-background/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Translating...</span>
            <div className="flex-1 mx-4">
              <div className="w-full bg-muted/50 h-2.5 rounded overflow-hidden">
                <div
                  className={`h-full bg-primary transition-width duration-500`}
                  style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {translationProgress.current}/{translationProgress.total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};