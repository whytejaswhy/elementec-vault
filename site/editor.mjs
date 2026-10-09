import { validateContent } from './lib.mjs?v=d710948';
const $ = id => document.getElementById(id);
let data = { entries: [], collections: [] }, currentId = null, dirty = false, formDirty = false, ready = false;
const status = text => { $('editor-status').textContent = text; };
function setDirty(value) { dirty = value; $('download').disabled = !ready; }
function refreshList() {
  const nodes = data.entries.map(item => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = item.title; button.setAttribute('aria-pressed', String(item.id === currentId));
    const meta = document.createElement('span'); meta.textContent = `${item.type === 'product' ? 'Product' : 'Prompt'} · ${item.category}${item.collectionId ? ' · ' + data.collections.find(c => c.id === item.collectionId)?.title : ''}${item.published ? '' : ' · Hidden'}`; button.append(meta);
    button.addEventListener('click', () => { if (formDirty && !confirm('Discard the changes in this form?')) return; fill(item); }); return button;
  });
  if (!nodes.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Your Vault is ready for its first entry.'; nodes.push(empty); }
  $('entries-list').replaceChildren(...nodes);
  $('reel-titles').replaceChildren(...data.collections.map(c => new Option(c.title, c.title)));
  $('categories').replaceChildren(...[...new Set(data.entries.map(e => e.category))].sort().map(c => new Option(c, c)));
}
function showType() { const isProduct = $('entry-type').value === 'product'; $('product-fields').hidden = !isProduct; $('prompt-fields').hidden = isProduct; $('entry-url').required = isProduct; $('entry-prompt').required = !isProduct; for (const input of $('product-fields').querySelectorAll('input')) input.disabled = !isProduct; $('entry-prompt').disabled = isProduct; }
function fill(item = null) {
  currentId = item?.id || null; $('entry-form').reset();
  $('entry-type').value = item?.type || 'product';
  for (const key of ['title', 'category', 'description', 'url', 'retailer', 'image', 'prompt']) $(`entry-${key}`).value = item?.[key] || '';
  const collection = data.collections.find(c => c.id === item?.collectionId);
  $('entry-collection').value = collection?.title || ''; $('entry-reel-url').value = collection?.url || '';
  $('entry-affiliate').checked = !!item?.affiliate; $('entry-published').checked = item ? item.published : true;
  $('form-heading').textContent = item ? 'Edit entry' : 'Add an entry'; $('remove-entry').hidden = !item; formDirty = false; showType(); refreshList();
}
function createId(title) { const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'entry'; let id = base, n = 2; while (data.entries.some(e => e.id === id)) id = `${base}-${n++}`; return id; }
$('entry-type').addEventListener('change', showType);
$('entry-collection').addEventListener('input', () => {
  const collection = data.collections.find(c => c.title.toLowerCase() === $('entry-collection').value.trim().toLowerCase());
  if (collection) $('entry-reel-url').value = collection.url || '';
});
$('entry-form').addEventListener('input', () => { formDirty = true; });
$('new-entry').addEventListener('click', () => { if (formDirty && !confirm('Discard the changes in this form?')) return; fill(); $('entry-title').focus(); });
$('entry-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!ready) return status('Wait for your existing content to load, or open a content file first.');
  const value = key => $(`entry-${key}`).value.trim();
  const item = { id: currentId || createId(value('title')), type: value('type'), title: value('title'), category: value('category'), description: value('description'), published: $('entry-published').checked, updated: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) };
  if (item.type === 'product') { item.url = value('url'); item.affiliate = $('entry-affiliate').checked; if (value('retailer')) item.retailer = value('retailer'); if (value('image')) item.image = value('image'); }
  else item.prompt = value('prompt');
  let collections = data.collections.map(c => ({ ...c }));
  if (value('reel-url') && !value('collection')) return status('Add a reel title before adding its link.');
  if (value('collection')) {
    let collection = collections.find(c => c.title.toLowerCase() === value('collection').toLowerCase());
    if (!collection) {
      const base = value('collection').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'reel';
      let id = base, n = 2; while (collections.some(c => c.id === id)) id = `${base}-${n++}`;
      collection = { id, title: value('collection') }; collections.unshift(collection);
    }
    if (value('reel-url')) collection.url = value('reel-url');
    else if (currentId && data.entries.find(e => e.id === currentId)?.collectionId === collection.id) delete collection.url;
    item.collectionId = collection.id;
  }
  const next = { collections, entries: currentId ? data.entries.map(e => e.id === currentId ? item : e) : [item, ...data.entries] };
  try { validateContent(next); data = next; setDirty(true); fill(item); status('Entry saved to your working file. Download changes, then upload to GitHub to publish.'); } catch (error) { status(error.message); }
});
$('remove-entry').addEventListener('click', () => { if (!currentId || !confirm('Remove this entry from your working file? The live Vault changes only after you upload the file.')) return; data.entries = data.entries.filter(e => e.id !== currentId); setDirty(true); fill(); status('Entry removed from your working file. Download and upload to publish the change.'); });
$('download').addEventListener('click', () => {
  if (formDirty) return status('Save the entry in the form before downloading your changes.');
  try { validateContent(data); const url = URL.createObjectURL(new Blob([JSON.stringify({ entries: data.entries, collections: data.collections }, null, 2) + '\n'], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'content.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); setDirty(false); status('Download started. Upload content.json to the site folder in GitHub and commit your changes.'); } catch (error) { status(error.message); }
});
$('import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  if ((dirty || formDirty) && !confirm('Replace the current working file with this file? Download your changes first if you want to keep them.')) { event.target.value = ''; return; }
  try { const imported = validateContent(JSON.parse(await file.text())); data = { entries: imported.entries, collections: imported.collections || [] }; ready = true; setDirty(true); fill(); status(`Opened ${data.entries.length} entries. Changes stay in this page until downloaded.`); } catch (error) { status(`Could not open file: ${error.message}`); } event.target.value = '';
});
window.addEventListener('beforeunload', event => { if (dirty || formDirty) { event.preventDefault(); event.returnValue = ''; } });
showType();
try { const response = await fetch('./content.json', { cache: 'no-store' }); if (!response.ok) throw new Error(); const loaded = validateContent(await response.json()); data = { entries: loaded.entries, collections: loaded.collections || [] }; ready = true; setDirty(false); fill(); status('Current content loaded.'); } catch { refreshList(); status('Could not load existing content. Reload or open a saved content file before making changes.'); }
