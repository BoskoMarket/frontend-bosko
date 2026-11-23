# orders-flow-realtime

Branch: `fix/orders-flow-realtime` (from PR #74 merge 0342a00).
Objective: orders, chat and push reach both roles correctly and in time.
Source: read-only audit of the client/provider flow (this session).
TDD: not resolved; ordinary functional checks (`npm test`, `npm run lint`). Runner: jest-expo.
Delivery strategy: ask-on-risk. Forecast ~300 authored lines.

## Tasks
- [x] T1 Push in foreground and on tap refreshes data: invalidate orders lists, order detail, provider pending count and conversations (`NotificationsContext.tsx`, `useOrdersQuery.ts`).
- [x] T2 Push tap routes to the order using `data.orderId` and backend `ORDER_*` types via `getNotificationRoute`/`isV1NotificationType` (`app/_layout.tsx`).
- [x] T3 Order detail shows requested date (`scheduledDate`), counterparty name, cancellation/dispute reason and who closed it (`OrderDetailScreen.tsx`).
- [x] T4 `useDisputeOrder` patches and invalidates client and provider lists (`useOrdersQuery.ts`).

- [x] T5 Single error surface per order action: remove the duplicate toast in the mutation hooks (`useOrdersQuery.ts` onError) or the dialog in `runAction`, keep one (audit #8).
- [x] T6 Order detail never shows stale state when opened from a push or list: `refetchOrder` on mount in `useOrder` (audit #9).
- [x] T7 After quoting, `router.replace('/(tabs)/orders?tab=client')` so providers see the order they created (`QuoteRequestScreen.tsx`, audit #11).
- [x] T8 Chat unread badge clears: after `markAsRead` in `ChatScreen.tsx` update chat store / invalidate `conversations` (audit #14).

## Acceptance
- Neutral Spanish copy, no hardcoded design literals (tokens/DS only), `npm run lint` and `npm test` green.
- Tests: push tap routing, cache invalidation after dispute and push, detail renders date/party/reason.

## Out of scope (next)
Audit items 7, 10, 12, 13 and 15-28 (stale/offline notification handling, dedup of the conversations source, polling guards, dead code, etc.). Items 1-6, 8, 9, 11 and 14 shipped in PR #76.

## Backend gaps found (API check on 2026-11-23)
Verified with the REST flow (happy, reject, cancel, dispute) against the production API using two test accounts. Not verified: UI, push token, live socket.
- [ ] B1 `GET /orders/:id` does not return the dispute reason or who opened it (only `cancellationReason`). The closure card in `OrderDetailScreen` cannot show it for `disputed` orders until the backend exposes it (e.g. `disputeReason`, `disputedBy`). Request to the backend team pending.
- [ ] B2 No notification reaches the client when the provider starts the job (`IN_PROGRESS`). Confirm whether that is intended.
- [ ] B3 The disputed test order `840d7796…` stays open awaiting support; the API has no way to resolve it.

## Progress
Route: delegated writer for T1-T8 (4+ files, non-trivial).

T1-T8 implemented, verified (npm test 1115 pass, lint and tsc clean, CI green) and merged in PR #76. Still to verify on a dev build with two accounts: push tap routing, badges, cold-start chat from a push.
