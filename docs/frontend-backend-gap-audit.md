# Frontend Backend Gap Audit

작성일: 2026-05-14

## 기준 자료

- Backend docs: `../backend/docs/*`
- Frontend API map: `docs/frontend-api-map.md`
- OpenAPI: `http://141.164.48.128:8000/openapi.json`
- Frontend scan targets: `src/pages`, `src/services`, `src/types`, `src/data`, `src/hooks`

## 상태 정의

| status | 의미 |
| --- | --- |
| `fully-connected` | 실제 type/service/page가 있고 backend 명세 endpoint를 화면에서 사용한다. |
| `partially-connected` | 실제 service 또는 일부 화면 연결은 있지만 endpoint/flow 일부가 빠졌거나 legacy 화면에만 연결되어 있다. |
| `mock-only` | backend 기능은 있지만 현재 `mockFeaturePages` 또는 mock skeleton으로만 표시한다. |
| `missing` | backend 기능은 있지만 frontend type/service/page가 없다. |
| `frontend-only-remove` | backend docs/OpenAPI에 없는 frontend 기능이므로 제거 또는 backend 기능으로 통합해야 한다. |

## Backend Feature Coverage

| Backend 기능 | Backend source | Frontend files | status | next action | 감사 메모 |
| --- | --- | --- | --- | --- | --- |
| Auth | `/auth/register`, `/auth/sign-up`, `/auth/login`, `/auth/logout` | `src/types/auth.ts`, `src/services/authService.ts`, `src/hooks/useAuth.ts`, `src/pages/AuthPage.tsx` | `fully-connected` | `keep` | 회원가입/로그인/token 저장/logout 흐름이 실제 API 기준으로 연결되어 있다. |
| RefreshToken | `POST /auth/refresh-token` | `src/services/authService.ts` | `partially-connected` | `connect` | service는 있으나 공통 `apiClient` 자동 refresh retry 흐름은 없다. 필요하면 401 처리 정책 확정 후 연결한다. |
| User me | `GET /auth/me` | `src/services/authService.ts`, `src/hooks/useAuth.ts`, `HomePage`, `MyPage` | `fully-connected` | `keep` | UserResponse 기반 로그인 상태 확인에 사용한다. |
| Target | `GET/POST/PUT/DELETE /targets` | `src/types/target.ts`, `src/services/targetService.ts`, `DomainPages.tsx` Target pages | `fully-connected` | `keep` | 목록/생성/상세/수정/삭제 service가 있다. legacy `targetApi`도 동일 backend를 호출하므로 추후 merge 대상이다. |
| TargetMedia | `GET/POST /targets/{target_id}/media`, `DELETE /media/{media_id}` | `src/types/media.ts`, `src/services/mediaService.ts`, `TargetMediaPage` | `fully-connected` | `keep` | image/voice upload, list, delete가 실제 multipart 명세와 연결되어 있다. |
| ConsentLog | `/consents`, `/targets/{target_id}/consents`, `/consents/{consent_id}/revoke` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | backend 기능은 있으나 실제 type/service가 없다. |
| TargetVerificationRequest | `/targets/{target_id}/verification-requests`, `/verification-requests/{request_id}` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | multipart upload와 detail service가 필요하다. |
| Persona | `POST /targets/{target_id}/persona`, `GET /personas/{persona_id}`, `GET /personas/{persona_id}/status` | `src/types/persona.ts`, `src/services/personaService.ts`, Persona pages | `partially-connected` | `connect` | create/detail/status는 연결됨. backend에 persona list endpoint는 없으므로 `PersonaListPage`는 target 기반 discover 구조로 유지하거나 redesign 필요. |
| PersonaVoiceProfile | `/personas/{persona_id}/voice-profile*` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | create/get/evaluate/user-confirm service와 status UI 연결 필요. |
| PersonaChat | `POST/GET /personas/{persona_id}/chats` | `src/types/chat.ts`, `src/services/chatService.ts`, `PersonaChatPage`, legacy `chatApi` | `fully-connected` | `keep` | 채팅방 생성/목록이 실제 API로 연결되어 있다. |
| PersonaMessage | `GET/POST /chats/{chat_id}/messages`, `POST /chats/{chat_id}/audio` | `src/types/chat.ts`, `src/services/chatService.ts`, `PersonaChatPage` | `partially-connected` | `connect` | TEXT send/list는 연결됨. audio message service는 있으나 실제 page UI 연결은 불완전하다. |
| VoiceCall WebSocket | `WS /api/v1/ws/personas/{persona_id}/voice?token=...` | `src/types/voice.ts`, `src/services/voiceSocketService.ts`, `src/hooks/useVoiceCall.ts`, `PersonaVoiceCallPage` | `fully-connected` | `keep` | WebSocket base는 `VITE_WS_BASE_URL`을 사용한다. docs 기준 `chat_id` optional 여부는 UX 개선 시 반영 가능하다. |
| AIInterviewSession | `/interviews`, `/interviews/{session_id}/questions`, `/answers` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | session/question/answer type과 service가 필요하다. |
| PhotoMemory | `/photo-memories` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | multipart upload/list/detail/delete service가 없다. |
| StoryBook | `/storybooks`, `/storybooks/{storybook_id}`, `/regenerate` | `src/services/storybookApi.ts`, `StorybookPage`, mock storybook pages | `partially-connected` | `merge` | legacy `storybookApi`는 list/detail/create 일부만 연결됨. Domain route는 mock-only라 service/page 구조를 하나로 합쳐야 한다. |
| StoryChapter | `GET /storybooks/{storybook_id}/chapters` | `src/services/storybookApi.ts`, `StorybookPage`, mock storybook pages | `partially-connected` | `merge` | legacy page에서 chapter 조회를 사용하지만 Domain detail page는 mock-only다. |
| StoryVoiceNarration | 없음 | 없음 | `frontend-only-remove` | `remove` | backend docs/OpenAPI에 StoryVoiceNarration endpoint가 없다. 새 기능으로 유지/추가하지 않는다. |
| ShareLink | `/storybooks/{storybook_id}/share-links`, `/share/{token}`, `/share-links/{share_link_id}/disable` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | public share route/page와 shareLink service가 필요하다. |
| MemoryGroup | `/groups`, `/groups/{group_id}` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | group list/create/detail service가 없다. |
| GroupMember | `/groups/{group_id}/members` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | member list/add service가 없다. |
| GroupStoryBook | `/groups/{group_id}/storybooks*` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | group storybook share/list service가 없다. |
| DeletionRequest | `/deletion-requests*`, admin deletion endpoints | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | user/admin deletion service 분리가 필요하다. |
| Report | `/reports`, `/reports/{report_id}` | `src/data/mockFeaturePages.ts`, `MockFeaturePage` | `mock-only` | `connect` | user report create/list/detail service가 없다. |
| AuditLog | `GET /admin/audit-logs` | `src/data/mockFeaturePages.ts`, `AdminAuditLogsPage` | `mock-only` | `connect` | admin audit filter/page/service가 없다. |
| UsageLimit | `/admin/usage-limits`, `/admin/users/{user_id}/usage-limit`, `/admin/personas/{persona_id}/usage-limit` | `src/data/mockFeaturePages.ts`, `AdminDashboardPage` | `mock-only` | `split page` | dashboard mock에 섞여 있다. 별도 admin usage limit page/service로 분리 필요. |
| RateLimit admin | `GET /admin/rate-limit-events` | `src/data/mockFeaturePages.ts`, `AdminDashboardPage` | `mock-only` | `split page` | dashboard mock에 섞여 있다. rate limit event list page/service가 필요하다. |
| Admin verification | `/admin/verification-requests*` | `src/data/mockFeaturePages.ts`, `AdminVerificationReviewPage` | `mock-only` | `connect` | admin review actions와 file response 처리 service가 필요하다. |
| Admin report | `/admin/reports*` | `src/data/mockFeaturePages.ts`, `AdminReportsPage` | `mock-only` | `connect` | OpenAPI 일부 response schema가 구체적이지 않으므로 type은 확인 필요 주석과 함께 작성해야 한다. |
| Admin voice profile | `/admin/voice-profiles/{voice_profile_id}*` | `src/data/mockFeaturePages.ts`, `AdminDashboardPage` | `mock-only` | `split page` | dashboard mock endpoint 목록에만 있다. 별도 page/service로 분리 필요. |

