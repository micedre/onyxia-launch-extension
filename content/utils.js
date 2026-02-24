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
 * Extract the repository clone URL from the current GitHub page.
 * @returns {string|null} Clone URL, or null if not found
 */
function getRepositoryCloneURL() {
  const selectors = [
    'form textarea[name="clone"]',
    'span.js-copy-repository-permalink',
    'a[title*="SSH"], a[title*="HTTPS"]',
    '.js-clone-url',
    'div.d-none a'
  ];

  for (const selector of selectors) {
    let element;
    try {
      element = document.querySelector(selector);
    } catch (e) {
      // Invalid CSS selector - skip
      continue;
    }
    if (element) {
      const url = (element.textContent?.trim() || element.href || '').trim();
      const cleanedUrl = url.replace(/\s+/g, ' ').trim();
      if (cleanedUrl && !cleanedUrl.includes('javascript:')) {
        console.log('[SSPCloud] Found URL at', selector, ':', cleanedUrl);
        return cleanedUrl;
      }
    }
  }

  // Fallback - construct from current page URL
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const httpsUrl = `https://github.com/${parts[0]}/${parts[1]}`;
    console.log('[SSPCloud] Using fallback URL:', httpsUrl);
    return httpsUrl;
  }

  return null;
}

// Export for Node.js/Jest testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildSSPCloudURL, getRepositoryCloneURL };
}
