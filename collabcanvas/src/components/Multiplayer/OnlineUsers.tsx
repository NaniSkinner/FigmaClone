"use client";

import { useState, useEffect, memo } from "react";
import { UserPresence } from "@/types";

interface OnlineUsersProps {
  onlineUsers: Map<string, UserPresence>;
  currentUserName?: string;
}

function OnlineUsers({ onlineUsers, currentUserName }: OnlineUsersProps) {
  const userCount = onlineUsers.size + 1; // +1 for current user
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 16 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Set initial position on client side only
  useEffect(() => {
    setPosition({ x: window.innerWidth - 220, y: 16 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return; // Don't drag when clicking buttons
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`fixed bg-white rounded-xl shadow-lg p-3 min-w-[200px] z-50 border border-gray-200 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } select-none`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700">Online</h3>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {userCount}
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            {isCollapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-1.5">
          {/* Current user */}
          <div className="flex items-center gap-2 p-1.5 bg-emerald-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              {currentUserName?.charAt(0).toUpperCase() || "Y"}
            </div>
            <span className="text-xs text-gray-700 font-medium">You</span>
          </div>

          {/* Other users */}
          {Array.from(onlineUsers.values()).map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.user.color }}
              >
                {user.user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-700">{user.user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(OnlineUsers);
