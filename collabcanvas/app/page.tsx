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

  const { onlineUsers, updateCursorPosition } = useMultiplayer(
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

  // Track mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    console.log(
      `[MouseMove] Calling updateCursorPosition with (${e.clientX}, ${e.clientY})`
    );
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

        {/* Canvas Controls */}
        <CanvasControls
          scale={scale}
          tool={tool}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={() => resetZoom(dimensions.width, dimensions.height)}
          onSetTool={setTool}
        />

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
          />
        )}
      </div>
    </>
  );
}
