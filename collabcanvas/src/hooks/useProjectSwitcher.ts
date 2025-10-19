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
 * - New blank canvas creation
 */
export function useProjectSwitcher() {
  // Use individual selectors to avoid infinite loops
  const currentProject = useProjectStore((state) => state.currentProject);
  const isDirty = useProjectStore((state) => state.isDirty);
  const loadProject = useProjectStore((state) => state.loadProject);
  const saveCurrentProject = useProjectStore(
    (state) => state.saveCurrentProject
  );
  const startNewCanvas = useProjectStore((state) => state.startNewCanvas);

  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const clearUndoHistory = useCanvasStore((state) => state.clearUndoHistory);
  const { addToast } = useToast();

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "switch" | "newCanvas" | null
  >(null);

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
        setPendingAction("switch");
        setShowUnsavedDialog(true);
        return;
      }

      // No unsaved changes, proceed with switch
      await performSwitch(projectId);
    },
    [currentProject, isDirty, addToast]
  );

  /**
   * Attempt to create a new blank canvas
   * Will show unsaved changes dialog if current project has unsaved changes
   */
  const createNewCanvas = useCallback(async () => {
    // If no current project, just clear and start fresh
    if (!currentProject) {
      performNewCanvas();
      return;
    }

    // If current project has unsaved changes, show dialog
    if (isDirty) {
      setPendingAction("newCanvas");
      setShowUnsavedDialog(true);
      return;
    }

    // No unsaved changes, proceed with new canvas
    performNewCanvas();
  }, [currentProject, isDirty]);

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
   * Perform the actual new canvas creation
   */
  const performNewCanvas = () => {
    try {
      // Clear canvas and undo history
      clearCanvas();
      clearUndoHistory();

      // Reset project state
      startNewCanvas();

      // Success
      addToast("New canvas ready ✨", "success");
    } catch (error) {
      console.error("Failed to create new canvas:", error);
      addToast("Failed to create new canvas", "error");
    }
  };

  /**
   * Save current project and then perform pending action
   */
  const handleSaveAndSwitch = async () => {
    try {
      await saveCurrentProject();

      if (pendingAction === "switch" && pendingProjectId) {
        await performSwitch(pendingProjectId);
      } else if (pendingAction === "newCanvas") {
        performNewCanvas();
      }

      setShowUnsavedDialog(false);
      setPendingProjectId(null);
      setPendingAction(null);
    } catch (error) {
      console.error("Failed to save and perform action:", error);
      addToast("Failed to save project", "error");
    }
  };

  /**
   * Don't save and perform pending action anyway
   */
  const handleDontSave = async () => {
    if (pendingAction === "switch" && pendingProjectId) {
      await performSwitch(pendingProjectId);
    } else if (pendingAction === "newCanvas") {
      performNewCanvas();
    }

    setShowUnsavedDialog(false);
    setPendingProjectId(null);
    setPendingAction(null);
  };

  /**
   * Cancel the pending action
   */
  const handleCancel = () => {
    setShowUnsavedDialog(false);
    setPendingProjectId(null);
    setPendingAction(null);
  };

  return {
    switchToProject,
    createNewCanvas,
    showUnsavedDialog,
    handleSaveAndSwitch,
    handleDontSave,
    handleCancel,
  };
}
