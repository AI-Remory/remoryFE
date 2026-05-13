# Remory Frontend API Map

작성일: 2026-05-13

## 기준 자료

- `../backend/docs/02-backend-api.md`
- `../backend/docs/03-frontend-integration.md`
- `../backend/docs/04-auth-and-permission.md`
- `../backend/docs/05-verification-consent-flow.md`
- `../backend/docs/06-realtime-voice-chat.md`
- `../backend/docs/08-deployment.md`
- `frontend/docs/agent-harness/API.md`
- `frontend/docs/agent-harness/FRONTEND.md`
- `frontend/docs/agent-harness/SECURITY.md`
- `http://141.164.48.128:8000/openapi.json`

## 공통 규칙

- REST base path: `/api/v1`
- 프론트 REST base URL: `import.meta.env.VITE_API_BASE_URL`
- 프론트 WebSocket base URL: `import.meta.env.VITE_WS_BASE_URL`
- 인증 방식: `Authorization: Bearer <access_token>`
- WebSocket 인증: query string `token=<access_token>`
- 공통 validation error: `422 HTTPValidationError`
- 일반 에러: 백엔드 문서 기준 `{"detail": "..."}` 또는 FastAPI validation 배열 `{"detail": [...]}`
- owner-only 기준: `../backend/docs/04-auth-and-permission.md`의 owner-only 표 기준
- role 조건: OpenAPI에는 role 스키마가 별도로 표시되지 않으며, 백엔드 문서 기준 일반 API는 `user`, `/admin/*`는 `admin`
- 프론트 화면 연결은 현재 `src/pages` 기준 매핑이며, 명세가 아닌 경우 `추정`으로 표시한다.

## 연결 우선순위

| 우선순위 | 도메인 | 프론트 처리 방향 |
| --- | --- | --- |
| 1순위 | Auth, User | 실제 API 연결 |
| 2순위 | Target, TargetMedia, Persona | 실제 API 연결 |
| 3순위 | PersonaChat, PersonaMessage | 실제 API 연결 |
| 4순위 | Voice WebSocket | 실제 WebSocket 연결 |
| 5순위 | 나머지 기능 | mock page skeleton 우선 |

## Auth

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 회원가입 | POST | `/auth/register` | No | 없음 | No | 없음 | 없음 | `RegisterRequest`: `email*`, `nickname*`, `password*` | No | `201 AuthResponse`: `access_token*`, `refresh_token*`, `token_type`, `user*` | `422 HTTPValidationError`, 기타 `detail` | `AuthPage` | 1순위 | `/auth/sign-up` alias와 프론트에서 어느 endpoint를 표준으로 쓸지 확인 필요 |
| 회원가입 alias | POST | `/auth/sign-up` | No | 없음 | No | 없음 | 없음 | `RegisterRequest`: `email*`, `nickname*`, `password*` | No | `201 AuthResponse` | `422 HTTPValidationError`, 기타 `detail` | `AuthPage` | 1순위 | alias 유지 여부 확인 필요 |
| 로그인 | POST | `/auth/login` | No | 없음 | No | 없음 | 없음 | `LoginRequest`: `email*`, `password*` | No | `200 AuthResponse` | `422 HTTPValidationError`, 기타 `detail` | `AuthPage` | 1순위 | 없음 |
| 토큰 갱신 | POST | `/auth/refresh-token` | No | 없음 | No | 없음 | 없음 | `RefreshTokenRequest`: `refresh_token*` | No | `200 TokenResponse`: `access_token*`, `refresh_token*`, `token_type` | `422 HTTPValidationError`, 기타 `detail` | 공통 API client | 1순위 | refresh 실패 시 로그아웃 처리 정책 확인 필요 |
| 로그아웃 | POST | `/auth/logout` | No | 없음 | No | 없음 | 없음 | `LogoutRequest`: `refresh_token*` | No | `200 MessageResponse`: `message*` | `422 HTTPValidationError`, 기타 `detail` | `AuthPage`, `MyPage` 추정 | 1순위 | 현재 프론트에서 서버 logout 호출까지 할지 확인 필요 |

## User

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 내 사용자 정보 조회 | GET | `/auth/me` | Yes | user/admin | 본인 토큰 기준 | 없음 | 없음 | 없음 | No | `200 UserResponse`: `id*`, `email*`, `nickname*`, `created_at*`, `updated_at*` | `401`, 기타 `detail` | `MyPage`, `ProfilePage` 추정 | 1순위 | 별도 `/users/me` endpoint 없음 |

