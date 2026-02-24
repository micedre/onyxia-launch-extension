'use strict';

const { buildSSPCloudURL, getRepositoryOwnerAndRepo } = require('../content/utils');

// ─── buildSSPCloudURL ───────────────────────────────────────────────────────

describe('buildSSPCloudURL', () => {
  const BASE = 'https://datalab.sspcloud.fr/launcher/ide/vscode-python';

  function params(url) {
    return new URLSearchParams(url.split('?')[1]);
  }

  test('uses the correct base URL', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(url.startsWith(BASE + '?')).toBe(true);
  });

  test('wraps git.repository in guillemets with full HTTPS URL', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(params(url).get('git.repository')).toBe('«org/repo»');
  });

  test('wraps persistence.size in guillemets', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(params(url).get('persistence.size')).toBe('«20Gi»');
  });

  test('wraps init.personalInit in guillemets', () => {
    const url = buildSSPCloudURL('org', 'repo');
    const value = params(url).get('init.personalInit');
    expect(value.startsWith('«')).toBe(true);
    expect(value.endsWith('»')).toBe(true);
  });

  test('wraps kubernetes.role in guillemets', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(params(url).get('kubernetes.role')).toBe('«admin»');
  });

  test('wraps vault.secret in guillemets', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(params(url).get('vault.secret')).toBe('«OPENAI-LLM»');
  });

  test('git.asCodeServerRoot has no guillemets', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(params(url).get('git.asCodeServerRoot')).toBe('true');
  });

  test('does not double-encode the repository URL (%252F must not appear)', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(url).not.toContain('%252F');
  });

  test('handles repos with hyphens and dots in the name', () => {
    const url = buildSSPCloudURL('my-org', 'my.repo-name');
    expect(params(url).get('git.repository')).toBe('«my-org/my.repo-name»');
  });

  test('custom config overrides persistenceSize', () => {
    const url = buildSSPCloudURL('org', 'repo', { persistenceSize: '50Gi' });
    expect(params(url).get('persistence.size')).toBe('«50Gi»');
  });

  test('custom config overrides vaultSecret', () => {
    const url = buildSSPCloudURL('org', 'repo', { vaultSecret: 'MY-SECRET' });
    expect(params(url).get('vault.secret')).toBe('«MY-SECRET»');
  });

  test('custom config overrides baseUrl', () => {
    const customBase = 'https://my-sspcloud.example.com/launcher/ide/vscode-python';
    const url = buildSSPCloudURL('org', 'repo', { baseUrl: customBase });
    expect(url.startsWith(customBase + '?')).toBe(true);
  });

  test('custom config overrides version', () => {
    const url = buildSSPCloudURL('org', 'repo', { version: '3.0.0' });
    expect(params(url).get('version')).toBe('3.0.0');
  });
});

// ─── buildSSPCloudURL with URL template ───────────────────────────────

describe('buildSSPCloudURL with URL template', () => {
  function params(url) {
    return new URLSearchParams(url.split('?')[1]);
  }

  test('uses URL template when provided with {owner} and {repo} placeholders', () => {
    const template = 'https://datalab.sspcloud.fr/launcher/ide/vscode-python?git.repository=«{owner}/{repo}»&version={version}&s3={s3}';
    const url = buildSSPCloudURL('my-org', 'my-repo', {}, template);
    expect(url).toBe('https://datalab.sspcloud.fr/launcher/ide/vscode-python?git.repository=«my-org/my-repo»&version={version}&s3={s3}');
  });

  test('uses URL template with custom parameters', () => {
    const template = 'https://my-sspcloud.com/launcher/ide/vscode-python?git.repository=«{owner}/{repo}»&version={version}&persistence.size=«50Gi»&s3={s3}';
    const url = buildSSPCloudURL('my-org', 'my-repo', {}, template);
    expect(url).toBe('https://my-sspcloud.com/launcher/ide/vscode-python?git.repository=«my-org/my-repo»&version={version}&persistence.size=«50Gi»&s3={s3}');
  });

  test('falls back to parameter-based URL when template is empty', () => {
    const url = buildSSPCloudURL('my-org', 'my-repo', {});
    expect(url).toContain('git.repository=%C2%ABmy-org%2Fmy-repo%C2%BB');
  });

  test('falls back to parameter-based URL when template has no {owner} placeholder', () => {
    const template = 'https://datalab.sspcloud.fr/launcher/ide/vscode-python?version=2.5.0';
    const url = buildSSPCloudURL('my-org', 'my-repo', {}, template);
    expect(url).toContain('git.repository=%C2%ABmy-org%2Fmy-repo%C2%BB');
  });

  test('falls back to parameter-based URL when template has no {repo} placeholder', () => {
    const template = 'https://datalab.sspcloud.fr/launcher/ide/vscode-python?owner=my-org';
    const url = buildSSPCloudURL('my-org', 'my-repo', {}, template);
    expect(url).toContain('git.repository=%C2%ABmy-org%2Fmy-repo%C2%BB');
  });

  test('substitutes both {owner} and {repo} placeholders', () => {
    const template = 'https://api.github.com/repos/{owner}/{repo}';
    const url = buildSSPCloudURL('octocat', 'Hello-World', {}, template);
    expect(url).toBe('https://api.github.com/repos/octocat/Hello-World');
  });
});

// ─── getRepositoryOwnerAndRepo ─────────────────────────────────────────────

describe('getRepositoryOwnerAndRepo', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/owner/repo' },
      writable: true,
      configurable: true
    });
  });

  test('returns owner and repo from window.location pathname', () => {
    expect(getRepositoryOwnerAndRepo()).toEqual({ owner: 'owner', repo: 'repo' });
  });

  test('uses only the first two path segments (ignores /tree/main etc.)', () => {
    window.location = { pathname: '/owner/repo/tree/main' };
    expect(getRepositoryOwnerAndRepo()).toEqual({ owner: 'owner', repo: 'repo' });
  });

  test('returns null when pathname has fewer than two segments', () => {
    window.location = { pathname: '/owner' };
    expect(getRepositoryOwnerAndRepo()).toBeNull();
  });

  test('returns null on root path', () => {
    window.location = { pathname: '/' };
    expect(getRepositoryOwnerAndRepo()).toBeNull();
  });

  test('handles org names and repo names with hyphens', () => {
    window.location = { pathname: '/my-org/my-repo' };
    expect(getRepositoryOwnerAndRepo()).toEqual({ owner: 'my-org', repo: 'my-repo' });
  });
});