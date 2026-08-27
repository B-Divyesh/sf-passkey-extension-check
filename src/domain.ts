export const PROVIDERS = [
  { key: '1password', name: '1Password', patterns: ['1password'], ids: ['aeblfdkhhhdcdjpifhhbdiojplfjncoa'] },
  { key: 'bitwarden', name: 'Bitwarden', patterns: ['bitwarden'], ids: ['nngceckbapebfimnlniiiahkandclblb'] },
  { key: 'dashlane', name: 'Dashlane', patterns: ['dashlane'], ids: ['fdjamakpfbbddfjaooikfcpapjohcfmg'] },
  { key: 'keeper', name: 'Keeper', patterns: ['keeper'], ids: ['bfogiafebfohielmmehodmfbbebbbpei'] },
  { key: 'lastpass', name: 'LastPass', patterns: ['lastpass'], ids: ['hdokiejnpimakedhajhdlcegeplioahd'] },
  { key: 'nordpass', name: 'NordPass', patterns: ['nordpass'], ids: ['eiaeiblijfjekdanodkjadfinkhbfgcd'] },
  { key: 'proton-pass', name: 'Proton Pass', patterns: ['proton pass', 'protonpass'], ids: ['ghmbeldphafepmbegfdlkpapadhbakde'] },
] as const;

export type ProviderKey = (typeof PROVIDERS)[number]['key'];
export type ProviderSource = 'detected' | 'confirmed';

export interface ProviderFinding {
  key: ProviderKey;
  name: string;
  enabled: boolean;
  source: ProviderSource;
  managed?: boolean;
}

export interface CapabilityResult {
  platformAuthenticator: boolean | null;
  conditionalMediation: boolean | null;
  clientCapabilities: boolean | null;
  secureContext: boolean;
}

export interface RecoveryState {
  alternateDevice: boolean;
  recoveryCode: boolean;
  passwordFallback: boolean;
  securityKey: boolean;
}

export interface AuditInput {
  inventoryAccess: boolean;
  providers: ProviderFinding[];
  capabilities: CapabilityResult;
  recovery: RecoveryState;
}

export type AuditStatus = 'conflict' | 'review' | 'prepared';

export interface AuditFinding {
  severity: 'conflict' | 'caution' | 'good' | 'info';
  title: string;
  detail: string;
}

export interface AuditResult {
  status: AuditStatus;
  headline: string;
  activeProviderCount: number;
  findings: AuditFinding[];
  checklist: string[];
}

const hasRecovery = (recovery: RecoveryState) => Object.values(recovery).some(Boolean);

export function matchProviders(extensions: Array<{ id: string; name: string; enabled: boolean; installType?: string }>): ProviderFinding[] {
  const matches = extensions.flatMap((extension) => {
    const normalizedName = extension.name.toLowerCase();
    const known = PROVIDERS.find((provider) =>
      provider.ids.includes(extension.id as never) || provider.patterns.some((pattern) => normalizedName.includes(pattern)),
    );
    return known
      ? [{ key: known.key, name: known.name, enabled: extension.enabled, source: 'detected' as const, managed: extension.installType === 'admin' }]
      : [];
  });
  return [...matches.reduce((unique, provider) => {
    const existing = unique.get(provider.key);
    unique.set(provider.key, existing
      ? { ...existing, enabled: existing.enabled || provider.enabled, managed: existing.managed || provider.managed }
      : provider);
    return unique;
  }, new Map<ProviderKey, ProviderFinding>()).values()];
}

