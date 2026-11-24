# Focused sub-screens — tab bar only on tab roots, standard headers

**Branch:** `feat/focused-subscreens` (from `dev` @ `87aef15`)
**Engram mirror:** `odd/focused-subscreens/tasks`
**TDD:** off. Checks: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit -p .`, `npm test -- --runInBand`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Review:** parent reviews the diff + checks; `/code-review` skipped for this PR (user decision 2026-10-20, to save tokens).

## Objective

Make sub-screens feel like part of the same app: hide the floating tab bar on every screen pushed from a tab (task flows such as becoming a provider, KYC, settings) and use the standard `ScreenHeader` on the two screens that still use a wine gradient banner.

## Decisions (user, 2026-10-20)

- Tab bar visible only on the 5 tab roots (Inicio, Reels, Pedidos/Órdenes, Mensajes, Perfil). Hidden on nested screens of the Perfil stack and on the hidden `services` stack (catalog/category/provider opened from Inicio). Back button is the way out.
- `BecomeProviderScreen` and `ServiceFormScreen`: drop the `LinearGradient` banner + `tone="onBrand"`; standard `ScreenHeader` on the theme background like the other ~27 screens.

## Tasks

| ID | Task | Route | Status | Evidence |
|---|---|---|---|---|
| N1 | `CustomTabBar`: render nothing unless the focused route is a visible tab at its stack root (`route.state` undefined or `index === 0`); hidden `services` route never shows it; tests | delegated | ✅ | see commit log (N1) |
| N2 | Remove the extra bottom padding reserved for the tab bar on sub-screens that no longer show it, where it leaves an obvious empty gap (only if a shared constant/pattern makes it safe) | delegated + inline | ✅ | see commit log (N2) |
| N3 | `BecomeProviderScreen` + `ServiceFormScreen`: standard `ScreenHeader` (default tone), status bar follows the theme; tests | delegated | ✅ | see commit log (N3) |
| N4 | Docs: CLAUDE.md tab bar rules + `odd/nav-map.md` | delegated | ✅ | see commit log (N4) |

## Acceptance criteria

- Tab bar only on the 5 roots; every nested screen has a working back button.
- Become provider and service form look like the rest of the app (same header, same back button).
- tsc clean, tests green, `lint:ds` = 0.

## Progress

- 2026-10-20: document created, branch created. Next: N1–N4 (one writer).
- 2026-10-20: N1–N4 done — shouldShowTabBar (visible tab at stack root only); BecomeProvider + ServiceForm use the standard ScreenHeader; docs. N2: no shared constant; fixed ServiceForm (writer) + Favorites, Services, CategoryServices, ProviderProfile (+100/+110 → SPACING.xxxl). CheckoutScreen (+120) left: it lives in the root orders stack, bar never showed there. Checks: tsc ok, 52/52 suites (635), lint:ds 0. /code-review skipped (user).
