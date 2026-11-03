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

`tsc` clean; `npm run lint` 0 errors; `npm run lint:ds` 0; jest 61 suites / 676 tests passing (run with --forceExit: the plain run hangs on open handles).

## Next steps / pending

- Device test against the local backend (upload from the gallery, HEIC handling on iOS, masonry on small screens, 30-photo limit, rate limit 5/min).
- `GET /services/:id/posts` pagination is not specified in the contract: Mis trabajos counts the returned list; if the endpoint paginates (<30 per page) the "x/30" count would be low. Confirm with backend.
- Admin reports label for target `post` lives on branch `feat/admin-reports` (not done here).
- Mirror this document to Engram (`odd/trabajos-tab/tasks`) from the orchestrator.

## Review round 1 (findings and fixes)

| # | Finding | Fix |
|---|---|---|
| R1 | Mis trabajos asked for library permission and aborted on denial | Removed `requestMediaLibraryPermissionsAsync`; `launchImageLibraryAsync` is called directly (system picker, expo-image-picker 17) |
| R2 | Large / HEIC photos hit the 10 MiB preflight or the server | `prepareWorkImage`: `expo-image-manipulator` (already a dependency) resizes to 2048 px long side and re-encodes JPEG 0.85 before the preflight; undecodable files show "Formato no compatible" |
| R3 | Delete 404 left a stale state; writes invalidated only on success; uploads timed out | `deleteWork` treats 404 `POST_NOT_FOUND` as success; create/update/delete invalidate feed + service posts in `onSettled`; `createWork` timeout 120 s; filename `work-<timestamp>.<ext>` |
| R4 | Per-service errors invisible, upload enabled before the count was known, only first page of services | Error state with "Reintentar"; "Subir foto" disabled until counts load; all pages of own services loaded (`fetchNextPage` loop); `useServicesWorks` uses `useQueries` `combine` |
| R5 | Detail did not react to cache changes | `useWorkFromCache` uses `useSyncExternalStore` over the query cache subscription; a deleted/edited photo updates while open (deleted -> "Esta foto ya no está disponible") |
| R6 | Scroll paging could cancel pull-to-refresh and never fired on short content | `fetchNextPage({ cancelRefetch: false })`, skipped while `isRefetching`; auto-fetch when content is shorter than the viewport; tiles use `cachePolicy="memory-disk"` + `recyclingKey` |
| R7 | WorkFormSheet had its own modal plumbing | New DS `BottomSheet` (modal + backdrop + handle, `dismissible`, backdrop `accessibilityRole`), used by `WorkFormSheet`; backdrop / back disabled while busy; last image kept during the close animation; preview `accessibilityLabel`. `OptionSheet` / `ReportSheet` left as is (not covered enough to refactor safely) |
| R8 | Error copy gaps | `VALIDATION_ERROR` (PATCH > 500), network/timeout upload copy ("Se cortó la subida, revisá tu conexión..."), `UPLOAD_BUSY` 429 and generic 429 tested |
| R9 | Small | useCallback deps use the destructured query fns; `TAB_BAR_CLEARANCE` (DS, replaces `+110`); star uses `TOKENS.color.rating`; stray blank line removed |
| R10 | Tests lacked a real QueryClient | `__tests__/worksCache.test.tsx`: invalidation on create/update/delete (also on failure), delete of an already-removed post, `useWorkFromCache` over cached pages + updates, per-category feed keys |

Not a bug (verified): `provider.id` in the feed is the User id (same as `profile.id`). The feed lives inside the protected `(tabs)` group by design (the endpoint is public, but the app requires login to reach the tab).

### Deferred

- **Virtualization:** the masonry is a plain `ScrollView` (all loaded tiles stay mounted). Follow-up: FlashList masonry (needs a new dependency; none allowed in this round).
- `OptionSheet` / `ReportSheet` could be rebuilt on `BottomSheet`.
- Cold deep link to `/work/[id]` still needs a `GET /posts/:id` endpoint.

### Evidence (review round 1)

`npx tsc --noEmit -p .` clean; `npm run lint` 0; `npm run lint:ds` 0; jest `--forceExit` all green (see final run in the commit history).
