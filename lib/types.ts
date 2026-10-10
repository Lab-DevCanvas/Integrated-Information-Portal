import type { AISearchResult } from "./api/aiSearch";
// --- Taxonomy ---
export type CategoryId = "contest" | "activity" | "job" | "government-policy";

export type SubCategoryId =
  | "activity"
  | "job"
  | "government-policy"
  | "job_fulltime"
  | "job_intern"
  | "contest"
  | "hackathon"
  | "education"
  | "certification"
  | "allowance"
  | "subsidy"
  | "tuition_support"
  | "lease"
  | "happy_housing"
  | "jeonse_support"
  | "pre_startup_package"
  | "commercialization_support";

export type OpportunityType =
  | "contest"
  | "external_activity"
  | "job"
  | "scholarship"
  | "gov_support"
  | "youth_policy"
  | "housing_support"
  | "startup_support"
  | "education";

export interface SubCategory {
  id: SubCategoryId;
  parentId: CategoryId;
  label: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  description: string;
  subCategories: SubCategory[];
}

// --- Shared enums ---
export type RegionCode =
  | "서울"
  | "부산"
  | "대구"
  | "인천"
  | "광주"
  | "대전"
  | "울산"
  | "세종"
  | "경기"
  | "강원"
  | "충북"
  | "충남"
  | "전북"
  | "전남"
  | "경북"
  | "경남"
  | "제주"
  | "전국";

export type EducationStatus =
  | "고등학생"
  | "대학재학"
  | "대학원재학"
  | "대학졸업예정"
  | "대학졸업"
  | "대학원졸업";

export type EmploymentStatus = "재직" | "무직" | "프리랜서" | "창업준비";

export type JobInterestField =
  | "IT개발"
  | "기획/PM"
  | "디자인"
  | "마케팅"
  | "경영/사무"
  | "영업"
  | "교육"
  | "공공/행정"
  | "연구/R&D"
  | "제조/생산"
  | "미디어/콘텐츠";

export type ExperienceLevel = "무관" | "대학생" | "취준생" | "초급(1~3년)" | "경력(4년+)";

// --- User profile (persisted to localStorage) ---
export interface UserProfile {
  /** display name entered during onboarding; undefined = fall back to a generic greeting */
  name?: string;
  /** data URL of an uploaded/cropped image; undefined = show the default avatar */
  avatarUrl?: string;
  age: number;
  region: RegionCode;
  educationStatus: EducationStatus;
  employmentStatus: EmploymentStatus;
  jobInterests: JobInterestField[];
  startupInterest: boolean;
  housingStatus: "무주택" | "유주택" | "무관";
  /** representative percentile of median income (e.g. 100 = 기준중위소득 100%); undefined = 미입력 */
  incomePercentile?: number;
  /** freeform interest keyword tags */
  interests: string[];
  updatedAt: string;
}

// --- Eligibility ---
export interface EligibilityCondition {
  key: string;
  label: string;
  autoCheckable: boolean;
}

export interface EligibilityRules {
  ageRange?: { min?: number; max?: number };
  regions?: RegionCode[];
  educationStatuses?: EducationStatus[];
  employmentStatuses?: EmploymentStatus[];
  incomeMaxPercentile?: number;
  requiresHousinglessness?: boolean;
  requiresNoStartupHistory?: boolean;
  otherConditions?: EligibilityCondition[];
}

export type JudgeStatus = "pass" | "fail" | "unknown";

export interface EligibilityCheckItem {
  key: string;
  label: string;
  status: JudgeStatus;
  reason: string;
}

export interface EligibilityJudgement {
  overall: JudgeStatus;
  items: EligibilityCheckItem[];
}

// --- Opportunity ---
export interface Opportunity {
  id: string;
  dataOrigin?: "crawling";
  lastSeenAt?: string;
  periodStatus?: string;
  rawPeriodText?: string;
  title: string;
  organizer: string;
  opportunityType: OpportunityType;
  categoryId: CategoryId;
  subCategoryId: SubCategoryId;
  summary: string;
  description: string;
  /** ['전국'] if nationwide */
  region: RegionCode[];
  applyStartDate: string;
  applyEndDate: string;
  isAlwaysOpen?: boolean;
  benefitType: "상금" | "지원금" | "급여" | "인턴십" | "교육/멘토링" | "수당" | "주거지원" | "사업화자금";
  /** KRW; undefined = non-monetary or variable */
  benefitAmount?: number;
  benefitDescription: string;
  eligibility: EligibilityRules;
  requiredExperienceLevel: ExperienceLevel;
  /** authoring-time difficulty/competitiveness estimate, 1(easy)~5(hard) */
  competitionLevel: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  teamRequired: boolean;
  portfolioValue: 1 | 2 | 3 | 4 | 5;
  refUrl?: string;
  viewCount?: number;
  createdAt: string;
}

// --- Scoring ---
export type ScoreSubscoreKey =
  | "eligibility"
  | "interest"
  | "value"
  | "urgency"
  | "competition"
  | "behavior";

export interface ScoreSubscore {
  key: ScoreSubscoreKey;
  label: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
}

export interface ScoreResult {
  opportunityId: string;
  totalScore: number;
  subscores: ScoreSubscore[];
  explanation: string;
  eligibilityJudgement: EligibilityJudgement;
}

// --- Natural-language search ---
export type UnrestrictedDimension = "education" | "experience" | "region" | "age";
export type SortHint = "score_desc" | "deadline_asc" | "benefit_desc" | "portfolio_desc";

export interface ParsedIntent {
  rawQuery: string;
  age?: number;
  region?: RegionCode;
  employmentStatus?: EmploymentStatus;
  educationStatus?: EducationStatus;
  jobInterest?: JobInterestField;
  categoryHint?: CategoryId;
  opportunityTypeHint?: OpportunityType;
  minBenefitAmount?: number;
  maxBenefitAmount?: number;
  minDaysRemaining?: number;
  deadlineWithinDays?: number;
  unrestrictedDimensions: UnrestrictedDimension[];
  sortHint?: SortHint;
  matchedKeywords: string[];
}

export interface SearchResultItem {
  opportunity: Opportunity;
  score: ScoreResult;
  matchReason: string;
}

// --- AI chat ---
export interface ChatMessage {
  aiResult?: AISearchResult;
  error?: boolean;
  id: string;
  role: "user" | "assistant";
  text: string;
  /** opportunity ids referenced by this message, rendered as compact result cards */
  resultIds?: string[];
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}
