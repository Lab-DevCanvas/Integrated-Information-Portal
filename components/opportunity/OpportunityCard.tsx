import Link from "next/link";
import { getSubCategoryLabel } from "@/lib/categories";
import type { Opportunity, ScoreResult } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ScoreBadge } from "./ScoreBadge";
import { DdayBadge } from "./DdayBadge";
import { EligibilityBadgeRow } from "./EligibilityBadgeRow";
import { SaveButton } from "./SaveButton";
import { CompareButton } from "./CompareButton";

interface OpportunityCardProps {
  opportunity: Opportunity;
  score?: ScoreResult;
  matchReason?: string;
}

export function OpportunityCard({ opportunity, score, matchReason }: OpportunityCardProps) {
  return (
    <Card className="group p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {score && <ScoreBadge score={score.totalScore} />}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{getSubCategoryLabel(opportunity.subCategoryId)}</span>
            <span>·</span>
            <span className="truncate">{opportunity.organizer}</span>
          </div>
          <Link href={`/opportunities/${opportunity.id}`}>
            <h3 className="mb-1.5 line-clamp-1 text-base font-bold text-slate-900 group-hover:text-indigo-700 sm:text-lg dark:text-slate-50 dark:group-hover:text-indigo-400">
              {opportunity.title}
            </h3>
          </Link>
          <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{opportunity.summary}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <SaveButton id={opportunity.id} />
          <CompareButton id={opportunity.id} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <DdayBadge applyEndDate={opportunity.applyEndDate} isAlwaysOpen={opportunity.isAlwaysOpen} />
        {score && <EligibilityBadgeRow status={score.eligibilityJudgement.overall} />}
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {opportunity.benefitDescription}
        </span>
      </div>

      {matchReason && (
        <p className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs leading-relaxed text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {matchReason}
        </p>
      )}
    </Card>
  );
}
