"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { NotificationFeed } from "@/components/dashboard/NotificationFeed";
import { getNewOpportunities } from "@/lib/notifications";
import { OPPORTUNITIES } from "@/lib/mock/opportunities";
import { useAppStore } from "@/lib/store/useAppStore";
import { Avatar } from "./Avatar";
import { AvatarUpload } from "./AvatarUpload";

type Tab = "알림" | "저장" | "지원계획";

const TABS: Tab[] = ["알림", "저장", "지원계획"];

export function ProfileMenu() {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const applyPlanIds = useAppStore((s) => s.applyPlanIds);
  const updateProfile = useAppStore((s) => s.updateProfile);

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

  if (!profile) return null;

  const newEntries = getNewOpportunities(profile, savedIds);
  const savedItems = OPPORTUNITIES.filter((o) => savedIds.includes(o.id));
  const applyPlanItems = OPPORTUNITIES.filter((o) => applyPlanIds.includes(o.id));

  const tabCount: Record<Tab, number> = {
    알림: newEntries.length,
    저장: savedItems.length,
    지원계획: applyPlanItems.length,
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="프로필 메뉴 열기" className="relative block">
        <Avatar src={profile.avatarUrl} size="sm" />
        {newEntries.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {newEntries.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <AvatarUpload value={profile.avatarUrl} onChange={(avatarUrl) => updateProfile({ avatarUrl })} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
                {profile.region} · {profile.age}세
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profile.employmentStatus}</p>
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
            {tab === "알림" && <NotificationFeed entries={newEntries.slice(0, 5)} mode="teaser" teaserCount={5} />}

            {tab === "저장" &&
              (savedItems.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">아직 저장한 기회가 없어요.</p>
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
                  아직 지원 계획에 담은 기회가 없어요.
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
