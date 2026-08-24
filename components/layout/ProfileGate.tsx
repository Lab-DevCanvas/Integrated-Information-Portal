"use client";

import type { ReactNode } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export function ProfileGate({ children }: { children: ReactNode }) {
  const profile = useAppStore((s) => s.profile);
  const hasHydrated = useAppStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
      </div>
    );
  }

  if (!profile) {
    return <OnboardingModal />;
  }

  return <>{children}</>;
}
