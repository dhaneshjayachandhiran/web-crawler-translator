export interface Project {
  id: number;
  name: string;
  start_url: string;
  target_language: string;
  source_language: string;
  created_at?: string;
  updated_at?: string;
}

export interface Page {
  id: number;
  project_id: number;
  url: string;
  title: string | null;
  detected_language: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  is_included: boolean;
  word_count: number;
  content_type: string;
  created_at?: string;
}

export interface TextSegment {
  id: number;
  page_id: number;
  project_id: number;
  source_text: string;
  target_text: string | null;
  source_hash: string;
  translation_status: 'pending' | 'in_progress' | 'completed' | 'tm_reused';
}

export interface TranslationResult {
  segment_id: number;
  source_text: string;
  target_text: string;
  translation_status: string;
  used_tm: boolean;
}

export interface CrawlResult {
  project_id: number;
  pages_crawled: number;
  pages_succeeded: number;
  pages_failed: number;
  status: string;
}

export type ContentType = 'article' | 'product' | 'navigation' | 'form' | 'landing' | 'page' | 'unknown';

export type TranslationStatus = 'pending' | 'in_progress' | 'completed' | 'tm_reused' | 'failed';

export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ru': 'Russian',
  'ar': 'Arabic',
};

export const CONTENT_TYPE_COLORS: Record<string, string> = {
  article: 'bg-blue-100 text-blue-800',
  product: 'bg-green-100 text-green-800',
  navigation: 'bg-gray-100 text-gray-800',
  form: 'bg-yellow-100 text-yellow-800',
  landing: 'bg-purple-100 text-purple-800',
  page: 'bg-gray-100 text-gray-800',
  unknown: 'bg-gray-100 text-gray-500',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  tm_reused: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};