## Frontend Only Or Legacy Surface

| Frontend 기능 | Files/routes | status | next action | 감사 메모 |
| --- | --- | --- | --- | --- |
| CampaignsPage | `/campaigns`, `src/pages/CampaignsPage.tsx` | `frontend-only-remove` | `remove` | backend docs/OpenAPI에 campaign 기능이 없다. |
| legacy ProfilePage | `/profile`, `src/pages/ProfilePage.tsx` | `frontend-only-remove` | `merge` | backend에는 Profile 도메인이 없다. Target/Persona/Media 상세 화면으로 통합한다. |
| legacy StorybookPage | `/storybook`, `src/pages/StorybookPage.tsx`, `src/services/storybookApi.ts` | `partially-connected` | `merge` | backend StoryBook 기능은 존재하지만 신규 `/storybooks/*` mock skeleton과 중복된다. 실제 연결 페이지 하나로 합친다. |
| legacy ChatPage | `/chat`, `src/pages/ChatPage.tsx`, `src/services/chatApi.ts`, `personaSession.ts` | `partially-connected` | `merge` | backend Chat 기능은 존재하지만 `/persona-chat` 실제 연결 페이지와 중복된다. 임의 Mom persona bootstrap 흐름은 제거 또는 명시적 Target/Persona 선택으로 redesign한다. |
| Setup flow | `/setup`, `src/pages/SetupPage.tsx` | `partially-connected` | `keep` | 2026-05-14 업데이트: 자동 Target/Media/Persona 생성과 setup localStorage 저장을 제거했고, Target/Verification/Consent/Media CTA 안내 페이지로 변경했다. |
| personaSession auto bootstrap | `src/services/personaSession.ts` | `frontend-only-remove` | `remove` | 2026-05-14 업데이트: 특정 이름의 target/persona를 자동 생성하던 흐름을 제거했다. 이제 저장된 persona_id 또는 기존 Target에 연결된 persona_id만 사용하고, 없으면 명시적 생성 안내 오류를 반환한다. |
| local gallery/profile mock data | `src/data/memoryGallery.ts`, `src/data/mockProfilePhotos.ts` | `frontend-only-remove` | `remove` | backend PhotoMemory/TargetMedia와 중복되는 프론트 전용 샘플 데이터다. 실제 API 연결 후 제거한다. |
| LandingPage | `/`, `src/pages/LandingPage.tsx` | `frontend-only-remove` | `keep` | backend 도메인 기능은 아니지만 public entry UI로만 남길 수 있다. backend API와 혼동되는 기능 CTA는 제거한다. |

