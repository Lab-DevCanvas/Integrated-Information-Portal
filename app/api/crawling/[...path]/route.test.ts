import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("crawling route handler", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("CRAWLING_API_URL", "http://backend.test:8000");
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  const params = (path: string[]) => ({ params: Promise.resolve({ path }) });
  it("forwards public query filters without leaking unrelated parameters or headers", async () => {
    fetchMock.mockResolvedValue(new Response('{"total":0,"items":[]}'));
    const result = await GET(new Request("http://frontend.test/api/crawling/activities?category=contest&page=2&secret=private"), params(["activities"]));
    expect(result.status).toBe(200);
    expect(fetchMock.mock.calls[0][0].toString()).toBe("http://backend.test:8000/activities?category=contest&page=2");
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
  });
  it("rejects removed operations routes before reaching the backend", async () => {
    for (const path of [["source-configs"], ["crawl-jobs", "123"], ["raw", "linkareer"], ["health"]]) {
      const result = await GET(new Request(`http://frontend.test/api/crawling/${path.join("/")}`), params(path));
      expect(result.status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("preserves upstream not-found responses", async () => {
    fetchMock.mockResolvedValue(new Response('{"detail":"not found"}', { status: 404 }));
    const result = await GET(new Request("http://frontend.test/api/crawling/activities/missing"), params(["activities", "missing"]));
    expect(result.status).toBe(404);
    expect(await result.json()).toEqual({ detail: "not found" });
  });
  it("propagates a disconnected request to the backend fetch", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation((_url, options) => {
      controller.abort();
      expect(options.signal.aborted).toBe(true);
      return Promise.reject(options.signal.reason);
    });
    await GET(new Request("http://frontend.test/api/crawling/activities", { signal: controller.signal }), params(["activities"]));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("returns an explicit gateway failure for an unreachable backend", async () => {
    fetchMock.mockRejectedValue(new TypeError("network"));
    expect((await GET(new Request("http://frontend.test/api/crawling/activities"), params(["activities"]))).status).toBe(502);
  });
});
