import { contestPresentation } from "./contestInterests";
import { computeScore } from "./score";
import type { Opportunity, UserProfile } from "../types";

export function presentOpportunity(opportunity: Opportunity, profile: UserProfile | null, savedIds: string[] = []) {
  const evidence = contestPresentation(opportunity, profile);
  const score = profile && !evidence.crawled ? computeScore(profile, opportunity, savedIds) : undefined;
  return { opportunity, ...evidence, score, eligibilityStatus: evidence.age?.failed ? "fail" as const : evidence.crawled ? "unknown" as const : undefined,
    percent: evidence.fit?.percent ?? score?.totalScore, matchReason: evidence.matchReason ?? score?.explanation };
}
export type PresentedOpportunity = ReturnType<typeof presentOpportunity>;
