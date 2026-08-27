# Passkey Extension Check

Passkey Extension Check is a free, local-first browser extension for people who use password managers across browsers—or have organization-managed extensions—and want to spot passkey-provider overlap before changing a critical login.

It inventories known password/passkey provider extensions with an optional browser permission, provides a manual fallback when the browser cannot expose them, checks non-secret WebAuthn capability, and creates an exportable recovery checklist. It never reads credentials, passkeys, page contents, or form values, and it does not attempt a real authentication ceremony.

Live site: <https://passkey-extension-check.sociobot.in>

## Run locally

Requirements: Node.js 22+ and npm.

```sh
npm install
npm run dev       # WXT development extension
npm run dev:site  # landing site
```

To test an unpacked development build:

1. Run `npm run build:extension`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
3. Select `.output/chrome-mv3`, then click the extension toolbar icon.

## Test and build

```sh
npm test          # rule-engine and HTML contract tests
npm run check     # typecheck, tests, extension + site build
npm run build     # reproducible release output in dist/
```

Release output:

- `dist/extension/` — unpacked Chromium MV3 extension.
- `dist/site/` — deployable static site (with `index.html` at its root).
- `dist/site/downloads/passkey-extension-check-chrome.zip` — packaged extension linked by the site.

`npm run build:site` and `npm run build` both produce the complete static deployment, including the packaged download.

## How detection works

The optional `management` permission exposes installed extension metadata. The extension matches known providers locally, retains only matches, and discards the raw list. If access is declined or unsupported, the same workflow continues with explicit provider checkboxes. Browser and operating-system credential providers are not always enumerable, so the report labels this limitation instead of promising safety.

Recovery selections and the last check are stored only in extension-local storage and can be cleared from the results screen. Exported reports are plain text generated in the browser.

## Project structure

- `entrypoints/` — WXT background and options-page application.
- `src/domain.ts` — provider matching, readiness rules, and report generation.
- `site/` — static product, privacy, and terms pages.
- `tests/` — deterministic rule and accessibility-contract tests.
- `.factory/design.md` — product-specific visual system and asset provenance.

## Scope and safety

This is a readiness aid, not a security guarantee. Test changes on a non-critical account, keep an existing session open, and maintain an independent recovery method. Organization-managed extensions should be handled with IT rather than bypassed.

Licensed under the [MIT License](LICENSE).
