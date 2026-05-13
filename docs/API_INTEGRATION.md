# API Integration

이 문서는 Remory 프론트의 API 연동 규칙, 도메인별 endpoint map, 백엔드 기능 대비 프론트 구현 상태를 정리합니다.

기준 자료:

- `../backend/docs/*`
- `http://141.164.48.128:8000/openapi.json`
- 현재 프론트 코드의 `src/services`, `src/types`, `src/pages`, `src/hooks`

주의: 이 문서의 endpoint는 확인된 backend docs/OpenAPI 기준만 사용합니다. 문서에 없는 request body나 response body는 만들지 않습니다.

## Base URL

REST:

```ts
import.meta.env.VITE_API_BASE_URL
```

기본값:

```text
/api/v1
```

WebSocket:

```ts
import.meta.env.VITE_WS_BASE_URL
```

기본값:

```text
/api/v1
```

로컬 개발 예시:

```env
VITE_API_BASE_URL=http://141.164.48.128:8000/api/v1
VITE_WS_BASE_URL=ws://141.164.48.128:8000/api/v1
```

## Auth와 Token 처리

- access token: `localStorage.remory_access_token`
- refresh token: 실제 응답에 있을 때만 `localStorage.remory_refresh_token`
- Authorization header: `Authorization: Bearer <access_token>`
- 401 응답 시 token을 제거하고 재로그인 flow로 이동할 수 있게 처리합니다.
- WebSocket 인증은 query string `token=<accessToken>`을 사용합니다.

## apiClient 규칙

파일: `src/services/apiClient.ts`

- 모든 REST 요청은 `apiClient` 또는 `apiRequest`를 통해 처리합니다.
- page component에서 직접 `fetch`를 사용하지 않습니다.
- `FormData` 요청은 `Content-Type`을 직접 지정하지 않습니다.
- JSON 요청은 `Content-Type: application/json`을 붙입니다.
- 204 응답은 `undefined`로 안전하게 처리합니다.
- JSON이 아닌 응답도 text 또는 blob으로 안전하게 처리합니다.
- 서버 error의 `detail`, `message`, FastAPI validation detail을 `ApiError`로 전달합니다.

## 도메인별 API Map

OpenAPI path는 `/api/v1` prefix를 포함해 확인되었습니다. 프론트 service에서는 `VITE_API_BASE_URL` 뒤에 domain path를 붙입니다.

