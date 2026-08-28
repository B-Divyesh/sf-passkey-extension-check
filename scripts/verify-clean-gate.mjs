import { execFileSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');

// Exercise the failure mode reported by independent verification: no generated
// WXT configuration is present when the test and type gates start.
await rm(resolve(root, '.wxt'), { recursive: true, force: true });
execFileSync(npm, ['test'], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, [tsc, '--noEmit'], { cwd: root, stdio: 'inherit' });
console.log('Clean WXT gate: test and direct TypeScript check passed without a pre-existing .wxt directory.');
