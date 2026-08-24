import { buildComparisonSentence } from "../compare/recommend";
import { OPPORTUNITIES } from "../mock/opportunities";
import { filterAndSortByIntent } from "../search/applyIntent";
import { parseQuery } from "../search/parser";
import type { ParsedIntent, UserProfile } from "../types";

const COMPARE_KEYWORDS = /비교|어떤\s*게\s*(나을|좋을)|뭐가\s*나을/;
const PLAN_KEYWORDS = /계획|우선순위|뭐부터|먼저/;

export interface ChatReply {
  text: string;
  intent: ParsedIntent;
  resultIds: string[];
}

const MAX_SHOWN = 5;
const MAX_COMPARED = 4;

export function generateAssistantReply(message: string, profile: UserProfile, savedIds: string[]): ChatReply {
  const intent = parseQuery(message);
  const results = filterAndSortByIntent(intent, OPPORTUNITIES, profile, savedIds);
  const top = results.slice(0, MAX_SHOWN);

  if (top.length === 0) {
    return {
      text: "조건에 맞는 기회를 찾지 못했어요. 나이, 지역, 마감 기간 같은 조건을 조금 다르게 표현해서 다시 물어봐 주실래요?",
      intent,
      resultIds: [],
    };
  }

  const wantsCompare = COMPARE_KEYWORDS.test(message) && top.length >= 2;
  if (wantsCompare) {
    const entries = top.slice(0, Math.min(MAX_COMPARED, top.length)).map((r) => ({
      opportunity: r.opportunity,
      score: r.score,
    }));
    const comparisonSentence = buildComparisonSentence(entries);
    return {
      text: `${top.length}건을 찾아서 그중 적합도가 높은 ${entries.length}개를 비교해봤어요. ${comparisonSentence}`,
      intent,
      resultIds: entries.map((e) => e.opportunity.id),
    };
  }

  const wantsPlan = PLAN_KEYWORDS.test(message);
  const text = wantsPlan
    ? `말씀하신 조건에 맞는 기회 ${top.length}건을 적합도 순으로 정리했어요. 이 순서대로 준비해보는 걸 추천해요.`
    : `조건에 맞는 기회를 ${results.length}건 찾았어요. 적합도가 높은 순으로 보여드릴게요.`;

  return { text, intent, resultIds: top.map((r) => r.opportunity.id) };
}

export function deriveConversationTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  return trimmed.length > 24 ? `${trimmed.slice(0, 24)}…` : trimmed;
}
