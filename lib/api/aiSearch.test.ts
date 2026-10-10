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
