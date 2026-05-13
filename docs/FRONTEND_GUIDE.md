# Frontend Guide

이 문서는 Remory 프론트의 구조, 라우팅, UI/UX, 디자인 원칙을 설명합니다. API endpoint와 schema는 [API_INTEGRATION.md](API_INTEGRATION.md)를 기준으로 확인합니다.

## 폴더 구조

```text
src/
  App.tsx
  routes.tsx
  navigation.ts
  components/
    layout/
  pages/
    account/
    admin/
    compliance/
    conversations/
    groups/
    hubs/
    memories/
    personas/
    safety/
    sharing/
    storybooks/
    targets/
  services/
  types/
  hooks/
  utils/
  data/
```

- `routes.tsx`: 모든 route를 config로 관리합니다.
- `navigation.ts`: desktop sidebar와 mobile bottom nav 항목을 관리합니다.
- `components/layout`: AppShell, header, sidebar, bottom nav 등 공통 shell입니다.
- `pages/*`: route-level 화면입니다. 도메인 폴더는 대부분 `DomainPages.tsx`의 page export를 re-export합니다.
- `services/*`: API 호출 책임을 갖는 domain service입니다.
- `types/*`: backend request/response 기반 type입니다.
- `hooks/*`: 인증, 음성 통화 등 화면과 service 사이의 상태 로직입니다.
- `data/*`, `services/mock/*`: 개발용 mock skeleton 자산입니다. 실제 기능처럼 실행 가능한 버튼을 만들지 않습니다.

## 라우팅 구조

대표 route group:

| 그룹 | 주요 route |
| --- | --- |
| Public | `/`, `/auth`, `/share/{token}` |
| Dashboard | `/dashboard`, legacy `/home`, `/onboarding`, legacy `/setup` |
| Targets | `/targets`, `/targets/new`, `/targets/detail`, `/targets/media` |
| Verification & Consent | `/compliance`, `/compliance/consent`, `/compliance/verification` |
| Personas | `/personas`, `/personas/detail`, `/personas/voice-profile` |
| Conversations | `/conversations`, `/conversations/chat`, `/voice-call` |
| Memories | `/memories`, `/memories/interviews`, `/memories/interviews/session`, `/memories/photos`, `/memories/photos/upload` |
| Storybooks | `/storybooks`, `/storybooks/create`, `/storybooks/detail` |
| Sharing | `/sharing`, `/storybooks/share`, `/share/{token}` |
| Groups | `/groups`, `/groups/detail` |
| Safety | `/safety`, `/safety/deletion-requests`, `/safety/reports` |
| Account | `/account`, legacy `/my` |
| Admin | `/admin`, `/admin/verification`, `/admin/reports`, `/admin/audit-logs`, `/admin/voice-profiles` |

제거된 legacy route:

- `/campaigns`
- `/profile`
- singular `/storybook`

## 사용자 페이지 구조

사용자 기능은 다음 흐름을 중심으로 구성됩니다.

1. Auth: 회원가입/로그인
2. Onboarding: 자동 생성 없이 다음 행동 CTA 제공
3. Dashboard: 다음 작업, Persona gate checklist, StoryBook source 선택
4. Targets: 기억 대상 생성/상세/미디어 관리
5. Verification & Consent: 관계 입증과 동의 관리
6. Personas: Persona 생성/상태/voice profile 확인
7. Conversations: Persona chat
8. Voice Call: voice profile gate 통과 후 WebSocket 통화
9. Memories: interview와 photo memory 생성
10. Storybooks/Sharing/Groups: story 생성, 공유, 그룹 협업
11. Safety Center: 삭제 요청과 신고
12. My Account: 계정 정보와 로그아웃

## 관리자 페이지 구조

Admin은 일반 사용자 메뉴와 분리합니다. OpenAPI `UserResponse`에 role 필드가 없으므로 client-side role 추론을 만들지 않고, backend 403 응답을 권한 판단 기준으로 사용합니다.

Admin pages:

- `AdminDashboardPage`: usage limit과 rate/admin entry summary
- `AdminVerificationReviewPage`: verification request review
- `AdminReportsPage`: report review actions
- `AdminAuditLogsPage`: audit logs와 rate limit events
- `AdminVoiceProfileReviewPage`: voice profile review

## 공통 컴포넌트와 상태

- `AppShell`은 보호 route에서 공통 header, desktop nav, mobile bottom nav를 제공합니다.
- loading, error, empty state는 각 page에서 명시적으로 표시합니다.
- API 호출은 page에서 직접 하지 않고 `services`와 hook을 통해 수행합니다.
- file URL 변환은 `src/utils/fileUrl.ts`를 사용합니다.

## UI/UX 원칙

- 첫 화면은 실제 사용 가능한 dashboard 또는 기능 화면을 우선합니다.
- 백엔드에 없는 기능은 실제 실행 가능한 CTA로 보여주지 않습니다.
- 아직 연결 전인 개발용 mock skeleton은 API 연결 예정 badge와 disabled action을 함께 표시합니다.
- 사용자가 다음에 해야 할 행동을 Dashboard와 Onboarding에서 명확하게 제시합니다.
- 서버 error `detail`은 사용자가 이해할 수 있게 그대로 표시합니다.

## 반응형 디자인 기준

- 모바일: 하단 navigation 중심, single-column card layout
- 태블릿/데스크톱: sidebar navigation, 넓은 card/grid layout
- 주요 touch target은 44px 이상
- card, button, text가 작은 화면에서 겹치지 않도록 grid를 single-column으로 전환
- 이미지에는 `alt`를 제공합니다.
- `focus-visible` 스타일을 유지합니다.

## 디자인 톤

Remory의 현재 디자인은 "따뜻한 기억 플랫폼"을 기준으로 합니다.

- 색상: cream, ivory, soft coral, apricot, lavender, soft blue
- 너무 어두운 brown/sepia 사용은 줄입니다.
- 은은한 gradient와 부드러운 shadow를 사용합니다.
- 큰 여백, 둥근 card, 명확하지만 과하지 않은 CTA를 유지합니다.
- Admin 화면은 감성보다 명확성, 정보 밀도, 상태 구분을 우선합니다.

전역 token은 `src/index.css`에 있고, 주요 화면 스타일은 `AppShell.css`, `HomePage.css`, `AuthPage.css`, `DomainPages.css`, `ChatPage.css`에 분산되어 있습니다.

## 주요 사용자 플로우

### 회원가입 후

1. `AuthPage`에서 회원가입 API 호출
2. access token 저장
3. refresh token이 실제 응답에 있을 때만 저장
4. `/onboarding`으로 이동
5. 사용자가 직접 Target 생성, 관계 입증, 동의 관리, 미디어 업로드 중 선택

회원가입 직후 Target, ConsentLog, VerificationRequest, Persona, StoryBook을 자동 생성하지 않습니다.

### Persona 생성 전 Gate Flow

1. Target 생성
2. Target media 업로드
3. ConsentLog 동의 상태 확인
4. TargetVerificationRequest 제출
5. verification status가 `APPROVED`인지 확인
6. 조건을 만족하면 Persona 생성 CTA 활성화
7. Persona가 `READY`일 때 chat/voice 관련 CTA 활성화
8. Voice call은 voice profile이 `READY`이고 review status가 사용자 확인 또는 admin 승인 상태일 때만 진입 허용

### StoryBook 생성 Flow

1. PhotoMemory 또는 AIInterviewSession source 선택
2. `source_type`과 source id 입력
3. StoryBook 생성
4. StoryChapter 목록 확인
5. 필요하면 regenerate
6. ShareLink 생성 또는 Group에 공유
