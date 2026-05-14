# Deployment and QA

이 문서는 Remory 프론트의 로컬 개발, 서버 배포, 환경 변수, Nginx proxy, WebSocket 설정, 최종 QA 체크리스트를 정리합니다.

## 로컬 개발 환경

프로젝트 구조:

```text
remory/
  backend/
  frontend/
```

로컬 프론트:

```text
http://localhost:5173
```

배포된 백엔드:

```text
http://141.164.48.128:8000
```

설치와 실행:

```bash
npm install
npm run dev
```

`.env.local` 예시:

```env
VITE_API_BASE_URL=http://141.164.48.128:8000/api/v1
VITE_WS_BASE_URL=ws://141.164.48.128:8000/api/v1
```

주의:

- 백엔드 CORS에 `http://localhost:5173`이 허용되어야 합니다.
- local env에는 서버 비밀번호, SSH key, DB 계정, JWT secret 같은 민감 정보를 넣지 않습니다.

## 서버 배포 환경

같은 서버/Nginx 배포에서는 React build 결과물 `dist/`를 Nginx가 정적 파일로 서빙하고, API/WebSocket 요청은 FastAPI로 proxy합니다.

`.env.production` 예시:

```env
VITE_API_BASE_URL=/api/v1
VITE_WS_BASE_URL=/api/v1
```

빌드:

```bash
npm run build
```

결과물:

```text
dist/
```

배포 시 `dist/` 파일을 Nginx static root에 배치합니다.

## Nginx 구성 예시

실제 server name, upstream, 경로는 서버 환경에 맞게 조정합니다. 민감 정보는 포함하지 않습니다.

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/remory/frontend/dist;
    index index.html;

    client_max_body_size 50m;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v1/ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600;
    }
}
```

WebSocket 주의사항:

- `/api/v1/ws/`를 FastAPI WebSocket endpoint로 proxy합니다.
- `proxy_http_version 1.1`이 필요합니다.
- `Upgrade`, `Connection` header가 필요합니다.
- HTTPS 배포에서는 브라우저가 `wss://`로 연결해야 합니다. `VITE_WS_BASE_URL=/api/v1`을 사용하면 프론트의 URL 정규화 로직이 현재 origin protocol에 맞춰 `ws://` 또는 `wss://`를 구성합니다.

## 주요 명령어

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

현재 테스트 스크립트는 별도로 없습니다. 기능 검증은 build/lint와 브라우저 smoke test 기준으로 수행합니다.

## 최종 E2E 체크리스트

### 공통 품질

- [ ] `npm run build` 통과
- [ ] `npm run lint` 통과
- [ ] TypeScript 오류 없음
- [ ] README conflict marker 없음
- [ ] page component 직접 `fetch` 없음
- [ ] 코드 안에 backend IP 하드코딩 없음
- [ ] REST URL은 `VITE_API_BASE_URL` 기반
- [ ] WebSocket URL은 `VITE_WS_BASE_URL` 기반
- [ ] 백엔드에 없는 route가 남아 있지 않음
- [ ] mock-only 기능은 API 연결 예정 badge와 disabled 안내 유지

### 사용자 플로우

- [ ] 회원가입 성공 후 자동 데이터 생성 없이 onboarding으로 이동
- [ ] 로그인 성공 후 dashboard/home으로 이동
- [ ] 로그아웃 시 token 제거
- [ ] Auth 실패 시 서버 error detail 표시
- [ ] Target 목록/생성/상세/수정/삭제 확인
- [ ] TargetMedia 사진/음성 업로드, 미리보기, audio player, 삭제 확인
- [ ] Consent 목록/생성/철회 확인
- [ ] Verification 제출/목록/상세 확인
- [ ] Persona 생성 전 gate checklist 표시
- [ ] Verification `APPROVED`가 아니면 Persona 생성 CTA 비활성 또는 안내 표시
- [ ] Persona status badge 표시
- [ ] PersonaChat 채팅방 생성/목록/메시지 전송 확인
- [ ] StoryBook source 선택, 생성, 상세, chapter, regenerate 확인
- [ ] ShareLink 생성/목록/public token/disable 확인
- [ ] Group 생성/상세/member/storybook 공유 확인
- [ ] DeletionRequest와 Report는 확인 modal 후 실행

