import { useMemo } from "react";
import { OPPORTUNITIES } from "../mock/opportunities";
import { scoreAll } from "../scoring/score";
import { useAppStore } from "../store/useAppStore";
import type { Opportunity } from "../types";

export function useScoredOpportunities(source: Opportunity[] = OPPORTUNITIES) {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const hasHydrated = useAppStore((s) => s._hasHydrated);

  return useMemo(() => {
    if (!hasHydrated || !profile) return [];
    return scoreAll(profile, source, savedIds);
  }, [hasHydrated, profile, savedIds, source]);
}
