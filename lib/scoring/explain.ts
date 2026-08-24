import type { EligibilityJudgement, Opportunity, ScoreSubscore, ScoreSubscoreKey, UserProfile } from "../types";
import { daysUntil } from "../mock/dateHelpers";

type ClauseBuilder = (profile: UserProfile, opp: Opportunity) => string | null;

const CLAUSES: Partial<Record<ScoreSubscoreKey, ClauseBuilder>> = {
  interest: (profile, opp) => {
    const matchedJob = profile.jobInterests.find((f) => opp.tags.includes(f));
    if (matchedJob) return `${matchedJob} 관심분야와 일치하고`;
    const matchedKeyword = profile.interests.find((k) => opp.tags.includes(k));
    if (matchedKeyword) return `평소 관심 키워드(${matchedKeyword})와 맞닿아 있고`;
    return null;
  },
  value: (_profile, opp) => {
    if (opp.portfolioValue >= 4) return "포트폴리오/커리어에 남기기 좋은 기회이고";
    if (opp.benefitAmount && opp.benefitAmount >= 5_000_000) return "혜택 규모가 크고";
    return null;
  },
  urgency: (_profile, opp) => {
    if (opp.isAlwaysOpen) return null;
    const d = daysUntil(opp.applyEndDate);
    if (d >= 7 && d <= 21) return `마감까지 ${d}일 남아 준비 기간이 적절하고`;
    if (d >= 0 && d <= 3) return `마감이 D-${d}로 임박했고`;
    return null;
  },
  competition: (_profile, opp) => {
    if (opp.requiredExperienceLevel === "무관") return "경력 제한이 없고";
    if (opp.competitionLevel <= 2) return "상대적으로 도전하기 좋은 난이도이고";
    return null;
  },
};

const ORDER: ScoreSubscoreKey[] = ["interest", "value", "urgency", "competition"];

export function buildExplanation(
  profile: UserProfile,
  opp: Opportunity,
  subscores: ScoreSubscore[],
  judgement: EligibilityJudgement,
): string {
  if (judgement.overall === "fail") {
    const failed = judgement.items.find((i) => i.status === "fail");
    return failed
      ? `${failed.label}이 맞지 않아 지원이 어려울 수 있습니다. ${failed.reason}`
      : "일부 자격 조건이 맞지 않아 지원이 어려울 수 있습니다.";
  }

  const bySubKey = new Map(subscores.map((s) => [s.key, s]));
  const clauses: string[] = [];
  for (const key of ORDER) {
    const sub = bySubKey.get(key);
    const builder = CLAUSES[key];
    if (!sub || !builder || sub.rawScore < 0.7) continue;
    const clause = builder(profile, opp);
    if (clause) clauses.push(clause);
    if (clauses.length === 2) break;
  }

  const closing =
    judgement.overall === "unknown"
      ? "다만 일부 조건은 서류로 확인이 필요합니다."
      : "참여를 고려해볼 만한 기회입니다.";

  if (clauses.length === 0) return closing;

  return `${clauses.join(" ")} ${closing}`;
}
