# Remory Frontend API Integration Matrix

기준 문서
- `../backend/docs/02-backend-api.md`
- `../backend/docs/03-frontend-integration.md`
- `http://141.164.48.128:8000/openapi.json`

검증 기준 상태 값
- `connected`
- `partially-connected`
- `backend-pending`
- `missing`
- `incorrect`
- `backend-not-supported`
- `intentionally-disabled`

주의
- 페이지 컴포넌트에서 직접 `fetch` 호출 금지(현재 `src/services/apiClient.ts`에서만 사용).
- 서비스 계층에서만 API 호출.
- 백엔드 문서에 없는 기능은 실제 기능처럼 노출하지 않음.

## 통합 표

| 도메인 | 기능명 | method | path | 프론트 service 함수명 | 사용 page | request type | response type | 연결 상태 | 수정 필요 여부 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | 회원가입 | POST | `/auth/register` | `authService.register` | `AuthPage` | `RegisterRequest` | `AuthResponse` | connected | N |
| Auth | 로그인 | POST | `/auth/login` | `authService.login` | `AuthPage` | `LoginRequest` | `AuthResponse` | connected | N |
| Auth | 내 정보 | GET | `/auth/me` | `authService.me` | `useAuth`, `HomePage`, `MyPage` | - | `UserResponse` | connected | N |
| Auth | 토큰 재발급 | POST | `/auth/refresh-token` | `authService.refreshToken` | `useAuth` | `RefreshTokenRequest` | `TokenResponse` | connected | N |
| Auth | 로그아웃 | POST | `/auth/logout` | `authService.logout` | `AppShell`, `MyPage` | `LogoutRequest` | `MessageResponse` | connected | N |
| Target | 대상 목록 | GET | `/targets` | `targetService.listTargets` | `TargetListPage`, `HomePage` | `TargetListParams` | `PaginatedTargetResponse` | connected | N |
| Target | 대상 생성 | POST | `/targets` | `targetService.createTarget` | `TargetCreatePage` | `TargetCreateRequest` | `TargetResponse` | connected | N |
| Target | 대상 상세 | GET | `/targets/{target_id}` | `targetService.getTarget` | `TargetDetailPage` | - | `TargetDetailResponse` | connected | N |
| Target | 대상 수정 | PUT | `/targets/{target_id}` | `targetService.updateTarget` | `TargetDetailPage` | `TargetUpdateRequest` | `TargetResponse` | connected | N |
| Target | 대상 삭제 | DELETE | `/targets/{target_id}` | `targetService.deleteTarget` | `TargetDetailPage` | - | `204` | connected | N |
| TargetMedia | 미디어 목록 | GET | `/targets/{target_id}/media` | `mediaService.listTargetMedia` | `TargetMediaPage` | - | `TargetMediaResponse[]` | connected | N |
| TargetMedia | 미디어 업로드 | POST | `/targets/{target_id}/media` | `mediaService.uploadTargetMedia` | `TargetMediaPage` | `multipart(media_type,file)` | `MediaUploadResponse` | connected | N |
| TargetMedia | 미디어 삭제 | DELETE | `/media/{media_id}` | `mediaService.deleteMedia` | `TargetMediaPage` | - | `MediaDeleteResponse` | connected | N |
| ConsentLog | 동의 목록(전체) | GET | `/consents` | `consentService.listConsents` | `ConsentPage` | - | `ConsentResponse[]` | connected | N |
| ConsentLog | 동의 목록(대상별) | GET | `/targets/{target_id}/consents` | `consentService.listTargetConsents` | `ConsentPage`, `HomePage` | - | `ConsentResponse[]` | connected | N |
| ConsentLog | 동의 생성 | POST | `/consents` | `consentService.createConsent` | `ConsentPage` | `ConsentCreate` | `ConsentResponse` | connected | N |
| ConsentLog | 동의 철회 | PATCH | `/consents/{consent_id}/revoke` | `consentService.revokeConsent` | `ConsentPage` | - | `ConsentRevokeResponse` | connected | N |
| Verification | 입증 요청 목록 | GET | `/targets/{target_id}/verification-requests` | `verificationService.listTargetVerificationRequests` | `TargetVerificationPage`, `HomePage` | `VerificationListParams` | `PaginatedVerificationRequestResponse` | connected | N |
| Verification | 입증 요청 상세 | GET | `/verification-requests/{request_id}` | `verificationService.getVerificationRequest` | `TargetVerificationPage` | - | `VerificationRequestDetailResponse` | connected | N |
| Verification | 입증 요청 생성 | POST | `/targets/{target_id}/verification-requests` | `verificationService.createVerificationRequest` | `TargetVerificationPage` | `multipart(verification_type_param,applicant_note,file)` | `VerificationRequestResponse` | connected | N |
| Persona | 페르소나 생성 | POST | `/targets/{target_id}/persona` | `personaService.createPersona` | `TargetDetailPage`, `PersonaListPage` | - | `PersonaDetailResponse` | connected | N |
| Persona | 페르소나 상세 | GET | `/personas/{persona_id}` | `personaService.getPersona` | `PersonaDetailPage` | - | `PersonaDetailResponse` | connected | N |
| Persona | 페르소나 상태 | GET | `/personas/{persona_id}/status` | `personaService.getPersonaStatus` | `PersonaDetailPage` | - | `PersonaStatusResponse` | connected | N |
| PersonaVoiceProfile | 프로필 조회 | GET | `/personas/{persona_id}/voice-profile` | `voiceProfileService.getVoiceProfile` | `PersonaVoiceProfilePage` | - | `PersonaVoiceProfileResponse` | connected | N |
| PersonaVoiceProfile | 프로필 생성 | POST | `/personas/{persona_id}/voice-profile` | `voiceProfileService.createVoiceProfile` | `PersonaVoiceProfilePage` | - | `PersonaVoiceProfileResponse` | connected | N |
| PersonaVoiceProfile | 품질 평가 | POST | `/personas/{persona_id}/voice-profile/evaluate` | `voiceProfileService.evaluateVoiceProfile` | `PersonaVoiceProfilePage` | - | `PersonaVoiceProfileResponse` | connected | N |
| PersonaVoiceProfile | 사용자 확정 | PATCH | `/personas/{persona_id}/voice-profile/user-confirm` | `voiceProfileService.confirmVoiceProfile` | `PersonaVoiceProfilePage` | `VoiceProfileReviewRequest` | `PersonaVoiceProfileResponse` | connected | N |
| PersonaChat | 채팅 생성 | POST | `/personas/{persona_id}/chats` | `chatService.createPersonaChat` | `PersonaChatPage` | `PersonaChatCreateRequest` | `PersonaChatResponse` | connected | N |
| PersonaChat | 채팅 목록 | GET | `/personas/{persona_id}/chats` | `chatService.listPersonaChats` | `PersonaChatPage` | - | `PersonaChatResponse[]` | connected | N |
| PersonaMessage | 메시지 목록 | GET | `/chats/{chat_id}/messages` | `chatService.listChatMessages` | `PersonaChatPage` | - | `PersonaMessageResponse[]` | connected | N |
| PersonaMessage | 텍스트 전송 | POST | `/chats/{chat_id}/messages` | `chatService.createChatMessage` | `PersonaChatPage` | `PersonaMessageCreateRequest` | `PersonaMessagePairResponse` | connected | N |
| PersonaMessage | 오디오 전송 | POST | `/chats/{chat_id}/audio` | `chatService.createChatAudioMessage` | `PersonaChatPage` | `multipart(file,generate_audio)` | `PersonaMessagePairResponse` | connected | N |
| VoiceCall WS | 세션 연결/전송 | WS | `/ws/personas/{persona_id}/voice?token=...` | `voiceSocketService`, `useVoiceCall` | `PersonaVoiceCallPage` | `start/audio_chunk/end_utterance/stop` | `session_started/.../session_ended` | connected | N |
| AIInterview | 세션 생성 | POST | `/interviews` | `interviewService.createSession` | `InterviewListPage` | `AIInterviewSessionCreateRequest` | `AIInterviewSessionResponse` | connected | N |
| AIInterview | 세션 상세 | GET | `/interviews/{session_id}` | `interviewService.getSession` | `InterviewSessionPage` | - | `AIInterviewSessionDetailResponse` | connected | N |
| AIInterview | 질문 생성 | POST | `/interviews/{session_id}/questions` | `interviewService.createQuestion` | `InterviewSessionPage` | `AIInterviewQuestionCreateRequest?` | `AIInterviewQuestionResponse` | connected | N |
| AIInterview | 답변 생성 | POST | `/interviews/{session_id}/answers` | `interviewService.createAnswer` | `InterviewSessionPage` | `AIInterviewAnswerCreateRequest` | `AIInterviewAnswerResponse` | connected | N |
| PhotoMemory | 목록 | GET | `/photo-memories` | `photoMemoryService.listPhotoMemories` | `PhotoMemoryListPage` | - | `PhotoMemoryResponse[]` | connected | N |
| PhotoMemory | 상세 | GET | `/photo-memories/{photo_memory_id}` | `photoMemoryService.getPhotoMemory` | `PhotoMemoryListPage` | - | `PhotoMemoryResponse` | connected | N |
| PhotoMemory | 업로드 | POST | `/photo-memories` | `photoMemoryService.createPhotoMemory` | `PhotoMemoryUploadPage` | `multipart(title,description,taken_at,location,file)` | `PhotoMemoryResponse` | connected | N |
| PhotoMemory | 삭제 | DELETE | `/photo-memories/{photo_memory_id}` | `photoMemoryService.deletePhotoMemory` | `PhotoMemoryListPage` | - | `PhotoMemoryDeleteResponse` | connected | N |
| StoryBook | 목록 | GET | `/storybooks` | `storybookService.listStorybooks` | `StorybookListPage` | - | `StoryBookResponse[]` | connected | N |
| StoryBook | 생성 | POST | `/storybooks` | `storybookService.createStorybook` | `StorybookCreatePage` | `StoryBookCreateRequest` | `StoryBookDetailResponse` | connected | N |
| StoryBook | 상세 | GET | `/storybooks/{storybook_id}` | `storybookService.getStorybook` | `StorybookDetailPage` | - | `StoryBookDetailResponse` | connected | N |
| StoryBook | 챕터 목록 | GET | `/storybooks/{storybook_id}/chapters` | `storybookService.listChapters` | `StorybookDetailPage` | - | `StoryChapterResponse[]` | connected | N |
| StoryBook | 재생성 | POST | `/storybooks/{storybook_id}/regenerate` | `storybookService.regenerateStorybook` | `StorybookDetailPage` | - | `StoryBookDetailResponse` | connected | N |
| ShareLink | 링크 생성 | POST | `/storybooks/{storybook_id}/share-links` | `shareLinkService.createShareLink` | `StorybookSharePage` | `ShareLinkCreateRequest?` | `ShareLinkResponse` | connected | N |
| ShareLink | 링크 목록 | GET | `/storybooks/{storybook_id}/share-links` | `shareLinkService.listShareLinks` | `StorybookSharePage` | - | `ShareLinkResponse[]` | connected | N |
| ShareLink | 공개 조회 | GET | `/share/{token}` | `shareLinkService.getPublicSharedStorybook` | `PublicSharePage` | - | `PublicSharedStoryBookResponse` | connected | N |
| ShareLink | 링크 비활성화 | PATCH | `/share-links/{share_link_id}/disable` | `shareLinkService.disableShareLink` | `StorybookSharePage` | - | `ShareLinkDisableResponse` | connected | N |
| MemoryGroup | 그룹 목록 | GET | `/groups` | `groupService.listGroups` | `MemoryGroupListPage` | - | `MemoryGroupResponse[]` | connected | N |
| MemoryGroup | 그룹 생성 | POST | `/groups` | `groupService.createGroup` | `MemoryGroupListPage` | `MemoryGroupCreateRequest` | `MemoryGroupResponse` | connected | N |
| MemoryGroup | 그룹 상세 | GET | `/groups/{group_id}` | `groupService.getGroup` | `MemoryGroupDetailPage` | - | `MemoryGroupDetailResponse` | connected | N |
| GroupMember | 멤버 추가 | POST | `/groups/{group_id}/members` | `groupService.addGroupMember` | `MemoryGroupDetailPage` | `GroupMemberCreateRequest` | `GroupMemberResponse` | connected | N |
| GroupMember | 멤버 목록 | GET | `/groups/{group_id}/members` | `groupService.listGroupMembers` | `MemoryGroupDetailPage` | - | `GroupMemberResponse[]` | connected | N |
| GroupStoryBook | 그룹 공유 | POST | `/groups/{group_id}/storybooks/{storybook_id}` | `groupService.shareStorybookToGroup` | `MemoryGroupDetailPage` | - | `GroupStoryBookResponse` | connected | N |
| GroupStoryBook | 그룹 스토리북 목록 | GET | `/groups/{group_id}/storybooks` | `groupService.listGroupStorybooks` | `MemoryGroupDetailPage` | - | `GroupStoryBookListItemResponse[]` | connected | N |
| DeletionRequest | 요청 목록 | GET | `/deletion-requests` | `deletionService.listDeletionRequests` | `DeletionRequestPage` | - | `DeletionRequestResponse[]` | connected | N |
| DeletionRequest | 요청 생성 | POST | `/deletion-requests` | `deletionService.createDeletionRequest` | `DeletionRequestPage` | `DeletionRequestCreateRequest` | `DeletionRequestResponse` | connected | N |
| DeletionRequest | 요청 상세 | GET | `/deletion-requests/{request_id}` | `deletionService.getDeletionRequest` | `DeletionRequestPage` | - | `DeletionRequestResponse` | connected | N |
| DeletionRequest | 요청 취소 | PATCH | `/deletion-requests/{request_id}/cancel` | `deletionService.cancelDeletionRequest` | `DeletionRequestPage` | - | `DeletionRequestResponse` | connected | N |
| Report | 신고 생성 | POST | `/reports` | `reportService.createReport` | `ReportPage` | `CreateReportRequest` | `ReportResponse` | connected | N |
| Report | 신고 목록 | GET | `/reports` | `reportService.listReports` | `ReportPage` | `page,size` | `PaginatedReportResponse` | connected | N |
| Report | 신고 상세 | GET | `/reports/{report_id}` | `reportService.getReport` | `ReportPage` | - | `ReportResponse` | connected | N |
| Admin Verification | 검수 목록/상세/상태변경 | GET/PATCH | `/admin/verification-requests*` | `adminService.listVerificationRequests` 등 | `AdminVerificationReviewPage` | 각 request type | `VerificationRequestAdminResponse` | connected | N |
| Admin Report | 신고 목록/상세/처리 | GET/PATCH | `/admin/reports*` | `adminService.listReports` 등 | `AdminReportsPage` | `Record<string,unknown>` | `Record<string,unknown>` | partially-connected | Y (백엔드 스키마 비구체) |
| Admin Audit | 감사 로그 | GET | `/admin/audit-logs` | `adminService.listAuditLogs` | `AdminAuditLogsPage` | query | `PaginatedResponse<AuditLogResponse>` | connected | N |
| Admin Usage | 사용량 조회/수정 | GET/PATCH | `/admin/usage-limits`, `/admin/users/{id}/usage-limit`, `/admin/personas/{id}/usage-limit` | `adminService.listUsageLimits` 등 | `AdminDashboardPage` | `UpdateUsageLimitRequest` 등 | usage types | backend-pending | Y (백엔드 migration 적용 전 500 가능) |
| Admin RateLimit | 이벤트 조회 | GET | `/admin/rate-limit-events` | `adminService.listRateLimitEvents` | `AdminAuditLogsPage` | query | `PaginatedResponse<RateLimitEventResponse>` | connected | N |
| Admin VoiceProfile | 검수 조회/처리 | GET/PATCH | `/admin/voice-profiles*` | `adminService.getVoiceProfile` 등 | `AdminVoiceProfileReviewPage` | `VoiceProfileReviewRequest` | `PersonaVoiceProfileResponse` | connected | N |
| Admin Deletion | 삭제요청 운영 | GET/PATCH | `/admin/deletion-requests*` | `adminService.listDeletionRequests` 등 | Admin pages(연결 준비) | query | `DeletionRequestResponse` | connected | N |
| Legacy UI | `targetApi.ts` / `authApi.ts` / `chatApi.ts` / `storybookApi.ts` | mixed | 기존 호환 wrapper | legacy service 함수 | `ChatPage` 등 구경로 | legacy types | legacy types | partially-connected | Y (신규 서비스 계층으로 점진 통합) |
| StoryVoiceNarration | 별도 HTTP API | - | - | - | - | - | - | backend-not-supported | N |
| Mock feature pages | 데모/예시 데이터 | - | - | `mockFeatureService` | `MockFeaturePage` | - | - | intentionally-disabled | N |

## 이번 점검에서 반영한 수정

- `authService.me` 파싱 보강: `role`/`ROLE` 및 중첩 응답(`data.user`)까지 허용.
- `apiClient` 에러 메시지 사용자 친화형으로 통일, 백엔드 `detail` 키워드 매핑 추가.
- 미디어/사진/채팅/음성 타입에 `file_api_url`, `image_api_url`, `audio_api_url` 반영.
- `DomainPages` 미디어/오디오/이미지 렌더링에서 API URL 우선 사용.
- `voiceSocketService` `audio_chunk.mime_type`을 문서 허용 타입으로 확장.
- `adminService`에 문서 기준 삭제요청 운영 API(`/admin/deletion-requests*`) 추가.

## 남은 리스크

- `/admin/reports*`는 백엔드 OpenAPI 스키마가 구체적이지 않아 프론트 타입이 `Record<string, unknown>` 기반이다.
- `src/pages/DomainPages.tsx`에 legacy 흐름이 남아 있어, 도메인별 파일 분리 리팩터링이 필요하다(동작과는 분리 이슈).
