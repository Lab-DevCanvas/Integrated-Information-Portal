import { describe, expect, it } from "vitest";
import { allowedCrawlingRoute } from "./crawlingProxy";

describe("crawling API boundary", () => {
  it("allows public reads and rejects operations", () => {
    expect(allowedCrawlingRoute(["activities"], "GET")).toBe("public");
    expect(allowedCrawlingRoute(["source-configs", "linkareer", "activate"], "POST")).toBeNull();
    expect(allowedCrawlingRoute(["crawl-jobs"], "POST")).toBeNull();
    expect(allowedCrawlingRoute(["raw", "linkareer"], "GET")).toBeNull();
  });
  it("rejects unsupported routes, deletions and path traversal", () => {
    for (const path of [["activities", "123"], ["raw", "linkareer", "123"]]) expect(allowedCrawlingRoute(path, "DELETE")).toBeNull();
    expect(allowedCrawlingRoute(["source-configs", ".."], "GET")).toBeNull();
    expect(allowedCrawlingRoute(["https://example.com"], "GET")).toBeNull();
    expect(allowedCrawlingRoute(["crawl-jobs"], "GET")).toBeNull();
  });
});
