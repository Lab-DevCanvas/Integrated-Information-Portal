import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityDTO, ActivityListResponse } from "./crawlingClient";

const { listActivitiesMock } = vi.hoisted(() => ({ listActivitiesMock: vi.fn() }));

vi.mock("./crawlingClient", () => ({
  listActivities: listActivitiesMock,
}));

const { fetchCrawledOpportunities } = await import("./fetchCrawledOpportunities");

function makeActivity(overrides: Partial<ActivityDTO> = {}): ActivityDTO {
  return {
    id: "id-1",
    title: "활동",
    source: "linkareer",
    source_native_id: "native-1",
    category: "contest",
    detail_url: null,
    summary: "요약",
    period_status: "ongoing",
    period_start: "2026-09-01",
    period_end: "2026-09-30",
    raw_period_text: null,
    first_collected_at: "2026-08-20T00:00:00.000Z",
    last_seen_at: "2026-09-03T00:00:00.000Z",
    also_available_on: [],
    ...overrides,
  };
}

function response(items: ActivityDTO[]): ActivityListResponse {
  return { total: items.length, items };
}

describe("fetchCrawledOpportunities", () => {
  beforeEach(() => { listActivitiesMock.mockReset(); });
  it("reports complete failure instead of a successful empty list", async () => {
    listActivitiesMock.mockRejectedValue(new Error("offline"));
    await expect(fetchCrawledOpportunities()).rejects.toThrow("모든 카테고리");
  });

  it("reports the failed categories while retaining successful results", async () => {
    listActivitiesMock.mockImplementation(async ({ category }: { category: string }) => {
      if (category === "job") throw new Error("offline");
      return response([]);
    });
    const report = vi.fn();
    await fetchCrawledOpportunities(report);
    expect(report).toHaveBeenCalledWith(["job"]);
  });
  it("requests each of the four categories with a bounded page size", async () => {
    listActivitiesMock.mockResolvedValue(response([]));

    await fetchCrawledOpportunities();

    expect(listActivitiesMock).toHaveBeenCalledTimes(4);
    const requestedCategories = listActivitiesMock.mock.calls.map((call) => call[0].category).sort();
    expect(requestedCategories).toEqual(["activity", "contest", "government-policy", "job"]);
    for (const call of listActivitiesMock.mock.calls) {
      expect(call[0].pageSize).toBeLessThanOrEqual(25);
    }
  });

  it("merges and maps items from every category", async () => {
    listActivitiesMock.mockImplementation(async ({ category }: { category: string }) =>
      response([makeActivity({ id: `${category}-1`, category })]),
    );

    const result = await fetchCrawledOpportunities();

    expect(result.map((o) => o.id).sort()).toEqual(["activity-1", "contest-1", "government-policy-1", "job-1"].sort());
  });

  it("filters out expired activities before mapping", async () => {
    listActivitiesMock.mockImplementation(async ({ category }: { category: string }) =>
      response([
        makeActivity({ id: `${category}-live`, category, period_status: "ongoing" }),
        makeActivity({ id: `${category}-expired`, category, period_status: "expired" }),
      ]),
    );

    const result = await fetchCrawledOpportunities();

    expect(result.some((o) => o.id.endsWith("-expired"))).toBe(false);
    expect(result.some((o) => o.id.endsWith("-live"))).toBe(true);
  });

  it("returns partial results when one category's request fails", async () => {
    listActivitiesMock.mockImplementation(async ({ category }: { category: string }) => {
      if (category === "job") throw new Error("network blip");
      return response([makeActivity({ id: `${category}-1`, category })]);
    });

    const result = await fetchCrawledOpportunities();

    expect(result.some((o) => o.id === "job-1")).toBe(false);
    expect(result.length).toBe(3);
  });
});
