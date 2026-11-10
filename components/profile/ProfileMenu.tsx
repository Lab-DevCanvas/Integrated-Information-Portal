"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { NotificationFeed } from "@/components/dashboard/NotificationFeed";
import { getNewOpportunities } from "@/lib/notifications";
import { useAllOpportunities, useIsLoadingOpportunities } from "@/lib/hooks/useAllOpportunities";
import { useAppStore } from "@/lib/store/useAppStore";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Avatar } from "./Avatar";


type Tab = "알림" | "저장" | "지원계획";

const TABS: Tab[] = ["알림", "저장", "지원계획"];

export function ProfileMenu() {
  const { account, logout, loading, error, reload } = useAuth();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const applyPlanIds = useAppStore((s) => s.applyPlanIds);

  const allOpportunities = useAllOpportunities();
  const isLoading = useIsLoadingOpportunities();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("알림");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);



  const newEntries = account && profile ? getNewOpportunities(profile, savedIds, allOpportunities) : [];
  const savedItems = allOpportunities.filter((o) => savedIds.includes(o.id));
  const applyPlanItems = allOpportunities.filter((o) => applyPlanIds.includes(o.id));

  const tabCount: Record<Tab, number> = {
    알림: newEntries.length,
    저장: savedItems.length,
    지원계획: applyPlanItems.length,
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="프로필 메뉴 열기" aria-expanded={open} className="relative block">
        <Avatar src={account ? profile?.avatarUrl : undefined} size="sm" />
        {newEntries.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {newEntries.length}
          </span>
        )}
      </button>

      {open && (!account || error) && (
        <div className="absolute top-full right-0 z-50 mt-2 grid w-max max-w-[90vw] gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {loading ? <p role="status">로그인 확인 중…</p> : error ? <>
            <p role="alert" className="text-sm">{error}</p>
            <button onClick={() => void reload()} className="text-sm underline">다시 연결</button>
          </> : <GoogleSignInButton>Google 계정으로 시작하기</GoogleSignInButton>}
        </div>
      )}
      {open && account && !error && (
        <div className="absolute top-full right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <Avatar src={profile?.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
                {account.nickname ?? "회원"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{account.email ?? "이메일 미제공"}</p>
              <Link
                href="/profile/edit"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <Settings className="h-3 w-3" />
                프로필 수정
              </Link>
            </div>
          </div>

          <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-800"><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={async () => { await logout(); setOpen(false); router.replace("/"); }}><LogOut className="h-4 w-4" />로그아웃</button></div>
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                  tab === t
                    ? "border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
              >
                {t} ({tabCount[t]})
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {tab === "알림" && (
              <>
                <p className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">최근 14일 공고 중 북마크 또는 일치도 80% 이상만 알려드려요.</p>
                <NotificationFeed entries={newEntries.slice(0, 5)} mode="teaser" teaserCount={5} isLoading={isLoading} />
              </>
            )}

            {tab === "저장" &&
              (savedItems.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  {isLoading && savedIds.length > 0 ? "불러오는 중이에요…" : "아직 저장한 기회가 없어요."}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {savedItems.slice(0, 6).map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/opportunities/${o.id}`}
                        onClick={() => setOpen(false)}
                        className="block px-2 py-2.5 text-sm font-medium text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-400"
                      >
                        {o.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}

            {tab === "지원계획" &&
              (applyPlanItems.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  {isLoading && applyPlanIds.length > 0 ? "불러오는 중이에요…" : "아직 지원 계획에 담은 기회가 없어요."}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {applyPlanItems.slice(0, 6).map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/opportunities/${o.id}`}
                        onClick={() => setOpen(false)}
                        className="block px-2 py-2.5 text-sm font-medium text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-400"
                      >
                        {o.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
          </div>

          <div className="flex border-t border-slate-100 text-center text-[11px] font-medium text-indigo-600 sm:text-xs dark:border-slate-800 dark:text-indigo-400">
            <Link href="/notifications" onClick={() => setOpen(false)} className="flex-1 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
              알림 전체보기
            </Link>
            <Link
              href="/saved"
              onClick={() => setOpen(false)}
              className="flex-1 border-l border-slate-100 py-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              저장 전체보기
            </Link>
            <Link
              href="/apply-plan"
              onClick={() => setOpen(false)}
              className="flex-1 border-l border-slate-100 py-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              지원계획 전체보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
