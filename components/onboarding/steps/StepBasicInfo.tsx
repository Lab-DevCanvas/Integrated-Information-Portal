"use client";

import { EDUCATION_STATUSES, REGIONS } from "@/lib/constants";
import { Chip } from "@/components/ui/Chip";
import type { UserProfile } from "@/lib/types";

interface Props {
  draft: Pick<UserProfile, "name" | "age" | "region" | "educationStatus">;
  onChange: (patch: Partial<UserProfile>) => void;
}

const PROFILE_REGIONS = REGIONS.filter((r) => r !== "전국");

export function StepBasicInfo({ draft, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">이름 (선택)</label>
        <input
          type="text"
          value={draft.name ?? ""}
          onChange={(e) => onChange({ name: e.target.value || undefined })}
          placeholder="홍길동"
          maxLength={20}
          className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">나이</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={14}
            max={100}
            value={draft.age}
            onChange={(e) => onChange({ age: Number(e.target.value) || 0 })}
            className="w-32 rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">세</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">거주 지역</label>
        <div className="flex flex-wrap gap-2">
          {PROFILE_REGIONS.map((r) => (
            <Chip key={r} selected={draft.region === r} onClick={() => onChange({ region: r })}>
              {r}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">학력 / 재학 상태</label>
        <div className="flex flex-wrap gap-2">
          {EDUCATION_STATUSES.map((e) => (
            <Chip key={e} selected={draft.educationStatus === e} onClick={() => onChange({ educationStatus: e })}>
              {e}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
