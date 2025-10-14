"use client";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 z-50">
      <div className="text-6xl mb-6 animate-bounce">🍵</div>
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-3 h-3 bg-emerald-700 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
      <p className="mt-6 text-gray-600 font-medium">
        Loading Mockup Matcha Hub...
      </p>
    </div>
  );
}
