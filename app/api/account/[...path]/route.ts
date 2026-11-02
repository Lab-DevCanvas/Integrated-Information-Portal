import { getCrawlingApiBaseUrl } from "@/lib/api/crawlingClient";
import { isAccountRoute } from "@/lib/auth/routes";

async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (!isAccountRoute(path, request.method)) return Response.json({ detail: "지원하지 않는 경로입니다." }, { status: 404 });
  const headers = new Headers({ "Content-Type": "application/json" });
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  try {
    const response = await fetch(new URL(`/${path.join("/")}`, getCrawlingApiBaseUrl()), {
      method: request.method, headers, cache: "no-store", redirect: "error",
      body: request.method === "GET" ? undefined : await request.text(),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(12000)]),
    });
    return new Response(response.status === 204 ? null : await response.text(), {
      status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch { return Response.json({ detail: "인증 서버에 연결하지 못했습니다." }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
export { forward as GET, forward as POST };
