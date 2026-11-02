import type { UserProfile } from "./types";

interface CompletionField {
  label: string;
  isFilled: (p: UserProfile) => boolean;
}

/** Fields the onboarding flow treats as optional/skippable — the ones StepReview shows as "미입력"/"미선택". */
const COMPLETION_FIELDS: CompletionField[] = [
  { label: "이름", isFilled: (p) => !!p.name?.trim() },
  { label: "관심 직무", isFilled: (p) => p.jobInterests.length > 0 },
  { label: "관심 키워드", isFilled: (p) => p.interests.length > 0 },
  { label: "소득 수준", isFilled: (p) => p.incomePercentile !== undefined },
];

export interface ProfileCompletion {
  filledCount: number;
  totalCount: number;
  /** 0-1 */
  percent: number;
  missingLabels: string[];
  isComplete: boolean;
}

export function getProfileCompletion(profile: UserProfile): ProfileCompletion {
  if (profile.accountProfile) {
    const value = profile.accountProfile.completeness;
    return { filledCount: value.filled, totalCount: value.total, percent: value.ratio, missingLabels: value.missing.map((key) => ({ age_band: "연령대", residence_regions: "거주 지역", activity_regions: "활동 가능 지역", education_stage: "학력", employment_status: "현재 상태", income_band: "소득 구간", interest_categories: "관심 분야", interest_regions: "관심 지역", activity_mode: "선호 활동 방식" }[key] ?? key)), isComplete: value.missing.length === 0 };
  }
  const missing = COMPLETION_FIELDS.filter((f) => !f.isFilled(profile));
  const filledCount = COMPLETION_FIELDS.length - missing.length;
  return {
    filledCount,
    totalCount: COMPLETION_FIELDS.length,
    percent: filledCount / COMPLETION_FIELDS.length,
    missingLabels: missing.map((f) => f.label),
    isComplete: missing.length === 0,
  };
}
