/* global module */

/**
 * Extract owner and repo from the current GitHub page URL.
 * @returns {Object|null} {owner, repo} or null if not on a repo page
 */
function getRepositoryOwnerAndRepo() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repo: parts[1]
    };
  }
  return null;
}

/**
 * Normalize a repository URL (strip .git suffix, convert SSH to HTTPS)
 * @param {string} repoUrl - Repository URL (could be HTTPS or SSH)
 * @returns {string} Normalized HTTPS URL without .git suffix
 */
function normalizeRepoUrl(repoUrl) {
  // Normalize to full HTTPS URL, strip .git suffix
  let normalized = repoUrl.replace(/\.git$/, '');

  if (normalized.startsWith('git@github.com:')) {
    // SSH → HTTPS: git@github.com:org/repo → https://github.com/org/repo
    normalized = 'https://github.com/' + normalized.replace(/^git@github\.com:/, '');
  }

  return normalized;
}

/**
 * Build the SSPCloud launcher URL for a given repository.
 * @param {string} owner - GitHub repository owner
 * @param {string} repo - GitHub repository name
 * @param {Object} [config] - Optional configuration overrides
 * @param {string} [urlTemplate] - Optional complete SSPCloud URL template with {owner} and {repo} placeholders
 * @returns {string} SSPCloud launcher URL
 */
function buildSSPCloudURL(owner, repo, config, urlTemplate) {
  const cfg = config || {};

  // If a URL template is provided with placeholders, use it
  if (urlTemplate && urlTemplate.includes('{owner}') && urlTemplate.includes('{repo}')) {
    // Substitute placeholders in the URL template
    const template = urlTemplate
      .replace('{owner}', owner)
      .replace('{repo}', repo);
    console.log('[SSPCloud] Using URL template:', template);
    return template;
  }

  // Fallback: Build URL using current logic with owner/repo
  const ownerAndRepo = `${owner}/${repo}`;
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
    'git.repository': `\u00AB${ownerAndRepo}\u00BB`,
    'git.asCodeServerRoot': 'true'
  });

  return `${baseUrl}?${params.toString()}`;
}

// Export for Node.js/Jest testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getRepositoryOwnerAndRepo, buildSSPCloudURL };
}
