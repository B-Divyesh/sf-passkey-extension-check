# Demo sandbox

Open https://passkey-extension-check.sociobot.in/demo/ or select **Try it with sample data** on the landing page.

The sample is a populated managed-work-profile conflict: 1Password and
Bitwarden are enabled, a signed-in second device is available, and the result
is **Provider overlap found**. It shows the recovery-first actions without
attempting a WebAuthn ceremony or reading extension data.

The demo writes only demo:passkey-extension-check:sample-v1 in the site's
browser localStorage. It never reads or writes the extension's
chrome.storage.local namespace. **Reset demo** deletes and re-seeds that demo
key. **Start for real** returns to the installation instructions.
