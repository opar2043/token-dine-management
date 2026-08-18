"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { tablesService, usersService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import type { TableAssignment, User } from "@/lib/types";

export default function ManagerTablesPage() {
  const [tables, setTables] = useState<TableAssignment[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, w] = await Promise.all([
          tablesService.getTables(),
          usersService.getUsers({ role: "worker", limit: 100 }),
        ]);
        if (cancelled) return;
        setTables(t);
        setWorkers(w.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tables.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const workerMap = useMemo(() => buildLookup(workers), [workers]);

  const handleAssigned = (t: TableAssignment) => {
    setTables((prev) => {
      const without = prev.filter((row) => row.table !== t.table);
      return [t, ...without];
    });
    setOpen(false);
  };

  const handleRelease = async (table: string) => {
    try {
      const updated = await tablesService.releaseTables(table);
      setTables((prev) => prev.map((t) => (t.table === table ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release table.");
    }
  };

  const columns: Column<TableAssignment>[] = [
    { key: "id", header: "Assignment", render: (t) => formatId(t.id) },
    { key: "table", header: "Table" },
    {
      key: "worker",
      header: "Worker",
      render: (t) =>
        t.workerId
          ? workerMap.get(t.workerId)?.name ?? t.worker ?? formatId(t.workerId)
          : "—",
    },
    { key: "assignedOn", header: "Assigned on", render: (t) => formatDate(t.assignedOn) },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) =>
        t.status === "active" ? (
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => handleRelease(t.table)}
          >
            Release
          </button>
        ) : null,
    },
  ];

  return (
    <DashboardShell role="manager">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tables</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Assign tables to workers and monitor status.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          Assign table
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<TableAssignment>
        columns={columns}
        rows={tables}
        emptyMessage={loading ? "Loading tables…" : "No tables yet."}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="Assign table"
        description="Link a worker to a table."
      >
        <AssignForm
          workers={workers}
          onCancel={() => setOpen(false)}
          onAssigned={handleAssigned}
        />
      </Modal>
    </DashboardShell>
  );
}

function AssignForm({
  workers,
  onCancel,
  onAssigned,
}: {
  workers: User[];
  onCancel: () => void;
  onAssigned: (t: TableAssignment) => void;
}) {
  const [table, setTable] = useState("T-");
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!table.trim()) return setError("Table number is required.");
    if (!workerId) return setError("Select a worker.");

    setSubmitting(true);
    try {
      const t = await tablesService.assignTables({ table: table.trim(), workerId });
      onAssigned(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign table.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Table
        </span>
        <input className="input mt-1" value={table} onChange={(e) => setTable(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Worker
        </span>
        <select
          className="input mt-1"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
        >
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
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
          {submitting ? "Assigning…" : "Assign"}
        </button>
      </div>
    </form>
  );
}
