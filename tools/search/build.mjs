// Builds the search index from the app's own data.
//   node tools/search/build.mjs            (from the repo root; the venv node is fine)
// Reads:  data/molecules_all.json, data/crystals.json, data/elements.json, data/nodes/*, data/knowledge/nodes.json,
//         data/trails/*, data/labs/*_presets.json, data/solar.json, tools/search/snapshot.json (what the running app can fly to;
//         regenerate with tools/search/snapshot.py), tools/search/aliases_src.txt (curated), data/search/overrides.txt (hand additions)
// Writes: data/search/index.json   (one record per thing that can be found)
//         data/search/aliases.json (the merged, validated everyday-word table; every entry names its source)
// Fails (exit 1) when an alias points at an id that does not exist, has no source, or a source is unknown.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..', '..');
const require = createRequire(import.meta.url);
const SC = require(path.join(root, 'js', 'search.js'));
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const exists = f => fs.existsSync(path.join(root, f));

// ---------- inventory ----------
const snap = J('tools/search/snapshot.json');
const nodes = []; J('data/nodes/manifest.json').forEach(f => J('data/nodes/' + f).forEach(n => nodes.push(n)));
const NODE = Object.fromEntries(nodes.map(n => [n.id, n]));
const kn = J('data/knowledge/nodes.json');
const mols = J('data/molecules_all.json').index, crystals = J('data/crystals.json'), elements = J('data/elements.json');
const solar = J('data/solar.json');
const trailFiles = J('data/trails/manifest.json').files || J('data/trails/manifest.json');
const trails = (Array.isArray(trailFiles) ? trailFiles : trailFiles.files).map(f => J('data/trails/' + f));
const labPresets = [['circuit', 'Circuit Lab', J('data/labs/circuit_presets.json')], ['device', 'Semiconductor Device Lab', J('data/labs/device_presets.json')]];

const first = (s, n = 118) => { s = String(s || '').replace(/\s+/g, ' ').trim(); const m = s.match(/^.{20,}?[.!?](\s|$)/); let o = m ? m[0].trim() : s; if (o.length > n) o = o.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; return o; };
const stripParen = t => t.replace(/\s*\([^)]*\)/g, '').trim();
const parens = t => [...t.matchAll(/\(([^)]*)\)/g)].map(m => m[1]);

const E = []; const add = e => { E.push(e); return e; };

