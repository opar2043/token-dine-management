"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("worker");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, loading, router]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^01\d{9}$/.test(mobile.trim())) {
      setError("Please enter a valid 11-digit mobile number starting with 01.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await register({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        password,
        role,
      });
      router.replace(`/dashboard/${created.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Register as a manager or worker to access the dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Full name
                </label>
                <input
                  className="input mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    className="input mt-1"
                    placeholder="01XXXXXXXXX"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    className="input mt-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Role
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                  {(["worker", "manager"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                        role === r
                          ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Password
                  </label>
                  <input
                    type="password"
                    className="input mt-1"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    className="input mt-1"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? "Creating…" : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-gray-900 underline dark:text-white">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
