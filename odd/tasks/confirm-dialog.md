# ConfirmDialog — themed replacement for `Alert.alert`

**Branch:** `feat/ds-confirm-dialog` (from `feat/ds-t11-rest` @ `c9faee7`)
**Engram mirror:** `odd/confirm-dialog/tasks`
**TDD:** off (no project/session TDD configuration). Checks: `npx tsc --noEmit -p .`, `npm test`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Delivery strategy:** `ask-on-risk` (default). Forecast ~900 authored lines (component ~350 + 24 files migrated) → exceeds ~400; chain strategy asked before slicing PRs.

## Objective

Replace the native `Alert.alert` dialogs with a design-system `ConfirmDialog` that follows the light/dark theme and the brand, and works the same on iOS and Android.

## Problem / why

- 52 `Alert.alert` call sites in 23 files plus `src/lib/permissionAlert.ts` (grep, 2026-10-15). The native dialog ignores the theme and brand (Android shows a Material dialog, iOS a system one).
- Project rule: always use DS components; missing ones are added to the DS first (`CLAUDE.md` → Design system).
- Source: missing-components inventory (Engram `design-system/missing-components`), top priority.

## Scope

- In: DS component + imperative API (`dialog.confirm` / `dialog.alert` / `dialog.choose`) mounted once at the root like `ToastRoot`; showcase entry; tests; migrating every `Alert.alert` call site in `app/` and `src/`.
- Out: `ReasonDialog` (already a DS dialog with text input), `ReportSheet`, BottomSheet/ActionSheet (next components).

## Constraints

- No raw design literals outside `src/core/design-system/` (`lint:ds` = 0).
- Use DS `Text`/`Button`, tokens, `useThemeColors()`. No `fontWeight` with custom fonts (Android fallback, see `typography.ts`).
- Keep every call site's copy and behavior (destructive actions stay destructive, cancel stays cancel).
- Code, comments and UI copy follow the existing project language (UI copy in Spanish as today).

## Tasks

| ID | Task | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | `ConfirmDialog` + `DialogRoot` + imperative `dialog` API in DS, barrel export, mount in `app/_layout.tsx`, showcase section, tests | delegated (writer trigger: 3+ non-trivial files) | ✅ | e570355 |
| T2 | Migrate kyc + admin + plans (`BackgroundCheckScreen`, `KYCDocumentScreen`, `AdminBackgroundCheckScreen`, `PlansScreen`) | delegated | ⬜ | |
| T3 | Migrate orders + reviews + chat + notifications (`QuoteRequestScreen`, `OrderDetailScreen`, `CheckoutScreen`, `ReviewScreen`, `ChatScreen`, `NotificationsScreen`) | delegated | ⬜ | |
| T4 | Migrate reels + servicesUser (`ReelUploadScreen`, `ReelsScreen`, `MyReelsScreen`, `ServiceFormScreen`, `MyServiceScreen`, `ProviderProfileScreen`) | delegated | ⬜ | |
| T5 | Migrate profile + users + auth + lib (`EditProfileScreen`, `ProfileScreen`, `DeleteAccountScreen`, `VerifyPhoneScreen`, `ChangePasswordScreen`, `RegisterView`, `lib/permissionAlert.ts`) + guard test (no `Alert.alert` outside DS) | delegated | ⬜ | |

## Acceptance criteria

- `rg "Alert\.(alert|prompt)" app src` only matches inside `src/core/design-system/` (if anywhere).
- Dialog follows theme, brand gradient on primary action, `danger` tone for destructive actions, back button / backdrop = cancel (unless non-dismissable).
- tsc clean, all tests green, `lint:ds` = 0 after each task.

## Progress

- 2026-10-15: document created, branch created. Next: T1.
- 2026-10-15: T1 done (e570355). API: `dialog.alert/confirm/choose/fromAlert(title,message?,buttons?,{cancelable,onDismiss})` (fromAlert = drop-in for Alert.alert; async onPress keeps dialog open with spinner) + `ConfirmDialog`/`DialogRoot` in DS barrel, mounted in app/_layout.tsx. Checks: tsc clean, jest 25 suites/429 tests green, lint:ds 0.
