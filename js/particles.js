'use strict';
/* =====================================================================
   PARTICLES: the proton and neutron, the nucleus, and the Standard Model.

   Frame types defined here (they replace the old versions in world_matter.js, which loads earlier):
     FT.proton   unit 1e-15 m  inside a proton or neutron: valence quarks, gluons, a sea of pairs (a cartoon)
     FT.nucleus  unit 1e-15 m  A nucleons for any Z and N; protons and neutrons differ by shape cue as well as colour
     FT.sm       unit 1e-18 m  "the Standard Model view": the seventeen particles, at the bottom of the zoom
   Everything global is under PX. Data: data/particles.json (PDG 2026) and the sm_* nodes in data/nodes/phys_particles.json.
   ===================================================================== */
const PX = {};
PX.D = null; PX.P = {}; PX.byNode = {}; PX.H = {}; PX.ready = null;
PX.load = () => PX.ready || (PX.ready = getJSON('data/particles.json').then(d => {
  PX.D = d; d.particles.forEach(p => { PX.P[p.id] = p; PX.byNode[p.node] = p; });
  d.hadrons.forEach(h => PX.H[h.id] = h); d.composites.forEach(c => PX.H[c.id] = c);
  return d;
}).catch(e => { console.error('particles.json failed', e); return null; }));

/* ---------- palette ---------- */
PX.COL = { quark: 0xa98bd9, lepton: 0x58b88a, neutrino: 0x8fd6c4, boson: 0xe58d5b, higgs: 0xe9c94f, proton: 0xe0664a, neutron: 0xb4c0d0 };
PX.CC = [0xe2533f, 0x3fae6b, 0x3f80e0];        // colour charge "red", "green", "blue" (a label, not a real colour)
PX.ACC = [0x2bbfcf, 0xd24fae, 0xe8c23a];       // anticolours: anti-red = cyan, anti-green = magenta, anti-blue = yellow
PX.CL = ['R', 'G', 'B']; PX.ACL = ['R̄', 'Ḡ', 'B̄'];
PX.CSS = c => '#' + new THREE.Color(c).getHexString();
const _px_v = new V3(), _px_v2 = new V3(), _px_q = new THREE.Quaternion();

/* ---------- text glyphs drawn on the balls (so meaning never rests on colour alone) ---------- */
PX.glyph = (main, o = {}) => {
  const key = 'px|' + JSON.stringify([main, o.sub || '', o.sup || '', !!o.anti, o.line || '', o.fg || '']);
  return canvasTex(key, 256, 256, g => {
    g.clearRect(0, 0, 256, 256); g.textBaseline = 'alphabetic'; g.fillStyle = o.fg || '#ffffff'; g.strokeStyle = o.fg || '#ffffff';
    const big = o.line ? 118 : 138, y0 = o.line ? 138 : 164;
    g.font = `italic 600 ${big}px 'Source Serif 4', Georgia, 'Times New Roman', serif`;
    const w = g.measureText(main).width; let x = 128 - w / 2 - (o.sub || o.sup ? 16 : 0);
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 6;
    g.fillText(main, x, y0);
    if (o.anti) { g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w * .1, y0 - big * .78); g.lineTo(x + w * .95, y0 - big * .78); g.stroke(); }
    g.font = `italic 600 ${big * .5}px 'Source Serif 4', Georgia, serif`;
    if (o.sub) g.fillText(o.sub, x + w + 2, y0 + big * .18);
    if (o.sup) { g.font = `600 ${big * .5}px 'Source Serif 4', Georgia, serif`; g.fillText(o.sup, x + w + 2, y0 - big * .5); }
    if (o.line) { g.font = `600 ${big * .42}px 'IBM Plex Sans', system-ui, sans-serif`; const lw = g.measureText(o.line).width; g.fillText(o.line, 128 - lw / 2, 226); }
  });
};

/* ---------- an illustrated ball: toon body, ink edge, symbol, hit sphere ---------- */
PX.orb = (r, color, o = {}) => {
  const grp = new THREE.Group(), parts = [];
  const body = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), illoMat(color, o.hollow ? { extra: { opacity: .2 } } : {}));
  grp.add(body); parts.push({ m: body.material, base: o.hollow ? .2 : 1 });
  let ol = null;
  if (!o.noOl) { ol = new THREE.Mesh(body.geometry, outlineMat(o.ink || (o.hollow ? color : 0x0a1020), o.hollow ? .0075 : .0042)); grp.add(ol); parts.push({ m: ol.material, base: o.hollow ? .95 : .9 }); }
  let glyph = null;
  if (o.glyph) {
    glyph = new THREE.Sprite(new THREE.SpriteMaterial({ map: PX.glyph(o.glyph.main, o.glyph), transparent: true, depthWrite: false }));
    glyph.scale.set(r * 1.55, r * 1.55, 1); glyph.renderOrder = 5; grp.add(glyph); parts.push({ m: glyph.material, base: 1 });
  }
  let halo = null;
  if (o.halo) { halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false })); halo.scale.set(r * o.halo, r * o.halo, 1); grp.add(halo); parts.push({ m: halo.material, base: o.haloA || .3 }); }
  let hit = null;
  if (o.hit !== false) { hit = new THREE.Mesh(new THREE.SphereGeometry(r * (o.hitK || 1.25), 12, 8), hitMat()); grp.add(hit); }
  Object.assign(grp.userData, { body, ol, glyph, halo, hit, parts, r, a: 1 });
  return grp;
};
/* apply an overall opacity a (0..1) and the owning frame's fade fa; materials keep baseOp so the engine's fade agrees */
PX.setA = (orb, a, fa) => {
  const u = orb.userData; u.a = a;
  for (const p of u.parts) {
    const v = p.base * a, m = p.m; m.userData.baseOp = v;
    if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = v * fa; else { m.opacity = v * fa; m.transparent = true; }
  }
  orb.visible = a * fa > .01;
};
PX.setGlyph = (orb, main, o) => { const g = orb.userData.glyph; if (!g) return; const t = PX.glyph(main, o); if (g.material.map !== t) { g.material.map = t; g.material.needsUpdate = true; } };
PX.setColor = (orb, c) => { orb.userData.body.material.color.copy(c); if (orb.userData.halo) orb.userData.halo.material.color.copy(c); };
PX.face = (F, orbs) => { _px_v.set(0, 0, 1).applyQuaternion(F.cam.quaternion); for (const o of orbs) { const g = o.userData.glyph; if (g) g.position.copy(_px_v).multiplyScalar(o.userData.r * 1.04); } };
PX.fa = F => Math.min(1, Math.max(0, F.alpha === undefined ? 1 : F.alpha));

/* ---------- label de-cluttering: the engine has none, so hide the lower-priority label of any pair that overlaps ---------- */
PX.declutter = (F, items) => {
  const rects = [], seen = [];
  const live = [];
  for (const it of items) {
    const L = it.L; if (!L || !L.obj) continue;
    if (!visibleChain(L.obj) || (typeof labelsOn !== 'undefined' && !labelsOn && !L.always)) { if (L.el.textContent) L.el.textContent = ''; continue; }
    L.obj.getWorldPosition(_px_v).add(_px_v2.copy(L.off)); _px_v.project(F.cam);
    if (_px_v.z > 1 || Math.abs(_px_v.x) > 1.02 || Math.abs(_px_v.y) > 1.02) { continue; }
    const text = typeof it.text === 'function' ? it.text() : it.text;
    const x = (_px_v.x * .5 + .5) * W, y = (-_px_v.y * .5 + .5) * H, w = text.length * 6.9 + 22, h = 16;
    live.push({ it, L, text, x0: x - w / 2, x1: x + w / 2, y0: y - h * 1.2, y1: y - h * .2 + 2 });
  }
  live.sort((a, b) => (b.it.pri || 0) - (a.it.pri || 0));
  for (const c of live) {
    let hide = false; for (const r of rects) if (c.x0 < r.x1 + 4 && c.x1 > r.x0 - 4 && c.y0 < r.y1 + 2 && c.y1 > r.y0 - 2) { hide = true; break; }
    const want = hide ? '' : c.text;
    if (c.L.el.textContent !== want) c.L.el.textContent = want;
    if (!hide) rects.push(c);
  }
};
PX.lab = (F, obj, text, o = {}) => { const L = F.label(obj, text, o); return L; };

/* ---------- small DOM panels (porcelain, per frame; the engine mounts and unmounts them with the frame) ---------- */
PX.el = (html, cls) => { const d = document.createElement('div'); d.className = cls || 'pxp'; d.innerHTML = html; const hh = d.querySelector('.pxh'); d.dataset.sec = hh ? hh.textContent : 'About this view'; d.dataset.secKey = (cls || 'pxp') + ':' + d.dataset.sec; return d; };   // data-sec: shown as a section of the one panel, not as a box over the scene (updateControls, js/engine.js)
PX.fmtFrac = s => ({ '2/3': '⅔', '-1/3': '−⅓', '1/3': '⅓', '-2/3': '−⅔', '1': '1', '-1': '−1', '0': '0' }[s] || s);
PX.chgText = (frac, flip) => { const f = String(frac); const m = { '2/3': '+⅔', '-1/3': '−⅓', '-1': '−1', '0': '0', '±1': '±1', '1': '+1' }; if (flip) { const n = { '2/3': '−⅔', '-1/3': '+⅓', '-1': '+1', '0': '0', '±1': '∓1', '1': '−1' }; return n[f] || f; } return m[f] || f; };

/* ---------- cards: extra buttons on the sm_* topic cards (wraps showBodyNode; nothing else is touched) ---------- */
PX.addRow = (rowHtml, wire, label) => {
  if (!infoEl) return;
  const row = document.createElement('div'); row.className = 'pxrow'; row.innerHTML = (label ? `<div class="rh">${label}</div>` : '') + `<div class="btnrow">${rowHtml}</div>`;
  const first = infoEl.querySelector('.btnrow'), refs = infoEl.querySelector('.refs');
  if (first && first.parentNode === infoEl) first.after(row); else if (refs) refs.before(row); else infoEl.appendChild(row);
  wire(row);
};
PX.btn = (id, text, alt = true) => `<button class="zoom${alt ? ' alt' : ''}" data-px="${id}">${text}</button>`;
(function wrapCards() {
  const orig = showBodyNode;
  showBodyNode = function (id, h) {
    const r = orig.apply(this, arguments);
    try { if (r !== false && typeof id === 'string' && id.startsWith('sm_') && PX.cardExtras) PX.cardExtras(id, h); } catch (e) { console.error('particle card extras failed', e); }
    return r;
  };
})();

/* =====================================================================
   FT.proton: inside a proton or a neutron
   ===================================================================== */
