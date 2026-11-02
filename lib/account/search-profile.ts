import type { UserProfile } from "@/lib/types";
import { educationLabels, employmentLabels } from "@/lib/account/profile";
/** Only exact facts fit the current eligibility API. Ranges remain unknown. */
export function accountSearchProfile(profile: UserProfile) {
  const facts = profile.accountProfile?.eligibility_facts;
  if (!facts) return null;
  return {
    age: null, income: null,
    region: facts.residence_regions?.length === 1 ? facts.residence_regions[0] : null,
    education: facts.education_stage ? educationLabels[facts.education_stage] ?? null : null,
    employment: facts.employment_status ? employmentLabels[facts.employment_status] ?? null : null,
  };
}
/** Preferences assist retrieval, but are never presented as eligibility facts. */
export function accountSearchPreferences(profile: UserProfile | null): string | null {
  const preferences = profile?.accountProfile?.preferences;
  if (!preferences) return null;
  const categories = (preferences.interest_categories ?? []).slice(0, 10);
  const regions = preferences.interest_regions ?? [];
  if (!categories.length && !regions.length && !preferences.activity_mode) return null;
  return "저장한 추천 선호 데이터입니다. 현재 질문의 명시 조건을 우선하며 자격 조건으로 사용하지 마세요: " + JSON.stringify({ interest_categories: categories, interest_regions: regions, activity_mode: preferences.activity_mode });
}
