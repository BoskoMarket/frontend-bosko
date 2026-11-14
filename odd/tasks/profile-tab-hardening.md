# Profile tab hardening

Branch: `fix/profile-tab-hardening`

## Objective
Fix the confirmed defects of the Perfil tab, harden error handling and make every entry point work.
Backend items are suggestions only (no backend repo work here).

## Scope
Frontend only: `src/features/profile/**`, `app/(tabs)/profile/**`, `src/hooks/useProviderStatus.ts`, `src/hooks/queries/useProfileQuery.ts`.

## Constraints
- Neutral Spanish copy, no voseo (`__tests__/neutralCopy.test.ts`).
- No hardcoded design literals; use DS tokens/components.
- TDD mode: not configured -> ordinary functional checks (`npx jest <focused>`, `npx tsc --noEmit`, `npm run lint:ds`).
- Route: delegated direct (one writer, 2+ non-trivial files). Source: user request "corrige los errores".

## Tasks
- [x] T1 Logout: try/catch + `loggingOut` flag (ProfileScreen)
- [~] T2 Delete account: OUT OF SCOPE here. `feat/account-lifecycle` (origin, PR to dev pending) already reworks DeleteAccountScreen and the 401 interceptor. Re-check on that branch after merge: logout failure after successful delete, 409 only `ACTIVE_ORDERS`, `password.length > 0`.
- [x] T3 Stats: use `useProfileStats()` instead of manual `loadStats`; refresh-failure feedback
- [x] T4 Profile load errors: inline banner when cached profile + error; KYC query error must not downgrade a pending user to `client`
- [x] T5 Hide "Cambiar Contraseña" for Google accounts; map wrong current password in ChangePassword; clear fields on success
- [x] T6 Hide "Métodos de Pago" row while `FEATURES.payments` is false; add "Ayuda y soporte" row (SupportContactButton / WhatsApp) in Información
- [x] T7 Single entry for pending users (badge vs card); a11y: touch targets >= 44, favorites stat nested a11y, locale `es`
- [x] T8 Small fixes: ReelsAutoplayRow accents, `uploadAvatar` real mime type, `useUpdateProfile` double write

## Backend suggestions (not implemented)
- Document error codes: `ACTIVE_ORDERS`, `INVALID_PASSWORD`, `REAUTH_FAILED`, wrong-current-password code.
- `GET /users/me/deletion-eligibility`.
- `authProvider` as real `UserProfile` field.
- Idempotent `DELETE /users/me`.

## Progress
Implemented T1, T3-T8 in one work unit (~273 changed lines). T2 deferred to feat/account-lifecycle.

## Verification evidence
jest: 88 suites, 1013 tests pass; tsc --noEmit clean; lint:ds 0 violations. Not run on device or simulator (banners, toasts, row visibility untested on screen).
