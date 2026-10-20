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
| T6 | C15 C16 | Service form: title 10–255 / DTO lengths validated before submit; category locked in edit mode | delegated | ✅ | see commit log (T6); tsc ok, 40/40 suites, lint:ds 0 |
| T7 | C18 | Quote request: scheduledDate as a real date (ISO) instead of free text | delegated | ✅ | see commit log (T7); tsc ok, scheduledDate 5/5, lint:ds 0 |
| T8 | C22 C23 | Response types: `imageUrls` on service image upload; normalize order mutation responses | delegated | ✅ | see commit log (T8); tsc ok, 42/42 suites, lint:ds 0 |
| T9 | C12 | Pagination: keep metadata and load more (orders, own services, notifications, my reels, reviews) | inline (Codex) | ✅ | tsc ok, 44/44 suites (536 tests), lint:ds 0; no device test |
| T10 | C06 | Resend verification OTP (`POST /auth/resend-verification`, 60 s cooldown, generic message) | inline (Codex) | ✅ | tsc ok, 45/45 suites (538 tests), lint:ds 0; no device test |
| T11 | C13 | Order detail uses `order.review` (hide Calificar, show rating, refresh after review) | inline (Codex) | ✅ | tsc ok, 47/47 suites (542 tests), lint:ds 0; no device test |
| T12 | C14 | Chat uses `orderStatus` from conversations and handles `ORDER_CLOSED` (HTTP 409 + socket `error`) | inline (Codex) | ✅ | tsc ok, 47/47 suites (544 tests), lint:ds 0; no device test |
| T13 | C07 | Banner: `POST/DELETE /users/me/banner`, read `bannerUrl`, fallback when null | inline (Codex) | ✅ | tsc ok (6 GB heap), 47/47 suites (546 tests), lint:ds 0; no device test |
| T14 | C03 | Reel upload: `video` + optional `thumbnail`, then `POST /reels`; map upload error codes | inline (Codex) | ✅ | tsc ok, 47/47 suites (549 tests), lint:ds 0; no device test |
| T15 | C08 C09 | Reports: user (context profile/chat), review and reel with `{reason,details}`; map report error codes; handle 204 | inline (Codex) | ✅ | tsc ok, 47/47 suites (556 tests), lint:ds 0; no device test |

## Delivery slices

| Slice | Tasks | Commits | PR |
|---|---|---|---|
| S1 — frontend-only contract bugs | T1–T8 | `b1f7fe3`..`53904b0` (~965 changed lines incl. tests/doc) | pending (user decision) |
| S2 — pagination + backend-shipped integrations | T9–T15 | see commit log (T9–T15) | pending (user decision) |

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
- 2026-10-20: T6 done — `serviceFormRules.validateServiceFields` (title 10–255, description ≥20), inline title error + counter, `maxLength`. Decision: category not editable after publishing (backend UpdateServiceDto has no categoryId) → chips disabled in edit mode with helper text. Next: T7.
- 2026-10-20: T7 done — day chips (14 days) + slot chips (9/14/19 h) → ISO `scheduledDate`, no new dependency. Review fix: `availableSlots` hides past slots for today and drops today when none left. Next: T8.
- 2026-10-20: T8 done — `normalizeOrder` (lowercase status, flat ids from nested participants) on every orders service return; `uploadServiceImages` typed `{ imageUrls }`. Next: T9.
- 2026-10-20: T9 implemented — strict paginated response adapter + infinite queries with retry/load-more for orders, own services, notifications, my reels and reviews; public profile reviews get a manual next-page action. Pending-provider count reads all pages (no first-page inference), account deletion waits for all order pages. Reviewed cache updates, screen loading/next-page failures and tests: tsc clean, 44/44 suites, lint:ds 0. Work-unit commit and device checks pending. Next: T10.
- 2026-10-20: T10 implemented — resend registration verification via the public endpoint, 60-second time-based cooldown (including failures), generic 200 feedback and no account-existence leak. Reviewed duplicate-tap guard, HTTP 429 and network error feedback. tsc clean; 45/45 suites (538 tests). Work-unit commit and device checks pending. Next: T11.
- 2026-10-20: T11 implemented — detail refetches on focus, displays `order.review` to both participants, only offers Calificar to the unreviewed client and no longer claims a reviewed completed order can be rated. Creating a review invalidates the detail by request orderId (not relying on response shape); ALREADY_REVIEWED also invalidates. UI and mutation regressions added. tsc clean, 47/47 suites (542 tests), lint:ds 0. Work-unit commit and device checks pending. Next: T12.
- 2026-10-20: T12 implemented — conversation `orderStatus` (nullable) contributes to the chat read-only state without losing a closed snapshot to a stale order query; HTTP 409 is recognized only with `ORDER_CLOSED`. Socket `error` dispatches typed failures to the active chat; rejection locks composition immediately, warns the user, and refreshes order/conversation state. All text, media, documents and audio paths recheck read-only state before sending; active recording/typing is cancelled. Verified socket dispatch and status rules, tsc clean, 47/47 suites (544 tests), lint:ds 0. Work-unit commit and device checks pending. Next: T13.
- 2026-10-20: T13 implemented — existing edit UI now sends the selected JPEG/PNG/WebP MIME and rejects oversized images; upload/delete keep `bannerUrl` synchronized with the profile query, deletion uses the actual `{bannerUrl:null}` response. Public provider profile displays `bannerUrl` over its brand gradient and keeps the gradient fallback when null. Removed stale "endpoint pending" copy. tsc clean (6 GB heap after an OOM while checks ran concurrently), 47/47 suites (546 tests), lint:ds 0. Work-unit commit and device checks pending. Next: T14.
- 2026-10-20: T14 implemented — optional JPEG/PNG thumbnail picker (5 MiB) sends multipart `thumbnail` beside `video`; uploader still publishes only after the server returns `videoUrl`. Video preflight rejects known unsupported MIME and zero duration; backend codes `UPLOAD_BUSY`, `INVALID_UPLOAD`, `PROVIDER_REQUIRED`, media errors and oversized payloads get distinct feedback. Cancellation before POST /reels stops publication; cancel button is available only while upload is active. tsc clean, 47/47 suites (549 tests), lint:ds 0. Work-unit commit and device checks pending. Next: T15.
- 2026-10-20: T15 implemented — report sheets accept optional details for any reason and require trimmed text for `other`; reel report sends separate `{reason,details?}` and treats 204 as success. User profile/chat contexts and review report payloads remain explicit. Error handling distinguishes missing content, self/own review, nonparticipant, invalid form, duplicate within 24h and rate limiting; unknown 409 stays retryable. Reel reporting is hidden until user ownership is known. tsc clean, 47/47 suites (556 tests), lint:ds 0. Feature scope implemented; work-unit commits and device checks pending.
- 2026-10-20: Review of T9–T15 (independent read-only reviewer) found 3 defects, fixed before committing: (1) ServiceFormScreen `myServices` flatMap not memoized → prefill effect looped and reset the form; (2) socket `ORDER_CLOSED` required a `conversationId` the contract never sends → accept `{code,message}`; test fixture now copies the contract; (3) DeleteAccountScreen gated on `isFetching` → background refetch unmounted the confirmation step. Not fixed (minor/latent): `NO_FILE_UPLOADED` maps to the generic format message; pending-count query refetches pages alongside the list. Checks after fixes: tsc ok, 47/47 suites (557 tests), lint:ds 0. Commits: one per task; files touched by several tasks are committed with the task that changed them most (reels.service → T14; useReelsQuery, catalog, ProviderProfileScreen → T9), so intermediate commits may not type-check alone. Device checks pending.
