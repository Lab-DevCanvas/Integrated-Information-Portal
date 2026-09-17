import type { ExperienceLevel, Opportunity } from "./types";

export function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.round((amount % 100_000_000) / 10_000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "날짜 미상";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  return `${formatMonthDay(startIso)} – ${formatMonthDay(endIso)}`;
}

/** Deadlines are conventionally end-of-day, regardless of the time stored on the mock record. */
export function formatDeadlineDateTime(iso: string): string {
  if (!iso) return "마감일 미상";
  return `${formatMonthDay(iso)} 23:59`;
}

const LEVEL_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "매우 낮음",
  2: "낮음",
  3: "보통",
  4: "높음",
  5: "매우 높음",
};

export function levelLabel(value: 1 | 2 | 3 | 4 | 5): string {
  return LEVEL_LABELS[value];
}

/** Rough, deterministic "how many hours to prepare" estimate — no stored data, just a
 * heuristic off difficulty/portfolio value so it never jitters between renders. */
export function estimatePrepHours(opportunity: Opportunity): number {
  const base = opportunity.competitionLevel * 2;
  const portfolioBonus = opportunity.portfolioValue >= 4 ? 2 : 0;
  return base + portfolioBonus;
}

const EXPERIENCE_TO_PREP_LEVEL: Record<ExperienceLevel, 1 | 2 | 3 | 4 | 5> = {
  무관: 1,
  대학생: 2,
  취준생: 3,
  "초급(1~3년)": 4,
  "경력(4년+)": 5,
};

/** How demanding the required experience level makes preparation, as a 1-5 level for display. */
export function prepDifficultyLevel(level: ExperienceLevel): 1 | 2 | 3 | 4 | 5 {
  return EXPERIENCE_TO_PREP_LEVEL[level];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic mock "last verified" timestamp derived from the opportunity id, so the
 * detail page can show a plausible-looking check time without relying on the current clock
 * (which would cause a server/client hydration mismatch). */
export function lastCheckedLabel(opportunity: Opportunity): string {
  const hash = hashString(opportunity.id);
  const hour = hash % 24;
  const minute = (hash >>> 8) % 60;
  const d = new Date(opportunity.createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(hour)}:${pad(minute)}`;
}
