/* global buildSSPCloudURL */
(function() {
  console.log('[SSPCloud] GitLab content script loaded, path:', window.location.pathname);

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(tryInject, 200);
  });

  // GitLab uses Turbolinks for SPA navigation
  document.addEventListener('turbolinks:load', () => {
    console.log('[SSPCloud] turbolinks:load, path:', window.location.pathname);
    const stale = document.getElementById('sspcloud-launch-btn');
    if (stale) stale.remove();
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

  function isProjectPage() {
    // GitLab project pages have body[data-page] starting with "projects:"
    const dataPage = document.body && document.body.getAttribute('data-page');
    if (dataPage && dataPage.startsWith('projects:')) return true;
    // Fallback: check for project-page class
    if (document.body && document.body.classList.contains('project-page')) return true;
    return false;
  }

  function isProjectRootPage() {
    if (!isProjectPage()) return false;
    // Check data-page for the show action (project root)
    const dataPage = document.body.getAttribute('data-page');
    if (dataPage === 'projects:show') return true;
    // Also match tree pages (browsing the repo)
    if (dataPage && dataPage.startsWith('projects:tree:')) return true;
    // Fallback: accept if we can extract owner/repo from URL
    return getGitLabOwnerAndRepo() !== null;
  }

  function getGitLabOwnerAndRepo() {
    // GitLab uses nested groups — e.g. /ssplab/experimentation-bdf/copain
    // The project path is embedded in data attributes or can be parsed from URL
    // Try data attribute first
    const projectEl = document.querySelector('[data-project-full-path]');
    if (projectEl) {
      const fullPath = projectEl.getAttribute('data-project-full-path');
      const segments = fullPath.split('/').filter(Boolean);
      if (segments.length >= 2) {
        const repo = segments[segments.length - 1];
        const owner = segments.slice(0, -1).join('/');
        return { owner, repo };
      }
    }

    // Fallback: parse from URL pathname
    // We need to figure out where the project path ends
    // GitLab project URLs: /<namespace>/<project> or /<group>/<subgroup>/<project>
    // Known non-project path suffixes to strip
    const pathname = window.location.pathname;
    const suffixes = [
      /\/-\/.*$/,        // /-/ marks GitLab internal routes
      /\/tree\/.*$/,     // /tree/branch
      /\/blob\/.*$/,     // /blob/branch/file
      /\/commits\/.*$/,  // /commits/branch
      /\/merge_requests.*$/,
      /\/issues.*$/,
      /\/pipelines.*$/,
      /\/settings.*$/
    ];

    let projectPath = pathname;
    for (const suffix of suffixes) {
      projectPath = projectPath.replace(suffix, '');
    }

    const segments = projectPath.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const repo = segments[segments.length - 1];
      const owner = segments.slice(0, -1).join('/');
      return { owner, repo };
    }

    return null;
  }

  function tryInject() {
    if (!isProjectRootPage()) return;
    if (document.getElementById('sspcloud-launch-btn')) return;
    initButton();
  }

  // ─── button lifecycle ────────────────────────────────────────────────────────

  function initButton() {
    if (!document.getElementById('sspcloud-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'sspcloud-styles';
      styleTag.textContent = getButtonStyles();
      document.head.appendChild(styleTag);
    }

    const buttonElement = document.createElement('button');
    buttonElement.innerHTML = getButtonHTML();
    buttonElement.id = 'sspcloud-launch-btn';
    buttonElement.className = 'sspcloud-launch-button';
    buttonElement.addEventListener('click', handleClick);

    if (insertButtonIntoToolbar(buttonElement)) {
      console.log('[SSPCloud] GitLab button injected successfully');
      observer.disconnect();
    }
  }

  function getButtonStyles() {
    return `
      .sspcloud-launch-button {
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
        margin-left: 8px;
      }

      .sspcloud-launch-button svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }

      .sspcloud-launch-button:hover { background-color: #286799; }
      .sspcloud-launch-button:active { background-color: #207dc7; }

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
    // Try various GitLab UI selectors for button placement
    const selectors = [
      '.project-repo-buttons',      // Older GitLab
      '.count-buttons',              // GitLab project action buttons
      '.project-clone-holder',       // Near clone button
      '.tree-controls',              // File tree controls
      '.nav-controls',               // Navigation controls area
      '.repo-buttons',               // Repository buttons area
      '.gl-display-flex.gl-gap-3'    // Modern GitLab flex containers
    ];

    for (const selector of selectors) {
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

    // Fallback: look for the fork/star buttons area
    const forkBtn = document.querySelector('[data-testid="fork-button"]') ||
                    document.querySelector('a[href*="/forks"]');
    if (forkBtn && forkBtn.parentElement) {
      forkBtn.parentElement.appendChild(buttonElement);
      return true;
    }

    return false;
  }

  // ─── click handler ───────────────────────────────────────────────────────────

  function handleClick() {
    const hostname = window.location.hostname;

    browser.storage.local.get({ forges: [] }).then(({ forges }) => {
      const forge = forges.find(f => f.domain === hostname);
      const urlTemplate = forge ? forge.urlTemplate : '';

      const ownerRepo = getGitLabOwnerAndRepo();
      if (!ownerRepo) {
        console.error('[SSPCloud] Could not determine owner/repo');
        showToast('Could not detect repository');
        return;
      }

      const { owner, repo } = ownerRepo;
      const targetURL = buildSSPCloudURL(owner, repo, {}, urlTemplate);

      const newWindow = window.open(targetURL, '_blank');
      if (!newWindow) {
        showToast('Popup was blocked. Please allow popups for this site.');
      }
    }).catch(err => {
      console.error('[SSPCloud] Error loading forge config:', err);
      showToast('Error loading settings');
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
