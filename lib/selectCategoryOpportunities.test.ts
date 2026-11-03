import { describe, expect, it } from "vitest";
import { selectCategoryOpportunities } from "./selectCategoryOpportunities";
import { mapActivityToOpportunity } from "./api/mapActivityToOpportunity";

function opportunity(id: string, category = "contest", createdAt = "2026-09-01") {
  return mapActivityToOpportunity({ id, title: id, category, source: "linkareer", source_native_id: id, summary: null, detail_url: null, period_status: "unknown", period_start: null, period_end: null, raw_period_text: null, first_collected_at: createdAt, last_seen_at: createdAt, also_available_on: [] });
}
const defaults = { categoryIds: [], typeIds: [], regions: [], experienceLevels: [], deadlineWindow: "all", keyword: "", profile: null, savedIds: [], eligibleOnly: false, sortMode: "created" };

describe("category selection", () => {
  it("separates the four API categories and combines selected categories", () => {
    const categories = ["contest", "activity", "job", "government-policy"] as const;
    const allOpportunities = categories.map((category) => opportunity(category, category));
    for (const category of categories) {
      const result = selectCategoryOpportunities({ ...defaults, allOpportunities, categoryIds: [category] });
      expect(result.map((item) => item.opportunity.id)).toEqual([category]);
    }
    const combined = selectCategoryOpportunities({ ...defaults, allOpportunities, categoryIds: ["contest", "activity"] });
    expect(combined.map((item) => item.opportunity.id)).toEqual(["contest", "activity"]);
  });

  it("sorts the whole collection without mutating the input", () => {
    const allOpportunities = [opportunity("old"), opportunity("new", "contest", "2026-09-10")];
    const result = selectCategoryOpportunities({ ...defaults, allOpportunities });
    expect(result.map((item) => item.opportunity.id)).toEqual(["new", "old"]);
    expect(allOpportunities.map((item) => item.id)).toEqual(["old", "new"]);
  });

  it("finds a matching item beyond the first displayed page", () => {
    const allOpportunities = [...Array.from({ length: 20 }, (_, index) => opportunity(String(index))), opportunity("Backend Developer", "job")];
    const result = selectCategoryOpportunities({ ...defaults, allOpportunities, categoryIds: ["job"], keyword: "developer" });
    expect(result.map((item) => item.opportunity.id)).toEqual(["Backend Developer"]);
  });

  it("keeps unknown eligibility visible when no profile is available", () => {
    const result = selectCategoryOpportunities({ ...defaults, allOpportunities: [opportunity("unknown")], eligibleOnly: true });
    expect(result).toHaveLength(1);
  });
});

import { makeProfile } from "./testFixtures";

it("ranks contests by evidence for the current profile and leaves unsupported scores absent", () => {
  const video = { ...opportunity("창작 공모전"), description: "● 공모 분야\n - 에세이, 숏폼 영상\n● 유의 사항\nAI 사용 금지" };
  const dev = opportunity("청년 해커톤");
  const unrelated = { ...opportunity("창작 대회"), description: "● 제출 형식\n영상 파일로 제출" };
  const allOpportunities = [unrelated, dev, video];
  const run = (interests: string[]) => selectCategoryOpportunities({ ...defaults, allOpportunities, sortMode: "score", profile: makeProfile({ interests, jobInterests: [] }) });
  expect(run(["영상 제작"])[0]).toMatchObject({ opportunity: video, score: undefined, matchCount: 1 });
  expect(run(["영상 제작"])[0].matchReason).toContain("숏폼 영상");
  expect(run(["개발"])[0].opportunity).toBe(dev);
  for (const interests of [[], ["AI"]]) {
    expect(run(interests).map(x => x.opportunity)).toEqual(allOpportunities);
    expect(run(interests).every(x => !x.matchReason && x.score === undefined)).toBe(true);
  }
});

it("does not mistake an organizer name for a development theme and recognizes an explicit design call", () => {
  const organizer = opportunity("한국해외인프라도시개발지원공사 뉴 슬로건 공모전");
  const design = { ...opportunity("The 2nd doodll Makeathon"), description: "근무화 디자인 공모" };
  const run = (interest: string) => selectCategoryOpportunities({ ...defaults, allOpportunities: [organizer, design], profile: makeProfile({ interests: [interest], jobInterests: [] }), sortMode: "score" });
  expect(run("개발").every(x => !x.matchReason)).toBe(true);
  expect(run("디자인")[0].matchReason).toContain("근무화 디자인 공모");
});
