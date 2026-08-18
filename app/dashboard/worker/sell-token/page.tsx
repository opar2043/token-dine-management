"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import { clientsService, productsService, salesService } from "@/lib/services";
import { formatId } from "@/lib/format";
import type { Client, Product } from "@/lib/types";

interface CartItem {
  productId: string;
  qty: number;
  tokensUsed: number;
}

export default function WorkerSellTokenPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [tokens, setTokens] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([
          clientsService.getClients({ limit: 200 }),
          productsService.getProducts(),
        ]);
        if (cancelled) return;
        setClients(c.items);
        setProducts(p);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const client = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  );

  // Show a client only once the typed mobile number matches one exactly.
  const matchedClients = useMemo(() => {
    const query = clientSearch.replace(/\D/g, "");
    if (!query) return [];
    return clients.filter((c) => c.mobile.replace(/\D/g, "") === query);
  }, [clients, clientSearch]);

  // Numeric value of the tokens field (empty string counts as 0).
  const tokenCount = Number(tokens) || 0;

  // Token-only accounting: how many tokens the cart consumes.
  const tokensUsed = useMemo(
    () => items.reduce((sum, item) => sum + (item.tokensUsed || 0), 0),
    [items],
  );

  // Net for this transaction only — the client's prior balance is never shown.
  const remaining = tokenCount - tokensUsed;

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { productId: products[0]?.id ?? "", qty: 1, tokensUsed: 1 },
    ]);

  const updateItem = (idx: number, patch: Partial<CartItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const finalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !client) return;
    setError(null);
    setSubmitting(true);
    try {
      if (tokenCount !== 0) {
        await salesService.createSales({
          clientId: client.id,
          workerId: user.id,
          tokens: tokenCount,
          // Amount tracked in tokens (the system's primary unit).
          amount: tokenCount,
        });
      }
      for (const item of items) {
        if (!item.productId || item.qty < 1) continue;
        await clientsService.addClientPurchase(client.id, {
          productId: item.productId,
          qty: item.qty,
          tokensUsed: item.tokensUsed,
        });
      }
      const updatedClient = await clientsService.getClient(client.id);
      setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
      setDone(`Transaction for ${client.name} saved.`);
      setTokens("");
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="worker">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sell token &amp; purchase</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Issue tokens and record the client&apos;s purchases in a single transaction.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {done ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {done}
        </div>
      ) : null}

      <form onSubmit={finalize} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,360px]">
        <div className="card space-y-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Client
            </label>
            <input
              type="search"
              inputMode="tel"
              className="input mt-1"
              placeholder={loading ? "Loading…" : "Search by mobile number…"}
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                if (clientId) setClientId("");
              }}
            />

            {client ? (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{client.mobile}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setClientId("");
                    setClientSearch("");
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-rose-500 dark:text-gray-400"
                >
                  Change
                </button>
              </div>
            ) : clientSearch.replace(/\D/g, "") ? (
              <div className="mt-2 space-y-1">
                {matchedClients.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 p-3 text-center text-sm text-gray-500 dark:border-gray-800">
                    No client matches that mobile number.
                  </p>
                ) : (
                  matchedClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClientId(c.id);
                        setClientSearch("");
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-left transition hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.mobile}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {c.balance.toLocaleString()} tkn
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tokens to sell
            </label>
            <div className="mt-1 flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => setTokens(String(tokenCount - 1))}
                className="btn-ghost w-11 shrink-0 text-lg font-semibold"
                aria-label="Decrease tokens"
              >
                −
              </button>
              <input
                type="number"
                className="input text-center"
                placeholder="0"
                value={tokens}
                onChange={(e) => setTokens(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setTokens(String(tokenCount + 1))}
                className="btn-ghost w-11 shrink-0 text-lg font-semibold"
                aria-label="Increase tokens"
              >
                +
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {tokenCount < 0
                ? `This client returns ${Math.abs(tokenCount).toLocaleString()} token(s).`
                : `Issuing ${tokenCount.toLocaleString()} token(s) to this client.`}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Items purchased
              </label>
              <button type="button" onClick={addItem} className="btn-ghost px-3 py-1.5 text-xs">
                Add item
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-gray-800">
                  No items yet — add purchases the client made with their tokens.
                </p>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr,70px,80px,80px,32px] items-center gap-2 rounded-xl border border-gray-200 p-2 dark:border-gray-800"
                  >
                    <select
                      className="input"
                      value={item.productId}
                      onChange={(e) => updateItem(idx, { productId: e.target.value })}
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
                      value={item.qty}
                      onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 1 })}
                    />
                    <input
                      type="number"
                      min={1}
                      className="input"
                      placeholder="Tokens"
                      value={item.tokensUsed}
                      onChange={(e) => updateItem(idx, { tokensUsed: Number(e.target.value) || 1 })}
                    />
                    <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-200">
                      {item.tokensUsed.toLocaleString()} tkn
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-gray-400 hover:text-rose-500"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="card h-fit space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Summary</h3>

          <Row label="Client" value={client?.name ?? "—"} />
          <Row label="Client ID" value={client ? formatId(client.id) : "—"} />
          <Row
            label={tokenCount < 0 ? "Tokens returned" : "New tokens"}
            value={
              tokenCount < 0
                ? `− ${Math.abs(tokenCount).toLocaleString()} tkn`
                : `+ ${tokenCount.toLocaleString()} tkn`
            }
          />
          <Row label="Tokens spent" value={`− ${tokensUsed.toLocaleString()} tkn`} />

          <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
            <Row
              label="Net this transaction"
              value={
                <span className={remaining < 0 ? "text-rose-600 dark:text-rose-400" : ""}>
                  {remaining.toLocaleString()} tkn
                </span>
              }
              bold
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!client || submitting || !user}
          >
            {submitting ? "Saving…" : "Finalize transaction"}
          </button>
        </aside>
      </form>
    </DashboardShell>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-gray-900 dark:text-gray-100 ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
