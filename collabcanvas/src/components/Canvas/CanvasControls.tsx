"use client";

import { memo, useState, useCallback, useMemo, useRef } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import SaveProjectDialog from "@/components/Projects/SaveProjectDialog";
import ProjectsPanel from "@/components/Projects/ProjectsPanel";
import UnsavedChangesDialog from "@/components/Projects/UnsavedChangesDialog";
import ExportProgressModal from "@/components/Export/ExportProgressModal";
import { useToast } from "@/contexts/ToastContext";
import { useProjectSwitcher } from "@/hooks/useProjectSwitcher";
import { useUserStore } from "@/store/userStore";
import {
  exportToPNG,
  generateExportFilename,
  downloadPNG,
} from "@/lib/export/pngExport";
import { ExportProgress } from "@/types/export";
import { uploadImage } from "@/lib/firebase/storage";
import { ImageObject, CanvasObject } from "@/types";

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
  createObject: (object: CanvasObject) => Promise<void>;
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
  createObject,
}: CanvasControlsProps) {
  const zoomPercentage = Math.round(scale * 100);
  const [isHovered, setIsHovered] = useState(false);

  // Project management state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const { addToast } = useToast();

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null
  );

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const currentUser = useUserStore((state) => state.currentUser);
  const addObject = useCanvasStore((state) => state.addObject);
  const getNextZIndex = useCanvasStore((state) => state.getNextZIndex);

  // Get canvas objects for export
  const objectsMap = useCanvasStore((state) => state.objects);
  const objects = useMemo(() => Array.from(objectsMap.values()), [objectsMap]);

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

  // Export handler
  const handleExportPNG = useCallback(async () => {
    if (objects.length === 0) {
      addToast("Canvas is empty. Add objects before exporting.", "error");
      return;
    }

    try {
      setIsExporting(true);

      // Show progress modal for 50+ objects
      const showProgress = objects.length >= 50;

      const dataURL = await exportToPNG(
        objects,
        {
          resolution: 2,
          backgroundColor: "white",
          autoCrop: true,
        },
        showProgress ? setExportProgress : undefined
      );

      const filename = generateExportFilename(
        currentProject?.metadata.name || "canvas"
      );

      downloadPNG(dataURL, filename);
      addToast(`Exported ${filename}`, "success");
    } catch (error) {
      console.error("Export failed:", error);
      if (
        error instanceof Error &&
        !error.message.includes("cancelled by user")
      ) {
        addToast(error.message || "Export failed. Please try again.", "error");
      }
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [objects, currentProject, addToast]);

  // Image upload handler
  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!currentProject) {
        addToast("Please save your project before uploading images", "error");
        return;
      }
      if (!currentUser) {
        addToast("You must be logged in to upload images", "error");
        return;
      }

      setIsUploading(true);

      try {
        const filesArray = Array.from(files);
        let successCount = 0;

        for (const file of filesArray) {
          try {
            // Upload to Firebase Storage
            const result = await uploadImage({
              userId: currentUser.id,
              projectId: currentProject.metadata.id,
              file,
              onProgress: (progress) => {
                console.log(`Upload progress: ${progress}%`);
              },
            });

            // Calculate display dimensions (max 400px width/height, maintain aspect ratio)
            const maxDisplaySize = 400;
            const aspectRatio = result.naturalWidth / result.naturalHeight;
            let displayWidth = maxDisplaySize;
            let displayHeight = maxDisplaySize;

            if (aspectRatio > 1) {
              displayHeight = maxDisplaySize / aspectRatio;
            } else {
              displayWidth = maxDisplaySize * aspectRatio;
            }

            // Create image object centered on canvas
            const imageObject: ImageObject = {
              id: crypto.randomUUID(),
              type: "image",
              src: result.url,
              thumbnailSrc: result.thumbnailBase64,
              x: 4000 - displayWidth / 2, // Center on 8000x8000 canvas
              y: 4000 - displayHeight / 2,
              width: displayWidth,
              height: displayHeight,
              naturalWidth: result.naturalWidth,
              naturalHeight: result.naturalHeight,
              fileSize: result.fileSize,
              mimeType: result.mimeType,
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
              userId: currentUser.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              zIndex: getNextZIndex(),
            };

            // Add to canvas (local state)
            addObject(imageObject);

            // Sync to Firestore for multi-user collaboration
            await createObject(imageObject);

            successCount++;

            addToast(`Uploaded ${file.name}`, "success");
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            addToast(
              error instanceof Error
                ? error.message
                : `Failed to upload ${file.name}`,
              "error"
            );
          }
        }

        if (successCount > 1) {
          addToast(`Successfully uploaded ${successCount} images`, "success");
        }
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      currentProject,
      currentUser,
      addObject,
      getNextZIndex,
      addToast,
      createObject,
    ]
  );

  // Trigger file picker
  const handleUploadButtonClick = useCallback(async () => {
    // If no project exists, auto-create one
    if (!currentProject) {
      try {
        const projectName = `Untitled Project ${new Date().toLocaleDateString()}`;
        await createProject(projectName);
        addToast("Project created! Now you can upload images.", "success");
        // Small delay to ensure project is created
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 300);
      } catch (error) {
        addToast("Failed to create project. Please try again.", "error");
        console.error("Auto-create project error:", error);
      }
    } else {
      fileInputRef.current?.click();
    }
  }, [currentProject, createProject, addToast]);

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

          {/* Export PNG Button */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting || objects.length === 0}
            className={`rounded-lg transition-all duration-[400ms] flex items-center gap-1 ${
              isHovered
                ? "px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
                : "px-2 py-1 text-[10px]"
            } ${
              isExporting || objects.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
            }`}
            title={
              objects.length === 0
                ? "Canvas is empty"
                : "Export as PNG (Ctrl+E)"
            }
          >
            <span className={isHovered ? "text-sm sm:text-base" : "text-base"}>
              {isExporting ? "⏳" : "📥"}
            </span>
            {isHovered && (
              <span className="whitespace-nowrap">
                {isExporting ? "Exporting..." : "Export PNG"}
              </span>
            )}
          </button>

          {/* Upload Image Button */}
          <button
            onClick={handleUploadButtonClick}
            disabled={isUploading}
            className={`rounded-lg transition-all duration-[400ms] flex items-center gap-1 ${
              isHovered
                ? "px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
                : "px-2 py-1 text-[10px]"
            } ${
              isUploading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
            }`}
            title={
              !currentProject
                ? "Upload Image (will auto-save project)"
                : "Upload Image (JPEG, PNG, WebP, GIF - max 10MB)"
            }
          >
            <span className={isHovered ? "text-sm sm:text-base" : "text-base"}>
              {isUploading ? "⏳" : "🖼️"}
            </span>
            {isHovered && (
              <span className="whitespace-nowrap">
                {isUploading ? "Uploading..." : "Upload Image"}
              </span>
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            style={{ display: "none" }}
          />
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

      {/* Export Progress Modal */}
      {exportProgress && (
        <ExportProgressModal isOpen={isExporting} progress={exportProgress} />
      )}
    </div>
  );
}

export default memo(CanvasControls);
