"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";
import { complaintsService, usersService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import type { Complaint, User } from "@/lib/types";

export default function WorkerComplaintsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, u] = await Promise.all([
          complaintsService.getComplaints(),
          usersService.getUsers({ limit: 100 }),
        ]);
        if (cancelled) return;
        setItems(c);
        setUsers(u.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load complaints.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const userMap = useMemo(() => buildLookup(users), [users]);

  const handleCreate = (next: Complaint) => {
    setItems((prev) => [next, ...prev]);
    setOpen(false);
  };

  const columns: Column<Complaint>[] = [
    { key: "id", header: "ID", render: (c) => formatId(c.id) },
    {
      key: "by",
      header: "Submitted by",
      render: (c) => userMap.get(c.byId)?.name ?? c.by ?? formatId(c.byId),
    },
    { key: "subject", header: "Subject" },
    { key: "date", header: "Date", render: (c) => formatDate(c.date) },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <DashboardShell role="worker">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Complaints</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            File issues and track their status.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)} disabled={!user}>
          File complaint
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<Complaint>
        columns={columns}
        rows={items}
        emptyMessage={loading ? "Loading complaints…" : "No complaints yet."}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        title="File a complaint"
        description="Describe the issue. Admins will review."
      >
        {user ? (
          <ComplaintForm byId={user.id} onCancel={() => setOpen(false)} onCreate={handleCreate} />
        ) : null}
      </Modal>
    </DashboardShell>
  );
}

function ComplaintForm({
  byId,
  onCancel,
  onCreate,
}: {
  byId: string;
  onCancel: () => void;
  onCreate: (c: Complaint) => void;
}) {
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!subject.trim()) return setError("Please describe the issue.");
    setSubmitting(true);
    try {
      const created = await complaintsService.createComplaints({ byId, subject: subject.trim() });
      onCreate(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to file complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Subject
        </span>
        <input
          className="input mt-1"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
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
          {submitting ? "Filing…" : "File complaint"}
        </button>
      </div>
    </form>
  );
}
