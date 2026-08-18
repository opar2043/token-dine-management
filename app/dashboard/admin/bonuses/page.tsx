"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Modal } from "@/components/Modal";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TrashIcon } from "@/components/icons";
import { bonusesService, usersService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import { ALL_RANGE, inRange, type DateRange } from "@/lib/dateRange";
import type { Bonus, User } from "@/lib/types";

export default function AdminBonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, w] = await Promise.all([
          bonusesService.getBonuses(),
          usersService.getUsers({ role: "worker", limit: 100 }),
        ]);
        if (cancelled) return;
        setBonuses(b);
        setWorkers(w.items);
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

  const workerMap = useMemo(() => buildLookup(workers), [workers]);

  const filteredBonuses = useMemo(
    () => bonuses.filter((b) => inRange(b.date, range)),
    [bonuses, range],
  );

  const total = filteredBonuses.reduce((sum, b) => sum + b.amount, 0);
  const average = filteredBonuses.length ? Math.round(total / filteredBonuses.length) : 0;

  const columns: Column<Bonus>[] = [
    { key: "id", header: "Bonus ID", render: (b) => formatId(b.id) },
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bonus?")) return;
    try {
      await bonusesService.deleteBonuses(id);
      setBonuses((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bonus.");
    }
  };

  const handleCreate = (next: Bonus) => {
    setBonuses((prev) => [next, ...prev]);
    setOpen(false);
  };

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Bonuses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Performance-based bonus history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={range} onChange={setRange} />
          <button className="btn-primary" type="button" onClick={() => setOpen(true)}>
            Assign new bonus
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Paid" value={`৳ ${total.toLocaleString()}`} />
        <StatCard label="Entries" value={bonuses.length} />
        <StatCard label="Average" value={`৳ ${average.toLocaleString()}`} />
      </div>

      <DataTable<Bonus>
        columns={columns}
        rows={filteredBonuses}
        emptyMessage={loading ? "Loading bonuses…" : "No bonuses in this range."}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="Assign bonus"
        description="Grant a bonus to a worker."
      >
        <BonusForm workers={workers} onCancel={() => setOpen(false)} onCreate={handleCreate} />
      </Modal>
    </DashboardShell>
  );
}

function BonusForm({
  workers,
  onCancel,
  onCreate,
}: {
  workers: User[];
  onCancel: () => void;
  onCreate: (b: Bonus) => void;
}) {
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!workerId) return setError("Select a worker.");
    if (amount <= 0) return setError("Amount must be greater than 0.");
    if (!reason.trim()) return setError("Reason is required.");

    setSubmitting(true);
    try {
      const created = await bonusesService.createBonuses({
        workerId,
        amount,
        reason: reason.trim(),
      });
      onCreate(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign bonus.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Amount (BDT)
        </span>
        <input
          type="number"
          min={0}
          className="input mt-1"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Reason
        </span>
        <input
          className="input mt-1"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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
          {submitting ? "Assigning…" : "Assign bonus"}
        </button>
      </div>
    </form>
  );
}
