export function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function validateContent(data) {
  if (!data || !Array.isArray(data.entries)) throw new Error('The content file needs an entries list.');
  if (data.collections !== undefined && !Array.isArray(data.collections)) throw new Error('Collections must be a list.');
  const collectionIds = new Set();
  for (const collection of data.collections || []) {
    if (!collection || typeof collection.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection.id) || collectionIds.has(collection.id)) throw new Error('Each collection needs a unique lowercase ID.');
    if (typeof collection.title !== 'string' || !collection.title.trim()) throw new Error('Each collection needs a title.');
    if (collection.url && !safeUrl(collection.url)) throw new Error('The reel link must be a full http or https URL.');
    collectionIds.add(collection.id);
  }
  const ids = new Set();
  for (const [i, item] of data.entries.entries()) {
    const label = `Entry ${i + 1}`;
    if (!item || !['product', 'prompt'].includes(item.type)) throw new Error(`${label}: choose product or prompt.`);
    if (typeof item.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id)) throw new Error(`${label}: use a unique ID with lowercase letters, numbers and hyphens.`);
    ids.add(item.id);
    if (item.collectionId !== undefined && !collectionIds.has(item.collectionId)) throw new Error(`${label}: choose an existing reel collection.`);
    for (const key of ['title', 'category', 'description']) if (typeof item[key] !== 'string' || !item[key].trim()) throw new Error(`${label}: ${key} is required.`);
    if (typeof item.published !== 'boolean') throw new Error(`${label}: published must be true or false.`);
    if (item.type === 'product' && !safeUrl(item.url)) throw new Error(`${label}: a full http or https product URL is required.`);
    if (item.type === 'prompt' && (typeof item.prompt !== 'string' || !item.prompt.trim())) throw new Error(`${label}: prompt text is required.`);
    if (item.affiliate !== undefined && typeof item.affiliate !== 'boolean') throw new Error(`${label}: affiliate must be true or false.`);
    if (item.image && !safeUrl(item.image)) throw new Error(`${label}: image must be an http or https URL.`);
    if (item.updated && (typeof item.updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.updated) || Number.isNaN(Date.parse(item.updated)))) throw new Error(`${label}: use a date in YYYY-MM-DD format.`);
  }
  return data;
}
export function visibleEntries(data) { return validateContent(data).entries.filter(item => item.published); }
export function searchEntries(entries, type, query = '', category = '', collections = []) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(item => item.type === type && (!category || item.category === category) && words.every(word => `${item.title} ${item.description} ${item.category} ${item.prompt || ''} ${collections.find(c => c.id === item.collectionId)?.title || ''}`.toLowerCase().includes(word)));
}
