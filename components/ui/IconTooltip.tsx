import type { ReactNode } from "react";

export function IconTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-1/2 right-full z-20 mr-2 -translate-y-1/2 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100 dark:bg-slate-100 dark:text-slate-900"
      >
        {label}
      </span>
    </span>
  );
}
