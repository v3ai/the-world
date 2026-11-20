'use strict';
/* =====================================================================
   WHAT EVERYTHING IS MADE OF
   One table (data/descent/materials.json), the assignment files (data/descent/assign/<frame type or thing id>.json) and the rule that
   uses them, so that zooming into anything leads to what it is made of, level by level, until the chain of js/world_matter.js,
   js/atom.js and js/particles.js takes over (molecule or crystal > atom > nucleus > nucleon > quarks).

   A MATERIAL is a reusable description of matter at one level:
     { title, desc (one plain line), card (node id, or null), inside: [constituent, ...] }      or      { title, desc, card, stop: "plain sentence" }
   A CONSTITUENT names the existing scene that shows it:
     { name, scene: "tissue2:<id>" | "tissue:<kind>" | "cell:<animal|plant|bacterium|fungal>" | "micro:<kind>" | "mol:<id>" | "crystal:<id>" |
                    "liquid" | "gas" | "gas:giant" | "plasma" | "atom:<El>" | "dna"   (or the object form {type, ...parameters}),
       material: "<id>" (instead of a scene: go on through that material),  standIn: true, note: "what is shown and what is not",  title: caption name }
   The first constituent with a scene (or a material) is the way down; the others say what else is in it. `{what}` in a title or note is the name
   of the part that was pointed at.

   An ASSIGNMENT file says which material each pickable thing of a frame is made of:
     { default, ids: {pickId: material}, nodes: {nodeId: material}, match: [[regex on the pick id, material], ...], systems: {system: material},
       sub: {<tissue kind or variant | cell type | micro kind | biome | body | tissue2 scene id>: {...the same, and over: {structure id: material}}}, spawnD: metres, everywhere: true }
   looked up in that order (the sub-table of the frame's own kind first). A row may be null: "nothing is assigned to this part" (the default does not apply to it).
   `default` speaks for whatever of the frame is pointed at; with `everywhere` it also holds where the pointer is on nothing (a chip is silicon throughout).

   THE RULE. When the camera descends at a point and the frame it is in has nothing more specific to offer there (no child frame, its own spawn
   returns null), trySpawn (js/engine.js) asks DESCENT.spawn(frame, T, hint): the material of the thing under the zoom point is found
   (the part's own `material`; else the row of the frame's assignment file that names it; else userData.madeOf when it names a material; else the file's default) and the
   material's scene is put at that point. Its caption names it and says when it is a stand-in. Where nothing true can be shown, the material
   has a `stop` sentence: the camera stays at the frame's floor and the sentence is shown.

   THE CONTRACT (for the pointer and card code):
     DESCENT.inside(hit)   -> flies into the next level down at the picked point. {ok: true, title, note} or {ok: false, reason, card}
     DESCENT.describe(hit) -> the same answer without moving: {title, kind, standIn, note}   (kind 'stop' when nothing deeper exists)
     DESCENT.up()          -> one level back out
   `hit` is what pickAt returns: {frame, obj, id, pointLocal, hit}.
   tools/descent/check.mjs proves that every material resolves to a molecule, crystal, liquid, gas, plasma or atom, or is an honest stop.
   ===================================================================== */
