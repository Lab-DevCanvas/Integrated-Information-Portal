"use client";

import Image from "next/image";
import { getOpportunityById } from "@/lib/mock/opportunities";
import { computeScore } from "@/lib/scoring/score";
import { useAppStore } from "@/lib/store/useAppStore";
import type { ChatMessage } from "@/lib/types";
import { ChatResultCard } from "./ChatResultCard";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const profile = useAppStore((s) => s.profile);
  const savedIds = useAppStore((s) => s.savedIds);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm text-white sm:max-w-[80%]">
          {message.text}
        </div>
      </div>
    );
  }

  const results = profile
    ? (message.resultIds ?? [])
        .map((id) => getOpportunityById(id))
        .filter((o): o is NonNullable<typeof o> => Boolean(o))
        .map((opportunity) => ({ opportunity, score: computeScore(profile, opportunity, savedIds) }))
    : [];

  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 dark:ring-slate-700">
        <Image src="/assets/logo/logo.svg" alt="" width={16} height={16} aria-hidden />
      </span>
      <div className="max-w-[85%] min-w-0 flex-1 space-y-2.5 sm:max-w-[80%]">
        <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {message.text}
        </div>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(({ opportunity, score }) => (
              <ChatResultCard key={opportunity.id} opportunity={opportunity} score={score} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