## Target

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Target 생성 | POST | `/targets` | Yes | user/admin | 생성자는 owner | 없음 | 없음 | `TargetCreateRequest`: `name*`, `description`, `target_type` default `other` | No | `201 TargetResponse` | `401/403/422`, 기타 `detail` | `SetupPage` | 2순위 | 없음 |
| Target 목록 | GET | `/targets` | Yes | user/admin | 자기 Target만 | 없음 | `skip`, `limit` | 없음 | No | `200 PaginatedResponse<TargetResponse>` | `401/403/422`, 기타 `detail` | `HomePage`, `MyPage` 추정 | 2순위 | 기본 pagination 값은 OpenAPI default 확인 필요 |
| Target 상세 | GET | `/targets/{target_id}` | Yes | user/admin | `Target.user_id` | `target_id*` integer | 없음 | 없음 | No | `200 TargetDetailResponse`: Target fields + `media_count`, `has_persona` | `401/403/404/422`, 기타 `detail` | `ProfilePage`, `SetupPage` 추정 | 2순위 | 없음 |
| Target 수정 | PUT | `/targets/{target_id}` | Yes | user/admin | `Target.user_id` | `target_id*` integer | 없음 | `TargetUpdateRequest`: `name`, `description`, `target_type` | No | `200 TargetResponse` | `401/403/404/422`, 기타 `detail` | `ProfilePage`, `SetupPage` 추정 | 2순위 | 없음 |
| Target 삭제 | DELETE | `/targets/{target_id}` | Yes | user/admin | `Target.user_id` | `target_id*` integer | 없음 | 없음 | No | `204 No Content` | `401/403/404/422`, 기타 `detail` | `MyPage` 추정 | 2순위 | hard delete인지 soft delete인지 확인 필요 |

## TargetMedia

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Target media 업로드 | POST | `/targets/{target_id}/media` | Yes | user/admin | target owner | `target_id*` integer | 없음 | form fields: `media_type*` (`image` or `voice`), `file*` | Yes | `201 MediaUploadResponse` | `401/403/404/422`, 기타 `detail` | `SetupPage`, `ProfilePage` 추정 | 2순위 | 파일 크기/확장자 제한은 설정값 확인 필요 |
| Target media 목록 | GET | `/targets/{target_id}/media` | Yes | user/admin | target owner | `target_id*` integer | 없음 | 없음 | No | `200 TargetMediaResponse[]` | `401/403/404/422`, 기타 `detail` | `ProfilePage`, `SeasonPhotoArchive` 관련 화면 추정 | 2순위 | 이미지/음성 URL을 `file_path` 그대로 쓸지 별도 static base가 있는지 확인 필요 |
| Media 삭제 | DELETE | `/media/{media_id}` | Yes | user/admin | media의 target owner | `media_id*` integer | 없음 | 없음 | No | `200 MediaDeleteResponse`: `message` | `401/403/404/422`, 기타 `detail` | `ProfilePage` 추정 | 2순위 | 없음 |

## ConsentLog

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 내 동의 목록 | GET | `/consents` | Yes | user/admin | `ConsentLog.user_id` | 없음 | 없음 | 없음 | No | `200 ConsentResponse[]` | `401/403`, 기타 `detail` | `MyPage` 추정 | 5순위 | skeleton 우선 |
| 동의 생성 | POST | `/consents` | Yes | user/admin | 생성 user 기준 또는 target owner | 없음 | 없음 | `ConsentCreate`: `target_id`, `consent_type*`, `consent_version`, `consent_text_snapshot`, `is_agreed`, `is_consented`, `details` | No | `201 ConsentResponse` | `401/403/422`, 기타 `detail` | `SetupPage` 추정 | 5순위 | `is_agreed`와 `is_consented` 중 프론트 표준 필드 확인 필요 |
| Target별 동의 목록 | GET | `/targets/{target_id}/consents` | Yes | user/admin | target owner | `target_id*` integer | 없음 | 없음 | No | `200 ConsentResponse[]` | `401/403/404/422`, 기타 `detail` | `ProfilePage`, `SetupPage` 추정 | 5순위 | skeleton 우선 |
| 동의 철회 | PATCH | `/consents/{consent_id}/revoke` | Yes | user/admin | consent owner 또는 target owner | `consent_id*` integer | 없음 | 없음 | No | `200 ConsentRevokeResponse` | `401/403/404/422`, 기타 `detail` | `MyPage` 추정 | 5순위 | 없음 |

