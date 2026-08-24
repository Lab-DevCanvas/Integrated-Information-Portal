import { daysFromNow } from "./mock/dateHelpers";
import type { Opportunity, UserProfile } from "./types";

/** Shared fixtures for lib/**\/*.test.ts. Not a test file itself. */

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    age: 26,
    region: "서울",
    educationStatus: "대학졸업예정",
    employmentStatus: "무직",
    jobInterests: ["기획/PM"],
    startupInterest: false,
    housingStatus: "무주택",
    incomePercentile: undefined,
    interests: ["AI"],
    updatedAt: daysFromNow(0),
    ...overrides,
  };
}

export function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "test-opp-01",
    title: "테스트 기회",
    organizer: "테스트 기관",
    opportunityType: "contest",
    categoryId: "career",
    subCategoryId: "contest",
    summary: "테스트용 요약",
    description: "테스트용 상세 설명",
    region: ["전국"],
    applyStartDate: daysFromNow(-10),
    applyEndDate: daysFromNow(14),
    benefitType: "상금",
    benefitAmount: 3_000_000,
    benefitDescription: "대상 300만원",
    eligibility: {},
    requiredExperienceLevel: "무관",
    competitionLevel: 3,
    tags: ["기획/PM", "AI"],
    teamRequired: false,
    portfolioValue: 3,
    viewCount: 1000,
    createdAt: daysFromNow(-5),
    ...overrides,
  };
}
