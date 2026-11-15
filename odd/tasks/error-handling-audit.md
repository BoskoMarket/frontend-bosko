# Error handling audit (frontend only)

Source: `app-error-handling-audit.md` (backend `7c294b7`, frontend `dev` `f19a0c6`). Backend items (#1, emitted codes) are out of scope.

- Branch: `fix/error-handling-audit` from `origin/dev`.
- TDD: not resolved yet; runner `npx jest`. Functional checks per task.
- Delivery: ask-on-risk; ~400-line heuristic per task.

## Tasks

- [x] T1 `lib/errors`: cancellation is not network error (#6); `getErrorKind` (offline/rate/forbidden/notfound/server); catalog parity with backend codes (#2); `requestId` to Sentry/log context (#5)
- [x] T2 Works feed: use mapper per error kind, strict collection reader, pagination-error footer (#3)
- [ ] T3 Boolean-error screens use mapper: Orders list, ClientHome, ProviderHome, Search, Conversations (#4)
- [ ] T4 Silent `catch {}` + raw `error.message`: admin/KYC/forgot/payment (#4)
- [ ] T5 Unify retry (`runWithRetry` vs queryClient vs conversations backoff) (#7)
- [ ] T6 Field `details[]` in forms beyond Register (#8)
- [ ] T7 Stale comments/docs: banner routes exist (`EditProfileScreen`, `bannerErrors`) + contracts doc

## Progress
Route per task recorded below as work starts.
- T1: route delegated direct (writer). Checks: jest full 90 suites green, tsc clean, lint:ds 0.
- T2: route direct inline (3 source files, understood scope). Added `readCursorCollection` (strict cursor-page reader; `readPaginatedCollection` needs total/page/limit, which the feed lacks). Feed error uses `getLoadErrorMessage`; footer retry on `isFetchNextPageError`; auto-paging paused while that error is set. Checks: jest full 90 suites / 1029 tests green, tsc clean, lint:ds 0.
