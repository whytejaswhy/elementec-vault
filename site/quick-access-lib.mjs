export const SEEN_KEY = 'elementec-vault-quick-access-v1';
export function firstVisit(storage, standalone = false) {
  if (standalone) return false;
  try { return !storage.getItem(SEEN_KEY); } catch { return true; }
}
export function rememberVisit(storage) {
  try { storage.setItem(SEEN_KEY, 'seen'); } catch { /* Storage may be unavailable in private browsing. */ }
}
export function accessInstructions({ userAgent = '', touchPoints = 0, mode }) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && touchPoints > 1);
  const android = /Android/i.test(userAgent);
  const inApp = /Instagram|FBAN|FBAV|Line\/|TikTok/i.test(userAgent);
  if (inApp) return `Open the Vault in ${ios ? 'Safari' : android ? 'Chrome' : 'your browser'} using this browser’s menu, then ${mode === 'bookmark' ? 'choose Bookmark or Add Bookmark.' : 'choose Add to Home Screen or Install app.'}`;
  if (mode === 'bookmark') {
    if (ios) return 'In Safari, tap Share, then Add Bookmark. In another browser, use its menu and choose Bookmark.';
    if (android) return 'Open your browser’s menu and tap the star or Bookmark to save the Vault.';
    return `Press ${/Macintosh|Mac OS X/i.test(userAgent) ? '⌘' : 'Ctrl'} + D to bookmark the Vault, or choose Bookmark in your browser’s menu.`;
  }
  if (ios) return 'Open the Vault in Safari. Tap Share → Add to Home Screen, turn on Open as Web App if shown, then tap Add.';
  if (android) return 'In Chrome, open the ⋮ menu → Add to Home Screen or Install app, then confirm. If you only see a shortcut option, you can use that for quick access.';
  return 'In Chrome or Edge, use the install icon in the address bar or the browser’s menu → Install app. In Safari on Mac, choose File → Add to Dock. If your browser has no install option, bookmark the Vault instead.';
}
