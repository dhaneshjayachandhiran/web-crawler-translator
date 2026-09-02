import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { PagesTable } from '../components/PagesTable';
import { Button } from '../components/BulkActions';
import { useApi } from '../hooks/useApi';
import { Plus, Globe, FileText, Languages, TrendingUp } from 'lucide-react';
import type { Project, Page } from '../types';

export function Index() {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, refresh: refreshProjects } = useApi();
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', url: '', targetLang: 'es' });

  const activeProject = projects[0];

  useEffect(() => {
    if (activeProject) {
      fetch(`/api/projects/${activeProject.id}/pages`)
        .then((res) => res.json())
        .then((data) => setPages(data))
        .catch(console.error);
    }
  }, [activeProject]);

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.url) return;

    try {
      const res = await fetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          start_url: newProject.url,
          target_language: newProject.targetLang,
        }),
      });
      const project = await res.json();

      // Start crawl
      await fetch('/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, max_pages: 50 }),
      });

      setShowNewProject(false);
      setNewProject({ name: '', url: '', targetLang: 'es' });
      refreshProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleToggleInclusion = async (pageId: number, isIncluded: boolean) => {
    try {
      await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_included: isIncluded }),
      });
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, is_included: isIncluded } : p))
      );
    } catch (err) {
      console.error('Failed to toggle inclusion:', err);
    }
  };

  const handleTranslate = async (pageId: number) => {
    if (!activeProject) return;
    setIsTranslating(true);
    try {
      await fetch(`/api/projects/${activeProject.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_language: newProject.targetLang || 'es', batch_size: 10 }),
      });
      // Refresh pages
      const res = await fetch(`/api/projects/${activeProject.id}/pages`);
      const data = await res.json();
      setPages(data);
    } catch (err) {
      console.error('Failed to translate:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const stats = {
    totalPages: pages.length,
    includedPages: pages.filter((p) => p.is_included).length,
    translatedPages: pages.filter((p) => p.status === 'completed').length,
    totalWords: pages.reduce((sum, p) => sum + p.word_count, 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your localization projects</p>
          </div>
          <Button onClick={() => setShowNewProject(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPages}</p>
                <p className="text-xs text-gray-500">Total Pages</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.includedPages}</p>
                <p className="text-xs text-gray-500">Included</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Languages className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.translatedPages}</p>
                <p className="text-xs text-gray-500">Translated</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWords.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Words</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        {projects.length > 0 && (
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Project</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">{activeProject?.name}</h3>
                <p className="text-sm text-gray-500">{activeProject?.start_url}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-blue-100 text-blue-800">
                  {activeProject?.source_language} → {activeProject?.target_language}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pages Table */}
        <PagesTable
          pages={pages}
          onToggleInclusion={handleToggleInclusion}
          onTranslate={handleTranslate}
          selectedPages={selectedPages}
          onSelectionChange={setSelectedPages}
          isTranslating={isTranslating}
        />

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    className="input"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="My Website"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start URL</label>
                  <input
                    type="url"
                    className="input"
                    value={newProject.url}
                    onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
                  <select
                    className="input"
                    value={newProject.targetLang}
                    onChange={(e) => setNewProject({ ...newProject, targetLang: e.target.value })}
                  >
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowNewProject(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>
                  Create & Crawl
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}