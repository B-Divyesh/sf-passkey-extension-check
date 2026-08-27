# Handoff — Passkey Extension Check v1

## What shipped

- A WXT + TypeScript Manifest V3 extension with a toolbar entry point and full-tab readiness workspace.
- Optional `management` permission for local extension inventory. The raw inventory is discarded after matching known providers; permission denial falls back to explicit manual selection.
- Provider matching for 1Password, Bitwarden, Dashlane, Keeper, LastPass, NordPass, and Proton Pass, including enabled/disabled and organization-managed state.
- Non-secret WebAuthn checks for secure context, platform authenticator availability, conditional mediation, and client-capabilities API support.
- Deterministic conflict/readiness rules with explainable findings, organization-safe remediation, recovery-route confirmation, browser-local persistence, reset, and plain-text export.
- First-class loading, permission-denied/manual, offline, unknown-capability, conflict, prepared, and empty-provider states.
- A responsive static landing site with install instructions, packaged extension download, privacy policy, terms, offline shell caching, robots.txt, and sitemap.
- A product-specific paper-cut diorama visual system in `.factory/design.md`, an original generated hero source plus prompt provenance, and 72 KB / 20 KB responsive WebP derivatives.

## Build and verification

From a clean clone:

```sh
npm install
npm run check
```

`npm run build` (and `npm run build:site`) creates:

- `dist/site/index.html`
- `dist/site/privacy/index.html`
- `dist/site/terms/index.html`
- `dist/site/downloads/passkey-extension-check-chrome.zip`
- `dist/extension/` (unpacked MV3 build)

Verification completed on 2026-08-27:

- `npm test`: 10 tests passed across provider matching, conflict rules, managed-policy handling, export, and static-page contracts.
- `npx tsc --noEmit`: passed with strict TypeScript.
- `npm run build`: passed; extension total 35.01 KB, main extension JS 11.45 KB, site initial JS 0.71 KB, CSS 8.3 KB, largest hero 72 KB.
- `xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y`: no serious/critical axe findings on landing, privacy, terms, initial extension, or populated result views; no page console errors; no horizontal overflow at 390 px. Manual permission-denial, two-provider conflict, report download, and clear-data paths passed.
- Lighthouse mobile against the production site build: Performance 96, Accessibility 100, Best Practices 100, SEO 100; FCP 2.2 s, LCP 2.4 s, CLS 0, total blocking time 0 ms.
- `npm audit` and `npm audit --omit=dev`: 0 known vulnerabilities after upgrading WXT to 0.21.4.
- Desktop and 390 px screenshots were visually reviewed; the generated illustration was checked for text artifacts, brands, misleading UI, and other prompt violations.

## Privacy and security notes

There are no content scripts, host permissions, remote scripts, analytics, accounts, or backend calls. Only matching provider metadata and the user’s local checklist state are stored. The extension does not create credentials or start authentication. The site’s service worker caches public shell assets only.

## Known limits / next steps

- Browsers do not provide a universal API for enumerating OS-level and built-in credential providers. The UI states this limitation and requires manual confirmation when inventory is unavailable.
- The v1 package is an unsigned Chromium MV3 build intended for `Load unpacked`; Chrome Web Store review/signing and a separately tested Firefox package are future distribution work.
- A capability response cannot guarantee a particular relying party’s sign-in flow. The report consistently directs users to test on a non-critical account and retain an independent recovery route.
- The generated hero source is 1536×1024 PNG; the shipped WebP variants are optimized, but AVIF was omitted because WebP is already 20–72 KB and provides broad extension-site compatibility.
