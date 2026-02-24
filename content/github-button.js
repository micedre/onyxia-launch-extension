/* global buildSSPCloudURL, getRepositoryCloneURL */
(function() {
  console.log('[SSPCloud] loaded, path:', window.location.pathname);

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(tryInject, 200);
  });

  // GitHub uses Turbo (SPA navigation): the content script only runs on full
  // page loads, so we listen for turbo:load to handle in-page navigation too.
  document.addEventListener('turbo:load', () => {
    console.log('[SSPCloud] turbo:load, path:', window.location.pathname);
    const stale = document.getElementById('sspcloud-launch-btn');
    if (stale) stale.remove();
    // Re-arm the observer for new page content
    observer.observe(document.documentElement, { childList: true, subtree: true });
    tryInject();
  });

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // ─── helpers ────────────────────────────────────────────────────────────────

  function isRepoPage() {
    return /^\/[^\/]+\/[^\/]+\/?$/.test(window.location.pathname);
  }

  function tryInject() {
    if (!isRepoPage()) return;
    if (document.getElementById('sspcloud-launch-btn')) return;
    initButton();
  }

  // ─── button lifecycle ────────────────────────────────────────────────────────

  function initButton() {
    // Inject styles once per page
    if (!document.getElementById('sspcloud-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'sspcloud-styles';
      styleTag.textContent = getButtonStyles();
      document.head.appendChild(styleTag);
    }

    const buttonElement = document.createElement('button');
    buttonElement.innerHTML = getButtonHTML();
    buttonElement.id = 'sspcloud-launch-btn';
    buttonElement.className = 'sspcloud-github-button';
    buttonElement.addEventListener('click', handleClick);

    if (insertButtonIntoToolbar(buttonElement)) {
      console.log('[SSPCloud] Button injected successfully');
      observer.disconnect();
    }
    // If insertion failed the observer stays connected and retries on next DOM change
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
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        transition: background-color 0.2s ease;
        user-select: none;
        white-space: nowrap;
        border: none;
        -webkit-appearance: none;
        vertical-align: middle;
      }

      .sspcloud-github-button svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }

      .sspcloud-github-button:hover { background-color: #286799; }
      .sspcloud-github-button:active { background-color: #207dc7; }

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

      .sspcloud-toast.fade-out { opacity: 0; }
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

  // ─── toolbar insertion ───────────────────────────────────────────────────────

  function insertButtonIntoToolbar(buttonElement) {
    // ① Modern GitHub (2024): ul.pagehead-actions holds Watch/Fork/Star as <li>s.
    // Don't check width — the element has d-none d-md-inline so getBoundingClientRect
    // may return 0 before the browser completes layout, even though it is present.
    const actionsList = document.querySelector('ul.pagehead-actions');
    if (actionsList) {
      const li = document.createElement('li');
      li.appendChild(buttonElement);
      actionsList.appendChild(li);
      return true;
    }

    // ② Legacy GitHub toolbar selectors
    for (const selector of [
      '.react-jump-to-actions',
      'div.form-inline',
      '#repo-clone-provider',
      '#repo-links-bar'
    ]) {
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

    // ③ Fallback: Watch/Fork/Star button-group spans
    const existingButtons = document.querySelectorAll('span[id]:not([id^="actions-"])');
    for (const existingBtn of existingButtons) {
      if (existingBtn.children.length > 1 &&
          !existingBtn.querySelector('a[data-hovercard-type="repository"]')) {
        existingBtn.appendChild(buttonElement);
        return true;
      }
    }

    return false;
  }

  // ─── click handler ───────────────────────────────────────────────────────────

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
