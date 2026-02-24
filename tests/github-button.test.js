'use strict';

const { buildSSPCloudURL, getRepositoryCloneURL } = require('../content/utils');

// ─── buildSSPCloudURL ────────────────────────────────────────────────────────

describe('buildSSPCloudURL', () => {
  const BASE = 'https://datalab.sspcloud.fr/launcher/ide/vscode-python';

  function params(url) {
    return new URLSearchParams(url.split('?')[1]);
  }

  test('uses the correct base URL', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    expect(url.startsWith(BASE + '?')).toBe(true);
  });

  test('wraps git.repository in guillemets with full HTTPS URL', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    expect(params(url).get('git.repository')).toBe('«https://github.com/org/repo»');
  });

  test('strips .git suffix from HTTPS URL', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo.git');
    expect(params(url).get('git.repository')).toBe('«https://github.com/org/repo»');
  });

  test('converts SSH URL to full HTTPS and wraps in guillemets', () => {
    const url = buildSSPCloudURL('git@github.com:org/repo.git');
    expect(params(url).get('git.repository')).toBe('«https://github.com/org/repo»');
  });

  test('strips .git suffix from SSH URL', () => {
    const url = buildSSPCloudURL('git@github.com:my-org/my-repo.git');
    expect(params(url).get('git.repository')).toBe('«https://github.com/my-org/my-repo»');
  });

  test('wraps persistence.size in guillemets', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    expect(params(url).get('persistence.size')).toBe('«20Gi»');
  });

  test('wraps init.personalInit in guillemets', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    const value = params(url).get('init.personalInit');
    expect(value.startsWith('«')).toBe(true);
    expect(value.endsWith('»')).toBe(true);
  });

  test('wraps kubernetes.role in guillemets', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    expect(params(url).get('kubernetes.role')).toBe('«admin»');
  });

  test('wraps vault.secret in guillemets', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    expect(params(url).get('vault.secret')).toBe('«OPENAI-LLM»');
  });

  test('git.asCodeServerRoot has no guillemets', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    expect(params(url).get('git.asCodeServerRoot')).toBe('true');
  });

  test('does not double-encode the repository URL (%252F must not appear)', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo');
    expect(url).not.toContain('%252F');
  });

  test('handles repos with hyphens and dots in the name', () => {
    const url = buildSSPCloudURL('https://github.com/my-org/my.repo-name');
    expect(params(url).get('git.repository')).toBe('«https://github.com/my-org/my.repo-name»');
  });

  test('custom config overrides persistenceSize', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo', { persistenceSize: '50Gi' });
    expect(params(url).get('persistence.size')).toBe('«50Gi»');
  });

  test('custom config overrides vaultSecret', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo', { vaultSecret: 'MY-SECRET' });
    expect(params(url).get('vault.secret')).toBe('«MY-SECRET»');
  });

  test('custom config overrides baseUrl', () => {
    const customBase = 'https://my-sspcloud.example.com/launcher/ide/vscode-python';
    const url = buildSSPCloudURL('https://github.com/org/repo', { baseUrl: customBase });
    expect(url.startsWith(customBase + '?')).toBe(true);
  });

  test('custom config overrides version', () => {
    const url = buildSSPCloudURL('https://github.com/org/repo', { version: '3.0.0' });
    expect(params(url).get('version')).toBe('3.0.0');
  });
});

// ─── getRepositoryCloneURL ───────────────────────────────────────────────────

describe('getRepositoryCloneURL', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Set a default GitHub-style pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/owner/repo' },
      writable: true,
      configurable: true
    });
  });

  test('returns URL from .js-clone-url span textContent', () => {
    document.body.innerHTML =
      '<span class="js-clone-url">https://github.com/owner/repo.git</span>';
    expect(getRepositoryCloneURL()).toBe('https://github.com/owner/repo.git');
  });

  test('returns URL from form textarea[name="clone"] textContent', () => {
    document.body.innerHTML =
      '<form><textarea name="clone">https://github.com/owner/repo.git</textarea></form>';
    expect(getRepositoryCloneURL()).toBe('https://github.com/owner/repo.git');
  });

  test('returns URL from div.d-none anchor textContent', () => {
    // On GitHub the hidden clone-url anchors carry the URL as their text content
    document.body.innerHTML =
      '<div class="d-none"><a href="#">https://github.com/owner/repo.git</a></div>';
    expect(getRepositoryCloneURL()).toBe('https://github.com/owner/repo.git');
  });

  test('falls back to window.location when no selector matches', () => {
    document.body.innerHTML = '<div>nothing here</div>';
    expect(getRepositoryCloneURL()).toBe('https://github.com/owner/repo');
  });

  test('fallback uses only first two path segments', () => {
    window.location = { pathname: '/owner/repo/tree/main' };
    document.body.innerHTML = '';
    // The regex in github-button.js prevents reaching getRepositoryCloneURL on
    // deep paths, but the function itself should still use parts[0]/parts[1]
    expect(getRepositoryCloneURL()).toBe('https://github.com/owner/repo');
  });

  test('returns null when pathname has fewer than two segments', () => {
    window.location = { pathname: '/owner' };
    document.body.innerHTML = '';
    expect(getRepositoryCloneURL()).toBeNull();
  });

  test('returns null on root path', () => {
    window.location = { pathname: '/' };
    document.body.innerHTML = '';
    expect(getRepositoryCloneURL()).toBeNull();
  });

  test('ignores elements whose text is a javascript: URL', () => {
    document.body.innerHTML =
      '<span class="js-clone-url">javascript:void(0)</span>';
    // Should skip and fall back to window.location
    expect(getRepositoryCloneURL()).toBe('https://github.com/owner/repo');
  });
});
