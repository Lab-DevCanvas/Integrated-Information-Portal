"use client";

import { Bookmark } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { IconTooltip } from "@/components/ui/IconTooltip";

export function SaveButton({ id, className = "" }: { id: string; className?: string }) {
  const saved = useAppStore((s) => s.savedIds.includes(id));
  const toggleSaved = useAppStore((s) => s.toggleSaved);

  return (
    <IconTooltip label={saved ? "북마크 해제" : "북마크에 저장"}>
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(id);
      }}
      aria-label={saved ? "저장 취소" : "저장하기"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        saved
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
      } ${className}`}
    >
      <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
    </button>
    </IconTooltip>
  );
}
