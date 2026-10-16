# Home redesign — a home that explains Bosko

**Branch:** `feat/home-redesign` (from `dev` @ `9a935a1`)
**Engram mirror:** `odd/home-redesign/tasks`
**Visual reference:** `odd/assets/home-redesign-mock.html` (open in a browser; role/theme/cards toggles). Published mock: https://claude.ai/artifact/6jPiAWu39St8syoHxubgiW
**TDD:** off. Checks: `npx tsc --noEmit -p .`, `npm test`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Delivery strategy:** stacked PRs to `dev` (user choice 2026-10-16). Forecast ~900 authored lines → chained PRs if over ~400.

## Objective

The home tells a first-time user what Bosko is (find someone to do a job, or offer your own services), how it works and why to trust it, then lets them explore categories and popular services with better-looking cards. Providers get a home focused on their work.

## Decisions (2026-10-16)

- "Publicar" = providers publish their services (existing feature). Clients posting job requests is a new feature, out of scope until the user decides.
- Service cards: direction **B — Ficha** (image 4:3 on top with "Disponible hoy" pill when `isAvailable`; body: mono category · location, title, ★ rating (count), price). Built as one DS component so the style can change in one place.
- Provider metrics: show only data the app already gets (e.g. `GET /users/me/stats`, provider orders). Hide blocks without data (profile completeness, response time) — no fabricated numbers.
- Dev builds must open on the real home; the component showcase moves to `/dev/components` (route already exists) with a dev-only entry point.

## Tasks

| ID | Task | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | Fix regression: `dialog.fromAlert` not dismissable by backdrop/back by default (parity with native Android `Alert`), keep explicit `cancelable: true` opt-in; test. Prevents duplicate orders after "¡Solicitud enviada!" | delegated | ✅ | f6242e4 |
| T2 | Home shows the real Dashboard in dev builds; showcase reachable at `/dev/components` (dev-only entry, e.g. long-press logo or a dev row in Profile) | delegated | ✅ | see git log (`chore(home)`) |
| T3 | DS components for the home: `ServiceCard` (B), `ValueHero` (value prop + search trigger), `PathCard` (Contratar/Ofrecer), `StepCard`, `TrustRow`, `StatTile`; showcase entries + tests | delegated | ✅ | see git log (`feat(design-system)`) |
| T4 | Client home rewrite (`DashboardScreen`): top bar (logo, zone, notifications), value hero with search → `/search`, two paths (Contratar → services/search, Ofrecer → become-provider or provider tools), how-it-works, categories, popular services (ServiceCard, skeleton/error/empty), trust rows, "Ganá con tu oficio" CTA | delegated | ✅ | see git log (`feat(home): explain`) |
| T5 | Provider home: summary with new requests count → Orders provider tab, stats from existing endpoints, quick actions (publicar servicio, mis servicios, subir reel), recent requests list; loading/error/empty states | delegated | ⬜ | |

## Acceptance criteria

- First-time client sees value prop, two paths, how it works and trust signals without scrolling past categories.
- All navigation targets exist; no dead buttons.
- Light and dark themes; no raw literals (`lint:ds` = 0); no `fontWeight`; skeletons for loading.
- tsc clean, tests green after each task.

## Progress

- 2026-10-16: document created, branch created, mock copied to `odd/assets/`. Next: T1.
- T1 done (f6242e4): fromAlert non-dismissable by default; tests updated. T2 done: tab index always renders DashboardScreen; dev-only "Component showcase" row (Profile > Preferencias) -> /dev/components.
- T3 done: ServiceCard (+formatServicePrice), ValueHero, PathCard/StepCard/TrustRow/StatTile in DS barrel + showcase HomeSection + __tests__/homeComponents.test.tsx (454 tests green).
- T4 done: ClientHome (new) behind DashboardScreen wrapper; CategoryTile added to DS; featured services/categories via TanStack hooks; zone from profile.location; zone/bell/CTA wired. Provider branch still legacy until T5.
