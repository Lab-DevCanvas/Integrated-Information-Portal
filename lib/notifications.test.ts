import { describe, expect, it } from "vitest";
import { getNewOpportunities, getTodaysOpportunities } from "./notifications";
import { daysSince } from "./mock/dateHelpers";
import { OPPORTUNITIES } from "./mock/opportunities";
import { computeScore } from "./scoring/score";
import { makeProfile } from "./testFixtures";

describe("getTodaysOpportunities", () => {
  it("only includes opportunities created today, scoring at least 50", () => {
    const profile = makeProfile();
    const results = getTodaysOpportunities(profile);

    const expectedIds = OPPORTUNITIES.filter((o) => daysSince(o.createdAt) <= 0)
      .filter((o) => computeScore(profile, o).totalScore >= 50)
      .map((o) => o.id)
      .sort();

    expect(results.map((r) => r.opportunity.id).sort()).toEqual(expectedIds);
    expect(expectedIds.length).toBeGreaterThan(0);
  });

  it("excludes opportunities created before today even if they score highly", () => {
    const profile = makeProfile();
    const results = getTodaysOpportunities(profile);
    for (const r of results) {
      expect(daysSince(r.opportunity.createdAt)).toBeLessThanOrEqual(0);
    }
  });
});

describe("getNewOpportunities", () => {
  it("only includes opportunities created within the last 14 days, scoring at least 50", () => {
    const profile = makeProfile();
    const results = getNewOpportunities(profile);

    const expectedIds = OPPORTUNITIES.filter((o) => daysSince(o.createdAt) <= 14)
      .filter((o) => computeScore(profile, o).totalScore >= 50)
      .map((o) => o.id)
      .sort();

    expect(results.map((r) => r.opportunity.id).sort()).toEqual(expectedIds);
    expect(expectedIds.length).toBeGreaterThan(0);
  });

  it("sorts by createdAt, most recent first", () => {
    const profile = makeProfile();
    const results = getNewOpportunities(profile);
    for (let i = 1; i < results.length; i++) {
      const prev = new Date(results[i - 1].opportunity.createdAt).getTime();
      const curr = new Date(results[i].opportunity.createdAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("always contains every id returned by getTodaysOpportunities (0-day window is a subset of the 14-day window)", () => {
    const profile = makeProfile();
    const todayIds = getTodaysOpportunities(profile).map((r) => r.opportunity.id);
    const newIds = new Set(getNewOpportunities(profile).map((r) => r.opportunity.id));
    for (const id of todayIds) {
      expect(newIds.has(id)).toBe(true);
    }
  });
});
