"use client";

import AuthGuard from "@/components/Auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { CursorPresence, OnlineUsers } from "@/components/Multiplayer";

export default function Home() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}

function HomePage() {
  const { user, logout } = useAuth();
  const { onlineUsers, updateCursorPosition } = useMultiplayer(
    "default-canvas",
    user?.id || null
  );

  // Track mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    updateCursorPosition(e.clientX, e.clientY);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"
      onMouseMove={handleMouseMove}
    >
      {/* Show other users' cursors */}
      <CursorPresence onlineUsers={onlineUsers} />

      {/* Show online users list */}
      <OnlineUsers onlineUsers={onlineUsers} currentUserName={user?.name} />

      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          🍵 Mockup Matcha Hub
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Real-time collaborative canvas - MVP in progress
        </p>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Signed in as:</p>
              <button
                onClick={logout}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Sign Out
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: user?.color }}
              >
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.isAnonymous ? "Guest User" : "Registered User"}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            PR #3: Real-time Cursor Presence ✅
          </h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>✅ Real-time cursor tracking</li>
            <li>✅ See other users' cursors</li>
            <li>✅ Online users list</li>
            <li>✅ Presence system</li>
            <li>✅ User name labels</li>
          </ul>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              💡 Move your mouse around! Open this page in another browser to
              see multiplayer in action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
