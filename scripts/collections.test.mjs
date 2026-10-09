import test from 'node:test';
import assert from 'node:assert/strict';
import { updateCollection, validateContent, searchEntries } from '../site/lib.mjs';
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
