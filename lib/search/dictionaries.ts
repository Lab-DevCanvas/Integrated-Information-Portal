import type { CategoryId, EducationStatus, EmploymentStatus, JobInterestField, OpportunityType, RegionCode } from "../types";

export const AGE_PATTERNS: RegExp[] = [/(\d{1,2})\s*살/, /만\s*(\d{1,2})\s*세/, /(\d{1,2})\s*세/];

export const REGION_ALIASES: Record<string, RegionCode> = {
  서울시: "서울",
  서울: "서울",
  부산시: "부산",
  부산: "부산",
  대구시: "대구",
  대구: "대구",
  인천시: "인천",
  인천: "인천",
  광주시: "광주",
  광주: "광주",
  대전시: "대전",
  대전: "대전",
  울산시: "울산",
  울산: "울산",
  세종시: "세종",
  세종: "세종",
  경기도: "경기",
  경기: "경기",
  강원도: "강원",
  강원: "강원",
  충청북도: "충북",
  충북: "충북",
  충청남도: "충남",
  충남: "충남",
  전라북도: "전북",
  전북: "전북",
  전라남도: "전남",
  전남: "전남",
  경상북도: "경북",
  경북: "경북",
  경상남도: "경남",
  경남: "경남",
  제주도: "제주",
  제주: "제주",
};

export const EMPLOYMENT_KEYWORDS: { pattern: RegExp; value: EmploymentStatus }[] = [
  { pattern: /무직|백수|미취업|구직/, value: "무직" },
  { pattern: /재직|직장인|회사원/, value: "재직" },
  { pattern: /프리랜서/, value: "프리랜서" },
  { pattern: /창업\s*준비|예비\s*창업/, value: "창업준비" },
];

export const EDUCATION_KEYWORDS: { pattern: RegExp; value: EducationStatus }[] = [
  { pattern: /고등학생/, value: "고등학생" },
  { pattern: /대학원\s*재학|대학원생/, value: "대학원재학" },
  { pattern: /대학원\s*졸업/, value: "대학원졸업" },
  { pattern: /졸업\s*예정/, value: "대학졸업예정" },
  { pattern: /대학생|재학생|대학\s*재학/, value: "대학재학" },
  { pattern: /대학\s*졸업|졸업생/, value: "대학졸업" },
];

export const JOB_INTEREST_KEYWORDS: { pattern: RegExp; value: JobInterestField }[] = [
  { pattern: /IT|개발|프로그래밍|백엔드|프론트엔드|소프트웨어/i, value: "IT개발" },
  { pattern: /기획|PM|프로덕트/i, value: "기획/PM" },
  { pattern: /디자인/, value: "디자인" },
  { pattern: /마케팅/, value: "마케팅" },
  { pattern: /경영|사무/, value: "경영/사무" },
  { pattern: /영업/, value: "영업" },
  { pattern: /교육/, value: "교육" },
  { pattern: /공공|행정/, value: "공공/행정" },
  { pattern: /연구|R&D/i, value: "연구/R&D" },
  { pattern: /제조|생산/, value: "제조/생산" },
  { pattern: /미디어|콘텐츠|영상|에디터/, value: "미디어/콘텐츠" },
];

export const CATEGORY_KEYWORDS: {
  pattern: RegExp;
  categoryId: CategoryId;
  opportunityType?: OpportunityType;
}[] = [
  { pattern: /공모전/, categoryId: "career", opportunityType: "contest" },
  { pattern: /대외활동|해커톤/, categoryId: "career", opportunityType: "external_activity" },
  { pattern: /부트캠프|교육과정|자격증/, categoryId: "career" },
  { pattern: /채용|취업|신입|인턴/, categoryId: "employment", opportunityType: "job" },
  { pattern: /장학금/, categoryId: "money", opportunityType: "scholarship" },
  { pattern: /지원금|수당/, categoryId: "money" },
  { pattern: /청년정책|정책/, categoryId: "money", opportunityType: "youth_policy" },
  { pattern: /주거|임대|전세|주택/, categoryId: "housing" },
  { pattern: /창업/, categoryId: "startup" },
];
