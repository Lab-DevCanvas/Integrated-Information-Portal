"use client";

import { Clock, Sparkles, SquarePen, X } from "lucide-react";
import type { ChatConversation } from "@/lib/types";

interface Props {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onClose?: () => void;
}

export function ChatSidebar({ conversations, activeConversationId, onSelect, onNewChat, onClose }: Props) {
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
            aria-label="닫기"
            className="text-slate-400 hover:text-slate-600 md:hidden dark:text-slate-500 dark:hover:text-slate-300"
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
        {conversations.length > 0 && (
          <p className="mb-1 px-2 text-xs font-semibold text-slate-400 dark:text-slate-500">최근 대화</p>
        )}
        <div className="space-y-0.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                c.id === activeConversationId
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
