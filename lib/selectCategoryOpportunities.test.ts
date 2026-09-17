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
