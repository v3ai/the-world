#!/usr/bin/env node
/* Checks one cell-type spec, or all of them.
     node tools/cells/check.mjs data/cells/<id>.json      (one spec)
     node tools/cells/check.mjs                           (every spec, and data/cells/_inventory.json)
   Exit code 1 on any error. The format: docs/CONTENT.md, "A cell type"; the shapes and their parameters: data/cells/_shapes.json.
   It checks that
   - the id is the file's name, and the name, organism, species, blurb, note, shape, parts, reached, view and sources are there;
   - the note begins "Model", names the species the measurements come from, and says what is measured and what is illustrative;
   - the shape is one of the vocabulary, each of its parameters is known and in range (text parameters: one of the allowed values);
   - every number given as {value: ...} says whether it is measured; a measured one names a source (or gives `calc` from one), and
     each source it names is listed in `sources`, with a citation, a link and the date it was opened;
   - a number with a range lies inside it;
   - the nucleus has a count; the organelles' volume fractions are between 0 and 1;
   - every part names a material of data/descent/materials.json (so the descent goes on from it) and a card that is a node in data/nodes, or null;
   - the colours say their convention; the cut says what it shows;
   - nothing in the reader's text calls the cell "generic";
   - `reached` names places: tissue kinds of FT.tissue, materials, tissue scenes of data/things/tissues and their structures, and each of those
     materials and structures leads to this very cell (a material's first constituent is cell:<id>);
   - the inventory lists the spec (spec: true), and every inventory entry marked spec: true has a file. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const J = p => JSON.parse(readFileSync(p.startsWith('/') ? p : join(ROOT, p), 'utf8'));
const SHAPES = J('data/cells/_shapes.json').shapes;
const MATS = J('data/descent/materials.json').materials;
const NODES = new Set();
for (const f of readdirSync(join(ROOT, 'data/nodes'))) { if (!f.endsWith('.json') || f === 'manifest.json') continue; const d = J('data/nodes/' + f), L = Array.isArray(d) ? d : (d.nodes ? (Array.isArray(d.nodes) ? d.nodes : Object.values(d.nodes)) : Object.values(d)); for (const n of L) if (n && n.id) NODES.add(n.id); }
const TISSUE_KINDS = new Set(['cardiac', 'skeletal', 'smooth', 'blood', 'bone', 'cartilage', 'adipose', 'nervous', 'alveoli', 'villi', 'liver', 'epithelium']);   // FT.tissue, js/nodes.js
const T2 = {}; for (const f of readdirSync(join(ROOT, 'data/things/tissues'))) if (f.endsWith('.json')) { const d = J('data/things/tissues/' + f); T2[d.id] = d; }
const INV = J('data/cells/_inventory.json');
const A2 = J('data/descent/assign/tissue2.json');
let errors = 0;

function checkSpec(file) {
  const E = [], W = [], err = m => E.push(m), warn = m => W.push(m);
  let S; try { S = J(resolve(file)); } catch (e) { console.log(`FAIL ${file}: not readable JSON (${e.message})`); errors++; return; }
  const id = basename(file, '.json');
  if (S.id !== id) err(`id "${S.id}" is not the file's name "${id}"`);
  for (const k of ['name', 'organism', 'species', 'blurb', 'note', 'shape', 'parts', 'reached', 'view', 'sources', 'cut', 'colours', 'nucleus']) if (S[k] === undefined) err(`no "${k}"`);
  /* the note */
  const note = S.note || '';
  if (!/^Model\b/.test(note)) err('the note does not begin "Model"');
  if (!/\bmeasured\b/i.test(note)) err('the note does not say what is measured');
  if (!/\billustrative\b/i.test(note)) err('the note does not say what is illustrative');
  const sp = { 'Homo sapiens': /human/i, 'Canis familiaris': /dog/i, 'Erithacus rubecula': /robin/i, 'Apis mellifera': /bee/i };
  if (S.species && !(sp[S.species] ? sp[S.species].test(note) : note.includes(S.species))) err(`the note does not name the species the measurements come from (${S.species})`);
  /* reader's text */
  const reader = [S.name, S.blurb, S.note, ...(S.about || []), ...Object.values(S.parts || {}).map(p => (p.name || '') + ' ' + (p.about || ''))].join(' ');
  if (/generic/i.test(reader)) err('the reader\'s text calls it "generic"');
  if (S.card !== null && S.card !== undefined && !NODES.has(S.card)) err(`card "${S.card}" is not a node in data/nodes`);
  /* the shape */
  const sh = S.shape || {}, V = SHAPES[sh.type];
  if (!V) err(`shape "${sh.type}" is not in the vocabulary (${Object.keys(SHAPES).join(', ')})`);
  else for (const [k, v] of Object.entries(sh)) {
    if (k === 'type') continue; const P = V.params[k]; if (!P) { err(`shape ${sh.type}: unknown parameter "${k}"`); continue; }
    if (typeof P[0] === 'number') { if (typeof v !== 'number' || v < P[0] || v > P[1]) err(`shape ${sh.type}: ${k} = ${v} is outside ${P[0]}..${P[1]} ${P[3]}`); }
    else if (P[0] === 'list') { if (!Array.isArray(v)) err(`shape ${sh.type}: ${k} must be a list`); }
    else { const allowed = P.slice(0, P.length - 3).filter((x, i, a) => a.indexOf(x) === i); if (!allowed.includes(v)) err(`shape ${sh.type}: ${k} = "${v}" is not one of ${allowed.join(', ')}`); }
  }
  /* every {value} */
  const src = S.sources || {};
  for (const [k, s] of Object.entries(src)) { if (!s.cite) err(`source ${k}: no citation`); if (!s.url) err(`source ${k}: no link`); if (!s.opened) err(`source ${k}: no date it was opened`); }
  const walk = (o, path) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
    if ('value' in o) {
      if (typeof o.measured !== 'boolean') err(`${path}: says neither measured: true nor measured: false`);
      if (o.measured && !o.source) err(`${path}: measured, but names no source`);
      if (o.range && typeof o.value === 'number' && (o.value < o.range[0] || o.value > o.range[1])) err(`${path}: ${o.value} is outside its range ${o.range}`);
    }
    for (const k of ['source', 'also', 'size_source', 'position_source', 'absent_source']) if (typeof o[k] === 'string' && !src[o[k]]) err(`${path}: source "${o[k]}" is not in sources`);
    for (const [k, v] of Object.entries(o)) if (k !== 'sources') walk(v, path ? `${path}.${k}` : k);
  };
  walk(S, '');
  const body = JSON.stringify(Object.assign({}, S, { sources: undefined }));
  for (const k of Object.keys(src)) if (!new RegExp(`\\b${k}\\b`).test(body)) warn(`source ${k} is listed but not used`);
  /* nucleus and organelles */
  const nu = S.nucleus || {};
  if (typeof nu.count !== 'number') err('nucleus: no count');
  for (const [k, o] of Object.entries(S.organelles || {})) if (o && o.volume_fraction && !(o.volume_fraction.value > 0 && o.volume_fraction.value < 1)) err(`organelles.${k}: volume fraction ${o.volume_fraction.value} is not between 0 and 1`);
  if (nu.volume_fraction && !(nu.volume_fraction.value > 0 && nu.volume_fraction.value < 1)) err('nucleus: volume fraction not between 0 and 1');
  /* parts */
  for (const [pid, p] of Object.entries(S.parts || {})) {
    if (!p.name) err(`part ${pid}: no name`);
    if (!p.material) err(`part ${pid}: no material (the descent cannot go on from it)`); else if (!MATS[p.material]) err(`part ${pid}: material "${p.material}" is not in data/descent/materials.json`);
    if (p.card === undefined) err(`part ${pid}: no card field (a node id, or null with "about" words)`); else if (p.card !== null && !NODES.has(p.card)) err(`part ${pid}: card "${p.card}" is not a node in data/nodes`);
    if (p.card === null && !p.about) err(`part ${pid}: no card and no "about" words for its panel`);
  }
  for (const need of ['nucleus']) if (nu.count > 0 && !(S.parts || {})[need]) err(`a cell with a nucleus needs a "${need}" part`);
  if (!S.colours || !S.colours.convention) err('colours: no convention');
  if (!S.cut || S.cut.length < 20) err('cut: does not say what the cut shows');
  /* reached */
  const R = S.reached || {};
  for (const t of R.tissue || []) { if (!TISSUE_KINDS.has(t.kind)) err(`reached.tissue: no tissue kind "${t.kind}"`); if (!t.id) err('reached.tissue: no pick id'); if (t.organ) { try { new RegExp(t.organ); } catch (e) { err(`reached.tissue: organ is not a regular expression (${t.organ})`); } } }
  for (const m of R.materials || []) { if (!MATS[m]) err(`reached.materials: no material "${m}"`); else if (!(MATS[m].inside || []).some(c => c.scene === 'cell:' + id)) err(`reached.materials: material "${m}" does not lead to the scene cell:${id}`); }
  for (const t of R.tissue2 || []) { const d = T2[t.scene]; if (!d) { err(`reached.tissue2: no tissue scene "${t.scene}"`); continue; }
    const p = (d.populations || []).find(q => q.id === t.structure); if (!p) { err(`reached.tissue2: scene ${t.scene} has no structure "${t.structure}"`); continue; }
    /* the structure must open this cell: its material (or the one data/descent/assign/tissue2.json puts over it) leads first to cell:<id>, and no `deeper` of its own comes before it */
    const over = ((A2.sub || {})[t.scene] || {}).over || {}, mat = over[t.structure] || p.material, first = mat && MATS[mat] && (MATS[mat].inside || []).find(c => c.scene || c.material);
    if (p.deeper) err(`reached.tissue2: ${t.scene}.${t.structure} has a deeper of its own (${JSON.stringify(p.deeper)}), which comes before its material`);
    else if (!first || first.scene !== 'cell:' + id) err(`reached.tissue2: ${t.scene}.${t.structure} is made of "${mat}", which does not lead first to cell:${id} (node tools/cells/wire.mjs, then the tissue generators)`); }
  if (!R.landmark && !(R.tissue || []).length && !(R.materials || []).length && !(R.tissue2 || []).length) err('reached: it is not reached from anywhere');
  /* view */
  const v = S.view || {};
  for (const k of ['radius_um', 'r1_m', 'arrive_m']) if (!(v[k] > 0)) err(`view.${k} missing`);
  if (v.arrive_m >= v.r1_m) err('view.arrive_m must be inside r1_m (the frame would fade out on arrival)');
  /* inventory */
  const ie = (INV.types || []).find(t => t.id === id);
  if (!ie) err('not in data/cells/_inventory.json'); else if (!ie.spec) err('the inventory does not mark it spec: true');
  console.log(`${E.length ? 'FAIL' : 'OK  '} ${file}${E.length ? '' : ` (${S.shape && S.shape.type}, ${Object.keys(S.parts || {}).length} parts, ${Object.keys(src).length} sources)`}`);
  for (const m of E) console.log('   error: ' + m);
  for (const m of W) console.log('   note: ' + m);
  errors += E.length;
}

const args = process.argv.slice(2);
if (args.length) args.forEach(checkSpec);
else {
  const files = readdirSync(join(ROOT, 'data/cells')).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  files.forEach(f => checkSpec(join(ROOT, 'data/cells', f)));
  const ids = new Set((INV.types || []).map(t => t.id));
  if (ids.size !== (INV.types || []).length) { console.log('FAIL inventory: an id is listed twice'); errors++; }
  for (const t of INV.types || []) {
    for (const k of ['id', 'name', 'organism', 'reached_from', 'shape_hint']) if (!t[k] || (Array.isArray(t[k]) && !t[k].length)) { console.log(`FAIL inventory ${t.id}: no ${k}`); errors++; }
    if (t.spec && !existsSync(join(ROOT, 'data/cells', t.id + '.json'))) { console.log(`FAIL inventory ${t.id}: marked spec: true but data/cells/${t.id}.json is missing`); errors++; }
  }
  console.log(`inventory: ${INV.types.length} cell types, ${INV.types.filter(t => t.spec).length} with a spec`);
}
console.log(errors ? `${errors} error(s)` : 'OK');
process.exit(errors ? 1 : 0);
