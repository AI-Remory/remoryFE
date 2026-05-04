# RemoryFE Agent Manual

This file is the first operating manual for coding agents working in this repository. Read it before changing code.

## Project Overview

RemoryFE is a React 19 + Vite frontend. The current repository is close to the default Vite React template and uses TypeScript as the active build path.

Current active entry path:

- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/App.css`

There are also JavaScript template files (`src/main.jsx`, `src/App.jsx`) and duplicate Vite config files (`vite.config.ts`, `vite.config.js`). Treat them as migration leftovers until the team decides whether to remove or consolidate them.

## Main Folder Structure

- `src/`: application source code.
- `src/assets/`: current static assets imported by React components.
- `public/`: static files served from the site root, such as `icons.svg` and `favicon.svg`.
- `docs/agent-harness/`: agent-facing architecture, frontend, API, quality, security, and planning rules.
- Root config files: Vite, TypeScript, ESLint, npm lockfile, and package metadata.

Target structure for future incremental refactors:

```text
src/
  app/
    App.tsx
    router/
  pages/
  features/
  components/
  shared/
    api/
    hooks/
    lib/
    ui/
    styles/
    assets/
```

Do not force this layout in one large move. Introduce it gradually when a feature or refactor has a clear reason.

## Commands

Install dependencies:

```bash
npm install
```

Run local development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Preview production build:

```bash
npm run preview
```

Test command:

- No test script is configured yet.
- Do not add a full test framework only for a small documentation or harness change.
- When behavior grows beyond the template app, add a focused test plan before introducing test tooling.

## Code Rules

- Preserve existing UI behavior unless the task explicitly asks for a change.
- Prefer small, reviewable patches over broad rewrites.
- Use TypeScript for new React source files.
- Keep component logic readable; move repeated or bulky logic into hooks or utilities.
- Avoid adding dependencies unless the benefit is clear and the same goal cannot be met with the current stack.
- Keep imports local and explicit. Avoid hidden global behavior.
- Do not leave unexplained `console.log` statements in committed code.

## Component Rules

- `pages` should represent route-level screens.
- `features` should hold feature-specific components, hooks, and logic.
- `components` should hold reusable app-level components.
- `shared/ui` should hold reusable presentational UI primitives.
- Components should receive data through props when possible.
- Components that render UI should not own unrelated API concerns.
- Loading, empty, and error states should be explicit when data fetching is introduced.

## API Rules

- Do not scatter `fetch` or `axios` calls directly through JSX components.
- Put shared API clients and request helpers under `src/shared/api`.
- Put feature-specific API functions under the relevant `src/features/<feature>/api` folder when they are not reused elsewhere.
- Read backend base URLs from Vite environment variables such as `import.meta.env.VITE_API_BASE_URL`.
- Never expose secrets in frontend environment variables. Only variables prefixed with `VITE_` are exposed to browser code.
- Normalize API errors close to the request layer so UI code receives predictable shapes.

## Styling Rules

- Keep global design tokens and reset-like styles in `src/index.css` or future `src/shared/styles`.
- Keep component-specific styles close to the component while the app is small.
- Avoid global selectors that unexpectedly affect future pages or shared UI.
- Preserve responsive behavior when editing layout styles.
- Do not introduce one-off visual systems when existing variables and conventions are enough.

## Naming Rules

- React components: `PascalCase.tsx`.
- Hooks: `useThing.ts`.
- Utilities: `camelCase.ts`.
- CSS files: match the owning component or use clear shared names.
- Route/page components: `PascalCase.tsx` under `src/pages` when routing exists.
- Folders: lowercase or kebab-case; keep names domain-focused.

## Areas Agents Should Not Modify Casually

- `package-lock.json`: modify only when dependencies actually change.
- `node_modules/`: never edit.
- Generated build output such as `dist/`: never edit manually.
- `.env` files and secrets: do not create real secret values or commit them.
- Template duplicate files (`src/App.jsx`, `src/main.jsx`, `vite.config.js`): do not remove them without a dedicated cleanup task and build verification.
- README conflict markers: currently present; fix only in a focused cleanup or documentation task.

## Dependency Direction

- `pages` may import from `features`, `components`, and `shared`.
- `features` may import from `shared`.
- `components` may import from `shared`.
- `shared` must not import from `pages`, `features`, or app-specific components.
- API code should live in `shared/api` or feature-local API modules, not inside JSX-heavy components.
- Business logic should live in hooks or utilities when it becomes longer than a small inline expression.

## Completion Criteria

Before finishing a task, confirm:

- Whether `npm install` was needed.
- `npm run build` passes, unless blocked and documented.
- `npm run lint` passes, unless blocked and documented.
- Main screens still render or the limitation is documented.
- Changed files and reasons are summarized.
- Any remaining TODOs or risks are documented.

## PR or Commit Checklist

- [ ] Scope is small and tied to the requested task.
- [ ] Existing behavior is preserved or intentional changes are documented.
- [ ] `npm run build` was run.
- [ ] `npm run lint` was run when available.
- [ ] New dependencies are justified.
- [ ] API or environment changes are documented.
- [ ] Large refactors have a plan, rollback path, and validation notes.
