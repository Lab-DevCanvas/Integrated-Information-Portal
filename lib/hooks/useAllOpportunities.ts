import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import type { Opportunity } from "../types";

/**
 * Live data from the crawling backend (docs/crawling-integration.md) — no curated mock data.
 * Triggers the (idempotent, best-effort) fetch on first use — components render with an empty
 * list until the fetch resolves. Pair with useCrawledStatus() to tell "still loading" apart from
 * "loaded but genuinely empty" wherever an empty list would otherwise render a "no data" message.
 */
export function useAllOpportunities(): Opportunity[] {
  const crawledOpportunities = useAppStore((s) => s.crawledOpportunities);
  const crawledStatus = useAppStore((s) => s.crawledStatus);
  const loadCrawledOpportunities = useAppStore((s) => s.loadCrawledOpportunities);

  useEffect(() => {
    if (crawledStatus === "idle") void loadCrawledOpportunities();
  }, [crawledStatus, loadCrawledOpportunities]);

  return crawledOpportunities;
}

/** True while the crawling-backend fetch hasn't resolved yet (not yet started, or in flight). */
export function useIsLoadingOpportunities(): boolean {
  const crawledStatus = useAppStore((s) => s.crawledStatus);
  return crawledStatus === "idle" || crawledStatus === "loading";
}
