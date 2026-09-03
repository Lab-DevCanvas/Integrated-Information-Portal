# crawling 백엔드 연동

> 이 문서의 범위: `info`(이 저장소, Next.js 프론트엔드)가 sibling 저장소 `crawling`(TACO
> InfoCroll — FastAPI + MongoDB, 공모전/정부정책/대외활동/채용 크롤러)의 실제 API에서 받아온
> 데이터를 어떻게 `Opportunity`로 변환해 기존 mock 기반 추천/자격판단 엔진에 흘려보내는지를
> 다룬다. `crawling` 저장소 자체의 구현/배포는 그쪽 `docs/`를 참고 — 여기서는 "그 API를 이
> 앱에서 어떻게 소비하는가"만 다룬다.

## 왜 이런 모양인가

`crawling`이 실제로 크롤링하는 필드(제목/출처/카테고리 대분류/원문 링크/요약/기간)는 이 앱의
`Opportunity` 타입이 추천 점수·자격판단에 쓰는 필드(지역, 구조화된 자격 조건, 경쟁률, 포트폴리오
가치, 혜택 금액 등)보다 훨씬 얇다. 크롤러가 주지 않는 필드를 지어내는 대신, **고정된 플레이스홀더
값으로 채운다** — 이 문서의 "필드 매핑" 절에 그 목록이 있다. 예를 들어 `eligibility: {}`는 "이
항목은 조건이 없다"고 명시적으로 주장하는 게 아니라, `judgeEligibility()`가 빈 규칙 집합을 항상
"pass"로 처리하는 기존 동작을 그대로 이용해 "우리는 이 항목의 자격 조건을 모른다"는 사실을 정직하게
반영한 것이다(가짜 조건을 만들어 fail을 내는 것보다 안전).

## 데이터 흐름

```
브라우저에서 useAllOpportunities() 최초 호출
  → useAppStore.loadCrawledOpportunities() (idle일 때만, 중복 호출 방지)
  → fetchCrawledOpportunities() — 4개 카테고리(contest/government-policy/activity/job)를
    각각 25건씩 병렬 요청(Promise.allSettled — 한 카테고리가 실패해도 나머지는 반영)
  → mapActivityToOpportunity()로 각 항목을 Opportunity로 변환, expired 항목은 제외
  → useAppStore.crawledOpportunities에 저장 (localStorage에는 저장하지 않음 — 매번 새로
    받아오는 게 싸고, 오래된 캐시를 들고 있는 것보다 낫다)
  → useAllOpportunities()가 [...OPPORTUNITIES(큐레이션 mock), ...crawledOpportunities]를
    합쳐서 리턴
```

호출 실패 시(네트워크 오류, VM 다운, IP 변경 등) `crawledStatus`가 `"error"`가 되고
`crawledOpportunities`는 빈 배열로 남는다 — 화면은 조용히 큐레이션 mock 60건만으로 계속
동작한다(로딩 스피너나 에러 배너 없음, 의도적 설계).

**기회 상세 페이지**(`app/opportunities/[id]/page.tsx`)는 Server Component라 위 클라이언트
스토어에 접근할 수 없다. 큐레이션 mock에서 id를 못 찾으면 서버에서 직접
`GET /activities/{id}`(`getActivityById`)를 호출해 같은 매핑 함수를 거쳐 렌더링한다 — 목록
화면과 상세 화면이 서로 다른 경로로 크롤링 데이터를 가져오는 셈이다(하나는 클라이언트 merge,
하나는 서버 fallback).

## 코드 위치

