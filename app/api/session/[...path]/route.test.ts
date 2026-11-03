import { afterEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
afterEach(() => vi.unstubAllGlobals());
it("returns both HttpOnly session cookies on the frontend callback without following the redirect", async () => {
  const headers = new Headers({ location: "https://app.test/" });
  headers.append("set-cookie", "taco_access=a; HttpOnly; Path=/; Secure");
  headers.append("set-cookie", "taco_refresh=r; HttpOnly; Path=/; Secure");
  const send = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers }));
  vi.stubGlobal("fetch", send);
  const request = new Request("https://app.test/api/session/auth/google/callback?code=test&state=state", {
    headers: { cookie: "unrelated=private; taco_oauth_state=state" },
  });
  const response = await GET(request, { params: Promise.resolve({ path: ["auth","google","callback"] }) });
  const [url, init] = send.mock.calls[0];
  expect(url.search).toBe("?code=test&state=state");
  expect(init.headers.get("cookie")).toBe("taco_oauth_state=state");
  expect(init.redirect).toBe("manual");
  expect(response.headers.getSetCookie()).toEqual(headers.getSetCookie());
  expect(response.headers.get("location")).toBe("https://app.test/");
  expect(response.status).toBe(302);
});
it("rejects a cross-origin authenticated write before forwarding cookies", async () => {
  const send = vi.fn(); vi.stubGlobal("fetch", send);
  const response = await POST(new Request("https://app.test/api/session/auth/logout", {
    method: "POST", headers: { origin: "https://other.test", cookie: "taco_refresh=r" },
  }), { params: Promise.resolve({ path: ["auth","logout"] }) });
  expect(response.status).toBe(403);
  expect(send).not.toHaveBeenCalled();
});
