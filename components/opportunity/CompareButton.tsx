"use client";

import { Scale } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { COMPARE_MAX } from "@/lib/constants";
import { IconTooltip } from "@/components/ui/IconTooltip";

export function CompareButton({ id, className = "" }: { id: string; className?: string }) {
  const comparing = useAppStore((s) => s.compareIds.includes(id));
  const compareCount = useAppStore((s) => s.compareIds.length);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const atMax = compareCount >= COMPARE_MAX && !comparing;

  return (
    <IconTooltip label={atMax ? `최대 ${COMPARE_MAX}개까지 비교할 수 있어요` : comparing ? "비교함에서 제거" : "비교함에 추가"}>
    <button
      type="button"
      disabled={atMax}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(id);
      }}
      aria-label={comparing ? "비교함에서 제거" : "비교함에 추가"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        comparing
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
      } ${className}`}
    >
      <Scale className="h-4 w-4" />
    </button>
    </IconTooltip>
  );
}
