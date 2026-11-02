import { beforeEach, afterEach, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ configure: vi.fn(), installAuth: vi.fn(), getMyAccount: vi.fn(), getMyProfile: vi.fn(), saveMyProfile: vi.fn(), deleteMyProfile: vi.fn(), logOut: vi.fn(), uninstallAuth: vi.fn(), restoreSession: vi.fn(), startSignIn: vi.fn() }));
vi.mock("@kang_the_conquoror/crawling-sdk", () => ({ ...sdk, ApiError: class extends Error { constructor(public status: number) { super(); } } }));
let client: typeof import("./client");
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ apiBaseUrl: "https://api.example.test", successRedirect: "https://app.example.test" }))));
  client = await import("./client");
});
afterEach(() => vi.unstubAllGlobals());
it("uses backend navigation without requiring a browser provider ID", async () => {
  await client.startSignIn();
  expect(sdk.configure).toHaveBeenCalledWith({ baseUrl: "https://api.example.test", maxRetries: 0 });
  expect(sdk.startSignIn).toHaveBeenCalledWith("google");
  const storage = sdk.installAuth.mock.calls[0][0].storage;
  storage.write("secret"); expect(storage.read()).toBeNull();
});
it("restores a cookie session with no local refresh token and coalesces calls", async () => {
  sdk.restoreSession.mockResolvedValue(true);
  expect(await Promise.all([client.restoreSession(), client.restoreSession()])).toEqual([true, true]);
  expect(sdk.restoreSession).toHaveBeenCalledTimes(1);
});
it("does not disguise a network failure as signed out", async () => {
  sdk.restoreSession.mockResolvedValue(false); sdk.getMyAccount.mockRejectedValue(new Error("offline"));
  await expect(client.restoreSession()).rejects.toThrow("offline");
});
it("does not report successful logout while cookies remain on server", async () => {
  sdk.logOut.mockRejectedValue(new Error("offline"));
  const handler = vi.fn(); client.subscribeAuth(handler);
  await expect(client.signOut()).rejects.toThrow("offline");
  expect(handler).not.toHaveBeenCalled(); expect(sdk.uninstallAuth).not.toHaveBeenCalled();
});
it("passes profile updates through the generated contract", async () => {
  const value = { eligibility_facts: {}, preferences: {} };
  await client.saveProfile(value); expect(sdk.saveMyProfile).toHaveBeenCalledWith(value);
});
it("clears the session only after successful account withdrawal", async () => {
  await client.getAuthConfig();
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
  const listener = vi.fn(); client.subscribeAuth(listener);
  await client.withdrawAccount();
  expect(fetch).toHaveBeenLastCalledWith(new URL("https://api.example.test/accounts/me"), expect.objectContaining({ method: "DELETE", credentials: "include" }));
  expect(sdk.uninstallAuth).toHaveBeenCalled(); expect(listener).toHaveBeenCalled();
});
it("preserves the local session if withdrawal fails", async () => {
  await client.getAuthConfig();
  vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 503 }));
  const listener = vi.fn(); client.subscribeAuth(listener);
  await expect(client.withdrawAccount()).rejects.toBeInstanceOf(Error);
  expect(sdk.uninstallAuth).not.toHaveBeenCalled(); expect(listener).not.toHaveBeenCalled();
});
it("sends nickname changes only to the current account endpoint", async () => {
  await client.getAuthConfig();
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ nickname: "new-name" })));
  expect(await client.renameAccount("new-name")).toEqual({ nickname: "new-name" });
  expect(fetch).toHaveBeenLastCalledWith(new URL("https://api.example.test/accounts/me"), expect.objectContaining({ method: "PATCH", body: JSON.stringify({ nickname: "new-name" }) }));
});
