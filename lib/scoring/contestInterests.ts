import type { Opportunity, UserProfile } from "../types";

// Only positive subject sections supply body evidence. Other headings terminate a section.
const subject = /^(?:공모|모집|응모|참가|경진|대회)\s*(?:분야|주제|부문)\s*[:：]?\s*(.*)$/;
const restricted = /금지|불가|제외|제한|유의|문의|제출\s*(?:방법|형식)/;
const groups = [
  ["영상", "영상 제작", "숏폼", "UCC"], ["개발", "IT개발", "코딩", "해커톤", "앱 개발"],
  ["창업", "스타트업"], ["인공지능", "AI"], ["디자인", "디자이너"],
];

export function contestMatches(opp: Opportunity, profile: UserProfile | null) {
  const interests = [...new Set([...(profile?.interests ?? []), ...(profile?.jobInterests ?? [])].map(s => s.trim()).filter(Boolean))];
  if (!interests.length) return [];
  const evidence = [opp.title];
  let inSubject = false;
  for (const line of opp.description.split(/\r?\n/)) {
    const clean = line.trim().replace(/^[●○■□▶◆※#*\s-]+/, "");
    const heading = subject.exec(clean);
    if (/디자인\s*공모(?:전)?\s*$/.test(clean) && !restricted.test(clean)) evidence.push(clean);
    if (heading) {
      inSubject = true;
      if (heading[1]) evidence.push(heading[1]);
    } else if (!clean || /^[●○■□▶◆※#]/.test(line.trim()) || restricted.test(clean) ||
      /^(?:접수|신청|참가 자격|지원 자격|시상|심사|공모 일정|일정|유의)/.test(clean)) {
      inSubject = false;
    } else if (inSubject) evidence.push(clean);
  }
  return interests.flatMap(interest => {
    const aliases = groups.find(group => group.some(s => s.toLowerCase() === interest.toLowerCase())) ?? [interest];
    for (const quote of evidence) {
      if (restricted.test(quote)) continue;
      for (const alias of aliases) {
        const lower = quote.toLowerCase(), key = alias.toLowerCase();
        const found = /^[a-z]+$/i.test(alias) ? new RegExp("(?<![a-z0-9])" + key + "(?![a-z0-9])", "i").exec(quote)?.index : key === "개발" ? /(?<![가-힣])개발(?!원|공사|지원공사)/.exec(lower)?.index : lower.indexOf(key);
        if (found !== undefined && found >= 0) return [{ interest, evidence: quote.slice(Math.max(0, found - 15), found + key.length + 20) }];
      }
    }
    return [];
  });
}

export function contestPresentation(opportunity: Opportunity, profile: UserProfile | null) {
    const contest = opportunity.dataOrigin === "crawling" && opportunity.categoryId === "contest";
    const matches = contest ? contestMatches(opportunity, profile) : [];
    const matchReason = matches.length ? "내 관심사와 일치 · " + matches.map(m => m.interest + " (“" + m.evidence + "”)").join(" · ") : undefined;
    return { contest, matchCount: matches.length, matchReason };
}
