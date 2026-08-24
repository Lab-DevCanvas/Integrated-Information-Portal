import type { EligibilityCheckItem, EligibilityJudgement, JudgeStatus, Opportunity, UserProfile } from "../types";

const INCOME_MARGIN = 10;

export function judgeEligibility(profile: UserProfile, opp: Opportunity): EligibilityJudgement {
  const items: EligibilityCheckItem[] = [];
  const e = opp.eligibility;

  if (e.ageRange && (e.ageRange.min !== undefined || e.ageRange.max !== undefined)) {
    const { min, max } = e.ageRange;
    const pass = (min === undefined || profile.age >= min) && (max === undefined || profile.age <= max);
    const rangeLabel = `${min ?? ""}${min !== undefined && max !== undefined ? "~" : ""}${max ?? "세 이상"}`;
    items.push({
      key: "age",
      label: "나이 조건",
      status: pass ? "pass" : "fail",
      reason: pass
        ? `만 ${rangeLabel}세 조건을 충족합니다.`
        : `만 ${rangeLabel}세 대상이며, 현재 나이(${profile.age}세)와 맞지 않습니다.`,
    });
  }

  if (e.regions && e.regions.length > 0) {
    const pass = e.regions.includes("전국") || e.regions.includes(profile.region);
    items.push({
      key: "region",
      label: "지역 조건",
      status: pass ? "pass" : "fail",
      reason: pass
        ? `${profile.region} 거주자로 지역 조건을 충족합니다.`
        : `${e.regions.join("/")} 거주자만 지원 가능하며, 현재 거주지역(${profile.region})과 맞지 않습니다.`,
    });
  }

  if (e.educationStatuses && e.educationStatuses.length > 0) {
    const pass = e.educationStatuses.includes(profile.educationStatus);
    items.push({
      key: "education",
      label: "학력/재학 상태",
      status: pass ? "pass" : "fail",
      reason: pass
        ? `${profile.educationStatus} 상태로 조건을 충족합니다.`
        : `${e.educationStatuses.join("/")} 대상이며, 현재 상태(${profile.educationStatus})와 맞지 않습니다.`,
    });
  }

  if (e.employmentStatuses && e.employmentStatuses.length > 0) {
    const pass = e.employmentStatuses.includes(profile.employmentStatus);
    items.push({
      key: "employment",
      label: "취업 상태",
      status: pass ? "pass" : "fail",
      reason: pass
        ? `${profile.employmentStatus} 상태로 조건을 충족합니다.`
        : `${e.employmentStatuses.join("/")} 대상이며, 현재 상태(${profile.employmentStatus})와 맞지 않습니다.`,
    });
  }

  if (e.incomeMaxPercentile !== undefined) {
    let status: JudgeStatus = "unknown";
    let reason = "소득 정보를 입력하지 않아 직접 확인이 필요합니다.";
    if (profile.incomePercentile !== undefined) {
      if (profile.incomePercentile <= e.incomeMaxPercentile - INCOME_MARGIN) {
        status = "pass";
        reason = `기준중위소득 ${e.incomeMaxPercentile}% 이하 조건을 여유있게 충족하는 것으로 보입니다.`;
      } else {
        status = "unknown";
        reason = "정확한 소득 기준은 건강보험료 납부확인서 등 서류로 확인이 필요합니다.";
      }
    }
    items.push({ key: "income", label: "소득 조건", status, reason });
  }

  if (e.requiresHousinglessness) {
    let status: JudgeStatus = "unknown";
    let reason = "무주택 여부를 확인할 수 없습니다.";
    if (profile.housingStatus === "무주택") {
      status = "pass";
      reason = "무주택 조건을 충족합니다.";
    } else if (profile.housingStatus === "유주택") {
      status = "fail";
      reason = "무주택자만 지원 가능하며, 현재 유주택 상태입니다.";
    }
    items.push({ key: "housing", label: "무주택 조건", status, reason });
  }

  if (e.requiresNoStartupHistory) {
    items.push({
      key: "startupHistory",
      label: "창업 이력 조건",
      status: "unknown",
      reason: "과거 창업/폐업 이력은 서류 확인이 필요합니다.",
    });
  }

  for (const cond of e.otherConditions ?? []) {
    items.push({
      key: cond.key,
      label: cond.label,
      status: cond.autoCheckable ? "unknown" : "unknown",
      reason: `${cond.label} — 상세 요건은 공고문에서 직접 확인이 필요합니다.`,
    });
  }

  const overall: JudgeStatus = items.some((i) => i.status === "fail")
    ? "fail"
    : items.some((i) => i.status === "unknown")
      ? "unknown"
      : "pass";

  return { overall, items };
}
