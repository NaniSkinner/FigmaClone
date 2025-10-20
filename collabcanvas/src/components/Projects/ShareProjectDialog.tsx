"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useProjectStore } from "@/store/projectStore";
import { ProjectMetadata } from "@/types/project";
import { getUserByEmail } from "@/lib/firebase/projects";
import { User } from "@/types/user";

interface ShareProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectMetadata | null;
}

interface SharedUserDisplay {
  userId: string;
  email?: string;
  name?: string;
}

export default function ShareProjectDialog({
  isOpen,
  onClose,
  project,
}: ShareProjectDialogProps) {
  const [emailInput, setEmailInput] = useState("");
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [sharedUserDetails, setSharedUserDetails] = useState<
    Map<string, SharedUserDisplay>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Use proper Zustand selector to avoid infinite loops
  const shareProject = useProjectStore((state) => state.shareProject);

  // Initialize with existing shared users
  useEffect(() => {
    if (isOpen && project) {
      setSharedUsers(project.sharedWith || []);
      setError("");
      setSuccess("");
      setEmailInput("");
    }
  }, [isOpen, project]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddUser = async () => {
    const email = emailInput.trim().toLowerCase();

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLookingUp(true);
    setError("");
    setSuccess("");

    try {
      // Look up user by email
      const user = await getUserByEmail(email);

      if (!user) {
        setError(
          `No user found with email "${email}". They need to create an account first.`
        );
        return;
      }

      // Check if trying to share with self
      if (project && user.id === project.ownerId) {
        setError("Cannot share with yourself (you're the owner)");
        return;
      }

      // Check if already shared
      if (sharedUsers.includes(user.id)) {
        setError(`Project already shared with ${user.name || email}`);
        return;
      }

      // Check if anonymous user
      if (user.isAnonymous) {
        setError(
          "Cannot share with anonymous users. They need to create an account."
        );
        return;
      }

      // Add to list
      setSharedUsers([...sharedUsers, user.id]);
      setSharedUserDetails(
        new Map(sharedUserDetails).set(user.id, {
          userId: user.id,
          email: user.email,
          name: user.name,
        })
      );
      setEmailInput("");
      setSuccess(`Added ${user.name || email} as collaborator`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error looking up user:", err);
      setError("Failed to look up user. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSharedUsers(sharedUsers.filter((id) => id !== userId));
    const newDetails = new Map(sharedUserDetails);
    newDetails.delete(userId);
    setSharedUserDetails(newDetails);
    setSuccess("");
  };

  const handleSave = async () => {
    if (!project) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await shareProject(project.id, sharedUsers);
      setSuccess("Sharing settings saved successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
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
      <div className="bg-white rounded-lg p-6 w-[550px] shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔗</span>
          Share Project
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Project: <span className="font-semibold">{project.name}</span>
          </p>
          <p className="text-xs text-gray-500">
            Share this project with other users by entering their email address.
            They&apos;ll be able to view and edit this project.
          </p>
        </div>

        {/* Add User Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            📧 Add Collaborator by Email
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setError("");
                setSuccess("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="collaborator@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading || isLookingUp}
            />
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
              disabled={isLoading || isLookingUp}
            >
              {isLookingUp ? "Looking up..." : "Add"}
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700 text-sm flex items-center gap-2">
                <span>✓</span>
                {success}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Only registered users can be added as collaborators
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
              <p className="text-xs">
                Add users by email to share this project
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sharedUsers.map((userId) => {
                const userDetails = sharedUserDetails.get(userId);
                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">👤</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {userDetails?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {userDetails?.email || userId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(userId)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors ml-2"
                      title="Remove access"
                      disabled={isLoading}
                    >
                      <span className="text-lg">🗑️</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Owner Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800 flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              <strong>Owner:</strong> You (project owner)
              <br />
              Only you can delete this project. Collaborators can view and edit.
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
