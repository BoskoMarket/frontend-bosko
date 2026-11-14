# Local profile media and favorite testing

## Objective and scope

Review the profile on the user's running Android emulator, including editing, avatar, cover, and Favorites. Repair missing components of the isolated local demo environment where necessary to make the requested tests possible. Keep the actual user's account, image files, session, and original backend configuration intact. No production services, remote credentials, remote email, or source feature changes are authorized by this review.

Branch: `chore/local-profile-media`, based on `fix/local-registration-mail` at `fa99cca`. The earlier dev merge and fixes remain in history.

## Observed findings

- The user's emulator is signed in as a client. Favorites loads empty; avatar and cover each open Android's picker, but no user image was selected or uploaded.
- A synthetic account successfully read and updated its profile, restored the fields, and added/removed a visible service favorite. A work-post ID returned `404 SERVICE_NOT_FOUND`: the Favorites contract accepts service IDs, and portfolio posts have no favorite feature.
- Synthetic avatar and cover uploads returned HTTP 500. The task-owned backend's effective S3 endpoint is loopback port `59000`, where no object store was listening. Its public S3 URL also uses that port. The existing demo backend and its credentials are task-owned; never read the original backend's environment.
- The local seed has no services for Barranquilla. The signed-in user chose Barranquilla, so an authenticated city-scoped catalog may legitimately return an empty list. Preserve Tandil demo data and add only clearly marked local demo fixtures if needed to test the requested user flow.

## Workflow and checks

- Route: delegated direct for local infrastructure and fixture operations. Keep a single runtime writer; verify independently with synthetic accounts and a reversible emulator favorite toggle.
- TDD: off for this environment/data task. Existing frontend Jest tests are available if a code issue is discovered; no application behavior change is currently authorized. RDD is globally on; preserve its current setting and assess committed work units where applicable.
- Start only the cached local MinIO image with task-owned credentials and dedicated names/volume. Bind host ports to loopback, use only the backend's own generated S3 credentials, create only its configured bucket, and make the existing local public S3 URL reachable from emulator-5554. Do not use remote/cloud storage or upload any actual user photo.
- Any synthetic provider/service/post must be visibly marked as demo, scoped to Barranquilla and created only in the task-owned local database. Never update/delete existing users, services, posts or favorites. Track exact created IDs and use idempotent creation.
- Synthetic upload tests must clean only their own account and objects when safe. A UI favorite test may add one known demo service only after confirming the user's list starts empty, and must remove it afterward and verify the original empty state.
- Forecast below 200 authored tracked lines, primarily this task record; no push, PR, or deployment. Engram mirror `odd/local-profile-media/tasks` is pending because memory tools are unavailable.

## Tasks

- [x] T1 — Start task-owned local object storage and its configured bucket, preserve the existing API and add the emulator-only port mapping. Verify health and signed URL reachability without uploading user data.
- [x] T2 — Add the minimal Barranquilla demo provider/service/work fixtures needed for the user's city, without modifying existing records. Verify city-scoped service and work feeds.
- [ ] T3 — Independently test avatar and banner upload on a synthetic account and a reversible favorite toggle on the running emulator. Preserve and verify the real user's initial state; report any remaining UI or role-specific limitations.

## Progress

- Read-only review and initial synthetic API checks completed. The local storage service is the verified cause of both upload HTTP 500 responses.
- Existing API, Postgres, Redis, Mailpit, Metro and emulator session remain active. No source feature code has been changed.
- T1 setup: started cached `chabit-local-minio:latest` as `bosko-lwd-a1-profile-minio` with dedicated volume `bosko-lwd-a1-profile-media`; host port is bound only at `127.0.0.1:59000` to container port 9000. MinIO update checks are disabled. The env file is retained at `C:\Users\frank\AppData\Local\Temp\bosko-lwd-a1-profile-media\minio.env`; it contains task-owned credentials and must not be displayed or copied.
- T1 verification: MinIO health returned HTTP 200. Created and confirmed only configured bucket `bosko-local` using the backend snapshot's installed AWS SDK. Uploaded one random synthetic object, confirmed the presigned URL used the loopback endpoint and returned its expected static body, then deleted that exact object and verified it was absent. Emulator `emulator-5554` now has `tcp:59000 -> tcp:59000`; the pre-existing API reverse on 3101 remains present. No user image, account, API process, database data, app session, tracked source, or backend checkout was changed.
- T1 checks passed; the parent independently confirmed storage health HTTP 200 and both emulator reverse mappings. Work-unit commit `9578419` was passively assessed (no review due). No application tests were run because T1 only added local infrastructure.
- T2 preflight validated the task-owned database target `127.0.0.1:55432/bosko_local_works_demo`, active Barranquilla city, zero pre-existing Barranquilla services/posts, active categories, and no collision for the reserved demo identities.
- T2 created two visibly labeled synthetic Barranquilla providers, two active services, and two visible portfolio posts in one Prisma transaction. All providers are marked approved/verified; services have active status, existing seeded image URLs, active categories, and Barranquilla city. Posts use existing seeded image URLs, thumbnails, and dimensions. No existing records were modified.
- T2 feed verification: `GET /api/v1/services?cityId=barranquilla` returned HTTP 200 with 2 items and both fixture service IDs; `GET /api/v1/posts/feed?limit=20&cityId=barranquilla` returned HTTP 200 with 2 items and both fixture post IDs.
- Fixture recovery/cleanup manifest: `C:\Users\frank\AppData\Local\Temp\bosko-lwd-a1-profile-media\barranquilla-fixtures.json`, marker `bosko-local-profile-media-barranquilla-demo-v1`. User IDs: `fa932fde-3ecb-488c-b515-52e589e308ae`, `6f9067c5-fdc4-4051-a4c4-b8304571a6d1`; service IDs: `dd267806-9ddd-40c0-adaa-1c3f7205fd0d`, `3596d2df-5f6e-4127-b18d-cee9adcfd7ce`; post IDs: `e7c8b5ba-bf00-40a0-9706-54518e72ca9b`, `a383dbfc-4298-43e9-9d49-5270fa13a1df`. Manifest contains only fixture identity/state metadata, no credentials or passwords.
- T2 checks passed; the parent independently confirmed both city-scoped endpoints return HTTP 200 with 2 items. The work-unit commit is pending. No source files, existing user accounts, services, posts, favorites, or app session were modified.
- Next step: parent verifies and commits T2, then proceeds with the authorized emulator upload and reversible favorite checks in T3.
