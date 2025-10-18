"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useProjectStore } from "@/store/projectStore";
import { ProjectMetadata } from "@/types/project";

interface ShareProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectMetadata | null;
}

export default function ShareProjectDialog({
  isOpen,
  onClose,
  project,
}: ShareProjectDialogProps) {
  const [userIdInput, setUserIdInput] = useState("");
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Use proper Zustand selector to avoid infinite loops
  const shareProject = useProjectStore((state) => state.shareProject);

  // Initialize with existing shared users
  useEffect(() => {
    if (isOpen && project) {
      setSharedUsers(project.sharedWith || []);
      setError("");
      setUserIdInput("");
    }
  }, [isOpen, project]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleAddUser = () => {
    const userId = userIdInput.trim();

    if (!userId) {
      setError("Please enter a user ID");
      return;
    }

    // Check if already shared
    if (sharedUsers.includes(userId)) {
      setError("Project already shared with this user");
      return;
    }

    // Check if trying to share with self
    if (project && userId === project.ownerId) {
      setError("Cannot share with yourself (you're the owner)");
      return;
    }

    // Add to list
    setSharedUsers([...sharedUsers, userId]);
    setUserIdInput("");
    setError("");
  };

  const handleRemoveUser = (userId: string) => {
    setSharedUsers(sharedUsers.filter((id) => id !== userId));
  };

  const handleSave = async () => {
    if (!project) return;

    setIsLoading(true);
    setError("");

    try {
      await shareProject(project.id, sharedUsers);
      onClose();
    } catch (err) {
      setError("Failed to update sharing. Please try again.");
      console.error("Share error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUser();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen || !project) return null;

  const hasChanges =
    JSON.stringify(sharedUsers.sort()) !==
    JSON.stringify((project.sharedWith || []).sort());

  return createPortal(
    <div
      className="fixed bg-black/50"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔗</span>
          Share Project
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Project: <span className="font-semibold">{project.name}</span>
          </p>
          <p className="text-xs text-gray-500">
            Share this project with other users to collaborate together.
          </p>
        </div>

        {/* Add User Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Add Collaborator (User ID)
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userIdInput}
              onChange={(e) => {
                setUserIdInput(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter user ID..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              disabled={isLoading}
            >
              Add
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: You can find user IDs in the online users list
          </p>
        </div>

        {/* Shared Users List */}
        <div className="flex-1 overflow-y-auto mb-4 border rounded p-3 bg-gray-50 min-h-[150px] max-h-[250px]">
          <p className="text-sm font-medium mb-2">
            Collaborators ({sharedUsers.length})
          </p>

          {sharedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No collaborators yet</p>
              <p className="text-xs">Add users above to share this project</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sharedUsers.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <span className="text-sm font-mono text-gray-700">
                      {userId.length > 20
                        ? `${userId.substring(0, 20)}...`
                        : userId}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(userId)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                    title="Remove access"
                    disabled={isLoading}
                  >
                    <span className="text-lg">🗑️</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Owner Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800 flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              <strong>Owner:</strong>{" "}
              {project.ownerId === "you" ? "You" : project.ownerId}
              <br />
              Only the owner can delete this project. Collaborators can view and
              edit.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