## Service/Type Naming Gaps

| Area | Current | Target | Action |
| --- | --- | --- | --- |
| Auth | `authService`, `authApi` alias | `authService` | `merge` |
| Target | `targetService`, legacy `targetApi`, broad `types/api.ts` | `targetService`, `types/target.ts` | `merge` |
| Chat | `chatService`, legacy `chatApi`, broad `types/api.ts` | `chatService`, `types/chat.ts` | `merge` |
| StoryBook | `storybookApi` only, no typed service split | `storybookService`, `types/storybook.ts` | `connect` |
| Mock domains | `mockFeaturePages` | domain-specific services/types | `connect` |
| Admin | no `adminService` | `adminService`, `types/admin.ts` | `split page` |

## Priority Recommendations

1. Keep current connected core: Auth, User me, Target, TargetMedia, Persona detail/status/create, PersonaChat, PersonaMessage text, VoiceCall WebSocket.
2. Remove or merge frontend-only legacy routes before adding more UI: CampaignsPage, ProfilePage, old ChatPage, old StorybookPage, personaSession bootstrap, local gallery mocks.
3. Convert mock-only domains in backend order: ConsentLog and TargetVerificationRequest first, then PersonaVoiceProfile, then StoryBook/ShareLink/MemoryGroup, then Admin.
4. Split admin dashboard into real pages: verification review, reports, audit logs, usage limits, rate limit events, voice profile review.
5. Do not add StoryVoiceNarration until backend docs/OpenAPI expose an endpoint.

