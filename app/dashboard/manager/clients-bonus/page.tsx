"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { TrashIcon } from "@/components/icons";
import {
  clientBonusesService,
  clientsService,
  usersService,
} from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import type { ClientBonus, Client, User } from "@/lib/types";

export default function ManagerClientsBonusPage() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bonuses, setBonuses] = useState<ClientBonus[]>([]);
  
  const [workerId, setWorkerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const lower = clientSearch.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.mobile.includes(lower)
    );
  }, [clients, clientSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, c, b] = await Promise.all([
          usersService.getUsers({ role: "worker", limit: 100 }),
          clientsService.getClients({ limit: 100 }),
          clientBonusesService.getBonuses(),
        ]);
        if (cancelled) return;
        setWorkers(w.items);
        setClients(c.items);
        setBonuses(b);
        if (w.items.length > 0) setWorkerId(w.items[0].id);
        if (c.items.length > 0) setClientId(c.items[0].id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load page data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const workerMap = useMemo(() => buildLookup(workers), [workers]);
  const clientMap = useMemo(() => buildLookup(clients), [clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!workerId) return setError("Choose a worker.");
    if (!clientId) return setError("Choose a client.");
    if (amount <= 0) return setError("Amount must be greater than zero.");
    
    setSubmitting(true);
    try {
      const created = await clientBonusesService.createBonus({
        workerId,
        clientId,
        amount,
        reason,
      });
      setBonuses([created, ...bonuses]);
      setAmount(0);
      setReason("");
      setClientId("");
      setClientSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add client bonus.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bonus?")) return;
    try {
      await clientBonusesService.deleteBonus(id);
      setBonuses((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bonus.");
    }
  };

  const columns: Column<ClientBonus>[] = [
    { key: "id", header: "ID", render: (b) => formatId(b.id) },
    { key: "date", header: "Date", render: (b) => formatDate(b.date) },
    {
      key: "client",
      header: "Client",
      render: (b) => {
        const c = clientMap.get(b.clientId);
        return c ? `${c.name} (${c.mobile})` : b.client ?? formatId(b.clientId);
      },
    },
    {
      key: "worker",
      header: "Given By (Worker)",
      render: (b) => workerMap.get(b.workerId)?.name ?? b.worker ?? formatId(b.workerId),
    },
    {
      key: "amount",
      header: "Bonus Tokens",
      align: "right",
      render: (b) => b.amount.toLocaleString(),
    },
    { key: "reason", header: "Reason", render: (b) => b.reason || "—" },
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

  return (
    <DashboardShell role="manager">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients Bonus</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Award bonuses to clients directly, tracked by the responsible worker.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card mb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Worker
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="input mt-1"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div ref={clientSearchRef} className="relative">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Client Mobile/Name
            </label>
            <input
              type="text"
              className="input mt-1 w-full"
              placeholder="Search by name or mobile..."
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setClientId(""); // Clear picked ID if typing starts again
                setClientDropdownOpen(true);
              }}
              onFocus={() => setClientDropdownOpen(true)}
            />
            {clientDropdownOpen && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        setClientId(c.id);
                        setClientSearch(`${c.name} (${c.mobile})`);
                        setClientDropdownOpen(false);
                      }}
                    >
                      {c.name} - {c.mobile}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500">No clients found.</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Bonus Amount
            </label>
            <input
              type="number"
              min={1}
              className="input mt-1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Reason
            </label>
            <input
              className="input mt-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Competition winner"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Adding..." : "Add Client Bonus"}
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Client Bonuses Provided
        </h2>
        <DataTable<ClientBonus>
          columns={columns}
          rows={bonuses}
          emptyMessage={loading ? "Loading bonuses..." : "No client bonuses yet."}
        />
      </section>
    </DashboardShell>
  );
}
