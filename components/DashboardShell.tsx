"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { Role } from "@/lib/types";

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const userRole = user.role.toLowerCase();
    const targetRole = role.toLowerCase();
    if (userRole !== targetRole) {
      router.replace(`/dashboard/${userRole}`);
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role.toLowerCase() !== role.toLowerCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="hidden lg:block">
        <Sidebar role={role} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-10">
            <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
