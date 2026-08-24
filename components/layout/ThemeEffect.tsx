"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";

/** Mounted once in the root layout. Applies the resolved theme to <html> and, until the
 * user manually toggles, keeps following the OS `prefers-color-scheme`. */
export function ThemeEffect() {
  const theme = useAppStore((s) => s.theme);
  const hasHydrated = useAppStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    if (!useAppStore.getState().themeManuallySet) {
      useAppStore.getState().applySystemTheme(mql.matches ? "dark" : "light");
    }

    function onChange(e: MediaQueryListEvent) {
      if (!useAppStore.getState().themeManuallySet) {
        useAppStore.getState().applySystemTheme(e.matches ? "dark" : "light");
      }
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [hasHydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
