"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export function SearchFab() {
  const pathname = usePathname();
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const compareIds = useAppStore((s) => s.compareIds);

  if (!hasHydrated) return null;
  if (pathname === "/search") return null;

  // Mobile already has "AI 검색" in the bottom tab bar, so the FAB is desktop-only.
  // Still needs to clear the CompareTray when it's showing.
  const bottomClass = compareIds.length > 0 ? "bottom-20" : "bottom-6";

  return (
    <Link
      href="/search"
      aria-label="AI 자연어 검색으로 이동"
      className={`fixed right-4 ${bottomClass} z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95 sm:right-6 md:flex`}
    >
      <Sparkles className="h-6 w-6" />
    </Link>
  );
}
