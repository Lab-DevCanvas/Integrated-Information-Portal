import { daysUntil } from "./mock/dateHelpers";
import { computeScore } from "./scoring/score";
import type { CategoryId, ExperienceLevel, Opportunity, OpportunityType, RegionCode, UserProfile } from "./types";

interface CategorySelection {
  allOpportunities: Opportunity[];
  categoryIds: CategoryId[];
  typeIds: OpportunityType[];
  regions: RegionCode[];
  experienceLevels: ExperienceLevel[];
  deadlineWindow: string;
  keyword: string;
  profile: UserProfile | null;
  savedIds: string[];
  eligibleOnly: boolean;
  sortMode: string;
}

/** Apply filters and global ranking before slicing a page. Does not mutate source items. */
export function selectCategoryOpportunities({ allOpportunities, categoryIds, typeIds, regions, experienceLevels, deadlineWindow, keyword, profile, savedIds, eligibleOnly, sortMode }: CategorySelection) {
  const kw = keyword.trim().toLowerCase();

  const base = allOpportunities.filter((o) => {
    if (categoryIds.length > 0 && !categoryIds.includes(o.categoryId)) return false;
    if (typeIds.length > 0 && !typeIds.includes(o.opportunityType)) return false;
    if (regions.length > 0 && !o.region.includes("전국") && !regions.some((r) => o.region.includes(r))) return false;
    if (
      experienceLevels.length > 0 &&
      o.requiredExperienceLevel !== "무관" &&
      !experienceLevels.includes(o.requiredExperienceLevel)
    )
      return false;
    if (deadlineWindow !== "all") {
      if (o.isAlwaysOpen) return false;
      const days = daysUntil(o.applyEndDate);
      if (!Number.isFinite(days) || days < 0 || days > Number(deadlineWindow)) return false;
    }
    if (kw) {
      const haystack = `${o.title} ${o.summary} ${o.organizer} ${o.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    return true;
  });

  let scored = base.map((opportunity) => ({ opportunity, score: profile ? computeScore(profile, opportunity, savedIds) : undefined }));

  if (eligibleOnly) {
    scored = scored.filter((x) => x.score?.eligibilityJudgement.overall !== "fail");
  }

  switch (sortMode) {
    case "deadline":
      scored.sort((a, b) => {
        const aAlways = a.opportunity.isAlwaysOpen ? 1 : 0;
        const bAlways = b.opportunity.isAlwaysOpen ? 1 : 0;
        if (aAlways !== bAlways) return aAlways - bAlways;
        const aDays = daysUntil(a.opportunity.applyEndDate);
        const bDays = daysUntil(b.opportunity.applyEndDate);
        return (Number.isFinite(aDays) ? aDays : Infinity) - (Number.isFinite(bDays) ? bDays : Infinity);
      });
      break;
    case "benefit":
      scored.sort((a, b) => (b.opportunity.benefitAmount ?? 0) - (a.opportunity.benefitAmount ?? 0));
      break;
    case "created":
      scored.sort(
        (a, b) => new Date(b.opportunity.createdAt).getTime() - new Date(a.opportunity.createdAt).getTime(),
      );
      break;
    case "popularity":
      scored.sort((a, b) => (b.opportunity.viewCount ?? 0) - (a.opportunity.viewCount ?? 0));
      break;
    case "portfolio":
      scored.sort((a, b) => b.opportunity.portfolioValue - a.opportunity.portfolioValue);
      break;
    default:
      scored.sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0));
  }

  return scored;
}
