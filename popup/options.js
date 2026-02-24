const DEFAULTS = {
  baseUrl: 'https://datalab.sspcloud.fr/launcher/ide/vscode-python',
  version: '2.5.0',
  s3: 'region-79669f20',
  personalInit:
    'https://raw.githubusercontent.com/micedre/sspcloud-init-scripts/refs/heads/main/vscode/init.sh',
  vaultSecret: 'OPENAI-LLM',
  persistenceSize: '20Gi'
};

function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  setTimeout(() => { status.textContent = ''; }, 2500);
}

function loadSettings() {
  browser.storage.local.get(DEFAULTS).then(settings => {
    for (const key of Object.keys(DEFAULTS)) {
      const input = document.getElementById(key);
      if (input) {
        input.value = settings[key] || DEFAULTS[key];
      }
    }
  });
}

function saveSettings(e) {
  e.preventDefault();
  const settings = {};
  for (const key of Object.keys(DEFAULTS)) {
    const input = document.getElementById(key);
    settings[key] = (input && input.value.trim()) || DEFAULTS[key];
  }
  browser.storage.local.set(settings).then(() => {
    showStatus('Settings saved.');
  });
}

function resetSettings() {
  browser.storage.local.set(DEFAULTS).then(() => {
    loadSettings();
    showStatus('Settings reset to defaults.');
  });
}

document.getElementById('options-form').addEventListener('submit', saveSettings);
document.getElementById('reset-btn').addEventListener('click', resetSettings);

loadSettings();
