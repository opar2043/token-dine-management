"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useAuth } from "@/context/AuthContext";
import { clientsService, salesService } from "@/lib/services";
import { buildLookup, formatDate, formatId } from "@/lib/format";
import { ALL_RANGE, inRange, type DateRange } from "@/lib/dateRange";
import type { Client, TokenSale } from "@/lib/types";

export default function WorkerSalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<TokenSale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [s, c] = await Promise.all([
          salesService.getSales({ workerId: user.id }),
          clientsService.getClients({ limit: 200 }),
        ]);
        if (cancelled) return;
        setSales(s);
        setClients(c.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load sales.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const clientMap = useMemo(() => buildLookup(clients), [clients]);

  const filteredSales = useMemo(
    () => sales.filter((s) => inRange(s.date, range)),
    [sales, range],
  );

  const columns: Column<TokenSale>[] = [
    { key: "id", header: "Txn ID", render: (s) => formatId(s.id) },
    { key: "date", header: "Date", render: (s) => formatDate(s.date) },
    {
      key: "client",
      header: "Client",
      render: (s) => clientMap.get(s.clientId)?.name ?? s.client ?? formatId(s.clientId),
    },
    { key: "tokens", header: "Tokens", align: "right" },
  ];

  return (
    <DashboardShell role="worker">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My sales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Token sales you have processed.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<TokenSale>
        columns={columns}
        rows={filteredSales}
        emptyMessage={loading ? "Loading sales…" : "No sales in this range."}
      />
    </DashboardShell>
  );
}
