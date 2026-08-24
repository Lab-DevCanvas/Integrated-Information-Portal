import { describe, expect, it } from "vitest";
import { SCORE_WEIGHTS } from "../constants";
import { daysFromNow } from "../mock/dateHelpers";
import { makeOpportunity, makeProfile } from "../testFixtures";
import type { ScoreSubscoreKey } from "../types";
import { computeScore, scoreAll } from "./score";

function subscore(result: ReturnType<typeof computeScore>, key: ScoreSubscoreKey) {
  const found = result.subscores.find((s) => s.key === key);
  if (!found) throw new Error(`missing subscore ${key}`);
  return found;
}

describe("computeScore — overall shape", () => {
  it("produces a totalScore in [0, 100] derived from the weighted subscores", () => {
    const result = computeScore(makeProfile(), makeOpportunity());
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);

    const expectedTotal = Math.round(result.subscores.reduce((sum, s) => sum + s.weightedScore, 0) * 100);
    expect(result.totalScore).toBe(expectedTotal);
  });

  it("uses the six weights defined in SCORE_WEIGHTS, which sum to 1", () => {
    const result = computeScore(makeProfile(), makeOpportunity());
    expect(result.subscores).toHaveLength(6);
    for (const s of result.subscores) {
      expect(s.weight).toBe(SCORE_WEIGHTS[s.key].weight);
    }
    const totalWeight = Object.values(SCORE_WEIGHTS).reduce((sum, w) => sum + w.weight, 0);
    expect(totalWeight).toBeCloseTo(1);
  });

  it("is deterministic across repeated calls with the same inputs (no Math.random jitter)", () => {
    const profile = makeProfile();
    const opp = makeOpportunity();
    const a = computeScore(profile, opp, []);
    const b = computeScore(profile, opp, []);
    expect(a.totalScore).toBe(b.totalScore);
    expect(a.subscores).toEqual(b.subscores);
  });
});

describe("computeScore — eligibility subscore", () => {
  it("scores 1.0 when there are no eligibility rules", () => {
    const result = computeScore(makeProfile(), makeOpportunity({ eligibility: {} }));
    expect(subscore(result, "eligibility").rawScore).toBe(1);
  });

  it("caps at 0.3 when the eligibility judgement fails", () => {
    const opp = makeOpportunity({ eligibility: { regions: ["부산"] } });
    const result = computeScore(makeProfile({ region: "서울" }), opp);
    expect(result.eligibilityJudgement.overall).toBe("fail");
    expect(subscore(result, "eligibility").rawScore).toBeLessThanOrEqual(0.3);
  });

  it("scores partial credit (0.6 per item) when unknown", () => {
    const opp = makeOpportunity({ eligibility: { incomeMaxPercentile: 100 } });
    const result = computeScore(makeProfile({ incomePercentile: undefined }), opp);
    expect(result.eligibilityJudgement.overall).toBe("unknown");
    expect(subscore(result, "eligibility").rawScore).toBeCloseTo(0.6);
  });
});

describe("computeScore — interest subscore", () => {
  it("scores higher when a job interest tag matches than when nothing matches", () => {
    const profile = makeProfile({ jobInterests: ["IT개발"], interests: [] });
    const matching = makeOpportunity({ tags: ["IT개발"] });
    const nonMatching = makeOpportunity({ tags: ["마케팅"] });
    expect(subscore(computeScore(profile, matching), "interest").rawScore).toBeGreaterThan(
      subscore(computeScore(profile, nonMatching), "interest").rawScore,
    );
  });

  it("gives partial credit for freeform keyword overlap even without a job-interest match", () => {
    const profile = makeProfile({ jobInterests: [], interests: ["AI", "데이터"] });
    const opp = makeOpportunity({ tags: ["AI"] });
    expect(subscore(computeScore(profile, opp), "interest").rawScore).toBeGreaterThan(0);
  });
});

describe("computeScore — value subscore", () => {
  it("scores larger benefit amounts higher", () => {
    const profile = makeProfile();
    const small = makeOpportunity({ benefitAmount: 500_000, portfolioValue: 3 });
    const large = makeOpportunity({ benefitAmount: 50_000_000, portfolioValue: 3 });
    expect(subscore(computeScore(profile, large), "value").rawScore).toBeGreaterThan(
      subscore(computeScore(profile, small), "value").rawScore,
    );
  });

  it("falls back to a mid-range score when benefitAmount is undefined", () => {
    const opp = makeOpportunity({ benefitAmount: undefined, portfolioValue: 3 });
    const raw = subscore(computeScore(makeProfile(), opp), "value").rawScore;
    expect(raw).toBeGreaterThan(0);
    expect(raw).toBeLessThan(1);
  });
});

