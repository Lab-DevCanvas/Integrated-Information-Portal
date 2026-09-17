import { describe, expect, it } from "vitest";
import { deriveConversationTitle, generateAssistantReply } from "./reply";
import { daysFromNow } from "../mock/dateHelpers";
import { makeOpportunity, makeProfile } from "../testFixtures";
import type { Opportunity } from "../types";

/**
 * Shared fixture set for the queries below. Exactly one item (`bigPrize`) clears the 2억원 floor
 * used by two of the tests, and none clear the 10억원 floor used by a third — see inline notes.
 */
function buildFixtures(): Opportunity[] {
  const contestA = makeOpportunity({
    id: "contest-a",
    categoryId: "contest",
    opportunityType: "contest",
    subCategoryId: "contest",
    benefitAmount: 3_000_000,
    eligibility: {},
    applyEndDate: daysFromNow(15),
  });
  const contestB = makeOpportunity({
    id: "contest-b",
    categoryId: "contest",
    opportunityType: "contest",
    subCategoryId: "contest",
    benefitAmount: 8_000_000,
    eligibility: {},
    applyEndDate: daysFromNow(25),
  });
  // The only fixture at/above 2억원 (and still comfortably under 10억원).
  const bigPrize = makeOpportunity({
    id: "big-prize",
    categoryId: "contest",
    opportunityType: "contest",
    subCategoryId: "contest",
    benefitAmount: 300_000_000,
    eligibility: {},
    applyEndDate: daysFromNow(10),
  });
  const subsidy = makeOpportunity({
    id: "subsidy",
    categoryId: "government-policy",
    opportunityType: "gov_support",
    subCategoryId: "subsidy",
    benefitAmount: undefined,
    eligibility: {},
    applyEndDate: daysFromNow(30),
  });
  const internship = makeOpportunity({
    id: "internship",
    categoryId: "job",
    opportunityType: "job",
    subCategoryId: "job_intern",
    benefitAmount: undefined,
    requiredExperienceLevel: "무관",
    eligibility: {},
    applyEndDate: daysFromNow(20),
  });
  const activity = makeOpportunity({
    id: "activity",
    categoryId: "activity",
    opportunityType: "external_activity",
    subCategoryId: "hackathon",
    benefitAmount: undefined,
    eligibility: {},
    applyEndDate: daysFromNow(20),
  });
  return [contestA, contestB, bigPrize, subsidy, internship, activity];
}

describe("generateAssistantReply", () => {
  it("returns a not-found message and empty resultIds when nothing matches", () => {
    const profile = makeProfile();
    // No fixture offers anywhere near 10억원, so this benefit-amount floor matches nothing.
    const reply = generateAssistantReply("상금 100000만원 이상인 조건만 찾아줘", profile, [], buildFixtures());
    expect(reply.resultIds).toEqual([]);
    expect(reply.text).toContain("찾지 못했어요");
  });

  it("returns a scored recommendation list for a normal query", () => {
    const profile = makeProfile();
    const reply = generateAssistantReply(
      "서울에 사는 27살 무직인데 내가 받을 수 있는 지원금 찾아줘",
      profile,
      [],
      buildFixtures(),
    );
    expect(reply.resultIds.length).toBeGreaterThan(0);
    expect(reply.resultIds.length).toBeLessThanOrEqual(5);
    expect(reply.text).toContain("찾았어요");
    expect(reply.intent.age).toBe(27);
  });

  it("switches to a comparison framing when the message mentions 비교 and there are 2+ results", () => {
    const profile = makeProfile();
    const reply = generateAssistantReply("공모전 중에 뭐가 나을지 비교해줘", profile, [], buildFixtures());
    expect(reply.resultIds.length).toBeGreaterThanOrEqual(2);
    expect(reply.resultIds.length).toBeLessThanOrEqual(4);
    expect(reply.text).toContain("비교해봤어요");
  });

  it("does not switch to comparison framing when only 1 result is found", () => {
    const profile = makeProfile();
    // Exactly one fixture (bigPrize) clears this 2억원 floor, so top.length === 1 (< 2 required for compare framing).
    const reply = generateAssistantReply("상금 20000만원 이상인 것만 비교해줘", profile, [], buildFixtures());
    expect(reply.resultIds).toHaveLength(1);
    expect(reply.text).not.toContain("비교해봤어요");
  });

  it("switches to a plan framing when the message mentions 계획/우선순위/먼저", () => {
    const profile = makeProfile();
    const reply = generateAssistantReply(
      "경력 무관 인턴 중에 뭐부터 준비하면 좋을지 계획 세워줘",
      profile,
      [],
      buildFixtures(),
    );
    expect(reply.text).toContain("이 순서대로 준비해보는 걸 추천해요");
  });

  it("caps shown results at 5 even when far more match", () => {
    const profile = makeProfile();
    // buildFixtures() has 6 always-matching items for this filterless query, so the cap is exercised.
    const reply = generateAssistantReply("아무거나 다 보여줘", profile, [], buildFixtures());
    expect(reply.resultIds.length).toBeLessThanOrEqual(5);
  });
});

describe("deriveConversationTitle", () => {
  it("returns the trimmed message unchanged when 24 characters or fewer", () => {
    expect(deriveConversationTitle("  서울 지원금  ")).toBe("서울 지원금");
  });

  it("truncates to 24 characters and appends an ellipsis when longer", () => {
    const long = "서울에 사는 27살 무직인데 내가 받을 수 있는 지원금 찾아줘";
    const title = deriveConversationTitle(long);
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBe(25);
    expect(title.slice(0, 24)).toBe(long.slice(0, 24));
  });
});
