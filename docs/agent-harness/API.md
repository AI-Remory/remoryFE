# API Rules

## Current State

No API calls are present in the current source tree. There is no `fetch`, `axios`, API client, auth flow, or backend URL configuration yet.

## API Location

When API calls are added:

- Shared API client: `src/shared/api`.
- Shared request helpers: `src/shared/api`.
- Feature-specific API functions: `src/features/<feature>/api`.
- Components should call hooks or service functions, not inline request code in JSX.

## Fetch or Axios

No HTTP library is currently installed. Prefer the platform `fetch` API unless the project develops a clear need for axios or another client.

Recommended shape:

```ts
const response = await fetch(`${apiBaseUrl}/path`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

Normalize errors close to the API layer so UI components do not parse raw response details.

## Backend URL Management

Use Vite environment variables for frontend-visible configuration:

```text
VITE_API_BASE_URL=https://example.com
```

Read it through:

```ts
import.meta.env.VITE_API_BASE_URL
```

Do not hard-code production backend URLs directly inside components.

## Environment Rules

- Only `VITE_` variables are exposed to browser code.
- Never put secrets, private API keys, service tokens, or database credentials in frontend env variables.
- Commit `.env.example` only with placeholder values.
- Do not commit real `.env` files.

## Error Handling

API helpers should return predictable outcomes:

- Success data in a stable shape.
- Network errors mapped to a user-facing error state.
- Non-2xx HTTP responses handled before data reaches UI components.
- Authentication failures handled consistently once auth exists.

## Authentication and Tokens

No authentication is currently present.

If auth is added:

- Prefer secure, httpOnly cookie sessions when backend support exists.
- Avoid storing long-lived tokens in `localStorage`.
- Keep token handling centralized in the API/auth layer.
- Do not pass secrets through component props.
