"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/Auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useCanvas } from "@/hooks/useCanvas";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { CursorPresence, OnlineUsers } from "@/components/Multiplayer";
import { Canvas, CanvasControls } from "@/components/Canvas";

export default function Home() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}

function HomePage() {
  const { user } = useAuth();
  const { onlineUsers, updateCursorPosition } = useMultiplayer(
    "default-canvas",
    user?.id || null
  );
  const { scale, zoomIn, zoomOut, resetZoom } = useCanvas();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  // Track mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    updateCursorPosition(e.clientX, e.clientY);
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Show other users' cursors */}
      <CursorPresence onlineUsers={onlineUsers} />

      {/* Show online users list */}
      <OnlineUsers onlineUsers={onlineUsers} currentUserName={user?.name} />

      {/* Canvas Controls */}
      <CanvasControls
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
      />

      {/* Main Canvas */}
      {dimensions.width > 0 && (
        <Canvas width={dimensions.width} height={dimensions.height} />
      )}
    </div>
  );
}
