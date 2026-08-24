import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { NotificationEntry } from "@/lib/notifications";
import { daysSince } from "@/lib/mock/dateHelpers";

export function NotificationItem({ entry }: { entry: NotificationEntry }) {
  const { opportunity, score } = entry;
  const since = daysSince(opportunity.createdAt);
  const whenLabel = since <= 0 ? "오늘" : since === 1 ? "어제" : `${since}일 전`;

  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 sm:px-3 dark:hover:bg-slate-800"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{opportunity.title}</p>
          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{whenLabel}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{score.explanation}</p>
      </div>
      <span className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">{score.totalScore}%</span>
    </Link>
  );
}
