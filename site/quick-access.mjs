import { firstVisit, rememberVisit, accessInstructions } from './quick-access-lib.mjs?v=quick-access-1';
export function initQuickAccess() {
  const $ = id => document.getElementById(id);
  const dialog = $('quick-access-dialog'), save = $('save-vault'), install = $('install-vault');
  let deferredInstall = null, offered = false, storage;
  try { storage = window.localStorage; } catch { /* Continue with instructions if storage is blocked. */ }
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const instructions = mode => accessInstructions({ userAgent: navigator.userAgent, touchPoints: navigator.maxTouchPoints, mode });
  const showHelp = (title, text) => {
    $('quick-help-title').textContent = title;
    $('quick-help-text').textContent = text;
    $('quick-help').hidden = false;
  };
  const updateInstall = () => { install.textContent = deferredInstall ? 'Install web app' : /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ? 'Add to Home Screen' : 'Install web app'; };
  const open = () => {
    if (standalone() || document.querySelector('dialog[open]')) return;
    $('quick-help').hidden = true;
    updateInstall(); dialog.showModal();
  };
  save.hidden = standalone();
  save.addEventListener('click', open);
  $('close-quick-access').addEventListener('click', () => dialog.close());
  $('later-quick-access').addEventListener('click', () => dialog.close());
  $('bookmark-vault').addEventListener('click', () => showHelp('Bookmark the Vault', instructions('bookmark')));
  install.addEventListener('click', async () => {
    if (!deferredInstall) { showHelp('Quick access from your device', instructions('install')); return; }
    const event = deferredInstall; deferredInstall = null;
    install.disabled = true;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'accepted') dialog.close();
      else showHelp('You can install it later', 'Use Save the Vault at the bottom of this page whenever you’re ready.');
    } catch { showHelp('Quick access from your device', instructions('install')); }
    finally { install.disabled = false; updateInstall(); }
  });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; updateInstall(); });
  window.addEventListener('appinstalled', () => { deferredInstall = null; rememberVisit(storage); save.hidden = true; if (dialog.open) dialog.close(); });
  return () => {
    if (offered || !firstVisit(storage, standalone())) return;
    if (document.querySelector('dialog[open]')) { document.querySelector('dialog[open]').addEventListener('close', () => setTimeout(offer, 0), { once: true }); return; }
    offer();
  };
  function offer() {
    if (offered || !firstVisit(storage, standalone()) || document.querySelector('dialog[open]')) return;
    offered = true; open(); rememberVisit(storage);
  }
}
