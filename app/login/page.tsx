"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
export default function LoginPage() {
  const { account } = useAuth();
  const router = useRouter();
  useEffect(() => { if (account) router.replace("/"); }, [account, router]);
  return <section aria-label="로그인" className="flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center gap-4">
    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white px-6 py-9 text-center dark:border-slate-800 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-900">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">나의 기회 모아보기</h1>
      <p className="mb-6 mt-2 text-sm text-slate-600 dark:text-slate-300">관심 공고를 저장하고 지원 계획을 이어가세요.</p>
      <GoogleSignInButton>Google 계정으로 로그인하기</GoogleSignInButton>
    </div>
  </section>;
}
