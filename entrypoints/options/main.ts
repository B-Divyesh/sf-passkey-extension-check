import { browser } from 'wxt/browser';
import { PROVIDERS, analyzeAudit, createTextReport, matchProviders, type AuditInput, type CapabilityResult, type ProviderFinding, type RecoveryState } from '../../src/domain';
import './style.css';

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const runButton = $('#run-check') as HTMLButtonElement;
const workspace = $('#workspace');
const loading = $('#loading');
const auditContent = $('#audit-content');
const live = $('#live-region');
const recoveryDefaults: RecoveryState = { alternateDevice: false, recoveryCode: false, passwordFallback: false, securityKey: false };
let currentInput: AuditInput | null = null;

function browserLabel(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Chrome/')) return 'Chromium-based browser';
  return 'Unknown browser';
}

async function capabilities(): Promise<CapabilityResult> {
  if (!window.PublicKeyCredential) return { platformAuthenticator: false, conditionalMediation: null, clientCapabilities: false, secureContext: window.isSecureContext };
  const platform = typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ? await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => null)
    : null;
  const conditional = typeof PublicKeyCredential.isConditionalMediationAvailable === 'function'
    ? await PublicKeyCredential.isConditionalMediationAvailable().catch(() => null)
    : null;
  const hasCapabilities = 'getClientCapabilities' in PublicKeyCredential;
  return { platformAuthenticator: platform, conditionalMediation: conditional, clientCapabilities: hasCapabilities, secureContext: window.isSecureContext };
}

async function inventory(): Promise<{ access: boolean; providers: ProviderFinding[] }> {
  let access = await browser.permissions.contains({ permissions: ['management'] });
  if (!access) access = await browser.permissions.request({ permissions: ['management'] }).catch(() => false);
  if (!access || !browser.management) return { access: false, providers: [] };
  try {
    const extensions = await browser.management.getAll();
    return { access: true, providers: matchProviders(extensions.map((extension) => ({ id: extension.id, name: extension.name, enabled: extension.enabled, installType: extension.installType }))) };
  } catch {
    return { access: false, providers: [] };
  }
}

function recoveryFromForm(): RecoveryState {
  const state = { ...recoveryDefaults };
  document.querySelectorAll<HTMLInputElement>('input[name="recovery"]').forEach((input) => { state[input.value as keyof RecoveryState] = input.checked; });
  return state;
}

function providersFromForm(): ProviderFinding[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[name="provider"]'))
    .filter((input) => input.checked || input.dataset.detected === 'true')
    .map((input) => ({
    key: input.value as ProviderFinding['key'],
    name: PROVIDERS.find((provider) => provider.key === input.value)!.name,
    enabled: input.checked,
    source: input.dataset.detected === 'true' ? 'detected' : 'confirmed',
    managed: input.dataset.managed === 'true',
  }));
}

function renderProviderList(detected: ProviderFinding[]) {
  const byKey = new Map(detected.map((provider) => [provider.key, provider]));
  $('#provider-list').innerHTML = PROVIDERS.map((provider) => {
    const match = byKey.get(provider.key);
    const note = match ? `${match.managed ? 'Organization-managed · ' : ''}Detected and ${match.enabled ? 'enabled' : 'disabled'}` : 'Select if enabled in this profile';
    return `<label><input type="checkbox" name="provider" value="${provider.key}" ${match?.enabled ? 'checked' : ''} data-detected="${Boolean(match)}" data-managed="${Boolean(match?.managed)}"><span><strong>${provider.name}</strong><small>${note}</small></span></label>`;
  }).join('');
}

function iconFor(severity: string) {
  return severity === 'good' ? '✓' : severity === 'conflict' ? '!' : severity === 'caution' ? '!' : 'i';
}

async function updateResult(announce = true) {
  if (!currentInput) return;
  currentInput = { ...currentInput, providers: providersFromForm(), recovery: recoveryFromForm() };
  const result = analyzeAudit(currentInput);
  const banner = $('#result-banner');
  banner.dataset.status = result.status;
  $('#result-mark').textContent = result.status === 'prepared' ? '✓' : '!';
  $('#result-title').textContent = result.headline;
  $('#result-summary').textContent = result.status === 'conflict'
    ? 'Resolve the overlap and verify a recovery route before changing a critical login.'
    : result.status === 'review'
      ? 'No confirmed overlap, but capability, inventory, or recovery needs attention.'
      : 'This profile has one or fewer included providers and a recovery route noted.';
  $('#findings').innerHTML = result.findings.map((finding) => `<li class="finding ${finding.severity}"><span aria-hidden="true">${iconFor(finding.severity)}</span><div><strong>${finding.title}</strong><p>${finding.detail}</p></div></li>`).join('');
  $('#checklist-items').innerHTML = result.checklist.map((item) => `<li>${item}</li>`).join('');
  await browser.storage.local.set({ audit: currentInput, lastCheckedAt: new Date().toISOString() });
  if (announce) live.textContent = `${result.headline}. ${result.findings.length} findings. Results updated.`;
}

async function runAudit() {
  runButton.disabled = true;
  workspace.hidden = false;
  loading.hidden = false;
  auditContent.hidden = true;
  workspace.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const [found, capability, saved] = await Promise.all([inventory(), capabilities(), browser.storage.local.get('audit')]);
  const savedAudit = saved.audit as AuditInput | undefined;
  renderProviderList(found.providers.length ? found.providers : savedAudit?.providers ?? []);
  const recovery = savedAudit?.recovery ?? { ...recoveryDefaults };
  document.querySelectorAll<HTMLInputElement>('input[name="recovery"]').forEach((input) => { input.checked = recovery[input.value as keyof RecoveryState]; });
  currentInput = { inventoryAccess: found.access, providers: providersFromForm(), capabilities: capability, recovery };
  $('#inventory-explanation').textContent = found.access
    ? 'Detected matches are selected. The complete extension list was discarded; confirm anything missed.'
    : 'Inventory permission was not granted. Select every provider enabled in this profile.';
  await updateResult(false);
  loading.hidden = true;
  auditContent.hidden = false;
  runButton.disabled = false;
  live.textContent = `${found.access ? 'Local scan complete.' : 'Manual confirmation needed.'} Review the readiness result.`;
}

document.addEventListener('change', (event) => {
  if ((event.target as HTMLInputElement).matches('input[name="provider"], input[name="recovery"]')) void updateResult();
});
runButton.addEventListener('click', runAudit);
$('#rerun').addEventListener('click', runAudit);
$('#export').addEventListener('click', () => {
  if (!currentInput) return;
  const report = createTextReport(currentInput, analyzeAudit(currentInput), browserLabel());
  const url = URL.createObjectURL(new Blob([report], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `passkey-readiness-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  live.textContent = 'Local text report exported.';
});
$('#reset').addEventListener('click', async () => {
  if (!confirm('Clear the saved provider selections and recovery notes from this browser?')) return;
  await browser.storage.local.clear();
  currentInput = null;
  workspace.hidden = true;
  auditContent.hidden = true;
  runButton.focus();
  live.textContent = 'Saved check cleared.';
});

const offline = $('#offline');
function showNetworkState() { offline.hidden = navigator.onLine; }
addEventListener('online', showNetworkState);
addEventListener('offline', showNetworkState);
showNetworkState();
