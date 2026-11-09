import type { UserProfile } from "../types";

const bands: Record<string, [number, number]> = {
  UNDER_19: [0, 18], AGE_19_24: [19, 24], AGE_25_29: [25, 29],
  AGE_30_34: [30, 34], AGE_35_39: [35, 39], OVER_39: [40, Infinity],
};

export function ageEligibility(text: string, profile: UserProfile | null) {
  const lines = text.split(/\r?\n/).map(line => line.trim());
  const rules = lines.filter(line => /^(지원 연령|신청 연령|지원 자격|신청 자격|참가 자격|연령 제한)\s*[:：]/.test(line));
  if (rules.length !== 1 || /예외|면제|연장|별도 기준|기준일|출생자/.test(text)) return;
  const rule = rules[0].split(/[:：]/)[1].trim();
  const range = /^만\s*(\d{1,2})\s*세?\s*[~～–-]\s*(?:만\s*)?(\d{1,2})\s*세$/.exec(rule);
  const limit = /^만\s*(\d{1,2})\s*세\s*(이상|이하|미만|초과)$/.exec(rule);
  if (!range && !limit) return;
  let min = 0, max = Infinity;
  if (range) [min, max] = [Number(range[1]), Number(range[2])];
  if (limit) {
    const n = Number(limit[1]);
    if (limit[2] === "이상" || limit[2] === "초과") min = n + Number(limit[2] === "초과");
    else max = n - Number(limit[2] === "미만");
  }
  if (min > max) return;
  const band = bands[profile?.accountProfile?.eligibility_facts.age_band ?? ""];
  const failed = !!band && (band[1] < min || band[0] > max);
  const label = failed ? "연령 조건 미충족" : band && band[0] >= min && band[1] <= max ? "연령 조건 충족" : "나이 확인 필요";
  return { failed, reason: label + " · " + rule };
}
