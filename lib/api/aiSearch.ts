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

const searchErrors: Record<string, { message: string; retryable: boolean }> = {
  AI_SEARCH_BUSY: { message: "현재 검색 요청이 많습니다", retryable: true },
  AI_SEARCH_RATE_LIMIT: { message: "현재 검색 요청이 많습니다", retryable: true },
  AI_SEARCH_DAILY_LIMIT: { message: "오늘 서비스 전체의 검색 사용량 한도에 도달했습니다. 내일 다시 이용해주세요.", retryable: false },
  AI_SEARCH_USER_DAILY_LIMIT: { message: "오늘 사용 가능한 검색 횟수를 모두 사용했습니다", retryable: false },
  AI_PROVIDER_LIMIT: { message: "AI 서비스가 일시적으로 요청을 처리하지 못하고 있습니다", retryable: true },
};

export class AISearchError extends Error {
  constructor(message: string, public readonly code: string, public readonly retryable: boolean) {
    super(message);
    this.name = "AISearchError";
  }
}

export async function searchAI(message: string, messages: ChatMessage[], profile: UserProfile | null,
  signal: AbortSignal, onProgress?: (stage: SearchStage) => void, targetIds?: string[]): Promise<AISearchResult> {
  const previous = messages.filter((m) => m.role === "assistant" && m.aiResult?.results.length).at(-1)?.aiResult;
  const regions: Record<string, string> = { 서울: "SEOUL", 부산: "BUSAN", 대구: "DAEGU", 인천: "INCHEON",
    광주: "GWANGJU", 대전: "DAEJEON", 울산: "ULSAN", 세종: "SEJONG", 경기: "GYEONGGI", 강원: "GANGWON",
    충북: "CHUNGBUK", 충남: "CHUNGNAM", 전북: "JEONBUK", 전남: "JEONNAM", 경북: "GYEONGBUK", 경남: "GYEONGNAM", 제주: "JEJU", 전국: "NATIONWIDE" };
  const response = await fetch("/api/ai/search", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "text/event-stream" }, signal,
    body: JSON.stringify({ message, history: messages.filter((m) => !m.error).slice(-6).map((m) => ({ role: m.role, text: m.text.slice(0, 2000) })),
      previous_result_ids: targetIds ?? previous?.results.map((r) => r.detail_id) ?? [],
      profile: profile ? { age: profile.age, region: regions[profile.region],
        education: profile.educationStatus, employment: profile.employmentStatus, income: profile.incomePercentile } : null }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code : "";
    const known = searchErrors[code];
    throw new AISearchError(known?.message ?? (typeof body?.detail === "string" ? body.detail
      : response.status === 429 ? "현재 검색 요청이 많습니다" : "AI 검색 요청에 실패했습니다."),
      code, known?.retryable ?? true);
  }
  if (!response.headers.get("content-type")?.includes("text/event-stream")) return response.json();
  return readSearchStream(response, onProgress);

}


export const searchStages = {
  interpreting: "요청하신 조건을 확인하고 있어요",
  searching: "관련 공고를 찾고 있어요",
  filtering: "조건에 맞는 공고를 추리고 있어요",
  generating: "추천 이유와 답변을 정리하고 있어요",
  verifying: "공고 정보를 마지막으로 확인하고 있어요",
} as const;
export type SearchStage = keyof typeof searchStages;

export async function readSearchStream(response: Response, onProgress?: (stage: SearchStage) => void): Promise<AISearchResult> {
  const reader = response.body?.getReader();
  if (!reader) throw new AISearchError("검색 연결이 끊어졌습니다. 다시 시도해주세요.", "STREAM_INTERRUPTED", true);
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 2_000_000) throw new Error("검색 응답이 너무 큽니다.");
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        const lines = frame.split("\n");
        const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
        const data = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
        if (!data) continue;
        const payload = JSON.parse(data);
        if (event === "progress" && typeof payload.stage === "string" && Object.hasOwn(searchStages, payload.stage))
          onProgress?.(payload.stage as SearchStage);
        if (event === "error") {
          const known = searchErrors[payload.code];
          throw new AISearchError(known?.message ?? payload.detail ?? "검색에 실패했습니다.", payload.code ?? "INTERNAL_ERROR", known?.retryable ?? true);
        }
        if (event === "result") return payload as AISearchResult;
      }
    }
    throw new AISearchError("검색 연결이 끊어졌습니다. 다시 시도해주세요.", "STREAM_INTERRUPTED", true);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
