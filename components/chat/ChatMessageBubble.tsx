"use client";

import Link from "next/link";
import { LoaderCircle, RotateCcw } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

const regionLabels: Record<string, string> = { SEOUL: "서울", BUSAN: "부산", DAEGU: "대구", INCHEON: "인천", GWANGJU: "광주", DAEJEON: "대전", ULSAN: "울산", SEJONG: "세종", GYEONGGI: "경기", GANGWON: "강원", CHUNGBUK: "충북", CHUNGNAM: "충남", JEONBUK: "전북", JEONNAM: "전남", GYEONGBUK: "경북", GYEONGNAM: "경남", JEJU: "제주", NATIONWIDE: "전국" };
const safeUrl = (value: string | null) => value && /^https?:\/\//i.test(value) ? value : null;

type Props = {
  message?: ChatMessage;
  pending?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
};

export function ChatMessageBubble({ message, pending = false, onCancel, onRetry }: Props) {
  const result = message?.aiResult;
  const isUser = message?.role === "user";
  const isError = message?.error;
  const actionClass = "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-current/20 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-white/10";
  const labels = { eligible: "확인된 조건 충족", ineligible: "일부 자격 불충족", unknown: "자격 확인 필요" };
  return <div className={isUser ? "ml-auto max-w-[85%]" : "max-w-[90%] space-y-3"}>
    <div className={`rounded-2xl px-4 py-3 text-sm transition-colors duration-300 motion-reduce:transition-none ${isUser ? "bg-indigo-600 text-white" : isError ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
      {pending ? (
        <div key="pending" className="chat-message-enter flex flex-wrap items-center gap-x-3 gap-y-2">
          <span role="status" className="inline-flex items-center gap-2">
            <LoaderCircle aria-hidden className="h-4 w-4 shrink-0 motion-safe:animate-spin text-indigo-500 dark:text-indigo-400" />
            <span className="motion-safe:animate-pulse">공고와 근거를 확인하고 있습니다…</span>
          </span>
          <button type="button" className={actionClass} onClick={onCancel}>취소</button>
        </div>
      ) : (
        <div key={message?.id} className="chat-message-enter flex flex-wrap items-center gap-x-3 gap-y-2">
          <p role={isError ? "alert" : undefined} className="min-w-0 whitespace-pre-wrap break-words">{message?.text}</p>
          {isError && onRetry && <button type="button" className={actionClass} onClick={onRetry}>
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />다시 시도
          </button>}
        </div>
      )}
    </div>
    {result?.warnings.map((warning) => <p key={warning} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}
    {result?.results.map((card, index) => <div key={card.detail_id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <Link className="font-semibold text-indigo-600 dark:text-indigo-300" href={`/opportunities/${encodeURIComponent(card.detail_id)}`}>{index + 1}. {card.title}</Link>
      <p className="text-xs text-slate-500">{card.organization ?? "기관 미상"} · {card.period_end ? `마감 ${card.period_end}` : "마감일 미상"}</p>
      <p className="mt-2 text-sm">{card.recommendation_reason}</p>
      <p className="mt-1 text-xs">{labels[card.eligibility_status]} · {card.benefits.join(" / ") || "혜택 정보 미상"}</p>
      {Boolean(card.regions?.length) && <p className="mt-1 text-xs">공고 지역: {card.regions?.map((region) => regionLabels[region] ?? region).join(" · ")}</p>}
      {card.eligibility_description && <p className="mt-1 whitespace-pre-wrap text-xs">지원 대상 안내: {card.eligibility_description}</p>}
      {Boolean(card.duplicate_sources?.length) && <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer">동일 공고의 다른 출처 {card.duplicate_sources?.length}곳</summary>
        {card.duplicate_sources?.map((source) => <p key={source.detail_id}>
          {safeUrl(source.source_url) ? <a href={safeUrl(source.source_url)!} target="_blank" rel="noopener noreferrer" className="underline">{source.source}에서 보기</a> : source.source}
        </p>)}
      </details>}
    </div>)}
    {Boolean(result?.comparisons.length) && <section className="space-y-2 text-sm" aria-label="공고 비교">
      <h3 className="font-semibold">공고 비교</h3>
      {result?.comparisons.map((row) => <div key={row.detail_id} className="rounded-lg border p-3">
        <p className="font-medium">{result.results.find((r) => r.detail_id === row.detail_id)?.title}</p>
        <p>{row.advantages}</p><p className="text-slate-500">확인할 점: {row.cautions}</p>
      </div>)}
    </section>}
    {Boolean(result?.plan.length) && <section className="text-sm" aria-label="지원 계획">
      <h3 className="font-semibold">지원 계획 제안</h3>
      <ol className="list-decimal space-y-2 pl-5">{result?.plan.map((step, i) => <li key={i}>
        {step.suggested_date && <strong>{step.suggested_date} · </strong>}{step.action}
        <p className="text-xs text-slate-500">{result.results.find((r) => r.detail_id === step.detail_id)?.title}</p>
      </li>)}</ol>
    </section>}
    {result && <details className="text-xs text-slate-500"><summary className="cursor-pointer">근거와 확인 시각</summary>
      <p>{new Date(result.as_of).toLocaleString("ko-KR")}</p>
      {result.citations.map((citation) => <div key={citation.evidence_id} className="mt-2 space-y-1">
        <p>{citation.kind === "source_text" ? "원문 근거" : "구조화 공고 정보"}</p>
        <p className="max-h-40 overflow-auto whitespace-pre-wrap">{citation.original_quote}</p>
        {safeUrl(citation.source_url) && <a href={safeUrl(citation.source_url)!} target="_blank" rel="noopener noreferrer" className="underline">출처 열기</a>}
      </div>)}
    </details>}
  </div>;
}
