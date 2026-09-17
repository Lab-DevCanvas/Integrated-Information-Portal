"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAllOpportunities } from "@/lib/hooks/useAllOpportunities";
import { COMPARE_MAX } from "@/lib/constants";

export function CompareTray() {
  const compareIds = useAppStore((s) => s.compareIds);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  if (!hasHydrated || compareIds.length === 0) return null;
  return <ActiveCompareTray compareIds={compareIds} clearCompare={clearCompare} />;
}

function ActiveCompareTray({ compareIds, clearCompare }: { compareIds: string[]; clearCompare: () => void }) {
  const allOpportunities = useAllOpportunities();

  const titles = compareIds
    .map((id) => allOpportunities.find((o) => o.id === id)?.title)
    .filter((t): t is string => Boolean(t));

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:bottom-0 dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Scale className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p className="truncate text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">{compareIds.length}개</span> 비교 중 · {titles.join(", ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={clearCompare}
            className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            비우기
          </button>
          <Link
            href="/compare"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            비교하기 ({compareIds.length}/{COMPARE_MAX})
          </Link>
        </div>
      </div>
    </div>
  );
}
