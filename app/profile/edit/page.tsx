"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import type { UserProfile } from "@/lib/types";
import { StepBasicInfo } from "@/components/onboarding/steps/StepBasicInfo";
import { StepStatus } from "@/components/onboarding/steps/StepStatus";
import { StepInterests } from "@/components/onboarding/steps/StepInterests";
import { StepIncome } from "@/components/onboarding/steps/StepIncome";
import { Button } from "@/components/ui/Button";

export default function ProfileEditPage() {
  const router = useRouter();
  const storedProfile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const [draft, setDraft] = useState<UserProfile | null>(storedProfile);

  if (!draft) return null;

  function patch(p: Partial<UserProfile>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function save() {
    if (!draft) return;
    updateProfile(draft);
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-lg space-y-10 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">프로필 수정</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          정보를 최신 상태로 업데이트하면 추천이 더 정확해져요.
        </p>
      </div>

      <section className="space-y-4">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">기본 정보</p>
        <StepBasicInfo draft={draft} onChange={patch} />
      </section>

      <section className="space-y-4">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">현재 상태</p>
        <StepStatus draft={draft} onChange={patch} />
      </section>

      <section className="space-y-4">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">관심 분야</p>
        <StepInterests draft={draft} onChange={patch} />
      </section>

      <section className="space-y-4">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">소득 수준</p>
        <StepIncome draft={draft} onChange={patch} />
      </section>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-6 dark:border-slate-800">
        <Button variant="secondary" onClick={() => router.push("/")}>
          취소
        </Button>
        <Button onClick={save}>저장하기</Button>
      </div>
    </div>
  );
}
