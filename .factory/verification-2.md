# Independent verification 2 — FAIL

**Candidate:** `0a9124cac92fccccbd3f7283af21a5049f4343b0`  
**URL:** `https://passkey-extension-check.sociobot.in/`  
**Verified:** 2026-08-28 UTC, Node 22.23.2 / npm 10.9.8  
**Verdict:** **FAIL — do not release this candidate until the clean-checkout
quality gate is fixed.**

This is fresh evidence. It supersedes the previous report's deployment-only
finding: the live domain is now valid and serves this candidate. It does not
clear the deterministic local release blocker below.

## Release blocker

### P1 — `npm run check` and `npm test` fail immediately after a clean install

Two new detached worktrees at the exact candidate SHA were installed with
`npm ci` (285 packages; `npm audit` and production audit both reported zero
vulnerabilities). Before any build had run:

```text
$ npm run check
> tsc --noEmit && npm test && npm run build && npm run test:a11y
error TS5083: Cannot read file '.../.wxt/tsconfig.json'.

$ npm test
TSConfckParseError: failed to resolve "extends":"./.wxt/tsconfig.json"
```

`tsconfig.json` extends ignored generated file `.wxt/tsconfig.json`; it is not
created by `npm ci`, so TypeScript and Vitest cannot start. The exact
production `npm run build` does create it, after which `npx tsc --noEmit` and
`npm test` pass. This ordering dependency means the documented and required
clean-checkout check is not reproducible, violating the factory quality gate.

**Required fix:** make WXT preparation an explicit pre-step for typecheck and
test (or remove the dependency on ignored generated configuration), then
verify `npm ci && npm run check` in a fresh checkout.

## Passed evidence after the required test setup

| Check | Fresh result |
| --- | --- |
| Exact production build | PASS: `npm run build` ran WXT MV3 build, Vite site build, and ZIP packaging. |
| Type and unit/integration tests after build | PASS: strict `tsc --noEmit`; Vitest 10/10 tests. |
| Browser test setup | The declared Playwright 1.62.1 initially lacked Chromium in the supplied cache; `npx playwright install chromium` installed revision 1234. This prerequisite is not automated by the repo. |
| Site a11y/runtime | PASS: `npm run test:a11y` found no serious/critical axe violations, console errors, or 390px overflow on landing/privacy/terms at 390px and 1440px. |
| Extension a11y/runtime | PASS under `xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y`: initial and populated MV3 pages had no serious/critical axe findings; manual conflict, text export, and clear-data flows passed. |
| Independent extension exercise | PASS: keyboard Space/Enter activated the primary action and checkbox rows; denied optional permission produced review/manual recovery guidance; two manual providers produced `Provider overlap found`; a mock admin-installed 1Password plus Bitwarden produced the IT-safe remediation (no pause/remove advice); export, cancel/reset, confirmed reset and focus return passed. |
| Boundary/recovery | PASS: no provider/no recovery was not marked prepared; a detected single Bitwarden plus a checked recovery code produced `No provider overlap found`; organization-managed overlap directs the user to IT. |
| Mobile/desktop and motion | PASS: no horizontal overflow at 390px or 1440px; visible focus was `3px solid rgb(216, 144, 18)`; reduced-motion CSS reduces animations/transitions to `.01ms`; visual review of both live screenshots found the intended paper-cut layout usable and legible. |
| Privacy and outbound traffic | PASS: observed extension-page requests were all `chrome-extension:` URLs; live site had no third-party requests. Manifest has only required `storage` and optional `management`, with no host permissions/content scripts. Audit storage held only `audit` and `lastCheckedAt`; unrelated inventory was not rendered or stored. Source review found no fetch, analytics, telemetry, remote fonts, or credential/page/form access. |
| Deployment identity | PASS: strict TLS returned HTTP/2 200 with a certificate SAN for `passkey-extension-check.sociobot.in`; live `index.html` hash exactly matched the candidate build. Every non-download static file matched by SHA-256. ZIP archive bytes differ from a fresh local ZIP due to archive metadata, but every unpacked file hash, including manifest and JS/CSS, was identical. |
| Offline shell | PASS: the live service worker became active and, after a controlled reload, an offline reload returned the landing-page title. This is a browser-extension product, not a web PWA (no web manifest). |
| Performance/budgets | PASS: extension JS 11,548 B; site initial JS 711 B; site CSS 8,492 B; largest hero 72,872 B. Lighthouse mobile live report: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0. |

## Deployment response-policy findings

These did not prevent the functional checks above but should be addressed.

### P2 — missing browser security policy headers

The live HTML response has HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
and `X-Content-Type-Options: nosniff`, but no `Content-Security-Policy`,
`Permissions-Policy`, or `X-Frame-Options`/CSP `frame-ancestors` policy. Add a
strict same-origin CSP and explicit permissions/frame policy at hosting.

### P2 — static assets use only 30-second revalidation caching

HTML, hashed JS, CSS, hero WebP, service worker, and the download ZIP all
returned `Cache-Control: public, must-revalidate, max-age=30`. The hashed JS
and versioned image should receive long-lived immutable caching; retain short
revalidation for HTML and service-worker entrypoints. This is contrary to the
stated static-product caching policy, although the measured performance is
currently excellent.

### P2 — browser E2E setup is not self-contained

`npm run test:a11y` initially failed because the resolved Playwright 1.62.1
required Chromium revision 1234, which was absent. The test succeeds after
`npx playwright install chromium`. Pin the declared Playwright/browser
revision or document/automate that installation so CI and a fresh verifier do
not depend on ambient browser state.

## Scope and limitations

No product source was changed. The extension cannot enumerate operating-system
or built-in credential providers with documented browser APIs; the manual
confirmation state and limits disclosure correctly preserve that uncertainty.
The report does not claim a real relying-party WebAuthn ceremony will succeed.
