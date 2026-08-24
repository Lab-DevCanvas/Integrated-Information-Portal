import Link from "next/link";
import { CircleAlert, CircleCheck, CircleX, Minus, type LucideIcon } from "lucide-react";
import type { EligibilityJudgement, EligibilityRules, JudgeStatus, Opportunity } from "@/lib/types";

type RowStatus = JudgeStatus | "none";

const STATUS_META: Record<RowStatus, { icon: LucideIcon; label: string; className: string }> = {
  pass: { icon: CircleCheck, label: "충족", className: "text-emerald-600 dark:text-emerald-400" },
  fail: { icon: CircleX, label: "미충족", className: "text-rose-600 dark:text-rose-400" },
  unknown: { icon: CircleAlert, label: "확인 필요", className: "text-amber-600 dark:text-amber-400" },
  none: { icon: Minus, label: "해당없음", className: "text-slate-400 dark:text-slate-500" },
};

const FIXED_ROWS: { key: string; label: string; valueText: (e: EligibilityRules) => string }[] = [
  {
    key: "age",
    label: "나이",
    valueText: (e) => {
      if (!e.ageRange || (e.ageRange.min === undefined && e.ageRange.max === undefined)) return "제한없음";
      const { min, max } = e.ageRange;
      if (min !== undefined && max !== undefined) return `만 ${min}–${max}세`;
      if (min !== undefined) return `만 ${min}세 이상`;
      return `만 ${max}세 이하`;
    },
  },
  {
    key: "region",
    label: "거주지역",
    valueText: (e) => (e.regions && e.regions.length > 0 ? e.regions.join(" · ") : "제한없음"),
  },
  {
    key: "employment",
    label: "현재 상태",
    valueText: (e) =>
      e.employmentStatuses && e.employmentStatuses.length > 0 ? e.employmentStatuses.join(" · ") : "제한없음",
  },
  {
    key: "education",
    label: "학력",
    valueText: (e) =>
      e.educationStatuses && e.educationStatuses.length > 0 ? e.educationStatuses.join(" · ") : "제한없음",
  },
  {
    key: "income",
    label: "소득·자산",
    valueText: (e) => (e.incomeMaxPercentile !== undefined ? `기준중위소득 ${e.incomeMaxPercentile}% 이하` : "제한없음"),
  },
];

const FIXED_KEYS = new Set(FIXED_ROWS.map((r) => r.key));

export function EligibilityTable({
  opportunity,
  judgement,
}: {
  opportunity: Opportunity;
  judgement: EligibilityJudgement;
}) {
  const itemByKey = new Map(judgement.items.map((i) => [i.key, i]));
  const extraItems = judgement.items.filter((i) => !FIXED_KEYS.has(i.key));
  const needsProfileInfo = itemByKey.get("income")?.status === "unknown";

  const rows = [
    ...FIXED_ROWS.map((row) => {
      const item = itemByKey.get(row.key);
      return {
        key: row.key,
        label: row.label,
        value: row.valueText(opportunity.eligibility),
        status: (item ? item.status : "none") as RowStatus,
      };
    }),
    ...extraItems.map((item) => ({ key: item.key, label: item.label, value: item.reason, status: item.status as RowStatus })),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      {rows.map((row, idx) => {
        const meta = STATUS_META[row.status];
        const Icon = meta.icon;
        return (
          <div
            key={row.key}
            className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
              idx > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-700 dark:text-slate-300">{row.label}</p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{row.value}</p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${meta.className}`}>
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
          </div>
        );
      })}
      {needsProfileInfo && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <Link
            href="/profile/edit"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            프로필 정보 추가하고 다시 확인 →
          </Link>
        </div>
      )}
    </div>
  );
}
