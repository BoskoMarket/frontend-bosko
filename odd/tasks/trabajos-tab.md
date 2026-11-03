# Trabajos tab — feed of finished-job photos, detail, Mis trabajos

**Branch:** `feat/trabajos-tab` (stacked on `feat/hide-reels`)
**Engram mirror:** `odd/trabajos-tab/tasks` (pending: not saved by the writer agent)
**TDD:** off (no project/session TDD configuration). Checks: `npx tsc --noEmit -p .`, `npm test -- --runInBand`, `npm run lint`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Backend contract:** `docs/trabajos-feed-contract.md` (final shape).

## Objective

Replace the hidden Reels slot in the tab bar with **Trabajos**: a public gallery of photos of finished jobs. Tapping a photo opens the service for a quote. Providers manage their photos from **Mis trabajos**.

## Decisions (user, 2026-11-03)

- New 5th tab "Trabajos" in the position reels had; visible to everyone.
- Feed: 2-column masonry (photo width/height give the ratio, fixed 4:5 fallback), `thumbnailUrl` in the grid and `imageUrl` in the detail, category chips from the categories query ("Todas" + all), cursor infinite scroll (`getNextPageParam: last => last.nextCursor ?? undefined`), pull-to-refresh, skeleton, error + retry.
- Empty: clients get a friendly message; providers get "Subí tus primeros trabajos" with a CTA to Mis trabajos; per-category empty reuses the message adapted.
- Detail: big image, description, service title + category, provider (avatar, name, rating, verified) -> provider profile, primary CTA **Cotizar** (`quoteHref`), report with `ReportFlow` (hidden on own photos via `canReport`). No likes/comments in this version.
- Mis trabajos (providers): entry in Perfil "Mi negocio" and from the provider empty state; photos per service (`GET /services/:id/posts` for each own service), upload (multipart `image`, description <= 500 with counter, OptionSheet to pick the service when several), edit description (PATCH), delete with confirm dialog. Limit 30 per service with "x/30" and upload disabled at 30. Preflight: JPEG/PNG/WebP, <= 10 MiB.
- Cache: after upload/edit/delete invalidate the feed and the service posts queries (no optimistic updates).
- Posts publish immediately. Reported posts are review-only (no moderation action to build).

## Notable implementation choices

- **Detail data source:** there is no `GET /posts/:id`, so `/work/[id]` reads the item from the cached feed pages (`useWorkFromCache`). A cold deep link (no cache) shows "Esta foto ya no está disponible" with a way back. Replace with a real fetch if the backend adds the endpoint.
- **Masonry:** a pure greedy splitter (`utils/masonry.ts`) assigns each item to the shortest column, tile height from the clamped aspect ratio (0.6-1.6). Rendered in a plain `ScrollView` with scroll-position paging (`NEAR_END_PX`), because `FlatList` cannot do variable-height 2-column masonry.
- **Own photos:** on the detail the report action and the Cotizar CTA are hidden when the viewer is the provider.
- **Reels re-enabled:** with `FEATURES.reels = true` the bar would have 6 tabs (reels next to Trabajos). Decide then whether to drop one.
- Typed routes: new routes (`/work/[id]`, `/(tabs)/profile/my-works`) are cast to `Href` until `expo start` regenerates the typed-routes file.
- Removed the dead posts code (`servicesUser/services/posts.ts` JSON `createPost`/like/comment helpers, orphan `PostsContext`, `useServicePosts`/`useLikePost`).
- Error mapper: `src/features/works/utils/workErrors.ts` (`POST_LIMIT_REACHED`, `RATE_LIMITED`/`UPLOAD_BUSY`, `INVALID_UPLOAD`/`INVALID_MEDIA`, 413, `FORBIDDEN`, not found).

## Tasks

| ID | Task | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | Works service (feed cursor, service photos, multipart create, PATCH, DELETE, report), query keys, hooks, error mapper, image preflight, masonry util; remove old posts code | inline | ✅ | `b99d9d8`, `__tests__/worksService.test.ts` |
| T2 | Trabajos tab: `TABS` entry + `Tabs.Screen`, masonry feed screen (chips, infinite scroll, refresh, skeleton, empty client/provider, error) | inline | ✅ | `f0cd9a6`, `__tests__/worksFeed.test.tsx`, `__tests__/customTabBar.test.tsx` |
| T3 | Photo detail `/work/[id]` (provider, Cotizar, report hidden on own) | inline | ✅ | `__tests__/workDetail.test.tsx` |
| T4 | Mis trabajos (`/(tabs)/profile/my-works`): per-service list, x/30, upload/edit/delete, Perfil row | inline | ✅ | `85aefab`, `__tests__/myWorks.test.tsx`, `__tests__/profileSections.test.ts` |
| T5 | Docs: CLAUDE.md, `odd/nav-map.md`, `odd/nav-flow.html`, this file | inline | ✅ | docs commit |

Route declaration: all tasks inline by the single writer (user asked for one writer; the mapping was done up front by reading the contract and existing screens).

## Checks

See the final report of the run; results recorded at close: `tsc` clean, `lint` 0 errors, `lint:ds` 0, jest full suite (see below).

## Next steps / pending

- Device test against the local backend (upload from the gallery, HEIC handling on iOS, masonry on small screens, 30-photo limit, rate limit 5/min).
- `GET /services/:id/posts` pagination is not specified in the contract: Mis trabajos counts the returned list; if the endpoint paginates (<30 per page) the "x/30" count would be low. Confirm with backend.
- Admin reports label for target `post` lives on branch `feat/admin-reports` (not done here).
- Mirror this document to Engram (`odd/trabajos-tab/tasks`) from the orchestrator.
