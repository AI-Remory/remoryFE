# Remory Frontend

Remory 프론트엔드는 React, TypeScript, Vite 기반의 기억 플랫폼 웹 클라이언트입니다. 현재 `demo` 브랜치는 배포된 FastAPI 백엔드와 연동되는 로컬 개발 환경, 그리고 같은 서버/Nginx 배포로 전환 가능한 환경 변수 구조를 기준으로 정리되어 있습니다.

## 기술 스택

- React 19
- TypeScript
- Vite
- ESLint
- lucide-react

## 로컬 실행

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://141.164.48.128:8000`
- API prefix: `/api/v1`

`.env.local` 예시:

```env
VITE_API_BASE_URL=http://141.164.48.128:8000/api/v1
VITE_WS_BASE_URL=ws://141.164.48.128:8000/api/v1
```

같은 서버/Nginx 배포에서는 상대 경로를 사용합니다.

```env
VITE_API_BASE_URL=/api/v1
VITE_WS_BASE_URL=/api/v1
```

## 주요 명령어

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## 현재 구현 상태 요약

- 실제 API 연결: Auth, User me, Target, TargetMedia, ConsentLog, TargetVerificationRequest, Persona, PersonaVoiceProfile, PersonaChat, PersonaMessage, Voice WebSocket, AIInterviewSession, PhotoMemory, StoryBook, StoryChapter, ShareLink, MemoryGroup, GroupMember, GroupStoryBook, DeletionRequest, Report, Admin 주요 기능
- 부분 연결/주의: Persona 전체 목록은 백엔드 전역 list endpoint가 없어 Target 기반 흐름 중심입니다. Interview 전체 목록도 endpoint가 없어 생성/직접 조회 중심입니다. 일부 Admin report 응답은 OpenAPI schema가 구체 object가 아니므로 일반 필드 렌더링을 유지합니다.
- 제거/통합: CampaignsPage, legacy ProfilePage, legacy StorybookPage, 회원가입 직후 자동 데이터 생성 flow는 제거 또는 Remory 백엔드 도메인으로 통합했습니다.
- Mock: 개발용 mock skeleton 자산은 남아 있지만, 실제 API가 없는 실행 버튼은 비활성화하거나 API 연결 예정 안내를 표시합니다.

## 문서

- [프론트 구조와 UI 가이드](docs/FRONTEND_GUIDE.md)
- [API 연동과 백엔드 정합성](docs/API_INTEGRATION.md)
- [배포와 QA 체크리스트](docs/DEPLOYMENT_AND_QA.md)
- [Agent 작업 규칙](AGENTS.md)

## 원칙

- 백엔드 문서와 OpenAPI에 없는 endpoint, request body, response body를 만들지 않습니다.
- 페이지 컴포넌트에서 직접 `fetch`를 사용하지 않습니다.
- REST 요청은 `src/services/apiClient.ts`와 domain service를 통해 처리합니다.
- API/WS base URL은 `VITE_API_BASE_URL`, `VITE_WS_BASE_URL`만 사용합니다.
- 서버 비밀번호, 토큰, SSH key, DB 계정 같은 민감 정보는 문서와 코드에 기록하지 않습니다.
