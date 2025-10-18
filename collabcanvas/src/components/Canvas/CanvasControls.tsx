"use client";

import { memo, useState, useCallback } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import SaveProjectDialog from "@/components/Projects/SaveProjectDialog";
import ProjectsPanel from "@/components/Projects/ProjectsPanel";
import UnsavedChangesDialog from "@/components/Projects/UnsavedChangesDialog";
import { useToast } from "@/contexts/ToastContext";
import { useProjectSwitcher } from "@/hooks/useProjectSwitcher";

export type ToolMode =
  | "rectangle"
  | "circle"
  | "line"
  | "text"
  | "pan"
  | "select"
  | "delete";

interface CanvasControlsProps {
  scale: number;
  tool: ToolMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSetTool: (tool: ToolMode) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

function CanvasControls({
  scale,
  tool,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSetTool,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: CanvasControlsProps) {
  const zoomPercentage = Math.round(scale * 100);
  const [isHovered, setIsHovered] = useState(false);

  // Project management state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const { addToast } = useToast();

  // Use proper Zustand selectors to avoid infinite loops
  const currentProject = useProjectStore((state) => state.currentProject);
  const projects = useProjectStore((state) => state.projects);
  const isSaving = useProjectStore((state) => state.isSaving);
  const createProject = useProjectStore((state) => state.createProject);
  const saveCurrentProject = useProjectStore(
    (state) => state.saveCurrentProject
  );
  const loadProject = useProjectStore((state) => state.loadProject);
  const canvasIsDirty = useCanvasStore((state) => state.isDirty);

  // Project switcher hook for handling unsaved changes
  const {
    switchToProject,
    showUnsavedDialog,
    handleSaveAndSwitch,
    handleDontSave,
    handleCancel,
  } = useProjectSwitcher();

  // Stable callback functions to prevent infinite loops
  const handleCloseSaveDialog = useCallback(() => {
    setShowSaveDialog(false);
  }, []);

  const handleSaveProject = useCallback(
    async (name: string) => {
      try {
        await createProject(name);
        setShowSaveDialog(false);
        addToast("Project saved successfully!", "success");
      } catch (error) {
        addToast("Failed to save project", "error");
        console.error("Save error:", error);
      }
    },
    [createProject, addToast]
  );

  const handleCloseProjectsPanel = useCallback(() => {
    setShowProjectsPanel(false);
  }, []);

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      await switchToProject(projectId);
      setShowProjectsPanel(false);
    },
    [switchToProject]
  );

  // Helper to get button styles based on active state
  const getToolButtonStyles = (toolMode: ToolMode) => {
    const isActive = tool === toolMode;
    return `flex items-center gap-0.5 sm:gap-1 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
      isActive
        ? "bg-emerald-100 text-emerald-700 shadow-sm"
        : "hover:bg-gray-100"
    }`;
  };