### 음성 대화 체크리스트

- [ ] access token이 query parameter `token`으로 전달됨
- [ ] WebSocket endpoint가 `VITE_WS_BASE_URL + /ws/personas/{persona_id}/voice?token=...` 형태
- [ ] voice profile gate 통과 전 통화 진입 제한
- [ ] 마이크 권한 허용/거부 UI 확인
- [ ] `start`, `audio_chunk`, `end_utterance`, `stop` 전송 확인
- [ ] `session_started`, `partial_transcript`, `final_transcript`, `persona_text`, `persona_audio`, `error`, `session_ended` 수신 처리 확인
- [ ] `audio_file_path` 또는 상대 경로 audio URL을 재생 가능한 URL로 변환
- [ ] 연결 종료와 오류 상태 표시 확인

### 관리자 기능 체크리스트

- [ ] 일반 사용자가 admin API 접근 시 403 안내 표시
- [ ] Admin verification list/detail/file/approve/reject/need-more-info/revoke 확인
- [ ] Admin reports list/detail/reviewing/resolve/reject/action-taken 확인
- [ ] Audit logs 조회 확인
- [ ] Usage limit 조회와 user/persona limit 수정 확인
- [ ] Rate limit events 조회 확인
- [ ] Admin voice profile detail/approve/reject/revoke 확인

## 최종 검증 기록

최근 demo 브랜치 문서 정리 전 최종 검증 기준:

- `npm run build`: 통과
- `npm run lint`: 통과
- CampaignsPage 제거 확인
- legacy ProfilePage 제거 및 My Account 통합 확인
- legacy StorybookPage 제거 및 `/storybooks/*` 통합 확인
- 회원가입 직후 자동 Target/Persona/StoryBook 생성 없음 확인
- README merge conflict marker 없음 확인
- 코드 내 배포 backend IP 하드코딩 없음 확인
- 디자인 token과 주요 화면이 현대적인 Remory 톤으로 정리됨

## 2026-05-14 API QA 실행 결과

기준 문서
- `../backend/docs/02-backend-api.md`
- `../backend/docs/03-frontend-integration.md`
- `docs/API_INTEGRATION.md`
- `http://141.164.48.128:8000/openapi.json`

실행 결과 요약
- [x] `npm run build` 통과
- [x] `npm run lint` 통과
- [x] `/api/v1` prefix 중복 없음 (`src/services/apiClient.ts` 기본값만 사용)
- [x] `apiClient` Authorization Bearer header 자동 부착
- [x] FormData 요청에 Content-Type 수동 지정 없음
- [x] JSON 요청에 Content-Type `application/json` 자동 지정
- [x] `204` 응답 안전 처리
- [x] `ApiError.detail` 기반 사용자 메시지 처리
- [x] `/auth/me` 응답 파싱(`role/ROLE`, `user`, `data.user`) 보강
- [x] ADMIN role guard 적용(`String(user.role).toUpperCase() === 'ADMIN'`)
- [x] 일반 보호 페이지는 로그인 여부만 검사, ADMIN 검사는 admin route에서만 수행
- [x] VoiceCall WebSocket 메시지 포맷 정합성 확인(`start/audio_chunk/end_utterance/stop`)
- [x] 파일/오디오 경로를 재생 URL로 변환(`toPlayableFileUrl`)

실 API 스모크 검증(백엔드 대상)
- [x] 회원가입 성공 (`POST /auth/register`)
- [x] `/auth/me` 성공, `role` 수신 확인
- [x] Target 생성 성공 (`POST /targets`)
- [x] Consent 저장 성공 (`POST /consents`)
- [x] Verification 요청 성공 (`POST /targets/{id}/verification-requests`, multipart)
- [x] TargetMedia 업로드 정책 검증
  - 동의 없음: `403 photo_upload_consent consent is required`
  - 동의 후: `201` 업로드 성공

제한/미완료 항목
- [ ] Admin 승인 이후 단계(관리자 계정 필요):
  - Verification admin approve
  - Persona 생성 성공 gate 이후 플로우
  - Admin pages 전체 액션
- [ ] 브라우저 UI E2E 수동 검증(현재 문서는 API 스모크 + 정적 검증 중심)
