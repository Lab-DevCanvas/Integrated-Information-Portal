"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAppStore } from "@/lib/store/useAppStore";

export default function SearchPage() {
  const profile = useAppStore((s) => s.profile);

  if (!profile) return null;

  return <ChatPanel />;
}
