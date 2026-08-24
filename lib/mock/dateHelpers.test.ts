import { describe, expect, it } from "vitest";
import { daysFromNow, daysSince, daysUntil, formatDate, formatDday, isExpired } from "./dateHelpers";

describe("daysFromNow / daysUntil round-trip", () => {
  it("daysUntil(daysFromNow(n)) is n for a range of offsets", () => {
    for (const offset of [-30, -7, -1, 0, 1, 7, 30, 90]) {
      expect(daysUntil(daysFromNow(offset))).toBe(offset);
    }
  });
});

describe("isExpired", () => {
  it("is true for dates in the past", () => {
    expect(isExpired(daysFromNow(-1))).toBe(true);
  });

  it("is false for today and future dates", () => {
    expect(isExpired(daysFromNow(0))).toBe(false);
    expect(isExpired(daysFromNow(5))).toBe(false);
  });
});

describe("formatDday", () => {
  it("returns 상시 for always-open opportunities regardless of date", () => {
    expect(formatDday(daysFromNow(-5), true)).toBe("상시");
  });

  it("returns 마감 once the date has passed", () => {
    expect(formatDday(daysFromNow(-1))).toBe("마감");
  });

  it("returns 오늘 마감 for today", () => {
    expect(formatDday(daysFromNow(0))).toBe("오늘 마감");
  });

  it("returns a D-N countdown for future dates", () => {
    expect(formatDday(daysFromNow(12))).toBe("D-12");
    expect(formatDday(daysFromNow(1))).toBe("D-1");
  });
});

describe("formatDate", () => {
  it("formats as YYYY.MM.DD with zero-padding", () => {
    expect(formatDate("2026-03-05T09:00:00.000Z")).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });
});

describe("daysSince", () => {
  it("is the inverse sign of daysUntil for the same date", () => {
    const date = daysFromNow(-10);
    expect(daysSince(date)).toBe(10);
    expect(daysUntil(date)).toBe(-10);
  });

  it("is 0 for today", () => {
    expect(daysSince(daysFromNow(0))).toBe(0);
  });
});
