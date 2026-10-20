# Contract follow-ups — remaining audit items doable in the frontend

**Branch:** `feat/contract-followups` (from `feat/contract-alignment-6` @ `b51b876`, stacked on PRs #47–#52)
**Engram mirror:** `odd/contract-followups/tasks`
**TDD:** off. Checks: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit -p .`, `npm test -- --runInBand`, `npm run lint:ds`. Runner: jest (`jest-expo`).
**Review:** each task reviewed (diff + checks) before the next; RDD off (global).
**Delivery strategy:** stacked PR on top of #52.

## Objective

Close the audit findings that the frontend can solve alone, cover the test gaps left by `contract-alignment`, and hand the backend an up-to-date list of what is still missing.

## Scope

In: C10 (remote config 404), C21 (chat push opens the thread), test gaps (reel upload cancel-then-cache), backend requests update.
Blocked (needs backend or a product decision): C04 delete account (BR05), C11 payments/subscriptions mock, C25 real plan limits (depends on C11 and on the `/plans/my-plan` shape), C17 main photo replace, C24 OpenAPI export, C26 admin KYC queue.

## Tasks

| ID | Finding | Task | Route | Status | Evidence |
|---|---|---|---|---|---|
| F1 | C10 | `/app/config`: remember a 404 as "not supported" for the session (no repeated requests), keep fail-open on transient errors | inline | ✅ | see commit log (F1); tsc ok, 49/49 suites (590), lint:ds 0 |
| F2 | C21 | Chat notifications without `orderId`: resolve `conversationId → orderId` from the cached conversations (or fetch) before routing; same in the push tap handler | delegated | ✅ | see commit log (F2); tsc ok, 49/49 suites (597), lint:ds 0 |
| F3 | test gap | Reel upload: test that a finished upload after cancel is cached and not re-uploaded | delegated | ✅ | see commit log (F3) |
| F4 | — | `odd/backend-requests.md`: mark BR01–BR04 shipped, add new requests (pending-orders count, PlanDto benefits + my-plan shape, push `orderId`, main photo replace, admin KYC list, OpenAPI export) | inline | ✅ | see commit log (F4); BR01–BR04 🟡, BR05/BR06 risk notes, BR07–BR12 added |

## Acceptance criteria

- tsc clean, tests green, `lint:ds` = 0 after each task.
- No behavior change for blocked findings.

## Progress

- 2026-10-20: document created, branch created. Next: F1.
- 2026-10-20: F1 done — 404 remembered per session (one request), transient errors still retried; fail-open unchanged. Next: F2.
- 2026-10-20: F4 done — backend-requests statuses + BR07–BR12.
- 2026-10-20: F2 done — `resolveNotificationRoute` + `lookupOrderIdByConversation` (chat store first, one bounded fetch, list fallback); used in NotificationsScreen and the push tap handler. Review fix: push handler only matched `type === 'chat'`; now `isChatNotificationType` (case-insensitive, accepts the backend `NEW_MESSAGE`).
- 2026-10-20: F3 done — reel upload test: late upload after cancel is cached, not published, and the next publish skips the upload.
- Pending decision (user): C04 delete account UX while BR05 is not shipped. Blocked: C11/C25 (payments mock + my-plan shape, BR08), C17 (BR10), C24 (BR12), C26 (BR11).
