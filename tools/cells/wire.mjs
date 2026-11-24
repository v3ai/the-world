#!/usr/bin/env node
/* Wires every cell-type spec to the places that reach it through the table of what things are made of.
     node tools/cells/wire.mjs [--skip=id,id]    (from the repository root; then run the tissue generators and tools/descent/check.mjs)
   For each spec data/cells/<id>.json:
   - the material that opens it: the first of its reached.materials, else a material of its own id. That material's first constituent is
     made {scene: "cell:<id>"} (a row is added for a spec that has none, with the spec's name, card and one-line summary);
   - every tissue-scene structure in its reached.tissue2 gets that material in tools/things/content/tissue_materials.json, which the scene
     generators apply (tools/things/content/tissue_material.py; a structure whose material opens a spec loses its own `deeper`).
   It prints what it changed. Nothing else is touched: FT.tissue picks reach their spec through CELLS.specFor (js/nodes.js). */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const J = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const MF = 'data/descent/materials.json', TF = 'tools/things/content/tissue_materials.json';
const T = J(MF), M = T.materials, TM = J(TF);
const skip = new Set(process.argv.filter(a => a.startsWith('--skip=')).flatMap(a => a.slice(7).split(',')));   // specs left unwired for now
const specs = readdirSync(join(ROOT, 'data/cells')).filter(f => f.endsWith('.json') && !f.startsWith('_')).map(f => J('data/cells/' + f)).filter(S => !skip.has(S.id));
const first = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); const i = t.search(/[:.;](\s|$)/); return i > 20 ? t.slice(0, i) + '.' : t; };
const art = n => /^[aeiou]/i.test(n) ? 'an ' : 'a ';
let changed = 0; const say = m => { console.log(m); changed++; };
for (const S of specs) {
  const R = S.reached || {}, mid = (R.materials || [])[0] || S.id, scene = 'cell:' + S.id;
  if (!R.materials && !(R.tissue2 || []).length) continue;
  let m = M[mid];
  if (!m) { m = M[mid] = { title: S.name, desc: first(S.blurb), card: S.card || null, inside: [], src: `data/cells/${S.id}.json` }; say(`material ${mid}: added`); }
  const i = (m.inside || []).findIndex(c => c.scene === scene);
  if (i !== 0) {
    m.inside = m.inside || []; if (i > 0) m.inside.splice(i, 1);
    m.inside.unshift({ name: art(S.name) + S.name.charAt(0).toLowerCase() + S.name.slice(1), scene, title: S.name });
    if (!String(m.src || '').includes(`data/cells/${S.id}.json`)) m.src = (m.src ? m.src + '; ' : '') + `data/cells/${S.id}.json`;
    say(`material ${mid}: opens ${scene} first`);
  }
  for (const t of R.tissue2 || []) { const row = TM[t.scene] = TM[t.scene] || {}; if (row[t.structure] !== mid) { say(`tissue ${t.scene}.${t.structure}: ${row[t.structure] || '(none)'} -> ${mid}`); row[t.structure] = mid; } }
}
if (changed) { writeFileSync(join(ROOT, MF), JSON.stringify(T, null, 1) + '\n'); writeFileSync(join(ROOT, TF), JSON.stringify(TM, null, 1)); }
console.log(changed ? `${changed} change(s)` : 'nothing to change');
