import type { EligibilityJudgement, Opportunity, UserProfile } from "../types";

/** Numbered "why we recommend this" list for the detail page — distinct from
 * buildExplanation's single summary sentence used on cards. */
export function buildRecommendationReasons(
  profile: UserProfile,
  opp: Opportunity,
  judgement: EligibilityJudgement,
): string[] {
  const reasons: string[] = [];

  const matchedTags = opp.tags.filter(
    (t) => (profile.jobInterests as string[]).includes(t) || profile.interests.includes(t),
  );
  if (matchedTags.length > 0) {
    reasons.push(`${matchedTags.join(" · ")} 관심사와 높은 연관`);
  }

  for (const item of judgement.items) {
    if (item.status === "pass") {
      reasons.push(`${item.label} 충족`);
    }
  }

  if (reasons.length === 0) {
    reasons.push("전반적인 조건이 무난하게 부합하는 기회입니다.");
  }

  return reasons.slice(0, 5);
}
