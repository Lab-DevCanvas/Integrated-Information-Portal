import { describe, expect, it } from "vitest";
import {
  estimatePrepHours,
  formatDateRange,
  formatDeadlineDateTime,
  formatKRW,
  formatMonthDay,
  lastCheckedLabel,
  levelLabel,
  prepDifficultyLevel,
} from "./format";
import { makeOpportunity } from "./testFixtures";

describe("formatKRW", () => {
  it("formats sub-10,000 won as plain won", () => {
    expect(formatKRW(5_000)).toBe("5,000원");
  });

  it("formats 10,000+ as 만원", () => {
    expect(formatKRW(500_000)).toBe("50만원");
    expect(formatKRW(30_000_000)).toBe("3,000만원");
  });

  it("formats 100,000,000+ as 억원, with 만원 remainder when present", () => {
    expect(formatKRW(100_000_000)).toBe("1억원");
    expect(formatKRW(150_000_000)).toBe("1억 5,000만원");
    expect(formatKRW(500_000_000)).toBe("5억원");
  });
});

describe("formatMonthDay / formatDateRange / formatDeadlineDateTime", () => {
  it("formats a month/day pair from an ISO string", () => {
    expect(formatMonthDay("2026-09-04T09:00:00.000Z")).toBe("9월 4일");
  });

  it("joins a start/end range", () => {
    expect(formatDateRange("2026-08-12T09:00:00.000Z", "2026-09-04T09:00:00.000Z")).toBe("8월 12일 – 9월 4일");
  });

  it("always appends 23:59 to deadlines regardless of the stored time", () => {
    expect(formatDeadlineDateTime("2026-09-04T09:00:00.000Z")).toBe("9월 4일 23:59");
  });
});

describe("levelLabel", () => {
  it("maps every 1-5 level to a distinct label", () => {
    const labels = [1, 2, 3, 4, 5].map((n) => levelLabel(n as 1 | 2 | 3 | 4 | 5));
    expect(new Set(labels).size).toBe(5);
    expect(levelLabel(1)).toBe("매우 낮음");
    expect(levelLabel(5)).toBe("매우 높음");
  });
});

describe("estimatePrepHours", () => {
  it("scales with competitionLevel", () => {
    const easy = makeOpportunity({ competitionLevel: 1, portfolioValue: 1 });
    const hard = makeOpportunity({ competitionLevel: 5, portfolioValue: 1 });
    expect(estimatePrepHours(hard)).toBeGreaterThan(estimatePrepHours(easy));
  });

  it("adds a bonus when portfolioValue is high", () => {
    const lowPortfolio = makeOpportunity({ competitionLevel: 3, portfolioValue: 3 });
    const highPortfolio = makeOpportunity({ competitionLevel: 3, portfolioValue: 4 });
    expect(estimatePrepHours(highPortfolio)).toBe(estimatePrepHours(lowPortfolio) + 2);
  });
});

describe("prepDifficultyLevel", () => {
  it("maps 무관 to the lowest level and 경력(4년+) to the highest", () => {
    expect(prepDifficultyLevel("무관")).toBe(1);
    expect(prepDifficultyLevel("경력(4년+)")).toBe(5);
  });
});

describe("lastCheckedLabel", () => {
  it("never produces a negative hour or minute component (regression: signed >> bug)", () => {
    // A signed `>>` on a hash exceeding 2^31-1 used to yield a negative minute (e.g. "10:-29").
    // A wide spread of ids gives a uniformly-distributed hash a good chance of landing on both
    // sides of the sign bit, so this is a meaningful regression check even without real data.
    for (let i = 0; i < 200; i++) {
      const opportunity = makeOpportunity({ id: `regression-id-${i}` });
      expect(lastCheckedLabel(opportunity)).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
    }
  });

  it("is deterministic for the same opportunity id", () => {
    const opp = makeOpportunity({ id: "stable-id" });
    expect(lastCheckedLabel(opp)).toBe(lastCheckedLabel(opp));
  });
});