PX.FLAV = { u: { node: 'sm_up', name: 'Up quark', q: '+⅔' }, d: { node: 'sm_down', name: 'Down quark', q: '−⅓' }, s: { node: 'sm_strange', name: 'Strange quark', q: '−⅓' } };
PX.quarksOf = kind => kind === 'neutron' ? ['u', 'd', 'd'] : ['u', 'u', 'd'];
PX.PR = 0.84;      // fm: the measured charge radius of the proton (PDG 2026: 0.8407 ± 0.0006 fm); the neutron's is smaller and not a plain radius
PX.dashRing = (key, col, lw) => canvasTex('px|ring|' + key, 512, 512, g => {
  g.clearRect(0, 0, 512, 512); g.strokeStyle = col; g.lineWidth = lw || 3; g.setLineDash([10, 9]); g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.stroke();
});
FT.proton = {
  build(F, o) {
    let kind = o.kind === 'neutron' ? 'neutron' : 'proton';
    F.illo = true; F.env = { bg: 0x0b1222, opaque: true };
    F.add(new THREE.HemisphereLight(0xe3ebff, 0x40486e, .8)); const dl = new THREE.DirectionalLight(0xffffff, .85); dl.position.set(2, 3, 4); F.add(dl);
    const R = PX.PR, rnd = rng(kind === 'neutron' ? 91 : 17);
    const root = new THREE.Group(); F.add(root);
    // the proton as a whole (a soft, faint boundary: the proton has no sharp edge)
    const whole = new THREE.Group(); whole.userData = { id: 'sm_' + kind + '_all', node: 'sm_' + kind, priority: 0, title: kind === 'proton' ? 'Proton' : 'Neutron' };
    const wh = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 14), hitMat()); whole.add(wh); root.add(whole); F.pickables.push(whole);
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: PX.dashRing('proton', 'rgba(190,205,235,.75)'), transparent: true, depthWrite: false, opacity: .55 }));
    ring.scale.set(R * 2, R * 2, 1); root.add(ring);
    const edge = new THREE.Object3D(); root.add(edge);
    // three valence quarks
    const S = { kind, Q: [], gl: [], pairs: [], next: 1.2, t: 0 };
    const flav = PX.quarksOf(kind), cols = [0, 1, 2];
    const colOrder = shuffle(cols.slice(), rnd);
    flav.forEach((fl, i) => {
      const orb = PX.orb(.17, PX.CC[colOrder[i]], { glyph: { main: fl, line: PX.CL[colOrder[i]] }, halo: 4.2, haloA: .32, hitK: 1.2 });
      orb.userData.id = PX.FLAV[fl].node; orb.userData.node = PX.FLAV[fl].node; orb.userData.priority = 2; orb.userData.title = PX.FLAV[fl].name + ' (valence)'; orb.userData.sm = fl === 'u' ? 'up' : 'down';
      root.add(orb); F.pickables.push(orb);
      S.Q.push({ orb, fl, ci: colOrder[i], tgt: colOrder[i], col: new THREE.Color(PX.CC[colOrder[i]]), p: new V3(), ph: [rnd() * 6, rnd() * 6, rnd() * 6] });
    });
    // flux tubes (three soft rods to a junction) and the gluon-field haze
    const tubeGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    const tubes = S.Q.map(q => { const m = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: PX.CC[0], transparent: true, opacity: .5, depthWrite: false })); root.add(m); return m; });
    const tubeGrp = new THREE.Group(); tubeGrp.userData = { id: 'sm_strong_force', node: 'sm_strong_force', priority: 1, title: 'The gluon field (strong force)' };
    const th = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), hitMat()); tubeGrp.add(th); root.add(tubeGrp); F.pickables.push(tubeGrp);
    const NH = 260, hpos = new Float32Array(NH * 3), hcol = new Float32Array(NH * 3), hseg = [];
    for (let i = 0; i < NH; i++) hseg.push({ k: i % 3, s: rnd(), off: new V3(gauss(rnd), gauss(rnd), gauss(rnd)).multiplyScalar(.075) });
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hpos, 3)); hg.setAttribute('color', new THREE.BufferAttribute(hcol, 3));
    const hazeMat = new THREE.PointsMaterial({ size: .1, map: glowTex(), vertexColors: true, transparent: true, opacity: .5, depthWrite: false, sizeAttenuation: true });
    const haze = new THREE.Points(hg, hazeMat); haze.frustumCulled = false; root.add(haze);
    const junction = new THREE.Object3D(); root.add(junction);
    // a gluon: a small ball in two halves, one half the colour it carries and the other its anticolour
    const halfGeo = [new THREE.SphereGeometry(.1, 18, 12, 0, Math.PI), new THREE.SphereGeometry(.1, 18, 12, Math.PI, Math.PI)];
    const gluon = new THREE.Group(); gluon.userData = { id: 'sm_gluon', node: 'sm_gluon', priority: 2.2, title: 'A gluon', sm: 'gluon' };
    const gm = halfGeo.map(g => new THREE.Mesh(g, illoMat(0xffffff, { double: true }))); gm.forEach(m => gluon.add(m));
    const gh = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), hitMat()); gluon.add(gh);
    gluon.visible = false; root.add(gluon); F.pickables.push(gluon); S.gluon = { g: gluon, mats: gm.map(m => m.material), t: -1, from: 0, to: 1, dur: .9, mv: false, A: 0, Bc: 0 };
    // the sea of short-lived quark-antiquark pairs (a visual metaphor for the proton's measured sea-quark content)
    const SF = ['u', 'd', 's', 'u', 'd'];
    for (let i = 0; i < 6; i++) {
      const grp = new THREE.Group(), ci = i % 3;
      const fl = SF[i % SF.length];
      const qo = PX.orb(.045, PX.CC[ci], { glyph: { main: fl }, hit: false, noOl: true }), ao = PX.orb(.045, PX.ACC[ci], { hollow: true, glyph: { main: fl, anti: true }, hit: false });
      const link = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6, 1), new THREE.MeshBasicMaterial({ color: 0xdfe6f5, transparent: true, opacity: .55, depthWrite: false }));
      const hit = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), hitMat());
      grp.add(qo, ao, link, hit); grp.userData = { id: 'sm_virtual_particles', node: 'sm_virtual_particles', priority: 1.6, title: 'A quark–antiquark pair from the sea' };
      root.add(grp); F.pickables.push(grp);
      const pr = .25 + rnd() * .5, pu = rnd() * 2 - 1, pt = rnd() * TAU, ps = Math.sqrt(1 - pu * pu);
      S.pairs.push({ grp, qo, ao, link, ci, fl, t0: -rnd() * 2.5, life: 2.6 + rnd() * 1.8, c: new V3(pr * ps * Math.cos(pt), pr * pu, pr * ps * Math.sin(pt)), dir: new V3(rnd() - .5, rnd() - .5, rnd() - .5).normalize(), lab: i === 0 });
    }
    // labels
    const labs = [];
    S.Q.forEach((q, i) => { const L = F.label(q.orb, PX.FLAV[q.fl].name.replace(' quark', ' quark'), { offset: new V3(0, -.3, 0) }); labs.push({ L, text: () => PX.FLAV[q.fl].name, pri: 9 - i * .1 }); });
    labs.push({ L: F.label(junction, 'Gluon field', { offset: new V3(0, .12, 0) }), text: 'Gluon field', pri: 6 });
    labs.push({ L: F.label(S.pairs[0].grp, 'Sea pair', { offset: new V3(0, -.16, 0) }), text: 'Quark–antiquark pair', pri: 4 });
    labs.push({ L: F.label(S.gluon.g, 'Gluon', { offset: new V3(0, .15, 0) }), text: 'Gluon', pri: 8 });
    labs.push({ L: F.label(edge, 'Edge', { offset: new V3(0, 0, 0) }), text: () => S.kind === 'proton' ? 'Proton edge ≈ 0.84 fm (charge radius)' : 'Edge: drawn as for the proton (not measured the same way)', pri: 3 });
    F.name = kind === 'proton' ? 'Proton' : 'Neutron';
    F.blurb = kind === 'proton' ? 'Inside a proton: two up quarks and a down quark, trading gluons, in a sea of quark–antiquark pairs.' : 'Inside a neutron: one up quark and two down quarks, trading gluons, in a sea of quark–antiquark pairs.';
    F.note = 'A cartoon, not a photograph. Quarks have no measured size (no structure found down to about 10⁻¹⁹ m), nothing here has a definite position, and the sizes are not to scale. The share of momentum carried by gluons depends on the energy scale: at 2 GeV one lattice calculation gives 51 ± 3%, while global fits to scattering data give about 40% (the neutron should match, by symmetry).';
    F.spawnD = 2.4e-16;
    F.spawn = (T, hint) => PX.smFrame(F, T, hint, S);
    F.proto = S;
    // controls: switch between proton and neutron, plus two doors to the ideas
    const which = seg([['proton', 'Proton (uud)'], ['neutron', 'Neutron (udd)']], kind, k => S.setKind(k));
    const b1 = actBtn('What is colour charge?', () => showBodyNode('sm_colour_confinement', null));
    const b2 = actBtn('Where does the mass come from?', () => showBodyNode('sm_proton_mass_origin', null));
    const leg = uiEl(PX.el(`<div class="pxh">Key</div><div class="pxk"><i class="b"></i> a quark (letter = flavour, R/G/B = colour charge, which is not a real colour)</div><div class="pxk"><i class="b hol"></i> hollow: an antiquark (bar over the letter, anticolour)</div><div class="pxk"><i class="b gl"></i> two-colour ball: a gluon carrying a colour and an anticolour</div><div class="pxk">Sizes mean nothing: the balls are far bigger than any quark.</div>`, 'pxp pxkey'));
    S.which = which;
    const tmp = new V3(), qa = new THREE.Quaternion(), e1 = new V3(), e2 = new V3(), up = new V3(0, 1, 0), tc = new THREE.Color();
    S.setKind = k => {
      const frame = F, st = S; if (st.kind === k) return; st.kind = k; const fl = PX.quarksOf(k);
      st.Q.forEach((q, i) => { q.fl = fl[i]; const f = PX.FLAV[q.fl]; q.orb.userData.id = f.node; q.orb.userData.node = f.node; q.orb.userData.title = f.name + ' (valence)'; q.orb.userData.sm = q.fl === 'u' ? 'up' : 'down'; });
      whole.userData.node = 'sm_' + k; whole.userData.id = 'sm_' + k + '_all'; whole.userData.title = k === 'proton' ? 'Proton' : 'Neutron';
      frame.name = k === 'proton' ? 'Proton' : 'Neutron'; frame.opts.kind = k;
      frame.blurb = k === 'proton' ? 'Inside a proton: two up quarks and a down quark, trading gluons, in a sea of quark–antiquark pairs.' : 'Inside a neutron: one up quark and two down quarks, trading gluons, in a sea of quark–antiquark pairs.';
      capFrame = null;
    };
    F.update = (dt, t) => {
      S.t += dt; const T = S.t, zf = smooth(1.1e-16, 3.3e-16, cam.D), fa = PX.fa(F) * zf;   // below about 3e-16 m the cartoon dissolves, leaving room for the Standard Model view
      // quark positions: a slowly tumbling triangle plus a wander, so that no quark has a fixed place
      qa.setFromEuler(new THREE.Euler(T * .17, T * .11, T * .07)); e1.set(1, 0, 0).applyQuaternion(qa); e2.set(0, 1, 0).applyQuaternion(qa);
      junction.position.set(0, 0, 0);
      S.Q.forEach((q, i) => {
        const a = T * .55 + i * TAU / 3; const wob = .075;
        q.p.set(0, 0, 0).addScaledVector(e1, Math.cos(a) * .36).addScaledVector(e2, Math.sin(a) * .36);
        q.p.x += Math.sin(T * 1.7 + q.ph[0]) * wob; q.p.y += Math.sin(T * 1.3 + q.ph[1]) * wob; q.p.z += Math.sin(T * 1.9 + q.ph[2]) * wob;
        q.orb.position.copy(q.p);
        q.col.lerp(tc.setHex(PX.CC[q.tgt]), 1 - Math.exp(-dt * 7)); PX.setColor(q.orb, q.col);
        q.ci = q.tgt; PX.setGlyph(q.orb, q.fl, { main: q.fl, line: PX.CL[q.tgt] });
        PX.setA(q.orb, 1, fa);
      });
      const J = tmp.set(0, 0, 0); S.Q.forEach(q => J.add(q.p)); J.multiplyScalar(1 / 3); junction.position.copy(J); tubeGrp.position.copy(J);
      S.Q.forEach((q, i) => {
        const m = tubes[i], d = _px_v.copy(q.p).sub(J), L = d.length(); m.position.copy(J).addScaledVector(d, .5); m.scale.set(.034, Math.max(L, 1e-3), .034);
        m.quaternion.setFromUnitVectors(up, d.divideScalar(Math.max(L, 1e-4))); m.material.color.copy(q.col); m.material.opacity = .6 * fa; m.material.userData.baseOp = .6;
      });
      for (let i = 0; i < NH; i++) {
        const h = hseg[i], q = S.Q[h.k]; const s = h.s, wig = Math.sin(T * 1.4 + i) * .02;
        hpos[i * 3] = J.x + (q.p.x - J.x) * s + h.off.x + wig; hpos[i * 3 + 1] = J.y + (q.p.y - J.y) * s + h.off.y; hpos[i * 3 + 2] = J.z + (q.p.z - J.z) * s + h.off.z - wig;
        hcol[i * 3] = q.col.r * .85 + .1; hcol[i * 3 + 1] = q.col.g * .85 + .1; hcol[i * 3 + 2] = q.col.b * .85 + .1;
      }
      hg.attributes.position.needsUpdate = true; hg.attributes.color.needsUpdate = true; hazeMat.opacity = .5 * fa; hazeMat.userData.baseOp = .5;
      // gluon exchange: i emits a gluon carrying (its colour, anti of j's colour); i takes j's colour; j takes i's
      const G = S.gluon;
      if (!G.mv && T > S.next) {
        let i = (rnd() * 3) | 0, j = (i + 1 + ((rnd() * 2) | 0)) % 3; if (S.Q[i].tgt === S.Q[j].tgt) { S.next = T + .2; } else {
          G.mv = true; G.t = 0; G.from = i; G.to = j; G.A = S.Q[i].tgt; G.Bc = S.Q[j].tgt; S.Q[i].tgt = G.Bc;
          G.mats[0].color.setHex(PX.CC[G.A]); G.mats[1].color.setHex(PX.ACC[G.Bc]);
        }
      }
      if (G.mv) {
        G.t += dt / G.dur; const u = Math.min(1, G.t), e = u * u * (3 - 2 * u);
        G.g.position.copy(S.Q[G.from].p).lerp(S.Q[G.to].p, e); G.g.position.y += Math.sin(u * Math.PI) * .06; G.g.rotation.y += dt * 4; G.g.visible = fa > .05;
        if (u >= 1) { G.mv = false; G.g.visible = false; S.Q[G.to].tgt = G.A; S.next = T + 1.0 + rnd() * .9; }
      } else G.g.visible = false;
      G.mats.forEach(m => { m.userData.baseOp = 1; m.opacity = fa; m.transparent = true; });
      // sea pairs
      S.pairs.forEach(p => {
        let age = T - p.t0;
        if (age > p.life) { // a new pair somewhere else, nearer the outer part of the proton
          p.t0 = T; age = 0; p.life = 2.6 + rnd() * 1.8; const r = .25 + rnd() * .5; const u = rnd() * 2 - 1, th = rnd() * TAU, sq = Math.sqrt(1 - u * u);
          p.c.set(r * sq * Math.cos(th), r * u, r * sq * Math.sin(th)); p.dir.set(gauss(rnd), gauss(rnd), gauss(rnd)).normalize();
          if (p.lab) { p.c.set(.42 + rnd() * .1, .3 + rnd() * .15, .2); p.dir.set(.2, 1, .3).normalize(); }
        }
        const u = age / p.life, env = Math.sin(Math.PI * Math.min(1, u)), sep = .06 + .1 * env, a = Math.pow(env, .6);
        p.grp.position.copy(p.c); p.qo.position.copy(p.dir).multiplyScalar(sep); p.ao.position.copy(p.dir).multiplyScalar(-sep);
        p.link.position.set(0, 0, 0); p.link.scale.set(.012, Math.max(sep * 2 - .09, 1e-3), .012); p.link.quaternion.setFromUnitVectors(up, p.dir);
        PX.setA(p.qo, a, fa); PX.setA(p.ao, a, fa); p.link.material.opacity = .5 * a * fa; p.link.material.userData.baseOp = .5 * a; p.grp.visible = a * fa > .03;
      });
      // billboard the dashed edge ring and put its label on the right
      ring.material.opacity = .55 * fa; ring.material.userData.baseOp = .55; _px_v.set(1, 0, 0).applyQuaternion(F.cam.quaternion); _px_v2.set(0, 1, 0).applyQuaternion(F.cam.quaternion);
      edge.position.copy(_px_v).multiplyScalar(R * .72).addScaledVector(_px_v2, R * .72);
      PX.face(F, S.Q.map(q => q.orb).concat(S.pairs.flatMap(p => [p.qo, p.ao])));
      if (zf < .5) labs.forEach(l => { if (l.L.el.textContent) l.L.el.textContent = ''; }); else PX.declutter(F, labs);
    };
  }
};
PX.dive = {};

