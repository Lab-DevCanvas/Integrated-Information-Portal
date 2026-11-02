import { accountRequest, getProfile, type Account } from "@/lib/auth/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { projectProfile } from "./profile";
import type { ChatConversation } from "@/lib/types";
interface WorkspaceData { savedIds: string[]; applyPlanIds: string[]; conversations: ChatConversation[] }
interface Workspace { revision: number; data: WorkspaceData }
let retry: (() => Promise<void>) | null = null;
export async function retryWorkspaceSave() { await retry?.(); }
let operations = new AbortController();
let epoch = 0;
let unsubscribe: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
function clear() {
  epoch++; operations.abort(); operations = new AbortController(); retry = null; unsubscribe?.(); unsubscribe = null; clearTimeout(timer);
  for (const controller of Object.values(useAppStore.getState().pendingChats)) controller.abort();
  useAppStore.setState({ profile: null, savedIds: [], applyPlanIds: [], compareIds: [], conversations: [], activeConversationId: null, pendingChats: {}, pendingProgress: {}, accountId: null, workspaceStatus: "idle", workspaceError: null });
}
export function disconnectWorkspace() { clear(); }
function snapshot(): WorkspaceData {
  const state = useAppStore.getState();
  return { savedIds: state.savedIds, applyPlanIds: state.applyPlanIds, conversations: state.conversations };
}
export async function connectWorkspace(account: Account) {
  clear(); const current = epoch; const signal = operations.signal;
  useAppStore.setState({ accountId: account.account_id, workspaceStatus: "loading" });
  try {
    const [profile, response] = await Promise.all([getProfile(), accountRequest("/accounts/me/workspace", { signal })]);
    const workspace: Workspace = await response.json();
    if (current !== epoch) return;
    let revision = workspace.revision;
    let acknowledged = JSON.stringify(workspace.data);
    let writing = false;
    let failed = false;
    useAppStore.setState({ ...workspace.data, profile: projectProfile(profile, account), workspaceStatus: "ready" });
    void useAppStore.getState().loadCrawledOpportunities(true);
    async function flush() {
      if (writing || failed || current !== epoch) return;
      const data = snapshot(); const encoded = JSON.stringify(data);
      if (encoded === acknowledged) return;
      writing = true; useAppStore.setState({ workspaceStatus: "saving" });
      try {
        const response = await accountRequest("/accounts/me/workspace", { method: "PUT", signal, body: JSON.stringify({ revision, data }) });
        const saved: Workspace = await response.json();
        if (current !== epoch) return;
        revision = saved.revision; acknowledged = encoded;
        useAppStore.setState({ workspaceStatus: "ready", workspaceError: null });
      } catch (error) {
        if (current !== epoch) return;
        failed = true;
        const conflict = error instanceof Error && "status" in error && error.status === 409;
        useAppStore.setState({ workspaceStatus: "error", workspaceError: conflict ? "다른 화면에서 변경되었습니다. 다시 불러온 뒤 수정해주세요." : "변경 내용을 서버에 저장하지 못했습니다. 이 화면을 닫지 말고 다시 시도해주세요." });
      } finally {
        writing = false;
        if (!failed && current === epoch && acknowledged !== JSON.stringify(snapshot())) void flush();
      }
    }
    retry = async () => { failed = false; await flush(); };
    unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.savedIds === previous.savedIds && state.applyPlanIds === previous.applyPlanIds && state.conversations === previous.conversations) return;
      if (!failed) useAppStore.setState({ workspaceStatus: "saving" });
      clearTimeout(timer); timer = setTimeout(() => void flush(), 250);
    });
    // Warn before navigating away while writes are pending; no silent background loss.
  } catch {
    if (current === epoch) useAppStore.setState({ workspaceStatus: "error", workspaceError: "개인 정보를 불러오지 못했습니다. 다시 연결해주세요." });
  }
}
