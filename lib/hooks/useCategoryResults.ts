import { useMemo } from "react";
import { selectCategoryOpportunities } from "../selectCategoryOpportunities";

export function useCategoryResults({ allOpportunities, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, sortMode }: Parameters<typeof selectCategoryOpportunities>[0]) {
  return useMemo(() => selectCategoryOpportunities({ allOpportunities, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, sortMode }),
    [allOpportunities, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, sortMode]);
}
