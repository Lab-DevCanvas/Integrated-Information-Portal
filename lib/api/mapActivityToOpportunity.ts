import type { ActivityDTO } from "./crawlingClient";
import type { CategoryId, Opportunity, OpportunityType, SubCategoryId } from "../types";

/**
 * Maps a crawled `ActivityDTO` (crawling backend) to this app's `Opportunity` shape.
 *
 * The crawler only produces title/source/category/url/summary/period — it has no concept of
 * region, structured eligibility, benefit amount, competition level, or portfolio value, all of
 * which this app's scoring/eligibility engine (lib/scoring, lib/eligibility) depends on. Per
 * product decision, fields the crawler doesn't provide are filled with fixed, clearly-placeholder
 * defaults rather than inferred/fabricated per item — see docs/crawling-integration.md "필드 매핑".
 * `eligibility: {}` deliberately asserts no restrictions (judgeEligibility returns "pass" for an
 * empty rule set) instead of guessing at fake conditions.
 */

const SOURCE_LABELS: Record<string, string> = {
  bokjiro: "복지로",
  youthcenter: "온통청년",
  linkareer: "링커리어",
  linkareer_activity: "링커리어",
  allcon: "올콘",
  campuspick: "캠퍼스픽",
  campuspick_activity: "캠퍼스픽",
  data_go_kr: "공공데이터포털",
  saramin: "사람인",
  jobkorea: "잡코리아",
  allforyoung: "요즘것들",
};

interface Taxonomy {
  opportunityType: OpportunityType;
  categoryId: CategoryId;
  subCategoryId: SubCategoryId;
  benefitType: Opportunity["benefitType"];
}

function resolveTaxonomy(activity: ActivityDTO): Taxonomy {
  switch (activity.category) {
    case "contest":
      return { opportunityType: "contest", categoryId: "career", subCategoryId: "contest", benefitType: "상금" };
    case "activity":
      return {
        opportunityType: "external_activity",
        categoryId: "career",
        subCategoryId: "hackathon",
        benefitType: "교육/멘토링",
      };
    case "job":
      return { opportunityType: "job", categoryId: "employment", subCategoryId: "job_fulltime", benefitType: "급여" };
    case "government-policy":
      return activity.source === "youthcenter"
        ? { opportunityType: "youth_policy", categoryId: "money", subCategoryId: "subsidy", benefitType: "지원금" }
        : { opportunityType: "gov_support", categoryId: "money", subCategoryId: "subsidy", benefitType: "지원금" };
    default:
      return { opportunityType: "gov_support", categoryId: "money", subCategoryId: "subsidy", benefitType: "지원금" };
  }
}

const PLACEHOLDER_END_DATE_DAYS = 90;

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const SUMMARY_MAX_LENGTH = 140;

export function mapActivityToOpportunity(activity: ActivityDTO): Opportunity {
  const taxonomy = resolveTaxonomy(activity);
  const isAlwaysOpen = activity.period_status === "always_open";
  const summaryText = activity.summary?.trim() || "요약 정보가 제공되지 않았습니다.";

  return {
    id: activity.id,
    title: activity.title?.trim() || "(제목 미상)",
    organizer: SOURCE_LABELS[activity.source] ?? activity.source,
    opportunityType: taxonomy.opportunityType,
    categoryId: taxonomy.categoryId,
    subCategoryId: taxonomy.subCategoryId,
    summary:
      summaryText.length > SUMMARY_MAX_LENGTH ? `${summaryText.slice(0, SUMMARY_MAX_LENGTH)}…` : summaryText,
    description: summaryText,
    // PLACEHOLDER — the crawler doesn't capture region; every crawled item is shown nationwide.
    region: ["전국"],
    applyStartDate: activity.period_start ?? activity.first_collected_at,
    applyEndDate: activity.period_end ?? addDays(activity.first_collected_at, PLACEHOLDER_END_DATE_DAYS),
    isAlwaysOpen,
    benefitType: taxonomy.benefitType,
    // benefitAmount intentionally left undefined ("variable/unknown" is a real, supported state).
    benefitDescription: "상세 혜택 내용은 원문 공고에서 확인해주세요.",
    // PLACEHOLDER — no structured eligibility rules from the crawler; an empty rule set means
    // judgeEligibility() reports every item as unrestricted ("pass") rather than a fabricated fail.
    eligibility: {},
    // PLACEHOLDER — no experience-level signal available.
    requiredExperienceLevel: "무관",
    // PLACEHOLDER — fixed mid-range values so scored crawled items sort roughly in the middle of
    // the pack rather than at either extreme.
    competitionLevel: 3,
    portfolioValue: 3,
    tags: [SOURCE_LABELS[activity.source] ?? activity.source],
    // PLACEHOLDER — team requirement is not crawled.
    teamRequired: false,
    applyUrl: activity.detail_url ?? undefined,
    createdAt: activity.first_collected_at,
  };
}
