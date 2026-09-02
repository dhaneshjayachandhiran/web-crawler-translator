import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Index } from "@/pages/Index";
import { Editor } from "@/pages/Editor";
import { Projects } from "@/pages/Projects";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Index />} />
        <Route path="editor/:projectId" element={<Editor />} />
        <Route path="projects" element={<Projects />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;