"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { analyticsService, usersService } from "@/lib/services";
import { formatDate, formatId } from "@/lib/format";
import { ALL_RANGE, inRange, type DateRange } from "@/lib/dateRange";
import type { AnalyticsOverview, User } from "@/lib/types";

const userColumns: Column<User>[] = [
  { key: "id", header: "ID", render: (u) => formatId(u.id) },
  { key: "name", header: "Name" },
  { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
  { key: "contact", header: "Contact", render: (u) => u.email ?? u.mobile ?? "—" },
  { key: "joinedOn", header: "Joined", render: (u) => formatDate(u.joinedOn ?? u.createdAt) },
  { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
];

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>(ALL_RANGE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ov, usersRes] = await Promise.all([
          analyticsService.getOverview(),
          usersService.getUsers({ limit: 100 }),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setUsers(usersRes.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Token-only system: headline figures are tokens, not BDT.
  const totalTokens = overview?.tokens?.total ?? 0;
  const dailyTokens = overview?.tokens?.day ?? 0;
  const weeklyTokens = overview?.tokens?.week ?? 0;
  const monthlyTokens = overview?.tokens?.month ?? 0;

  const totalClients = overview?.activeClients ?? 0;
  const totalWorkers = users.filter((u) => u.role === "worker").length;
  const totalTokensSold = overview?.tokensSold ?? 0;
  // Product margin stays in BDT (used for product profitability only).
  const profit = overview?.profitEstimate ?? 0;
  const referralCount = overview?.referralCount ?? 0;
  const lowStock = overview?.stockAlerts ?? 0;
  const totalProducts = overview?.totalProducts ?? 0;

  const filteredUsers = useMemo(
    () => users.filter((u) => inRange(u.joinedOn ?? u.createdAt, range)),
    [users, range],
  );

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Full visibility into revenue, users, inventory and operations.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tokens" value={totalTokens.toLocaleString()} hint="All time" />
        <StatCard label="Daily Tokens" value={dailyTokens.toLocaleString()} hint="Today" />
        <StatCard label="Weekly Tokens" value={weeklyTokens.toLocaleString()} hint="Last 7 days" />
        <StatCard label="Monthly Tokens" value={monthlyTokens.toLocaleString()} hint="This month" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Clients" value={totalClients} hint="With token balance" />
        <StatCard label="Total Workers" value={totalWorkers} />
        <StatCard label="Tokens Sold" value={totalTokensSold} hint="All workers" />
        <StatCard label="Stock Alerts" value={lowStock} hint="Low or out of stock" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Product Margin (est.)" value={`৳ ${profit.toLocaleString()}`} hint="Selling − cost basis" />
        <StatCard label="Referrals" value={referralCount} hint="Clients invited by others" />
        <StatCard label="Total Products" value={totalProducts} hint="Menu items" />
        <StatCard label="Client Referrals" value={referralCount} hint="Referred by others" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All system users</h2>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        <DataTable<User>
          columns={userColumns}
          rows={filteredUsers}
          emptyMessage={loading ? "Loading users…" : "No users in this range."}
        />
      </section>
    </DashboardShell>
  );
}
