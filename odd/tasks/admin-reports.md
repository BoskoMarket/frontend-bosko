# admin-reports

**Objective:** ADMIN moderation queue for user/review/reel reports, per `docs/frontend-media-reports.md` § "Moderación".

**Problem:** the backend ships `GET /admin/reports` and `PATCH /admin/reports/:id`, but the app has no client, screen or entry point for them. Reports are only created, never reviewed.

**Contract:**
- `GET /admin/reports?page&limit&status` → `data.{data,total,page,limit}`; `limit` ≤ 100; `status` ∈ `pending|reviewed|dismissed`, omitted = all. Each item: target, owner, reporter, reason, details, context, date, status.
- `PATCH /admin/reports/:id` `{status: 'reviewed'|'dismissed', notes?}` (notes ≤ 2000) → updated report.
- 403 `FORBIDDEN` → admin-only access. Reviewing does not sanction or delete anything.

**Scope:** frontend only, base `dev`, branch `feat/admin-reports`. No sanctions/content removal actions. No changes to report creation.

**Constraints:** design system only (no literals, `lint:ds`), light/dark theme, cross-platform notes input (no `Alert.prompt`, which is iOS-only), existing strict paginated adapter (`src/core/api/collections.ts`).

**TDD:** off (no project/session config). Runner: `npx jest`. Ordinary functional checks per task.

**Delivery:** `ask-on-risk`. Forecast ~450 authored lines (incl. tests) → single PR expected to be close to the budget; ask before slicing if it grows.

## Tasks

| ID | Task | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | Service + query keys + hooks: `useAdminReports(status)` (infinite, strict adapter), `useReviewReport()` mutation (invalidates the queue). Types for report items. Tests. | delegated (writer trigger: 2+ non-trivial files) | ✅ | efea424 |
| T2 | `AdminReportsScreen` + route `app/admin/reports.tsx`: status filter chips (Pendientes default / Revisadas / Descartadas / Todas), report card (target type, reason label, details, reporter, owner, context, date, status badge), Revisar / Descartar with optional notes (≤ 2000) in a cross-platform sheet, load-more, empty/error/403 states. Tests. | delegated | ⬜ | |
| T3 | Entry point: Perfil row "Moderación" visible only for `role === 'admin'`. Test. | delegated | ⬜ | |

## Acceptance

- Admin sees pending reports, filters by status, marks reviewed/dismissed with optional notes; the item leaves the pending filter after success.
- Non-admin never sees the entry; a 403 shows an "access only for admins" state.
- `npx jest` green, `tsc --noEmit` clean in touched files, `lint:ds` no new violations.

## Progress / evidence

- 2026-10-24: feature document created; branch `feat/admin-reports` from `origin/dev` (`3e165a7`).
- 2026-10-24: T1 done (efea424): service, query key, hooks, 4 tests green.

## Next step

T1–T3 via one delegated writer.
