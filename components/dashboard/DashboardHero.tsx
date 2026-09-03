import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { daysUntil } from "@/lib/mock/dateHelpers";
import { getProfileCompletion } from "@/lib/profile";
import type { Opportunity, ScoreResult, UserProfile } from "@/lib/types";

interface Props {
  profile: UserProfile;
  scored: { opportunity: Opportunity; score: ScoreResult }[];
  newTodayCount: number;
}

function formatToday(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardHero({ profile, scored, newTodayCount }: Props) {
  const completion = getProfileCompletion(profile);
  const completionPercent = Math.round(completion.percent * 100);

  const actionableCount = scored.filter((s) => s.score.eligibilityJudgement.overall !== "fail").length;
  const closingSoonCount = scored.filter(({ opportunity: o }) => {
    if (o.isAlwaysOpen) return false;
    const d = daysUntil(o.applyEndDate);
    return d >= 0 && d <= 14;
  }).length;

  const metaParts = [profile.region, profile.employmentStatus, profile.educationStatus, ...profile.jobInterests].filter(
    Boolean,
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-40 h-40 w-40 rounded-full bg-indigo-50 blur-2xl dark:bg-indigo-500/5"
      />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          <p className="text-xs font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
            FOR YOU · {formatToday()}
          </p>

          <h1 className="mt-3 text-3xl leading-tight font-extrabold text-slate-900 sm:text-4xl dark:text-slate-50">
            {profile.name ? `${profile.name}님, 안녕하세요.` : "안녕하세요."}
            <br />
            오늘 <span className="text-indigo-600 dark:text-indigo-400">당신에게 맞는 기회</span>를 정리했어요.
          </h1>

          {metaParts.length > 0 && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{metaParts.join(" · ")}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href="#recommendations"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
            >
              추천 기회 탐색 <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/profile/edit"
              className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              프로필 수정
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">이번 주 기회 요약</h2>
            <Link
              href="/profile/edit"
              className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              프로필 정확도 {completionPercent}%
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 text-center dark:divide-slate-700">
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">{actionableCount}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">지원가능·확인 필요</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">{closingSoonCount}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">14일 이내 마감</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">{newTodayCount}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">새로 등록</p>
            </div>
          </div>

          {!completion.isComplete && (
            <Link
              href="/profile/edit"
              className="mt-4 flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-left transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
                <Plus className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-50">
                  정보를 하나만 더 입력해 보세요.
                </span>
                <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {completion.missingLabels[0]} 정보를 추가하면 매칭이 더 정확해져요.
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">추가</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
