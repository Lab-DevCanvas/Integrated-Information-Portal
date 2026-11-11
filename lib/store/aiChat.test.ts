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


it("keeps progress per conversation and ignores it after cancellation", async () => {
  let report!: (stage: string) => void;
  search.mockImplementation((_m, _h, _p, signal: AbortSignal, progress) => new Promise((_resolve, reject) => {
    report = progress;
    signal.addEventListener("abort", () => reject(new Error("aborted")));
  }));
  const pending = useAppStore.getState().sendMessage("추천");
  const id = useAppStore.getState().activeConversationId!;
  report("searching");
  useAppStore.getState().startNewConversation();
  report("filtering");
  expect(useAppStore.getState().pendingProgress[id]).toEqual(["searching", "filtering"]);
  expect(useAppStore.getState().activeConversationId).toBeNull();
  useAppStore.getState().cancelChat(id);
  report("generating");
  await pending;
  expect(useAppStore.getState().pendingProgress[id]).toBeUndefined();
});

it("limits conversation pins to five and allows unpinning", () => {
  useAppStore.setState({ conversations: Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, title: "대화", messages: [], updatedAt: "" })) });
  for (let i = 0; i < 6; i++) useAppStore.getState().toggleConversationPin(`c${i}`);
  expect(useAppStore.getState().conversations.filter((c) => c.isPinned)).toHaveLength(5);
  useAppStore.getState().toggleConversationPin("c0");
  useAppStore.getState().toggleConversationPin("c5");
  expect(useAppStore.getState().conversations.find((c) => c.id === "c5")?.isPinned).toBe(true);
});

it("pins questions and answers independently within their conversation", () => {
  const messages = [{ id: "q", role: "user" as const, text: "질문", createdAt: "" }, { id: "a", role: "assistant" as const, text: "답변", createdAt: "" }];
  useAppStore.setState({ conversations: ["one", "two"].map((id) => ({ id, title: id, messages, updatedAt: "" })) });
  useAppStore.getState().toggleMessagePin("one", "q");
  useAppStore.getState().toggleMessagePin("one", "a");
  expect(useAppStore.getState().conversations[0].messages.every((m) => m.isPinned)).toBe(true);
  expect(useAppStore.getState().conversations[1].messages.some((m) => m.isPinned)).toBe(false);
  useAppStore.getState().toggleMessagePin("one", "q");
  expect(useAppStore.getState().conversations[0].messages[0].isPinned).toBe(false);
});

it("keeps an old pinned conversation when new chats reach the history limit", async () => {
  useAppStore.setState({ conversations: Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, title: "대화", messages: [], updatedAt: "", isPinned: i === 19 })) });
  search.mockResolvedValue({ answer: "완료", results: [] });
  await useAppStore.getState().sendMessage("새 질문");
  expect(useAppStore.getState().conversations).toHaveLength(20);
  expect(useAppStore.getState().conversations.some((c) => c.id === "c19" && c.isPinned)).toBe(true);
  expect(useAppStore.getState().conversations.some((c) => c.id === "c18")).toBe(false);
});
