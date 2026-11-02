"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AuthError, getAccount, handleSessionStorage, restoreSession, signOut, subscribeAuth, type Account } from "@/lib/auth/client";
import { connectWorkspace, disconnectWorkspace } from "@/lib/account/workspace";
type AuthState = { account: Account | null; loading: boolean; error: string | null; reload: () => Promise<void>; logout: () => Promise<void> };
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    disconnectWorkspace(); setLoading(true); setError(null); setAccount(null);
    try {
      const next = await restoreSession() ? await getAccount() : null;
      if (current === sequence.current) { setAccount(next); if (next) await connectWorkspace(next); else disconnectWorkspace(); }
    } catch (err) {
      if (current === sequence.current && !(err instanceof AuthError && err.status === 401)) setError("로그인 상태를 확인하지 못했어요. 다시 시도해주세요.");
    } finally { if (current === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    const current = ++sequence.current;
    void restoreSession().then(async (restored) => restored ? await getAccount() : null).then(async (next) => {
      if (active && current === sequence.current) { setAccount(next); if (next) await connectWorkspace(next); else disconnectWorkspace(); setLoading(false); }
    }).catch((err: unknown) => {
      if (active && current === sequence.current) {
        if (!(err instanceof AuthError && err.status === 401)) setError("로그인 상태를 확인하지 못했어요. 다시 시도해주세요.");
        setLoading(false);
      }
    });
    const requestLogin = () => router.push("/login");
    window.addEventListener("opfinde-login-required", requestLogin);
    const unsubscribe = subscribeAuth(() => { void reload(); });
    window.addEventListener("storage", handleSessionStorage);
    return () => { window.removeEventListener("opfinde-login-required", requestLogin); active = false; unsubscribe(); window.removeEventListener("storage", handleSessionStorage); };
  }, [reload, router]);
  async function logout() { try { await signOut(); } catch (err) { setError((err as Error).message); } }
  return <Context.Provider value={{ account, loading, error, reload, logout }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error("AuthProvider is required"); return value; }
