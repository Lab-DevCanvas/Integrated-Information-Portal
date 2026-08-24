import type { ParsedIntent } from "../types";
import {
  AGE_PATTERNS,
  CATEGORY_KEYWORDS,
  EDUCATION_KEYWORDS,
  EMPLOYMENT_KEYWORDS,
  JOB_INTEREST_KEYWORDS,
  REGION_ALIASES,
} from "./dictionaries";

const AMOUNT_PATTERN = /(\d+)\s*(천만원|백만원|만원)\s*(이상|이하)?/;
const WEEKS_REMAINING_PATTERN = /(\d+)\s*주\s*이상\s*남/;
const DAYS_REMAINING_PATTERN = /(\d+)\s*일\s*이상\s*남/;
const MONTH_END_PATTERN = /이번\s*달/;
const IMMINENT_DEADLINE_PATTERN = /마감\s*임박/;
const NO_EDU_RESTRICTION_PATTERN = /대학생\s*(아니어도|아니라도|제한\s*없)|학생\s*아니어도/;
const NO_EXPERIENCE_RESTRICTION_PATTERN = /경력\s*(무관|상관없|없어도)/;
const BENEFIT_DESC_SORT_PATTERN = /상금\s*(높은|큰)\s*순|혜택\s*(높은|큰)\s*순/;
const DEADLINE_SORT_PATTERN = /마감\s*임박\s*순|빨리\s*마감/;
const PORTFOLIO_SORT_PATTERN = /스펙|포트폴리오|커리어에\s*도움|경험\s*쌓/;

/** "이번 달" is treated as a rolling 30-day window rather than the literal calendar month-end,
 * so results stay meaningful no matter what day of the month the demo is run. */
const MONTH_WINDOW_DAYS = 30;

export function parseQuery(query: string): ParsedIntent {
  const intent: ParsedIntent = {
    rawQuery: query,
    unrestrictedDimensions: [],
    matchedKeywords: [],
  };

  for (const pattern of AGE_PATTERNS) {
    const m = query.match(pattern);
    if (m) {
      intent.age = Number(m[1]);
      intent.matchedKeywords.push(m[0]);
      break;
    }
  }

  for (const [alias, region] of Object.entries(REGION_ALIASES)) {
    if (query.includes(alias)) {
      intent.region = region;
      intent.matchedKeywords.push(alias);
      break;
    }
  }

  for (const { pattern, value } of EMPLOYMENT_KEYWORDS) {
    if (pattern.test(query)) {
      intent.employmentStatus = value;
      intent.matchedKeywords.push(value);
      break;
    }
  }

  const noEduRestriction = NO_EDU_RESTRICTION_PATTERN.test(query);
  if (!noEduRestriction) {
    for (const { pattern, value } of EDUCATION_KEYWORDS) {
      if (pattern.test(query)) {
        intent.educationStatus = value;
        intent.matchedKeywords.push(value);
        break;
      }
    }
  }

  for (const { pattern, value } of JOB_INTEREST_KEYWORDS) {
    if (pattern.test(query)) {
      intent.jobInterest = value;
      intent.matchedKeywords.push(value);
      break;
    }
  }

  for (const { pattern, categoryId, opportunityType } of CATEGORY_KEYWORDS) {
    if (pattern.test(query)) {
      intent.categoryHint = categoryId;
      if (opportunityType) intent.opportunityTypeHint = opportunityType;
      intent.matchedKeywords.push(categoryId);
      break;
    }
  }

  const amountMatch = query.match(AMOUNT_PATTERN);
  if (amountMatch) {
    const [, numStr, unit, direction] = amountMatch;
    const num = Number(numStr);
    let won = num * 10_000;
    if (unit === "백만원") won = num * 1_000_000;
    if (unit === "천만원") won = num * 10_000_000;
    if (direction === "이하") intent.maxBenefitAmount = won;
    else intent.minBenefitAmount = won;
    intent.matchedKeywords.push(amountMatch[0]);
  }

  const weeksMatch = query.match(WEEKS_REMAINING_PATTERN);
  if (weeksMatch) {
    intent.minDaysRemaining = Number(weeksMatch[1]) * 7;
    intent.matchedKeywords.push(weeksMatch[0]);
  }
  const daysMatch = query.match(DAYS_REMAINING_PATTERN);
  if (daysMatch) {
    intent.minDaysRemaining = Number(daysMatch[1]);
    intent.matchedKeywords.push(daysMatch[0]);
  }

  if (MONTH_END_PATTERN.test(query)) {
    intent.deadlineWithinDays = MONTH_WINDOW_DAYS;
    intent.matchedKeywords.push("이번 달");
  }
  if (IMMINENT_DEADLINE_PATTERN.test(query)) {
    intent.deadlineWithinDays = 7;
    intent.matchedKeywords.push("마감임박");
  }

  if (noEduRestriction) {
    intent.unrestrictedDimensions.push("education");
    intent.matchedKeywords.push("대학생 아니어도");
  }
  if (NO_EXPERIENCE_RESTRICTION_PATTERN.test(query)) {
    intent.unrestrictedDimensions.push("experience");
    intent.matchedKeywords.push("경력무관");
  }

  if (BENEFIT_DESC_SORT_PATTERN.test(query)) intent.sortHint = "benefit_desc";
  else if (DEADLINE_SORT_PATTERN.test(query)) intent.sortHint = "deadline_asc";
  else if (PORTFOLIO_SORT_PATTERN.test(query)) intent.sortHint = "portfolio_desc";
  else intent.sortHint = "score_desc";

  return intent;
}
