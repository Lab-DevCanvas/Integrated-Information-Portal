"use client";

import { useState } from "react";
import { JOB_INTEREST_FIELDS, SUGGESTED_INTERESTS } from "@/lib/constants";
import { Chip } from "@/components/ui/Chip";
import type { JobInterestField, UserProfile } from "@/lib/types";

interface Props {
  draft: Pick<UserProfile, "jobInterests" | "interests">;
  onChange: (patch: Partial<UserProfile>) => void;
}

const MAX_JOB_INTERESTS = 3;

export function StepInterests({ draft, onChange }: Props) {
  const [customInterest, setCustomInterest] = useState("");

  function toggleJobInterest(field: JobInterestField) {
    const has = draft.jobInterests.includes(field);
    if (has) {
      onChange({ jobInterests: draft.jobInterests.filter((f) => f !== field) });
    } else if (draft.jobInterests.length < MAX_JOB_INTERESTS) {
      onChange({ jobInterests: [...draft.jobInterests, field] });
    }
  }

  function toggleInterest(tag: string) {
    const has = draft.interests.includes(tag);
    onChange({ interests: has ? draft.interests.filter((t) => t !== tag) : [...draft.interests, tag] });
  }

  function addCustomInterest() {
    const tag = customInterest.trim();
    if (tag && !draft.interests.includes(tag)) {
      onChange({ interests: [...draft.interests, tag] });
    }
    setCustomInterest("");
  }

  const customTags = draft.interests.filter((t) => !SUGGESTED_INTERESTS.includes(t));

  return (
    <div className="space-y-8">
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">
          관심 직무 (최대 {MAX_JOB_INTERESTS}개)
        </label>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">채용, 인턴, 공모전 추천에 활용됩니다.</p>
        <div className="flex flex-wrap gap-2">
          {JOB_INTEREST_FIELDS.map((f) => (
            <Chip key={f} selected={draft.jobInterests.includes(f)} onClick={() => toggleJobInterest(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-800 dark:text-slate-200">관심 키워드</label>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">자유롭게 추가해보세요.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED_INTERESTS.map((tag) => (
            <Chip key={tag} selected={draft.interests.includes(tag)} onClick={() => toggleInterest(tag)}>
              {tag}
            </Chip>
          ))}
        </div>
        <input
          value={customInterest}
          onChange={(e) => setCustomInterest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomInterest();
            }
          }}
          placeholder="직접 입력 후 Enter"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {customTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {customTags.map((t) => (
              <Chip key={t} selected onClick={() => toggleInterest(t)}>
                {t} ×
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
