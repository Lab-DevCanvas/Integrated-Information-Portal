import { describe, expect, it } from "vitest";
import { accountSearchProfile, accountSearchPreferences } from "./search-profile";
import type { UserProfile } from "@/lib/types";
const profile = { accountProfile: { eligibility_facts: { age_band: "AGE_19_24", income_band: "UNDER_MEDIAN_60", residence_regions: ["SEOUL"], education_stage: "ENROLLED_UNDERGRADUATE", employment_status: "STUDENT" }, preferences: { interest_categories: ["개발"], interest_regions: ["BUSAN"] } } } as UserProfile;
describe("account search input", () => {
  it("does not fabricate exact age or income and keeps residence separate from preferences", () => {
    expect(accountSearchProfile(profile)).toEqual({ age: null, income: null, region: "SEOUL", education: "대학재학", employment: "학생" });
    expect(accountSearchPreferences(profile)).toContain("BUSAN");
  });
  it("keeps ambiguous multiple residences unknown", () => {
    const copy = structuredClone(profile); copy.accountProfile!.eligibility_facts.residence_regions = ["SEOUL", "BUSAN"];
    expect(accountSearchProfile(copy)?.region).toBeNull();
  });
  it("does not include identity or absent account information", () => {
    expect(accountSearchPreferences(null)).toBeNull();
    expect(accountSearchPreferences({ ...profile, name: "private" })).not.toContain("private");
  });
});
