# 로그인과 개인 데이터

Google 로그인은 SDK 5.0.2의 startSignIn으로 백엔드 인증 페이지에 이동한다. 서버가 코드 교환을 수행하고 HttpOnly 쿠키를 설정한 후 지정된 프론트 주소로 복귀시킨다. 프론트에 Google 비밀 키나 Infisical SDK를 설치하지 않는다. Apple은 실제 설정이 준비되지 않아 버튼을 제공하지 않는다.

## 설정

서버 전용 AUTH_API_URL과 OAUTH_SUCCESS_REDIRECT를 사용한다. 공개 설정만 /api/auth/config로 제공한다. 배포 기본 주소는 https://integrated-info.kro.kr 및 https://integrated-information-portal.vercel.app 이다. Infisical CLI 로그인 후 INFISICAL_PROJECT_ID를 지정하고 npm run auth:sync로 공개 설정만 동기화한다.

로컬 검증은 INFISICAL_PROJECT_ID를 지정한 npm run dev:auth-api와 npm run dev를 별도 터미널에서 실행한다. AUTH_API_URL=http://localhost:8000, OAUTH_SUCCESS_REDIRECT=http://localhost:3000/login을 설정한다. Google 승인 URI에는 http://localhost:8000/auth/google/callback이 필요하다. 개발 API 실행기는 dev의 저장소 접속 정보와 Google 인증 키만 프로세스 메모리로 주입한다. 프로세스 재시작 후 다시 로그인해야 한다.

## 세션과 저장

SDK로 쿠키 세션을 복원하며 브라우저 저장소에 토큰을 보관하지 않는다. 서버 로그아웃 성공 후 세션을 지운다. 로그인한 계정의 프로필은 /accounts/me/profile, 저장 목록·지원 계획·채팅은 /accounts/me/workspace를 사용한다. 작업공간 API가 포함된 백엔드를 먼저 배포해야 한다.

개인 데이터는 계정 전환 시 메모리에서 비우고 이전 요청을 취소한다. localStorage에는 테마만 유지하며 기존 익명 프로필·대화를 계정에 자동 귀속시키지 않는다. 저장은 revision 비교로 다른 탭의 변경을 보호한다. 오류는 화면에 표시하며 재시도하거나 명시적으로 서버 데이터를 다시 불러올 수 있다. 알림 화면은 계정 프로필과 실제 공고로 구성하는 추천 피드이며 푸시 전송은 제공하지 않는다.

프로필 편집은 서버가 지원하는 연령대·지역·학력·고용 상태·소득 구간·선호만 받는다. 정확한 나이나 소득을 구간에서 추정하지 않는다.

검증: npm test, npx tsc --noEmit, npm run lint, npm run build. 배포 프론트가 API와 다른 사이트인 경우 Google 승인 URI에 https://integrated-information-portal.vercel.app/api/session/auth/google/callback 을 추가한다. 해당 프론트에 세션 프록시를 먼저 배포하고 백엔드 GOOGLE_OAUTH_REDIRECT_URI를 같은 주소로 설정한 뒤 프론트 AUTH_SESSION_PROXY=true를 적용한다. 시작·콜백·세션 갱신·계정 요청 모두 프론트 도메인의 HttpOnly 쿠키를 사용한다. 로컬에서 localhost:8000 콜백을 쓰는 경우 프록시를 끈다.

## AI 입력

로그인 계정의 단일 거주 지역·학력·고용 상태를 검색 프로필로 보내며, 관심 분야·관심 지역·활동 방식은 추천 선호로 구분해 보낸다. 이메일·계정 식별자는 모델 입력에 넣지 않는다. 현재 검색 계약은 정확한 나이·소득만 지원하므로 연령대·소득 구간과 여러 거주지는 미상으로 유지한다. 개인 프로필 벡터 색인은 만들지 않으며, 범위 기반 자격 판정은 후속 확장이 필요하다.

## 로그인·프로필 화면

비로그인 홈은 카테고리 제한 없이 공개 공고를 최신 수집 갱신순으로 24건씩 조회한다. 로그인 후 홈은 기존 개인화 대시보드를 유지한다. 로그인 페이지에는 중앙 Google 버튼만 표시하고, 인증된 계정이 확인되면 홈으로 자동 이동한다. 버튼은 Google 공식 로고와 Google Sans, 공식 색상·여백 가이드를 사용한다.

상단 유저 아이콘 안에서 닉네임·이메일·로그아웃·프로필 수정에 접근한다. 닉네임은 백엔드가 최초 생성하며 PATCH /accounts/me로 수정한다. 프로필의 지역은 복수 선택 칩이고 선택 필드는 별도 화살표 여백을 확보한다.

회원탈퇴하기는 취소·저장 아래 회색 밑줄 버튼이다. 삭제 범위를 안내하고 ‘탈퇴’ 입력 후 DELETE /accounts/me를 호출한다. 성공한 경우에만 클라이언트 세션과 개인 데이터를 비운다. 계정과 프로필·스냅샷·저장 목록·지원 계획·대화·모든 세션이 삭제되며, 동시 요청의 재생성을 막기 위한 내부 삭제 표식만 남는다. Google 계정 자체를 삭제하는 기능은 아니다.

새 백엔드는 0003_account_nickname 마이그레이션이 필요하다. 로컬에서는 npm run dev:auth-api -- --migrate로 dev DB를 갱신할 수 있다. 운영 DB 마이그레이션과 배포는 별도로 수행해야 한다.