/* =====================================================================
   FT.nucleus: A nucleons, packed at about the real density, for any Z and N
   ===================================================================== */
PX.NR = 1.2;             // fm: R = 1.2 A^(1/3) fm, the textbook rule of thumb for the nuclear radius (a fuzzy edge)
PX.nuclearR = A => PX.NR * Math.cbrt(A);
/* pack A touching-or-nearly spheres into a ball of about the nuclear radius; positions in fm (deterministic for a given A) */
PX.pack = A => {
  const r = rng(A * 7 + 3), p = new Float64Array(A * 3), dmin = 1.76, Rc = Math.max(.05, PX.nuclearR(A) - .45);
  for (let i = 0; i < A; i++) { const u = r() * 2 - 1, th = r() * TAU, s = Math.sqrt(1 - u * u), q = Rc * Math.cbrt(r()); p[i * 3] = q * s * Math.cos(th); p[i * 3 + 1] = q * u; p[i * 3 + 2] = q * s * Math.sin(th); }
  for (let it = 0; it < 220; it++) {
    for (let i = 0; i < A; i++) for (let j = i + 1; j < A; j++) {
      let dx = p[j * 3] - p[i * 3], dy = p[j * 3 + 1] - p[i * 3 + 1], dz = p[j * 3 + 2] - p[i * 3 + 2]; let d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < dmin * dmin) { let d = Math.sqrt(d2); if (d < 1e-4) { dx = r() - .5; dy = r() - .5; dz = r() - .5; d = Math.hypot(dx, dy, dz); } const k = (dmin - d) / 2 / d; p[i * 3] -= dx * k; p[i * 3 + 1] -= dy * k; p[i * 3 + 2] -= dz * k; p[j * 3] += dx * k; p[j * 3 + 1] += dy * k; p[j * 3 + 2] += dz * k; }
    }
    const pull = it < 160 ? .985 : 1;
    for (let i = 0; i < A; i++) { let x = p[i * 3] * pull, y = p[i * 3 + 1] * pull, z = p[i * 3 + 2] * pull; const L = Math.hypot(x, y, z); if (A > 2 && L > Rc) { const k = Rc / L; x *= k; y *= k; z *= k; } p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; }
  }
  let cx = 0, cy = 0, cz = 0; for (let i = 0; i < A; i++) { cx += p[i * 3]; cy += p[i * 3 + 1]; cz += p[i * 3 + 2]; } cx /= A; cy /= A; cz /= A;
  for (let i = 0; i < A; i++) { p[i * 3] -= cx; p[i * 3 + 1] -= cy; p[i * 3 + 2] -= cz; }
  return p;
};
PX.nucleonGlyph = (isP) => ({ main: isP ? 'p' : 'n' });
FT.nucleus = {
  build(F, o) {
    const Z = Math.max(0, o.Z === undefined ? 8 : o.Z | 0), N = Math.max(0, o.N === undefined ? 8 : o.N | 0), A = Math.max(1, Z + N);
    F.illo = true; F.env = { opaque: true, bg: 0x0b1222 };
    F.add(new THREE.HemisphereLight(0xe3ebff, 0x40486e, .8)); const dl = new THREE.DirectionalLight(0xffffff, .85); dl.position.set(5, 8, 6); F.add(dl);
    const rn = PX.PR, r = rng(A * 11 + Z), pts = PX.pack(A), small = A > 90;
    const types = shuffle([...Array(Z).fill(true), ...Array(N).fill(false)], r); if (!types.length) types.push(true);
    const el = o.el || '';
    F.nucleons = [];
    types.forEach((isP, i) => {
      const orb = PX.orb(rn, isP ? PX.COL.proton : PX.COL.neutron, { glyph: PX.nucleonGlyph(isP), noOl: small, hit: false });
      orb.userData.glyph.scale.set(rn * 1.15, rn * 1.15, 1);
      const u = orb.userData; u.id = isP ? 'proton' : 'neutron'; u.node = isP ? 'sm_proton' : 'sm_neutron'; u.kind = u.id; u.priority = 3; u.madeOf = 'quarks'; u.title = isP ? 'Proton' : 'Neutron';
      u.base = new V3(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]); orb.position.copy(u.base); u.seed = r() * 100;
      F.add(orb); F.pickables.push(orb); F.nucleons.push(orb);
      if (isP) orb.userData.body.material.emissive.setHex(0x2a0a05);
    });
    const Rn = PX.nuclearR(A);
    const whole = new THREE.Group(); whole.userData = { id: 'nucleus_all', node: 'sm_residual_strong', priority: 0, title: `Nucleus (${Z} protons, ${N} neutrons)` };
    const wh = new THREE.Mesh(new THREE.SphereGeometry(Rn + 1.2, 16, 12), hitMat()); whole.add(wh); F.add(whole); F.pickables.push(whole);
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: PX.dashRing('nuc', 'rgba(190,205,235,.7)'), transparent: true, depthWrite: false, opacity: .5 }));
    ring.scale.set((Rn + .6) * 2, (Rn + .6) * 2, 1); F.add(ring);
    const edge = new THREE.Object3D(); F.add(edge);
    const ancP = new THREE.Object3D(), ancN = new THREE.Object3D(); F.add(ancP); F.add(ancN);
    let nP = F.nucleons.find(n => n.userData.kind === 'proton'), nN = F.nucleons.find(n => n.userData.kind === 'neutron');
    const labP = F.label(ancP, 'Proton', { offset: new V3(0, .2, 0) });
    const labN = nN ? F.label(ancN, 'Neutron', { offset: new V3(0, .2, 0) }) : null;
    const labE = F.label(edge, 'edge', {});
    F.name = F.name || `Nucleus${el ? ' of ' + el : ''}`;
    F.blurb = `${Z} proton${Z === 1 ? '' : 's'} and ${N} neutron${N === 1 ? '' : 's'}, packed at about the real density. Click one to open it and look inside.`;
    F.note = 'Schematic. Nucleons are drawn as touching balls the size of a proton (0.84 fm); in truth each is a fuzzy quantum state, the neighbours overlap, and the arrangement here is random. Red balls marked p are protons, pale balls marked n are neutrons.';
    F.spawnD = 4e-15;
    F.spawn = (T, hint) => {
      let best = null, bd = Infinity; F.nucleons.forEach(m => { const d = m.position.distanceTo(T); if (d < bd) { bd = d; best = m; } }); if (!best || bd > 1.6) return null;
      return new Frame({ type: 'proton', pinned: true, name: best.userData.kind === 'proton' ? 'Proton' : 'Neutron', unit: 1e-15, radius: 4, r1: 1.2e-14, pos: best.position.clone(), opts: { kind: best.userData.kind } });
    };
    uiEl(PX.el(`<div class="pxh">Key</div><div class="pxk"><i class="b p"></i> red ball marked p: a proton (${Z})</div><div class="pxk"><i class="b n"></i> pale ball marked n: a neutron (${N})</div><div class="pxk">The dashed ring is the textbook nuclear radius, 1.2·A^⅓ = ${Rn.toFixed(1)} fm.</div>`, 'pxp pxkey'));
    let lab0 = 0; const labs = [{ L: labP, text: 'Proton', pri: 5 }, { L: labE, text: `radius ≈ ${Rn.toFixed(1)} fm (1.2·A^⅓)`, pri: 2 }]; if (labN) labs.push({ L: labN, text: 'Neutron', pri: 5 });
    F.update = (dt, t) => {
      const fa = PX.fa(F);
      for (let i = 0; i < F.nucleons.length; i++) {
        const m = F.nucleons[i], u = m.userData, s = u.seed;
        m.position.set(u.base.x + Math.sin(t * 3 + s) * .035, u.base.y + Math.cos(t * 2.6 + s * 2) * .035, u.base.z + Math.sin(t * 2.2 + s * 3) * .035);
        PX.setA(m, 1, fa);
      }
      if (t - lab0 > .5) { // label the proton and neutron nearest the camera, so labels never sit on hidden balls
        lab0 = t; let bp = null, bn = null, dp = 1e9, dn = 1e9; F.nucleons.forEach(m => { const d = m.position.distanceToSquared(F.C); if (m.userData.kind === 'proton') { if (d < dp) { dp = d; bp = m; } } else if (d < dn) { dn = d; bn = m; } });
        if (bp) nP = bp; if (bn) nN = bn;
      }
      _px_v.set(0, 0, 1).applyQuaternion(F.cam.quaternion); if (nP) ancP.position.copy(nP.position).addScaledVector(_px_v, rn * .9); if (nN) ancN.position.copy(nN.position).addScaledVector(_px_v, rn * .9);
      ring.material.opacity = .5 * fa; ring.material.userData.baseOp = .5; _px_v.set(1, 0, 0).applyQuaternion(F.cam.quaternion); _px_v2.set(0, 1, 0).applyQuaternion(F.cam.quaternion);
      edge.position.copy(_px_v).multiplyScalar((Rn + .6) * .72).addScaledVector(_px_v2, -(Rn + .6) * .72);
      PX.face(F, F.nucleons);
      PX.declutter(F, labs);
    };
  }
};
/* a frame for the standard-model view, entered from a proton frame by zooming into it (stub until the view is built below) */
PX.smFrame = () => null;

/* =====================================================================
   THE STANDARD MODEL VIEW (FT.sm, unit 1e-18 m)
   Not a place: the list of what matter and the forces (except gravity) are made of, as far as experiments have reached.
   ===================================================================== */
