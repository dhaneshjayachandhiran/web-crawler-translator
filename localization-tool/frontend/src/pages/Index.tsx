"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PagesTable } from "@/components/PagesTable";
import { Plus, Search, Globe, ArrowRight } from "lucide-react";
import { Page, Project } from "@/types";
import { api } from "@/lib/api";

export const Index: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load pages when project changes
  useEffect(() => {
    if (selectedProject) {
      loadPages(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPages = async (projectId: number) => {
    try {
      const data = await api.pages.list(projectId);
      setPages(data);
    } catch (error) {
      console.error("Failed to load pages:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectUrl) return;
    try {
      const project = await api.projects.create({
        name: newProjectName,
        start_url: newProjectUrl,
      });
      setProjects([...projects, project]);
      setSelectedProject(project.id);
      setNewProjectName("");
      setNewProjectUrl("");
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleToggleInclude = async (id: number, included: boolean) => {
    try {
      await api.pages.update(id, { is_included: included });
      setPages(pages.map((p) => (p.id === id ? { ...p, is_included: included } : p)));
    } catch (error) {
      console.error("Failed to update page:", error);
    }
  };

  const handleSelect = (id: number, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((pid) => pid !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(pages.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleTranslatePage = (pageId: number) => {
    const page = pages.find((p) => p.id === pageId);
    if (page && selectedProject) {
      navigate(`/editor/${selectedProject}`);
    }
  };

  const handleBatchTranslate = async () => {
    if (!selectedProject) return;
    try {
      await api.translation.batch(selectedProject, {
        target_language: "es",
        batch_size: 10,
      });
      if (selectedProject) {
        loadPages(selectedProject);
      }
    } catch (error) {
      console.error("Failed to batch translate:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Localization Dashboard</h1>
          <p className="text-muted-foreground">
            Crawl, translate, and publish your website in multiple languages
          </p>
        </div>
      </div>

      {/* Create Project Card */}
      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>
            Start a new localization project by providing a starting URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="sm:max-w-xs"
            />
            <Input
              placeholder="https://example.com"
              value={newProjectUrl}
              onChange={(e) => setNewProjectUrl(e.target.value)}
              className="sm:max-w-md"
            />
            <Button onClick={handleCreateProject} disabled={!newProjectName || !newProjectUrl}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {projects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Projects</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProject === project.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedProject(project.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {project.start_url}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{project.source_language}</span>
                    <span>→</span>
                    <span className="capitalize">{project.target_language}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pages Table */}
      {selectedProject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Crawled Pages</h2>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleBatchTranslate}>
                  Translate Selected ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>
          <PagesTable
            pages={pages}
            onToggleInclude={handleToggleInclude}
            onTranslatePage={handleTranslatePage}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
          />
        </div>
      )}

      {!selectedProject && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select or create a project</p>
            <p className="text-sm">Choose a project from above or create a new one to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};