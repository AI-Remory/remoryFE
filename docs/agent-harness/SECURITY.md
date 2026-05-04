# Security Rules

## Environment Files

- Do not commit real `.env` files.
- Use `.env.example` for placeholders only.
- Only use `VITE_` variables for frontend-exposed values.
- Never put private API keys, database credentials, service tokens, or signing secrets in frontend code.

## API Keys and Secrets

Frontend code runs in the user's browser. Anything bundled into frontend JavaScript is public.

Do not add:

- Private backend keys.
- Cloud provider secrets.
- Long-lived access tokens.
- Credentials in source files, docs, screenshots, or examples.

## User Input

When user input is introduced:

- Validate before sending important requests.
- Escape or avoid raw HTML rendering.
- Do not use `dangerouslySetInnerHTML` unless the input is sanitized and the reason is documented.
- Treat server responses as untrusted unless the contract guarantees otherwise.

## Authentication and Token Storage

No auth flow exists yet.

If auth is added:

- Prefer backend-managed httpOnly cookies when possible.
- Avoid long-lived tokens in `localStorage`.
- Keep token refresh and logout behavior centralized.
- Clear auth state on explicit logout and unrecoverable auth failure.

## Logging

- Do not leave broad `console.log` usage in committed code.
- Never log secrets, tokens, personal information, or full raw API payloads that may contain sensitive data.
- Use targeted development logs only temporarily and remove them before completion.

## Dependency Safety

- Avoid unnecessary dependencies.
- When adding a dependency, confirm why the built-in platform or existing stack is insufficient.
- Run build and lint after dependency changes.
- Keep `package-lock.json` committed with dependency updates.
