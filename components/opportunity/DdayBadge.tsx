import { daysUntil, formatDday } from "@/lib/mock/dateHelpers";

export function DdayBadge({ applyEndDate, isAlwaysOpen }: { applyEndDate: string; isAlwaysOpen?: boolean }) {
  const label = formatDday(applyEndDate, isAlwaysOpen);
  const remaining = daysUntil(applyEndDate);
  const urgent = !isAlwaysOpen && remaining >= 0 && remaining <= 3;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        urgent
          ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}
