# Agent Work Plan Template

Use this template before large or risky work. Keep the plan short enough to review.

## Task Purpose

Describe the user goal and the behavior that should exist after the change.

## Current State

Summarize the relevant files, current behavior, and known constraints.

## Impact Scope

List the expected affected areas:

- UI:
- Routing:
- API:
- State:
- Styles:
- Build/config:
- Docs:

## Files to Change

Planned changes:

- `path/to/file`: reason.

Files to avoid:

- `path/to/file`: reason.

## Implementation Steps

1. Read the current files and confirm active imports.
2. Make the smallest safe change.
3. Update related docs or comments only when helpful.
4. Run validation commands.
5. Summarize changed files, risks, and follow-ups.

## Verification Method

Commands:

```bash
npm run build
npm run lint
```

Manual checks:

- Main screen renders.
- Existing interaction still works.
- Responsive layout is not visibly broken.

## Rollback Method

Describe how to revert safely:

- Revert the specific changed files.
- Remove any new dependency only if it was introduced by the task.
- Re-run build and lint after rollback.

## Completion Criteria

- Requested behavior or documentation exists.
- Existing behavior is preserved.
- Build result is known.
- Lint result is known.
- Remaining risks are documented.

## Review Notes

Include:

- Why the scope stayed small.
- Which changes are intentionally deferred.
- Any pre-existing issues discovered during the work.