## TargetVerificationRequest

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 검증 요청 생성 | POST | `/targets/{target_id}/verification-requests` | Yes | user/admin | target owner | `target_id*` integer | 없음 | form fields: `verification_type_param*`, `applicant_note`, `file*` | Yes | `201 VerificationRequestResponse` | `401/403/404/422`, 기타 `detail` | `SetupPage` 추정 | 5순위 | 검증 파일 허용 타입/크기 확인 필요 |
| Target 검증 요청 목록 | GET | `/targets/{target_id}/verification-requests` | Yes | user/admin | target owner | `target_id*` integer | `skip`, `limit` | 없음 | No | `200 PaginatedResponse<VerificationRequestResponse>` | `401/403/404/422`, 기타 `detail` | `ProfilePage`, `SetupPage` 추정 | 5순위 | skeleton 우선 |
| 검증 요청 상세 | GET | `/verification-requests/{request_id}` | Yes | user/admin | request owner 또는 target owner | `request_id*` integer | 없음 | 없음 | No | `200 VerificationRequestDetailResponse` | `401/403/404/422`, 기타 `detail` | `ProfilePage` 추정 | 5순위 | 없음 |

## Persona

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Persona 생성 | POST | `/targets/{target_id}/persona` | Yes | user/admin | target owner | `target_id*` integer | 없음 | 없음 | No | `201 PersonaDetailResponse` | `401/403/404/422`, 기타 `detail` | `SetupPage`, `ChatPage` 진입 전 | 2순위 | 생성 조건 실패 시 detail 메시지 종류 확인 필요 |
| Persona 상세 | GET | `/personas/{persona_id}` | Yes | user/admin | persona의 target owner | `persona_id*` integer | 없음 | 없음 | No | `200 PersonaDetailResponse`: `status`, `persona_name`, `speaking_style`, `memory_summary`, `voice_profile` 등 | `401/403/404/422`, 기타 `detail` | `ChatPage`, `ProfilePage` 추정 | 2순위 | 없음 |
| Persona 상태 | GET | `/personas/{persona_id}/status` | Yes | user/admin | persona의 target owner | `persona_id*` integer | 없음 | 없음 | No | `200 PersonaStatusResponse`: `persona_id*`, `target_id*`, `status*` | `401/403/404/422`, 기타 `detail` | `ChatPage` | 2순위 | polling 주기 확인 필요 |

## PersonaVoiceProfile

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Voice profile 생성 | POST | `/personas/{persona_id}/voice-profile` | Yes | user/admin | persona의 target owner | `persona_id*` integer | 없음 | 없음 | No | `201 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | `ProfilePage`, `ChatPage` 추정 | 5순위 | voice sample은 TargetMedia voice 업로드 기반인지 확인 필요 |
| Voice profile 조회 | GET | `/personas/{persona_id}/voice-profile` | Yes | user/admin | persona의 target owner | `persona_id*` integer | 없음 | 없음 | No | `200 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | `ProfilePage`, `ChatPage` 추정 | 5순위 | 없음 |
| Voice profile 평가 | POST | `/personas/{persona_id}/voice-profile/evaluate` | Yes | user/admin | persona의 target owner | `persona_id*` integer | 없음 | 없음 | No | `200 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | `ProfilePage` 추정 | 5순위 | 평가 소요 시간/비동기 여부 확인 필요 |
| Voice profile 사용자 확인 | PATCH | `/personas/{persona_id}/voice-profile/user-confirm` | Yes | user/admin | persona의 target owner | `persona_id*` integer | 없음 | `VoiceProfileReviewRequest`: `review_note` | No | `200 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | `ProfilePage` 추정 | 5순위 | 없음 |

## PersonaChat

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Persona chat 생성 | POST | `/personas/{persona_id}/chats` | Yes | user/admin | persona owner | `persona_id*` integer | 없음 | `PersonaChatCreateRequest`: `title` | No | `201 PersonaChatResponse` | `401/403/404/422`, 기타 `detail` | `ChatPage` | 3순위 | title null일 때 서버 기본값 확인 필요 |
| Persona chat 목록 | GET | `/personas/{persona_id}/chats` | Yes | user/admin | persona owner | `persona_id*` integer | 없음 | 없음 | No | `200 PersonaChatResponse[]` | `401/403/404/422`, 기타 `detail` | `ChatPage` | 3순위 | pagination 없음 |

## PersonaMessage

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 텍스트 메시지 생성 | POST | `/chats/{chat_id}/messages` | Yes | user/admin | chat owner 또는 persona owner | `chat_id*` integer | 없음 | `PersonaMessageCreateRequest`: `message_type` default `TEXT`, `content`, `audio_file_path`, `generate_audio` | No | `201 PersonaMessagePairResponse`: `user_message*`, `persona_message*` | `401/403/404/422`, 기타 `detail` | `ChatPage` | 3순위 | `generate_audio` 기본값 확인 필요 |
| 메시지 목록 | GET | `/chats/{chat_id}/messages` | Yes | user/admin | chat owner 또는 persona owner | `chat_id*` integer | 없음 | 없음 | No | `200 PersonaMessageResponse[]` | `401/403/404/422`, 기타 `detail` | `ChatPage` | 3순위 | pagination 없음 |
| 오디오 메시지 생성 | POST | `/chats/{chat_id}/audio` | Yes | user/admin | chat owner 또는 persona owner | `chat_id*` integer | 없음 | form fields: `file*`, `generate_audio` | Yes | `201 PersonaMessagePairResponse` | `401/403/404/422`, 기타 `detail` | `ChatPage` | 3순위 | 지원 mime type 확인 필요 |

