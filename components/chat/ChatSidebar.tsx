"use client";

import { Clock, Pin, Sparkles, SquarePen, X } from "lucide-react";
import type { ChatConversation } from "@/lib/types";

interface Props {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSelectMessage: (id: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
}

export function ChatSidebar({ conversations, activeConversationId, onSelect, onTogglePin, onSelectMessage, onNewChat, onClose }: Props) {
  return (
    <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-50">AI 어시스턴트</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="대화 목록 닫기"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <SquarePen className="h-4 w-4" />
          새 대화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {(
          <p className="mb-1 px-2 text-xs font-semibold text-slate-400 dark:text-slate-500">대화 · 고정 {conversations.filter((c) => c.isPinned).length}/5</p>
        )}
        {conversations.length === 0 && <p className="px-2 py-4 text-xs leading-6 text-slate-400">새로운 기회를 찾는 첫 대화를 시작해 보세요.</p>}
        <div className="space-y-0.5">
          {[...conversations].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || b.updatedAt.localeCompare(a.updatedAt)).map((c) => (
            <div key={c.id}>
              <div className={`flex items-center rounded-lg ${c.id === activeConversationId
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                <button type="button" onClick={() => onSelect(c.id)} aria-current={c.id === activeConversationId ? "true" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-3 text-left text-sm">
                  {c.isPinned ? <Pin aria-hidden className="h-3.5 w-3.5 shrink-0" /> : <Clock aria-hidden className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{c.title}</span>
                </button>
                <button type="button" onClick={() => onTogglePin(c.id)} aria-pressed={Boolean(c.isPinned)}
                  aria-label={`${c.title} ${c.isPinned ? "고정 해제" : "고정"}`}
                  title={!c.isPinned && conversations.filter((item) => item.isPinned).length >= 5 ? "채팅방은 최대 5개까지 고정할 수 있습니다" : c.isPinned ? "고정 해제" : "채팅방 고정"}
                  disabled={!c.isPinned && conversations.filter((item) => item.isPinned).length >= 5}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg disabled:opacity-30 hover:bg-indigo-100 dark:hover:bg-slate-700">
                  <Pin aria-hidden className={`h-4 w-4 ${c.isPinned ? "fill-current" : ""}`} />
                </button>
              </div>
              {c.id === activeConversationId && c.messages.some((m) => m.isPinned) && (
                <ul aria-label="중요 메시지" className="mb-2 ml-4 border-l border-indigo-200 pl-2 dark:border-indigo-800">
                  {c.messages.filter((m) => m.isPinned).map((m) => <li key={m.id}>
                    <button type="button" onClick={() => onSelectMessage(m.id)} title={m.text}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <span className="shrink-0 text-indigo-500">{m.role === "user" ? "질문" : "답변"}</span>
                      <span className="truncate">{m.text || "중요 메시지"}</span>
                    </button>
                  </li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
