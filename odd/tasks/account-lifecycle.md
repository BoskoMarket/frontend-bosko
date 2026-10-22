# account-lifecycle

**Objective:** align the frontend with the backend contracts `frontend-account-lifecycle.md` (account deletion + 30-day recovery) and `frontend-app-config.md` (`GET /app/config`).

**Problem:** most of the flow already exists (`DeleteAccountScreen`, `deleteAccountService`, `useAppGate`), but:
- Google re-auth sends the raw Google idToken; the backend expects a fresh **Firebase** ID token (UID + `auth_time` < 5 min).
- The axios interceptor treats `401 INVALID_PASSWORD` / `REAUTH_FAILED` as an expired token, refreshes and retries the DELETE → each wrong password burns 2 of the 3 attempts/minute.
- Missing error mappings: `INVALID_CREDENTIALS` (session revoked → log in), `VALIDATION_ERROR`, `429`.
- Copy promises a full wipe ("tus datos se eliminan definitivamente") and Premium loss without refund; the contract anonymizes, keeps shared history and does not touch payments.
- `appConfig.service.ts` comment says the endpoint does not exist.

**Scope:** frontend only, base `dev`. No payments/KYC changes.

**TDD:** off (no project/session config). Runner: `npx jest`. Ordinary functional checks per task.

**Route:** direct inline for every task (understood change, ≤ 3 non-trivial files per task; user token-budget rule).

## Tasks

- [x] T1 — Interceptor: do not refresh on business 401s (`INVALID_PASSWORD`, `REAUTH_FAILED`). Test in `api-session.test.ts`. — `a5bbafe`
- [x] T2 — `useGoogleReauth` returns a fresh Firebase ID token (Google credential → `signInWithCredential` → `getIdToken`). Test `googleReauth.test.ts`. — `fc7bc20`
- [x] T3 — `DeleteAccountScreen`: map `INVALID_CREDENTIALS`, `VALIDATION_ERROR`, `429`; honest deletion-scope and Premium copy. Tests in `deleteAccount.test.tsx`. — `0e68fed`
- [x] T4 — `appConfig.service.ts`: update the stale comment. — see last commit

## Acceptance

- Full `npx jest` green.
- Wrong password → one request only, inline "Contraseña incorrecta".
- `INVALID_CREDENTIALS` → logout + toast to log in again.

## Progress / evidence

- Full `npx jest`: 53 suites / 644 tests green. `tsc --noEmit`: no errors in touched files.
- Pending (needs dev build + test account, not runnable here): real Google re-auth against the backend, recovery by login within 30 days.
- RDD: not run in this session.
- Next step: push `feat/account-lifecycle` and open a PR to `dev` (user decision).