## AIInterviewSession

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 인터뷰 세션 생성 | POST | `/interviews` | Yes | user/admin | 생성 user 기준 | 없음 | 없음 | `AIInterviewSessionCreateRequest`: `session_type*`, `title`, `target_id`, `photo_memory_id` | No | `201 AIInterviewSessionResponse` | `401/403/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 현재 프론트 화면 없음 |
| 인터뷰 세션 상세 | GET | `/interviews/{session_id}` | Yes | user/admin | session owner | `session_id*` integer | 없음 | 없음 | No | `200 AIInterviewSessionDetailResponse` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 현재 프론트 화면 없음 |
| 인터뷰 질문 생성 | POST | `/interviews/{session_id}/questions` | Yes | user/admin | session owner | `session_id*` integer | 없음 | `AIInterviewQuestionCreateRequest` 또는 `null`: `question_type` | No | `201 AIInterviewQuestionResponse` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | null body 허용 UI 처리 확인 필요 |
| 인터뷰 답변 생성 | POST | `/interviews/{session_id}/answers` | Yes | user/admin | session owner | `session_id*` integer | 없음 | `AIInterviewAnswerCreateRequest`: `question_id*`, `answer_text`, `answer_audio_path` | No | `201 AIInterviewAnswerResponse` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 오디오 답변 업로드 endpoint 별도 존재 여부 확인 필요 |

## PhotoMemory

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 사진 기억 목록 | GET | `/photo-memories` | Yes | user/admin | `PhotoMemory.user_id` | 없음 | 없음 | 없음 | No | `200 PhotoMemoryResponse[]` | `401/403`, 기타 `detail` | `HomePage`, `SeasonPhotoArchive` 추정 | 5순위 | pagination 없음 |
| 사진 기억 생성 | POST | `/photo-memories` | Yes | user/admin | 생성 user 기준 | 없음 | 없음 | form fields: `title*`, `description`, `taken_at`, `location`, `file*` | Yes | `201 PhotoMemoryResponse` | `401/403/422`, 기타 `detail` | `HomePage`, `SetupPage` 추정 | 5순위 | `taken_at` 형식은 OpenAPI상 string/date-time 여부 확인 필요 |
| 사진 기억 상세 | GET | `/photo-memories/{photo_memory_id}` | Yes | user/admin | `PhotoMemory.user_id` | `photo_memory_id*` integer | 없음 | 없음 | No | `200 PhotoMemoryResponse` | `401/403/404/422`, 기타 `detail` | `HomePage`, `StorybookPage` 추정 | 5순위 | 없음 |
| 사진 기억 삭제 | DELETE | `/photo-memories/{photo_memory_id}` | Yes | user/admin | `PhotoMemory.user_id` | `photo_memory_id*` integer | 없음 | 없음 | No | `200 PhotoMemoryDeleteResponse`: `message` | `401/403/404/422`, 기타 `detail` | `HomePage`, `MyPage` 추정 | 5순위 | 없음 |

## StoryBook

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 스토리북 목록 | GET | `/storybooks` | Yes | user/admin | `StoryBook.user_id` | 없음 | 없음 | 없음 | No | `200 StoryBookResponse[]` | `401/403`, 기타 `detail` | `StorybookPage` | 5순위 | pagination 없음 |
| 스토리북 생성 | POST | `/storybooks` | Yes | user/admin | 생성 user 기준 | 없음 | 없음 | `StoryBookCreateRequest`: `title*`, `interview_session_id`, `photo_memory_id`, `visibility` default `PRIVATE` | No | `201 StoryBookDetailResponse` | `401/403/422`, 기타 `detail` | `StorybookPage` | 5순위 | 생성 source 우선순위 확인 필요 |
| 스토리북 상세 | GET | `/storybooks/{storybook_id}` | Yes | user/admin | `StoryBook.user_id` | `storybook_id*` integer | 없음 | 없음 | No | `200 StoryBookDetailResponse` | `401/403/404/422`, 기타 `detail` | `StorybookPage` | 5순위 | 없음 |
| 스토리북 재생성 | POST | `/storybooks/{storybook_id}/regenerate` | Yes | user/admin | `StoryBook.user_id` | `storybook_id*` integer | 없음 | 없음 | No | `200 StoryBookDetailResponse` | `401/403/404/422`, 기타 `detail` | `StorybookPage` | 5순위 | 비동기 처리 여부 확인 필요 |

## StoryChapter

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 스토리북 챕터 목록 | GET | `/storybooks/{storybook_id}/chapters` | Yes | user/admin | storybook owner | `storybook_id*` integer | 없음 | 없음 | No | `200 StoryChapterResponse[]` | `401/403/404/422`, 기타 `detail` | `StorybookPage` | 5순위 | 챕터 CRUD endpoint는 OpenAPI에 없음 |

## ShareLink

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 공유 링크 생성 | POST | `/storybooks/{storybook_id}/share-links` | Yes | user/admin | storybook owner | `storybook_id*` integer | 없음 | `ShareLinkCreateRequest` 또는 `null`: `expires_at` | No | `201 ShareLinkResponse` | `401/403/404/422`, 기타 `detail` | `StorybookPage` 추정 | 5순위 | null body 허용 UI 처리 확인 필요 |
| 공유 링크 목록 | GET | `/storybooks/{storybook_id}/share-links` | Yes | user/admin | storybook owner | `storybook_id*` integer | 없음 | 없음 | No | `200 ShareLinkResponse[]` | `401/403/404/422`, 기타 `detail` | `StorybookPage` 추정 | 5순위 | 없음 |
| 공개 공유 스토리북 조회 | GET | `/share/{token}` | No | 없음 | No | `token*` string | 없음 | 없음 | No | `200 PublicSharedStoryBookResponse` | `404/422`, 기타 `detail` | public share page 필요 | 5순위 | 현재 프론트 route 없음 |
| 공유 링크 비활성화 | PATCH | `/share-links/{share_link_id}/disable` | Yes | user/admin | share link의 storybook owner | `share_link_id*` integer | 없음 | 없음 | No | `200 ShareLinkDisableResponse` | `401/403/404/422`, 기타 `detail` | `StorybookPage` 추정 | 5순위 | 없음 |

## MemoryGroup

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 그룹 목록 | GET | `/groups` | Yes | user/admin | owner/member 권한 | 없음 | 없음 | 없음 | No | `200 MemoryGroupResponse[]` | `401/403`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 현재 프론트 화면 없음 |
| 그룹 생성 | POST | `/groups` | Yes | user/admin | 생성자는 owner | 없음 | 없음 | `MemoryGroupCreateRequest`: `name*`, `description` | No | `201 MemoryGroupResponse` | `401/403/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 없음 |
| 그룹 상세 | GET | `/groups/{group_id}` | Yes | user/admin | owner/member 권한 | `group_id*` integer | 없음 | 없음 | No | `200 MemoryGroupDetailResponse` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 없음 |
| 그룹 멤버 추가 | POST | `/groups/{group_id}/members` | Yes | user/admin | group owner 추정 | `group_id*` integer | 없음 | `GroupMemberCreateRequest`: `user_id*`, `role` default `MEMBER` | No | `201 GroupMemberResponse` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | role별 권한은 문서상 세부 확인 필요 |
| 그룹 멤버 목록 | GET | `/groups/{group_id}/members` | Yes | user/admin | owner/member 권한 | `group_id*` integer | 없음 | 없음 | No | `200 GroupMemberResponse[]` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 없음 |
| 그룹에 스토리북 공유 | POST | `/groups/{group_id}/storybooks/{storybook_id}` | Yes | user/admin | group 권한 + storybook owner 추정 | `group_id*`, `storybook_id*` integer | 없음 | 없음 | No | `201 GroupStoryBookResponse` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 정확한 권한 조합 확인 필요 |
| 그룹 스토리북 목록 | GET | `/groups/{group_id}/storybooks` | Yes | user/admin | owner/member 권한 | `group_id*` integer | 없음 | 없음 | No | `200 GroupStoryBookListItemResponse[]` | `401/403/404/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 없음 |

## DeletionRequest

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 삭제 요청 목록 | GET | `/deletion-requests` | Yes | user/admin | `DeletionRequest.user_id` | 없음 | 없음 | 없음 | No | `200 DeletionRequestResponse[]` | `401/403`, 기타 `detail` | `MyPage` 추정 | 5순위 | skeleton 우선 |
| 삭제 요청 생성 | POST | `/deletion-requests` | Yes | user/admin | 생성 user 기준 | 없음 | 없음 | `DeletionRequestCreateRequest`: `target_type*`, `target_id`, `reason` | No | `201 DeletionRequestResponse` | `401/403/422`, 기타 `detail` | `MyPage` 추정 | 5순위 | 계정 삭제 시 `target_id` null 허용 여부 확인 필요 |
| 삭제 요청 상세 | GET | `/deletion-requests/{request_id}` | Yes | user/admin | request owner | `request_id*` integer | 없음 | 없음 | No | `200 DeletionRequestResponse` | `401/403/404/422`, 기타 `detail` | `MyPage` 추정 | 5순위 | 없음 |
| 삭제 요청 취소 | PATCH | `/deletion-requests/{request_id}/cancel` | Yes | user/admin | request owner | `request_id*` integer | 없음 | 없음 | No | `200 DeletionRequestResponse` | `401/403/404/422`, 기타 `detail` | `MyPage` 추정 | 5순위 | 취소 가능 상태 확인 필요 |

## Report

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 신고 생성 | POST | `/reports` | Yes | user/admin | reporter 기준 | 없음 | 없음 | `CreateReportRequest`: `target_type*`, `target_id*`, `reason_type*`, `reason_detail` | No | `200 ReportResponse` | `401/403/422`, 기타 `detail` | mock page skeleton 추정 | 5순위 | 성공 status가 문서에는 `ReportResponse`, OpenAPI에는 `200`임 |
| 내 신고 목록 | GET | `/reports` | Yes | user/admin | reporter 기준 | 없음 | `page`, `size` | 없음 | No | `200 PaginatedResponse<ReportResponse>` | `401/403/422`, 기타 `detail` | `MyPage` 추정 | 5순위 | skeleton 우선 |
| 내 신고 상세 | GET | `/reports/{report_id}` | Yes | user/admin | reporter 기준 | `report_id*` integer | 없음 | 없음 | No | `200 ReportResponse` | `401/403/404/422`, 기타 `detail` | `MyPage` 추정 | 5순위 | 없음 |

## AuditLog

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Audit log 목록 | GET | `/admin/audit-logs` | Yes | admin | No | 없음 | `action`, `actor_user_id`, `target_type`, `target_id`, `start_date`, `end_date`, `page`, `size` | 없음 | No | `200 PaginatedResponse<AuditLogResponse>` | `401/403/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 관리자 화면 없음 |

