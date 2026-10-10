import { afterEach, expect, it, vi } from "vitest";
import { POST } from "./route";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("forwards the POST body and preserves errors", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ detail: "limit" }, { status: 429 }));
  vi.stubGlobal("fetch", fetcher);
  const result = await POST(new Request("http://localhost/api/ai/search", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "추천" }),
  }));
  expect(result.status).toBe(429);
  expect(fetcher.mock.calls[0][1].method).toBe("POST");
  expect(JSON.parse(fetcher.mock.calls[0][1].body).message).toBe("추천");
});
it("rejects oversized bodies before calling the backend", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const result = await POST(new Request("http://localhost/api/ai/search", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "x".repeat(65537),
  }));
  expect(result.status).toBe(413);
  expect(fetcher).not.toHaveBeenCalled();
});

it("routes AI to the dedicated backend while preserving the request", async () => {
  vi.stubEnv("RAG_API_URL", "http://127.0.0.1:18001");
  const fetcher = vi.fn().mockResolvedValue(Response.json({ answer: "ok" }));
  vi.stubGlobal("fetch", fetcher);
  await POST(new Request("http://localhost/api/ai/search", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "1번 계획", previous_result_ids: ["a".repeat(24)] }),
  }));
  expect(String(fetcher.mock.calls[0][0])).toBe("http://127.0.0.1:18001/ai/search");
  expect(JSON.parse(fetcher.mock.calls[0][1].body).previous_result_ids).toEqual(["a".repeat(24)]);
});
