import { scoreTier } from "@/lib/constants";

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-lg",
};

export function ScoreBadge({ score, size = "md" }: { score?: number; size?: "sm" | "md" | "lg" }) {
  const color = score === undefined ? "text-slate-400 ring-slate-200 dark:ring-slate-700" : scoreTier(score).className;
  return (
    <div
      title={score === undefined ? "적합도 산정 전" : undefined}
      className={`flex shrink-0 flex-col items-center justify-center rounded-full bg-white ring-2 dark:bg-slate-900 ${color} ${SIZE_CLASSES[size]}`}
    >
      <span className="font-bold leading-none">{score === undefined ? "—" : `${score}%`}</span>
    </div>
  );
}
