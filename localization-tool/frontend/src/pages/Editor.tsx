"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BilingualEditor } from "@/components/BilingualEditor";

export const Editor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No project selected</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-xl font-semibold">Bilingual Editor</h1>
      </div>
      <div className="flex-1 border rounded-lg">
        <BilingualEditor
          projectId={parseInt(projectId)}
          onSave={() => {
            // Save logic
            console.log("Saved");
          }}
          onCancel={() => navigate("/")}
        />
      </div>
    </div>
  );
};