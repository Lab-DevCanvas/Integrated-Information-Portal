"use client";

import { useState, type Ref } from "react";
import Link from "next/link";
import { LoaderCircle, RotateCcw, Check, Sparkles, Columns3, Plus } from "lucide-react";
import { searchStages, type SearchStage } from "@/lib/api/aiSearch";
import { ChatComparisonTable } from "./ChatComparisonTable";
import type { ChatMessage } from "@/lib/types";

const regionLabels: Record<string, string> = { SEOUL: "서울", BUSAN: "부산", DAEGU: "대구", INCHEON: "인천", GWANGJU: "광주", DAEJEON: "대전", ULSAN: "울산", SEJONG: "세종", GYEONGGI: "경기", GANGWON: "강원", CHUNGBUK: "충북", CHUNGNAM: "충남", JEONBUK: "전북", JEONNAM: "전남", GYEONGBUK: "경북", GYEONGNAM: "경남", JEJU: "제주", NATIONWIDE: "전국" };
const safeUrl = (value: string | null) => value && /^https?:\/\//i.test(value) ? value : null;

type Props = {
  message?: ChatMessage;
  anchorRef?: Ref<HTMLDivElement>;
  pending?: boolean;
  stages?: SearchStage[];
  onCancel?: () => void;
  onRetry?: () => void;
  onCompare?: (ids: string[]) => void;
  compareDisabled?: boolean;
};

