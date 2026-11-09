import { describe, expect, it } from "vitest";
import { makeOpportunity, makeProfile } from "../testFixtures";
import { contestPresentation } from "./contestInterests";

const opportunity = makeOpportunity({ categoryId: "contest", dataOrigin: "crawling", title: "영상 제작 공모전", description: "" });
const profile = makeProfile({ interests: ["영상", "디자인", "창업"], jobInterests: [] });
const online = { ...profile, accountProfile: { profile_id: "p", account_id: "a", updated_at: "", completeness: { filled: 1, total: 1, ratio: 1, missing: [] }, eligibility_facts: {}, preferences: { activity_mode: "ONLINE" as const } } };

describe("contest fit percentages", () => {
  it("names the denominator and distinguishes a keyword miss from a missing profile", () => {
    expect(contestPresentation(opportunity, profile).fit).toMatchObject({ label: "분야 일치도", percent: 60 });
    expect(contestPresentation(opportunity, null).fit).toBeUndefined();
    expect(contestPresentation(opportunity, makeProfile({interests:["음악"],jobInterests:[]})).fit?.percent).toBe(0);
  });
  it("requires explicit whole-event mode and never promotes application or final-round evidence", () => {
    for (const description of ["온라인 접수", "본선: 오프라인", "활동 방식: 온라인\n활동 방식: 오프라인"]) {
      expect(contestPresentation({...opportunity,description},online).fit?.label).toBe("분야 일치도");
    }
    expect(contestPresentation({...opportunity,description:"활동 방식: 온라인"},online).fit).toMatchObject({label:"내 선호 일치도",percent:72});
    expect(contestPresentation({...opportunity,description:"활동 방식: 오프라인"},online).fit?.percent).toBe(42);
  });
});

it("ranks core work above optional tracks and title-only evidence, ignoring perks", () => {
  const dev = makeProfile({interests:["개발","요리"],jobInterests:[]});
  const score = (title: string, description: string) => contestPresentation({...opportunity,title,description},dev).fit?.percent;
  expect(score("서비스 공모전","수행 과제: 앱 개발 후 프로토타입 제출")).toBe(100);
  expect(score("서비스 공모전","공모 분야: 앱 개발 또는 디자인 중 선택")).toBe(80);
  expect(score("앱 개발 공모전","")).toBe(60);
  expect(score("정보보안 공모전","")).toBe(30);
  expect(score("서비스 공모전","혜택: 개발자 멘토 특강 제공")).toBe(0);
});

it("penalizes a mandatory onsite final for an online preference, not an optional one", () => {
  const fit = (description:string) => contestPresentation({...opportunity,description},online).fit;
  expect(fit("본선 현장 참석 필수")?.percent).toBe(42);
  expect(fit("본선 현장 참석 필수 아님")?.label).toBe("분야 일치도");
});

it("does not upgrade echoed titles or production guides to a core task", () => {
  const item = {...opportunity, title:"영상 공모전",description:"영상 공모전\n영상 제작 가이드는 홈페이지에서 확인"};
  expect(contestPresentation(item,profile).fit?.percent).toBe(60);
});

it("separates disjoint, overlapping, and fully included age bands from interest", () => {
  const user = {...online, accountProfile: {...online.accountProfile, eligibility_facts: {age_band: "AGE_25_29" as const}}};
  const result = (description: string) => contestPresentation({...opportunity, description}, user);
  expect(result("지원 연령: 만 19~24세").fit).toBeUndefined();
  expect(result("지원 연령: 만 27세 이하").matchReason).toContain("나이 확인 필요");
  expect(result("지원 연령: 만 19~34세").matchReason).toContain("연령 조건 충족");
  expect(result("지원 연령: 만 24세 이하\n군 복무자 예외").age).toBeUndefined();
});

it("caps semantic-only evidence and preserves explicit age exclusions", () => {
  const item = {...opportunity, title: "새로운 기회", description: "", interestSimilarities: {영상: 0.7}};
  expect(contestPresentation(item, profile).fit?.percent).toBe(32);
  expect(contestPresentation({...item, interestSimilarities: {영상: 0.99}}, profile).fit?.percent).toBe(40);
  expect(contestPresentation({...item, interestSimilarities: {영상: 0.4}}, profile).fit?.percent).toBe(0);
  expect(contestPresentation({...item, interestSimilarities: {개발: 0.9}}, profile).fit?.percent).toBe(0);
  const user = {...online, accountProfile: {...online.accountProfile, eligibility_facts: {age_band: "AGE_25_29" as const}}};
  expect(contestPresentation({...item, description: "지원 연령: 만 19~24세"}, user).fit).toBeUndefined();
});