| 도메인 | 확인된 endpoint |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/sign-up`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh-token`, `GET /auth/me` |
| Target | `GET /targets`, `POST /targets`, `GET /targets/{target_id}`, `PUT /targets/{target_id}`, `DELETE /targets/{target_id}` |
| TargetMedia | `GET /targets/{target_id}/media`, `POST /targets/{target_id}/media`, `GET /targets/{target_id}/media/{media_id}/file`, `DELETE /media/{media_id}` |
| ConsentLog | `GET /consents`, `POST /consents`, `GET /targets/{target_id}/consents`, `PATCH /consents/{consent_id}/revoke` |
| TargetVerificationRequest | `POST /targets/{target_id}/verification-requests`, `GET /targets/{target_id}/verification-requests`, `GET /verification-requests/{request_id}` |
| Persona | `POST /targets/{target_id}/persona`, `GET /personas/{persona_id}`, `GET /personas/{persona_id}/status` |
| PersonaVoiceProfile | `GET /personas/{persona_id}/voice-profile`, `POST /personas/{persona_id}/voice-profile`, `POST /personas/{persona_id}/voice-profile/evaluate`, `PATCH /personas/{persona_id}/voice-profile/user-confirm` |
| PersonaChat | `GET /personas/{persona_id}/chats`, `POST /personas/{persona_id}/chats` |
| PersonaMessage | `GET /chats/{chat_id}/messages`, `POST /chats/{chat_id}/messages`, `POST /chats/{chat_id}/audio`, `GET /chats/{chat_id}/messages/{message_id}/audio` |
| Voice WebSocket | `WS /ws/personas/{persona_id}/voice?token={accessToken}` under `VITE_WS_BASE_URL` |
| AIInterviewSession | `POST /interviews`, `GET /interviews/{session_id}`, `POST /interviews/{session_id}/questions`, `POST /interviews/{session_id}/answers` |
| PhotoMemory | `GET /photo-memories`, `POST /photo-memories`, `GET /photo-memories/{photo_memory_id}`, `DELETE /photo-memories/{photo_memory_id}`, `GET /photo-memories/{photo_memory_id}/image` |
| StoryBook / StoryChapter | `GET /storybooks`, `POST /storybooks`, `GET /storybooks/{storybook_id}`, `GET /storybooks/{storybook_id}/chapters`, `POST /storybooks/{storybook_id}/regenerate` |
| ShareLink | `POST /storybooks/{storybook_id}/share-links`, `GET /storybooks/{storybook_id}/share-links`, `GET /share/{token}`, `PATCH /share-links/{share_link_id}/disable` |
| MemoryGroup / GroupMember / GroupStoryBook | `GET /groups`, `POST /groups`, `GET /groups/{group_id}`, `GET /groups/{group_id}/members`, `POST /groups/{group_id}/members`, `GET /groups/{group_id}/storybooks`, `POST /groups/{group_id}/storybooks/{storybook_id}` |
| DeletionRequest | `GET /deletion-requests`, `POST /deletion-requests`, `GET /deletion-requests/{request_id}`, `PATCH /deletion-requests/{request_id}/cancel` |
| Report | `GET /reports`, `POST /reports`, `GET /reports/{report_id}` |
| Admin Verification | `GET /admin/verification-requests`, `GET /admin/verification-requests/{request_id}`, `GET /admin/verification-requests/{request_id}/file`, approve/reject/need-more-info/revoke action endpoints |
| Admin Report | `GET /admin/reports`, `GET /admin/reports/{report_id}`, reviewing/resolve/reject/action-taken action endpoints |
| Admin Audit/Limit | `GET /admin/audit-logs`, `GET /admin/usage-limits`, `PATCH /admin/users/{user_id}/usage-limit`, `PATCH /admin/personas/{persona_id}/usage-limit`, `GET /admin/rate-limit-events` |
| Admin VoiceProfile | `GET /admin/voice-profiles/{voice_profile_id}`, approve/reject/revoke action endpoints |
| Admin DeletionRequest | `GET /admin/deletion-requests`, `GET /admin/deletion-requests/{request_id}`, approve-and-process/reject action endpoints |

## Voice WebSocket Message

Client messages, backend docs 기준:

- `type: "start"`, `chat_id: number`
- `type: "audio_chunk"`, `data: base64 audio chunk`, `mime_type: "audio/webm"`
- `type: "end_utterance"`
- `type: "stop"`

Server messages, backend docs 기준:

- `type: "session_started"`, `session_id: number`
- `type: "partial_transcript"`, `text: string`
- `type: "final_transcript"`, `text: string`
- `type: "persona_text"`, `text: string`
- `type: "persona_audio"`, `audio_url` 또는 `audio_file_path`
- `type: "error"`, `message: string`
- `type: "session_ended"`

## 구현 상태 정의

| status | 의미 |
| --- | --- |
| `connected` | type/service/page가 있고 실제 backend endpoint를 사용합니다. |
| `partially-connected` | 실제 service 또는 page는 있으나 backend endpoint 제약, schema 불명확, 일부 flow 제한이 있습니다. |
| `mock-only` | backend 기능은 있으나 현재 주 route가 mock skeleton만 제공합니다. 현재 demo 브랜치의 주요 메뉴에는 가능한 한 남기지 않습니다. |
| `missing` | backend 기능은 있으나 프론트 type/service/page가 없습니다. |
| `removed` | backend에 없어 제거했거나 기존 backend 도메인으로 통합한 프론트 기능입니다. |

## 백엔드 기능 대비 프론트 구현 상태

