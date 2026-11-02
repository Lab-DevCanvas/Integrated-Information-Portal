/** Explicit allowlist: this proxy must never expose operator endpoints. */
export function isAccountRoute(path: string[], method: string): boolean {
  if (path.some((part) => !/^[a-z-]+$/.test(part))) return false;
  const route = path.join("/");
  return method === "GET" ? route === "accounts/me" : method === "POST" && [
    "auth/google/login", "auth/apple/login", "auth/refresh", "auth/logout", "auth/logout-all",
  ].includes(route);
}
