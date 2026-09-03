"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildCalendarEventsByDate } from "@/lib/calendar";
import { OPPORTUNITY_TYPE_LABELS } from "@/lib/constants";
import { dateKey } from "@/lib/mock/dateHelpers";
import { useAllOpportunities } from "@/lib/hooks/useAllOpportunities";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import type { OpportunityType } from "@/lib/types";
import { DayEventsModal } from "./DayEventsModal";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_INLINE = 5;
const GRID_CELLS = 42;
const OPPORTUNITY_TYPES = Object.keys(OPPORTUNITY_TYPE_LABELS) as OpportunityType[];

function buildMonthCells(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function formatDayLabel(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_LABELS[d.getDay()]})`;
}

export function CalendarGrid() {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState<OpportunityType[]>([]);

  const allOpportunities = useAllOpportunities();
  const filteredOpportunities = useMemo(
    () =>
      typeFilter.length === 0 ? allOpportunities : allOpportunities.filter((o) => typeFilter.includes(o.opportunityType)),
    [allOpportunities, typeFilter],
  );
  const eventsByDate = useMemo(() => buildCalendarEventsByDate(filteredOpportunities), [filteredOpportunities]);
  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const todayKey = dateKey(today);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  function toggleType(id: OpportunityType) {
    setTypeFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const modalEvents = modalDate ? (eventsByDate.get(dateKey(modalDate)) ?? []) : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          {viewYear}년 {viewMonth + 1}월
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={goToday}>
            오늘
          </Button>
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => shiftMonth(1)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Chip selected={typeFilter.length === 0} onClick={() => setTypeFilter([])}>
          전체
        </Chip>
        {OPPORTUNITY_TYPES.map((t) => (
          <Chip key={t} selected={typeFilter.includes(t)} onClick={() => toggleType(t)}>
            {OPPORTUNITY_TYPE_LABELS[t]}
          </Chip>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> 시작
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 마감
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d) => {
              const key = dateKey(d);
              const inMonth = d.getMonth() === viewMonth;
              const isToday = key === todayKey;
              const events = eventsByDate.get(key) ?? [];
              const visible = events.slice(0, MAX_INLINE);
              const overflow = events.length > MAX_INLINE ? events.length - MAX_INLINE : 0;

              return (
                <div
                  key={key}
                  className={`min-h-[108px] border-b border-r border-slate-100 p-1.5 last:border-r-0 dark:border-slate-800 ${
                    inMonth ? "" : "bg-slate-50/60 dark:bg-slate-900/40"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday
                        ? "bg-indigo-600 text-white"
                        : inMonth
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {d.getDate()}
                  </span>

                  <div className="mt-1 space-y-0.5">
                    {visible.map((ev) => (
                      <Link
                        key={ev.id}
                        href={`/opportunities/${ev.opportunityId}`}
                        title={ev.title}
                        className={`block truncate rounded px-1 py-[3px] text-[11px] font-medium hover:opacity-80 ${
                          ev.type === "start"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        }`}
                      >
                        {ev.type === "start" ? "시작" : "마감"} {ev.title}
                      </Link>
                    ))}
                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={() => setModalDate(d)}
                        className="block w-full truncate rounded px-1 py-[3px] text-left text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        +{overflow}개 더보기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {modalDate && (
        <DayEventsModal label={formatDayLabel(modalDate)} events={modalEvents} onClose={() => setModalDate(null)} />
      )}
    </div>
  );
}
