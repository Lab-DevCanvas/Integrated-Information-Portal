import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title?: string;
}

export function LoadingState({ title = "기회를 불러오는 중이에요" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
      <Loader2 className="h-10 w-10 animate-spin text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
    </div>
  );
}
