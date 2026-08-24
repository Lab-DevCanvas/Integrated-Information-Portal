"use client";

import { Bell } from "lucide-react";
import { NotificationFeed } from "@/components/dashboard/NotificationFeed";
import { getNewOpportunities } from "@/lib/notifications";
import { useAppStore } from "@/lib/store/useAppStore";

export default function NotificationsPage() {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);

  if (!profile) return null;

  const entries = getNewOpportunities(profile, savedIds);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">새롭게 발견된 기회</h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        최근 14일 내 등록되고 프로필과 잘 맞는 기회들을 모았어요.
      </p>
      <NotificationFeed entries={entries} mode="full" />
    </div>
  );
}
