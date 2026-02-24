# Implementation Plan: Firefox GitHub Extension for SSPCloud

## Overview
This plan details the creation of a Firefox web extension that adds an "Open on SSPCloud" button to GitHub repository pages, positioned alongside the existing Watch/Fork/Star buttons.

## Project Structure
```
onyxia-launch-extension/
├── manifest.json              # Extension manifest
├── icons/
│   └── sspcloud-button-128.png   # Extension icon (128x128 recommended)
├── content/
│   └── github-button.js       # Content script for targeting GitHub
├── background.js              # Background script (optional, for permissions)
└── README.md                  # Build and installation instructions
```

## Detailed Component Specifications

### 1. manifest.json

**Purpose**: Extension configuration compatible with Firefox WebExtensions API

**Specifications**:
```json
{
  "manifest_version": 2,
  "name": "SSPCloud GitHub Launcher",
  "version": "1.0.0",
  "description": "Adds a button to GitHub repositories to open them in SSPCloud",
  "icons": {
    "128": "icons/sspcloud-button-128.png"
  },
  "content_scripts": [
    {
      "matches": ["*://github.com/*"],
      "js": ["content/github-button.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "*://github.com/*",
    "storage"  // If storing preferences
  ],
  "browser_action": {
    "default_icon": "icons/sspcloud-button-128.png",
    "default_title": "SSPCloud Settings"
  }
}
```

**Notes on manifest_version**:
- Using `manifest_version: 2` is recommended for stability
- Allows current extension building to work immediately without Firefox v3 migrations needed
- Can be upgraded to v3 in future when additional privileges are needed

### 2. Icons

**File**: `icons/sspcloud-button-128.png`
- **Dimensions**: 128x128 pixels
- **Style**: Modern, flat design
- **Suggested colors**: 
  - Primary: #3298dc (WordPress blue - familiar for cloud tools)
  - White icon/text if background
  - 32px favicon at minimum for smaller versions
- **Format**: PNG with transparency

**Icon Generation Tools**:
- Use online tools like atomic-alarm-clock, design avatars, etc.
- Create SVG 128x128 then convert to PNG
- Figma or Inkscape can be used locally

### 3. Content Script: github-button.js

**Purpose**: Dynamically inject and position the SSPCloud button on GitHub repository pages

**Technical Approach**:

#### 3.1 Selector Strategy

GitHub frequently updates their DOM structure. Multiple fallback selectors needed:

```javascript
// Priority array of selectors for finding the toolbar
const toolbarSelectors = [
  '.react-jump-to-actions',           // Token assigned selector - most reliable
  'div',                              // Fallback to finding span buttons and working around
  '',                                 // Default - will use extracted button as base
  'span',                             // Alternative - find within span hierarchy
  'form',                             // Alternative direct button location
];

// Alternative: extract individual buttons known to exist
const existingButtons = document.querySelectorAll('span[js-compensated-for-japanese]');
let toolbar = document.querySelector('form') || document.querySelector('ul');
```

**Selector Rationale**:
- Accessible selector needed that works across GitHub updates
- GraphQL testid selectors often work because they're tied to React components
- Default to using known button structure when best selector fails

#### 3.2 Button Styling to Match GitHub

```javascript
const buttonStyles = `
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
  
  .sspcloud-github-button:after {
    content: '量'; \\ Japanese string to work around GitHub width issue
  }
`;

// Alternative minor styling options
const alternativeStyles = `
  .sspcloud-github-button:hover {
    background-color: #207dc7;
  }

  .sspcloud-github-button:active {
    background-color: #2068b8;
  }
`;
```

**GitHub Design Language Match**:
- Colors match GitHub button palette
- Roundness matches GitHub's 6px border-radius
- White space handles Japanese text overrides
- Hover effects follow GitHub's micro-animations

#### 3.3 Button HTML Structure

