# Quality Rules

## Baseline Checks

Before completing code changes, run:

```bash
npm run build
npm run lint
```

There is no configured test script yet. If tests are added later, include `npm test` or the chosen command in this file and in `AGENTS.md`.

## Code Quality

- Keep changes small and reviewable.
- Preserve existing behavior unless the task requests behavior changes.
- Prefer clear code over clever abstractions.
- Remove duplication when it causes real maintenance cost.
- Avoid adding dependencies for problems the current stack can solve simply.
- Keep public component props stable unless the caller changes are included.

## Duplication Threshold

Extract shared logic when:

- The same non-trivial logic appears in two or more places.
- A component becomes hard to scan because rendering and logic are interleaved.
- API response handling is repeated across features.
- Styling tokens or layout patterns are copied repeatedly.

Do not extract tiny one-off expressions only to satisfy a pattern.

## Large Component Threshold

Consider splitting a component when:

- It owns unrelated UI sections.
- It mixes API fetching, data shaping, and detailed markup.
- It is difficult to test or review as one unit.
- It has repeated conditional rendering branches.

Current `App.tsx` is small and template-like; it does not require immediate splitting.

## Lint, Build, and Test Standard

- `npm run build` must pass before merging normal code changes.
- `npm run lint` must pass when the lint configuration covers the changed files.
- If a command fails because of pre-existing repository issues, document the failure and avoid masking it with unrelated changes.
- For behavior changes, add or document a manual verification path.

## Refactoring Standard

Refactors must preserve:

- Rendered behavior.
- Existing CSS behavior and responsive layout.
- Public imports used elsewhere.
- Build and lint results.

Prefer migration in thin slices:

1. Add the target folder.
2. Move one module.
3. Update imports.
4. Run build and lint.
5. Document the result.

## Current Known Issues

- README contains unresolved merge conflict markers.
- Both TypeScript and JavaScript template files exist for the app and Vite config.
- ESLint currently targets `**/*.{ts,tsx}` only, so JavaScript files are not linted.
- No test framework or test script is configured.
