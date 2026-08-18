"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { analyticsService } from "@/lib/services";
import { formatId } from "@/lib/format";
import { ALL_RANGE, rangeQuery, type DateRange } from "@/lib/dateRange";
import type { ProductFlowRow } from "@/lib/types";

export default function AdminProductFlowPage() {
  const [rows, setRows] = useState<ProductFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await analyticsService.getProductFlow(rangeQuery(range));
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load product flow.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          qty: acc.qty + (r.qtySold || 0),
          tokens: acc.tokens + (r.tokensUsed || 0),
          margin: acc.margin + (r.margin || 0),
        }),
        { qty: 0, tokens: 0, margin: 0 },
      ),
    [rows],
  );

  const columns: Column<ProductFlowRow>[] = [
    {
      key: "image",
      header: "",
      render: (r) => (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
          {r.image ?? "🍽️"}
        </div>
      ),
    },
    {
      key: "productName",
      header: "Product",
      render: (r) => r.productName ?? "Unknown product",
    },
    {
      key: "sku",
      header: "SKU",
      render: (r) => r.code ?? formatId(r.productId ?? undefined),
    },
    { key: "category", header: "Category", render: (r) => r.category ?? "—" },
    { key: "qtySold", header: "Qty Sold", align: "right", render: (r) => r.qtySold.toLocaleString() },
    { key: "orders", header: "Orders", align: "right", render: (r) => r.orders.toLocaleString() },
    {
      key: "tokensUsed",
      header: "Tokens Used",
      align: "right",
      render: (r) => r.tokensUsed.toLocaleString(),
    },
    {
      key: "margin",
      header: "Margin (BDT)",
      align: "right",
      render: (r) => `৳ ${(r.margin ?? 0).toLocaleString()}`,
    },
  ];

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Product flow</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Which products sold, how many tokens they consumed, and their margin.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Items Sold" value={totals.qty.toLocaleString()} />
        <StatCard label="Tokens Used" value={totals.tokens.toLocaleString()} />
        <StatCard label="Total Margin" value={`৳ ${totals.margin.toLocaleString()}`} />
      </div>

      <DataTable<ProductFlowRow>
        columns={columns}
        rows={rows}
        emptyMessage={loading ? "Loading product flow…" : "No product sales in this range."}
      />
    </DashboardShell>
  );
}
