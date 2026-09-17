/** Forward only public opportunity reads to the configured backend. */
export function allowedCrawlingRoute(path: string[], method: string): "public" | null {
  if (path.some((part) => !/^[a-zA-Z0-9_:-]+$/.test(part))) return null;
  if (path[0] === "activities" && path.length <= 2 && method === "GET") return "public";
  return null;
}
