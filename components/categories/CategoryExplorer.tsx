"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, RotateCcw, Search, X } from "lucide-react";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORIES } from "@/lib/categories";
import { EXPERIENCE_LEVELS, OPPORTUNITY_TYPE_LABELS, REGIONS } from "@/lib/constants";
import { daysUntil } from "@/lib/mock/dateHelpers";
import { OPPORTUNITIES } from "@/lib/mock/opportunities";
import { computeScore } from "@/lib/scoring/score";
import { useAppStore } from "@/lib/store/useAppStore";
import type { CategoryId, ExperienceLevel, OpportunityType, RegionCode } from "@/lib/types";

type SortMode = "score" | "deadline" | "benefit" | "created" | "popularity" | "portfolio";
type DeadlineWindow = "all" | "7" | "30" | "90";

const OPPORTUNITY_TYPES = Object.keys(OPPORTUNITY_TYPE_LABELS) as OpportunityType[];
const PROFILE_REGIONS = REGIONS.filter((r) => r !== "전국");
const DEADLINE_WINDOWS: { value: DeadlineWindow; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "7", label: "1주 이내" },
  { value: "30", label: "1개월 이내" },
  { value: "90", label: "3개월 이내" },
];

interface Props {
  initialCategoryIds?: CategoryId[];
}

export function CategoryExplorer({ initialCategoryIds = [] }: Props) {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);

  const [categoryIds, setCategoryIds] = useState<CategoryId[]>(initialCategoryIds);
  const [typeIds, setTypeIds] = useState<OpportunityType[]>([]);
  const [regions, setRegions] = useState<RegionCode[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [deadlineWindow, setDeadlineWindow] = useState<DeadlineWindow>("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [showAdvanced, setShowAdvanced] = useState(false);

  function toggleCategory(id: CategoryId) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleType(id: OpportunityType) {
    setTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleRegion(id: RegionCode) {
    setRegions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleExperience(id: ExperienceLevel) {
    setExperienceLevels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const advancedActive =
    regions.length > 0 || experienceLevels.length > 0 || deadlineWindow !== "all" || eligibleOnly;
  const anyFilterActive =
    categoryIds.length !== initialCategoryIds.length ||
    categoryIds.some((c) => !initialCategoryIds.includes(c)) ||
    typeIds.length > 0 ||
    keyword.trim() !== "" ||
    advancedActive;

  function resetFilters() {
    setCategoryIds(initialCategoryIds);
    setTypeIds([]);
    setRegions([]);
    setExperienceLevels([]);
    setDeadlineWindow("all");
    setEligibleOnly(false);
    setKeyword("");
  }

  const items = useMemo(() => {
    if (!profile) return [];
    const kw = keyword.trim().toLowerCase();

    const base = OPPORTUNITIES.filter((o) => {
      if (categoryIds.length > 0 && !categoryIds.includes(o.categoryId)) return false;
      if (typeIds.length > 0 && !typeIds.includes(o.opportunityType)) return false;
      if (regions.length > 0 && !o.region.includes("전국") && !regions.some((r) => o.region.includes(r))) return false;
      if (
        experienceLevels.length > 0 &&
        o.requiredExperienceLevel !== "무관" &&
        !experienceLevels.includes(o.requiredExperienceLevel)
      )
        return false;
      if (deadlineWindow !== "all") {
        if (o.isAlwaysOpen) return false;
        if (daysUntil(o.applyEndDate) > Number(deadlineWindow)) return false;
      }
      if (kw) {
        const haystack = `${o.title} ${o.summary} ${o.organizer} ${o.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });

    let scored = base.map((opportunity) => ({ opportunity, score: computeScore(profile, opportunity, savedIds) }));

    if (eligibleOnly) {
      scored = scored.filter((x) => x.score.eligibilityJudgement.overall !== "fail");
    }

    switch (sortMode) {
      case "deadline":
        scored.sort((a, b) => {
          const aAlways = a.opportunity.isAlwaysOpen ? 1 : 0;
          const bAlways = b.opportunity.isAlwaysOpen ? 1 : 0;
          if (aAlways !== bAlways) return aAlways - bAlways;
          return daysUntil(a.opportunity.applyEndDate) - daysUntil(b.opportunity.applyEndDate);
        });
        break;
      case "benefit":
        scored.sort((a, b) => (b.opportunity.benefitAmount ?? 0) - (a.opportunity.benefitAmount ?? 0));
        break;
      case "created":
        scored.sort(
          (a, b) => new Date(b.opportunity.createdAt).getTime() - new Date(a.opportunity.createdAt).getTime(),
        );
        break;
      case "popularity":
        scored.sort((a, b) => (b.opportunity.viewCount ?? 0) - (a.opportunity.viewCount ?? 0));
        break;
      case "portfolio":
        scored.sort((a, b) => b.opportunity.portfolioValue - a.opportunity.portfolioValue);
        break;
      default:
        scored.sort((a, b) => b.score.totalScore - a.score.totalScore);
    }

    return scored;
  }, [profile, savedIds, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, eligibleOnly, keyword, sortMode]);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">카테고리 탐색</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          분야와 유형을 자유롭게 조합하고, 검색어로 좁혀서 공모전이든 채용이든 정책이든 한눈에 살펴보세요.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">필터</p>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!anyFilterActive}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-400 dark:text-slate-500 dark:hover:text-slate-300 dark:disabled:hover:text-slate-500"
          >
            <RotateCcw className="h-3 w-3" />
            초기화
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="제목, 기관, 키워드로 검색"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-9 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              aria-label="검색어 지우기"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">카테고리</p>
          <div className="flex flex-wrap gap-2">
            <Chip selected={categoryIds.length === 0} onClick={() => setCategoryIds([])}>
              전체
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} selected={categoryIds.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">유형</p>
          <div className="flex flex-wrap gap-2">
            <Chip selected={typeIds.length === 0} onClick={() => setTypeIds([])}>
              전체
            </Chip>
            {OPPORTUNITY_TYPES.map((t) => (
              <Chip key={t} selected={typeIds.includes(t)} onClick={() => toggleType(t)}>
                {OPPORTUNITY_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <span className="inline-flex items-center gap-1.5">
              상세 필터
              {advancedActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
            </span>
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">지역</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={regions.length === 0} onClick={() => setRegions([])}>
                    전체
                  </Chip>
                  {PROFILE_REGIONS.map((r) => (
                    <Chip key={r} selected={regions.includes(r)} onClick={() => toggleRegion(r)}>
                      {r}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">경력 수준</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={experienceLevels.length === 0} onClick={() => setExperienceLevels([])}>
                    전체
                  </Chip>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <Chip key={lvl} selected={experienceLevels.includes(lvl)} onClick={() => toggleExperience(lvl)}>
                      {lvl}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">마감 기간</p>
                <div className="flex flex-wrap gap-2">
                  {DEADLINE_WINDOWS.map((w) => (
                    <Chip key={w.value} selected={deadlineWindow === w.value} onClick={() => setDeadlineWindow(w.value)}>
                      {w.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                />
                지원 불가 항목 숨기기
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{items.length}건</p>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="score">적합도순</option>
          <option value="deadline">마감임박순</option>
          <option value="benefit">혜택큰순</option>
          <option value="created">최근 등록순</option>
          <option value="popularity">인기순</option>
          <option value="portfolio">포트폴리오 가치순</option>
        </select>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="조건에 맞는 기회가 없어요" description="필터나 검색어를 조정해보세요." />
      ) : (
        <div className="space-y-3">
          {items.map(({ opportunity, score }) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} score={score} />
          ))}
        </div>
      )}
    </div>
  );
}
