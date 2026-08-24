import { JUDGE_STATUS_META } from "@/lib/constants";
import type { JudgeStatus } from "@/lib/types";

export function EligibilityBadgeRow({ status }: { status: JudgeStatus }) {
  const meta = JUDGE_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
