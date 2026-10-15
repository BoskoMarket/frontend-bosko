# Screen typography — Bosko type on every screen

**Branch:** `feat/ds-screen-typography` (from `feat/ds-confirm-dialog` @ `bebf556`)
**Engram mirror:** `odd/screen-typography/tasks`
**TDD:** off (no project/session TDD configuration). Checks: `npx tsc --noEmit -p .`, `npm test`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Delivery strategy:** `ask-on-risk`. Forecast ~1500+ authored lines (≈71 files) → exceeds ~400; chain strategy asked before slicing PRs.

## Objective

Every text in the app renders in the Bosko typography (Archivo for UI/body, JetBrains Mono for meta) on iOS and Android.

## Problem / why

- ≈71 files outside the design system use React Native `Text` with their own `StyleSheet` and no `fontFamily` → system font (Roboto on Android). React 19 removed `Text.defaultProps`, so there is no global fix.
- ≈38 of them set `fontWeight`. With a custom expo-font family, `fontWeight >= 700` falls back to Roboto on Android (expo-font registers faces as NORMAL; RN maps >= 700 to BOLD). See `src/core/design-system/typography.ts`.
- User request 2026-10-15: "los texts, para usar la tipografía de Bosko".

## Approach

- Prefer the DS `Text` with the closest `TYPE_SCALE` variant (`<Text variant="title">`), passing `color` / `weight` / `style` for layout-only overrides.
- Where a component must keep RN `Text` or a `TextInput` (e.g. animated text, inputs), spread the preset into the style (`...TYPE_SCALE.body`) or set `fontFamily: FONT_FAMILY.*`.
- Remove every `fontWeight` on these texts; pick weight through the family (`FONT_FAMILY_BY_WEIGHT` / DS `Text weight`): 400 body, 500 bodyMedium, 600 headingMedium, 700 heading, 800 display.
- Keep sizes and line heights visually close: map to the nearest preset; if a size has no preset and is used deliberately (hero numbers, badges), keep `fontSize` but still set the family.
- No visual redesign, no copy changes, no layout changes.

## Tasks

| ID | Scope | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | Shared: `src/components/*`, `src/core/components/*` (CustomTabBar, BrandMark, Premium*, ProviderCTA, FeaturesSection, CategoryVideoCarousel, banners, ErrorBoundary, BiometricLockGate) | delegated | ✅ | 5b9334d |
| T2 | Auth + app gate: `src/features/auth/**`, `src/features/appConfig/**` | delegated | ✅ | feaaa33 |
| T3 | Marketplace: `src/features/servicesUser/**`, `src/features/search/**` | delegated | ⬜ | |
| T4 | Orders, payments, plans, chat, notifications | delegated | ⬜ | |
| T5 | KYC, admin, profile, users, reels, reviews, favorites + guard test (no `fontWeight` and no RN `Text` without `fontFamily` outside DS — at minimum a `fontWeight` guard) | delegated | ⬜ | |

## Acceptance criteria

- `rg "fontWeight" app src -g '!src/core/design-system/**'` → 0 (or only documented exceptions).
- No RN `Text`/`TextInput` style without a Bosko family outside the DS (guard test or documented exceptions).
- tsc clean, all tests green, `lint:ds` = 0 after each task.

## Progress

- 2026-10-15: document created, branch created. Next: T1.
- 2026-10-15 T1 done (5b9334d): 8 files; fontWeight -> weight-matched FONT_FAMILY face, size-only styles get FONT_FAMILY.body; sizes/line heights untouched (no preset snapping). tsc/jest(430)/lint:ds = clean.
- 2026-10-15 T2 done (feaaa33): 5 files (most auth screens already used DS Text/Input). Checks clean.
