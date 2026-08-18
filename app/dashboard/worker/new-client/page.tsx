"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { clientsService } from "@/lib/services";
import { formatId } from "@/lib/format";

interface Form {
  name: string;
  mobile: string;
  nid: string;
  email: string;
  address: string;
  gender: "male" | "female" | "other" | "";
  referral: string;
}

const empty: Form = {
  name: "",
  mobile: "",
  nid: "",
  email: "",
  address: "",
  gender: "",
  referral: "",
};

export default function WorkerNewClientPage() {
  const [form, setForm] = useState<Form>(empty);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Name is required.");
    if (!/^01\d{9}$/.test(form.mobile.trim()))
      return setError("Mobile must be 11 digits starting with 01.");
    if (!form.nid.trim()) return setError("NID is required.");

    setSubmitting(true);
    try {
      const created = await clientsService.createClients({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        nid: form.nid.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        gender: form.gender || undefined,
        referral: form.referral.trim() || undefined,
      });
      setSaved(created.id);
      setForm(empty);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="worker">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">New client</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create an account for a walk-in customer.
        </p>
      </div>

      {saved ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Client created with ID <strong>{formatId(saved)}</strong>.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full name" required>
          <input className="input" value={form.name} onChange={update("name")} required />
        </Field>
        <Field label="Mobile number" required>
          <input className="input" value={form.mobile} onChange={update("mobile")} required />
        </Field>
        <Field label="NID" required>
          <input className="input" value={form.nid} onChange={update("nid")} required />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={update("email")} />
        </Field>
        <Field label="Address">
          <input className="input" value={form.address} onChange={update("address")} />
        </Field>
        <Field label="Gender">
          <select className="input" value={form.gender} onChange={update("gender")}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Referral mobile (optional)">
          <input className="input" value={form.referral} onChange={update("referral")} />
        </Field>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create client"}
          </button>
        </div>
      </form>
    </DashboardShell>
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
