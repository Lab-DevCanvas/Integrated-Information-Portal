import { describe, expect, it } from "vitest";
import { makeOpportunity, makeProfile } from "../testFixtures";
import { judgeEligibility } from "./judge";

describe("judgeEligibility — no rules", () => {
  it("returns an empty item list and overall pass when the opportunity has no restrictions", () => {
    const result = judgeEligibility(makeProfile(), makeOpportunity({ eligibility: {} }));
    expect(result.items).toHaveLength(0);
    expect(result.overall).toBe("pass");
  });
});

describe("judgeEligibility — age", () => {
  it("passes when within an inclusive min/max range", () => {
    const opp = makeOpportunity({ eligibility: { ageRange: { min: 19, max: 34 } } });
    const result = judgeEligibility(makeProfile({ age: 26 }), opp);
    expect(result.items[0]).toMatchObject({ key: "age", status: "pass" });
  });

  it("fails when below the minimum or above the maximum", () => {
    const opp = makeOpportunity({ eligibility: { ageRange: { min: 19, max: 34 } } });
    expect(judgeEligibility(makeProfile({ age: 17 }), opp).items[0].status).toBe("fail");
    expect(judgeEligibility(makeProfile({ age: 40 }), opp).items[0].status).toBe("fail");
  });

  it("supports an open-ended max (age >= min only)", () => {
    const opp = makeOpportunity({ eligibility: { ageRange: { min: 19 } } });
    expect(judgeEligibility(makeProfile({ age: 60 }), opp).items[0].status).toBe("pass");
    expect(judgeEligibility(makeProfile({ age: 10 }), opp).items[0].status).toBe("fail");
  });
});

describe("judgeEligibility — region", () => {
  it("passes when the opportunity is nationwide (전국)", () => {
    const opp = makeOpportunity({ eligibility: { regions: ["전국"] } });
    expect(judgeEligibility(makeProfile({ region: "제주" }), opp).items[0].status).toBe("pass");
  });

  it("passes when the profile's region is explicitly listed", () => {
    const opp = makeOpportunity({ eligibility: { regions: ["서울", "경기"] } });
    expect(judgeEligibility(makeProfile({ region: "서울" }), opp).items[0].status).toBe("pass");
  });

  it("fails when the profile's region is not listed", () => {
    const opp = makeOpportunity({ eligibility: { regions: ["부산"] } });
    expect(judgeEligibility(makeProfile({ region: "서울" }), opp).items[0].status).toBe("fail");
  });
});

describe("judgeEligibility — education & employment", () => {
  it("checks education status membership", () => {
    const opp = makeOpportunity({ eligibility: { educationStatuses: ["대학재학"] } });
    expect(judgeEligibility(makeProfile({ educationStatus: "대학재학" }), opp).items[0].status).toBe("pass");
    expect(judgeEligibility(makeProfile({ educationStatus: "대학졸업" }), opp).items[0].status).toBe("fail");
  });

  it("checks employment status membership", () => {
    const opp = makeOpportunity({ eligibility: { employmentStatuses: ["무직"] } });
    expect(judgeEligibility(makeProfile({ employmentStatus: "무직" }), opp).items[0].status).toBe("pass");
    expect(judgeEligibility(makeProfile({ employmentStatus: "재직" }), opp).items[0].status).toBe("fail");
  });
});

describe("judgeEligibility — income (never a hard fail)", () => {
  const opp = makeOpportunity({ eligibility: { incomeMaxPercentile: 150 } });

  it("is unknown when the profile has no income percentile entered", () => {
    const result = judgeEligibility(makeProfile({ incomePercentile: undefined }), opp);
    expect(result.items[0].status).toBe("unknown");
  });

  it("passes when comfortably under the threshold minus the safety margin", () => {
    const result = judgeEligibility(makeProfile({ incomePercentile: 100 }), opp);
    expect(result.items[0].status).toBe("pass");
  });

  it("is unknown (never fail) when at or over the threshold margin", () => {
    const borderline = judgeEligibility(makeProfile({ incomePercentile: 145 }), opp);
    const over = judgeEligibility(makeProfile({ incomePercentile: 300 }), opp);
    expect(borderline.items[0].status).toBe("unknown");
    expect(over.items[0].status).toBe("unknown");
  });
});

describe("judgeEligibility — housing", () => {
  const opp = makeOpportunity({ eligibility: { requiresHousinglessness: true } });

  it("passes for 무주택, fails for 유주택, unknown for 무관", () => {
    expect(judgeEligibility(makeProfile({ housingStatus: "무주택" }), opp).items[0].status).toBe("pass");
    expect(judgeEligibility(makeProfile({ housingStatus: "유주택" }), opp).items[0].status).toBe("fail");
    expect(judgeEligibility(makeProfile({ housingStatus: "무관" }), opp).items[0].status).toBe("unknown");
  });
});

describe("judgeEligibility — always-unknown dimensions", () => {
  it("startup history is always unknown (not tracked on the profile)", () => {
    const opp = makeOpportunity({ eligibility: { requiresNoStartupHistory: true } });
    expect(judgeEligibility(makeProfile(), opp).items[0].status).toBe("unknown");
  });

  it("freeform otherConditions are always unknown regardless of autoCheckable", () => {
    const opp = makeOpportunity({
      eligibility: {
        otherConditions: [
          { key: "portfolio", label: "포트폴리오 제출", autoCheckable: false },
          { key: "custom", label: "임의 조건", autoCheckable: true },
        ],
      },
    });
    const result = judgeEligibility(makeProfile(), opp);
    expect(result.items.every((i) => i.status === "unknown")).toBe(true);
  });
});

describe("judgeEligibility — overall status precedence", () => {
  it("is fail if any item fails, even when others pass", () => {
    const opp = makeOpportunity({
      eligibility: { ageRange: { min: 19, max: 34 }, regions: ["부산"] },
    });
    const result = judgeEligibility(makeProfile({ age: 26, region: "서울" }), opp);
    expect(result.overall).toBe("fail");
  });

  it("is unknown if nothing fails but something is unknown", () => {
    const opp = makeOpportunity({
      eligibility: { ageRange: { min: 19, max: 34 }, incomeMaxPercentile: 150 },
    });
    const result = judgeEligibility(makeProfile({ age: 26, incomePercentile: undefined }), opp);
    expect(result.overall).toBe("unknown");
  });

  it("is pass only when every item passes", () => {
    const opp = makeOpportunity({ eligibility: { ageRange: { min: 19, max: 34 }, regions: ["서울"] } });
    const result = judgeEligibility(makeProfile({ age: 26, region: "서울" }), opp);
    expect(result.overall).toBe("pass");
  });
});
