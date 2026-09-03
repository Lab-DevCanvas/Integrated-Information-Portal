"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { CalendarEvent } from "@/lib/calendar";

interface Props {
  label: string;
  events: CalendarEvent[];
  onClose: () => void;
}

export function DayEventsModal({ label, events, onClose }: Props) {
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-slate-950/80"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">{label}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{events.length}개 일정</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/opportunities/${ev.opportunityId}`}
                onClick={onClose}
                className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Badge tone={ev.type === "start" ? "indigo" : "rose"} className="shrink-0 font-bold">
                  {ev.type === "start" ? "시작" : "마감"}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {ev.title}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
