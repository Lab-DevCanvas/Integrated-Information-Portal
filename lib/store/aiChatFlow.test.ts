import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAppStore } from "./useAppStore";
import type { AISearchResult } from "../api/aiSearch";

const ids = ["a".repeat(24), "b".repeat(24)];
function result(mode: string, selected = ids): AISearchResult {
  return {
    request_id: `test-${mode}`, as_of: "2026-10-08T12:00:00Z", status: "ok",
    answer: `${mode} 응답`, mode, retrieval_mode: "hybrid", warnings: [],
    results: selected.map((detail_id) => ({
      detail_id, title: `공고 ${detail_id}`, organization: null, benefits: [],
      period_end: null, source_url: null, recommendation_reason: "테스트 근거",
      eligibility_status: "unknown", citation_ids: [],
    })),
    citations: [], comparisons: [], plan: [],
  };
}

beforeEach(() => {
  useAppStore.setState({ conversations: [], activeConversationId: null, pendingChats: {}, profile: null });
});
afterEach(() => vi.unstubAllGlobals());

it("preserves displayed card order through recommendation, comparison and plan requests", async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(Response.json(result("recommend")))
    .mockResolvedValueOnce(Response.json(result("compare")))
    .mockResolvedValueOnce(Response.json(result("plan", [ids[1]])));
  vi.stubGlobal("fetch", fetcher);
  await useAppStore.getState().sendMessage("공모전 추천해줘");
  await useAppStore.getState().sendMessage("방금 추천한 공고들을 비교해줘");
  await useAppStore.getState().sendMessage("두 번째 공고 지원 계획을 만들어줘");
  const requests = fetcher.mock.calls.map((call) => JSON.parse(call[1].body));
  expect(requests[0].previous_result_ids).toEqual([]);
  expect(requests[1].previous_result_ids).toEqual(ids);
  expect(requests[2].previous_result_ids).toEqual(ids);
  expect(requests[2].history.map((message: { text: string }) => message.text)).toEqual([
    "공모전 추천해줘", "recommend 응답", "방금 추천한 공고들을 비교해줘", "compare 응답",
  ]);
  expect(useAppStore.getState().conversations[0].messages.at(-1)?.resultIds).toEqual([ids[1]]);
  expect(useAppStore.getState().pendingChats).toEqual({});
});

it("does not carry result IDs or history into a new conversation", async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json(result("recommend"))));
  vi.stubGlobal("fetch", fetcher);
  await useAppStore.getState().sendMessage("공모전 추천");
  useAppStore.getState().startNewConversation();
  await useAppStore.getState().sendMessage("인턴 추천");
  const request = JSON.parse(fetcher.mock.calls[1][1].body);
  expect(request.previous_result_ids).toEqual([]);
  expect(request.history).toEqual([]);
  expect(useAppStore.getState().conversations).toHaveLength(2);
});
