"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Wordmark } from "@/components/layout/Wordmark";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/categories", label: "카테고리" },
  { href: "/search", label: "AI 검색" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-4 px-4 py-3">
        <Link href="/" className="col-start-1 flex shrink-0 items-center justify-self-start">
          <Image src="/assets/logo/logo.svg" alt="OPFINDE" width={28} height={28} className="md:hidden" priority />
          <Wordmark className="hidden text-2xl md:inline-flex" />
        </Link>

        {/* Desktop/web nav — hidden below md, replaced by BottomTabBar on mobile */}
        <nav className="col-start-2 hidden items-center justify-center gap-1 overflow-x-auto overflow-y-visible md:flex">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* col-start-3 is required, not decorative: nav has display:none below md, and a display:none
            element is not a grid item at all — so without an explicit column, auto-placement would
            slide this into the (now-vacant) middle track instead of staying pinned to the right edge. */}
        <div className="col-start-3 flex shrink-0 items-center justify-self-end gap-1">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
