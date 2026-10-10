"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useAppStore } from "@/lib/store/useAppStore";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatInputBar } from "./ChatInputBar";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatSidebar } from "./ChatSidebar";

export function ChatPanel() {
  const conversations = useAppStore((s) => s.conversations);
  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const startNewConversation = useAppStore((s) => s.startNewConversation);
  const setActiveConversation = useAppStore((s) => s.setActiveConversation);
  const pendingChats = useAppStore((s) => s.pendingChats);
  const cancelChat = useAppStore((s) => s.cancelChat);
  const retryChat = useAppStore((s) => s.retryChat);
  const sendMessage = useAppStore((s) => s.sendMessage);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages.length]);

  function handleSend(text: string) {
    void sendMessage(text);
  }

  function handleSelect(id: string) {
    setActiveConversation(id);
    setSidebarOpen(false);
  }

  function handleNewChat() {
    startNewConversation();
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-[calc(100vh-17rem)] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:h-[calc(100vh-13rem)]">
      {/* Desktop sidebar */}
      <div className="hidden w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 lg:block">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="대화 목록 닫기"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] shadow-xl">
            <ChatSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={handleSelect}
              onNewChat={handleNewChat}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="대화 목록 열기"
            className="text-slate-400 hover:text-slate-600 lg:hidden dark:text-slate-500 dark:hover:text-slate-300"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 dark:ring-slate-700">
            <Image src="/assets/logo/logo.svg" alt="" width={18} height={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">기회 결정 어시스턴트</p>
            <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              공고 근거로 추천·비교·지원 계획
            </p>
          </div>
        </div>

        {/* Messages */}
        {activeConversation && activeConversation.messages.length > 0 ? (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {activeConversation.messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <ChatEmptyState onSelectPrompt={handleSend} />
        )}

        {activeConversationId && pendingChats[activeConversationId] && <div role="status" className="px-4 py-2 text-sm">
          공고와 근거를 확인하고 있습니다… <button className="ml-2 underline" onClick={() => cancelChat(activeConversationId)}>취소</button>
        </div>}
        {activeConversation?.messages.at(-1)?.error && <button className="px-4 py-2 text-sm underline" onClick={() => retryChat(activeConversation.id)}>다시 시도</button>}
        <ChatInputBar onSend={handleSend} disabled={Boolean(activeConversationId && pendingChats[activeConversationId])} />
      </div>
    </div>
  );
}
