import { describe, expect, it } from "vitest";
import { getNewOpportunities, getTodaysOpportunities } from "./notifications";
import { daysFromNow, daysSince } from "./mock/dateHelpers";
import { computeScore } from "./scoring/score";
import { makeOpportunity, makeProfile } from "./testFixtures";

/**
 * Profile-matching tags/benefit/competition push these well past the 50-point floor; a mismatched
 * profile (wrong tags, senior-only experience requirement, low portfolio value) keeps a fixture
 * well under it. See docs comment in each fixture for its role.
 */
function buildFixtures() {
  // Created today, scores high — included in both the 0-day and 14-day windows.
  const today = makeOpportunity({
    id: "today-high",
    tags: ["기획/PM", "AI"],
    benefitAmount: 5_000_000,
    portfolioValue: 4,
    competitionLevel: 2,
    requiredExperienceLevel: "무관",
    createdAt: daysFromNow(0),
  });
  // Created 10 days ago, scores high — outside the 0-day window but inside the 14-day one.
  const recentHigh = makeOpportunity({
    id: "recent-high",
    tags: ["기획/PM"],
    benefitAmount: 2_000_000,
    portfolioValue: 3,
    competitionLevel: 3,
    requiredExperienceLevel: "무관",
    createdAt: daysFromNow(-10),
  });
  // Created 3 days ago but scores low (no tag/eligibility match) — inside both windows but
  // excluded by the MIN_SCORE floor, proving the score filter (not just the date filter) applies.
  const recentLow = makeOpportunity({
    id: "recent-low",
    tags: ["영업"],
    benefitAmount: undefined,
    portfolioValue: 1,
    competitionLevel: 5,
    requiredExperienceLevel: "경력(4년+)",
    eligibility: { employmentStatuses: ["재직"] },
    createdAt: daysFromNow(-3),
  });
  // Created 20 days ago and scores high — excluded from both windows purely by the date filter.
  const tooOld = makeOpportunity({
    id: "too-old",
    tags: ["기획/PM"],
    benefitAmount: 2_000_000,
    portfolioValue: 3,
    competitionLevel: 3,
    requiredExperienceLevel: "무관",
    createdAt: daysFromNow(-20),
  });
  return [today, recentHigh, recentLow, tooOld];
}

describe("getTodaysOpportunities", () => {
  it("only includes opportunities created today, scoring at least 50", () => {
    const profile = makeProfile();
    const opportunities = buildFixtures();
    const results = getTodaysOpportunities(profile, [], opportunities);

    expect(results.map((r) => r.opportunity.id)).toEqual(["today-high"]);
    for (const r of results) {
      expect(computeScore(profile, r.opportunity).totalScore).toBeGreaterThanOrEqual(50);
    }
  });

  it("excludes opportunities created before today even if they score highly", () => {
    const profile = makeProfile();
    const results = getTodaysOpportunities(profile, [], buildFixtures());
    for (const r of results) {
      expect(daysSince(r.opportunity.createdAt)).toBeLessThanOrEqual(0);
    }
  });
});

describe("getNewOpportunities", () => {
  it("only includes opportunities created within the last 14 days, scoring at least 50", () => {
    const profile = makeProfile();
    const results = getNewOpportunities(profile, [], buildFixtures());
    expect(results.map((r) => r.opportunity.id).sort()).toEqual(["recent-high", "today-high"]);
  });

  it("sorts by createdAt, most recent first", () => {
    const profile = makeProfile();
    const results = getNewOpportunities(profile, [], buildFixtures());
    for (let i = 1; i < results.length; i++) {
      const prev = new Date(results[i - 1].opportunity.createdAt).getTime();
      const curr = new Date(results[i].opportunity.createdAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("always contains every id returned by getTodaysOpportunities (0-day window is a subset of the 14-day window)", () => {
    const profile = makeProfile();
    const opportunities = buildFixtures();
    const todayIds = getTodaysOpportunities(profile, [], opportunities).map((r) => r.opportunity.id);
    const newIds = new Set(getNewOpportunities(profile, [], opportunities).map((r) => r.opportunity.id));
    for (const id of todayIds) {
      expect(newIds.has(id)).toBe(true);
    }
  });
});
