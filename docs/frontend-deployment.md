# Remory Frontend Deployment

이 문서는 `remory/frontend` 레포 기준의 로컬 개발 환경과 같은 서버/Nginx 배포 환경 전환 방법을 정리한다.

## Project Layout

```text
remory/
  backend/
  frontend/
```

- `backend/`: FastAPI 백엔드 레포
- `frontend/`: React + TypeScript + Vite 프론트엔드 레포
- API prefix: `/api/v1`
- 프론트 코드는 서버 IP를 하드코딩하지 않고 `import.meta.env.VITE_API_BASE_URL`, `import.meta.env.VITE_WS_BASE_URL`만 사용한다.

## Local Development

로컬 개발에서는 Vite dev server가 프론트를 실행하고, 이미 배포된 백엔드를 직접 호출한다.

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

실행:

```bash
npm install
npm run dev
```

주의:

- 백엔드 CORS 설정에는 로컬 프론트 origin인 `http://localhost:5173`이 포함되어야 한다.
- 브라우저에서 WebSocket 음성 통화를 테스트하려면 `VITE_WS_BASE_URL`이 `ws://.../api/v1` 형식이어야 한다.
- `.env.local`은 로컬 개발용 값만 둔다. 운영 비밀번호, SSH 키, 서버 토큰 같은 민감 정보는 넣지 않는다.

## Same Server Nginx Deployment

나중에 프론트와 백엔드를 같은 서버에서 배포할 때는 React build 결과물인 `dist/`를 Nginx가 정적 파일로 서빙하고, API와 WebSocket은 FastAPI로 proxy한다.

구조:

```text
Client Browser
  -> Nginx
       -> React dist/ static files
       -> /api/ proxy to FastAPI
       -> /api/v1/ws/ WebSocket proxy to FastAPI
```

`.env.production` 예시:

```env
VITE_API_BASE_URL=/api/v1
VITE_WS_BASE_URL=/api/v1
```

이 값은 같은 origin 배포를 전제로 한다. 프론트 코드의 WebSocket base URL 정규화 로직이 상대 경로 `/api/v1`을 현재 origin 기준 `ws://` 또는 `wss://` URL로 변환한다.

## Build

빌드 명령어:

```bash
npm run build
```

결과물:

```text
dist/
```

배포 시 `dist/` 안의 파일을 Nginx static root로 업로드하거나, 배포 파이프라인에서 빌드 후 해당 디렉터리를 배포 대상에 복사한다.

## Nginx Proxy Notes

Nginx는 React SPA를 정적 파일로 서빙하고 `/api/` 요청은 FastAPI로 전달한다. 실제 서버 경로와 upstream 이름은 서버 구성에 맞게 조정한다.

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

WebSocket 배포 주의사항:

- `/api/v1/ws/`는 FastAPI WebSocket endpoint로 proxy되어야 한다.
- `proxy_http_version 1.1`이 필요하다.
- `Upgrade`와 `Connection` header가 필요하다.
- 운영 HTTPS 환경에서는 브라우저가 `wss://`로 접속해야 한다. 프론트의 상대 `VITE_WS_BASE_URL=/api/v1` 설정은 현재 origin protocol에 맞춰 `ws://` 또는 `wss://`로 변환된다.

## Deployment Checklist

- `npm run build`가 성공하는지 확인한다.
- `dist/`가 배포 대상에 포함되었는지 확인한다.
- 운영 환경 변수는 `.env.production` 또는 배포 시스템 환경 변수로 관리한다.
- 서버 IP나 backend origin을 React 코드에 직접 하드코딩하지 않는다.
- REST 호출은 `VITE_API_BASE_URL` 기반 service layer를 통해서만 수행한다.
- WebSocket 호출은 `VITE_WS_BASE_URL` 기반 service/hook을 통해서만 수행한다.
- 같은 서버 배포에서는 `VITE_API_BASE_URL=/api/v1`, `VITE_WS_BASE_URL=/api/v1`을 사용한다.
- 로컬 개발에서는 백엔드 CORS에 `http://localhost:5173`이 허용되어 있어야 한다.
- WebSocket proxy는 `Upgrade`, `Connection` header 설정을 포함해야 한다.
- 실제 서버 비밀번호, DB 계정, SSH 키, JWT secret 등 민감 정보는 프론트 문서나 `.env.*` 예시에 기록하지 않는다.
