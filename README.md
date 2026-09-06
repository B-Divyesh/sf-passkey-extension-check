# Passkey Extension Check

Passkey Extension Check is a Chromium browser extension for people using
password-manager extensions who need to find a provider overlap and make a
recovery plan before changing a critical login.

It checks known provider metadata when you allow it, supports manual provider
confirmation, reports non-secret WebAuthn capability, and exports a local
recovery checklist. It is a readiness aid, not proof that a real account
sign-in will work.

Try the seeded sample at
https://passkey-extension-check.sociobot.in/demo/. The sample starts with a
realistic overlap report. It uses only its demo storage key. See
[.factory/demo.md](.factory/demo.md) for its fixture and reset behavior.

## Run locally

Requirements: Node.js 22+ and npm.

```sh
npm ci
npm run dev       # develop the extension
npm run dev:site  # develop the static site
```

To load the extension locally, run `npm run build:extension`, open
`chrome://extensions`, enable Developer mode, and load
`.output/chrome-mv3`.

## Verify and build

```sh
npm ci
npm run check       # clean gate, build, browser a11y, and every public claim
npm run build       # writes the deployable site and extension package to dist/
npm run test:claims # builds and runs every declared public-claim check
```

`npm run test:a11y` runs desktop and phone site checks plus the headed MV3
extension flow under Xvfb. Playwright is pinned to the factory Chromium
revision. Each visitor-facing promise is listed in
[.factory/claims.json](.factory/claims.json) with a runnable sandbox command.

## Deploy

Deploy `dist/site/` as the static site. It includes the product 404 page,
security headers, sitemap, social metadata, service worker, and
`downloads/passkey-extension-check-chrome.zip`. The package is the
unpacked-development build for Chromium. The factory owns deployment; this
repository does not manage domains or infrastructure.

## Privacy and limits

The extension runs without an account. It has no content scripts and asks for
only local storage plus optional extension-management metadata. It does not
request access to passwords, passkeys, pages, or form values. It keeps matched
provider findings in browser-local extension storage, discards unrelated raw
inventory, and creates reports on the device.

Browser APIs cannot enumerate every operating-system or built-in credential
provider. Keep an existing session and a tested independent recovery route.
For organization-managed providers, contact IT rather than attempting to
remove policy-installed software.

Read the [privacy policy](https://passkey-extension-check.sociobot.in/privacy/)
and [terms](https://passkey-extension-check.sociobot.in/terms/). Licensed under
the [MIT License](LICENSE).
