import { describe, expect, it } from "vitest";
import { mapActivityToOpportunity } from "./mapActivityToOpportunity";
import type { ActivityDTO } from "./crawlingClient";
import { judgeEligibility } from "../eligibility/judge";
import { makeProfile } from "../testFixtures";

function makeActivity(overrides: Partial<ActivityDTO> = {}): ActivityDTO {
  return {
    id: "6a8ed7852707da0ea078bef7",
    title: "테스트 활동",
    source: "linkareer",
    source_native_id: "native-1",
    category: "contest",
    detail_url: "https://example.com/detail",
    summary: "테스트 요약입니다.",
    period_status: "ongoing",
    period_start: "2026-09-01",
    period_end: "2026-09-30",
    raw_period_text: null,
    first_collected_at: "2026-08-20T00:00:00.000Z",
    last_seen_at: "2026-09-03T00:00:00.000Z",
    also_available_on: [],
    ...overrides,
  };
}

describe("mapActivityToOpportunity", () => {
  it("carries real fields through unchanged", () => {
    const activity = makeActivity();
    const opp = mapActivityToOpportunity(activity);

    expect(opp.id).toBe(activity.id);
    expect(opp.title).toBe("테스트 활동");
    expect(opp.applyStartDate).toBe("2026-09-01");
    expect(opp.applyEndDate).toBe("2026-09-30");
    expect(opp.createdAt).toBe(activity.first_collected_at);
    expect(opp.applyUrl).toBe("https://example.com/detail");
  });

  it("maps organizer from a known source slug to its Korean label", () => {
    expect(mapActivityToOpportunity(makeActivity({ source: "linkareer" })).organizer).toBe("링커리어");
    expect(mapActivityToOpportunity(makeActivity({ source: "saramin" })).organizer).toBe("사람인");
  });

  it("falls back to the raw slug for an unrecognized source", () => {
    expect(mapActivityToOpportunity(makeActivity({ source: "some_new_source" })).organizer).toBe("some_new_source");
  });

  it.each([
    ["contest", undefined, "contest", "career", "contest"],
    ["activity", undefined, "external_activity", "career", "hackathon"],
    ["job", undefined, "job", "employment", "job_fulltime"],
    ["government-policy", "bokjiro", "gov_support", "money", "subsidy"],
    ["government-policy", "youthcenter", "youth_policy", "money", "subsidy"],
  ] as const)(
    "maps category=%s source=%s to opportunityType=%s categoryId=%s subCategoryId=%s",
    (category, source, opportunityType, categoryId, subCategoryId) => {
      const opp = mapActivityToOpportunity(makeActivity({ category, source: source ?? "linkareer" }));
      expect(opp.opportunityType).toBe(opportunityType);
      expect(opp.categoryId).toBe(categoryId);
      expect(opp.subCategoryId).toBe(subCategoryId);
    },
  );

  it("marks always_open period_status as isAlwaysOpen with no deadline pressure", () => {
    const opp = mapActivityToOpportunity(
      makeActivity({ period_status: "always_open", period_start: null, period_end: null }),
    );
    expect(opp.isAlwaysOpen).toBe(true);
  });

  it("fills in a placeholder end date when period_end is missing and not always-open", () => {
    const activity = makeActivity({ period_status: "unknown", period_start: null, period_end: null });
    const opp = mapActivityToOpportunity(activity);

    expect(opp.isAlwaysOpen).toBe(false);
    expect(opp.applyStartDate).toBe(activity.first_collected_at);
    expect(new Date(opp.applyEndDate).getTime()).toBeGreaterThan(new Date(activity.first_collected_at).getTime());
  });

  it("falls back to a placeholder title/summary when the crawler returned null", () => {
    const opp = mapActivityToOpportunity(makeActivity({ title: null, summary: null }));
    expect(opp.title).toBe("(제목 미상)");
    expect(opp.summary).toBe("요약 정보가 제공되지 않았습니다.");
    expect(opp.description).toBe("요약 정보가 제공되지 않았습니다.");
  });

  it("truncates a long summary but keeps the full text in description", () => {
    const longSummary = "가".repeat(200);
    const opp = mapActivityToOpportunity(makeActivity({ summary: longSummary }));
    expect(opp.summary.length).toBeLessThan(longSummary.length);
    expect(opp.summary.endsWith("…")).toBe(true);
    expect(opp.description).toBe(longSummary);
  });

  it("uses an empty eligibility rule set, which judgeEligibility treats as unrestricted (pass)", () => {
    const opp = mapActivityToOpportunity(makeActivity());
    expect(opp.eligibility).toEqual({});

    const judgement = judgeEligibility(makeProfile(), opp);
    expect(judgement.overall).toBe("pass");
    expect(judgement.items).toEqual([]);
  });

  it("marks region/competition/portfolio/experience-level fields with fixed placeholder values", () => {
    const opp = mapActivityToOpportunity(makeActivity());
    expect(opp.region).toEqual(["전국"]);
    expect(opp.requiredExperienceLevel).toBe("무관");
    expect(opp.competitionLevel).toBe(3);
    expect(opp.portfolioValue).toBe(3);
    expect(opp.teamRequired).toBe(false);
    expect(opp.benefitAmount).toBeUndefined();
  });

  it("omits applyUrl when detail_url is null", () => {
    const opp = mapActivityToOpportunity(makeActivity({ detail_url: null }));
    expect(opp.applyUrl).toBeUndefined();
  });
});
