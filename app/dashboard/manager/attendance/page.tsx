"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { PlusIcon } from "@/components/icons";
import { attendanceService, usersService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import { ALL_RANGE, inRange, type DateRange } from "@/lib/dateRange";
import type { AttendanceEntry, AttendanceStatus, User } from "@/lib/types";

export default function ManagerAttendancePage() {
  const [items, setItems] = useState<AttendanceEntry[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);
  const [open, setOpen] = useState(false);

  const loadAttendance = async () => {
    const a = await attendanceService.getAttendance();
    setItems(a);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, w] = await Promise.all([
          attendanceService.getAttendance(),
          usersService.getUsers({ role: "worker", limit: 100 }),
        ]);
        if (cancelled) return;
        setItems(a);
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

  const handleMarked = async () => {
    setOpen(false);
    try {
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh attendance.");
    }
  };

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
    <DashboardShell role="manager">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Record attendance for your staff or review submitted entries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={range} onChange={setRange} />
          <button type="button" className="btn-primary gap-1.5" onClick={() => setOpen(true)}>
            <PlusIcon /> Mark attendance
          </button>
        </div>
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="Mark attendance"
        description="Record (or override) attendance for a staff member."
      >
        <MarkForm workers={workers} onCancel={() => setOpen(false)} onMarked={handleMarked} />
      </Modal>
    </DashboardShell>
  );
}

function MarkForm({
  workers,
  onCancel,
  onMarked,
}: {
  workers: User[];
  onCancel: () => void;
  onMarked: () => void;
}) {
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? "");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!workerId) return setError("Select a staff member.");

    setSubmitting(true);
    try {
      await attendanceService.markAttendance({
        workerId,
        status,
        date: date || undefined,
      });
      onMarked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Staff (worker)
        </span>
        <select
          className="input mt-1"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
        >
          <option value="">— Select staff —</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Status
        </span>
        <select
          className="input mt-1"
          value={status}
          onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
        >
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Date (optional — defaults to today)
        </span>
        <input
          type="date"
          className="input mt-1"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save attendance"}
        </button>
      </div>
    </form>
  );
}
