"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useAuth } from "@/context/AuthContext";
import { attendanceService, clientsService, salesService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import { ALL_RANGE, inRange, type DateRange } from "@/lib/dateRange";
import type { AttendanceEntry, Client, TokenSale } from "@/lib/types";

export default function WorkerDashboardPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<TokenSale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [s, c, a] = await Promise.all([
          salesService.getSales({ workerId: user.id }),
          clientsService.getClients({ limit: 100 }),
          attendanceService.getAttendance({ workerId: user.id }),
        ]);
        if (cancelled) return;
        setSales(s);
        setClients(c.items);
        setAttendance(a);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const clientMap = useMemo(() => buildLookup(clients), [clients]);
  const filteredSales = useMemo(
    () => sales.filter((s) => inRange(s.date, range)),
    [sales, range],
  );
  const totalTokens = filteredSales.reduce((sum, s) => sum + s.tokens, 0);

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  const columns: Column<TokenSale>[] = [
    { key: "id", header: "Txn ID", render: (s) => formatId(s.id) },
    { key: "date", header: "Date", render: (s) => formatDate(s.date) },
    {
      key: "client",
      header: "Client",
      render: (s) => clientMap.get(s.clientId)?.name ?? s.client ?? formatId(s.clientId),
    },
    { key: "tokens", header: "Tokens", align: "right" },
  ];

  return (
    <DashboardShell role="worker">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your sales, attendance, and assigned clients.
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
        <StatCard label="Clients Served" value={clients.length} />
        <StatCard label="Tokens Sold" value={totalTokens} hint="In range" />
        <StatCard label="Transactions" value={filteredSales.length} hint="In range" />
        <StatCard label="Attendance" value={`${attendanceRate}%`} hint="All time" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Recent sales</h2>
        <DataTable<TokenSale>
          columns={columns}
          rows={filteredSales}
          emptyMessage={loading ? "Loading sales…" : "No sales in this range."}
        />
      </section>
    </DashboardShell>
  );
}
