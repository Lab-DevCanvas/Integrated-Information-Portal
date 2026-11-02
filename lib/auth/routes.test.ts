import { expect, it } from "vitest";
import { isAccountRoute } from "./routes";
it("allows only the intended account authentication operations", () => {
  expect(isAccountRoute(["auth", "google", "login"], "POST")).toBe(true);
  expect(isAccountRoute(["accounts", "me"], "GET")).toBe(true);
  for (const [path, method] of [["accounts/me", "DELETE"], ["auth/refresh", "GET"], ["source-configs", "POST"], ["auth/../crawl-jobs", "POST"], ["accounts/other-user", "GET"]]) {
    expect(isAccountRoute(path.split("/"), method)).toBe(false);
  }
});
