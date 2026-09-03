"use client";

import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAllOpportunities } from "@/lib/hooks/useAllOpportunities";
import { useScoredOpportunities } from "@/lib/hooks/useScoredOpportunities";
import { getTodaysOpportunities } from "@/lib/notifications";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { NotificationFeed } from "@/components/dashboard/NotificationFeed";
import { RecommendationList } from "@/components/dashboard/RecommendationList";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const allOpportunities = useAllOpportunities();
  const scored = useScoredOpportunities();

  if (!profile) return null;

  const newEntries = getTodaysOpportunities(profile, savedIds, allOpportunities).slice(0, 6);

  return (
    <div className="space-y-8">
      <DashboardHero profile={profile} scored={scored} newTodayCount={newEntries.length} />

      {newEntries.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                오늘 추가된 기회 {newEntries.length}개
              </h2>
            </div>
            <Link
              href="/notifications"
              className="flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400"
            >
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <NotificationFeed entries={newEntries} mode="teaser" teaserCount={4} />
        </Card>
      )}

      <div id="recommendations" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-50">추천 기회 {scored.length}건</h2>
        <RecommendationList items={scored} />
      </div>
    </div>
  );
}
