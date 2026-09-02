export interface Project {
  id: number;
  name: string;
  start_url: string;
  target_language: string;
  source_language: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: number;
  project_id: number;
  url: string;
  title: string | null;
  detected_language: string;
  status: string;
  is_included: boolean;
  word_count: number;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export interface TextSegment {
  id: number;
  page_id: number;
  project_id: number;
  source_text: string;
  target_text: string | null;
  source_hash: string;
  translation_status: "pending" | "in_progress" | "completed" | "tm_reused";
  llm_response: string | null;
}

export interface CrawlRequest {
  project_id: number;
  max_pages: number;
  include_media: boolean;
}

export interface CrawlResponse {
  total: number;
  completed: number;
  failed: number;
}

export interface BatchTranslateRequest {
  target_language: string;
  batch_size: number;
}

export interface TranslateSegmentRequest {
  segment_id: number;
}

export interface TMStats {
  total_segments: number;
  translated_segments: number;
  tm_reused_count: number;
  coverage: number;
}

export interface TranslationExport {
  project_id: number;
  target_language: string;
  translations: Record<string, string>;
}

export type ContentType = "article" | "navigation" | "footer" | "header" | "static" | "ui" | "content" | "unknown";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  article: "Article",
  navigation: "Navigation",
  footer: "Footer",
  header: "Header",
  static: "Static",
  ui: "UI",
  content: "Content",
  unknown: "Unknown",
};

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  article: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  navigation: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  footer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  header: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  static: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ui: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  content: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  unknown: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  tm_reused: "TM Reused",
  failed: "Failed",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  tm_reused: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};