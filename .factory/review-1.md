# Passkey Extension Check review 1 — FAIL

**Implementation reviewed:** `489ca2ca3592cc2287b40b491c7bf0b113b3f1b2`  
**Documentation head:** `3c263e169bcbf3710f7cad755408d6579ba2d321`  
**Live URL:** <https://passkey-extension-check.sociobot.in/>  
**Reviewed:** 2026-09-05 UTC  
**Verdict:** **FAIL — 5 findings; 18 public claims are untested.**

## Job, audience, and first action

The job is to find overlapping passkey-provider extensions and make a recovery plan before changing a critical login. The audience is people using password managers across browsers, including people with organization-managed extensions. In fresh desktop and 390 px phone sessions, before scrolling, the first task action was **Download for Chromium**, not a try-out.

Both live sessions had the expected title and one h1. They had no console errors, serious/critical landing-page axe findings, horizontal overflow, or third-party requests. Neither had a “Try it with sample data” action, demo label, or demo reset action.

## Findings

### P1 — No required one-click, isolated sample flow

There is no sample entry point in the landing page, README, extension, or repository. Fresh live `/demo` returns the host's generic 404. Searches for `demo`, `sample data`, and the required demo label found no product implementation.

The required realistic populated sample cannot be entered, inspected, reset, or shown to leave real data untouched. The first task action downloads an extension instead. `.factory/demo.md` and a separate demo storage namespace are also absent. This fails the demo-sandbox contract and prevents the required sample-data verification.

### P1 — Populated extension UI has serious contrast failures

From a clean checkout, the documented headed command failed:

```sh
xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y
```

The two-provider conflict flow runs, then axe reports serious `color-contrast` violations in the extension options page. Examples include 3.52:1 for “Readiness result” on the conflict banner, 3.88:1 for result and explanatory text, and 4.33:1 for step labels; normal text requires 4.5:1. This affects recovery controls and the real conflict result. The normal headless `npm run test:a11y` exits successfully only because it explicitly skips MV3 extension loading.

### P1 — Required claims inventory is absent; 18 public claims are untested

`.factory/claims.json` does not exist, so there are no declared claim commands to run from the clean checkout. The landing page and README nevertheless make 18 atomic visitor-facing claims requiring sandbox evidence: local provider inventory, WebAuthn capability checking, local recovery reports, no account, no analytics, no network requests, no credential/page/form access, no content scripts, raw-inventory disposal, browser-local storage, and local export among them.

None has the required one-to-one `@claim:<id>` test. The 13 general unit/contract tests do not record a complete demo request log or prove these public claims through a shipped sample flow. Untested claim count: **18**.

### P2 — The live 404 is a broken host page, not a product 404

Both `/demo` and a random invalid route return `Azure Static Web Apps - 404: Not found`. That page has no product title, h1, main landmark, product styling, or way back. A 404 status is expected; this generic response fails the required designed 404 structure.

### P2 — Required route metadata is incomplete

The landing page has a title, description, canonical URL, and SVG favicon, but no Open Graph or Twitter card metadata, social-preview image, or Apple touch icon. Privacy and Terms have title and description but no canonical URL or social metadata. This fails the site-structure metadata contract.

## Verification evidence

### Clean checkout and declared checks

A separate clean clone at documentation head was installed with Node 22.23.2 and npm 10.9.8. `npm ci` completed with 0 vulnerabilities. The implementation source is unchanged after `489ca2c`; the two later commits are reports only.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 13/13 tests. |
| `npx tsc --noEmit` | PASS. |
| `npm run test:clean-gate` | PASS — recreates WXT state from clean checkout. |
| `npm run build` | PASS — MV3 build, static site, and ZIP. |
| `npm run test:a11y` | PASS for site only; output explicitly says MV3 was skipped. |
| `npm run check` | PASS, but it calls only the skipping headless a11y command. |
| `xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y` | **FAIL** — serious extension contrast violations. |
| `unzip -t dist/site/downloads/passkey-extension-check-chrome.zip` | PASS. |
| `npm audit --omit=dev` | PASS — 0 production vulnerabilities. |

No `.factory/claims.json` exists, so no declared claim command could be run. That absence is a finding, not a passing zero-claim result.

### Extension behavior and privacy smoke

A fresh headed Chromium profile loaded the clean-built MV3 artifact. Denying optional inventory access produced “A few checks remain.” Selecting 1Password, Bitwarden, and an independent signed-in device produced “Provider overlap found.” Local text export worked. Cancelling clear preserved the workspace; confirming clear hid it, left extension-local storage empty, and restored focus to `Run readiness check`. No extension page console errors occurred.

This covers the normal, denied-permission boundary, recovery, export, and reset paths. It does not clear the contrast failure and cannot substitute for a separate demo namespace. The manifest has only required `storage` and optional `management`, with no host permissions or content scripts. Source and runtime storage inspection support local handling, but public privacy claims remain untested under the claims contract.

### Live site, links, and routes

Fresh desktop (1440 × 1000) and phone (390 × 844) contexts loaded the live home page. Privacy and Terms return 200 with their own titles and main landmarks. Root, Privacy, Terms, robots.txt, sitemap.xml, favicon, download ZIP, and source link return 200. The live root supplies CSP with `frame-ancestors 'none'`, Permissions-Policy, X-Frame-Options, nosniff, Referrer-Policy, and HSTS.

Reduced-motion rules exist in both site and extension styles. The service-worker source has versioned cache-first shell handling. Earlier runtime offline evidence remains applicable because the live root and unpacked extension artifact match this implementation; no public offline claim is listed or sandbox-tested now.

### Candidate/live comparison

The fresh local build and live root HTML have the same SHA-256:

```text
aa5462b5c07589607771f7dde304b7fdaabf0d135ad5e67235361dcddccec3fb
```

The downloaded live ZIP unpacked identically to the fresh local ZIP. The implementation reviewed is `489ca2c`; `3c263e1` is the current documentation commit.

## Earlier verification findings and current disposition

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| Live domain/certificate and deployment unavailable | Resolved | Live HTTPS root, legal pages, and ZIP return 200; fresh root hash matches. |
| Clean install lacked generated WXT state | Resolved | `npm ci`, `npm test`, direct TypeScript, and `npm run test:clean-gate` pass. |
| Playwright/browser revision mismatch | Resolved | Locked Playwright 1.58.2 launches the supplied browser; headed check reaches MV3. |
| Missing security headers and immutable assets | Resolved | Live response has CSP, frame protection, permissions policy, HSTS, and configured cache policy. |
| Prior report found no a11y defect | Superseded | Current headed populated-extension axe run finds serious contrast defects. |
| Stable CSS revalidation note | Still an implementation note | Current live implementation is byte-identical to the reviewed build. |

## Required next steps

1. Add `/demo` (or `?demo=1`) with realistic seeded conflict output, a visible entry, persistent demo banner, reset/start-real actions, a separate storage namespace, and `.factory/demo.md`.
2. Correct populated extension text/control colors to at least 4.5:1 and make the headed extension a11y run a required passing gate.
3. Create `.factory/claims.json`; add one observed sandbox test per public claim and remove any unprovable claim.
4. Ship a styled product 404 with title, h1, main, and a way home.
5. Add canonical/OG/Twitter metadata to every route plus an original 1200×630 social image and Apple touch icon.

No product code was modified for this review.
