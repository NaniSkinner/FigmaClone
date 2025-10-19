"use client";

import { useState, useEffect, useRef } from "react";

interface DecorativeItemsButtonProps {
  onClick: () => void;
}

export function DecorativeItemsButton({ onClick }: DecorativeItemsButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: 180,
    y: window.innerHeight - 150,
  });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const buttonSize = 80; // 20 * 4 (w-20 h-20)

  // Set initial position on client side only
  useEffect(() => {
    setPosition({ x: 180, y: window.innerHeight - 150 });
  }, []);

  // Global mouse event handlers for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      hasMoved.current = true;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      // Constrain to window boundaries
      const maxX = window.innerWidth - buttonSize;
      const maxY = window.innerHeight - buttonSize;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        // Only trigger onClick if we didn't actually drag
        if (!hasMoved.current) {
          onClick();
        }
        setIsDragging(false);
        hasMoved.current = false;
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, buttonSize, onClick]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    hasMoved.current = false;
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  return (
    <div
      className={`fixed z-40 select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="w-20 h-20 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 border-4 border-white"
        title="Open Decorative Items (Ctrl+K) - Drag to move"
      >
        <span className="text-4xl pointer-events-none">🎨</span>
      </div>
    </div>
  );
}
