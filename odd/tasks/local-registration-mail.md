# Local registration and verification mail

## Objective and authorization

Fix the server error reported when submitting registration with Barranquilla in the local demo. Enable a working local verification flow and preserve the account created by the failed request. The user's request authorizes local diagnosis and fixes; do not access production, remote accounts or credentials, or send email outside the machine.

Branch: `fix/local-registration-mail`, based on `fix/logout-dialog-city-loading` at `3d3605a`. Preserve the previous dev merge, UI fixes, local demo data, current app session, and existing `.env` override.

## Evidence and approach

- Selecting a city changes local state. Final submission calls `POST /auth/register`.
- The task-owned local API returned HTTP 500 because its SMTP transport tried `127.0.0.1:1025` with no listener. The backend validates the city, saves the user and OTP, then awaits email delivery. Consequently the failed request may already have created an unverified account; do not delete or overwrite it.
- Provide a local-only SMTP inbox that never forwards messages externally. It must bind to loopback, permit the existing local Nodemailer transport to send, and let the workspace owner retrieve the verification code. Keep user messages and credentials out of Git and logs.
- Provide a non-destructive way to reach the existing verify/resend screen if registration reports an already-used email. Preserve the existing authentication and error behavior for other cases.

## Workflow and checks

- Route: delegated direct. Runtime mail handling and the registration recovery UI span multiple files; use a single writer and an independent verifier.
- TDD: off, consistent with the current project task records; runner: Jest with `jest-expo`. RDD is globally off.
- Work units: local mail service and meaningful delivery checks; registration recovery and focused UI tests; final end-to-end verification with a synthetic local account only. About 400 authored lines per task is advisory; forecast 200–350 lines total, delivery strategy `ask-on-risk`.
- No package downloads, remote SMTP, external email, production DB, application credentials or original backend checkout writes. The SMTP sink and inbox must be local-only, with bounded input and escaped display.
- The actual user's partial account is user data. Do not read or disclose its email, password, or code and do not delete it. Synthetic test records must use reserved domains and be cleaned up by exact identity if feasible.
- Local work-unit commits only; no push or PR. Engram mirror `odd/local-registration-mail/tasks` is pending because memory tools are unavailable.

## Tasks

- [x] T1 — Start a reliable local SMTP sink and owner-only inbox using existing dependencies or a small local helper. Verify mail acceptance, local-only bindings, and retrieval without sending external messages. Record runtime/restart details and targeted checks.
- [ ] T2 — Add a safe way to continue verification when registration returns `EMAIL_ALREADY_IN_USE`, preserving all other error paths and existing Spanish product language. Add meaningful focused regression tests.
- [ ] T3 — Verify local registration and resend end-to-end using only a synthetic account, clean up only that account if safe, and document how the owner can continue their partially created account. Report any unavailable UI/device checks.

## Progress

- T1 runtime setup is complete; its checkbox remains open pending the parent work-unit commit. The cached image `public.ecr.aws/supabase/mailpit:v1.30.2` is running in task-owned container `bosko-lwd-a1-mailpit`. Host ports 1025 (SMTP) and 8025 (inbox UI) bind only to `127.0.0.1`. SMTP uses accept-any auth to accommodate the task backend's local credentials; credential values were not inspected. No relay configuration or relay flags are present. Version checks and remote CSS/font access are disabled.
- The initial internal Docker network prevented host port publishing on this engine. That empty task-owned container/network were removed and recreated on the default bridge; the published host bindings were verified as loopback-only and both endpoints are reachable from the host. Mailpit has no configured SMTP relay, so received messages are captured for local viewing and are not forwarded.
- Runtime checks: Mailpit container health is healthy; inbox UI returns HTTP 200; the installed Nodemailer from the read-only backend checkout successfully delivered one synthetic `.invalid` message using synthetic credentials. The inbox returned exactly one match for its unique synthetic subject. Exact-message DELETE returned HTTP 405, so that harmless synthetic message remains in this task-owned inbox; no bulk delete was attempted. No real message contents were read or printed.
- The task-owned local API was restarted from the existing compiled `dist/main.js` in the isolated temp snapshot without reading or changing its `.env`. It runs hidden as PID 10552 from `C:\Users\frank\AppData\Local\Temp\bosko-local-works-demo-20261110-a1\backend`, with stdout/stderr redirected to the sibling `api-mail-restart.stdout.log` and `api-mail-restart.stderr.log`. Source and compiled entry both bind to `127.0.0.1`; health and cities endpoints return HTTP 200, with 2 cities. Existing Postgres and Redis were not restarted. The pre-existing unverified account was not inspected or changed.
- Restart Mailpit after a stop with `docker --host npipe:////./pipe/dockerDesktopLinuxEngine start bosko-lwd-a1-mailpit`; while running, `docker --host npipe:////./pipe/dockerDesktopLinuxEngine restart bosko-lwd-a1-mailpit` preserves its captured inbox in the container. The task-owned backend API is a separate hidden process; do not restart Metro or reload the app during the registration recovery task.
- Checks and commits: runtime verification passed; parent independently confirmed the API and inbox each return HTTP 200. T1 work-unit commit pending.
- Next step: implement T2's non-destructive verification recovery, then run T3 with a synthetic account only.
