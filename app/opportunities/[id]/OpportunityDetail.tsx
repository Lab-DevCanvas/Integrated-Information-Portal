"use client";

import Link from "next/link";
import {
  Banknote,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Hash,
  Heart,
  Info,
  MapPin,
  Plus,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DdayBadge } from "@/components/opportunity/DdayBadge";
import { EligibilityBadgeRow } from "@/components/opportunity/EligibilityBadgeRow";
import { EligibilityTable } from "@/components/opportunity/EligibilityTable";
import { ScoreBadge } from "@/components/opportunity/ScoreBadge";
import { ScoreBreakdownPanel } from "@/components/opportunity/ScoreBreakdownPanel";
import { ApplyPlanButton } from "@/components/opportunity/ApplyPlanButton";
import { getCategory, getSubCategoryLabel } from "@/lib/categories";
import { COMPARE_MAX, OPPORTUNITY_TYPE_LABELS } from "@/lib/constants";
import {
  estimatePrepHours,
  formatDateRange,
  formatDeadlineDateTime,
  formatKRW,
  lastCheckedLabel,
  levelLabel,
  prepDifficultyLevel,
} from "@/lib/format";
import { daysSince, daysUntil, formatDday } from "@/lib/mock/dateHelpers";
import { buildRecommendationReasons } from "@/lib/scoring/reasons";
import { computeScore } from "@/lib/scoring/score";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Opportunity } from "@/lib/types";