| 기능 | 상태 | 프론트 파일 |
| --- | --- | --- |
| Auth | `connected` | `authService.ts`, `useAuth.ts`, `AuthPage.tsx` |
| RefreshToken | `connected` | `authService.ts`, token storage helpers |
| User me | `connected` | `authService.ts`, `useAuth.ts`, `MyPage.tsx` |
| Target | `connected` | `targetService.ts`, Target pages |
| TargetMedia | `connected` | `mediaService.ts`, `TargetMediaPage` |
| ConsentLog | `connected` | `consentService.ts`, `ConsentPage` |
| TargetVerificationRequest | `connected` | `verificationService.ts`, `TargetVerificationPage` |
| Persona | `partially-connected` | `personaService.ts`, Persona pages. 전역 list endpoint 없음. |
| PersonaVoiceProfile | `connected` | `voiceProfileService.ts`, `PersonaVoiceProfilePage` |
| PersonaChat | `connected` | `chatService.ts`, `PersonaChatPage` |
| PersonaMessage | `connected` | `chatService.ts`, `PersonaChatPage` |
| VoiceCall WebSocket | `connected` | `voiceSocketService.ts`, `useVoiceCall.ts`, `PersonaVoiceCallPage` |
| AIInterviewSession | `partially-connected` | `interviewService.ts`, Interview pages. 전체 list endpoint 없음. |
| PhotoMemory | `connected` | `photoMemoryService.ts`, PhotoMemory pages |
| StoryBook | `connected` | `storybookService.ts`, Storybook pages |
| StoryChapter | `connected` | `storybookService.ts`, Storybook detail |
| ShareLink | `connected` | `shareLinkService.ts`, Share pages |
| MemoryGroup | `connected` | `groupService.ts`, Group pages |
| GroupMember | `connected` | `groupService.ts`, Group detail |
| GroupStoryBook | `connected` | `groupService.ts`, Group detail |
| DeletionRequest | `connected` | `deletionService.ts`, `DeletionRequestPage` |
| Report | `connected` | `reportService.ts`, `ReportPage` |
| AuditLog | `connected` | `adminService.ts`, `AdminAuditLogsPage` |
| UsageLimit | `connected` | `adminService.ts`, `AdminDashboardPage` |
| RateLimit admin | `connected` | `adminService.ts`, `AdminAuditLogsPage` |
| Admin verification | `connected` | `adminService.ts`, `AdminVerificationReviewPage` |
| Admin report | `partially-connected` | `adminService.ts`, `AdminReportsPage`. 일부 response schema는 generic object 렌더링. |
| Admin voice profile | `connected` | `adminService.ts`, `AdminVoiceProfileReviewPage` |
| Campaigns | `removed` | backend domain 없음. |
| legacy ProfilePage | `removed` | My Account로 통합. |
| legacy StorybookPage | `removed` | `/storybooks/*` route로 통합. |
| 자동 setup 생성 flow | `removed` | Onboarding CTA로 대체. |
| StoryVoiceNarration | `removed` | backend endpoint 없음. |

## 백엔드에 없는 기능 제거 기준

- OpenAPI와 `../backend/docs`에 없는 기능은 새 route/page/service로 만들지 않습니다.
- 기존 프론트에만 있던 기능은 제거하거나 가장 가까운 backend 도메인으로 통합합니다.
- 실행 가능한 버튼처럼 보이지만 backend API가 없으면 disabled 처리하고 사유를 표시합니다.
- mock data를 실제 데이터처럼 localStorage에 저장하지 않습니다.
- 회원가입 또는 최초 진입 시 Target, ConsentLog, VerificationRequest, Persona, StoryBook을 자동 생성하지 않습니다.

## 서비스 파일별 역할

| 파일 | 역할 |
| --- | --- |
| `apiClient.ts` | base URL, auth header, JSON/FormData 처리, 204/error 처리 |
| `authService.ts`, `authApi.ts` | Auth, token, `/auth/me` |
| `targetService.ts`, `targetApi.ts` | Target CRUD |
| `mediaService.ts` | TargetMedia upload/list/delete |
| `consentService.ts` | ConsentLog list/create/revoke |
| `verificationService.ts` | TargetVerificationRequest submit/list/detail |
| `personaService.ts` | Persona create/detail/status |
| `voiceProfileService.ts` | PersonaVoiceProfile get/create/evaluate/confirm |
| `chatService.ts`, `chatApi.ts` | PersonaChat, PersonaMessage |
| `voiceSocketService.ts` | Voice WebSocket URL 생성과 connection |
| `interviewService.ts` | AIInterviewSession |
| `photoMemoryService.ts` | PhotoMemory |
| `storybookService.ts`, `storybookApi.ts` | StoryBook, StoryChapter. `storybookApi`는 compatibility wrapper입니다. |
| `shareLinkService.ts` | ShareLink와 public share |
| `groupService.ts` | MemoryGroup, GroupMember, GroupStoryBook |
| `deletionService.ts` | DeletionRequest |
| `reportService.ts` | Report |
| `adminService.ts` | Admin verification/report/audit/limit/rate/voice profile/deletion APIs |
| `personaSession.ts` | 기존 backend persona id discovery/cache. 새 Target/Persona 자동 생성은 하지 않습니다. |
| `mock/mockFeatureService.ts` | 개발용 mock skeleton data reader |
