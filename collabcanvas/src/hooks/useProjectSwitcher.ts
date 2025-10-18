import { useCallback, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useToast } from "@/contexts/ToastContext";

/**
 * Hook for managing project switching with unsaved changes handling
 *
 * Provides:
 * - Safe project switching with unsaved changes prompt
 * - Canvas clearing and undo stack reset
 * - Loading and error handling
 */
export function useProjectSwitcher() {
  // Use individual selectors to avoid infinite loops
  const currentProject = useProjectStore((state) => state.currentProject);
  const isDirty = useProjectStore((state) => state.isDirty);
  const loadProject = useProjectStore((state) => state.loadProject);
  const saveCurrentProject = useProjectStore(
    (state) => state.saveCurrentProject
  );

  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const clearUndoHistory = useCanvasStore((state) => state.clearUndoHistory);
  const { addToast } = useToast();

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

  /**
   * Attempt to switch to a project
   * Will show unsaved changes dialog if current project has unsaved changes
   */
  const switchToProject = useCallback(
    async (projectId: string) => {
      // Don't switch if already on this project
      if (currentProject?.metadata.id === projectId) {
        addToast("Project already loaded", "info");
        return;
      }

      // If current project has unsaved changes, show dialog
      if (currentProject && isDirty) {
        setPendingProjectId(projectId);
        setShowUnsavedDialog(true);
        return;
      }

      // No unsaved changes, proceed with switch
      await performSwitch(projectId);
    },
    [currentProject, isDirty, addToast]
  );

  /**
   * Perform the actual project switch
   */
  const performSwitch = async (projectId: string) => {
    try {
      // Clear canvas and undo history
      clearCanvas();
      clearUndoHistory();

      // Load new project
      await loadProject(projectId);

      // Success
      addToast("Project loaded successfully", "success");
    } catch (error) {
      console.error("Failed to switch project:", error);
      addToast("Failed to load project", "error");
    }
  };

  /**
   * Save current project and then switch
   */
  const handleSaveAndSwitch = async () => {
    if (pendingProjectId) {
      try {
        await saveCurrentProject();
        await performSwitch(pendingProjectId);
        setShowUnsavedDialog(false);
        setPendingProjectId(null);
      } catch (error) {
        console.error("Failed to save and switch:", error);
        addToast("Failed to save project", "error");
      }
    }
  };

  /**
   * Don't save and switch anyway
   */
  const handleDontSave = async () => {
    if (pendingProjectId) {
      await performSwitch(pendingProjectId);
      setShowUnsavedDialog(false);
      setPendingProjectId(null);
    }
  };

  /**
   * Cancel the switch
   */
  const handleCancel = () => {
    setShowUnsavedDialog(false);
    setPendingProjectId(null);
  };

  return {
    switchToProject,
    showUnsavedDialog,
    handleSaveAndSwitch,
    handleDontSave,
    handleCancel,
  };
}
