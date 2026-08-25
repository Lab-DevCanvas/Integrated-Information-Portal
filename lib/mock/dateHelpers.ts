const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Returns an ISO date string offset by `offset` days from today (module-load time). */
export function daysFromNow(offset: number): string {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

export function daysUntil(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / MS_PER_DAY);
}

export function isExpired(isoDate: string): boolean {
  return daysUntil(isoDate) < 0;
}

export function formatDday(isoDate: string, isAlwaysOpen?: boolean): string {
  if (isAlwaysOpen) return "상시";
  const d = daysUntil(isoDate);
  if (d < 0) return "마감";
  if (d === 0) return "오늘 마감";
  return `D-${d}`;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** Local-calendar-day key (e.g. "2026-08-24") for grouping — accepts a Date directly so
 * calendar grid cells (built from local Date objects) never have to round-trip through ISO/UTC. */
export function dateKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysSince(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - target.getTime()) / MS_PER_DAY);
}
