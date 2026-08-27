import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Passkey Extension Check',
    description: 'Check passkey-provider coexistence and prepare a recovery route before a critical login.',
    version: '1.0.0',
    permissions: ['storage'],
    optional_permissions: ['management'],
    action: {
      default_title: 'Open Passkey Extension Check',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (manifest.options_ui && 'open_in_tab' in manifest.options_ui) manifest.options_ui.open_in_tab = true;
    },
  },
});
