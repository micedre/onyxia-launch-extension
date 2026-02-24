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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="33 19 375 254" fill="currentColor">
        <path d="M232.743 88.7774L266.693 122.898C277.502 133.761 295.018 133.761 305.812 122.898L339.762 88.7774L286.253 35L232.743 88.7774Z"/>
        <path d="M106.253 88.7774L140.204 122.898C151.012 133.761 168.528 133.761 179.322 122.898L213.273 88.7774L159.763 35L106.253 88.7774Z"/>
        <path d="M43 152.331L76.9508 186.452C87.7594 197.314 105.275 197.314 116.069 186.452L150.02 152.331L96.5099 98.5537L43 152.331Z"/>
        <path d="M169.49 152.331L203.441 186.452C214.25 197.314 231.765 197.314 242.559 186.452L276.51 152.331L223 98.5537L169.49 152.331Z"/>
        <path d="M349.49 98.5537L295.98 152.331L329.931 186.452C340.74 197.314 358.256 197.314 369.049 186.452L403 152.331L349.49 98.5537Z"/>
        <path d="M106.253 215.9L140.204 250.02C151.012 260.883 168.528 260.883 179.322 250.02L213.273 215.9L159.763 162.123L106.253 215.9Z"/>
        <path d="M232.743 215.9L266.693 250.02C277.502 260.883 295.018 260.883 305.812 250.02L339.762 215.9L286.253 162.123L232.743 215.9Z"/>
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
