import type { Account, Profile } from "@/lib/auth/client";
import type { UserProfile } from "@/lib/types";
export const ageLabels: Record<string, string> = { UNDER_19: "19세 미만", AGE_19_24: "19~24세", AGE_25_29: "25~29세", AGE_30_34: "30~34세", AGE_35_39: "35~39세", OVER_39: "40세 이상" };
export const educationLabels: Record<string, string> = { HIGH_SCHOOL_OR_BELOW: "고등학교 이하", ENROLLED_UNDERGRADUATE: "대학재학", LEAVE_OF_ABSENCE: "휴학", UNDERGRADUATE_GRADUATED: "대학졸업", ENROLLED_GRADUATE: "대학원재학", GRADUATE_GRADUATED: "대학원졸업" };
export const employmentLabels: Record<string, string> = { STUDENT: "학생", UNEMPLOYED: "무직", EMPLOYED: "재직", SELF_EMPLOYED: "자영업", PREPARING: "취업·창업 준비" };
export const incomeLabels: Record<string, string> = { NONE: "소득 없음", UNDER_MEDIAN_60: "중위소득 60% 이하", UNDER_MEDIAN_100: "중위소득 100% 이하", UNDER_MEDIAN_150: "중위소득 150% 이하", OVER_MEDIAN_150: "중위소득 150% 초과", UNDISCLOSED: "공개하지 않음" };
export const regionLabels: Record<string, string> = { SEOUL: "서울", BUSAN: "부산", DAEGU: "대구", INCHEON: "인천", GWANGJU: "광주", DAEJEON: "대전", ULSAN: "울산", SEJONG: "세종", GYEONGGI: "경기", GANGWON: "강원", CHUNGBUK: "충북", CHUNGNAM: "충남", JEONBUK: "전북", JEONNAM: "전남", GYEONGBUK: "경북", GYEONGNAM: "경남", JEJU: "제주", NATIONWIDE: "전국" };
/** Compatibility view for existing cards. Missing/ranged facts are never invented as precise values. */
export function projectProfile(profile: Profile, account: Account): UserProfile {
  const facts = profile.eligibility_facts;
  return {
    name: account.nickname ?? "회원", age: Number.NaN,
    region: (regionLabels[facts.residence_regions?.[0] ?? ""] ?? "미입력") as UserProfile["region"],
    educationStatus: (educationLabels[facts.education_stage ?? ""] ?? "미입력") as UserProfile["educationStatus"],
    employmentStatus: (employmentLabels[facts.employment_status ?? ""] ?? "미입력") as UserProfile["employmentStatus"],
    jobInterests: [], startupInterest: false, housingStatus: "무관",
    interests: profile.preferences.interest_categories ?? [], updatedAt: profile.updated_at,
    accountProfile: profile,
  };
}
