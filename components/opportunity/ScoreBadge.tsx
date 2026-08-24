import { scoreTier } from "@/lib/constants";

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-lg",
};

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const tier = scoreTier(score);
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-full bg-white ring-2 dark:bg-slate-900 ${tier.className} ${SIZE_CLASSES[size]}`}
    >
      <span className="font-bold leading-none">{score}%</span>
    </div>
  );
}
