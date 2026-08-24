import type { Opportunity, ScoreResult } from "../types";

export interface CompareEntry {
  opportunity: Opportunity;
  score: ScoreResult;
}

function getSubRaw(score: ScoreResult, key: string): number {
  return score.subscores.find((s) => s.key === key)?.rawScore ?? 0;
}

function benefitTierScore(o: Opportunity): number {
  if (!o.benefitAmount) return 0.5;
  const a = o.benefitAmount;
  if (a < 1_000_000) return 0.3;
  if (a < 3_000_000) return 0.5;
  if (a < 7_000_000) return 0.7;
  if (a < 20_000_000) return 0.85;
  return 1.0;
}

const METRIC_CLAUSES: Record<string, string> = {
  portfolio: "포트폴리오 가치가 높고",
  benefit: "혜택 규모가 크고",
  urgency: "준비 기간이 충분하고",
  competition: "경쟁이 상대적으로 덜 치열하고",
};

function metricsFor(entry: CompareEntry) {
  return {
    portfolio: entry.opportunity.portfolioValue / 5,
    benefit: benefitTierScore(entry.opportunity),
    urgency: getSubRaw(entry.score, "urgency"),
    competition: 1 - (entry.opportunity.competitionLevel - 1) / 4,
  };
}

export function buildComparisonSentence(entries: CompareEntry[]): string {
  if (entries.length < 2) return "";

  const allFail = entries.every((e) => e.score.eligibilityJudgement.overall === "fail");
  if (allFail) {
    const leastBad = [...entries].sort((a, b) => b.score.totalScore - a.score.totalScore)[0];
    return `비교한 기회 모두 일부 자격 조건이 맞지 않아요. 그래도 굳이 고른다면 ${leastBad.opportunity.title}가 상대적으로 조건에 가장 가깝습니다.`;
  }

  const eligible = entries.filter((e) => e.score.eligibilityJudgement.overall !== "fail");
  const pool = eligible.length > 0 ? eligible : entries;

  const winner = [...pool].sort((a, b) => {
    if (b.score.totalScore !== a.score.totalScore) return b.score.totalScore - a.score.totalScore;
    const eligDiff = getSubRaw(b.score, "eligibility") - getSubRaw(a.score, "eligibility");
    if (eligDiff !== 0) return eligDiff;
    return b.opportunity.portfolioValue - a.opportunity.portfolioValue;
  })[0];

  const opponents = entries.filter((e) => e.opportunity.id !== winner.opportunity.id);
  const winnerMetrics = metricsFor(winner);

  const clauses: string[] = [];
  for (const opp of opponents) {
    const oppMetrics = metricsFor(opp);
    let bestKey: keyof typeof winnerMetrics | null = null;
    let bestMargin = 0;
    (Object.keys(winnerMetrics) as (keyof typeof winnerMetrics)[]).forEach((key) => {
      const margin = winnerMetrics[key] - oppMetrics[key];
      if (margin > bestMargin) {
        bestMargin = margin;
        bestKey = key;
      }
    });
    if (bestKey) clauses.push(`${opp.opportunity.title}보다 ${METRIC_CLAUSES[bestKey]}`);
  }

  const uniqueClauses = Array.from(new Set(clauses));
  const body = uniqueClauses.length > 0 ? uniqueClauses.join(" ") : "비교 대상들보다 전반적으로 균형 잡힌 조건이고";

  return `${winner.opportunity.title}를 추천합니다. ${body} 참여를 고려해볼 만합니다.`;
}