const DESCENT = (() => {
  const Z = { M: {}, A: {}, ready: false, molName: {}, crystalName: {}, tisName: {}, loading: null };
  const TERMINAL = { mol: 1, crystal: 1, liquid: 1, gas: 1, plasma: 1, atom: 1 };
  /* the distance a flight into a scene ends at (metres), by frame type; else a fifth of the distance at which the frame appears */
  const VIEW_D = { liquid: 5e-9, crystal: 4e-9, mol: 2.5e-9, cell: 4e-5, tissue2: 4e-4, micro: 1.2e-3, tissue: 4e-4, atom: 7e-10, nucleus: 2.5e-14, proton: 3e-15, sm: 3.8e-17, gas: 5e-8, plasma: 6e-8, dna: 3e-8, landscape: 60, organ: 0 };
  const KIND_WORD = { tissue2: 'tissue', tissue: 'tissue', cell: 'cell', micro: 'close-up', mol: 'molecule', crystal: 'crystal', liquid: 'liquid', gas: 'gas', plasma: 'plasma', atom: 'atom', nucleus: 'nucleus', proton: 'nucleon', sm: 'particles', dna: 'DNA', landscape: 'surface', region: 'surface', organ: 'cut-open view', star: 'star', planet: 'planet' };

  Z.load = () => Z.loading || (Z.loading = getJSON('data/descent/materials.json').then(async J => {
    Z.M = J.materials || {};
    await Promise.all((J.assign || []).map(k => getJSON('data/descent/assign/' + k + '.json').then(a => { Z.A[k] = a; compile(a); }).catch(e => console.error('descent: assignment file missing', k, e))));
    getJSON('data/crystals.json').then(C => C.forEach(c => { Z.crystalName[c.id] = c.name; })).catch(() => { });
    // the tissue scenes the table leads to are fetched now (a few kilobytes each), so that a scene is there when the zoom arrives and its name is known beforehand
    const tis = new Set(); for (const k in Z.M) for (const c of Z.M[k].inside || []) { const sc = typeof c.scene === 'string' ? parseScene(c.scene) : c.scene; if (sc && sc.type === 'tissue2') tis.add(sc.id); }
    if (typeof thLoadTissue === 'function') tis.forEach(id => thLoadTissue(id).then(d => { Z.tisName[id] = d.title; }).catch(() => { }));
    Z.ready = true;
  }).catch(e => { console.error('descent: materials table missing', e); }));
  function compile(a) { if (a.match) a._re = a.match.map(([re, m]) => [new RegExp(re), m]); if (a.sub) for (const k in a.sub) compile(a.sub[k]); }

  /* ---------- which table, which row ---------- */
  const tableKey = F => F.type === 'thing' ? (F.opts && F.opts.thing) : F.type;
  /* the sub-table of a frame's own kind (a landscape: the body it is on, else its biome) */
  const subOf = (a, F) => { if (!a.sub) return null; const o = F.opts || {}; const k = F.type === 'tissue' ? (o.variant || o.kind) : F.type === 'cell' ? (o.type || 'animal') : F.type === 'micro' ? o.kind : F.type === 'landscape' ? (o.body && a.sub[o.body] ? o.body : o.biome) : F.type === 'region' ? o.biome : F.type === 'planet' || F.type === 'earth' || F.type === 'star' ? o.body : F.type === 'organ' ? o.organ : F.type === 'tissue2' ? o.id : null; return k != null ? a.sub[k] || null : null; };
  function rowOf(a, q) {
    if (!a) return undefined;
    if (q.id != null && a.ids && a.ids[q.id] !== undefined) return a.ids[q.id];
    if (q.node && a.nodes && a.nodes[q.node] !== undefined) return a.nodes[q.node];
    if (q.id != null && a._re) for (const [re, m] of a._re) if (re.test(q.id)) return m;
    if (q.system && a.systems && a.systems[q.system] !== undefined) return a.systems[q.system];
    return undefined;
  }
  /* what is pointed at, in the words the tables use */
  function queryOf(F, hint) {
    const o = hint && hint.obj, u = (o && o.userData) || {};
    let id = hint ? hint.id : null; if (id == null && u.id !== undefined) id = u.id; if (id == null && u.resolve && hint && hint.hit) { try { id = u.resolve(hint.hit); } catch (e) { } }
    const node = u.node || (typeof NODE !== 'undefined' && id != null && NODE[id] ? id : null);
    let what = (u.part && u.part.name) || u.title || (u.info && u.info.title) || (node && typeof NODE !== 'undefined' && NODE[node] && NODE[node].title) || (id != null && typeof INFO !== 'undefined' && INFO[id] && INFO[id].title) || null;
    if (!what && o && u.infoFn && hint.hit) { try { const i = u.infoFn(hint); what = i && i.title; } catch (e) { } }
    return { id: id == null ? null : String(id), node, system: (u.part && u.part.system) || u.system || null, what, obj: o || null, u };
  }
  /* the material of the thing a query names, in frame F: {id, via} or null */
  function materialOf(F, q, explicit) {   // explicit: only a row that names this part (not the frame's default)
    const u = q.u || {};
    const a = Z.A[tableKey(F)], s = a ? subOf(a, F) : null;
    const ov = s && s.over && q.id != null ? s.over[q.id] : undefined;   // `over`: a structure of a scene whose own `material` is replaced by a truer one (assign/tissue2.json)
    if (ov && Z.M[ov]) return { id: ov, via: 'over' };
    if (u.material && Z.M[u.material]) return { id: u.material, via: 'part' };
    let m = rowOf(s, q); if (m === undefined) m = rowOf(a, q);
    if (m === undefined && typeof u.madeOf === 'string' && Z.M[u.madeOf]) return { id: u.madeOf, via: 'madeOf' };
    if (!a) return null;
    if (m === undefined && (u.hotspot || (u.info && u.info.tag === 'Marker')) && Z.M.marker) m = 'marker';   // a yellow dot that no row speaks for: it is a pointer, not a part
    if (m === undefined && explicit) return null;
    if (m === undefined && !q.obj && !a.everywhere) return null;   // a default speaks for the things of the frame, not for the empty space between them (unless the whole frame is one material: `everywhere`)
    if (m === undefined && s && s.default !== undefined) m = s.default;
    if (m === undefined) m = a.default;
    return m && Z.M[m] ? { id: m, via: 'assign' } : null;
  }
  /* follow a material to the scene that shows it: {id, title, scene, standIn, note, card, also} or {id, stop, card, title} */
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s, fill = (s, what) => s ? s.replace(/\{What\}/g, cap(what || 'this part')).replace(/\{what\}/g, (what || 'this part').toLowerCase()) : s;
  function resolve(id, what, depth = 0) {
    const m = Z.M[id]; if (!m || depth > 8) return null;
    if (m.stop) return { id, stop: fill(m.stop, what), card: m.card || null, title: m.title };
    const con = (m.inside || []).find(c => c.scene || c.material); if (!con) return null;
    const also = (m.inside || []).filter(c => c !== con && !c.scene && !c.material).map(c => c.name);
    if (!con.scene) { const r = resolve(con.material, what, depth + 1); if (r && !r.stop) { if (con.note) r.note = fill(con.note, what) + (r.note ? ' ' + r.note : ''); r.standIn = r.standIn || !!con.standIn; r.via = (r.via || []).concat(id); r.card = r.card || m.card || null; if (con.title) r.title = fill(con.title, what); } return r; }
    return { id, title: fill(con.title, what) || null, mtitle: m.title, scene: typeof con.scene === 'string' ? parseScene(con.scene) : con.scene, standIn: !!(con.standIn || m.standIn), note: fill(con.note || m.note || '', what), card: m.card || null, also, name: con.name };
  }
  function parseScene(s) { const i = s.indexOf(':'), t = i < 0 ? s : s.slice(0, i), a = i < 0 ? '' : s.slice(i + 1); return t === 'tissue2' ? { type: t, id: a } : t === 'tissue' ? { type: t, kind: a } : t === 'cell' ? { type: t, cell: a || 'animal' } : t === 'micro' ? { type: t, kind: a } : t === 'mol' ? { type: t, mol: a } : t === 'crystal' ? { type: t, id: a } : t === 'gas' ? { type: t, air: a || null } : t === 'atom' ? { type: t, el: a } : { type: t }; }

  /* ---------- the scene of a material, as a frame at T (parent coordinates) ---------- */
  const TISSUE_NODE = { cardiac: 'cardiac_muscle_tissue', skeletal: 'skeletal_muscle_tissue', smooth: 'smooth_muscle_tissue', blood: 'blood_tissue', bone: 'bone_tissue', cartilage: 'cartilage_tissue', adipose: 'adipose_tissue', nervous: 'nervous_tissue', alveoli: 'alveoli', villi: 'villi', liver: 'liver_lobule', epithelium: 'epithelial_tissue' };
  function sceneFrame(sc, T, P, R, q) {
    const what = q && q.what;
    switch (sc.type) {
      case 'tissue2': return tissue2Frame(sc.id, T);
      case 'tissue': { const f = tissueFrame(sc.node || TISSUE_NODE[sc.kind] || sc.kind, T, q && q.id); f.opts.kind = sc.kind; if (sc.variant) f.opts.variant = sc.variant; return f;   // variant: the same scene with another assignment table (assign/tissue.json sub) }
      case 'cell': {
        const fungal = sc.cell === 'fungal', type = fungal ? 'animal' : sc.cell, base = { animal: 'Animal cell', plant: 'Plant cell', bacterium: 'Bacterium' }[type] || 'Cell';
        const f = new Frame({ type: 'cell', name: base, unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone(), opts: { type, cname: fill(sc.cname, what) || (R.standIn && what ? `${cap(what)}: drawn as a generic ${type === 'bacterium' ? 'bacterium' : type + ' cell'}` : undefined), blurb: fill(sc.blurb, what) || undefined, node: q && q.node || undefined, stands: what || undefined } });
        return f;
      }
      case 'micro': return microFrame(sc.kind, T, null, { title: fill(sc.title, what), blurb: fill(sc.blurb, what), crystal: sc.crystal, material: sc.material });
      case 'mol': return new Frame({ type: 'mol', name: Z.molName[sc.mol] || sc.mol, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol: sc.mol, fixed: false, cname: R.title || undefined } });
      case 'crystal': return crystalFrame(sc.id, T);
      case 'liquid': return new Frame({ type: 'liquid', name: R.title || 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
      case 'gas': return new Frame({ type: 'gas', name: R.title || (sc.air === 'giant' ? 'Hydrogen and helium gas' : 'Air molecules'), unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: T.clone(), opts: Object.assign({}, sc.air ? { air: sc.air } : {}, sc.mix ? { mix: sc.mix, count: sc.count, gasTitle: fill(sc.title, what) || R.title || R.mtitle, gasBlurb: fill(sc.blurb, what), gasBody: fill(sc.body, what), gasNote: fill(sc.note, what) } : {}) });
      case 'plasma': return new Frame({ type: 'plasma', name: fill(sc.title, what) || R.title || 'Plasma', unit: 1e-9, radius: 40, r1: 3e-7, pos: T.clone(), opts: { title: fill(sc.title, what) || R.title, blurb: fill(sc.blurb, what), note: fill(sc.note, what) } });
      case 'atom': return atomFrame(sc.el, T, 1);
      case 'dna': return new Frame({ type: 'dna', name: 'DNA', unit: 1e-9, radius: 30, r1: 2.5e-7, pos: T.clone() });
      case 'landscape': return landscapeFrame(sc.biome, T, null, sc.body || (P && P.opts && P.opts.body));
    }
    return null;
  }
  /* the caption of a scene that was reached through the table: its name when the table gives one, and the honesty line in front of the scene's own note */
  function decorate(f, R) {
    const lead = (R.standIn ? 'A stand-in. ' : '') + (R.note || '') + (R.also && R.also.length ? ` Also in it, not built yet: ${R.also.join(', ')}.` : '');
    if (lead.trim()) { let inner = f.note || ''; Object.defineProperty(f, 'note', { configurable: true, enumerable: true, get: () => lead.trim() + (inner ? ' ' + inner : ''), set: v => { inner = v || ''; } }); }
    if (R.title && f.type !== 'mol' && f.type !== 'cell') { let own = f.name; Object.defineProperty(f, 'name', { configurable: true, enumerable: true, get: () => R.title, set: v => { own = v; } }); }
    f.dz = { material: R.id, standIn: !!R.standIn, note: lead.trim(), card: R.card || null };
    return f;
  }
  function make(P, id, T, q) {
    const R = resolve(id, q && q.what); if (!R) return null;
    if (R.stop) return { stop: R };
    const f = sceneFrame(R.scene, T, P, R, q); if (!f) return null;
    return { f: decorate(f, R), R };
  }

  /* ---------- the rule, as trySpawn calls it ---------- */
  let lastStop = null;   // {frame, text}: said once per place, not on every frame
  let asking = null;     // set while describe()/inside() only ask what lies below: a stop is then handed back, not said on screen
  function sayStop(F, R) {
    if (asking) { asking.stop = R; return; }
    if (!F._dzStop) F._dzStop = { p: new V3() }; Object.assign(F._dzStop, { D: cam.D, text: R.stop, card: R.card }); F._dzStop.p.copy(cam.T);
    if (!lastStop || lastStop.frame !== F || lastStop.text !== R.stop || performance.now() - lastStop.t > 20000) { lastStop = { frame: F, text: R.stop, t: performance.now() }; if (typeof message === 'function') message(R.stop); }
  }
  /* F has nothing of its own at T: the scene of the material under the zoom point, or null (a stop is said on screen) */
  Z.spawn = (F, T, hint) => Z.spawnFor(F, queryOf(F, hint), T);
  /* the same for a part the caller has already identified: q = {id, node, system, what, u (the object's userData)} */
  Z.spawnFor = (F, q, T) => {
    if (!Z.ready) return null;
    const r = materialOf(F, q); if (!r) return null;
    const x = make(F, r.id, T, q); if (!x) return null;
    if (x.stop) { sayStop(F, x.stop); return null; }
    F._dzStop = null; return x.f;
  };
  /* the scene of a named material at T (a micro scene that was opened for a material asks for it by name) */
  Z.spawnMat = (F, id, T, q) => { if (!Z.ready) return null; const x = make(F, id, T, q || {}); if (!x) return null; if (x.stop) { sayStop(F, x.stop); return null; } return x.f; };
  /* is there a way down from this part of F (a scene, not a stop)? Used for zoom floors and "no closer view" notes. */
  Z.has = (F, q) => { if (!Z.ready) return false; const r = materialOf(F, q); if (!r) return false; const R = resolve(r.id, q.what); return !!(R && !R.stop); };
  /* does the table name this very part (a row for its id, node or system, not just the frame's default)? A frame with a spawn of its own asks this first. */
  Z.known = (F, q) => Z.ready && !!materialOf(F, q, true);
  Z.covers = F => Z.ready && !!Z.A[tableKey(F)];
  /* The camera distance below which a frame without a spawn function of its own asks the table: the file's `spawnD` (else four times the frame's floor), and never
     less than one and a half times the size of the object the zoom is aimed at: once the camera is inside a galaxy's glow there is nothing left to point at. */
  Z.spawnD = F => {
    const a = Z.A[tableKey(F)]; let d = (a && a.spawnD) || (F.floorD ? F.floorD * 4 : 0);
    const z = lastZoomHit; if (z && z.frame === F && z.obj && typeof z.obj.userData.radius === 'number') d = Math.max(d, z.obj.userData.radius * F.unit * 1.5);
    return d;
  };
  /* the camera is held at a floor and nothing is known below it: say so (once per place), rather than stop without a word */
  let lastFloor = null;
  Z.floorSay = F => {
    if (F.type === 'thing' || F._dzStop || !Z.ready) return;   // a thing says it itself (thAtFloor); a stop has been explained already
    const now = performance.now(); if (lastFloor && lastFloor.f === F && now - lastFloor.t < 15000) return;
    lastFloor = { f: F, t: now }; if (typeof message === 'function') message('No closer view has been built here yet: this picture ends at this distance.');
  };
  Z.materialOf = (F, hint) => { const r = Z.ready ? materialOf(F, queryOf(F, hint)) : null; return r ? r.id : null; };
  Z.resolve = resolve; Z.queryOf = queryOf;

  /* ---------- the contract ---------- */
  const hintOf = h => ({ frame: h.frame, obj: h.obj, point: (h.pointLocal || h.point || new V3()).clone(), normal: h.normalLocal || null, id: h.id, hit: h.hit || null });
  const viewD = f => VIEW_D[f.type] || (f.r1 !== Infinity ? f.r1 * .2 : f.radius * f.unit * 2.5);
  /* the name a scene will have once it is built (a molecule, crystal or tissue scene takes its name from its data when it loads) */
  const nameOf = f => {
    const o = f.opts || {}; let n = f.name || '';
    if (f.type === 'mol') n = o.cname || Z.molName[o.mol] || n; else if (f.type === 'crystal' && n === 'Crystal lattice') n = Z.crystalName[o.id] || n;
    else if (f.type === 'cell' && o.cname) n = o.cname; else if (f.type === 'tissue2' && n === 'Inside the tissue') n = Z.tisName[o.id] || n;
    return !n || /^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$/.test(n) ? String(n || f.type).replace(/_/g, ' ') : n;
  };
  function flyInto(P, f, D) { f.dynamic = true; f.keep = performance.now() + 60000; P.addChild(f); f.ensure(); if (typeof closeInfo === 'function') closeInfo(); flyTo(f, new V3(), D || viewD(f)); }
  /* what the next level down is for a pick: {ok, title, kind, standIn, note, go()} or {ok: false, reason, card} */
  function plan(h, act) {
    if (!h || !h.frame || !h.obj) return { ok: false, reason: 'Point at something first.', card: null };
    const F = h.frame, u = h.obj.userData || {}, hint = hintOf(h), q = queryOf(F, hint), P = hint.point;
    // 1. a body part with a cut-open view: that view is its inside
    const og = F.children && u.node && F.children.find(c => c.enterOnly && c.opts && c.opts.organ === u.node);
    if (og) return { ok: true, title: og.name, kind: 'cut-open view', standIn: false, note: '', go: () => flyTo(og, new V3(), og.opts.R * 2.2) };
    // 2. the frame's own answer at that point (a part's `deeper`, an atom of a molecule, a nucleon of a nucleus, the tissue of a body part ...), then the table
    let f = null, R = null; att.f = null; att.id = -1;   // the thing pointed at decides, not an attractor an earlier scroll was closing on
    asking = { stop: null };
    try {
      if (F.spawn) { try { f = F.spawn(P.clone(), hint); } catch (e) { f = null; } }
      if (f && f.dz) R = { standIn: f.dz.standIn, note: f.dz.note };
      if (!f && !asking.stop && Z.ready) { const r = materialOf(F, q); if (r) { const x = make(F, r.id, P, q); if (x && x.stop) asking.stop = x.stop; else if (x) { f = x.f; R = x.R; } } }
    } finally { var said = asking.stop; asking = null; }
    if (!f && said) return { ok: false, reason: said.stop, card: said.card || q.node || null };
    // a fixed frame that sits at the picked point (a planet in the solar system, the park in its region, the DNA in the cell's nucleus) is the inside of what marks it
    if (!f) { const ch = (F.children || []).find(c => !c.dynamic && !c.enterOnly && !c.coRender && (c.proxy === h.obj || c.containsP(P))); if (ch) return { ok: true, title: nameOf(ch), kind: KIND_WORD[ch.type] || 'place', standIn: false, note: '', go: () => flyTo(ch, new V3(), Math.min(ch.r1 !== Infinity ? ch.r1 * .5 : Infinity, VIEW_D[ch.type] || ch.radius * ch.unit * 2.5)) }; }
    if (f) return { ok: true, title: nameOf(f), kind: KIND_WORD[f.type] || f.type, standIn: !!(R && R.standIn) || /stand-in|stands in|generic/i.test(f.name || ''), note: (R && R.note) || (typeof f.note === 'string' ? f.note : '') || '', go: () => flyInto(F, f) };
    // 3. the older "See what it is made of" kinds
    if (typeof u.madeOf === 'string' && typeof diveMaterial === 'function' && LEGACY[u.madeOf]) return { ok: true, title: LEGACY[u.madeOf], kind: 'material', standIn: u.madeOf === 'protein', note: '', go: () => diveMaterial(h) };
    return { ok: false, reason: (F._dzStop && F._dzStop.text) || `No closer view of ${(q.what || 'this').toLowerCase()} has been built yet.`, card: q.node || null };
  }
  const LEGACY = { gasgiant: 'Hydrogen and helium gas', plasma: 'Plasma', gas: 'Gas molecules', water: 'Liquid water', molecule: 'Molecules', silicon: 'Silicon crystal', crystal: 'Crystal lattice', rock: 'Crystal lattice', cell: 'A cell', leaf: 'Leaf surface', protein: 'An amino acid (stands in for the protein)', atom: 'The atom', quarks: 'Inside the nucleon' };
  Z.inside = h => {
    // an object that names its own destination (the Sun: "to the surface point you chose") is flown to; once the camera is already there, what is inside it comes next
    const zt = h && h.obj && h.obj.userData && h.obj.userData.zoomTo, there = h && h.frame === cam.A && cam.D < 8 * (spawnDOf(cam.A) || 0);
    if (zt && !there && zt(h) !== false) return { ok: true, title: (h.obj.userData.title || ''), note: '' };
    const p = plan(h); if (!p.ok) { if (typeof message === 'function') message(p.reason); return { ok: false, reason: p.reason, card: p.card || null }; }
    if (typeof cancelTour === 'function') cancelTour();
    lastZoomHit = hintOf(h); p.go(); return { ok: true, title: p.title, note: p.note };
  };
  Z.describe = h => { const p = plan(h); return p.ok ? { title: p.title, kind: p.kind, standIn: p.standIn, note: p.note } : { title: null, kind: 'stop', standIn: false, note: p.reason, card: p.card || null }; };
  /* one level back out: to the frame this one sits in, looking at the place it sits, from far enough that the level left is a point of the larger picture */
  Z.up = () => {
    const A = cam.A, P = A && A.parent; if (!P) return { ok: false, reason: 'This is the widest view there is.' };
    const at = A.pos.clone(); if (A.center) at.add(A.center.clone().multiplyScalar(A.unit / P.unit).applyQuaternion(A.quat));
    const wide = P.type === 'body' ? .6 : P.isThing ? P.radius * P.unit * .9 : P.type === 'organ' && P.opts && P.opts.R ? P.opts.R * 2.2 : P.type === 'phone' ? .25 : P.type === 'park' ? Math.max(6, A.radius * A.unit * 3.2) : 0;   // where the larger thing is seen as a thing
    let D = Math.max(VIEW_D[P.type] || 0, wide, A.radius === Infinity ? 0 : A.radius * A.unit * 3.2, A.r1 !== Infinity && !A.coRender ? A.r1 * 1.3 : 0);
    if (P.r1 !== Infinity) D = Math.min(D, P.r1 * .5); if (!(D > 0)) D = cam.D * 10;
    flyTo(P, at, D); return { ok: true, title: typeof humanName === 'function' ? humanName(P) : P.name };
  };
  return Z;
})();
WORLD_EXT.push(async () => { await DESCENT.load(); getJSON('data/molecules_all.json').then(A => { (A.index || []).forEach(m => { DESCENT.molName[m.id] = m.name; }); }).catch(() => { }); });
