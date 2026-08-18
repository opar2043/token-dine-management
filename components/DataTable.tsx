import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  rows,
  emptyMessage = "No records yet.",
}: DataTableProps<T>) {
  const alignClass = (align?: Column<T>["align"]) =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-4 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 ${alignClass(col.align)}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                >
                  {columns.map((col) => {
                    const fallback = (row as Record<string, unknown>)[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-4 text-sm text-gray-700 dark:text-gray-300 ${alignClass(col.align)}`}
                      >
                        {col.render ? col.render(row) : String(fallback ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    blocked: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    present: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    absent: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    late: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "in-stock": "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    "low-stock": "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "out-of-stock": "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    open: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    "in-progress": "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    resolved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  const cls = palette[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}