PX.SM = { mode: 'overview', anti: false, force: 'strong', sel: null, decay: { i: 0 }, had: [], errs: 'mag' };
/* how each particle is drawn: symbol pieces, short label, overview grid position (x, y, z; units of 1e-18 m, arbitrary) */
PX.META = {
  up: { m: { main: 'u' }, a: { main: 'u', anti: true }, short: 'up', aname: 'anti-up', x: -5, y: 6.3 },
  charm: { m: { main: 'c' }, a: { main: 'c', anti: true }, short: 'charm', aname: 'anti-charm', x: 0, y: 6.3 },
  top: { m: { main: 't' }, a: { main: 't', anti: true }, short: 'top', aname: 'anti-top', x: 5, y: 6.3 },
  down: { m: { main: 'd' }, a: { main: 'd', anti: true }, short: 'down', aname: 'anti-down', x: -5, y: 2.1 },
  strange: { m: { main: 's' }, a: { main: 's', anti: true }, short: 'strange', aname: 'anti-strange', x: 0, y: 2.1 },
  bottom: { m: { main: 'b' }, a: { main: 'b', anti: true }, short: 'bottom', aname: 'anti-bottom', x: 5, y: 2.1 },
  electron: { m: { main: 'e', sup: '−' }, a: { main: 'e', sup: '+' }, short: 'electron', aname: 'positron', x: -5, y: -2.1 },
  muon: { m: { main: 'μ', sup: '−' }, a: { main: 'μ', sup: '+' }, short: 'muon', aname: 'antimuon', x: 0, y: -2.1 },
  tau: { m: { main: 'τ', sup: '−' }, a: { main: 'τ', sup: '+' }, short: 'tau', aname: 'antitau', x: 5, y: -2.1 },
  nu_e: { m: { main: 'ν', sub: 'e' }, a: { main: 'ν', sub: 'e', anti: true }, short: 'e neutrino', aname: 'anti-e-neutrino', x: -5, y: -6.3 },
  nu_mu: { m: { main: 'ν', sub: 'μ' }, a: { main: 'ν', sub: 'μ', anti: true }, short: 'μ neutrino', aname: 'anti-μ-neutrino', x: 0, y: -6.3 },
  nu_tau: { m: { main: 'ν', sub: 'τ' }, a: { main: 'ν', sub: 'τ', anti: true }, short: 'τ neutrino', aname: 'anti-τ-neutrino', x: 5, y: -6.3 },
  gluon: { m: { main: 'g' }, a: { main: 'g' }, short: 'gluon', self: true, x: 9.8, y: 6.3 },
  photon: { m: { main: 'γ' }, a: { main: 'γ' }, short: 'photon', self: true, x: 9.8, y: 2.1 },
  z_boson: { m: { main: 'Z', sup: '0' }, a: { main: 'Z', sup: '0' }, short: 'Z boson', self: true, x: 9.8, y: -2.1 },
  w_boson: { m: { main: 'W', sup: '±' }, a: { main: 'W', sup: '±' }, short: 'W boson', aname: 'W⁻ (the W⁺ and W⁻ are each other\'s antiparticle)', x: 9.8, y: -6.3 },
  higgs: { m: { main: 'H' }, a: { main: 'H' }, short: 'Higgs', self: true, x: 14.4, y: 0 },
};
PX.ORDER = ['up', 'charm', 'top', 'down', 'strange', 'bottom', 'electron', 'muon', 'tau', 'nu_e', 'nu_mu', 'nu_tau', 'gluon', 'photon', 'z_boson', 'w_boson', 'higgs'];
PX.gridPos = (id, out) => { const M = PX.META[id]; return out.set(M.x, M.y, id === 'higgs' ? -.5 : M.x > 8 ? 2.2 : .06 * M.x * M.x); };
/* mass axis: y = (log10(mass in eV) - 5) * 1.5 */
PX.my = ev => (Math.log10(ev) - 5) * 1.5;
PX.MASSX = { up: -7.6, down: -5.4, strange: -7.6, charm: -5.4, bottom: -7.6, top: -5.4, electron: -1.8, muon: -1.8, tau: -1.8, nu_e: 1.9, nu_mu: 3.3, nu_tau: 4.7, w_boson: 4.6, z_boson: 8.0, higgs: 11.4, gluon: 6.6, photon: 10.0 };
PX.MASSLESS_Y = -12.8;
PX.NUY = PX.my(.45) + 3.6;
PX.massPos = (id, out) => {
  const d = PX.P[id], x = PX.MASSX[id];
  if (id.startsWith('nu_')) return out.set(x, PX.NUY, 0);   // flavour states have no single mass: parked above the band, height means nothing
  if (d.mass && d.mass.eV) return out.set(x, PX.my(d.mass.eV), 0);
  return out.set(x, PX.MASSLESS_Y, 0);
};
/* quantum numbers for the decay bookkeeping (charge, lepton number, baryon number); the same table the checker uses */
PX.QN = (() => {
  const Q = {}, a = (n, q, L, B) => { Q[n] = [q, L, B]; };
  ['e', 'mu', 'tau'].forEach(f => { a(f + '-', -1, 1, 0); a(f + '+', 1, -1, 0); a('nu_' + f, 0, 1, 0); a('nubar_' + f, 0, -1, 0); });
  [['u', 2], ['c', 2], ['t', 2], ['d', -1], ['s', -1], ['b', -1]].forEach(([n, q3]) => { a(n, q3 / 3, 0, 1 / 3); a(n + 'bar', -q3 / 3, 0, -1 / 3); });
  ['gamma', 'g', 'Z', 'H', 'pi0'].forEach(n => a(n, 0, 0, 0)); a('W+', 1, 0, 0); a('W-', -1, 0, 0); a('pi+', 1, 0, 0); a('pi-', -1, 0, 0); a('p', 1, 0, 1); a('n', 0, 0, 1);
  return Q;
})();
/* how to write each decay product, and which of the data's generic products stands for which real one in the examples */
PX.KEY = {
  'e-': ['e⁻', 'electron'], 'e+': ['e⁺', 'positron'], 'mu-': ['μ⁻', 'muon'], 'mu+': ['μ⁺', 'antimuon'], 'tau-': ['τ⁻', 'tau'], 'tau+': ['τ⁺', 'antitau'],
  nu_e: ['νₑ', 'e neutrino'], nu_mu: ['ν_μ', 'μ neutrino'], nu_tau: ['ν_τ', 'τ neutrino'], nubar_e: ['ν̄ₑ', 'anti-e-neutrino'], nubar_mu: ['ν̄_μ', 'anti-μ-neutrino'], nubar_tau: ['ν̄_τ', 'anti-τ-neutrino'],
  u: ['u', 'up'], d: ['d', 'down'], s: ['s', 'strange'], c: ['c', 'charm'], b: ['b', 'bottom'], t: ['t', 'top'], ubar: ['ū', 'anti-up'], dbar: ['d̄', 'anti-down'], sbar: ['s̄', 'anti-strange'], cbar: ['c̄', 'anti-charm'], bbar: ['b̄', 'anti-bottom'],
  gamma: ['γ', 'photon'], g: ['g', 'gluon'], Z: ['Z⁰', 'Z boson'], H: ['H', 'Higgs'], 'W+': ['W⁺', 'W boson'], 'W-': ['W⁻', 'W boson'], 'pi+': ['π⁺', 'pion'], 'pi-': ['π⁻', 'pion'], pi0: ['π⁰', 'pion'], p: ['p', 'proton'], n: ['n', 'neutron'],
};
PX.EXAMPLE = { 'W+|hadrons': ['u', 'dbar'], 'Z|hadrons': ['b', 'bbar'], 'W+|lepton+,nu': ['e+', 'nu_e'], 'Z|lepton+,lepton-': ['e+', 'e-'], 'Z|nu,nubar': ['nu_e', 'nubar_e'] };
PX.KEYMASS = { 'e-': 'electron', 'e+': 'electron', 'mu-': 'muon', 'mu+': 'muon', 'tau-': 'tau', 'tau+': 'tau', 'W+': 'w_boson', 'W-': 'w_boson', Z: 'z_boson', H: 'higgs' };
/* every decay we can show: [{parent, label, in, out, note, br, virtualW}] */
PX.decayList = () => {
  const out = [];
  ['muon', 'tau', 'top', 'w_boson', 'z_boson', 'higgs', 'strange', 'charm', 'bottom', 'down'].forEach(id => {
    const d = PX.P[id];
    (d.decays || []).forEach(dc => {
      if (!dc.out || !dc.out.length) return;
      let o = dc.out, ex = null; const k = dc.in.join(',') + '|' + o.join(','); if (PX.EXAMPLE[k]) { o = PX.EXAMPLE[k]; ex = true; }
      if (!o.every(x => PX.QN[x] && PX.KEY[x])) return;
      const parent = dc.in[0];
      out.push({ pid: id, parent, in: dc.in, out: o, label: dc.label, note: dc.note || '', br: dc.br && dc.br.value, example: ex, virtualW: ['s', 'c', 'b', 'd'].includes(parent) && o.includes('W+') || o.includes('W-') && ['s', 'c', 'b', 'd'].includes(parent) });
    });
  });
  const n = PX.H.neutron;
  out.splice(out.findIndex(x => x.pid === 'tau') + 4, 0, { pid: 'neutron', parent: 'n', in: ['n'], out: ['p', 'e-', 'nubar_e'], label: 'n → p + e⁻ + ν̄ₑ', note: 'Beta decay: inside the neutron a down quark turns into an up quark by emitting a (virtual) W⁻, which becomes the electron and the antineutrino. A free neutron lasts about 15 minutes; PDG mean life ' + (n && n.lifetime && n.lifetime.ref ? n.lifetime.ref.display : '878 s') + '.', br: null, example: false });
  return out;
};
PX.massEV = key => { // rest energy in eV of a decay product, or null when it is not a single well-defined number
  if (key === 'p') return PX.H.proton.mass.value * 1e6; if (key === 'n') return PX.H.neutron.mass.value * 1e6;
  if (key === 'pi+' || key === 'pi-') return PX.H.pi_plus.mass.value * 1e6; if (key === 'pi0') return PX.H.pi_zero.mass.value * 1e6;
  if (key === 'gamma') return 0; if (/^nu/.test(key)) return 0;
  const id = PX.KEYMASS[key]; if (id && PX.P[id].mass && PX.P[id].mass.eV) return PX.P[id].mass.eV; return null;
};
PX.tot = names => { let q = 0, L = 0, B = 0; names.forEach(n => { const v = PX.QN[n]; q += v[0]; L += v[1]; B += v[2]; }); const r = x => Math.round(x * 3) / 3; return [r(q), Math.round(L), r(B)]; };
PX.fr3 = x => { const t = Math.round(x * 3); if (t % 3 === 0) return String(t / 3); const s = t < 0 ? '−' : ''; const a = Math.abs(t); return s + (a >= 3 ? Math.floor(a / 3) + ' ' : '') + (a % 3) + '/3'; };
PX.eVtext = ev => ev >= 1e9 ? (ev / 1e9).toPrecision(4).replace(/\.?0+$/, '') + ' GeV' : ev >= 1e6 ? (ev / 1e6).toPrecision(4).replace(/\.?0+$/, '') + ' MeV' : ev >= 1e3 ? (ev / 1e3).toPrecision(4) + ' keV' : ev.toPrecision(3) + ' eV';

PX.famColor = d => d.id.startsWith('nu_') ? PX.COL.neutrino : d.family === 'quark' ? PX.COL.quark : d.family === 'lepton' ? PX.COL.lepton : d.id === 'higgs' ? PX.COL.higgs : PX.COL.boson;
PX.glyphSpec = (id, anti) => { const M = PX.META[id], d = PX.P[id], g = Object.assign({}, anti ? M.a : M.m); let c = d.charge; g.line = anti && !M.self ? PX.chgText(c, true) : PX.chgText(c); return g; };
PX.accent = { strong: 0xe2533f, em: 0xf0c330, weak: 0x4aa3df, higgs: 0xe9c94f, gravity: 0xb9c2d3 };
PX.ringTex = () => canvasTex('px|ring2', 256, 256, g => { g.clearRect(0, 0, 256, 256); g.strokeStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 100, 0, TAU); g.stroke(); const gr = g.createRadialGradient(128, 128, 90, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
PX.hollow = (orb, h) => { // 0 = solid toon ball, 1 = hollow (antimatter) ball with a coloured ink edge
  const u = orb.userData; if (u.hol === h) return; u.hol = h;
  u.parts[0].base = 1 - .78 * h; if (u.ol) { u.parts[1].base = .9 + .08 * h; const c = u.ol.material.uniforms.uColor.value; c.setHex(0x0a1020).lerp(u.body.material.color, h); u.ol.material.uniforms.uW.value = .0042 + .0035 * h; }
};

FT.sm = {
  build(F, o) {
    const D = PX.D; F.illo = true; F.env = { bg: 0x0a1120, opaque: true };
    F.add(new THREE.HemisphereLight(0xe3ebff, 0x40486e, .8)); const dl = new THREE.DirectionalLight(0xffffff, .85); dl.position.set(3, 5, 6); F.add(dl);
    F.name = 'The Standard Model';
    F.blurb = 'The seventeen kinds of particle that, as far as experiments have reached, everything else is made of. Click any one.';
    F.note = 'This is not a place. It is the list of everything matter and the forces (except gravity) are made of, as far as experiments have reached.';
    F.r1 = F.r1 || 3e-16;
    if (!D) { F.blurb = 'The particle data did not load.'; return; }
    const SM = PX.SM, board = new THREE.Group(); F.add(board); F.board = board;
    const P = {}; F.parts = P;
    const hitFor = (g, id, node, title, pri) => { Object.assign(g.userData, { id, node, title, priority: pri }); F.pickables.push(g); };
    PX.ORDER.forEach(id => {
      const d = PX.P[id], M = PX.META[id];
      const orb = PX.orb(1, PX.famColor(d), { glyph: PX.glyphSpec(id, false), halo: 3.7, haloA: 0, hitK: 1.05 });
      hitFor(orb, d.node, d.node, d.name, 2); orb.userData.sm = id;
      board.add(orb);
      P[id] = { id, d, M, orb, pos: PX.gridPos(id, new V3()), tgt: new V3(), scale: 1, ts: 1, dim: 1, td: 1, hol: 0, th: 0, glow: 0, tg: 0, gcol: new THREE.Color(1, 1, 1), anti: false, ghost: false };
      orb.position.copy(P[id].pos);
      P[id].lab = F.label(orb, M.short, { offset: new V3(0, -1.55, 0) });
    });
    // the antiparticle shown beside a selected particle
    const twin = PX.orb(.8, 0xffffff, { glyph: { main: 'u' }, hollow: true, hitK: 1.1 }); twin.visible = false; board.add(twin); twin.userData.id = 'sm_up'; twin.userData.priority = 1.9; twin.userData.node = 'sm_up'; F.pickables.push(twin);
    const twinLab = F.label(twin, 'anti', { offset: new V3(0, -1.25, 0) });
    // gravity: the missing one
    const grav = new THREE.Group(); const gr = new THREE.Sprite(new THREE.SpriteMaterial({ map: PX.dashRing('grav', 'rgba(210,220,240,.9)', 12), transparent: true, depthWrite: false, opacity: .8 })); gr.scale.set(2.2, 2.2, 1); grav.add(gr);
    const gq = new THREE.Sprite(new THREE.SpriteMaterial({ map: PX.glyph('?', { fg: '#c9d3e6' }), transparent: true, depthWrite: false })); gq.scale.set(1.3, 1.3, 1); grav.add(gq);
    grav.add(new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), hitMat())); board.add(grav); hitFor(grav, 'sm_gravity', 'sm_gravity', 'Gravity (not in the Standard Model)', 1.8);
    grav.userData.parts = [{ m: gr.material, base: .8 }, { m: gq.material, base: 1 }]; grav.position.set(14.4, -6.3, 0);
    const gravLab = F.label(grav, 'gravity: not in the model', { offset: new V3(0, -2.1, 0) });
    // headers (overview) and the mass axis (mass view)
    const hdr = [];
    const addHdr = (text, x, y, node, w) => { const g = new THREE.Object3D(); g.position.set(x, y, 0); g.userData = { id: node, node, title: text, priority: 1 }; board.add(g); const L = F.label(g, text, { cls: 'pxhd', pick: g, always: false }); hdr.push({ g, L, text }); };
    ['Generation 1', 'Generation 2', 'Generation 3'].forEach((t, i) => addHdr(t, -5 + i * 5, 9.4, 'sm_generations'));
    addHdr('Up-type quarks', -9.6, 6.3, 'sm_strong_force'); addHdr('Down-type quarks', -9.6, 2.1, 'sm_strong_force'); addHdr('Charged leptons', -9.6, -2.1, 'sm_generations'); addHdr('Neutrinos', -9.6, -6.3, 'sm_neutrino_oscillation');
    addHdr('Force carriers', 9.8, 9.4, 'sm_interactions');
    // mass-axis geometry
    const axisG = new THREE.Group(); axisG.visible = false; board.add(axisG);
    const ax = [], decades = [];
    const yA = PX.my(1e-1), yB = PX.my(2e12); ax.push(-11, yA, 0, -11, yB, 0);
    for (let e = 0; e <= 12; e++) { const y = PX.my(Math.pow(10, e)), L = e % 3 === 0 ? .6 : .3; ax.push(-11, y, 0, -11 + L, y, 0); }
    ax.push(-11, PX.MASSLESS_Y, 0, 13.6, PX.MASSLESS_Y, 0);
    const axGeo = new THREE.BufferGeometry(); axGeo.setAttribute('position', new THREE.Float32BufferAttribute(ax, 3));
    const axMat = new THREE.LineBasicMaterial({ color: 0xaab6cc, transparent: true, opacity: .8 }); const axis = new THREE.LineSegments(axGeo, axMat); axisG.add(axis);
    [[0, '1 eV'], [3, '1 keV'], [6, '1 MeV'], [9, '1 GeV'], [12, '1 TeV']].forEach(([e, t]) => { const a = new THREE.Object3D(); a.position.set(-11.2, PX.my(Math.pow(10, e)), 0); axisG.add(a); decades.push(F.label(a, t, { cls: 'pxhd', offset: new V3(-.3, .55, 0) })); });
    const zeroA = new THREE.Object3D(); zeroA.position.set(-11.2, PX.MASSLESS_Y, 0); axisG.add(zeroA); decades.push(F.label(zeroA, 'zero', { cls: 'pxhd', offset: new V3(-.3, .55, 0) }));
    const zeroB = new THREE.Object3D(); zeroB.position.set(8.4, PX.MASSLESS_Y - 1.0, 0); axisG.add(zeroB); const zeroLab = F.label(zeroB, 'massless in the model: gluon, photon', { cls: 'pxhd', offset: new V3(0, 0, 0) });
    const band = new THREE.Mesh(new THREE.PlaneGeometry(5.6, PX.my(.45) - PX.my(.05)), new THREE.MeshBasicMaterial({ color: PX.COL.neutrino, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide })); band.position.set(3.3, (PX.my(.05) + PX.my(.45)) / 2, -.4); axisG.add(band);
    const bandA = new THREE.Object3D(); bandA.position.set(3.3, PX.my(.45) + .1, 0); axisG.add(bandA); const bandLab = F.label(bandA, 'heaviest mass state at least 0.05 eV; every mass below 0.45 eV', { cls: 'pxhd', offset: new V3(0, .6, 0) });
    const cosG = new THREE.BufferGeometry(); cosG.setAttribute('position', new THREE.Float32BufferAttribute([.5, PX.my(.064), .1, 6.1, PX.my(.064), .1], 3)); axisG.add(new THREE.LineSegments(cosG, new THREE.LineBasicMaterial({ color: 0x2a7f8f, transparent: true, opacity: .8 })));
    const cosA = new THREE.Object3D(); cosA.position.set(3.3, PX.my(.064) - .75, 0); axisG.add(cosA); const cosLab = F.label(cosA, 'line: all three added, below 0.064 eV (cosmology, model dependent)', { cls: 'pxhd', offset: new V3(0, 0, 0) });
    const flvA = new THREE.Object3D(); flvA.position.set(3.3, PX.NUY + 1.5, 0); axisG.add(flvA); const flvLab = F.label(flvA, 'neutrino flavours: no single mass (height here means nothing)', { cls: 'pxhd', offset: new V3(0, 0, 0) });
    // error bars (mass view): one line segment set, rebuilt each frame while the mass view is showing
    const MASSIVE = PX.ORDER.filter(id => PX.P[id].mass && PX.P[id].mass.eV && PX.P[id].mass.err_plus !== undefined);
    const ebGeo = new THREE.BufferGeometry(), ebPos = new Float32Array(MASSIVE.length * 18); ebGeo.setAttribute('position', new THREE.BufferAttribute(ebPos, 3));
    const ebMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95 }); const eb = new THREE.LineSegments(ebGeo, ebMat); eb.frustumCulled = false; axisG.add(eb);
    // coupling lines (forces view)
    const NL = 20, lnPos = new Float32Array(NL * 6), lnGeo = new THREE.BufferGeometry(); lnGeo.setAttribute('position', new THREE.BufferAttribute(lnPos, 3));
    const lnMat = new THREE.LineBasicMaterial({ color: 0xf0c330, transparent: true, opacity: .45 }); const lines = new THREE.LineSegments(lnGeo, lnMat); lines.frustumCulled = false; board.add(lines);
    // decay stage
    const stage = new THREE.Group(); stage.visible = false; board.add(stage);
    const dParent = PX.orb(1.1, 0xffffff, { glyph: { main: 'μ' }, hit: false }), dKids = [0, 1, 2, 3].map(() => PX.orb(.8, 0xffffff, { glyph: { main: 'e' }, hit: false })), flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xfff1b0, transparent: true, depthWrite: false })); flash.scale.set(1, 1, 1);
    const vtx = new THREE.Object3D(); stage.add(vtx);
    stage.add(dParent, flash); dKids.forEach(k => stage.add(k));
    const dLabs = [F.label(dParent, 'parent', { offset: new V3(0, -1.5, 0) })].concat(dKids.map((k, i) => F.label(k, 'k' + i, { offset: new V3(0, -1.2, 0) })));
    const decLine = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(5 * 6), 3)), new THREE.LineBasicMaterial({ color: 0xdfe6f5, transparent: true, opacity: .7 })); decLine.frustumCulled = false; stage.add(decLine);
    // hadron stage
    const hstage = new THREE.Group(); hstage.visible = false; board.add(hstage);
    const hQ = [0, 1, 2].map(() => PX.orb(.85, 0xffffff, { glyph: { main: 'u' }, hit: false })); hQ.forEach(q => hstage.add(q));
    const hRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: PX.dashRing('hadron', 'rgba(210,220,240,.9)', 8), transparent: true, depthWrite: false, opacity: .7 })); hstage.add(hRing);
    const hAnc = new THREE.Object3D(); hstage.add(hAnc); const hLab = F.label(hAnc, 'hadron', { cls: 'pxhd big', offset: new V3(0, 0, 0) });
    hstage.userData.parts = [{ m: hRing.material, base: .7 }];
    const axLabs = decades.concat([zeroLab, bandLab, cosLab, flvLab]); axLabs.forEach(L => { L.txt = L.el.textContent; });
    F.sm = { t: 0, ht: 0, shift: new V3(), P, twin, grav, hdr, axisG, band, stage, hstage, board, MASSIVE, axLabs, dParent, dKids, dLabs, flash, decLine, hQ, hRing, hLab, hAnc, vtx };

    // ---- panel and controls ----
    const panel = PX.el('', 'pxp pxsm'); uiEl(panel); panel.dataset.sec = 'The Standard Model view'; panel.dataset.secKey = 'pxsm'; panel.dataset.secOpen = 'always';   // the view's working panel: a section of the one panel, open unless the visitor folds it
    const modes = [['overview', 'Overview'], ['forces', 'Forces'], ['everyday', 'Everyday matter'], ['mass', 'Mass'], ['decay', 'Decays'], ['hadron', 'Build a hadron']];
    const modeSeg = seg(modes, SM.mode, k => { SM.mode = k; if (k !== 'overview') SM.sel = SM.sel; refresh(); });
    F.modeSeg = modeSeg; modeSeg.classList.add('pxmodes');
    const about = actBtn('What is this view?', () => showBodyNode('sm_overview', null));
    const refresh = () => { PX.smPanel(F, panel); modeSeg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === SM.mode)); F.stage_t = 0; };
    F.refresh = refresh; refresh();
    PX.smFocus(F, o.focus || null);
    PX.smBind(F);
  }
};

