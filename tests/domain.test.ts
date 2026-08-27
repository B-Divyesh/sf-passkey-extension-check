import { describe, expect, it } from 'vitest';
import { analyzeAudit, createTextReport, matchProviders, type AuditInput } from '../src/domain';

const base: AuditInput = {
  inventoryAccess: true,
  providers: [],
  capabilities: { platformAuthenticator: true, conditionalMediation: true, clientCapabilities: true, secureContext: true },
  recovery: { alternateDevice: true, recoveryCode: false, passwordFallback: false, securityKey: false },
};

describe('provider matching', () => {
  it('finds known providers and ignores unrelated extensions', () => {
    const matches = matchProviders([
      { id: 'aeblfdkhhhdcdjpifhhbdiojplfjncoa', name: 'Password tool', enabled: true, installType: 'admin' },
      { id: 'other', name: 'Calendar helper', enabled: true },
      { id: 'fork', name: 'Bitwarden Beta', enabled: false },
    ]);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({ name: '1Password', managed: true, enabled: true });
    expect(matches[1]).toMatchObject({ name: 'Bitwarden', enabled: false });
  });

  it('deduplicates stable and beta builds from the same provider', () => {
    const matches = matchProviders([
      { id: 'stable', name: 'Bitwarden', enabled: true },
      { id: 'beta', name: 'Bitwarden Beta', enabled: false },
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.enabled).toBe(true);
  });
});

describe('readiness analysis', () => {
  it('flags two active providers as a conflict', () => {
    const result = analyzeAudit({
      ...base,
      providers: [
        { key: '1password', name: '1Password', enabled: true, source: 'detected' },
        { key: 'bitwarden', name: 'Bitwarden', enabled: true, source: 'detected' },
      ],
    });
    expect(result.status).toBe('conflict');
    expect(result.headline).toBe('Provider overlap found');
    expect(result.checklist.join(' ')).toContain('Temporarily pause one provider');
  });

  it('does not claim prepared when inventory permission is missing', () => {
    const result = analyzeAudit({ ...base, inventoryAccess: false });
    expect(result.status).toBe('review');
    expect(result.findings.some((finding) => finding.title.includes('not available'))).toBe(true);
  });

  it('marks a single provider and recovery route as prepared', () => {
    const result = analyzeAudit({ ...base, providers: [{ key: 'bitwarden', name: 'Bitwarden', enabled: true, source: 'detected' }] });
    expect(result.status).toBe('prepared');
  });

  it('adds a managed-policy action without suggesting removal', () => {
    const result = analyzeAudit({
      ...base,
      providers: [
        { key: '1password', name: '1Password', enabled: true, source: 'detected', managed: true },
        { key: 'bitwarden', name: 'Bitwarden', enabled: true, source: 'detected' },
      ],
    });
    expect(result.checklist.join(' ')).toContain('Contact IT');
    expect(result.checklist.join(' ')).not.toContain('Temporarily pause');
  });
});

describe('plain-text export', () => {
  it('contains result, limits, and no credential material', () => {
    const result = analyzeAudit(base);
    const report = createTextReport(base, result, 'Test Browser', new Date('2026-08-27T12:00:00Z'));
    expect(report).toContain('Test Browser');
    expect(report).toContain('not a security guarantee');
    expect(report).toContain('2026-08-27T12:00:00.000Z');
  });
});
