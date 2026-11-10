# Hidden tabs and Android profile cover cropping

## Objective

Keep Reels out of the tab bar while its feature is disabled, and let Android users confirm a profile cover crop.

## Scope and authorization

The user requested these two fixes. Preserve the existing Reels feature flag and route guards, the other visible tabs, cover cropping and upload behavior, and existing Spanish UI copy. Local implementation and work-unit commits only; no push, pull request, deployment, backend operations, or dependency installation.

Branch: `fix/tabs-profile-cover-android`, based on `dev` at `51d9a97`.

## Findings and approach

- Expo Router transforms `href: null` into hidden tab item styling and a null tab button before passing descriptors to the custom bar. The custom bar only checks the original `href`, so Reels leaks into the visible list.
- Profile cover selection uses Expo ImagePicker's native cropper with a 3:1 aspect ratio. On Android 16/API 36, the crop confirm action was visible but low contrast over a dark image: Expo's default toolbar is transparent with black action text. The installed crop activity resolves `expoCropToolbarColor`, `expoCropToolbarActionTextColor`, `expoCropToolbarIconColor`, and `expoCropBackButtonIconColor` from Android resources. Keep the native crop flow and override those resources through an app-owned Expo config plugin for day and night; leave the crop background unchanged.
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

- [x] T1 — Honor the transformed hidden-tab descriptor in the custom bar. Cover the real descriptor shape, visible tab order/index mapping, and existing `href: null` behavior. Run focused checks and commit this behavior with its tests. Rollback boundary: custom bar filtering and its regression tests. Commit: `8c23f28` (`fix(navigation): respect hidden tabs in custom tab bar`).
- [ ] T2 — Identify and fix Android cover crop confirmation without removing cropping. Add proportionate regression coverage for the chosen boundary, verify cancellation/error handling, and run applicable closure checks. Commit this behavior with its tests. Rollback boundary: cover picker/crop flow and its regression tests.

## Progress and evidence

- T1 is committed; T2 implementation and focused checks are complete, with post-fix Android runtime verification pending a native rebuild.
- T1 implementation and focused verification are complete; parent readback and commit are complete.
- T1 change: custom-bar filtering now honors Expo Router's `tabBarItemStyle.display === 'none'` descriptor while retaining the original `href: null` check. Regression coverage checks the transformed descriptor, visible order, and preserved route indices, including flattened object and array styles. Authored code/test diff: 22 additions, 3 deletions.
- T1 checks: an initial independent typecheck found TS2339 because the Expo `href` option is outside `BottomTabNavigationOptions`; preserving the prior narrow optional-`href` cast resolved it. `npm run typecheck` then passed (route generation and `tsc --noEmit`, exit 0). `npm test -- --runTestsByPath __tests__/customTabBar.test.tsx` passed (1 suite, 16 tests); emitted Expo icon `act(...)` warnings and Jest's forced-exit notice. `node_modules/.bin/eslint.cmd src/components/CustomTabBar.tsx __tests__/customTabBar.test.tsx` passed with no output. Parent readback confirmed the fix and reported full Jest pass (86 suites, 982 tests); parent `git diff --check` passed.
- T1 runtime: no Android app/device interaction performed; coverage is the Expo descriptor contract in Jest.
- T2 implementation: added an app-owned plugin using installed `withAndroidColors` and `withAndroidColorsNight` mods. It replaces duplicate crop toolbar resource names idempotently, preserves unrelated colors/strings, and gives day/night toolbars and controls contrasting colors. Crop aspect, picker behavior, upload flow, and Expo crop background remain unchanged.
- T2 focused checks: `npm test -- --runTestsByPath __tests__/withImagePickerCropColors.test.js` passed (1 suite, 2 tests). `node_modules/.bin/eslint.cmd plugins/withImagePickerCropColors.js __tests__/withImagePickerCropColors.test.js app.config.ts` passed with no output. `expo config --type prebuild --json` passed with `EXPO_NO_TELEMETRY=1` and `EXPO_OFFLINE=1`; config output was captured and not printed.
- Independent final checks: the affected Jest suites passed (2 suites, 18 tests); `npm run typecheck`, `npm run lint`, `npm run lint:ds` (0 violations), and direct ESLint for the plugin/test/app config all passed. Route generation introduced no additional changes. Existing React `act(...)` warnings and Jest's forced-exit notice remain. Parent structural readback and `git diff --cached --check` passed.
- T2 native resources: in an isolated temporary project, offline Expo config introspection and cached-template `expo prebuild --platform android --no-install` passed. Generated `values/colors.xml` and `values-night/colors.xml` each contain exactly the four expected crop overrides, with no duplicate names.
- T2 native runtime: the pre-fix low-contrast control was reproduced on Android 16/API 36; confirming and cancelling both worked in an isolated harness without backend code. A single offline `gradlew.bat :app:assembleDebug --offline --no-daemon --console=plain` attempt failed while resolving `com.facebook.react.settings` because Gradle's Kotlin DSL cache was missing a `metadata.bin` file. No APK was produced or installed. Post-fix device verification and a real profile upload remain pending; no remote upload was attempted. iOS device verification was unavailable on this Windows host.
- Risk assessment was unavailable due restricted Git metadata access. The conservative high-risk fallback used the independent functional verifier above; RDD remained off and no review lifecycle was started.
- Commits: T1 `8c23f28`; T2 implementation commit pending.
- Next step: commit the verified T2 implementation, then rebuild Android through the normal build workflow and verify cover confirmation/cancellation in the rebuilt app. T2 remains open only for that runtime verification; no source changes or dependency installation are currently required by the observed results.
