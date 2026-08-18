"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

type Mode = "admin" | "staff";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, loginAdmin, loginStaff } = useAuth();
  const [mode, setMode] = useState<Mode>("staff");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, loading, router]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result =
        mode === "admin"
          ? await loginAdmin(identifier.trim(), password)
          : await loginStaff(identifier.trim(), password);
      router.replace(`/dashboard/${result.role.toLowerCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-sm font-bold text-white shadow-sm">
            TD
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Token Dine</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Sign in</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Access the dashboard for your role.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
              {(["staff", "admin"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setIdentifier("");
                    setError(null);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    mode === m
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {m === "admin" ? "Admin" : "Manager / Worker"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {mode === "admin" ? "Email" : "Mobile number"}
                </label>
                <input
                  type={mode === "admin" ? "email" : "tel"}
                  className="input mt-1"
                  placeholder={mode === "admin" ? "admin@restaurant.com" : "01XXXXXXXXX"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {mode === "admin" ? "Password" : "Password / PIN"}
                </label>
                <input
                  type="password"
                  className="input mt-1"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>


          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Demo credentials</p>
            <ul className="mt-2 space-y-1">
              <li>Admin — admin@restaurant.com / 12345</li>
              <li>Manager — 01710000001 / 12345</li>
              <li>Worker — 01810000001 / 12345</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
