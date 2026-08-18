"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { TrashIcon } from "@/components/icons";
import {
  attendanceService,
  bonusesService,
  salesService,
  usersService,
} from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import type { AttendanceEntry, Bonus, TokenSale, User } from "@/lib/types";

const bonusColumns = (workerMap: Map<string, User>, handleDelete: (id: string) => void): Column<Bonus>[] => [
  { key: "id", header: "ID", render: (b) => formatId(b.id) },
  {
    key: "worker",
    header: "Worker",
    render: (b) => workerMap.get(b.workerId)?.name ?? b.worker ?? formatId(b.workerId),
  },
  {
    key: "amount",
    header: "Amount (BDT)",
    align: "right",
    render: (b) => `৳ ${b.amount.toLocaleString()}`,
  },
  { key: "date", header: "Date", render: (b) => formatDate(b.date) },
  { key: "reason", header: "Reason" },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    render: (b) => (
      <div className="flex items-center justify-end whitespace-nowrap">
        <button
          onClick={() => handleDelete(b.id)}
          title="Delete"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    )
  },
];

interface WorkerStat extends User {
  tokensSoldTotal: number;
  attendanceRate: number;
}

export default function ManagerBonusesPage() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [sales, setSales] = useState<TokenSale[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, b, s, a] = await Promise.all([
          usersService.getUsers({ role: "worker", limit: 100 }),
          bonusesService.getBonuses(),
          salesService.getSales(),
          attendanceService.getAttendance(),
        ]);
        if (cancelled) return;
        setWorkers(w.items);
        setBonuses(b);
        setSales(s);
        setAttendance(a);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load bonuses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bonus?")) return;
    try {
      await bonusesService.deleteBonuses(id);
      setBonuses((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bonus.");
    }
  };

  const workerMap = useMemo(() => buildLookup(workers), [workers]);

  const enrichedWorkers: WorkerStat[] = useMemo(() => {
    const tokens = new Map<string, number>();
    for (const s of sales) tokens.set(s.workerId, (tokens.get(s.workerId) ?? 0) + s.tokens);

    const att = new Map<string, { total: number; present: number }>();
    for (const a of attendance) {
      const c = att.get(a.workerId) ?? { total: 0, present: 0 };
      c.total += 1;
      if (a.status === "present" || a.status === "late") c.present += 1;
      att.set(a.workerId, c);
    }

    return workers.map((w) => {
      const c = att.get(w.id);
      return {
        ...w,
        tokensSoldTotal: tokens.get(w.id) ?? 0,
        attendanceRate: c && c.total ? Math.round((c.present / c.total) * 100) : 0,
      };
    });
  }, [workers, sales, attendance]);

  const recommendationColumns: Column<WorkerStat>[] = [
    { key: "name", header: "Worker" },
    {
      key: "attendanceRate",
      header: "Attendance %",
      align: "right",
      render: (w) => `${w.attendanceRate}%`,
    },
    { key: "tokensSoldTotal", header: "Tokens Sold", align: "right" },
    { key: "rating", header: "Rating", align: "right", render: (w) => (w.rating ?? 0).toFixed(1) },
    {
      key: "recommend",
      header: "Suggestion",
      render: (w) => {
        const eligible =
          w.attendanceRate >= 90 && w.tokensSoldTotal >= 250 && (w.rating ?? 0) >= 4;
        return eligible ? (
          <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Recommend bonus
          </span>
        ) : (
          <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            Not yet
          </span>
        );
      },
    },
  ];

  return (
    <DashboardShell role="manager">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Bonus recommendations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Auto-suggestions based on attendance, sales, and rating. Final approval is by admin.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Your team
        </h2>
        <DataTable<WorkerStat>
          columns={recommendationColumns}
          rows={enrichedWorkers}
          emptyMessage={loading ? "Loading workers…" : "No workers."}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Recent bonuses paid
        </h2>
        <DataTable<Bonus>
          columns={bonusColumns(workerMap, handleDelete)}
          rows={bonuses}
          emptyMessage={loading ? "Loading bonuses…" : "No bonuses yet."}
        />
      </section>
    </DashboardShell>
  );
}
