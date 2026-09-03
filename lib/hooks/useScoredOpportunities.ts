import { useMemo } from "react";
import { scoreAll } from "../scoring/score";
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
    return scoreAll(profile, list, savedIds);
  }, [hasHydrated, profile, savedIds, list]);
}