## Automatic Creation Removal Log

2026-05-14 기준으로 회원가입 또는 최초 진입 시 프론트가 임의 기본 데이터를 생성하는 흐름을 제거했다.

| 제거 항목 | 변경 파일 | 결과 |
| --- | --- | --- |
| 회원가입 직후 Target 조회 후 자동 setup 판정 | `src/pages/AuthPage.tsx` | 회원가입 성공 시 `/setup` 안내 화면으로 이동하고, 로그인 성공 시 `/home`으로 이동한다. Target/Persona 생성 호출은 없다. |
| SetupPage의 자동 Target 생성 | `src/pages/SetupPage.tsx` | 제거. 사용자는 `/targets/new`에서 직접 Target 생성 버튼을 눌러야 한다. |
| SetupPage의 자동 media upload | `src/pages/SetupPage.tsx` | 제거. 사용자는 `/target-media`에서 직접 업로드한다. |
| SetupPage의 자동 Persona 생성 | `src/pages/SetupPage.tsx` | 제거. Persona 생성은 Target detail 또는 Persona page의 명시 버튼에서만 수행한다. |
| SetupPage의 setup 완료/mock memory localStorage 저장 | `src/pages/SetupPage.tsx` | `remory_setup_completed`, `remory_setup_memory_notes` 저장 제거. |
| 최초 Home 진입 시 persona 자동 준비 | `src/pages/HomePage.tsx`, `src/services/personaSession.ts` | `ensureMomPersonaId()` 자동 호출 제거. 기존 persona가 없으면 대화 시작 대신 생성 안내를 표시한다. |
| 특정 이름 target/persona bootstrap | `src/services/personaSession.ts` | `createTarget`, `createPersona` 호출 제거. 기존 persona만 조회한다. |
| ChatPage 진입 시 채팅방 자동 생성 | `src/pages/ChatPage.tsx` | 기존 채팅방이 없으면 자동 생성하지 않고 `/persona-chat`에서 사용자가 직접 새 채팅을 시작하도록 안내한다. |

## Frontend-Only Cleanup Result

Updated on 2026-05-14.

| Item | Result | Current route/files | Action |
| --- | --- | --- | --- |
| CampaignsPage | Removed. Backend docs and OpenAPI do not expose a Campaign domain. Dashboard entry points should use backend-backed Remory domains such as Target, Persona, StoryBook, PhotoMemory, and Interview. | `/campaigns` removed, `src/pages/CampaignsPage.tsx` removed | `remove` |
| legacy ProfilePage | Removed and folded into MyPage. Backend exposes User me through Auth, not a separate Profile domain. | `/profile` removed, `src/pages/ProfilePage.tsx` removed, MyPage remains `/my` | `merge` |
| legacy StorybookPage | Removed and folded into the StoryBook domain pages. Backend StoryBook APIs remain represented by `/storybooks`, `/storybooks/create`, `/storybooks/detail`, and `/storybooks/share`. | `/storybook` removed, `src/pages/StorybookPage.tsx` and `src/pages/StorybookPage.css` removed | `merge` |
| SetupPage | Redefined as OnboardingPage. `/onboarding` is the canonical post-signup route; `/setup` remains as a compatibility alias and renders the same onboarding guide. | `src/pages/OnboardingPage.tsx`, `src/pages/OnboardingPage.css` | `redesign` |
| Mock-only action buttons | Buttons without connected backend services were either routed to a backend-backed domain page or disabled with an API-connection-planned notice. | Landing Google/guest/info disabled, MyPage menu cards disabled, Chat legacy storybook CTA disabled | `keep` until service connection |
| Legacy bottom nav StoryBook path | Updated from `/storybook` to `/storybooks`. | HomePage, ChatPage, MyPage | `merge` |

## Consent Verification Connection Update

Updated on 2026-05-14.

