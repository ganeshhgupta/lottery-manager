"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎟️</div>
          <h1 className="text-3xl font-bold text-white">LotteryAudit</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700"
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              autoFocus
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your ID"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              maxLength={4}
              inputMode="numeric"
              pattern="\d{4}"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent tracking-widest text-center text-xl"
              placeholder="••••"
            />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
