"use client";

import { ClipboardCheck } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { daysUntil } from "@/lib/mock/dateHelpers";
import { OPPORTUNITIES } from "@/lib/mock/opportunities";
import { computeScore } from "@/lib/scoring/score";
import { useAppStore } from "@/lib/store/useAppStore";

export default function ApplyPlanPage() {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const applyPlanIds = useAppStore((s) => s.applyPlanIds);

  if (!profile) return null;

  const items = OPPORTUNITIES.filter((o) => applyPlanIds.includes(o.id))
    .map((opportunity) => ({ opportunity, score: computeScore(profile, opportunity, savedIds) }))
    .sort((a, b) => {
      const aAlways = a.opportunity.isAlwaysOpen ? 1 : 0;
      const bAlways = b.opportunity.isAlwaysOpen ? 1 : 0;
      if (aAlways !== bAlways) return aAlways - bAlways;
      return daysUntil(a.opportunity.applyEndDate) - daysUntil(b.opportunity.applyEndDate);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">지원 계획</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          지원하기로 마음먹은 기회 {items.length}건을 마감이 가까운 순으로 모았어요.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="아직 지원 계획에 담은 기회가 없어요"
          description="상세 페이지에서 '지원 계획에 추가'를 눌러 지원할 기회를 관리해보세요."
        />
      ) : (
        <div className="space-y-3">
          {items.map(({ opportunity, score }) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} score={score} />
          ))}
        </div>
      )}
    </div>
  );
}