| Feature | Previous status | Current status | Frontend files | Action |
| --- | --- | --- | --- | --- |
| ConsentLog | `mock-only` | `fully-connected` | `src/types/consent.ts`, `src/services/consentService.ts`, `ConsentPage` in `src/pages/DomainPages.tsx` | `keep` |
| TargetVerificationRequest | `mock-only` | `fully-connected` | `src/types/verification.ts`, `src/services/verificationService.ts`, `TargetVerificationPage` in `src/pages/DomainPages.tsx` | `keep` |
| Persona creation gate | `partially-connected` | `partially-connected` | `TargetDetailPage` in `src/pages/DomainPages.tsx` | `connect` |

Notes:
- ConsentLog now uses `GET /targets/{target_id}/consents`, `POST /consents`, and `PATCH /consents/{consent_id}/revoke`.
- TargetVerificationRequest now uses `POST /targets/{target_id}/verification-requests`, `GET /targets/{target_id}/verification-requests`, and `GET /verification-requests/{request_id}`.
- Verification upload uses only the documented multipart field names: `verification_type_param`, `applicant_note`, and `file`.
- TargetDetailPage shows consent/verification gate status and disables Persona creation unless a verification request has `APPROVED` status.

## PersonaVoiceProfile Connection Update

Updated on 2026-05-14.

| Feature | Previous status | Current status | Frontend files | Action |
| --- | --- | --- | --- | --- |
| PersonaVoiceProfile | `mock-only` | `fully-connected` | `src/types/voiceProfile.ts`, `src/services/voiceProfileService.ts`, `PersonaVoiceProfilePage` in `src/pages/DomainPages.tsx` | `keep` |
| PersonaDetail voice profile card | `partially-connected` | `fully-connected` | `PersonaDetailCard` in `src/pages/DomainPages.tsx` | `keep` |
| VoiceCall profile gate | `fully-connected` WebSocket only | `fully-connected` with voice profile gate | `PersonaVoiceCallPage` in `src/pages/DomainPages.tsx` | `keep` |

Notes:
- PersonaVoiceProfile now uses `GET /personas/{persona_id}/voice-profile`, `POST /personas/{persona_id}/voice-profile`, `POST /personas/{persona_id}/voice-profile/evaluate`, and `PATCH /personas/{persona_id}/voice-profile/user-confirm`.
- Voice profile status enum is limited to `PENDING`, `PROCESSING`, `READY`, `FAILED`, `NEEDS_MORE_SAMPLES`, `REVOKED`.
- Voice profile review_status enum is limited to `NOT_REVIEWED`, `USER_CONFIRMED`, `ADMIN_APPROVED`, `REJECTED`.
- Voice call entry is allowed only when voice profile `status` is `READY` and `review_status` is `USER_CONFIRMED` or `ADMIN_APPROVED`.

## Interview PhotoMemory Connection Update

Updated on 2026-05-14.

| Feature | Previous status | Current status | Frontend files | Action |
| --- | --- | --- | --- | --- |
| AIInterviewSession | `mock-only` | `fully-connected` | `src/types/interview.ts`, `src/services/interviewService.ts`, `InterviewListPage`, `InterviewSessionPage` in `src/pages/DomainPages.tsx` | `keep` |
| PhotoMemory | `mock-only` | `fully-connected` | `src/types/photoMemory.ts`, `src/services/photoMemoryService.ts`, `PhotoMemoryListPage`, `PhotoMemoryUploadPage` in `src/pages/DomainPages.tsx` | `keep` |
| StoryBook source selection | `mock-only` | `partially-connected` | Interview and PhotoMemory pages link to `/storybooks/create` with documented source ids | `connect` |

Notes:
- Interview uses `POST /interviews`, `GET /interviews/{session_id}`, `POST /interviews/{session_id}/questions`, and `POST /interviews/{session_id}/answers`.
- OpenAPI does not expose an interview list endpoint, so `InterviewListPage` does not create a fake list. It provides session creation and source selection only.
- PhotoMemory uses `GET /photo-memories`, `POST /photo-memories`, `GET /photo-memories/{photo_memory_id}`, and `DELETE /photo-memories/{photo_memory_id}`.
- PhotoMemory upload uses only the documented multipart field names: `title`, `description`, `taken_at`, `location`, and `file`.
- No separate interview answer audio upload endpoint is documented; the UI only sends documented `answer_audio_path` when supplied.