/* ---------- decay-stage and hadron-stage helpers ---------- */
PX.keyGlyph = k => {
  const m = /^(e|mu|tau)([+-])$/.exec(k); if (m) return { main: { e: 'e', mu: 'μ', tau: 'τ' }[m[1]], sup: m[2] === '+' ? '+' : '−' };
  const n = /^(nu|nubar)_(e|mu|tau)$/.exec(k); if (n) return { main: 'ν', sub: { e: 'e', mu: 'μ', tau: 'τ' }[n[2]], anti: n[1] === 'nubar' };
  const q = /^([udscbt])(bar)?$/.exec(k); if (q) return { main: q[1], anti: !!q[2] };
  return { gamma: { main: 'γ' }, g: { main: 'g' }, Z: { main: 'Z', sup: '0' }, H: { main: 'H' }, 'W+': { main: 'W', sup: '+' }, 'W-': { main: 'W', sup: '−' }, 'pi+': { main: 'π', sup: '+' }, 'pi-': { main: 'π', sup: '−' }, pi0: { main: 'π', sup: '0' }, p: { main: 'p' }, n: { main: 'n' } }[k] || { main: '?' };
};
PX.keyColor = k => /^nu/.test(k) ? PX.COL.neutrino : /^(e|mu|tau)[+-]$/.test(k) ? PX.COL.lepton : /^[udscbt](bar)?$/.test(k) ? PX.COL.quark : k === 'H' ? PX.COL.higgs : k === 'p' ? PX.COL.proton : k === 'n' ? PX.COL.neutron : /^pi/.test(k) ? PX.COL.quark : PX.COL.boson;
PX.hadronTable = () => {
  if (PX.HT) return PX.HT; const T = {}; const key = a => a.slice().sort().join(',');
  Object.values(PX.H).forEach(h => { if (h.quarks) T[key(h.quarks)] = T[key(h.quarks)] || h; });
  T[key(['d', 'dbar'])] = PX.H.pi_zero;
  return PX.HT = { T, key };
};
const _flip = k => k.endsWith('bar') ? k.slice(0, -3) : k + 'bar';
PX.hadronEval = list => {
  const n = list.length, nq = list.filter(x => !x.endsWith('bar')).length, na = n - nq;
  const r = { n, nq, na, ok: false, charge: PX.tot(list)[0], B: PX.tot(list)[2] };
  r.ok = (n === 3 && (nq === 3 || na === 3)) || (n === 2 && nq === 1 && na === 1);
  if (!r.ok) return r;
  const { T, key } = PX.hadronTable();
  let h = T[key(list)]; if (h) { r.h = h; r.anti = false; }
  else { h = T[key(list.map(_flip))]; if (h) { r.h = h; r.anti = true; } }
  return r;
};

