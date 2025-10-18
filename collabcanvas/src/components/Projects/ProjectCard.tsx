"use client";

import { useState } from "react";
import { ProjectListItem } from "@/types/project";

interface ProjectCardProps {
  project: ProjectListItem;
  isActive: boolean;
  onOpen: (projectId: string) => void;
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onShare: (projectId: string) => void;
}

/**
 * Format relative time for display
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ProjectCard({
  project,
  isActive,
  onOpen,
  onRename,
  onDelete,
  onShare,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        relative w-full h-[240px] bg-white rounded-lg border-2 
        transition-all cursor-pointer
        ${isActive ? "border-green-400 shadow-lg" : "border-gray-200"}
        ${isHovered ? "shadow-lg scale-[1.02]" : "shadow"}
      `}
      onClick={() => onOpen(project.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative h-[140px] overflow-hidden rounded-t-lg bg-gray-100">
        <img
          src={project.thumbnail}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        {/* Object count badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <span className="text-yellow-400">●</span>
          {project.objectCount}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
            Active
          </div>
        )}

        {/* Shared indicator */}
        {project.isSharedWithMe && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
            <span>🤝</span>
            <span>Shared</span>
          </div>
        )}
      </div>

      {/* Project info */}
      <div className="p-3">
        <h3
          className="font-semibold truncate text-gray-900"
          title={project.name}
        >
          {project.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {formatRelativeTime(project.updatedAt)}
          {project.isSharedWithMe && project.ownerName && (
            <span className="text-blue-600 ml-1">• by {project.ownerName}</span>
          )}
        </p>
      </div>

      {/* Action buttons (show on hover) */}
      {isHovered && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          {/* Only show share button for owned projects */}
          {!project.isSharedWithMe && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(project.id);
              }}
              className="p-2 hover:bg-purple-100 rounded transition-colors"
              title="Share project"
            >
              <span className="text-lg">🔗</span>
            </button>
          )}
          {/* Only show rename button for owned projects */}
          {!project.isSharedWithMe && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(project.id);
              }}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Rename project"
            >
              <span className="text-lg">📝</span>
            </button>
          )}
          {/* Only show delete button for owned projects (not shared) */}
          {!project.isSharedWithMe && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="p-2 hover:bg-red-100 rounded transition-colors"
              title="Delete project"
            >
              <span className="text-lg">🗑️</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
