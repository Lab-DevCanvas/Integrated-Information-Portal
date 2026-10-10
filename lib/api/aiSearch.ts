import type { ChatMessage, UserProfile } from "../types";

export interface AISearchResult {
  request_id: string; as_of: string; status: string; answer: string; mode: string;
  retrieval_mode: string; warnings: string[];
  results: { detail_id: string; title: string; organization: string | null;
    benefits: string[]; period_end: string | null; source_url: string | null;
    recommendation_reason: string; eligibility_status: "eligible" | "ineligible" | "unknown";
    citation_ids: string[]; regions?: string[]; eligibility_description?: string | null;
    duplicate_sources?: { detail_id: string; source: string; source_url: string | null }[] }[];
  citations: { evidence_id: string; opportunity_id: string; source_url: string | null;
    original_quote: string; kind: string; verified_at: string }[];
  comparisons: { detail_id: string; advantages: string; cautions: string; citation_ids: string[] }[];
  plan: { detail_id: string; action: string; suggested_date: string | null; citation_ids: string[] }[];
}

export async function searchAI(message: string, messages: ChatMessage[], profile: UserProfile | null,
  signal: AbortSignal): Promise<AISearchResult> {
  const previous = messages.filter((m) => m.role === "assistant" && m.aiResult?.results.length).at(-1)?.aiResult;
  const regions: Record<string, string> = { 서울: "SEOUL", 부산: "BUSAN", 대구: "DAEGU", 인천: "INCHEON",
    광주: "GWANGJU", 대전: "DAEJEON", 울산: "ULSAN", 세종: "SEJONG", 경기: "GYEONGGI", 강원: "GANGWON",
    충북: "CHUNGBUK", 충남: "CHUNGNAM", 전북: "JEONBUK", 전남: "JEONNAM", 경북: "GYEONGBUK", 경남: "GYEONGNAM", 제주: "JEJU", 전국: "NATIONWIDE" };
  const response = await fetch("/api/ai/search", {
    method: "POST", headers: { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({ message, history: messages.filter((m) => !m.error).slice(-6).map((m) => ({ role: m.role, text: m.text.slice(0, 2000) })),
      previous_result_ids: previous?.results.map((r) => r.detail_id) ?? [],
      profile: profile ? { age: profile.age, region: regions[profile.region],
        education: profile.educationStatus, employment: profile.employmentStatus, income: profile.incomePercentile } : null }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "AI 검색 요청에 실패했습니다.");
  }
  return response.json();
}