/* ---------- panel text (HTML) for each mode ---------- */
PX.nm = id => PX.META[id] ? PX.META[id].short : id;
PX.smPanel = (F, el) => {
  const SM = PX.SM, D = PX.D;
  const sg = (items, cur, key) => `<div class="seg pxseg">${items.map(([k, t]) => `<button data-px="${key}:${k}" class="${k === cur ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const fam = [['quark', 'quarks: feel the strong force'], ['lepton', 'charged leptons'], ['neutrino', 'neutrinos: the weak force only (in the minimal model)'], ['boson', 'force carriers'], ['higgs', 'the Higgs boson']];
  let h = '';
  const sel = SM.sel && PX.P[SM.sel];
  const selTxt = sel ? `<p class="pxsel"><b>${sel.name}</b> is selected. ${PX.META[sel.id].self ? 'It is its own antiparticle.' : SM.anti ? `Its matter partner, the ${PX.META[sel.id].short}, is drawn beside it.` : `Its antiparticle, the ${PX.META[sel.id].aname}, is drawn beside it.`} <button class="pxlink" data-px="sel:clear">Clear</button></p>` : '';
  if (SM.mode === 'overview') {
    h = `<div class="pxh">The seventeen</div><p>Seventeen is a counting convention: the W⁺ and W⁻ count as one, the eight gluons as one, and antiparticles and colour states are not counted. Rows and columns are the lesson. Matter particles come in three generations (the columns): each is a heavier copy of the first. Only the first generation is found in ordinary atoms. The force carriers stand apart on the right, and the Higgs boson is at the far end.</p>${sg([['m', 'Matter'], ['a', 'Antimatter']], SM.anti ? 'a' : 'm', 'anti')}${selTxt}
    <div class="pxkeys">${fam.map(([f, t]) => `<div class="pxk"><i class="b" style="background:${PX.CSS(PX.COL[f])}"></i> ${t}</div>`).join('')}</div><p class="pxs">Click any ball for its card. All the balls are the same size on purpose: size means nothing here, because no structure has been found inside any of them.</p>`;
  } else if (SM.mode === 'forces') {
    const ints = D.interactions, cur = ints.find(i => i.id === SM.force) || ints[0];
    const names = ids => ids.map(PX.nm).join(', ');
    h = `<div class="pxh">Which particles feel this?</div>${sg(ints.map(i => [i.id, { strong: 'Strong', em: 'Electromagnetic', weak: 'Weak', higgs: 'Higgs', gravity: 'Gravity' }[i.id]]), cur.id, 'force')}
    <p>${cur.text}</p>${cur.id === 'gravity' ? `<p class="pxs">That is why gravity has no carrier here. The only particle usually proposed for it, the graviton, has never been seen and is not part of the Standard Model.</p>` : `<p><b>Carried by:</b> ${names(cur.carriers)}.<br><b>Felt by:</b> ${names(cur.feels)}.</p><p class="pxs">The carrier is ringed in colour; the lines run to everything it couples to. Coupling to: ${cur.couples_to}.</p>`}`;
  } else if (SM.mode === 'everyday') {
    const em = D.everyday_matter;
    h = `<div class="pxh">What everyday matter is made of</div><p>${em.note} A proton is two up quarks and a down quark, a neutron is one up and two down, and electrons surround them: that is every ordinary atom, in the park, in you, in the air.</p><p>The other twelve are real, but nothing you touch is built from them:</p><ul class="pxl">${em.others.map(o => `<li>${o.text}</li>`).join('')}</ul>`;
  } else if (SM.mode === 'mass') {
    const ma = D.mass_axis, rows = F.sm.MASSIVE.map(id => { const d = PX.P[id], rel = d.mass.err_plus / d.mass.value * 100; return `<tr><td>${PX.nm(id)}</td><td>${d.mass.display}</td><td>${rel >= 0.01 ? rel.toPrecision(2) : (m => m[0] + '×10' + sup(+m[1]))(rel.toExponential(1).split('e'))} %</td></tr>`; }).join('');
    const topx = Math.round(ma.top_over_electron).toLocaleString('en-GB');
    h = `<div class="pxh">Mass, on a logarithmic axis</div><p>Each step up the axis is a factor of ten. The top quark is about ${topx} times the electron. The neutrinos are not placed on the axis, because the three flavours have no single mass (each is a mixture of three mass states). What is known: oscillations show the heaviest mass state is at least about 0.05 eV; the direct KATRIN bound is that every mass is below 0.45 eV; and cosmology, if the standard cosmological model holds, puts the sum of all three below 0.064 eV. The electron is more than ${(ma.electron_over_neutrino_at_least / 1e6).toFixed(1)} million times heavier than the direct upper limit of 0.45 eV.</p>
    <p class="pxs">A quark's mass is not a weight on a scale: free quarks are never seen, so each number depends on a stated scheme (see the card). The gluon and photon are massless in the theory.</p>${sg([['mag', 'Error bars ×100'], ['true', 'Error bars to scale']], SM.errs, 'errs')}<table class="pxt"><tr><th>Particle</th><th>Mass (PDG 2026)</th><th>±</th></tr>${rows}</table>`;
  } else if (SM.mode === 'decay') {
    const L = PX.decayList(); if (SM.decay.i >= L.length || SM.decay.i < 0) SM.decay.i = 0; const cur = L[SM.decay.i];
    const pids = []; L.forEach((x, i) => { if (!pids.includes(x.pid)) pids.push(x.pid); });
    const pn = id => id === 'neutron' ? 'Neutron' : PX.P[id].name;
    const before = PX.tot(cur.in), after = PX.tot(cur.out), row = (name, i) => { const ok = before[i] === after[i]; return `<tr><td>${name}</td><td>${PX.fr3(before[i])}</td><td>${PX.fr3(after[i])}</td><td class="${ok ? 'ok' : 'bad'}">${ok ? 'balanced' : 'NOT balanced'}</td></tr>`; };
    const m0 = PX.massEV(cur.in[0]), ms = cur.out.map(PX.massEV), eok = !cur.example || true;
    let en = ''; const virt = cur.virtualW || cur.out.some(x => /^[udscbt](bar)?$/.test(x)) || cur.in.some(x => /^[udscbt]$/.test(x)) || (cur.pid === 'higgs' && cur.out.length === 2 && (cur.out[0] === 'Z' || cur.out[0] === 'W+'));
    if (!virt && m0 && ms.every(x => x !== null) && m0 >= ms.reduce((a, b) => a + b, 0)) { const sum = ms.reduce((a, b) => a + b, 0); en = `<p><b>Energy:</b> the parent's rest energy is ${PX.eVtext(m0)}; the products' rest energies add up to ${sum < 1 ? '≈ 0' : PX.eVtext(sum)} (neutrino masses are below 0.45 eV, negligible here). The difference, ${PX.eVtext(m0 - sum)}, becomes motion of the products. Momentum is conserved too.</p>`; }
    else en = `<p class="pxs">Energy and momentum balance too. Here the numbers are not a simple sum, because ${cur.virtualW ? 'the W is virtual (a term in the calculation, not a real particle)' : 'a quark mass depends on a scheme, or a product is off-shell'}.</p>`;
    h = `<div class="pxh">Decays</div><p>Pick an unstable particle. The picture is bookkeeping: lines are not paths a particle follows.</p><div class="pxchips">${pids.map(id => `<button class="pxchip ${id === cur.pid ? 'on' : ''}" data-px="dec:${L.findIndex(x => x.pid === id)}">${pn(id)}</button>`).join('')}</div>
    ${L.filter(x => x.pid === cur.pid).length > 1 ? `<div class="pxchips">${L.map((x, i) => x.pid === cur.pid ? `<button class="pxchip ${i === SM.decay.i ? 'on' : ''}" data-px="dec:${i}">${x.label.replace(/^.*?→ /, '→ ')}${x.br ? ` (${(x.br * 100).toPrecision(2)}%)` : ''}</button>` : '').join('')}</div>` : ''}
    <p><b>${cur.label}</b>${cur.br ? ` &nbsp;branching fraction ${(cur.br * 100).toPrecision(3)}% (PDG 2026)` : ''}</p>${cur.example ? `<p class="pxs">One example of several ways this particle can decay into quarks or leptons; the quarks then turn into sprays of hadrons.</p>` : ''}
    <table class="pxt"><tr><th>Conserved</th><th>Before</th><th>After</th><th></th></tr>${row('Electric charge', 0)}${row('Lepton number', 1)}${row('Baryon number', 2)}</table>${en}<p class="pxs">${cur.note}</p><button class="pxlink" data-px="decplay">Play it again</button>`;
  } else if (SM.mode === 'hadron') {
    const L = SM.had, r = PX.hadronEval(L), qs = ['u', 'd', 's', 'c', 'b'], dis = L.length >= 3;
    const keyTxt = k => PX.KEY[k][0];
    const sym = k => PX.KEY[k][0];
    let res = '';
    if (!L.length) res = '<p>Choose up to three: three quarks, or a quark and an antiquark.</p>';
    else if (!r.ok) {
      const why = r.n === 1 ? 'A lone quark carries colour charge. Colour charge always has to cancel out, so it cannot exist by itself.' : r.n === 2 ? 'Two quarks (or two antiquarks, or two of anything else) always leave some net colour. A particle you can observe has no net colour, so this one does not exist alone.' : 'Three things only cancel their colour as three quarks (red, green, blue) or three antiquarks. This mix leaves some colour over.';
      res = `<p class="bad"><b>Not allowed.</b> ${why}</p>`;
    } else if (r.h) {
      const h = r.h, nm = r.anti ? 'anti-' + h.name.replace(/ \(charged\)$/, '').toLowerCase() : h.name;
      const spin = h.spin, lt = h.lifetime && (h.lifetime.display || h.lifetime.short || (h.lifetime.bound && h.lifetime.bound.display) || (h.lifetime.ref && h.lifetime.ref.display));
      res = `<p class="ok"><b>Allowed. The table's particle with this quark content: ${r.anti ? 'the antiparticle of the ' : 'the '}${h.name}, ${h.symbol}.</b></p><dl class="pxd"><dt>Charge</dt><dd>${(r.anti ? PX.chgFlip(h.charge) : String(h.charge)).replace('-', '−')}</dd><dt>Spin</dt><dd>${spin}</dd><dt>Mass</dt><dd>${h.mass.display}</dd>${lt ? `<dt>Mean life</dt><dd>${typeof lt === 'string' ? lt : ''}</dd>` : ''}</dl><p class="pxs">${h.note || ''}${h.quark_content_mixed ? ' Its real quark content is a quantum mixture.' : ''}</p><p class="pxs">Quark content does not fix the particle: the same quarks with different spin or internal energy are other particles (uud is the proton, but also the Δ⁺; uds is the Λ, but also the Σ⁰). The table lists one particle for each quark content.</p>`;
    } else res = `<p class="ok"><b>Colourless, so allowed.</b> Charge ${PX.chgNum(r.charge)}, baryon number ${PX.fr3(r.B)}. This short table of ${Object.keys(PX.H).length} hadrons (the proton and neutron included) does not list it. That says nothing about whether it exists: many such combinations are known particles, for example the φ meson is mostly s s̄. Quark content does not fix the particle: the same quarks with other spin or energy are different particles.</p>`;
    h = `<div class="pxh">Build a hadron</div><p>Quarks never appear alone: they bind in colourless combinations called hadrons. Pick quarks; the table is the PDG's.</p><div class="pxchips">${qs.map(q => `<button class="pxchip" data-px="had:${q}" ${dis ? 'disabled' : ''}>${sym(q)}</button>`).join('')}</div><div class="pxchips">${qs.map(q => `<button class="pxchip" data-px="had:${q}bar" ${dis ? 'disabled' : ''}>${sym(q + 'bar')}</button>`).join('')}</div>
    <p>You chose: ${L.length ? L.map((k, i) => `<button class="pxchip on" data-px="hadx:${i}" title="Remove">${sym(k)} ×</button>`).join(' ') : 'nothing yet'} ${L.length ? '<button class="pxlink" data-px="hadc">Clear</button>' : ''}</p>${res}<p class="pxs">The top quark is left out: it decays (mean life about 5×10⁻²⁵ s, from the PDG width) before it can bind into a hadron.</p>`;
  }
  h += '<p class="pxs pxperm"><i>This is not a place. It is the list of everything matter and the forces (except gravity) are made of, as far as experiments have reached.</i></p>';
  el.innerHTML = h;
  el.querySelectorAll('[data-px]').forEach(b => b.onclick = () => PX.smAct(F, b.dataset.px));
};
PX.chgNum = q => { const t = Math.round(q * 3); return t === 0 ? '0' : (t > 0 ? '+' : '−') + (Math.abs(t) % 3 === 0 ? Math.abs(t) / 3 : PX.fr3(Math.abs(t) / 3)); };
PX.chgFlip = s => { s = String(s); if (s === '0') return '0'; return s[0] === '+' ? '−' + s.slice(1) : '+' + s.slice(1).replace('-', ''); };
PX.smFrames = [];
PX.smAct = (F, a) => {
  const SM = PX.SM, [k, v, w] = a.split(':');
  if (k === 'anti') SM.anti = v === 'a'; else if (k === 'force') SM.force = v; else if (k === 'errs') SM.errs = v;
  else if (k === 'sel') SM.sel = null;
  else if (k === 'dec') { SM.decay.i = +v; } else if (k === 'decplay') { }
  else if (k === 'had') { if (SM.had.length < 3) SM.had.push(v); } else if (k === 'hadx') SM.had.splice(+v, 1); else if (k === 'hadc') SM.had = [];
  PX.smFrames.forEach(f => { if (f.built && f.refresh) f.refresh(); });
};
PX.smSet = (mode, extra) => { Object.assign(PX.SM, extra || {}); PX.SM.mode = mode; PX.smFrames.forEach(f => { if (f.built && f.refresh) f.refresh(); }); };

