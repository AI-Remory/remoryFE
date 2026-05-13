# Frontend Final Checklist

작성일: 2026-05-14

이 문서는 `demo` 브랜치의 백엔드 정합성, 기능 연결, UI 구조, 디자인 변경 상태를 최종 점검한 결과다. 검증은 로컬 코드, route/service 구조, build/lint 결과 기준으로 수행했다. 실제 계정이 필요한 로그인, 파일 업로드, WebSocket 음성 통화의 라이브 smoke test는 별도 테스트 계정과 브라우저 권한 환경에서 추가 확인이 필요하다.

## 검증 결과 요약

| 항목 | 결과 | 확인 내용 |
| --- | --- | --- |
| `npm run build` | pass | `tsc -b && vite build` 통과. TypeScript 오류 없음. |
| `npm run lint` | pass | `eslint .` 통과. 사용하지 않는 import/변수 lint 오류 없음. |
| README conflict marker | pass | `<<<<<<<`, `=======`, `>>>>>>>` 검색 결과 없음. |
| 백엔드 IP 하드코딩 | pass | `src` 코드에서 `http://141.164.48.128:8000` 검색 결과 없음. |
| env 기반 REST URL | pass | `src/services/apiClient.ts`가 `VITE_API_BASE_URL`을 사용하고 기본값은 `/api/v1`. |
| env 기반 WebSocket URL | pass | `src/services/apiClient.ts`와 `voiceSocketService.ts`가 `VITE_WS_BASE_URL` 기반으로 URL 생성. |
| 페이지 직접 `fetch` | pass | `fetch(`는 `src/services/apiClient.ts`에만 존재. |
| 백엔드에 없는 route 제거 | pass | `/campaigns`, `/profile`, singular `/storybook` legacy route 없음. |
| CampaignsPage | pass | `CampaignsPage` 파일/route 없음. Dashboard 도메인 카드 흐름으로 통합. |
| legacy ProfilePage | pass | `ProfilePage` 파일/route 없음. Account/MyPage 흐름으로 통합. |
| legacy StorybookPage | pass | `StorybookPage` 파일/route 없음. `/storybooks/*` 도메인 route로 통합. |
| 회원가입 자동 데이터 생성 | pass | `AuthPage`는 회원가입 후 `/onboarding` 이동만 수행. Target/Consent/Verification/Persona/StoryBook 자동 생성 없음. |
| localStorage mock 저장 | pass | mock 데이터를 실제 데이터처럼 저장하는 setup flow 없음. `personaSession`은 기존 backend id 캐시만 수행하고 새 데이터 생성은 하지 않음. |
| Auth 연결 | pass | `authService`, `useAuth`, `AuthPage`가 회원가입/로그인/로그아웃/내 정보 조회 흐름 유지. |
| Target 연결 | pass | `targetService`와 Target list/create/detail/update/delete page 흐름 유지. |
| TargetMedia 연결 | pass | `mediaService`와 Target별 목록, 사진/음성 multipart upload, 삭제 흐름 유지. |
| Verification/Consent 연결 | pass | `verificationService`, `consentService`와 관련 page 연결 유지. |
| Persona 생성 gate | pass | Target detail에서 consent/verification 상태와 Persona 생성 gate 표시 구조 유지. |
| PersonaChat 연결 | pass | `chatService`와 채팅방 생성/목록, 메시지 조회/전송 흐름 유지. |
| PersonaVoiceCall WebSocket | pass | `voiceSocketService`, `useVoiceCall`, `PersonaVoiceCallPage` 연결 구조 유지. |
| mock-only UI | pass | 개발용 mock skeleton은 `API connection planned` 배지와 비활성화 안내를 유지. |
| 디자인 변경 | pass | 전역 token, AppShell, Dashboard, Auth, 도메인 카드, Chat/Voice UI가 밝은 ivory/coral/lavender/soft blue 톤으로 정리됨. |

## 기능 연결 상태

### 실제 연결 완료

