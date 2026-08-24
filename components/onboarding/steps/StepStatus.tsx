"use client";

import { EMPLOYMENT_STATUSES } from "@/lib/constants";
import { Chip } from "@/components/ui/Chip";
import type { UserProfile } from "@/lib/types";

interface Props {
  draft: Pick<UserProfile, "employmentStatus" | "startupInterest" | "housingStatus">;
  onChange: (patch: Partial<UserProfile>) => void;
}

const HOUSING_OPTIONS: UserProfile["housingStatus"][] = ["무주택", "유주택", "무관"];

export function StepStatus({ draft, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">현재 취업 상태</label>
        <div className="flex flex-wrap gap-2">
          {EMPLOYMENT_STATUSES.map((s) => (
            <Chip key={s} selected={draft.employmentStatus === s} onClick={() => onChange({ employmentStatus: s })}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">창업에 관심이 있나요?</label>
        <div className="flex gap-2">
          <Chip selected={draft.startupInterest} onClick={() => onChange({ startupInterest: true })}>
            관심 있음
          </Chip>
          <Chip selected={!draft.startupInterest} onClick={() => onChange({ startupInterest: false })}>
            아직 없음
          </Chip>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">주택 보유 여부</label>
        <div className="flex flex-wrap gap-2">
          {HOUSING_OPTIONS.map((h) => (
            <Chip key={h} selected={draft.housingStatus === h} onClick={() => onChange({ housingStatus: h })}>
              {h}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