export function ChatMessageBubble({ message, anchorRef, pending = false, stages = [], onCancel, onRetry, onCompare, compareDisabled }: Props) {
  const result = message?.aiResult;
  const [excludedByMessage, setExcludedByMessage] = useState<Record<string, string[]>>({});
  const selectionKey = message?.id ?? "pending";
  const excluded = excludedByMessage[selectionKey] ?? [];
  const selectedIds = result?.results.filter((card) => !excluded.includes(card.detail_id)).map((card) => card.detail_id) ?? [];
  const canSelect = Boolean(result && result.results.length >= 2 && onCompare && result.mode !== "compare");
  function setExcluded(ids: string[]) {
    setExcludedByMessage((current) => ({ ...current, [selectionKey]: ids }));
  }
  const isComparison = result?.mode === "compare";
  const isUser = message?.role === "user";
  const isError = message?.error;
  const actionClass = "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-current/20 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-white/10";
  const labels = { eligible: "확인된 조건 충족", ineligible: "일부 자격 불충족", unknown: "자격 확인 필요" };
  return <div ref={anchorRef} className={isUser ? "ml-auto max-w-[85%]" : "w-full min-w-0 max-w-3xl space-y-4"}>
    <div className={`rounded-2xl px-4 py-3 text-sm transition-colors duration-300 motion-reduce:transition-none ${isUser ? "bg-indigo-600 text-white" : isError ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
      {pending ? (
        <div className="space-y-3" aria-busy="true">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300"><Sparkles aria-hidden className="h-4 w-4" />공고 탐색 중</span>
            <button type="button" className={actionClass} onClick={onCancel}>취소</button>
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" className="flex items-center gap-3">
            <LoaderCircle aria-hidden className="h-5 w-5 shrink-0 motion-safe:animate-spin text-indigo-500" />
            <span key={stages.at(-1) ?? "connecting"} className="chat-message-enter font-medium leading-relaxed">{stages.length ? searchStages[stages.at(-1)!] : "검색 서버에 연결하고 있어요"}</span>
          </div>
          {stages.length > 1 && <details className="text-xs text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer py-1">완료한 단계 {stages.length - 1}개</summary>
            <ol className="mt-2 space-y-2">{stages.slice(0, -1).map((stage) => <li key={stage} className="flex items-center gap-2"><Check aria-hidden className="h-3 w-3 text-emerald-600" />{({ interpreting: "요청 조건 확인", searching: "관련 공고 검색", filtering: "조건·관련성 검사", generating: "답변 정리", verifying: "최신 정보 확인" }[stage])}</li>)}</ol>
          </details>}
        </div>
      ) : (
        <div key={message?.id} className="chat-message-enter flex flex-wrap items-center gap-x-3 gap-y-2">
          {Boolean(result?.results.length) && !isError && <div className="w-full space-y-1">
            <p className="text-base font-bold text-slate-900 dark:text-white">{isComparison ? `${result!.results.length}개 공고를 비교했어요` : `관련 공고 ${result!.results.length}개를 찾았어요`}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{isComparison ? "같은 기준으로 살펴보고 나에게 맞는 기회를 골라보세요." : "각 공고를 추천하는 이유와 지원 전 확인할 내용을 정리했어요."}</p>
          </div>}
          <p role={isError ? "alert" : undefined} className="min-w-0 whitespace-pre-wrap break-words leading-7">{message?.text}</p>
          {isError && onRetry && <button type="button" className={actionClass} onClick={onRetry}>
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />다시 시도
          </button>}
        </div>
      )}
    </div>
    {result?.warnings.map((warning) => <p key={warning} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}
    {!isComparison && Boolean(result?.results.length) && <div className="flex items-center justify-between pt-2"><h3 className="text-sm font-semibold">추천 공고 <span className="text-indigo-600 dark:text-indigo-300">{result?.results.length}</span></h3><span className="text-xs text-slate-500">조건과 원문을 확인해 주세요</span></div>}
    {canSelect && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800">
      <span role="status" aria-live="polite">비교할 공고 {selectedIds.length}개 선택</span>
      <div className="flex gap-3">
        <button type="button" disabled={compareDisabled} onClick={() => setExcluded([])} className="py-2 font-medium text-indigo-600 disabled:opacity-50 dark:text-indigo-300">전체 선택</button>
        <button type="button" disabled={compareDisabled} onClick={() => setExcluded(result!.results.map((card) => card.detail_id))} className="py-2 text-slate-500 disabled:opacity-50">전체 해제</button>
      </div>
    </div>}
    {!isComparison && result?.results.map((card, index) => <div key={card.detail_id}
      className={`chat-message-enter rounded-2xl border p-4 shadow-sm transition-colors duration-200 motion-reduce:transition-none sm:p-5 ${canSelect && !excluded.includes(card.detail_id)
        ? "border-indigo-300 bg-indigo-50/40 ring-1 ring-indigo-200/60 dark:border-indigo-500/60 dark:bg-indigo-950/25 dark:ring-indigo-500/15"
        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
      {canSelect && <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-widest text-slate-400">공고 {String(index + 1).padStart(2, "0")}</span>
        <button type="button" aria-pressed={!excluded.includes(card.detail_id)} disabled={compareDisabled}
          aria-label={`${index + 1}. ${card.title} 비교에 담기`}
          onClick={() => setExcluded(excluded.includes(card.detail_id) ? excluded.filter((id) => id !== card.detail_id) : [...excluded, card.detail_id])}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${!excluded.includes(card.detail_id)
            ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
          {!excluded.includes(card.detail_id) ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Plus aria-hidden className="h-3.5 w-3.5" />}
          {excluded.includes(card.detail_id) ? "비교에 담기" : "비교에 담김"}
        </button>
      </div>}
      <Link className="block text-base font-semibold leading-relaxed text-indigo-700 hover:underline dark:text-indigo-300" href={`/opportunities/${encodeURIComponent(card.detail_id)}`}>{index + 1}. {card.title}</Link>
      <p className="text-xs text-slate-500">{card.organization ?? "기관 미상"} · {card.period_end ? `마감 ${card.period_end}` : "마감일 미상"}</p>
      <p className="mt-3 rounded-lg bg-indigo-50/70 px-3 py-2 text-sm leading-6 dark:bg-indigo-950/40">{card.recommendation_reason}</p>
      <details className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400"><summary className="cursor-pointer font-medium">지원 조건·혜택 보기</summary>
      <p className="mt-2">{labels[card.eligibility_status]} · {card.benefits.join(" / ") || "혜택 정보 미상"}</p>
      {Boolean(card.regions?.length) && <p className="mt-1 text-xs">공고 지역: {card.regions?.map((region) => regionLabels[region] ?? region).join(" · ")}</p>}
      {card.eligibility_description && <p className="mt-1 whitespace-pre-wrap text-xs">지원 대상 안내: {card.eligibility_description}</p>}
      </details>
      {Boolean(card.duplicate_sources?.length) && <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer">동일 공고의 다른 출처 {card.duplicate_sources?.length}곳</summary>
        {card.duplicate_sources?.map((source) => <p key={source.detail_id}>
          {safeUrl(source.source_url) ? <a href={safeUrl(source.source_url)!} target="_blank" rel="noopener noreferrer" className="underline">{source.source}에서 보기</a> : source.source}
        </p>)}
      </details>}
    </div>)}
    {!isComparison && result && result.results.length >= 2 && onCompare && <div className="space-y-2"><button type="button"
      disabled={compareDisabled || selectedIds.length < 2} onClick={() => onCompare(selectedIds)}
      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
      <Columns3 aria-hidden className="h-4 w-4" />선택한 공고 비교하기 · {selectedIds.length}개
    </button><p className="text-xs text-slate-500">비교할 공고를 2개 이상 선택해 주세요. 하나만 살펴보려면 공고 제목을 눌러주세요.</p></div>}
    {isComparison && result && result.results.length > 0 && <ChatComparisonTable result={result} />}
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
