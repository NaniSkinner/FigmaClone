"use client";

import AuthGuard from "@/components/Auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}

function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
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
            PR #2: Authentication Complete ✅
          </h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li>✅ User authentication</li>
            <li>✅ Email/password login</li>
            <li>✅ Anonymous auth</li>
            <li>✅ User profiles</li>
            <li>✅ Color assignment</li>
          </ul>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Next up: Real-time Cursor Presence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
