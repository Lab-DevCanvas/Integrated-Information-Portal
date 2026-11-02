"use client";
import { retryWorkspaceSave } from "@/lib/account/workspace";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAuth } from "./AuthProvider";
export function WorkspaceStatus() {
  const status = useAppStore((state) => state.workspaceStatus);
  const error = useAppStore((state) => state.workspaceError);
  const { reload } = useAuth();
  useEffect(() => {
    if (status !== "saving" && status !== "error") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);
  if (status === "saving") return <p role="status" className="px-4 text-xs text-slate-500">개인 데이터 저장 중…</p>;
  if (!error) return null;
  return <div role="alert" className="bg-rose-50 p-3 text-sm text-rose-700">{error}<button className="ml-3 underline" onClick={() => void retryWorkspaceSave()}>저장 재시도</button><button onClick={() => { if (window.confirm("저장하지 못한 변경을 버리고 서버 데이터를 다시 불러올까요?")) void reload(); }} className="ml-3 underline">서버 데이터 다시 불러오기</button></div>;
}
