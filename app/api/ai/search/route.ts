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
  try {
    const response = await fetch(new URL("/ai/search", process.env.RAG_API_URL?.trim() || getCrawlingApiBaseUrl()), {
      method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(35000)]),
    });
    return new Response(await response.text(), { status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ detail: "AI 검색 서버에 연결하지 못했습니다. 다시 시도해주세요." }, { status: 502 });
  }
}
