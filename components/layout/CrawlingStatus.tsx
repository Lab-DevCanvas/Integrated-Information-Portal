"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store/useAppStore";

export function CrawlingStatus() {
  const status = useAppStore((s) => s.crawledStatus);
  const failures = useAppStore((s) => s.crawledFailures);
  const retry = useAppStore((s) => s.loadCrawledOpportunities);
  if (status !== "error" && !failures.length) return null;
  return <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
    <p>{status === "error" ? "공고를 불러오지 못했습니다." : `일부 출처 분류를 불러오지 못했습니다: ${failures.join(", ")}`}</p>
    <button className="font-semibold underline" onClick={() => void retry(true)}>다시 시도</button><Link href="/categories" className="underline">카테고리 탐색</Link>
  </div>;
}
