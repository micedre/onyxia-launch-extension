/* Background script: dynamically registers content scripts for non-GitHub forges */

const registeredScripts = [];

async function registerForgeScripts() {
  // Unregister all existing dynamic scripts
  for (const script of registeredScripts) {
    script.unregister();
  }
  registeredScripts.length = 0;

  const { forges } = await browser.storage.local.get({ forges: [] });

  for (const forge of forges) {
    if (forge.type === 'github') continue; // GitHub is handled by static content_scripts

    if (forge.type === 'gitlab' && forge.domain) {
      try {
        const script = await browser.contentScripts.register({
          matches: [`*://${forge.domain}/*`],
          js: [
            { file: 'content/utils.js' },
            { file: 'content/gitlab-button.js' }
          ],
          runAt: 'document_idle'
        });
        registeredScripts.push(script);
        console.log(`[SSPCloud] Registered content scripts for ${forge.domain}`);
      } catch (err) {
        console.error(`[SSPCloud] Failed to register scripts for ${forge.domain}:`, err);
      }
    }
  }
}

// Register on startup
registerForgeScripts();

// Re-register when storage changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.forges) {
    registerForgeScripts();
  }
});
