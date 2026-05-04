# Architecture

## Current State

RemoryFE is currently a small React + Vite frontend. The active TypeScript path is:

```text
index.html
  -> src/main.tsx
    -> src/App.tsx
      -> src/App.css
      -> src/assets/*
      -> public/icons.svg
```

The app renders a Vite starter-style screen with local component state for a counter. There is no router, no page folder, no API client, and no external state manager yet.

The repository also contains JavaScript template duplicates:

- `src/main.jsx`
- `src/App.jsx`
- `vite.config.js`

The TypeScript files are the build path used by `npm run build`. Treat duplicate JavaScript files as cleanup candidates, not as active architecture.

## Folder Roles

Current folders:

- `src/`: React source.
- `src/assets/`: imported static assets.
- `public/`: root-served static assets.
- `docs/agent-harness/`: operating docs for agents and maintainers.

Target folders for incremental growth:

- `src/app/`: app entry, app shell, providers, router setup.
- `src/pages/`: route-level screens.
- `src/features/`: feature modules with local UI, hooks, and API logic.
- `src/components/`: reusable app-level components.
- `src/shared/api/`: shared API client and request helpers.
- `src/shared/hooks/`: cross-feature hooks.
- `src/shared/lib/`: utilities and pure helpers.
- `src/shared/ui/`: reusable presentational UI primitives.
- `src/shared/styles/`: tokens, resets, and shared styles.
- `src/shared/assets/`: shared frontend assets when moving from the current `src/assets`.

## Data Flow

Current data flow is local only:

1. `App.tsx` initializes React state with `useState`.
2. The counter button updates local state.
3. CSS and static assets are imported directly by `App.tsx`.

Future data flow rule:

1. Page or feature components request data through hooks or feature services.
2. API functions live in `src/shared/api` or feature-local `api` modules.
3. UI components receive normalized data and callbacks through props.
4. Loading, empty, and error states are represented explicitly in the UI layer.

## Routing Structure

No router is currently configured.

When routing is introduced:

- Put router setup under `src/app/router`.
- Route components should live under `src/pages`.
- Feature modules should not import from pages.
- Keep route definitions declarative and easy to scan.

## Component Hierarchy

Current hierarchy:

```text
App
  section#center
    hero images
    heading/copy
    counter button
  section#next-steps
    documentation block
    social block
```

Suggested future hierarchy:

```text
App
  AppRouter
    Page
      FeatureSection
        FeatureComponent
          shared/ui primitive
```

## Dependency Direction

Allowed:

- `app` imports `pages`, `features`, `components`, and `shared`.
- `pages` import `features`, `components`, and `shared`.
- `features` import `shared`.
- `components` import `shared`.

Not allowed:

- `shared` importing from `app`, `pages`, `features`, or `components`.
- `features` importing route-level page modules.
- UI primitives importing API modules.
- API modules importing React components.

## Refactor Boundary

Do not perform a full folder migration until there are real pages, routes, or API modules to place. For now, document the target boundaries and apply them when new work naturally creates those files.
