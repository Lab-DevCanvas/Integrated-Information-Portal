import { describe, expect, it } from "vitest";
import { getNewOpportunities, getTodaysOpportunities } from "./notifications";
import { daysFromNow } from "./mock/dateHelpers";
import { makeOpportunity, makeProfile } from "./testFixtures";
import { presentOpportunity } from "./scoring/presentation";

const profile = makeProfile();
function opportunity(id: string, description: string, daysAgo = 0) {
  return makeOpportunity({ id, dataOrigin: "crawling", description, createdAt: daysFromNow(-daysAgo) });
}

const high = opportunity("high", "수행 과제: AI 서비스 구현");
const boundary = opportunity("boundary", "공모 분야: AI", 14);
const low = opportunity("low", "공모 분야: 영상");
const unknown = { ...opportunity("unknown", ""), title: "" };
const old = opportunity("old", "수행 과제: AI 서비스 구현", 15);

for (const [name, select] of [["getNewOpportunities", getNewOpportunities], ["getTodaysOpportunities", getTodaysOpportunities]] as const) {
  describe(name, () => {
    it("includes bookmarked opportunities regardless of score or missing match data", () => {
      expect(presentOpportunity(low, profile).percent).toBeLessThan(80);
      expect(presentOpportunity(unknown, profile).percent).toBeUndefined();
      expect(select(profile, [low.id, unknown.id], [low, unknown]).map(e => e.opportunity.id))
        .toEqual([low.id, unknown.id]);
      expect(select(profile, [], [low, unknown])).toEqual([]);
    });

    it("includes exactly 80% and excludes unsaved opportunities below 80%", () => {
      const exact = { ...boundary, createdAt: daysFromNow(0) };
      const below = { ...opportunity("below", ""), title: "AI 공모전" };
      expect(presentOpportunity(exact, profile).percent).toBe(80);
      expect(select(profile, [], [exact]).map(e => e.opportunity.id)).toEqual([exact.id]);
      expect(presentOpportunity(below, profile).percent).toBeLessThan(80);
      expect(select(profile, [], [below])).toEqual([]);
    });

    it("does not duplicate an opportunity that is both bookmarked and highly matched", () => {
      expect(presentOpportunity(high, profile).percent).toBeGreaterThan(80);
      expect(select(profile, [high.id], [high])).toHaveLength(1);
    });

    it("excludes old opportunities even when bookmarked", () => {
      expect(select(profile, [old.id], [old])).toEqual([]);
    });
  });
}

describe("notification date windows", () => {
  it("includes the 14-day boundary and sorts newest first", () => {
    expect(getNewOpportunities(profile, [], [boundary, old, high]).map(e => e.opportunity.id))
      .toEqual([high.id, boundary.id]);
  });

  it("only includes today's opportunities in the today feed", () => {
    expect(getTodaysOpportunities(profile, [boundary.id], [boundary, high]).map(e => e.opportunity.id))
      .toEqual([high.id]);
  });
});