/* ---------- the live part of the Standard Model view ---------- */
PX.smBind = F => {
  const SM = PX.SM, S = F.sm, P = S.P, D = PX.D;
  PX.smFrames.push(F); F.onDispose = () => { const i = PX.smFrames.indexOf(F); if (i >= 0) PX.smFrames.splice(i, 1); };
  Object.values(P).forEach(p => { p.orb.userData.onPick = () => { SM.sel = p.id; PX.smFrames.forEach(f => f.built && f.refresh && f.refresh()); }; });
  /* a double click on a particle, or its card's "Look inside": none of the seventeen has known parts, so the answer is what it turns into (its decay is played) or, for one that does not decay, a plain statement */
  Object.values(P).forEach(p => { p.orb.userData.lookInside = () => {
    const dec = PX.decayList().findIndex(x => x.pid === p.id), nm = (PX.P[p.id] && PX.P[p.id].name) || PX.nm(p.id), none = 'No structure has been seen in any of these particles, down to about 10⁻¹⁹ m, and below that nobody has looked.';
    if (dec >= 0) { PX.smSet('decay', { decay: { i: dec } }); if (typeof showNoParts === 'function') showNoParts(`${nm}: no parts are known. ${none} It does not last, though: the view is now playing one of the ways it decays (the panel's Decays section lists them).`); return 'decay'; }
    if (typeof showNoParts === 'function') showNoParts(`${nm}: no parts are known. ${none} This view has no decay to play for it.`); return 'no-parts';
  }; });
  const tmp = new V3(), tc = new THREE.Color(), up = new V3(0, 1, 0);
  const FEEL = id => { const ints = D.interactions, i = ints.find(x => x.id === SM.force); return i ? i : null; };
  const labs = []; Object.values(P).forEach(p => labs.push({ L: p.lab, pri: 8, text: () => SM.mode === 'decay' || SM.mode === 'hadron' ? '' : SM.anti && !p.M.self ? p.M.aname : p.M.short }));
  const twinLab = F.labels.find(l => l.obj === S.twin);
  const gravLab = F.labels.find(l => l.obj === S.grav);
  let stageSig = '', tStage = 0, lastNote = '';
  const eb = S.axisG.children.find(c => c.isLineSegments && c.geometry.attributes.position.count === S.MASSIVE.length * 6);
  const bar = (arr, k, x, y0, y1) => { // an error bar with end caps, as 3 segments
    arr[k++] = x; arr[k++] = y0; arr[k++] = 0; arr[k++] = x; arr[k++] = y1; arr[k++] = 0;
    arr[k++] = x - .22; arr[k++] = y0; arr[k++] = 0; arr[k++] = x + .22; arr[k++] = y0; arr[k++] = 0;
    arr[k++] = x - .22; arr[k++] = y1; arr[k++] = 0; arr[k++] = x + .22; arr[k++] = y1; arr[k++] = 0; return k;
  };
  const lines = S.board.children.find(c => c.isLineSegments);
  const A = { mass: 0, grid: 1, stage: 0, hstage: 0, hdr: 1, grav: 1 };
  let lastMode = '';
  F.update = (dt, t) => {
    const fa = PX.fa(F), k = 1 - Math.exp(-dt * 6), mode = SM.mode, sel = SM.sel;
    if (mode !== lastMode) { lastMode = mode; F.lvl = 3; }          // after a change of view, turn the camera square-on again (unless you are dragging)
    if (cam.A === F && !fly) { const cx = F._focus ? 0 : -S.board.position.x * 0, d = cam.T.length(); if (d > 40) { const kk = 1 - Math.exp(-dt * 3); cam.T.multiplyScalar(1 - kk * .9); if (zoom.pivot) zoom.pivot.p.set(0, 0, 0); } }   // never lose the board: if the zoom has carried the view far from it, bring it back
    if (cam.A === F && F.lvl > 0 && !pointers.size) { F.lvl -= dt; const kk = 1 - Math.exp(-dt * 2.2); cam.dir.lerp(tmp.set(0, .06, 1), kk).normalize(); }
    const showGrid = mode === 'overview' || mode === 'forces' || mode === 'everyday';
    { const st = F._focus ? tmp.set(0, 0, 0) : mode === 'mass' ? tmp.set(0, 3, 0) : showGrid ? tmp.set(0, 2, 0) : tmp.set(0, 1, 0); S.shift.lerp(st, k); S.board.position.copy(F.boardBase).add(S.shift); if (W / H < 1) S.board.position.y -= 2.6; }
    const fint = mode === 'forces' ? FEEL() : null, carriers = fint ? fint.carriers : [], feels = fint ? fint.feels : [], ev = D.everyday_matter.ids;
    let nl = 0; const lp = lines.geometry.attributes.position.array;
    const backDir = tmp.set(0, 0, 1).applyQuaternion(F.cam.quaternion);
    for (const id of PX.ORDER) {
      const p = P[id], M = p.M;
      // target position
      if (mode === 'mass') PX.massPos(id, p.tgt); else { PX.gridPos(id, p.tgt); if (!showGrid) p.tgt.z -= 6; }
      let ts = mode === 'mass' ? .5 : 1, td = 1, tg = 0, gcol = 0xffffff;
      if (mode === 'forces') {
        const isC = carriers.includes(id), isF = feels.includes(id);
        if (SM.force === 'gravity') td = .3; else if (isC) { ts = 1.18; td = 1; tg = 1; gcol = PX.accent[SM.force]; } else if (isF) { td = 1; tg = .55; gcol = PX.accent[SM.force]; } else td = .16;
      } else if (mode === 'everyday') { if (ev.includes(id)) { tg = .55; gcol = 0xffe9a8; ts = 1.1; } else td = .18; }
      else if (mode === 'decay' || mode === 'hadron') td = .06;
      if (sel === id && showGrid) { ts *= 1.12; if (tg < .8) { tg = .8; gcol = 0xbfd4ff; } }
      const th = SM.anti && !M.self && id !== 'w_boson' ? 1 : 0;
      p.pos.lerp(p.tgt, k); p.scale += (ts - p.scale) * k; p.dim += (td - p.dim) * k; p.glow += (tg - p.glow) * k; p.hol += (th - p.hol) * k; p.gcol.lerp(tc.setHex(gcol), k);
      const o = p.orb; o.position.copy(p.pos); o.scale.setScalar(p.scale);
      const anti = p.hol > .5; if (anti !== p.anti) { p.anti = anti; PX.setGlyph(o, PX.glyphSpec(id, anti).main, PX.glyphSpec(id, anti)); }
      PX.hollow(o, Math.round(p.hol * 20) / 20);
      const hp = o.userData.haloPart; if (hp) { hp.base = p.glow * .75; o.userData.halo.material.color.copy(p.gcol); }
      { const dc = _px_v.copy(F.C).sub(_px_v2.copy(p.pos).add(S.board.position)).length(), r = 1.1 * p.scale, near = Math.min(1, Math.max(0, (dc - .7 * r) / (2.4 * r))); p.near = near; }
      PX.setA(o, p.dim * (.08 + .92 * p.near), fa);
      p.lab.off.set(0, -(1.25 * p.scale + .3), 0);
      // coupling lines
      if (mode === 'forces' && SM.force !== 'gravity' && nl < 19 && !carriers.includes(id) && feels.includes(id)) {
        const c = P[carriers[0]]; if (c) { const b = nl * 6; lp[b] = c.pos.x; lp[b + 1] = c.pos.y; lp[b + 2] = c.pos.z - 1.6; lp[b + 3] = p.pos.x; lp[b + 4] = p.pos.y; lp[b + 5] = p.pos.z - 1.6; nl++; }
      }
    }
    // second carrier of the weak force (W and Z): lines from Z too
    if (mode === 'forces' && carriers.length > 1 && SM.force !== 'gravity') { const c = P[carriers[1]]; feels.forEach(id => { if (carriers.includes(id) || nl >= 19 || !c) return; const p = P[id], b = nl * 6; lp[b] = c.pos.x; lp[b + 1] = c.pos.y; lp[b + 2] = c.pos.z - 1.6; lp[b + 3] = p.pos.x; lp[b + 4] = p.pos.y; lp[b + 5] = p.pos.z - 1.6; nl++; }); }
    lines.geometry.attributes.position.needsUpdate = true; lines.geometry.setDrawRange(0, nl * 2);
    lines.material.color.setHex(PX.accent[SM.force] || 0xf0c330); lines.material.opacity = (mode === 'forces' ? .5 : 0) * fa; lines.visible = mode === 'forces' && nl > 0;
    PX.face(F, PX.ORDER.map(id => P[id].orb));
    // the antiparticle beside the selected one
    const tw = S.twin, tp = sel && P[sel], showTw = !!(tp && showGrid && !tp.M.self && sel !== 'w_boson');
    if (showTw) {
      tw.position.copy(tp.pos).add(tmp.set(1.9, 1.6, .5)); tw.scale.setScalar(.85); const u = tw.userData; u.node = tp.d.node; u.id = tp.d.node; u.title = SM.anti ? PX.META[sel].short : PX.META[sel].aname;
      PX.setColor(tw, tc.setHex(PX.famColor(tp.d))); PX.hollow(tw, SM.anti ? 0 : 1); const gs = PX.glyphSpec(sel, !SM.anti); PX.setGlyph(tw, gs.main, gs); PX.setA(tw, .95, fa);
      twinLab.off.set(0, -1.3, 0);
    } else PX.setA(tw, 0, fa);
    if (twinLab) twinLab.el.dataset.t = '';
    // gravity ghost, headers
    const grav = S.grav; grav.visible = showGrid && fa > .02; grav.userData.parts.forEach(pp => { pp.m.userData.baseOp = pp.base * (mode === 'forces' && SM.force === 'gravity' ? 1 : .65); pp.m.opacity = pp.m.userData.baseOp * fa; });
    S.hdr.forEach(h => { h.g.visible = showGrid; });
    // mass axis
    const mass = mode === 'mass'; S.axisG.visible = mass || A.mass > .02; A.mass += ((mass ? 1 : 0) - A.mass) * k;
    S.axisG.children.forEach(c => { if (c.material) { c.material.userData.baseOp = (c === S.band ? .4 : c.material === eb.material ? .95 : .8) * A.mass; c.material.opacity = c.material.userData.baseOp * fa; } });
    if (A.mass > .02) {
      const arr = eb.geometry.attributes.position.array, mag = SM.errs === 'mag' ? 100 : 1; let kk = 0;
      S.MASSIVE.forEach(id => { const d = PX.P[id], p = P[id], ev = d.mass.eV, f = ev / d.mass.value, e = Math.min(d.mass.err_plus * f * mag, ev * .95); kk = bar(arr, kk, p.pos.x + .0, PX.my(ev - e), PX.my(ev + e)); });
      eb.geometry.attributes.position.needsUpdate = true;
    }
    // decays
    const dec = mode === 'decay', hs = mode === 'hadron'; A.stage += ((dec ? 1 : 0) - A.stage) * k; A.hstage += ((hs ? 1 : 0) - A.hstage) * k;
    S.stage.visible = dec || A.stage > .02; S.hstage.visible = hs || A.hstage > .02;
    if (S.stage.visible) PX.smDecay(F, S, dt, fa, A.stage);
    if (S.hstage.visible) PX.smHadron(F, S, dt, fa, A.hstage);
    // labels
    const hdrTxt = []; S.hdr.forEach(h => hdrTxt.push({ L: h.L, text: h.text, pri: 2 }));
    const extra = [{ L: gravLab, text: 'gravity: not in the model', pri: 3 }, { L: twinLab, text: () => sel && PX.META[sel] ? (SM.anti ? PX.META[sel].short : PX.META[sel].aname) : '', pri: 6 }];
    const axL = S.axLabs.map(L => ({ L, text: L.txt, pri: 1, on: mass }));
    const px = H / (2 * Math.tan(25 * Math.PI / 180) * F.dLoc), tiny = px * 4.2 < 40;
    if (tiny) { labs.concat(hdrTxt, extra, axL).forEach(l => { if (l.L.el.textContent) l.L.el.textContent = ''; }); } else
    PX.declutter(F, labs.concat(hdrTxt, extra, axL.filter(a => { if (!a.on && a.L.el.textContent) a.L.el.textContent = ''; return a.on; }), PX.smStageLabels(F, S)));
    // the deepest zoom: nothing to find inside
    const deep = F.dLoc < 1.1, nt = deep ? 'Nothing is drawn inside the balls because nothing has been found there. These balls are for the eye: no structure has been seen in any of these particles, down to about 10⁻¹⁹ m, and below that nobody has looked.' : 'This is not a place. It is the list of everything matter and the forces (except gravity) are made of, as far as experiments have reached.';
    if (nt !== lastNote) { lastNote = nt; F.note = nt; capFrame = null; }
  };
};

PX.smStageLabels = (F, S) => {
  const SM = PX.SM, out = [];
  if (SM.mode === 'decay' && S.cur) { out.push({ L: S.dLabs[0], text: S.cur.ptxt, pri: 9 }); S.cur.kids.forEach((k, i) => out.push({ L: S.dLabs[i + 1], text: S.t > 2.1 ? k.txt : '', pri: 9 - i * .1 })); }
  else S.dLabs.forEach(L => { if (L.el.textContent) L.el.textContent = ''; });
  if (SM.mode === 'hadron') out.push({ L: S.hLab, text: S.hText || '', pri: 9 }); else if (S.hLab.el.textContent) S.hLab.el.textContent = '';
  return out;
};
PX.smDecay = (F, S, dt, fa, a) => {
  const SM = PX.SM, L = PX.decayList(); if (SM.decay.i >= L.length) SM.decay.i = 0; const cur = L[SM.decay.i];
  const sig = SM.decay.i + '|' + (F.stage_t === 0 ? 'r' : '');
  if (S.sig !== SM.decay.i || F.stage_t === 0) { S.sig = SM.decay.i; S.t = 0; F.stage_t = 1; }
  S.t += dt; const T = S.t % 7.2, n = cur.out.length;
  const ptxt = `${PX.KEY[cur.parent][0]} ${PX.KEY[cur.parent][1]}`;
  S.cur = { ptxt, kids: cur.out.map((k, i) => ({ txt: `${PX.KEY[k][0]} ${PX.KEY[k][1]}${cur.virtualW && /^W/.test(k) ? ' (virtual)' : ''}` })) };
  const z = 3.4, vx = -2.2, ease = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
  const P0 = S.dParent; PX.setGlyphKey = PX.setGlyphKey || ((orb, key) => { const g = PX.keyGlyph(key); PX.setGlyph(orb, g.main, g); PX.setColor(orb, new THREE.Color(PX.keyColor(key))); PX.hollow(orb, g.anti ? 1 : 0); });
  if (P0.userData.key !== cur.parent) { P0.userData.key = cur.parent; PX.setGlyphKey(P0, cur.parent); }
  const px = -9.5 + (vx + 9.5) * ease(T / 1.6); P0.position.set(px, 0, z); const pa = T < 1.55 ? 1 : Math.max(0, 1 - (T - 1.55) / .25);
  PX.setA(P0, pa * a, fa);
  S.flash.position.set(vx, 0, z); const fl = Math.max(0, 1 - Math.abs(T - 1.75) / .35); S.flash.scale.setScalar(.01 + fl * 4); S.flash.material.opacity = fl * a * fa; S.flash.material.userData.baseOp = fl * a; S.flash.visible = fl > .01;
  const lp = S.decLine.geometry.attributes.position.array; let q = 0; lp[q++] = px; lp[q++] = 0; lp[q++] = z; lp[q++] = Math.min(px + .0, vx); lp[q++] = 0; lp[q++] = z;
  S.dKids.forEach((kid, i) => {
    if (i >= n) { PX.setA(kid, 0, fa); return; }
    const key = cur.out[i]; if (kid.userData.key !== key) { kid.userData.key = key; PX.setGlyphKey(kid, key); }
    const ty = ((n - 1) / 2 - i) * 3.1, e = ease((T - 1.75) / 2.3), x = vx + (7.4 - vx) * e, y = ty * e;
    kid.position.set(x, y, z); PX.setA(kid, T > 1.7 ? a : 0, fa);
    lp[q++] = vx; lp[q++] = 0; lp[q++] = z; lp[q++] = x; lp[q++] = y; lp[q++] = z;
  });
  S.decLine.geometry.setDrawRange(0, 2 + 2 * n); S.decLine.geometry.attributes.position.needsUpdate = true; S.decLine.material.opacity = .7 * a * fa; S.decLine.material.userData.baseOp = .7 * a;
  PX.face(F, [P0].concat(S.dKids));
};
PX.smHadron = (F, S, dt, fa, a) => {
  const SM = PX.SM, L = SM.had, r = PX.hadronEval(L), n = L.length, z = 3.4;
  S.hText = !n ? '' : !r.ok ? 'not a colourless combination' : r.h ? (r.anti ? 'anti-' : '') + r.h.name.replace(/ \(charged\)| \(neutral\)/, '') + '  ' + r.h.symbol : 'allowed, not in this table';
  S.hAnc.position.set(0, -3.9, z);
  let ci = 0;
  S.hQ.forEach((q, i) => {
    if (i >= n) { PX.setA(q, 0, fa); return; }
    const key = L[i], anti = key.endsWith('bar'), idx = (n === 2 && r.ok) ? 0 : ci % 3; ci++;
    const g = PX.keyGlyph(key); const gs = Object.assign({}, g, { line: anti ? PX.ACL[idx] : PX.CL[idx] }); PX.setGlyph(q, gs.main, gs);
    PX.setColor(q, tc0.setHex(anti ? PX.ACC[idx] : PX.CC[idx])); PX.hollow(q, anti ? 1 : 0);
    const ang = Math.PI / 2 + i * TAU / n + S.ht * .35, R = n === 1 ? 0 : n === 2 ? 1.5 : 1.7;
    q.position.set(Math.cos(ang) * R, Math.sin(ang) * R, z + Math.sin(S.ht * .9 + i) * .3);
    PX.setA(q, a, fa);
  });
  S.ht = (S.ht || 0) + dt;
  S.hRing.position.set(0, 0, z - .2); S.hRing.scale.set(5.4, 5.4, 1); S.hRing.material.opacity = (r.ok || !n ? .6 : .0) * a * fa; S.hRing.material.userData.baseOp = (r.ok || !n ? .6 : 0) * a;
  PX.face(F, S.hQ);
};
const tc0 = new THREE.Color();

