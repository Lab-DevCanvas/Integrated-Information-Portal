import { useInterestSimilarities } from "./useInterestSimilarities";
import { useMemo } from "react";
import { selectCategoryOpportunities } from "../selectCategoryOpportunities";

export function useCategoryResults({ allOpportunities, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, includeExpired, sortMode }: Parameters<typeof selectCategoryOpportunities>[0]) {
  const enriched = useInterestSimilarities(allOpportunities, profile);
  return useMemo(() => selectCategoryOpportunities({ allOpportunities: enriched, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, includeExpired, sortMode }),
    [enriched, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, includeExpired, sortMode]);
}