// elements
elements.forEach(el => add({ id: 'el:' + el.symbol, c: 'el', g: 'model', t: el.name, sy: el.symbol, z: el.Z, s: first(el.summary) }));
// molecules
const molAlt = (m) => {
  const a = new Set(); parens(m.name).forEach(p => { if (!/^zwitterion|^gas-phase|one isoprene|hydrogen phosphate|protoporphyrin|cyclic|^T4$/i.test(p)) a.add(p); });
  let b = stripParen(m.name); a.add(b);
  const b2 = b.replace(/^(L|D|DL)-/i, '').replace(/^(alpha|beta)-D-/i, ''); if (b2 && b2 !== b) a.add(b2);
  b = b.replace(/ ion$/i, ''); a.add(b);
  if (/^aa_/.test(m.id)) a.add(m.id.slice(3));
  const dn = m.name.replace(/\s*\([^)]*\)/g, ''); a.add(dn);
  a.delete(m.name); return [...a].filter(x => x && x.length > 1);
};
const DN = { glucose_alpha: 'Glucose (alpha form)', glucose_beta: 'Glucose (beta form)', fructose: 'Fructose', galactose: 'Galactose' };
mols.forEach(m => add({ id: 'mol:' + m.id, dn: DN[m.id], c: 'mol', g: 'model', t: m.name, f: m.formula, a: molAlt(m), s: `${m.category || 'molecule'}, ${m.mw ? m.mw.toFixed(1) + ' g/mol' : ''}`.replace(/, $/, '') }));
crystals.forEach(x => add({ id: 'crystal:' + x.id, c: 'crystal', g: 'model', t: x.name, f: x.formula, a: parens(x.name).concat([stripParen(x.name)]).filter(Boolean), s: first(x.notes) }));
// topic cards
const modelKind = k => !k ? '' : k === 'tear' ? 'phone' : /^via:/.test(k) ? modelKind(k.slice(4)) : k === 'place' ? 'place' : k === 'mol' ? 'molecule' : k === 'crystal' ? 'crystal' : k === 'thing' ? 'park' : k === 'atom' ? 'atom' : 'body';
const PLACE_NAME = { park: 'Greenwich Park', human: 'the human body', skin: 'your skin', cell: 'a cell', dna: 'DNA', base_pair: 'a base pair', atom: 'an atom', earth: 'Earth', leaf: 'a leaf', pond: 'the pond', soil: 'the soil', air: 'the air' };
const MOLT = Object.fromEntries(mols.map(m => [m.id, ({ glucose_alpha: 'glucose (alpha form)', glucose_beta: 'glucose (beta form)', fructose: 'fructose', galactose: 'galactose' })[m.id] || m.name.replace(/\s*\([^)]*\)/g, '')])), CRT = Object.fromEntries(crystals.map(c => [c.id, c.name.replace(/\s*\([^)]*\)/g, '')]));
const tearSet = new Set(snap.tear);
nodes.forEach(n => {
  if (/^at_el_/.test(n.id)) return; // elements come from elements.json
  const sk = snap.nodes[n.id]; let mk = modelKind(sk), wh = '';
  if (mk === 'phone' && /^sm_/.test(n.id)) mk = 'particle';
  else if (sk === 'tear' && !tearSet.has(n.id)) { mk = 'via'; const t = n.where && tearSet.has(n.where) ? n.where : n.hotspot && n.hotspot.of; wh = ((NODE[t] || {}).title || t) + ' in your phone'; }
  else if (mk === 'place') wh = PLACE_NAME[(n.where || '').replace('place:', '')] || '';
  else if (mk === 'molecule') wh = 'the ' + (MOLT[(n.where || '').slice(4)] || 'molecule') + ' molecule';
  else if (mk === 'crystal') wh = 'a crystal of ' + (CRT[(n.where || '').slice(8)] || 'it').toLowerCase();
  else if (/^via:/.test(sk || '')) { mk = 'via'; wh = (NODE[n.where] || {}).title || ''; }
  // a topic card that merely stands in a generic place (the pond, the park, a cell, DNA ...) is a card that also flies there, not a model of the thing
  const proxy = mk === 'place' || (mk === 'via' && /^via:place/.test(sk || '') );
  const e = { id: 'node:' + n.id, c: 'node', g: mk && !proxy ? 'model' : 'card', t: n.title, s: first(n.summary || (n.layers && n.layers.basics)) };
  if (mk) e.m = mk; if (wh) e.wh = wh; if (n.kind) e.k = n.kind;
  add(e);
});
kn.forEach(n => add({ id: 'kn:' + n.id, c: 'kn', g: 'card', t: n.title, s: first(n.basics), k: 'knowledge' }));
// places: landmarks, planets, moons, park things
const LM_SKIP = new Set(['Brain', 'Heart', 'Skin', 'Your brain', 'Your heart', 'Your phone', 'Phone processor', 'CPU core', 'Your skin', 'Oxygen atom', 'Honey bee (14 mm)', 'Proton', 'Transistor', 'Logic gates']);
const LM_CARD = { 'The Sun': ['sun'], 'Earth': ['earthPlanet', 'earth'], 'Black hole Sgr A*': ['sgr', 'sgra'], 'Milky Way': ['milkyway', 'mw'] };
snap.landmarks.forEach(l => { if (LM_SKIP.has(l.label)) return; add({ id: 'lm:' + l.label, c: 'lm', g: 'model', t: l.label.replace(/ \(\d+ mm\)/, ''), s: 'A place on the scale', card: LM_CARD[l.label] }); });
const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ceres', 'Eris', 'Haumea', 'Makemake'];
PLANETS.forEach(p => { const b = solar.find(s => s.name === p); add({ id: 'pl:' + p, c: 'pl', g: 'model', t: p, s: p === 'Ceres' || p === 'Eris' || p === 'Haumea' || p === 'Makemake' || p === 'Pluto' ? 'Dwarf planet' : 'Planet', card: [p.toLowerCase()], rkm: b && b.radius_km }); });
solar.filter(b => b.parent && b.parent !== 'Sun' && b.name !== 'Moon').forEach(b => add({ id: 'pl:' + b.name, c: 'pl', g: 'model', t: b.name, s: `Moon of ${b.parent}`, parent: b.parent, rkm: b.radius_km, card: ['moon_' + b.name] }));
add({ id: 'pl:Moon', c: 'pl', g: 'model', t: 'The Moon', s: "Earth's Moon", card: ['moon'] });
add({ id: 'pl:ISS', c: 'pl', g: 'model', t: 'International Space Station', s: 'A crewed laboratory orbiting Earth', card: ['iss'] });
[['Dog', 'dog'], ['Tree', 'tree'], ['Pond', 'pond'], ['Flowers', 'flower'], ['Honeybee', 'bee'], ['Mushroom', 'mushroom'], ['Bird', 'bird'], ['Cloud', 'cloud']].forEach(([t, k]) => add({ id: 'pl:' + t, c: 'pl', g: 'model', t, s: 'In Greenwich Park', card: [k] }));
add({ id: 'pl:Air', c: 'pl', g: 'model', t: 'Air', s: 'In Greenwich Park: what the air is made of', card: ['air'] });
add({ id: 'pl:Soil', c: 'pl', g: 'model', t: 'Soil and rock', s: 'In Greenwich Park: down into the soil', card: ['soil'] });
// the galaxies the Local Group view draws at their catalogued places (js/world_space.js, FT.localgroup: within 3.1 Mpc): each can be flown to
J('data/galaxies.json').filter(g => g.dist_mpc <= 3.1 && g.name !== 'Milky Way').forEach(g => add({ id: 'gx:' + g.name, c: 'gx', g: 'model', t: g.name, s: `A galaxy, ${g.group === 'Local Group' ? 'in the Local Group' : 'near the Local Group'}`, ra: g.ra_deg, dec: g.dec_deg, mpc: g.dist_mpc, kpc: g.diam_kpc }));
add({ id: 'act:ptable', c: 'act', g: 'model', t: 'Periodic table of the elements', s: 'Choose any element and fly to its atom' });
// trails and labs
trails.forEach(t => add({ id: 'trail:' + t.id, c: 'trail', g: 'trail', t: t.question, kw: t.keywords || [], s: first(t.teaser), n: (t.stops || []).length, min: t.minutes }));
labPresets.forEach(([lab, name, presets]) => presets.forEach(p => add({ id: `lab:${lab}/${p.id}`, c: 'lab', g: 'lab', t: p.title || p.name || p.id, s: name })));