## Admin

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 관리자 검증 요청 목록 | GET | `/admin/verification-requests` | Yes | admin | No | 없음 | `status`, `page`, `size` | 없음 | No | `200 PaginatedResponse<VerificationRequestAdminResponse>` | `401/403/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 관리자 화면 없음 |
| 관리자 검증 요청 상세 | GET | `/admin/verification-requests/{request_id}` | Yes | admin | No | `request_id*` integer | 없음 | 없음 | No | `200 VerificationRequestAdminResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 검증 파일 조회 | GET | `/admin/verification-requests/{request_id}/file` | Yes | admin | No | `request_id*` integer | 없음 | 없음 | No | `200` file response | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 파일 응답 content-type 확인 필요 |
| 관리자 검증 승인 | PATCH | `/admin/verification-requests/{request_id}/approve` | Yes | admin | No | `request_id*` integer | 없음 | `VerificationRequestApproveRequest` 또는 `null`: `admin_note`, `expires_at` | No | `200 VerificationRequestAdminResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | null body 처리 확인 필요 |
| 관리자 검증 거절 | PATCH | `/admin/verification-requests/{request_id}/reject` | Yes | admin | No | `request_id*` integer | 없음 | `VerificationRequestRejectRequest`: `rejection_reason*`, `admin_note` | No | `200 VerificationRequestAdminResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 추가 정보 요청 | PATCH | `/admin/verification-requests/{request_id}/need-more-info` | Yes | admin | No | `request_id*` integer | 없음 | `VerificationRequestNeedMoreInfoRequest`: `admin_note*` | No | `200 VerificationRequestAdminResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 검증 철회 | PATCH | `/admin/verification-requests/{request_id}/revoke` | Yes | admin | No | `request_id*` integer | 없음 | `VerificationRequestRevokeRequest` 또는 `null`: `admin_note` | No | `200 VerificationRequestAdminResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 삭제 요청 목록 | GET | `/admin/deletion-requests` | Yes | admin | No | 없음 | `status` | 없음 | No | `200 DeletionRequestResponse[]` | `401/403/422`, 기타 `detail` | admin mock page skeleton | 5순위 | pagination 없음 |
| 관리자 삭제 요청 상세 | GET | `/admin/deletion-requests/{request_id}` | Yes | admin | No | `request_id*` integer | 없음 | 없음 | No | `200 DeletionRequestResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 삭제 승인 처리 | PATCH | `/admin/deletion-requests/{request_id}/approve-and-process` | Yes | admin | No | `request_id*` integer | `admin_note` | 없음 | No | `200 DeletionRequestResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | `admin_note`는 query param |
| 관리자 삭제 거절 | PATCH | `/admin/deletion-requests/{request_id}/reject` | Yes | admin | No | `request_id*` integer | `admin_note` | 없음 | No | `200 DeletionRequestResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | `admin_note`는 query param |
| 사용량 제한 목록 | GET | `/admin/usage-limits` | Yes | admin | No | 없음 | `user_id`, `page`, `size` | 없음 | No | `200 PaginatedResponse<UsageLimitResponse>` | `401/403/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 사용자 사용량 제한 수정 | PATCH | `/admin/users/{user_id}/usage-limit` | Yes | admin | No | `user_id*` integer | 없음 | `UpdateUsageLimitRequest`: `voice_generation_limit`, `stt_request_limit`, `voice_call_seconds_limit` | No | `200 UsageLimitResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| Persona 사용량 제한 수정 | PATCH | `/admin/personas/{persona_id}/usage-limit` | Yes | admin | No | `persona_id*` integer | 없음 | `UpdatePersonaUsageLimitRequest`: `voice_generation_limit`, `voice_call_seconds_limit` | No | `200 PersonaUsageLimitResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| Rate limit event 목록 | GET | `/admin/rate-limit-events` | Yes | admin | No | 없음 | `user_id`, `page`, `size` | 없음 | No | `200 PaginatedResponse<RateLimitEventResponse>` | `401/403/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 신고 목록 | GET | `/admin/reports` | Yes | admin | No | 없음 | `status`, `page`, `size` | 없음 | No | `200 PaginatedResponse` | `401/403/422`, 기타 `detail` | admin mock page skeleton | 5순위 | OpenAPI response item schema가 구체화되지 않음 |
| 관리자 신고 상세 | GET | `/admin/reports/{report_id}` | Yes | admin | No | `report_id*` integer | 없음 | 없음 | No | `200` object | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | response schema 확인 필요 |
| 관리자 신고 검토중 처리 | PATCH | `/admin/reports/{report_id}/reviewing` | Yes | admin | No | `report_id*` integer | 없음 | object 또는 `null` | No | `200` object | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | request/response schema 확인 필요 |
| 관리자 신고 해결 | PATCH | `/admin/reports/{report_id}/resolve` | Yes | admin | No | `report_id*` integer | 없음 | object 또는 `null` | No | `200` object | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | request/response schema 확인 필요 |
| 관리자 신고 거절 | PATCH | `/admin/reports/{report_id}/reject` | Yes | admin | No | `report_id*` integer | 없음 | object 또는 `null` | No | `200` object | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | request/response schema 확인 필요 |
| 관리자 신고 조치 완료 | PATCH | `/admin/reports/{report_id}/action-taken` | Yes | admin | No | `report_id*` integer | 없음 | object 또는 `null` | No | `200` object | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | request/response schema 확인 필요 |
| 관리자 Voice profile 조회 | GET | `/admin/voice-profiles/{voice_profile_id}` | Yes | admin | No | `voice_profile_id*` integer | 없음 | 없음 | No | `200 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 Voice profile 승인 | PATCH | `/admin/voice-profiles/{voice_profile_id}/approve` | Yes | admin | No | `voice_profile_id*` integer | 없음 | `VoiceProfileReviewRequest`: `review_note` | No | `200 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 Voice profile 거절 | PATCH | `/admin/voice-profiles/{voice_profile_id}/reject` | Yes | admin | No | `voice_profile_id*` integer | 없음 | `VoiceProfileReviewRequest`: `review_note` | No | `200 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |
| 관리자 Voice profile 철회 | PATCH | `/admin/voice-profiles/{voice_profile_id}/revoke` | Yes | admin | No | `voice_profile_id*` integer | 없음 | `VoiceProfileReviewRequest`: `review_note` | No | `200 PersonaVoiceProfileResponse` | `401/403/404/422`, 기타 `detail` | admin mock page skeleton | 5순위 | 없음 |

