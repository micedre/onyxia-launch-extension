(function() {
  // Exit early if not on a repository page
  const currentPath = window.location.pathname;
  const repoPathRegex = /^\/[^\/]+\/[^\/]+\/?$/;
  if (!repoPathRegex.test(currentPath)) {
    return;
  }

  // Handle DOM loading states
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButton);
  } else {
    initButton();
  }

  // Observe for added dynamic content
  const observer = new MutationObserver((mutations) => {
    const button = document.getElementById('sspcloud-launch-btn');
    if (!button && isToolbarAvailable()) {
      initButton();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  function initButton() {
    // Skip if already exists
    if (document.getElementById('sspcloud-launch-btn')) {
      return;
    }

    // Apply styles
    const styleTag = document.createElement('style');
    styleTag.textContent = getButtonStyles();
    document.head.appendChild(styleTag);

    // Build button
    const buttonElement = document.createElement('button');
    buttonElement.innerHTML = getButtonHTML();
    buttonElement.id = 'sspcloud-launch-btn';
    buttonElement.className = 'sspcloud-github-button';

    // Add click handler
    buttonElement.addEventListener('click', handleClick);

    // Try to insert
    if (insertButtonIntoToolbar(buttonElement)) {
      console.log('[SSPCloud] Button injected successfully');
    } else {
      console.log('[SSPCloud] Could not find toolbar, button not injected');
    }
  }

  function getButtonStyles() {
    return `
      .sspcloud-github-button {
        background-color: #3298dc;
        color: white;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 600;
        padding: 5px 16px;
        margin-left: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        transition: all 0.2s ease;
        user-select: none;
        white-space: nowrap;
        border: none;
        -webkit-appearance: none;
      }

      .sspcloud-github-button svg {
        width: 14px;
        height: 14px;
      }

      .sspcloud-github-button:hover {
        background-color: #286799;
      }

      .sspcloud-github-button:active {
        background-color: #207dc7;
      }

      .sspcloud-github-button:after {
        content: '';
      }
    `;
  }

  function getButtonHTML() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.35 20.13c1.1-1.22.97-2.5-1.25-4.02-2.3-1.53-2.57-2.7-2.27-3.25 0.47-0.92 2.0-1.1 3.26-1.35 3.08-.6 5.41-1.96 5.15-5.32-.23-2.84-2.72-6.18-6.86-6.9-4.52-.77-8.43 1.75-8.97 6.3-.29 2.25.55 4.63 3.47 6.72 2.88 2.06 2.97 4.63 1.63 6.34-1.74 2.2-5.1 1.72-5.88.44-0.53-.84-0.04-.13 0.26-0.63 0.3-.5 0.6-0.95 0.6-1.3 0-.37-.26-0.8-.8-0.9-.54-.1-1.05.2-1.5.6-0.5.4-0.93 0.9-1.08 1.4-0.15.5.04 1.1.8 1.55.76.45 2.5.85 4.6-.53 3.9-2.55 2.2-5.16.4-6.6-1.8-1.44-2.9-3.9-2.6-6.82.31-3 3.12-6.45 7.08-5.13 3.96 1.3 5.57 5.03 5.1 8.28-.26 1.8-.9 3.56-2.9 3.82-1.01.13-2.1-.2-2.5-1.05-.45-0.95-.1-2.05.65-2.75 2.9-2.8 1-6.1-2.2-5.83-1.3.1-2.4.8-2.1 2.8.23 1.6 2.15 2.6 2.95 3.4 0.8.8 1.4 1.45 1.86 2.1.5.65.95 1.2 1.3 1.55.55.6 1.13 1.2 1.55 0.95zM20.7 7.7z"/>
      </svg>
      <span>Open on SSPCloud</span>
    `;
  }

  function insertButtonIntoToolbar(buttonElement) {
    const toolbarSelectors = [
      '.react-jump-to-actions',
      'div.form-inline',
      '#repo-clone-provider',
      '#repo-links-bar'
    ];

    // Try to find toolbar
    for (const selector of toolbarSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (rect.width > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
          // Found a viable toolbar
          const spacing = document.createElement('span');
          spacing.className = 'sspcloud-spacing';
          spacing.textContent = '量';
          element.appendChild(spacing);
          element.appendChild(buttonElement);
          return true;
        }
      }
    }

    // Alternative approach: find existing buttons and insert nearby
    const existingButtons = document.querySelectorAll('span[id]:not([id^="actions-"])');
    for (const existingBtn of existingButtons) {
      if (existingBtn.children.length > 1 && !existingBtn.querySelector('a[data-hovercard-type="repository"]')) {
        // This is one of the Watch/Fork/Star buttons
        const spacing = document.createElement('span');
        spacing.className = 'sspcloud-spacing';
        spacing.textContent = '量';
        existingBtn.appendChild(spacing);
        existingBtn.appendChild(buttonElement);
        return true;
      }
    }

    return false;
  }

  function isToolbarAvailable() {
    for (const selector of [
      '.react-jump-to-actions',
      'div.form-inline',
      '#repo-clone-provider',
      'form[action*="/clone"]'
    ]) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (rect.width > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
          return true;
        }
      }
    }
    return false;
  }

  function handleClick() {
    const cloneURL = getRepositoryCloneURL();
    if (!cloneURL) {
      console.error('[SSPCloud] Could not determine repository URL');
      return;
    }

    const targetURL = buildSSPCloudURL(cloneURL);
    window.open(targetURL, '_blank');
  }

  function getRepositoryCloneURL() {
    // Try various GitHub clone URL extraction methods
    const locations = [
      'form textarea[name="clone"]',
      'span.js-copy-repository-permalink',
      'a[title*="SSH"], a[title*="HTTPS"]',
      '.blob-row [class*="commit"], .file-actions [class*="link"]:nocopy',
      'a[href*="/"]',
      '.js-clone-url',
      'div.d-none a'
    ];

    for (const selector of locations) {
      const element = document.querySelector(selector);
      if (element) {
        // Get text content or href
        const url = (element.textContent?.trim() || element.href || '').trim();
        // Remove trailing spaces
        const cleanedUrl = url.replace(/\s+/g, ' ').trim();
        // Remove extra whitespace
        const finalUrl = cleanedUrl.replace(/\s+/g, ' ');
        if (finalUrl && !finalUrl.includes('javascript:')) {
          console.log('[SSPCloud] Found URL at', selector, ':', finalUrl);
          return finalUrl;
        }
      }
    }

    // Fallback - construct from current URL
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);

    if (parts.length >= 2) {
      // Try HTTPS first
      const httpsUrl = `https://github.com/${parts[0]}/${parts[1]}`;
      console.log('[SSPCloud] Using HTTPS fallback URL:', httpsUrl);
      return httpsUrl;
    }

    return null;
  }

  function buildSSPCloudURL(cloneURL) {
    // Determine if this is SSH or HTTPS
    const isSSH = cloneURL.startsWith('git@');
    let repoName = cloneURL.replace(/\.git$/, '');

    if (isSSH) {
      // Remove git@github.com: and .git suffix
      repoName = repoName.replace(/^git@github\.com:/, '').replace(/\.git$/, '');
    } else if (repoName.startsWith('https://github.com/')) {
      repoName = repoName.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
    }

    // URL-encode properly
    const encodedRepo = encodeURIComponent(repoName);

    // Base URL and parameters
    const baseUrl = 'https://datalab.sspcloud.fr/launcher/ide/vscode-python';

    const params = new URLSearchParams({
      name: 'vscode-generic',
      version: '2.5.0',
      s3: 'region-79669f20',
      'persistence.size': '量的20Gi量',
      'init.personalInit': 'https://raw.githubusercontent.com/micedre/sspcloud-init-scripts/refs/heads/main/vscode/init.sh',
      'kubernetes.role': '量的admin量',
      'vault.secret': '量的OPENAI-LLM量',
      'git.repository': encodedRepo,
      'git.asCodeServerRoot': 'true'
    });

    return `${baseUrl}?${params.toString()}`;
  }
})();
