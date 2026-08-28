# Independent verification 3 — PASS

**Candidate:** `6c9e7cc1dbf9246a6ba4612d4460bd33ab78af5f` (`main`)
**Production URL:** `https://passkey-extension-check.sociobot.in/`
**Verified:** 2026-08-28 UTC, Node 22.23.2 / npm 10.9.8
**Verdict:** **PASS — candidate meets the researched brief and release gates.**

This is a fresh verification from a clean checkout. It supersedes the two
earlier FAIL reports, which tested the prior candidate
`0a9124cac92fccccbd3f7283af21a5049f4343b0`. The previous clean-install,
browser-provisioning, deployment/TLS, response-policy, and asset-caching
findings are resolved in this candidate.

## Exact local gate

After `npm ci` from the clean candidate checkout (285 packages; 0 audit
vulnerabilities), all available checks passed:

| Command | Fresh result |
| --- | --- |
| `npm test` | PASS — 3 Vitest files, 13/13 tests. The declared pretest WXT preparation ran. |
| `npx tsc --noEmit` | PASS. |
| `npm run test:clean-gate` | PASS — removes `.wxt` then proves `npm test` and direct TypeScript checking recover without pre-existing generated state. |
| `npm run build` | PASS — WXT Chromium MV3 build, static site build, and Chromium ZIP package. |
| `npm run check` | PASS — repeats clean gate, exact build, local static a11y/runtime smoke. |
| `xvfb-run -a env EXTENSION_HEADED=1 npm run test:a11y` | PASS — headed MV3 test: initial and populated extension pages have no serious/critical axe findings; manual conflict, text export, and confirmed clear flow work. |
| `unzip -t dist/site/downloads/passkey-extension-check-chrome.zip` | PASS — archive integrity. |
| `npm audit --omit=dev` | PASS — 0 known production vulnerabilities. |

There is no separate lint script in the repository. Playwright is locked to
`1.58.2`, which used the supplied Chromium revision without an ambient
download.

## Independent product exercise

I loaded both the freshly built unpacked MV3 extension and the independently
downloaded, newly unzipped production ZIP into fresh Chromium profiles.

- Denying optional `management` permission exposes the manual path and keeps
  an empty/no-recovery profile at **“A few checks remain”** rather than
  claiming readiness.
- Adding one manual provider plus a recovery code remains uncertain while
  inventory is denied; adding a second provider changes the result to
  **“Provider overlap found”** and supplies the non-managed pause-and-retest
  route.
- A stubbed documented inventory with enabled 1Password (admin-installed),
  Bitwarden, and an unrelated Calendar extension produced the conflict and
  the safe **“Contact IT instead of attempting to remove policy-installed
  software”** route. The unrelated extension was neither rendered nor stored.
- Keyboard Enter runs the audit; Space changes checklist controls. The first
  focusable run button has a visible designed outline. Reset cancellation
  preserves the data; accepting the explicit confirmation clears local
  storage, hides the workspace, and returns focus to the primary action.
- At 390px there was no horizontal overflow. `prefers-reduced-motion: reduce`
  changes transitions to 0.01ms. No extension console/page errors occurred.

These flows cover the brief's normal coexistence case, empty boundary,
permission refusal and recovery path, a managed-policy constraint, and the
manual recovery route. They correctly avoid a real relying-party sign-in and
state that WebAuthn capability is not a guarantee.

## Privacy and package review

The released manifest is MV3 with only required `storage` permission and
optional `management`; it has no host permissions or content scripts. Source
and runtime review found no credential, passkey, page/form-value, history,
network-interception, analytics, telemetry, remote-font, or remote-fetch
path. Observed extension requests were only `chrome-extension:` URLs.

Runtime storage after an audit contained only the local `audit` record and
`lastCheckedAt`; reset emptied it. Raw inventory is reduced to known-provider
name/state before storage. Plain-text export is local. The live website's
desktop and mobile sessions requested only
`https://passkey-extension-check.sociobot.in` resources (the source link was
not followed); no third-party scripts, images, analytics, or cookies were
observed.

## Accessibility, visual, responsive, and performance evidence

Fresh live Chromium checks at 1440px and 390px confirmed the expected title,
`lang=en`, exactly one `h1`, `main`, skip link, visible focus, no overflow,
no console/page errors, and no serious/critical axe violations. Privacy and
terms are present and passed the repository axe smoke test. Reduced motion is
honored. Visual inspection of both viewports found the paper-cut inspection
layout clear and readable; mobile deliberately stacks the artwork and actions
without hiding product controls.

Live Lighthouse mobile result:

| Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 100 | 100 | 100 | 0.9s | 1.1s | 70ms | 0 |

Budgets pass: extension primary JS is 11,548 B (35.24 KB total extension);
site entry JS is 711 B, site CSS 8,492 B, and the largest hero is 72,872 B.
No fonts ship. All are within the stated static-product budgets.

## Deployment, response policy, and identity

Strict TLS serves HTTP/2 200 with a certificate whose CN/SAN includes
`passkey-extension-check.sociobot.in`; HTTP redirects with 301 to HTTPS.
The live root HTML, site/service-worker scripts, CSS, icon, both hero WebPs,
privacy page, terms page, and Vite module matched the fresh candidate build
by SHA-256. The live ZIP's archive bytes vary with ZIP metadata, but every
unpacked file hash matched the fresh packaged extension.

Responses include the configured same-origin CSP (`frame-ancestors 'none'`),
`Permissions-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff`, strict referrer policy, and HSTS. HTML and service worker correctly
revalidate; `site.js` and both versioned WebP assets are `max-age=31536000,
immutable`. After activation and a controlled reload, offline reload returned
the cached landing-page title. This product is a browser extension rather
than an installable web PWA (no web manifest), but its supporting site
service-worker offline path functions.

## Defects

No release-blocking (P0/P1) or non-blocking product defects (P2/P3) were
found in this candidate.

One implementation note, not a release defect: `/assets/site.css` is served
with short revalidation because its file name is stable (it carries a manual
version query), whereas the genuinely versioned static JS and imagery use
immutable caching. The measured result remains 100 performance and the
candidate meets the stated immutable policy for its configured versioned
assets.

## Known product limits

Documented browser APIs cannot enumerate every operating-system or built-in
credential provider. The extension makes that uncertainty explicit and offers
manual confirmation. It neither attempts nor promises success for a real
WebAuthn ceremony; users must retain and test an independent recovery route.

No product source was modified during verification.
