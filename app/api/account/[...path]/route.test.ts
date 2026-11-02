import { afterEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
afterEach(() => vi.unstubAllGlobals());
it("forwards bearer and body without caching or following redirects", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('{"access_token":"test"}', { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  const response = await POST(new Request("http://localhost/api/account/auth/refresh", { method: "POST", headers: { authorization: "Bearer test" }, body: '{"refresh_token":"r"}' }), { params: Promise.resolve({ path: ["auth", "refresh"] }) });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(fetcher.mock.calls[0][1]).toMatchObject({ method: "POST", cache: "no-store", redirect: "error", body: '{"refresh_token":"r"}' });
  expect(fetcher.mock.calls[0][1].headers.get("authorization")).toBe("Bearer test");
});
it("rejects unlisted paths before contacting backend", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const response = await GET(new Request("http://localhost/api/account/source-configs"), { params: Promise.resolve({ path: ["source-configs"] }) });
  expect(response.status).toBe(404); expect(fetcher).not.toHaveBeenCalled();
});
it("preserves authentication rejection", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"detail":"invalid"}', { status: 401 })));
  const response = await GET(new Request("http://localhost/api/account/accounts/me"), { params: Promise.resolve({ path: ["accounts", "me"] }) });
  expect(response.status).toBe(401);
});
