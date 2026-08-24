import { notFound } from "next/navigation";
import { getOpportunityById } from "@/lib/mock/opportunities";
import { OpportunityDetail } from "./OpportunityDetail";

export default async function OpportunityDetailPage({ params }: PageProps<"/opportunities/[id]">) {
  const { id } = await params;
  const opportunity = getOpportunityById(id);
  if (!opportunity) notFound();
  return <OpportunityDetail opportunity={opportunity} />;
}
