"use client";

import type { UserProfile } from "@/lib/types";

interface Props {
  draft: Pick<UserProfile, "incomePercentile">;
  onChange: (patch: Partial<UserProfile>) => void;
}

export function StepIncome({ draft, onChange }: Props) {
  return (
    <div className="space-y-4">
      <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">가구 소득 수준 (선택)</label>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        기준중위소득 대비 %를 입력하면 소득 조건이 있는 지원사업의 적합도를 더 정확히 알려드려요. 잘 모르면
        비워두셔도 괜찮아요 — 해당 항목은 &quot;확인 필요&quot;로 안내해드립니다.
      </p>
      <div className="flex items-center gap-2 pt-2">
        <input
          type="number"
          min={0}
          max={300}
          value={draft.incomePercentile ?? ""}
          onChange={(e) =>
            onChange({ incomePercentile: e.target.value === "" ? undefined : Number(e.target.value) })
          }
          placeholder="예: 120"
          className="w-32 rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">% (기준중위소득 대비)</span>
      </div>
    </div>
  );
}
