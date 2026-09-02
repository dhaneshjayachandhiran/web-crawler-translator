import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between flex-shrink-0 bg-background px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <NavLink to="/" className={cn("text-lg font-semibold text-foreground", { active: false })}>
            <span className="icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="5" x2="8" y2="12"></line><line x1="8" y1="16" x2="16" y2="16"></line></svg></span>
            Dashboard
          </NavLink>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <NavLink to="/projects" className={cn("text-sm text-muted-foreground hover:text-foreground transition-colors", { active: false })}>
            Projects
          </NavLink>
          <NavLink to="/dashboard" className={cn("text-sm text-muted-foreground hover:text-foreground transition-colors", { active: false })}>
            Dashboard
          </NavLink>
        </div>
      </nav>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};