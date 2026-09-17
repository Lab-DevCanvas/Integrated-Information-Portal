import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { daysSince } from "@/lib/mock/dateHelpers";
import type { NotificationEntry } from "@/lib/notifications";
import { NotificationItem } from "./NotificationItem";

interface Props {
  entries: NotificationEntry[];
  mode?: "teaser" | "full";
  teaserCount?: number;
  isLoading?: boolean;
}

export function NotificationFeed({ entries, mode = "teaser", teaserCount = 4, isLoading = false }: Props) {
  if (entries.length === 0) {
    if (isLoading) return <LoadingState title="새로운 기회를 불러오는 중이에요" />;
    return (
      <EmptyState
        icon={Bell}
        title="아직 새로운 기회가 없어요"
        description="프로필 정보를 조금 더 채워주시면 더 정확하게 찾아드릴게요."
      />
    );
  }

  if (mode === "teaser") {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {entries.slice(0, teaserCount).map((entry) => (
          <NotificationItem key={entry.opportunity.id} entry={entry} />
        ))}
      </div>
    );
  }

  const groups: { label: string; items: NotificationEntry[] }[] = [
    { label: "오늘", items: [] },
    { label: "이번 주", items: [] },
    { label: "이전", items: [] },
  ];
  for (const entry of entries) {
    const since = daysSince(entry.opportunity.createdAt);
    if (since <= 0) groups[0].items.push(entry);
    else if (since <= 7) groups[1].items.push(entry);
    else groups[2].items.push(entry);
  }

  return (
    <div className="space-y-6">
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <div key={g.label}>
            <h3 className="mb-1 px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">{g.label}</h3>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {g.items.map((entry) => (
                <NotificationItem key={entry.opportunity.id} entry={entry} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
