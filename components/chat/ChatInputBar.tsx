"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
}

export function ChatInputBar({ onSend }: Props) {
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div className="border-t border-slate-200 p-3 dark:border-slate-800 sm:p-4">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 focus-within:border-indigo-400 dark:border-slate-700 dark:bg-slate-900">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="내 조건이나 고민을 자연스럽게 입력하세요"
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          aria-label="전송"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        AI 결과는 참고용입니다. 중요한 자격 조건은 공식 정보를 확인하세요.
      </p>
    </div>
  );
}
