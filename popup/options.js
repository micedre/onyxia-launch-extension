const DEFAULTS = {
  gitUrlTemplate: ''
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
