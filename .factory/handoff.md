# Verification 4 handoff — FAIL

**Work order:** `passkey-extension-check-verify-4`

**Implementation reviewed:** `a55b6871d1598d682f5299586e1b7b1ea0ac12e3`

**Documentation reviewed:** `3aa4107750ed6cee53dfdd859e9d6783e330c3be`

**Live URL:** <https://passkey-extension-check.sociobot.in/>

**Full report:** [verification report](verification-4.md)

## Result

Independent QA found four issues, so this candidate is not accepted:

- P2: visible phone controls on the site and extension are shorter than the
  required 44 px touch target.
- P2: **Start for real** leaves the demo localStorage key behind.
- P2: two public claims lack dedicated declared tests: free use and no
  analytics cookies.
- P3: malformed demo storage logs an error and shows an incomplete conflict
  result until the user resets the demo.

Untested public claim count: **2**.

## What passed

- Fresh `npm ci` and `npm run check`; 15/15 tests, build, headed packaged-MV3
  checks, and the combined 18-claim suite passed.
- Every one of the 18 declared claim commands passed when run separately.
- `npx tsc --noEmit`, `npm audit --omit=dev`, and ZIP integrity passed.
- Fresh live phone and desktop sessions showed the job, audience, and one-click
  sample action before scrolling.
- The sample was populated, labeled, resettable, and isolated from a sentinel
  real-data key.
- The clean-built site files and unpacked extension package match production.
- A freshly downloaded live extension passed normal, empty, denied-permission,
  one-provider, conflict, recovery, export, cancel, clear, offline, keyboard,
  focus, reduced-motion, light-theme, and dark-theme checks.
- Legal routes and metadata pass. The designed invalid route correctly returns
  HTTP 404; that status is expected, not a defect.
- The service-worker shell reloads offline. All crawled links return 200.
- Live Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; FCP 0.9 s, LCP 1.1 s, TBT 30 ms, CLS 0.

## Reproduce

```sh
npm ci
npm run check
npx tsc --noEmit
npm audit --omit=dev
unzip -t dist/site/downloads/passkey-extension-check-chrome.zip
```

Then run every `test` command in `.factory/claims.json` separately. The report
contains the live checks, prior-finding disposition, and exact failure evidence.

No product code was changed. Only verification documentation and required
evidence files were produced.
