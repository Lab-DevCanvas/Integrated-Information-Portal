/**
 * Thin fetch client for the `crawling` backend (TACO InfoCroll) — a sibling repo that crawls
 * 공모전/정부정책/대외활동/채용 listings into MongoDB and serves them via FastAPI. No SDK is
 * published to npm yet (`crawling/sdk` is codegen-only and unbuilt), and a `file:` dependency on
 * the sibling repo wouldn't survive a Vercel deploy (only this repo gets checked out), so this
 * hand-written client talks to the REST API directly. See docs/crawling-integration.md.
 */

const DEFAULT_BASE_URL = "http://34.59.75.165:8000";

/** The VM's external IP is ephemeral (docs/deployment-gcp.md) — override via env if it changes. */
export function getCrawlingApiBaseUrl(): string {
  return process.env.CRAWLING_API_URL?.trim() || process.env.NEXT_PUBLIC_CRAWLING_API_URL?.trim() || DEFAULT_BASE_URL;
}

function apiUrl(path: string): URL {
  return typeof window === "undefined"
    ? new URL(path, getCrawlingApiBaseUrl())
    : new URL(`/api/crawling${path}`, window.location.origin);
}

const REQUEST_TIMEOUT_MS = 8000;

export class CrawlingApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CrawlingApiError";
    this.status = status;
  }
}

/** Mirrors `ActivityRead` in crawling/openapi.json — the unified cross-source schema. */
export interface ActivityDTO {
  id: string;
  opportunity_id?: string;
  title: string | null;
  source: string;
  source_native_id: string;
  category: string;
  detail_url: string | null;
  summary: string | null;
  period_status: string;
  period_start: string | null;
  period_end: string | null;
  raw_period_text: string | null;
  first_collected_at: string;
  last_seen_at: string;
  also_available_on: { source: string; source_native_id: string; detail_url: string | null }[];
}

export interface ActivityListResponse {
  total: number;
  items: ActivityDTO[];
}

export interface ListActivitiesParams {
  source?: string;
  category?: string;
  periodStatus?: string;
  page?: number;
  pageSize?: number;
}

async function doFetch(url: string, signal?: AbortSignal): Promise<Response> {
  signal?.throwIfAborted();
  try {
    return await fetch(url, { cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]) : AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    signal?.throwIfAborted();
    throw new CrawlingApiError(`crawling API에 연결할 수 없습니다: ${(err as Error).message}`);
  }
}

export async function listActivities(params: ListActivitiesParams = {}, signal?: AbortSignal): Promise<ActivityListResponse> {
  const url = apiUrl("/activities");
  if (params.source) url.searchParams.set("source", params.source);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.periodStatus) url.searchParams.set("period_status", params.periodStatus);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("page_size", String(params.pageSize ?? 20));

  const res = await doFetch(url.toString(), signal);
  if (!res.ok) {
    throw new CrawlingApiError(`crawling API가 오류를 반환했습니다 (${res.status})`, res.status);
  }
  return (await res.json()) as ActivityListResponse;
}

/** Used for server-side detail-page fallback lookups — returns null on 404 instead of throwing. */
export async function getActivityById(id: string): Promise<ActivityDTO | null> {
  const url = apiUrl(`/activities/${encodeURIComponent(id)}`);
  const res = await doFetch(url.toString());
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new CrawlingApiError(`crawling API가 오류를 반환했습니다 (${res.status})`, res.status);
  }
  return (await res.json()) as ActivityDTO;
}
