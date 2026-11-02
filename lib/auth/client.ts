/** Browser login uses the backend's HttpOnly cookies and the generated SDK. */
import { configure, installAuth, getMyAccount, getMyProfile, saveMyProfile, deleteMyProfile, logOut, uninstallAuth, restoreSession as restoreSdkSession, startSignIn as navigateToSignIn, ApiError, type components } from "@kang_the_conquoror/crawling-sdk";
export type Account = components["schemas"]["AccountRead"] & { nickname?: string | null };
export type Profile = components["schemas"]["ProfileRead"];
export type ProfileUpdate = components["schemas"]["ProfileUpdate"];
export { ApiError as AuthError };
export interface AuthConfig { apiBaseUrl: string; successRedirect: string }
let config: Promise<AuthConfig> | null = null;
let initialized = false;
let restoration: Promise<boolean> | null = null;
let generation = 0;
const listeners = new Set<() => void>();
const EVENT_KEY = "opfinde-auth-event";
export function subscribeAuth(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function changed() { listeners.forEach((listener) => listener()); }
export function getAuthConfig(): Promise<AuthConfig> {
  if (!config) config = fetch("/api/auth/config", { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw new Error("로그인 설정을 확인하지 못했어요.");
    return await response.json() as AuthConfig;
  }).catch((error) => { config = null; throw error; });
  return config;
}
async function initialize() {
  const settings = await getAuthConfig();
  if (!initialized) {
    configure({ baseUrl: settings.apiBaseUrl, maxRetries: 0 });
    // Cookie sessions never persist a refresh token in browser-readable storage.
    installAuth({ storage: { read: () => null, write: () => {}, clear: () => {} }, onSignedOut: changed });
    initialized = true;
  }
}
export async function startSignIn() { await initialize(); navigateToSignIn("google"); }
export async function restoreSession(): Promise<boolean> {
  if (restoration) return restoration;
  const version = generation;
  const operation = (async () => {
    await initialize();
    const restored = await restoreSdkSession();
    if (version !== generation) return false;
    if (restored) return true;
    // The SDK treats transient refresh failures as false; distinguish them from anonymous visits.
    try { await getMyAccount(); return version === generation; }
    catch (error) { if (error instanceof ApiError && error.status === 401) return false; throw error; }
  })();
  restoration = operation;
  try { return await operation; } finally { if (restoration === operation) restoration = null; }
}
export async function getAccount(): Promise<Account> { await initialize(); return getMyAccount(); }
export async function getProfile(): Promise<Profile> { await initialize(); return getMyProfile(); }
export async function saveProfile(value: ProfileUpdate): Promise<Profile> { await initialize(); return saveMyProfile(value); }
export async function deleteProfile() { await initialize(); return deleteMyProfile(); }
export async function signOut() {
  await initialize();
  // Do not claim success when the server still holds a valid HttpOnly cookie.
  await logOut();
  generation++; restoration = null; uninstallAuth(); initialized = false;
  try { localStorage.removeItem("opfinde-refresh-token"); localStorage.setItem(EVENT_KEY, crypto.randomUUID()); } catch { /* Other tabs recheck on focus. */ }
  changed();
}
export function handleSessionStorage(event: StorageEvent) {
  if (event.key !== EVENT_KEY && event.key !== null) return;
  generation++; restoration = null; uninstallAuth(); initialized = false; changed();
}

/** New account endpoints use the same cookie transport until the next SDK release. */
export async function accountRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const settings = await getAuthConfig();
  await initialize();
  const send = () => fetch(new URL(path, settings.apiBaseUrl), { ...init, credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json", ...init.headers }, signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  let response = await send();
  if (response.status === 401 && await restoreSession()) response = await send();
  if (!response.ok) throw new ApiError(response.status, path, await response.json().catch(() => ({})));
  return response;
}

export async function renameAccount(nickname: string): Promise<Account> {
  return (await accountRequest("/accounts/me", { method: "PATCH", body: JSON.stringify({ nickname }) })).json();
}
export async function withdrawAccount() {
  await accountRequest("/accounts/me", { method: "DELETE" });
  generation++; restoration = null; uninstallAuth(); initialized = false;
  try { localStorage.setItem(EVENT_KEY, crypto.randomUUID()); } catch { /* Session is already invalidated on the server. */ }
  changed();
}
