import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const extensionPath = resolve(root, '.output/chrome-mv3');
const siteOrigin = 'http://127.0.0.1:4174';
const grepAt = process.argv.indexOf('--grep');
const grep = grepAt >= 0 ? process.argv[grepAt + 1] : '';
const requested = grep ? grep.replace('@claim:', '') : '';
const allClaimIds = [
  'demo-populated', 'demo-isolated', 'demo-reset', 'manual-provider-check',
  'provider-inventory', 'webauthn-capability', 'overlap-finding',
  'recovery-checklist', 'local-export', 'accountless-run', 'analytics-free',
  'no-extension-network', 'no-credential-page-access', 'no-content-scripts',
  'raw-inventory-discarded', 'local-storage', 'clear-local-data', 'offline-audit',
];

if (requested && !allClaimIds.includes(requested)) {
  throw new Error('Unknown claim filter: ' + grep);
}

const selected = requested ? [requested] : allClaimIds;
const delay = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForSite() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      if ((await fetch(siteOrigin + '/')).ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error('Static preview server did not start');
}

async function withSite(run) {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--config', 'site/vite.config.ts', '--host', '127.0.0.1', '--port', '4174'], { cwd: root, stdio: 'pipe' });
  const browser = await chromium.launch({ headless: true });
  try {
    await waitForSite();
    await run(browser);
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }
}

async function withExtension(run, options = {}) {
  const profile = await mkdtemp(join(tmpdir(), 'passkey-claim-'));
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    args: ['--disable-extensions-except=' + extensionPath, '--load-extension=' + extensionPath],
  });
  try {
    let worker = context.serviceWorkers()[0];
    worker ??= await context.waitForEvent('serviceworker', { timeout: 5000 });
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    const permission = options.inventory ? true : false;
    await page.addInitScript((fixture) => {
      chrome.permissions.contains = async () => fixture.permission;
      chrome.permissions.request = async () => fixture.permission;
      if (fixture.inventory) {
        try {
          Object.defineProperty(chrome.management, 'getAll', { configurable: true, value: async () => fixture.inventory });
        } catch {
          chrome.management.getAll = async () => fixture.inventory;
        }
      }
    }, {
      permission,
      inventory: options.inventory ?? null,
    });
    await page.goto('chrome-extension://' + extensionId + '/options.html');
    await run({ context, page, extensionId });
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
}

async function manualAudit(page, { recovery = true } = {}) {
  await page.getByRole('button', { name: 'Run readiness check' }).click();
  await page.locator('#audit-content:not([hidden])').waitFor();
  await page.locator('input[value="1password"]').check();
  await page.locator('input[value="bitwarden"]').check();
  if (recovery) await page.locator('input[value="alternateDevice"]').check();
  await page.locator('#result-title').waitFor();
}

async function storedAudit(page) {
  return page.evaluate(async () => await new Promise((resolvePromise) => chrome.storage.local.get(null, resolvePromise)));
}

