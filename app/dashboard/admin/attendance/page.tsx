"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { attendanceService, usersService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import { ALL_RANGE, inRange, type DateRange } from "@/lib/dateRange";
import type { AttendanceEntry, User } from "@/lib/types";

export default function AdminAttendancePage() {
  const [items, setItems] = useState<AttendanceEntry[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [att, w] = await Promise.all([
          attendanceService.getAttendance(),
          usersService.getUsers({ role: "worker", limit: 100 }),
        ]);
        if (cancelled) return;
        setItems(att);
        setWorkers(w.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load attendance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const workerMap = useMemo(() => buildLookup(workers), [workers]);

  const filtered = useMemo(
    () => items.filter((a) => inRange(a.date, range)),
    [items, range],
  );

  const columns: Column<AttendanceEntry>[] = [
    { key: "id", header: "Entry", render: (a) => formatId(a.id) },
    {
      key: "worker",
      header: "Worker",
      render: (a) => workerMap.get(a.workerId)?.name ?? a.worker ?? formatId(a.workerId),
    },
    { key: "date", header: "Date", render: (a) => formatDate(a.date) },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All worker attendance entries across the team.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<AttendanceEntry>
        columns={columns}
        rows={filtered}
        emptyMessage={loading ? "Loading attendance…" : "No attendance records in this range."}
      />
    </DashboardShell>
  );
}
