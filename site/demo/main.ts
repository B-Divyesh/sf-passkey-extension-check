import { analyzeAudit, type AuditInput } from '../../src/domain';

const demoKey = 'demo:passkey-extension-check:sample-v1';
const sample: AuditInput = {
  inventoryAccess: true,
  providers: [
    { key: '1password', name: '1Password', enabled: true, source: 'detected', managed: true },
    { key: 'bitwarden', name: 'Bitwarden', enabled: true, source: 'confirmed' },
  ],
  capabilities: { platformAuthenticator: true, conditionalMediation: true, clientCapabilities: true, secureContext: true },
  recovery: { alternateDevice: true, recoveryCode: false, passwordFallback: false, securityKey: false },
};

function renderSample(message = '') {
  const saved = localStorage.getItem(demoKey);
  const audit = saved ? JSON.parse(saved) as AuditInput : sample;
  if (!saved) localStorage.setItem(demoKey, JSON.stringify(sample));
  const result = analyzeAudit(audit);
  document.querySelector<HTMLOListElement>('#demo-checklist')!.replaceChildren(
    ...result.checklist.map((item) => {
      const entry = document.createElement('li');
      entry.textContent = item;
      return entry;
    }),
  );
  document.querySelector<HTMLElement>('#result-title')!.textContent = result.headline;
  document.querySelector<HTMLElement>('#demo-status')!.textContent = message;
}

document.querySelector<HTMLButtonElement>('#reset-demo')!.addEventListener('click', () => {
  localStorage.removeItem(demoKey);
  renderSample('Sample restored. Your extension data was not changed.');
});

renderSample();
