import { visibleEntries, searchEntries, safeUrl } from './lib.mjs';
const $ = id => document.getElementById(id);
const tabs = [...document.querySelectorAll('[role="tab"]')];
let entries = [], type = new URLSearchParams(location.search).get('type') === 'prompts' ? 'prompt' : 'product', activePrompt = null, loaded = false;
const dialog = $('prompt-dialog');
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function state(title, text) { const box = el('div', 'state'); box.append(el('strong', '', title), el('span', '', text)); $('results').replaceChildren(box); }
function updateAddress(id = '') { const url = new URL(location.href); url.searchParams.set('type', type === 'prompt' ? 'prompts' : 'products'); url.hash = id; history.replaceState(null, '', url); }
function chooseType(next, update = true) {
  type = next;
  for (const tab of tabs) { const selected = tab.dataset.type === type; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; }
  $('results').setAttribute('aria-labelledby', `${type === 'product' ? 'products' : 'prompts'}-tab`);
  const categories = [...new Set(entries.filter(item => item.type === type).map(item => item.category))].sort();
  $('category').replaceChildren(new Option('All categories', ''), ...categories.map(c => new Option(c, c)));
  if (update) updateAddress();
  if (loaded) render();
}
function render() {
  const list = searchEntries(entries, type, $('search').value, $('category').value);
  $('results-count').textContent = `${list.length} ${type === 'product' ? (list.length === 1 ? 'product' : 'products') : (list.length === 1 ? 'prompt' : 'prompts')}`;
  $('affiliate-note').hidden = !list.some(item => item.type === 'product' && item.affiliate);
  if (!list.length) { const hasItems = entries.some(item => item.type === type); state(hasItems ? 'Nothing matches yet.' : `${type === 'product' ? 'Product links' : 'Prompts'} are coming soon.`, hasItems ? 'Try another search or choose All categories.' : 'Check back here for the next additions to the Vault.'); return; }
  const cards = list.map(item => {
    const card = el('article', 'card'); card.id = item.id;
    if (item.image && safeUrl(item.image)) { const image = el('img', 'card-image'); image.src = safeUrl(item.image); image.alt = item.title; image.loading = 'lazy'; image.addEventListener('error', () => image.remove(), { once: true }); card.append(image); }
    const meta = el('div', 'card-meta'); meta.append(el('span', 'category', item.category));
    if (item.affiliate) meta.append(el('span', 'affiliate-label', 'Affiliate'));
    card.append(meta, el('h2', '', item.title), el('p', '', item.description));
    const bottom = el('div', 'card-bottom');
    if (item.type === 'product') { const link = el('a', 'card-action', item.retailer ? `View on ${item.retailer}` : 'View product'); link.href = safeUrl(item.url); link.target = '_blank'; link.rel = item.affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'; link.setAttribute('aria-label', `${link.textContent}: ${item.title}`); bottom.append(link); }
    else { const button = el('button', 'card-action', 'Open prompt'); button.type = 'button'; button.setAttribute('aria-label', `Open prompt: ${item.title}`); button.addEventListener('click', () => openPrompt(item)); bottom.append(button); }
    if (item.updated) { const date = el('time', 'card-date', new Date(`${item.updated}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })); date.dateTime = item.updated; bottom.append(date); }
    card.append(bottom); return card;
  });
  $('results').replaceChildren(...cards);
}
function openPrompt(item) {
  activePrompt = item;
  $('prompt-title').textContent = item.title; $('prompt-category').textContent = item.category; $('prompt-description').textContent = item.description; $('prompt-text').textContent = item.prompt; $('copy-feedback').textContent = '';
  dialog.setAttribute('aria-labelledby', 'prompt-title'); dialog.setAttribute('aria-describedby', 'prompt-description');
  updateAddress(item.id); if (!dialog.open) dialog.showModal();
}
async function copy(text, success) {
  try { await navigator.clipboard.writeText(text); $('copy-feedback').textContent = success; }
  catch { const range = document.createRange(); range.selectNodeContents($('prompt-text')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('copy-feedback').textContent = 'Copy was unavailable. Select the prompt text and copy it manually.'; }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => chooseType(tab.dataset.type));
  tab.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[1] : tabs.find(t => t !== tab); chooseType(next.dataset.type); next.focus(); });
}
$('search').addEventListener('input', render); $('category').addEventListener('change', render);
$('close-dialog').addEventListener('click', () => dialog.close()); dialog.addEventListener('close', () => updateAddress());
$('copy-prompt').addEventListener('click', () => activePrompt && copy(activePrompt.prompt, 'Prompt copied.'));
$('copy-link').addEventListener('click', () => activePrompt && copy(location.href, 'Link copied.'));
chooseType(type, false);
try {
  const response = await fetch('./content.json', { cache: 'no-store' }); if (!response.ok) throw new Error('Content is unavailable');
  const data = await response.json(); entries = visibleEntries(data); loaded = true;
  $('preview-note').hidden = data.preview !== true;
  $('products-count').textContent = entries.filter(item => item.type === 'product').length; $('prompts-count').textContent = entries.filter(item => item.type === 'prompt').length;
  chooseType(type, false); $('results').setAttribute('aria-busy', 'false');
  let hash = ''; try { hash = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore malformed links. */ }
  const selected = entries.find(item => item.id === hash);
  if (selected) { chooseType(selected.type, false); if (selected.type === 'prompt') openPrompt(selected); else document.getElementById(selected.id)?.scrollIntoView(); }
} catch { $('results').setAttribute('aria-busy', 'false'); $('results-count').textContent = ''; state('The Vault is unavailable right now.', 'Please reload the page or check back in a moment.'); }
