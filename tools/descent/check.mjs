#!/usr/bin/env node
/* Proves that the table of what everything is made of holds together.
     node tools/descent/check.mjs          (from the repository root; exit code 1 on any failure)
   For data/descent/materials.json and data/descent/assign/*.json it checks that
   - every material has a title, a one-line description and either `inside` (at least one constituent with a scene or a material) or a `stop` sentence;
   - every card (node id) exists in data/nodes; every scene exists: tissue scenes in data/things/tissues, FT.tissue kinds, cell types, micro kinds
     (read from js/world_matter.js), molecules in data/molecules_all.json, crystals in data/crystals.json, elements in data/elements.json;
   - every material resolves, through other materials and through the structures of the tissue scenes it opens, to a molecule, crystal, liquid,
     gas, plasma or atom (from there the engine goes on to the nucleus and the quarks), or is an honest stop; a cycle or a dangling id is an error;
   - a stand-in says so: `standIn: true` needs a `note`;
   - every material named in an assignment file exists, and every assignment file listed in materials.json exists (and the other way round);
   - every structure (population) of every tissue scene has a `deeper` or a `material` that resolves.
   It prints the materials that nothing points at and the tissue-scene structures that still lead nowhere. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const J = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);

const T = J('data/descent/materials.json'), M = T.materials || {};
const NODES = new Set();
for (const f of readdirSync(join(ROOT, 'data/nodes'))) { if (!f.endsWith('.json') || f === 'manifest.json') continue; const d = J('data/nodes/' + f), L = Array.isArray(d) ? d : (d.nodes ? (Array.isArray(d.nodes) ? d.nodes : Object.values(d.nodes)) : Object.values(d)); for (const n of L) if (n && n.id) NODES.add(n.id); }
const MOLS = new Set(J('data/molecules_all.json').index.map(m => m.id));
const CRYSTALS = new Set(J('data/crystals.json').map(c => c.id));
const ELEMENTS = new Set((x => Array.isArray(x) ? x : x.elements || Object.values(x))(J('data/elements.json')).map(e => e.symbol));
const TISSUE2 = {}; for (const f of readdirSync(join(ROOT, 'data/things/tissues'))) if (f.endsWith('.json')) { const d = J('data/things/tissues/' + f); TISSUE2[d.id] = d; }
const wm = readFileSync(join(ROOT, 'js/world_matter.js'), 'utf8'), mi = wm.indexOf('const MICRO = {'), microSrc = wm.slice(mi, wm.indexOf('\n};', mi));
const MICRO = new Set([...microSrc.matchAll(/^\s{2}(\w+): \{/gm)].map(m => m[1]));
const TISSUE_KINDS = new Set(['cardiac', 'skeletal', 'smooth', 'blood', 'bone', 'cartilage', 'adipose', 'nervous', 'alveoli', 'villi', 'liver', 'epithelium']);   // FT.tissue, js/nodes.js
const CELLS = new Set(['animal', 'plant', 'bacterium', 'fungal']);
const TERMINAL = new Set(['mol', 'crystal', 'liquid', 'gas', 'plasma', 'atom']);
/* scenes whose every part leads on in code: a cell (organelles to molecules, water or DNA; js/world_matter.js), a micro scene (grains to crystals, cells, water or air),
   an FT.tissue scene (every structure to a cell or, through assign/tissue.json, to a material), a landscape (ground to a micro scene) */
const BUILT_IN = new Set(['cell', 'micro', 'tissue', 'landscape', 'dna']);   // dna: every part of the DNA scene opens a base pair, a sugar or a phosphate molecule

