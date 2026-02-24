/* global buildSSPCloudURL, getRepositoryCloneURL */
(function() {
  // Exit early if not on a two-segment path (owner/repo pattern)
  const currentPath = window.location.pathname;
  const repoPathRegex = /^\/[^\/]+\/[^\/]+\/?$/;
  if (!repoPathRegex.test(currentPath)) {
    return;
  }

  // Debounced MutationObserver — disconnects once button is placed
  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!document.getElementById('sspcloud-launch-btn') && isToolbarAvailable()) {
        initButton();
        observer.disconnect();
      }
    }, 200);
  });

  // Handle DOM loading states
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButton);
  } else {
    initButton();
  }

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  function initButton() {
    if (document.getElementById('sspcloud-launch-btn')) {
      return;
    }

    // Secondary check: verify this is actually a repository page, not a user
    // settings page or other GitHub path that happens to match the regex
    const isRepoPage = document.querySelector(
      '#repository-container-header, .js-clone-url, [data-repository-hovercards-enabled]'
    );
    if (!isRepoPage) {
      return;
    }

    const styleTag = document.createElement('style');
    styleTag.textContent = getButtonStyles();
    document.head.appendChild(styleTag);

    const buttonElement = document.createElement('button');
    buttonElement.innerHTML = getButtonHTML();
    buttonElement.id = 'sspcloud-launch-btn';
    buttonElement.className = 'sspcloud-github-button';
    buttonElement.addEventListener('click', handleClick);

    if (insertButtonIntoToolbar(buttonElement)) {
      console.log('[SSPCloud] Button injected successfully');
      observer.disconnect();
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

      .sspcloud-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #c0392b;
        color: white;
        padding: 10px 16px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 14px;
        z-index: 99999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        opacity: 1;
        transition: opacity 0.4s ease;
      }

      .sspcloud-toast.fade-out {
        opacity: 0;
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

    for (const selector of toolbarSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (rect.width > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
          element.appendChild(buttonElement);
          return true;
        }
      }
    }

    // Alternative: find existing Watch/Fork/Star button groups
    const existingButtons = document.querySelectorAll('span[id]:not([id^="actions-"])');
    for (const existingBtn of existingButtons) {
      if (existingBtn.children.length > 1 && !existingBtn.querySelector('a[data-hovercard-type="repository"]')) {
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

  const DEFAULT_CONFIG = {
    baseUrl: 'https://datalab.sspcloud.fr/launcher/ide/vscode-python',
    version: '2.5.0',
    s3: 'region-79669f20',
    personalInit:
      'https://raw.githubusercontent.com/micedre/sspcloud-init-scripts/refs/heads/main/vscode/init.sh',
    vaultSecret: 'OPENAI-LLM',
    persistenceSize: '20Gi'
  };

  function handleClick() {
    const cloneURL = getRepositoryCloneURL();
    if (!cloneURL) {
      console.error('[SSPCloud] Could not determine repository URL');
      showToast('Could not detect repository URL');
      return;
    }

    browser.storage.local.get(DEFAULT_CONFIG).then(config => {
      const targetURL = buildSSPCloudURL(cloneURL, config);
      const newWindow = window.open(targetURL, '_blank');
      if (!newWindow) {
        showToast('Popup was blocked. Please allow popups for this site.');
      }
    }).catch(() => {
      // Fallback if storage API is unavailable
      const targetURL = buildSSPCloudURL(cloneURL, DEFAULT_CONFIG);
      window.open(targetURL, '_blank');
    });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'sspcloud-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
})();
