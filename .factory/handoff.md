# Handoff — Passkey Extension Check repair

## Release-blocker repair

This repair supersedes the failed verification handoff for candidate
`0a9124cac92fccccbd3f7283af21a5049f4343b0`.

- **Clean checkout P1 fixed:** `npm ci` now runs `wxt prepare`, while
  `pretest` and `precheck` repeat that preparation defensively. The new
  `npm run test:clean-gate` removes `.wxt/` and proves that `npm test` and
  direct `tsc --noEmit` recover without a generated config already present.
- **Browser provision P1 fixed:** Playwright is pinned to `1.58.2`, matching
  the factory Chromium 1208 cache. No ambient browser download is required.
- **Accessibility regression fixed:** selected manual checklist helper text
  now meets AA contrast in the light treatment; the headed MV3 test exercises
  the affected selected state through the keyboard.
- **Static response policy added:** the deployable Azure Static Web Apps
  artifact includes a same-origin CSP, explicit permissions/frame policy,
  no-sniff/referrer directives, short HTML/service-worker revalidation, and
  immutable caching for versioned script and hero-image requests.

The existing brief, local-first permission model, manual recovery workflow,
and paper-cut visual thesis are unchanged.

## Verification evidence

Run from a clean Node 22.23.2/npm 10.9.8 checkout:

```sh
npm ci
npx tsc --noEmit
npm test
npm run test:clean-gate
npm run check
xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y
unzip -t dist/site/downloads/passkey-extension-check-chrome.zip
npm audit --omit=dev
```

Results on 2026-08-28 UTC:

- `npm ci` installed 285 packages, executed WXT preparation, and reported
  zero vulnerabilities.
- `npx tsc --noEmit`, `npm test`, and the clean-state regression gate passed.
  Vitest: 3 files, 13 tests (provider/domain rules, static contracts, and new
  release-tooling contracts).
- `npm run check` passed: clean-state test/type gate, WXT MV3 production
  build, site build, ZIP packaging, and desktop/390px browser smoke test.
- `xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y` passed. Axe found no
  serious/critical issues on the landing/privacy/terms pages and initial and
  populated extension pages. It also verified no console errors, no 390px
  overflow, the landing-page keyboard skip link, keyboard Enter activation of
  the extension’s primary action, Space activation of checklist rows, conflict
  result, local text export, and confirmed reset.
- Built output: extension 35.24 KB total / 11.55 KB primary JS; site entry JS
  711 B; CSS 8,492 B; hero 72,872 B. All remain within the stated budgets.
- ZIP integrity passed. The unpacked and packaged manifest is MV3 with only
  required `storage` and optional `management`; no host permissions or content
  scripts. Source review found no extension network, analytics, telemetry, or
  credential/page access paths. `npm audit --omit=dev` reported zero known
  vulnerabilities.
- Production deployment passed on 2026-08-28 UTC. `dist/site` was published
  with the configured Azure Static Web Apps CLI to
  `sf-passkey-extension-check` production. Strict TLS returned HTTP/2 200;
  both the live `index.html` and extension ZIP SHA-256 values exactly matched
  the local release artifact. A 390px browser smoke test observed requests
  only to `https://passkey-extension-check.sociobot.in`; after service-worker
  activation, an offline reload retained the expected landing-page title.
- Live response-policy verification passed: HTML has the configured CSP,
  Permissions-Policy, `X-Frame-Options: DENY`, `nosniff`, referrer policy, and
  short revalidation; the versioned `/assets/site.js` response is immutable.

## Build and deploy

`npm run build` produces:

- `dist/extension/` — unpacked Chromium MV3 extension
- `dist/site/` — static deployment root, including `staticwebapp.config.json`
- `dist/site/downloads/passkey-extension-check-chrome.zip` — consumer download

Deployment completed from this release artifact with:

```sh
swa deploy dist/site --env production
```

The deployment token is retrieved from the existing `sf-passkey-extension-check`
Static Web App configuration; it is never committed. The factory owns DNS and
hosting binding; this repository contains the static deployment policy and
artifact only.

## Known limits

- Browser APIs cannot universally enumerate OS-level or built-in credential
  providers. The extension discloses that limit and retains its manual path.
- This is an unsigned Chromium MV3 build for `Load unpacked`; store signing and
  Firefox packaging are future work.
- Readiness/capability checks do not guarantee a particular relying-party
  WebAuthn ceremony. Users should test a non-critical account and keep an
  independent recovery route.
