# Remory Frontend

Remory 프론트엔드는 React, TypeScript, Vite 기반의 웹 클라이언트입니다. 현재 `demo` 브랜치는 배포된 FastAPI 백엔드를 바라보는 로컬 개발 구조와, 이후 같은 서버/Nginx 배포로 전환하기 쉬운 환경 변수 구조를 기준으로 정리되어 있습니다.

## 프로젝트 구조

```text
remory/
  backend/
  frontend/
```

- `backend/`: Remory FastAPI 백엔드 레포지토리
- `frontend/`: Remory React + TypeScript + Vite 프론트엔드 레포지토리
- API prefix: `/api/v1`
- 모든 REST 요청은 `src/services/apiClient.ts`와 service layer를 통해 처리합니다.
- WebSocket 연결은 `VITE_WS_BASE_URL` 기반 service/hook을 통해 처리합니다.

## 로컬 개발

로컬 프론트 개발 서버는 Vite를 사용합니다.

```bash
npm install
npm run dev
```

| 항목 | 값 |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend | `http://141.164.48.128:8000` |
| REST base URL | `http://141.164.48.128:8000/api/v1` |
| WebSocket base URL | `ws://141.164.48.128:8000/api/v1` |

`.env.local` 예시:

```env
VITE_API_BASE_URL=http://141.164.48.128:8000/api/v1
VITE_WS_BASE_URL=ws://141.164.48.128:8000/api/v1
```

백엔드 CORS에는 로컬 개발 origin인 `http://localhost:5173`이 허용되어 있어야 합니다.

## 서버 배포 전환

같은 서버/Nginx에서 프론트와 백엔드를 함께 배포할 때는 React build 결과물인 `dist/`를 Nginx가 서빙하고, `/api/` 요청은 FastAPI로 proxy합니다.

`.env.production` 예시:

```env
VITE_API_BASE_URL=/api/v1
VITE_WS_BASE_URL=/api/v1
```

Nginx 배포 기준:

- React 정적 파일: `dist/`
- REST proxy: `/api/` -> FastAPI
- WebSocket proxy: `/api/v1/ws/` -> FastAPI
- WebSocket proxy에는 `Upgrade`, `Connection` header 설정이 필요합니다.
- 프론트 코드에는 서버 IP를 하드코딩하지 않습니다.

자세한 배포 문서는 [docs/frontend-deployment.md](docs/frontend-deployment.md)를 참고하세요.

## 주요 명령어

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

- `npm run build`: TypeScript build 후 Vite production build를 실행합니다.
- `npm run lint`: ESLint 검사를 실행합니다.
- 배포 결과물은 `dist/`에 생성됩니다.

## 현재 구현 상태

현재 프론트는 백엔드 문서와 OpenAPI 기준으로 기능을 정리했습니다. 백엔드에 없는 기능은 제거하거나 Remory 도메인에 맞게 통합한다는 원칙을 따릅니다.

### 실제 API 연결 완료

| 도메인 | 프론트 상태 |
| --- | --- |
| Auth | 회원가입, 로그인, 로그아웃, access token 저장, refresh token 응답 저장, 내 정보 조회 |
| User me | `/auth/me` 기반 인증 상태와 My Account |
| Target | 목록, 생성, 상세, 수정, 삭제 |
| TargetMedia | Target별 사진/음성 목록, 업로드, 삭제 |
| ConsentLog | Target별 동의 목록, 생성, 철회 |
| TargetVerificationRequest | 관계 입증 요청 제출, 목록, 상세 |
| Persona | Target 기반 생성, 상세, status 조회, gate 상태 표시 |
| PersonaVoiceProfile | 조회, 생성 요청, 평가 요청, 사용자 확인, voice call gate |
| PersonaChat | Persona별 채팅방 생성과 목록 |
| PersonaMessage | 메시지 목록, 텍스트 메시지 전송, audio 응답 렌더링 |
| Voice Call WebSocket | `VITE_WS_BASE_URL` 기반 실시간 음성 대화 |
| AIInterviewSession | 세션 생성, 상세 조회, 질문 생성, 답변 저장 |
| PhotoMemory | 목록, 업로드, 상세, 삭제 |
| StoryBook / StoryChapter | 목록, 생성, 상세, chapter 목록, 재생성 |
| ShareLink | 생성, 목록, 공개 token 조회, 비활성화 |
| MemoryGroup / GroupMember / GroupStoryBook | 그룹 생성/조회, 멤버 추가/목록, StoryBook 공유/목록 |
| DeletionRequest | 생성, 목록, 상세, 취소 |
| Report | 생성, 목록, 상세 |
| Admin | verification review, reports, audit logs, usage limits, rate limit events, voice profile review |

### 부분 연결 또는 주의 대상

| 도메인 | 상태 |
| --- | --- |
| Admin report | OpenAPI의 일부 admin report 응답이 구체 schema가 아닌 object 형태라, 반환 필드를 일반 렌더링합니다. |
| Persona list | 백엔드에 전역 Persona 목록 endpoint가 없으므로 Target 기반 흐름과 상세 조회 중심으로 구성되어 있습니다. |
| Interview list | 백엔드에 인터뷰 전체 목록 endpoint가 없으므로 세션 생성과 직접 session id 조회 중심으로 구성되어 있습니다. |

### Mock 또는 개발용 잔여 항목

`src/data/mockFeaturePages.ts`와 `src/services/mock/mockFeatureService.ts`는 개발용 mock skeleton 자산으로 남아 있습니다. 현재 주 라우팅과 메뉴는 실제 백엔드 도메인 페이지를 우선 사용하며, 실제 API가 없는 실행 버튼은 비활성화하거나 API 연결 예정 안내를 표시하는 방향을 유지합니다.

## 라우팅과 정보구조

현재 메뉴 구조는 백엔드 도메인에 맞춰 다음 그룹으로 정리되어 있습니다.

- Dashboard
- Targets
- Verification & Consent
- Personas
- Conversations
- Voice Call
- Memories
- Storybooks
- Sharing
- Groups
- Safety Center
- My Account
- Admin

라우트 설정은 `src/routes.tsx`, 메뉴 설정은 `src/navigation.ts`에서 관리합니다.

## 문서

- API 매핑: [docs/frontend-api-map.md](docs/frontend-api-map.md)
- 프론트/백엔드 차이 감사: [docs/frontend-backend-gap-audit.md](docs/frontend-backend-gap-audit.md)
- 로컬 개발 및 배포 전환: [docs/frontend-deployment.md](docs/frontend-deployment.md)

## 개발 원칙

- API endpoint, request body, response body는 백엔드 문서와 OpenAPI 기준으로만 사용합니다.
- 페이지 컴포넌트에서 직접 `fetch`를 쓰지 않습니다.
- REST 요청은 service layer와 `src/services/apiClient.ts`를 통해 처리합니다.
- API base URL은 `import.meta.env.VITE_API_BASE_URL`만 사용합니다.
- WebSocket base URL은 `import.meta.env.VITE_WS_BASE_URL`만 사용합니다.
- 백엔드에 없는 프론트 기능은 유지하지 않고 제거하거나 기존 Remory 도메인으로 통합합니다.
- 코드와 문서에 실제 서버 비밀번호, SSH 키, DB 계정, JWT secret 같은 민감 정보를 기록하지 않습니다.
