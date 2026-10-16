# App loading states — branded splash, no white flashes, consistent headers

**Branch:** `feat/app-loading-states` (from `feat/ds-screen-typography` @ `ffab8d6`)
**Engram mirror:** `odd/app-loading-states/tasks`
**TDD:** off (no project/session TDD configuration). Checks: `npx tsc --noEmit -p .`, `npm test`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Delivery strategy:** `ask-on-risk`. Forecast ~800 authored lines → exceeds ~400; chain strategy asked before slicing PRs.

## Objective

Every wait in the app looks intentional and on-brand: an attractive Bosko splash on start, no white/near-white flashes between screens (login, logout, transitions), skeletons instead of bare spinners, and one consistent screen header.

## Problem / why (investigation 2026-10-15)

- No navigation theme: expo-router falls back to `DefaultTheme` (background `rgb(242,242,242)`); root Stack (`app/_layout.tsx:78`) and Tabs (`app/(tabs)/_layout.tsx:34`) set no `contentStyle`/`sceneStyle` → near-white shows on every transition and ignores dark mode. `app.json` has `userInterfaceStyle: "light"`.
- Login: `app/login/_layout.tsx:19` renders `<Redirect>` (null) as soon as `isAuthenticated` flips while `LogInView.tsx:87-96` still awaits and navigates itself → blank frame + navigation race (welcome-video branch).
- Cold start: native splash hidden when fonts load (`app/_layout.tsx:119-123`), before auth restore → bare spinner without logo (`AuthContext.tsx:265`). `AnimatedSplashScreen` in `app/index.tsx:22` is dead code.
- Logout: three competing redirects (`(tabs)/_layout.tsx:25`, `app/_layout.tsx:71`, `ProfileScreen.tsx:263`) + `qc.clear()` → flash.
- Bare spinners where skeletons belong: ConversationsList:224, OrdersList:162, Payments:170, Plans:155, MyReviews:112, Notifications:241; spinner on unthemed bg: ProviderProfile:54, MyServiceScreen:163; `OnBoarding.tsx:83` returns null.
- Headers: no native headers (all `headerShown:false`); DS `ScreenHeader` + ~20 hand-rolled headers; dead native header options in `app/(tabs)/services/_layout.tsx:9-12`.
- User request: splash must use the Bosko logo "and something more", look attractive.

## Constraints

- DS rules: no raw design literals outside `src/core/design-system/`; tokens, `useThemeColors()`, DS components; no `fontWeight` (guard test).
- Splash animation with reanimated/moti is fine (dev build required, already the case). Respect reduced motion (`AccessibilityInfo.isReduceMotionEnabled` / reanimated `useReducedMotion`).
- Native splash (`expo-splash-screen`, bg `#850021`) must hand off seamlessly to the in-app splash (same background/logo position on first frame).
- `app.json` changes (e.g. `userInterfaceStyle`) need a native rebuild — record it, don't block on it.

## Tasks

| ID | Task | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | Navigation theme from `tc` (ThemeProvider with background = `tc.bg`, card/text/border from tc), root Stack `contentStyle`, Tabs `sceneStyle`, nested Stacks; `userInterfaceStyle: "automatic"` | delegated | ✅ | `75902b5` |
| T2 | Branded `BootSplash` (DS): Bosko logo + brand motion (glow/pulse, wordmark/tagline reveal, subtle progress), hand-off from native splash, holds until fonts + auth restore (+ first app-config fetch with short timeout), fade-out into the app; replaces the AuthContext spinner; remove dead `AnimatedSplashScreen`; showcase entry | delegated | ✅ | `d1872b1` |
| T3 | Login/logout transitions: `LoginLayout` shows `AuthBackdrop` + loader instead of null `Redirect`; single navigation owner after login (no race with welcome video); logout single redirect owner + themed transition | delegated | ✅ | T3_HASH |
| T4 | Skeletons for list screens (Conversations, Orders, Payments, Plans, MyReviews, Notifications), themed loaders for ProviderProfile/MyService, OnBoarding no null frame | delegated | ⬜ | |
| T5 | Headers: unify on DS `ScreenHeader` (title support if missing), migrate hand-rolled headers where equivalent, remove dead native header options | delegated | ⬜ | |

Out of scope (separate task, security): `BiometricLockGate.tsx:33` starts unlocked → never locks on cold start.

## Acceptance criteria

- Cold start: native splash → BootSplash (logo animates) → app, no spinner-only frame, no white frame, in light and dark.
- Login and logout: no white/near-white frame; one navigation per action.
- Lists show skeletons while loading; no `return null` loading frames in touched screens.
- tsc clean, all tests green, `lint:ds` = 0 after each task.

## Progress

- 2026-10-15: document created, branch created. User authorized implementation ("Hazlo") with an attractive branded splash. Next: T1.
- 2026-10-15: T1 done. NavigationTheme hook in DS (useNavigationTheme), ThemeProvider at ThemedRoot, contentStyle on root + nested Stacks, sceneStyle on Tabs. app.json userInterfaceStyle -> automatic (NEEDS NATIVE REBUILD). tsc clean, 431 tests green, lint:ds 0.
- 2026-10-15: T2 done. DS BootSplash (+TOKENS.splash, GRADIENTS.haloRadial, showcase replay) overlays the root until fonts + auth restore + app-config settled (or 1.5s) + 600ms min; native splash released from BootSplash onFirstLayout (6s safety net). AuthProvider renders children while restoring (retry screen only on session error); RootLayoutNav renders no routes until authLoaded. app.json: splash image bosko-logo.png + expo-splash-screen plugin imageWidth 200 (the old splash-icon.png was the Expo placeholder grid) -> NEEDS NATIVE REBUILD. AnimatedSplashScreen removed. tsc clean, 436 tests green, lint:ds 0.
- 2026-10-15: T3 done. LoginLayout redirects only if authenticated on arrival (cold start); a session started on /login shows DS ScreenLoader (new) over the still-mounted screen and the originating screen (LogInView/RegisterView) navigates. Logout: RootLayoutNav is the single redirect owner (removed from (tabs)/_layout Redirect, ProfileScreen, DeleteAccountScreen; VerifyEmail keeps its own since /auth is not a guarded segment); (tabs) renders AuthBackdrop when unauthenticated; AuthContext purges qc/chat/favorites 700ms AFTER logout (flushed on next login). Tests updated: deleteAccount (logout, no direct replace), auth-hydration (waitFor purge). tsc clean, 437 tests green, lint:ds 0.
