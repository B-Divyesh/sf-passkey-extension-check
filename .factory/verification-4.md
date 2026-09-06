# Verify passkey extension conflicts — verification 4

**Work order:** `passkey-extension-check-verify-4`

**Implementation reviewed:** `a55b6871d1598d682f5299586e1b7b1ea0ac12e3`

**Documentation reviewed:** `3aa4107750ed6cee53dfdd859e9d6783e330c3be`

**Live URL:** <https://passkey-extension-check.sociobot.in/>

**Verified:** 2026-09-06 UTC

**Verdict:** **FAIL — 4 findings, including 2 untested public claims.**

## Job, audience, and first action

The job is to find overlapping passkey-provider extensions and prepare a
recovery route before changing a critical login. The audience is people who
use password-manager extensions across browsers, including managed work
profiles. On fresh 390×844 and 1440×1000 browsers, the first action before
scrolling is **Try it with sample data**. It opens a populated conflict report
in one click.

## Findings

### P2 — Several phone touch targets are shorter than 44 px

At a 390 px viewport, these visible controls fail the attached 44×44 CSS-pixel
minimum:

| Surface | Control | Measured size |
| --- | --- | ---: |
| Landing first screen | Download for Chromium | 358×24.8 px |
| Landing sample section | Open the sample report | 215.4×19 px |
| Demo banner | Start for real | 318×24.8 px |
| Product 404 | Open the sample report | 358×24.8 px |
| Packaged extension footer | Privacy | 343×21 px |

The primary sample action, buttons, provider rows, and navigation controls meet
the minimum. Axe does not detect this target-size failure, so the existing
axe-only gate does not cover the contract.

### P2 — Leaving the demo does not discard demo state

In a fresh live browser, `/demo/` created
`demo:passkey-extension-check:sample-v1`. Selecting **Start for real** opened
`/#install`, but the demo key remained in localStorage. The demo contract says
leaving demo mode discards demo data. Real-data isolation still passed: a
sentinel non-demo key was unchanged.

### P2 — The public claims inventory is incomplete

Two testable public claims have no matching `.factory/claims.json` entry and no
dedicated claim command:

1. **Free to use** on the landing page and **free tool** in Terms.
2. **The website does not set analytics cookies** in Privacy. The declared
   `analytics-free` test records request origins but does not inspect cookies.

A fresh live context did contain zero cookies, but manual observation does not
satisfy the required per-claim sandbox test. Untested claim count: **2**.

### P3 — Invalid saved demo data produces a broken result before reset

With malformed JSON in the demo storage key, `/demo/` logs a JSON parse error,
keeps the hard-coded **Provider overlap found** heading, and renders zero
checklist items. **Reset demo** remains usable and restores all four sample
steps, so recovery is available, but the invalid state initially presents an
incomplete and misleading report.

## Declared claim commands

All 18 declared command strings were run separately from the clean checkout.
Each selected exactly one claim and passed:

| Claim | Result | Claim | Result |
| --- | --- | --- | --- |
| `demo-populated` | PASS | `demo-isolated` | PASS |
| `demo-reset` | PASS | `manual-provider-check` | PASS |
| `provider-inventory` | PASS | `webauthn-capability` | PASS |
| `overlap-finding` | PASS | `recovery-checklist` | PASS |
| `local-export` | PASS | `accountless-run` | PASS |
| `analytics-free` | PASS | `no-extension-network` | PASS |
| `no-credential-page-access` | PASS | `no-content-scripts` | PASS |
| `raw-inventory-discarded` | PASS | `local-storage` | PASS |
| `clear-local-data` | PASS | `offline-audit` | PASS |

The combined claim run inside `npm run check` also passed. The two public
claims in the P2 finding above are outside this declared set.

## Clean-checkout and package evidence

A new clone at documentation commit `3aa4107` was installed with `npm ci`.
Only `.factory/handoff.md` differs between the implementation and documentation
commits, so the tested product code is implementation commit `a55b687`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 285 packages installed; 0 vulnerabilities |
| `npm run check` | PASS — clean WXT regeneration, 15/15 tests, build, headed MV3 checks, and 18 declared claims |
| `npx tsc --noEmit` | PASS |
| `npm audit --omit=dev` | PASS — 0 known production vulnerabilities |
| `unzip -t dist/site/downloads/passkey-extension-check-chrome.zip` | PASS |
| Every declared claim command | PASS — 18/18 run separately |

