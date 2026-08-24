"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "이번 주 지원할만한 공모전 찾아줘",
  "내 취업에 가장 도움 되는 활동 찾아줘",
  "적합도 높은 공모전끼리 비교해줘",
  "지금 받을 수 있는 청년정책 찾아줘",
  "이번 달 지원 계획 만들어줘",
];

export function ChatEmptyState({ onSelectPrompt }: { onSelectPrompt: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
        <Sparkles className="h-7 w-7" />
      </span>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">무엇을 결정할지 함께 볼까요?</h2>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        빈 채팅보다 바로 시작할 수 있는 질문을 준비했어요.
      </p>

      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
          >
            {prompt}
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
