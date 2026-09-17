import { listActivities, type ActivityDTO } from "./crawlingClient";
import { mapActivityToOpportunity } from "./mapActivityToOpportunity";
import type { Opportunity } from "../types";

/**
 * The crawling API has no `sort` param, and Mongo's natural order happens to surface almost
 * exclusively "government-policy" items on page 1 (~1000 of the ~1100 total activities are
 * youthcenter/bokjiro policies) — fetching one unfiltered page would show zero contests/jobs/
 * activities. Fetching a fixed quota per category instead guarantees a mixed, representative
 * sample and keeps the total bounded (see docs/crawling-integration.md "가져오는 데이터 범위").
 */
const CATEGORIES = ["contest", "government-policy", "activity", "job"] as const;
const PER_CATEGORY_LIMIT = 25;

export async function fetchCrawledOpportunities(onPartialFailure?: (categories: string[]) => void): Promise<Opportunity[]> {
  const results = await Promise.allSettled(
    CATEGORIES.map((category) => listActivities({ category, pageSize: PER_CATEGORY_LIMIT })),
  );

  const activities: ActivityDTO[] = [];
  const failedCategories = CATEGORIES.filter((_, index) => results[index].status === "rejected");
  if (failedCategories.length === CATEGORIES.length) throw new Error("모든 카테고리 조회에 실패했습니다.");
  onPartialFailure?.(failedCategories);
  for (const result of results) {
    // A single category request failing (timeout, transient 5xx) shouldn't drop the other three —
    // partial live data is better than none.
    if (result.status === "fulfilled") activities.push(...result.value.items);
  }

  return activities.filter((a) => a.period_status !== "expired").map(mapActivityToOpportunity);
}
