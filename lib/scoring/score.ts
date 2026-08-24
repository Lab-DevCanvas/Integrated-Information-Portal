import type { ExperienceLevel, Opportunity, ScoreResult, ScoreSubscore, ScoreSubscoreKey, UserProfile } from "../types";
import { SCORE_WEIGHTS } from "../constants";
import { judgeEligibility } from "../eligibility/judge";
import { daysUntil } from "../mock/dateHelpers";
import { OPPORTUNITIES } from "../mock/opportunities";
import { buildExplanation } from "./explain";

const VIEW_COUNTS = OPPORTUNITIES.map((o) => o.viewCount ?? 0);
const VIEW_MIN = Math.min(...VIEW_COUNTS);
const VIEW_MAX = Math.max(...VIEW_COUNTS);

function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

/** Deterministic pseudo-random-looking hash in [0,1) — never Math.random(), so scores never jitter across renders. */
function simpleStringHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return (h % 100) / 100;
}

function scoreEligibilityRaw(overall: string, items: { status: string }[]): number {
  if (items.length === 0) return 1.0;
  const raw =
    items.reduce((sum, i) => sum + (i.status === "pass" ? 1 : i.status === "unknown" ? 0.6 : 0), 0) / items.length;
  return overall === "fail" ? Math.min(raw, 0.3) : raw;
}

function scoreInterest(profile: UserProfile, opp: Opportunity): number {
  const jobMatch = profile.jobInterests.some((f) => opp.tags.includes(f)) ? 1 : 0;
  const overlapCount = profile.interests.filter((k) => opp.tags.includes(k)).length;
  const keywordOverlap = clamp(overlapCount / 3);
  return clamp(0.6 * jobMatch + 0.4 * keywordOverlap);
}

function scoreValue(opp: Opportunity): number {
  let amountScore = 0.5;
  if (opp.benefitAmount !== undefined) {
    const a = opp.benefitAmount;
    if (a < 1_000_000) amountScore = 0.3;
    else if (a < 3_000_000) amountScore = 0.5;
    else if (a < 7_000_000) amountScore = 0.7;
    else if (a < 20_000_000) amountScore = 0.85;
    else amountScore = 1.0;
  }
  const portfolioScore = opp.portfolioValue / 5;
  return clamp(0.5 * amountScore + 0.5 * portfolioScore);
}

function scoreUrgency(opp: Opportunity): number {
  if (opp.isAlwaysOpen) return 0.5;
  const d = daysUntil(opp.applyEndDate);
  if (d < 0) return 0;
  if (d <= 2) return 0.5;
  if (d <= 21) return 1.0;
  if (d <= 45) return 0.7;
  if (d <= 90) return 0.4;
  return 0.2;
}

const LEVEL_ORDER: ExperienceLevel[] = ["무관", "대학생", "취준생", "초급(1~3년)", "경력(4년+)"];

function inferExperienceLevel(profile: UserProfile): ExperienceLevel {
  if (["고등학생", "대학재학", "대학원재학"].includes(profile.educationStatus)) return "대학생";
  if (profile.employmentStatus === "무직" && ["대학졸업예정", "대학졸업", "대학원졸업"].includes(profile.educationStatus))
    return "취준생";
  if (profile.employmentStatus === "재직") return "초급(1~3년)";
  return "무관";
}

function scoreCompetition(profile: UserProfile, opp: Opportunity): number {
  const implied = inferExperienceLevel(profile);
  let levelMatch: number;
  if (opp.requiredExperienceLevel === "무관" || opp.requiredExperienceLevel === implied) {
    levelMatch = 1.0;
  } else {
    const idxA = LEVEL_ORDER.indexOf(opp.requiredExperienceLevel);
    const idxB = LEVEL_ORDER.indexOf(implied);
    levelMatch = Math.abs(idxA - idxB) === 1 ? 0.6 : 0.3;
  }
  const competitionPenalty = 1 - ((opp.competitionLevel - 1) / 4) * 0.5;
  return clamp(0.6 * levelMatch + 0.4 * competitionPenalty);
}

function scoreBehavior(opp: Opportunity, savedIds: string[]): number {
  if (savedIds.includes(opp.id)) return 1.0;
  const hash = simpleStringHash(opp.id);
  const popularity =
    VIEW_MAX > VIEW_MIN ? clamp(((opp.viewCount ?? 0) - VIEW_MIN) / (VIEW_MAX - VIEW_MIN)) : 0.5;
  return clamp(0.5 * hash + 0.5 * popularity);
}

export function computeScore(profile: UserProfile, opp: Opportunity, savedIds: string[] = []): ScoreResult {
  const judgement = judgeEligibility(profile, opp);

  const rawByKey: Record<ScoreSubscoreKey, number> = {
    eligibility: scoreEligibilityRaw(judgement.overall, judgement.items),
    interest: scoreInterest(profile, opp),
    value: scoreValue(opp),
    urgency: scoreUrgency(opp),
    competition: scoreCompetition(profile, opp),
    behavior: scoreBehavior(opp, savedIds),
  };

  const subscores: ScoreSubscore[] = (Object.keys(rawByKey) as ScoreSubscoreKey[]).map((key) => {
    const { label, weight } = SCORE_WEIGHTS[key];
    const rawScore = rawByKey[key];
    return { key, label, weight, rawScore, weightedScore: rawScore * weight };
  });

  const totalScore = Math.round(subscores.reduce((sum, s) => sum + s.weightedScore, 0) * 100);
  const explanation = buildExplanation(profile, opp, subscores, judgement);

  return { opportunityId: opp.id, totalScore, subscores, explanation, eligibilityJudgement: judgement };
}

export function scoreAll(profile: UserProfile, opportunities: Opportunity[], savedIds: string[] = []) {
  return opportunities
    .filter((o) => o.isAlwaysOpen || daysUntil(o.applyEndDate) >= 0)
    .map((opportunity) => ({ opportunity, score: computeScore(profile, opportunity, savedIds) }))
    .sort((a, b) => b.score.totalScore - a.score.totalScore);
}
