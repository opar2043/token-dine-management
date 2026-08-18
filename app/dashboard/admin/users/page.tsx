"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { PlusIcon, TrashIcon, CheckIcon, BanIcon } from "@/components/icons";
import { clientsService, usersService } from "@/lib/services";
import { formatDate, formatId } from "@/lib/format";
import type { Client, Role, User } from "@/lib/types";

type CreateRole = "client" | "manager" | "worker";
type RoleFilter = "all" | Role;

const userColumns: Column<User>[] = [
  { key: "id", header: "ID", render: (u) => formatId(u.id) },
  { key: "name", header: "Name" },
  { key: "role", header: "Role", render: (u) => <span className="capitalize">{u.role}</span> },
  { key: "email", header: "Email", render: (u) => u.email ?? "—" },
  { key: "mobile", header: "Mobile", render: (u) => u.mobile ?? "—" },
  { key: "joinedOn", header: "Joined", render: (u) => formatDate(u.joinedOn ?? u.createdAt) },
  { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, c] = await Promise.all([
          usersService.getUsers({ limit: 100 }),
          clientsService.getClients({ limit: 100 }),
        ]);
        if (cancelled) return;
        setUsers(u.items);
        setClients(c.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateStaff = (u: User) => {
    setUsers((prev) => [u, ...prev]);
    setFlash(`${u.role === "manager" ? "Manager" : "Worker"} ${u.name} added to Users.`);
    setOpen(false);
  };

  const handleCreateClient = (c: Client) => {
    setClients((prev) => [c, ...prev]);
    setFlash(`Client ${c.name} added (visible in the Clients tab).`);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await usersService.deleteUsers(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setFlash("User deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    try {
      await usersService.updateUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const filteredUsers = useMemo(
    () => (roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter)),
    [users, roleFilter],
  );

  const roleFilters: { value: RoleFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "worker", label: "Worker" },
  ];

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage admins, managers, workers, and add new clients.
          </p>
        </div>
        <button type="button" className="btn-primary gap-1.5" onClick={() => setOpen(true)}>
          <PlusIcon /> Add user
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Filter by role
        </span>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
          {roleFilters.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRoleFilter(r.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                roleFilter === r.value
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {flash ? (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <span>{flash}</span>
          <button onClick={() => setFlash(null)} className="text-emerald-700 dark:text-emerald-200">
            ✕
          </button>
        </div>
      ) : null}

      <DataTable<User>
        columns={[
          ...userColumns,
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (u) => (
              <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                <button 
                  onClick={() => handleToggleStatus(u)}
                  title={u.status === "active" ? "Block" : "Activate"}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
                >
                  {u.status === "active" ? <BanIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  title="Delete"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )
          }
        ]}
        rows={filteredUsers}
        emptyMessage={loading ? "Loading users…" : "No users found."}
      />

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Showing {filteredUsers.length} of {users.length} system user(s). Clients ({clients.length})
        live on the <strong>Clients</strong> page.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Add user"
        description="Pick a role — fields adapt automatically."
      >
        <CreateForm
          existingUsers={users}
          existingClients={clients}
          onCreateStaff={handleCreateStaff}
          onCreateClient={handleCreateClient}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </DashboardShell>
  );
}

/* ------------------------------------------------------------------ */

function CreateForm({
  existingUsers,
  existingClients,
  onCreateStaff,
  onCreateClient,
  onCancel,
}: {
  existingUsers: User[];
  existingClients: Client[];
  onCreateStaff: (u: User) => void;
  onCreateClient: (c: Client) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState<CreateRole>("client");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"active" | "blocked">("active");
  const [nid, setNid] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [referral, setReferral] = useState("");
  const [tokensBought, setTokensBought] = useState(0);
  const [rating, setRating] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isClient = role === "client";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^01\d{9}$/.test(mobile.trim())) {
      setError("Mobile must be 11 digits starting with 01.");
      return;
    }

    setSubmitting(true);

    try {
      if (isClient) {
        if (!nid.trim()) {
          setError("NID is required for clients.");
          return;
        }
        if (existingClients.some((c) => c.mobile === mobile.trim())) {
          setError("A client with that mobile already exists.");
          return;
        }
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
        onCreateClient(created);
        return;
      }

      if (!password || password.length < 4) {
        setError("Password / PIN must be at least 4 characters.");
        return;
      }
      if (existingUsers.some((u) => u.mobile === mobile.trim())) {
        setError("A staff user with that mobile already exists.");
        return;
      }
      const created = await usersService.createUsers({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        password,
        role,
        status,
      });
      onCreateStaff(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
        {(["client", "manager", "worker"] as CreateRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
              role === r
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name" required>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Mobile number" required>
          <input
            className="input"
            placeholder="01XXXXXXXXX"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </Field>
        <Field label={isClient ? "Email" : "Email (optional)"}>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        {isClient ? (
          <>
            <Field label="NID" required>
              <input className="input" value={nid} onChange={(e) => setNid(e.target.value)} required />
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
          </>
        ) : (
          <>
            <Field label={role === "manager" ? "Password" : "Password / PIN"} required>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
              />
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "blocked")}
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </Field>
          </>
        )}
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
          {submitting ? "Creating…" : `Create ${role}`}
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
