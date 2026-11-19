// Shared loader for the node-side tools: builds the search index from data/search/*.json exactly as the browser does.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..', '..');
const require = createRequire(import.meta.url);
export const SC = require(path.join(root, 'js', 'search.js'));
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
export function load() {
  const ix = J('data/search/index.json'), al = J('data/search/aliases.json');
  const t = performance.now(); const idx = SC.build({ entities: ix.e, aliases: al.aliases, sources: al.sources }); idx.buildMs = performance.now() - t;
  return idx;
}
export { root };
