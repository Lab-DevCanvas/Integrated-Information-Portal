import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityDTO } from "./crawlingClient";

const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("./crawlingClient", () => ({ listActivities: list }));
let fetchCategoryOpportunities: typeof import("./fetchCategoryOpportunities").fetchCategoryOpportunities;

const activity = (id: string): ActivityDTO => ({ id, title: id, category: "contest", source: "linkareer", source_native_id: id, summary: null, detail_url: null, period_status: "unknown", period_start: null, period_end: null, raw_period_text: null, first_collected_at: "2026-09-01", last_seen_at: "2026-09-01", also_available_on: [] });

describe("category browsing across API pages", () => {
  beforeEach(async () => {
    list.mockReset();
    vi.resetModules();
    ({ fetchCategoryOpportunities } = await import("./fetchCategoryOpportunities"));
  });
  afterEach(() => vi.useRealTimers());
  it("includes later pages for category filtering and deduplicates repeated IDs", async () => {
    list.mockImplementation(async ({ page }) => ({ total: 201, items: [activity("shared"), activity(`page-${page}`)] }));
    const result = await fetchCategoryOpportunities({ source: "linkareer", periodStatus: "unknown" });
    expect(result.map((item) => item.id)).toEqual(["shared", "page-1", "page-2", "page-3"]);
    expect(list).toHaveBeenCalledWith({ source: "linkareer", periodStatus: "unknown", page: 3, pageSize: 100 }, expect.any(AbortSignal));
  });
  it("does not show an incomplete result as the full filtered count", async () => {
    list.mockResolvedValueOnce({ total: 101, items: [activity("one")] }).mockRejectedValueOnce(new Error("offline"));
    await expect(fetchCategoryOpportunities({})).rejects.toThrow("offline");
  });
  it("stops requesting more pages after the filter request is cancelled", async () => {
    const controller = new AbortController();
    list.mockImplementation(async () => { controller.abort(); return { total: 201, items: [] }; });
    await expect(fetchCategoryOpportunities({}, controller.signal)).rejects.toThrow();
    expect(list).toHaveBeenCalledTimes(1);
  });
});


describe("category request scheduling and cache", () => {
  beforeEach(async () => {
    list.mockReset();
    vi.resetModules();
    ({ fetchCategoryOpportunities } = await import("./fetchCategoryOpportunities"));
  });
  afterEach(() => vi.useRealTimers());

  it("reuses complete results by source/status and expires them after a minute", async () => {
    vi.useFakeTimers();
    list.mockResolvedValue({ total: 1, items: [activity("one")] });
    const first = await fetchCategoryOpportunities({});
    expect(await fetchCategoryOpportunities({ source: "", periodStatus: "" })).toBe(first);
    expect(list).toHaveBeenCalledTimes(1);
    await fetchCategoryOpportunities({ source: "linkareer" });
    await fetchCategoryOpportunities({ periodStatus: "ongoing" });
    expect(list).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(60_001);
    await fetchCategoryOpportunities({});
    expect(list).toHaveBeenCalledTimes(4);
  });

  it("does not cache failures or cancelled results", async () => {
    list.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchCategoryOpportunities({})).rejects.toThrow("offline");
    const controller = new AbortController();
    list.mockImplementationOnce(async () => {
      controller.abort();
      return { total: 1, items: [activity("cancelled")] };
    });
    await expect(fetchCategoryOpportunities({}, controller.signal)).rejects.toThrow();
    list.mockResolvedValueOnce({ total: 1, items: [activity("fresh")] });
    expect((await fetchCategoryOpportunities({}))[0].id).toBe("fresh");
    expect(list).toHaveBeenCalledTimes(3);
  });

  it("keeps four workers busy without waiting for a slow page and preserves page order", async () => {
    const pending = new Map<number, (result: { total: number; items: ActivityDTO[] }) => void>();
    list.mockImplementation(({ page, pageSize }) => pageSize === 20
      ? Promise.resolve({ total: 601, items: [activity("page-1")] })
      : new Promise((resolve) => pending.set(page, resolve)));
    const result = fetchCategoryOpportunities({});
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(5));
    pending.get(3)!({ total: 601, items: [activity("page-3")] });
    await vi.waitFor(() => expect(pending.has(5)).toBe(true));
    expect(pending.has(6)).toBe(false);
    pending.get(5)!({ total: 601, items: [activity("page-5")] });
    await vi.waitFor(() => expect(pending.has(6)).toBe(true));
    pending.get(6)!({ total: 601, items: [activity("page-6")] });
    await vi.waitFor(() => expect(pending.has(7)).toBe(true));
    for (const page of [7, 4, 2, 1]) pending.get(page)!({ total: 601, items: [activity(`page-${page}`)] });
    expect((await result).map((item) => item.id)).toEqual(Array.from({ length: 7 }, (_, index) => `page-${index + 1}`));
  });

  it("aborts sibling requests if one page fails", async () => {
    const signals: AbortSignal[] = [];
    list.mockImplementation(async ({ page }, signal) => {
      signals.push(signal);
      if (page === 1) return { total: 401, items: [] };
      if (page === 2) throw new Error("page failed");
      return new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
    });
    await expect(fetchCategoryOpportunities({})).rejects.toThrow("page failed");
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
});