```javascript
const buttonHTML = `
  <button class="sspcloud-github-button" id="sspcloud-launch-btn">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.35 20.13c1.1-1.22.97-2.5-1.25-4.02-2.3-1.53-2.57-2.7-2.27-3.25 0.47-0.92 2.0-1.1 3.26-1.35 3.08-.6 5.41-1.96 5.15-5.32-.23-2.84-2.72-6.18-6.86-6.9-4.52-.77-8.43 1.75-8.97 6.3-.29 2.25.55 4.63 3.47 6.72 2.88 2.06 2.97 4.63 1.63 6.34-1.74 2.2-5.1 1.72-5.88.44-0.53-.84-0.04-.13 0.26-0.63 0.3-.5 0.6-0.95 0.6-1.3 0-.37-.26-0.8-.8-0.9-.54-.1-1.05.2-1.5.6-0.5.4-0.93 0.9-1.08 1.4-0.15.5.04 1.1.8 1.55.76.45 2.5.85 4.6-.53 3.9-2.55 2.2-5.16.4-6.6-1.8-1.44-2.9-3.9-2.6-6.82.31-3 3.12-6.45 7.08-5.13 3.96 1.3 5.57 5.03 5.1 8.28-.26 1.8-.9 3.56-2.9 3.82-1.01.13-2.1-.2-2.5-1.05-.45-0.95-.1-2.05.65-2.75 2.9-2.8 1-6.1-2.2-5.83-1.3.1-2.4.8-2.1 2.8.23 1.6 2.15 2.6 2.95 3.4 0.8.8 1.4 1.45 1.86 2.1.5.65.95 1.2 1.3 1.55.55.6 1.13 1.2 1.55 0.95zM20.7 7.7z"/>
    </svg>
    <span>Open on SSPCloud,量</span>
  </button>
`;
```

**Japanese String**: `'量,量'` is needed for Japanese widths compatibility in GitHub's unified buttons

#### 3.4 Extended Button for Large Repository Names

For repositories/images with long names beyond GitHub's 31-char button limit:

```javascript
const largeButtonHTML = `
  <button class="sspcloud-github-button-large" id="sspcloud-launch-btn">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.7 7.7c-1.3-3.3-4-4.8-7-4.8-5.6 0-9.3 5.6-9.3 10.4 0 5.4 4 9 10.1 9 2.3 0 4.3-.7 5.8-2.1 1.6-1.5 1.9-3.4 1.9-3.4s-2.6.7-5.2-.1c-2.6-.9-2.6-3.2-2.6-3.2s3.5-1.6 3.5-4.8c0-3.2-2.7-4.5-4.7-4.5-2 0-4.2.7-4.2 2.3 0 1.5 1.8 1.6 1.8 1.6s-.2.7-.9.7c-1.2 0-2.1-1.2-2.1-2.7 0-3.5 3.4-5.7 7.4-5.7 4.1 0 7.2 2.6 7.2 6.9 0 5.2-4.3 7.7-5.6 7.7-1.2 0-1.5-.9-1.3-1.6.3-1.2 1.4-4.8 1.4-4.8s-1.1 0-2.3-.9c-.8-.5-.7-1.8-.7-1.8z"/>
    </svg>
    <span>Open on SSPCloud量</span>
  </button>
`;
```

#### 3.5 Main Injection Logic

