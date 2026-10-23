"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, SquarePen } from "lucide-react";
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
  const pendingProgress = useAppStore((s) => s.pendingProgress);
  const pendingChats = useAppStore((s) => s.pendingChats);
  const cancelChat = useAppStore((s) => s.cancelChat);
  const retryChat = useAppStore((s) => s.retryChat);
  const sendMessage = useAppStore((s) => s.sendMessage);

  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const latestReplyRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const isPending = Boolean(activeConversationId && pendingChats[activeConversationId]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = !isPending && latestReplyRef.current ? latestReplyRef.current : messagesEndRef.current;
    target?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
  }, [activeConversationId, activeConversation?.messages.length, isPending]);

  useEffect(() => {
    if (sidebarOpen) drawerRef.current?.showModal();
    else drawerRef.current?.close();
  }, [sidebarOpen]);

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
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-slate-900">
      {/* Desktop sidebar */}
      <aside aria-label="대화 목록" className={`${desktopSidebarOpen ? "lg:block" : ""} hidden w-72 shrink-0 border-r border-slate-200 dark:border-slate-800`}>
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
        />
      </aside>

      {/* Mobile sidebar drawer */}
      <dialog
        ref={drawerRef}
        onCancel={() => setSidebarOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) setSidebarOpen(false); }}
        aria-label="대화 목록"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-slate-950/40"
      >
        <div className="h-full w-80 max-w-[85%] shadow-xl">
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelect}
            onNewChat={handleNewChat}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </dialog>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Chat header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setDesktopSidebarOpen((open) => !open)}
            aria-label={desktopSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
            aria-expanded={desktopSidebarOpen}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:flex"
          >
            {desktopSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="대화 목록 열기"
            aria-expanded={sidebarOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-500 dark:hover:text-slate-300"
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
          <button type="button" onClick={handleNewChat} aria-label="새 대화" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <SquarePen className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        {activeConversation && activeConversation.messages.length > 0 ? (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 lg:px-12">
            {activeConversation.messages.map((m, index, messages) => (
              <ChatMessageBubble
                key={m.role === "assistant" ? `reply-${messages[index - 1]?.id ?? m.id}` : m.id}
                message={m}
                anchorRef={m.role === "assistant" && index === messages.length - 1 ? latestReplyRef : undefined}
                onRetry={m.error && m.retryable !== false && index === messages.length - 1 && !isPending
                  ? () => retryChat(activeConversation.id) : undefined}
              />
            ))}
            {isPending && <ChatMessageBubble
              key={`reply-${activeConversation.messages.at(-1)?.id}`}
              pending
              stages={pendingProgress[activeConversation.id]}
              onCancel={() => cancelChat(activeConversation.id)}
            />}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <ChatEmptyState onSelectPrompt={handleSend} />
        )}

        <ChatInputBar onSend={handleSend} disabled={isPending} />
      </div>
    </div>
  );
}
