# Hosted deployment

The hosted entry point preserves the local workbench and scientific contracts. `npm run start` remains a loopback-only, single-user application. `npm run start:hosted` binds `0.0.0.0:$PORT` and requires an explicit public origin and data directory. No AI service key is required.

## Render release

`render.yaml` defines one **Free** Node 24 web service in Singapore with no paid disk. `RECON_STORAGE_MODE=temporary` and `RECON_DATA_DIR=/tmp/recon` explicitly declare ephemeral workspaces. The UI displays the limitation on every page. Saved edits, imports and dossiers are lost on restarts, redeploys and idle shutdowns; users retain downloaded dossiers and can import them again. Old cookies are cleared safely after storage loss, allowing a fresh isolated session. This is a free preview, not durable production hosting.

[Render's free-service documentation](https://render.com/docs/free) describes 15-minute idle shutdowns, roughly one-minute cold starts, ephemeral files and shared monthly free quotas. No paid upgrade or Pro workspace is required. Free service availability remains subject to those quotas.

Builds install pinned dependencies, compile, validate licensed sources and generate both executed evaluation artifacts. No local user database or workspace is published. The `RENDER_EXTERNAL_URL` supplied by Render is the canonical HTTPS origin. Automatic redeploys are disabled; changes are deployed deliberately.

For optional durable hosting later, use a paid compute instance, a persistent disk mounted at `/var/data`, `RECON_DATA_DIR=/var/data/recon`, and `RECON_STORAGE_MODE=persistent`. That mode retains strict missing-cookie/key protections and durable backup/restore behavior. No paid resource is created by the current free configuration.

The readiness endpoint is `/api/v1/health`. It verifies the source/corpus runtime and the configured directory/key without allocating a visitor workspace. HTTPS terminates at Render; fixed public-origin checks protect writes without trusting arbitrary forwarded-host headers. The application closes servers and SQLite connections on termination. Optional disk-backed releases have a brief restart interruption and run as one instance.

## Private visitor workspaces

Public browsing uses the immutable seed corpus. The first edit, live lookup or editor session allocates a private SQLite database. A random, HMAC-authenticated, HttpOnly, SameSite cookie is the access credential. HTTPS cookies use the `__Host-` prefix and `Secure`. The signing key is created in the configured data directory. Persistent hosting retains it across restarts; free hosting loses it with the temporary databases. Existing databases without their key cause startup failure rather than silent replacement.

Each visitor's cases, imports, pending studies, scenarios, results and dossiers are isolated in a separate database. A guessed record ID from another visitor returns unavailable. Shared seed assertions remain pending under the original policy. Existing request validation, CSRF, source rights, immutable revisions and offline replay remain active.

The initial bounded service allows 96 workspaces, four open applications at once, eight MiB per database, twenty new workspaces per minute and 1,800 requests per minute. Idle database handles are evicted and reopened without deleting records. Capacity failures are explicit and preserve existing data. These are deployment limits, not claims of unlimited public scale. Raise limits only after checking memory/disk usage. The application runs no automatic deletion job; free hosting can reset its filesystem independently.

The workspace is browser-specific. Clearing the access cookie removes that browser's access; there is no account-based recovery. Users should download dossiers for portable records. This behavior is explained in the workspace-status dialog. Imported private originals remain subject to their recorded rights and are omitted from portable exports when required.

## Verification

- `npm run verify:deployment`: the full local regression plus hosted security/persistence/backup tests and real Chromium, Firefox and WebKit hosted workflows.
- `npm run test:hosted`: fresh hosted service on port 4321, isolated temporary databases and two-browser privacy checks, real save/export/replay, responsive layout, accessibility and console/network checks.
- `RECON_TEST_URL=https://SERVICE.onrender.com npm run test:hosted`: execute the same real hosted-browser flows against the deployed service. This creates only clearly named verification workspaces/dossiers.

The pinned GitHub Actions workflow independently builds and tests on Linux. The local verification reports live under `artifacts/deployment`; source/evaluation manifests preserve the task and denominator of measured results. A successful build or queued cloud deploy is not treated as a live deployment.

## Backup and restore

These operations apply to optional persistent hosting. Render Free has no SSH access or durable disk: use downloadable dossiers for portable records there.

Use SQLite's online backup API rather than copying active database files or restoring a generic disk snapshot:

```sh
node tools/backup-hosted-workspaces.mjs /var/data/recon /tmp/recon-backup-UNIQUE
```

The destination must be new and outside the live directory. The backup includes a consistent snapshot of each database and the signing key. Transfer it to private off-service storage, for example using Render's authenticated SSH/SCP access. Do not commit or publish a workspace backup. Databases are independently consistent; there are no cross-workspace transactions.

To restore, stop the service, restore the complete backup into the mounted data directory with restrictive permissions, then restart the same compatible source release. Preserve the key with its databases. Check health, SQLite integrity and a known dossier result hash. The automated integration test verifies backup and restored browser access. Restoring code does not revert persisted data; retain compatible migrations and the original policy/replay versions.

## Source and operations

The repository excludes local databases, runtime keys, `.env` secrets, browser downloads, generated artifacts and local Devpost workflow state. Scientific source snapshots and rights records remain bundled where permitted. Build-generated evaluation artifacts are regenerated from those pinned inputs. Native dependency/runtime pins are preserved; no new package dependency is required for hosting.

Before changing hosting providers, account for native SQLite bindings, persistent single-instance storage, the canonical HTTPS origin and private workspace isolation. A static-only or ephemeral serverless deployment cannot preserve this behavior unchanged.
