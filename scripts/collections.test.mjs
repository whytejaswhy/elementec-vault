import test from 'node:test';
import assert from 'node:assert/strict';
import { updateCollection, validateContent, searchEntries, assignCollectionTones, collectionTone, groupReelEntries, COLLECTION_TONES } from '../site/lib.mjs';
const data = {
  collections: [{ id: 'first-reel', title: 'Original collection' }],
  entries: Array.from({ length: 4 }, (_, i) => ({
    id: `phone-${i + 1}`, type: 'product', title: `Phone ${i + 1}`, category: 'Phones',
    description: 'Test product', url: 'https://example.com/product', published: true, collectionId: 'first-reel'
  }))
};
const current = data.collections[0];

test('renaming a collection preserves its shared ID and all four product memberships', () => {
  const renamed = updateCollection(data.collections, current.id, 'A title chosen by the team', 'https://example.com/reel');
  const next = validateContent({ ...data, collections: renamed.collections });
  assert.equal(renamed.collectionId, current.id);
  assert.equal(next.entries.filter(e => e.collectionId === renamed.collectionId).length, 4);
  assert.equal(searchEntries(next.entries, 'product', 'chosen by the team', '', next.collections).length, 4);
  assert.equal(data.collections[0].title, 'Original collection');
  assert.deepEqual(next.entries, data.entries);
});

test('creating another reel does not merge it with an existing collection of the same title', () => {
  const result = updateCollection(data.collections, '__new__', current.title);
  assert.notEqual(result.collectionId, current.id);
  assert.equal(result.collections.length, data.collections.length + 1);
  const second = updateCollection(result.collections, '__new__', current.title);
  assert.notEqual(second.collectionId, result.collectionId);
});

test('titles require human input and links remain safe', () => {
  assert.throws(() => updateCollection(data.collections, '__new__', ' '), /collection title/);
  assert.throws(() => updateCollection(data.collections, current.id, 'Title', 'javascript:alert(1)'), /reel link/);
  assert.throws(() => updateCollection(data.collections, 'missing-id', 'Title'), /existing collection/);
  assert.equal(updateCollection(data.collections, '').collectionId, undefined);
});
test('collection colors use the theme palette and survive renaming and serialization', () => {
  const assigned = assignCollectionTones([{ id: 'one', title: 'One' }, { id: 'two', title: 'Two' }, { id: 'three', title: 'Three' }], () => 0.8);
  assert.equal(new Set(assigned.map(c => c.tone)).size, COLLECTION_TONES.length);
  const renamed = updateCollection(assigned, 'one', 'Renamed');
  const saved = JSON.parse(JSON.stringify(renamed.collections));
  assert.equal(collectionTone(saved[0]), assigned[0].tone);
  assert.deepEqual(assignCollectionTones(saved, () => 0), saved);
  assert.equal(collectionTone({ id: 'legacy' }), collectionTone({ id: 'legacy' }));
  assert.throws(() => validateContent({ entries: [], collections: [{ id: 'invalid', title: 'Invalid', tone: 'red' }] }), /theme palette/);
});
test('same-reel products stay adjacent without combining unrelated products', () => {
  const entries = [{ id: 'one', collectionId: 'reel-a' }, { id: 'single' }, { id: 'two', collectionId: 'reel-b' }, { id: 'three', collectionId: 'reel-a' }, { id: 'four', collectionId: 'reel-b' }, { id: 'another-single' }];
  assert.deepEqual(groupReelEntries(entries).map(e => e.id), ['one', 'three', 'single', 'two', 'four', 'another-single']);
  assert.equal(groupReelEntries(entries).length, entries.length);
  assert.equal(entries[1].id, 'single');
});
