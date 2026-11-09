import { regionLabels } from "../account/profile";
import type { Opportunity, UserProfile } from "../types";

export interface ContestFit {
  label: "내 선호 일치도" | "분야 일치도" | "확인된 조건 일치도";
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

export function contestFit(profile: UserProfile | null, opportunity: Opportunity, best?: {interest: string; tier: string; points: number}): ContestFit | undefined {
  if (!profile) return;
  const interests = selectedInterests(profile);
  const preferences = profile.accountProfile?.preferences;
  const mode = preferences?.activity_mode;
  const regions = preferences?.interest_regions ?? [];
  const checks: { label: string; weight: number; value: number | undefined }[] = [];
  if (interests.length) checks.push({label: "관심 분야", weight: 60, value: best ? best.points / 100 : undefined});

  if (mode && mode !== "NO_PREFERENCE") {
    const raw = explicitValue(opportunity.description, /^(?:[-●■]\s*)?(?:전체\s*활동\s*방식|전체\s*진행\s*방식|활동\s*방식)\s*[:：]\s*(온라인|오프라인|온·오프라인 병행)\s*$/);
    const resolved = raw === "온라인" ? "ONLINE" : raw === "오프라인" ? "OFFLINE" : raw ? "HYBRID" : undefined;
    const mandatoryFinal = mode === "ONLINE" && opportunity.description.split(/\r?\n/).some(line =>
      /(?:본선|결선).{0,24}(?:현장|오프라인)\s*(?:발표|참석|참가|참여).{0,10}필수/.test(line) &&
      !/아님|아니|선택|면제|불필요|대체 가능/.test(line));
    checks.push({label: mandatoryFinal ? "활동 방식 (본선·결선 현장 참여 필수)" : "활동 방식" + (raw ? " (" + raw + ")" : ""), weight: 25, value: mandatoryFinal ? 0 : resolved ? Number(resolved === mode) : undefined});
  }
  if (regions.length && !regions.includes("NATIONWIDE")) {
    const raw = explicitValue(opportunity.description, /^(?:[-●■]\s*)?(?:전체\s*활동\s*지역|활동\s*지역)\s*[:：]\s*([가-힣]+)\s*$/);
    const code = Object.entries(regionLabels).find(([, label]) => label === raw)?.[0];
    checks.push({label: "활동 지역" + (code ? " (" + raw + ")" : ""), weight: 15, value: code && code !== "NATIONWIDE" ? Number(regions.some(r => r === code)) : undefined});
  }
  if (checks.length >= 2 && checks.every(c => c.value !== undefined)) {
    return {label: "내 선호 일치도", percent: Math.round(100 * checks.reduce((s,c) => s + c.weight * c.value!, 0) / checks.reduce((s,c) => s + c.weight, 0)),
      explanation: checks.map(c => c.label + " " + Math.round(c.value! * 100) + "%").join(" · ")};
  }
  if (best) {
    return {label: "분야 일치도", percent: best.points,
      explanation: `${best.interest} · ${best.tier} 기준` + (checks.length > 1 ? " · 다른 선호는 종합 점수에 반영할 근거가 부족해요." : "")};
  }
  const comparable = checks.filter((c): c is typeof c & {value: number} => c.value !== undefined);
  if (comparable.length) {
    const weight = comparable.reduce((sum, c) => sum + c.weight, 0);
    return {label: "확인된 조건 일치도",
      percent: Math.round(100 * comparable.reduce((sum, c) => sum + c.weight * c.value, 0) / weight),
      explanation: comparable.map(c => c.label + (c.value ? " 일치" : " 불일치")).join(" · ") + " · 확인 가능한 조건만 반영"};
  }
  const semantic = interests.map(interest => ({interest, value: opportunity.interestSimilarities?.[interest]}))
    .filter((entry): entry is {interest: string; value: number} => typeof entry.value === "number" && Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value)[0];
  if (semantic && semantic.value > 0.5) {
    // Conservative pilot scale: semantic evidence alone remains below title/task evidence.
    const percent = Math.min(40, Math.max(1, Math.round((semantic.value - 0.5) * 160)));
    return {label: "분야 일치도", percent,
      explanation: semantic.interest + "와 내용상 연관성 · 실제 수행 과제는 확인이 필요해요."};
  }
  if (interests.length && opportunity.title.trim()) {
    return {label: "분야 일치도", percent: 0, explanation: "공고에서 내 관심 분야와 연결되는 표현을 찾지 못했어요."};
  }
}
