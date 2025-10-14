"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/Auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useCanvas } from "@/hooks/useCanvas";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import CursorPresence from "@/components/Multiplayer/CursorPresence";
import OnlineUsers from "@/components/Multiplayer/OnlineUsers";
import Canvas from "@/components/Canvas/Canvas";
import CanvasControls from "@/components/Canvas/CanvasControls";
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
  const { user } = useAuth();
  const canvasId = "default-canvas";
  const { onlineUsers, updateCursorPosition } = useMultiplayer(
    canvasId,
    user?.id || null
  );
  const {
    scale,
    position,
    setPosition,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    centerCanvas,
    fitToScreen,
  } = useCanvas();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);

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

        {/* Show other users' cursors */}
        <CursorPresence onlineUsers={onlineUsers} />

        {/* Show online users list */}
        <OnlineUsers onlineUsers={onlineUsers} currentUserName={user?.name} />

        {/* Canvas Controls */}
        <CanvasControls
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={() => resetZoom(dimensions.width, dimensions.height)}
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
          />
        )}
      </div>
    </>
  );
}