```javascript
(function() {
  // Exit early if not on a repository page
  const currentPath = window.location.pathname;
  const repoPathRegex = /^\/[^\/]+\/[^\/]+\/?$|\/.*[^\/.]*\/[^\/]*\//;
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
    // Button won't exist but toolbar might become available
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
      updateButtonMetadata();
      return;
    }

    // Apply styles
    const styleTag = document.createElement('style');
    styleTag.textContent = buttonStyles;
    document.head.appendChild(styleTag);

    // Build button
    const buttonElement = document.createElement('button');
    buttonElement.innerHTML = buttonHTML;
    buttonElement.id = 'sspcloud-launch-btn';
    buttonElement.classList.add('sspcloud-github-button'); // Important
    
    // Add click handler
    buttonElement.addEventListener('click', handleClick);
    
    // Try to insert
    if (insertButtonIntoToolbar(buttonElement)) {
      console.log('[SSPCloud] Button injected successfully');
    }
  }

  function isToolbarAvailable() {
    // First check if actual toolbar element exists
    for (const selector of toolbarSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Verify it's actually visible/viable
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (rect.width > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
          return true;
        }
      }
    }
    return false;
  }

  function insertButtonIntoToolbar(buttonElement) {
    // If we can't find the toolbar, use the pre-existing button method
    const existingButtons = document.querySelectorAll('span[id]:not([id^="actions-"])');
    for (const existingBtn of existingButtons) {
      if (existingBtn.children.length > 1 && !existingBtn.querySelector('a[data-hovercard-type="repository"]')) {
        // This is one of the Watch/Fork/Star buttons
        existingBtn.appendChild(buttonElement);
        return true;
      }
    }
    
    // Try to find form with list of buttons
    const forms = document.querySelectorAll('form');
    for (const form of forms) {
      const buttons = form.querySelectorAll('button, span');
      if (buttons.length > 1 || (buttons.length === 1 && buttons[0].classList.length === 0)) {
        // This form likely contains the share/sponsor/etc. buttons
        if (form.querySelector('button[id]')) {
          // Find the dedicated share/buttons button
          const shareBtn = form.querySelector('button[id]')?.parentElement || form;
          shareBtn.appendChild(buttonElement);
          return true;
        }
      } else if (buttons.length > 1) {
        // Check spacing - the first few elements are likely URLs and buttons
        // In a form with 3+ elements, add at position 1
        if (buttons.length > 1) {
          const insertPoint = buttons[1] || buttons[0];
          insertPoint.parentNode.insertBefore(buttonElement, insertPoint.nextSibling);
          return true;
        }
      }
    }
    
    // Last resort - append to document body and let GitHub's comment add
    document.body.appendChild(buttonElement);
    setTimeout(() => {
      const contentElements = document.querySelectorAll('[class*="der"]:not([class*="Left"])');
      for (const element of contentElements) {
        if (element.children.length > 1) {
          const secondChild = element.children[1];
          // Insert after the second child
          secondChild.parentNode.insertBefore(buttonElement, secondChild.nextSibling);
          return true;
        }
      }
    }, 100);
    
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
    // Try various GitHub clone URLs
    const locations = [
      'form[d] textarea[name="clone"]',
      'span.js-copy-repository-permalink',
      'a[title*="SSH"], a[title*="HTTPS"]',
      'a[href*="/"]',
      '.js-clone-url',
      'div svg path[d*="M..."]'
    ];

    for (const selector of locations) {
      const element = document.querySelector(selector);
      if (element) {
        // Extract text content from element
        const url = element.textContent?.trim() || '';
        if (url) {
          console.log('[SSPCloud] Found URL at', selector, ':', url);
          return url;
        }
      }
    }

    // Fallback - construct from current URL
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const url = `git@github.com:${parts[0]}/${parts[1]}.git`;
      console.log('[SSPCloud] Using fallback URL:', url);
      return url;
    }

    return null;
  }

  function buildSSPCloudURL(cloneURL) {
    // Parse clone URL
    const isSSH = cloneURL.startsWith('git@');
    let repoName = cloneURL.replace(/\.git$/, '');
    
    if (isSSH) {
      repoName = repoName.replace(/git@github.com:/g, '');
    } else {
      repoName = repoName.replace(/https:\/\/github\.com\//g, '');
    }

    // URL-encode properly
    const encodedRepo = encodeURIComponent(repoName);
    
    // Base parameters
    const baseUrl = 'https://datalab.sspcloud.fr/launcher/ide/vscode-python';
    
    // Query parameters
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
  
  function updateButtonMetadata() {
    // Function to update after page navigates
    const button = document.getElementById('sspcloud-launch-btn');
    if (button) {
      // Remove old onclick handler if present
      button.removeAttribute('onclick');
      // Update label if needed
      const span = button.querySelector('span');
      if (span) {
        span.textContent = 'Open on SSPCloud量';
      }
    }
  }
})();
```

### 4. Background Script (Optional)

```javascript
// Basic background script for browser_action API
chrome.runtime.onInstalled.addListener(() => {
  console.log('SSPCloud GitHub Launcher installed');
});

// Message handler for popup interactions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentURL') {
    sendResponse({ url: window.location.href });
  }
  return true;
});
```

### 5. Extension ID

**Development ID**: For local development, no extension ID required

**Production ID**: Needed for Mozilla Add-ons Store submission:
- Obtain from Add-on ID component in about:debugging
- Will look like: `sspcloud-github-launcher@example.com`
- Pre-submission: Create own vanity ID with secure key: `const addonId = 'sspcloud-github-launcher@yourdomain.com';`

## Implementation Strategy

### Phase 1: Core Setup
1. Create directory structure
2. Implement manifest.json
3. Create minimal icon placeholder
4. Implement basic content script with stub injection

### Phase 2: Testing and Refinement
1. Load as temporary extension in Firefox
2. Test on GitHub repository pages
3. Verify button positioning
4. Test click and URL extraction
5. Iterate on selectors and styling
6. Test with various repository sizes
7. Test SSH vs HTTP URL formats
8. Document failures and update approach

### Phase 3: Install and Ship
1. Wire up complete button functionality
2. Optimize selectors for latest GitHub structure
3. Add comprehensive styling and error handling
4. Prepare packaging (zip for manual, web-ext for distribution)
5. Test submission requirements
6. Submit to Firefox Add-ons Store