const claimTests = {
  'demo-populated': async () => {
    await withSite(async (browser) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(siteOrigin + '/', { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: /try it with sample data/i }).click();
      await page.locator('.demo-banner').waitFor();
      assert((await page.locator('#result-title').textContent()) === 'Provider overlap found', 'Sample did not open a populated overlap report');
      assert(await page.getByText('1Password', { exact: true }).isVisible(), 'Sample omitted its realistic provider data');
      await context.close();
    });
  },
  'demo-isolated': async () => {
    await withSite(async (browser) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(siteOrigin + '/demo/', { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.setItem('passkey-extension-check:real-audit', 'leave-me-alone'));
      await page.getByRole('button', { name: 'Reset demo' }).click();
      const state = await page.evaluate(() => ({
        real: localStorage.getItem('passkey-extension-check:real-audit'),
        demo: localStorage.getItem('demo:passkey-extension-check:sample-v1'),
      }));
      assert(state.real === 'leave-me-alone', 'Demo reset changed a non-demo storage key');
      assert(Boolean(state.demo), 'Demo did not use its namespaced storage key');
      await context.close();
    });
  },
  'demo-reset': async () => {
    await withSite(async (browser) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(siteOrigin + '/demo/', { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.setItem('demo:passkey-extension-check:sample-v1', JSON.stringify({ providers: [] })));
      await page.getByRole('button', { name: 'Reset demo' }).click();
      assert((await page.locator('#result-title').textContent()) === 'Provider overlap found', 'Reset did not restore the seeded sample');
      assert((await page.locator('#demo-status').textContent())?.includes('Sample restored'), 'Reset did not confirm the recovery action');
      await context.close();
    });
  },
  'manual-provider-check': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page);
      assert((await page.locator('#result-title').textContent()) === 'Provider overlap found', 'Manual selections did not produce the overlap result');
      assert((await page.locator('#inventory-explanation').textContent())?.includes('not granted'), 'Manual fallback was not shown when inventory access was denied');
    });
  },
  'provider-inventory': async () => {
    await withExtension(async ({ page }) => {
      await page.getByRole('button', { name: 'Run readiness check' }).click();
      await page.locator('#audit-content:not([hidden])').waitFor();
      const selectedProviders = await page.locator('input[name="provider"]:checked').evaluateAll((inputs) => inputs.map((input) => input.getAttribute('value')));
      assert(selectedProviders.includes('1password') && selectedProviders.includes('bitwarden'), 'Known fixture providers were not selected from inventory metadata');
      assert(!await page.getByText('Calendar helper', { exact: true }).count(), 'An unrelated extension was displayed as a provider');
    }, {
      inventory: [
        { id: 'aeblfdkhhhdcdjpifhhbdiojplfjncoa', name: '1Password', enabled: true, installType: 'admin' },
        { id: 'nngceckbapebfimnlniiiahkandclblb', name: 'Bitwarden', enabled: true, installType: 'normal' },
        { id: 'calendar', name: 'Calendar helper', enabled: true, installType: 'normal' },
      ],
    });
  },
  'webauthn-capability': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page, { recovery: false });
      const findingText = await page.locator('#findings').innerText();
      assert(/authenticator|WebAuthn/i.test(findingText), 'Audit did not report a WebAuthn capability outcome');
    });
  },
  'overlap-finding': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page);
      assert((await page.locator('#result-title').textContent()) === 'Provider overlap found', 'Two enabled providers did not yield an overlap finding');
    });
  },
  'recovery-checklist': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page);
      const findings = await page.locator('#findings').innerText();
      const checklist = await page.locator('#checklist-items').innerText();
      assert(findings.includes('A recovery route is noted'), 'Confirmed recovery route was not reflected in the report');
      assert(checklist.includes('Keep an existing sign-in session open'), 'Recovery-first checklist was missing');
    });
  },
  'local-export': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page);
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export local report' }).click();
      const download = await downloadPromise;
      const content = await readFile(await download.path(), 'utf8');
      assert(download.suggestedFilename().endsWith('.txt'), 'Export did not produce a text file');
      assert(content.includes('Result: Provider overlap found'), 'Exported report omitted the observed result');
      assert(content.includes('LIMIT'), 'Exported report omitted its safety limit');
    });
  },
  'accountless-run': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page);
      assert((await page.locator('#result-title').textContent()) === 'Provider overlap found', 'Audit did not complete in a fresh profile');
      assert(await page.locator('input[type="email"], input[type="password"], [autocomplete="username"]').count() === 0, 'Audit asked for account credentials');
    });
  },
  'analytics-free': async () => {
    await withSite(async (browser) => {
      const siteContext = await browser.newContext();
      const siteRequests = [];
      siteContext.on('request', (request) => siteRequests.push(request.url()));
      const sitePage = await siteContext.newPage();
      await sitePage.goto(siteOrigin + '/demo/', { waitUntil: 'networkidle' });
      assert(siteRequests.every((url) => new URL(url).origin === siteOrigin), 'Sample loaded a third-party request');
      await siteContext.close();
    });
    await withExtension(async ({ context, page }) => {
      const requests = [];
      context.on('request', (request) => requests.push(request.url()));
      await manualAudit(page);
      assert(requests.every((url) => new URL(url).protocol === 'chrome-extension:'), 'Extension audit loaded a non-extension request');
    });
  },
  'no-extension-network': async () => {
    await withExtension(async ({ context, page }) => {
      const requests = [];
      context.on('request', (request) => requests.push(request.url()));
      await manualAudit(page);
      assert(requests.every((url) => new URL(url).protocol === 'chrome-extension:'), 'Readiness audit made a network request');
    });
  },
  'no-credential-page-access': async () => {
    await withExtension(async ({ page }) => {
      const manifest = await page.evaluate(() => chrome.runtime.getManifest());
      assert(!manifest.host_permissions?.length, 'Packaged extension requests host permissions');
      assert(!manifest.permissions?.some((permission) => ['tabs', 'activeTab', 'webRequest', 'scripting'].includes(permission)), 'Packaged extension requests page or traffic access');
    });
  },
  'no-content-scripts': async () => {
    await withExtension(async ({ page }) => {
      const manifest = await page.evaluate(() => chrome.runtime.getManifest());
      assert(!manifest.content_scripts?.length, 'Packaged extension declares content scripts');
    });
  },
  'raw-inventory-discarded': async () => {
    await withExtension(async ({ page }) => {
      await page.getByRole('button', { name: 'Run readiness check' }).click();
      await page.locator('#audit-content:not([hidden])').waitFor();
      const storage = await storedAudit(page);
      const serialized = JSON.stringify(storage);
      assert(!serialized.includes('Calendar helper') && !serialized.includes('calendar'), 'Raw unrelated inventory was retained');
      assert(serialized.includes('1Password') && serialized.includes('Bitwarden'), 'Matched provider facts were not kept');
    }, {
      inventory: [
        { id: 'aeblfdkhhhdcdjpifhhbdiojplfjncoa', name: '1Password', enabled: true, installType: 'admin' },
        { id: 'nngceckbapebfimnlniiiahkandclblb', name: 'Bitwarden', enabled: true, installType: 'normal' },
        { id: 'calendar', name: 'Calendar helper', enabled: true, installType: 'normal' },
      ],
    });
  },
  'local-storage': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page);
      const storage = await storedAudit(page);
      assert(Object.hasOwn(storage, 'audit') && Object.hasOwn(storage, 'lastCheckedAt'), 'Audit was not stored in extension-local storage');
      assert(storage.audit.providers.some((provider) => provider.name === '1Password'), 'Saved audit did not retain the selected provider');
    });
  },
  'clear-local-data': async () => {
    await withExtension(async ({ page }) => {
      await manualAudit(page);
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Clear saved check' }).click();
      await page.locator('#workspace').waitFor({ state: 'hidden' });
      const storage = await storedAudit(page);
      assert(Object.keys(storage).length === 0, 'Clear saved check did not remove local audit data');
    });
  },
  'offline-audit': async () => {
    await withExtension(async ({ context, page }) => {
      await context.setOffline(true);
      await manualAudit(page);
      assert((await page.locator('#result-title').textContent()) === 'Provider overlap found', 'Manual readiness audit did not complete offline');
      assert(await page.locator('#offline').isVisible(), 'Offline state was not shown');
    });
  },
};

for (const id of selected) {
  await claimTests[id]();
  console.log('PASS @claim:' + id);
}
