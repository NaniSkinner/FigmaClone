"use client";

import { useState, useEffect, useCallback } from "react";
import AuthGuard from "@/components/Auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useCanvas } from "@/hooks/useCanvas";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useToast } from "@/contexts/ToastContext";
import CursorPresence from "@/components/Multiplayer/CursorPresence";
import OnlineUsers from "@/components/Multiplayer/OnlineUsers";
import Canvas from "@/components/Canvas/Canvas";
import CanvasControls, { ToolMode } from "@/components/Canvas/CanvasControls";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import ConnectionStatus from "@/components/UI/ConnectionStatus";
import LayerPanel from "@/components/Layers/LayerPanel";
import { CanvasStatePanel } from "@/components/AI/CanvasStatePanel";
import { AIChatPanel } from "@/components/AI/AIChatPanel";
import SaveStatusIndicator from "@/components/Projects/SaveStatusIndicator";
import SaveProjectDialog from "@/components/Projects/SaveProjectDialog";
import { useProjectStore } from "@/store/projectStore";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useUndo } from "@/hooks/useUndo";
import { useUndoKeyboard } from "@/hooks/useUndoKeyboard";
import { cleanupStalePresence } from "@/lib/cleanupPresence";

export default function Home() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}

function HomePage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const canvasId = "default-canvas";

  // Single shared realtime sync instance (prevents duplicate listeners)
  const { createObject, updateObjectInFirestore, deleteObject } =
    useRealtimeSync(canvasId, user?.id || null);

  // Initialize undo/redo with Firestore sync
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    recordCreate,
    recordUpdate,
    recordDelete,
  } = useUndo({
    onCreateObject: createObject,
    onUpdateObject: updateObjectInFirestore,
    onDeleteObject: deleteObject,
  });

  // Keyboard shortcuts for undo/redo
  useUndoKeyboard({
    onUndo: () => {
      if (canUndo) {
        const success = undo();
        if (success) {
          addToast("Undo successful ↩️", "success", 2000);
        }
      }
    },
    onRedo: () => {
      if (canRedo) {
        const success = redo();
        if (success) {
          addToast("Redo successful ↪️", "success", 2000);
        }
      }
    },
    enabled: true,
  });

  // Toast callbacks for user join/leave events
  const handleUserJoined = useCallback(
    (userName: string) => {
      addToast(`${userName} joined the canvas 👋`, "info", 3000);
    },
    [addToast]
  );

  const handleUserLeft = useCallback(
    (userName: string) => {
      addToast(`${userName} left the canvas 👋`, "info", 3000);
    },
    [addToast]
  );

  const { onlineUsers, updateCursorPosition, updateSelectedObjects } =
    useMultiplayer(
      canvasId,
      user?.id || null,
      handleUserJoined,
      handleUserLeft
    );
  const {
    scale,
    position,
    setPosition,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
  } = useCanvas();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [tool, setTool] = useState<ToolMode>("select");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Project management
  const currentProject = useProjectStore((state) => state.currentProject);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const createProject = useProjectStore((state) => state.createProject);
  const saveCurrentProject = useProjectStore(
    (state) => state.saveCurrentProject
  );

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Firebase auth will redirect to login page via AuthGuard
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get window dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fit canvas to screen on initial load and hide loading spinner
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      fitToScreen(dimensions.width, dimensions.height);
      // Small delay to ensure canvas is ready
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.width, dimensions.height]); // Only run when dimensions change, not when scale changes

  // Load projects on app start
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Keyboard shortcuts for project management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+S / Cmd+S → Save project
      if (ctrlOrCmd && e.key === "s") {
        e.preventDefault();
        if (currentProject) {
          saveCurrentProject();
          addToast("Project saved!", "success");
        } else {
          setShowSaveDialog(true);
        }
      }

      // Ctrl+P / Cmd+P → Toggle Projects Panel (handled in CanvasControls)
      // Note: This is handled in CanvasControls component
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentProject, saveCurrentProject, addToast]);

  // Expose cleanup function to browser console for manual cleanup
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).cleanupStalePresence = cleanupStalePresence;
      console.log(
        "💡 Tip: Run cleanupStalePresence() in console to manually clean stale presence documents"
      );
    }
  }, []);

  // Keyboard shortcuts for tools and view controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Tool shortcuts (single keys)
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            e.preventDefault();
            setTool("select");
            return;
          case "h":
            e.preventDefault();
            setTool("pan");
            return;
          case "r":
            e.preventDefault();
            setTool("rectangle");
            return;
          case "c":
            e.preventDefault();
            setTool("circle");
            return;
          case "l":
            e.preventDefault();
            setTool("line");
            return;
          case "t":
            e.preventDefault();
            setTool("text");
            return;
        }
      }

      // View shortcuts (Ctrl/Cmd + key)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "0":
            e.preventDefault();
            resetZoom(dimensions.width, dimensions.height);
            return;
          case "=":
          case "+":
            e.preventDefault();
            zoomIn();
            return;
          case "-":
          case "_":
            e.preventDefault();
            zoomOut();
            return;
          case "1":
            e.preventDefault();
            fitToScreen(dimensions.width, dimensions.height);
            return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dimensions, resetZoom, zoomIn, zoomOut, fitToScreen]);

  // Track mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    updateCursorPosition(e.clientX, e.clientY);
  };

  return (
    <>
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner />}

      <div
        className="w-screen h-screen overflow-hidden bg-gray-50"
        onMouseMove={handleMouseMove}
      >
        {/* Connection Status */}
        <ConnectionStatus />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg shadow-lg border border-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
          title="Logout"
        >
          <span>⏻</span>
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* App Title */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg border border-gray-200">
          <h1
            className="text-base sm:text-xl md:text-2xl font-bold flex items-center gap-2"
            style={{ color: "#7BA05B" }}
          >
            <span className="text-xl sm:text-2xl md:text-3xl">🍵</span>
            <span>Mockup Matcha Hub</span>
          </h1>
        </div>

        {/* Show other users' cursors */}
        <CursorPresence onlineUsers={onlineUsers} />

        {/* Show online users list */}
        <OnlineUsers onlineUsers={onlineUsers} currentUserName={user?.name} />

        {/* Canvas State Panel (AI Feature) */}
        <CanvasStatePanel />

        {/* AI Chat Panel (AI Feature) */}
        {user?.id && (
          <AIChatPanel
            userId={user.id}
            canvasId={canvasId}
            onCreateObject={createObject}
            onUpdateObject={updateObjectInFirestore}
            onDeleteObject={deleteObject}
            onRecordCreate={recordCreate}
            onRecordUpdate={recordUpdate}
            onRecordDelete={recordDelete}
          />
        )}

        {/* Canvas Controls */}
        <CanvasControls
          scale={scale}
          tool={tool}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={() => resetZoom(dimensions.width, dimensions.height)}
          onSetTool={setTool}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {/* Layer Panel */}
        <LayerPanel
          canvasId={canvasId}
          userId={user?.id || null}
          updateObjectInFirestore={updateObjectInFirestore}
        />

        {/* Save Status Indicator */}
        <SaveStatusIndicator />

        {/* Main Canvas */}
        {dimensions.width > 0 && (
          <Canvas
            width={dimensions.width}
            height={dimensions.height}
            userId={user?.id || null}
            canvasId={canvasId}
            scale={scale}
            position={position}
            setPosition={setPosition}
            handleWheel={handleWheel}
            tool={tool}
            setTool={setTool}
            onlineUsers={onlineUsers}
            updateSelectedObjects={updateSelectedObjects}
            createObject={createObject}
            updateObjectInFirestore={updateObjectInFirestore}
            deleteObject={deleteObject}
          />
        )}

        {/* Save Project Dialog */}
        <SaveProjectDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={async (name) => {
            try {
              await createProject(name);
              setShowSaveDialog(false);
              addToast("Project saved successfully!", "success");
            } catch (error) {
              addToast("Failed to save project", "error");
              console.error("Save error:", error);
            }
          }}
        />
      </div>
    </>
  );
}
