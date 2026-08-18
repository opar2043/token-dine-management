import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  delta?: { value: string; positive: boolean };
}

export function StatCard({ label, value, hint, delta }: StatCardProps) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">{value}</p>
        {delta ? (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
            delta.positive
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {delta.positive ? "↑" : "↓"} {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p> : null}
    </div>
  );
}
