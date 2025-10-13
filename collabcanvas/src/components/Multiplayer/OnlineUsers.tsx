"use client";

import { UserPresence } from "@/types";

interface OnlineUsersProps {
  onlineUsers: Map<string, UserPresence>;
  currentUserName?: string;
}

export default function OnlineUsers({
  onlineUsers,
  currentUserName,
}: OnlineUsersProps) {
  const userCount = onlineUsers.size + 1; // +1 for current user

  return (
    <div className="fixed top-4 right-4 bg-white rounded-xl shadow-lg p-4 min-w-[200px] z-40 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Online</h3>
        <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
          {userCount} {userCount === 1 ? "user" : "users"}
        </span>
      </div>

      <div className="space-y-2">
        {/* Current user */}
        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
            {currentUserName?.charAt(0).toUpperCase() || "Y"}
          </div>
          <span className="text-sm text-gray-700 font-medium">
            You {currentUserName && `(${currentUserName})`}
          </span>
        </div>

        {/* Other users */}
        {Array.from(onlineUsers.values()).map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: user.user.color }}
            >
              {user.user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-700">{user.user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