## Voice WebSocket

WebSocket은 OpenAPI에 없고 `../backend/docs/06-realtime-voice-chat.md` 기준이다.

| 기능명 | method | path | auth required | role 조건 | owner-only | path params | query params | request body | multipart/form-data | success response | error response | 프론트에서 연결할 화면 | 연결 우선순위 | 확인 필요 사항 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Persona 음성 통화 WebSocket 연결 | WS | `/ws/personas/{persona_id}/voice` | Yes | user/admin | persona의 target owner | `persona_id*` integer | `token*` access token | client message JSON: `start`, `audio_chunk`, `end_utterance`, `stop` | No | server message JSON: `session_started`, `final_transcript`, `persona_text`, `persona_audio`, `session_ended` | WS close `1008`, server `error` message | `ChatPage` | 4순위 | `VITE_WS_BASE_URL`가 상대경로(`/api/v1`)일 때 client에서 현재 origin 기반 `ws(s)://`로 변환 필요 |

### Voice WebSocket Client Message

| type | payload | 확인 필요 사항 |
| --- | --- | --- |
| `start` | `{ "type": "start", "chat_id": 1 }` | `chat_id`는 선택값. 없으면 서버가 `Voice call` title chat 생성 |
| `audio_chunk` | `{ "type": "audio_chunk", "mime_type": "audio/webm", "data": "base64-encoded-audio" }` | 지원 mime: 문서상 `audio/webm`, `audio/wav`, `audio/mpeg`, `audio/mp4`, 기타 기본 `.webm` |
| `end_utterance` | `{ "type": "end_utterance" }` | STT -> persona reply -> cloned voice/TTS 처리 |
| `stop` | `{ "type": "stop" }` | 서버가 `session_ended` 후 정상 close |