function parseScene(s) { if (typeof s !== 'string') return s; const i = s.indexOf(':'), t = i < 0 ? s : s.slice(0, i), a = i < 0 ? '' : s.slice(i + 1); return t === 'tissue2' ? { type: t, id: a } : t === 'tissue' ? { type: t, kind: a } : t === 'cell' ? { type: t, cell: a || 'animal' } : t === 'micro' ? { type: t, kind: a } : t === 'mol' ? { type: t, mol: a } : t === 'crystal' ? { type: t, id: a } : t === 'gas' ? { type: t, air: a || null } : t === 'atom' ? { type: t, el: a } : { type: t }; }
function sceneOk(sc, where) {
  if (!sc || !sc.type) return err(`${where}: a scene without a type`);
  if (sc.type === 'tissue2' && !TISSUE2[sc.id]) err(`${where}: no tissue scene data/things/tissues/${sc.id}.json`);
  else if (sc.type === 'tissue' && !TISSUE_KINDS.has(sc.kind)) err(`${where}: no tissue kind "${sc.kind}"`);
  else if (sc.type === 'cell' && !CELLS.has(sc.cell)) err(`${where}: no cell type "${sc.cell}"`);
  else if (sc.type === 'micro' && !MICRO.has(sc.kind)) err(`${where}: no micro scene "${sc.kind}"`);
  else if (sc.type === 'micro' && sc.crystal && !CRYSTALS.has(sc.crystal)) err(`${where}: micro scene names crystal "${sc.crystal}", which is not in data/crystals.json`);
  else if (sc.type === 'mol' && !MOLS.has(sc.mol)) err(`${where}: no molecule "${sc.mol}" in data/molecules_all.json`);
  else if (sc.type === 'crystal' && !CRYSTALS.has(sc.id)) err(`${where}: no crystal "${sc.id}" in data/crystals.json`);
  else if (sc.type === 'atom' && !ELEMENTS.has(sc.el)) err(`${where}: no element "${sc.el}"`);
  else if (sc.type === 'gas' && sc.air && sc.air !== 'giant' && sc.air !== 'air') err(`${where}: unknown gas "${sc.air}"`);
  else if (!TERMINAL.has(sc.type) && !BUILT_IN.has(sc.type) && sc.type !== 'tissue2') err(`${where}: unknown scene type "${sc.type}"`);
  if (sc.type === 'micro' && sc.material && !M[sc.material]) err(`${where}: micro scene leads into material "${sc.material}", which does not exist`);
  if (sc.type === 'gas' && sc.mix) for (const [k] of sc.mix) if (!['N2', 'O2', 'Ar', 'CO2', 'H2O', 'H2', 'He', 'H', 'CH4'].includes(k)) err(`${where}: gas mix names "${k}", which the gas scene cannot draw`);
}

/* ---- every material: fields, card, scenes ---- */
for (const [id, m] of Object.entries(M)) {
  if (!m.title) err(`material ${id}: no title`);
  if (!m.desc) err(`material ${id}: no one-line description`);
  if (m.card && !NODES.has(m.card)) err(`material ${id}: card "${m.card}" is not a node in data/nodes`);
  if (m.card === undefined) err(`material ${id}: no card field (give a node id, or null when no card explains it yet)`);
  if (m.stop) { if (m.inside && m.inside.length) err(`material ${id}: has both a stop and an inside`); continue; }
  const way = (m.inside || []).filter(c => c.scene || c.material);
  if (!way.length) err(`material ${id}: nothing inside it (no constituent with a scene or a material, and no stop)`);
  (m.inside || []).forEach((c, i) => {
    const w = `material ${id}, constituent ${i + 1}`;
    if (!c.name) err(`${w}: no name`);
    if (c.scene) sceneOk(parseScene(c.scene), w);
    if (c.material && !M[c.material]) err(`${w}: material "${c.material}" does not exist`);
    if (c.standIn && !(c.note || m.note)) err(`${w}: a stand-in without a note that says so`);
  });
}

/* ---- resolution: each material to a molecule, crystal, liquid, gas, plasma or atom ---- */
const state = {};   // id -> 'busy' | 'ok' | 'stop' | 'bad'
function tissueResolves(tid, chain) {
  const d = TISSUE2[tid]; let ok = false;
  for (const p of d.populations || []) {
    if (p.material) { if (!M[p.material]) { err(`tissue scene ${tid}, ${p.id}: material "${p.material}" does not exist`); continue; } const r = res(p.material, chain); if (r === 'ok') ok = true; }
    else if (p.deeper && p.deeper.type !== 'none') { if (p.deeper.type === 'mol' && !MOLS.has(p.deeper.mol)) err(`tissue scene ${tid}, ${p.id}: molecule "${p.deeper.mol}" does not exist`); ok = true; }
  }
  return ok;
}
function res(id, chain = []) {
  if (state[id] && state[id] !== 'busy') return state[id];
  if (state[id] === 'busy') { err(`cycle: ${chain.concat(id).join(' > ')}`); return 'bad'; }
  const m = M[id]; if (!m) { err(`dangling material id "${id}" (reached from ${chain.join(' > ') || 'an assignment'})`); return 'bad'; }
  if (m.stop) return state[id] = 'stop';
  state[id] = 'busy'; let out = 'bad';
  const c = (m.inside || []).find(c => c.scene || c.material);
  if (c) {
    if (c.material) { const r = res(c.material, chain.concat(id)); out = r === 'ok' ? 'ok' : 'bad'; if (r === 'stop') err(`material ${id}: goes on through "${c.material}", which is a stop (make ${id} a stop itself, or point it at a scene)`); }
    else { const sc = parseScene(c.scene); if (sc.type === 'micro' && sc.material) { const r = res(sc.material, chain.concat(id)); out = r === 'ok' ? 'ok' : 'bad'; } else if (TERMINAL.has(sc.type) || BUILT_IN.has(sc.type)) out = 'ok'; else if (sc.type === 'tissue2' && TISSUE2[sc.id]) { out = tissueResolves(sc.id, chain.concat(id)) ? 'ok' : 'bad'; if (out === 'bad') err(`material ${id}: tissue scene ${sc.id} has no structure that leads on`); } }
  }
  if (out === 'bad' && !errors.some(e => e.includes(id))) err(`material ${id}: does not resolve to a molecule, crystal, liquid, gas, plasma or atom`);
  return state[id] = out;
}
for (const id of Object.keys(M)) res(id);

