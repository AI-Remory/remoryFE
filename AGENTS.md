# Remory Frontend Agent Rules

이 문서는 Codex/Agent가 `remory/frontend` 레포에서 작업할 때 지켜야 하는 규칙만 담습니다.

## 프로젝트 구조

```text
remory/
  backend/
    docs/
  frontend/
    src/
    docs/
```

주요 프론트 구조:

- `src/routes.tsx`: route config
- `src/navigation.ts`: desktop/mobile navigation config
- `src/components/layout/`: AppShell, Header, navigation layout
- `src/pages/`: route-level pages and domain re-export folders
- `src/services/`: API client and domain service layer
- `src/types/`: backend response/request 기반 TypeScript type
- `src/hooks/`: auth, voice call 등 shared hooks
- `src/utils/`: file URL 등 utility

## 작업 규칙

1. API endpoint, request body, response body를 추측하지 않는다.
2. 작업 전 `../backend/docs`, `docs/API_INTEGRATION.md`, `http://141.164.48.128:8000/openapi.json`을 확인한다.
3. 실제 명세를 확인한 뒤 `type -> service -> page` 순서로 구현한다.
4. 페이지 컴포넌트에서 직접 `fetch`를 쓰지 않는다.
5. 모든 REST 요청은 `src/services/apiClient.ts`와 domain service를 통해 처리한다.
6. API base URL은 `import.meta.env.VITE_API_BASE_URL`만 사용한다.
7. WebSocket base URL은 `import.meta.env.VITE_WS_BASE_URL`만 사용한다.
8. 코드에 `http://141.164.48.128:8000`을 하드코딩하지 않는다.
9. 백엔드에 없는 프론트 기능, route, 자동 생성 flow를 새로 만들지 않는다.
10. 모르는 필드나 endpoint는 임의로 만들지 말고 TODO와 확인 필요 메모를 남긴다.
11. 작업 후 `npm run build`와 `npm run lint`를 실행한다.

## API와 상태 관리

- access token은 `localStorage`의 `remory_access_token`에 저장한다.
- refresh token은 실제 응답에 있을 때만 `remory_refresh_token`에 저장한다.
- FormData 요청은 `Content-Type`을 직접 지정하지 않는다.
- JSON 요청은 service/apiClient에서 `Content-Type: application/json`을 붙인다.
- 204 응답과 JSON이 아닌 응답을 안전하게 처리한다.
- 서버 error의 `detail` 또는 `message`를 UI에 표시할 수 있게 `ApiError`로 전달한다.

## 디자인과 접근성

- 기존 Remory의 따뜻한 기억 플랫폼 톤을 유지하되, 과한 브라운/세피아 톤은 피한다.
- 본문 폰트는 16px 이상을 유지한다.
- 버튼과 주요 터치 타깃은 최소 44px 높이를 유지한다.
- `focus-visible` 스타일을 제거하지 않는다.
- 색상만으로 상태를 구분하지 않는다. badge text, label, helper/error text를 함께 사용한다.
- input에는 label을 연결하고 loading, empty, error state를 명확히 제공한다.
- 모바일은 bottom nav, 태블릿/데스크톱은 sidebar 또는 넓은 card layout을 기준으로 한다.

## Git과 커밋 메시지

- 사용자가 만들었을 수 있는 변경을 임의로 되돌리지 않는다.
- `git reset --hard`, `git checkout --` 같은 파괴적 명령은 명시 요청 없이는 사용하지 않는다.
- 커밋을 요청받으면 작업 범위를 작게 유지하고, 메시지는 다음 형식을 권장한다.

```text
type(scope): summary
```

예시:

- `docs(frontend): consolidate project guides`
- `fix(auth): preserve server error detail`
- `feat(target): connect media upload flow`

## 완료 기준

- 변경 이유와 파일을 요약한다.
- `npm run build` 통과 여부를 보고한다.
- `npm run lint` 통과 여부를 보고한다.
- 실행하지 못한 검증이나 남은 위험이 있으면 명확히 적는다.
