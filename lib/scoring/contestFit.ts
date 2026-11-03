import { regionLabels } from "../account/profile";
import type { Opportunity, UserProfile } from "../types";

export interface ContestFit {
  label: "내 선호 일치도" | "관심사 일치 비율";
  percent: number;
  explanation: string;
}

export function selectedInterests(profile: UserProfile | null) {
  return [...new Set([...(profile?.interests ?? []), ...(profile?.jobInterests ?? [])].map(s => s.trim()).filter(Boolean))];
}

// Only explicit whole-event fields are comparable; phase-specific or conflicting evidence abstains.
function explicitValue(text: string, pattern: RegExp) {
  const values = new Set(text.split(/\r?\n/).map(s => pattern.exec(s.trim())?.[1]).filter((v): v is string => !!v));
  return values.size === 1 ? [...values][0] : undefined;
}

export function contestFit(profile: UserProfile | null, opportunity: Opportunity, matchCount: number): ContestFit | undefined {
  if (!profile) return;
  const interests = selectedInterests(profile);
  const preferences = profile.accountProfile?.preferences;
  const mode = preferences?.activity_mode;
  const regions = preferences?.interest_regions ?? [];
  const checks: { label: string; weight: number; value: number | undefined }[] = [];
  if (interests.length) checks.push({label: "관심 분야", weight: 50, value: matchCount ? matchCount / interests.length : undefined});

  if (mode && mode !== "NO_PREFERENCE") {
    const raw = explicitValue(opportunity.description, /^(?:[-●■]\s*)?(?:전체\s*활동\s*방식|전체\s*진행\s*방식|활동\s*방식)\s*[:：]\s*(온라인|오프라인|온·오프라인 병행)\s*$/);
    const resolved = raw === "온라인" ? "ONLINE" : raw === "오프라인" ? "OFFLINE" : raw ? "HYBRID" : undefined;
    checks.push({label: "활동 방식" + (raw ? " (" + raw + ")" : ""), weight: 20, value: resolved ? Number(resolved === mode) : undefined});
  }
  if (regions.length && !regions.includes("NATIONWIDE")) {
    const raw = explicitValue(opportunity.description, /^(?:[-●■]\s*)?(?:전체\s*활동\s*지역|활동\s*지역)\s*[:：]\s*([가-힣]+)\s*$/);
    const code = Object.entries(regionLabels).find(([, label]) => label === raw)?.[0];
    checks.push({label: "활동 지역" + (code ? " (" + raw + ")" : ""), weight: 30, value: code && code !== "NATIONWIDE" ? Number(regions.some(r => r === code)) : undefined});
  }
  if (checks.length >= 2 && checks.every(c => c.value !== undefined)) {
    return {label: "내 선호 일치도", percent: Math.round(100 * checks.reduce((s,c) => s + c.weight * c.value!, 0) / checks.reduce((s,c) => s + c.weight, 0)),
      explanation: checks.map(c => c.label + " " + Math.round(c.value! * 100) + "%").join(" · ")};
  }
  if (matchCount && interests.length) {
    return {label: "관심사 일치 비율", percent: Math.round(100 * matchCount / interests.length),
      explanation: `선택한 관심사 ${interests.length}개 중 ${matchCount}개를 공고에서 확인` + (checks.length > 1 ? " · 다른 선호는 종합 점수에 반영할 근거가 부족해요." : "")};
  }
}
