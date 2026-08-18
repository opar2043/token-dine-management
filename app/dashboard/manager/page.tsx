"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import {
  attendanceService,
  salesService,
  tablesService,
  usersService,
} from "@/lib/services";
import { formatId } from "@/lib/format";
import { ALL_RANGE, inRange, type DateRange } from "@/lib/dateRange";
import type { AttendanceEntry, TableAssignment, TokenSale, User } from "@/lib/types";

export default function ManagerDashboardPage() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [sales, setSales] = useState<TokenSale[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [tables, setTables] = useState<TableAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, s, a, t] = await Promise.all([
          usersService.getUsers({ role: "worker", limit: 100 }),
          salesService.getSales(),
          attendanceService.getAttendance(),
          tablesService.getTables(),
        ]);
        if (cancelled) return;
        setWorkers(w.items);
        setSales(s);
        setAttendance(a);
        setTables(t);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeWorkers = workers.filter((w) => w.status === "active").length;
  const filteredSales = useMemo(
    () => sales.filter((s) => inRange(s.date, range)),
    [sales, range],
  );
  const tokensSoldByWorker = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filteredSales) {
      map.set(s.workerId, (map.get(s.workerId) ?? 0) + s.tokens);
    }
    return map;
  }, [filteredSales]);

  const attendanceByWorker = useMemo(() => {
    const counts = new Map<string, { total: number; present: number }>();
    for (const a of attendance) {
      const c = counts.get(a.workerId) ?? { total: 0, present: 0 };
      c.total += 1;
      if (a.status === "present" || a.status === "late") c.present += 1;
      counts.set(a.workerId, c);
    }
    return counts;
  }, [attendance]);

  const tablesByWorker = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tables) if (t.workerId) map.set(t.workerId, t.table);
    return map;
  }, [tables]);

  const totalTokensSold = filteredSales.reduce((sum, s) => sum + s.tokens, 0);

  const avgAttendance =
    workers.length === 0
      ? 0
      : Math.round(
          workers.reduce((sum, w) => {
            const c = attendanceByWorker.get(w.id);
            const rate = c && c.total ? (c.present / c.total) * 100 : 0;
            return sum + rate;
          }, 0) / Math.max(workers.length, 1),
        );

  const workerColumns: Column<User>[] = [
    { key: "id", header: "ID", render: (w) => formatId(w.id) },
    { key: "name", header: "Worker" },
    { key: "mobile", header: "Mobile", render: (w) => w.mobile ?? "—" },
    { key: "table", header: "Table", render: (w) => tablesByWorker.get(w.id) ?? w.table ?? "—" },
    {
      key: "attendanceRate",
      header: "Attend %",
      align: "right",
      render: (w) => {
        const c = attendanceByWorker.get(w.id);
        return c && c.total ? `${Math.round((c.present / c.total) * 100)}%` : "—";
      },
    },
    {
      key: "tokensSold",
      header: "Tokens Sold",
      align: "right",
      render: (w) => tokensSoldByWorker.get(w.id) ?? 0,
    },
    {
      key: "rating",
      header: "Rating",
      align: "right",
      render: (w) => (w.rating ?? 0).toFixed(1),
    },
    { key: "status", header: "Status", render: (w) => <StatusBadge status={w.status} /> },
  ];

  return (
    <DashboardShell role="manager">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manager overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor your team and daily operations.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Workers" value={activeWorkers} hint={`of ${workers.length} total`} />
        <StatCard label="Avg Attendance" value={`${avgAttendance}%`} />
        <StatCard label="Total Tokens" value={totalTokensSold.toLocaleString()} hint="In range" />
        <StatCard label="Tables Assigned" value={tablesByWorker.size} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Workers</h2>
        <DataTable<User>
          columns={workerColumns}
          rows={workers}
          emptyMessage={loading ? "Loading workers\u2026" : "No workers yet."}
        />
      </section>
    </DashboardShell>
  );
}
