"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { Project } from "@/types";
import { api } from "@/lib/api";

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName || !newUrl) return;
    try {
      const project = await api.projects.create({ name: newName, start_url: newUrl });
      setProjects([...projects, project]);
      setNewName("");
      setNewUrl("");
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.projects.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your localization projects</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Start a new localization project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="sm:max-w-xs"
            />
            <Input
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="sm:max-w-md"
            />
            <Button onClick={handleCreate} disabled={!newName || !newUrl}>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{project.start_url}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{project.source_language}</span>
                    <span>→</span>
                    <span className="capitalize">{project.target_language}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/editor/${project.id}`)}
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};