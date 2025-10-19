"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/projectStore";
import { useUserStore } from "@/store/userStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import AuthGuard from "@/components/Auth/AuthGuard";
import ProjectCard from "@/components/Projects/ProjectCard";
import ShareProjectDialog from "@/components/Projects/ShareProjectDialog";
import { ProjectMetadata } from "@/types/project";
import { loadProject } from "@/lib/firebase/projects";
import {
  exportToPNG,
  generateExportFilename,
  downloadPNG,
} from "@/lib/export/pngExport";

type SortOption = "recent" | "name" | "objects";

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <ProjectsPageContent />
    </AuthGuard>
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  // Zustand store selectors
  const projects = useProjectStore((state) => state.projects);
  const currentProject = useProjectStore((state) => state.currentProject);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const loadProject = useProjectStore((state) => state.loadProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const renameProject = useProjectStore((state) => state.renameProject);
  const startNewCanvas = useProjectStore((state) => state.startNewCanvas);
  const currentUser = useUserStore((state) => state.currentUser);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [projectToShare, setProjectToShare] = useState<ProjectMetadata | null>(
    null
  );

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter and sort projects
  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "recent")
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "objects") return b.objectCount - a.objectCount;
      return 0;
    });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Firebase auth will redirect to login page via AuthGuard
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle new canvas
  const handleNewCanvas = () => {
    // Clear current project to start fresh
    startNewCanvas();
    router.push("/");
  };

  // Handle open project
  const handleOpenProject = async (projectId: string) => {
    try {
      // Load the project first
      await loadProject(projectId);
      // Then navigate to canvas
      router.push("/");
    } catch (error) {
      console.error("Failed to load project:", error);
      addToast("Failed to load project", "error");
    }
  };

  // Handle delete with confirmation
  const handleDelete = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const confirmed = window.confirm(
      `Delete "${project.name}"?\n\nThis action cannot be undone.\n${project.objectCount} objects will be deleted.`
    );

    if (confirmed) {
      try {
        await deleteProject(projectId);
        addToast("Project deleted", "success");
      } catch (error) {
        addToast("Failed to delete project. Please try again.", "error");
      }
    }
  };

  // Handle rename
  const handleRename = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newName = window.prompt("Enter new project name:", project.name);

    if (newName && newName.trim() && newName.trim() !== project.name) {
      try {
        await renameProject(projectId, newName.trim());
        addToast("Project renamed", "success");
      } catch (error) {
        addToast("Failed to rename project. Please try again.", "error");
      }
    }
  };

  // Handle share
  const handleShare = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Get full metadata if it's the current project, otherwise construct from list item
    let fullMetadata: ProjectMetadata;
    if (currentProject?.metadata.id === projectId) {
      fullMetadata = currentProject.metadata;
    } else {
      fullMetadata = {
        id: project.id,
        name: project.name,
        updatedAt: project.updatedAt,
        objectCount: project.objectCount,
        thumbnail: project.thumbnail,
        createdAt: project.updatedAt,
        ownerId: currentUser?.id || "unknown",
        isShared: false,
        sharedWith: [],
      };
    }

    setProjectToShare(fullMetadata);
    setShowShareDialog(true);
  };

  // Handle export
  const handleExport = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    if (!currentUser?.id) {
      addToast("Not authenticated", "error");
      return;
    }

    try {
      addToast("Exporting project...", "info");

      // Load project data
      const projectData = await loadProject(currentUser.id, projectId);

      // Export directly
      const dataURL = await exportToPNG(projectData.objects, {
        resolution: 2,
        backgroundColor: "white",
        autoCrop: true,
      });

      const filename = generateExportFilename(projectData.metadata.name);
      downloadPNG(dataURL, filename);

      addToast(`Exported ${projectData.metadata.name}`, "success");
    } catch (error) {
      console.error("Export failed:", error);
      addToast("Export failed. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo/Title */}
          <h1
            className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
            style={{ color: "#7BA05B" }}
          >
            <span className="text-3xl sm:text-4xl">🍵</span>
            <span>Mockup Matcha Hub</span>
          </h1>

          {/* User info and logout */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg shadow border border-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <span>⏻</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h2>
          <p className="text-gray-600">
            Choose a project to continue or start a new canvas
          </p>
        </div>

        {/* New Canvas Button */}
        <div className="mb-8">
          <button
            onClick={handleNewCanvas}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <span className="text-2xl">✨</span>
            <span>Create New Canvas</span>
          </button>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <input
              type="search"
              placeholder="🔍 Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="name">A-Z</option>
              <option value="objects">Object Count</option>
            </select>
          </div>
        </div>

        {/* Projects Grid or Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
              // No search results
              <div>
                <div className="text-8xl mb-6">🔍</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try a different search term
                </p>
              </div>
            ) : (
              // No projects at all
              <div>
                <div className="text-8xl mb-6">🎨</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first canvas to get started!
                </p>
                <button
                  onClick={handleNewCanvas}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2 font-semibold"
                >
                  <span className="text-xl">✨</span>
                  <span>Create New Canvas</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={currentProject?.metadata.id === project.id}
                onOpen={handleOpenProject}
                onRename={handleRename}
                onDelete={handleDelete}
                onShare={handleShare}
                onExport={handleExport}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Project Dialog */}
      <ShareProjectDialog
        isOpen={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setProjectToShare(null);
        }}
        project={projectToShare}
      />
    </div>
  );
}
