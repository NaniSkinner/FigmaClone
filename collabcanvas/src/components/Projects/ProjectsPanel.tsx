"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useProjectStore } from "@/store/projectStore";
import { ProjectMetadata } from "@/types/project";
import ProjectCard from "./ProjectCard";
import ShareProjectDialog from "./ShareProjectDialog";

interface ProjectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (projectId: string) => void;
}

type SortOption = "recent" | "name" | "objects";

export default function ProjectsPanel({
  isOpen,
  onClose,
  onOpenProject,
}: ProjectsPanelProps) {
  // Use proper Zustand selectors to avoid infinite loops
  const projects = useProjectStore((state) => state.projects);
  const currentProject = useProjectStore((state) => state.currentProject);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const renameProject = useProjectStore((state) => state.renameProject);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [position, setPosition] = useState({
    x: window.innerWidth - 480,
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [projectToShare, setProjectToShare] = useState<ProjectMetadata | null>(
    null
  );
  const panelRef = useRef<HTMLDivElement>(null);

  // Load projects on mount
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, loadProjects]);

  // Handle dragging
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleDrag = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

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
      } catch (error) {
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  // Handle rename (simplified - no inline editing for now)
  const handleRename = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newName = window.prompt("Enter new project name:", project.name);

    if (newName && newName.trim() && newName.trim() !== project.name) {
      try {
        await renameProject(projectId, newName.trim());
      } catch (error) {
        alert("Failed to rename project. Please try again.");
      }
    }
  };

  // Handle share
  const handleShare = async (projectId: string) => {
    // Need to get full project metadata from currentProject or load it
    // For now, we'll construct minimal metadata from the list item
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Get full metadata if it's the current project, otherwise construct from list item
    let fullMetadata: ProjectMetadata;
    if (currentProject?.metadata.id === projectId) {
      fullMetadata = currentProject.metadata;
    } else {
      // Construct basic metadata from list item
      // Note: This won't have all fields, but enough for the share dialog
      fullMetadata = {
        id: project.id,
        name: project.name,
        updatedAt: project.updatedAt,
        objectCount: project.objectCount,
        thumbnail: project.thumbnail,
        createdAt: project.updatedAt, // Fallback
        ownerId: "current-user", // We'd need to get this properly
        isShared: false,
        sharedWith: [],
      };
    }

    setProjectToShare(fullMetadata);
    setShowShareDialog(true);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 w-[460px] max-h-[600px] overflow-hidden z-40"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header - Draggable */}
      <div
        className="bg-gradient-to-r from-green-400 to-purple-400 text-white p-4 cursor-move flex justify-between items-center"
        onMouseDown={handleDragStart}
      >
        <h2 className="text-lg font-bold">
          📁 My Projects ({projects.length})
        </h2>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded p-1 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="search"
          placeholder="🔍 Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Sort Controls */}
      <div className="px-4 py-2 border-b border-gray-200 flex gap-2 items-center">
        <span className="text-sm text-gray-600">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="recent">Most Recent</option>
          <option value="name">A-Z</option>
          <option value="objects">Object Count</option>
        </select>
      </div>

      {/* Project Grid */}
      <div className="p-4 overflow-y-auto max-h-[400px]">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <p className="font-semibold">No projects found</p>
                <p className="text-sm">Try a different search term</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📁</div>
                <p className="font-semibold">No projects yet</p>
                <p className="text-sm">
                  Save your first design to get started!
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={currentProject?.metadata.id === project.id}
                onOpen={onOpenProject}
                onRename={handleRename}
                onDelete={handleDelete}
                onShare={handleShare}
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
    </div>,
    document.body
  );
}
