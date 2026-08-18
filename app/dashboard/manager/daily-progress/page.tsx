"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { TrashIcon } from "@/components/icons";
import { progressService, usersService } from "@/lib/services";
import { buildLookup, formatDate } from "@/lib/format";
import type { DailyProgress, User } from "@/lib/types";

export default function ManagerDailyProgressPage() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [rows, setRows] = useState<DailyProgress[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [table, setTable] = useState("");
  const [given, setGiven] = useState(0);
  const [sold, setSold] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, p] = await Promise.all([
          usersService.getUsers({ role: "worker", limit: 100 }),
          progressService.getProgress(),
        ]);
        if (cancelled) return;
        setWorkers(w.items);
        setRows(p);
        if (w.items[0]) {
          setWorkerId(w.items[0].id);
          setTable(w.items[0].table ?? "");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load progress.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const workerMap = useMemo(() => buildLookup(workers), [workers]);

  const balance = useMemo(() => given - sold, [given, sold]);
  const negative = balance < 0;

  const groupedRows = useMemo(() => {
    const map = new Map<string, DailyProgress>();
    for (const r of rows) {
      const key = r.workerId;
      const existing = map.get(key);
      if (existing) {
        existing.tokenGiven += r.tokenGiven;
        existing.tokenSold += r.tokenSold;
        existing.balance = existing.tokenGiven - existing.tokenSold;
        existing.id = `${existing.id},${r.id}`; // store all ids for deletion
        if (r.notes) {
          existing.notes = existing.notes ? `${existing.notes}, ${r.notes}` : r.notes;
        }
      } else {
        map.set(key, { ...r });
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!workerId) return setError("Choose a worker.");

    setSubmitting(true);
    try {
      const created = await progressService.createProgress({
        workerId,
        table,
        tokenGiven: given,
        tokenSold: sold,
        notes: notes || undefined,
      });
      setRows([created, ...rows]);
      setGiven(0);
      setSold(0);
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save progress.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (idOrIds: string) => {
    if (!confirm("Are you sure you want to delete this progress entry?")) return;
    try {
      const ids = idOrIds.split(",");
      await Promise.all(ids.map((id) => progressService.deleteProgress(id)));
      setRows((prev) => prev.filter((p) => !ids.includes(p.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete progress.");
    }
  };

  const columns: Column<DailyProgress>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    {
      key: "worker",
      header: "Worker",
      render: (row) => workerMap.get(row.workerId)?.name ?? row.worker ?? row.workerId,
    },
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
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end whitespace-nowrap">
          <button
            onClick={() => handleDelete(row.id)}
            title="Delete"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell role="manager">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Daily progress</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Record token given vs sold per worker. Negative balances are highlighted.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Worker
            </label>
            <select
              value={workerId}
              onChange={(e) => {
                setWorkerId(e.target.value);
                const match = workers.find((w) => w.id === e.target.value);
                if (match?.table) setTable(match.table);
              }}
              className="input mt-1"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Table
            </label>
            <input className="input mt-1" value={table} onChange={(e) => setTable(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Token given
            </label>
            <input
              type="number"
              min={0}
              className="input mt-1"
              value={given}
              onChange={(e) => setGiven(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Token sold
            </label>
            <input
              type="number"
              min={0}
              className="input mt-1"
              value={sold}
              onChange={(e) => setSold(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Remaining balance
            </label>
            <div
              className={`mt-1 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                negative
                  ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                  : "border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
              }`}
            >
              {balance}
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Notes (optional)
            </label>
            <input
              className="input mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth flagging…"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save progress"}
          </button>
        </div>
      </form>

      <DataTable<DailyProgress>
        columns={columns}
        rows={groupedRows}
        emptyMessage={loading ? "Loading progress…" : "No entries yet."}
      />
    </DashboardShell>
  );
}
