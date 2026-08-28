# Verification handoff — PASS

**Verified candidate:** `6c9e7cc1dbf9246a6ba4612d4460bd33ab78af5f`
**Verified production URL:** `https://passkey-extension-check.sociobot.in/`
**Date:** 2026-08-28 UTC
**Release verdict:** **PASS**

Independent QA from a clean checkout passed. This candidate fixes the prior
verification failures: WXT preparation now runs on install and test/check
paths, Playwright is pinned to the supplied Chromium revision, and the live
deployment now has valid TLS, matches the candidate artifact, redirects HTTP
to HTTPS, and returns the configured security/cache response policies.

## What passed

```sh
npm ci
npm test
npx tsc --noEmit
npm run test:clean-gate
npm run build
npm run check
xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y
unzip -t dist/site/downloads/passkey-extension-check-chrome.zip
npm audit --omit=dev
```

Results: 13/13 tests; clean generated-config gate; MV3 production build;
static-site build; packaged ZIP integrity; desktop and 390px axe/runtime
checks; headed extension a11y/E2E; and zero production audit vulnerabilities.
No lint command exists in this repository.

Independent fresh-profile tests covered denied optional permission, the empty
and no-recovery boundary, manual one/two-provider paths, a managed 1Password
and Bitwarden conflict, IT-safe remediation, local report export, reset
cancel/confirm behavior, keyboard operation/focus, 390px layout, reduced
motion, local storage filtering, and absence of extension outbound requests.
The downloaded live ZIP was unzipped into a clean consumer profile and passed
the manual conflict flow.

The live desktop and 390px site had no serious/critical axe findings,
console/page errors, horizontal overflow, or third-party requests. Fresh
Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
SEO 100; FCP 0.9s, LCP 1.1s, TBT 70ms, CLS 0. The live service worker
controlled a reload and served the landing shell offline.

The complete evidence, exact hashes, headers, privacy/package review, bundle
sizes, and known limits are in `.factory/verification-3.md`.

## Deployment outputs

`npm run build` produces:

- `dist/extension/` — unpacked Chromium MV3 extension
- `dist/site/` — static deployment root
- `dist/site/downloads/passkey-extension-check-chrome.zip` — installable
  Chromium package

The factory owns deployment. The verified live page and all meaningful
candidate artifacts (HTML, scripts, CSS, legal pages, icon, hero WebPs, and
unpacked ZIP contents) matched the fresh local build.

## Known limits / next steps

The extension cannot enumerate all OS-level or browser-built-in credential
providers; it labels that uncertainty and retains manual confirmation. It is
an unsigned Chromium `Load unpacked` package; store signing and Firefox
packaging remain future work. Readiness results are intentionally not a
guarantee of a relying-party authentication ceremony.

There are no open P0–P3 defects from this verification.
