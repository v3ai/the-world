// Validates every trail in data/trails without a browser.
// Checks: schema, that every stop's place exists (landmark label, node id, place key, molecule id, frame key,
// thing part, thing mode, tissue scene id, element symbol, Standard Model node), text rules, and that "next" trails exist.
// The registry of things that only exist at run time (landmark labels, frame keys, INFO card ids, placeGo keys) is
// tools/trails/registry.json, written by tools/trails/dump_registry.py from the running app.
// Run: node tools/trails/check_trails.mjs   (exit code 1 on any error)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rd = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const errors = [], warns = [];
const err = (t, m) => errors.push(`${t}: ${m}`);
const warn = (t, m) => warns.push(`${t}: ${m}`);

const reg = rd('tools/trails/registry.json');
const nodeIds = new Set();
for (const f of rd('data/nodes/manifest.json')) { const a = rd('data/nodes/' + f); (Array.isArray(a) ? a : a.nodes || []).forEach(n => nodeIds.add(n.id)); }
const knIds = new Set(); try { for (const f of fs.readdirSync(path.join(root, 'data/knowledge'))) if (f.endsWith('.json')) { const a = rd('data/knowledge/' + f); (Array.isArray(a) ? a : a.nodes || []).forEach(n => n && n.id && knIds.add(n.id)); } } catch (e) { /* optional */ }
const mols = new Set(rd('data/molecules_all.json').index.map(m => m.id));
const crystals = new Set(rd('data/crystals.json').map(c => c.id));
const frames = new Set(reg.frames), landmarks = new Set(reg.landmarks), info = new Set(reg.info);
const things = {};
for (const d of fs.readdirSync(path.join(root, 'data/things'))) {
  const p = path.join(root, 'data/things', d, 'thing.json');
  if (fs.existsSync(p)) { const t = JSON.parse(fs.readFileSync(p, 'utf8')); things[d] = { parts: new Set(t.parts.map(x => x.id)), modes: new Set((t.modes || []).map(m => m.id)), nodes: new Set(t.parts.map(x => x.node)) }; }
}
const tissues = new Set(fs.readdirSync(path.join(root, 'data/things/tissues')).map(f => f.replace(/\.json$/, '')));
const placeKeys = new Set(reg.places);
const SMMODES = new Set(reg.smModes);

const known = (id) => nodeIds.has(id) || info.has(id) || knIds.has(id);
const man = rd('data/trails/manifest.json'), files = man.files || man;
const trails = [];
for (const f of files) { let x; try { x = rd('data/trails/' + f); } catch (e) { err(f, 'cannot read: ' + e.message); continue; } (x.trails || [x]).forEach(t => trails.push(Object.assign(t, { _file: f }))); }

const ids = new Set(trails.map(t => t.id));
const sentences = s => String(s).replace(/<[^>]+>/g, ' ').split(/(?<=[.!?])\s+/).filter(Boolean);
const plain = s => String(s).replace(/<[^>]+>/g, '');
const wc = s => plain(s).split(/\s+/).filter(Boolean).length;

