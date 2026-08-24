"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { UserProfile } from "@/lib/types";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { StepBasicInfo } from "@/components/onboarding/steps/StepBasicInfo";
import { StepStatus } from "@/components/onboarding/steps/StepStatus";
import { StepInterests } from "@/components/onboarding/steps/StepInterests";
import { StepIncome } from "@/components/onboarding/steps/StepIncome";
import { StepReview } from "@/components/onboarding/steps/StepReview";
import { Button } from "@/components/ui/Button";

const STEP_LABELS = ["기본 정보", "현재 상태", "관심 분야", "소득 수준", "확인"];

const DEFAULT_DRAFT: UserProfile = {
  age: 26,
  region: "서울",
  educationStatus: "대학졸업예정",
  employmentStatus: "무직",
  jobInterests: [],
  startupInterest: false,
  housingStatus: "무주택",
  incomePercentile: undefined,
  interests: [],
  updatedAt: "",
};

/** First-run setup only — shown inside OnboardingModal until a profile exists.
 * Editing an existing profile happens on the separate /profile/edit page. */
export function OnboardingWizard() {
  const setProfile = useAppStore((s) => s.setProfile);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(DEFAULT_DRAFT);

  function patch(p: Partial<UserProfile>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    setProfile({ ...draft, updatedAt: new Date().toISOString() });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">몇 가지만 알려주세요</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          입력하신 정보를 바탕으로 지금 신청 가능한 기회를 찾아드려요.
        </p>
      </div>

      <OnboardingStepper currentStep={step} steps={STEP_LABELS} />

      <div className="min-h-[320px]">
        {step === 0 && <StepBasicInfo draft={draft} onChange={patch} />}
        {step === 1 && <StepStatus draft={draft} onChange={patch} />}
        {step === 2 && <StepInterests draft={draft} onChange={patch} />}
        {step === 3 && <StepIncome draft={draft} onChange={patch} />}
        {step === 4 && <StepReview draft={draft} />}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={back} disabled={step === 0}>
          이전
        </Button>
        {step === STEP_LABELS.length - 1 ? (
          <Button onClick={submit}>시작하기</Button>
        ) : (
          <Button onClick={next}>다음</Button>
        )}
      </div>
    </div>
  );
}
