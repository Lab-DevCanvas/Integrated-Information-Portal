"use client";
import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Google_Sans } from "next/font/google";
const googleSans = Google_Sans({ weight: "500", subsets: ["latin"], display: "swap", adjustFontFallback: false, fallback: ["Arial", "sans-serif"] });
import { useAuth } from "@/components/auth/AuthProvider";
import { startSignIn } from "@/lib/auth/client";
export function GoogleSignInButton({ children }: { children: ReactNode }) {
  const { loading, account } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true); setError(null);
    try { await startSignIn(); }
    catch { setBusy(false); setError("로그인을 시작하지 못했어요. 다시 시도해주세요."); }
  }
  return <>
    <button type="button" disabled={busy || loading || !!account} onClick={() => void login()} className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl border border-[#747775] bg-white px-3 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-slate-50 dark:border-[#8e918f] dark:bg-[#131314] dark:text-[#e3e3e3] dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 disabled:opacity-60" style={googleSans.style}>
      <Image src="/google-g.png" width={20} height={20} alt="" />
      <span>{children}</span>
    </button>
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
  </>;
}