| 파일 | 역할 |
|---|---|
| `lib/api/crawlingClient.ts` | `GET /activities`, `GET /activities/{id}` 대상 fetch 래퍼. `NEXT_PUBLIC_CRAWLING_API_URL` 환경변수(없으면 배포된 VM IP로 폴백), 8초 타임아웃, `CrawlingApiError` |
| `lib/api/mapActivityToOpportunity.ts` | `ActivityDTO` → `Opportunity` 순수 변환 함수. 카테고리/출처별 taxonomy 매핑표와 플레이스홀더 필드들이 여기 있다 |
| `lib/api/fetchCrawledOpportunities.ts` | 4개 카테고리 병렬 조회 + expired 필터 + 매핑까지 묶은 오케스트레이션 함수 |
| `lib/store/useAppStore.ts` | `crawledOpportunities`/`crawledStatus`/`loadCrawledOpportunities` — 스토어에 얹은 상태·액션 (persist 대상에서 제외) |
| `lib/hooks/useAllOpportunities.ts` | 큐레이션 mock + 크롤링 데이터를 합쳐 리턴하고, 최초 호출 시 fetch를 트리거하는 훅. 대부분의 컴포넌트는 이 훅만 쓰면 된다 |
| `app/opportunities/[id]/page.tsx` | 상세 페이지의 서버사이드 fallback 조회 |

`lib/hooks/useScoredOpportunities.ts`는 인자를 안 주면 내부적으로 `useAllOpportunities()`를
기본값으로 쓴다 — 대시보드(`app/page.tsx`)는 코드 변경 없이 자동으로 합쳐진 데이터를 점수
계산에 사용한다.

## 필드 매핑

| Opportunity 필드 | 값의 출처 | 비고 |
|---|---|---|
| `id` | `activity.id` (Mongo `_id`) | 상세 페이지 서버 fallback이 그대로 이 id로 `GET /activities/{id}`를 부른다 |
| `title` | `activity.title` | null이면 `"(제목 미상)"` |
| `organizer` | `activity.source`를 한글 라벨로(`SOURCE_LABELS`) | 매핑에 없는 소스는 원본 slug 그대로 표시(깨지지 않음) |
| `opportunityType` / `categoryId` / `subCategoryId` / `benefitType` | `activity.category` (+ `government-policy`는 `activity.source`로 세분화: `youthcenter`→청년정책, 그 외→정부지원금) | 실제 신호(카테고리·출처) 기반 — "임의 값"이 아니라 휴리스틱 |
| `summary` / `description` | `activity.summary` (140자 초과 시 summary만 말줄임) | null이면 `"요약 정보가 제공되지 않았습니다."` |
| `applyStartDate` | `activity.period_start` ?? `first_collected_at` | |
| `applyEndDate` | `activity.period_end` ?? `first_collected_at + 90일` | **PLACEHOLDER** — 상시모집이 아닌데 종료일을 모르는 항목만 해당 |
| `isAlwaysOpen` | `activity.period_status === "always_open"` | |
| `applyUrl` | `activity.detail_url` | |
| `createdAt` | `activity.first_collected_at` | 실데이터 — "오늘 추가된 기회"/캘린더 "시작" 마커가 이 값을 씀 |
| `region` | **PLACEHOLDER** — 항상 `["전국"]` | 크롤러가 지역을 수집하지 않음 |
| `eligibility` | **PLACEHOLDER** — 항상 `{}` (무제한/pass로 판정됨) | 구조화된 자격 조건이 없음 |
| `requiredExperienceLevel` | **PLACEHOLDER** — 항상 `"무관"` | |
| `competitionLevel` / `portfolioValue` | **PLACEHOLDER** — 항상 `3`(중간값 고정) | 개별 항목별로 추정하지 않음(사용자 결정 — 임의값으로 충분) |
| `teamRequired` | **PLACEHOLDER** — 항상 `false` | |
| `benefitAmount` | 항상 `undefined` | 지어내지 않음 — 타입이 이미 "금액 미상"을 지원하므로 그대로 사용 |
| `tags` | `[organizer 라벨]` | 관심 직무/키워드 매칭에 최소한의 신호 제공 |

## 가져오는 데이터 범위 (의도적 한계)

- `/activities`에는 `sort` 파라미터가 없고, Mongo 자연 정렬 1페이지(`page_size=100`)가 거의
  전부 `government-policy`(약 1000/1100건이 정책)라 필터 없이 한 페이지만 가져오면
  공모전/채용/대외활동이 전혀 안 보인다. 그래서 **카테고리별로 25건씩, 4개 카테고리 병렬
  요청 → 최대 100건**을 가져온다(`fetchCrawledOpportunities.ts`).
