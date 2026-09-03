import type { UserProfile } from "@/lib/types";

interface Props {
  draft: UserProfile;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

export function StepReview({ draft }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">입력하신 정보로 나에게 맞는 기회를 찾아드릴게요.</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <Row label="이름" value={draft.name?.trim() ? draft.name : "미입력"} />
        <Row label="나이" value={`${draft.age}세`} />
        <Row label="거주 지역" value={draft.region} />
        <Row label="학력/재학상태" value={draft.educationStatus} />
        <Row label="취업 상태" value={draft.employmentStatus} />
        <Row label="창업 관심" value={draft.startupInterest ? "있음" : "없음"} />
        <Row label="주택 보유" value={draft.housingStatus} />
        <Row label="관심 직무" value={draft.jobInterests.length ? draft.jobInterests.join(", ") : "미선택"} />
        <Row label="관심 키워드" value={draft.interests.length ? draft.interests.join(", ") : "미선택"} />
        <Row
          label="소득 수준"
          value={draft.incomePercentile !== undefined ? `기준중위소득 ${draft.incomePercentile}%` : "미입력"}
        />
      </div>
    </div>
  );
}
