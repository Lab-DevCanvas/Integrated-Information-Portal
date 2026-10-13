import { beforeEach, expect, it, vi } from "vitest";
import type { AISearchResult } from "../api/aiSearch";
const { search } = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock("../api/aiSearch", () => ({ searchAI: search }));
import { useAppStore } from "./useAppStore";

beforeEach(() => {
  search.mockReset();
  useAppStore.setState({ conversations: [], activeConversationId: null, pendingChats: {}, profile: null });
});
it("attaches late responses to their originating conversation", async () => {
  let resolve!: (result: AISearchResult) => void;
  search.mockImplementation(() => new Promise<AISearchResult>((r) => { resolve = r; }));
  const pending = useAppStore.getState().sendMessage("추천");
  const id = useAppStore.getState().activeConversationId;
  useAppStore.getState().startNewConversation();
  resolve({ answer: "완료", results: [], citations: [], comparisons: [], plan: [], warnings: [] } as unknown as AISearchResult);
  await pending;
  expect(useAppStore.getState().activeConversationId).toBeNull();
  expect(useAppStore.getState().conversations.find((c) => c.id === id)?.messages.at(-1)?.text).toBe("완료");
  expect(useAppStore.getState().pendingChats).toEqual({});
});
it("keeps a cancellation visible and retryable", async () => {
  search.mockImplementation((_m, _h, _p, signal: AbortSignal) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")));
  }));
  const pending = useAppStore.getState().sendMessage("계획");
  useAppStore.getState().cancelChat(useAppStore.getState().activeConversationId!);
  await pending;
  expect(useAppStore.getState().conversations[0].messages.at(-1)?.error).toBe(true);
  expect(useAppStore.getState().pendingChats).toEqual({});
});


it("preserves a daily limit and disables immediate retry", async () => {
  search.mockRejectedValue(Object.assign(new Error("오늘 사용 가능한 검색 횟수를 모두 사용했습니다"),
    { code: "AI_SEARCH_USER_DAILY_LIMIT", retryable: false }));
  await useAppStore.getState().sendMessage("추천");
  expect(useAppStore.getState().conversations[0].messages.at(-1)).toMatchObject({
    error: true, errorCode: "AI_SEARCH_USER_DAILY_LIMIT", retryable: false,
  });
  expect(useAppStore.getState().pendingChats).toEqual({});
});