/* ---- assignment files ---- */
const used = new Set();
const listed = new Set(T.assign || []), onDisk = existsSync(join(ROOT, 'data/descent/assign')) ? readdirSync(join(ROOT, 'data/descent/assign')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)) : [];
for (const k of listed) if (!onDisk.includes(k)) err(`materials.json lists the assignment file "${k}", which does not exist`);
for (const k of onDisk) if (!listed.has(k)) err(`data/descent/assign/${k}.json is not listed in materials.json ("assign"), so it is never loaded`);
function checkTable(a, where) {
  const ref = (m, w) => { if (m === null) return; if (typeof m !== 'string' || !M[m]) err(`${where}: ${w} names material "${m}", which does not exist`); else used.add(m); };
  if (a.default !== undefined) ref(a.default, 'default');
  for (const k of ['ids', 'nodes', 'systems']) for (const [i, m] of Object.entries(a[k] || {})) ref(m, `${k}.${i}`);
  for (const [re, m] of a.match || []) { try { new RegExp(re); } catch (e) { err(`${where}: bad regular expression ${re}`); } ref(m, `match ${re}`); }
  for (const n of Object.keys(a.nodes || {})) if (!NODES.has(n)) warn(`${where}: nodes.${n} is not a node id`);
  for (const [s, t] of Object.entries(a.sub || {})) checkTable(t, `${where}, sub ${s}`);
}
for (const k of onDisk) checkTable(J(`data/descent/assign/${k}.json`), `assign/${k}.json`);

/* ---- tissue scenes: every structure leads on ---- */
const deadPops = [];
for (const [tid, d] of Object.entries(TISSUE2)) for (const p of d.populations || []) {
  if (p.material) { used.add(p.material); if (!M[p.material]) err(`tissue scene ${tid}, ${p.id}: material "${p.material}" does not exist`); }
  else if (!p.deeper || p.deeper.type === 'none') deadPops.push(`${tid}.${p.id}`);
}
for (const m of Object.values(M)) for (const c of m.inside || []) { if (c.material) used.add(c.material); const sc = c.scene && parseScene(c.scene); if (sc && sc.material) used.add(sc.material); }

const ids = Object.keys(M), stops = ids.filter(i => M[i].stop), standIns = ids.filter(i => (M[i].inside || []).some(c => c.standIn));
console.log(`${ids.length} materials (${ids.length - stops.length} lead on, ${stops.length} honest stops, ${standIns.length} use a stand-in); ${onDisk.length} assignment files; ${Object.keys(TISSUE2).length} tissue scenes.`);
const unused = ids.filter(i => !used.has(i));
if (unused.length) console.log(`Not used by any assignment, tissue scene or other material (${unused.length}): ${unused.join(', ')}`);
if (deadPops.length) console.log(`Tissue-scene structures with neither deeper nor material (${deadPops.length}): ${deadPops.join(', ')}`);
for (const w of warns) console.log('warning: ' + w);
if (errors.length) { for (const e of [...new Set(errors)]) console.error('ERROR: ' + e); console.error(`${new Set(errors).size} error(s).`); process.exit(1); }
console.log('OK: every material resolves to a molecule, crystal, liquid, gas, plasma or atom, or is an honest stop; no cycle, no dangling id, no missing scene.');
