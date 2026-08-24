"use client";

import { Bookmark } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { OPPORTUNITIES } from "@/lib/mock/opportunities";
import { computeScore } from "@/lib/scoring/score";
import { useAppStore } from "@/lib/store/useAppStore";

export default function SavedPage() {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);

  if (!profile) return null;

  const items = OPPORTUNITIES.filter((o) => savedIds.includes(o.id)).map((opportunity) => ({
    opportunity,
    score: computeScore(profile, opportunity, savedIds),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">저장한 기회</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          북마크 아이콘으로 저장한 기회 {items.length}건이에요.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="아직 저장한 기회가 없어요"
          description="마음에 드는 기회를 저장해서 모아보세요."
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
