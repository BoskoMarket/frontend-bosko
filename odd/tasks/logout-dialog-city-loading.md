# Logout dialog and registration cities

## Objective and scope

Make the logout confirmation visibly opaque on Android and restore registration's city selection in the selected local development environment. Preserve Spanish product copy, dialog actions, the existing 12 demo works, the local API and all unrelated configuration. No remote service, database, deployment, or credential access is authorized.

Branch: `fix/logout-dialog-city-loading`, based on `chore/local-works-demo` at `74b7dbd`. The user's existing Metro on port 8081 and in-progress registration must not be stopped or reset by this work.

## Evidence and approach

- Logout uses the shared `ConfirmDialog`. Its `Card` sets a solid theme surface but still uses a native `BlurView`; ensure this particular dialog renders an explicitly solid, non-blurred surface on Android and iOS while preserving the established layout, theme, controls, and default glass behavior of other cards.
- The local API's `/api/v1/cities` returns HTTP 200 and two cities. Its response envelope matches the frontend interceptor and collection parser. Emulator 5554 has the required port-3101 reverse mapping.
- The currently served Android development bundle on Metro 8081 does not contain the local API URL from `.env`; that Metro process predates the environment change. Test a freshly started, separately owned Metro process without stopping the user's process. Do not claim a fix for any earlier production environment.

## Workflow and checks

- Route: delegated direct. The shared dialog implementation and relevant behavior tests span multiple files; runtime environment verification is a separate bounded task.
- TDD: off, consistent with recent local task records; runner: Jest with `jest-expo`. RDD is globally off.
- Focused checks: dialog behavior and surface tests; city service/picker tests; TypeScript and relevant lint. Verify a fresh Android bundle contains the selected local API URL and that the local cities endpoint responds successfully.
- Preserve the user's current emulator state. A full app reload may discard registration input, so leave the choice of reload to the user after verifying the new server configuration.
- Forecast under 200 authored lines; local work-unit commits only, no push or PR. Engram mirror `odd/logout-dialog-city-loading/tasks` is pending because the memory tools are unavailable.

## Tasks

- [x] T1 — Render the shared confirmation dialog on an opaque surface without using native blur; preserve visual styling, accessibility, dismiss and action behavior, and the existing appearance of other cards. Add meaningful regression coverage and run focused checks. Rollback boundary: shared dialog/card changes and related tests.
- [ ] T2 — Verify cities through the actual local API and a freshly started Metro instance using the selected environment, without stopping the existing server or resetting the device. Record exact findings and remaining reload/device limitations. Rollback boundary: only an additional task-owned development server and its logs.

## Progress

- T1 implementation and independent focused verification are complete; the work-unit commit is pending. `Card` now has an opt-in `solid` surface that uses a regular native `View` with the active theme's opaque `tc.surface`; `ConfirmDialog` opts into it. Other cards keep the default glass `BlurView` path.
- T1 regression coverage renders the confirmation dialog in dark and light themes, checks the opaque surface color and absence of the blur view, and confirms a regular Card still uses blur.
- Existing local API and demo database remain active; existing Metro 8081 remains user-owned.
- T2 independent runtime check: `GET http://127.0.0.1:3101/api/v1/cities` returned HTTP 200 with a direct `data` array of 2 cities. A separate, task-owned Expo Metro process on port 8099 returned `/status` HTTP 200. Its Android development bundle returned HTTP 200 in 5.7 seconds (17,707,709 bytes) and contained both the exact local API URL and the cities service. The task-owned process and its 11 child processes were stopped; port 8099 closed while existing ports 8081 and 3101 remained listening. No emulator interaction or reload occurred. These findings support restarting the existing Metro process to load the current `.env`, but do not prove the user's in-progress registration screen is fixed until they can safely reload.
- Independent checks: the three focused Jest suites passed (102 tests); Jest emitted asynchronous Icon `act(...)` warnings in the design-system and city-selection suites. TypeScript and scoped ESLint on the changed dialog/card/test files passed.
- Checks observed: `npm test -- --runTestsByPath __tests__/designSystemComponents.test.tsx` — 1 suite, 77 tests passed (Jest emitted an existing async Icon `act(...)` warning); `npm run typecheck` — passed; scoped ESLint on the three T1 source/test files — passed; `git diff --check` — passed. Local cities API 200/2 and emulator reverse mapping were verified during prior read-only diagnostics; current Android visual verification remains pending.
- Commits: none yet.
- Risk assessment was unassessable due the untracked task document; the conservative high-risk fallback used the independent verifier above. RDD remained off.
- Next step: commit the T1 change, then record T2's completed runtime verification and the remaining user-controlled reload.
