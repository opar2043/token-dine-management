export type RangePreset = "all" | "day" | "month" | "year" | "custom";

export interface DateRange {
  preset: RangePreset;
  /** ISO yyyy-mm-dd — only used when preset === "custom". */
  from?: string;
  to?: string;
}

export const ALL_RANGE: DateRange = { preset: "all" };

/**
 * Resolves a DateRange into concrete inclusive bounds.
 * Returns null bounds when unconstrained.
 */
export function rangeBounds(range: DateRange): { from: Date | null; to: Date | null } {
  const now = new Date();

  if (range.preset === "day") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (range.preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }

  if (range.preset === "year") {
    const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { from, to };
  }

  if (range.preset === "custom") {
    const from = range.from ? new Date(`${range.from}T00:00:00`) : null;
    const to = range.to ? new Date(`${range.to}T23:59:59.999`) : null;
    return { from, to };
  }

  return { from: null, to: null };
}

/** True when the given date string falls inside the range. */
export function inRange(dateStr: string | undefined | null, range: DateRange): boolean {
  if (range.preset === "all") return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const { from, to } = rangeBounds(range);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

/** ISO yyyy-mm-dd bounds for sending to the backend (undefined when open). */
export function rangeQuery(range: DateRange): { from?: string; to?: string } {
  const { from, to } = rangeBounds(range);
  return {
    from: from ? from.toISOString() : undefined,
    to: to ? to.toISOString() : undefined,
  };
}