### Voice WebSocket Server Message

| type | payload | 프론트 처리 |
| --- | --- | --- |
| `session_started` | `{ "type": "session_started", "session_id": 1 }` | 세션 상태 저장 |
| `final_transcript` | `{ "type": "final_transcript", "text": "..." }` | 사용자 음성 인식 결과 표시 |
| `persona_text` | `{ "type": "persona_text", "text": "..." }` | persona 답변 텍스트 표시 |
| `persona_audio` | `{ "type": "persona_audio", "audio_url": "...", "audio_file_path": "..." }` | audio 재생. `audio_url` base 처리 확인 필요 |
| `session_ended` | `{ "type": "session_ended" }` | 통화 종료 UI |
| `error` | `{ "type": "error", "message": "..." }` | 에러 표시 |

## 주요 Schema 메모

| schema | fields |
| --- | --- |
| `TargetResponse` | `id*`, `user_id*`, `name*`, `description*`, `target_type*`, `profile_image_path*`, `is_deleted*`, `created_at*`, `updated_at*` |
| `TargetMediaResponse` | `id*`, `target_id*`, `uploaded_by*`, `media_type*`, `original_filename*`, `stored_filename*`, `file_path*`, `mime_type*`, `file_size*`, `duration_seconds*`, `is_deleted*`, timestamps |
| `PersonaDetailResponse` | `id*`, `target_id*`, `status*`, `persona_name*`, `speaking_style*`, `personality_summary*`, `memory_summary*`, `system_prompt*`, `is_voice_profile_created*`, `is_consent_required*`, `voice_profile` |
| `PersonaVoiceProfileResponse` | `id*`, `persona_id*`, `target_id`, `status`, `review_status`, `reference_audio_count`, `quality_score`, `sample_audio_path`, `voice_id`, `metadata`, timestamps |
| `PersonaMessageResponse` | `id*`, `chat_id*`, `sender_type*`, `message_type*`, `content*`, `audio_file_path*`, `is_ai_generated*`, `created_at*`, `deleted_at*` |
| `StoryBookDetailResponse` | `id*`, `user_id*`, `photo_memory_id*`, `interview_session_id*`, `title*`, `summary*`, `source_type*`, `status*`, `visibility*`, `chapters` |