- 전체 활동 수는 1,100건대(계속 증가) — 이 앱은 그중 최대 100건짜리 대표 샘플만 보여준다.
  전체 페이지네이션/무한스크롤은 범위 밖(다음 단계 참고).
- `period_status === "expired"` 항목은 애초에 제외한다.

## 알려진 한계 / 다음 단계

- **주거/창업 카테고리는 크롤링 데이터가 전혀 없다** — `crawling`이 수집하는 4개 대분류
  (공모전/정부정책/대외활동/채용)에 주거지원·창업지원이 없어서, `categoryId: "housing"`과
  `"startup"`은 여전히 큐레이션 mock 데이터로만 채워진다.
- **플레이스홀더 필드는 개별 항목별로 추정하지 않는다** — 모든 크롤링 항목이 동일하게
  `competitionLevel: 3`, `portfolioValue: 3`, `requiredExperienceLevel: "무관"`,
  `eligibility: {}`를 갖는다. 실제 자격/경쟁률 판단에 이 값을 근거로 쓰면 안 된다.
  (`crawling` 쪽 스키마가 이런 필드를 갖게 되면 이 매핑을 다시 정교화해야 한다.)
- **크롤링 API는 인증이 없고 IP가 유동적이다** (`crawling/docs/deployment-gcp.md` 참고) — VM이
  재시작되면 기본값(`http://34.59.75.165:8000`)이 깨질 수 있다. 그때는
  `NEXT_PUBLIC_CRAWLING_API_URL` 환경변수로 새 주소를 넣거나
  `lib/api/crawlingClient.ts`의 `DEFAULT_BASE_URL`을 갱신한다.
- **교차 출처 중복이 병합되지 않는다** — 같은 공모전이 링커리어·캠퍼스픽 양쪽에 있어도
  `crawling` 쪽에 병합 로직이 아직 없어(`also_available_on`이 항상 빈 배열) 이 앱에도 중복
  항목이 그대로 노출될 수 있다.
- SDK(`crawling/sdk`, `@taco_tsinghua/crawling-sdk`)는 아직 npm에 배포되지 않았고, sibling
  repo에 대한 `file:` 의존성은 Vercel 배포에서 동작하지 않는다(이 repo만 체크아웃되므로) —
  그래서 SDK 대신 손으로 짠 `crawlingClient.ts`를 쓴다. SDK가 npm에 올라가면 이 클라이언트를
  SDK 호출로 교체하는 걸 고려할 수 있다.

## 로컬에서 다른 crawling API를 바라보게 하기

```bash
# .env.local
NEXT_PUBLIC_CRAWLING_API_URL=http://localhost:8000
```

sibling `crawling` 저장소를 로컬에서 띄운 상태(`cd ../crawling && uvicorn src.api.main:app --reload`
또는 `docker compose up`)라면 위처럼 로컬 주소로 override한다. CORS는 `crawling`이
`allow_origins`를 넓게 열어두므로 (`crawling/src/api/main.py`) 별도 설정 없이 브라우저에서 바로
호출된다.

## 테스트

`lib/api/*.test.ts`가 순수 로직(매핑 규칙, HTTP 클라이언트의 에러 처리, 카테고리별 병렬 조회 +
부분 실패 시 나머지는 살아남는지)을 커버한다. 실제 네트워크 호출 없이 `fetch`/`listActivities`를
목으로 대체한다 — `npm test`로 나머지 스위트와 함께 실행된다. 스토어의 `loadCrawledOpportunities`
액션 자체(중복 호출 방지, 상태 전이)는 단위 테스트 없이 브라우저로 직접 검증했다(기존
`useAppStore`에도 단위 테스트가 없는 것과 같은 결로, 얇은 조립 코드라 로직 테스트보다
연결 확인이 더 값어치 있다고 판단).
