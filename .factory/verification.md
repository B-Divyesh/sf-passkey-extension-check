# Independent verification — FAIL

**Candidate:** `0a9124cac92fccccbd3f7283af21a5049f4343b0` (`main` at the time of test)  
**URL checked:** `https://passkey-extension-check.sociobot.in/`  
**Date:** 2026-08-27 UTC  
**Verdict:** **FAIL — do not release this candidate.**

## Release blockers

### P0 — production URL is neither reachable nor serving the candidate

Fresh strict TLS checks against the required URL fail:

```text
curl: (60) SSL: no alternative certificate subject name matches target host name
```

The hostname resolves to `40.67.153.174` / an Azure Static Apps endpoint. Its
certificate CN is `*.msha-slice-7-eus2-1-ase.p.azurewebsites.net` and its SANs
contain only Azure hostnames, not `passkey-extension-check.sociobot.in`.

For diagnosis only, bypassing certificate validation returned `HTTP/1.1 404
Site Not Found` (2,667-byte Azure error page) for `/`, `/privacy/`, `/terms/`,
`/sw.js`, and the extension ZIP. Plain HTTP also returned the same 404 rather
than redirecting to HTTPS. Consequently the live deployment cannot be compared
to the candidate, has no product response/security/cache headers to assess, and
is unusable by normal browsers.

### P1 — advertised clean-checkout quality gate fails

In a new detached clone at the candidate SHA, with Node `v22.23.2` and npm
`10.9.8`, `npm ci` completed successfully with 0 audit findings. Immediately
after that, both required commands failed because `tsconfig.json` extends the
ignored/generated `./.wxt/tsconfig.json` before WXT has prepared it:

```text
npm run check
error TS5083: Cannot read file '.../.wxt/tsconfig.json'.

npm test
TSConfckParseError: failed to resolve "extends":"./.wxt/tsconfig.json"
```

`npm run build` creates `.wxt`, after which `npx tsc --noEmit` and `npm test`
pass. That ordering dependency means the documented `npm install && npm run
check` verification is not reproducible from a clean checkout, violating the
acceptance gate.

### P1 — a11y/E2E command does not run with the supplied browser cache

The lockfile resolves Playwright `1.62.1`, while the provided preinstalled
browser cache is for `1.58.2`. From the clean checkout, `npm run test:a11y`
therefore fails before testing:

```text
browserType.launch: Executable doesn't exist at
/opt/pw-browsers/chromium_headless_shell-1234/...
```

Installing Chromium for the resolved Playwright version made the command pass,
but that external prerequisite is not encoded by the repository. Pin a
compatible Playwright version or make browser provisioning explicit in the
test workflow.

## Evidence from the buildable candidate

These results do not clear the blockers; they establish the product behavior
once WXT preparation and the matching Chromium browser were supplied.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 285 packages audited, 0 vulnerabilities |
| exact `npm run build` | PASS; WXT MV3 build, Vite site build, and ZIP packaging |
| `npx tsc --noEmit` after WXT build | PASS |
| `npm test` after WXT build | PASS; 10/10 tests |
| `npm run test:a11y` after Chromium install | PASS for static pages: no serious/critical axe findings, console errors, or 390px overflow |
| `xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y` | PASS: extension initial/results axe clean; manual conflict, text export, and clear-data path pass |
| independent extension exercise | PASS: denied optional permission, no-provider/no-recovery boundary, one manual provider, two-provider conflict, recovery selection, managed inventory, keyboard activation/focus, local storage, 390px layout, reduced motion, and no console/page errors |
| independent inventory/privacy exercise | PASS: stubbed `management.getAll` detected 1Password + Bitwarden, classified the admin-installed provider as managed, recommended contacting IT rather than removal, and did not render/store an unrelated Calendar extension |
| manifest/source privacy review | PASS: MV3; required permission only `storage`, optional `management`; no host permissions or content scripts; source has no remote fetch/analytics/telemetry path; generated report and audit state are browser-local |
| package | PASS: ZIP integrity test passed; unpacked MV3 manifest has expected `storage` + optional `management` only |
| static site desktop + 390px | PASS locally: keyboard skip link has 3px visible outline, no overflow, no external requests, reduced-motion transitions reduce to 0.01ms |
| Lighthouse local static preview | PASS: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0s, LCP 1.2s, CLS 0, TBT 0ms |
| bundle budget | PASS: site JS 711 B, CSS 8,492 B, hero 72,872 B; extension JS 11,548 B; all below stated budgets |

## Functional coverage notes

The manual path gives a review state when inventory permission is denied; a
single manually selected provider remains review rather than falsely claiming
prepared; two selected providers produces “Provider overlap found”; and an
organization-managed provider changes the remediation to “Contact IT.” The
extension stores only `audit` and `lastCheckedAt` in `chrome.storage.local` in
the exercised flow. A raw unrelated inventory record was neither displayed nor
persisted. The product did not make network requests from the extension page.

The web site is not a PWA (no web app manifest); its service-worker registration
is HTTPS-only, so local HTTP preview cannot exercise its offline path. The
required live HTTPS endpoint is broken, so a production offline/update check
is currently impossible.

## Required remediation before a new verification

1. Correct the Azure Static Apps custom-domain binding and certificate for
   `passkey-extension-check.sociobot.in`; publish this candidate’s site and ZIP;
   enforce an HTTP-to-HTTPS redirect; then retest headers, caching, live assets,
   and service-worker/offline behavior.
2. Make `npm test`, `npx tsc --noEmit`, and `npm run check` work immediately
   after `npm ci`—for example, run WXT preparation as a declared pre-step or
   remove the dependency on ignored generated TypeScript configuration.
3. Align/pin Playwright to the supported browser revision or document and
   automate the browser installation required by `test:a11y`.

No product source code was modified during verification.
