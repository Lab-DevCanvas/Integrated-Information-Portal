import { searchAI } from "../api/aiSearch";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatConversation, ChatMessage, Opportunity, UserProfile } from "../types";
import { COMPARE_MAX } from "../constants";
import { deriveConversationTitle } from "../chat/reply";
import { fetchCrawledOpportunities } from "../api/fetchCrawledOpportunities";
import { getActivityById } from "../api/crawlingClient";
import { mapActivityToOpportunity } from "../api/mapActivityToOpportunity";

type Theme = "light" | "dark";

const MAX_CONVERSATIONS = 20;

interface AppState {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  clearProfile: () => void;

  savedIds: string[];
  toggleSaved: (id: string) => void;

  applyPlanIds: string[];
  toggleApplyPlan: (id: string) => void;

  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  conversations: ChatConversation[];
  activeConversationId: string | null;
  startNewConversation: () => void;
  setActiveConversation: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  pendingChats: Record<string, AbortController>;
  cancelChat: (id: string) => void;
  retryChat: (id: string) => void;

  /** Live data from the crawling backend (docs/crawling-integration.md) — the app's only opportunity
   * data source, never persisted to localStorage since it's cheap to refetch and would otherwise go stale. */
  crawledOpportunities: Opportunity[];
  crawledStatus: "idle" | "loading" | "ready" | "error";
  crawledFailures: string[];
  loadCrawledOpportunities: (force?: boolean) => Promise<void>;

