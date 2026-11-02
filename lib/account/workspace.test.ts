import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ request: vi.fn(), profile: vi.fn(), state: {} as Record<string, unknown>, listener: null as null | ((s: Record<string, unknown>, p: Record<string, unknown>) => void) }));
vi.mock("@/lib/auth/client", () => ({ accountRequest: mocks.request, getProfile: mocks.profile }));
vi.mock("@/lib/store/useAppStore", () => ({ useAppStore: { getState: () => mocks.state, setState: (patch: Record<string, unknown>) => { const previous = mocks.state; mocks.state = { ...previous, ...patch }; mocks.listener?.(mocks.state, previous); }, subscribe: (fn: typeof mocks.listener) => { mocks.listener = fn; return () => { mocks.listener = null; }; } } }));
import { connectWorkspace, disconnectWorkspace, retryWorkspaceSave } from "./workspace";
import type { Account } from "@/lib/auth/client";
const account = { account_id: "a", email: null } as Account;
const data = { savedIds: [], applyPlanIds: [], conversations: [] };
function response(revision: number, value = data) { return { json: async () => ({ revision, data: value }) }; }
function change(savedIds: string[]) { const previous = mocks.state; mocks.state = { ...previous, savedIds }; mocks.listener?.(mocks.state, previous); }
beforeEach(() => { vi.useFakeTimers(); mocks.request.mockReset(); mocks.profile.mockReset(); mocks.state = { pendingChats: {}, loadCrawledOpportunities: vi.fn() }; mocks.profile.mockResolvedValue({ eligibility_facts: {}, preferences: {}, updated_at: "now" }); mocks.request.mockResolvedValue(response(0)); });
afterEach(() => { disconnectWorkspace(); vi.useRealTimers(); });
describe("account workspace", () => {
  it("loads only the current account data and clears private data on disconnect", async () => {
    await connectWorkspace(account); change(["one"]); disconnectWorkspace();
    expect(mocks.state.savedIds).toEqual([]); expect(mocks.state.accountId).toBeNull();
  });
  it("marks edits dirty immediately and saves with the loaded revision", async () => {
    mocks.request.mockResolvedValueOnce(response(3)).mockResolvedValue(response(4)); await connectWorkspace(account);
    change(["one"]); expect(mocks.state.workspaceStatus).toBe("saving"); await vi.advanceTimersByTimeAsync(300);
    expect(JSON.parse(mocks.request.mock.calls[1][1].body)).toMatchObject({ revision: 3, data: { savedIds: ["one"] } });
    expect(mocks.state.workspaceStatus).toBe("ready");
  });
  it("aborts requests when an account is disconnected", async () => {
    await connectWorkspace(account); const signal = mocks.request.mock.calls[0][1].signal;
    disconnectWorkspace(); expect(signal.aborted).toBe(true);
  });
  it("preserves edits on failure and can retry them", async () => {
    await connectWorkspace(account); mocks.request.mockRejectedValueOnce(new Error("offline")); change(["one"]);
    await vi.advanceTimersByTimeAsync(300); expect(mocks.state.workspaceStatus).toBe("error"); expect(mocks.state.savedIds).toEqual(["one"]);
    mocks.request.mockResolvedValue(response(1)); await retryWorkspaceSave(); expect(mocks.state.workspaceStatus).toBe("ready");
  });
});
