# Local works demo and Favorites investigation

## Objective and authorization

Populate sample work posts so the app's Trabajos tab can be previewed, and investigate the reported Favorites failure through real API requests. The user delegated environment selection; use a new isolated local environment with task-owned credentials and data. No production or remote database access, ambient credentials, repository fetch, deployment, or remote mutations are authorized.

Frontend branch: `chore/local-works-demo`; it now includes the dev synchronization merge `c6ec62e` (initial base `ab242c1`). Preserve the previous tab and Android crop fixes. Backend source: the already-cached `bosko-backend` ref `origin/main` at `efbc464`; its checked-out `main` is 54 commits behind and must stay untouched.

## Findings and constraints

- The current cached backend supports the feed, multipart work uploads, and account Favorites. The old checked-out backend does not reflect that version.
- Latest seed creates 12 external-image work posts across six demo providers and puts demo users/services in Tandil. `POSTS_ALLOW_EXTERNAL_IMAGES=true` is appropriate only for this local demo.
- The seed deletes existing data. Run it only against the newly created task-owned empty database after checking its local destination and emptiness. Never run it against the existing backend configuration.
- Docker's explicit local Linux engine is running. Cached PostGIS, Redis, and a MinIO server image are available; select unused local ports and dedicated container/volume names.
- Start from a temporary backend snapshot with its own environment file. Do not copy actual backend credentials. Prisma generation must not write through a dependency junction into the original checkout.
- Email/password login is handled by the backend; Google login is separate. Use demo client accounts for API checks, and do not print passwords, tokens, private keys, or connection secrets.
- A fresh local success cannot establish the cause of the original environment's failure. Report that limitation honestly.

## Workflow and checks

- Route: delegated direct. Backend setup spans multiple files/components and real runtime checks; one worker owns mutations, followed by an independent verifier.
- TDD: off for this environment/data task. No application behavior change is planned. Existing frontend runner is Jest with `jest-expo`; the Favorites suite already passed 11 mocked tests.
- RDD: globally off; do not start review or change its mode.
- Delivery: local work-unit commits only, no push or PR. Forecast under 150 authored tracked lines, mostly this recovery record; temporary runtime files and secrets must stay out of Git.
- Engram mirror `odd/local-works-demo/tasks`: pending because memory tools are unavailable. Read back and maintain this local record.

## Tasks

- [x] T1 — Start an isolated backend from cached current source, apply migrations to its new local database, load demo profiles/services/work posts, and verify the feed returns the sample posts. Record non-secret runtime locations, ports, owned resource names, and exact outcomes. Rollback boundary: only the task-owned runtime processes, containers, and volumes.
- [ ] T2 — Independently exercise authenticated Favorites add/list/idempotency/remove and relevant rejection cases, then configure the frontend's local-only API URL for the chosen demo if feasible while preserving other configuration. Record whether the reported failure is reproduced, and provide a usable demo sign-in path. Do not invent a fix or change unrelated application code. Rollback boundary: the local API URL override and test favorites in the task-owned database.

## Progress

- Read-only exploration confirmed the cached backend source, seed eligibility, and local-only auth path. The first resource check found no pre-existing task-owned directories, containers, or volumes; T1 then created a fresh isolated environment.
- T1 runtime setup and feed proof completed; work-unit commit remains pending parent handling. The cached `origin/main` snapshot and generated client live under `%TEMP%\bosko-local-works-demo-20261110-a1\backend`; the original backend checkout and its dependency tree were not used as write targets. The temp snapshot has one local-only adaptation: `src/main.ts` listens on `127.0.0.1` instead of all interfaces. Prisma Client 7.10.1 was generated into the temp physical client from the current schema. `pnpm install --offline` was attempted but stopped before package linking because the local store lacks pnpm 10.33.2 / `@eslint/js` metadata; no dependencies were downloaded. Build and seed used already-installed local tools directly.
- Task-owned resources: `bosko-lwd-a1-postgres` on `127.0.0.1:55432`, `bosko-lwd-a1-redis` on `127.0.0.1:56379`, and volume `bosko-lwd-a1-pgdata`. The fresh DB is `bosko_local_works_demo`. The hidden API process is PID `38136` on `127.0.0.1:3101`. API stdout/stderr and migration/build/seed logs are in the task temp root; generated local `.env` files contain only task-owned credentials and are not tracked. MinIO was not needed for the feed and was not started.
- T1 evidence: verified the DB destination was `127.0.0.1:55432/bosko_local_works_demo`; before seed, `users/services/posts` counts were `0/0/0` (the only pre-migration public table was PostGIS `spatial_ref_sys`). `prisma migrate deploy` applied all 30 migrations through `20261108000300_favorites` (exit 0). Direct local seed completed (exit 0). Post-seed counts: 12 users, 6 approved/verified providers, 8 active services with photos, 12 visible posts with external HTTPS images. Temp Nest build succeeded (exit 0). `/api/v1/health/live` returned HTTP 200. Local `/api/v1/posts/feed?limit=20&cityId=tandil` returned HTTP 200, 12 items, 6 distinct providers, and all 12 external image URLs; no external URL was fetched by this check.
- T2 remains pending: no Favorites API mutation has been run and no frontend API URL/config has been changed. The local seeded client email for app preview is `ana.perez@gmail.com`; obtain its password only from the dev seed source, do not copy credentials into this document.
- Checks: T1 local migration, seed, build, health, and feed checks passed as recorded above; the parent independently confirmed the feed returns 12 items. T2 Favorites checks pending. Engram mirror remains pending because memory tools are unavailable.
- Commits: none yet.
- Next step: parent spot-check and commit T1 evidence; then execute T2 against the task-owned local API and configure the frontend local-only API URL if feasible.
