# Frontend Rules

## Component Authoring

- Use TypeScript for new React components.
- Prefer function components.
- Keep JSX focused on rendering, not long business logic.
- Extract repeated UI into `src/components` or `src/shared/ui` when it is reused.
- Extract feature-specific UI into `src/features/<feature>`.
- Keep route-level screens in `src/pages` after routing is introduced.

## Hooks

- Use hooks for reusable stateful behavior.
- Name hooks with the `use` prefix.
- Put cross-feature hooks in `src/shared/hooks`.
- Put feature-specific hooks in `src/features/<feature>/hooks`.
- Do not hide large side effects inside generic UI components.

## Page and Component Separation

Pages should:

- Own route-level composition.
- Connect features together.
- Pass data and callbacks to child components.

Components should:

- Render a focused piece of UI.
- Receive data through props.
- Avoid route-specific assumptions unless they live in `pages`.

Feature components may:

- Own feature-specific state.
- Use feature-specific API hooks.
- Render domain-specific UI.

## State Management

Current state management is local React state only.

Use this order when adding state:

1. Local component state for isolated interactions.
2. Custom hooks for repeated local logic.
3. Context only for stable cross-tree state such as auth/session/theme.
4. External state libraries only after a clear need appears.

## Forms

- Keep small forms controlled with React state when simple.
- Extract validation into helper functions when it grows.
- Show field-level errors where possible.
- Disable submit or show pending state during async submission.
- Keep server error handling visible and recoverable.

## Loading, Empty, and Error UI

When data fetching is introduced, every fetch-driven view should define:

- Loading state.
- Empty state.
- Error state.
- Success state.

Do not rely on blank screens while requests are pending.

## Styling

- Current global styles live in `src/index.css`.
- Current component styles live in `src/App.css`.
- Keep future reusable tokens in `src/shared/styles`.
- Avoid accidental broad selectors as the app grows.
- Preserve mobile behavior when editing layout.