describe("computeScore — urgency subscore", () => {
  const profile = makeProfile();

  it("treats always-open opportunities as medium urgency", () => {
    const opp = makeOpportunity({ isAlwaysOpen: true, applyEndDate: daysFromNow(9999) });
    expect(subscore(computeScore(profile, opp), "urgency").rawScore).toBe(0.5);
  });

  it("scores the 7-21 day sweet spot highest", () => {
    const sweetSpot = makeOpportunity({ applyEndDate: daysFromNow(14) });
    const tooSoon = makeOpportunity({ applyEndDate: daysFromNow(1) });
    const tooFar = makeOpportunity({ applyEndDate: daysFromNow(120) });
    const sweetScore = subscore(computeScore(profile, sweetSpot), "urgency").rawScore;
    expect(sweetScore).toBe(1.0);
    expect(sweetScore).toBeGreaterThan(subscore(computeScore(profile, tooSoon), "urgency").rawScore);
    expect(sweetScore).toBeGreaterThan(subscore(computeScore(profile, tooFar), "urgency").rawScore);
  });
});

describe("computeScore — competition subscore", () => {
  it("gives full level-match credit when the opportunity requires 무관", () => {
    const opp = makeOpportunity({ requiredExperienceLevel: "무관", competitionLevel: 1 });
    const profile = makeProfile({ employmentStatus: "재직" });
    expect(subscore(computeScore(profile, opp), "competition").rawScore).toBeCloseTo(1);
  });

  it("penalizes higher competitionLevel even at a full level match", () => {
    const profile = makeProfile({ employmentStatus: "재직" });
    const easy = makeOpportunity({ requiredExperienceLevel: "무관", competitionLevel: 1 });
    const hard = makeOpportunity({ requiredExperienceLevel: "무관", competitionLevel: 5 });
    expect(subscore(computeScore(profile, hard), "competition").rawScore).toBeLessThan(
      subscore(computeScore(profile, easy), "competition").rawScore,
    );
  });

  it("penalizes a large mismatch between required and inferred experience level", () => {
    // 재직 -> inferred "초급(1~3년)"; a 경력(4년+) requirement is a distant mismatch
    const profile = makeProfile({ employmentStatus: "재직" });
    const distant = makeOpportunity({ requiredExperienceLevel: "경력(4년+)", competitionLevel: 1 });
    const matched = makeOpportunity({ requiredExperienceLevel: "초급(1~3년)", competitionLevel: 1 });
    expect(subscore(computeScore(profile, distant), "competition").rawScore).toBeLessThan(
      subscore(computeScore(profile, matched), "competition").rawScore,
    );
  });
});

describe("computeScore — behavior subscore", () => {
  it("scores 1.0 when the opportunity is already saved", () => {
    const opp = makeOpportunity({ id: "saved-one" });
    const result = computeScore(makeProfile(), opp, ["saved-one"]);
    expect(subscore(result, "behavior").rawScore).toBe(1);
  });

  it("is deterministic for the same id when not saved (no Math.random)", () => {
    const opp = makeOpportunity({ id: "unsaved-one" });
    const a = subscore(computeScore(makeProfile(), opp, []), "behavior").rawScore;
    const b = subscore(computeScore(makeProfile(), opp, []), "behavior").rawScore;
    expect(a).toBe(b);
  });
});

describe("scoreAll", () => {
  it("excludes expired opportunities unless they are always-open", () => {
    const profile = makeProfile();
    const expired = makeOpportunity({ id: "expired", applyEndDate: daysFromNow(-1) });
    const alwaysOpenExpiredDate = makeOpportunity({
      id: "always-open",
      isAlwaysOpen: true,
      applyEndDate: daysFromNow(-1),
    });
    const active = makeOpportunity({ id: "active", applyEndDate: daysFromNow(10) });

    const results = scoreAll(profile, [expired, alwaysOpenExpiredDate, active]);
    const ids = results.map((r) => r.opportunity.id);
    expect(ids).not.toContain("expired");
    expect(ids).toContain("always-open");
    expect(ids).toContain("active");
  });

  it("sorts by totalScore descending", () => {
    const profile = makeProfile({ jobInterests: ["IT개발"] });
    const strong = makeOpportunity({ id: "strong", tags: ["IT개발"], benefitAmount: 50_000_000 });
    const weak = makeOpportunity({ id: "weak", tags: ["영업"], benefitAmount: 100_000 });

    const results = scoreAll(profile, [weak, strong]);
    expect(results[0].opportunity.id).toBe("strong");
    expect(results[0].score.totalScore).toBeGreaterThanOrEqual(results[1].score.totalScore);
  });
});
