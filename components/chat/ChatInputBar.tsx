"use client";

import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  disabled?: boolean;
  onSend: (text: string) => void;
}

export function ChatInputBar({ onSend, disabled = false }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  return (
    <div className="shrink-0 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:bg-slate-900 sm:px-8 sm:pt-4 lg:px-12">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-indigo-400 dark:border-slate-700 dark:bg-slate-900">
        <textarea
          ref={inputRef}
          rows={1}
          aria-label="메시지"
          disabled={disabled}
          maxLength={2000}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="내 조건이나 고민을 자연스럽게 입력하세요"
          className="min-w-0 flex-1 resize-none bg-transparent text-base leading-6 text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          aria-label="전송"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
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
