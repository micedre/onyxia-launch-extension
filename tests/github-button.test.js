'use strict';

const { buildSSPCloudURL, getRepositoryOwnerAndRepo } = require('../content/utils');

// ─── buildSSPCloudURL ───────────────────────────────────────────────────────

describe('buildSSPCloudURL', () => {
  test('falls back to hardcoded defaults when no template is provided', () => {
    const url = buildSSPCloudURL('org', 'repo');
    expect(url).toContain('git.repository=%C2%ABorg%2Frepo%C2%BB');
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

  test('replaces all occurrences of {owner} and {repo} in the template', () => {
    const template = 'https://example.com/?repo={repo}&name={repo}&owner={owner}&org={owner}';
    const url = buildSSPCloudURL('my-org', 'my-repo', {}, template);
    expect(url).toBe('https://example.com/?repo=my-repo&name=my-repo&owner=my-org&org=my-org');
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