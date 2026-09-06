# Repair handoff — PASS

**Work order:** passkey-extension-check-repair-2
**Implementation SHA:** a55b6871d1598d682f5299586e1b7b1ea0ac12e3
**Documentation SHA:** recorded after this handoff commit
**Live URL:** <https://passkey-extension-check.sociobot.in/>
**Deployed:** 2026-09-06 UTC to the existing production Static Web App
sf-passkey-extension-check.

## What changed

- Added the one-click /demo/ sandbox. It opens with a realistic managed
  1Password + Bitwarden overlap, has the persistent **Demo — sample data,
  nothing is saved** label, resets its own demo: localStorage key, and links
  to the real Chromium install flow.
- Corrected all populated extension-page text contrast failures. The required
  headed MV3 axe flow now runs by default under Xvfb and passes.
- Added 18 public claims in .factory/claims.json. Each has one observable
  @claim: test in the packaged extension or demo sandbox. The runner records
  request behavior, exercises storage and reset, and tests normal, denied,
  offline, recovery, export, and managed-provider paths.
- Added the product 404 page and production 404 rewrite. Invalid live paths
  return HTTP 404 with the product title, one h1, main landmark, and a way
  home.
- Added route-level canonical, Open Graph, Twitter, and Apple touch metadata
  for home, demo, legal pages, and 404. Added an original 1200×630 social
  preview derived from the project’s reviewed paper-cut art.
- Rewrote the first screen in plain words. On phone and desktop it now states
  the job, audience, and first action before scrolling. The mobile action
  ordering is protected by a browser regression check.
- Added demo, claims, copy, catalog, and provenance documentation. The catalog
  description is verb-first and copied to /work/.evidence/catalog-description.txt.

## How to verify

From a clean checkout:

    npm ci
    npm run check
    npm audit --omit=dev
    unzip -t dist/site/downloads/passkey-extension-check-chrome.zip

npm run check runs the clean WXT gate, 15 unit/contract tests, production
build, desktop and phone site checks, headed packaged-extension axe/runtime
coverage, and all 18 declared claim tests. Run an individual claim exactly as
listed in .factory/claims.json, for example:

    npm run test:claims -- --grep @claim:demo-populated

Fresh-clone result for implementation SHA a55b687: npm ci and npm run check
passed. The clean run exercised every claim; production audit reported zero
vulnerabilities and the packaged ZIP passed its integrity test.

## Live verification

The deployed root HTML SHA-256 is
a648fddee06036d5e99baf71bb95d21d5d7d76df066f25671ce216c2c9e5475a,
matching the build from the implementation candidate. The live stylesheet also
matches the candidate.

Fresh browser contexts passed:

| Check | Result |
| --- | --- |
| Phone 390×844 first screen | Job, audience, and **Try it with sample data** visible; action top 438px; no overflow, console errors, or serious/critical axe findings |
| Desktop 1440×1000 first screen | Same content visible; action top 781px; no console or serious/critical axe findings |
| Demo | Populated overlap result, persistent label, reset, and separate sample storage passed; sentinel real key stayed unchanged |
| Privacy and Terms | HTTP 200, expected route titles, lang=en, one h1, and main landmark |
| Invalid route | HTTP 404 with the product page and route back |
| Offline shell | After service-worker activation and reload, offline reload kept the landing title |

Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
100, SEO 100; FCP 0.9s, LCP 1.1s, TBT 60ms, CLS 0.

## Earlier findings disposition

| Finding | Disposition |
| --- | --- |
| Missing one-click isolated sample | Resolved with /demo/, namespaced storage, banner, reset, docs, and browser claims |
| Headed extension contrast failure | Resolved; populated MV3 axe check passes |
| 18 untested public claims | Resolved; 18 declared, tagged, observed claim tests pass |
| Generic host 404 | Resolved; live invalid route is a styled product 404 with status 404 |
| Missing social and route metadata | Resolved on every shipped route |
| Earlier clean-install/WXT, Playwright, security-header, cache, and live-TLS findings | Remain resolved and were rechecked through the clean gate and live response |
| Mobile first action below fold (found during this repair) | Resolved in a55b687 and rechecked on live phone and desktop contexts |

## Known limits and next steps

- Documented browser APIs cannot enumerate every operating-system, built-in, or
  unmanaged provider. The extension names that uncertainty and supports manual
  confirmation.
- It is a readiness aid, not a real relying-party WebAuthn ceremony or
  compatibility guarantee. Users should keep a tested independent recovery
  route.
- The free Chromium package still requires Developer mode. Firefox packaging
  and store distribution are not available yet.
- The researched brief is free; there is no paid offer or billing dependency
  to register.