// ids that the snapshot calls "model" only because the topic is placed at a loosely related part: show them as cards in search
const FORCE_CARD = new Set();
const forceFile = path.join(root, 'tools/search/force_card.txt');
if (fs.existsSync(forceFile)) fs.readFileSync(forceFile, 'utf8').split('\n').map(s => s.replace(/#.*/, '').trim()).filter(Boolean).forEach(id => FORCE_CARD.add(id));
E.forEach(e => { if (e.c === 'node' && FORCE_CARD.has(e.id.slice(5))) { e.g = 'card'; delete e.m; e.fc = 1; } });
const byId = new Map(E.map(e => [e.id, e]));
if (byId.size !== E.length) { const seen = new Set(); E.forEach(e => { if (seen.has(e.id)) console.error('duplicate entity id', e.id); seen.add(e.id); }); process.exit(1); }

// ---------- aliases ----------
const sources = {}; const aliases = []; const problems = [];
const resolveTarget = t => { t = t.trim(); if (byId.has(t)) return t; if (byId.has('node:' + t)) return 'node:' + t; return null; };
function parseFile(rel, label, pass) {
  if (!exists(rel)) return;
  fs.readFileSync(path.join(root, rel), 'utf8').split('\n').forEach((raw, i) => {
    const line = raw.trim(); if (!line || line[0] === '#') return;
    const where = `${rel}:${i + 1}`;
    if (line[0] === '@') { if (pass === 2) return; const m = line.match(/^@src\s+(\S+)\s*\|\s*(.*?)\s*\|\s*(\S*)\s*$/); if (!m) { problems.push(`${where}: bad @src line`); return; } sources[m[1]] = { text: m[2], url: m[3] }; return; }
    if (pass === 1) return;
    const [lhs, rhsAll] = line.split('=>'); if (rhsAll === undefined) { problems.push(`${where}: no "=>"`); return; }
    const parts = rhsAll.split('//').map(s => s.trim()); const tl = parts.shift();
    const a = { q: lhs.split(',').map(s => s.trim()).filter(Boolean), t: [], from: label };
    tl.split(',').map(s => s.trim()).filter(Boolean).forEach(t => { const r = resolveTarget(t); if (!r) problems.push(`${where}: unknown target "${t}"`); else a.t.push(r); });
    parts.forEach(p => {
      let m;
      if ((m = p.match(/^src:\s*(.+)$/))) a.src = m[1].split(/[ ,]+/).filter(Boolean);
      else if ((m = p.match(/^near:\s*(.+)$/))) a.near = m[1].split(',').map(s => resolveTarget(s)).filter(Boolean);
      else if ((m = p.match(/^hint:\s*(.+)$/))) a.hint = m[1];
      else if (p) a.note = p;
    });
    if (!a.q.length || !a.t.length) { problems.push(`${where}: empty alias or no valid target`); return; }
    if (!a.src || !a.src.length) problems.push(`${where}: no src`);
    else a.src.forEach(s => { if (!sources[s]) problems.push(`${where}: unknown source "${s}"`); });
    a.where = where; aliases.push(a);
  });
}
const FILES = [['tools/search/aliases_src.txt', 'curated']].concat(fs.readdirSync(path.join(root, 'tools/search')).filter(f => /^aliases_src_.*\.txt$/.test(f)).sort().map(f => ['tools/search/' + f, 'curated']), [['data/search/overrides.txt', 'overrides']]);
[1, 2].forEach(pass => FILES.forEach(([f, l]) => parseFile(f, l, pass)));

if (problems.length) { console.error(problems.join('\n')); console.error(`${problems.length} problem(s); nothing written`); process.exit(1); }

// every alias phrase, normalised exactly as the runtime does, must be non-empty
let phraseCount = 0; aliases.forEach(a => { a.q.forEach(p => { if (!SC.contentTokens(p).length) problems.push(`${a.where}: phrase "${p}" has no content`); }); phraseCount += a.q.length; });
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

const used = new Set(); aliases.forEach(a => a.t.forEach(t => used.add(t)));
fs.mkdirSync(path.join(root, 'data/search'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/search/index.json'), JSON.stringify({ v: 1, e: E }));
const out = { v: 1, note: 'Generated by tools/search/build.mjs from tools/search/aliases_src*.txt and data/search/overrides.txt. Do not edit by hand.', sources, aliases: aliases.map(a => { const o = { q: a.q, t: a.t }; if (a.near) o.near = a.near; if (a.note) o.note = a.note; if (a.hint) o.hint = a.hint; o.src = a.src; return o; }) };
fs.writeFileSync(path.join(root, 'data/search/aliases.json'), JSON.stringify(out));
const by = {}; E.forEach(e => by[e.c] = (by[e.c] || 0) + 1);
console.log(`entities ${E.length}`, JSON.stringify(by));
console.log(`aliases ${aliases.length} entries, ${phraseCount} phrases, pointing at ${used.size} distinct things; sources ${Object.keys(sources).length}`);
const sz = f => (fs.statSync(path.join(root, f)).size / 1024).toFixed(0) + ' KB';
console.log('index.json', sz('data/search/index.json'), 'aliases.json', sz('data/search/aliases.json'));
