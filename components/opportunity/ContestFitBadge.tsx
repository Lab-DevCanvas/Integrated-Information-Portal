import type { ContestFit } from "@/lib/scoring/contestFit";

export function ContestFitBadge({ fit }: { fit: ContestFit }) {
  return (
    <div className="mt-3 text-sm">
      <span className="inline-flex gap-2 rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
        {fit.label} <strong>{fit.percent}%</strong>
      </span>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{fit.explanation}</p>
    </div>
  );
}