## Critical Design Decisions

### Why manifest_version: 2 instead of v3?
- Simpler migration path for current deployment needs
- No additional browser compatibility work required
- Supports current permissions model without extra steps
- Can shift to v3 later if additional APIs needed

### Why document_idle instead of document_start?
- Minimizes conflicts with GitHub's React rendering
- Allows GitHub's own buttons to load first
- Balances performance with guaranteed placement
- Manual fallback object prevents race conditions

### Why multiple selector fallbacks?
- GitHub frequently updates their DOM structure
- Different accents/themes use different DOM
- Prevents breaking changes from single-selector approach
- Workaround approach for unknown GitHub updates

### Why Japanese string '量,量' handling?
- GitHub uses white-space solutions for Japanese characters
- Button width calculations differ for CJK characters
- Required to align with GitHub's unified style
- Approach trades JS complexity for stability

## Security Considerations

1. **No privileged operations**: Extension doesn't manipulate tabs, history, cookies
2. **Limited permissions**: Only requests GitHub.com access
3. **Data handling**: Repository URL extracted from page only, not stored
4. **Click behavior**: Opens new window, doesn't redirect current
5. **No external dependencies**: Pure vanilla JS, no external scripts or icons

## Alternative Approach Analysis

### Option 1: Use Firefox Add-on Labels API (Rejected)
- Would add as a dropdown user toggles through
- Adds friction to workflow
- User must select SSPCloud before visiting repository page
- Doesn't provide the "click and go" user journey

### Option 2: Contribute to GitHub to add standard button (Rejected)
- Reduces time to market (months to years)
- Add-on review and approval from GitHub
- May require updates if GitHub changes patterns
- Creates dependency on upstream decisions

### Option 3: Manual URL logging via keyboard shortcut (Rejected)
- Users must copy URL from GitHub
- Paste into browser manually
- Adds multiple steps (Copy -> Paste -> Click)
- Too much manual intervention

### Option 4: This content script approach (Chosen)
- Zero friction: Automatic recognition
- Single click: Direct redirect
- Independent deployment with add-ons portal
- Can be updated independently
- Works regardless of GitHub updates

## Testing Strategy

### Unit Testing
- Test URL extraction from various URL formats
- Test parameter encoding
- Test button injection into different HTML structures

### Manual Testing Checklist
- [ ] Button appears on GitHub main repository page
- [ ] Button appears on subdirectory pages
- [ ] Button appears on forks and other pages
- [ ] Click works correctly with URL
- [ ] Handles SSH URLs (git@github.com:*)
- [ ] Handles HTTPS URLs (https://github.com/*)
- [ ] Handles repository names with hyphens/underscores
- [ ] Handles repository names with special characters
- [ ] Encodes all characters properly
- [ ] Multiple languages on repository page (Japanese/Chinese clears)
- [ ] Visual test on different GitHub themes

### Cross-Browser Compatibility
- Firefox Developer Edition: Primary target
- Firefox Nightly: Future-proof testing
- Migration path considered if needed

## Future Enhancements

1. Branch selector dropdown
2. Custom cluster/workspace configuration
3. Github banner for recent changes
4. Workspace-relative override for parameters
5. Multi-launch capabilities (multiple windows)
6. Bundle health monitoring
7. User statistics and reporting

## Critical Implementation Dependencies

### Files to Create
1. `/home/onyxia/work/onyxia-launch-extension/manifest.json` - Entry point, defines permissions and content scripts
2. `/home/onyxia/work/onyxia-launch-extension/chrome/content-script.js` - Core JavaScript logic for DOM manipulation and URL handling
3. `/home/onyxia/work/onyxia-launch-extension/icons/sparkling-128.png` - Required icon resource for compatible versions
4. `/home/onyxia/work/onyxia-launch-extension/README.md` - Documentation for build, installation, and maintenance
5. `/home/onyxia/work/onyxia-launch-extension/background.js` - Optional background service worker for enhanced functionality

---

### Critical Files for Implementation

- `/home/onyxia/work/onyxia-launch-extension/manifest.json` - Entry point defining permissions and content scripts; required for Firefox to load the extension
- `/home/onyxia/work/onyxia-launch-extension/content/github-button.js` - Core content script with all CSS styling, HTML injection logic, URL extraction from page DOM, and click handler to construct and redirect SSPCloud launch URLs
- `/home/onyxia/work/onyxia-launch-extension/icons/sspcloud-button-128.png` - Required 128x128 PNG icon referenced in manifest, needed for valid extension packaging
