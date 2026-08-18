"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { clientsService } from "@/lib/services";
import { formatDate, formatId } from "@/lib/format";
import type { Client } from "@/lib/types";

export default function WorkerClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await clientsService.getClients({ limit: 200 });
        if (!cancelled) setClients(c.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load clients.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.mobile.toLowerCase().includes(q) ||
        c.nid.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q),
    );
  }, [query, clients]);

  const columns: Column<Client>[] = [
    { key: "id", header: "Client ID", render: (c) => formatId(c.id) },
    { key: "name", header: "Name" },
    { key: "mobile", header: "Mobile" },
    { key: "nid", header: "NID" },
    { key: "tokensBought", header: "Bought", align: "right" },
    { key: "tokensSpent", header: "Spent", align: "right" },
    { key: "balance", header: "Balance", align: "right" },
    { key: "createdAt", header: "Joined", render: (c) => formatDate(c.createdAt) },
  ];

  return (
    <DashboardShell role="worker">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Search existing clients by mobile or NID.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mb-4">
        <input
          className="input max-w-md"
          placeholder="Search by name, mobile or NID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <DataTable<Client>
        columns={columns}
        rows={filtered}
        emptyMessage={loading ? "Loading clients…" : "No clients match your search."}
      />
    </DashboardShell>
  );
}
