"use client";

export default function OpportunityError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-xl border p-8 text-center"><h1 className="text-xl font-bold">공고를 불러오지 못했습니다</h1><p className="mt-2 text-sm text-slate-500">수집 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.</p><button onClick={reset} className="mt-4 rounded-lg border px-4 py-2">다시 시도</button></div>;
}
