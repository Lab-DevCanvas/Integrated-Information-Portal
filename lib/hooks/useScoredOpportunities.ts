import { useMemo } from "react";
import { presentOpportunity } from "../scoring/presentation";
import { daysUntil } from "../mock/dateHelpers";
import { useAppStore } from "../store/useAppStore";
import { useAllOpportunities } from "./useAllOpportunities";
import type { Opportunity } from "../types";

/** Defaults to curated + live crawled data merged; pass `source` to score a specific subset instead. */
export function useScoredOpportunities(source?: Opportunity[]) {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const allOpportunities = useAllOpportunities();
  const list = source ?? allOpportunities;

  return useMemo(() => {
    if (!hasHydrated || !profile) return [];
    return list.filter(o => o.isAlwaysOpen || !o.applyEndDate || daysUntil(o.applyEndDate) >= 0).map(o => presentOpportunity(o, profile, savedIds)).sort((a,b) => (b.percent ?? -1) - (a.percent ?? -1));
  }, [hasHydrated, profile, savedIds, list]);
}
