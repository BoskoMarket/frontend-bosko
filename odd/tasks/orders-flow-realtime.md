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

## Acceptance
- Neutral Spanish copy, no hardcoded design literals (tokens/DS only), `npm run lint` and `npm test` green.
- Tests: push tap routing, cache invalidation after dispute and push, detail renders date/party/reason.

## Out of scope (next)
Audit items 7-28 (double error toast, stale detail, `?tab=client` redirect, chat unread badge, etc.).

## Progress
Route: delegated writer for T1-T4 (4+ files, non-trivial).

T1-T4 implemented and verified (npm test 1111 pass, lint clean, tsc clean). Not committed.
