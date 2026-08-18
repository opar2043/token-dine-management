"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { PlusIcon, TrashIcon, CheckIcon, BanIcon } from "@/components/icons";
import { attendanceService, salesService, usersService } from "@/lib/services";
import { formatId } from "@/lib/format";
import type { AttendanceEntry, TokenSale, User } from "@/lib/types";

export default function ManagerWorkersPage() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [sales, setSales] = useState<TokenSale[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, s, a] = await Promise.all([
          usersService.getUsers({ role: "worker", limit: 100 }),
          salesService.getSales(),
          attendanceService.getAttendance(),
        ]);
        if (cancelled) return;
        setWorkers(w.items);
        setSales(s);
        setAttendance(a);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load workers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tokensByWorker = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sales) m.set(s.workerId, (m.get(s.workerId) ?? 0) + s.tokens);
    return m;
  }, [sales]);

  const attendanceByWorker = useMemo(() => {
    const m = new Map<string, { total: number; present: number }>();
    for (const a of attendance) {
      const c = m.get(a.workerId) ?? { total: 0, present: 0 };
      c.total += 1;
      if (a.status === "present" || a.status === "late") c.present += 1;
      m.set(a.workerId, c);
    }
    return m;
  }, [attendance]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;
    try {
      await usersService.deleteUsers(id);
      setWorkers((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete worker.");
    }
  };

  const handleToggleStatus = async (worker: User) => {
    const newStatus = worker.status === "active" ? "blocked" : "active";
    try {
      await usersService.updateUserStatus(worker.id, newStatus);
      setWorkers((prev) =>
        prev.map((w) => (w.id === worker.id ? { ...w, status: newStatus } : w))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const columns: Column<User>[] = [
    { key: "id", header: "ID", render: (w) => formatId(w.id) },
    { key: "name", header: "Name" },
    { key: "mobile", header: "Mobile", render: (w) => w.mobile ?? "—" },
    { key: "table", header: "Table", render: (w) => w.table ?? "—" },
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
      render: (w) => tokensByWorker.get(w.id) ?? 0,
    },
    {
      key: "bonus",
      header: "Bonus (BDT)",
      align: "right",
      render: (w) => (w.bonus ?? 0).toLocaleString(),
    },
    {
      key: "rating",
      header: "Rating",
      align: "right",
      render: (w) => (w.rating ?? 0).toFixed(1),
    },
    { key: "status", header: "Status", render: (w) => <StatusBadge status={w.status} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (w) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <button 
            onClick={() => handleToggleStatus(w)}
            title={w.status === "active" ? "Block" : "Activate"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          >
            {w.status === "active" ? <BanIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleDelete(w.id)}
            title="Delete"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DashboardShell role="manager">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Workers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track performance, attendance, and bonuses.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<User>
        columns={columns}
        rows={workers}
        emptyMessage={loading ? "Loading workers…" : "No workers yet."}
      />
    </DashboardShell>
  );
}
