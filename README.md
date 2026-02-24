# GitHub SSPCloud Launcher

A Firefox extension that adds an **"Open on SSPCloud"** button to GitHub repository pages, enabling one-click launch of VSCode on [SSPCloud](https://datalab.sspcloud.fr).

## Features

- One-click launch from any GitHub repository page
- Automatic repository URL extraction (HTTPS and SSH clone URLs)
- SSH URLs are automatically converted to HTTPS
- Toast notification if URL detection fails or a popup is blocked
- Configurable settings (base URL, VSCode version, S3 region, init script, …) via the extension's options page
- No external dependencies, no telemetry

## Installation

### Temporary load (development)

1. Open `about:debugging` in Firefox
2. Click **This Firefox**
3. Click **Load Temporary Add-on…**
4. Select `manifest.json` from this directory
5. Visit any GitHub repository page — the button appears next to the Watch/Fork/Star buttons

The extension is unloaded when Firefox restarts. Reload it from `about:debugging` after each restart, or use a permanent installation method below.

### Permanent installation (unsigned)

Firefox requires add-ons to be signed for permanent installation, unless you use **Firefox Developer Edition** or **Firefox Nightly** with `xpinstall.signatures.required` set to `false` in `about:config`.

1. Build the ZIP (see below)
2. In `about:addons`, click the gear icon → **Install Add-on From File…**
3. Select the ZIP

### Firefox Add-ons Store

Submit the ZIP to [addons.mozilla.org](https://addons.mozilla.org) for a signed, permanent release.

## Configuration

After loading the extension, open its **Options** page:

- In `about:addons`, find **GitHub SSPCloud Launcher** → **Preferences**

Settings you can override (all fall back to built-in defaults):

| Setting | Default |
|---|---|
| SSPCloud base URL | `https://datalab.sspcloud.fr/launcher/ide/vscode-python` |
| VSCode version | `2.5.0` |
| S3 region | `region-79669f20` |
| Init script URL | `https://raw.githubusercontent.com/…/init.sh` |
| Vault secret | `OPENAI-LLM` |
| Persistence size | `20Gi` |

## Project structure

```
onyxia-launch-extension/
├── manifest.json           # Extension manifest (v2)
├── content/
│   ├── utils.js            # Pure functions: buildSSPCloudURL, getRepositoryCloneURL
│   └── github-button.js    # Content script — injects the button into GitHub pages
├── popup/
│   ├── options.html        # Settings page UI
│   └── options.js          # Settings page logic (browser.storage.local)
├── icons/
│   ├── sspcloud-button-48.png
│   └── sspcloud-button-128.png
├── tests/
│   └── github-button.test.js  # Jest unit tests
├── package.json            # Dev dependencies (Jest, ESLint)
└── README.md
```

## How it works

### Button injection

When you navigate to a GitHub repository page (`github.com/<owner>/<repo>`), the content script:

1. Checks the URL matches a two-segment path (e.g. `/torvalds/linux`)
2. Waits for the page toolbar to render (debounced MutationObserver)
3. Injects the button next to the Watch/Fork/Star controls
4. Disconnects the observer once the button is placed

### URL extraction

The extension tries several selectors to find the clone URL (`.js-clone-url`, `textarea[name="clone"]`, etc.), then falls back to constructing the URL from `window.location`.

### SSPCloud URL construction

Clicking the button opens a URL of the form:

```
https://datalab.sspcloud.fr/launcher/ide/vscode-python
  ?name=vscode-generic
  &version=2.5.0
  &s3=region-79669f20
  &persistence.size=«20Gi»
  &init.personalInit=«https://…/init.sh»
  &kubernetes.role=«admin»
  &vault.secret=«OPENAI-LLM»
  &git.repository=«https://github.com/owner/repo»
  &git.asCodeServerRoot=true
```

Template values are wrapped in `«»` guillemets as required by the SSPCloud launcher.

## Development

### Install dependencies

```bash
npm install
```

### Run tests

```bash
npm test
```

24 unit tests cover `buildSSPCloudURL` (delimiter wrapping, SSH→HTTPS conversion, no double-encoding, custom config) and `getRepositoryCloneURL` (DOM selectors, `window.location` fallback).

### Lint

```bash
npm run lint
```

### Build ZIP for distribution

```bash
zip -r firefox-extension.zip \
    manifest.json \
    content/ \
    popup/ \
    icons/ \
    README.md
```

### Reload after changes

1. Edit source files
2. In `about:debugging`, click **Reload** next to the extension
3. Refresh the GitHub page

## CI/CD

GitHub Actions runs on every push to `main` or `develop`:

- **build** — packages the extension as a ZIP artifact
- **quality-check** — runs `npm ci`, `npm run lint`, `npm test`, security scan, manifest validation

To create a release, push a version tag or trigger the **Release to Store** workflow manually from the Actions tab.

## Troubleshooting

### Button doesn't appear

1. Open the browser console (`F12`) on the GitHub repo page
2. Look for `[SSPCloud]` log messages
3. Confirm you are on a repository page, not a user profile or settings page
4. In `about:debugging`, verify the extension is listed as active
5. Click **Reload** in `about:debugging`, then refresh the GitHub page

### Wrong URL opened

The extension logs the extracted clone URL and the final SSPCloud URL to the console. Check those values and open an issue with reproduction details if something looks wrong.

## Security & privacy

- **Permissions**: `storage` (options page only) — no network requests, no tabs permission
- **Data collection**: none
- **Data storage**: settings are stored locally via `browser.storage.local` only

## License

MIT — feel free to use and modify.
