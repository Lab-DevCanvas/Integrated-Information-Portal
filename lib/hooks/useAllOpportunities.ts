import { useEffect, useMemo } from "react";
import { OPPORTUNITIES } from "../mock/opportunities";
import { useAppStore } from "../store/useAppStore";
import type { Opportunity } from "../types";

/**
 * Curated mock data merged with live crawling-backend data (docs/crawling-integration.md).
 * Triggers the (idempotent, best-effort) fetch on first use — components render immediately with
 * curated-only data and re-render once crawled items arrive, no loading state needed.
 */
export function useAllOpportunities(): Opportunity[] {
  const crawledOpportunities = useAppStore((s) => s.crawledOpportunities);
  const crawledStatus = useAppStore((s) => s.crawledStatus);
  const loadCrawledOpportunities = useAppStore((s) => s.loadCrawledOpportunities);

  useEffect(() => {
    if (crawledStatus === "idle") void loadCrawledOpportunities();
  }, [crawledStatus, loadCrawledOpportunities]);

  return useMemo(() => [...OPPORTUNITIES, ...crawledOpportunities], [crawledOpportunities]);
}
