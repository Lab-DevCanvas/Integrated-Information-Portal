import type { Category, CategoryId, SubCategoryId } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "contest", label: "공모전", icon: "trophy",
    description: "다양한 분야의 공모전을 찾아봐요",
    subCategories: [{ id: "contest", parentId: "contest", label: "공모전" }],
  },
  {
    id: "activity", label: "대외활동", icon: "users",
    description: "대외활동으로 새로운 경험을 쌓아요",
    subCategories: [{ id: "activity", parentId: "activity", label: "대외활동" }],
  },
  {
    id: "job", label: "채용", icon: "briefcase",
    description: "채용 · 인턴십 기회를 모아봐요",
    subCategories: [{ id: "job", parentId: "job", label: "채용" }],
  },
  {
    id: "government-policy", label: "정부정책", icon: "landmark",
    description: "정부 · 청년 · 복지 정책을 확인해요",
    subCategories: [{ id: "government-policy", parentId: "government-policy", label: "정부정책" }],
  },
];

export function getCategory(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getSubCategoryLabel(id: SubCategoryId): string {
  for (const c of CATEGORIES) {
    const sub = c.subCategories.find((s) => s.id === id);
    if (sub) return sub.label;
  }
  return id;
}
