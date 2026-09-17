import type { ActivityDTO } from "./crawlingClient";
import type { CategoryId, Opportunity, OpportunityType, SubCategoryId } from "../types";

/** Maps the backend contract into the legacy local recommendation model.
 * Missing dates and regions remain empty; dataOrigin makes eligibility unknown.
 * Fixed score inputs below are local compatibility defaults, not backend facts.
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
      return { opportunityType: "contest", categoryId: "contest", subCategoryId: "contest", benefitType: "상금" };
    case "activity":
      return {
        opportunityType: "external_activity",
        categoryId: "activity",
        subCategoryId: "activity",
        benefitType: "교육/멘토링",
      };
    case "job":
      return { opportunityType: "job", categoryId: "job", subCategoryId: "job", benefitType: "급여" };
    case "government-policy":
      return activity.source === "youthcenter"
        ? { opportunityType: "youth_policy", categoryId: "government-policy", subCategoryId: "government-policy", benefitType: "지원금" }
        : { opportunityType: "gov_support", categoryId: "government-policy", subCategoryId: "government-policy", benefitType: "지원금" };
    default:
      return { opportunityType: "gov_support", categoryId: "government-policy", subCategoryId: "government-policy", benefitType: "지원금" };
  }
}

const SUMMARY_MAX_LENGTH = 140;

export function mapActivityToOpportunity(activity: ActivityDTO): Opportunity {
  const taxonomy = resolveTaxonomy(activity);
  const isAlwaysOpen = activity.period_status === "always_open";
  const summaryText = activity.summary?.trim() || "요약 정보가 제공되지 않았습니다.";

  return {
    id: activity.id,
    dataOrigin: "crawling",
    lastSeenAt: activity.last_seen_at,
    periodStatus: activity.period_status,
    rawPeriodText: activity.raw_period_text ?? undefined,
    title: activity.title?.trim() || "(제목 미상)",
    organizer: SOURCE_LABELS[activity.source] ?? activity.source,
    opportunityType: taxonomy.opportunityType,
    categoryId: taxonomy.categoryId,
    subCategoryId: taxonomy.subCategoryId,
    summary:
      summaryText.length > SUMMARY_MAX_LENGTH ? `${summaryText.slice(0, SUMMARY_MAX_LENGTH)}…` : summaryText,
    description: summaryText,
    // No structured region is provided by the backend.
    region: [],
    applyStartDate: activity.period_start ?? "",
    applyEndDate: activity.period_end ?? "",
    isAlwaysOpen,
    benefitType: taxonomy.benefitType,
    // benefitAmount intentionally left undefined ("variable/unknown" is a real, supported state).
    benefitDescription: "상세 혜택 내용은 원문 공고에서 확인해주세요.",
    // dataOrigin=crawling makes missing eligibility an unknown result.
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
    refUrl: activity.detail_url && /^https?:\/\//i.test(activity.detail_url) ? activity.detail_url : undefined,
    createdAt: activity.first_collected_at,
  };
}
