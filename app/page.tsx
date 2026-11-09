"use client";

import { LoadingState } from "@/components/ui/LoadingState";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { presentOpportunity } from "@/lib/scoring/presentation";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { RecommendationList } from "@/components/dashboard/RecommendationList";
import { Card } from "@/components/ui/Card";
import { listActivities } from "@/lib/api/crawlingClient";
import { mapActivityToOpportunity } from "@/lib/api/mapActivityToOpportunity";
import { CATEGORIES } from "@/lib/categories";
import { useScoredOpportunities } from "@/lib/hooks/useScoredOpportunities";
import { useAppStore } from "@/lib/store/useAppStore";
import type { CategoryId, Opportunity } from "@/lib/types";

const dayInSeoul = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});

export default function DashboardPage() {
  const { account, loading } = useAuth();
  const storedProfile = useAppStore((s) => s.profile);
  const profile = account ? storedProfile : null;
  const scored = useScoredOpportunities();
  const [total, setTotal] = useState<number | null>(null);
  const [latest, setLatest] = useState<Opportunity[]>([]);
  const [today, setToday] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  const [category, select] = useState<CategoryId | "all">("all");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const todayKey = dayInSeoul.format(new Date());
      const collected = new Map<string, Opportunity>();
      const pageSize = 100;
      for (let page = 1; ; page++) {
        const result = await listActivities({ page, pageSize }, controller.signal);
        if (controller.signal.aborted) return;
        if (page === 1) {
          setLatest(result.items.map(mapActivityToOpportunity));
          setTotal(result.total);
        }
        for (const row of result.items) {
          if (dayInSeoul.format(new Date(row.first_collected_at)) === todayKey) {
            collected.set(row.id, mapActivityToOpportunity(row));
          }
        }
        // The API orders by last_seen_at descending. Once it predates today,
        // no subsequent page can contain a listing first collected today.
        const last = result.items.at(-1);
        if (!last || page * pageSize >= result.total || dayInSeoul.format(new Date(last.last_seen_at)) < todayKey) break;
      }
      setToday([...collected.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    }
    load().catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  if (loading) return <LoadingState layout="panel" title="홈 화면을 불러오는 중이에요" />;
  const recommended = profile ? scored.filter(row => row.crawled ? (row.fit?.percent ?? 0) > 0 : (row.percent ?? 0) >= 70) : [];
  const visibleToday = today?.filter((item) => category === "all" || item.categoryId === category) ?? [];
  return (
    <div className="space-y-8">
      <DashboardHero signedIn={!!account} profile={profile} scored={profile ? scored : []} total={total} newTodayCount={today?.length ?? null} />
      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">오늘 올라온 공고</h2>
        <p className="text-sm text-slate-500">한국시간 기준 오늘 처음 수집된 공고예요.</p>
        <div aria-label="오늘 공고 카테고리" role="group" className="flex flex-wrap gap-2">
          {[{ id: "all" as const, label: "전체" }, ...CATEGORIES].map(({ id, label }) => (
            <button key={id} onClick={() => select(id)} aria-pressed={category === id}
              className="rounded-full border px-3 py-1.5 text-sm aria-pressed:border-indigo-600 aria-pressed:bg-indigo-600 aria-pressed:text-white">
              {label}
            </button>
          ))}
        </div>
        {error ? <p role="alert">공고를 불러오지 못했어요. <button className="underline" onClick={() => { setError(false); retry(attempt + 1); }}>다시 시도</button></p>
          : today === null ? <LoadingState title="오늘 공고를 확인하고 있어요" />
          : visibleToday.length ? <RecommendationList key={category} pageSize={3} items={visibleToday.map(opportunity => presentOpportunity(opportunity, profile))} />
          : <p className="py-5 text-sm text-slate-500">오늘 이 분야에 새로 등록된 공고가 없어요.</p>}
      </Card>
      <section id="recommendations" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-bold">{recommended.length ? `추천 기회 ${recommended.length}건` : "최근 공고"}</h2>
        <RecommendationList key={recommended.length ? "recommended" : "latest"}
          items={recommended.length ? recommended : latest.map(opportunity => presentOpportunity(opportunity, profile))}
          isLoading={total === null && !error} />
      </section>
    </div>
  );
}
