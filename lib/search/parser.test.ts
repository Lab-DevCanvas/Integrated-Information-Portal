import { describe, expect, it } from "vitest";
import { parseQuery } from "./parser";

describe("parseQuery — individual dimensions", () => {
  it("extracts age from '27살' or '만 27세' phrasing", () => {
    expect(parseQuery("27살인데 지원금 찾아줘").age).toBe(27);
    expect(parseQuery("만 27세 대상 공고").age).toBe(27);
  });

  it("extracts a region from common aliases", () => {
    expect(parseQuery("서울 사는 사람 지원금").region).toBe("서울");
    expect(parseQuery("경기도 거주자 대상").region).toBe("경기");
  });

  it("extracts employment status from synonyms", () => {
    expect(parseQuery("무직인데 받을 수 있는 지원금").employmentStatus).toBe("무직");
    expect(parseQuery("백수인데 지원 가능한 거").employmentStatus).toBe("무직");
    expect(parseQuery("재직 중인데 지원 가능한 교육").employmentStatus).toBe("재직");
  });

  it("extracts job interest keywords", () => {
    expect(parseQuery("IT PM 관련 공모전").jobInterest).toBe("IT개발");
    expect(parseQuery("기획 PM 직무 인턴").jobInterest).toBe("기획/PM");
  });

  it("extracts a category/type hint", () => {
    const intent = parseQuery("이번 주 공모전 찾아줘");
    expect(intent.categoryHint).toBe("contest");
    expect(intent.opportunityTypeHint).toBe("contest");
  });

  it("extracts a benefit amount threshold with direction", () => {
    expect(parseQuery("상금 500만원 이상인 공모전").minBenefitAmount).toBe(5_000_000);
    expect(parseQuery("300만원 이하 지원금").maxBenefitAmount).toBe(3_000_000);
    expect(parseQuery("상금 1000만원 이상").minBenefitAmount).toBe(10_000_000);
  });

  it("defaults an amount with no explicit direction to a minimum", () => {
    expect(parseQuery("500만원짜리 공모전").minBenefitAmount).toBe(5_000_000);
  });

  it("extracts a minimum days-remaining window from '주'/'일' phrasing", () => {
    expect(parseQuery("마감 2주 이상 남은 공모전").minDaysRemaining).toBe(14);
    expect(parseQuery("10일 이상 남은 것").minDaysRemaining).toBe(10);
  });

  it("treats '이번 달' as a 30-day rolling window, not the literal calendar month-end", () => {
    expect(parseQuery("이번달 마감인 공모전").deadlineWithinDays).toBe(30);
  });

  it("treats '마감 임박' as a 7-day window", () => {
    expect(parseQuery("마감 임박한 것만").deadlineWithinDays).toBe(7);
  });

  it("detects the 'unrestricted education' negation phrase", () => {
    expect(parseQuery("대학생 아니어도 참가 가능한 공모전").unrestrictedDimensions).toContain("education");
    expect(parseQuery("대학생 아니라도 되는 공모전").unrestrictedDimensions).toContain("education");
  });

  it("detects the 'unrestricted experience' negation phrase", () => {
    expect(parseQuery("경력 무관 인턴").unrestrictedDimensions).toContain("experience");
  });

  it("chooses a sortHint based on trailing phrasing, defaulting to score_desc", () => {
    expect(parseQuery("상금 높은 순으로").sortHint).toBe("benefit_desc");
    expect(parseQuery("마감 임박 순으로 보여줘").sortHint).toBe("deadline_asc");
    expect(parseQuery("스펙에 도움되는 것부터").sortHint).toBe("portfolio_desc");
    expect(parseQuery("아무거나 찾아줘").sortHint).toBe("score_desc");
  });
});

describe("parseQuery — regression: negated education phrase must not also set educationStatus", () => {
  it("'대학생 아니어도' does not simultaneously claim the user is 대학재학", () => {
    const intent = parseQuery("대학생 아니어도 참가할 수 있는 공모전만 찾아줘");
    expect(intent.unrestrictedDimensions).toContain("education");
    expect(intent.educationStatus).toBeUndefined();
    expect(intent.matchedKeywords).not.toContain("대학재학");
  });
});

describe("parseQuery — the 5 example queries from the product spec", () => {
  it("'서울에 사는 27살 무직인데 내가 받을 수 있는 지원금 찾아줘'", () => {
    const intent = parseQuery("서울에 사는 27살 무직인데 내가 받을 수 있는 지원금 찾아줘");
    expect(intent.age).toBe(27);
    expect(intent.region).toBe("서울");
    expect(intent.employmentStatus).toBe("무직");
    expect(intent.categoryHint).toBe("government-policy");
  });

  it("'이번달 마감인 기획/PM 관련 공모전 찾아줘'", () => {
    const intent = parseQuery("이번달 마감인 기획/PM 관련 공모전 찾아줘");
    expect(intent.opportunityTypeHint).toBe("contest");
    expect(intent.jobInterest).toBe("기획/PM");
    expect(intent.deadlineWithinDays).toBe(30);
  });

  it("'대학생 아니어도 참가 가능한 AI 공모전만 찾아줘'", () => {
    const intent = parseQuery("대학생 아니어도 참가 가능한 AI 공모전만 찾아줘");
    expect(intent.opportunityTypeHint).toBe("contest");
    expect(intent.unrestrictedDimensions).toContain("education");
  });

  it("'상금 500만원 이상이고 2주 이상 남은 공모전 찾아줘'", () => {
    const intent = parseQuery("상금 500만원 이상이고 2주 이상 남은 공모전 찾아줘");
    expect(intent.minBenefitAmount).toBe(5_000_000);
    expect(intent.minDaysRemaining).toBe(14);
    expect(intent.opportunityTypeHint).toBe("contest");
  });

  it("'경력 무관 인턴 중에 스펙에 도움될만한 것만 골라줘'", () => {
    const intent = parseQuery("경력 무관 인턴 중에 스펙에 도움될만한 것만 골라줘");
    expect(intent.opportunityTypeHint).toBe("job");
    expect(intent.unrestrictedDimensions).toContain("experience");
    expect(intent.sortHint).toBe("portfolio_desc");
  });
});
