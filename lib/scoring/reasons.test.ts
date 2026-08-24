import { describe, expect, it } from "vitest";
import { makeOpportunity, makeProfile } from "../testFixtures";
import type { EligibilityJudgement } from "../types";
import { buildRecommendationReasons } from "./reasons";

const EMPTY_JUDGEMENT: EligibilityJudgement = { overall: "pass", items: [] };

describe("buildRecommendationReasons", () => {
  it("leads with a joined interest-match line when tags overlap job interests or keywords", () => {
    const profile = makeProfile({ jobInterests: ["IT개발"], interests: ["AI"] });
    const opp = makeOpportunity({ tags: ["IT개발", "AI", "unrelated-tag"] });
    const reasons = buildRecommendationReasons(profile, opp, EMPTY_JUDGEMENT);
    expect(reasons[0]).toBe("IT개발 · AI 관심사와 높은 연관");
  });

  it("adds a '{label} 충족' line for every passing eligibility item, in order", () => {
    const judgement: EligibilityJudgement = {
      overall: "pass",
      items: [
        { key: "age", label: "나이 조건", status: "pass", reason: "..." },
        { key: "region", label: "지역 조건", status: "pass", reason: "..." },
      ],
    };
    const reasons = buildRecommendationReasons(makeProfile({ jobInterests: [], interests: [] }), makeOpportunity(), judgement);
    expect(reasons).toEqual(["나이 조건 충족", "지역 조건 충족"]);
  });

  it("skips failing and unknown items", () => {
    const judgement: EligibilityJudgement = {
      overall: "unknown",
      items: [
        { key: "age", label: "나이 조건", status: "pass", reason: "..." },
        { key: "income", label: "소득 조건", status: "unknown", reason: "..." },
        { key: "region", label: "지역 조건", status: "fail", reason: "..." },
      ],
    };
    const reasons = buildRecommendationReasons(makeProfile({ jobInterests: [], interests: [] }), makeOpportunity(), judgement);
    expect(reasons).toEqual(["나이 조건 충족"]);
  });

  it("falls back to a generic sentence when there is nothing to report", () => {
    const profile = makeProfile({ jobInterests: [], interests: [] });
    const reasons = buildRecommendationReasons(profile, makeOpportunity({ tags: [] }), EMPTY_JUDGEMENT);
    expect(reasons).toEqual(["전반적인 조건이 무난하게 부합하는 기회입니다."]);
  });

  it("caps the result at 5 reasons", () => {
    const judgement: EligibilityJudgement = {
      overall: "pass",
      items: Array.from({ length: 8 }, (_, i) => ({
        key: `k${i}`,
        label: `조건${i}`,
        status: "pass" as const,
        reason: "...",
      })),
    };
    const reasons = buildRecommendationReasons(makeProfile({ jobInterests: [], interests: [] }), makeOpportunity(), judgement);
    expect(reasons.length).toBeLessThanOrEqual(5);
  });
});