const NAV_TABS = [
  { id: "section-key-info", label: "핵심 정보" },
  { id: "section-eligibility", label: "지원 자격" },
  { id: "section-ai-analysis", label: "AI 분석" },
] as const;

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionEyebrow({ index, label }: { index: string; label: string }) {
  return (
    <p className="mb-1 text-[11px] font-bold tracking-wider text-indigo-500 uppercase dark:text-indigo-400">
      {index} · {label}
    </p>
  );
}

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleSaved = useAppStore((s) => s.toggleSaved);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const hasHydrated = useAppStore((s) => s._hasHydrated);

  const score = hasHydrated && profile ? computeScore(profile, opportunity, savedIds) : null;
  const category = getCategory(opportunity.categoryId);
  const isNew = daysSince(opportunity.createdAt) <= 14;
  const saved = savedIds.includes(opportunity.id);
  const comparing = compareIds.includes(opportunity.id);
  const compareDisabled = !comparing && compareIds.length >= COMPARE_MAX;
  const reasons = profile && score ? buildRecommendationReasons(profile, opportunity, score.eligibilityJudgement) : [];
  const daysRemaining = daysUntil(opportunity.applyEndDate);
  const urgent = !opportunity.isAlwaysOpen && daysRemaining >= 0 && daysRemaining <= 3;

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-300">
          기회 찾기
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/categories/${opportunity.categoryId}`}
          className="hover:text-slate-600 dark:hover:text-slate-300"
        >
          {category?.label ?? "카테고리"}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-500 dark:text-slate-400">상세</span>
      </nav>

      <div className="lg:grid lg:grid-cols-4 lg:gap-6">
      <div className="space-y-6 lg:col-span-3">
      {/* Header */}
      <Card className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="indigo">{getSubCategoryLabel(opportunity.subCategoryId)}</Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400">{opportunity.organizer}</span>
          {isNew && <Badge tone="rose">신규</Badge>}
        </div>

        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">{opportunity.title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{opportunity.summary}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {opportunity.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-500 dark:text-indigo-400"
            >
              <Hash className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          {score && <EligibilityBadgeRow status={score.eligibilityJudgement.overall} />}
          {score && (
            <div className="flex items-center gap-2">
              <ScoreBadge score={score.totalScore} size="sm" />
              <span className="text-xs text-slate-400 dark:text-slate-500">나와의 적합도</span>
            </div>
          )}
          <DdayBadge applyEndDate={opportunity.applyEndDate} isAlwaysOpen={opportunity.isAlwaysOpen} />
        </div>
      </Card>

      {/* Quick nav */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {NAV_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => scrollToSection(t.id)}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 01 · WHY RECOMMENDED */}
      {score && (
        <section id="section-key-info" className="scroll-mt-20">
          <Card className="p-5 sm:p-6">
            <SectionEyebrow index="01" label="WHY RECOMMENDED" />
            <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-50">회원님에게 추천하는 이유</h2>
            <ol className="space-y-3">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm text-slate-700 dark:text-slate-300">{reason}</p>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      )}

      {/* 02 · ELIGIBILITY */}
      {score && (
        <section id="section-eligibility" className="scroll-mt-20">
          <Card className="p-5 sm:p-6">
            <SectionEyebrow index="02" label="ELIGIBILITY" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">내가 지원할 수 있나요?</h2>
            <p className="mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">
              공식 지원 조건과 등록한 프로필을 항목별로 비교했습니다.
            </p>
            <div className="mb-4">
              <EligibilityBadgeRow status={score.eligibilityJudgement.overall} />
            </div>
            <EligibilityTable opportunity={opportunity} judgement={score.eligibilityJudgement} />
          </Card>
        </section>
      )}

      {/* 03 · OPPORTUNITY SUMMARY + AI ANALYSIS */}
      <section id="section-ai-analysis" className="scroll-mt-20 space-y-6">
        <Card className="p-5 sm:p-6">
          <SectionEyebrow index="03" label="OPPORTUNITY SUMMARY" />
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-50">기회 정보</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                모집기간
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {opportunity.isAlwaysOpen
                  ? "상시 모집"
                  : formatDateRange(opportunity.applyStartDate, opportunity.applyEndDate)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                지역
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {opportunity.region.join(" · ")}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Banknote className="h-3.5 w-3.5" />
                혜택
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {opportunity.benefitType}
                {opportunity.benefitAmount ? ` · ${formatKRW(opportunity.benefitAmount)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <UsersRound className="h-3.5 w-3.5" />
                참여방식
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {opportunity.teamRequired ? "팀" : "개인"}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Target className="h-3.5 w-3.5" />
                경력 조건
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {opportunity.requiredExperienceLevel}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <Hash className="h-3.5 w-3.5" />
                참가비
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">없음</dd>
            </div>
          </dl>
        </Card>

        {score && (
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="mb-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">AI가 정리한 30초 요약</p>
                <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-300">{score.explanation}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">경쟁 난이도</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {levelLabel(opportunity.competitionLevel)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">준비 난이도</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {levelLabel(prepDifficultyLevel(opportunity.requiredExperienceLevel))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">포트폴리오 가치</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {levelLabel(opportunity.portfolioValue)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">예상 준비시간</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  약 {estimatePrepHours(opportunity)}시간
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              AI 분석은 참고용이며 기관의 공식 판단을 대신하지 않습니다.
            </p>
          </Card>
        )}

        {score && <ScoreBreakdownPanel score={score} />}
      </section>

      {/* 04 · ORIGINAL INFORMATION */}
      <section>
        <Card className="p-5 sm:p-6">
          <SectionEyebrow index="04" label="ORIGINAL INFORMATION" />
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-slate-50">원본 정보</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-400 dark:text-slate-500">출처</dt>
              <dd className="font-medium text-slate-700 dark:text-slate-300">
                {opportunity.organizer} {OPPORTUNITY_TYPE_LABELS[opportunity.opportunityType]}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400 dark:text-slate-500">마지막 확인</dt>
              <dd className="font-medium text-slate-700 dark:text-slate-300">{lastCheckedLabel(opportunity)}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled
            title="목업 데이터입니다 — 실제 신청 링크는 제공되지 않아요."
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-400"
          >
            공식 공고 확인
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </Card>
      </section>

      </div>

      {/* Action card — sticks to the top of the viewport once scrolled past, on desktop */}
      <div className="mt-6 lg:col-span-1 lg:mt-0">
        <div className="lg:sticky lg:top-24">
          <Card className="p-4 text-center">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">마감까지</p>
            {opportunity.isAlwaysOpen ? (
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">상시</p>
            ) : (
              <>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    urgent ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-50"
                  }`}
                >
                  {formatDday(opportunity.applyEndDate, opportunity.isAlwaysOpen)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {formatDeadlineDateTime(opportunity.applyEndDate)}
                </p>
              </>
            )}

            <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleSaved(opportunity.id)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  saved
                    ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
                {saved ? "저장됨" : "저장하기"}
              </button>

              <button
                type="button"
                disabled={compareDisabled}
                onClick={() => toggleCompare(opportunity.id)}
                title={compareDisabled ? `최대 ${COMPARE_MAX}개까지 비교할 수 있어요` : undefined}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  comparing
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                }`}
              >
                <Plus className="h-4 w-4" />
                {comparing ? "비교함에서 제거" : "비교하기"}
              </button>

              <ApplyPlanButton id={opportunity.id} className="w-full" />
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-left dark:bg-slate-800/60">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                지원 전 반드시 공식 공고의 최신 조건을 확인하세요.
              </p>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
