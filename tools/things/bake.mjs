#!/usr/bin/env node
// Bake a model script into data/things/<id>/.   Usage: node tools/things/bake.mjs <id> [<id> ...]
// A model script (tools/things/models/<id>.mjs) exports `thing` (the schema, see SCHEMA.md) and a default function build(L) -> { meshes, instances }.
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
import * as L from './lib/index.mjs';
import { assemble } from './lib/export.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../..');
const ids = process.argv.slice(2);
if (!ids.length) { console.error('usage: node tools/things/bake.mjs <id> ...'); process.exit(2); }
let bad = 0;
for (const id of ids) {
  const mod = await import(pathToFileURL(path.join(here, 'models', id + '.mjs')).href);
  const t0 = Date.now(), built = await mod.default(L), { thing, mesh, problems } = assemble({ ...built, thing: built.thing || mod.thing });
  const dir = path.join(root, 'data/things', id); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'thing.json'), JSON.stringify(thing, null, 1));
  fs.writeFileSync(path.join(dir, 'mesh.json'), JSON.stringify(mesh));
  const kb = Math.round(fs.statSync(path.join(dir, 'mesh.json')).size / 1024);
  console.log(`${id}: ${thing.parts.length} parts, ${thing.stats.uniqueMeshTris} unique triangles, mesh.json ${kb} kB, ${Date.now() - t0} ms`);
  for (const p of thing.parts) console.log(`  ${p.id.padEnd(18)} ${p.system.padEnd(10)} ${String(p.tris).padStart(7)} tris${p.count ? ' x' + p.count : ''}${p.lod ? ' [' + p.lod + ']' : ''}`);
  for (const p of problems) { console.error('  PROBLEM: ' + p); bad++; }
}
process.exit(bad ? 1 : 0);
