# Contract alignment — frontend fixes from the 2026-10-19 API audit

**Branch:** `feat/contract-alignment` (from `dev` @ `9233553`)
**Engram mirror:** `odd/contract-alignment/tasks`
**TDD:** off (same as previous features). Checks: `npx tsc --noEmit -p .`, `npm test -- --runInBand`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Review:** RDD off (global). Each task is reviewed after implementation (diff read + checks) before starting the next one, as requested by the user.
**Delivery strategy:** stacked PRs to `dev` (same as previous features); slices recorded below.

## Objective

Make the app consume the real backend contracts: fix the pure frontend mismatches found by the audit and integrate the endpoints the backend has already shipped.

## Sources

- `auditoria-contratos-bosko-2026-10-19-2.md` (repo root, findings C01–C26)
- `backend-contract-fixes.md` (resend OTP, `ORDER_CLOSED` + `orderStatus`, `order.review`)
- `frontend-media-reports.md` (banner, reel upload, reports, error codes)

## Scope

In: C01, C02, C03, C05, C06, C07, C08, C09, C12, C13, C14, C15, C16, C18, C19, C20, C22, C23.
Out (backend or product decision still pending): C04 delete account, C10 `/app/config`, C11 payments mock, C17 main photo replace, C21 push `orderId`, C24 OpenAPI export, C25 real plan limits, C26 admin KYC queue.

## Tasks

| ID | Finding | Task | Route | Status | Evidence |
|---|---|---|---|---|---|
| T1 | C01 | Adapt `GET /services/featured` (ServiceDto → ServiceSummary) and navigate to provider with `provider.id` only | delegated | ✅ | `b1f7fe3`; tsc ok, 35/35 suites, lint:ds 0 |
| T2 | C02 | Adapt `GET /search` results (services `provider.id`, providers firstName/lastName/avatarUrl, price object) | delegated | ✅ | see commit log (T2); tsc ok, 36/36 suites, lint:ds 0 |
| T3 | C05 | Plan model adapter for `PlanDto` (price `{amount,currency}`, benefits), no crash on `features` | delegated | ✅ | see commit log (T3); tsc ok, 38/38 suites, lint:ds 0 |
| T4 | C20 | Chat: detect video from URL pathname (ignore signed query string) | inline | ✅ | see commit log (T4); `isVideoUrl` test 4/4, tsc ok |
| T5 | C19 | Reels "Siguiendo" tab sends `feed=following` (queryKey), read root `isFollowing` | delegated | ✅ | see commit log (T5); tsc ok, 39/39 suites, lint:ds 0; not device-tested |
| T6 | C15 C16 | Service form: title 10–255 / DTO lengths validated before submit; category locked in edit mode | delegated | ⏳ | |
| T7 | C18 | Quote request: scheduledDate as a real date (ISO) instead of free text | delegated | ⏳ | |
| T8 | C22 C23 | Response types: `imageUrls` on service image upload; normalize order mutation responses | delegated | ⏳ | |
| T9 | C12 | Pagination: keep metadata and load more (orders, own services, notifications, my reels, reviews) | delegated | ⏳ | |
| T10 | C06 | Resend verification OTP (`POST /auth/resend-verification`, 60 s cooldown, generic message) | delegated | ⏳ | |
| T11 | C13 | Order detail uses `order.review` (hide Calificar, show rating, refresh after review) | delegated | ⏳ | |
| T12 | C14 | Chat uses `orderStatus` from conversations and handles `ORDER_CLOSED` (HTTP 409 + socket `error`) | delegated | ⏳ | |
| T13 | C07 | Banner: `POST/DELETE /users/me/banner`, read `bannerUrl`, fallback when null | delegated | ⏳ | |
| T14 | C03 | Reel upload: `video` + optional `thumbnail`, then `POST /reels`; map upload error codes | delegated | ⏳ | |
| T15 | C08 C09 | Reports: user (context profile/chat), review and reel with `{reason,details}`; map report error codes; handle 204 | delegated | ⏳ | |

## Acceptance criteria

- Each finding in scope is fixed per its source contract, with tests covering the adapter/rule.
- tsc clean, tests green, `lint:ds` = 0 after each task.
- No hardcoded design literals (design-system rule).

## Progress

- 2026-10-20: document created, branch created. Next: T1.
- 2026-10-20: T1 done — featured reuse exported `mapService`; `getProviderRouteId` (no service-id fallback) used in ClientHome and CategoryServicesScreen. Next: T2.
- 2026-10-20: T2 done — `adaptSearchResponse` (services via `mapService`, providers name/avatar), SearchPage typed, no empty-id navigation. Note: tsc may need `NODE_OPTIONS=--max-old-space-size=6144`. Next: T3.
- 2026-10-20: T4 done (inline, in parallel with T3 on separate files) — `chat/utils/mediaUrl.isVideoUrl` checks pathname only.
- 2026-10-20: T3 done — `adaptPlan` (price object, `maxServices` → "Hasta N servicios"), interval/description optional and hidden when absent. Review fix: unknown benefit keys are skipped (no raw English labels); `BENEFIT_LABELS` empty until backend PlanDto benefit names are confirmed (backend repo not accessible, `/plans` needs JWT). Next: T5.
- 2026-10-20: T5 done — feed key `['reels','feed','foryou'|'following']`, `feed=following` param, tab resets index/scroll, `getReelIsFollowing` (root first), optimistic follow across both feeds with rollback. Known: unfollowed author stays in "Siguiendo" until refetch. Next: T6.
