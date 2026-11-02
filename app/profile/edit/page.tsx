"use client";
import { ChevronDown, Check, UserRound, MapPin, Sparkles, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppStore } from "@/lib/store/useAppStore";
import { saveProfile, renameAccount, withdrawAccount, type ProfileUpdate } from "@/lib/auth/client";
import { ageLabels, educationLabels, employmentLabels, incomeLabels, regionLabels, projectProfile } from "@/lib/account/profile";
import { Button } from "@/components/ui/Button";

export default function ProfileEditPage() {
  const router = useRouter();
  const { account, reload } = useAuth();
  const profile = useAppStore((s) => s.profile?.accountProfile);
  const [draft, setDraft] = useState<ProfileUpdate>(() => ({ eligibility_facts: profile?.eligibility_facts ?? {}, preferences: profile?.preferences ?? {} }));
  const [nickname, setNickname] = useState(account?.nickname ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletionText, setDeletionText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const facts = draft.eligibility_facts ?? {};
  const preferences = draft.preferences ?? {};
  function fact(key: keyof typeof facts, value: unknown) { setDraft((d) => ({ ...d, eligibility_facts: { ...d.eligibility_facts, [key]: value } })); }
  function preference(key: keyof typeof preferences, value: unknown) { setDraft((d) => ({ ...d, preferences: { ...d.preferences, [key]: value } })); }
  async function save() {
    if (!account) return;
    setBusy(true); setError(null);
    try {
      const updatedAccount = nickname !== account.nickname ? await renameAccount(nickname) : account;
      const saved = await saveProfile(draft);
      if (useAppStore.getState().accountId === account.account_id) useAppStore.setState({ profile: projectProfile(saved, updatedAccount) });
      await reload();
      router.push("/");
    } catch { setError("프로필을 저장하지 못했어요. 입력 내용은 유지되니 다시 시도해주세요."); }
    finally { setBusy(false); }
  }
  async function withdraw() {
    if (deletionText !== "탈퇴") return;
    setBusy(true); setError(null);
    try { await withdrawAccount(); router.replace("/"); }
    catch { setError("탈퇴를 완료하지 못했어요. 다시 시도해주세요."); setBusy(false); }
  }
  function select(label: string, value: string | null | undefined, options: Record<string, string>, change: (value: string | null) => void) {
    return <label className="block space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span><span className="relative block"><select className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={value ?? ""} onChange={(e) => change(e.target.value || null)}><option value="">선택하지 않음</option>{Object.entries(options).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span></label>;
  }
  function regions(label: string, values: string[] | undefined, change: (values: string[]) => void) {
    return <fieldset className="space-y-3"><legend className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">{label}<span className="ml-2 text-xs font-normal text-slate-400">여러 곳 선택 가능</span></legend><div className="flex flex-wrap gap-2">{Object.entries(regionLabels).map(([key, text]) => { const selected = values?.includes(key) ?? false; return <button key={key} type="button" aria-pressed={selected} onClick={() => change(selected ? (values ?? []).filter((v) => v !== key) : [...(values ?? []), key])} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${selected ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"}`}>{selected && <Check aria-hidden="true" className="h-3.5 w-3.5" />}{text}</button>; })}</div></fieldset>;
  }
  return <form className="mx-auto max-w-2xl space-y-6 pb-12" onSubmit={(e) => { e.preventDefault(); void save(); }}>
    <div className="mb-8"><p className="mb-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">나를 위한 기회 설정</p><h1 className="text-2xl font-bold tracking-tight">프로필 수정</h1><p className="mt-2 text-sm leading-relaxed text-slate-500">필요한 정보만 편하게 알려주세요. 나에게 맞는 기회를 찾는 데 사용해요.</p></div>
    <fieldset disabled={busy || confirmDelete} className="space-y-5">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900"><h2 className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-indigo-500" />기본 정보</h2>
        <label className="block space-y-2"><span className="text-sm font-medium">닉네임</span><input required minLength={2} maxLength={40} pattern="[가-힣A-Za-z0-9_ ]+" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800" /><span className="block text-xs text-slate-400">한글·영문·숫자·공백·밑줄, 2~40자</span></label>
        <div className="grid gap-5 sm:grid-cols-2">{select("연령대", facts.age_band, ageLabels, (v) => fact("age_band", v))}{select("학력", facts.education_stage, educationLabels, (v) => fact("education_stage", v))}{select("현재 상태", facts.employment_status, employmentLabels, (v) => fact("employment_status", v))}{select("소득 구간", facts.income_band, incomeLabels, (v) => fact("income_band", v))}</div>
      </section>
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900"><h2 className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-indigo-500" />내 생활 지역</h2>{regions("거주 지역", facts.residence_regions, (v) => fact("residence_regions", v))}{regions("활동 가능 지역", facts.activity_regions, (v) => fact("activity_regions", v))}</section>
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900"><h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-indigo-500" />관심과 선호</h2>
        <label className="block space-y-2"><span className="text-sm font-medium">관심 분야</span><input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800" placeholder="예: 디자인, 개발, 창업" defaultValue={preferences.interest_categories?.join(", ") ?? ""} onChange={(e) => preference("interest_categories", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} /><span className="block text-xs text-slate-400">쉼표로 구분해 최대 30개까지 입력할 수 있어요.</span></label>
        {regions("관심 지역", preferences.interest_regions, (v) => preference("interest_regions", v))}
        {select("선호 활동 방식", preferences.activity_mode, { ONLINE: "온라인", OFFLINE: "오프라인", HYBRID: "온·오프라인 병행", NO_PREFERENCE: "무관" }, (v) => preference("activity_mode", v))}
      </section>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" disabled={busy || confirmDelete} onClick={() => router.push("/")}>취소</Button><Button type="submit" disabled={busy || confirmDelete}>{busy ? "처리 중…" : "저장하기"}</Button></div>
    <div className="text-right"><button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="text-xs text-slate-400 underline underline-offset-4 hover:text-slate-600">회원탈퇴하기</button></div>
    {confirmDelete && <section role="dialog" aria-modal="false" aria-labelledby="withdraw-title" className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/30"><h2 id="withdraw-title" className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300"><ShieldAlert className="h-5 w-5" />정말 탈퇴하시겠어요?</h2><p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">계정, 프로필, 저장 공고, 지원 계획, 대화 기록이 삭제되고 모든 기기에서 로그아웃됩니다. 삭제한 데이터는 복구할 수 없습니다.</p><label className="block text-sm">계속하려면 ‘탈퇴’를 입력해주세요.<input autoFocus value={deletionText} onChange={(e) => setDeletionText(e.target.value)} disabled={busy} className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-4 py-3 dark:bg-slate-900" /></label><div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={busy} onClick={() => { setConfirmDelete(false); setDeletionText(""); }}>계속 이용하기</Button><button type="button" disabled={busy || deletionText !== "탈퇴"} onClick={() => void withdraw()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? "탈퇴 처리 중…" : "탈퇴하고 데이터 삭제"}</button></div></section>}
  </form>;
}
