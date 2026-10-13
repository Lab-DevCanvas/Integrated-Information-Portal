# OPFINDE — AI 기회 탐색 플랫폼

공모전, 대외활동, 채용/인턴, 장학금, 정부지원금, 청년정책, 주거지원, 창업지원 등 흩어진 "기회 정보"를
한곳에 모아 탐색하는 Next.js 웹앱입니다. sibling 저장소 `crawling`의 실제 공고를 조회하며,
기존 추천·검색 파서·프로필은 브라우저의 로컬 기능입니다. 서버 자격 판정·추천·Agent API는 아직 없습니다. 상세는
[`docs/crawling-integration.md`](docs/crawling-integration.md) 참고.

## 핵심 기능

- **추천 대시보드** (`/`) — 온보딩에서 입력한 프로필을 바탕으로 계산한 적합도 점수 순 추천 리스트, 오늘 추가된 기회 알림 카드
- **AI 자연어 검색 챗봇** (`/search`) — "서울 사는 27살 무직인데 받을 수 있는 지원금 찾아줘" 같은 문장을 파싱해 조건에 맞는 기회를 대화형으로 제안
- **자격 자동판단** — 나이/지역/재학상태/취업상태/소득/창업이력 등 조건별 지원 가능(🟢)/불가(🔴)/확인 필요(🟡) 판정
- **카테고리 탐색** (`/categories`) — 기존 검색·상세 필터·정렬과 출처·모집 상태·URL 필터·점진 로딩·무한 스크롤 통합
- **기회 상세** (`/opportunities/[id]`) — 실제 공고 내용·기간·수집 시각·원문 링크와 로컬 저장/지원 계획
- **비교** (`/compare`) — 최대 4개 기회를 선택해 표로 비교하고 AI 추천 문장 생성
- **지원 계획** (`/apply-plan`), **저장한 기회** (`/saved`), **알림** (`/notifications`) — 프로필 메뉴에서 접근
- 다크 모드, 데스크톱/모바일 전용 UI(하단 탭바 vs 상단 네비) 지원

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + React 19
- [Tailwind CSS v4](https://tailwindcss.com) — CSS 기반 설정 (`app/globals.css`의 `@theme inline`, `tailwind.config.js` 없음)
- [Zustand](https://github.com/pmndrs/zustand) `persist` 미들웨어 — 클라이언트 상태를 localStorage에 저장 (자체 백엔드 없음)
- [Vitest](https://vitest.dev) — 순수 로직 단위 테스트
- [lucide-react](https://lucide.dev) — 아이콘
- sibling 저장소 `crawling`(FastAPI + MongoDB)의 REST API에 Next.js 프록시로 연결합니다.

## 시작하기

```bash
npm install
npm run dev       # http://localhost:3000
```

기본적으로 배포된 crawling API(`http://34.59.75.165:8000`)에서 실시간 데이터를 가져옵니다. 다른
주소를 쓰려면(예: 로컬에서 `crawling` 저장소를 직접 띄운 경우) `.env.local`에
`CRAWLING_API_URL`을 설정하세요.
`.env.example`을 참고하세요. 배포된 구버전 백엔드는 소스 설정 API가 없을 수 있습니다. 상세는
[`docs/crawling-integration.md`](docs/crawling-integration.md).

기타 명령어:

```bash
npm run build      # 프로덕션 빌드
npm run start       # 빌드 결과 실행
npm run lint         # ESLint
npm test               # Vitest 전체 실행 (1회성)
npm run test:watch  # Vitest watch 모드
npm run test:ui        # Vitest UI
npx tsc --noEmit     # 타입 체크만 수행
```

## 폴더 구조

```
app/                     라우트 (App Router)
  page.tsx                 대시보드
  onboarding 모달          components/onboarding/ (별도 라우트 아님, 최초 방문 시 블로킹 모달)
  search/                   AI 검색 채팅 UI
  categories/               카테고리 탐색
  opportunities/[id]/       기회 상세
  compare/                  비교
  profile/edit/             프로필 수정 페이지
  apply-plan/, saved/, notifications/

components/
  layout/                  Header, BottomTabBar(모바일), SearchFab, ProfileGate, CompareTray, Wordmark 등
  onboarding/               최초 방문 시 뜨는 블로킹 온보딩 모달 + 5단계 스텝
  opportunity/               카드, 점수뱃지, D-day뱃지, 자격판단 뱃지/표, 저장/비교/지원계획 버튼
  chat/                     AI 검색의 ChatGPT 스타일 멀티 대화 UI
  compare/, dashboard/, profile/, ui/   공용 UI 프리미티브

lib/
  types.ts                 전체 도메인 타입 (UserProfile, Opportunity, ScoreResult, ParsedIntent 등)
  constants.ts              지역/재학상태/직무/점수 가중치 등 상수
  categories.ts              카테고리 트리 + 필터 정의
  mock/dateHelpers.ts          런타임 상대 날짜 유틸
  api/                        crawling 백엔드 연동 — crawlingClient.ts(fetch 래퍼),
                                 mapActivityToOpportunity.ts(스키마 변환), fetchCrawledOpportunities.ts
                                 (오케스트레이션). 상세는 docs/crawling-integration.md
  hooks/useAllOpportunities.ts  목데이터 + 실시간 크롤링 데이터를 합쳐 리턴하는 훅
  eligibility/judge.ts          자격 자동판단 로직
  scoring/                    score.ts(가중합 계산), explain.ts(설명 문구), reasons.ts(사유 목록)
  search/                     dictionaries.ts, parser.ts(자연어→ParsedIntent), applyIntent.ts(필터/정렬)
  chat/reply.ts                채팅 응답 생성 ("AI 두뇌" — parser+applyIntent+compare를 재사용하는 템플릿 엔진)
  compare/recommend.ts          비교 표 + 추천 문장 생성
  notifications.ts              알림/오늘의 기회 피드 로직
  store/useAppStore.ts           Zustand persist 스토어 (+ 크롤링 데이터 로딩 상태, 비영속)
  testFixtures.ts                테스트 전용 목 프로필/기회 팩토리 (테스트 자체는 아님)
  **/*.test.ts                    각 로직 파일과 같은 위치의 단위 테스트

docs/
  crawling-integration.md   crawling 백엔드 연동 방식 — 데이터 흐름, 필드 매핑, 알려진 한계
```

## 핵심 로직 개요

### Opportunity Score (`lib/scoring/score.ts`)

프로필과 기회를 받아 6개 하위 점수의 가중합(100점 만점)을 계산합니다 (`lib/constants.ts`의 `SCORE_WEIGHTS`):

| 하위 점수 | 가중치 | 설명 |
|---|---|---|
| 지원자격 | 40% | 자격 자동판단 결과 평균 (fail 있으면 상한 0.3) |
| 관심도 | 20% | 관심직무 일치(60%) + 관심 키워드 겹침(40%) |
| 기대가치 | 15% | 혜택 금액 구간(50%) + 포트폴리오 가치(50%) |
| 마감시점 | 10% | 남은 일수 구간별 스텝 커브 (너무 촉박/너무 여유 둘 다 페널티) |
| 경쟁가능성 | 10% | 프로필 경력수준과 요구수준 매칭 + 난이도 페널티 |
| 사용자행동 | 5% | 저장 여부 + 결정론적 해시 기반 조회수 정규화 |

리렌더 시 점수가 흔들리지 않도록 `Math.random()`/`Date.now()`는 렌더 경로에서 사용하지 않고,
대신 문자열 해시(`simpleStringHash`, **unsigned** `>>>` 시프트 사용)로 결정론적 의사난수를 만듭니다.

### 자격 자동판단 (`lib/eligibility/judge.ts`)

나이/지역/재학상태/취업상태는 온보딩에서 확정값이므로 pass/fail만 나옵니다. **소득 조건**과
**창업이력 조건**은 사용자가 직접 확정할 수 없는 값이라 하드 fail 없이 항상 unknown(🟡 확인 필요)으로
처리합니다. 자유서술 조건도 항상 unknown입니다. 전체 판정(`overall`)은 fail이 하나라도 있으면 fail,
아니면 unknown이 있으면 unknown, 아니면 pass입니다.

### 자연어 검색 (`lib/search/parser.ts`, `applyIntent.ts`)

정규식/키워드 사전으로 나이·지역·취업상태·재학상태·관심직무·카테고리·금액 조건·마감 조건·
"제한없음" 표현("대학생 아니어도", "경력 무관")을 추출해 `ParsedIntent`로 만든 뒤 필터링/정렬합니다.
**우선순위 규칙**: 쿼리에 명시적으로 언급된 조건만 하드 필터로 작동합니다. 언급되지 않은 차원은
저장된 프로필 값이 있어도 결과를 제외하지 않고 점수 계산에만 반영됩니다 (카드의 자격 뱃지로 불일치를
안내).

### AI 검색 채팅 (`lib/chat/reply.ts`)

실제 LLM 호출이 아니라 `parseQuery` + `filterAndSortByIntent` + `buildComparisonSentence`를 재사용해
템플릿 기반 대화형 응답을 생성합니다. 메시지에 "비교"가 포함되고 결과가 2건 이상이면 자동으로 비교
문장을, "계획"/"우선순위" 등이 포함되면 준비 순서 안내 문구를 덧붙입니다.

### 비교 (`lib/compare/recommend.ts`)

최대 4개 기회를 비교합니다. 총점(→ 지원자격 점수 → 포트폴리오 가치 순) 기준으로 승자를 정하고,
각 상대 대비 가장 격차가 큰 지표를 골라 추천 문장을 조립합니다. 전원이 자격 fail이면 "차악" 안내
문장으로 대체됩니다.

## 실제 데이터와 로컬 모델

대시보드는 카테고리별 25건 샘플을 사용하며, 전체 탐색은 `/categories`에서 점진 로딩과 무한 스크롤로 조회합니다.
저장·계획·비교 ID가 샘플 밖이면 단건 조회로 보완합니다. 누락된 날짜·지역은 임의로 채우지 않고,
수집 데이터의 자격 판정은 ‘확인 필요’로 표시합니다. 경쟁률·포트폴리오 등 기존 점수 모델의 고정값은
로컬 호환용이며 백엔드 분석 결과가 아닙니다. 자세한 범위는 [상태 보고서](docs/backend-frontend-status.md)를 참고하세요.

## 상태 관리

Zustand `persist` 스토어(`lib/store/useAppStore.ts`) 하나가 프로필, 저장한 기회, 지원 계획, 비교 목록,
채팅 대화 기록, 테마를 localStorage 키 `"aiop-storage"`에 저장합니다. SSR/클라이언트 하이드레이션
불일치를 막기 위해 `_hasHydrated` 플래그를 두고, 하이드레이션이 끝나기 전에는 `ProfileGate`가 온보딩
모달을 섣불리 띄우지 않도록 합니다.

## 테스트

`lib/**/*.test.ts`에 있는 순수 로직 단위 테스트를 [Vitest](https://vitest.dev)로 실행합니다
(`environment: "node"`, UI 컴포넌트 테스트는 없음 — 로직 레이어만 검증).

```bash
npm test              # 전체 실행
npm run test:watch     # watch 모드
npm run test:ui         # 브라우저 UI로 결과 보기
```

주요 커버리지: 날짜/포맷 유틸, 자격 자동판단 전체 룰, 점수 계산(가중치 합·결정론성·구간별 동작),
설명/사유 문구 생성, 자연어 파서(스펙의 5개 예시 쿼리 포함), 검색 필터/정렬(우선순위 규칙 포함),
비교 로직(승자 선정 tie-break, 클라우즈 생성), 채팅 응답 생성, 알림/오늘의 기회 피드,
crawling API 연동(HTTP 클라이언트 에러 처리, 스키마 매핑 규칙, 카테고리별 병렬 조회 + 부분 실패
복원력 — `lib/api/*.test.ts`, 실제 네트워크 호출 없이 `fetch` mock으로 검증).
`lib/testFixtures.ts`는 테스트용 프로필/기회 팩토리를 제공하며 테스트 글롭에 포함되지 않습니다.

### AI 검색 제한 안내

검색 API의 오류 코드로 안내와 재시도 버튼을 구분한다. 동시 처리·분당 초과는
`AI_SEARCH_BUSY`·`AI_SEARCH_RATE_LIMIT`, 공급자 제한은 `AI_PROVIDER_LIMIT`이다.
잠시 후 수동 재시도를 제공하며 자동 재호출하지 않는다. 공용 일일 한도
`AI_SEARCH_DAILY_LIMIT`는 서비스 전체 한도임을 안내하고 즉시 재시도 버튼을 숨긴다.
향후 사용자별 `AI_SEARCH_USER_DAILY_LIMIT`에도 별도 안내를 준비했지만 현재 서버는
사용자별 한도를 적용하지 않는다. JSON이 아닌 프록시 429도 검색 혼잡으로 안내한다.
