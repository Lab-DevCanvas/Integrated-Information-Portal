import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CrawlingApiError, getActivityById, getCrawlingApiBaseUrl, listActivities } from "./crawlingClient";

function jsonResponse(body: unknown, init: { status?: number } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}

describe("getCrawlingApiBaseUrl", () => {
  const original = process.env.NEXT_PUBLIC_CRAWLING_API_URL;

  afterEach(() => {
    // Assigning `undefined` to a process.env property coerces it to the string "undefined" in
    // Node — delete instead when the var was unset, or later tests silently inherit a bad base URL.
    if (original === undefined) delete process.env.NEXT_PUBLIC_CRAWLING_API_URL;
    else process.env.NEXT_PUBLIC_CRAWLING_API_URL = original;
  });

  it("falls back to the known deployment IP when unset", () => {
    delete process.env.NEXT_PUBLIC_CRAWLING_API_URL;
    expect(getCrawlingApiBaseUrl()).toBe("http://34.59.75.165:8000");
  });

  it("uses the env override when set", () => {
    process.env.NEXT_PUBLIC_CRAWLING_API_URL = "http://localhost:8000";
    expect(getCrawlingApiBaseUrl()).toBe("http://localhost:8000");
  });
});

describe("listActivities", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the query string from the given params, defaulting page/page_size", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ total: 0, items: [] }));

    await listActivities({ category: "contest", source: "linkareer", periodStatus: "ongoing" });

    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/activities");
    expect(calledUrl.searchParams.get("category")).toBe("contest");
    expect(calledUrl.searchParams.get("source")).toBe("linkareer");
    expect(calledUrl.searchParams.get("period_status")).toBe("ongoing");
    expect(calledUrl.searchParams.get("page")).toBe("1");
    expect(calledUrl.searchParams.get("page_size")).toBe("20");
  });

  it("cancels the actual HTTP request when the caller aborts", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    }));
    const request = listActivities({}, controller.signal);
    const rejection = expect(request).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await rejection;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("does not start an already cancelled request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(listActivities({}, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the parsed response body on success", async () => {
    const body = { total: 1, items: [{ id: "abc" }] };
    fetchMock.mockResolvedValueOnce(jsonResponse(body));

    await expect(listActivities()).resolves.toEqual(body);
  });

  it("throws CrawlingApiError with the status on a non-OK response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "boom" }, { status: 500 }));

    await expect(listActivities()).rejects.toMatchObject({
      name: "CrawlingApiError",
      status: 500,
    });
  });

  it("wraps a network failure in CrawlingApiError instead of leaking the raw error", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("network down"));

    await expect(listActivities()).rejects.toBeInstanceOf(CrawlingApiError);
  });
});

describe("getActivityById", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null on a 404 instead of throwing", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "not found" }, { status: 404 }));
    await expect(getActivityById("missing-id")).resolves.toBeNull();
  });

  it("returns the activity on success", async () => {
    const activity = { id: "abc", title: "테스트" };
    fetchMock.mockResolvedValueOnce(jsonResponse(activity));
    await expect(getActivityById("abc")).resolves.toEqual(activity);
  });

  it("throws for a non-404 error status", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "boom" }, { status: 500 }));
    await expect(getActivityById("abc")).rejects.toBeInstanceOf(CrawlingApiError);
  });

  it("URL-encodes the id in the path", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "a/b" }));
    await getActivityById("a/b c");
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent("a/b c"));
  });
});
