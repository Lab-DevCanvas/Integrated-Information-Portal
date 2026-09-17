"use client";

import { Scale } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CompareRecommendationBox } from "@/components/compare/CompareRecommendationBox";
import { CompareTable } from "@/components/compare/CompareTable";
import { buildComparisonSentence } from "@/lib/compare/recommend";
import { useAllOpportunities, useIsLoadingOpportunities } from "@/lib/hooks/useAllOpportunities";
import { computeScore } from "@/lib/scoring/score";
import { useAppStore } from "@/lib/store/useAppStore";

export default function ComparePage() {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const compareIds = useAppStore((s) => s.compareIds);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const allOpportunities = useAllOpportunities();
  const isLoading = useIsLoadingOpportunities();

  if (!profile) return null;

  const entries = compareIds
    .map((id) => allOpportunities.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((opportunity) => ({ opportunity, score: computeScore(profile, opportunity, savedIds) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">비교하기</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">담아둔 기회들을 나란히 비교해보세요.</p>
        </div>
        {entries.length > 0 && (
          <Button variant="secondary" size="sm" onClick={clearCompare}>
            비우기
          </Button>
        )}
      </div>

      {entries.length < 2 ? (
        isLoading && compareIds.length >= 2 ? (
          <LoadingState title="비교할 기회를 불러오는 중이에요" />
        ) : (
          <EmptyState
            icon={Scale}
            title="비교할 기회를 2개 이상 담아주세요"
            description="기회 카드의 저울 아이콘을 눌러 비교함에 추가할 수 있어요."
          />
        )
      ) : (
        <>
          <CompareRecommendationBox sentence={buildComparisonSentence(entries)} />
          <CompareTable entries={entries} />
        </>
      )}
    </div>
  );
}
