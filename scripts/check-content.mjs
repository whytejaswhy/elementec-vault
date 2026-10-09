import { readFile } from 'node:fs/promises';
import { validateContent } from '../site/lib.mjs';
const data = validateContent(JSON.parse(await readFile(new URL('../site/content.json', import.meta.url), 'utf8')));
console.log(`Content valid: ${data.entries.length} entries.`);
