import { readFile } from 'node:fs/promises';
import { validateContent } from '../site/lib.mjs';

for (const vault of ['elementec', 'auto']) {
  const file = new URL(`../site/${vault}/content.json`, import.meta.url);
  const data = validateContent(JSON.parse(await readFile(file, 'utf8')));
  console.log(`${vault}: ${data.entries.length} valid entries.`);
}