  return (
    <div
      className={`fixed bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center z-40 border border-gray-200 transition-all duration-[400ms] ease-in-out ${
        isHovered
          ? "px-2 py-2 sm:px-4 sm:py-2.5 gap-2 sm:gap-3 md:gap-4 max-w-[95vw] sm:max-w-[700px] md:max-w-[850px] lg:max-w-[1000px]"
          : "px-2 py-1.5 gap-1.5 sm:gap-2 max-w-[95vw] sm:max-w-[550px] md:max-w-[600px]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Zoom Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={onZoomOut}
          className={`rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-[400ms] flex items-center justify-center font-bold text-gray-700 ${
            isHovered
              ? "w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg"
              : "w-7 h-7 text-sm"
          }`}
          title="Zoom Out"
        >
          −
        </button>

        <button
          onClick={onResetZoom}
          className={`rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-[400ms] font-semibold text-gray-700 ${
            isHovered
              ? "px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm min-w-[60px] sm:min-w-[75px]"
              : "px-2 py-1 text-[10px] min-w-[45px]"
          }`}
          title="Reset Zoom (100%)"
        >
          {zoomPercentage}%
        </button>

        <button
          onClick={onZoomIn}
          className={`rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-[400ms] flex items-center justify-center font-bold text-gray-700 ${
            isHovered
              ? "w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg"
              : "w-7 h-7 text-sm"
          }`}
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Divider */}
      <div
        className={`w-px bg-gray-300 flex-shrink-0 transition-all duration-[400ms] ${
          isHovered ? "h-7 sm:h-8 md:h-9" : "h-6"
        }`}
      ></div>

      {/* Undo/Redo Controls */}
      {(onUndo || onRedo) && (
        <>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`rounded-lg transition-all duration-[400ms] flex items-center justify-center ${
                isHovered
                  ? "w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg"
                  : "w-7 h-7 text-sm"
              } ${
                canUndo
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                  : "bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
              title="Undo (Ctrl+Z / Cmd+Z)"
            >
              ↩️
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`rounded-lg transition-all duration-[400ms] flex items-center justify-center ${
                isHovered
                  ? "w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg"
                  : "w-7 h-7 text-sm"
              } ${
                canRedo
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                  : "bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
              title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
            >
              ↪️
            </button>
          </div>

          {/* Divider */}
          <div
            className={`w-px bg-gray-300 flex-shrink-0 transition-all duration-[400ms] ${
              isHovered ? "h-7 sm:h-8 md:h-9" : "h-6"
            }`}
          ></div>
        </>
      )}

      {/* Project Management Controls */}
      <>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Save Button */}
          <button
            onClick={() => {
              if (currentProject) {
                saveCurrentProject();
                addToast("Project saved!", "success");
              } else {
                setShowSaveDialog(true);
              }
            }}
            disabled={!canvasIsDirty && !!currentProject}
            className={`rounded-lg transition-all duration-[400ms] flex items-center gap-1 ${
              isHovered
                ? "px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
                : "px-2 py-1 text-[10px]"
            } ${
              !canvasIsDirty && currentProject
                ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
            }`}
            title={
              currentProject
                ? "Save project (Ctrl+S)"
                : "Save as new project (Ctrl+S)"
            }
          >
            <span className={isHovered ? "text-sm sm:text-base" : "text-base"}>
              💾
            </span>
            {isHovered && (
              <span className="whitespace-nowrap">
                {isSaving
                  ? "Saving..."
                  : currentProject
                  ? "Save"
                  : "Save As..."}
              </span>
            )}
          </button>

          {/* Projects Button */}
          <button
            onClick={() => setShowProjectsPanel(!showProjectsPanel)}
            className={`rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-all duration-[400ms] flex items-center gap-1 relative ${
              isHovered
                ? "px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
                : "px-2 py-1 text-[10px]"
            }`}
            title="View all projects (Ctrl+P)"
          >
            <span className={isHovered ? "text-sm sm:text-base" : "text-base"}>
              📁
            </span>
            {isHovered && <span className="whitespace-nowrap">Projects</span>}
            {projects.length > 0 && (
              <span
                className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-bold ${
                  isHovered ? "w-5 h-5 text-[10px]" : "w-4 h-4 text-[8px]"
                }`}
              >
                {projects.length}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div
          className={`w-px bg-gray-300 flex-shrink-0 transition-all duration-[400ms] ${
            isHovered ? "h-7 sm:h-8 md:h-9" : "h-6"
          }`}
        ></div>
      </>

      {/* Tool Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 flex-shrink-0">
        {/* Select */}
        <button
          onClick={() => onSetTool("select")}
          className={getToolButtonStyles("select")}
          title="Select Tool (V) - Click to select objects"
        >
          <span
            className={`transition-all duration-[400ms] ${
              isHovered ? "text-sm sm:text-base md:text-lg" : "text-base"
            }`}
          >
            ↖️
          </span>
          {isHovered && (
            <span className="whitespace-nowrap text-xs md:text-sm">Select</span>
          )}
        </button>
        {/* Pan */}
        <button
          onClick={() => onSetTool("pan")}
          className={getToolButtonStyles("pan")}
          title="Pan Tool (H) - Drag to pan the canvas"
        >
          <span
            className={`transition-all duration-[400ms] ${
              isHovered ? "text-sm sm:text-base md:text-lg" : "text-base"
            }`}
          >
            🤚
          </span>
          {isHovered && (
            <span className="whitespace-nowrap text-xs md:text-sm">Pan</span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div
        className={`w-px bg-gray-300 flex-shrink-0 transition-all duration-[400ms] ${
          isHovered ? "h-7 sm:h-8 md:h-9" : "h-6"
        }`}
      ></div>

      {/* Shape Tools */}
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 flex-shrink-0">
        {/* Rectangle */}
        <button
          onClick={() => onSetTool("rectangle")}
          className={getToolButtonStyles("rectangle")}
          title="Rectangle Tool (R) - Click & drag to draw rectangles"
        >
          <span
            className={`transition-all duration-[400ms] ${
              isHovered ? "text-sm sm:text-base md:text-lg" : "text-base"
            }`}
          >
            ▭
          </span>
          {isHovered && (
            <span className="whitespace-nowrap text-xs md:text-sm">
              Rectangle
            </span>
          )}
        </button>
        {/* Circle */}
        <button
          onClick={() => onSetTool("circle")}
          className={getToolButtonStyles("circle")}
          title="Circle Tool (C) - Click & drag to draw circles"
        >
          <span
            className={`transition-all duration-[400ms] ${
              isHovered ? "text-sm sm:text-base md:text-lg" : "text-base"
            }`}
          >
            ⭕
          </span>
          {isHovered && (
            <span className="whitespace-nowrap text-xs md:text-sm">Circle</span>
          )}
        </button>
        {/* Line */}
        <button
          onClick={() => onSetTool("line")}
          className={getToolButtonStyles("line")}
          title="Line Tool (L) - Click & drag to draw lines"
        >
          <span
            className={`transition-all duration-[400ms] ${
              isHovered ? "text-sm sm:text-base md:text-lg" : "text-base"
            }`}
          >
            📏
          </span>
          {isHovered && (
            <span className="whitespace-nowrap text-xs md:text-sm">Line</span>
          )}
        </button>
        {/* Text */}
        <button
          onClick={() => onSetTool("text")}
          className={getToolButtonStyles("text")}
          title="Text Tool (T) - Click to place text"
        >
          <span
            className={`transition-all duration-[400ms] ${
              isHovered ? "text-sm sm:text-base md:text-lg" : "text-base"
            }`}
          >
            T
          </span>
          {isHovered && (
            <span className="whitespace-nowrap text-xs md:text-sm">Text</span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div
        className={`w-px bg-gray-300 flex-shrink-0 transition-all duration-[400ms] ${
          isHovered ? "h-7 sm:h-8 md:h-9" : "h-6"
        }`}
      ></div>

      {/* Delete Tool */}
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 flex-shrink-0">
        <button
          onClick={() => onSetTool("delete")}
          className={getToolButtonStyles("delete")}
          title="Delete Tool - Click objects to delete them"
        >
          <span
            className={`transition-all duration-[400ms] ${
              isHovered ? "text-sm sm:text-base md:text-lg" : "text-base"
            }`}
          >
            🗑️
          </span>
          {isHovered && (
            <span className="whitespace-nowrap text-xs md:text-sm">Delete</span>
          )}
        </button>
      </div>

      {/* Project Management Dialogs */}
      <SaveProjectDialog
        isOpen={showSaveDialog}
        onClose={handleCloseSaveDialog}
        onSave={handleSaveProject}
      />

      <ProjectsPanel
        isOpen={showProjectsPanel}
        onClose={handleCloseProjectsPanel}
        onOpenProject={handleOpenProject}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onSave={handleSaveAndSwitch}
        onDontSave={handleDontSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default memo(CanvasControls);