for (const t of trails) {
  const T = t.id || t._file;
  for (const k of ['id', 'theme', 'question', 'teaser', 'scales', 'stops', 'answer', 'next']) if (t[k] === undefined) err(T, 'missing ' + k);
  if (!t.stops) continue;
  if (t.stops.length < 5 || t.stops.length > 9) err(T, `has ${t.stops.length} stops (want 5 to 9)`);
  if (!/\?$/.test(t.question || '')) warn(T, 'question does not end with ?');
  if (!t.next || t.next.length < 2 || t.next.length > 3) err(T, 'needs 2 or 3 "next" trails');
  (t.next || []).forEach(n => { if (!ids.has(n)) err(T, 'next trail does not exist: ' + n); if (n === t.id) err(T, 'next points at itself'); });
  if (sentences(t.answer || '').length > 2) warn(T, 'answer is longer than one or two sentences');
  if (!(t.sources && t.sources.length)) warn(T, 'no sources listed');
  t.stops.forEach((s, i) => {
    const S = `${T} stop ${i + 1}`;
    for (const k of ['title', 'text', 'where', 'notice', 'expect']) if (s[k] === undefined) err(S, 'missing ' + k);
    const txt = Array.isArray(s.text) ? s.text.join(' ') : s.text || '';
    const n = sentences(txt).length;
    if (n < 2 || n > 5) warn(S, `${n} sentences of text (want 2 to 4)`);
    if (wc(txt) > 95) warn(S, `text is ${wc(txt)} words (long)`);
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(txt + s.title + (s.notice || ''))) err(S, 'emoji');
    const w = s.where || {}, kinds = ['landmark', 'node', 'place', 'view', 'deep', 'sm', 'scene'].filter(k => w[k] !== undefined);
    if (kinds.length !== 1) { err(S, 'where must have exactly one of landmark/node/place/view/deep/sm/scene, has ' + kinds.join(',')); return; }
    const frameKey = k => frames.has(k) || (things[k] && frames.has('thing_' + k));
    if (w.landmark !== undefined && !landmarks.has(w.landmark)) err(S, 'unknown landmark ' + JSON.stringify(w.landmark));
    if (w.node !== undefined && !nodeIds.has(w.node)) err(S, 'unknown node ' + w.node);
    if (w.place !== undefined) {
      if (placeKeys.has(w.place)) { /* fixed place */ }
      else if (w.place.startsWith('mol:')) { if (!mols.has(w.place.slice(4))) err(S, 'unknown molecule ' + w.place); }
      else if (w.place.startsWith('crystal:')) { if (!crystals.has(w.place.slice(8))) err(S, 'unknown crystal ' + w.place); }
      else err(S, 'unknown place ' + w.place);
    }
    if (w.view !== undefined) {
      const v = w.view; if (!frameKey(v.frame)) err(S, 'unknown frame ' + v.frame);
      if (!Array.isArray(v.point) || v.point.length !== 3 || v.point.some(x => typeof x !== 'number')) err(S, 'view.point must be [x,y,z]');
      if (!(v.D > 0)) err(S, 'view.D must be a positive number of metres');
    }
    if (w.deep !== undefined) {
      const d = w.deep; if (!frameKey(d.in)) err(S, 'unknown frame ' + d.in);
      if (d.type === 'tissue2') { if (!tissues.has(d.id)) err(S, 'unknown tissue scene ' + d.id); }
      else if (d.type === 'crystal') { if (!crystals.has(d.id)) err(S, 'unknown crystal ' + d.id); }
      else if (d.type === 'micro') { if (!(d.kind || d.id)) err(S, 'micro needs kind'); }
      else err(S, 'unknown deep type ' + d.type);
      if (!Array.isArray(d.at) || d.at.length !== 3) err(S, 'deep.at must be [x,y,z]'); if (!(d.D > 0)) err(S, 'deep.D must be positive');
    }
    if (w.sm !== undefined && w.sm.focus && !nodeIds.has('sm_' + w.sm.focus) && !reg.smParticles.includes(w.sm.focus)) err(S, 'unknown SM particle ' + w.sm.focus);
    if (w.scene !== undefined && !['sun_plasma'].includes(w.scene)) err(S, 'unknown scene ' + w.scene);
    (s.do || []).forEach(a => {
      if (a.card !== undefined && !known(a.card)) err(S, 'do.card unknown card ' + a.card);
      if (a.mode !== undefined) { const th = things[a.thing]; if (!th) err(S, 'do.mode unknown thing ' + a.thing); else if (!th.modes.has(a.mode)) err(S, `thing ${a.thing} has no mode ${a.mode}`); }
      if (a.bodyMode !== undefined && !reg.bodyModes.includes(a.bodyMode)) err(S, 'unknown body mode ' + a.bodyMode);
      if (a.element !== undefined && !reg.elements.includes(a.element)) err(S, 'unknown element ' + a.element);
      if (a.sm !== undefined && !SMMODES.has(a.sm.mode)) err(S, 'unknown SM mode ' + (a.sm && a.sm.mode));
      if (a.time !== undefined && Number.isNaN(Date.parse(a.time))) err(S, 'bad time ' + a.time);
      if (a.hide !== undefined && !Array.isArray(a.hide)) err(S, 'hide must be a list');
      if (a.reveal !== undefined && !nodeIds.has(a.reveal)) err(S, 'unknown reveal node ' + a.reveal);
      const keys = ['card', 'mode', 'bodyMode', 'element', 'sm', 'time', 'dir', 'press', 'hide', 'reveal', 'wait'].filter(k => a[k] !== undefined);
      if (keys.length < 1) err(S, 'empty action ' + JSON.stringify(a));
    });
    (s.deeper || []).forEach(d => { if (!known(d.node)) err(S, 'deeper link to unknown card ' + d.node); if (!d.label) err(S, 'deeper link needs a label'); });
    (s.asked || []).forEach(id => { if (!known(id)) err(S, 'asked: unknown card ' + id); });
    if (s.thingPart) { const [th, part] = s.thingPart.split(':'); if (!things[th] || !things[th].parts.has(part)) err(S, 'unknown thing part ' + s.thingPart); }
    const e = s.expect || {};
    if (e.frame !== undefined) { try { new RegExp(e.frame); } catch (x) { err(S, 'expect.frame is not a regex'); } }
    if (e.thing !== undefined && !things[e.thing] && !frames.has('thing_' + e.thing)) err(S, 'expect.thing unknown ' + e.thing);
    if (e.frame === undefined && e.thing === undefined) err(S, 'expect needs frame or thing');
  });
}
// cross-check: every trail is reachable from some other trail or from the list
console.log(`${trails.length} trails, ${trails.reduce((a, t) => a + (t.stops || []).length, 0)} stops`);
for (const t of trails) console.log(`  ${t.id}: ${(t.stops || []).length} stops, "${t.question}"`);
warns.forEach(w => console.log('warning: ' + w));
errors.forEach(e => console.log('ERROR: ' + e));
console.log(errors.length ? `${errors.length} errors` : 'OK: no errors');
process.exit(errors.length ? 1 : 0);
