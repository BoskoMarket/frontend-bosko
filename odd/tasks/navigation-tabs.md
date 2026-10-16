# Navigation tabs — 5 labeled tabs, role-aware

**Branch:** `feat/navigation-tabs` (from `feat/home-redesign` @ `26c40b0`, stacked on PRs #43–#45)
**Engram mirror:** `odd/navigation-tabs/tasks`
**TDD:** off. Checks: `npx tsc --noEmit -p .`, `npm test -- --runInBand`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Delivery strategy:** stacked PRs to `dev`.

## Objective

Reduce the tab bar from 6 icon-only tabs to 5 labeled, role-aware tabs, remove the duplicate Servicios tab, and make Orders/Profile open on what each role needs.

## Problem / why (decision 2026-10-16)

- Today: Inicio, Servicios, Pedidos/Órdenes, Reels, Mensajes, Perfil — 6 tabs, labels not rendered (`src/components/CustomTabBar.tsx` TABS). HIG/Material recommend 3–5; icon-only hurts discoverability.
- After the home redesign, Inicio already has search, categories and popular services → Servicios duplicates it.
- Pedidos and Mensajes stay separate (chat is used more often; Airbnb keeps Trips and Inbox apart).

## Target

| Tab | Client | Provider |
|---|---|---|
| Inicio | Explore (new ClientHome) | Work (ProviderHome) |
| Reels | Discover work | Watch/upload own reels |
| Pedidos | What they hired | Opens on "Órdenes recibidas" (provider segment), badge with pending requests |
| Mensajes | Order chats (unread badge, exists) | Same |
| Perfil | Favorites, settings, become provider | + Mis servicios, verificación, plan |

Notifications stay in the header bell.

## Tasks

| ID | Task | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | Remove Servicios from the tab bar: keep `app/(tabs)/services/*` stack screens reachable (catalog, category, provider profile) but hidden from the bar (`href: null` or move the stack outside `(tabs)` — choose the option that keeps back navigation and deep links working); update all 17 `/(tabs)/services` references (home "Contratar" path, "Ver todas", search, favorites, notifications…) | delegated | ✅ | see commit log (T1) |
| T2 | Tab bar: 5 tabs in order Inicio · Reels · Pedidos · Mensajes · Perfil with visible labels (at least the active label; keep the animated pill), Pedidos label "Órdenes" for providers, accessibility labels | delegated | ✅ | see commit log (T2) |
| T3 | Role-aware Orders: default segment = provider for providers (respect explicit `?tab=`), badge on Pedidos tab with pending provider requests (reuse provider orders query; Mensajes badge pattern) | delegated | ⬜ | |
| T4 | Perfil organization: provider block with Mis servicios, Publicar servicio, verificación, plan; client block with favoritos, convertirme en proveedor; settings; fixed entry points for publishing a service (Perfil › Mis servicios + provider home quick action) | delegated | ⬜ | |
| T5 | Update `odd/nav-map.md`, tests (navigation, tab bar, orders), and CLAUDE.md routing section | delegated | ⬜ | |

## Acceptance criteria

- 5 tabs with labels; no dead route; every former `/(tabs)/services` link still works (back returns to where the user came from).
- Providers land on received orders; pending badge visible.
- tsc clean, tests green, `lint:ds` = 0 after each task.

## Progress

- 2026-10-16: document created, branch created. Next: T1.
- 2026-10-16: T1 done — services tab hidden with `href: null` + `backBehavior="history"`; CustomTabBar filters hidden routes; Contratar -> /search; empty-state CTAs -> /(tabs). Next: T2.
- 2026-10-16: T2 done — 5 labeled tabs (Inicio · Reels · Pedidos/Órdenes · Mensajes · Perfil), role-aware label, a11y role=tab + selected + unread, tab bar test. Next: T3.
