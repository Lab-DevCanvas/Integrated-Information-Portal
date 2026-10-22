import { afterEach, describe, expect, it, vi } from "vitest";
import { searchAI } from "./aiSearch";

afterEach(() => vi.unstubAllGlobals());
describe("AI search client", () => {
  it("sends bounded history without requiring a profile", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ answer: "ok", results: [] }));
    vi.stubGlobal("fetch", fetcher);
    await searchAI("추천", [], null, new AbortController().signal);
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.profile).toBeNull();
    expect(body.previous_result_ids).toEqual([]);
  });
  it("surfaces server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ detail: "호출 한도" }, { status: 429 })));
    await expect(searchAI("추천", [], null, new AbortController().signal)).rejects.toThrow("호출 한도");
  });
});

it("retains actual cards across a clarification response", async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ answer: "ok", results: [] }));
  vi.stubGlobal("fetch", fetcher);
  const messages = [
    { role: "assistant", text: "추천", aiResult: { results: [{ detail_id: "a".repeat(24) }] } },
    { role: "assistant", text: "확인 질문", aiResult: { results: [] } },
  ] as unknown as Parameters<typeof searchAI>[1];
  await searchAI("이 공고들 비교해줘", messages, null, new AbortController().signal);
  expect(JSON.parse(fetcher.mock.calls[0][1].body).previous_result_ids).toEqual(["a".repeat(24)]);
});


it.each([
  ["AI_SEARCH_BUSY", "현재 검색 요청이 많습니다", true, 429],
  ["AI_SEARCH_RATE_LIMIT", "현재 검색 요청이 많습니다", true, 429],
  ["AI_SEARCH_DAILY_LIMIT", "오늘 서비스 전체의 검색 사용량 한도에 도달했습니다. 내일 다시 이용해주세요.", false, 429],
  ["AI_SEARCH_USER_DAILY_LIMIT", "오늘 사용 가능한 검색 횟수를 모두 사용했습니다", false, 429],
  ["AI_PROVIDER_LIMIT", "AI 서비스가 일시적으로 요청을 처리하지 못하고 있습니다", true, 503],
])("handles %s without retrying automatically", async (code, message, retryable, status) => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ code, detail: "fallback" }, { status: Number(status) }));
  vi.stubGlobal("fetch", fetcher);
  await expect(searchAI("추천", [], null, new AbortController().signal)).rejects.toMatchObject({ message, code, retryable });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("handles a non-JSON proxy rate limit", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("busy", { status: 429 })));
  await expect(searchAI("추천", [], null, new AbortController().signal)).rejects.toThrow("현재 검색 요청이 많습니다");
});


it("streams fragmented Korean progress before a verified result", async () => {
  const text = 'event: progress\ndata: {"stage":"filtering"}\n\n: keepalive\n\nevent: result\ndata: {"answer":"추천 결과","results":[]}\n\n';
  const bytes = new TextEncoder().encode(text);
  const progress = vi.fn();
  const stream = new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
    controller.close();
  } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream, { headers: { "Content-Type": "text/event-stream" } })));
  const result = await searchAI("추천", [], null, new AbortController().signal, progress);
  expect(progress).toHaveBeenCalledWith("filtering");
  expect(result.answer).toBe("추천 결과");
});

it.each([
  ['event: error\ndata: {"code":"AI_SEARCH_DAILY_LIMIT","detail":"fallback"}\n\n', '오늘 서비스 전체의 검색 사용량 한도'],
  ['event: progress\ndata: {"stage":"searching"}\n\n', '검색 연결이 끊어졌습니다'],
])("handles streaming failures without treating them as answers", async (body, expected) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { headers: { "Content-Type": "text/event-stream" } })));
  await expect(searchAI("추천", [], null, new AbortController().signal)).rejects.toThrow(expected);
});
