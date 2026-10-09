import test from 'node:test';
import assert from 'node:assert/strict';
import { firstVisit, rememberVisit, accessInstructions } from '../site/quick-access-lib.mjs';
import { initQuickAccess } from '../site/quick-access.mjs';
test('the welcome appears once, and never in the installed app', () => {
  const values = new Map(), storage = { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) };
  assert.equal(firstVisit(storage), true);
  rememberVisit(storage);
  assert.equal(firstVisit(storage), false);
  assert.equal(firstVisit({ getItem: () => null }, true), false);
});
test('blocked storage does not prevent browsing or saving instructions', () => {
  const storage = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  assert.equal(firstVisit(storage), true);
  assert.doesNotThrow(() => rememberVisit(storage));
});
test('instructions cover iPhone, desktop-mode iPad, Android, and reel browsers', () => {
  assert.match(accessInstructions({ userAgent: 'iPhone', mode: 'install' }), /Safari.*Add to Home Screen/);
  assert.match(accessInstructions({ userAgent: 'Macintosh', touchPoints: 5, mode: 'install' }), /Safari.*Add to Home Screen/);
  assert.match(accessInstructions({ userAgent: 'Android', mode: 'install' }), /Chrome.*Install app/);
  assert.match(accessInstructions({ userAgent: 'iPhone Instagram', mode: 'install' }), /Open the Vault in Safari/);
  assert.match(accessInstructions({ userAgent: 'Android Instagram', mode: 'bookmark' }), /Open the Vault in Chrome/);
  assert.match(accessInstructions({ userAgent: 'Macintosh', mode: 'bookmark' }), /⌘ \+ D/);
  assert.match(accessInstructions({ userAgent: 'Windows', mode: 'bookmark' }), /Ctrl \+ D/);
});
test('native installation waits for a click, consumes one prompt, and handles installed state', async () => {
  class Element extends EventTarget {
    open = false; hidden = false; disabled = false; textContent = '';
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatchEvent(new Event('close')); }
  }
  const ids = ['quick-access-dialog', 'save-vault', 'install-vault', 'quick-help-title', 'quick-help-text', 'quick-help', 'close-quick-access', 'later-quick-access', 'bookmark-vault'];
  const elements = new Map(ids.map(id => [id, new Element()]));
  const values = new Map();
  const window = new EventTarget();
  window.localStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const replacements = {
    window,
    document: { getElementById: id => elements.get(id), querySelector: () => elements.get('quick-access-dialog').open ? elements.get('quick-access-dialog') : null },
    navigator: { userAgent: 'Windows Chrome', maxTouchPoints: 0 },
    matchMedia: () => ({ matches: false })
  };
  const originals = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  try {
    for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, value });
    const offer = initQuickAccess();
    let prompted = 0;
    const ready = new Event('beforeinstallprompt', { cancelable: true });
    ready.prompt = async () => { prompted++; };
    ready.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(ready);
    offer();
    assert.equal(ready.defaultPrevented, true);
    assert.equal(prompted, 0);
    assert.equal(elements.get('quick-access-dialog').open, true);
    elements.get('install-vault').dispatchEvent(new Event('click'));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(prompted, 1);
    assert.equal(elements.get('quick-help-title').textContent, 'You can install it later');
    elements.get('install-vault').dispatchEvent(new Event('click'));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(prompted, 1);
    window.dispatchEvent(new Event('appinstalled'));
    assert.equal(elements.get('quick-access-dialog').open, false);
    assert.equal(elements.get('save-vault').hidden, true);
  } finally {
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
