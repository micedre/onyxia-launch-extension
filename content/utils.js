/* global module */

/**
 * Build the SSPCloud launcher URL for a given repository clone URL.
 * @param {string} cloneURL - HTTPS or SSH clone URL of the repository
 * @param {Object} [config] - Optional configuration overrides
 * @returns {string} SSPCloud launcher URL
 */
function buildSSPCloudURL(cloneURL, config) {
  const cfg = config || {};

  // Normalize to full HTTPS URL, strip .git suffix
  let repoUrl = cloneURL.replace(/\.git$/, '');

  if (repoUrl.startsWith('git@github.com:')) {
    // SSH → HTTPS: git@github.com:org/repo → https://github.com/org/repo
    repoUrl = 'https://github.com/' + repoUrl.replace(/^git@github\.com:/, '');
  }
  // HTTPS URLs are already in correct format

  const baseUrl = cfg.baseUrl || 'https://datalab.sspcloud.fr/launcher/ide/vscode-python';
  const version = cfg.version || '2.5.0';
  const s3 = cfg.s3 || 'region-79669f20';
  const personalInit = cfg.personalInit ||
    'https://raw.githubusercontent.com/micedre/sspcloud-init-scripts/refs/heads/main/vscode/init.sh';
  const vaultSecret = cfg.vaultSecret || 'OPENAI-LLM';
  const persistenceSize = cfg.persistenceSize || '20Gi';

  const params = new URLSearchParams({
    name: 'vscode-generic',
    version,
    s3,
    'persistence.size': `\u00AB${persistenceSize}\u00BB`,
    'init.personalInit': `\u00AB${personalInit}\u00BB`,
    'kubernetes.role': '\u00ABadmin\u00BB',
    'vault.secret': `\u00AB${vaultSecret}\u00BB`,
    'git.repository': `\u00AB${repoUrl}\u00BB`,
    'git.asCodeServerRoot': 'true'
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Extract the repository HTTPS URL from the current GitHub page URL.
 * window.location is the most reliable source — DOM-based clone selectors
 * are stale on modern GitHub and can match unrelated elements (e.g. nav
 * anchors whose textContent is "Home").
 * @returns {string|null} HTTPS repository URL, or null if not on a repo page
 */
function getRepositoryCloneURL() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const url = `https://github.com/${parts[0]}/${parts[1]}`;
    console.log('[SSPCloud] Repository URL:', url);
    return url;
  }
  return null;
}

// Export for Node.js/Jest testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildSSPCloudURL, getRepositoryCloneURL };
}
