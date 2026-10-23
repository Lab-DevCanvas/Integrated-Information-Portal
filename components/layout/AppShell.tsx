"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { ProfileGate } from "./ProfileGate";
import { CrawlingStatus } from "./CrawlingStatus";
import { CompareTray } from "./CompareTray";
import { SearchFab } from "./SearchFab";
import { BottomTabBar } from "./BottomTabBar";

export function AppShell({ children }: { children: ReactNode }) {
  const isChat = usePathname() === "/search";
  return (
    <div className={isChat ? "flex h-dvh min-h-0 flex-col overflow-hidden" : "flex min-h-dvh flex-col"}>
      <Header />
      <main className={isChat ? "flex min-h-0 flex-1 flex-col" : "mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-40 md:pb-24"}>
        {!isChat && <CrawlingStatus />}
        <ProfileGate>{children}</ProfileGate>
      </main>
      {!isChat && <><CompareTray /><SearchFab /><BottomTabBar /></>}
    </div>
  );
}
