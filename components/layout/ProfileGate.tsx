"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppStore } from "@/lib/store/useAppStore";
export function ProfileGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { account, loading, error, reload } = useAuth();
  const status = useAppStore((state) => state.workspaceStatus);
  const privatePage = ["/profile/edit", "/saved", "/apply-plan", "/notifications"].includes(path);
  if (!privatePage) return <>{children}</>;
  if (loading || status === "loading") return <p role="status" className="py-16 text-center">내 정보를 불러오고 있어요…</p>;
  if (error) return <div role="alert">{error}<button onClick={() => void reload()}>다시 연결</button></div>;
  if (!account) return <section className="space-y-4 py-16 text-center"><h1 className="text-2xl font-bold">나에게 맞는 기회를 찾아보세요</h1><p>로그인하면 내 프로필과 저장한 기회를 이어서 볼 수 있어요.</p><Link className="inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white" href="/login">로그인</Link><Link className="ml-4 text-indigo-600" href="/categories">공고 둘러보기</Link></section>;
  if (status === "error" && !useAppStore.getState().profile) return <p>개인 데이터를 불러오지 못했습니다. 상단에서 다시 불러와주세요.</p>;
  return <>{children}</>;
}
