"use client";

import { ArrowRight, Check } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export function ApplyPlanButton({ id, className = "" }: { id: string; className?: string }) {
  const inPlan = useAppStore((s) => s.applyPlanIds.includes(id));
  const toggleApplyPlan = useAppStore((s) => s.toggleApplyPlan);

  return (
    <button
      type="button"
      onClick={() => toggleApplyPlan(id)}
      aria-pressed={inPlan}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${
        inPlan ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
      } ${className}`}
    >
      {inPlan ? (
        <>
          <Check className="h-4 w-4" />
          지원 계획에서 제거
        </>
      ) : (
        <>
          지원 계획에 추가
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
