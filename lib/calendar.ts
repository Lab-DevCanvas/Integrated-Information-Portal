import { OPPORTUNITIES } from "./mock/opportunities";
import { dateKey } from "./mock/dateHelpers";
import type { Opportunity } from "./types";

export type CalendarEventType = "start" | "deadline";

export interface CalendarEvent {
  id: string;
  opportunityId: string;
  title: string;
  type: CalendarEventType;
  date: string;
}

function eventsForOpportunity(o: Opportunity): CalendarEvent[] {
  const events: CalendarEvent[] = [
    { id: `${o.id}-start`, opportunityId: o.id, title: o.title, type: "start", date: o.applyStartDate },
  ];
  // Always-open opportunities have no real deadline to mark — formatDday shows "상시" for them too.
  if (!o.isAlwaysOpen) {
    events.push({ id: `${o.id}-deadline`, opportunityId: o.id, title: o.title, type: "deadline", date: o.applyEndDate });
  }
  return events;
}

export function buildCalendarEventsByDate(opportunities: Opportunity[] = OPPORTUNITIES): Map<string, CalendarEvent[]> {
  const byDate = new Map<string, CalendarEvent[]>();

  for (const o of opportunities) {
    for (const event of eventsForOpportunity(o)) {
      const key = dateKey(event.date);
      const list = byDate.get(key);
      if (list) list.push(event);
      else byDate.set(key, [event]);
    }
  }

  for (const list of byDate.values()) {
    list.sort((a, b) => (a.type !== b.type ? (a.type === "start" ? -1 : 1) : a.title.localeCompare(b.title)));
  }

  return byDate;
}
