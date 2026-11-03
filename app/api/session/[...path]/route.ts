/** Same-origin browser session. Only the three backend auth cookies cross the server boundary. */
const METHODS: Record<string, string[]> = {
  "auth/google/start": ["GET"],
  "auth/google/callback": ["GET"],
  "auth/refresh": ["POST"],
  "auth/logout": ["POST"],
  "accounts/me": ["GET", "PATCH", "DELETE"],
  "accounts/me/profile": ["GET", "PUT", "DELETE"],
  "accounts/me/workspace": ["GET", "PUT"],
};
const sessionCookie = /^(taco_access|taco_refresh|taco_oauth_state)=/;

async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!Object.hasOwn(METHODS, path) || !METHODS[path].includes(request.method)) {
    return new Response(null, { status: 404 });
  }
  const incoming = new URL(request.url);
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && origin !== incoming.origin) return new Response(null, { status: 403 });
  const backend = process.env.AUTH_API_URL?.trim() || "https://integrated-info.kro.kr";
  const url = new URL("/" + path, backend);
  url.search = incoming.search;
  const headers = new Headers();
  for (const key of ["origin", "content-type", "authorization"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  const cookies = (request.headers.get("cookie") || "").split(";").map(c => c.trim()).filter(c => sessionCookie.test(c));
  if (cookies.length) headers.set("cookie", cookies.join("; "));
  try {
    const upstream = await fetch(url, { method: request.method, headers, redirect: "manual", cache: "no-store",
      body: request.method === "GET" ? undefined : await request.text(),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]) });
    const out = new Headers({ "cache-control": "no-store", "referrer-policy": "no-referrer" });
    for (const key of ["location", "content-type"]) {
      const value = upstream.headers.get(key);
      if (value) out.set(key, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      if (sessionCookie.test(cookie)) out.append("set-cookie", cookie);
    }
    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch {
    return Response.json({ detail: "로그인 서버에 연결하지 못했어요." }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
