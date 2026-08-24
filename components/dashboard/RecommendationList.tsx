"use client";

import { useState } from "react";
import { SearchX } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Opportunity, ScoreResult } from "@/lib/types";

interface Props {
  items: { opportunity: Opportunity; score: ScoreResult }[];
  pageSize?: number;
}

export function RecommendationList({ items, pageSize = 8 }: Props) {
  const [visible, setVisible] = useState(pageSize);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="아직 추천할 기회가 없어요"
        description="프로필 정보를 조금 더 채워주시면 더 정확하게 찾아드릴게요."
      />
    );
  }

  const shown = items.slice(0, visible);

  return (
    <div className="space-y-3">
      {shown.map(({ opportunity, score }) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          score={score}
          matchReason={score.explanation}
        />
      ))}
      {visible < items.length && (
        <div className="pt-2 text-center">
          <Button variant="secondary" onClick={() => setVisible((v) => v + pageSize)}>
            더보기 ({items.length - visible}개 남음)
          </Button>
        </div>
      )}
    </div>
  );
}