- Auth: 회원가입, 로그인, 로그아웃, access token 저장, refresh token 응답 저장, 내 정보 조회
- User me: `/auth/me` 기반 인증 상태 확인
- Target: 목록, 생성, 상세, 수정, 삭제
- TargetMedia: Target별 사진/음성 목록, 업로드, 삭제
- ConsentLog: Target별 동의 목록, 동의 생성, 철회
- TargetVerificationRequest: 관계 입증 요청 제출, 목록, 상세
- Persona: Target 기반 생성, 상세, status 조회, 생성 gate 표시
- PersonaVoiceProfile: 조회, 생성 요청, 평가 요청, 사용자 확인, voice call gate
- PersonaChat / PersonaMessage: 채팅방 생성/목록, 메시지 목록, 텍스트 메시지 전송, audio 응답 렌더링
- VoiceCall WebSocket: `VITE_WS_BASE_URL + /ws/personas/{persona_id}/voice?token=...`
- AIInterviewSession: 세션 생성, 상세 조회, 질문 생성, 답변 저장
- PhotoMemory: 목록, 업로드, 상세, 삭제
- StoryBook / StoryChapter: 목록, 생성, 상세, chapter 목록, 재생성
- ShareLink: 생성, 목록, 공개 token 조회, 비활성화
- MemoryGroup / GroupMember / GroupStoryBook: 그룹 생성/조회, 멤버 추가/목록, StoryBook 공유/목록
- DeletionRequest: 생성, 목록, 상세, 취소
- Report: 생성, 목록, 상세
- Admin: verification review, reports, audit logs, usage limits, rate limit events, voice profile review

### 부분 연결 또는 주의 대상

- Admin report 응답은 OpenAPI 일부가 구체 schema가 아닌 object 형태라 일반 필드 렌더링과 TODO를 유지한다.
- Persona 전체 목록 endpoint가 없으므로 Persona list는 Target 기반 discovery와 상세 흐름 중심이다.
- Interview 전체 목록 endpoint가 없으므로 Interview list는 세션 생성과 session id 직접 조회 중심이다.
- 라이브 API 동작 검증은 테스트 계정, 업로드 파일, 마이크 권한이 준비된 브라우저 환경에서 추가로 수행해야 한다.

## 제거 또는 통합 확인

| 대상 | 결과 |
| --- | --- |
| CampaignsPage / `/campaigns` | 제거됨. 백엔드 도메인에 없는 Campaign 기능은 유지하지 않음. |
| legacy ProfilePage / `/profile` | 제거됨. MyPage/Account로 통합. |
| legacy StorybookPage / `/storybook` | 제거됨. `/storybooks`, `/storybooks/create`, `/storybooks/detail`, `/storybooks/share`로 통합. |
| 자동 setup 생성 flow | 제거됨. Onboarding은 CTA 안내만 제공하고 실제 생성은 사용자가 명시적으로 실행할 때만 수행. |
| 백엔드에 없는 실행 버튼 | 제거 또는 disabled 처리. mock-only skeleton은 API 연결 예정 안내를 표시. |

## 디자인 최종 상태

- `src/index.css`에 Remory 전역 token을 정리했다.
- 주요 palette는 cream, ivory, soft coral, apricot, lavender, soft blue 중심이다.
- AppShell은 데스크톱 사이드바와 모바일 bottom nav를 유지하면서 더 밝은 표면과 부드러운 shadow로 변경됐다.
- Dashboard, AuthPage, Target/Persona 카드, Chat/VoiceCall 화면, StoryBook 계열 카드가 현대적인 기억 플랫폼 톤으로 정리됐다.
- Admin 화면은 감성적 장식보다 정보 구분, badge, panel 구조 중심으로 유지했다.
- 버튼 최소 높이 44px, focus-visible, label 기반 form 구조는 유지한다.

## 검증 명령

```bash
npm run build
npm run lint
```

최종 실행 결과:

- `npm run build`: pass
- `npm run lint`: pass

## 참고 문서

- [frontend-api-map.md](frontend-api-map.md)
- [frontend-backend-gap-audit.md](frontend-backend-gap-audit.md)
- [frontend-deployment.md](frontend-deployment.md)
