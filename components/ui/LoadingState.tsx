type Layout = "cards" | "rows" | "table" | "panel";

interface LoadingStateProps {
  title?: string;
  layout?: Layout;
  count?: number;
}

function Bar({ className }: { className: string }) {
  return <div className={`rounded-md bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

export function LoadingState({ title = "기회를 불러오는 중이에요", layout = "cards", count = 3 }: LoadingStateProps) {
  return (
    <div role="status">
      <span className="sr-only">{title}</span>
      <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
        {layout === "panel" && (
          <div className="space-y-4 rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <Bar className="h-7 w-2/5" /><Bar className="h-4 w-3/4" /><Bar className="h-9 w-28" />
          </div>
        )}
        {layout === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            {Array.from({ length: 5 }, (_, row) => (
              <div key={row} className="grid grid-flow-col auto-cols-fr gap-4 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800">
                {Array.from({ length: count + 1 }, (_, col) => <Bar key={col} className="h-4 w-3/4" />)}
              </div>
            ))}
          </div>
        ) : Array.from({ length: count }, (_, index) => (
          layout === "rows" ? (
            <div key={index} className="space-y-2 px-3 py-2">
              <Bar className="h-4 w-3/4" /><Bar className="h-3 w-2/5" />
            </div>
          ) : (
            <div key={index} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Bar className="h-5 w-20" /><Bar className="h-5 w-2/3" />
              <Bar className="h-3 w-4/5" /><Bar className="h-3 w-1/3" />
            </div>
          )
        ))}
      </div>
    </div>
  );
}
