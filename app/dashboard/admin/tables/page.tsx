"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Modal } from "@/components/Modal";
import { EditIcon, PlusIcon } from "@/components/icons";
import { tablesService, usersService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import type { TableAssignment, User } from "@/lib/types";

type Mode = "assign" | "edit" | null;

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableAssignment[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<TableAssignment | null>(null);

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

  const handleSaved = (t: TableAssignment) => {
    setTables((prev) => {
      const without = prev.filter((row) => row.table !== t.table);
      return [t, ...without];
    });
    setMode(null);
    setSelected(null);
  };

  const handleRelease = async (table: string) => {
    try {
      const updated = await tablesService.releaseTables(table);
      setTables((prev) => prev.map((t) => (t.table === table ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release table.");
    }
  };

  const active = tables.filter((t) => t.status === "active").length;
  const free = tables.length - active;

  const columns: Column<TableAssignment>[] = [
    { key: "id", header: "Assignment", render: (t) => formatId(t.id) },
    { key: "table", header: "Table" },
    {
      key: "worker",
      header: "Staff",
      render: (t) =>
        t.workerId
          ? workerMap.get(t.workerId)?.name ?? t.worker ?? formatId(t.workerId)
          : "—",
    },
    { key: "assignedOn", header: "Assigned on", render: (t) => formatDate(t.assignedOn) },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <button
            type="button"
            title="Edit / reassign"
            onClick={() => {
              setSelected(t);
              setMode("edit");
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          {t.status === "active" ? (
            <button type="button" className="btn-ghost text-xs" onClick={() => handleRelease(t.table)}>
              Release
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Table assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add tables and assign staff, or reassign existing ones.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary gap-1.5"
          onClick={() => {
            setSelected(null);
            setMode("assign");
          }}
        >
          <PlusIcon /> Add table
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Tables" value={tables.length} />
        <StatCard label="Active" value={active} />
        <StatCard label="Free" value={free} />
      </div>

      <DataTable<TableAssignment>
        columns={columns}
        rows={tables}
        emptyMessage={loading ? "Loading tables…" : "No tables yet."}
      />

      <Modal
        open={mode !== null}
        onClose={() => {
          setMode(null);
          setSelected(null);
        }}
        size="md"
        title={mode === "edit" ? "Edit table" : "Add table"}
        description={
          mode === "edit"
            ? "Reassign the staff member for this table."
            : "Create a table and assign a staff member to it."
        }
      >
        <TableForm
          workers={workers}
          initial={mode === "edit" ? selected : null}
          onCancel={() => {
            setMode(null);
            setSelected(null);
          }}
          onSaved={handleSaved}
        />
      </Modal>
    </DashboardShell>
  );
}

function TableForm({
  workers,
  initial,
  onCancel,
  onSaved,
}: {
  workers: User[];
  initial: TableAssignment | null;
  onCancel: () => void;
  onSaved: (t: TableAssignment) => void;
}) {
  const [table, setTable] = useState(initial?.table ?? "T-");
  const [workerId, setWorkerId] = useState(initial?.workerId ?? workers[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!table.trim()) return setError("Table number is required.");
    if (!workerId) return setError("Select a staff member.");

    setSubmitting(true);
    try {
      const t = await tablesService.assignTables({ table: table.trim(), workerId });
      onSaved(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save table.");
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
        <input
          className="input mt-1"
          value={table}
          onChange={(e) => setTable(e.target.value)}
          disabled={isEdit}
        />
        {isEdit ? (
          <span className="mt-1 block text-[11px] text-gray-400">
            Table number can&apos;t be changed — reassign the staff below.
          </span>
        ) : null}
      </label>
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
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add table"}
        </button>
      </div>
    </form>
  );
}
