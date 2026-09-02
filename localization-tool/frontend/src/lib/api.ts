const API_BASE = "http://localhost:8000";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Projects
  projects: {
    list: () => request<Project[]>("/projects"),
    create: (data: { name: string; start_url: string; target_language?: string; source_language?: string }) =>
      request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
    get: (id: number) => request<Project>(`/projects/${id}`),
    delete: (id: number) => request<void>(`/projects/${id}`, { method: "DELETE" }),
  },

  // Crawler
  crawl: {
    start: (data: { project_id: number; max_pages?: number; include_media?: boolean }) =>
      request<{ status: string; project_id: number }>("/crawl", { method: "POST", body: JSON.stringify(data) }),
  },

  // Pages
  pages: {
    list: (projectId?: number) => {
      const params = projectId ? `?project_id=${projectId}` : "";
      return request<Page[]>(`/pages${params}`);
    },
    get: (id: number) => request<Page>(`/pages/${id}`),
    update: (id: number, data: { is_included: boolean }) =>
      request<Page>(`/api/pages/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  // Segments
  segments: {
    listByPage: (pageId: number) => request<TextSegment[]>(`/pages/${pageId}/segments`),
    update: (id: number, targetText: string) =>
      request<TextSegment>(`/segments/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_text: targetText }) 
      }),
  },

  // Translation
  translation: {
    batch: (projectId: number, data: { target_language: string; batch_size?: number }) =>
      request<{ translated: number; tm_reused: number; failed: number }>(
        `/api/projects/${projectId}/translate`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    single: (segmentId: number) =>
      request<TextSegment>(`/api/segments/${segmentId}/translate`, { method: "POST" }),
  },

  // TM Stats
  tm: {
    stats: (projectId: number) => request<TMStats>(`/projects/${projectId}/tm-stats`),
  },

  // CDN
  cdn: {
    locJs: (projectId?: number) => {
      const params = projectId ? `?project_id=${projectId}` : "";
      return fetch(`${API_BASE}/cdn/loc.js${params}`).then(r => r.text());
    },
    translations: (projectId: number) => request<TranslationExport>(`/cdn/translations/${projectId}`),
  },
};

// Re-export types
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