The live root, demo, Privacy, Terms, service worker, site CSS, and site JS match
the clean candidate build by SHA-256. Every unpacked file in the downloaded
live ZIP matches the clean package. HTTP redirects to HTTPS. Live responses
include CSP with `frame-ancestors 'none'`, HSTS, Permissions-Policy,
X-Frame-Options, nosniff, and the expected referrer policy. Versioned site JS
and hero images use immutable caching; the stable CSS continues to revalidate,
as previously documented.

## Live and installed-product evidence

- The fresh phone and desktop sessions had the expected title, `lang=en`, one
  h1, header, main, footer, no horizontal overflow at normal size, no third-party
  requests, and no unexpected console or page errors.
- The sample showed managed 1Password and manually confirmed Bitwarden, a
  capability result, and four recovery-first steps. Reset restored the sample,
  announced completion, kept the banner, and did not alter a real-data sentinel.
- A freshly downloaded and unzipped live MV3 package ran in a new Chromium
  profile. Empty, denied-permission, one-provider, two-provider, export, cancel,
  clear, focus-return, and offline paths behaved as described.
- The package requested only `storage` plus optional `management`, declared no
  host permissions or content scripts, and made only `chrome-extension:`
  requests during the audit. Clear removed all saved extension state.
- Initial and populated extension pages passed axe in light and dark modes.
  Live home, demo, Privacy, Terms, and the designed 404 had no axe violations.
  Skip links and keyboard operation passed; reduced motion changed scrolling to
  instant and transitions to 0.01 ms.
- Privacy and Terms return 200 with distinct titles and metadata. A random path
  returns the expected HTTP 404 with the product page, one h1, main landmark,
  and links home and to the sample. Its navigation 404 console entry is expected
  and is not a defect.
- All landing-page links returned 200, including the ZIP and source repository.
  Browser back/forward restored the home and demo URLs. The activated live
  service worker reloaded the home shell offline.
- The factory `verify-url.sh` passed. Lighthouse mobile scored 100 Performance,
  100 Accessibility, 100 Best Practices, and 100 SEO; FCP 0.9 s, LCP 1.1 s,
  TBT 30 ms, and CLS 0.
- Initial site JS is 884 bytes uncompressed, CSS is 12,786 bytes, the mobile
  hero is 19,710 bytes, and extension application JS is 11,548 bytes. All
  stated budgets pass.

No backend, tenant, health, restart-persistence, or 429 checks apply to this
static site and browser extension. No CLI, library, or desktop artifact applies.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Live domain, TLS, and deployment unavailable | Resolved; strict HTTPS and candidate identity pass |
| Clean checkout lacked generated WXT state | Resolved; fresh `npm ci` and `npm run check` pass |
| Playwright/browser revision mismatch | Resolved; Playwright 1.58.2 uses the supplied Chromium |
| Missing security headers | Resolved on live responses |
| Static assets had only short caching | Resolved for versioned JS and imagery; stable CSS revalidation remains a documented non-defect |
| Missing one-click isolated sample | Main sample, namespace, reset, and real-data isolation resolved; demo exit cleanup is a new P2 finding |
| Populated extension contrast failures | Resolved in headed light and dark axe checks |
| 18 previously untested behaviors | The 18 declared behaviors now pass; two additional public claims remain untested |
| Generic host 404 | Resolved with a designed product 404 and real HTTP 404 status |
| Missing route and social metadata | Resolved on every shipped route |
| Mobile first action below the fold | Resolved at 390×844 and 1440×1000 |
| Prior report found no accessibility defect | Contrast remains resolved; undersized touch targets are a new manual finding |

## Required changes before PASS

1. Give every visible link and button a 44×44 px touch target on phone layouts,
   including the extension footer link.
2. Remove the demo namespace when **Start for real** leaves demo mode.
3. Recover from malformed or obsolete demo storage before rendering a result.
4. Declare and test the free-use and no-analytics-cookie claims, or remove the
   public wording.

No product code was modified during this verification.
