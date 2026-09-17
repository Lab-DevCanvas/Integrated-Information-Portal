import { daysSince } from "./mock/dateHelpers";
import { computeScore } from "./scoring/score";
import type { Opportunity, ScoreResult, UserProfile } from "./types";

export interface NotificationEntry {
  opportunity: Opportunity;
  score: ScoreResult;
}

const NEW_WINDOW_DAYS = 14;
const MIN_SCORE = 50;

function relevantEntriesWithin(
  windowDays: number,
  profile: UserProfile,
  savedIds: string[],
  opportunities: Opportunity[],
): NotificationEntry[] {
  return opportunities
    .filter((o) => daysSince(o.createdAt) <= windowDays)
    .map((opportunity) => ({ opportunity, score: computeScore(profile, opportunity, savedIds) }))
    .filter((entry) => entry.score.totalScore >= MIN_SCORE)
    .sort((a, b) => new Date(b.opportunity.createdAt).getTime() - new Date(a.opportunity.createdAt).getTime());
}

/** Used by the notifications page and profile menu badge — a broader "recently discovered" window. */
export function getNewOpportunities(
  profile: UserProfile,
  savedIds: string[],
  opportunities: Opportunity[],
): NotificationEntry[] {
  return relevantEntriesWithin(NEW_WINDOW_DAYS, profile, savedIds, opportunities);
}

/** Used by the dashboard's top teaser card — only opportunities added today. */
export function getTodaysOpportunities(
  profile: UserProfile,
  savedIds: string[],
  opportunities: Opportunity[],
): NotificationEntry[] {
  return relevantEntriesWithin(0, profile, savedIds, opportunities);
}
