import { listActivities, type ActivityDTO, type ListActivitiesParams } from "./crawlingClient";
import { mapActivityToOpportunity } from "./mapActivityToOpportunity";
import type { Opportunity } from "../types";

export interface CategoryProgress {
  items: Opportunity[];
  total: number;
  complete: boolean;
}

// Only complete results are cached so a failed background load is retried on the next visit.
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 6;
const cache = new Map<string, { expiresAt: number; items: Opportunity[]; total: number }>();

/** Show 20 items first, then progressively load the remainder with four background workers. */
export async function fetchCategoryOpportunities(
  params: Pick<ListActivitiesParams, "source" | "periodStatus">,
  signal?: AbortSignal,
  onProgress?: (progress: CategoryProgress) => void,
) {
  signal?.throwIfAborted();
  const key = JSON.stringify([params.source || "", params.periodStatus || ""]);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    onProgress?.({ items: cached.items, total: cached.total, complete: true });
    return cached.items;
  }
  cache.delete(key);

  const controller = new AbortController();
  const requestSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  try {
    const first = await listActivities({ ...params, page: 1, pageSize: 20 }, requestSignal);
    requestSignal.throwIfAborted();
    let items = first.items.map(mapActivityToOpportunity);
    onProgress?.({ items, total: first.total, complete: first.total <= 20 });

    if (first.total > 20) {
      // page_size changes the offset: reload page 1 at size 100 to include rows 21–100.
      // This overlaps only the initial 20 rows, avoiding a fivefold increase in request count.
      const pageCount = Math.ceil(first.total / 100);
      const pages: ActivityDTO[][] = [];
      let nextPage = 1;
      let completedPages = 0;
      async function worker() {
        while (nextPage <= pageCount) {
          requestSignal.throwIfAborted();
          const page = nextPage++;
          const result = await listActivities({ ...params, page, pageSize: 100 }, requestSignal);
          requestSignal.throwIfAborted();
          pages[page - 1] = result.items;
          completedPages++;
          // Keep the initial cards until the larger first page arrives. Flatten by API page,
          // not completion order, and deduplicate the initial overlap and changing API pages.
          const loaded = pages[0] ? pages.flat() : [...first.items, ...pages.flat()];
          items = [...new Map(loaded.map((item) => [item.id, mapActivityToOpportunity(item)])).values()];
          onProgress?.({ items, total: first.total, complete: completedPages === pageCount });
        }
      }
      await Promise.all(Array.from({ length: Math.min(4, pageCount) }, worker));
    }
    requestSignal.throwIfAborted();
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, items, total: first.total });
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
    return items;
  } catch (error) {
    controller.abort();
    throw error;
  }
}
