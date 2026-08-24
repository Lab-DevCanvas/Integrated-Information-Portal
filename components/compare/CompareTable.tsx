import Link from "next/link";
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { formatKRW } from "@/lib/format";
import { daysUntil, formatDday } from "@/lib/mock/dateHelpers";
import type { CompareEntry } from "@/lib/compare/recommend";

function bestIndex(values: number[], mode: "max" | "min"): number {
  return values.reduce(
    (bestIdx, v, i, arr) => (mode === "max" ? (v > arr[bestIdx] ? i : bestIdx) : v < arr[bestIdx] ? i : bestIdx),
    0,
  );
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={
            i < value
              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
              : "h-3.5 w-3.5 fill-transparent text-slate-300 dark:text-slate-600"
          }
        />
      ))}
    </div>
  );
}

function LevelDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < value ? "bg-indigo-600 dark:bg-indigo-400" : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

export function CompareTable({ entries }: { entries: CompareEntry[] }) {
  const bestScoreIdx = bestIndex(
    entries.map((e) => e.score.totalScore),
    "max",
  );
  const bestBenefitIdx = bestIndex(
    entries.map((e) => e.opportunity.benefitAmount ?? 0),
    "max",
  );
  const bestDifficultyIdx = bestIndex(
    entries.map((e) => e.opportunity.competitionLevel),
    "min",
  );
  const bestDaysIdx = bestIndex(
    entries.map((e) => (e.opportunity.isAlwaysOpen ? 9999 : daysUntil(e.opportunity.applyEndDate))),
    "max",
  );
  const bestPortfolioIdx = bestIndex(
    entries.map((e) => e.opportunity.portfolioValue),
    "max",
  );

  const rows: { label: string; render: (e: CompareEntry) => ReactNode; bestIdx: number }[] = [
    { label: "적합도", render: (e) => `${e.score.totalScore}%`, bestIdx: bestScoreIdx },
    {
      label: "혜택",
      render: (e) => (e.opportunity.benefitAmount ? formatKRW(e.opportunity.benefitAmount) : e.opportunity.benefitDescription),
      bestIdx: bestBenefitIdx,
    },
    {
      label: "난이도",
      render: (e) => <LevelDots value={e.opportunity.competitionLevel} />,
      bestIdx: bestDifficultyIdx,
    },
    {
      label: "남은 기간",
      render: (e) => formatDday(e.opportunity.applyEndDate, e.opportunity.isAlwaysOpen),
      bestIdx: bestDaysIdx,
    },
    { label: "팀 필요", render: (e) => (e.opportunity.teamRequired ? "필요" : "개인 가능"), bestIdx: -1 },
    {
      label: "포트폴리오 가치",
      render: (e) => <StarRating value={e.opportunity.portfolioValue} />,
      bestIdx: bestPortfolioIdx,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="p-3 text-left text-xs font-medium text-slate-400 dark:text-slate-500"> </th>
            {entries.map((e) => (
              <th key={e.opportunity.id} className="p-3 text-left align-top">
                <Link
                  href={`/opportunities/${e.opportunity.id}`}
                  className="line-clamp-2 text-sm font-bold text-slate-900 hover:text-indigo-700 dark:text-slate-50 dark:hover:text-indigo-400"
                >
                  {e.opportunity.title}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="p-3 text-xs font-medium whitespace-nowrap text-slate-400 dark:text-slate-500">{row.label}</td>
              {entries.map((e, i) => (
                <td
                  key={e.opportunity.id}
                  className={`p-3 text-sm whitespace-nowrap ${
                    i === row.bestIdx
                      ? "font-bold text-indigo-700 dark:text-indigo-400"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {row.render(e)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
