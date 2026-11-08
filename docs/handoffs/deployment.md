# Hosted release handoff — 8 November 2026

This records the initial hosted release. See the [verified UI redesign release](ui-redesign.md) for the newer runtime and public browser verification.

The application is live at [aletheia-recon.onrender.com/research](https://aletheia-recon.onrender.com/research), from [chanukya13/Aletheia-RECON](https://github.com/chanukya13/Aletheia-RECON).

## Actual infrastructure

- Render workspace: Teja#chinnu’s workspace (`tea-d7cd834p3tds739sa1d0`).
- Service: `srv-dbo7gdei0phs73eomlr0`, Singapore, **Free** compute, one instance, no paid disk.
- Runtime source: `c72833dc36c6fe2aa5668c1c6e7d1cfa51e5bc3a`.
- Deploy: `dep-dbo7gdui0phs73eommfg`, live at `2026-11-08T13:26:29Z`.
- [Service dashboard](https://dashboard.render.com/web/srv-dbo7gdei0phs73eomlr0).
- Automatic deployment is off. Documentation and verification-only commits do not change the running release.
- The earlier paid Blueprint (`exs-dbo7drjrjlhs73akfopg`) failed planning with `need_payment_info`; it manages no resources and was never approved. The free service was created directly through the Render connector. Other services were not modified.

No AI API key, account registration or payment method is required for this preview. Public GBIF/Europe PMC requests are optional and remain subject to availability. The deployed literature search returned HTTP 200, `ready`, and 10 actual metadata records for `eyesalve`; these are search results, not validated evidence.

## Storage and availability

The UI declares temporary storage on every page. Render Free erases local workspaces on restart, redeploy or idle shutdown. Users must download dossiers to retain their work; downloaded dossiers can be imported and replayed offline. Old access cookies recover to a clean isolated session after temporary storage loss. The persistent-hosting mode retains strict missing-key protections.

Free services sleep after 15 idle minutes; a later request can take about a minute to wake the service. Shared monthly free quotas also apply. This release is a functional public preview, not an always-on durable research repository. See [deployment operations](../deployment.md) and [Render’s free limits](https://render.com/docs/free).

## Executed verification

The [independent Ubuntu CI run](https://github.com/chanukya13/Aletheia-RECON/actions/runs/42484850949) passed installation, production build, type checks, lint, dataset validation, evaluation generation, unit/integration tests and all six hosted-browser checks. Local regression evidence is retained under ignored `artifacts/deployment/verification`; the temporary-storage reset test also passed.

Real public-URL tests passed all six desktop/mobile cases across Chromium, Firefox and WebKit. They exercised actual scenario saves, frozen dossiers, downloads, offline hash replay, reloads, second-browser access isolation, measured-outcome arithmetic, accessibility, layout overflow and console/network errors. The initial mobile WebKit attempt exceeded the local 10-second wait while workspace creation and saving were in progress. Server logs confirmed HTTP 200. A cloud-specific 30-second assertion budget passed both WebKit widths; local waits remain 10 seconds. Initial failure reports and the successful rerun are retained, rather than erased.

Additional public HTTPS checks passed health, HSTS/nosniff, Secure/HttpOnly/SameSite/host-prefixed cookies, cross-origin rejection and CSRF rejection with a valid import payload. Evaluation artifacts and authentic source-cell data are available on the deployed API. Optional provider probes preserve transient failures alongside actual retry results.

Local machine-readable records: `artifacts/deployment/deployment-receipt.json`, `live-browser.json`, `live-security.json`, `live-data-providers.json`, `live-literature-retry.json`, and `linux-ci-c72833d.log`. Browser traces can contain private test credentials and remain excluded from Git.

## Scientific and release boundaries

No private local database, runtime key, cookie, backup or local account state was published. Corpus/source bytes and scientific policies were retained. Assertions remain assistant-checked and pending independent human review. The small source-cell fixture and synthetic checks retain their actual denominators and limitations; deployment does not establish scientific accuracy, historical identity or therapeutic efficacy.

No Devpost registration or submission was performed. This handoff covers source publication and technical deployment only.
