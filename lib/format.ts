export function formatDate(d?: string | Date | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return typeof d === "string" ? d : "—";
  return date.toISOString().slice(0, 10);
}

export function formatId(id?: string | null, len = 6): string {
  if (!id) return "—";
  return id.length > len ? id.slice(-len).toUpperCase() : id;
}

export function buildLookup<T extends { id: string }>(items: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items) m.set(it.id, it);
  return m;
}

export function formatBDT(amount: number): string {
  return `৳ ${amount.toLocaleString("en-BD")}`;
}

export function formatTK(amount: number): string {
  return `${amount.toLocaleString("en-BD")} TK`;
}

export function formatTokens(amount: number): string {
  return `${amount.toLocaleString("en-BD")} tkn`;
}
