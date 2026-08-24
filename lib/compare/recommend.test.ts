import { describe, expect, it } from "vitest";
import { makeOpportunity } from "../testFixtures";
import type { JudgeStatus, Opportunity } from "../types";
import { buildComparisonSentence, type CompareEntry } from "./recommend";

function makeEntry({
  opportunity = {},
  totalScore = 70,
  overall = "pass",
  urgencyRaw = 0.5,
  eligibilityRaw = 0.8,
}: {
  opportunity?: Partial<Opportunity>;
  totalScore?: number;
  overall?: JudgeStatus;
  urgencyRaw?: number;
  eligibilityRaw?: number;
} = {}): CompareEntry {
  return {
    opportunity: makeOpportunity(opportunity),
    score: {
      opportunityId: opportunity.id ?? "test-opp-01",
      totalScore,
      subscores: [
        {
          key: "eligibility",
          label: "지원자격",
          weight: 0.4,
          rawScore: eligibilityRaw,
          weightedScore: eligibilityRaw * 0.4,
        },
        { key: "urgency", label: "마감시점", weight: 0.1, rawScore: urgencyRaw, weightedScore: urgencyRaw * 0.1 },
      ],
      explanation: "",
      eligibilityJudgement: { overall, items: [] },
    },
  };
}

describe("buildComparisonSentence — edge cases", () => {
  it("returns an empty string for fewer than 2 entries", () => {
    expect(buildComparisonSentence([])).toBe("");
    expect(buildComparisonSentence([makeEntry()])).toBe("");
  });

  it("returns a 'least-bad' fallback sentence when every entry fails eligibility", () => {
    const a = makeEntry({ opportunity: { id: "a", title: "A 기회" }, totalScore: 40, overall: "fail" });
    const b = makeEntry({ opportunity: { id: "b", title: "B 기회" }, totalScore: 60, overall: "fail" });
    const sentence = buildComparisonSentence([a, b]);
    expect(sentence).toContain("B 기회");
    expect(sentence).toContain("자격 조건이 맞지 않아요");
  });
});

describe("buildComparisonSentence — winner selection", () => {
  it("picks the highest totalScore as the winner", () => {
    const a = makeEntry({ opportunity: { id: "a", title: "A 기회" }, totalScore: 60 });
    const b = makeEntry({ opportunity: { id: "b", title: "B 기회" }, totalScore: 90 });
    expect(buildComparisonSentence([a, b])).toContain("B 기회를 추천합니다.");
  });

  it("breaks a totalScore tie using the eligibility subscore", () => {
    const a = makeEntry({ opportunity: { id: "a", title: "A 기회" }, totalScore: 70, eligibilityRaw: 0.5 });
    const b = makeEntry({ opportunity: { id: "b", title: "B 기회" }, totalScore: 70, eligibilityRaw: 0.9 });
    expect(buildComparisonSentence([a, b])).toContain("B 기회를 추천합니다.");
  });

  it("breaks a totalScore+eligibility tie using portfolioValue", () => {
    const a = makeEntry({
      opportunity: { id: "a", title: "A 기회", portfolioValue: 2 },
      totalScore: 70,
      eligibilityRaw: 0.8,
    });
    const b = makeEntry({
      opportunity: { id: "b", title: "B 기회", portfolioValue: 5 },
      totalScore: 70,
      eligibilityRaw: 0.8,
    });
    expect(buildComparisonSentence([a, b])).toContain("B 기회를 추천합니다.");
  });

  it("never picks a failing entry as the winner when an eligible alternative exists", () => {
    const failing = makeEntry({
      opportunity: { id: "a", title: "실패 기회" },
      totalScore: 99,
      overall: "fail",
    });
    const eligible = makeEntry({ opportunity: { id: "b", title: "가능 기회" }, totalScore: 40, overall: "pass" });
    expect(buildComparisonSentence([failing, eligible])).toContain("가능 기회를 추천합니다.");
  });
});

describe("buildComparisonSentence — comparison clauses", () => {
  it("names the metric where the winner has the largest margin over each opponent", () => {
    const winner = makeEntry({
      opportunity: { id: "w", title: "우승 기회", portfolioValue: 5, benefitAmount: 500_000, competitionLevel: 5 },
      totalScore: 90,
      urgencyRaw: 0.1,
    });
    const opponent = makeEntry({
      opportunity: { id: "o", title: "패자 기회", portfolioValue: 1, benefitAmount: 500_000, competitionLevel: 5 },
      totalScore: 50,
      urgencyRaw: 0.1,
    });
    const sentence = buildComparisonSentence([winner, opponent]);
    expect(sentence).toContain("패자 기회보다 포트폴리오 가치가 높고");
  });

  it("gives each opponent its own clause, even when they share the same losing metric", () => {
    const winner = makeEntry({
      opportunity: { id: "w", title: "우승", portfolioValue: 5, benefitAmount: 100_000, competitionLevel: 5 },
      totalScore: 90,
      urgencyRaw: 0.1,
    });
    const opp1 = makeEntry({
      opportunity: { id: "o1", title: "상대1", portfolioValue: 1, benefitAmount: 100_000, competitionLevel: 5 },
      totalScore: 50,
      urgencyRaw: 0.1,
    });
    const opp2 = makeEntry({
      opportunity: { id: "o2", title: "상대2", portfolioValue: 1, benefitAmount: 100_000, competitionLevel: 5 },
      totalScore: 40,
      urgencyRaw: 0.1,
    });
    const sentence = buildComparisonSentence([winner, opp1, opp2]);
    expect(sentence).toContain("상대1보다 포트폴리오 가치가 높고");
    expect(sentence).toContain("상대2보다 포트폴리오 가치가 높고");
  });

  it("falls back to a generic 'balanced' clause when the winner has no clear metric edge", () => {
    const a = makeEntry({
      opportunity: { id: "a", title: "A", portfolioValue: 3, benefitAmount: 3_000_000, competitionLevel: 3 },
      totalScore: 71,
      urgencyRaw: 0.5,
      eligibilityRaw: 0.9,
    });
    const b = makeEntry({
      opportunity: { id: "b", title: "B", portfolioValue: 3, benefitAmount: 3_000_000, competitionLevel: 3 },
      totalScore: 70,
      urgencyRaw: 0.5,
      eligibilityRaw: 0.8,
    });
    const sentence = buildComparisonSentence([a, b]);
    expect(sentence).toContain("균형 잡힌 조건");
  });
});
