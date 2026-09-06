import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--config', 'site/vite.config.ts', '--host', '127.0.0.1', '--port', '4173'], { cwd: root, stdio: 'pipe' });
const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      if ((await fetch('http://127.0.0.1:4173/')).ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error('Preview server did not start');
}

const browser = await chromium.launch({ headless: true });
try {
  await waitForServer();
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const pageContext = await browser.newContext({ viewport });
    const page = await pageContext.newPage();
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    const primaryAction = await page.getByRole('link', { name: /Try it with sample data/ }).boundingBox();
    if (!primaryAction || primaryAction.y >= viewport.height) throw new Error(`Primary demo action is below the first screen at ${viewport.width}px`);
    await page.keyboard.press('Tab');
    if (!(await page.locator('.skip-link').evaluate((element) => document.activeElement === element))) throw new Error('Skip link is not first in keyboard order');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash === '#main');
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (serious.length || errors.length || overflow) throw new Error(JSON.stringify({ viewport, serious, errors, overflow }, null, 2));
    await pageContext.close();
  }
  const routes = [
    { path: '/privacy/', title: 'Privacy — Passkey Extension Check' },
    { path: '/terms/', title: 'Terms — Passkey Extension Check' },
    { path: '/demo/', title: 'Demo — Passkey Extension Check' },
    { path: '/404.html', title: 'Page not found — Passkey Extension Check' },
  ];
  for (const { path, title } of routes) {
    const pageContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await pageContext.newPage();
    await page.goto('http://127.0.0.1:4173' + path, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    const metadata = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelectorAll('h1').length,
      main: Boolean(document.querySelector('main')),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      og: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      twitter: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
      apple: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
    }));
    if (serious.length || metadata.lang !== 'en' || metadata.title !== title || metadata.h1 !== 1 || !metadata.main || !metadata.canonical || !metadata.og || metadata.twitter !== 'summary_large_image' || !metadata.apple) {
      throw new Error(path + ': ' + JSON.stringify({ serious, metadata }, null, 2));
    }
    if (path === '/demo/') {
      if (!(await page.locator('.demo-banner').textContent())?.includes('Demo — sample data, nothing is saved')) throw new Error('Demo banner is missing its persistent storage boundary');
      if ((await page.locator('#result-title').textContent()) !== 'Provider overlap found') throw new Error('Demo did not show a populated sample result');
    }
    if (path === '/404.html' && !(await page.getByRole('link', { name: 'Go to the passkey check' }).count())) throw new Error('404 page has no way back');
    await pageContext.close();
  }
  console.log('Site: desktop and phone smoke, route metadata, demo sandbox, and styled 404 are clean.');

  const profile = await mkdtemp(join(tmpdir(), 'passkey-check-'));
  const context = await chromium.launchPersistentContext(profile, {
    headless: process.env.EXTENSION_HEADED !== '1',
    args: [`--disable-extensions-except=${resolve(root, '.output/chrome-mv3')}`, `--load-extension=${resolve(root, '.output/chrome-mv3')}`],
  });
  try {
    let worker = context.serviceWorkers()[0];
    try {
      worker ??= await context.waitForEvent('serviceworker', { timeout: 5000 });
    } catch (error) {
      if (process.env.EXTENSION_HEADED !== '1') {
        console.log('Extension axe check skipped: Chromium headless does not load MV3 extensions. Rerun with EXTENSION_HEADED=1 under a display server.');
        worker = undefined;
      } else throw error;
    }
    if (worker) {
      const extensionId = new URL(worker.url()).host;
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.addInitScript(() => {
        chrome.permissions.contains = async () => false;
        chrome.permissions.request = async () => false;
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`chrome-extension://${extensionId}/options.html`);
      let axe = await new AxeBuilder({ page }).analyze();
      let serious = axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
      if (serious.length) throw new Error(`Extension initial: ${JSON.stringify(serious, null, 2)}`);
      await page.getByRole('button', { name: 'Run readiness check' }).focus();
      await page.keyboard.press('Enter');
      await page.locator('#audit-content:not([hidden])').waitFor();
      await page.locator('input[value="1password"]').focus();
      await page.keyboard.press('Space');
      await page.locator('input[value="bitwarden"]').focus();
      await page.keyboard.press('Space');
      await page.locator('input[value="alternateDevice"]').focus();
      await page.keyboard.press('Space');
      if ((await page.locator('#result-title').textContent()) !== 'Provider overlap found') throw new Error('Conflict flow did not produce the expected result');
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error('Extension results overflow at 390px');
      axe = await new AxeBuilder({ page }).analyze();
      serious = axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
      if (serious.length) throw new Error(`Extension results: ${JSON.stringify(serious, null, 2)}`);
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export local report' }).click();
      const download = await downloadPromise;
      if (!download.suggestedFilename().endsWith('.txt')) throw new Error('Report export did not create a text file');
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Clear saved check' }).click();
      if (await page.locator('#workspace').isVisible()) throw new Error('Clear action did not reset the workspace');
      if (errors.length) throw new Error(`Extension console errors: ${JSON.stringify(errors)}`);
      console.log('Extension: initial/results axe clean; manual conflict, export, and clear flows pass.');
    }
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
