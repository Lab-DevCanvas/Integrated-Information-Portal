import { describe, expect, it } from "vitest";
import { daysFromNow } from "../mock/dateHelpers";
import { makeOpportunity, makeProfile } from "../testFixtures";
import type { ParsedIntent } from "../types";
import { filterAndSortByIntent } from "./applyIntent";
import { parseQuery } from "./parser";

function makeIntent(overrides: Partial<ParsedIntent> = {}): ParsedIntent {
  return { rawQuery: "", unrestrictedDimensions: [], matchedKeywords: [], ...overrides };
}

describe("filterAndSortByIntent — base filtering", () => {
  it("excludes expired opportunities unless always-open", () => {
    const expired = makeOpportunity({ id: "expired", applyEndDate: daysFromNow(-1) });
    const alwaysOpen = makeOpportunity({ id: "always-open", isAlwaysOpen: true, applyEndDate: daysFromNow(-1) });
    const results = filterAndSortByIntent(makeIntent(), [expired, alwaysOpen], makeProfile());
    expect(results.map((r) => r.opportunity.id)).toEqual(["always-open"]);
  });

  it("filters by categoryHint and opportunityTypeHint", () => {
    const contest = makeOpportunity({ id: "contest", categoryId: "contest", opportunityType: "contest" });
    const job = makeOpportunity({ id: "job", categoryId: "job", opportunityType: "job" });
    const results = filterAndSortByIntent(
      makeIntent({ categoryHint: "contest", opportunityTypeHint: "contest" }),
      [contest, job],
      makeProfile(),
    );
    expect(results.map((r) => r.opportunity.id)).toEqual(["contest"]);
  });
});

describe("filterAndSortByIntent — precedence rule (only explicit query fields hard-filter)", () => {
  it("age filters only when the query mentions age AND the opportunity restricts age", () => {
    const restricted = makeOpportunity({ id: "restricted", eligibility: { ageRange: { min: 40 } } });
    const results = filterAndSortByIntent(makeIntent({ age: 20 }), [restricted], makeProfile());
    expect(results).toHaveLength(0);
  });

  it("does NOT filter by the profile's age when the query never mentioned age", () => {
    // Opportunity requires 40+, profile is 26 — but since intent.age is unset, the item survives
    // the search filter (the eligibility badge on the card communicates the mismatch instead).
    const restricted = makeOpportunity({ id: "restricted", eligibility: { ageRange: { min: 40 } } });
    const results = filterAndSortByIntent(makeIntent(), [restricted], makeProfile({ age: 26 }));
    expect(results).toHaveLength(1);
  });

  it("region filters only when explicitly mentioned in the query", () => {
    const seoulOnly = makeOpportunity({ id: "seoul-only", eligibility: { regions: ["서울"] } });
    expect(filterAndSortByIntent(makeIntent({ region: "부산" }), [seoulOnly], makeProfile())).toHaveLength(0);
    expect(filterAndSortByIntent(makeIntent(), [seoulOnly], makeProfile({ region: "부산" }))).toHaveLength(1);
  });

  it("nationwide (전국) opportunities always pass the region filter", () => {
    const nationwide = makeOpportunity({ id: "nationwide", eligibility: { regions: ["전국"] } });
    const results = filterAndSortByIntent(makeIntent({ region: "부산" }), [nationwide], makeProfile());
    expect(results).toHaveLength(1);
  });
});

describe("filterAndSortByIntent — unrestricted-dimension negation filters", () => {
  it("'education unrestricted' keeps only opportunities with no education restriction", () => {
    const restricted = makeOpportunity({ id: "restricted", eligibility: { educationStatuses: ["대학재학"] } });
    const open = makeOpportunity({ id: "open", eligibility: {} });
    const results = filterAndSortByIntent(
      makeIntent({ unrestrictedDimensions: ["education"] }),
      [restricted, open],
      makeProfile(),
    );
    expect(results.map((r) => r.opportunity.id)).toEqual(["open"]);
  });

  it("'experience unrestricted' keeps only 무관 opportunities", () => {
    const requiresExperience = makeOpportunity({ id: "senior", requiredExperienceLevel: "경력(4년+)" });
    const open = makeOpportunity({ id: "open", requiredExperienceLevel: "무관" });
    const results = filterAndSortByIntent(
      makeIntent({ unrestrictedDimensions: ["experience"] }),
      [requiresExperience, open],
      makeProfile(),
    );
    expect(results.map((r) => r.opportunity.id)).toEqual(["open"]);
  });
});