  theme: Theme;
  /** false until the user has explicitly toggled — while false, ThemeEffect keeps following the OS preference */
  themeManuallySet: boolean;
  /** user-initiated toggle — marks themeManuallySet so OS preference changes stop overriding it */
  setTheme: (t: Theme) => void;
  /** ThemeEffect's OS-preference sync — does not mark themeManuallySet */
  applySystemTheme: (t: Theme) => void;

  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      setProfile: (p) => set({ profile: p }),
      updateProfile: (p) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...p, updatedAt: new Date().toISOString() } : null,
        })),
      clearProfile: () => set({ profile: null }),

      savedIds: [],
      toggleSaved: (id) =>
        set((s) => ({
          savedIds: s.savedIds.includes(id) ? s.savedIds.filter((x) => x !== id) : [...s.savedIds, id],
        })),

      applyPlanIds: [],
      toggleApplyPlan: (id) =>
        set((s) => ({
          applyPlanIds: s.applyPlanIds.includes(id)
            ? s.applyPlanIds.filter((x) => x !== id)
            : [...s.applyPlanIds, id],
        })),

      compareIds: [],
      toggleCompare: (id) =>
        set((s) => {
          if (s.compareIds.includes(id)) return { compareIds: s.compareIds.filter((x) => x !== id) };
          if (s.compareIds.length >= COMPARE_MAX) return s;
          return { compareIds: [...s.compareIds, id] };
        }),
      clearCompare: () => set({ compareIds: [] }),

      conversations: [],
      activeConversationId: null,
      startNewConversation: () => set({ activeConversationId: null }),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      pendingChats: {},
      cancelChat: (id) => get().pendingChats[id]?.abort(),
      retryChat: (id) => {
        const conversation = get().conversations.find((c) => c.id === id);
        const lastUser = conversation?.messages.findLastIndex((m) => m.role === "user") ?? -1;
        if (!conversation || lastUser < 0 || get().pendingChats[id]) return;
        const text = conversation.messages[lastUser].text;
        set((s) => ({ activeConversationId: id, conversations: s.conversations.map((c) => c.id === id
          ? { ...c, messages: c.messages.slice(0, lastUser) } : c) }));
        void get().sendMessage(text);
      },
      sendMessage: async (text) => {
        const state = get();
        const trimmed = text.trim();
        if (!trimmed || trimmed.length > 2000) return;
        const existing = state.conversations.find((c) => c.id === state.activeConversationId);
        const id = existing?.id ?? crypto.randomUUID();
        if (state.pendingChats[id]) return;
        const controller = new AbortController();
        const previous = existing?.messages ?? [];
        const now = new Date().toISOString();
        const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed, createdAt: now };
        const conversation: ChatConversation = existing ?? { id, title: deriveConversationTitle(trimmed), messages: [], updatedAt: now };
        set((s) => ({ activeConversationId: id, pendingChats: { ...s.pendingChats, [id]: controller },
          conversations: [{ ...conversation, messages: [...previous, userMsg], updatedAt: now },
            ...s.conversations.filter((c) => c.id !== id)].slice(0, MAX_CONVERSATIONS) }));
        let assistant: ChatMessage;
        try {
          const result = await searchAI(trimmed, previous, state.profile, controller.signal);
          if (controller.signal.aborted) throw new Error("cancelled");
          assistant = { id: crypto.randomUUID(), role: "assistant", text: result.answer,
            aiResult: result, resultIds: result.results.map((r) => r.detail_id), createdAt: new Date().toISOString() };
        } catch (error) {
          assistant = { id: crypto.randomUUID(), role: "assistant", error: true,
            errorCode: error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : undefined,
            retryable: controller.signal.aborted || !(error instanceof Error && "retryable" in error && error.retryable === false),
            text: controller.signal.aborted ? "검색을 취소했습니다." : error instanceof Error ? error.message : "검색에 실패했습니다.",
            createdAt: new Date().toISOString() };
        }
        set((s) => {
          const pendingChats = { ...s.pendingChats }; delete pendingChats[id];
          return { pendingChats, conversations: s.conversations.map((c) => c.id === id
            ? { ...c, messages: [...c.messages, assistant], updatedAt: assistant.createdAt } : c) };
        });
      },

      crawledOpportunities: [],
      crawledStatus: "idle",
      crawledFailures: [],
      loadCrawledOpportunities: async (force = false) => {
        if (get().crawledStatus === "loading" || (!force && get().crawledStatus === "ready")) return;
        set({ crawledStatus: "loading", crawledFailures: [] });
        try {
          const items = await fetchCrawledOpportunities((crawledFailures) => set({ crawledFailures }));
          const state = get();
          const ids = [...new Set([...state.savedIds, ...state.applyPlanIds, ...state.compareIds])].filter((id) => !items.some((item) => item.id === id));
          // Fetch references outside the dashboard sample, including closed saved items.
          for (let offset = 0; offset < ids.length; offset += 8) {
            const batch = await Promise.allSettled(ids.slice(offset, offset + 8).map(getActivityById));
            for (const result of batch) {
              if (result.status === "fulfilled" && result.value) items.push(mapActivityToOpportunity(result.value));
              if (result.status === "rejected") set((s) => ({ crawledFailures: [...new Set([...s.crawledFailures, "저장한 공고"])] }));
            }
          }
          const current = get();
          const currentReferences = new Set([...current.savedIds, ...current.applyPlanIds, ...current.compareIds]);
          const merged = new Map(current.crawledOpportunities.filter((item) => currentReferences.has(item.id) && !ids.includes(item.id)).map((item) => [item.id, item]));
          for (const item of items) merged.set(item.id, item);
          set({ crawledOpportunities: [...merged.values()], crawledStatus: "ready" });
        } catch {
          // Best-effort: consumers fall back to an empty list on failure.
          set({ crawledStatus: "error" });
        }
      },

      theme: "light",
      themeManuallySet: false,
      setTheme: (t) => set({ theme: t, themeManuallySet: true }),
      applySystemTheme: (t) => set({ theme: t }),

      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "aiop-storage",
      partialize: (s) => ({
        profile: s.profile,
        savedIds: s.savedIds,
        applyPlanIds: s.applyPlanIds,
        compareIds: s.compareIds,
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        theme: s.theme,
        themeManuallySet: s.themeManuallySet,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
