"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { useAuth } from "@/context/AuthContext";
import { attendanceService } from "@/lib/services";
import { formatDate, formatId } from "@/lib/format";
import type { AttendanceEntry } from "@/lib/types";

export default function WorkerAttendancePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const a = await attendanceService.getAttendance({ workerId: user.id });
        if (!cancelled) setItems(a);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load attendance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await attendanceService.checkInAttendance(user.id);
      setItems((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<AttendanceEntry>[] = [
    { key: "id", header: "Entry", render: (a) => formatId(a.id) },
    { key: "date", header: "Date", render: (a) => formatDate(a.date) },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <DashboardShell role="worker">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Submit your attendance with a single click.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? "Marking…" : "Mark me present"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<AttendanceEntry>
        columns={columns}
        rows={items}
        emptyMessage={loading ? "Loading attendance…" : "No attendance records yet."}
      />
    </DashboardShell>
  );
}
