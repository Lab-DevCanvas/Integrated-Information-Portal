import { ageEligibility } from "./ageEligibility";
import { contestFit, selectedInterests } from "./contestFit";
import type { Opportunity, UserProfile } from "../types";

// Only positive subject sections supply body evidence. Other headings terminate a section.
const subject = /^(?:공모|모집|응모|참가|경진|대회|활동|채용|지원)\s*(?:분야|주제|부문|직무)\s*[:：]?\s*(.*)$/;
const restricted = /금지|불가|제외|제한|유의|문의|제출\s*(?:방법|형식)/;
const groups = [
  ["영상", "영상 제작", "숏폼", "UCC"], ["개발", "IT개발", "코딩", "해커톤", "앱 개발", "웹 개발", "소프트웨어 개발", "프로그래밍"],
  ["창업", "스타트업"], ["인공지능", "AI"], ["디자인", "디자이너"],
];

const relatedTopics: Record<string, string[]> = {
  개발: ["인공지능", "데이터 분석", "정보보안"],
  인공지능: ["데이터 분석", "머신러닝"],
  영상: ["영화", "애니메이션", "미디어 콘텐츠"],
  디자인: ["시각예술", "일러스트", "브랜딩"],
  창업: ["사업화", "비즈니스 모델"],
};

export function contestMatches(opp: Opportunity, profile: UserProfile | null) {
  const interests = selectedInterests(profile);
  if (!interests.length) return [];
  type Tier = "핵심 과제" | "선택 부문" | "제목 일치" | "연관 분야";
  const points = { "핵심 과제": 100, "선택 부문": 80, "제목 일치": 60, "연관 분야": 30 } as const;
  const evidence: {quote: string; tier?: Tier; task: boolean}[] = [{quote: opp.title, tier: "제목 일치", task: false}];
  const normalizedTitle = opp.title.replace(/\s+/g, "").toLowerCase();
  let section: "fields" | "task" | undefined;
  for (const line of opp.description.split(/\r?\n/)) {
    const clean = line.trim().replace(/^[●○■□▶◆※#*\s-]+/, "");
    if (clean.length >= 8 && normalizedTitle.includes(clean.replace(/\s+/g, "").toLowerCase())) continue;
    const heading = subject.exec(clean);
    const task = /^(?:수행\s*과제|제출물|주요\s*업무|담당\s*업무|활동\s*내용|공모\s*내용)\s*[:：]?\s*(.*)$/.exec(clean);
    if (task || heading) {
      section = task || /주제|직무/.test(clean.slice(0,8)) ? "task" : "fields";
      const quote = (task ?? heading)![1];
      if (quote) evidence.push({quote, tier: section === "fields" ? "선택 부문" : "핵심 과제", task: true});
    } else {
      if (!clean || /^[●○■□▶◆※#]/.test(line.trim()) || restricted.test(clean) ||
          /^(?:접수|신청|참가 자격|지원 자격|시상|심사|공모 일정|일정|혜택|유의|문의)/.test(clean)) section = undefined;
      if (clean) evidence.push({quote: clean, tier: section === "fields" ? "선택 부문" : section === "task" ? "핵심 과제" : undefined, task: true});
    }
  }
  return interests.flatMap(interest => {
    let best: {interest:string; evidence:string; tier:Tier; points:number} | undefined;
    const aliases = groups.find(group => group.some(s => s.toLowerCase() === interest.toLowerCase())) ?? [interest];
    for (const {quote, tier, task} of evidence) {
      if (restricted.test(quote) || /가이드|참고자료|특강|멘토링 제공|멘토 특전|경품|혜택|심사위원|우대사항|제출 형식/.test(quote)) continue;
      const related = relatedTopics[aliases[0]]?.find(term => quote.includes(term));
      if (tier && related && !best) best = { interest, evidence: related, tier: "연관 분야", points: 30 };
      for (const alias of aliases) {
        const key = alias.toLowerCase();
        const at = /^[a-z]+$/i.test(key) ? new RegExp("(?<![a-z0-9])"+key+"(?![a-z0-9])","i").exec(quote)?.index :
          key === "개발" ? /개발(?:자|톤)/.exec(quote)?.index : quote.toLowerCase().indexOf(key);
        if (at == null || at < 0) continue;
        const after = quote.slice(at + alias.length, at + alias.length + 32);
        const deliverable = /^(?:을|를|로|으로|을 통해|를 통해)?\s*(?:직접\s*)?(?:제작|구현|설계|분석|개발|창작|공모(?:합니다|한다|\s*$)|작품을 제출)/.test(after) ||
          /^(?:해|하여|해서)\s*(?:앱|서비스|프로토타입|작품|결과물).{0,10}제출/.test(after);
        const level: Tier | undefined = tier === "제목 일치" ? tier :
          /또는|택\s*1|중\s*선택/.test(quote) ? (tier || deliverable ? "선택 부문" : undefined) :
          tier ?? (task && deliverable ? "핵심 과제" : undefined);
        if (level && (!best || points[level] > best.points)) best = {interest, tier:level, points:points[level], evidence:quote.slice(Math.max(0,at-15),at+key.length+35)};
      }
    }
    return best ? [best] : [];
  });
}

export function contestPresentation(opportunity: Opportunity, profile: UserProfile | null) {
    const crawled = opportunity.dataOrigin === "crawling";
    const matches = crawled ? contestMatches(opportunity, profile) : [];
    const age = crawled ? ageEligibility(opportunity.description, profile) : undefined;
    const interestReason = matches.length ? "내 관심사와 일치 · " + matches.map(m => m.interest + " · " + m.tier + " (“" + m.evidence + "”)").join(" · ") : undefined;
    const matchReason = [age?.reason, !age?.failed && interestReason].filter(Boolean).join(" · ") || undefined;
    return { crawled, age, matchCount: age?.failed ? 0 : matches.length, matchReason, fit: crawled && !age?.failed ? contestFit(profile, opportunity, [...matches].sort((a,b) => b.points-a.points)[0]) : undefined };
}