## Enum 메모

| enum | values |
| --- | --- |
| `TargetType` | `parent`, `grandparent`, `friend`, `romantic`, `self`, `other` |
| `MediaType` | `image`, `voice` |
| `VerificationType` | `FAMILY_RELATION_CERTIFICATE`, `ID_CARD`, `SELF_DECLARATION`, `OTHER` |
| `VerificationStatus` | `PENDING`, `NEED_MORE_INFO`, `APPROVED`, `REJECTED`, `EXPIRED`, `REVOKED` |
| `PersonaStatus` | `PENDING`, `READY`, `FAILED` |
| `VoiceProfileStatus` | `PENDING`, `PROCESSING`, `READY`, `FAILED`, `NEEDS_MORE_SAMPLES`, `REVOKED` |
| `VoiceProfileReviewStatus` | `NOT_REVIEWED`, `USER_CONFIRMED`, `ADMIN_APPROVED`, `REJECTED` |
| `MessageType` | `TEXT`, `AUDIO` |
| `SenderType` | `USER`, `PERSONA`, `SYSTEM` |
| `InterviewType` | `TARGET_PROFILE`, `PHOTO_MEMORY`, `SELF_STORY` |
| `StoryBookVisibility` | `PRIVATE`, `LINK`, `GROUP`, `PUBLIC` |
| `DeletionStatus` | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REJECTED`, `CANCELLED` |
| `GroupMemberRole` | `OWNER`, `MEMBER`, `VIEWER` |
| `ReportStatus` | `PENDING`, `REVIEWING`, `RESOLVED`, `REJECTED`, `ACTION_TAKEN` |
