import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ScoreResult } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

export function ScoreBreakdownPanel({ score }: { score: ScoreResult }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <ScoreBadge score={score.totalScore} size="lg" />
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">AI 적합도 점수</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-50">당신에게 {score.totalScore}점짜리 기회입니다</p>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
        {score.explanation}
      </p>

      <div className="mt-5 space-y-3">
        {score.subscores.map((s) => (
          <div key={s.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {s.label} <span className="text-slate-400 dark:text-slate-500">({Math.round(s.weight * 100)}%)</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.round(s.rawScore * 100)}점</span>
            </div>
            <ProgressBar value={s.rawScore} />
          </div>
        ))}
      </div>
    </Card>
  );
}
