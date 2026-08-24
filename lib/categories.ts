import type { Category, CategoryId, SubCategoryId } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "employment",
    label: "취업",
    icon: "briefcase",
    description: "채용 · 인턴십 기회를 모아봐요",
    subCategories: [
      { id: "job_fulltime", parentId: "employment", label: "정규 채용" },
      { id: "job_intern", parentId: "employment", label: "인턴" },
    ],
  },
  {
    id: "career",
    label: "커리어",
    icon: "trophy",
    description: "공모전 · 대외활동 · 교육으로 경험을 쌓아요",
    subCategories: [
      { id: "contest", parentId: "career", label: "공모전" },
      { id: "hackathon", parentId: "career", label: "해커톤/대외활동" },
      { id: "education", parentId: "career", label: "교육" },
      { id: "certification", parentId: "career", label: "자격증 지원" },
    ],
  },
  {
    id: "money",
    label: "돈",
    icon: "coins",
    description: "청년수당 · 지원금 · 장학금을 확인해요",
    subCategories: [
      { id: "allowance", parentId: "money", label: "청년수당" },
      { id: "subsidy", parentId: "money", label: "지원금" },
      { id: "tuition_support", parentId: "money", label: "교육비/장학금" },
    ],
  },
  {
    id: "housing",
    label: "주거",
    icon: "home",
    description: "청년임대 · 행복주택 · 전세지원 정보예요",
    subCategories: [
      { id: "lease", parentId: "housing", label: "청년임대" },
      { id: "happy_housing", parentId: "housing", label: "행복주택" },
      { id: "jeonse_support", parentId: "housing", label: "전세지원" },
    ],
  },
  {
    id: "startup",
    label: "창업",
    icon: "rocket",
    description: "예비창업패키지 · 사업화지원을 찾아봐요",
    subCategories: [
      { id: "pre_startup_package", parentId: "startup", label: "예비창업패키지" },
      { id: "commercialization_support", parentId: "startup", label: "사업화지원" },
    ],
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
