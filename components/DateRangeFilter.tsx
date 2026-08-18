"use client";

import type { DateRange, RangePreset } from "@/lib/dateRange";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets: { value: RangePreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const setPreset = (preset: RangePreset) => {
    if (preset === "custom") {
      onChange({ preset, from: value.from, to: value.to });
    } else {
      onChange({ preset });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreset(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              value.preset === p.value
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value.preset === "custom" ? (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={value.from ?? ""}
            onChange={(e) => onChange({ preset: "custom", from: e.target.value, to: value.to })}
            className="input h-8 px-2 py-1 text-xs"
            aria-label="From date"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={value.to ?? ""}
            onChange={(e) => onChange({ preset: "custom", from: value.from, to: e.target.value })}
            className="input h-8 px-2 py-1 text-xs"
            aria-label="To date"
          />
        </div>
      ) : null}
    </div>
  );
}
