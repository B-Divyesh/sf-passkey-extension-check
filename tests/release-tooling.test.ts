import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string>; devDependencies: Record<string, string> };
const staticConfig = JSON.parse(readFileSync('site/public/staticwebapp.config.json', 'utf8')) as {
  globalHeaders: Record<string, string>;
  routes: Array<{ route: string; headers: Record<string, string> }>;
};

describe('release tooling contracts', () => {
  it('prepares WXT on install and before test/type quality gates', () => {
    expect(packageJson.scripts['prepare:wxt']).toBe('wxt prepare');
    expect(packageJson.scripts.postinstall).toContain('prepare:wxt');
    expect(packageJson.scripts.pretest).toContain('prepare:wxt');
    expect(packageJson.scripts.precheck).toContain('prepare:wxt');
    expect(packageJson.scripts.check).toContain('test:clean-gate');
  });

  it('pins Playwright to the factory-provided Chromium revision', () => {
    expect(packageJson.devDependencies['@playwright/test']).toBe('1.58.2');
  });

  it('ships strict static-host policy and cache directives', () => {
    expect(staticConfig.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(staticConfig.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(staticConfig.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(staticConfig.globalHeaders['Cache-Control']).toContain('must-revalidate');
    expect(staticConfig.routes).toContainEqual({ route: '/assets/site.js', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
    expect(staticConfig.routes).toContainEqual({ route: '/assets/passkey-diorama-720.webp', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
    expect(staticConfig.routes).toContainEqual({ route: '/assets/passkey-diorama-1280.webp', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
    expect(staticConfig.routes).toContainEqual({ route: '/sw.js', headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } });
  });
});
