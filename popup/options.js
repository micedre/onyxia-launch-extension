const DEFAULT_FORGES = [
  { domain: 'github.com', type: 'github', urlTemplate: '' }
];

let gitlabCounter = 0;

function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  setTimeout(() => { status.textContent = ''; }, 2500);
}

function addGitLabRow(domain, urlTemplate) {
  const container = document.getElementById('gitlab-instances');
  const index = gitlabCounter++;

  const row = document.createElement('div');
  row.className = 'gitlab-instance';
  row.dataset.index = index;
  row.innerHTML = `
    <div class="instance-header">
      <span>GitLab Instance</span>
      <button type="button" class="btn-danger remove-gitlab-btn">Remove</button>
    </div>
    <div class="field">
      <label for="gitlab-domain-${index}">Domain</label>
      <div class="field-hint">e.g. git.lab.sspcloud.fr</div>
      <input type="text" id="gitlab-domain-${index}" class="gitlab-domain"
        placeholder="git.lab.sspcloud.fr" value="${escapeAttr(domain || '')}">
    </div>
    <div class="field">
      <label for="gitlab-template-${index}">URL Template</label>
      <div class="field-hint">Use {owner} and {repo} as placeholders.</div>
      <input type="text" id="gitlab-template-${index}" class="gitlab-template"
        placeholder="https://datalab.sspcloud.fr/launcher/ide/vscode-python?git.repository=«https://gitlab.example.com/{owner}/{repo}»"
        value="${escapeAttr(urlTemplate || '')}">
    </div>
  `;

  row.querySelector('.remove-gitlab-btn').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function loadSettings() {
  browser.storage.local.get({ forges: null, gitUrlTemplate: null }).then(data => {
    let forges = data.forges;

    // Migration: convert old gitUrlTemplate to new forges model
    if (!forges && data.gitUrlTemplate !== null) {
      forges = [
        { domain: 'github.com', type: 'github', urlTemplate: data.gitUrlTemplate || '' }
      ];
      // Persist migration and remove old key
      browser.storage.local.set({ forges }).then(() => {
        browser.storage.local.remove('gitUrlTemplate');
      });
    }

    if (!forges) {
      forges = DEFAULT_FORGES;
    }

    // Populate GitHub template
    const githubForge = forges.find(f => f.domain === 'github.com');
    document.getElementById('github-template').value = githubForge ? githubForge.urlTemplate : '';

    // Populate GitLab instances
    document.getElementById('gitlab-instances').innerHTML = '';
    gitlabCounter = 0;
    for (const forge of forges) {
      if (forge.type === 'gitlab') {
        addGitLabRow(forge.domain, forge.urlTemplate);
      }
    }
  });
}

async function requestHostPermission(domain) {
  try {
    const granted = await browser.permissions.request({
      origins: [`*://${domain}/*`]
    });
    return granted;
  } catch (err) {
    console.error('[SSPCloud] Permission request failed for', domain, err);
    return false;
  }
}

async function saveSettings(e) {
  e.preventDefault();

  const forges = [];

  // GitHub entry (always present)
  forges.push({
    domain: 'github.com',
    type: 'github',
    urlTemplate: document.getElementById('github-template').value.trim()
  });

  // GitLab instances
  const rows = document.querySelectorAll('.gitlab-instance');
  for (const row of rows) {
    const domain = row.querySelector('.gitlab-domain').value.trim();
    const urlTemplate = row.querySelector('.gitlab-template').value.trim();
    if (domain) {
      // Request host permission for the domain
      const granted = await requestHostPermission(domain);
      if (!granted) {
        showStatus(`Permission denied for ${domain}. Instance not saved.`);
        return;
      }
      forges.push({
        domain,
        type: 'gitlab',
        urlTemplate
      });
    }
  }

  await browser.storage.local.set({ forges });
  // Clean up old key if it exists
  await browser.storage.local.remove('gitUrlTemplate');
  showStatus('Settings saved.');
}

function resetSettings() {
  browser.storage.local.set({ forges: DEFAULT_FORGES }).then(() => {
    browser.storage.local.remove('gitUrlTemplate');
    loadSettings();
    showStatus('Settings reset to defaults.');
  });
}

document.getElementById('options-form').addEventListener('submit', saveSettings);
document.getElementById('reset-btn').addEventListener('click', resetSettings);
document.getElementById('add-gitlab-btn').addEventListener('click', () => addGitLabRow('', ''));

loadSettings();
