import Link from "next/link";
import { DdayBadge } from "@/components/opportunity/DdayBadge";
import { ScoreBadge } from "@/components/opportunity/ScoreBadge";
import type { Opportunity, ScoreResult } from "@/lib/types";

export function ChatResultCard({ opportunity, score }: { opportunity: Opportunity; score: ScoreResult }) {
  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
    >
      <ScoreBadge score={score.totalScore} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{opportunity.title}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {opportunity.organizer} · {opportunity.benefitDescription}
        </p>
      </div>
      <DdayBadge applyEndDate={opportunity.applyEndDate} isAlwaysOpen={opportunity.isAlwaysOpen} />
    </Link>
  );
}
