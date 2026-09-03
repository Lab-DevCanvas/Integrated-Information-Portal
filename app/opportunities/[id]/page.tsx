import { notFound } from "next/navigation";
import { getActivityById } from "@/lib/api/crawlingClient";
import { mapActivityToOpportunity } from "@/lib/api/mapActivityToOpportunity";
import { getOpportunityById } from "@/lib/mock/opportunities";
import { OpportunityDetail } from "./OpportunityDetail";

export default async function OpportunityDetailPage({ params }: PageProps<"/opportunities/[id]">) {
  const { id } = await params;

  // Curated mock data is server-rendered directly. Ids that don't match it fall back to a
  // server-side lookup against the crawling API — the client-side merged list (useAllOpportunities)
  // isn't available here since this is a Server Component. See docs/crawling-integration.md.
  const opportunity = getOpportunityById(id) ?? (await fetchCrawledOpportunity(id));
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity} />;
}

async function fetchCrawledOpportunity(id: string) {
  try {
    const activity = await getActivityById(id);
    return activity ? mapActivityToOpportunity(activity) : null;
  } catch {
    return null;
  }
}
