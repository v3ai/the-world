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
PX.el = (html, cls) => { const d = document.createElement('div'); d.className = cls || 'pxp'; d.innerHTML = html; return d; };
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
PX.dashRing = (key, col) => canvasTex('px|ring|' + key, 512, 512, g => {
  g.clearRect(0, 0, 512, 512); g.strokeStyle = col; g.lineWidth = 3; g.setLineDash([10, 9]); g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.stroke();
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
      const orb = PX.orb(.17, PX.CC[colOrder[i]], { glyph: { main: fl, line: PX.CL[colOrder[i]] }, halo: 4.2, haloA: .32, hitK: 1.5 });
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
    labs.push({ L: F.label(edge, 'Edge', { offset: new V3(0, 0, 0) }), text: () => `${S.kind === 'proton' ? 'Proton' : 'Neutron'} edge ≈ 0.84 fm`, pri: 3 });
    F.name = kind === 'proton' ? 'Proton' : 'Neutron';
    F.blurb = kind === 'proton' ? 'Inside a proton: two up quarks and a down quark, trading gluons, in a sea of quark–antiquark pairs.' : 'Inside a neutron: one up quark and two down quarks, trading gluons, in a sea of quark–antiquark pairs.';
    F.note = 'A cartoon, not a photograph. Quarks have no measured size (no structure found down to about 10⁻¹⁹ m), nothing here has a definite position, and the sizes are not to scale. In the real proton, gluons carry about half of the momentum.';
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
      S.t += dt; const T = S.t, fa = PX.fa(F);
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
      PX.declutter(F, labs);
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
