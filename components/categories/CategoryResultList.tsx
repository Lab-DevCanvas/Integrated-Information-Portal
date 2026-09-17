"use client";

import { useEffect, useRef, useState } from "react";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import type { Opportunity, ScoreResult } from "@/lib/types";

interface Props {
  items: { opportunity: Opportunity; score?: ScoreResult }[];
  loadingMore: boolean;
  backgroundError: string;
}

const BATCH_SIZE = 20;

/** The parent keys this list by filter/sort criteria to reset the visible count. */
export function CategoryResultList({ items, loadingMore, backgroundError }: Props) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;
    let active = true;
    const observer = new IntersectionObserver((entries) => {
      if (!active || !entries.some((entry) => entry.isIntersecting)) return;
      // One batch per observation. Re-observe after the new cards have moved the sentinel.
      active = false;
      observer.disconnect();
      setVisibleCount((count) => Math.min(count + BATCH_SIZE, items.length));
    }, { rootMargin: "0px 0px 400px 0px" });
    observer.observe(target);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [hasMore, items.length, visibleCount]);

  return (
    <div className="space-y-3">
      {items.slice(0, visibleCount).map(({ opportunity, score }) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} score={score} />
      ))}
      <div ref={sentinel} role="status" className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {hasMore ? "아래로 스크롤하면 더 볼 수 있어요."
          : loadingMore ? "추가 공고를 불러오는 중이에요…"
          : backgroundError ? "지금까지 불러온 결과를 모두 확인했어요."
          : "조건에 맞는 공고를 모두 확인했어요."}
      </div>
    </div>
  );
}
