import { getCrawlingApiBaseUrl } from "@/lib/api/crawlingClient";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({ detail: "JSON 요청이 필요합니다." }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ detail: "본문이 필요합니다." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      return Response.json({ detail: "요청이 너무 큽니다." }, { status: 413 });
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const body = new TextDecoder().decode(bytes);
  try { JSON.parse(body); } catch { return Response.json({ detail: "잘못된 JSON입니다." }, { status: 400 }); }
  const ragUrl = process.env.RAG_API_URL?.trim();
  const token = process.env.RAG_API_TOKEN?.trim();
  if ((process.env.VERCEL === "1" && (!ragUrl || !token)) ||
      (token && !ragUrl?.startsWith("https://"))) {
    return Response.json({ detail: "AI 검색 연결 설정을 확인해주세요." }, { status: 503 });
  }
  try {
    const response = await fetch(new URL("/ai/search", ragUrl || getCrawlingApiBaseUrl()), {
      method: "POST", headers: { "Content-Type": "application/json",
        Accept: request.headers.get("accept")?.includes("text/event-stream") ? "text/event-stream" : "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body, cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(35000)]),
    });
    return new Response(response.body, { status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
  } catch {
    return Response.json({ detail: "AI 검색 서버에 연결하지 못했습니다. 다시 시도해주세요." }, { status: 502 });
  }
}
