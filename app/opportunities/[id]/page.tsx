import { notFound } from "next/navigation";
import { getActivityById } from "@/lib/api/crawlingClient";
import { mapActivityToOpportunity } from "@/lib/api/mapActivityToOpportunity";
import { OpportunityDetail } from "./OpportunityDetail";

export default async function OpportunityDetailPage({ params }: PageProps<"/opportunities/[id]">) {
  const { id } = await params;

  // Server-side lookup against the crawling API — the client-side merged list
  // (useAllOpportunities) isn't available here since this is a Server Component.
  // See docs/crawling-integration.md.
  const activity = await getActivityById(id);
  if (!activity) notFound();
  return <OpportunityDetail opportunity={mapActivityToOpportunity(activity)} />;
}