describe("filterAndSortByIntent — job interest, amount, and deadline filters", () => {
  it("filters by jobInterest tag membership", () => {
    const match = makeOpportunity({ id: "match", tags: ["IT개발"] });
    const noMatch = makeOpportunity({ id: "no-match", tags: ["마케팅"] });
    const results = filterAndSortByIntent(makeIntent({ jobInterest: "IT개발" }), [match, noMatch], makeProfile());
    expect(results.map((r) => r.opportunity.id)).toEqual(["match"]);
  });

  it("filters by minimum and maximum benefit amount", () => {
    const cheap = makeOpportunity({ id: "cheap", benefitAmount: 1_000_000 });
    const expensive = makeOpportunity({ id: "expensive", benefitAmount: 10_000_000 });
    expect(
      filterAndSortByIntent(makeIntent({ minBenefitAmount: 5_000_000 }), [cheap, expensive], makeProfile()).map(
        (r) => r.opportunity.id,
      ),
    ).toEqual(["expensive"]);
    expect(
      filterAndSortByIntent(makeIntent({ maxBenefitAmount: 5_000_000 }), [cheap, expensive], makeProfile()).map(
        (r) => r.opportunity.id,
      ),
    ).toEqual(["cheap"]);
  });

  it("excludes opportunities with no benefitAmount when a minimum is required", () => {
    const noAmount = makeOpportunity({ id: "no-amount", benefitAmount: undefined });
    const results = filterAndSortByIntent(makeIntent({ minBenefitAmount: 1 }), [noAmount], makeProfile());
    expect(results).toHaveLength(0);
  });

  it("filters by minDaysRemaining, exempting always-open opportunities (no deadline to run out on)", () => {
    const soon = makeOpportunity({ id: "soon", applyEndDate: daysFromNow(3) });
    const later = makeOpportunity({ id: "later", applyEndDate: daysFromNow(30) });
    const always = makeOpportunity({ id: "always", isAlwaysOpen: true, applyEndDate: daysFromNow(3) });
    const results = filterAndSortByIntent(makeIntent({ minDaysRemaining: 14 }), [soon, later, always], makeProfile());
    expect(results.map((r) => r.opportunity.id).sort()).toEqual(["always", "later"]);
  });

  it("filters by deadlineWithinDays, ignoring always-open opportunities", () => {
    const soon = makeOpportunity({ id: "soon", applyEndDate: daysFromNow(3) });
    const later = makeOpportunity({ id: "later", applyEndDate: daysFromNow(30) });
    const results = filterAndSortByIntent(makeIntent({ deadlineWithinDays: 7 }), [soon, later], makeProfile());
    expect(results.map((r) => r.opportunity.id)).toEqual(["soon"]);
  });
});

describe("filterAndSortByIntent — sorting", () => {
  const a = makeOpportunity({ id: "a", benefitAmount: 1_000_000, portfolioValue: 1, applyEndDate: daysFromNow(20) });
  const b = makeOpportunity({ id: "b", benefitAmount: 5_000_000, portfolioValue: 5, applyEndDate: daysFromNow(5) });

  it("sorts by deadline_asc", () => {
    const results = filterAndSortByIntent(makeIntent({ sortHint: "deadline_asc" }), [a, b], makeProfile());
    expect(results.map((r) => r.opportunity.id)).toEqual(["b", "a"]);
  });

  it("sorts by benefit_desc", () => {
    const results = filterAndSortByIntent(makeIntent({ sortHint: "benefit_desc" }), [a, b], makeProfile());
    expect(results.map((r) => r.opportunity.id)).toEqual(["b", "a"]);
  });

  it("sorts by portfolio_desc", () => {
    const results = filterAndSortByIntent(makeIntent({ sortHint: "portfolio_desc" }), [a, b], makeProfile());
    expect(results.map((r) => r.opportunity.id)).toEqual(["b", "a"]);
  });

  it("defaults to score_desc", () => {
    const results = filterAndSortByIntent(makeIntent(), [a, b], makeProfile());
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score.totalScore).toBeGreaterThanOrEqual(results[i].score.totalScore);
    }
  });
});

describe("filterAndSortByIntent — matchReason text", () => {
  it("summarizes the matched intent fields in quotes", () => {
    const opp = makeOpportunity();
    const results = filterAndSortByIntent(makeIntent({ age: 27, region: "서울" }), [opp], makeProfile());
    expect(results[0].matchReason).toContain("27세");
    expect(results[0].matchReason).toContain("서울 지역");
  });

  it("falls back to a generic reason when no intent fields were matched", () => {
    const opp = makeOpportunity();
    const results = filterAndSortByIntent(makeIntent(), [opp], makeProfile());
    expect(results[0].matchReason).toBe("검색어와 프로필을 바탕으로 찾은 기회입니다.");
  });
});

describe("filterAndSortByIntent — end-to-end with parseQuery, the 5 example queries", () => {
  const profile = makeProfile();

  // One fixture per query need: an unrestricted money-category item, a 기획/PM-tagged contest
  // with a benefit amount and a deadline inside every relevant window, and an unrestricted-experience
  // job. See each query's inline note for which fixture(s) it exercises and why.
  const subsidy = makeOpportunity({
    id: "subsidy",
    categoryId: "government-policy",
    opportunityType: "gov_support",
    subCategoryId: "subsidy",
    eligibility: {},
  });
  const contest = makeOpportunity({
    id: "contest",
    categoryId: "contest",
    opportunityType: "contest",
    subCategoryId: "contest",
    tags: ["기획/PM"],
    benefitAmount: 10_000_000,
    eligibility: {},
    applyStartDate: daysFromNow(-5),
    applyEndDate: daysFromNow(20),
  });
  const internship = makeOpportunity({
    id: "internship",
    categoryId: "job",
    opportunityType: "job",
    subCategoryId: "job_intern",
    requiredExperienceLevel: "무관",
    eligibility: {},
  });
  const sample = [subsidy, contest, internship];

  it.each([
    "서울에 사는 27살 무직인데 내가 받을 수 있는 지원금 찾아줘", // categoryId=money → subsidy
    "이번달 마감인 기획/PM 관련 공모전 찾아줘", // contest tagged 기획/PM, deadline in 20 days → contest
    "대학생 아니어도 참가 가능한 AI 공모전만 찾아줘", // unrestricted-education contest → contest
    "상금 500만원 이상이고 2주 이상 남은 공모전 찾아줘", // contest, 1000만원, 20 days left → contest
    "경력 무관 인턴 중에 스펙에 도움될만한 것만 골라줘", // unrestricted-experience job → internship
  ])("returns results for: %s", (query) => {
    const intent = parseQuery(query);
    const results = filterAndSortByIntent(intent, sample, profile);
    expect(results.length).toBeGreaterThan(0);
  });
});
