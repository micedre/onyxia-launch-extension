# GitHub SSPCloud Launcher

A Firefox extension that adds an "Open on SSPCloud" button to GitHub repository pages, enabling one-click launch of VSCode on SSPCloud (datalab.sspcloud.fr).

## Features

- ✅ One-click launch from GitHub repository pages
- ✅ Automatic repository URL extraction (SSH and HTTPS)
- ✅ GitHub's native styling (blue button, hover effects)
- ✅ Positioning alongside Watch/Fork/Star buttons
- ✅ Works with multiple GitHub themes (Light/Dark)
- ✅ No data collection or external dependencies

## CI/CD

Automated building and packaging is provided via GitHub Actions.

### Building Locally

For manual builds:

```bash
# Create ZIP package
zip -r firefox-extension.zip \
    manifest.json \
    content/githithub-button.js \
    icons/ \
    README.md \
    LICENSE

# Create SZIP package
zip -r firefox-extension.szip firefox-extension.zip
```

### Automated Builds

#### Building on Push

Automated builds trigger on push to `main` or `develop` branches:

- **artifacts**: `firefox-extension-zip` and `firefox-extension-szip`
- **duration**: ~2 minutes
- **services**: Node.js 20, Ubuntu 22.04

#### Release Builds

To create a release:

```bash
# Create a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Or manually trigger via workflow_dispatch:

1. Go to Actions → Release to Store
2. Enter version number (e.g., `1.0.0`)
3. Click "Run workflow"

Release workflow provides:
- ✓ Automated testing and validation
- ✓ Signed release packages
- ✓ GitHub Release with artifacts
- ✓ Ready-to-upload to Firefox Add-ons Store

### Quality Checks

All builds include automated quality checks:
- Manifest.json validation
- JavaScript syntax checking
- Security scan for dangerous patterns
- Sensitive data detection
- File permission verification

## Installation

### Method 1: Temporary Load (Development)

1. Open `about:debugging` in Firefox
2. Click "This Firefox"
3. Click "Load Temporary Add-on..."
4. Select `manifest.json`
5. Extension appears in toolbar for current session only

### Method 2: SZIP File (Distribution)

1. Create a SZIP file containing:
   - `manifest.json`
   - `content/` directory with `github-button.js`
   - `icons/` directory with icon files

### Method 3: Firefox Add-ons Store (Production)

1. Build with Firefox Add-ons Build/Extension Workshop
2. Prepare icon files (128x128 PNG)
3. Submit to Firefox Add-ons Store for review

## Project Structure

```
onyxia-launch-extension/
├── manifest.json           # Extension manifest (v2-compatible)
├── icons/
│   └── sspcloud-button-128.png  # Extension icon (128x128 required)
├── content/
│   └── github-button.js   # Content script for GitHub DOM manipulation
└── README.md               # Build instructions and usage
```

## How It Works

### URL Extraction

The extension uses multiple fallback strategies to extract repository URLs from GitHub:

1. **Primary**: Clone dropdown textarea
2. **Secondary**: Permission spans
3. **Fallback**: Construct from pathname

### Button Styling

- Matches GitHub's design language precisely
- Colors: Primary #3298dc, hover #286799
- Border radius: 6px (same as GitHub's buttons)
- Japanese spacing characters `量,量` for proper visual spacing

### SSPCloud URL Construction

The button opens:
```
https://datalab.sspcloud.fr/launcher/ide/vscode-python?name=vscode-generic&version=2.5.0&s3=region-79669f20&persistence.size=%C2%AB20Gi%C2%BB&git.repository=<CLONE_URL>&git.asCodeServerRoot=true
```

## Testing

### Manual Testing Checklist

- [ ] Button appears on GitHub repository pages
- [ ] Button positioned consistently alongside Watch/Fork/Star
- [ ] SSH clone URLs work correctly
- [ ] HTTPS clone URLs work correctly
- [ ] Special characters in repository names handled properly
- [ ] New tab opens with correct SSPCloud URL
- [ ] Extension works across different GitHub themes

### Browser Compatibility

- ✅ Firefox Developer Edition
- ✅ Firefox Nightly
- ⚠️ Desktop browsers other than Firefox (development only)

## Troubleshooting

### Button Doesn't Appear

1. Open browser console (`F12`)
2. Look for "[SSPCloud]" log messages
3. Check if you're on a repository page (not root or other GitHub pages)
4. Verify extension is active in `about:debugging`

### Wrong URL Extracted

The extension attempts multiple extraction strategies. If it fails:
1. Check browser console for error messages
2. The button will be hidden but won't break the page
3. Consider opening a GitHub issue with reproduction details

## Development

### Testing Changes

1. Modify `content/github-button.js`
2. Reload in `about:debugging`
3. Refresh GitHub page

### Debugging

Add console logging to see what's happening:
```javascript
console.log('[SSPCloud] Button injected');
console.log('[SSPCloud] Repository URL:', cloneURL);
console.log('[SSPCloud] SSPCloud URL:', targetURL);
```

## Security & Privacy

- **Permissions**: None beyond site access
- **Data Collection**: No telemetry, no analytics
- **Data Storage**: No local storage used
- **Session Isolation**: Each tab is isolated

## Future Enhancements

- Branch selector dropdown
- Custom cluster/workspace configuration
- Per-repository settings
- Dark mode adaptive buttons (handled by GitHub's built-in styling)
- Extension v3 migration when required

## License

MIT License - feel free to use and modify as needed.

## Author

Created for researchers and developers using SSPCloud for data science and development workflows.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GitHub issues (if available)
3. Consider contribution to improve the extension
