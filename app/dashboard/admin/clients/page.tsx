"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { StatCard } from "@/components/StatCard";
import { EditIcon, EyeIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { clientsService, productsService } from "@/lib/services";
import { formatDate, formatId } from "@/lib/format";
import type { Client, ClientPurchase, Product } from "@/lib/types";

type Mode = "view" | "edit" | "delete" | null;
type Range = "today" | "week" | "month" | "all";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<ClientPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [range, setRange] = useState<Range>("all");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([
          clientsService.getClients({ limit: 100 }),
          productsService.getProducts(),
        ]);
        if (cancelled) return;
        setClients(c.items);
        setProducts(p);
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

  const selected = useMemo(
    () => clients.find((c) => c.id === selectedId) ?? null,
    [clients, selectedId],
  );

  const open = async (id: string, m: Mode) => {
    setSelectedId(id);
    setMode(m);
    setRange("all");
    if (m === "view" || m === "edit") {
      try {
        const items = await clientsService.getClientPurchases(id);
        setPurchases(items);
      } catch {
        setPurchases([]);
      }
    }
  };

  const close = () => {
    setMode(null);
    setSelectedId(null);
    setPurchases([]);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await clientsService.deleteClients(selected.id);
      setClients((prev) => prev.filter((c) => c.id !== selected.id));
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client.");
    }
  };

  const handleSave = async (next: Client) => {
    try {
      const updated = await clientsService.updateClients(next.id, {
        name: next.name,
        mobile: next.mobile,
        nid: next.nid,
        email: next.email,
        address: next.address,
        gender: next.gender,
        referral: next.referral,
        rating: next.rating,
        tokensBought: next.tokensBought,
        tokensSpent: next.tokensSpent,
      });
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update client.");
    }
  };

  const handleCreate = (next: Client) => {
    setClients((prev) => [next, ...prev]);
    setCreateOpen(false);
  };

  const handleAddPurchase = async (clientId: string, productId: string, qty: number, tokensUsed: number) => {
    try {
      const purchase = await clientsService.addClientPurchase(clientId, {
        productId,
        qty,
        tokensUsed,
      });
      setPurchases((prev) => [purchase, ...prev]);
      const refreshed = await clientsService.getClient(clientId);
      setClients((prev) => prev.map((c) => (c.id === clientId ? refreshed : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add purchase.");
    }
  };

  const handleRemovePurchase = async (clientId: string, purchaseId: string) => {
    if (!confirm("Are you sure you want to remove this purchase?")) return;
    try {
      await clientsService.deleteClientPurchase(clientId, purchaseId);
      setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
      const refreshed = await clientsService.getClient(clientId);
      setClients((prev) => prev.map((c) => (c.id === clientId ? refreshed : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove purchase.");
    }
  };

  const columns: Column<Client>[] = [
    { key: "id", header: "Client ID", render: (c) => formatId(c.id) },
    { key: "name", header: "Name" },
    { key: "mobile", header: "Mobile" },
    { key: "nid", header: "NID" },
    { key: "tokensBought", header: "Bought", align: "right" },
    { key: "tokensSpent", header: "Spent", align: "right" },
    { key: "balance", header: "Balance", align: "right" },
    { key: "rating", header: "Rating", align: "right", render: (c) => c.rating.toFixed(1) },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton title="View details" onClick={() => open(c.id, "view")}>
            <EyeIcon />
          </IconButton>
          <IconButton title="Edit" onClick={() => open(c.id, "edit")}>
            <EditIcon />
          </IconButton>
          <IconButton
            title="Delete"
            danger
            onClick={() => open(c.id, "delete")}
          >
            <TrashIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View, edit, or remove client records.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon /> New client
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <DataTable<Client>
        columns={columns}
        rows={clients}
        emptyMessage={loading ? "Loading clients…" : "No clients yet."}
      />

      <Modal
        open={mode === "view" && !!selected}
        onClose={close}
        size="lg"
        title={selected ? `${selected.name} • ${formatId(selected.id)}` : "Client"}
        description={selected ? `Mobile: ${selected.mobile} • NID: ${selected.nid}` : undefined}
      >
        {selected ? (
          <ViewContent
            client={selected}
            allClients={clients}
            purchases={purchases}
            range={range}
            onRangeChange={setRange}
          />
        ) : null}
      </Modal>

      <Modal
        open={mode === "edit" && !!selected}
        onClose={close}
        size="lg"
        title={selected ? `Edit ${selected.name}` : "Edit client"}
        description="Update profile, rating, and add new menu purchases to history."
      >
        {selected ? (
          <EditContent
            client={selected}
            products={products}
            purchases={purchases}
            onSave={handleSave}
            onDeleteClient={() => open(selected.id, "delete")}
            onAddPurchase={(productId, qty, tokensUsed) =>
              handleAddPurchase(selected.id, productId, qty, tokensUsed)
            }
            onRemovePurchase={(purchaseId) => handleRemovePurchase(selected.id, purchaseId)}
            onCancel={close}
          />
        ) : null}
      </Modal>

      <Modal
        open={mode === "delete" && !!selected}
        onClose={close}
        size="sm"
        title="Delete client?"
        description="This action cannot be undone."
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700"
            >
              Delete client
            </button>
          </>
        }
      >
        {selected ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You are about to remove <strong>{selected.name}</strong>.
          </p>
        ) : null}
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        size="lg"
        title="New client"
        description="Register a new customer."
      >
        <CreateClientForm
          existing={clients}
          onCancel={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      </Modal>
    </DashboardShell>
  );
}

function IconButton({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
        danger
          ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
          : "border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function withinRange(dateStr: string, range: Range): boolean {
  if (range === "all") return true;
  const now = new Date();
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (range === "today") return diffDays === 0;
  if (range === "week") return diffDays >= 0 && diffDays < 7;
  if (range === "month") return diffDays >= 0 && diffDays < 30;
  return true;
}

function ViewContent({
  client,
  allClients,
  purchases,
  range,
  onRangeChange,
}: {
  client: Client;
  allClients: Client[];
  purchases: ClientPurchase[];
  range: Range;
  onRangeChange: (r: Range) => void;
}) {
  const filtered = useMemo(
    () => purchases.filter((p) => withinRange(p.date, range)),
    [purchases, range],
  );

  // People this client referred: stored array on the client + anyone whose
  // referral mobile matches this client's mobile (covers older records).
  const referredMobiles = useMemo(() => {
    const set = new Set<string>(client.referrals ?? []);
    for (const c of allClients) {
      if (c.referral && c.referral === client.mobile) set.add(c.mobile);
    }
    return Array.from(set);
  }, [client.referrals, client.mobile, allClients]);

  const totalItems = filtered.reduce((sum, p) => sum + p.qty, 0);
  const totalTokens = filtered.reduce((sum, p) => sum + p.tokensUsed, 0);

  const ranges: { value: Range; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "all", label: "All time" },
  ];

  const columns: Column<ClientPurchase>[] = [
    { key: "date", header: "Date", render: (p) => formatDate(p.date) },
    { key: "productName", header: "Item" },
    { key: "qty", header: "Qty", align: "right" },
    { key: "tokensUsed", header: "Tokens", align: "right" },
  ];

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProfileRow label="Email" value={client.email ?? "—"} />
        <ProfileRow label="Address" value={client.address ?? "—"} />
        <ProfileRow label="Gender" value={client.gender ?? "—"} />
        <ProfileRow label="Referred by" value={client.referral ?? "—"} />
        <ProfileRow label="Joined" value={formatDate(client.createdAt)} />
        <ProfileRow label="Rating" value={`${client.rating.toFixed(1)} / 5`} />
      </section>

      <section className="rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Referred people (mobile numbers)
          </p>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {referredMobiles.length}
          </span>
        </div>
        {referredMobiles.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This client hasn&apos;t referred anyone yet.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {referredMobiles.map((m) => (
              <span
                key={m}
                className="badge bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tokens Bought" value={client.tokensBought} />
        <StatCard label="Tokens Spent" value={client.tokensSpent} />
        <StatCard label="Balance" value={client.balance} />
        <StatCard label="Lifetime Visits" value={purchases.length} />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Purchase history
          </h3>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
            {ranges.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onRangeChange(r.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  range === r.value
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs">
          <Mini label="Items" value={totalItems} />
          <Mini label="Tokens used" value={totalTokens} />
        </div>

        <DataTable<ClientPurchase>
          columns={columns}
          rows={filtered}
          emptyMessage="No purchases in this range."
        />
      </section>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-base font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function EditContent({
  client,
  products,
  purchases,
  onSave,
  onDeleteClient,
  onAddPurchase,
  onRemovePurchase,
  onCancel,
}: {
  client: Client;
  products: Product[];
  purchases: ClientPurchase[];
  onSave: (next: Client) => void;
  onDeleteClient: () => void;
  onAddPurchase: (productId: string, qty: number, tokensUsed: number) => void;
  onRemovePurchase: (purchaseId: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Client>(client);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [tokensUsed, setTokensUsed] = useState(1);

  const update = <K extends keyof Client>(key: K, value: Client[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAddItem = () => {
    if (!productId || qty < 1 || tokensUsed < 1) return;
    onAddPurchase(productId, qty, tokensUsed);
    setQty(1);
    setTokensUsed(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name" required>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </Field>
        <Field label="Mobile" required>
          <input
            className="input"
            value={form.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            required
          />
        </Field>
        <Field label="NID" required>
          <input
            className="input"
            value={form.nid}
            onChange={(e) => update("nid", e.target.value)}
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="input"
            value={form.email ?? ""}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field label="Address">
          <input
            className="input"
            value={form.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
          />
        </Field>
        <Field label="Gender">
          <select
            className="input"
            value={form.gender ?? ""}
            onChange={(e) => update("gender", (e.target.value || undefined) as Client["gender"])}
          >
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Referral mobile">
          <input
            className="input"
            value={form.referral ?? ""}
            onChange={(e) => update("referral", e.target.value)}
          />
        </Field>
        <Field label={`Rating: ${form.rating.toFixed(1)} / 5`}>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={form.rating}
            onChange={(e) => update("rating", Number(e.target.value))}
            className="w-full accent-gray-900 dark:accent-white"
          />
        </Field>
        <Field label="Tokens bought">
          <input
            type="number"
            min={0}
            className="input"
            value={form.tokensBought}
            onChange={(e) => update("tokensBought", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Tokens spent">
          <input
            type="number"
            min={0}
            className="input"
            value={form.tokensSpent}
            onChange={(e) => update("tokensSpent", Number(e.target.value) || 0)}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Add menu purchase
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Append a new item to this client&apos;s purchase history.
            </p>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {purchases.length} record(s) on file
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,100px,120px,auto]">
          <select
            className="input"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (৳ {p.sellingPrice})
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            className="input"
            placeholder="Qty"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
          />
          <input
            type="number"
            min={1}
            className="input"
            placeholder="Tokens"
            value={tokensUsed}
            onChange={(e) => setTokensUsed(Number(e.target.value) || 1)}
          />
          <button type="button" onClick={handleAddItem} className="btn-ghost gap-1.5">
            <PlusIcon /> Add
          </button>
        </div>
        
        {purchases.length > 0 && (
          <div className="mt-4 space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 dark:border-gray-800">
                <div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.productName}</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Qty: {p.qty}, Tokens: {p.tokensUsed}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePurchase(p.id)}
                  className="px-2 py-1 text-xs rounded border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 mt-4">
        <button type="button" className="inline-flex mr-auto items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700" onClick={onDeleteClient}>
          Delete client
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save changes
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

function CreateClientForm({
  existing,
  onCancel,
  onCreate,
}: {
  existing: Client[];
  onCancel: () => void;
  onCreate: (c: Client) => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [nid, setNid] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [referral, setReferral] = useState("");
  const [tokensBought, setTokensBought] = useState(0);
  const [rating, setRating] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Name is required.");
    if (!/^01\d{9}$/.test(mobile.trim()))
      return setError("Mobile must be 11 digits starting with 01.");
    if (!nid.trim()) return setError("NID is required.");
    if (existing.some((c) => c.mobile === mobile.trim()))
      return setError("A client with that mobile already exists.");

    setSubmitting(true);
    try {
      const created = await clientsService.createClients({
        name: name.trim(),
        mobile: mobile.trim(),
        nid: nid.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        gender: gender || undefined,
        referral: referral.trim() || undefined,
        rating,
        tokensBought,
      });
      onCreate(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name" required>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Mobile" required>
          <input
            className="input"
            placeholder="01XXXXXXXXX"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </Field>
        <Field label="NID" required>
          <input className="input" value={nid} onChange={(e) => setNid(e.target.value)} required />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Address">
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Gender">
          <select
            className="input"
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
          >
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Referral mobile (optional)">
          <input className="input" value={referral} onChange={(e) => setReferral(e.target.value)} />
        </Field>
        <Field label="Initial tokens bought">
          <input
            type="number"
            min={0}
            className="input"
            value={tokensBought}
            onChange={(e) => setTokensBought(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label={`Rating: ${rating.toFixed(1)} / 5`}>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full accent-gray-900 dark:accent-white"
          />
        </Field>
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
          {submitting ? "Creating…" : "Create client"}
        </button>
      </div>
    </form>
  );
}
