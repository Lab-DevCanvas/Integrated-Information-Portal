import { describe, expect, it } from "vitest";
import { SCORE_WEIGHTS } from "../constants";
import { daysFromNow } from "../mock/dateHelpers";
import { makeOpportunity, makeProfile } from "../testFixtures";
import type { EligibilityJudgement, ScoreSubscore, ScoreSubscoreKey } from "../types";
import { buildExplanation } from "./explain";

function makeSubscores(overrides: Partial<Record<ScoreSubscoreKey, number>> = {}): ScoreSubscore[] {
  const keys: ScoreSubscoreKey[] = ["eligibility", "interest", "value", "urgency", "competition", "behavior"];
  return keys.map((key) => {
    const rawScore = overrides[key] ?? 0.5;
    const { weight } = SCORE_WEIGHTS[key];
    return { key, label: SCORE_WEIGHTS[key].label, weight, rawScore, weightedScore: rawScore * weight };
  });
}

const PASS: EligibilityJudgement = { overall: "pass", items: [] };
const UNKNOWN: EligibilityJudgement = {
  overall: "unknown",
  items: [{ key: "income", label: "소득 조건", status: "unknown", reason: "서류 확인 필요" }],
};

describe("buildExplanation — ineligible", () => {
  it("leads with the failed item's label and reason", () => {
    const judgement: EligibilityJudgement = {
      overall: "fail",
      items: [{ key: "region", label: "지역 조건", status: "fail", reason: "서울 거주자만 지원 가능합니다." }],
    };
    const text = buildExplanation(makeProfile(), makeOpportunity(), makeSubscores(), judgement);
    expect(text).toContain("지역 조건");
    expect(text).toContain("서울 거주자만 지원 가능합니다.");
  });

  it("falls back to a generic message if no failed item is present (defensive)", () => {
    const judgement: EligibilityJudgement = { overall: "fail", items: [] };
    const text = buildExplanation(makeProfile(), makeOpportunity(), makeSubscores(), judgement);
    expect(text).toBe("일부 자격 조건이 맞지 않아 지원이 어려울 수 있습니다.");
  });
});

describe("buildExplanation — eligible, clause selection", () => {
  it("mentions the matched job interest when the interest subscore clears the threshold", () => {
    const profile = makeProfile({ jobInterests: ["IT개발"] });
    const opp = makeOpportunity({ tags: ["IT개발"] });
    const text = buildExplanation(profile, opp, makeSubscores({ interest: 0.9 }), PASS);
    expect(text).toContain("IT개발 관심분야와 일치하고");
  });

  it("mentions portfolio value when the value subscore clears the threshold", () => {
    const opp = makeOpportunity({ portfolioValue: 5 });
    const text = buildExplanation(makeProfile(), opp, makeSubscores({ value: 0.9 }), PASS);
    expect(text).toContain("포트폴리오/커리어에 남기기 좋은 기회이고");
  });

  it("mentions the days remaining when urgency is in the 7-21 day sweet spot", () => {
    const opp = makeOpportunity({ applyEndDate: daysFromNow(14) });
    const text = buildExplanation(makeProfile(), opp, makeSubscores({ urgency: 0.9 }), PASS);
    expect(text).toContain("14일 남아");
  });

  it("mentions imminent deadline phrasing when 3 days or fewer remain", () => {
    const opp = makeOpportunity({ applyEndDate: daysFromNow(2) });
    const text = buildExplanation(makeProfile(), opp, makeSubscores({ urgency: 0.9 }), PASS);
    expect(text).toContain("D-2로 임박");
  });

  it("mentions unrestricted experience when competition is high and requiredExperienceLevel is 무관", () => {
    const opp = makeOpportunity({ requiredExperienceLevel: "무관" });
    const text = buildExplanation(makeProfile(), opp, makeSubscores({ competition: 0.9 }), PASS);
    expect(text).toContain("경력 제한이 없고");
  });

  it("includes at most two clauses even if more qualify", () => {
    const opp = makeOpportunity({
      tags: ["IT개발"],
      portfolioValue: 5,
      applyEndDate: daysFromNow(14),
      requiredExperienceLevel: "무관",
    });
    const profile = makeProfile({ jobInterests: ["IT개발"] });
    const text = buildExplanation(
      profile,
      opp,
      makeSubscores({ interest: 0.9, value: 0.9, urgency: 0.9, competition: 0.9 }),
      PASS,
    );
    // interest + value are first in ORDER, so those two clauses should appear...
    expect(text).toContain("IT개발 관심분야와 일치하고");
    expect(text).toContain("포트폴리오/커리어에 남기기 좋은 기회이고");
    // ...and urgency/competition should be left out once two clauses are picked.
    expect(text).not.toContain("경력 제한이 없고");
  });

  it("falls back to a generic closing sentence when nothing clears the threshold", () => {
    const text = buildExplanation(makeProfile(), makeOpportunity(), makeSubscores(), PASS);
    expect(text).toBe("참여를 고려해볼 만한 기회입니다.");
  });

  it("uses the 확인 필요 closing sentence when the judgement is unknown", () => {
    const text = buildExplanation(makeProfile(), makeOpportunity(), makeSubscores(), UNKNOWN);
    expect(text).toContain("서류로 확인이 필요합니다");
  });
});
