import { describe, expect, it } from "vitest";
import { buildCalendarEventsByDate } from "./calendar";
import { dateKey } from "./mock/dateHelpers";
import { makeOpportunity } from "./testFixtures";

describe("buildCalendarEventsByDate", () => {
  it("registers both a start and a deadline event for a normal opportunity", () => {
    const o = makeOpportunity({ id: "a", title: "A", applyStartDate: "2026-03-01T09:00:00.000Z", applyEndDate: "2026-03-10T09:00:00.000Z" });
    const byDate = buildCalendarEventsByDate([o]);

    const startEvents = byDate.get(dateKey(o.applyStartDate));
    const deadlineEvents = byDate.get(dateKey(o.applyEndDate));

    expect(startEvents).toEqual([{ id: "a-start", opportunityId: "a", title: "A", type: "start", date: o.applyStartDate }]);
    expect(deadlineEvents).toEqual([
      { id: "a-deadline", opportunityId: "a", title: "A", type: "deadline", date: o.applyEndDate },
    ]);
  });

  it("registers only a start event for an always-open opportunity (no real deadline)", () => {
    const o = makeOpportunity({
      id: "b",
      title: "B",
      isAlwaysOpen: true,
      applyStartDate: "2026-03-01T09:00:00.000Z",
      applyEndDate: "2026-03-10T09:00:00.000Z",
    });
    const byDate = buildCalendarEventsByDate([o]);

    expect(byDate.get(dateKey(o.applyStartDate))).toHaveLength(1);
    expect(byDate.get(dateKey(o.applyStartDate))?.[0].type).toBe("start");
    expect(byDate.get(dateKey(o.applyEndDate))).toBeUndefined();
  });

  it("groups events from multiple opportunities that fall on the same day", () => {
    const a = makeOpportunity({ id: "a", title: "A", applyStartDate: "2026-03-01T09:00:00.000Z" });
    const b = makeOpportunity({ id: "b", title: "B", applyStartDate: "2026-03-01T09:00:00.000Z" });
    const byDate = buildCalendarEventsByDate([a, b]);

    const day = byDate.get(dateKey("2026-03-01T09:00:00.000Z"));
    expect(day?.map((e) => e.opportunityId).sort()).toEqual(["a", "b"]);
  });

  it("sorts start events before deadline events on the same day, then alphabetically by title", () => {
    // Z's deadline and A's start both land on 2026-03-05.
    const a = makeOpportunity({ id: "a", title: "Zebra", applyStartDate: "2026-03-05T09:00:00.000Z", applyEndDate: "2026-04-01T09:00:00.000Z" });
    const b = makeOpportunity({ id: "b", title: "Apple", applyStartDate: "2026-01-01T09:00:00.000Z", applyEndDate: "2026-03-05T09:00:00.000Z" });
    const c = makeOpportunity({ id: "c", title: "Mango", applyStartDate: "2026-03-05T09:00:00.000Z", applyEndDate: "2026-04-02T09:00:00.000Z" });
    const byDate = buildCalendarEventsByDate([a, b, c]);

    const day = byDate.get(dateKey("2026-03-05T09:00:00.000Z"));
    expect(day?.map((e) => `${e.type}:${e.title}`)).toEqual(["start:Mango", "start:Zebra", "deadline:Apple"]);
  });
});
