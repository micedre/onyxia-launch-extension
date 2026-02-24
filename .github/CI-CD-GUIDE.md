# CI/CD Guide for GitHub SSPCloud Launcher

This guide explains how to use the automated CI/CD pipeline for building and releasing the Firefox extension.

## Overview

The repository uses GitHub Actions for:
- **Automated builds** on each push
- **Quality checks** before builds
- **Release packaging** for distribution
- **Artifact storage** for downloads

## Workflow Files

### 1. `build.yml` - Build Workflow

Triggers on:
- Push to `main` or `develop` branches
- Pull requests targeting these branches
- Manual workflow dispatch

Jobs:
- **build**: Creates ZIP and SZIP packages
- **create-signed-szip**: Creates signed SZIP from build artifacts
- **quality-check**: Validates manifest, JavaScript, and security
- **build-summary**: Generates build summary report

### 2. `release.yml` - Release Workflow

Triggers on:
- Push to version tags (e.g., `v1.0.0`, `v1.1.0`)
- Manual workflow dispatch with version input

Jobs:
- **release**: Creates release package and GitHub Release
- **upload-to-firefox-store**: Ready for AMO upload (requires configuration)
- **release-notes**: Generates release notes
- **summary**: Final release summary

## Usage

### Building Locally without CI/CD

```bash
# Create ZIP package
zip -r firefox-extension.zip \
    manifest.json \
    content/github-button.js \
    icons/ \
    README.md

# Create SZIP package
zip -r firefox-extension.szip firefox-extension.zip
```

### Triggering CI/CD Builds

#### Automated Build

Simply push to the repository:
```bash
git add .
git commit -m "Update extension"
git push origin main
```

Automated build will start within 1-2 minutes.

#### Manual Build

1. Go to **Actions** tab in repository
2. Select **Build Extension** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

#### Creating a Release

**Option 1: Using Git Tags**

```bash
# Create and push tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

**Option 2: Manual Workflow**

1. Go to **Actions** → **Release to Store**
2. Click **Run workflow**
3. Enter version (e.g., `1.0.0`)
4. Click **Run workflow**

The release workflow will:
1. Create the release package
2. Generate GitHub Release
3. Upload artifacts
4. Prepare release notes
5. Build artifacts ready for AMO submission

## Artifacts

### Build Artifacts

After each successful build, artifacts are available:
- **firefox-extension-zip**: ZIP file for manual testing
- **firefox-extension-szip**: SZIP package for Firefox

Download from:
- Actions tab → Workflow runs → Artifacts
- Or manually download via API

### Release Artifacts

After release:
- **firefox-extension-release-v1.0.0**: Complete release package
- **release-notes**: Markdown release notes
- Available in GitHub Release section

## Quality Checks

CI/CD automatically performs these checks:

### 1. Manifest Validation
- JSON syntax validation
- Required fields present
- Content script configuration

### 2. JavaScript Syntax
- ESLint (if available)
- Basic syntax checking

### 3. Security Scan
- No `eval()` or `Function()` usage
- No common security patterns
- File permissions are readable

### 4. Sensitive Data Check
- No passwords or secrets
- No API keys in code
- No sensitive tokens

### 5. File Structure
- Required files present
- Icons exist at correct paths
- No duplicate or corrupt files

## Uploading to Firefox Add-ons Store

### Prerequisites

1. **Firefox Add-ons Account**
   - Create account at [addons.mozilla.org](https://addons.mozilla.org)
   - Start new submission: "Submit a New Add-on"

2. **Add-on Discovery**
   - Complete the discovery process (if not already approved)
   - Get your Add-on ID (format: `addon-id@example.com`)

3. **Repository Secrets**
   - Add secret `AMO_ADDON_ID` in repository settings
   - Value: Your add-on ID (e.g., `sspcloud@github.com`)

### Manual Upload Process

1. **Download Artifacts**
   - From GitHub Actions or release section
   - Unzip the `firefox-extension-release.zip`

2. **Prepare Submission**
   - Use [WebExtensions Builder](https://extensionworkshop.com/)
   - Upload the unzipped files
   - Review and fill in submission details

3. **Review Process**
   - Mozilla reviews your add-on
   - Usually takes 3-7 business days
   - Follow review checklist feedback

4. **Auto-Upload (Optional)**
   - Configure workflow to auto-upload
   - Requires AMO credentials (do not commit secrets)
   - Or upload manually for security

### Troubleshooting AMO Submission

**Common Issues:**

1. **Add-on rejected due to incompatibility**
   - Ensure Firefox version is specified in manifest
   - Check for deprecated APIs

2. **Security issues**
   - Review the reviewer's comments
   - Address any flagged security concerns
   - Add update-url in manifest

3. **Policy violations**
   - Review Firefox add-ons policy
   - Ensure compliance with requirements

## Best Practices

### Development Workflow

1. **Test locally first**
   ```bash
   # Load as temporary extension
   # about:debugging → Load Temporary Add-on
   ```

2. **Push for CI/CD**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

3. **Monitor build**
   - Check Actions tab for build status
   - Review logs if build fails

4. **Download artifacts**
   - After successful build, download ZIP
   - Test distribution version

### Release Workflow

1. **Plan version bump**
   - Major, minor, or patch
   - Document breaking changes

2. **Create release**
   ```bash
   git tag -a v1.1.0 -m "..."
   git push origin v1.1.0
   ```

3. **Review automated artifacts**
   - Verify release package
   - Check release notes

4. **Prepare AMO submission**
   - Download release artifacts
   - Submit to Firefox Add-ons

5. **Monitor review**
   - Check email for reviewer feedback
   - Make requested changes if needed

### Maintaining CI/CD Pipeline

#### Updating Workflows

1. Edit workflow files in `.github/workflows/`
2. Test changes locally (optional)
3. Commit and push
4. Verify on GitHub Actions tab

#### Adding New Jobs

Add job sections to build.yml or release.yml:
```yaml
new-job:
  name: New Job Name
  runs-on: ubuntu-latest
  steps:
    - name: Your step
      run: your-command
```

#### Updating Dependencies

To update workflow actions:

```yaml
- uses: actions/checkout@v4  # Change version number
```

## Monitoring and Notifications

### Build Status

Check build status:
- GitHub Actions tab
- Branch protection rules
- Badge integration
  ```markdown
  ![Build Status](https://github.com/user/repo/actions/workflows/build.yml/badge.svg)
  ```

### Notifications

Enable notifications in:
- Repository settings → Actions → General
- Your personal email settings
- Webhook notifications

## Troubleshooting

### Build Fails

**Manifest Validation Error**
- Check JSON syntax
- Ensure required fields exist
- Validate file paths

**JavaScript Error**
- Review console logs
- Check for typos
- Test locally first

**Security Check Fails**
- Remove dangerous patterns
- Ensure no secrets in code
- Verify file permissions

### Release Fails

**Tag Creation Error**
- Verify tag format (vX.Y.Z)
- Check permissions
- Ensure tag is pushed, not just created

**Artifact Upload Fails**
- Check artifact paths
- Verify file sizes
- Review workflow logs

## Documentation

Additional resources:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firefox Add-ons Publishing](https://extensionworkshop.com/)
- [WebExtensions CI/CD](https://extensionworkshop.com/documentation/develop/web-extension-ci-cd/)
- [WebExtensions Builder](https://extensions.allorigins.win/)

## Support

For issues:
- Check workflow logs
- Review GitHub Actions debug logs
- Consult community forums
- Report bugs via GitHub Issues
