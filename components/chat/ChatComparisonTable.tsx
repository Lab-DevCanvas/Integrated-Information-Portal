import Link from "next/link";
import type { AISearchResult } from "@/lib/api/aiSearch";

const eligibility = { eligible: "확인된 조건 충족", ineligible: "일부 자격 불충족", unknown: "자격 확인 필요" };

/** Compare verified response fields; absent source information stays explicitly unknown. */
export function ChatComparisonTable({ result }: { result: AISearchResult }) {
  return <section className="space-y-3" aria-label="공고 비교">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="font-semibold">한눈에 비교하기</h3>
      <p className="hidden text-xs text-slate-500 sm:block">좌우로 스크롤해 모든 항목을 확인하세요</p>
    </div>
    <div className="space-y-3 sm:hidden">{result.results.map((card, index) => {
      const comparison = result.comparisons.find((row) => row.detail_id === card.detail_id);
      return <article key={card.detail_id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">공고 {index + 1} · {card.organization ?? "기관 정보 없음"}</p>
        <h4 className="mt-1 font-semibold leading-6"><Link href={`/opportunities/${encodeURIComponent(card.detail_id)}`} className="text-indigo-700 dark:text-indigo-300">{card.title}</Link></h4>
        <dl className="mt-4 space-y-3 text-sm leading-6">{[
          ["마감일", card.period_end ?? "확인 필요"],
          ["지원 조건", `${eligibility[card.eligibility_status]} · ${card.eligibility_description || "상세 조건은 원문을 확인해 주세요."}`],
          ["혜택", card.benefits.join(" · ") || "확인된 정보 없음"],
          ["장점", comparison?.advantages || "비교 근거가 충분하지 않습니다."],
          ["확인할 점", comparison?.cautions || "추가 확인이 필요합니다."],
        ].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value}</dd></div>)}</dl>
      </article>;
    })}</div>
    <div role="region" aria-label="공고 비교표, 가로 스크롤 가능" tabIndex={0}
      className="hidden overflow-x-auto rounded-2xl sm:block border border-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm leading-6">
        <caption className="sr-only">공고별 마감일, 지원 조건, 혜택, 장점과 확인할 점</caption>
        <thead className="bg-slate-100 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr>
          {["공고", "마감일", "지원 조건", "혜택", "장점", "확인할 점"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}
        </tr></thead>
        <tbody>{result.results.map((card, index) => {
          const comparison = result.comparisons.find((row) => row.detail_id === card.detail_id);
          return <tr key={card.detail_id} className="border-t border-slate-200 align-top odd:bg-white even:bg-slate-50/70 dark:border-slate-700 dark:odd:bg-slate-900 dark:even:bg-slate-800/50">
            <th scope="row" className="min-w-52 max-w-72 px-4 py-4 font-medium">
              <span className="mb-1 block text-xs text-slate-400">공고 {index + 1}</span>
              <Link href={`/opportunities/${encodeURIComponent(card.detail_id)}`} className="text-indigo-700 hover:underline dark:text-indigo-300">{card.title}</Link>
              <p className="mt-2 text-xs font-normal text-slate-500">{card.organization ?? "기관 정보 없음"}</p>
            </th>
            <td className="min-w-28 px-4 py-4">{card.period_end ?? "확인 필요"}</td>
            <td className="min-w-44 px-4 py-4"><span className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">{eligibility[card.eligibility_status]}</span><p className="mt-2 whitespace-pre-wrap">{card.eligibility_description || "상세 조건은 원문을 확인해 주세요."}</p></td>
            <td className="min-w-36 px-4 py-4">{card.benefits.length ? <ul className="list-disc space-y-1 pl-4">{card.benefits.map((benefit, i) => <li key={i}>{benefit}</li>)}</ul> : "확인된 정보 없음"}</td>
            <td className="min-w-48 whitespace-pre-wrap px-4 py-4 text-emerald-800 dark:text-emerald-300">{comparison?.advantages || "비교 근거가 충분하지 않습니다."}</td>
            <td className="min-w-48 whitespace-pre-wrap px-4 py-4 text-amber-800 dark:text-amber-300">{comparison?.cautions || "추가 확인이 필요합니다."}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <p className="text-xs leading-5 text-slate-500">공고에 확인된 정보를 기준으로 비교했어요. 정보가 없는 항목은 추정하지 않으며, 최종 지원 조건은 원문에서 확인해 주세요.</p>
  </section>;
}
