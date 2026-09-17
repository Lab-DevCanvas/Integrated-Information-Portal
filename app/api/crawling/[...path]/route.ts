import { getCrawlingApiBaseUrl } from "@/lib/api/crawlingClient";
import { allowedCrawlingRoute } from "@/lib/api/crawlingProxy";

async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const access = allowedCrawlingRoute(path, request.method);
  if (!access) return Response.json({ detail: "지원하지 않는 경로입니다." }, { status: 404 });
  const url = new URL(`/${path.map(encodeURIComponent).join("/")}`, getCrawlingApiBaseUrl());
  const incoming = new URL(request.url);
  for (const key of ["source", "category", "period_status", "page", "page_size"]) {
    const value = incoming.searchParams.get(key);
    if (value !== null) url.searchParams.set(key, value);
  }
  try {
    const response = await fetch(url, {
      method: "GET", cache: "no-store",
      headers: { "Content-Type": "application/json" }, signal: AbortSignal.any([request.signal, AbortSignal.timeout(8000)]),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ detail: "수집 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}

export { forward as GET };
