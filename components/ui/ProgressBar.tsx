interface ProgressBarProps {
  value: number; // 0-1
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ value, className = "", barClassName = "bg-indigo-600" }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}>
      <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
