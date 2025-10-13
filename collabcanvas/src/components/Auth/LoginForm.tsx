"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { signUp, login, loginAnonymously, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
      router.push("/");
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  const handleAnonymousLogin = async () => {
    setLocalError(null);
    try {
      await loginAnonymously();
      router.push("/");
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md border border-gray-100">
        <div className="text-center mb-10">
          <div className="mb-4">
            <span className="text-6xl">🍵</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mockup Matcha Hub
          </h1>
          <p className="text-gray-600 text-sm">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        {(error || localError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center">
              {error || localError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-5">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-semibold py-2"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="my-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">Or</span>
          </div>
        </div>

        <button
          onClick={handleAnonymousLogin}
          disabled={loading}
          className="w-full bg-white text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all font-semibold border-2 border-gray-300 hover:border-gray-400 shadow-sm"
        >
          Continue as Guest
        </button>

        <p className="mt-8 text-xs text-gray-500 text-center">
          By continuing, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}
