"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import { productsService } from "@/lib/services";
import { formatDate, formatId } from "@/lib/format";
import type { Product } from "@/lib/types";

function stockStatus(stock: number): Product["status"] {
  if (stock <= 0) return "out-of-stock";
  if (stock < 10) return "low-stock";
  return "in-stock";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await productsService.getProducts();
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load products.");
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
    { key: "id", header: "SKU", render: (p) => p.productId ?? formatId(p.id) },
    { key: "name", header: "Product" },
    { key: "category", header: "Category" },
    { key: "costPrice", header: "Cost", align: "right", render: (p) => `৳ ${p.costPrice}` },
    { key: "sellingPrice", header: "Selling", align: "right", render: (p) => `৳ ${p.sellingPrice}` },
    {
      key: "profit",
      header: "Margin",
      align: "right",
      render: (p) => `৳ ${p.sellingPrice - p.costPrice}`,
    },
    { key: "stock", header: "Stock", align: "right" },
    { key: "addedOn", header: "Added", render: (p) => formatDate(p.addedOn) },
    { key: "updatedOn", header: "Updated", render: (p) => formatDate(p.updatedOn) },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <button
            onClick={() => {
              setSelected(p);
              setMode("edit");
            }}
            title="Edit"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            title="Delete"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productsService.deleteProducts(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product.");
    }
  };

  const handleCreate = (p: Product) => {
    setProducts((prev) => [p, ...prev]);
    setMode(null);
  };

  const handleUpdate = (p: Product) => {
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
    setMode(null);
  };

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cost, selling price, margin, and stock health.
          </p>
        </div>
        <button type="button" className="btn-primary gap-1.5" onClick={() => {
          setSelected(null);
          setMode("add");
        }}>
          <PlusIcon /> Add product
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<Product>
        columns={columns}
        rows={products}
        emptyMessage={loading ? "Loading products…" : "No products yet."}
      />

      <Modal
        open={mode !== null}
        onClose={() => setMode(null)}
        size="md"
        title={mode === "edit" ? "Edit product" : "Add product"}
        description={mode === "edit" ? "Update product details." : "Create a new menu item with pricing and starting stock."}
      >
        <ProductForm
          initialData={mode === "edit" ? selected : null}
          onCancel={() => setMode(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      </Modal>
    </DashboardShell>
  );
}

const categories = ["Main Course", "Appetizer", "Beverage", "Dessert", "Snack", "Other"];
const emojiChoices = ["🍛", "🥘", "🥤", "🍢", "🍨", "🍕", "🍔", "🥗", "🍰", "🍜", "🍤", "🍽️"];

function ProductForm({
  initialData,
  onCancel,
  onCreate,
  onUpdate,
}: {
  initialData?: Product | null;
  onCancel: () => void;
  onCreate: (p: Product) => void;
  onUpdate: (p: Product) => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [productId, setProductId] = useState(initialData?.productId ?? "");
  const [image, setImage] = useState(initialData?.image ?? emojiChoices[0]);
  const [category, setCategory] = useState(initialData?.category ?? categories[0]);
  const [costPrice, setCostPrice] = useState(initialData?.costPrice ?? 0);
  const [sellingPrice, setSellingPrice] = useState(initialData?.sellingPrice ?? 0);
  const [stock, setStock] = useState(initialData?.stock ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (sellingPrice <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }
    if (costPrice < 0 || sellingPrice < costPrice) {
      setError("Selling price must be greater than or equal to cost.");
      return;
    }
    if (stock < 0) {
      setError("Stock cannot be negative.");
      return;
    }

    setSubmitting(true);
    try {
      if (initialData) {
        const updated = await productsService.updateProducts(initialData.id, {
          name: name.trim(),
          image,
          category,
          costPrice,
          sellingPrice,
          stock,
        });
        onUpdate(updated);
      } else {
        const created = await productsService.createProducts({
          name: name.trim(),
          image,
          category,
          costPrice,
          sellingPrice,
          stock,
          productId: productId.trim() || undefined,
        });
        onCreate(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const margin = sellingPrice - costPrice;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Product name" required>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        {initialData ? null : (
          <Field label="Custom product ID (optional)">
            <input
              className="input"
              placeholder="e.g. BIR-001"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </Field>
        )}
        <Field label="Category">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cost price (BDT)" required>
          <input
            type="number"
            min={0}
            className="input"
            value={costPrice}
            onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
            required
          />
        </Field>
        <Field label="Selling price (BDT)" required>
          <input
            type="number"
            min={0}
            className="input"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
            required
          />
        </Field>
        <Field label="Starting stock" required>
          <input
            type="number"
            min={0}
            className="input"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value) || 0)}
            required
          />
        </Field>
        <Field label={`Margin: ৳ ${margin}`}>
          <div className="rounded-md text-xs border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
            Status preview:{" "}
            <strong>
              {stockStatus(stock).replace("-", " ")} 
            </strong>
          </div>
        </Field>
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Image
        </p>
        <div className="flex flex-wrap gap-2">
          {emojiChoices.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setImage(emoji)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${
                image === emoji
                  ? "border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

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
          {submitting ? "Saving…" : initialData ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
