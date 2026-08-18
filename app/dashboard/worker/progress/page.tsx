"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import {
  attendanceService,
  progressService,
  salesService,
} from "@/lib/services";
import { formatDate } from "@/lib/format";
import type { AttendanceEntry, DailyProgress, TokenSale } from "@/lib/types";

export default function WorkerProgressPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [sales, setSales] = useState<TokenSale[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, s, a] = await Promise.all([
          progressService.getProgress({ workerId: user.id }),
          salesService.getSales({ workerId: user.id }),
          attendanceService.getAttendance({ workerId: user.id }),
        ]);
        if (cancelled) return;
        setProgress(p);
        setSales(s);
        setAttendance(a);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load progress.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const tokensSold = sales.reduce((sum, s) => sum + s.tokens, 0);
  const revenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  const columns: Column<DailyProgress>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    { key: "table", header: "Table" },
    { key: "tokenGiven", header: "Given", align: "right" },
    { key: "tokenSold", header: "Sold", align: "right" },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (row) => (
        <span
          className={
            row.balance < 0
              ? "font-semibold text-rose-600 dark:text-rose-400"
              : "text-gray-700 dark:text-gray-200"
          }
        >
          {row.balance}
        </span>
      ),
    },
    { key: "notes", header: "Notes", render: (row) => row.notes ?? "—" },
  ];

  return (
    <DashboardShell role="worker">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My progress</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your sales, tokens, and daily token balance.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tokens Sold" value={tokensSold} />
        <StatCard label="Revenue" value={`৳ ${revenue.toLocaleString()}`} />
        <StatCard label="Transactions" value={sales.length} />
        <StatCard label="Attendance" value={`${attendanceRate}%`} hint="All time" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Daily history</h2>
        <DataTable<DailyProgress>
          columns={columns}
          rows={progress}
          emptyMessage={loading ? "Loading progress…" : "No daily progress recorded for you yet."}
        />
      </section>
    </DashboardShell>
  );
}
