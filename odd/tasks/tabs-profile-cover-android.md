# Hidden tabs and Android profile cover cropping

## Objective

Keep Reels out of the tab bar while its feature is disabled, and let Android users confirm a profile cover crop.

## Scope and authorization

The user requested these two fixes. Preserve the existing Reels feature flag and route guards, the other visible tabs, cover cropping and upload behavior, and existing Spanish UI copy. Local implementation and work-unit commits only; no push, pull request, deployment, backend operations, or dependency installation.

Branch: `fix/tabs-profile-cover-android`, based on `dev` at `51d9a97`.

## Findings and approach

- Expo Router transforms `href: null` into hidden tab item styling and a null tab button before passing descriptors to the custom bar. The custom bar only checks the original `href`, so Reels leaks into the visible list.
- Profile cover selection uses Expo ImagePicker's native cropper with a 3:1 aspect ratio. Android confirmation needs further native/theme investigation before choosing its fix. Do not remove cropping as a workaround.
- Route: delegated direct for both tasks. Mapping involves more than three files; implementation requires source changes plus meaningful regression coverage.

## Checks and delivery

- TDD: off, consistent with `odd/tasks/trabajos-tab.md` and `odd/tasks/contract-followups.md`; no active configuration enabling strict TDD was found. Runner: Jest with `jest-expo`.
- RDD: off, confirmed by `gentle-ai review mode status` (global decision). Do not start native review or change its mode.
- Focused checks: `npm test -- --runTestsByPath __tests__/customTabBar.test.tsx`, plus cover regression tests selected after investigation.
- Closure checks: `npm test`, `npm run typecheck`, `npm run lint`, and `npm run lint:ds`. Record failures and environmental limits honestly.
- Runtime acceptance: Android crop confirmation/cancellation should return to editing, preserve the 3:1 crop, and upload only a confirmed selection. Mocked tests alone do not prove native hit targets work. iOS/device checks may be unavailable on this host; record that limit.
- Initial forecast: 120–250 authored changed lines; revise if the Android fix requires a larger change. Delivery strategy: `ask-on-risk`; no PR or chain is being created.
- Engram mirror `odd/tabs-profile-cover-android/tasks`: pending because Engram tools are unavailable in this session. This file is the recovery record.

## Tasks

- [ ] T1 — Honor the transformed hidden-tab descriptor in the custom bar. Cover the real descriptor shape, visible tab order/index mapping, and existing `href: null` behavior. Run focused checks and commit this behavior with its tests. Rollback boundary: custom bar filtering and its regression tests.
- [ ] T2 — Identify and fix Android cover crop confirmation without removing cropping. Add proportionate regression coverage for the chosen boundary, verify cancellation/error handling, and run applicable closure checks. Commit this behavior with its tests. Rollback boundary: cover picker/crop flow and its regression tests.

## Progress and evidence

- Exploration complete for T1; Android native cropper investigation is in progress for T2.
- T1 implementation and focused verification are complete; its work-unit commit is pending parent readback.
- T1 change: custom-bar filtering now honors Expo Router's `tabBarItemStyle.display === 'none'` descriptor while retaining the original `href: null` check. Regression coverage checks the transformed descriptor, visible order, and preserved route indices, including flattened object and array styles. Authored code/test diff: 22 additions, 3 deletions.
- T1 checks: an initial independent typecheck found TS2339 because the Expo `href` option is outside `BottomTabNavigationOptions`; preserving the prior narrow optional-`href` cast resolved it. `npm run typecheck` then passed (route generation and `tsc --noEmit`, exit 0). `npm test -- --runTestsByPath __tests__/customTabBar.test.tsx` passed (1 suite, 16 tests); emitted Expo icon `act(...)` warnings and Jest's forced-exit notice. `node_modules/.bin/eslint.cmd src/components/CustomTabBar.tsx __tests__/customTabBar.test.tsx` passed with no output. `git diff --check` passed.
- T1 runtime: no Android app/device interaction performed; coverage is the Expo descriptor contract in Jest.
- Commits: none yet.
- Next step: parent readback and commit T1; continue T2 Android crop confirmation investigation.