/* =====================================================================
   Getting there: frames, flights, links back up into the world, and the extra buttons on cards
   ===================================================================== */
PX.SMC = new V3(4.4, 0, 0);                      // the centre of the overview layout (units of 1e-18 m)
PX.smFocus = (f, id) => {                       // put particle `id` at the frame origin (or the layout centre when null)
  f.opts = f.opts || {}; f.opts.focus = id || null;
  if (f.board && f._focus !== (id || null)) { f._focus = id || null; f.boardBase = f.boardBase || new V3(); if (id) PX.gridPos(id, f.boardBase).negate(); else f.boardBase.copy(PX.SMC).negate(); f.board.position.copy(f.boardBase); if (f.sm && f.sm.shift) f.sm.shift.set(0, 0, 0); }
};
PX.smPos = (f, id, out) => { out = out || new V3(); if (!f.built || !f.sm) return out.set(0, 0, 0); const p = id && f.sm.P[id]; if (p) return out.copy(p.pos).add(f.board.position); return out.set(0, 0, 0); };
PX.smFrame = (host, T, hint) => {
  if (!PX.D) return null;
  const sm = hint && hint.obj && hint.obj.userData && hint.obj.userData.sm;
  const f = new Frame({ type: 'sm', name: 'The Standard Model', unit: 1e-18, radius: 1e5, r1: 3e-16, pos: T.clone(), pinned: true, opts: { focus: PX.META[sm] ? sm : null } });
  return f;
};
PX.nearestQuark = (pf, T) => { const S = pf && pf.proto; if (!S) return null; let best = null, bd = .3; S.Q.forEach(q => { const d = q.p.distanceTo(T); if (d < bd) { bd = d; best = q; } }); return best ? best.orb.userData.sm : null; };
/* the camera is anywhere under a Standard Model frame? */
PX.inSM = () => chainOf(cam.A).find(f => f.type === 'sm') || null;
/* fly into the Standard Model view. focus: a particle id to arrive at, or null for the whole picture. host: a proton frame to dive from */
PX.smD = d => { const a = (typeof freeArea === 'function' ? freeArea().w : W) / H; return a < 1 ? d * Math.min(2.4, .95 / a) : d; };   // a portrait screen, or a view narrowed by the open panel, needs to stand further back to fit the whole picture
PX.goSM = (focus, host, then) => {
  const f0 = PX.inSM();
  if (f0) { f0.ensure(); const p = PX.smPos(f0, focus); flyTo(f0, p, focus ? 1.0e-17 : PX.smD(3.8e-17), then); return f0; }
  if (host && host.type !== 'proton') host = null;
  if (!host) host = FR.proton; // the oxygen nucleus's first proton: the one the ruler goes to
  let f = host.children.find(c => c.type === 'sm');
  if (!f) { const q = host.proto && focus && host.proto.Q.find(q => q.orb.userData.sm === focus); f = PX.smFrame(host, q ? q.p : new V3(), null); f.dynamic = true; host.addChild(f); }
  if (host === FR.proton) { FR.nuc.ensure(); FR.proton.place && FR.proton.place(); }
  if (f.dynamic) f.keep = performance.now() + 120000;
  f.ensure(); if (!f.dynamic) f.pos.set(0, 0, 0); PX.smFocus(f, focus || null);
  flyTo(f, PX.smPos(f, focus), focus ? 1.0e-17 : PX.smD(3.8e-17), then); return f;
};
PX.goProton = then => { FR.nuc.ensure(); if (FR.proton.place) FR.proton.place(); flyTo(FR.proton, new V3(), 3e-15, then); };
/* "Where do I find this?": only destinations that exist in the world today */
PX.FIND = {
  electron: { label: 'In every atom: the electron cloud', go: () => placeGo('place:atom') },
  up: { label: 'In every proton and neutron', go: () => PX.goProton() }, down: { label: 'In every proton and neutron', go: () => PX.goProton() },
  gluon: { label: 'Inside every proton and neutron', go: () => PX.goProton() },
  photon: { label: 'In the sunlight on the park', go: () => placeGo('place:park') },
  muon: { label: 'Passing through the park, and through you (cosmic-ray muons)', go: () => placeGo('place:human') },
  nu_e: { label: 'From the Sun\'s core, where fusion makes them', go: () => PX.goSunCore() },
  w_boson: { label: 'In the Sun\'s core, where it turns protons into neutrons', go: () => PX.goSunCore() },
};
PX.goSunCore = () => {
  if (!FR.solar) return; const f = new Frame({ type: 'plasma', name: 'Plasma at the Sun\'s centre', unit: 1e-9, radius: 40, r1: 3e-7, pos: new V3(0, 0, 0) });
  f.blurb = 'The Sun\'s centre at the scale of nanometres: bare nuclei and free electrons. Here the weak force, carried by the W boson, turns protons into neutrons, and each such change makes a neutrino.'; f.note = 'Schematic: a patch of plasma drawn at random, not a simulation of the Sun\'s core.';
  placeChild(FR.solar, f, 6e-8);
};
/* run something once the camera is in the Standard Model view */
PX.inSMdo = fn => { if (PX.inSM()) { fn(); return; } PX.goSM(null, null, () => setTimeout(fn, 0)); };
PX.cardExtras = (id, h) => {
  const p = PX.byNode[id], inSMv = h && h.frame && h.frame.type === 'sm', infoEl2 = infoEl;
  if (p) {
    const find = PX.FIND[p.id], dec = PX.decayList().findIndex(x => x.pid === p.id), isQ = p.family === 'quark';
    const forceOf = { gluon: 'strong', photon: 'em', w_boson: 'weak', z_boson: 'weak', higgs: 'higgs' }[p.id];
    let b = '';
    if (isQ) b += PX.btn('made', 'What is a quark made of?', false);
    if (!inSMv) b += PX.btn('showsm', 'See it in the Standard Model view');
    if (dec >= 0) b += PX.btn('decay', 'Play how it decays');
    if (forceOf) b += PX.btn('feel', 'Which particles feel this?');
    if (find) b += PX.btn('find', 'Where do I find this?');
    if (!b) return;
    PX.addRow(b + (find ? `<div class="pxwhere">${find.label}</div>` : ''), row => {
      const on = (k, fn) => { const e = row.querySelector(`[data-px="${k}"]`); if (e) e.onclick = fn; };
      on('made', () => { closeInfo(); PX.goSM(p.id, h && h.frame && h.frame.type === 'proton' ? h.frame : null); });
      on('showsm', () => { PX.smSet('overview', { sel: p.id }); PX.goSM(p.id, null); });
      on('decay', () => { PX.smSet('decay', { decay: { i: dec } }); PX.inSMdo(() => { closeInfo(); }); });
      on('feel', () => { PX.smSet('forces', { force: forceOf }); PX.inSMdo(() => { closeInfo(); }); });
      on('find', () => { closeInfo(); find.go(); });
    });
    const wb = infoEl2.querySelector('#whereBtn'); if (wb) wb.textContent = 'Show it in the Standard Model view';
    return;
  }
  if (id === 'sm_proton' || id === 'sm_neutron') {
    PX.addRow(PX.btn('into', 'See what it is made of', false), row => {
      row.querySelector('[data-px="into"]').onclick = () => { closeInfo(); if (h && h.frame && h.frame.type === 'nucleus' && h.obj && h.obj.userData.kind) PX.diveNucleon(h); else if (h && h.frame && h.frame.type === 'proton') { zoomIntoHit(h); } else PX.goProton(); };
    });
  } else if (id === 'sm_overview') {
    PX.addRow(PX.btn('open', 'Open the Standard Model view', false), row => { row.querySelector('[data-px="open"]').onclick = () => { closeInfo(); PX.smSet('overview'); PX.goSM(null, null); }; });
  } else if (id === 'sm_hadrons') {
    PX.addRow(PX.btn('build', 'Build a hadron from quarks', false), row => { row.querySelector('[data-px="build"]').onclick = () => { PX.smSet('hadron', { had: [] }); PX.inSMdo(() => closeInfo()); }; });
  } else if (id === 'sm_antimatter') {
    PX.addRow(PX.btn('anti', 'Show the antimatter version', false), row => { row.querySelector('[data-px="anti"]').onclick = () => { PX.smSet('overview', { anti: true }); PX.inSMdo(() => closeInfo()); }; });
  } else if (id === 'sm_higgs_mechanism' || id === 'sm_interactions' || id === 'sm_strong_force') {
    const f = id === 'sm_higgs_mechanism' ? 'higgs' : 'strong';
    PX.addRow(PX.btn('feel', id === 'sm_interactions' ? 'Which particles feel each force?' : 'Which particles feel this?', false), row => { row.querySelector('[data-px="feel"]').onclick = () => { PX.smSet('forces', { force: f }); PX.inSMdo(() => closeInfo()); }; });
  } else if (id === 'sm_residual_strong' && h && h.frame && h.frame.type === 'nucleus') {
    const o = h.frame.opts || {}, Z = o.Z | 0, N = o.N | 0, A = Z + N;
    const row = document.createElement('div'); row.className = 'pxrow'; row.innerHTML = `<div class="rh">This nucleus</div><p class="pxnuc">${Z} protons, ${N} neutrons (A = ${A}). Radius by the rule of thumb 1.2·A^⅓ ≈ ${PX.nuclearR(A).toFixed(1)} fm. <span class="pxbe">Loading binding energy…</span></p>`;
    const first = infoEl.querySelector('.btnrow'), refs = infoEl.querySelector('.refs'); if (first && first.parentNode === infoEl) first.after(row); else if (refs) refs.before(row); else infoEl.appendChild(row);
    getJSON('data/particles_binding.json').then(B => {
      const e = B.be[String(Z)] && B.be[String(Z)][String(N)], sp = row.querySelector('.pxbe'); if (!sp) return;
      sp.textContent = e ? `Binding energy ${(e[0] / 1000).toFixed(3)} MeV per nucleon${e[2] ? ' (estimated, not measured)' : ''} (AME2020): the energy per nucleon that it would take to pull the nucleus completely apart.` : 'No binding energy is tabulated for this combination.';
    }).catch(() => { const sp = row.querySelector('.pxbe'); if (sp) sp.textContent = ''; });
  }
};
/* open a nucleon of a nucleus frame: a proton frame at its position */
PX.diveNucleon = h => {
  const F = h.frame, m = h.obj, f = new Frame({ type: 'proton', name: m.userData.kind === 'proton' ? 'Proton' : 'Neutron', unit: 1e-15, radius: 4, r1: 1.2e-14, pos: m.position.clone(), pinned: true, opts: { kind: m.userData.kind } });
  f.dynamic = true; f.keep = performance.now() + 90000; F.addChild(f); f.ensure(); flyTo(f, new V3(), 3e-15);
};

/* ---------- wire everything into the world ---------- */
WORLD_EXT.push(async FRx => {
  await PX.load();
  if (!PX.D || !FRx.proton) return;
  const sm = FRx.proton.addChild(new Frame({ type: 'sm', name: 'The Standard Model', unit: 1e-18, radius: 1e5, r1: 3e-16, pinned: true, opts: {} }));
  FRx.sm = sm;
  // while you zoom inside the proton, the Standard Model frame sits where you are looking (and at the quark, if you are on one)
  sm.place = () => {
    const A = cam.A; if (A !== FRx.proton || fly) return;
    sm.pos.copy(cam.T); if (cam.D > 1.8e-16) PX.smFocus(sm, PX.nearestQuark(FRx.proton, cam.T));
    if (zoom.pivot && cam.D < 7e-16) zoom.pivot.p.copy(cam.T);   // from here the zoom aims at where the new frame will be centred
  };
  EXT_LANDMARKS.push({ label: 'Standard Model', D: 3.8e-17, go: then => { FRx.nuc.ensure(); FRx.proton.place && FRx.proton.place(); sm.ensure(); sm.pos.set(0, 0, 0); PX.smFocus(sm, null); flyTo(sm, PX.smPos(sm, null), PX.smD(3.8e-17), then); } });
  // search and topic links: a particle's topic card flies to it in the Standard Model view
  const reg = (id, fn) => { if (typeof tearReg === 'function' && typeof TEAR !== 'undefined') TEAR[id] = fn; };
  const mk = (id, D) => ({ frame: sm, D, get pos() { sm.ensure(); sm.pos.set(0, 0, 0); PX.smFocus(sm, null); return PX.smPos(sm, id); } });
  PX.ORDER.forEach(id => reg(PX.P[id].node, mk(id, 1.1e-17)));
  reg('sm_overview', { frame: sm, get D() { return PX.smD(3.8e-17); }, get pos() { sm.ensure(); sm.pos.set(0, 0, 0); PX.smFocus(sm, null); return PX.smPos(sm, null); } });
  if (typeof TEAR !== 'undefined') { TEAR.sm_proton = { frame: FRx.proton, pos: new V3(), D: 3e-15 }; }
  if (typeof SEARCH_SOURCES !== 'undefined' && SEARCH_SOURCES && typeof SEARCH_SOURCES.push === 'function') {
    try { SEARCH_SOURCES.push({ id: 'particles', label: 'Particles', search: q => { q = (q || '').toLowerCase(); return Object.keys(NODE).filter(k => k.startsWith('sm_') && NODE[k].title.toLowerCase().includes(q)).slice(0, 8).map(k => ({ id: k, title: NODE[k].title, sub: NODE[k].summary || '', go: () => goToNode(k) })); } }); } catch (e) { console.error(e); }
  }
});

/* labels sit above the canvas and swallow the mouse wheel; hand it on, so that zooming works with the pointer over a label */
(function forwardWheel() {
  const layer = document.getElementById('labels'), cv = document.getElementById('c'); if (!layer || !cv) return;
  layer.addEventListener('wheel', e => { e.preventDefault(); cv.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, bubbles: true, cancelable: true })); }, { passive: false });
})();
