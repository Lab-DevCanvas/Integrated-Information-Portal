import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatConversation, ChatMessage, Opportunity, UserProfile } from "../types";
import { COMPARE_MAX } from "../constants";
import { deriveConversationTitle, generateAssistantReply } from "../chat/reply";
import { fetchCrawledOpportunities } from "../api/fetchCrawledOpportunities";
import { OPPORTUNITIES } from "../mock/opportunities";

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
  sendMessage: (text: string) => void;

  /** Live data from the crawling backend (docs/crawling-integration.md) — additive to OPPORTUNITIES,
   * never persisted to localStorage since it's cheap to refetch and would otherwise go stale. */
  crawledOpportunities: Opportunity[];
  crawledStatus: "idle" | "loading" | "ready" | "error";
  loadCrawledOpportunities: () => Promise<void>;

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
      sendMessage: (text) => {
        const state = get();
        const trimmed = text.trim();
        if (!state.profile || !trimmed) return;

        const now = new Date().toISOString();
        const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed, createdAt: now };

        let conversations = state.conversations;
        let conversationId = state.activeConversationId;
        const exists = conversations.some((c) => c.id === conversationId);

        if (!conversationId || !exists) {
          conversationId = crypto.randomUUID();
          const newConversation: ChatConversation = {
            id: conversationId,
            title: deriveConversationTitle(trimmed),
            messages: [],
            updatedAt: now,
          };
          conversations = [newConversation, ...conversations].slice(0, MAX_CONVERSATIONS);
        }

        const allOpportunities = [...OPPORTUNITIES, ...state.crawledOpportunities];
        const reply = generateAssistantReply(trimmed, state.profile, state.savedIds, allOpportunities);
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: reply.text,
          resultIds: reply.resultIds,
          createdAt: new Date().toISOString(),
        };

        conversations = conversations.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, userMsg, assistantMsg], updatedAt: assistantMsg.createdAt }
            : c,
        );

        set({ conversations, activeConversationId: conversationId });
      },

      crawledOpportunities: [],
      crawledStatus: "idle",
      loadCrawledOpportunities: async () => {
        if (get().crawledStatus === "loading" || get().crawledStatus === "ready") return;
        set({ crawledStatus: "loading" });
        try {
          const items = await fetchCrawledOpportunities();
          set({ crawledOpportunities: items, crawledStatus: "ready" });
        } catch {
          // Best-effort: the dashboard keeps working on curated mock data alone.
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