describe("progressive category loading", () => {
  beforeEach(async () => {
    list.mockReset();
    vi.resetModules();
    ({ fetchCategoryOpportunities } = await import("./fetchCategoryOpportunities"));
  });

  it("publishes the first 20 and total while background requests are still pending", async () => {
    const rows = Array.from({ length: 221 }, (_, index) => activity(String(index)));
    const pending = new Map<number, (value: { total: number; items: ActivityDTO[] }) => void>();
    list.mockImplementation(({ page, pageSize }) => pageSize === 20
      ? Promise.resolve({ total: rows.length, items: rows.slice(0, 20) })
      : new Promise((resolve) => pending.set(page, resolve)));
    const progress = vi.fn();
    const loading = fetchCategoryOpportunities({}, undefined, progress);
    await vi.waitFor(() => expect(pending.size).toBe(3));
    expect(list.mock.calls[0][0]).toEqual({ page: 1, pageSize: 20 });
    expect(progress).toHaveBeenCalledTimes(1);
    expect(progress.mock.calls[0][0]).toMatchObject({ total: 221, complete: false });
    expect(progress.mock.calls[0][0].items).toHaveLength(20);

    // A later API page may finish first; retain the first 20 until page 1 replaces them.
    pending.get(2)!({ total: 221, items: rows.slice(100, 200) });
    await vi.waitFor(() => expect(progress).toHaveBeenCalledTimes(2));
    expect(progress.mock.calls[1][0].items).toHaveLength(120);
    pending.get(1)!({ total: 221, items: rows.slice(0, 100) });
    pending.get(3)!({ total: 221, items: rows.slice(200) });
    const result = await loading;
    expect(result.map((item) => item.id)).toEqual(rows.map((item) => item.id));
    expect(progress.mock.lastCall![0]).toMatchObject({ total: 221, complete: true });

    const cachedProgress = vi.fn();
    expect(await fetchCategoryOpportunities({}, undefined, cachedProgress)).toBe(result);
    expect(cachedProgress).toHaveBeenCalledWith({ items: result, total: 221, complete: true });
    expect(list).toHaveBeenCalledTimes(4);
  });

  it("finishes small collections after the first request", async () => {
    list.mockResolvedValue({ total: 0, items: [] });
    const progress = vi.fn();
    await expect(fetchCategoryOpportunities({}, undefined, progress)).resolves.toEqual([]);
    expect(progress).toHaveBeenCalledWith({ items: [], total: 0, complete: true });
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("reports a background failure without retracting the first results or caching them", async () => {
    list.mockResolvedValueOnce({ total: 101, items: [activity("first")] }).mockRejectedValue(new Error("offline"));
    const progress = vi.fn();
    await expect(fetchCategoryOpportunities({}, undefined, progress)).rejects.toThrow("offline");
    expect(progress).toHaveBeenCalledTimes(1);
    expect(progress.mock.calls[0][0].items[0].id).toBe("first");
    expect(progress.mock.calls[0][0].complete).toBe(false);
    list.mockReset();
    list.mockResolvedValue({ total: 1, items: [activity("fresh")] });
    expect((await fetchCategoryOpportunities({}))[0].id).toBe("fresh");
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("never publishes a late background response after cancellation", async () => {
    const controller = new AbortController();
    const progress = vi.fn();
    list.mockResolvedValueOnce({ total: 21, items: [activity("first")] });
    list.mockImplementationOnce(async () => {
      controller.abort();
      return { total: 21, items: [activity("late")] };
    });
    await expect(fetchCategoryOpportunities({}, controller.signal, progress)).rejects.toThrow();
    expect(progress).toHaveBeenCalledTimes(1);
    expect(progress.mock.calls[0][0].items[0].id).toBe("first");
  });
});
