import { useState, useEffect, useCallback } from 'react';
import type { Project, Page, TextSegment, CrawlResult, TranslationResult } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchJson<Project[]>(`${API_BASE}/projects`);
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, loading, error, refresh };
}

export function usePages(projectId?: number) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const url = projectId ? `${API_BASE}/projects/${projectId}/pages` : '/pages';
      const data = await fetchJson<Page[]>(url);
      setPages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pages, loading, error, refresh };
}

export function usePage(pageId: number | null) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchJson<Page>(`${API_BASE}/pages/${pageId}`)
      .then((data) => {
        setPage(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch page'))
      .finally(() => setLoading(false));
  }, [pageId]);

  return { page, loading, error };
}

export function useSegments(pageId: number | null) {
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId) {
      setSegments([]);
      return;
    }
    setLoading(true);
    fetchJson<TextSegment[]>(`${API_BASE}/pages/${pageId}/segments`)
      .then((data) => {
        setSegments(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch segments'))
      .finally(() => setLoading(false));
  }, [pageId]);

  return { segments, loading, error };
}

export async function startCrawl(projectId: number, maxPages = 50): Promise<CrawlResult> {
  return fetchJson<CrawlResult>('/crawl', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, max_pages: maxPages }),
  });
}

export async function togglePageInclusion(pageId: number, isIncluded: boolean): Promise<void> {
  await fetchJson(`${API_BASE}/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_included: isIncluded }),
  });
}

export async function translateProject(projectId: number, targetLanguage: string): Promise<{ translated_segments: number; tm_reused: number }> {
  return fetchJson(`${API_BASE}/projects/${projectId}/translate`, {
    method: 'POST',
    body: JSON.stringify({ target_language: targetLanguage, batch_size: 10 }),
  });
}

export async function translateSegment(segmentId: number): Promise<TranslationResult> {
  return fetchJson(`${API_BASE}/segments/${segmentId}/translate`, {
    method: 'POST',
    body: JSON.stringify({ segment_id: segmentId }),
  });
}

export async function createProject(name: string, startUrl: string, targetLanguage = 'es'): Promise<Project> {
  return fetchJson<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, start_url: startUrl, target_language: targetLanguage }),
  });
}