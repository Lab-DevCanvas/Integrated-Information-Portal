import { describe, expect, it } from "vitest";
import { makeOpportunity, makeProfile } from "../testFixtures";
import { contestPresentation } from "./contestInterests";

const opportunity = makeOpportunity({ categoryId: "contest", dataOrigin: "crawling", title: "영상 제작 공모전", description: "" });
const profile = makeProfile({ interests: ["영상", "디자인", "창업"], jobInterests: [] });
const online = { ...profile, accountProfile: { profile_id: "p", account_id: "a", updated_at: "", completeness: { filled: 1, total: 1, ratio: 1, missing: [] }, eligibility_facts: {}, preferences: { activity_mode: "ONLINE" as const } } };

describe("contest fit percentages", () => {
  it("names the denominator and suppresses an unsupported zero", () => {
    expect(contestPresentation(opportunity, profile).fit).toMatchObject({ label: "관심사 일치 비율", percent: 33 });
    expect(contestPresentation(opportunity, null).fit).toBeUndefined();
    expect(contestPresentation(opportunity, makeProfile({interests:["음악"],jobInterests:[]})).fit).toBeUndefined();
  });
  it("requires explicit whole-event mode and never promotes application or final-round evidence", () => {
    for (const description of ["온라인 접수", "본선: 오프라인", "활동 방식: 온라인\n활동 방식: 오프라인"]) {
      expect(contestPresentation({...opportunity,description},online).fit?.label).toBe("관심사 일치 비율");
    }
    expect(contestPresentation({...opportunity,description:"활동 방식: 온라인"},online).fit).toMatchObject({label:"내 선호 일치도",percent:52});
    expect(contestPresentation({...opportunity,description:"활동 방식: 오프라인"},online).fit?.percent).toBe(24);
  });
});
