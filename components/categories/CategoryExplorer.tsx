"use client";

import { useMemo, useState, type SetStateAction } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, RotateCcw, Search, X } from "lucide-react";
import { CategoryResultList } from "./CategoryResultList";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { CATEGORIES } from "@/lib/categories";
import { EXPERIENCE_LEVELS, REGIONS } from "@/lib/constants";
import { useCategoryResults } from "@/lib/hooks/useCategoryResults";
import { useCategoryOpportunities } from "@/lib/hooks/useCategoryOpportunities";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { COLLECTOR_SOURCES } from "@/lib/api/collectorSources";
import { useAppStore } from "@/lib/store/useAppStore";
import type { CategoryId, ExperienceLevel, RegionCode } from "@/lib/types";

type SortMode = "score" | "deadline" | "benefit" | "created" | "popularity" | "portfolio";
type DeadlineWindow = "all" | "7" | "30" | "90";

const CATEGORY_IDS = CATEGORIES.map((category) => category.id);
const EMPTY_FILTER: never[] = [];

function useArrayFilter<T extends string>(raw: string | null, allowed: readonly T[], fallback: T[] = EMPTY_FILTER) {
  return useMemo(() => raw === null ? fallback : raw.split(",").filter((item): item is T => allowed.includes(item as T)), [raw, allowed, fallback]);
}

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

export function CategoryExplorer({ initialCategoryIds = EMPTY_FILTER }: Props) {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);
  const query = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  function updateQuery(key: string, value: string) {
    const next = new URLSearchParams(query.toString());
    next.set(key, value);
    next.delete("page");
    next.delete("types");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }
  function arraySetter<T extends string>(key: string, value: T[]) {
    return (next: SetStateAction<T[]>) => updateQuery(key, (typeof next === "function" ? next(value) : next).join(","));
  }
  const categoryIds = useArrayFilter(query.get("categories"), CATEGORY_IDS, initialCategoryIds);
  const typeIds = EMPTY_FILTER;
  const regions = useArrayFilter<RegionCode>(query.get("regions"), REGIONS);
  const experienceLevels = useArrayFilter<ExperienceLevel>(query.get("experience"), EXPERIENCE_LEVELS);
  const setCategoryIds = arraySetter("categories", categoryIds);
  const setRegions = arraySetter("regions", regions);
  const setExperienceLevels = arraySetter("experience", experienceLevels);
  const deadlineWindow = (DEADLINE_WINDOWS.some((w) => w.value === query.get("deadline")) ? query.get("deadline") : "all") as DeadlineWindow;
  const setDeadlineWindow = (value: DeadlineWindow) => updateQuery("deadline", value);
  const eligibleOnly = query.get("eligible") === "true";
  const setEligibleOnly = (value: boolean) => updateQuery("eligible", String(value));
  const keyword = query.get("q") ?? "";
  const setKeyword = (value: string) => updateQuery("q", value);
  const sortMode = (query.get("sort") ?? "score") as SortMode;
  const setSortMode = (value: SortMode) => updateQuery("sort", value);
  const source = query.get("source") ?? "";
  const periodStatus = query.get("period_status") ?? "";
  const { items: allOpportunities, loading: isLoading, loadingMore, total, error, backgroundError, retry } = useCategoryOpportunities(source, periodStatus);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function toggleCategory(id: CategoryId) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    advancedActive || source !== "" || periodStatus !== "";

  function resetFilters() {
    router.push(pathname, { scroll: false });
  }

  const items = useCategoryResults({ allOpportunities, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, sortMode });

  const listKey = JSON.stringify([pathname, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, eligibleOnly, keyword, sortMode, source, periodStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">카테고리 탐색</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          공모전·대외활동·채용·정부정책을 선택하고, 검색어로 원하는 공고를 찾아보세요.
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600 dark:text-slate-300">출처
            <select aria-label="출처" value={source} onChange={(e) => updateQuery("source", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
              <option value="">전체 출처</option>
              {COLLECTOR_SOURCES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">모집 상태
            <select aria-label="모집 상태" value={periodStatus} onChange={(e) => updateQuery("period_status", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
              <option value="">전체 상태</option><option value="ongoing">모집 중</option><option value="upcoming">모집 예정</option><option value="always_open">상시 모집</option><option value="unknown">기간 미상</option><option value="expired">마감</option>
            </select>
          </label>
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
        <p role="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">{isLoading ? "불러오는 중…" : error ? "조회 실패" : `전체 ${total.toLocaleString()}건`}</p>
        <select
          aria-label="정렬"
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

      {loadingMore && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">나머지 공고를 불러오는 중이에요. 먼저 불러온 결과를 살펴보세요.</p>}
      {backgroundError && <div role="alert" className="rounded-xl border border-amber-300 p-4 text-sm">
        <p>{backgroundError}</p><button onClick={retry} className="mt-2 rounded-lg border px-3 py-2">다시 시도</button>
      </div>}
      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 p-5"><p>{error}</p><button onClick={retry} className="mt-3 rounded-lg border px-3 py-2">다시 시도</button></div>
      ) : items.length === 0 ? (
        isLoading || loadingMore ? (
          <LoadingState title={isLoading ? "기회를 불러오는 중이에요" : "조건에 맞는 기회를 찾는 중이에요"} />
        ) : (
          <EmptyState icon={LayoutGrid} title={backgroundError ? "불러온 공고 중 조건에 맞는 기회가 없어요" : "조건에 맞는 기회가 없어요"} description={backgroundError ? "나머지 공고를 다시 불러오거나 필터를 조정해보세요." : "필터나 검색어를 조정해보세요."} />
        )
      ) : (
        <CategoryResultList key={listKey} items={items} loadingMore={loadingMore} backgroundError={backgroundError} />
      )}
    </div>
  );
}
