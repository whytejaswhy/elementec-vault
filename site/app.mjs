import { initQuickAccess } from './quick-access.mjs?v=quick-access-1';
import { visibleEntries, searchEntries, safeUrl, collectionTone, groupReelEntries } from './lib.mjs?v=reel-colors-1';
const $ = id => document.getElementById(id);
const tabs = [...document.querySelectorAll('[role="tab"]')];
let entries = [], collections = [], activeCollection = new URLSearchParams(location.search).get('reel') || '', type = new URLSearchParams(location.search).get('type') === 'prompts' ? 'prompt' : 'product', activePrompt = null, loaded = false;
const dialog = $('prompt-dialog');
const offerQuickAccess = initQuickAccess();
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function state(title, text) { const box = el('div', 'state'); box.append(el('strong', '', title), el('span', '', text)); $('results').replaceChildren(box); }
function updateAddress(id = '') { const url = new URL(location.href); url.searchParams.set('type', type === 'prompt' ? 'prompts' : 'products'); if (activeCollection) url.searchParams.set('reel', activeCollection); else url.searchParams.delete('reel'); url.hash = id; history.replaceState(null, '', url); }
function chooseType(next, update = true) {
  if (next !== type) activeCollection = '';
  type = next;
  for (const tab of tabs) { const selected = tab.dataset.type === type; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; }
  $('results').setAttribute('aria-labelledby', `${type === 'product' ? 'products' : 'prompts'}-tab`);
  const categories = [...new Set(entries.filter(item => item.type === type && (!activeCollection || item.collectionId === activeCollection)).map(item => item.category))].sort();
  $('category').replaceChildren(new Option('All categories', ''), ...categories.map(c => new Option(c, c)));
  if (update) updateAddress();
  if (loaded) render();
}
function render() {
  const scoped = activeCollection ? entries.filter(item => item.collectionId === activeCollection) : entries;
  const list = searchEntries(scoped, type, $('search').value, $('category').value, collections);
  $('results-count').textContent = `${list.length} ${type === 'product' ? (list.length === 1 ? 'product' : 'products') : (list.length === 1 ? 'prompt' : 'prompts')}`;
  if (!list.length) { const hasItems = entries.some(item => item.type === type); state(hasItems ? 'Nothing matches yet.' : `${type === 'product' ? 'Product links' : 'Prompts'} are coming soon.`, hasItems ? 'Try another search or choose All categories.' : 'Check back here for the next additions to the Vault.'); return; }
  if (!activeCollection) {
    const grid = el('div', 'grid'); grid.append(...groupReelEntries(list).map(cardFor)); $('results').replaceChildren(grid); return;
  }
  const sections = [];
  for (const collection of collections.filter(c => c.id === activeCollection)) {
    const members = list.filter(item => item.collectionId === collection.id);
    if (!members.length) continue;
    const section = el('section', 'collection');
    const heading = el('div', 'collection-heading');
    const copy = el('div', 'collection-summary');
    const title = el('h2', '', collection.title); title.id = `collection-${collection.id}`;
    section.setAttribute('aria-labelledby', title.id); copy.append(title, el('span', 'collection-count', `${members.length} ${type === 'product' ? (members.length === 1 ? 'product' : 'products') : (members.length === 1 ? 'prompt' : 'prompts')}`)); heading.append(copy);
    const links = el('div', 'collection-links');
    const link = el('a', '', activeCollection ? (type === 'product' ? 'All products' : 'All prompts') : 'View all ↗');
    const url = new URL(location.href); url.searchParams.set('type', type === 'prompt' ? 'prompts' : 'products'); url.hash = '';
    if (activeCollection) url.searchParams.delete('reel'); else url.searchParams.set('reel', collection.id);
    link.href = url.href; if (!activeCollection) link.setAttribute('aria-label', `Open collection: ${collection.title}`); links.append(link);
    if (collection.url && safeUrl(collection.url)) {
      const watch = el('a', '', 'Watch reel ↗'); watch.href = safeUrl(collection.url); watch.target = '_blank'; watch.rel = 'noopener noreferrer'; links.append(watch);
    }
    heading.append(links); section.append(heading);
    const grid = el('div', 'grid'); grid.append(...members.map(cardFor)); section.append(grid); sections.push(section);
  }
  $('results').replaceChildren(...sections);
}
function cardFor(item) {
    const card = el('article', 'card'); card.id = item.id;
    const collection = collections.find(c => c.id === item.collectionId);
    if (collection) { card.dataset.reelColor = collectionTone(collection); card.dataset.collection = collection.id; card.setAttribute('aria-description', `From ${collection.title}`); }
    const media = el('div', 'card-media');
    if (item.image && safeUrl(item.image)) { const image = el('img', 'card-image'); image.src = safeUrl(item.image); image.alt = item.title; image.loading = 'lazy'; media.classList.add('has-image'); image.addEventListener('error', () => { image.remove(); media.classList.remove('has-image'); }, { once: true }); media.append(image); }
    media.append(el('span', 'category', item.category)); card.append(media);
    const bottom = el('div', 'card-bottom'); bottom.append(el('h2', '', item.title));
    const arrow = el('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true');
    if (item.type === 'product') { const link = el('a', 'card-action'); link.append(arrow); link.href = safeUrl(item.url); link.target = '_blank'; link.rel = item.affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'; link.setAttribute('aria-label', `Open: ${item.title}`); bottom.append(link); }
    else { const button = el('button', 'card-action'); button.append(arrow); button.type = 'button'; button.setAttribute('aria-label', `Open prompt: ${item.title}`); button.addEventListener('click', () => openPrompt(item)); bottom.append(button); }
    card.append(bottom); return card;
}

function openPrompt(item) {
  activePrompt = item;
  $('prompt-title').textContent = item.title; $('prompt-category').textContent = item.category; $('prompt-description').textContent = item.description; $('prompt-text').textContent = item.prompt; $('copy-feedback').textContent = '';
  dialog.setAttribute('aria-labelledby', 'prompt-title'); dialog.setAttribute('aria-describedby', 'prompt-description');
  updateAddress(item.id); if (!dialog.open) dialog.showModal();
}
async function copy(text, success, copyingLink = false) {
  try { await navigator.clipboard.writeText(text); $('copy-feedback').textContent = success; }
  catch { if (copyingLink) { $('copy-feedback').textContent = 'Copy was unavailable. Copy the link from your browser’s address bar.'; return; } const range = document.createRange(); range.selectNodeContents($('prompt-text')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('copy-feedback').textContent = 'Copy was unavailable. Select the prompt text and copy it manually.'; }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => chooseType(tab.dataset.type));
  tab.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[1] : tabs.find(t => t !== tab); chooseType(next.dataset.type); next.focus(); });
}
$('search').addEventListener('input', render); $('category').addEventListener('change', render);
$('close-dialog').addEventListener('click', () => dialog.close()); dialog.addEventListener('close', () => updateAddress());
$('copy-prompt').addEventListener('click', () => activePrompt && copy(activePrompt.prompt, 'Prompt copied.'));
$('copy-link').addEventListener('click', () => activePrompt && copy(location.href, 'Link copied.', true));
chooseType(type, false);
try {
  const response = await fetch('./content.json', { cache: 'no-store' }); if (!response.ok) throw new Error('Content is unavailable');
  const data = await response.json(); entries = visibleEntries(data); collections = data.collections || [];
  if (!collections.some(c => c.id === activeCollection)) activeCollection = '';
  loaded = true;
  $('preview-note').hidden = data.preview !== true;
  $('products-count').textContent = entries.filter(item => item.type === 'product').length; $('prompts-count').textContent = entries.filter(item => item.type === 'prompt').length;
  chooseType(type, false); $('results').setAttribute('aria-busy', 'false');
  let hash = ''; try { hash = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore malformed links. */ }
  const selected = entries.find(item => item.id === hash);
  if (selected) {
    if (activeCollection && selected.collectionId !== activeCollection) activeCollection = selected.collectionId || '';
    chooseType(selected.type, false);
    if (selected.type === 'prompt') openPrompt(selected); else document.getElementById(selected.id)?.scrollIntoView();
  }
  if (data.preview !== true) offerQuickAccess();
} catch { $('results').setAttribute('aria-busy', 'false'); $('results-count').textContent = ''; state('The Vault is unavailable right now.', 'Please reload the page or check back in a moment.'); }