export function analyzeAudit(input: AuditInput): AuditResult {
  const enabled = input.providers.filter((provider) => provider.enabled);
  const findings: AuditFinding[] = [];
  const checklist: string[] = [];

  if (enabled.length > 1) {
    findings.push({
      severity: 'conflict',
      title: `${enabled.length} passkey providers may answer the same request`,
      detail: `${enabled.map((provider) => provider.name).join(' and ')} are marked active. Co-installed providers can intercept or suppress the same WebAuthn flow.`,
    });
    checklist.push('Choose the provider you expect to handle passkeys and test it on a non-critical account.');
    if (enabled.some((provider) => provider.managed)) {
      checklist.push('A provider appears organization-managed. Contact IT instead of attempting to remove policy-installed software.');
    } else {
      checklist.push('Temporarily pause one provider, then rerun this check before changing a critical login.');
    }
  } else if (enabled.length === 1) {
    findings.push({ severity: 'good', title: 'One active extension provider', detail: `${enabled[0]!.name} is the only provider included in this check.` });
  } else {
    findings.push({
      severity: 'info',
      title: 'No extension provider included',
      detail: 'Your browser or operating system may still provide passkeys. Confirm any provider this browser could not inventory.',
    });
  }

  if (!input.inventoryAccess) {
    findings.push({
      severity: 'caution',
      title: 'Extension inventory was not available',
      detail: 'The browser did not grant the optional extension-list permission. Manual provider selections are included, but unselected providers remain unknown.',
    });
    checklist.push('Review the browser’s Extensions page and confirm every enabled password manager below.');
  } else {
    findings.push({
      severity: 'good',
      title: 'Installed extensions were checked locally',
      detail: 'Only matching provider names and enabled state were kept; the complete extension list was discarded.',
    });
  }

  if (!input.capabilities.secureContext) {
    findings.push({ severity: 'caution', title: 'WebAuthn needs a secure context', detail: 'This page is not running in a secure extension or HTTPS context, so capability checks are limited.' });
  } else if (input.capabilities.platformAuthenticator === true) {
    findings.push({ severity: 'good', title: 'Built-in authenticator is available', detail: 'The browser reports a user-verifying platform authenticator. This confirms capability, not a working credential for any site.' });
  } else if (input.capabilities.platformAuthenticator === false) {
    findings.push({ severity: 'caution', title: 'No built-in authenticator reported', detail: 'Plan on another device, roaming security key, or a verified fallback before depending on a passkey.' });
    checklist.push('Verify a cross-device or roaming security-key route on a non-critical account.');
  } else {
    findings.push({ severity: 'caution', title: 'Authenticator capability is unknown', detail: 'This browser did not expose the platform authenticator check.' });
  }

  if (!hasRecovery(input.recovery)) {
    findings.push({ severity: 'caution', title: 'No recovery route confirmed', detail: 'A separate, tested way back into the account is the strongest protection against a provider conflict.' });
    checklist.push('While still signed in, add and test at least one independent recovery route.');
  } else {
    findings.push({ severity: 'good', title: 'A recovery route is noted', detail: 'Keep it independent of the browser profile and verify it before removing another sign-in method.' });
  }

  checklist.push('Keep an existing sign-in session open while testing passkey changes.');
  checklist.push('Do not delete a password or recovery method until the intended passkey works twice.');

  const conflict = enabled.length > 1;
  const needsReview = !input.inventoryAccess || input.capabilities.platformAuthenticator !== true || !hasRecovery(input.recovery);
  const status: AuditStatus = conflict ? 'conflict' : needsReview ? 'review' : 'prepared';
  const headline = status === 'conflict'
    ? 'Provider overlap found'
    : status === 'review'
      ? 'A few checks remain'
      : 'No provider overlap found';

  return { status, headline, activeProviderCount: enabled.length, findings, checklist: [...new Set(checklist)] };
}

export function createTextReport(input: AuditInput, result: AuditResult, browserLabel: string, createdAt = new Date()): string {
  const providerLines = input.providers.length
    ? input.providers.map((provider) => `- ${provider.name}: ${provider.enabled ? 'enabled' : 'disabled'} (${provider.source}${provider.managed ? ', organization-managed' : ''})`).join('\n')
    : '- None included';
  const recovery = Object.entries(input.recovery).filter(([, value]) => value).map(([key]) => key).join(', ') || 'none confirmed';
  return `PASSKEY EXTENSION CHECK\nCreated: ${createdAt.toISOString()}\nBrowser: ${browserLabel}\nResult: ${result.headline}\n\nPROVIDERS\n${providerLines}\n\nCAPABILITY\n- Platform authenticator: ${String(input.capabilities.platformAuthenticator)}\n- Conditional mediation: ${String(input.capabilities.conditionalMediation)}\n- Secure context: ${String(input.capabilities.secureContext)}\n- Extension inventory permission: ${input.inventoryAccess ? 'granted' : 'not granted'}\n\nRECOVERY\n${recovery}\n\nCHECKLIST\n${result.checklist.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\nLIMIT\nThis local report is a readiness aid, not a security guarantee. It does not attempt a real sign-in or inspect credentials, passkeys, web pages, or form values.\n`;
}
