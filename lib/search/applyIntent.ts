import { daysUntil } from "../mock/dateHelpers";
import { computeScore } from "../scoring/score";
import type { Opportunity, ParsedIntent, SearchResultItem, UserProfile } from "../types";

function buildMatchReason(intent: ParsedIntent): string {
  const parts: string[] = [];
  if (intent.age !== undefined) parts.push(`${intent.age}세`);
  if (intent.region) parts.push(`${intent.region} 지역`);
  if (intent.employmentStatus) parts.push(intent.employmentStatus);
  if (intent.educationStatus) parts.push(intent.educationStatus);
  if (intent.jobInterest) parts.push(intent.jobInterest);
  if (intent.minBenefitAmount) parts.push(`${Math.round(intent.minBenefitAmount / 10_000).toLocaleString()}만원 이상`);
  if (intent.maxBenefitAmount) parts.push(`${Math.round(intent.maxBenefitAmount / 10_000).toLocaleString()}만원 이하`);
  if (intent.minDaysRemaining) parts.push(`마감까지 ${intent.minDaysRemaining}일 이상 남음`);
  if (intent.deadlineWithinDays !== undefined) parts.push("마감 임박");
  if (intent.unrestrictedDimensions.includes("education")) parts.push("학력 제한 없음");
  if (intent.unrestrictedDimensions.includes("experience")) parts.push("경력 무관");

  if (parts.length === 0) return "검색어와 프로필을 바탕으로 찾은 기회입니다.";
  return `"${parts.join(", ")}" 조건에 맞아 찾았습니다.`;
}

/**
 * Only dimensions explicitly parsed from the query hard-filter results.
 * Dimensions the user didn't mention fall back to the stored profile for
 * scoring (via computeScore) but never silently exclude a result — that's
 * what the per-card eligibility badge is for.
 */
export function filterAndSortByIntent(
  intent: ParsedIntent,
  opportunities: Opportunity[],
  profile: UserProfile,
  savedIds: string[] = [],
): SearchResultItem[] {
  const filtered = opportunities.filter((o) => {
    if (!o.isAlwaysOpen && daysUntil(o.applyEndDate) < 0) return false;
    if (intent.categoryHint && o.categoryId !== intent.categoryHint) return false;
    if (intent.opportunityTypeHint && o.opportunityType !== intent.opportunityTypeHint) return false;

    const e = o.eligibility;

    if (intent.age !== undefined && e.ageRange) {
      if (e.ageRange.min !== undefined && intent.age < e.ageRange.min) return false;
      if (e.ageRange.max !== undefined && intent.age > e.ageRange.max) return false;
    }

    if (intent.region && e.regions && e.regions.length > 0 && !e.regions.includes("전국") && !e.regions.includes(intent.region)) {
      return false;
    }

    if (
      intent.employmentStatus &&
      e.employmentStatuses &&
      e.employmentStatuses.length > 0 &&
      !e.employmentStatuses.includes(intent.employmentStatus)
    ) {
      return false;
    }

    if (
      intent.educationStatus &&
      e.educationStatuses &&
      e.educationStatuses.length > 0 &&
      !e.educationStatuses.includes(intent.educationStatus)
    ) {
      return false;
    }

    if (intent.unrestrictedDimensions.includes("education") && e.educationStatuses && e.educationStatuses.length > 0) {
      return false;
    }
    if (intent.unrestrictedDimensions.includes("experience") && o.requiredExperienceLevel !== "무관") {
      return false;
    }

    if (intent.jobInterest && !o.tags.includes(intent.jobInterest)) return false;

    if (intent.minBenefitAmount !== undefined && (!o.benefitAmount || o.benefitAmount < intent.minBenefitAmount)) {
      return false;
    }
    if (intent.maxBenefitAmount !== undefined && o.benefitAmount !== undefined && o.benefitAmount > intent.maxBenefitAmount) {
      return false;
    }

    if (intent.minDaysRemaining !== undefined && !o.isAlwaysOpen && daysUntil(o.applyEndDate) < intent.minDaysRemaining) {
      return false;
    }
    if (intent.deadlineWithinDays !== undefined && !o.isAlwaysOpen && daysUntil(o.applyEndDate) > intent.deadlineWithinDays) {
      return false;
    }

    return true;
  });

  const matchReason = buildMatchReason(intent);

  const results: SearchResultItem[] = filtered.map((opportunity) => ({
    opportunity,
    score: computeScore(profile, opportunity, savedIds),
    matchReason,
  }));

  switch (intent.sortHint) {
    case "deadline_asc":
      results.sort((a, b) => daysUntil(a.opportunity.applyEndDate) - daysUntil(b.opportunity.applyEndDate));
      break;
    case "benefit_desc":
      results.sort((a, b) => (b.opportunity.benefitAmount ?? 0) - (a.opportunity.benefitAmount ?? 0));
      break;
    case "portfolio_desc":
      results.sort((a, b) => b.opportunity.portfolioValue - a.opportunity.portfolioValue);
      break;
    default:
      results.sort((a, b) => b.score.totalScore - a.score.totalScore);
  }

  return results;
}
