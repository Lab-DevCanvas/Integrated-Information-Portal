import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";
import type {
  EducationStatus,
  EmploymentStatus,
  ExperienceLevel,
  JobInterestField,
  OpportunityType,
  RegionCode,
  ScoreSubscoreKey,
} from "./types";

export const REGIONS: RegionCode[] = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "전국",
];

export const EDUCATION_STATUSES: EducationStatus[] = [
  "고등학생",
  "대학재학",
  "대학원재학",
  "대학졸업예정",
  "대학졸업",
  "대학원졸업",
];

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = ["재직", "무직", "프리랜서", "창업준비"];

export const JOB_INTEREST_FIELDS: JobInterestField[] = [
  "IT개발",
  "기획/PM",
  "디자인",
  "마케팅",
  "경영/사무",
  "영업",
  "교육",
  "공공/행정",
  "연구/R&D",
  "제조/생산",
  "미디어/콘텐츠",
];

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "무관",
  "대학생",
  "취준생",
  "초급(1~3년)",
  "경력(4년+)",
];

export const SUGGESTED_INTERESTS: string[] = [
  "AI",
  "데이터",
  "스타트업",
  "글쓰기",
  "디자인",
  "마케팅",
  "봉사활동",
  "해외",
  "환경",
  "핀테크",
  "콘텐츠",
  "게임",
];

export const SCORE_WEIGHTS: Record<ScoreSubscoreKey, { label: string; weight: number }> = {
  eligibility: { label: "지원자격", weight: 0.4 },
  interest: { label: "관심도", weight: 0.2 },
  value: { label: "기대가치", weight: 0.15 },
  urgency: { label: "마감시점", weight: 0.1 },
  competition: { label: "경쟁가능성", weight: 0.1 },
  behavior: { label: "사용자 행동", weight: 0.05 },
};

export const COMPARE_MAX = 4;

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  contest: "공모전",
  external_activity: "대외활동",
  job: "채용/인턴",
  scholarship: "장학금",
  gov_support: "정부지원금",
  youth_policy: "청년정책",
  housing_support: "주거지원",
  startup_support: "창업지원",
  education: "교육",
};

export function scoreTier(score: number): { label: string; className: string } {
  if (score >= 85)
    return {
      label: "매우 적합",
      className: "text-emerald-700 bg-emerald-50 ring-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:ring-emerald-500/30",
    };
  if (score >= 70)
    return {
      label: "적합",
      className: "text-blue-700 bg-blue-50 ring-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:ring-blue-500/30",
    };
  if (score >= 50)
    return {
      label: "관심 후보",
      className: "text-amber-700 bg-amber-50 ring-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:ring-amber-500/30",
    };
  return {
    label: "낮은 매칭",
    className: "text-slate-600 bg-slate-50 ring-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:ring-slate-700",
  };
}

export const JUDGE_STATUS_META: Record<
  "pass" | "fail" | "unknown",
  { icon: LucideIcon; label: string; className: string; iconClassName: string }
> = {
  pass: {
    icon: CircleCheck,
    label: "지원 가능",
    className: "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  unknown: {
    icon: CircleAlert,
    label: "확인 필요",
    className: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  fail: {
    icon: CircleX,
    label: "지원 불가",
    className: "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
    iconClassName: "text-rose-600 dark:text-rose-400",
  },
};
