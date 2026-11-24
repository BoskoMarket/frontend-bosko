# docs-status-refresh

Branch: `docs/status-and-archive` (from origin/dev a516cd5 + PR #78).
Objective: a teammate can read one page and know what is done, open, untested and risky; stale docs are archived or corrected.
Source: read-only audit of docs/ and odd/ (this session, 2026-11-24).
TDD: not applicable (docs only). Checks: `npm test` (copy and doc-path tests), `npm run lint`.
Delivery strategy: ask-on-risk. Forecast ~500 authored lines, mostly prose, one PR.

## Tasks
- [x] T1 Archive finished material: 18 closed `odd/tasks/*`, `docs/AUDITORIA_FRONTEND_MVP.md`, `docs/auditoria-contratos-bosko-2026-10-19-2.md`, `odd/assets/home-redesign-mock.html` moved with `git mv` to `docs/archive/` and `odd/archive/` (route: inline, mechanical).
- [x] T2 `docs/STATUS.md`: single status page (done, open tasks, never verified on device, risks, hidden-by-flag code, open product decisions).
- [x] T3 Fix `CLAUDE.md` drift: stack versions, routes (`admin/background-check`, `terms`, `welcome-video`, `service-form`, `orders/*`, `dev/components`), stores (`appLock`, `notificationsUI`, `theme`), features table (`admin`, `reports`), link to STATUS.md and to the archive.
- [x] T4 Rewrite `docs/FLOWS.md` from PRD section 5 (no Reels tab, no simulated payments, current order flow).
- [x] T5 Reconcile `odd/backend-requests.md` with the 2026-11-08 contract docs (delivered vs pending); extract still-open items of `odd/ux-gaps.md` and `odd/backlog-fixes.md` into STATUS.md, then archive both.
- [x] T6 Fix dangling references (nav-map.md, backlog-fixes.md point to archived files) and the `PAYMENTS_MODE = 'mock'` wording note.

## Acceptance
- Every doc left outside the archive is current or says what is outdated; no link points to a moved file.
- STATUS.md claims are each backed by a file path or marked unverified.
- `npm test` and `npm run lint` green.

## Out of scope
Code changes (chat retry bubble, B1-B3 backend gaps, device testing). Listed in STATUS.md only.

## Progress
T1 done. Route for T2-T6: one delegated writer (5 non-trivial files).
T2-T6 written 2026-11-24 (STATUS.md, CLAUDE.md, FLOWS.md, backend-requests.md reconciled, ux-gaps/backlog-fixes archived, nav-map.md links fixed). `PAYMENTS_MODE` is listed in STATUS.md open item 18 rather than changed (code is out of scope). Checks: npm test 1115 pass, lint clean. Committed on this branch.
