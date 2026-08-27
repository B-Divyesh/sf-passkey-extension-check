import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, '.output/chrome-mv3');
const downloads = resolve(root, 'dist/site/downloads');
const unpacked = resolve(root, 'dist/extension');
const zip = resolve(downloads, 'passkey-extension-check-chrome.zip');

await mkdir(downloads, { recursive: true });
await rm(unpacked, { recursive: true, force: true });
await cp(source, unpacked, { recursive: true });
await rm(zip, { force: true });
execFileSync('zip', ['-qr', zip, '.'], { cwd: source });
console.log(`Packaged ${zip}`);
