import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function CompareRecommendationBox({ sentence }: { sentence: string }) {
  return (
    <Card className="flex items-start gap-3 border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
      <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-300">{sentence}</p>
    </Card>
  );
}
