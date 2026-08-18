"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { productsService } from "@/lib/services";
import { formatDate, formatId } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ManagerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await productsService.getProducts();
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load inventory.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: Column<Product>[] = [
    {
      key: "image",
      header: "",
      render: (p) => (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
          {p.image ?? "🍽️"}
        </div>
      ),
    },
    { key: "id", header: "SKU", render: (p) => formatId(p.id) },
    { key: "name", header: "Product" },
    { key: "category", header: "Category" },
    { key: "sellingPrice", header: "Price", align: "right", render: (p) => `৳ ${p.sellingPrice}` },
    { key: "stock", header: "Stock", align: "right" },
    { key: "updatedOn", header: "Updated", render: (p) => formatDate(p.updatedOn) },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
  ];

  const low = products.filter((p) => p.status === "low-stock").length;
  const out = products.filter((p) => p.status === "out-of-stock").length;

  return (
    <DashboardShell role="manager">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stock levels with low and out-of-stock alerts.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {low + out > 0 ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>{out}</strong> item(s) out of stock, <strong>{low}</strong> low-stock. Reorder soon.
        </div>
      ) : null}

      <DataTable<Product>
        columns={columns}
        rows={products}
        emptyMessage={loading ? "Loading inventory…" : "No products."}
      />
    </DashboardShell>
  );
}
