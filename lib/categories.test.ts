import { describe, expect, it } from "vitest";
import { CATEGORIES, getCategory, getSubCategoryLabel } from "./categories";

describe("getCategory", () => {
  it("finds a category by id", () => {
    expect(getCategory("employment")?.label).toBe("취업");
  });

  it("returns undefined for an unknown id", () => {
    // @ts-expect-error deliberately invalid id
    expect(getCategory("unknown")).toBeUndefined();
  });
});

describe("getSubCategoryLabel", () => {
  it("finds a subcategory label nested under any category", () => {
    expect(getSubCategoryLabel("contest")).toBe("공모전");
    expect(getSubCategoryLabel("pre_startup_package")).toBe("예비창업패키지");
  });

  it("falls back to the raw id when not found", () => {
    // @ts-expect-error deliberately invalid id
    expect(getSubCategoryLabel("nonexistent")).toBe("nonexistent");
  });
});

describe("CATEGORIES data integrity", () => {
  it("every subcategory's parentId matches its containing category", () => {
    for (const category of CATEGORIES) {
      for (const sub of category.subCategories) {
        expect(sub.parentId).toBe(category.id);
      }
    }
  });

  it("has no duplicate category or subcategory ids", () => {
    const categoryIds = CATEGORIES.map((c) => c.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);

    const subIds = CATEGORIES.flatMap((c) => c.subCategories.map((s) => s.id));
    expect(new Set(subIds).size).toBe(subIds.length);
  });
});
