'use strict';
/* The old atom and proton scenes (BUILD.atom, BUILD.proton) were replaced by js/atom.js and js/particles.js and are gone. */

/* ================= LEVEL: MOLECULE ================= */
const CPK = { H: 0xf2f2f2, C: 0x4a4a4a, N: 0x3a5cff, O: 0xff3030, P: 0xff8c1a };
const RAD_BS = { H: .42, C: .62, N: .6, O: .58, P: .7 }, RAD_VDW = { H: 1.2, C: 1.7, N: 1.55, O: 1.52, P: 1.8 };
const MOLS = (() => {
  const t = 1 / Math.sqrt(3), sa = .928 * 1.01, ca = .372 * 1.01;
  return {
    H2O: { name: 'Water', atoms: [['O', 0, 0, 0], ['H', .759, .588, 0], ['H', -.759, .588, 0]], bonds: [[0, 1, 1], [0, 2, 1]], why: 'Oxygen needs 2 more electrons for a full outer shell; each hydrogen needs 1. Sharing one pair with each H solves both!' },
    O2: { name: 'O₂', atoms: [['O', -.604, 0, 0], ['O', .604, 0, 0]], bonds: [[0, 1, 2]], why: 'Each oxygen needs 2 more electrons, so they share two pairs — a double bond.' },
    CO2: { name: 'CO₂', atoms: [['C', 0, 0, 0], ['O', -1.16, 0, 0], ['O', 1.16, 0, 0]], bonds: [[0, 1, 2], [0, 2, 2]], why: 'Carbon needs 4 electrons; each oxygen needs 2. Two double bonds fill everyone\'s shell.' },
    CH4: { name: 'CH₄', atoms: [['C', 0, 0, 0], ['H', 1.09 * t, 1.09 * t, 1.09 * t], ['H', 1.09 * t, -1.09 * t, -1.09 * t], ['H', -1.09 * t, 1.09 * t, -1.09 * t], ['H', -1.09 * t, -1.09 * t, 1.09 * t]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], why: 'Carbon has 4 valence electrons and needs 4 more — one from each of four hydrogens.' },
    NH3: { name: 'NH₃', atoms: [['N', 0, .25, 0], ['H', sa, .25 - ca, 0], ['H', sa * Math.cos(TAU / 3), .25 - ca, sa * Math.sin(TAU / 3)], ['H', sa * Math.cos(2 * TAU / 3), .25 - ca, sa * Math.sin(2 * TAU / 3)]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], why: 'Nitrogen needs 3 more electrons — it shares one pair with each of three hydrogens.' },
  };
})();
(() => {
  const A = (e, v) => [e, v.x, v.y, v.z];
  function tdirs(u, phi0) {
    const a = Math.abs(u.x) < .9 ? new V3(1, 0, 0) : new V3(0, 1, 0);
    const e1 = new V3().crossVectors(u, a).normalize(), e2 = new V3().crossVectors(u, e1).normalize();
    return [0, 1, 2].map(k => { const ph = phi0 + k * TAU / 3; return u.clone().multiplyScalar(-1 / 3).addScaledVector(e1, Math.cos(ph) * .9428).addScaledVector(e2, Math.sin(ph) * .9428).normalize(); });
  }
  const bz = { name: 'Benzene', atoms: [], bonds: [], arom: true, why: 'Each carbon bonds to two carbons and one hydrogen; its last electron joins a ring of six shared π electrons.' };
  for (let k = 0; k < 6; k++) { const a = k * TAU / 6; bz.atoms.push(['C', Math.cos(a) * 1.39, Math.sin(a) * 1.39, 0]); }
  for (let k = 0; k < 6; k++) { const a = k * TAU / 6; bz.atoms.push(['H', Math.cos(a) * 2.48, Math.sin(a) * 2.48, 0]); bz.bonds.push([k, (k + 1) % 6, 1]); bz.bonds.push([k, k + 6, 1]); }
  MOLS.C6H6 = bz;
  const C1 = new V3(0, 0, 0), C2 = new V3(1.52, 0, 0), at = [A('C', C1), A('C', C2)], bo = [[0, 1, 1]];
  tdirs(new V3(1, 0, 0), 0).forEach(d => { at.push(A('H', C1.clone().addScaledVector(d, 1.09))); bo.push([0, at.length - 1, 1]); });
  const d2 = tdirs(new V3(-1, 0, 0), Math.PI / 3), O = C2.clone().addScaledVector(d2[0], 1.43); at.push(A('O', O)); const oi = at.length - 1; bo.push([1, oi, 1]);
  [d2[1], d2[2]].forEach(d => { at.push(A('H', C2.clone().addScaledVector(d, 1.09))); bo.push([1, at.length - 1, 1]); });
  const best = tdirs(C2.clone().sub(O).normalize(), 0).sort((p, q) => O.clone().addScaledVector(q, .96).distanceTo(C1) - O.clone().addScaledVector(p, .96).distanceTo(C1))[0];
  at.push(A('H', O.clone().addScaledVector(best, .96))); bo.push([oi, at.length - 1, 1]);
  MOLS.C2H5OH = { name: 'Ethanol', atoms: at, bonds: bo, why: 'Carbon makes four bonds, oxygen two and hydrogen one — the same counting rule builds every organic molecule.' };
  const CA = new V3(0, 0, 0), CP = new V3(1.53, 0, 0), g = [A('C', CA), A('C', CP)], gb = [[0, 1, 1]];
  const dA = tdirs(new V3(1, 0, 0), 0), Nn = CA.clone().addScaledVector(dA[0], 1.47); g.push(A('N', Nn)); const ni = g.length - 1; gb.push([0, ni, 1]);
  [dA[1], dA[2]].forEach(d => { g.push(A('H', CA.clone().addScaledVector(d, 1.09))); gb.push([0, g.length - 1, 1]); });
  const dN = tdirs(CA.clone().sub(Nn).normalize(), .4); [dN[0], dN[1]].forEach(d => { g.push(A('H', Nn.clone().addScaledVector(d, 1.01))); gb.push([ni, g.length - 1, 1]); });
  const e = new V3(0, Nn.y, Nn.z).normalize(), vp = new V3(.5, 0, 0).addScaledVector(e, .866), vm = new V3(.5, 0, 0).addScaledVector(e, -.866);
  const O1 = CP.clone().addScaledVector(vp, 1.21), O2 = CP.clone().addScaledVector(vm, 1.34);
  g.push(A('O', O1)); gb.push([1, g.length - 1, 2]); g.push(A('O', O2)); const o2i = g.length - 1; gb.push([1, o2i, 1]);
  const u2 = CP.clone().sub(O2).normalize(), nrm = new V3().crossVectors(new V3(1, 0, 0), e), pa = new V3().crossVectors(nrm, u2).normalize(), cA = Math.cos(105 * Math.PI / 180), sA = Math.sin(105 * Math.PI / 180);
  const hO = [1, -1].map(s => O2.clone().addScaledVector(u2.clone().multiplyScalar(cA).addScaledVector(pa, s * sA), .97)).sort((p, q) => q.distanceTo(O1) - p.distanceTo(O1))[0];
  g.push(A('H', hO)); gb.push([o2i, g.length - 1, 1]);
  MOLS.GLY = { name: 'Glycine', atoms: g, bonds: gb, why: 'An amine group and a carboxylic acid on one carbon: link many of these through peptide bonds and you get a protein.' };
})();
const EN = { H: 2.20, C: 2.55, N: 3.04, O: 3.44, P: 2.19 };
BUILD.molecule = (c, opts) => {
  c.scene.background = new THREE.Color(0x050a16); c.scene.fog = new THREE.Fog(0x050a16, 22, 60);
  const g = c.group;
  g.add(new THREE.HemisphereLight(0xbfd8ff, 0x302040, .55));
  const dl = new THREE.DirectionalLight(0xffffff, 1.05); dl.position.set(6, 9, 8); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0x88aaff, .4); dl2.position.set(-6, -3, -5); g.add(dl2);
  const S = 2.3;
  const molG = new THREE.Group(); g.add(molG);
  // background drift
  const r = rng(11), drift = [];
  const keys = Object.keys(MOLS);
  for (let i = 0; i < 34; i++) {
    const M = MOLS[keys[i % keys.length]], dg = new THREE.Group();
    M.atoms.forEach(a => { const m = new THREE.Mesh(new THREE.SphereGeometry(RAD_BS[a[0]] * 1.6, 12, 8), smat(CPK[a[0]], { roughness: .6 })); m.position.set(a[1], a[2], a[3]).multiplyScalar(S * .8); dg.add(m); });
    const v = new V3(gauss(r), gauss(r) * .6, gauss(r)).normalize().multiplyScalar(16 + r() * 22);
    dg.position.copy(v); dg.scale.setScalar(.5); dg.rotation.set(r() * 6, r() * 6, r() * 6); g.add(dg);
    drift.push({ dg, v: new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.25), w: new V3(r(), r(), r()).multiplyScalar(.5) });
  }
  let state = { mode: 'bs', anim: null, atoms: [], bonds: [], key: null, spin: 0 };
  let polG = null, polLabels = [];
  function clearPol() { if (polG) { molG.remove(polG); polG.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); polG = null; } polLabels.forEach(L => removeLabel(c, L)); polLabels = []; }
  function applyPol() {
    clearPol(); const M = MOLS[state.key]; polG = new THREE.Group(); molG.add(polG);
    const q = M.atoms.map(() => 0);
    M.bonds.forEach(([a, b]) => { const d = .25 * (EN[M.atoms[a][0]] - EN[M.atoms[b][0]]); q[a] -= d; q[b] += d; });
    const mu = new V3();
    state.atoms.forEach((m, i) => {
      const col = q[i] < 0 ? new THREE.Color(1, 1, 1).lerp(new THREE.Color(0xff2a2a), clamp(-q[i] * 3.2, 0, 1)) : new THREE.Color(1, 1, 1).lerp(new THREE.Color(0x2a6bff), clamp(q[i] * 4, 0, 1));
      const sh = new THREE.Mesh(new THREE.SphereGeometry(RAD_VDW[m.userData.el] * S * .42, 32, 24), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: .36, depthWrite: false, roughness: .4 }));
      sh.material.userData.noHL = true; sh.position.copy(m.userData.final); polG.add(sh);
      mu.addScaledVector(m.userData.final, q[i]);
      if (Math.abs(q[i]) > .07) polLabels.push(c.addLabel(m, q[i] < 0 ? 'δ−' : 'δ+', { offset: new V3(0, -.9, 0) }));
    });
    if (mu.length() > .12) {
      const dir = mu.clone().negate().normalize(), a = dir.clone().multiplyScalar(-2.2), b = dir.clone().multiplyScalar(2.2), mat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
      const shaft = cylBetween(a, b, .08, mat); polG.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(.26, .6, 16), mat); tip.position.copy(b); tip.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir); polG.add(tip);
      const cross = cylBetween(a.clone().addScaledVector(dir, .35).add(new V3(0, .3, 0)), a.clone().addScaledVector(dir, .35).add(new V3(0, -.3, 0)), .06, mat); polG.add(cross);
      const anchor = new THREE.Object3D(); anchor.position.copy(b); polG.add(anchor);
      polLabels.push(c.addLabel(anchor, 'Net dipole (points to δ− end)', { offset: new V3(0, .5, 0) }));
    } else polLabels.push(c.addLabel(state.atoms[0], 'No net dipole — bond dipoles cancel', { offset: new V3(0, 2.2, 0) }));
  }
  function setMol(key) {
    while (molG.children.length) { const ch = molG.children.pop(); ch.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose && o.material.dispose(); }); }
    polG = null; polLabels = [];
    c.pickables.length = 0; c.labels.forEach(l => l.el.remove()); c.labels.length = 0;
    const M = MOLS[key]; state.key = key; c.opts.mol = key; c.intro = 'mol_' + key;
    const cen = new V3(); M.atoms.forEach(a => cen.add(new V3(a[1], a[2], a[3]))); cen.multiplyScalar(1 / M.atoms.length);
    state.molR = Math.max(...M.atoms.map(a => new V3(a[1], a[2], a[3]).distanceTo(cen))) * S + 1.2;
    if (state.key && c.opts) c.view.g.dist = clamp(state.molR * 3 + 4, Math.max(5.5, state.molR * 1.25 + 2), Math.max(30, state.molR * 6));
    state.atoms = M.atoms.map(([e, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), smat(CPK[e], { roughness: e === 'H' ? .35 : .28, metalness: .05 }));
      m.position.set(x, y, z).sub(cen).multiplyScalar(S); m.userData = { id: 'el_' + e, el: e, final: m.position.clone() };
      m.scale.setScalar(state.mode !== 'sf' ? RAD_BS[e] : RAD_VDW[e] * S * .42);
      const glow = glowSprite(CPK[e] === 0x4a4a4a ? 0x8899aa : CPK[e], 2.4 / m.scale.x, 0); m.add(glow); m.userData.glow = glow;
      molG.add(m); c.pickables.push(m); return m;
    });
    state.bonds = M.bonds.map(([a, b, ord]) => {
      const A = state.atoms[a].userData.final, B = state.atoms[b].userData.final;
      const bg = new THREE.Group(); bg.userData = { id: ord === 2 ? 'bond_double' : 'bond_single', priority: .9 };
      const dir = new V3().subVectors(B, A).normalize();
      let perp = new V3().crossVectors(dir, new V3(0, 0, 1)); if (perp.length() < .1) perp = new V3().crossVectors(dir, new V3(0, 1, 0)); perp.normalize();
      const offs = ord === 2 ? [-.17, .17] : [0]; const rad = ord === 2 ? .09 : .13;
      const mid = new V3().addVectors(A, B).multiplyScalar(.5);
      offs.forEach(o => {
        const pa = A.clone().addScaledVector(perp, o), pb = B.clone().addScaledVector(perp, o), pm = mid.clone().addScaledVector(perp, o);
        bg.add(cylBetween(pa, pm, rad, smat(new THREE.Color(CPK[M.atoms[a][0]]).lerp(new THREE.Color(0xcccccc), .45), { roughness: .4 })));
        bg.add(cylBetween(pm, pb, rad, smat(new THREE.Color(CPK[M.atoms[b][0]]).lerp(new THREE.Color(0xcccccc), .45), { roughness: .4 })));
      });
      bg.visible = state.mode !== 'sf'; molG.add(bg); c.pickables.push(bg); return bg;
    });
    c.addLabel(state.atoms[0], EL[M.atoms[0][0]].name, { offset: new V3(0, 1.1, 0) });
    const hi = M.atoms.findIndex(a => a[0] !== M.atoms[0][0]);
    if (hi > 0) c.addLabel(state.atoms[hi], EL[M.atoms[hi][0]].name, { offset: new V3(0, .8, 0) });
    if (M.arom) {
      const ring = new THREE.Group(); ring.userData = { id: 'delocalized', priority: 1.1 };
      const rm = new THREE.MeshBasicMaterial({ color: 0xb388ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
      [-.62, .62].forEach(z => { const t = new THREE.Mesh(new THREE.TorusGeometry(1.39 * S, .16, 12, 72), rm); t.position.z = z * S; ring.add(t); });
      molG.add(ring); c.pickables.push(ring); c.addLabel(ring.children[1], 'Delocalized π electrons', { offset: new V3(0, 3.6, 0) });
    }
    if (state.bonds[0]) { const L = c.addLabel(state.bonds[0], M.bonds[0][2] === 2 ? 'Double bond' : 'Bond', { offset: new V3(0, .5, 0) }); L.obj = state.bonds[0].children[1] || state.bonds[0].children[0]; }
  }
  function buildAnim(user) {
    const r2 = rng(Math.floor(performance.now()));
    state.atoms.forEach((m, i) => { m.userData.start = m.userData.final.clone().add(new V3(gauss(r2), gauss(r2), gauss(r2)).normalize().multiplyScalar(6 + r2() * 3)); m.position.copy(m.userData.start); m.userData.glow.material.opacity = .9; });
    state.bonds.forEach(b => b.scale.setScalar(.001));
    state.anim = { t: 0, user, done: false };
  }
  c.update = (dt, t) => {
    molG.rotation.y += dt * .25;
    for (const d of drift) { d.dg.position.addScaledVector(d.v, dt); d.dg.rotation.x += d.w.x * dt; d.dg.rotation.y += d.w.y * dt; if (d.dg.position.length() > 42) d.dg.position.multiplyScalar(-.9); }
    const a = state.anim;
    if (a) {
      a.t += dt;
      state.atoms.forEach((m, i) => { const k = clamp((a.t - i * .12) / 1.5, 0, 1); m.position.lerpVectors(m.userData.start, m.userData.final, easeOutBack(k)); });
      const bk = clamp((a.t - 1.55) / .45, 0, 1);
      state.bonds.forEach(b => b.scale.setScalar(Math.max(.001, easeOutBack(bk))));
      state.atoms.forEach(m => { m.userData.glow.material.opacity = a.t < 1.6 ? .9 : Math.max(0, .9 - (a.t - 1.6) * 1.5) + (a.t > 1.6 && a.t < 1.9 ? .6 : 0); });
      if (a.t > 1.7 && !a.done) {
        a.done = true;
        if (a.user) { toast(`⚡ Bonded! <span style="color:#c5cde0">${MOLS[state.key].why}</span>`, 'm'); fire('built_' + state.key); }
      }
      if (a.t > 2.8) { state.anim = null; state.atoms.forEach(m => m.userData.glow.material.opacity = 0); }
    }
  };
  function setMode(mode) {
    state.mode = mode;
    state.atoms.forEach(m => { const e = m.userData.el; m.scale.setScalar(mode !== 'sf' ? RAD_BS[e] : RAD_VDW[e] * S * .42); m.userData.glow.scale.setScalar(2.4 / m.scale.x); });
    state.bonds.forEach(b => b.visible = mode !== 'sf');
    if (mode === 'pol') applyPol(); else clearPol();
  }
  setMol(MOLS[opts.mol] ? opts.mol : 'H2O');
  c.focusIn = () => state.atoms[0].getWorldPosition(new V3());
  c.minDist = () => Math.max(5.5, state.molR * 1.25 + 2);
  c.maxDist = () => Math.max(30, state.molR * 6);
  c.view.g.dist = c.view.dist = clamp(state.molR * 3 + 4, c.minDist(), c.maxDist());
  c.zoomInTarget = () => ({ key: 'atom', opts: { el: MOLS[state.key].atoms[0][0] } });
  c.focusFor = (key, o) => { const m = state.atoms.find(a => a.userData.el === (o && o.el)) || state.atoms[0]; return { pos: m.getWorldPosition(new V3()), r: m.scale.x }; };
  seg([['H2O', 'Water'], ['O2', 'O₂'], ['CO2', 'CO₂'], ['CH4', 'Methane'], ['NH3', 'Ammonia'], ['C2H5OH', 'Ethanol'], ['C6H6', 'Benzene'], ['GLY', 'Glycine']], state.key, k => { setMol(k); setMode(state.mode); buildAnim(false); showInfo('mol_' + k); rekey(c); });
  actBtn('⚡ Build it', () => buildAnim(true));
  seg([['bs', 'Ball & stick'], ['sf', 'Space-filling'], ['pol', 'Polarity']], 'bs', k => { setMode(k); if (k === 'pol') showInfo('polarity'); });
  buildAnim(false);
};

/* ================= LEVEL: DNA ================= */
/* A one-line statement of what the picture is, shown in the caption's note slot. The builders set it; world_matter's wrappers set the blurb. */
function sceneNote(c, note, blurb) {
  const F = c.frame; if (!F) return;
  F.note = note || ''; if (blurb != null) F.blurb = blurb;
  if (typeof capFrame !== 'undefined' && capFrame === F) { const a = document.getElementById('capNote'), b = document.getElementById('capD'); if (a) a.textContent = F.note; if (b && blurb != null) b.textContent = F.blurb; }
}
BUILD.dna = (c) => {
  // No fog: the helix is only 13 nm long, so a fog tied to the camera distance hid it from the moment you arrived.
  c.scene.background = new THREE.Color(0x040b14);
  const g = c.group;
  g.add(new THREE.HemisphereLight(0xcfe0ff, 0x221133, .75));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(8, 10, 10); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0x7799ff, .45); dl2.position.set(-8, -4, -6); g.add(dl2);
  const NM = 2.4;                                   // builder units per nanometre (this frame draws 1 unit = 1/2.4 nm)
  // floating particles (water and ions around the DNA; decoration only)
  const r = rng(5), pp = [], pc = [], ps = [];
  for (let i = 0; i < 900; i++) { pp.push(gauss(r) * 25, gauss(r) * 25, gauss(r) * 25); pc.push(.3, .5, .8); ps.push(.25 + r() * .3); }
  g.add(makePoints(pp, pc, ps, { opacity: .5 }));
  // ---- B-DNA geometry: 0.34 nm rise, 10.5 base pairs per turn, right-handed, backbone 2.0 nm across
  const SEQ = 'ATGGCTAGCTTACGGATCCGTAAGCTTGCATGCCTGTAA', COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
  const n = SEQ.length, rise = .34 * NM, twist = TAU / 10.5, off = 125 * Math.PI / 180;   // off: angle from strand 1's sugar to strand 2's at the same level (the minor-groove side)
  const Rs = .6 * NM, Rp = .87 * NM;                // sugar ring centres 0.6 nm from the axis, phosphorus 0.87 nm (outer edge of the phosphate group 1.0 nm: the 2 nm width)
  const spos = (a, rad, y, out) => out.set(rad * Math.cos(a), y, -rad * Math.sin(a));   // a grows with height and the point turns x towards -z: a right-handed screw
  const tilt = new THREE.Group(); tilt.rotation.z = .42; g.add(tilt);
  const helix = new THREE.Group(); tilt.add(helix);
  const BC = { A: 0x4ade80, T: 0xf87171, G: 0xfacc15, C: 0x60a5fa };
  const bMat = {}; for (const k in BC) bMat[k] = smat(BC[k], { roughness: .35, emissive: new THREE.Color(BC[k]).multiplyScalar(.14) });
  const sugarMat = smat(0xe9e2c6, { roughness: .5, emissive: 0x1c1a10 }), phosMat = smat(0xff9f43, { emissive: 0x2a1400, roughness: .35 });
  const sugarNew = smat(0xbfe6ff, { roughness: .5, emissive: 0x0c1c28 }), phosNew = smat(0x38bdf8, { emissive: 0x04202e, roughness: .35 });
  const hbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 });
  const sG = new THREE.SphereGeometry(.5, 20, 14), pG = new THREE.SphereGeometry(.38, 18, 12), bG = new THREE.CylinderGeometry(.24, .24, 1, 14), hG = new THREE.SphereGeometry(.08, 8, 6);
  const mkNuc = (letter, sm, pm, withPhos) => {
    const sugar = new THREE.Mesh(sG, sm); sugar.userData = { id: 'sugar' };
    const base = new THREE.Mesh(bG, bMat[letter]); base.userData = { id: 'base_' + letter };
    const phos = withPhos ? new THREE.Mesh(pG, pm) : null; if (phos) phos.userData = { id: 'phosphate' };
    [sugar, base, phos].forEach(m => { if (m) { helix.add(m); c.pickables.push(m); } });
    return { sugar, base, phos };
  };
  const mkHb = (cnt) => { const hb = new THREE.Group(); hb.userData = { id: 'hbond', priority: 1.2 }; for (let k = 0; k < cnt; k++) { const d = new THREE.Mesh(hG, hbMat); d.position.y = (k - (cnt - 1) / 2) * .17; hb.add(d); } helix.add(hb); c.pickables.push(hb); return hb; };
  const bp = [];
  for (let i = 0; i < n; i++) {
    const L0 = SEQ[i], L1 = COMP[SEQ[i]], cnt = (L0 === 'G' || L0 === 'C') ? 3 : 2;
    const e = { y: (i - (n - 1) / 2) * rise, a: i * twist, s: [mkNuc(L0, sugarMat, phosMat, i < n - 1), mkNuc(L1, sugarMat, phosMat, i < n - 1)], hb: mkHb(cnt), hb2: mkHb(cnt) };
    // the new strands made during replication: strand 1's partner sits in slot 2 and vice versa
    e.nw = [mkNuc(L0, sugarNew, phosNew, i < n - 1), mkNuc(L1, sugarNew, phosNew, i < n - 1)];   // nw[0]: new partner of old strand 2 (slot 1); nw[1]: new partner of old strand 1 (slot 2)
    e.nw.forEach(o => { [o.sugar, o.base, o.phos].forEach(m => { if (m) m.visible = false; }); }); e.hb2.visible = false;
    bp.push(e);
  }
  const tubeMat = smat(0xf2c38b, { roughness: .4, emissive: 0x1a0d00 }); tubeMat.userData.noHL = true;
  const tubeNew = smat(0x7dd3fc, { roughness: .4, emissive: 0x06202e }); tubeNew.userData.noHL = true;
  const tubes = [null, null, null, null];     // old strand 1, old strand 2, new partner of 2 (leading), new partner of 1 (lagging)
  const SHIFT = 1.45 * NM;                    // each daughter helix ends up 1.45 nm to its side: centres 2.9 nm apart for 2.0 nm wide helices
  const fork = new THREE.Object3D(); helix.add(fork);
  const _p = new V3(), _q = new V3(), _m = new V3(), _d = new V3(), UP = new V3(0, 1, 0);
  function placeBase(o, sp, mid) { _d.subVectors(mid, sp); const len = Math.max(.01, _d.length() - .35); _d.normalize(); o.base.position.copy(sp).addScaledVector(_d, .35 + len / 2); o.base.scale.set(1, len, 1); o.base.quaternion.setFromUnitVectors(UP, _d); }
  function layout(u) {
    const pts = [[], [], [], []];
    let forkI = -1;
    for (let i = 0; i < n; i++) {
      const e = bp[i];
      const k = smooth(0, 1, (u * (n + 10) - (n - 1 - i)) / 10);
      if (k > .5 && forkI < 0) forkI = i;
      const sx = SHIFT * k, kn = smooth(.1, .55, k), kp = i < n - 1 ? smooth(0, 1, (u * (n + 10) - (n - 2 - i)) / 10) : k, sxp = SHIFT * kp;
      const aS = [e.a, e.a + off];
      const p0 = spos(aS[0], Rs, e.y, new V3()), p1 = spos(aS[1], Rs, e.y, new V3()), mid0 = p0.add(p1).multiplyScalar(.5);
      for (let s = 0; s < 2; s++) {                // old strand 1 goes with the left daughter (-x), old strand 2 with the right (+x)
        const o = e.s[s], dir = s === 0 ? -1 : 1;
        const sp = spos(aS[s], Rs, e.y, new V3()); sp.x += dir * sx; o.sugar.position.copy(sp); placeBase(o, sp, _m.set(mid0.x + dir * sx, mid0.y, mid0.z));
        pts[s].push(sp.clone());
        if (o.phos) { spos(aS[s] + twist / 2, Rp, e.y + rise / 2, _p); _p.x += dir * sxp; o.phos.position.copy(_p); pts[s].push(_p.clone()); }
      }
      // new strands: nw[0] sits in slot 0 and pairs with old strand 2 (right daughter); nw[1] sits in slot 1 and pairs with old strand 1 (left daughter)
      for (let s = 0; s < 2; s++) {
        const o = e.nw[s], dirD = s === 0 ? 1 : -1, vis = kn > .02;
        [o.sugar, o.base, o.phos].forEach(m => { if (m) m.visible = vis; });
        if (!vis) continue;
        const sp = spos(aS[s], Rs, e.y, new V3()); sp.x += dirD * sx; o.sugar.position.copy(sp); o.sugar.scale.setScalar(kn);
        placeBase(o, sp, _m.set(mid0.x + dirD * sx, mid0.y, mid0.z)); o.base.scale.set(kn, o.base.scale.y * kn, kn);
        pts[s === 0 ? 2 : 3].push(sp.clone());
        if (o.phos) { spos(aS[s] + twist / 2, Rp, e.y + rise / 2, _q); _q.x += dirD * sxp; o.phos.position.copy(_q); o.phos.scale.setScalar(kn); pts[s === 0 ? 2 : 3].push(_q.clone()); }
      }
      // hydrogen bonds: the left daughter keeps hb, the right one gets hb2
      e.hb.position.set(mid0.x - sx, mid0.y, mid0.z);
      e.hb2.visible = kn > .02; e.hb2.position.set(mid0.x + sx, mid0.y, mid0.z); e.hb2.scale.setScalar(Math.max(.001, kn));
    }
    const ft = forkI < 0 ? n - 1 : Math.max(0, forkI - 1); fork.position.set(0, bp[ft].y, 0);
    for (let s = 0; s < 4; s++) {
      if (tubes[s]) { helix.remove(tubes[s]); tubes[s].geometry.dispose(); tubes[s] = null; }
      if (pts[s].length < 3) continue;
      tubes[s] = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts[s]), pts[s].length * 3, .13, 6, false), s < 2 ? tubeMat : tubeNew); helix.add(tubes[s]);
    }
  }
  let unzip = 0, target = 0, built = false;
  layout(0);
  // ---- scale bar (2 nm) under the helix
  const bar = new THREE.Group(); g.add(bar); bar.position.set(0, -(n * rise / 2 + 3.2), 0);
  const barM = new THREE.MeshBasicMaterial({ color: 0xdbeafe }); const barMesh = new THREE.Mesh(new THREE.BoxGeometry(2 * NM, .09, .09), barM); bar.add(barMesh);
  [-1, 1].forEach(sd => { const t = new THREE.Mesh(new THREE.BoxGeometry(.09, .5, .09), barM); t.position.x = sd * NM; bar.add(t); });
  c.addLabel(bar, '2 nm', { offset: new V3(0, .2, 0), always: true });
  // ---- codon strip: an invented example, shown as DNA letters
  const AA = { ATG: 'Met (start)', GCT: 'Ala', AGC: 'Ser', TTA: 'Leu', CGG: 'Arg', ATC: 'Ile', CGT: 'Arg', AAG: 'Lys', CTT: 'Leu', GCA: 'Ala', TGC: 'Cys', CTG: 'Leu', TAA: 'Stop' };
  const strip = document.createElement('div'); strip.id = 'seq';
  strip.innerHTML = '<span id="seqLbl">Invented example, read three letters at a time →</span>' + SEQ.match(/.{3}/g).map(cd => `<div class="codon"><span class="l">${cd.split('').map(ch => `<span style="color:#${BC[ch].toString(16).padStart(6, '0')}">${ch}</span>`).join('')}</span><span class="aa">${AA[cd]}</span></div>`).join('');
  strip.title = 'These 39 letters are made up, not a real gene. A cell first copies a gene into messenger RNA (T becomes U), and the ribosome reads that copy three letters (one codon) at a time; each codon names one amino acid.';
  uiEl(strip);
  const ub = actBtn('Show replication', () => { target = target ? 0 : 1; ub.textContent = target ? 'Zip back up' : 'Show replication'; sceneNote(c, target ? NOTE.rep : NOTE.helix); });
  // ---- labels: the ends of each strand, the grooves, the fork
  const endLbl = (o, t) => c.addLabel(o, t, { offset: new V3(0, .15, 0), always: true });
  endLbl(bp[0].s[0].sugar, "5′"); endLbl(bp[n - 1].s[0].sugar, "3′"); endLbl(bp[n - 1].s[1].sugar, "5′"); endLbl(bp[0].s[1].sugar, "3′");
  const grooveAnchor = (a, y, t) => { const o = new THREE.Object3D(); spos(a, Rp + 1.6, y, o.position); helix.add(o); c.addLabel(o, t, { offset: new V3(0, .1, 0) }); return o; };
  const gA = [grooveAnchor(bp[12].a + off / 2, bp[12].y, 'Minor groove'), grooveAnchor(bp[22].a + off / 2 + Math.PI, bp[22].y, 'Major groove')];
  c.addLabel(bp[n - 4].s[0].base, 'Base pair', { offset: new V3(0, .3, 0) });
  c.addLabel(bp[6].s[0].phos, 'Sugar-phosphate backbone', { offset: new V3(0, .5, 0) });
  c.addLabel(fork, 'Replication fork', { offset: new V3(2.6, 0, 0) });
  const NOTE = {
    helix: 'Schematic ball-and-stick model of B-DNA, drawn to scale in length and width: 2.0 nm wide, 0.34 nm per base pair, 10.5 base pairs (3.6 nm) per turn, right-handed. Spheres and rods are symbols, not atoms. 39 base pairs, an invented sequence.',
    rep: 'Schematic of replication. Each new double helix keeps one old strand (tan) and gets one new strand (blue). In a cell, helicase opens the fork and DNA polymerase builds each new strand. The lagging strand is made in short pieces (drawn here as one). Not a real simulation.',
    fiber: 'Schematic at true size: 4 nucleosomes of the beaded 10 nm form of chromatin. Each wraps 147 base pairs (1.65 turns) round 8 histone proteins and is about 11 nm across; DNA is 2 nm thick. Histone shapes are simplified. Inside a living nucleus the next level of folding is irregular, not a neat 30 nm fibre.',
  };
  sceneNote(c, NOTE.helix);
  c.update = (dt) => {
    if (Math.abs(unzip - target) > .001) {
      unzip += Math.sign(target - unzip) * Math.min(Math.abs(target - unzip), dt / 6);
      layout(unzip);
      if (unzip >= .999 && !built) { built = true; fire('unzip'); showInfo('unzip'); }
      if (unzip < .5) built = false;
    }
    const open = unzip > .03;
    gA.forEach(o => { o.visible = !open; }); fork.visible = open && unzip < .995;
  };
  // ---- chromatin: beads on a string, at true size (nm), see NOTE.fiber
  const chrom = new THREE.Group(); chrom.visible = false; g.add(chrom);
  const HC = [0xf472b6, 0xfb923c, 0x60a5fa, 0x34d399], cores = [], dnaPts = [];
  const sup = (s, ctr, Q) => { const a = -s * TAU, rr = 4.4 * NM; return new V3(rr * Math.cos(a), (s - .825) * 2.4 * NM, rr * Math.sin(a)).applyQuaternion(Q).add(ctr); };   // 1.65 left-handed turns, 2.4 nm pitch, 4.4 nm radius
  const NUC = [[-19, 5, 0, .3, 0, .4], [-5, -6, 6, 1.4, .8, 0], [9, 5, -4, 2.2, 0, 1.1], [23, -4, 2, .6, 1.4, .2]];
  const prevExit = { p: null, t: null };
  NUC.forEach((d, k) => {
    const ctr = new V3(d[0], d[1], d[2]).multiplyScalar(NM), Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(d[3], d[4], d[5]));
    const core = new THREE.Group(); core.position.copy(ctr); core.quaternion.copy(Q); core.userData = { id: 'histone', priority: 1.2 };
    for (let j = 0; j < 8; j++) { const a = (j % 4) / 4 * TAU + (j < 4 ? 0 : .78), m = new THREE.Mesh(new THREE.SphereGeometry(1.65 * NM, 20, 14), smat(HC[j % 4], { roughness: .55, emissive: new THREE.Color(HC[j % 4]).multiplyScalar(.25) })); m.position.set(Math.cos(a) * 1.55 * NM, (j < 4 ? -1 : 1) * 1.5 * NM, Math.sin(a) * 1.55 * NM); core.add(m); }
    chrom.add(core); c.pickables.push(core); cores.push(core);
    const s0 = sup(0, ctr, Q), s1 = sup(1.65, ctr, Q), t0 = sup(.02, ctr, Q).sub(s0).normalize(), t1 = s1.clone().sub(sup(1.63, ctr, Q)).normalize();
    if (k === 0) dnaPts.push(s0.clone().addScaledVector(t0, -9 * NM), s0.clone().addScaledVector(t0, -4 * NM));
    else { dnaPts.push(prevExit.p.clone().addScaledVector(prevExit.t, 4 * NM), s0.clone().addScaledVector(t0, -4 * NM)); }
    for (let i = 0; i <= 60; i++) dnaPts.push(sup(i / 60 * 1.65, ctr, Q));
    prevExit.p = s1; prevExit.t = t1;
    if (k === NUC.length - 1) dnaPts.push(s1.clone().addScaledVector(t1, 4 * NM), s1.clone().addScaledVector(t1, 9 * NM));
  });
  const fiber = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dnaPts), dnaPts.length * 2, 1 * NM, 10), smat(0x7dd3fc, { emissive: 0x0b3a52, roughness: .35 }));
  fiber.userData = { id: 'nucleosome' }; chrom.add(fiber); c.pickables.push(fiber);
  c.addLabel(cores[1], 'Histone core (8 proteins)', { offset: new V3(0, 5 * NM, 0) });
  const fAnchor = new THREE.Object3D(); fAnchor.position.copy(dnaPts[dnaPts.length - 12]); chrom.add(fAnchor); c.addLabel(fAnchor, 'DNA, 2 nm thick', { pick: fiber });
  const lAnchor = new THREE.Object3D(); lAnchor.position.copy(dnaPts[dnaPts.length - 70 * 1]); chrom.add(lAnchor);
  const bar2 = new THREE.Group(); chrom.add(bar2); bar2.position.set(-8 * NM, -15 * NM, 0);
  bar2.add(new THREE.Mesh(new THREE.BoxGeometry(10 * NM, .12, .12), barM)); [-1, 1].forEach(sd => { const t = new THREE.Mesh(new THREE.BoxGeometry(.12, .7, .12), barM); t.position.x = sd * 5 * NM; bar2.add(t); });
  c.addLabel(bar2, '10 nm', { offset: new V3(0, .3, 0), always: true });
  const view = k => {
    const f = k === 'fiber'; chrom.visible = f; tilt.visible = !f; bar.visible = !f; strip.style.display = f ? 'none' : ''; ub.style.display = f ? 'none' : '';
    sceneNote(c, f ? NOTE.fiber : (target ? NOTE.rep : NOTE.helix));
    if (f) showInfo('nucleosome');
    if (typeof flyTo === 'function' && c.frame) flyTo(c.frame, new V3(), f ? 6.5e-8 : 2.6e-8);
  };
  seg([['helix', 'Double helix'], ['fiber', 'Chromatin packing']], 'helix', view);
  c.focusIn = () => new V3();
  c.focusFor = () => ({ pos: bp[Math.floor(n / 2)].s[0].base.getWorldPosition(new V3()), r: .5 });
  c.zoomInTarget = () => ({ key: 'molecule', opts: { mol: 'H2O' } });
};

/* ================= LEVEL: CELL ================= */
function mitoTex() {
  return canvasTex('mito', 256, 128, (g, w, h) => {
    g.fillStyle = '#ff8a3d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b8461a'; g.lineWidth = 5;
    for (let x = 12; x < w; x += 20) { g.beginPath(); for (let y = 0; y <= h; y += 4) { const xx = x + Math.sin(y * .12 + x) * 4; y ? g.lineTo(xx, y) : g.moveTo(xx, y); } g.stroke(); }
  });
}
function chloroTex() {
  return canvasTex('chloro', 256, 128, (g, w, h) => {
    g.fillStyle = '#58b947'; g.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 70; i++) { const x = r() * w, y = 15 + r() * (h - 30); for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#1f6b23' : '#2e8a2f'; g.fillRect(x, y + k * 3, 14, 2.5); } }
  });
}
/* A rod-shaped bacterium (about 2 µm long) for the cell frame: builder units are 0.1 µm. */
function buildBacterium(c) {
  const bg = 0x07100c; c.scene.background = new THREE.Color(bg);
  const g = c.group, r = rng(31);
  g.add(new THREE.HemisphereLight(0xf2fff0, 0x112211, .7));
  const dl = new THREE.DirectionalLight(0xffffff, .95); dl.position.set(10, 14, 12); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0x99aaff, .35); dl2.position.set(-10, -6, -8); g.add(dl2);
  const cell = new THREE.Group(); g.add(cell);
  const L = 20, RO = 3.5, RI = 3.2, hl = L / 2 - RO;          // 2.0 µm long, 0.7 µm wide
  const capsule = (rad, half) => { const pts = []; for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI / 2; pts.push(new V3(Math.cos(a) * rad, -half + Math.sin(a) * rad, 0)); } for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push(new V3(Math.cos(a) * rad, half + Math.sin(a) * rad, 0)); } const geo = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(p.x, 0.0001), p.y)), 40); geo.rotateZ(Math.PI / 2); return geo; };
  const wall = new THREE.Mesh(capsule(RO, hl), new THREE.MeshStandardMaterial({ color: 0xb6e36f, transparent: true, opacity: .16, roughness: .5, depthWrite: false, side: THREE.DoubleSide }));
  wall.material.userData.noHL = true; wall.userData = { id: 'bacwall', priority: 0 }; cell.add(wall); c.pickables.push(wall);
  const mem = new THREE.Mesh(capsule(RI, hl), fresnelMat(0xff8fb1, 2.2, 1.0, { base: .05 })); mem.userData = { id: 'membrane', priority: .1 }; cell.add(mem); c.pickables.push(mem);
  const fill = new THREE.Mesh(capsule(RI - .05, hl), new THREE.MeshBasicMaterial({ color: 0x1d3a26, transparent: true, opacity: .4, side: THREE.BackSide, depthWrite: false })); fill.userData = { id: 'cytoplasm', priority: -1 }; cell.add(fill); c.pickables.push(fill);
  const inCell = (p, m) => { const q = Math.max(0, Math.abs(p.x) - hl); return Math.hypot(q, p.y, p.z) < RI - m; };
  // nucleoid: one long DNA thread folded into a tangle (thickened for visibility)
  const nucP = new V3(0, 0, 0); c.nucPos = nucP.clone(); c.cellPlant = false; c.cellKind = 'bacterium';
  const nuc = new THREE.Group(); nuc.userData = { id: 'nucleoid', priority: 1.5 }; cell.add(nuc); c.pickables.push(nuc);
  const pts = []; let p = new V3((r() - .5) * 4, (r() - .5) * 2, (r() - .5) * 2);
  for (let i = 0; i < 160; i++) { p = p.clone().add(new V3(gauss(r) * .9, gauss(r) * .6, gauss(r) * .6)); p.x *= .985; p.y *= .93; p.z *= .93; if (Math.abs(p.x) > 5.5) p.x *= .9; pts.push(p); }
  nuc.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 600, .13, 6, true), smat(0xd8b4fe, { emissive: 0x3b1a66, roughness: .5 })));
  const nucHalo = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0x6d28d9, transparent: true, opacity: .1, depthWrite: false })); nucHalo.scale.set(6, 2.3, 2.3); nuc.add(nucHalo);
  // 70S ribosomes, about 20 nm across: true size, so only visible up close
  const N = 2600, rib = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.1, 1), smat(0xe0e7ff, { emissive: 0x333366 }), N), m4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { let q; for (let t = 0; t < 60; t++) { q = new V3((r() - .5) * L, (r() - .5) * 2 * RI, (r() - .5) * 2 * RI); if (inCell(q, .4) && ((q.x / 6.2) ** 2 + (q.y / 2.6) ** 2 + (q.z / 2.6) ** 2 > 1)) break; } m4.makeTranslation(q.x, q.y, q.z); rib.setMatrixAt(i, m4); }
  rib.userData = { id: 'ribosome', priority: .8 }; cell.add(rib); c.pickables.push(rib);
  // flagellum: a thin helical filament from one end (about 20 nm thick)
  const fp = []; for (let i = 0; i <= 90; i++) { const x = L / 2 + i * .75, a = i * .26; fp.push(new V3(x, Math.sin(a) * Math.min(1, i / 8) * 1.2, Math.cos(a) * Math.min(1, i / 8) * 1.2)); }
  const fl = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fp), 240, .1, 6), smat(0xfde68a, { emissive: 0x2a2000, roughness: .5 })); fl.userData = { id: 'flagellum', priority: 1 }; cell.add(fl); c.pickables.push(fl);
  c.addLabel(wall, 'Cell wall', { offset: new V3(0, RO + 1.4, 0) });
  c.addLabel(mem, 'Cell membrane', { offset: new V3(3, -RO - 1.6, 0) });
  c.addLabel(nuc, 'Nucleoid: DNA, no nucleus', { offset: new V3(0, 3.4, 0) });
  const ra = new THREE.Object3D(); ra.position.set(-7.5, 0, 1); cell.add(ra); c.addLabel(ra, 'Ribosomes (70S)', { pick: rib });
  c.addLabel(fl, 'Flagellum', { offset: new V3(0, 1.4, 0) });
  c.update = (dt, t) => { };
  sceneNote(c, 'Schematic rod-shaped bacterium, drawn at true size: about 2 µm long and 0.7 µm wide. Ribosomes (about 20 nm) are true size, so they show only when you zoom in; the DNA thread is drawn about 10 times too thick, and the real cell holds far more ribosomes. Layers of the envelope are simplified.');
  c.focusIn = () => new V3(); c.focusFor = () => ({ pos: new V3(), r: RO });
  seg([['animal', 'Animal cell'], ['plant', 'Plant cell'], ['bacterium', 'Bacterium']], 'bacterium', k => { const F = c.frame; swapTo('cell', { type: k }); if (typeof flyTo === 'function') flyTo(F, new V3(), k === 'bacterium' ? 6e-6 : 4e-5); });
}
BUILD.cell = (c, opts) => {
  if (opts.type === 'bacterium') return buildBacterium(c);
  const plant = opts.type === 'plant'; c.opts.type = plant ? 'plant' : 'animal'; c.intro = plant ? 'cell_plant' : 'cell_animal'; c.cellKind = c.opts.type;
  const bg = plant ? 0x04100a : 0x0c0510;
  c.scene.background = new THREE.Color(bg); c.scene.fog = new THREE.Fog(bg, 50, 120);
  const g = c.group, r = rng(plant ? 21 : 12);
  g.add(new THREE.HemisphereLight(0xfff0f5, 0x221133, .65));
  const dl = new THREE.DirectionalLight(0xffffff, .95); dl.position.set(10, 14, 12); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0x99aaff, .35); dl2.position.set(-10, -6, -8); g.add(dl2);
  const cell = new THREE.Group(); g.add(cell);                    // the cell does not rotate: the nucleus anchor the DNA frame hangs from must stay put
  let inside;
  const PW = 36, PH = 20, PD = 20;                                 // plant cell box in builder units (0.833 µm each): 30 x 17 x 17 µm
  if (!plant) {
    const sc = new V3(1, .82, .92);
    const mem = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 48), fresnelMat(0xff8fb1, 2.4, 1.15, { base: .035 }));
    mem.scale.copy(sc); mem.userData = { id: 'membrane', priority: 0 }; cell.add(mem); c.pickables.push(mem);
    const fill = new THREE.Mesh(new THREE.SphereGeometry(11.9, 48, 32), new THREE.MeshBasicMaterial({ color: 0x3a1428, transparent: true, opacity: .35, side: THREE.BackSide, depthWrite: false }));
    fill.scale.copy(sc); fill.userData = { id: 'cytoplasm', priority: -1 }; cell.add(fill); c.pickables.push(fill);
    inside = (p, m) => (p.x / (12 * sc.x - m)) ** 2 + (p.y / (12 * sc.y - m)) ** 2 + (p.z / (12 * sc.z - m)) ** 2 < 1;
    c.addLabel(mem, 'Cell membrane', { offset: new V3(0, 10.4, 0) });
  } else {
    const W = PW, H = PH, D = PD;
    const wallG = new THREE.BoxGeometry(W, H, D);
    const wall = new THREE.Mesh(wallG, new THREE.MeshStandardMaterial({ color: 0x7cc46a, transparent: true, opacity: .09, depthWrite: false, side: THREE.DoubleSide }));
    wall.material.userData.noHL = true; wall.userData = { id: 'cellwall', priority: 0 }; cell.add(wall); c.pickables.push(wall);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(wallG), new THREE.LineBasicMaterial({ color: 0x9be37f, transparent: true, opacity: .8 })); cell.add(edges);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(W - .8, H - .8, D - .8), new THREE.MeshBasicMaterial({ color: 0x0f3a1c, transparent: true, opacity: .35, side: THREE.BackSide, depthWrite: false })); inner.userData = { id: 'cytoplasm', priority: -1 }; cell.add(inner); c.pickables.push(inner);
    inside = (p, m) => Math.abs(p.x) < W / 2 - m && Math.abs(p.y) < H / 2 - m && Math.abs(p.z) < D / 2 - m;
    c.addLabel(wall, 'Cell wall', { offset: new V3(0, H / 2 + .9, 0) });
  }
  // nucleus (animal: 5.7 µm across; plant: 5 µm)
  const nucPos = plant ? new V3(-11, 3, 3.5) : new V3(-1.5, .6, 0);
  const NR = plant ? 3.0 : 3.4;
  const nucleus = new THREE.Group(); nucleus.position.copy(nucPos); cell.add(nucleus); c.nucPos = nucPos.clone(); c.cellPlant = plant;
  const env = new THREE.Mesh(new THREE.SphereGeometry(NR, 48, 32), smat(0x8b5cf6, { transparent: true, opacity: .4, roughness: .6, depthWrite: false }));
  env.userData = { id: 'nucleus', priority: .5 }; env.add(new THREE.Mesh(new THREE.SphereGeometry(NR * 1.01, 48, 32), fresnelMat(0xc4b5fd, 2.4, .6)));
  nucleus.add(env); c.pickables.push(env);
  for (let i = 0; i < 46; i++) { const v = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(NR); const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), smat(0xddd6fe)); d.position.copy(v); env.add(d); }
  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(NR * .2, 32, 24), smat(0x4c1d95, { roughness: .7 })); nucleolus.position.set(NR * .25, NR * .12, NR * .1);
  nucleolus.userData = { id: 'nucleolus', priority: 2 }; nucleus.add(nucleolus); c.pickables.push(nucleolus);
  const chromG = new THREE.Group(); chromG.userData = { id: 'chromatin', priority: 1.5 }; nucleus.add(chromG); c.pickables.push(chromG);
  const chMat = smat(0xd8b4fe, { emissive: 0x2a1250, roughness: .5 });
  for (let k = 0; k < 9; k++) {
    let p = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(NR * .3); const pts = [];
    for (let s = 0; s < 26; s++) { p = p.clone().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.45)); if (p.length() > NR * .82) p.multiplyScalar(NR * .75 / p.length()); pts.push(p); }
    chromG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .07, 6), chMat));
  }
  c.addLabel(env, 'Nucleus', { offset: new V3(0, NR + .4, 0) });
  // ER: flattened sheets stacked round the nucleus (rough, dotted with ribosomes) plus a net of thin tubes (smooth)
  const erG = new THREE.Group(); erG.position.copy(nucPos); erG.userData = { id: 'er' }; cell.add(erG); c.pickables.push(erG);
  const erMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: .5, emissive: 0x05202c, transparent: true, opacity: .75, side: THREE.DoubleSide });
  const ribPts = [];
  const sheetN = plant ? 4 : 6;
  for (let k = 0; k < sheetN; k++) {
    const rad = NR + .5 + k * .5, th0 = .4 + r() * 1.6, thL = .7 + r() * .6, ph0 = r() * TAU, phL = 1.1 + r() * 1.1;
    const geo = new THREE.SphereGeometry(rad, 40, 20, ph0, phL, th0, thL), pa = geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const v = new V3().fromBufferAttribute(pa, i), w = 1 + .07 * Math.sin(v.x * 2.1 + v.y * 1.7 + k) * Math.cos(v.z * 1.9 + k * 2); v.multiplyScalar(w); pa.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); erG.add(new THREE.Mesh(geo, erMat));
    for (let j = 0; j < 30; j++) { const th = th0 + r() * thL, ph = ph0 + r() * phL, rr = rad * 1.02; ribPts.push(new V3(rr * Math.sin(th) * Math.cos(ph), rr * Math.cos(th), -rr * Math.sin(th) * Math.sin(ph)).add(nucPos)); }
  }
  for (let k = 0; k < (plant ? 6 : 10); k++) {
    const pts = []; let p = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(NR + 1.6 + r() * 2), d = new V3(gauss(r), gauss(r), gauss(r)).normalize();
    for (let s = 0; s < 8; s++) { pts.push(p.clone()); d.add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.7)).normalize(); p = p.clone().addScaledVector(d, 1.1); }
    erG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .1, 6), erMat));
  }
  const erAnchor = new THREE.Object3D(); erAnchor.position.copy(ribPts[10]).sub(nucPos); erG.add(erAnchor);
  c.addLabel(erAnchor, 'Endoplasmic reticulum', { pick: erG });
  // golgi: a stack of curved flattened sacs and a few vesicles
  const golgi = new THREE.Group(); golgi.position.copy(plant ? new V3(-10, -5, -4.5) : new V3(5.5, -2.8, 2.6)); golgi.rotation.set(.4, r() * TAU, .6);
  golgi.userData = { id: 'golgi' }; cell.add(golgi); c.pickables.push(golgi);
  const gMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: .45, emissive: 0x2a1a00, side: THREE.DoubleSide });
  for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(3.4 - k * .06, 32, 8, 0, TAU, 0, .42 - k * .02), gMat); m.position.y = k * .34 - 3.4; golgi.add(m); }
  for (let k = 0; k < 7; k++) { const v = new THREE.Mesh(new THREE.SphereGeometry(.11 + r() * .08, 12, 8), gMat); const a = r() * TAU, d = 1.4 + r() * .7; v.position.set(Math.cos(a) * d, r() * 1.6 - 1.7, Math.sin(a) * d); golgi.add(v); }
  c.addLabel(golgi, 'Golgi apparatus', { offset: new V3(0, 1.4, 0) });
  // placement helper
  const placed = [];
  function place(minGap, avoidFn) {
    for (let tries = 0; tries < 400; tries++) {
      const p = plant ? new V3((r() - .5) * PW, (r() - .5) * PH, (r() - .5) * PD) : new V3((r() - .5) * 22, (r() - .5) * 18, (r() - .5) * 20);
      if (!inside(p, 1.6)) continue;
      if (p.distanceTo(nucPos) < NR + 2.2) continue;
      if (p.distanceTo(golgi.position) < 3) continue;
      if (avoidFn && avoidFn(p)) continue;
      if (placed.some(q => q.distanceTo(p) < minGap)) continue;
      placed.push(p); return p;
    }
    return new V3((r() - .5) * 6, (r() - .5) * 6, (r() - .5) * 6);
  }
  let vac = null;
  if (plant) {
    // a central vacuole filling about 45% of the cell, squarish like the cell it sits in
    const vc = new V3(2.5, 0, 0), vs = new V3(15, 8, 8);
    const vg = new THREE.SphereGeometry(1, 48, 32), va = vg.attributes.position;
    for (let i = 0; i < va.count; i++) { const v = new V3().fromBufferAttribute(va, i), s = Math.pow(Math.pow(Math.abs(v.x), 4) + Math.pow(Math.abs(v.y), 4) + Math.pow(Math.abs(v.z), 4), .25) || 1; va.setXYZ(i, v.x / s, v.y / s, v.z / s); }
    vg.computeVertexNormals();
    vac = new THREE.Mesh(vg, smat(0x7dd3fc, { transparent: true, opacity: .26, depthWrite: false, roughness: .2 }));
    vac.position.copy(vc); vac.scale.copy(vs); vac.userData = { id: 'vacuole', priority: .6 };
    vac.add(new THREE.Mesh(vg, fresnelMat(0xbae6fd, 2.2, .7)));
    cell.add(vac); c.pickables.push(vac);
    c.addLabel(vac, 'Vacuole', { offset: new V3(0, 0, 0) });
    vac.userData.inVac = p => (Math.pow(Math.abs(p.x - vc.x) / (vs.x + 1.2), 4) + Math.pow(Math.abs(p.y - vc.y) / (vs.y + 1.2), 4) + Math.pow(Math.abs(p.z - vc.z) / (vs.z + 1.2), 4)) < 1;
  }
  const avoid = vac ? vac.userData.inVac : null;
  // mitochondria: about 2 µm long, a smooth outer membrane round a folded inner one (cristae)
  const mitos = [], mOut = new THREE.MeshStandardMaterial({ color: 0xff8a3d, transparent: true, opacity: .42, roughness: .5, emissive: 0x220a00, depthWrite: false, side: THREE.DoubleSide }), mIn = new THREE.MeshStandardMaterial({ color: 0xb8461a, roughness: .6, side: THREE.DoubleSide, emissive: 0x1a0800 });
  const mitoGeo = new THREE.SphereGeometry(1, 28, 16);
  for (let k = 0; k < (plant ? 5 : 9); k++) {
    const m = new THREE.Group(); const sh = new THREE.Mesh(mitoGeo, mOut); sh.scale.set(1.2, .5, .5); m.add(sh);
    for (let j = 0; j < 8; j++) { const x = -.9 + j * .26, rr = .5 * Math.sqrt(Math.max(.02, 1 - (x / 1.2) ** 2)) * .9; const cr = new THREE.Mesh(new THREE.CircleGeometry(rr, 18, (j % 2) * Math.PI, Math.PI * 1.45), mIn); cr.position.x = x; cr.rotation.y = Math.PI / 2; m.add(cr); }
    m.position.copy(place(3, avoid)); m.rotation.set(r() * 6, r() * 6, r() * 6); m.userData = { id: 'mito', ph: r() * 6 };
    cell.add(m); c.pickables.push(m); mitos.push(m);
  }
  c.addLabel(mitos[0], 'Mitochondrion', { offset: new V3(0, 1, 0) });
  // lysosomes / chloroplasts
  const chloros = [];
  if (!plant) {
    for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.25 + r() * .2, 20, 14), smat(0x84cc16, { roughness: .4, emissive: 0x0d1a00 })); m.position.copy(place(2)); m.userData = { id: 'lysosome' }; cell.add(m); c.pickables.push(m); if (k === 0) c.addLabel(m, 'Lysosome', { offset: new V3(0, .8, 0) }); }
  } else {
    const cMat = smat(0xffffff, { map: chloroTex(), roughness: .5, emissive: 0x041a04 });
    for (let k = 0; k < 14; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), cMat); m.scale.set(2.2, .8, 1.4);
      const p = place(3.4, avoid); m.position.copy(p); m.rotation.set(r() * 6, r() * 6, r() * 6); m.userData = { id: 'chloroplast', base: p.clone(), ph: r() * TAU };
      cell.add(m); c.pickables.push(m); chloros.push(m);
    }
    c.addLabel(chloros[0], 'Chloroplast', { offset: new V3(0, 1.2, 0) });
  }
  // ribosomes: true size (about 27 nm), so they only show up close; far fewer than the millions in a real cell
  const ribCount = ribPts.length + 700;
  const rib = new THREE.InstancedMesh(new THREE.SphereGeometry(.0165, 8, 6), smat(0xe0e7ff, { emissive: 0x222244 }), ribCount);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < ribCount; i++) {
    let p;
    if (i < ribPts.length) p = ribPts[i];
    else { for (let t = 0; t < 50; t++) { p = plant ? new V3((r() - .5) * PW, (r() - .5) * PH, (r() - .5) * PD) : new V3((r() - .5) * 24, (r() - .5) * 18, (r() - .5) * 20); if (inside(p, .8) && p.distanceTo(nucPos) > NR + .4 && !(avoid && avoid(p))) break; } }
    mtx.makeTranslation(p.x, p.y, p.z); rib.setMatrixAt(i, mtx);
  }
  rib.userData = { id: 'ribosome', priority: .8 }; cell.add(rib); c.pickables.push(rib);
  // a few ribosomes shown large enough to click: none. Instead the ribosome label points at a lone marker at true size (see the note).
  const ribA = new THREE.Object3D(); ribA.position.copy(ribPts[4]); cell.add(ribA); c.addLabel(ribA, 'Ribosomes (27 nm, tiny)', { pick: rib });
  // cytoskeleton
  const cl = [];
  for (let k = 0; k < 60; k++) { let a, b; for (let t = 0; t < 40; t++) { a = new V3((r() - .5) * 22, (r() - .5) * 17, (r() - .5) * 18); if (inside(a, 1)) break; } b = a.clone().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(4)); for (let t = 0; t < 8 && !inside(b, 1); t++) b.lerp(a, .5); if (!inside(a, 1)) continue; cl.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cl, 3));
  cell.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .1 })));
  c.update = (dt, t) => {
    mitos.forEach(m => { m.rotation.y += dt * .1; m.position.y += Math.sin(t + m.userData.ph) * dt * .08; });
    chloros.forEach(m => { const u = m.userData; m.position.set(u.base.x + Math.sin(t * .4 + u.ph) * .6, u.base.y + Math.sin(t * .3 + u.ph) * .3, u.base.z + Math.cos(t * .4 + u.ph) * .6); m.rotation.y += dt * .05; });
  };
  // membrane close-up: a patch of phospholipid bilayer with proteins, drawn at true size (the group is 1/1000 of a builder unit per unit)
  const patch = new THREE.Group(); patch.visible = false; g.add(patch); patch.scale.setScalar(.001);
  const NL = 22, SP = .92, half = (NL - 1) * SP / 2, YH = 2.35, prot = [new V3(2.2, 0, 1.4), new V3(-4.2, 0, -3.2)];
  const lip = []; for (let i = 0; i < NL; i++) for (let j = 0; j < NL; j++) { const x = i * SP - half + (j % 2) * .3, z = j * SP - half; if (prot.some(p => Math.hypot(p.x - x, p.z - z) < (p === prot[0] ? 1.9 : 2.2))) continue; lip.push([x, z]); }
  const headG = new THREE.InstancedMesh(new THREE.SphereGeometry(.42, 12, 10), smat(0xf59e0b, { roughness: .45, emissive: 0x2a1500 }), lip.length * 2);
  const tailG = new THREE.InstancedMesh(new THREE.CylinderGeometry(.1, .08, 2.3, 6), smat(0xfde68a, { roughness: .7 }), lip.length * 4);
  const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), rr = rng(8); let hi = 0, ti = 0;
  lip.forEach(([x, z]) => [1, -1].forEach(sd => {
    const yH = sd * YH + (rr() - .5) * .15; mm.makeTranslation(x, yH, z); headG.setMatrixAt(hi++, mm);
    [-.17, .17].forEach(o => { qq.setFromEuler(new THREE.Euler((rr() - .5) * .25, 0, (rr() - .5) * .25)); mm.compose(new V3(x + o, yH - sd * 1.15, z), qq, new V3(1, 1, 1)); tailG.setMatrixAt(ti++, mm); });
  }));
  headG.userData = { id: 'phospholipid' }; tailG.userData = { id: 'phospholipid' }; patch.add(headG); patch.add(tailG); c.pickables.push(headG, tailG);
  const chan = new THREE.Group(); chan.position.copy(prot[0]); chan.userData = { id: 'channel', priority: 2 };
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, m = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 6.2, 14), smat(0x8b5cf6, { roughness: .4, emissive: 0x1a0a33 })); m.position.set(Math.cos(a) * .95, 0, Math.sin(a) * .95); m.rotation.z = .12 * Math.cos(a); chan.add(m); }
  const ions = []; for (let k = 0; k < 4; k++) { const io = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 })); chan.add(io); ions.push(io); }
  patch.add(chan); c.pickables.push(chan);
  const gly = new THREE.Group(); gly.position.copy(prot[1]); gly.userData = { id: 'glycoprotein', priority: 2 };
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), smat(0x22c55e, { roughness: .6, flatShading: true })); blob.scale.set(1, 2.0, 1); gly.add(blob);
  const sugM = smat(0xf0abfc, { roughness: .5 }); let tip = new V3(0, 3.3, 0);
  for (let k = 0; k < 6; k++) { const sgm = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8), sugM); tip = tip.clone().add(new V3((rr() - .5) * .7, .6, (rr() - .5) * .7)); sgm.position.copy(tip); gly.add(sgm); if (k === 3) { const br = new THREE.Mesh(new THREE.SphereGeometry(.26, 12, 8), sugM); br.position.copy(tip).add(new V3(.6, .2, 0)); gly.add(br); } }
  patch.add(gly); c.pickables.push(gly);
  const aH = new THREE.Object3D(); aH.position.set(-half, YH, half); patch.add(aH); c.addLabel(aH, 'Water-loving heads', { pick: headG });
  const aT = new THREE.Object3D(); aT.position.set(-half, 0, half); patch.add(aT); c.addLabel(aT, 'Oily tails', { pick: tailG });
  c.addLabel(chan, 'Channel protein', { offset: new V3(0, 4e-3, 0) }); c.addLabel(gly, 'Glycoprotein (ID tag)', { offset: new V3(0, 8e-3, 0) });
  // 5 nm scale bar across the bilayer
  const nmU = 1 / (.001 * .8333);                              // patch units per nanometre... 1 unit = 0.833 nm
  const sb = new THREE.Group(); sb.position.set(half + 1.5, 0, half); patch.add(sb);
  const sbM = new THREE.MeshBasicMaterial({ color: 0xffffff }); sb.add(new THREE.Mesh(new THREE.BoxGeometry(.1, 5 / .8333, .1), sbM)); [-1, 1].forEach(sd => { const t = new THREE.Mesh(new THREE.BoxGeometry(.7, .1, .1), sbM); t.position.y = sd * 2.5 / .8333; sb.add(t); });
  c.addLabel(sb, '5 nm', { offset: new V3(2e-3, 0, 0), always: true }); void nmU;
  const upd0 = c.update;
  c.update = (dt, t) => { upd0(dt, t); ions.forEach((io, k) => { const y = ((t * 1.6 + k * 2.2) % 8.8) - 4.4; io.position.set(Math.sin(t * 3 + k) * .15, -y, Math.cos(t * 3 + k) * .15); io.visible = patch.visible; }); };
  c.focusIn = () => nucleus.getWorldPosition(new V3());
  c.focusFor = () => ({ pos: nucleus.getWorldPosition(new V3()), r: NR });
  const PRE = opts.note ? opts.note + ' ' : '';
  const NOTES = {
    animal: PRE + 'Schematic animal cell at true overall size (about 20 µm across; nucleus about 6 µm; mitochondria about 2 µm long). Shapes are simplified and counts are far too low (a real cell has hundreds to thousands of mitochondria and millions of ribosomes). Ribosomes are drawn at true size (27 nm), so they appear only close up.',
    plant: PRE + 'Schematic plant cell at true overall size (about 30 µm long). Shapes are simplified and counts are far too low (a real leaf cell has dozens of chloroplasts). Ribosomes are drawn at true size (27 nm), so they appear only close up. In a mature plant cell the vacuole fills most of it; here about 45%, to leave room to see the rest.',
    mem: 'Schematic patch of membrane at true size, about 17 nm across: the bilayer is about 4 to 5 nm thick and the lipid heads about 0.8 nm apart. Cholesterol, most proteins and the constant sideways motion of lipids are left out; the channel and sugar chain are simplified shapes, not real structures.',
  };
  sceneNote(c, NOTES[c.opts.type]);
  seg([['animal', 'Animal cell'], ['plant', 'Plant cell'], ['bacterium', 'Bacterium']], c.opts.type, k => { const F = c.frame; swapTo('cell', { type: k }); if (typeof flyTo === 'function') flyTo(F, new V3(), k === 'bacterium' ? 6e-6 : 4e-5); });
  seg([['cell', 'Whole cell'], ['mem', 'Membrane up close']], 'cell', k => {
    const m = k === 'mem'; c.patchOn = m; patch.visible = m; cell.visible = !m; sceneNote(c, m ? NOTES.mem : NOTES[c.opts.type]);
    if (typeof flyTo === 'function' && c.frame) flyTo(c.frame, new V3(), m ? 3.2e-8 : (plant ? 4.5e-5 : 4e-5));
    if (m) showInfo('phospholipid');
  });
};

/* ================= LEVEL: LIFE ================= */
function makeHuman() {
  const h = new THREE.Group();
  const skin = smat(0xc68863, { roughness: .6 }), shirt = smat(0x2f6fe4, { roughness: .7 }), pants = smat(0x26303f, { roughness: .8 }), shoe = smat(0x161616), hair = smat(0x2b1a10, { roughness: .9 });
  const add = (geo, mat, x, y, z, parent = h) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  [-1, 1].forEach(s => { add(new THREE.CylinderGeometry(.085, .075, .82, 12), pants, s * .11, .47, 0); add(new THREE.BoxGeometry(.13, .08, .26), shoe, s * .11, .04, .04); });
  add(new THREE.SphereGeometry(.19, 16, 12), pants, 0, .88, 0).scale.set(1.05, .55, .8);
  add(new THREE.CylinderGeometry(.2, .17, .6, 16), shirt, 0, 1.17, 0).scale.z = .75;
  add(new THREE.SphereGeometry(.2, 16, 12), shirt, 0, 1.45, 0).scale.set(1.25, .45, .75);
  add(new THREE.CylinderGeometry(.055, .06, .1, 10), skin, 0, 1.53, 0);
  add(new THREE.SphereGeometry(.13, 24, 18), skin, 0, 1.69, 0).scale.y = 1.12;
  add(new THREE.SphereGeometry(.137, 24, 12, 0, TAU, 0, Math.PI * .55), hair, 0, 1.71, -.008);
  [-1, 1].forEach(s => add(new THREE.SphereGeometry(.016, 8, 6), smat(0x111111), s * .045, 1.71, .118));
  const arms = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * .26, 1.44, 0); piv.rotation.z = s * .12; h.add(piv);
    add(new THREE.CylinderGeometry(.06, .052, .32, 10), shirt, 0, -.16, 0, piv);
    const fore = new THREE.Group(); fore.position.y = -.32; piv.add(fore);
    add(new THREE.CylinderGeometry(.048, .042, .29, 10), skin, 0, -.145, 0, fore);
    add(new THREE.SphereGeometry(.055, 10, 8), skin, 0, -.31, 0, fore);
    return { piv, fore };
  });
  return { h, arms };
}
function makeTree(r, s = 1) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16, .28, 2.6, 8), smat(0x6b4a2b, { roughness: .95 })); trunk.position.y = 1.3; trunk.castShadow = true; t.add(trunk);
  const greens = [0x3f8f3a, 0x4d9e3f, 0x357a33, 0x5aa84a];
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + r() * .7, 1), smat(greens[i % 4], { roughness: .85, flatShading: true }));
    f.position.set((r() - .5) * 1.6, 3 + r() * 1.4, (r() - .5) * 1.6); f.castShadow = true; t.add(f);
  }
  t.scale.setScalar(s); return t;
}
BUILD.life = (c) => {
  const g = c.group, r = rng(77);
  c.scene.fog = new THREE.Fog(0xc9e2f7, 45, 170);
  const sunDir = new V3(30, 38, 18).normalize();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir.clone() }, uDay: { value: 1 } }, side: THREE.BackSide, depthWrite: false,
    vertexShader: LDV(`varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(`uniform vec3 uSun; uniform float uDay; varying vec3 vD; void main(){ float h=max(vD.y,0.); vec3 top=vec3(.2,.45,.86), hor=vec3(.79,.88,.97); vec3 c=mix(hor,top,pow(h,.5)); float s=max(dot(normalize(vD),uSun),0.); c+=vec3(1.,.92,.75)*pow(s,300.)*1.5+vec3(1.,.85,.6)*pow(s,10.)*.25; if(vD.y<0.) c=hor; c*=mix(vec3(.03,.04,.09),vec3(1.),uDay); gl_FragColor=vec4(c,1.); }`)
  }));
  sky.userData = { id: 'air', priority: -1 }; g.add(sky); c.pickables.push(sky);
  g.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a2a, .75));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.15); sun.position.copy(sunDir).multiplyScalar(40); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 100 }); sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0006;
  g.add(sun); g.add(sun.target);
  const sunHit = hitSphere(18, 'sunSky', 2); sunHit.position.copy(sunDir).multiplyScalar(330); g.add(sunHit); c.pickables.push(sunHit);
  const sg = glowSprite(0xfff6dd, 70, .9); sg.position.copy(sunHit.position); g.add(sg);
  c.setSun = d => { sky.material.uniforms.uSun.value.copy(d); sun.position.copy(d).multiplyScalar(40); sunHit.position.copy(d).multiplyScalar(330); sg.position.copy(sunHit.position); const day = smooth(-.12, .12, d.y); sun.intensity = 1.15 * day; sg.visible = d.y > -.05; c.scene.fog && c.scene.fog.color.setRGB(.79 * (.08 + .92 * day), .89 * (.08 + .92 * day), .97 * (.1 + .9 * day)); sky.material.uniforms.uDay.value = day; };
  // the ground: fine painted blades (one tile = 1 m), a slow colour variation in the vertices that the lawn tufts share (lawnTone), so that tufts and ground read as one surface
  const grassTex = canvasTex('grass', 512, 512, (gg, w, h) => {
    gg.fillStyle = '#4f8b34'; gg.fillRect(0, 0, w, h); const rr = rng(4);
    const cols = ['#3f7a2a', '#4f8a33', '#5d9a3e', '#6aa848', '#477f2d', '#7bb552', '#86a944', '#356d26'];
    for (let i = 0; i < 9000; i++) { const x = rr() * w, y = rr() * h, a = (rr() - .5) * 2.6 + 1.57, l = 5 + rr() * 11; gg.strokeStyle = cols[(rr() * cols.length) | 0]; gg.globalAlpha = .55 + rr() * .4; gg.lineWidth = .8 + rr() * 1.1; gg.beginPath(); gg.moveTo(x, y); gg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); gg.stroke(); }
    for (let i = 0; i < 400; i++) { gg.fillStyle = 'rgba(30,60,20,.25)'; gg.fillRect(rr() * w, rr() * h, 3 + rr() * 5, 3 + rr() * 5); }
    gg.globalAlpha = 1;
  }, { wrap: true });
  grassTex.repeat.set(340, 340); grassTex.anisotropy = 8;
  const gGeo = new THREE.RingGeometry(.01, 170, 96, 36), gp = gGeo.attributes.position, gcol = new Float32Array(gp.count * 3), tone = new THREE.Color();
  for (let i = 0; i < gp.count; i++) { lawnTone(gp.getX(i), -gp.getY(i), tone); gcol[i * 3] = tone.r; gcol[i * 3 + 1] = tone.g; gcol[i * 3 + 2] = tone.b; }
  gGeo.setAttribute('color', new THREE.BufferAttribute(gcol, 3));
  const ground = new THREE.Mesh(gGeo, smat(0xffffff, { map: grassTex, roughness: 1, vertexColors: true }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData = { id: 'ground', priority: 0 }; g.add(ground); c.pickables.push(ground);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + r(), d = 95 + r() * 35; const hl = new THREE.Mesh(new THREE.SphereGeometry(30 + r() * 25, 24, 12), smat(0x5b8f45, { roughness: 1 })); hl.position.set(Math.cos(a) * d, -18, Math.sin(a) * d); hl.scale.y = .6; g.add(hl); }
  // the lawn: mown perennial ryegrass in three tiers by distance from the camera (see makeLawn); the real plants are the data thing `grass`
  const gm = makeLawn(g, c, r); g.add(gm);
  // human
  const { h: human, arms } = makeHuman(); human.userData = { id: 'human' }; g.add(human); c.pickables.push(human);
  c.addLabel(human, 'You', { offset: new V3(0, 2.05, 0), cls: 'you' });
  // the dog is a thing built from data (data/things/dog), placed by data/things/index.json
  // trees: the English oaks are things built from data (data/things/oak, placed by data/things/index.json), not made here
  c.parts = { arms, human, sky, sun, sunHit, sg, ground, grass: gm };
  // pond: a data thing now (data/things/pond, placed by data/things/index.json). This tiny invisible marker keeps the old pick id `pond` (library, search, "Show where it is" for the pond topics) at the pond's position.
  const pond = new THREE.Mesh(new THREE.SphereGeometry(.01, 4, 3), new THREE.MeshBasicMaterial({ visible: false })); pond.position.set(5, .02, -4); pond.userData = { id: 'pond', node: 'park_pond' }; g.add(pond); c.pickables.push(pond);
  // the honey bee is a data thing now (data/things/bee, placed on a buttercup flower from data/things/index.json); its label and ruler stop come from its own data (label, label_m, ruler)
  // mushroom: now a data-driven thing (data/things/mushroom, FT.thing); this empty group keeps the old click id 'mushroom' as a place to fly to
  const mush = new THREE.Group(); mush.position.set(-3.4, .1, -1.6); mush.userData = { id: 'mushroom', node: 'park_mushroom' }; g.add(mush);
  // clouds
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const cg = new THREE.Group(); cg.userData = { id: 'cloud' };
    const cm = smat(0xffffff, { roughness: 1, emissive: 0x8a96a6 });
    for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + r() * 2, 2), cm); s.position.set((r() - .5) * 8, (r() - .3) * 2, (r() - .5) * 4); cg.add(s); }
    const a = r() * TAU, d = 40 + r() * 70; cg.position.set(Math.cos(a) * d, 26 + r() * 14, Math.sin(a) * d); g.add(cg); c.pickables.push(cg); clouds.push(cg);
  }
  // the three cartoon birds are gone: the European robin is a data thing now (data/things/robin, standing on the boulder; see data/things/index.json).
  // The old pick id `bird` stays as an alias: a tiny invisible target at the robin that "Bird" in search and the fly-to list use to find it (the robin's own parts take every real click).
  const birdAlias = new THREE.Group(); birdAlias.userData = { id: 'bird', node: 'robin', priority: 0 }; birdAlias.position.set(-4.3, .72, 3.2); g.add(birdAlias); c.pickables.push(birdAlias);
  // every clickable park object opens its own card (data/nodes/park_*.json); objects that have no card yet keep the old INFO text
  { const PN = { pond: 'park_pond', cloud: 'park_cloud', sunSky: 'park_sun', air: 'park_sky', ground: 'park_ground' };
    c.pickables.forEach(o => o.traverse(m => { const n = m.userData && PN[m.userData.id]; if (n) m.userData.node = n; })); }
  c.update = (dt, t) => {
    const wave = false;
    arms[1].piv.rotation.z = lerp(arms[1].piv.rotation.z, wave ? 2.7 : .12, dt * 5);
    arms[1].fore.rotation.z = wave ? Math.sin(t * 9) * .35 : lerp(arms[1].fore.rotation.z, 0, dt * 5);
    arms[0].piv.rotation.z = -.12 - Math.sin(t * 1.3) * .02;
    human.scale.y = 1 + Math.sin(t * 2) * .006;
    if (c.lawnUpdate) c.lawnUpdate(t);
    clouds.forEach((cg, i) => { cg.position.x += dt * .6; if (cg.position.x > 120) cg.position.x = -120; });
  };
  c.focusIn = () => new V3(0, 1.2, 0);
  c.focusFor = (k, o) => (o && o.type === 'plant') ? { pos: new V3(-13, 4.2, -9), r: 1.4 } : { pos: new V3(0, 1.2, 0), r: .45 };
  c.zoomInTarget = () => ({ key: 'cell', opts: { type: 'animal' } });
};


/* ================= THE LAWN (perennial ryegrass turf, three detail tiers) =================
   Tier 0 (camera within 2.2 m): tufts of real blade geometry (36 thin, blunt-cut, curved ribbons each, 144 triangles).
   Tier 1 (2.2 to 13 m): the same tufts as two crossed alpha-cut cards painted with blades (4 triangles each).
   Tier 2 (beyond, and from high above): the ground disc, painted with fine blades and tinted by the same slow colour variation (lawnTone) as the tufts.
   The instanced tufts follow the camera: only the sites near it are drawn, rebuilt when it has moved half a metre. Sway runs in the vertex shader.
   It is a stand-in for turf: a real lawn holds thousands of tillers per square metre; the tufts here are far sparser (see the card `grass_lawn`). */
function lawnTone(x, z, out) {   // a slow, shared colour variation: 0.88 to 1.1 of the base, a little warmer where it is lighter
  const n = (Math.sin(x * .11 + 1.3) * Math.sin(z * .09 + .4) + .6 * Math.sin(x * .31 + z * .23) + .4 * Math.sin(x * .05 - z * .07)) / 2;
  return out.setRGB(1 + .15 * n, 1 + .12 * n, 1 - .08 * n);
}
function makeLawn(g, c, r) {
  if (PKL.on) return PKL.lawn(g, c);   // the realistic look: photographed blades near the eye, no shells (below)
  const R0 = 2.2, MAXN = 520, SP = .27, SPN = .2, RAD = 24, m4 = new THREE.Matrix4();
  const plants = [[1.2, -2.6], [-6.4, .3], [.9, -3.6], [4.6, 5.6], [-2.4, 4.8], [7.5, -.6]];
  const holes = [[0, 0, .4], [-4.6, 3.4, 1.4], [9.5, 7.5, .8], [-3.4, -1.6, .3], [1.6, 1.2, .55], [-4.3, 3.2, .3]];   // the person, the boulders, the mushroom, the dog: no tufts through them
  const rr = rng(77), sites = [];
  for (let x = -RAD; x < RAD; x += SPN) for (let z = -RAD; z < RAD; z += SPN) {
    const px = x + (rr() - .5) * SPN * .95, pz = z + (rr() - .5) * SPN * .95, d2 = px * px + pz * pz, near = true;
    if (d2 > RAD * RAD || Math.hypot(px - 5, (pz + 4) * 1.25) < 3.4 || plants.some(q => Math.hypot(px - q[0], pz - q[1]) < .7) || holes.some(q => Math.hypot(px - q[0], pz - q[1]) < q[2])) continue;
    // thin out with distance so that the sites are about SPN apart within 3 m and about SP apart beyond
    if (!near && rr() > (SPN * SPN) / (SP * SP)) continue;
    sites.push(px, pz, rr() * 6.283, .8 + rr() * .5, rr());
  }
  const NS = sites.length / 5;
  // tier 0: a tuft of 36 curved, blunt-cut ribbons, darker at the base and paler (a little yellow) at the tip
  const pos = [], idx = [], colr = [], tr = rng(5);
  for (let b = 0; b < 36; b++) {
    const a = tr() * 6.283, rho = Math.sqrt(tr()) * .095, h = .022 + tr() * .03, lean = .2 + tr() * .8, w = .0009 + tr() * .0008, ca = Math.cos(a), sa = Math.sin(a), px = Math.cos(a + 1.57), pz = Math.sin(a + 1.57), yel = tr() < .3 ? .5 : .15;
    const o = pos.length / 3, tw = (tr() - .5) * .5;
    for (let k = 0; k <= 2; k++) { const t = k / 2, off = lean * h * t * t, y = h * t - .002;
      for (const sg of [-1, 1]) { pos.push(ca * rho + ca * off + px * (sg * w + tw * w * t), y, sa * rho + sa * off + pz * (sg * w + tw * w * t)); const m = .55 + .55 * t; colr.push(.34 * m + yel * t * .35, .56 * m + yel * t * .15, .2 * m); } }
    for (let k = 0; k < 2; k++) { const i = o + k * 2; idx.push(i, i + 1, i + 3, i, i + 3, i + 2); }
  }
  const geo0 = new THREE.BufferGeometry(); geo0.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo0.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); geo0.setIndex(idx); geo0.computeVertexNormals();
  // tier 1: shells. Ten thin rings of ground, one above another up to 4 cm, each drawn only where a strand of grass reaches that height (a per-pixel hash of the position on the ground):
  // a dense, even, short turf without any per-blade geometry. The rings follow the camera, thin out with distance and are gone beyond 13 m, where the painted ground takes over.
  const uT = { value: 0 }, uOff = { value: new THREE.Vector2() }, uCam = { value: new THREE.Vector2() }, SH = 10, SHH = .04;
  const TONE = `vec3 lawnTone(vec2 p){ float n = (sin(p.x*.11+1.3)*sin(p.y*.09+.4) + .6*sin(p.x*.31+p.y*.23) + .4*sin(p.x*.05-p.y*.07))/2.; return vec3(1.+.15*n, 1.+.12*n, 1.-.08*n); }
 float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`;
  const sway = m => { m.onBeforeCompile = sh => { sh.uniforms.uT = uT; sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float hh = clamp(position.y / .05, 0., 1.); vec2 ip = vec2(0.);\n #ifdef USE_INSTANCING\n ip = instanceMatrix[3].xz;\n #endif\n float ph = uT * 1.5 + ip.x * 1.7 + ip.y * 1.3;\n transformed.x += (sin(ph) * .0035 + sin(ph * 2.3 + ip.y) * .0012) * hh * hh;\n transformed.z += cos(ph * .9 + ip.x) * .003 * hh * hh;'); }; return m; };
  const mS = smat(0xffffff, { roughness: 1 });
  mS.onBeforeCompile = sh => {
    sh.uniforms.uT = uT; sh.uniforms.uOff = uOff; sh.uniforms.uCam = uCam;
    sh.vertexShader = 'uniform float uT; uniform vec2 uOff; varying vec2 vW; varying float vL;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
 vL = clamp(instanceMatrix[3].y / ${SHH.toFixed(3)}, 0., 1.);
 vW = position.xz + uOff;
 float ph = uT * 1.4 + vW.x * .9 + vW.y * .7;
 vW += vec2(sin(ph) * .0045 + sin(ph * 2.3 + vW.y) * .0015, cos(ph * .9 + vW.x) * .0035) * vL * vL;`);
    sh.fragmentShader = 'uniform vec2 uCam; varying vec2 vW; varying float vL;\n' + TONE + '\n' + sh.fragmentShader.replace('#include <map_fragment>', `
 float dist = length(vW - uCam), keep = 1. - smoothstep(3., 12., dist);   // fewer, lower strands farther away; none beyond 12 m
 if (vL > 0.001 && vL > keep * .95 + .05) discard;
 if (dist > 12.5 || length(vec2(vW.x - 5., (vW.y + 4.) * 1.25)) < 3.7) discard;   // none in the pond and its bank
 vec2 pc = vW * 240., ic = floor(pc), fc = fract(pc) - .5;
 float h1 = hsh(ic), h2 = hsh(ic + 17.3), h3 = hsh(ic + 41.7);
 float hgt = .45 + .55 * h1, rad = .46 * (1. - .75 * vL / hgt);
 vec2 o = (vec2(h2, h3) - .5) * .45;
 if (vL > hgt || length(fc - o) > rad) discard;
 vec3 base = vec3(.17, .36, .11), tip = mix(vec3(.38, .62, .2), vec3(.58, .62, .27), step(.78, h2));
 diffuseColor.rgb = mix(mix(base, tip, vL) * (.82 + .3 * h3), vec3(.33, .55, .2), smoothstep(5., 12., dist)) * lawnTone(vW);`);
  };
  const ringGeo = new THREE.RingGeometry(.15, 14, 64, 12); ringGeo.rotateX(-Math.PI / 2);
  const shells = new THREE.InstancedMesh(ringGeo, mS, SH); shells.frustumCulled = false;
  for (let i = 0; i < SH; i++) { m4.makeTranslation(0, .0008 + i * SHH / (SH - 1), 0); shells.setMatrixAt(i, m4); }
  const m0 = sway(smat(0xffffff, { roughness: .95, side: THREE.DoubleSide, vertexColors: true }));
  const t0 = new THREE.InstancedMesh(geo0, m0, MAXN), white = new THREE.Color(1, 1, 1);
  t0.setColorAt(0, white); t0.userData = { id: 'grass', node: 'grass_lawn', priority: .4 }; t0.count = 0; t0.frustumCulled = false;   // the colour buffer is made while count is still the maximum
  const grp = new THREE.Group(); grp.add(t0, shells); c.pickables.push(t0);
  const q = new THREE.Quaternion(), col = new THREE.Color(), pv = new V3(), sv = new V3(), up = new V3(0, 1, 0), tn = new THREE.Color();
  let lx = 1e9, lz = 1e9, lh = -1;
  c.lawn = { t0, shells, NS };
  c.lawnUpdate = (t) => {
    uT.value = t;
    const cpos = c.frame.C || c.camera.position, h = cpos.y; if (Math.abs(cpos.x - lx) < .5 && Math.abs(cpos.z - lz) < .5 && Math.abs(h - lh) < .4 && lh >= 0) return;
    lx = cpos.x; lz = cpos.z; lh = h; let n0 = 0;
    shells.position.set(Math.round(lx), 0, Math.round(lz)); uOff.value.set(shells.position.x, shells.position.z); uCam.value.set(lx, lz);
    const r0 = h < R0 ? Math.sqrt(R0 * R0 - h * h) : -1;
    if (r0 > 0) for (let i = 0; i < NS && n0 < MAXN; i++) {
      const x = sites[i * 5], z = sites[i * 5 + 1], d2 = (x - lx) * (x - lx) + (z - lz) * (z - lz), rn = sites[i * 5 + 4];
      if (d2 < r0 * r0) { lawnTone(x, z, tn); q.setFromAxisAngle(up, sites[i * 5 + 2]); sv.set(sites[i * 5 + 3], .75 + rn * .5, sites[i * 5 + 3]); m4.compose(pv.set(x, 0, z), q, sv); t0.setMatrixAt(n0, m4); t0.setColorAt(n0++, col.setRGB(tn.r * (.9 + rn * .15), tn.g * (.9 + rn * .15), tn.b * (.9 + rn * .1))); }
    }
    t0.count = n0; t0.instanceMatrix.needsUpdate = true; t0.instanceColor.needsUpdate = true;
  };
  grp.userData.lawn = true; return grp;
}

/* ================= THE PARK, ITS GROUND, SKY AND WATER, AND THE LANDSCAPES UNDER THE REALISTIC LOOK =================
   Only with ?look=2 (js/look.js; docs/DESIGN.md 3.6, 3.9, 3.12). With the flag off PKL.on is false, nothing below runs, and the park is drawn
   exactly as above. Everything here goes through the foundation: materials are kinds (LOOK.material), shader changes are LOOK.patch.
   - Ground. The lawn disc, its far ring and the hills are one turf material laid on in park coordinates: the turf texture (assets/look
     Grass004) at its true scale (1.4 m), read twice at two scales and turns and blended by a slow noise so that its repeat does not show;
     slow patches of drier and of lusher grass; bare earth round each oak's trunk and thinner grass in its shade (a mask drawn from where the
     oaks stand). The hills are heights on the lawn's own mesh, with a soft foot, in place of sphere caps that met the lawn at a crease.
   - Near the eye (within 5 m of the camera) the lawn is instanced blades with a photographed blade (ambientCG Foliage008), shrinking into
     the turf between 3.6 and 5 m so that the hand-over does not show; no hashed shells.
   - Sky: the foundation's computed sky with fair-weather clouds added in its shader from a noise texture (no geometry), lit by the Sun
     through the same air. They are a convention, not today's weather (the park's note says so).
   - Haze: fog from 120 m to about 1.3 km in the horizon's colour (the foundation's), thicker than real air so that the edge of the modelled
     ground is never seen (said in the note).
   - The pond: ripples from a normal map, the sky reflected by the environment, a depth colour from the absorption of pond water, a wet bank
     and pebbles at the water's edge.
   - Landscapes on other worlds: photographed ground at the measured albedo of each surface, and rocks that are not dodecahedra.
   Costs are in notes/realism/rollout/park_ground_sky_water.md (counted on the test machine; GPU time only expected). */
const PKL = (() => {
  const LK = typeof LOOK !== 'undefined' ? LOOK : null, on = !!(LK && LK.on && LK.part('pbr'));
  const K = { on }, pend = new Set();
  /* what this file asked for and is still loading (LOOK.ready does not see it: the foundation has no public way to add to its list) */
  Object.defineProperty(K, 'ready', { get: () => { const s = () => pend.size ? Promise.all([...pend]).then(s) : Promise.resolve(true); return s(); } });
  if (!on) return K;
  const TEX = LK.part('tex'), DIR = 'assets/look/', ld = new THREE.TextureLoader(), cache = {};
  const track = p => { pend.add(p); const d = () => pend.delete(p); p.then(d, d); return p; };
  function flat(c) { const cv = document.createElement('canvas'); cv.width = cv.height = 2; const x = cv.getContext('2d'); x.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; x.fillRect(0, 0, 2, 2); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
  /* a texture of assets/look, a flat stand-in until it arrives. detail: each channel scaled to a mean of one half (DESIGN 3.5: the surface keeps its own colour) */
  function tx(file, o = {}) {
    const key = file + (o.detail ? ':d' : ''); if (cache[key]) return cache[key];
    const t = cache[key] = flat(o.normal ? [128, 128, 255] : [128, 128, 128]);
    track(new Promise(res => ld.load(DIR + file, src => {
      let im = src.image;
      if (o.detail) { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
        const d = x.getImageData(0, 0, cv.width, cv.height), a = d.data, n = a.length / 4, m = [0, 0, 0]; for (let i = 0; i < a.length; i += 4) { m[0] += a[i]; m[1] += a[i + 1]; m[2] += a[i + 2]; }
        const k = m.map(v => 127.5 / Math.max(1, v / n)); for (let i = 0; i < a.length; i += 4) { a[i] = Math.min(255, a[i] * k[0]); a[i + 1] = Math.min(255, a[i + 1] * k[1]); a[i + 2] = Math.min(255, a[i + 2] * k[2]); }
        x.putImageData(d, 0, 0); im = cv; }
      t.image = im; t.needsUpdate = true; src.dispose(); res();
    }, undefined, () => { console.warn('park look: texture', file); res(); })));
    return t;
  }
  K.tx = tx;
  /* uniforms shared by every material below (one object each, so a change reaches all) */
  const U = { uParkC: { value: new V3() }, uT: { value: 0 }, uNz: { value: null }, uMask: { value: null }, uEarth: { value: null }, uEarthCol: { value: new THREE.Color(0x6a5a48) }, uSunUp: { value: 1 }, uSunVis: { value: 1 } };
  const nz = () => U.uNz.value || (U.uNz.value = TEX ? tx('cloud_noise_256.png') : flat([128, 128, 128]));
  const PARKC = `uniform vec3 uParkC;\nvarying vec3 lkPk;\nvarying vec3 lkPn;\n`;
  const PARKV = `\n\tlkPk = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz + uParkC;\n\tlkPn = normalize( mat3( modelMatrix ) * objectNormal );`;
  /* Slow patches of drier (yellower) and of lusher (darker) grass. The two coarse octaves (210 and 77 m) are gradient noise worked out in
     the shader, so they never repeat; only the finer one (29 m) is read from the noise texture, turned by an angle that does not divide a
     right angle and faded out with distance. (A texture read alone repeats on a square lattice, and from 300 m up that lattice was seen
     as a grid on the far ground.) Weaker on slopes, where large patches read as stains. dist: metres from the eye. */
  const MACRO = `vec2 pkH2( vec2 p ) { p = vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) ); return fract( sin( p ) * 43758.5453 ) * 2.0 - 1.0; }
float pkGN( vec2 p ) {   // gradient noise, about -0.7 to 0.7
	vec2 i = floor( p ), f = fract( p ), u = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 );
	float a = dot( pkH2( i ), f ), b = dot( pkH2( i + vec2( 1.0, 0.0 ) ), f - vec2( 1.0, 0.0 ) ), c = dot( pkH2( i + vec2( 0.0, 1.0 ) ), f - vec2( 0.0, 1.0 ) ), d = dot( pkH2( i + 1.0 ), f - 1.0 );
	return mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y );
}
vec3 pkMacro( vec2 p, float dist, float slope, out float lkW ) {
	float g1 = pkGN( mat2( 0.921, 0.389, -0.389, 0.921 ) * p / 210.0 + 0.37 ), g2 = pkGN( mat2( 0.565, -0.825, 0.825, 0.565 ) * p / 77.0 + 3.71 );
	float nr = 1.0 - smoothstep( 90.0, 320.0, dist ), t3 = ( texture2D( uNz, mat2( -0.208, 0.978, -0.978, -0.208 ) * p / 29.0 + 0.53 ).r - 0.53 ) * nr;
	lkW = smoothstep( -0.3, 0.3, g2 * 1.4 + t3 );
	float m = ( g1 * 0.7 + g2 * 0.4 + t3 * 0.45 ) * ( 1.0 - 0.6 * smoothstep( 0.06, 0.3, slope ) );
	float dry = smoothstep( 0.1, 0.42, m ), lush = smoothstep( -0.08, -0.4, m );
	float cl = ( texture2D( uNz, mat2( 0.788, -0.616, 0.616, 0.788 ) * p / 13.3 + 0.19 ).r - 0.53 ) * nr;   // tufts and clumps, near only
	return mix( vec3( 1.0 ), vec3( 1.12, 1.06, 0.84 ), dry ) * mix( 1.0, 0.88, lush ) * ( 1.0 + 0.18 * cl );
}
`;
  /* Haze (aerial perspective), in linear light before the tone curve: the ground fades into the sky's own colour at the horizon in the
     direction it is seen (five samples of the computed sky round the horizon, from toward the Sun to away from it), by the optical depth
     of a haze whose density falls off with height (scale height uHazeK.y). Thicker than on a clear day (visibility about 10 km, a hazy
     summer day), so that the edge of the modelled ground, 24 km out, is never seen; the note says so. */
  const HAZE = `uniform vec3 uHz0; uniform vec3 uHz1; uniform vec3 uHz2; uniform vec3 uHz3; uniform vec3 uHz4; uniform vec3 uSunAz; uniform vec3 uHazeK;
vec3 pkHaze( vec3 c, vec3 pp, vec3 eye ) {
	vec3 v = pp - eye; float d = length( v ), dh = pp.y - eye.y, H = uHazeK.y;
	float k = abs( dh ) > 0.5 ? H * ( exp( - max( eye.y, 0.0 ) / H ) - exp( - max( pp.y, 0.0 ) / H ) ) / dh : exp( - max( eye.y, 0.0 ) / H );
	float t = exp( - uHazeK.x * d * k );
	vec2 az = normalize( v.xz + vec2( 1e-5 ) ); float a = acos( clamp( dot( az, uSunAz.xy ), -1.0, 1.0 ) ) * 1.2732395;
	vec3 s = mix( uHz0, uHz1, clamp( a, 0.0, 1.0 ) ); s = mix( s, uHz2, clamp( a - 1.0, 0.0, 1.0 ) ); s = mix( s, uHz3, clamp( a - 2.0, 0.0, 1.0 ) ); s = mix( s, uHz4, clamp( a - 3.0, 0.0, 1.0 ) );
	return mix( s, c, mix( 1.0, t, uHazeK.z ) );
}
`;
  const HZ = { uHz0: { value: new V3() }, uHz1: { value: new V3() }, uHz2: { value: new V3() }, uHz3: { value: new V3() }, uHz4: { value: new V3() }, uSunAz: { value: new V3(1, 0, 0) }, uHazeK: { value: new V3(4e-4, 1200, 1) } };
  K.HZ = HZ;
  /* the haze's colours: the computed sky at the horizon at five angles from the Sun's azimuth (linear light, before exposure) */
  const _hd = new V3();
  function hazeStep(sun) {
    if (!sun || !LK.skyRGB) return; const a0 = Math.atan2(sun.z, sun.x); HZ.uSunAz.value.set(Math.cos(a0), Math.sin(a0), 0);
    ['uHz0', 'uHz1', 'uHz2', 'uHz3', 'uHz4'].forEach((k, i) => { const a = a0 + i * Math.PI / 4, c = LK.skyRGB(_hd.set(Math.cos(a), 0, Math.sin(a)), sun); HZ[k].value.set(c[0], c[1], c[2]); });
  }
  K.hazeStep = hazeStep;
  /* a material takes the haze in place of three.js's fog (which is one colour, mixed after the tone curve) */
  function hazeOn(m, key, wpos) {
    m.fog = false;
    LK.patch(m, key, sh => {
      Object.assign(sh.uniforms, HZ); sh.uniforms.uParkC = U.uParkC;
      if (!/uniform vec3 uParkC;/.test(sh.fragmentShader)) sh.fragmentShader = 'uniform vec3 uParkC;\n' + sh.fragmentShader;
      sh.fragmentShader = HAZE + sh.fragmentShader.replace('#include <tonemapping_fragment>', `gl_FragColor.rgb = pkHaze( gl_FragColor.rgb, ${wpos}, uParkC );\n\t#include <tonemapping_fragment>`);
    });
  }
  K.hazeOn = hazeOn;

  /* The foundation's light-through cues (LK_SSS, LK_THIN: js/look.js) raise the direct light's irradiance, and three.js uses the same
     irradiance for the Sun's specular highlight. Where a surface is seen edge-on and lit from the side or behind (N.L and N.V both near 0,
     at a silhouette) the GGX visibility term grows to 0.5 / 1e-6 and the highlight clips to a white rim: the pale fringe on leaves and crowns
     against the sky. Light that passes through a leaf is diffuse, so the highlight is given the ordinary irradiance (N.L times the light).
     A local fix for this file's materials; the same change belongs in the foundation (the report asks for it). */
  function specFix(sh) {
    const c = THREE.ShaderChunk.lights_physical_pars_fragment, a = 'vec3 irradiance = dotNL * directLight.color;', b = '( 1.0 - clearcoatDHR ) * irradiance * BRDF_Specular_GGX(';
    if (c.indexOf(a) < 0 || c.indexOf(b) < 0) return;
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', c.replace(a, a + '\n\tvec3 lkSpecI = irradiance;\n\t#ifndef PHYSICALLY_CORRECT_LIGHTS\n\t\tlkSpecI *= PI;\n\t#endif').replace(b, '( 1.0 - clearcoatDHR ) * lkSpecI * BRDF_Specular_GGX('));
  }
  K.specFix = specFix;

  /* ---------- 1. the ground: one turf material for the lawn, its far ring and the hills ---------- */
  K.TURF = 0x58773d;   // the lawn's colour (sRGB), mean of the turf: linear about (0.08, 0.17, 0.04), a mown temperate lawn in the visible band
  /* (its own samplers, not map and normalMap: the foundation's park dressing re-tints any material that shares the ground's map) */
  function turfMat() {
    const m = LK.material('turf', K.TURF);
    if (TEX) { const s = LK.texSet('lawn'); U.uTurf = { value: s.map }; U.uTurfN = { value: s.normalMap }; m.defines.PK_TEX = ''; U.uEarth.value = tx('brown_mud_color_512.jpg', { detail: true }); }
    else { U.uTurf = U.uTurfN = { value: flat([128, 128, 255]) }; U.uEarth.value = flat([128, 128, 128]); }
    nz(); if (!U.uMask.value) U.uMask.value = flat([0, 0, 0]);
    LK.patch(m, 'pkturf', sh => {
      for (const k of ['uParkC', 'uNz', 'uMask', 'uEarth', 'uEarthCol', 'uTurf', 'uTurfN', 'uSunUp', 'uSunVis']) sh.uniforms[k] = U[k]; Object.assign(sh.uniforms, CS);
      sh.vertexShader = PARKC + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + PARKV);
      sh.fragmentShader = PARKC + CS_DECL + 'uniform sampler2D uNz; uniform sampler2D uMask; uniform sampler2D uEarth; uniform vec3 uEarthCol; uniform sampler2D uTurf; uniform sampler2D uTurfN; uniform float uSunUp; uniform float uSunVis;\n' + MACRO + sh.fragmentShader
        .replace('#include <map_fragment>', `
	vec2 pk = lkPk.xz, pkB = mat2( 0.8, 0.6, -0.6, 0.8 ) * pk * 0.27 + vec2( 0.37, 0.71 ); float lkW, lkF = length( vViewPosition );
	vec3 lkMac = pkMacro( pk, lkF, 1.0 - clamp( normalize( lkPn ).y, 0.0, 1.0 ), lkW );
	#ifdef PK_TEX
		vec3 lkT = mix( mix( texture2D( uTurf, pk * 0.714 ).rgb, texture2D( uTurf, pkB ).rgb, lkW ) * 2.0, vec3( 1.0 ), smoothstep( 140.0, 420.0, lkF ) );   // far off, the photograph's grain is below a pixel: its mean
		vec3 lkE = texture2D( uEarth, pk * 0.77 ).rgb * 2.0;
	#else
		vec3 lkT = vec3( 1.0 ), lkE = vec3( 1.0 );
	#endif
	/* round an oak: worn earth by the trunk (red), the crown's shade (green). The edge of the worn ground is broken by noise at 2.4 m and
	   0.7 m; around it the grass thins (earth shows in the dark gaps of the turf); fallen leaves lie in the shade. */
	vec4 mk = texture2D( uMask, pk / 160.0 + 0.5 );
	float e1 = ( texture2D( uNz, mat2( 0.788, -0.616, 0.616, 0.788 ) * pk * 0.42 + 0.11 ).r - 0.53 ) * 6.0, e2 = ( texture2D( uNz, pk * 1.37 + 0.61 ).r - 0.53 ) * 6.0;   // about -1 to 1
	float edge = mk.r + e1 * 0.24 + e2 * 0.13, bare = smoothstep( 0.62, 0.95, edge );
	float thin = smoothstep( 0.08, 0.55, edge + mk.g * 0.15 ) * smoothstep( 0.02, 0.2, mk.r + mk.g * 0.3 ) * smoothstep( 1.1, 0.75, dot( lkT, vec3( 0.333 ) ) + e2 * 0.1 ) * 0.9;
	float litter = smoothstep( 0.58, 0.78, texture2D( uNz, pk * 2.3 + 0.27 ).b + e2 * 0.08 ) * smoothstep( 0.25, 0.7, mk.g ) * ( 0.35 + 0.65 * max( bare, thin ) );
	vec3 lkG = diffuseColor.rgb * lkT * lkMac * mix( 1.0, 0.84, mk.g ), lkEa = mix( uEarthCol * lkE, vec3( 0.5, 0.39, 0.24 ) * ( 0.9 + 0.15 * e2 ), litter * 0.75 );
	diffuseColor.rgb = mix( lkG, lkEa, clamp( max( bare, thin ), 0.0, 1.0 ) );`)
        .replace('#include <normal_fragment_maps>', `
	#ifdef PK_TEX
	{ vec3 nA = texture2D( uTurfN, pk * 0.714 ).xyz * 2.0 - 1.0, nB = texture2D( uTurfN, pkB ).xyz * 2.0 - 1.0; nB.xy = mat2( 0.8, -0.6, 0.6, 0.8 ) * nB.xy;
	  vec3 nm = mix( nA, nB, lkW ); nm.xy *= 0.85 * uSunUp * ( 1.0 - smoothstep( 6.0, 45.0, length( vViewPosition ) ) );   // flat when the Sun is at or under the horizon: a tilted normal must not catch light from below the ground
	  vec3 Np = normalize( lkPn ), Tp = normalize( vec3( 1.0, 0.0, 0.0 ) - Np * Np.x ), Bp = cross( Tp, Np );
	  normal = normalize( ( viewMatrix * vec4( normalize( Tp * nm.x + Bp * nm.y + Np * max( nm.z, 0.2 ) ), 0.0 ) ).xyz ); }
	#endif`)
        /* a Sun under the horizon lights no ground (the foundation still gives it a little light); and turf has no sheen at grazing
           angles: the blades hide the light reflected toward an eye that looks along the ground (it made a pale line along the hills' crests) */
        .replace('#include <aomap_fragment>', `{ float lkG = smoothstep( 0.0, 0.3, dot( normalize( geometryNormal ), normalize( vViewPosition ) ) );
	  float lkCs = pkCloudShade( lkPk.xz ); reflectedLight.directDiffuse *= uSunVis * lkCs; reflectedLight.directSpecular *= uSunVis * lkG * lkCs; reflectedLight.indirectSpecular *= lkG; }
	#include <aomap_fragment>`);
    });
    hazeOn(m, 'pkhaze', 'lkPk');
    return m;
  }
  K.turfMat = turfMat;
  /* the hills as heights of the ground itself: each of the old sphere caps (radius R, centre 18 m down, flattened to 0.6) becomes a bump of
     the same height with a soft foot; nothing rises within 48 m of the middle, where the things stand on level ground; beyond the park a
     gentle roll. Heights in metres, park coordinates. */
  let HILLS = [];
  function hgt(x, z) {
    const r = Math.hypot(x, z); if (r < 48) return 0; let h = 0;
    for (const q of HILLS) { const t = Math.hypot(x - q[0], z - q[1]) / q[3]; if (t < 1.8) h += q[2] * Math.exp(-3 * t * t); }
    // the hills are not one smooth arc: shoulders and hollows of 30 to 80 m across, up to about a metre and a half, where a hill stands
    h += h / (h + 3) * (1.2 * Math.sin(x * .071 + z * .043 + .7) * Math.sin(z * .083 - x * .031 + 2.1) + .55 * Math.sin(x * .19 - z * .13 + 1.3) * Math.sin(z * .17 + x * .07));
    h += smooth(160, 420, r) * (1 - smooth(1500, 4000, r)) * (3.2 * Math.sin(x * .0093 + 1.1) * Math.sin(z * .0071 + .4) + 1.6 * Math.sin(x * .021 - z * .017));
    // rolling parkland beyond the hills: swells 1 to 3 m high and 120 to 190 m across between 80 m and about 2 km, then ridges and valleys of 10 to 40 m
    // with wavelengths of 0.7 to 3 km from 1 km out to about 10 km, so that a view at eye height meets a ridge line (with the trees along it) and not one smooth arc.
    // Invented, not the real relief of south-east London (the park's note says so).
    h += smooth(80, 200, r) * (1 - smooth(1200, 2600, r)) * (2.3 * Math.sin(x * .034 + z * .021 + 1.2) * Math.sin(z * .039 - x * .017 + .3) + 1.1 * Math.sin(x * .0213 - z * .0187 + 2.2) * Math.sin(x * .0153 + z * .0261 + .5));
    { const rf = smooth(900, 2400, r) * (1 - smooth(9000, 15000, r)), u = x + 420 * Math.sin(z * .0011 + .4), v = z + 380 * Math.sin(x * .0013 + 1.1);
      h += rf * (21 * Math.sin(u * .0021 + .7) * Math.sin(v * .0017 + 1.9) + 9 * Math.sin(u * .0047 - v * .0039 + .6) * Math.sin(v * .0043 + u * .0031) + 12 * Math.max(0, Math.sin(u * .0011 + v * .0009 + 2.0))); }
    return h * smooth(48, 76, r);
  }
  K.hgt = hgt;
  function polar(r0, r1, nr, na, geo) {   // a ring of the ground, its radii spaced evenly (geo false) or growing (geo true)
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= nr; i++) { const f = i / nr, r = geo ? r0 * Math.pow(r1 / r0, f) : r0 + (r1 - r0) * f;
      for (let j = 0; j <= na; j++) { const a = j / na * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r; pos.push(x, hgt(x, z), z); uv.push(x, z); } }
    for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const A = i * (na + 1) + j, B = A + na + 1; idx.push(A, A + 1, B, B, A + 1, B + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
  }
  /* bare earth round the oaks' trunks (red) and the shade of their crowns (green), on a 160 m square round the middle (0.31 m a pixel) */
  const MASK = { cv: null, d: null, n: 512, key: '' };
  function maskDraw(F) {
    const oaks = (FR.things || []).filter(t => t.opts && t.opts.thing === 'oak' && t.pos), key = oaks.map(t => t.pos.x.toFixed(1) + t.pos.z.toFixed(1)).join() + (POND.ell ? POND.ell.map(v => v.toFixed(2)).join() : '');
    if (!oaks.length || key === MASK.key) return; MASK.key = key;
    const n = MASK.n, cv = MASK.cv || (MASK.cv = document.createElement('canvas')); cv.width = cv.height = n; const g = cv.getContext('2d', { willReadFrequently: true }), px = v => (v / 160 + .5) * n, rr = rng(31);
    g.fillStyle = '#000'; g.fillRect(0, 0, n, n); g.globalCompositeOperation = 'lighter';
    for (const t of oaks) {
      const x = px(t.pos.x), y = px(t.pos.z), k = n / 160, cr = Math.max(6, Math.min(16, t.radius || 12));   // the crown's radius (m)
      let gr = g.createRadialGradient(x, y, 0, x, y, cr * .72 * k); gr.addColorStop(0, 'rgba(0,150,0,1)'); gr.addColorStop(.55, 'rgba(0,110,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, cr * .72 * k, 0, TAU); g.fill();
      // wear round the trunk: strongest at its foot, fading over a few metres (the shader breaks it into patches of earth and thin grass)
      for (let i = 0; i < 4; i++) { const a = rr() * TAU, d = (i ? .5 + rr() * 1.2 : 0) * k, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, R = cr * (i ? .12 + rr() * .1 : .26) * k;
        gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, `rgba(${i ? 110 : 230},0,0,1)`); gr.addColorStop(.45, `rgba(${i ? 60 : 130},0,0,1)`); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); }
    }
    // round the pond: trodden, thinner grass beyond the bank's ragged edge, wider in some places than others
    if (POND.ell) { const [ox, oz, rx, rz, bw] = POND.ell, k = n / 160;
      for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + rr() * .2, e = bw * (1 + rr() * .12), cx = px(ox + Math.cos(a) * rx * e), cy = px(oz + Math.sin(a) * rz * e), R = (.5 + rr() * .9) * k, v = 50 + Math.floor(rr() * 70);
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, `rgba(${v},0,0,1)`); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); } }
    g.globalCompositeOperation = 'source-over'; MASK.d = g.getImageData(0, 0, n, n).data;
    const t = U.uMask.value && U.uMask.value.isCanvasTexture && U.uMask.value.image === cv ? U.uMask.value : new THREE.CanvasTexture(cv); t.flipY = false; t.needsUpdate = true; U.uMask.value = t;   // row j of the canvas is z, as in the shader
  }
  const maskAt = (x, z) => { if (!MASK.d) return [0, 0]; const n = MASK.n, i = Math.floor((x / 160 + .5) * n), j = Math.floor((z / 160 + .5) * n); if (i < 0 || j < 0 || i >= n || j >= n) return [0, 0]; const o = (j * n + i) * 4; return [MASK.d[o] / 255, MASK.d[o + 1] / 255]; };

  /* ---------- 2. the lawn near the eye: blades of a photographed blade, within 5 m of the camera ---------- */
  /* the blade atlas (ambientCG Foliage008, 512 px): seven blades lying across the image, base on the left; [x0, x1, y0, y1] in pixels of the straight ones */
  const STRIPS = [[25, 494, 32, 70], [22, 493, 251, 294], [41, 468, 321, 362], [15, 496, 380, 410], [55, 474, 460, 487]];
  const BLADE_MEAN = [.326, .408, .156];   // the atlas's mean blade colour (sRGB): the blades are drawn in the lawn's colour, the atlas gives their variation
  K.lawn = (g, c) => {
    const S = .13, RMAX = 5.2, MAXN = 5200, NB = 7, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new V3(), sv = new V3(), up = new V3(0, 1, 0);
    const plants = [[1.2, -2.6], [-6.4, .3], [.9, -3.6], [4.6, 5.6], [-2.4, 4.8], [7.5, -.6]];
    const holes = [[0, 0, .4], [-4.6, 3.4, 1.4], [9.5, 7.5, .8], [-3.4, -1.6, .3], [1.6, 1.2, .55], [-4.3, 3.2, .3], [-11, 13.3, .9]];   // the person, the boulders, the mushroom, the dog, the soil block
    // one tuft: NB blades, each a card of two segments bent outward, cut from one of the atlas's straight blades at the atlas's own proportions
    const pos = [], nor = [], uvs = [], col = [], idx = [], tr = rng(9);
    for (let b = 0; b < NB; b++) {
      const st = STRIPS[b % STRIPS.length], len = .045 + tr() * .045, w = len * (st[3] - st[2]) / (st[1] - st[0]) * 1.15, a = tr() * TAU, rho = Math.sqrt(tr()) * .05, lean = .15 + tr() * .55, ca = Math.cos(a), sa = Math.sin(a), tw = (tr() - .5) * 1.2;
      const o = pos.length / 3, bx = Math.cos(a + tw), bz = Math.sin(a + tw);
      for (let k = 0; k <= 2; k++) { const t = k / 2, y = len * (t - .5 * lean * t * t) * .92, off = lean * len * t * t * .8;
        for (const sg of [-1, 1]) { pos.push(ca * rho + ca * off + bx * sg * w / 2, y, sa * rho + sa * off + bz * sg * w / 2);
          const n = new V3(-bz, 0, bx).multiplyScalar(.35).add(new V3(0, .65, 0)).normalize(); nor.push(n.x, n.y, n.z);   // bent toward up: both faces are lit as the lawn is
          uvs.push((st[0] + (st[1] - st[0]) * t) / 512, 1 - (sg < 0 ? st[2] : st[3]) / 512);
          const l = .42 + .58 * Math.pow(t, .7); col.push(l, l, l); } }   // dark at the base, inside the turf
      for (let k = 0; k < 2; k++) { const i = o + k * 2; idx.push(i, i + 1, i + 3, i, i + 3, i + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    const tc = new THREE.Color(K.TURF), bc = new THREE.Color(tc.r / BLADE_MEAN[0] * 1.08, tc.g / BLADE_MEAN[1] * 1.12, tc.b / BLADE_MEAN[2] * .95);
    const ex = { vertexColors: true, alphaTest: .45 };
    if (TEX) { ex.map = tx('grass_blades_color_512.jpg'); ex.alphaMap = tx('grass_blades_opacity_512.jpg'); }
    const mat = LK.material('leaf', TEX ? bc : tc, { double: true, instanced: true, extra: ex }); if ('alphaToCoverage' in mat) mat.alphaToCoverage = true; nz();
    LK.patch(mat, 'pkblade', sh => {
      sh.uniforms.uT = U.uT; sh.uniforms.uParkC = U.uParkC; sh.uniforms.uNz = U.uNz; sh.uniforms.uSunVis = U.uSunVis;
      sh.vertexShader = 'uniform float uT; uniform vec3 uParkC; varying vec2 lkPI;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	vec3 ip = instanceMatrix[ 3 ].xyz; lkPI = ip.xz;
	float hh = clamp( position.y / 0.08, 0.0, 1.0 ), ph = uT * 1.5 + ip.x * 1.7 + ip.z * 1.3;
	transformed.y *= 1.0 - smoothstep( 3.6, 5.0, distance( ip, uParkC ) );   // the blades sink into the turf with distance: the hand-over to the ground is a fade, not an edge
	transformed.x += ( sin( ph ) * 0.004 + sin( ph * 2.3 + ip.z ) * 0.0014 ) * hh * hh;
	transformed.z += cos( ph * 0.9 + ip.x ) * 0.0035 * hh * hh;`);
      sh.fragmentShader = 'uniform sampler2D uNz; uniform float uSunVis; varying vec2 lkPI;\n' + MACRO + sh.fragmentShader
        .replace('#include <aomap_fragment>', 'reflectedLight.directDiffuse *= uSunVis; reflectedLight.directSpecular *= uSunVis;\n\t#include <aomap_fragment>')
        .replace('#include <normal_fragment_begin>', 'float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\n\tvec3 normal = normalize( vNormal );\n\tvec3 geometryNormal = normal;')   // both faces take the bent normal
        .replace('#include <color_fragment>', '#include <color_fragment>\n\t{ float lkW; diffuseColor.rgb *= pkMacro( lkPI, 0.0, 0.0, lkW ); }');
      specFix(sh);
    });
    const t0 = new THREE.InstancedMesh(geo, mat, MAXN); t0.count = 0; t0.frustumCulled = false; t0.userData = { id: 'grass', node: 'grass_lawn', priority: .4 };
    const grp = new THREE.Group(); grp.add(t0); c.pickables.push(t0);
    const shells = new THREE.Object3D(); shells.visible = false;   // the hashed shells are not drawn under this look (DRESS.park still sets receiveShadow on them)
    const hsh = (i, j, k) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    let lx = 1e9, lz = 1e9, lh = -1;
    c.lawn = { t0, shells, NS: 0 };
    c.lawnUpdate = t => {
      U.uT.value = t;
      const cp = c.frame.C || c.camera.position, h = cp.y - hgt(cp.x, cp.z);
      if (Math.abs(cp.x - lx) < .15 && Math.abs(cp.z - lz) < .15 && Math.abs(h - lh) < .15 && lh > -1) return;
      lx = cp.x; lz = cp.z; lh = h; let n = 0;
      const r = h < RMAX ? Math.sqrt(RMAX * RMAX - Math.max(0, h) * Math.max(0, h)) : -1;
      if (r > 0) {
        const i0 = Math.floor((lx - r) / S), i1 = Math.ceil((lx + r) / S), j0 = Math.floor((lz - r) / S), j1 = Math.ceil((lz + r) / S);
        for (let i = i0; i <= i1 && n < MAXN; i++) for (let j = j0; j <= j1 && n < MAXN; j++) {
          const x = (i + hsh(i, j, 1)) * S, z = (j + hsh(i, j, 2)) * S, d2 = (x - lx) * (x - lx) + (z - lz) * (z - lz); if (d2 > r * r) continue;
          if (Math.hypot(x - 5, (z + 4) * 1.25) < 3.6 || plants.some(p => Math.hypot(x - p[0], z - p[1]) < .6) || holes.some(p => Math.hypot(x - p[0], z - p[1]) < p[2])) continue;
          const mk = maskAt(x, z), keep = 1 - Math.min(1, mk[0] * 1.6) - mk[1] * .35; if (hsh(i, j, 3) > keep) continue;   // none on the bare earth round a trunk, fewer in the shade
          const s = .75 + hsh(i, j, 4) * .55; q.setFromAxisAngle(up, hsh(i, j, 5) * TAU); sv.set(s, s * (.85 + hsh(i, j, 6) * .35), s);
          m4.compose(pv.set(x, hgt(x, z), z), q, sv); t0.setMatrixAt(n++, m4);
        }
      }
      t0.count = n; t0.instanceMatrix.needsUpdate = true;
    };
    grp.userData.lawn = true; return grp;
  };

  /* ---------- 3. the sky: fair-weather clouds in the sky's own shader ---------- */
  /* Small fair-weather cumulus: one layer from 1.5 to 2.4 km up (three slices, so that a heap is wider at its base than its top), separate heaps a few hundred metres to about a kilometre across, from the noise's
     fractal channel at 5.2, 1.9 and 0.6 km, each read turned by an angle that does not divide a right angle (so the pattern does not repeat
     on a lattice), drifting with the app's clock at 6 m/s. About a sixth of the sky is covered. Light: the Sun's light through the same air
     as the sky (the sky's own extinction along the Sun's path), dimmed by the cloud that lies toward the Sun (a tap along its direction
     in each slice: the side away from the Sun is in shade), darker at the base than at the top, and thin edges brighter than a heap's
     thick middle; the sky's light fills the shade. They fade out below about 12 degrees, where a flat layer would smear into
     streaks and the real ones are lost in the haze. At night they are dark and hide the stars behind them. They are not today's clouds. */
  const CLOUDS = `
	float lkCa = 0.0;
	if ( dir.y > 0.0 ) {
		#define PKCL( p ) ( texture2D( uCloud, ( p ) / 5200.0 ).r * 0.6 + texture2D( uCloud, mat2( 0.788, -0.616, 0.616, 0.788 ) * ( p ) / 1900.0 + 0.31 ).r * 0.28 + texture2D( uCloud, mat2( -0.208, 0.978, -0.978, -0.208 ) * ( p ) / 610.0 + 0.67 ).r * 0.12 )
		vec2 sd = normalize( sun.xz + vec2( 1e-4 ) ); float acc = 0.0, lsum = 0.0, lkD = 1500.0 / ( dir.y + 0.02 );
		for ( int i = 0; i < 3; i ++ ) {   // three slices through the layer, 1.5 to 2.4 km up, nearest first: a heap is wider at its base than at its top
			float fi = float( i ), hh = 1500.0 + fi * 450.0, cov = uCloudCover + fi * 0.04;
			vec2 q = dir.xz * ( hh / ( dir.y + 0.02 ) ) + uCloudOff;
			float d0 = PKCL( q ), d1 = PKCL( q + sd * 220.0 );
			float a = smoothstep( cov, cov + 0.05, d0 ) * ( 1.0 - acc );
			lsum += a * ( 0.32 + 0.68 * exp( - max( d1 - cov, 0.0 ) * 14.0 ) ) * ( 0.5 + 0.25 * fi ) * ( 0.75 + 0.5 * exp( - max( d0 - cov, 0.0 ) * 8.0 ) );   // shade toward the Sun's far side, a darker base, thin edges brighter
			acc += a;
		}
		float zs = acos( max( 0.0, sun.y ) ), invS = 1.0 / ( cos( zs ) + 0.15 * pow( 93.885 - ( ( zs * 180.0 ) / lkPi ), -1.253 ) );
		vec3 FexS = exp( - ( betaR * 8.4E3 * invS + betaM * 1.25E3 * invS ) );
		float lit = lsum / max( acc, 1e-3 ) * ( 0.85 + 0.45 * pow( max( dot( dir, sun ), 0.0 ), 6.0 ) );
		vec3 cl = ( sunE / 1000.0 ) * FexS * uCloudSun * lit + col * 0.9;
		lkCa = acc * smoothstep( 0.012, 0.15, dir.y ) * exp( - lkD / 26000.0 );   // fading into the haze below about 12 degrees, where a flat layer's heaps would smear into streaks
		col = mix( col, cl, lkCa );
	}
	`;
  K.skyClouds = m => {
    if (!m || !m.uniforms || !m.uniforms.uGain || m.userData.pkClouds || !LK.SKY_FRAG || !LK.part('sky')) return false;
    m.userData.pkClouds = true;
    Object.assign(m.uniforms, { uCloud: { value: TEX ? tx('cloud_noise_256.png') : flat([0, 0, 0]) }, uCloudOff: { value: new THREE.Vector2() }, uCloudCover: { value: TEX ? .64 : 9 }, uCloudSun: { value: .8 } });
    const f = LK.SKY_FRAG.replace('uniform vec3 uSun;', 'uniform vec3 uSun; uniform sampler2D uCloud; uniform vec2 uCloudOff; uniform float uCloudCover; uniform float uCloudSun;')
      .replace('gl_FragColor = vec4( col,', CLOUDS + 'gl_FragColor = vec4( col,').replace('#include <tonemapping_fragment>', 'gl_FragColor.a = max( gl_FragColor.a, uOpacity * lkCa );\n  #include <tonemapping_fragment>');
    m.fragmentShader = LDF(f); m.needsUpdate = true; return true;
  };
  /* The clouds' shadows on the ground and the far trees: the same noise, scale, turned reads, drift and cover as the sky's lowest slice (1.5 km up),
     found where the Sun's ray from the ground meets that layer, so a cloud that is seen in the sky has its shadow where the Sun's light would
     have crossed it (with a soft edge, as a shadow from 1.5 km up has: the Sun is half a degree wide, and a cloud's edge is thin), and the
     shadows drift with the clouds. Under a thick cloud a quarter of the direct light is left (the cloud is not black). */
  const CS = { uCsTex: { value: null }, uCsOff: { value: new THREE.Vector2() }, uCsCover: { value: 9 }, uCsSun: { value: new V3(0, 1, 0) } };
  const CS_DECL = `uniform sampler2D uCsTex; uniform vec2 uCsOff; uniform float uCsCover; uniform vec3 uCsSun;
float pkCloudShade( vec2 p ) {
	if ( uCsSun.y < 0.06 ) return 1.0;
	vec2 q = p + uCsSun.xz / uCsSun.y * 1500.0 + uCsOff;
	float d0 = texture2D( uCsTex, q / 5200.0 ).r * 0.6 + texture2D( uCsTex, mat2( 0.788, -0.616, 0.616, 0.788 ) * q / 1900.0 + 0.31 ).r * 0.28 + texture2D( uCsTex, mat2( -0.208, 0.978, -0.978, -0.208 ) * q / 610.0 + 0.67 ).r * 0.12;
	return 1.0 - 0.75 * smoothstep( uCsCover - 0.03, uCsCover + 0.09, d0 ) * smoothstep( 0.06, 0.2, uCsSun.y );
}
`;
  /* the clouds are fixed to the ground, not to the eye: the layer's offset takes the eye's place in the park (uParkC), so that flying about does not carry the clouds along,
     and the shadows below (CS) fall where they are */
  const cloudStep = m => { if (!m || !m.userData.pkClouds || typeof simTime === 'undefined') return; const s = (simTime / 1000 * 6) % 12000, d = s * .35 % 12000, pc = U.uParkC.value;
    m.uniforms.uCloudOff.value.set(s + pc.x, d + pc.z);
    const ky = LK.key ? LK.key() : LK.sun(); CS.uCsTex.value = m.uniforms.uCloud.value; CS.uCsOff.value.set(s, d); CS.uCsCover.value = m.uniforms.uCloudCover.value; if (ky) CS.uCsSun.value.copy(ky.dir); };

  /* ---------- 4. the pond: ripples, the sky in it, its depth, a wet bank, pebbles ---------- */
  /* Absorption of the pond's water per metre (red, green, blue): (1.2, 0.6, 1.0). Pure water's is (0.32, 0.045, 0.029) (Hale and Querry 1973);
     a park pond is much darker and greener-brown from plankton and dissolved organic matter (Penn State Extension, water quality of ponds).
     The pond's figures are a starting value, not a measurement. Light crosses the depth twice (down, and up toward the eye). The deep water
     sends back almost nothing (about 1 percent): what is seen is the bed through the shallows and the sky reflected. */
  const POND = { pebbles: null, ell: null };
  /* The pond's reflection: the park scene drawn once into a cube (128 px a face) from the middle of the pond, just above the water, with the
     same exposure, tone curve and encoding as the screen (so no material needs a second program), and drawn again only when the pond is
     rebuilt, the Sun has moved about two degrees, or the things in view have changed (at most every four seconds). Six renders then, none in
     between: the bank, the oaks, the hills and the clouds are in the water without a planar reflection's second render of the park on
     every frame. Off at the low level and with lookoff=env (the sky's light alone, as before). Things the camera does not see at that
     moment (they are not in the park's scene) are missing from it, and the person is a scene of their own and is not reflected. */
  const PC = { rt: null, cam: null, u: { value: null }, on: { value: 0 }, key: '', t: 0, sun: new V3(), prev: new V3() };
  function pondCapture(F, sm, force) {
    if (LK.quality === 'low' || !LK.part('env') || typeof renderer === 'undefined' || !F || !F.scene) { PC.on.value = 0; return; }
    const now = performance.now(), su = LK.sun(), key = [...(F.scene.children || [])].filter(o => o.visible).length;
    if (su) { const moving = su.dir.angleTo(PC.prev) > 1e-4; PC.prev.copy(su.dir); if (moving) return; }   // wait for a frame in which the scene's lights already follow the new Sun
    const da = su ? su.dir.angleTo(PC.sun) : 0, sunMoved = da >= .2 || (da >= .035 && now - PC.t > 1000);   // the clock jumped or ran on: redraw at once (a frame drawn after an idle pause must not show the old light)
    if (!force && PC.u.value && !sunMoved && (key === PC.key || now - PC.t < 4000)) return;
    if (!PC.rt) { PC.rt = new THREE.WebGLCubeRenderTarget(128, { format: THREE.RGBAFormat, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, encoding: THREE.sRGBEncoding }); PC.cam = new THREE.CubeCamera(.05, 40000, PC.rt); PC.u.value = PC.rt.texture; }
    sm.geometry.computeBoundingBox(); const c = sm.geometry.boundingBox.getCenter(new V3()).applyMatrix4(sm.matrixWorld);
    PC.cam.position.set(c.x, c.y + .03, c.z); PC.cam.updateMatrixWorld(true);
    const vis = sm.visible, rt0 = renderer.getRenderTarget(), ex = renderer.toneMappingExposure, au = renderer.shadowMap.autoUpdate;
    const skm = F.v2 && F.v2.parts.sky && F.v2.parts.sky.material, bl = skm && skm.blending;   // the sky is see-through at night (the stars of the frames above show through it): in the cube there is nothing behind it, so it is drawn opaque there
    sm.visible = false; renderer.shadowMap.autoUpdate = false; renderer.toneMappingExposure = LK.exposureOf(F); if (skm) skm.blending = THREE.NoBlending;
    try { PC.cam.update(renderer, F.scene); } catch (e) { console.warn('park look: pond reflection', e && e.message); }
    if (skm) skm.blending = bl; renderer.setRenderTarget(rt0); renderer.toneMappingExposure = ex; renderer.shadowMap.autoUpdate = au; sm.visible = vis;
    PC.on.value = 1; PC.t = now; PC.key = key; if (su) PC.sun.copy(su.dir);
  }

  function pondDress(F) {
    const T = F.T, s = T && T.parts.surface, b = T && T.parts.bank, md = T && T.parts.mud; if (!s || !b || !md) return false;
    const sm = s.g.userData.main, bm = b.g.userData.main, mm = md.g.userData.main; if (!sm || !bm || !mm || !sm.geometry || !mm.geometry) return false;
    // the water's depth under each vertex of the surface, from the top of the mud below it (a 32 x 32 grid of the mud's highest points)
    const sp = sm.geometry.attributes.position, mp = mm.geometry.attributes.position; sm.geometry.computeBoundingBox(); const bb = sm.geometry.boundingBox, N = 32, top = new Float32Array(N * N).fill(-1e9);
    const cell = (x, z) => { const i = Math.min(N - 1, Math.max(0, Math.floor((x - bb.min.x) / (bb.max.x - bb.min.x + 1e-9) * N))), j = Math.min(N - 1, Math.max(0, Math.floor((z - bb.min.z) / (bb.max.z - bb.min.z + 1e-9) * N))); return j * N + i; };
    for (let i = 0; i < mp.count; i++) { const k = cell(mp.getX(i), mp.getZ(i)); if (mp.getY(i) > top[k]) top[k] = mp.getY(i); }
    const dep = new Float32Array(sp.count); for (let i = 0; i < sp.count; i++) { const t = top[cell(sp.getX(i), sp.getZ(i))]; dep[i] = t > -1e8 ? Math.max(0, sp.getY(i) - t) : .5; }
    if (!sm.geometry.attributes.lkDepth) sm.geometry.setAttribute('lkDepth', new THREE.BufferAttribute(dep, 1));
    T.group.updateMatrixWorld(true); const sc = new V3().setFromMatrixScale(sm.matrixWorld).x;
    const ex = (bb.max.x - bb.min.x) / 2, ez = (bb.max.z - bb.min.z) / 2, cx = (bb.max.x + bb.min.x) / 2, cz = (bb.max.z + bb.min.z) / 2;
    bm.geometry.computeBoundingBox(); const bb2 = bm.geometry.boundingBox, bw = Math.max(1.02, Math.min((bb2.max.x - bb2.min.x) / 2 / ex, (bb2.max.z - bb2.min.z) / 2 / ez));   // the bank's outer edge, in the water's radii
    const PU = { uParkC: U.uParkC, uRip: { value: TEX ? tx('pond_ripples_normal_512.jpg', { normal: true }) : flat([128, 128, 255]) }, uRipK: { value: TEX ? .32 : 0 }, uT: U.uT, uPS: { value: sc }, uBed: { value: new THREE.Color(md.pd.color || '#4a3c2d') }, uEll: { value: new THREE.Vector4(cx, cz, ex, ez) }, uBankW: { value: bw }, uNz: U.uNz, uCube: PC.u, uCubeOn: PC.on, uSunUp: U.uSunUp };
    { const o = new V3(cx, 0, cz).applyMatrix4(sm.matrixWorld).add(U.uParkC.value); POND.ell = [o.x, o.z, ex * sc, ez * sc, bw]; }   // where the pond is, in park coordinates (for the worn ground round it)
    const wm = sm.material; if (!wm.userData.pkWater) { wm.userData.pkWater = true; wm.envMapIntensity = 1;   // water reflects what the sky sends, no more (the kind's 1.5 brightened it)
    LK.patch(wm, 'pkwater', sh => {
      Object.assign(sh.uniforms, PU);
      sh.vertexShader = 'uniform vec3 uParkC; uniform float uPS; attribute float lkDepth; varying float lkD; varying vec3 lkPk;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tlkD = lkDepth * uPS; lkPk = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz + uParkC;');
      sh.fragmentShader = 'uniform vec3 uParkC; uniform sampler2D uRip; uniform float uRipK; uniform float uT; uniform vec3 uBed; uniform samplerCube uCube; uniform float uCubeOn; uniform float uSunUp; varying float lkD; varying vec3 lkPk;\n' + sh.fragmentShader
        /* what the water reflects: the park round it, drawn once into a cube from the middle of the pond (PC below), in place of the sky's
           light alone; at the Fresnel share of water (2 percent straight down, all of it at a grazing angle), bent by the ripples */
        .replace('#include <aomap_fragment>', 'reflectedLight.indirectSpecular *= 1.0 - uCubeOn;\n\t#include <aomap_fragment>')
        .replace('#include <encodings_fragment>', `{ vec3 V = normalize( vViewPosition ), R = ( vec4( reflect( - V, normal ), 0.0 ) * viewMatrix ).xyz;
	  if ( gl_FrontFacing ) {
	    R.y = abs( R.y ); float Fr = 0.02 + 0.98 * pow( 1.0 - clamp( dot( normal, V ), 0.0, 1.0 ), 5.0 );
	    gl_FragColor.rgb += pow( textureCube( uCube, R ).rgb, vec3( 2.2 ) ) * Fr * uCubeOn; }
	  else {
	    /* seen from under the water: the sky and the bank through a circular window about 97 degrees across (Snell's law, n = 1.33), squeezed
	       toward its rim; beyond it the surface is a mirror of the water and the bed (total internal reflection) */
	    float c = clamp( dot( normal, V ), 0.0, 1.0 ), sn = sqrt( 1.0 - c * c ) * 1.33;
	    vec3 body = vec3( 0.012, 0.03, 0.016 ), bedc = pow( uBed, vec3( 2.2 ) ) * 0.25;
	    vec3 mir = mix( body, bedc, 0.5 + 0.5 * uSunUp ), win = body;
	    if ( sn < 1.0 ) { vec3 T = ( vec4( refract( - V, normal, 1.33 ), 0.0 ) * viewMatrix ).xyz; win = pow( textureCube( uCube, T ).rgb, vec3( 2.2 ) ) * uCubeOn * 0.9 + body * ( 1.0 - uCubeOn ); }
	    float Fr = smoothstep( 0.78, 1.0, sn ) * 0.97 + 0.03;
	    gl_FragColor = vec4( mix( win, mir, Fr ), 1.0 ); } }
	#include <encodings_fragment>`)
        .replace('#include <map_fragment>', `#include <map_fragment>
	{ vec3 lkV = normalize( cameraPosition - ( lkPk - uParkC ) ); float mu = max( abs( lkV.y ), 0.2 );
	  vec3 Tw = exp( - vec3( 1.2, 0.6, 1.0 ) * lkD * ( 1.0 + 1.0 / mu ) );
	  vec3 bed = pow( uBed, vec3( 2.2 ) ) * 0.75, body = vec3( 0.005, 0.0095, 0.0055 );
	  diffuseColor.rgb = pow( bed * Tw + body * ( 1.0 - Tw ), vec3( 1.0 / 2.2 ) );
	  if ( diffuseColor.a > 0.85 ) diffuseColor.a = 1.0; }`)   // seen from above in its own colour, not with the lawn showing through
        .replace('#include <normal_fragment_maps>', `
	{ vec2 w = lkPk.xz;
	  vec3 n1 = texture2D( uRip, w * 0.55 + uT * vec2( 0.021, 0.013 ) ).xyz * 2.0 - 1.0, n2 = texture2D( uRip, w * 1.7 + uT * vec2( -0.017, 0.029 ) ).xyz * 2.0 - 1.0;
	  vec2 sl = ( n1.xy + n2.xy * 0.6 ) * uRipK * ( 1.0 - smoothstep( 4.0, 40.0, length( vViewPosition ) ) * 0.7 );
	  normal = normalize( ( viewMatrix * vec4( normalize( vec3( sl.x, 1.0, - sl.y ) ) * faceDirection, 0.0 ) ).xyz ); }`);
    });
    }
    // the bank: the mud's photographed surface, and wet (darker, glossy) within about 35 cm of the water's edge
    const bmat = bm.material;
    if (bmat && bmat.isMeshStandardMaterial && !bmat.userData.pkBank) {
      bmat.userData.pkBank = true;
      if (bmat.defines && bmat.defines.LK_TRI) { delete bmat.defines.LK_TRI; bmat.map = null; bmat.normalMap = null; }   // the bank's mud is drawn here (below), not also by the things' mud set laid on from three sides
      LK.patch(bmat, 'pkbank', sh => {
        Object.assign(sh.uniforms, { uParkC: U.uParkC, uEarth: { value: TEX ? tx('brown_mud_color_512.jpg', { detail: true }) : flat([128, 128, 128]) }, uMudN: { value: TEX ? tx('brown_mud_normal_gl_512.jpg', { normal: true }) : flat([128, 128, 255]) }, uEll: PU.uEll, uPS: PU.uPS, uBankW: PU.uBankW, uNz: U.uNz });
        sh.vertexShader = 'uniform vec3 uParkC; varying vec3 lkPk; varying vec3 lkLoc;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tlkLoc = transformed; lkPk = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz + uParkC;');
        sh.fragmentShader = 'uniform sampler2D uEarth; uniform sampler2D uMudN; uniform sampler2D uNz; uniform vec4 uEll; uniform float uPS; uniform float uBankW; varying vec3 lkPk; varying vec3 lkLoc;\n' + sh.fragmentShader
          .replace('#include <map_fragment>', `#include <map_fragment>
	float lkQ = length( ( lkLoc.xz - uEll.xy ) / uEll.zw ), lkE = ( lkQ - 1.0 ) * min( uEll.z, uEll.w ) * uPS;   // metres outside the water's edge
	{ float o = ( lkQ - 1.0 ) / ( uBankW - 1.0 ), n = ( texture2D( uNz, lkPk.xz * 0.23 + 0.17 ).r - 0.53 ) * 6.0 * 0.22 + ( texture2D( uNz, lkPk.xz * 0.9 + 0.6 ).r - 0.53 ) * 6.0 * 0.08;
	  if ( o > 0.55 + n ) discard; }   // the bank's outer edge is ragged and of uneven width: the grass (and the worn ground drawn into the lawn) takes over
	float lkWet = 1.0 - smoothstep( -0.05, 0.35 + ( texture2D( uEarth, lkPk.xz * 0.37 ).g - 0.5 ) * 0.3, lkE );
	diffuseColor.rgb *= texture2D( uEarth, lkPk.xz * 0.77 ).rgb * 2.0 * mix( 1.0, 0.55, lkWet );`)
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix( roughnessFactor, 0.3, lkWet );')
          .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	{ vec3 nm = texture2D( uMudN, lkPk.xz * 0.77 ).xyz * 2.0 - 1.0; nm.xy *= 0.8 * ( 1.0 - lkWet * 0.6 );
	  normal = normalize( ( viewMatrix * vec4( normalize( vec3( nm.x, max( nm.z, 0.2 ), - nm.y ) ), 0.0 ) ).xyz ); }`);
      });
    }
    // pebbles at the water's edge: rounded flint gravel, 1.5 to 4 cm, on the bank where it meets the water (a stand-in rock surface: DESIGN 3.2)
    if (!POND.pebbles || POND.pebbles.parent !== T.group) {
      const pg = new THREE.IcosahedronGeometry(1, 1), pa = pg.attributes.position, pr = rng(5);
      for (let i = 0; i < pa.count; i++) { const v = new V3().fromBufferAttribute(pa, i); v.y *= .55; v.multiplyScalar(.92 + .08 * Math.sin(v.x * 7 + v.z * 5)); pa.setXYZ(i, v.x, v.y, v.z); }
      pg.computeVertexNormals();
      const NP = 240, im = new THREE.InstancedMesh(pg, LK.material('rock', 0xffffff, { instanced: true }), NP), ray = new THREE.Raycaster(), M = new THREE.Matrix4(), qq = new THREE.Quaternion(), cc = new THREE.Color();
      bm.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(T.group.matrixWorld).invert(); let n = 0;
      const CL = Array.from({ length: 11 }, () => [pr() * TAU, .04 + pr() * .1]);   // gravel lies in drifts where the bank was trodden or washed, with bare mud between
      for (let k = 0; k < NP * 3 && n < NP; k++) {
        const c = CL[Math.floor(pr() * CL.length)], a = pr() < .12 ? pr() * TAU : c[0] + (pr() + pr() + pr() - 1.5) * c[1] * 1.6, e = .97 + Math.pow(pr(), 1.3) * .2, lx = cx + Math.cos(a) * ex * e, lz = cz + Math.sin(a) * ez * e;
        const o = new V3(lx, 2 / sc, lz).applyMatrix4(T.group.matrixWorld); ray.set(o, new V3(0, -1, 0)); const h = ray.intersectObject(bm, false)[0]; if (!h) continue;
        const p = h.point.applyMatrix4(inv), r = (.008 + Math.pow(pr(), 2.2) * .014) / sc; qq.setFromEuler(new THREE.Euler(pr() * .4, pr() * TAU, pr() * .4));
        M.compose(p.add(new V3(0, r * .2, 0)), qq, new V3(r * (1 + pr() * .4), r, r * (.8 + pr() * .4))); im.setMatrixAt(n, M);
        const g = .38 + pr() * .22, wet = e < 1.03 ? .7 : 1; im.setColorAt(n++, cc.setRGB(g * 1.04 * wet, g * wet, g * .9 * wet));   // grey-brown flint gravel; darker where wet
      }
      im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.userData.noPick = true; im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; T.group.add(im); POND.pebbles = im;   // (its geometry's bound is one pebble at the pond's middle, not the ring: the pond's own culling decides)
    }
    /* the edging stones: wet where the water reaches them (darker, a little glossy, a film of algae below the water line, a dark band a few
       centimetres above it where the stone draws water up), and muddy where they sit in the bank; the dry top keeps the stone's own colour */
    for (const id of ['stones', 'stones_slab']) { const sp = T.parts[id], stm = sp && sp.g.userData.main, mt = stm && stm.material; if (!mt || !mt.isMeshStandardMaterial || mt.userData.pkStone) continue; mt.userData.pkStone = true;
      LK.patch(mt, 'pkstone', sh => {
        Object.assign(sh.uniforms, { uParkC: U.uParkC, uNz: U.uNz });
        sh.vertexShader = 'uniform vec3 uParkC; varying vec3 lkPs;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tlkPs = ( modelMatrix * instanceMatrix * vec4( transformed, 1.0 ) ).xyz + uParkC;');
        sh.fragmentShader = 'uniform sampler2D uNz; varying vec3 lkPs;\nfloat lkWetS = 0.0;\n' + sh.fragmentShader
          .replace('#include <map_fragment>', `#include <map_fragment>
	{ float h = lkPs.y, nn = texture2D( uNz, lkPs.xz * 3.1 + lkPs.y * 1.7 ).g - 0.5, lw = 0.02;
	  float under = 1.0 - smoothstep( lw - 0.004, lw + 0.004, h + nn * 0.01 ), band = ( 1.0 - smoothstep( lw + 0.01, lw + 0.06 + nn * 0.03, h ) ) * 0.7;
	  float mud = ( 1.0 - smoothstep( 0.005, 0.04 + nn * 0.03, h ) ) * 0.8; lkWetS = max( under, band );
	  diffuseColor.rgb *= mix( 1.0, 0.5, band ) * mix( 1.0, 0.55, under );
	  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.3, 0.37, 0.18 ) * ( 0.5 + nn ), under * 0.55 );   // a green film of algae below the water line
	  diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.2, 0.15, 0.1 ) * ( 0.7 + 0.6 * nn ), mud );
	  /* the stone's own grain and its lichen: mottling at 7 cm and 2 cm, and pale grey-green crust on the dry parts above the damp band */
	  vec3 gp = lkPs * 14.0; float g1 = texture2D( uNz, gp.xz + gp.y * 0.7 ).r, g2 = texture2D( uNz, gp.xz * 3.3 + gp.y * 2.1 + 0.4 ).g, li = smoothstep( 0.6, 0.72, texture2D( uNz, lkPs.xz * 6.0 + lkPs.y * 4.0 + 0.2 ).b );
	  diffuseColor.rgb *= 0.55 + 1.1 * g1 * ( 0.7 + 0.6 * g2 ); diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.55, 0.58, 0.4 ) * ( 0.8 + 0.4 * g2 ), li * 0.45 * ( 1.0 - band ) * ( 1.0 - under ) ); }`)
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix( roughnessFactor, 0.32, lkWetS );');
      }); }
    /* the duckweed raft seen from a distance (a flat stand-in for 1,900 fronds of 3 mm): a speckle of fronds with gaps between them, a ragged
       edge and a dull yellow-green, not a flat green patch (at this size a pixel covers a few fronds) */
    { const dm = T.parts.duckweed_mat, mm = dm && dm.g.userData.main, mt = mm && mm.material;
      if (mt && mt.isMeshStandardMaterial && !mt.userData.pkMat) { mt.userData.pkMat = true;
        LK.patch(mt, 'pkmat', sh => {
          Object.assign(sh.uniforms, { uParkC: U.uParkC, uNz: U.uNz });
          sh.vertexShader = 'uniform vec3 uParkC; varying vec3 lkPm;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tlkPm = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz + uParkC;');
          sh.fragmentShader = 'uniform sampler2D uNz; varying vec3 lkPm;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	{ float a = texture2D( uNz, lkPm.xz * 38.0 ).r, b = texture2D( uNz, lkPm.xz * 9.0 + 0.3 ).g, c = texture2D( uNz, lkPm.xz * 2.4 + 0.7 ).b;
	  float v = ( a * 0.7 + b * 0.3 - 0.53 ) * 5.0;   // about -1 to 1: where the fronds are (low) and where there is open water between them
	  if ( v > 0.15 + ( c - 0.53 ) * 4.0 ) discard;
	  diffuseColor.rgb *= mix( 0.6, 1.2, a ) * mix( 0.8, 1.1, b ) * vec3( 1.05, 1.0, 0.8 ); }`);
        }); } }
    return true;
  }

  /* ---------- 4b. the far trees: woods, clumps, avenues and hedgerow trees of generic broadleaf trees beyond the park's own oaks ----------
     Greenwich Park and the land round it are full of trees; without them the ground beyond the oaks was a bare green plain and, from eye
     height, met the sky in one hard line. These are simple shapes in the proportions of the park's English oak (data/things/oak: 20 m tall,
     a crown about as wide as it is tall and from a quarter to nearly the full height, a short trunk that forks low into limbs): a broad
     crown of 10 overlapping clumps of foliage on three limbs and a flared trunk (the near set, within 430 m), and a cheaper crown of 3
     clumps beyond. The clumps are shaded as one crown (darker low down and inside, lighter on top), their edge is broken up by noise so
     that the sky shows through the rim as it does through real foliage.
     Hedgerows (a tree every 7 to 13 m) cross the land from 170 m out, longer ones beyond 1.2 km, and the same cheap tree stands in a few woods out to about 4.5 km, where
     it is only a few pixels wide: a dotted tree line in the haze. It is not a model of any real tree or wood (the park's note says so),
     and the real oaks, which are drawn out to 700 m, are the same colour and size. One click on one opens the card of a tree. */
  const RAW = c => new THREE.Color(c).toArray();   // (the app takes a hex colour as it is, for materials and vertex colours alike: the oak's leaves are #4f8a2e the same way)
  function treeGeo(full) {
    const pos = [], nor = [], col = [], r = rng(full ? 7 : 9), nv = new V3(), v = new V3();
    const leaf = RAW(0x4f8a2e), bark = RAW(0x6a6054);
    const ico = new THREE.IcosahedronGeometry(1, 0), ia = ico.attributes.position, GA = 2.39996;
    const NL = full ? 10 : 3, CY = .62, RX = .5, RY = .36;
    const lobes = [];
    for (let i = 0; i < NL; i++) {
      if (i === 0) { lobes.push([0, CY + .05, 0, .27]); continue; }
      const e = (i / NL) * 1.25 - .22, a = i * GA + r() * .5, ring = RX * Math.sqrt(Math.max(.1, 1 - e * e)) * (.72 + r() * .2);
      lobes.push([Math.cos(a) * ring, CY + RY * e * .92 + (r() - .5) * .05, Math.sin(a) * ring, (full ? .15 : .24) + r() * (full ? .08 : .08) + (e > .6 ? -.02 : .02)]);
    }
    if (!full) { lobes.length = 0; [[0, .66, 0, .32], [.24, .57, .06, .26], [-.22, .59, -.1, .27]].forEach(q => lobes.push(q)); }
    lobes.forEach((lb, li) => {
      const sd = li * 3.7 + (full ? 0 : 50), ry = .82;
      for (let i = 0; i < ia.count; i++) {
        v.fromBufferAttribute(ia, i).normalize();
        const k = 1 + .2 * Math.sin(v.x * 3.9 + sd) * Math.sin(v.y * 3.3 + sd * .7) * Math.sin(v.z * 4.2 + sd * 1.3) + .08 * Math.sin(v.x * 7.1 + v.z * 5.3 + sd);
        const px = lb[0] + v.x * lb[3] * k, py = lb[1] + v.y * lb[3] * k * ry, pz = lb[2] + v.z * lb[3] * k;
        // the normal: half the clump's own round, half the whole crown's, so that the crown reads as one shape with clumps in it, not as a heap of balls
        nv.set(px, (py - CY) / .8, pz).normalize(); const nx = v.x * .5 + nv.x * .5, ny = (v.y / ry) * .5 + nv.y * .5, nz = v.z * .5 + nv.z * .5, nl = Math.hypot(nx, ny, nz) || 1;
        const top = Math.min(1, Math.max(0, (py - .42) / .5)), inner = Math.min(1, Math.hypot(px, pz) / .4), sh = .5 + .55 * top * (.75 + .25 * inner) - .1 * (1 - inner);
        pos.push(px, py, pz); nor.push(nx / nl, ny / nl, nz / nl); col.push(leaf[0] * sh * .78, leaf[1] * sh * .78, leaf[2] * sh * .78);
      }
    });
    // the trunk: a flared bole that forks low into limbs reaching up into the crown (the near set); a bare bole beyond
    const tube = (pts, rr, sides, shade) => {
      for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < sides; j++) {
        const a0 = j / sides * TAU, a1 = (j + 1) / sides * TAU, p = pts[i], q = pts[i + 1], r0 = rr[i], r1 = rr[i + 1];
        const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz) || 1, ux = dx / L, uy = dy / L, uz = dz / L;   // axis; two perpendiculars:
        let bx = uy, by = -ux, bz = 0; if (Math.hypot(bx, by) < .01) { bx = 0; by = uz; bz = -uy; } const bl = Math.hypot(bx, by, bz); bx /= bl; by /= bl; bz /= bl;
        const cx = uy * bz - uz * by, cy = uz * bx - ux * bz, cz = ux * by - uy * bx;
        const at = (pp, rd, a) => [pp[0] + (bx * Math.cos(a) + cx * Math.sin(a)) * rd, pp[1] + (by * Math.cos(a) + cy * Math.sin(a)) * rd, pp[2] + (bz * Math.cos(a) + cz * Math.sin(a)) * rd, bx * Math.cos(a) + cx * Math.sin(a), by * Math.cos(a) + cy * Math.sin(a), bz * Math.cos(a) + cz * Math.sin(a)];
        const A = at(p, r0, a0), B = at(p, r0, a1), C = at(q, r1, a0), D = at(q, r1, a1);
        for (const w of [A, C, B, B, C, D]) { pos.push(w[0], w[1], w[2]); nor.push(w[3], w[4], w[5]); const g = shade * (.85 + .15 * (i / pts.length)); col.push(bark[0] * g, bark[1] * g, bark[2] * g); }
      }
    };
    if (full) {
      tube([[0, 0, 0], [0, .05, 0], [0, .17, 0], [0, .25, 0]], [.046, .033, .029, .026], 8, .8);
      [[.16, .48, .05], [-.12, .5, .13], [-.05, .5, -.16]].forEach((t, i) => { tube([[0, .2, 0], [t[0] * .45, .33 + i * .01, t[2] * .45], t], [.022, .015, .008], 5, .8); });
    } else tube([[0, 0, 0], [0, .24, 0]], [.04, .026], 5, .8);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeBoundingSphere(); ico.dispose(); return geo;
  }
  function farTrees(g, c) {
    nz();
    const treeMat = near => {
      const mat = LK.material('leaf', 0xffffff, { instanced: true, extra: { vertexColors: true } });
      LK.patch(mat, 'pkfartree', sh => {
        sh.uniforms.uParkC = U.uParkC; sh.uniforms.uNz = U.uNz; sh.uniforms.uSunVis = U.uSunVis; Object.assign(sh.uniforms, CS);
        sh.vertexShader = PARKC + 'varying vec3 lkTl; varying vec3 lkTn;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	lkPk = ( modelMatrix * instanceMatrix * vec4( transformed, 1.0 ) ).xyz + uParkC; lkPn = vec3( 0.0, 1.0, 0.0 );
	lkTl = ( instanceMatrix * vec4( transformed, 1.0 ) ).xyz - instanceMatrix[ 3 ].xyz * 0.63; lkTn = abs( normal );`);
        /* clumps of foliage: the noise's cell channel laid on from three sides in metres (bright clumps, dark gaps), stronger on the shaded
           side; the canopy shades its own reflection (a crown is not a smooth ball: no sheen at its edge); the rim of the crown is broken
           up (the sky shows through it) */
        sh.fragmentShader = PARKC + 'uniform sampler2D uNz; uniform float uSunVis; ' + CS_DECL + 'float lkTc = 0.5; varying vec3 lkTl; varying vec3 lkTn;\n' + sh.fragmentShader
          .replace('#include <color_fragment>', `#include <color_fragment>
	{ vec3 w = lkTn * lkTn; w /= w.x + w.y + w.z; vec3 p = lkTl * 0.42;
	  float cl = texture2D( uNz, p.yz ).b * w.x + texture2D( uNz, p.xz + 0.37 ).b * w.y + texture2D( uNz, p.xy + 0.71 ).b * w.z;
	  float lkFd = length( vViewPosition );
	  diffuseColor.rgb *= mix( 1.0, 0.45 + 1.05 * cl, 1.0 - smoothstep( 300.0, 900.0, lkFd ) );
	  lkTc = cl; }`)
          .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	{ float rim = 1.0 - abs( dot( normal, normalize( vViewPosition ) ) ), lf = length( vViewPosition );
	  if ( lf < 900.0 && vColor.g > vColor.r * 1.6 && rim > 0.5 + 0.42 * lkTc + 0.25 * ( 1.0 - smoothstep( 60.0, 600.0, lf ) ) ) discard; }`)
          .replace('#include <aomap_fragment>', `float lkSh = pkCloudShade( lkPk.xz );
	reflectedLight.indirectSpecular *= 0.2; reflectedLight.directSpecular *= 0.35 * uSunVis * lkSh; reflectedLight.directDiffuse *= uSunVis * lkSh;
	#include <aomap_fragment>`);
        specFix(sh);
      });
      hazeOn(mat, 'pkhaze', 'lkPk'); return mat;
    };
    const geoN = treeGeo(true), geoF = treeGeo(false);
    const wood = (x, z) => Math.sin(x * .0061 + 1.7) * Math.sin(z * .0053 + .3) + .7 * Math.sin(x * .0143 - z * .011 + 2.4) + .45 * Math.sin(x * .031 + z * .027);   // where the woods are
    const avenues = [[-.31, .95, 180], [.88, .47, -140], [.2, -.98, 260]];   // lines of trees: direction and offset from the middle (m)
    const rr = rng(41), near = [], far = [];
    const add = (arr, x, z, hgtT, wr) => { if (arr.length >= (arr === near ? 50 : 650)) return; arr.push([x, z, hgtT, wr, rr() * TAU, .78 + rr() * .4, rr(), rr(), rr()]); };
    // the near set and the middle: woods by a slow noise, trees along three avenues
    for (let k = 0; k < 30000 && near.length + far.length < 200; k++) {
      let x, z; const av = rr() < .12 ? avenues[Math.floor(rr() * avenues.length)] : null;
      if (av) { const t = (rr() - .5) * 1600; x = av[0] * t - av[1] * av[2] + (rr() - .5) * 3; z = av[1] * t + av[0] * av[2] + (rr() - .5) * 3; }
      else { const a = rr() * TAU, d = 140 + Math.pow(rr(), 1.4) * 1500; x = Math.cos(a) * d; z = Math.sin(a) * d; }
      const d = Math.hypot(x, z); if (d < 140 || d > 1650) continue;
      if (!av && wood(x, z) < .7 + (rr() - .5) * .6) continue;
      const H = 9 + rr() * 9 + Math.pow(rr(), 3) * 5;   // open-grown park oaks are 12 to 22 m here (the real one is 20)
      if (d < 430) { if (near.length < 50) add(near, x, z, H, H * (.85 + rr() * .25)); } else add(far, x, z, H, H * (.75 + rr() * .25));
    }
    // hedgerows: field edges with a tree every 7 to 13 m, 6 to 11 m tall, from 170 m out (the tall ones are the field trees of a hedge), and beyond 700 m a few longer ones
    const hedge = (cx, cz, th, ln, st, h0, h1, minD) => { for (let t = -ln / 2; t < ln / 2; t += st * (.75 + rr() * .5)) { const x = cx + Math.cos(th) * t + (rr() - .5) * 3, z = cz + Math.sin(th) * t + (rr() - .5) * 3, d = Math.hypot(x, z); if (d < minD) continue; const H = h0 + rr() * (h1 - h0) + (rr() < .08 ? 5 : 0); if (d < 330 && near.length < 50) add(near, x, z, H, H * (.9 + rr() * .2)); else add(far, x, z, H, H * (.85 + rr() * .3)); } };
    for (let h = 0; h < 12; h++) { const a = rr() * TAU, d = 220 + rr() * 1100; hedge(Math.cos(a) * d, Math.sin(a) * d, rr() * Math.PI, 160 + rr() * 380, 8 + rr() * 5, 6, 11, 175); }
    for (let h = 0; h < 14; h++) { const a = rr() * TAU, d = 1200 + Math.pow(rr(), .8) * 3300; hedge(Math.cos(a) * d, Math.sin(a) * d, rr() * Math.PI, 250 + rr() * 800, 14 + rr() * 16, 8, 14, 650); }
    for (let k = 0; k < 6000 && far.length < 650; k++) { const a = rr() * TAU, d = 1500 + rr() * 3200, x = Math.cos(a) * d, z = Math.sin(a) * d; if (wood(x * .6, z * .6) < 1.0 + (rr() - .5) * .5) continue; const H = 12 + rr() * 10; add(far, x, z, H, H * (.6 + rr() * .3)); }
    const mk = (geo, material, list) => {
      const im = new THREE.InstancedMesh(geo, material, Math.max(1, list.length)), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cc = new THREE.Color(), up = new V3(0, 1, 0);
      list.forEach((t, i) => { q.setFromAxisAngle(up, t[4]); m4.compose(new V3(t[0], hgt(t[0], t[1]) - .3, t[1]), q, new V3(t[3], t[2], t[3] * (.9 + t[8] * .2))); im.setMatrixAt(i, m4);
        const l = t[5]; im.setColorAt(i, cc.setRGB(l * (.92 + t[6] * .16), l, l * (.85 + t[7] * .2))); });   // trees differ a little in shade and hue
      im.count = list.length; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
      im.castShadow = true; im.receiveShadow = false; im.userData = { id: 'tree', priority: .3 }; im.matrixAutoUpdate = false; im.updateMatrix(); im.frustumCulled = false;
      g.add(im); c.pickables.push(im); return im;
    };
    K.farTrees = mk(geoN, treeMat(true), near); K.farTreesFar = mk(geoF, treeMat(false), far); K.farTreesFar.castShadow = false;   // (the Sun's shadow square does not reach them: the shadow pass would only draw them again)
  }

  /* ---------- 5. the park frame: hooks set up once, and its step ---------- */
  K.park = (F, c, g) => {
    const P = c.parts; U.uParkC.value = F.C || (F.C = new V3());
    // the hills become heights of the ground; the lawn disc and the far ring are rebuilt with them, out to 24 km so that the haze always hides the edge and the ground reaches the horizon
    HILLS = []; for (const h of g.children) if (h.isMesh && h.geometry.type === 'SphereGeometry' && h.position.y === -18) { const R = h.geometry.parameters.radius; HILLS.push([h.position.x, h.position.z, (R - 18) * .45, Math.sqrt(Math.max(1, R * R - 900)) * 1.7]); h.visible = false; }
    const tm = turfMat(); tm.userData.noHL = true;
    P.ground.geometry.dispose(); P.ground.geometry = polar(.01, 170, 60, 180, false); P.ground.rotation.set(0, 0, 0); P.ground.updateMatrix(); P.ground.material.dispose(); P.ground.material = tm;
    if (P.rim) { P.rim.geometry.dispose(); P.rim.geometry = polar(170, 24000, 64, 180, true); P.rim.rotation.set(0, 0, 0); P.rim.updateMatrix(); P.rim.material.dispose(); P.rim.material = tm; P.rim.receiveShadow = true; }
    farTrees(g, c);
    // haze: see HAZE (the ground and the far trees); the foundation sets the fog's colour each frame, its distances are set here just before drawing
    const fog = c.scene.fog, b0 = F.scene.onBeforeRender;
    // (three.js's fog, for everything but the ground, which takes the haze above: linear from the eye, as the haze is for its first few hundred metres)
    F.scene.onBeforeRender = function (r, s, camr) { if (fog) { fog.near = 0; fog.far = 1 / HZ.uHazeK.value.x; } if (b0) b0.call(this, r, s, camr); };
    // the clouds made of lumps are not drawn: the sky has its own (their groups stay as the place that search and the cloud card point to)
    g.children.forEach(o => { if (o.userData && o.userData.id === 'cloud') o.visible = false; });
    F.note = 'The sky is computed for the real Sun at this hour; its clouds are typical small fair-weather cumulus, not today\'s weather. Beyond the park the ground, its hills and ridges, and the trees (shaped like the park\'s oaks, in woods, rows and hedgerows) are generic and invented: the real park\'s setting (the Observatory on its hill, the Thames and the city to the north) is not drawn, and there are no roads or buildings. The clouds cast their shadows on the ground and drift with them. All of it fades into the haze of a hazy summer day (about 10 km of visibility), thicker than on a clear one. After sunset the light is the twilight sky, then the Moon at its real place, phase and brightness and the night sky\'s own faint glow; the picture is brightened as an eye adapts to the dark, far less than the light has fallen. London\'s own glow in the night sky is not drawn.';
    const up0 = F.update; let tMask = 0, tPond = 0;
    F.update = (dt, t) => {
      up0(dt, t);
      if (P.sky.visible && F.C) P.sky.position.y = F.C.y;   // the sky's dome round the eye, also above the ground: its horizon at the eye's level
      if (!P.sky.material.userData.pkClouds && P.sky.material.uniforms && P.sky.material.uniforms.uGain) K.skyClouds(P.sky.material);
      cloudStep(P.sky.material); if (P.sg) P.sg.visible = false;
      { const su = LK.sun(), ky = LK.key ? LK.key() : su; U.uSunUp.value = ky ? smooth(-.01, .08, ky.dir.y) : 1; if (su) hazeStep(su.dir); U.uSunVis.value = ky ? smooth(-.012, .012, ky.dir.y) : 1;   /* (the key light: the Moon at night) */ HZ.uHazeK.value.z = LK.part('sky') ? 1 : 0; }   // the sky draws the Sun's glare itself (its aureole): no sprite over it
      const now = performance.now();
      if (now - tMask > 2000) { tMask = now; maskDraw(F); }
      if (now - tPond > 1000) { tPond = now;   // the pond's parts can be rebuilt (a new level of detail, the thing built again): dress them again when they are
        const pf = (FR.things || []).find(f => f.opts && f.opts.thing === 'pond' && f.T), sp = pf && pf.T.parts.surface, sm = sp && sp.g.userData.main;
        let fresh = false; if (sm && sm.material && (!sm.material.userData.pkWater || !sm.geometry.attributes.lkDepth || !POND.pebbles || POND.pebbles.parent !== pf.T.group)) fresh = pondDress(pf);
        if (sm && sm.material && sm.material.userData.pkWater && drawn.includes(pf) && !pf._culled) pondCapture(F, sm, fresh); }
    };
  };

  /* ---------- 6. landscapes on the Earth and other worlds ---------- */
  /* The ground's albedo (the share of light it sends back, linear, red green blue), measured where known:
     the Moon's regolith about 0.12 (normal albedo, maria 0.07 to highlands 0.2: Lucey et al. 2006); Mars's bright dusty plains about 0.25
     in red and 0.06 in blue (Bond albedo 0.25, the colour from the Mars Pathfinder and Curiosity cameras); Europa's ice 0.67 (geometric);
     fresh snow 0.8; desert sand 0.35; bare rock 0.2; Venus's basalt 0.1. Grass and forest keep their old colours, as illustrations. */
  const ALB = { moonrock: [.125, .118, .108], mars: [.26, .12, .062], icemoon: [.62, .6, .56], ice: [.78, .8, .84], desert: [.42, .33, .2], rock: [.2, .19, .17], venus: [.11, .095, .08] };
  const RADIUS = { Moon: 1737.4e3, Mars: 3389.5e3, Mercury: 2439.7e3, Venus: 6051.8e3, Earth: 6371e3, Io: 1821.6e3, Europa: 1560.8e3, Ganymede: 2634.1e3, Callisto: 2410.3e3, Titan: 2574.7e3, Pluto: 1188.3e3 };
  const hexOf = c => new THREE.Color(Math.pow(c[0], 1 / 2.2), Math.pow(c[1], 1 / 2.2), Math.pow(c[2], 1 / 2.2)).getHex();   // the look raises a material's colour to 2.2: this colour gives the albedo
  /* The surface's grain: a photographed fine, dry, uncracked dirt (Poly Haven Park Dirt, 3 m across) with its colour taken away and the
     albedo put in its place: a stand-in for regolith and for Martian soil (no photograph of either is used). Two scales, turned, blended by
     gradient noise so that the repeat does not show; beyond about 100 m only its mean (the grain is below a pixel there and its repeat
     would alias into stripes). Slow brighter and darker ground over hundreds of metres (gradient noise, no lattice). On an airless body
     (pits: the Moon) small fresh craters, 0.2 to 3 m across, as bowls with a low rim in the light. No ripples (the Moon has no wind) and no
     cracks (no water). */
  function soilMat(alb, Cref, hole, pits) {
    const m = LK.material('soil', hexOf(alb)); m.vertexColors = false;
    const u = { uC: { value: Cref }, uG: { value: TEX ? tx('park_dirt_color_512.jpg', { detail: true }) : flat([128, 128, 128]) }, uGN: { value: TEX ? tx('park_dirt_normal_gl_512.jpg', { normal: true }) : flat([128, 128, 255]) }, uNz: { value: nz() }, uHole: { value: hole || 0 } };
    LK.patch(m, 'pksoil' + (hole ? 'h' : '') + (pits ? 'p' : ''), sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = 'uniform vec3 uC; varying vec3 lkW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tlkW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz + uC;');
      sh.fragmentShader = 'uniform sampler2D uG; uniform sampler2D uGN; uniform sampler2D uNz; uniform float uHole; varying vec3 lkW;\n' + MACRO + `
/* a crater in each cell of size S that has one (about a third): its bowl's slope (xy) and how far in it the point lies (z) */
vec3 pkPit( vec2 w, float S, float seed ) {
	vec2 c = floor( w / S ); vec2 h = pkH2( c + seed ) * 0.5 + 0.5, h2 = pkH2( c + seed + 17.0 ) * 0.5 + 0.5;
	if ( h2.x > 0.22 ) return vec3( 0.0 );
	float r = S * ( 0.08 + 0.24 * h2.y * h2.y ); vec2 o = ( c + 0.5 + ( h - 0.5 ) * 0.28 ) * S, d = w - o; float q = length( d ) / r;
	if ( q > 1.4 ) return vec3( 0.0 );
	float k = 0.08 + 0.2 * h.x * h.x;   // most are old and shallow, a few fresh and steeper
	float g = k * ( q < 1.0 ? smoothstep( 0.0, 0.7, q ) * ( 1.0 - smoothstep( 0.85, 1.0, q ) ) * 1.6 : - sin( ( q - 1.0 ) / 0.4 * 3.1416 ) * 0.7 );   // the bowl falls inward; the low rim falls outward
	return vec3( normalize( d + 1e-5 ) * g, 1.0 - smoothstep( 0.8, 1.0, q ) );
}
` + sh.fragmentShader
        .replace('#include <map_fragment>', `
	if ( max( abs( lkW.x ), abs( lkW.z ) ) < uHole ) discard;   // under the near ground (the two met 2 cm apart and fought in depth)
	vec2 w = lkW.xz, wA = w / 3.0, wB = mat2( 0.788, -0.616, 0.616, 0.788 ) * w / 7.9 + 0.41; float lkF = length( vViewPosition );
	float b = smoothstep( -0.25, 0.25, pkGN( w / 23.0 + 1.3 ) );
	float lum = dot( mix( texture2D( uG, wA ).rgb, texture2D( uG, wB ).rgb, b ), vec3( 0.3, 0.59, 0.11 ) ) * 2.0;
	lum = mix( lum, 1.0 + 0.1 * pkGN( mat2( 0.565, -0.825, 0.825, 0.565 ) * w / 5.3 + 2.9 ), smoothstep( 10.0, 55.0, lkF ) );   // beyond, blotches of a few metres that never repeat
	float mac = 1.0 + 0.2 * pkGN( mat2( 0.921, 0.389, -0.389, 0.921 ) * w / 160.0 + 0.7 ) + 0.1 * pkGN( w / 41.0 + 7.1 );   // darker and brighter ground over hundreds of metres
	diffuseColor.rgb *= clamp( lum, 0.0, 2.0 ) * mac;`)
        .replace('#include <normal_fragment_maps>', `
	{ vec3 nA = texture2D( uGN, wA ).xyz * 2.0 - 1.0, nB = texture2D( uGN, wB ).xyz * 2.0 - 1.0; nB.xy = mat2( 0.788, 0.616, -0.616, 0.788 ) * nB.xy;
	  vec3 nm = mix( nA, nB, b ); nm.xy *= 1.1 * ( 1.0 - smoothstep( 5.0, 30.0, lkF ) );
	  #ifdef PK_PITS
	  { vec3 p1 = pkPit( w, 2.6, 3.0 ), p2 = pkPit( mat2( 0.921, 0.389, -0.389, 0.921 ) * w, 9.0, 11.0 ); p2.xy = mat2( 0.921, -0.389, 0.389, 0.921 ) * p2.xy;
	    nm.xy -= p1.xy * ( 1.0 - smoothstep( 15.0, 60.0, lkF ) ) + p2.xy * ( 1.0 - smoothstep( 40.0, 160.0, lkF ) ); }   // the normal leans into a bowl, out from its rim
	  #endif
	  vec3 Np = normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz ), Tp = normalize( vec3( 1.0, 0.0, 0.0 ) - Np * Np.x ), Bp = cross( Tp, Np );
	  normal = normalize( ( viewMatrix * vec4( normalize( Tp * nm.x + Bp * nm.y + Np * max( nm.z, 0.2 ) ), 0.0 ) ).xyz ); }`);
    });
    if (pits) m.defines.PK_PITS = '';
    return m;
  }
  /* rocks: rounded, broken blocks (an icosahedron pushed about by noise), not dodecahedra */
  function rockGeo(seed) {
    const g = new THREE.IcosahedronGeometry(1, 2), a = g.attributes.position, r = rng(seed), k = [r() * 9, r() * 9, r() * 9], v = new V3();
    for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); const n = Math.sin(v.x * 2.3 + k[0]) * Math.sin(v.y * 2.9 + k[1]) * Math.sin(v.z * 2.1 + k[2]) * .22 + Math.sin(v.x * 6.1 + v.z * 5.3 + k[1]) * .05;
      v.multiplyScalar(1 + n); v.y = v.y < -.2 ? -.2 - (v.y + .2) * .15 : v.y * .7; a.setXYZ(i, v.x, v.y, v.z); }   // a flat underside sunk in the ground
    g.computeVertexNormals(); return g;
  }
  K.landscape = (F, o, B, L) => {
    const C = F.C || (F.C = new V3()), body = o.body || 'Earth', R = RADIUS[body], earth = body === 'Earth';
    /* the ground curves away at the body's own radius (the old terrain curved at the Earth's on every world): the Moon's horizon is 2.4 km from an eye 1.7 m up */
    const bend = R && !earth ? (1 / (2 * R) - 1 / 12742000) : 0;
    const alb = ALB[o.biome];
    for (const gm of [L.ground, L.near]) {
      if (!gm || B.water) continue;
      if (bend) { const pa = gm.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, pa.getY(i) - (x * x + z * z) * bend); } pa.needsUpdate = true; gm.geometry.computeVertexNormals(); gm.geometry.computeBoundingSphere(); }
      if (alb) { gm.material.dispose(); gm.material = soilMat(alb, C, gm === L.ground && L.near ? 59.5 : 0, !!B.craters); gm.receiveShadow = true; }
    }
    /* rocks: Mars's (in place of the dodecahedra) and a scatter of ejecta blocks on the Moon, which takes no click (it is the ground's) */
    const rocky = B.rocks || B.craters;
    if (rocky) {
      if (L.rocks) L.rocks.visible = false;
      const N = 700, ra = rng(o.biome.length * 7 + 1), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ca = new THREE.Color(), rc = (alb || [.2, .19, .17]).map(v => v * .9);
      const geos = [rockGeo(3), rockGeo(8), rockGeo(13)], per = Math.ceil(N / 3), groups = [];
      geos.forEach((g, gi) => {
        const im = new THREE.InstancedMesh(g, LK.material('rock', 0xffffff, { instanced: true }), per); let n = 0;
        for (let i = 0; i < per; i++) {
          const a = ra() * TAU, d = 1.5 + Math.pow(ra(), .7) * 260, s = .04 + Math.pow(ra(), 4) * (B.rocks ? 1.3 : .9), x = Math.cos(a) * d, z = Math.sin(a) * d;
          const y = -(x * x + z * z) * (1 / 12742000 + bend);
          q.setFromEuler(new THREE.Euler((ra() - .5) * .5, ra() * TAU, (ra() - .5) * .5)); m4.compose(new V3(x, y + s * .1, z), q, new V3(s * (.8 + ra() * .5), s * (.7 + ra() * .5), s * (.8 + ra() * .5))); im.setMatrixAt(n, m4);
          const v = .75 + ra() * .45; im.setColorAt(n++, ca.setRGB(Math.pow(rc[0] * v * 2, 1 / 2.2), Math.pow(rc[1] * v * 2, 1 / 2.2), Math.pow(rc[2] * v * 2, 1 / 2.2)));   // the rock texture's mean is one half
        }
        im.count = n; im.castShadow = im.receiveShadow = true; F.add(im); groups.push(im);
        if (B.rocks) { F.pick(im, 'rock', 2); im.userData.madeOf = 'rock'; }
      });
    }
    /* the Sun's shadow on a square round where the camera looks (rocks on the ground) */
    const sun = L.sun; sun.castShadow = true; const SH = sun.shadow; SH.mapSize.set(LK.quality === 'low' ? 1024 : 2048, LK.quality === 'low' ? 1024 : 2048); SH.bias = -.0004;
    /* another world's sky dome (Mars) */
    if (!earth && L.sky && L.sky.material.fragmentShader) {
      /* the dome that is seen and the light it gives come from one function: paler and brighter toward the horizon (a longer path through
         the dust), brighter toward the Sun (dust scatters forward), and blue round a low Sun (Curiosity's sunset images). */
      const MARSSKY = `vec3 lkMars( vec3 d, vec3 sn ) {
  float h = clamp( d.y, 0.0, 1.0 ), day = clamp( ( sn.y + 0.15 ) / 0.27, 0.0, 1.0 ); day = day * day * ( 3.0 - 2.0 * day );
  float s = clamp( dot( d, sn ), 0.0, 1.0 ), s2 = s * s, s8 = s2 * s2 * s2 * s2;
  vec3 c = mix( uHor, uTop, pow( h + 1e-6, 0.45 ) ) * ( 0.82 + 0.5 * s2 * s + 0.28 * pow( 1.0 - h, 4.0 ) );
  return ( c + vec3( 0.3, 0.42, 0.62 ) * s8 * 0.6 * ( 1.0 - smoothstep( 0.05, 0.4, sn.y ) ) ) * day;
}
`;
      const m = L.sky.material;
      m.fragmentShader = LDF(`uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHor; uniform float uOpacity; varying vec3 vD;
${MARSSKY}
void main(){ vec3 d = normalize( vD ), sn = normalize( uSun + vec3( 0.0, 1e-4, 0.0 ) ); float s = max( dot( d, sn ), 0.0 ), day = smoothstep( -0.15, 0.12, uSun.y );
  vec3 c = lkMars( d, sn ) + vec3( 1.0, 0.95, 0.85 ) * pow( s, 900.0 ) * 3.0 * step( -0.02, uSun.y ); c = max( c, vec3( 0.005, 0.008, 0.02 ) );
  gl_FragColor = vec4( c, uOpacity * clamp( day * 1.4 + 0.05, 0.0, 1.0 ) ); }`); m.needsUpdate = true;
      /* the light this sky gives (the environment) is drawn from a version of it that writes its colour in the target's encoding: the dome
         itself does not, the prefiltered target stores RGBE, its alpha of 1 was read as an exponent of 127, and every lit surface went black. The dust's sky gives about a third of the light on level ground at midday (optical
         depth about 0.5: Lemmon et al. 2015), and blue round a low Sun. */
      const e = new THREE.ShaderMaterial({ uniforms: { uSun: m.uniforms.uSun, uTop: m.uniforms.uTop, uHor: m.uniforms.uHor, uOpacity: { value: 1 } }, side: THREE.BackSide, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize( position ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
        fragmentShader: `uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHor; uniform float uOpacity; varying vec3 vD;
${MARSSKY}
void main(){
  vec3 d = normalize( vD ), sn = normalize( uSun + vec3( 0.0, 1e-4, 0.0 ) ); float day = clamp( ( sn.y + 0.15 ) / 0.27, 0.0, 1.0 ); day = day * day * ( 3.0 - 2.0 * day );
  vec3 c = lkMars( d, sn ) * 0.6;
  c = mix( c, uHor * 0.18 * day, 1.0 - smoothstep( -0.05, 0.0, d.y ) );   // below the horizon: the light the ground sends back up
  gl_FragColor = vec4( c, 1.0 );
  #include <encodings_fragment>
}` });
      F._lkSkyMat = e;   // the foundation's cache of what a world's environment is drawn from (js/look.js skyMatOf)
    }
    /* the sky over the Earth's places: the same computed sky as the park's, with its clouds; a haze to the horizon (the sea's water reaches past it) */
    if (earth && L.sky && LK.part('sky')) {
      const m = L.sky.material; Object.assign(m.uniforms, { uDisc: { value: 1 }, uEnv: { value: 0 }, uGain: { value: .08 }, uOpacity: { value: 1 } }, LK.skyUniforms ? LK.skyUniforms() : {}); m.fragmentShader = LDF(LK.SKY_FRAG); m.needsUpdate = true; K.skyClouds(m);
      F.scene.fog = new THREE.FogExp2(0xbfcbd6, B.water ? 4.5e-5 : 2.2e-4);
    }
    /* the sea: the water's own colour (about 1 percent of blue light comes back up out of deep open ocean, less of green, almost none of red:
       oligotrophic Atlantic water), the sky reflected by the environment, and waves from the ripple map at three scales */
    if (B.water && !B.cloud && L.ground) {
      const pos = [], idx = [], na = 160, nr = 60, r0 = .5, r1 = 26000;
      for (let i = 0; i <= nr; i++) { const r = i ? r0 * Math.pow(r1 / r0, i / nr) : 0; for (let j = 0; j <= na; j++) { const a = j / na * TAU; pos.push(Math.cos(a) * r, -r * r / 12742000, Math.sin(a) * r); } }
      for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const A = i * (na + 1) + j, Bq = A + na + 1; idx.push(A, A + 1, Bq, Bq, A + 1, Bq + 1); /* facing up */ }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      const wm = LK.material('water', hexOf([.002, .011, .03])); wm.roughness = .06;
      const u = { uC: { value: C }, uRip: { value: TEX ? tx('pond_ripples_normal_512.jpg', { normal: true }) : flat([128, 128, 255]) }, uT: { value: 0 } };
      LK.patch(wm, 'pksea', sh => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = 'uniform vec3 uC; varying vec3 lkW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tlkW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz + uC;');
        sh.fragmentShader = 'uniform sampler2D uRip; uniform float uT; varying vec3 lkW;\n' + sh.fragmentShader
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix( roughnessFactor, 0.22, smoothstep( 60.0, 3000.0, length( vViewPosition ) ) );   // waves too small to see still spread the reflection')
          .replace('#include <normal_fragment_maps>', `
	{ vec2 w = lkW.xz; float f = length( vViewPosition );
	  vec2 s1 = ( texture2D( uRip, w * 0.031 + uT * vec2( 0.006, 0.004 ) ).xy * 2.0 - 1.0 ), s2 = ( texture2D( uRip, mat2( 0.8, 0.6, -0.6, 0.8 ) * w * 0.11 + uT * vec2( -0.011, 0.017 ) ).xy * 2.0 - 1.0 ), s3 = ( texture2D( uRip, w * 0.43 + uT * vec2( 0.03, -0.02 ) ).xy * 2.0 - 1.0 );
	  vec2 sl = s1 * 0.55 + s2 * 0.35 * ( 1.0 - smoothstep( 80.0, 600.0, f ) ) + s3 * 0.25 * ( 1.0 - smoothstep( 6.0, 60.0, f ) );
	  normal = normalize( ( viewMatrix * vec4( normalize( vec3( sl.x * 0.45, 1.0, - sl.y * 0.45 ) ), 0.0 ) ).xyz ); }`);
      });
      L.ground.geometry.dispose(); L.ground.geometry = g; L.ground.rotation.set(0, 0, 0); L.ground.updateMatrix(); L.ground.material.dispose(); L.ground.material = wm; L.ground.receiveShadow = false;
      K._seaT = u.uT;
    }
    if (B.trees && !L.noteTrees) F.note = (F.note ? F.note + ' ' : '') + 'The far trees are simple shapes.';
    const up0 = F.update, fv = new V3();
    F.update = (dt, t) => {
      up0(dt, t);
      if (K._seaT) K._seaT.value = typeof simTime !== 'undefined' ? (simTime / 1000) % 1e4 : t;
      if (F.scene.fog && F.scene.fog.isFogExp2) { const s = sunDirIn(F), c = LK.horizon(s, LK.exposureOf(F)); F.scene.fog.color.setRGB(c[0], c[1], c[2]); }
      if (L.sky) { cloudStep(L.sky.material); if (LK.skyNight) LK.skyNight(L.sky.material.uniforms, sunDirIn(F).y); }
      /* the shadow's square follows where the camera looks */
      const s = sunDirIn(F); if (s.y > 0 && typeof cam !== 'undefined') { fv.copy(cam.T); if (cam.A !== F && typeof convertP === 'function') convertP(fv, cam.A, F); const h = Math.max(12, Math.min(60, cam.D * 1.5));
        Object.assign(SH.camera, { left: -h, right: h, top: h, bottom: -h, near: 1, far: 400 + h * 2 }); SH.camera.updateProjectionMatrix(); sun.target.position.copy(fv); sun.position.copy(fv).addScaledVector(s, 200 + h); sun.target.updateMatrixWorld(); SH.normalBias = 2 * h / SH.mapSize.x * 1.2; }
    };
  };
  return K;
})();

/* ================= EARTH TEXTURES ================= */
const LAND = [
  [-168, 66, -162, 70, -150, 71, -140, 70, -128, 70, -115, 68, -100, 68, -95, 72, -85, 70, -80, 73, -75, 68, -65, 62, -62, 58, -56, 52, -60, 47, -66, 45, -70, 42, -74, 40, -76, 35, -81, 31, -80, 26, -82, 26, -84, 30, -90, 30, -97, 27, -97, 22, -94, 18, -90, 21, -87, 21, -88, 16, -84, 15, -83, 10, -80, 8, -78, 8, -80, 7, -85, 10, -87, 13, -92, 15, -96, 16, -105, 20, -110, 23, -115, 30, -118, 34, -121, 35, -124, 40, -124, 46, -125, 49, -130, 54, -135, 58, -140, 60, -146, 61, -152, 59, -158, 57, -162, 55, -160, 58, -165, 61, -166, 64],
  [-120, 75, -100, 79, -85, 81, -70, 80, -78, 74, -90, 72, -105, 72, -118, 72],
  [-73, 78, -60, 82, -30, 83, -20, 80, -20, 72, -40, 65, -50, 61, -55, 66, -60, 72],
  [-80, 9, -77, 8, -72, 12, -62, 11, -52, 5, -50, 0, -35, -5, -35, -10, -39, -15, -41, -22, -48, -27, -58, -34, -62, -39, -65, -45, -68, -52, -72, -54, -75, -50, -74, -40, -71, -30, -70, -18, -76, -14, -81, -6, -80, 0, -78, 2],
  [-9, 37, -9, 43, -2, 43.5, -1, 46, -4, 48, 0, 49, 2, 51, 5, 53, 8, 54, 8, 57, 10, 58, 6, 58, 5, 59, 5, 62, 10, 64, 15, 69, 20, 70, 25, 71, 30, 70, 40, 68, 44, 67, 50, 68, 60, 69, 70, 73, 80, 73, 90, 76, 100, 77, 110, 74, 120, 73, 130, 71, 140, 72, 150, 71, 160, 70, 170, 70, 180, 68, 180, 65, 178, 63, 170, 60, 163, 58, 160, 54, 156, 51, 155, 57, 150, 59, 143, 59, 137, 55, 140, 52, 141, 48, 135, 43, 131, 42, 129, 40, 129, 35, 126, 35, 126, 38, 125, 40, 122, 40, 121, 39, 118, 39, 119, 37, 122, 37, 120, 33, 122, 30, 120, 26, 116, 23, 111, 21, 108, 22, 106, 19, 109, 15, 109, 12, 105, 9, 103, 10, 100, 13, 99, 9, 101, 6, 104, 1, 101, 3, 98, 8, 98, 14, 97, 17, 94, 18, 92, 22, 89, 22, 86, 20, 81, 15, 80, 10, 77, 8, 76, 10, 73, 17, 72, 21, 70, 22, 67, 25, 62, 25, 57, 25, 56, 24, 58, 23, 59, 22, 57, 19, 55, 17, 52, 16, 48, 14, 45, 13, 43, 13, 42, 16, 39, 21, 37, 25, 35, 28, 34, 31, 35, 34, 36, 36, 30, 36, 27, 37, 26, 40, 23, 38, 20, 40, 19, 42, 14, 45, 16, 41, 18, 40, 16, 38, 12, 42, 10, 44, 6, 43, 3, 43, 0, 39, -1, 37, -5, 36],
  [-17, 21, -17, 15, -15, 11, -12, 8, -8, 5, -3, 5, 2, 6, 5, 6, 9, 4, 10, -2, 12, -6, 13, -12, 12, -18, 15, -27, 18, -34, 20, -35, 26, -34, 32, -29, 35, -24, 35, -19, 40, -16, 40, -10, 39, -5, 42, -1, 48, 4, 51, 11, 44, 11, 43, 12, 39, 16, 37, 20, 35, 24, 33, 28, 32, 31, 25, 32, 20, 31, 15, 32, 10, 34, 10, 37, 3, 37, -2, 35, -6, 36, -10, 30, -13, 27],
  [44, -25, 47, -25, 50, -15, 49, -12, 44, -16],
  [114, -22, 114, -34, 118, -35, 124, -33, 131, -31, 138, -35, 141, -38, 147, -38, 150, -37, 153, -30, 153, -25, 146, -19, 145, -15, 142, -11, 141, -16, 136, -12, 130, -12, 126, -14, 122, -18],
  [-5, 50, 1, 51, 2, 53, -1, 55, -2, 57, -3, 59, -6, 58, -5, 56, -5, 55, -3, 54, -4, 53, -5, 52],
  [-10, 52, -6, 52, -6, 55, -8, 55, -10, 54],
  [130, 31, 132, 34, 135, 34, 138, 35, 140, 36, 141, 39, 142, 42, 145, 44, 142, 46, 140, 42, 139, 38, 137, 37, 133, 35, 130, 33],
  [95, 5, 98, 4, 104, -2, 106, -6, 104, -5, 100, -1, 95, 3], [105, -6, 114, -7, 114, -8.5, 105, -7.5],
  [109, 1, 111, 3, 117, 7, 119, 5, 118, 1, 116, -4, 110, -3], [131, -1, 137, -2, 141, -3, 147, -6, 150, -10, 143, -9, 138, -8, 134, -4],
  [120, 18, 122, 18, 124, 13, 126, 8, 125, 6, 122, 8, 121, 13, 119, 16], [173, -35, 176, -38, 178, -38, 175, -41, 173, -40],
  [172, -41, 174, -42, 171, -45, 167, -46, 168, -44], [-24, 64, -14, 64, -14, 66, -22, 66.5], [80, 10, 82, 7, 81, 6, 80, 7], [-85, 22, -78, 23, -74, 20, -78, 20, -82, 22],
  [-180, -90, 180, -90, 180, -70, 160, -70, 140, -66, 110, -66, 90, -66, 70, -68, 50, -66, 30, -69, 10, -70, -10, -71, -30, -75, -50, -77, -58, -70, -62, -64, -66, -66, -70, -72, -90, -73, -110, -74, -130, -75, -150, -77, -170, -78, -180, -78],
];
const WATER = [
  [-95, 59, -92, 57, -85, 55, -80, 52, -79, 55, -77, 60, -78, 63, -85, 64, -88, 64, -94, 61],
  [10, 54, 14, 54, 20, 55, 22, 58, 24, 60, 30, 60, 25, 65, 22, 66, 18, 63, 17, 60, 16, 56, 12, 56],
  [48, 30, 50, 27, 52, 24, 56, 24, 56, 27, 51, 28], [47, 45, 50, 47, 53, 45, 53, 41, 54, 38, 51, 37, 49, 38, 47, 41], [28, 42, 28, 45, 33, 46, 37, 45, 41, 42, 36, 41, 30, 41],
];
const ICE = [
  [-73, 78, -60, 82, -30, 83, -20, 80, -22, 72, -40, 66, -48, 62, -52, 64, -55, 70, -62, 76],
  LAND[LAND.length - 1],
];
function earthCanvases() {
  if (earthCanvases.c) return earthCanvases.c;
  const W = 2048, H = 1024, col = document.createElement('canvas'); col.width = W; col.height = H; const g = col.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#173a62'); gr.addColorStop(.5, '#1a5b94'); gr.addColorStop(1, '#173a62'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = rng(42);
  for (let i = 0; i < 500; i++) { const x = r() * W, y = r() * H, rad = 20 + r() * 90; const gg = g.createRadialGradient(x, y, 0, x, y, rad); gg.addColorStop(0, r() < .5 ? 'rgba(10,40,80,.22)' : 'rgba(60,140,200,.1)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.save(); pathPolys(g, LAND, W, H); for (const [lw, a] of [[16, .08], [9, .14], [4, .2]]) { g.lineWidth = lw; g.strokeStyle = `rgba(90,190,220,${a})`; g.stroke(); } g.restore();
  g.save(); pathPolys(g, LAND, W, H); g.fillStyle = '#4f7d3a'; g.fill(); g.clip();
  const blob = (lon, lat, rx, ry, color, a = .95) => { const [x, y] = lonlatXY(lon, lat, W, H); const rxp = rx / 360 * W, ryp = ry / 180 * H; g.save(); g.translate(x, y); g.scale(1, ryp / rxp); const gg = g.createRadialGradient(0, 0, 0, 0, 0, rxp); gg.addColorStop(0, rgba(color, a)); gg.addColorStop(.6, rgba(color, a * .7)); gg.addColorStop(1, rgba(color, 0)); g.fillStyle = gg; g.beginPath(); g.arc(0, 0, rxp, 0, TAU); g.fill(); g.restore(); };
  [[100, 70, 70, 6, 0x8d9478], [-110, 67, 35, 5, 0x8d9478], [100, 60, 45, 8, 0x33573a], [-100, 56, 32, 7, 0x35603a], [-85, 38, 12, 7, 0x3b6a30], [15, 50, 16, 6, 0x4a7a38],
  [20, 10, 24, 5, 0x8a9a4a], [25, -12, 14, 6, 0x8a9a4a], [135, -15, 14, 4, 0x8a9a4a], [-48, -14, 9, 7, 0x7d8f45], [78, 20, 9, 7, 0x7d8f45],
  [-62, -5, 15, 10, 0x2d5e28], [21, 0, 10, 7, 0x2d5e28], [103, 12, 9, 9, 0x2f6a2a], [113, 0, 11, 6, 0x2d5e28],
  [12, 22, 30, 9, 0xd2b47a], [-4, 24, 14, 7, 0xd2b47a], [46, 23, 11, 8, 0xd2b47a], [58, 31, 9, 5, 0xc4a874], [71, 27, 5, 4, 0xc4a874], [103, 43, 15, 5, 0xc0a878], [83, 39, 9, 3, 0xcdb27f], [132, -25, 17, 9, 0xc9935a], [21, -23, 7, 6, 0xc4a874], [-112, 33, 8, 5, 0xc0a070], [-70, -23, 3, 8, 0xb59c74], [-68, -45, 5, 6, 0xb6a476],
  [88, 33, 11, 4, 0x8b8577], [-70, -15, 3, 18, 0x7d6f5e], [-112, 45, 6, 10, 0x7a7560]].forEach(b => blob(...b));
  for (let i = 0; i < 5000; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.05)'; g.fillRect(r() * W, r() * H, 2 + r() * 5, 2 + r() * 4); }
  g.restore();
  g.save(); pathPolys(g, WATER, W, H); g.fillStyle = '#1d5a8c'; g.fill(); g.restore();
  g.save(); pathPolys(g, ICE, W, H); g.fillStyle = '#eef4fa'; g.fill(); g.restore();
  g.fillStyle = 'rgba(235,243,250,.92)'; g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= W; x += 16) g.lineTo(x, (90 - 79 - Math.sin(x * .013) * 2 - Math.sin(x * .041) * 1.2) / 180 * H); g.lineTo(W, 0); g.fill();
  const mW = W / 4, mH = H / 4, mask = document.createElement('canvas'); mask.width = mW; mask.height = mH; const m = mask.getContext('2d');
  m.fillStyle = '#000'; m.fillRect(0, 0, mW, mH); pathPolys(m, LAND, mW, mH); m.fillStyle = '#f00'; m.fill(); pathPolys(m, WATER, mW, mH); m.fillStyle = '#000'; m.fill(); pathPolys(m, ICE, mW, mH); m.fillStyle = '#0f0'; m.fill(); m.fillRect(0, 0, mW, (11 / 180) * mH);
  const rough = document.createElement('canvas'); rough.width = mW; rough.height = mH; const rg = rough.getContext('2d');
  rg.fillStyle = '#6e6e6e'; rg.fillRect(0, 0, mW, mH); pathPolys(rg, LAND, mW, mH); rg.fillStyle = '#e6e6e6'; rg.fill(); pathPolys(rg, WATER, mW, mH); rg.fillStyle = '#6e6e6e'; rg.fill();
  earthCanvases.c = { col, maskData: m.getImageData(0, 0, mW, mH), mW, mH, rough };
  return earthCanvases.c;
}
function earthTex() { if (!texCache.earth) { texCache.earth = new THREE.CanvasTexture(earthCanvases().col); texCache.earth.anisotropy = 8; } return texCache.earth; }
function earthRough() { if (!texCache.earthR) texCache.earthR = new THREE.CanvasTexture(earthCanvases().rough); return texCache.earthR; }
function cloudTex() {
  return canvasTex('clouds', 1024, 512, (g, w, h) => {
    const r = rng(9);
    for (let i = 0; i < 1500; i++) {
      const t = r(); let lat = t < .28 ? gauss(r) * 7 : t < .75 ? (r() < .5 ? -1 : 1) * (48 + gauss(r) * 11) : (r() * 2 - 1) * 72;
      const lon = r() * 360 - 180, [x, y] = lonlatXY(lon, lat, w, h), rad = 4 + r() * r() * 26, a = .05 + r() * .2;
      for (const ox of [0, -w, w]) { g.save(); g.translate(x + ox, y); g.scale(2.3, 1); const gg = g.createRadialGradient(0, 0, 0, 0, 0, rad); gg.addColorStop(0, `rgba(255,255,255,${a})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gg; g.fillRect(-rad, -rad, rad * 2, rad * 2); g.restore(); }
    }
  });
}
function rockyTex(key, base, dark, light, seed, extra) {
  return canvasTex(key, 512, 256, (g, w, h) => {
    const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, rad = 15 + r() * 60; const gg = g.createRadialGradient(x, y, 0, x, y, rad); gg.addColorStop(0, rgba(dark, .45)); gg.addColorStop(1, rgba(dark, 0)); g.fillStyle = gg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rad = 1 + r() * r() * 9; g.fillStyle = rgba(dark, .5); g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); g.strokeStyle = rgba(light, .5); g.lineWidth = 1; g.beginPath(); g.arc(x - .6, y - .6, rad, Math.PI, Math.PI * 1.8); g.stroke(); }
    if (extra) extra(g, w, h, r);
  });
}
function moonTex() { return rockyTex('moon', '#a3a3a3', 0x5d5d63, 0xe0e0e0, 8); }
function bandTex(key, cols, seed, extra) {
  return canvasTex(key, 512, 256, (g, w, h) => {
    const r = rng(seed), C = cols.map(c => new THREE.Color(c)), ph = r() * 10;
    for (let y = 0; y < h; y++) { const v = y / h; const n = Math.abs(v * C.length * 1.8 + Math.sin(v * 31 + ph) * .6 + Math.sin(v * 77) * .25); const i = Math.floor(n) % C.length, f = n % 1; g.fillStyle = C[i].clone().lerp(C[(i + 1) % C.length], f * f * (3 - 2 * f)).getStyle(); g.fillRect(0, y, w, 1); }
    for (let i = 0; i < 300; i++) { const c = C[Math.floor(r() * C.length)]; g.fillStyle = `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},.28)`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 1 + r() * 3, 0, 0, TAU); g.fill(); }
    if (extra) extra(g, w, h, r);
  });
}

/* ================= LEVEL: EARTH ================= */
BUILD.earth = (c) => {
  const g = c.group;
  g.add(starfield(4000, 300, 900, 13));
  const lightDir = new V3(-1, .15, .12).normalize();
  const sun = new THREE.DirectionalLight(0xffffff, 1.45); sun.position.copy(lightDir).multiplyScalar(50); g.add(sun);
  g.add(new THREE.AmbientLight(0x223355, .28));
  const sg = glowSprite(0xfff3d6, 60, 1); sg.position.copy(lightDir).multiplyScalar(500); g.add(sg);
  const tiltG = new THREE.Group(); tiltG.rotation.z = -.41; g.add(tiltG);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(5, 96, 64), new THREE.MeshStandardMaterial({ map: earthTex(), roughnessMap: earthRough(), roughness: 1, metalness: 0 }));
  earth.material.userData.noHL = true;
  const EC = earthCanvases();
  earth.userData = {
    priority: 1, resolve: hit => {
      if (!hit || !hit.uv) return 'earth';
      const x = clamp(Math.floor(hit.uv.x * EC.mW), 0, EC.mW - 1), y = clamp(Math.floor((1 - hit.uv.y) * EC.mH), 0, EC.mH - 1), i = (y * EC.mW + x) * 4;
      return EC.maskData.data[i + 1] > 128 ? 'ice' : EC.maskData.data[i] > 128 ? 'land' : 'ocean';
    }
  };
  earth.rotation.y = -1.72; tiltG.add(earth); c.pickables.push(earth);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(5.06, 96, 64), new THREE.MeshStandardMaterial({ map: cloudTex(), transparent: true, depthWrite: false, roughness: 1 }));
  clouds.rotation.y = -1.72; tiltG.add(clouds);
  const atm1 = new THREE.Mesh(new THREE.SphereGeometry(5.1, 64, 48), fresnelMat(0x6ab8ff, 3.2, 1.3)); g.add(atm1);
  const atm2 = new THREE.Mesh(new THREE.SphereGeometry(5.45, 64, 48), haloMat(0x4aa0ff, 2.6)); g.add(atm2);
  // interior cutaway (wedge facing the default camera)
  const inside = new THREE.Group(); inside.visible = false; g.add(inside);
  const phc = 1.221, ps = phc + Math.PI / 4, pl = 1.5 * Math.PI;
  const shellGeo = new THREE.SphereGeometry(5, 96, 64, ps, pl); const suv = shellGeo.attributes.uv;
  for (let i = 0; i < suv.count; i++) suv.setX(i, ((ps + suv.getX(i) * pl) / TAU) % 1);
  const shell = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({ map: earthTex(), roughness: .9 })); shell.material.userData.noHL = true; shell.userData = { id: 'crust', priority: .5 }; inside.add(shell); c.pickables.push(shell);
  const LAY = [[0, .957, 0xffe066, 'innercore'], [.957, 2.731, 0xff9a3c, 'outercore'], [2.731, 4.48, 0xd4502e, 'mantle'], [4.48, 4.86, 0xa33a22, 'mantle'], [4.86, 5, 0x6b4e3a, 'crust']];
  [phc - Math.PI / 4, phc + Math.PI / 4].forEach((phi, fi) => LAY.forEach(([a, b, col, id]) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(Math.max(a, .001), b, 96, 1, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    m.rotation.y = phi + Math.PI; m.userData = { id, priority: 2 }; inside.add(m); c.pickables.push(m);
  }));
  const ic = new THREE.Mesh(new THREE.SphereGeometry(.96, 32, 24), new THREE.MeshBasicMaterial({ color: 0xfff1a0 })); ic.userData = { id: 'innercore', priority: 3 }; ic.add(glowSprite(0xffe08a, 4, .7)); inside.add(ic); c.pickables.push(ic);
  const d1 = new V3(-Math.cos(phc - Math.PI / 4), 0, Math.sin(phc - Math.PI / 4));
  [['Inner core', 0, 1.7], ['Outer core', 1.85, .2], ['Mantle', 3.6, .5], ['Crust', 4.93, 2.4]].forEach(([t, rad, y]) => { const a = new THREE.Object3D(); a.position.copy(d1).multiplyScalar(rad).add(new V3(0, y, 0)); inside.add(a); c.addLabel(a, t); });
  // magnetic field (simplified dipole) + aurorae
  const field = new THREE.Group(); field.visible = false; tiltG.add(field);
  const fp = [];
  [1.6, 2.2, 3.0, 4.2, 5.8].forEach(Lsh => { const th0 = Math.asin(Math.sqrt(1 / Lsh)); for (let k = 0; k < 12; k++) { const ph = k / 12 * TAU; let prev = null; for (let i = 0; i <= 60; i++) { const th = th0 + (Math.PI - 2 * th0) * i / 60, rr = Lsh * Math.sin(th) ** 2 * 5; const v = new V3(rr * Math.sin(th) * Math.cos(ph), rr * Math.cos(th), rr * Math.sin(th) * Math.sin(ph)); if (prev) fp.push(prev.x, prev.y, prev.z, v.x, v.y, v.z); prev = v; } } });
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  const fMat = new THREE.LineBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(fg, fMat); lines.userData = { id: 'magnetosphere', priority: .4 }; field.add(lines); c.pickables.push(lines);
  const aur = new THREE.Group(); aur.userData = { id: 'aurora', priority: 2 }; field.add(aur); c.pickables.push(aur);
  [1, -1].forEach(sg => { [[1.95, 0x5bff9a, .8, 5.0], [2.05, 0xff5b6b, .35, 5.25]].forEach(([rad, col, op, R]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(rad * R / 5, .13, 8, 72), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); t.rotation.x = Math.PI / 2; t.position.y = sg * 4.6 * R / 5; aur.add(t); }); });
  const fA = new THREE.Object3D(); fA.position.set(13, 6, 0); field.add(fA); c.addLabel(fA, 'Magnetic field lines', { pick: lines });
  c.addLabel(aur.children[0], 'Aurora', { offset: new V3(0, .6, 0) });
  let mode = 'surf';
  seg([['surf', 'Surface'], ['in', 'Inside Earth'], ['mag', 'Magnetic field']], 'surf', k => {
    mode = k; const surf = k !== 'in';
    earth.visible = clouds.visible = atm1.visible = atm2.visible = surf; inside.visible = k === 'in'; field.visible = k === 'mag';
    if (k === 'in') showInfo('earth'); if (k === 'mag') showInfo('magnetosphere');
  });
  // moon
  const moonPiv = new THREE.Group(); moonPiv.rotation.z = .09; g.add(moonPiv);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.36, 48, 32), smat(0xffffff, { map: moonTex(), roughness: 1 })); moon.userData = { id: 'moon', priority: 2 };
  moonPiv.add(moon); c.pickables.push(moon);
  c.addLabel(moon, 'Moon', { offset: new V3(0, 1.8, 0) });
  // ISS
  const issPiv = new THREE.Group(); issPiv.rotation.x = .9; g.add(issPiv);
  const iss = new THREE.Group(); iss.userData = { id: 'iss', priority: 3 };
  const mm = smat(0xdddddd, { metalness: .5, roughness: .4 }), pm = smat(0x3a4a8a, { metalness: .6, roughness: .3, emissive: 0x0a0f2a });
  iss.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .02, .02), mm)); iss.add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .18, 8), mm));
  [-.22, -.13, .13, .22].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.07, .004, .24), pm); p.position.x = x; iss.add(p); });
  const blink = glowSprite(0xffffff, .35, .9); iss.add(blink); iss.add(hitSphere(.45, 'iss', 3)); iss.scale.setScalar(.8);
  issPiv.add(iss); c.pickables.push(iss);
  c.addLabel(iss, 'ISS', { offset: new V3(0, .35, 0) });
  c.update = (dt, t) => {
    earth.rotation.y += dt * .05; clouds.rotation.y += dt * .058;
    const ma = t * .15 + 1.2; moon.position.set(Math.cos(ma) * 20, 0, Math.sin(ma) * 20); moon.lookAt(moonPiv.position);
    const ia = t * .9; iss.position.set(Math.cos(ia) * 5.45, 0, Math.sin(ia) * 5.45); iss.rotation.y = -ia;
    blink.material.opacity = (t % 1) < .1 ? 1 : .25;
  };
  c.focusIn = () => new V3().setFromSphericalCoords(5, c.view.phi, c.view.theta);
  c.focusFor = () => ({ pos: new V3().setFromSphericalCoords(5, c.view.phi, c.view.theta), r: .35 });
  const upd0 = c.update; c.update = (dt, t) => { upd0(dt, t); fMat.opacity = .25 + .12 * Math.sin(t * 2); aur.children.forEach((m, i) => m.material.opacity = (i % 2 ? .3 : .7) + .2 * Math.sin(t * 3 + i)); };
};

/* ================= LEVEL: SOLAR ================= */
function sunMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: LDV(`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 p=normalize(vP)*3.0; float n=fbm3(p+vec3(0.,uTime*.06,uTime*.03)+fbm3(p*1.7-uTime*.04)); vec3 c=mix(vec3(1.,.38,.04),vec3(1.,.92,.55),smoothstep(.25,.8,n)); float mu=abs(dot(normalize(vN),normalize(vV))); c*=.55+.5*mu; gl_FragColor=vec4(c,1.); }`)
  });
}
BUILD.solar = (c) => {
  const g = c.group, r = rng(31);
  g.add(starfield(5000, 400, 1200, 17));
  g.add(new THREE.AmbientLight(0x404a66, .35));
  g.add(new THREE.PointLight(0xfff2dd, 2.0, 0, 0));
  const sunMat = sunMaterial();
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(4, 64, 48), sunMat); sunM.userData = { id: 'sun' }; g.add(sunM); c.pickables.push(sunM);
  const sg1 = glowSprite(0xffb347, 22, .85), sg2 = glowSprite(0xffe9b0, 11, 1); g.add(sg1); g.add(sg2);
  c.addLabel(sunM, 'Sun', { offset: new V3(0, 5, 0) });
  const PL = [
    { id: 'mercury', name: 'Mercury', r: .38, d: 8, P: .241, tilt: .03, tex: () => rockyTex('mercury', '#8f8b86', 0x5a5652, 0xbab4ac, 21) },
    { id: 'venus', name: 'Venus', r: .92, d: 11.2, P: .615, tilt: 3.09, tex: () => bandTex('venus', ['#e8cf96', '#d9b877', '#f0dcae', '#cfae6e'], 5) },
    { id: 'earthPlanet', name: 'Earth', r: 1, d: 14.6, P: 1, tilt: .41, tex: earthTex, moon: true },
    { id: 'mars', name: 'Mars', r: .55, d: 18.5, P: 1.881, tilt: .44, tex: () => rockyTex('mars', '#b5532e', 0x6e3020, 0xd8885a, 33, (gg, w, h) => { gg.fillStyle = 'rgba(245,245,250,.95)'; gg.fillRect(0, 0, w, 10); gg.fillRect(0, h - 8, w, 8); }) },
    { id: 'jupiter', name: 'Jupiter', r: 2.8, d: 30, P: 11.86, tilt: .05, tex: () => bandTex('jupiter', ['#d8c6a8', '#b98d63', '#efe3cc', '#a0704a', '#e6d3b3', '#c79e74'], 9, (gg, w, h) => { gg.fillStyle = '#e8c6a8'; gg.beginPath(); gg.ellipse(w * .65, h * .62, 32, 17, 0, 0, TAU); gg.fill(); gg.fillStyle = '#b5523b'; gg.beginPath(); gg.ellipse(w * .65, h * .62, 26, 13, 0, 0, TAU); gg.fill(); }) },
    { id: 'saturn', name: 'Saturn', r: 2.35, d: 41, P: 29.46, tilt: .47, rings: true, tex: () => bandTex('saturn', ['#e3d3a8', '#cdb88a', '#efe2bf', '#bfa77a'], 4) },
    { id: 'uranus', name: 'Uranus', r: 1.6, d: 50.5, P: 84, tilt: 1.71, tex: () => bandTex('uranus', ['#a6e4ea', '#9bd8e0', '#b4ecf0'], 6) },
    { id: 'neptune', name: 'Neptune', r: 1.55, d: 59, P: 164.8, tilt: .49, tex: () => bandTex('neptune', ['#3557c9', '#2b48ad', '#4a6de0', '#3050bb'], 7, (gg, w, h) => { gg.fillStyle = 'rgba(20,30,90,.85)'; gg.beginPath(); gg.ellipse(w * .4, h * .62, 18, 9, 0, 0, TAU); gg.fill(); }) },
  ];
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x7084b0, transparent: true, opacity: .32 });
  const orbitLine = (rad, tiltX = 0, ecc = 0) => { const p = []; for (let i = 0; i <= 256; i++) { const a = i / 256 * TAU; p.push(new V3(Math.cos(a) * rad + ecc, 0, Math.sin(a) * rad)); } const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(p), orbitMat); l.rotation.x = tiltX; return l; };
  const planets = [];
  let speed = 1, trueMode = false;
  const KEP = { mercury: [.206, 77, .387, 2440], venus: [.007, 131, .723, 6052], earthPlanet: [.017, 103, 1, 6371], mars: [.093, 336, 1.524, 3390], jupiter: [.049, 14, 5.203, 69911], saturn: [.057, 93, 9.537, 58232], uranus: [.046, 173, 19.19, 25362], neptune: [.010, 48, 30.07, 24622], pluto: [.249, 224, 39.48, 1188] };
  const AUK = 59 / 30.07, KM2U = AUK / 1.496e8;
  const ellipse = (e, wDeg) => { const b = Math.sqrt(1 - e * e), w = wDeg * Math.PI / 180, pts = []; for (let i = 0; i <= 256; i++) { const E = i / 256 * TAU, x = Math.cos(E) - e, z = -b * Math.sin(E); pts.push(new V3(x * Math.cos(w) - z * Math.sin(w), 0, x * Math.sin(w) + z * Math.cos(w))); } return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), orbitMat); };
  const kepPos = (out, a, e, wDeg, M) => { let E = M; for (let k = 0; k < 7; k++) E = M + e * Math.sin(E); const b = Math.sqrt(1 - e * e), x = a * (Math.cos(E) - e), z = -a * b * Math.sin(E), w = wDeg * Math.PI / 180; return out.set(x * Math.cos(w) - z * Math.sin(w), 0, x * Math.sin(w) + z * Math.cos(w)); };
  PL.forEach(p => {
    [p.e, p.w, p.au, p.km] = KEP[p.id];
    p.line = ellipse(p.e, p.w); p.line.scale.setScalar(p.d); g.add(p.line);
    const holder = new THREE.Group(); holder.userData = { id: p.id, r: p.r }; g.add(holder);
    const tilt = new THREE.Group(); tilt.rotation.z = p.tilt; holder.add(tilt);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 48, 32), smat(0xffffff, { map: p.tex(), roughness: .9 })); tilt.add(mesh);
    if (p.rings) {
      const ri = p.r * 1.25, ro = p.r * 2.3, rg = new THREE.RingGeometry(ri, ro, 128, 1);
      const pos = rg.attributes.position, uv = rg.attributes.uv, v = new V3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - ri) / (ro - ri), .5); }
      const rt = canvasTex('srings', 512, 4, (gg, w, h) => { for (let x = 0; x < w; x++) { const t = x / w; let a = t < .16 ? .22 : t < .5 ? .85 : t < .56 ? .05 : t < .86 ? .62 : .25 * (1 - (t - .86) / .14); if (Math.abs(t - .78) < .008) a = .15; const b = 200 + Math.sin(x * .9) * 20; gg.fillStyle = `rgba(${b},${b * .9 | 0},${b * .72 | 0},${a})`; gg.fillRect(x, 0, 1, h); } });
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; tilt.add(ring);
    }
    let moonM = null;
    if (p.moon) { moonM = new THREE.Mesh(new THREE.SphereGeometry(.27, 24, 16), smat(0xffffff, { map: moonTex(), roughness: 1 })); holder.add(moonM); }
    holder.add(hitSphere(Math.max(p.r * 1.3, 1.1), p.id, 2));
    const dot = glowSprite(0xffffff, .9, .9); dot.visible = false; holder.add(dot);
    c.pickables.push(holder);
    c.addLabel(holder, p.name, { offset: new V3(0, p.r + .7, 0) });
    planets.push(Object.assign(p, { holder, tilt, mesh, moonM, dot, M: r() * TAU }));
  });
  planets[2].M = .9;
  // belts
  const ap = [], ac = [], as = [];
  for (let i = 0; i < 3500; i++) { const a = r() * TAU, d = 22.5 + r() * 3.6; ap.push(Math.cos(a) * d, gauss(r) * .35, Math.sin(a) * d); const b = .45 + r() * .4; ac.push(b * .85, b * .78, b * .68); as.push(.12 + r() * .14); }
  const belt = makePoints(ap, ac, as); g.add(belt);
  const beltHit = new THREE.Mesh(new THREE.RingGeometry(22.3, 26.3, 64), hitMat()); beltHit.rotation.x = -Math.PI / 2; beltHit.userData = { id: 'asteroids', priority: .3 }; g.add(beltHit); c.pickables.push(beltHit);
  const kp = [], kc = [], ks = [];
  for (let i = 0; i < 4500; i++) { const a = r() * TAU, d = 64 + r() * 18; kp.push(Math.cos(a) * d, gauss(r) * 1.6, Math.sin(a) * d); const b = .35 + r() * .35; kc.push(b * .75, b * .85, b); ks.push(.18 + r() * .16); }
  const kuiper = makePoints(kp, kc, ks, { opacity: .7 }); g.add(kuiper);
  const kHit = new THREE.Mesh(new THREE.RingGeometry(63, 83, 64), hitMat()); kHit.rotation.x = -Math.PI / 2; kHit.userData = { id: 'kuiper', priority: .2 }; g.add(kHit); c.pickables.push(kHit);
  // pluto
  const plutoPiv = new THREE.Group(); plutoPiv.rotation.x = .3; g.add(plutoPiv); const plutoLine = ellipse(.249, 224); plutoLine.scale.setScalar(68); plutoPiv.add(plutoLine);
  const pluto = new THREE.Group(); pluto.userData = { id: 'pluto', r: .22 }; plutoPiv.add(pluto);
  pluto.add(new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), smat(0xc9b39a, { roughness: 1 }))); pluto.add(hitSphere(1, 'pluto', 2)); c.pickables.push(pluto);
  c.addLabel(pluto, 'Pluto', { offset: new V3(0, .7, 0) });
  let plutoA = 2; const _kp = new V3();
  function setTrue(on) {
    trueMode = on;
    planets.forEach(p => { const a = on ? p.au * AUK : p.d; p.line.scale.setScalar(a); p.tilt.scale.setScalar(on ? p.km * KM2U / p.r : 1); p.dot.visible = on; if (p.moonM) p.moonM.visible = !on; p.holder.userData.r = on ? p.km * KM2U : p.r; });
    sunM.scale.setScalar(on ? 696000 * KM2U / 4 : 1); sg1.scale.setScalar(on ? 2.4 : 22); sg2.scale.setScalar(on ? 1 : 11);
    const bs = on ? 2.7 * AUK / 24.3 : 1, ks = on ? 42 * AUK / 73 : 1; belt.scale.setScalar(bs); beltHit.scale.setScalar(bs); kuiper.scale.setScalar(ks); kHit.scale.setScalar(ks);
    plutoLine.scale.setScalar(on ? 39.48 * AUK : 68);
  }
  const YEAR = 22;
  c.follow = null;
  c.update = (dt, t) => {
    sunMat.uniforms.uTime.value = t; sunM.rotation.y += dt * .03;
    const yd = dt / YEAR * speed;
    planets.forEach(p => {
      p.M += yd / p.P * TAU; kepPos(p.holder.position, trueMode ? p.au * AUK : p.d, p.e, p.w, p.M);
      p.mesh.rotation.y += dt * (p.id === 'venus' ? -.05 : .4) * (speed ? 1 : 0);
      if (p.moonM) { const ma = t * 2 * speed; p.moonM.position.set(Math.cos(ma) * 2, 0, Math.sin(ma) * 2); }
    });
    belt.rotation.y += yd / 4.6 * TAU; kuiper.rotation.y += yd / 250 * TAU;
    plutoA += yd / 248 * TAU; kepPos(pluto.position, trueMode ? 39.48 * AUK : 68, .249, 224, plutoA);
    if (c.follow) c.follow.getWorldPosition(c.view.g.target);
  };
  const earthH = planets[2].holder;
  c.minDist = () => c.follow ? Math.max(c.follow.userData.r * 3.2, 2.2) : 22;
  c.maxDist = () => 165;
  c.canZoomIn = () => !c.follow || c.follow === earthH;
  c.noInMsg = () => c.follow ? `Only Earth has a closer view in this explorer — click Earth to land.` : '';
  c.focusIn = () => earthH.getWorldPosition(new V3());
  c.focusFor = () => ({ pos: earthH.getWorldPosition(new V3()), r: trueMode ? .05 : 1 });
  c.zoomInTarget = () => ({ key: 'earth' });
  c.onPick = (id, obj) => {
    if (obj.userData.r !== undefined && obj !== c.follow) { c.follow = obj; c.view.g.dist = Math.max(obj.userData.r * 9, 7); }
    else if (id === 'sun') { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = 45; }
  };
  c.onEmptyClick = () => { if (c.follow) { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = Math.max(c.view.g.dist, 70); } };
  seg([['0', 'Pause'], ['1', '1×'], ['6', '6×'], ['30', '30×']], '1', k => speed = +k);
  actBtn('☉ Whole system', () => { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = 80; closeInfo(); });
  seg([['sq', 'Squeezed view'], ['true', 'True scale']], 'sq', k => { setTrue(k === 'true'); if (k === 'true') { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = 120; showInfo('truescale'); } });
  actBtn('📐 Kepler\'s laws', () => showInfo('kepler'));
};

/* ================= LEVEL: GALAXY ================= */
BUILD.galaxy = (c) => {
  const g = c.group, r = rng(101);
  const gal = new THREE.Group(); g.add(gal);
  const P = [], C = [], S = [];
  const push3 = (x, y, z, cr, cg, cb, s) => { P.push(x, y, z); C.push(cr, cg, cb); S.push(s); };
  const rb = 6, pitch = .23, armOff = [0, Math.PI, Math.PI / 2, Math.PI * 1.5], armW = [.34, .34, .16, .16];
  const G = [], GC = [], GS = [];
  for (let i = 0; i < 52000; i++) {
    const u = r(); const k = u < armW[0] ? 0 : u < armW[0] + armW[1] ? 1 : u < .84 ? 2 : 3;
    const rr = Math.min(56, rb + (-Math.log(1 - r() * .97)) * 12.5);
    const th = armOff[k] + Math.log(rr / rb) / pitch;
    const sp = .45 + rr * .035 + (k > 1 ? .35 : 0);
    const x = rr * Math.cos(th) + gauss(r) * sp, z = rr * Math.sin(th) + gauss(r) * sp, y = gauss(r) * (.25 + .3 * Math.exp(-rr / 12));
    const t = r();
    if (t < .012) { push3(x, y, z, .95, .45, .7, 1.4 + r() * 1.2); continue; }
    const col = t < .7 ? [.7, .82, 1] : t < .9 ? [1, 1, 1] : [1, .88, .7];
    const b = .5 + r() * .5;
    push3(x, y, z, col[0] * b, col[1] * b, col[2] * b, .6 + r() * .8);
    if (i % 9 === 0) { G.push(x, y, z); GC.push(.05, .07, .12); GS.push(7 + r() * 7); }
  }
  gal.add(makePoints(G, GC, GS));
  const barA = .45;
  for (let i = 0; i < 15000; i++) {
    const bx = gauss(r) * (i < 10000 ? 5.5 : 2.6), bz = gauss(r) * (i < 10000 ? 1.6 : 2.6), by = gauss(r) * (i < 10000 ? 1.1 : 2);
    const x = bx * Math.cos(barA) - bz * Math.sin(barA), z = bx * Math.sin(barA) + bz * Math.cos(barA);
    const b = .55 + r() * .45; push3(x, by, z, b, b * .85, b * .6, .6 + r() * .7);
  }
  for (let i = 0; i < 7000; i++) { const rr = Math.min(60, -Math.log(1 - r() * .99) * 14), th = r() * TAU, b = .15 + r() * .2; push3(rr * Math.cos(th), gauss(r) * .45, rr * Math.sin(th), b * .95, b * .9, b * .85, .4 + r() * .3); }
  const globs = [];
  for (let k = 0; k < 36; k++) {
    const v = new V3(gauss(r), gauss(r) * .8, gauss(r)).normalize().multiplyScalar(18 + r() * 42); globs.push(v);
    for (let i = 0; i < 60; i++) push3(v.x + gauss(r) * .55, v.y + gauss(r) * .55, v.z + gauss(r) * .55, 1, .88, .7, .4 + r() * .3);
  }
  gal.add(makePoints(P, C, S));
  const cg1 = glowSprite(0xffd9a0, 34, .7), cg2 = glowSprite(0xfff3dc, 12, 1); gal.add(cg1); gal.add(cg2);
  // satellites
  const mkCloud = (center, n, s, seed) => { const rr = rng(seed), p = [], cc = [], ss = []; for (let i = 0; i < n; i++) { p.push(center.x + gauss(rr) * s * (1 + rr()), center.y + gauss(rr) * s * .6, center.z + gauss(rr) * s); const b = .4 + rr() * .5; cc.push(b * .75, b * .85, b); ss.push(.5 + rr() * .5); } return makePoints(p, cc, ss); };
  const lmcP = new V3(-58, -26, 52), smcP = new V3(-44, -36, 68);
  g.add(mkCloud(lmcP, 1600, 3, 5)); g.add(mkCloud(smcP, 900, 2, 6));
  const lmc = hitSphere(6, 'lmc', 2); lmc.position.copy(lmcP); g.add(lmc); c.pickables.push(lmc); c.addLabel(lmc, 'Large Magellanic Cloud', { offset: new V3(0, 6, 0) });
  const smc = hitSphere(4.5, 'smc', 2); smc.position.copy(smcP); g.add(smc); c.pickables.push(smc); c.addLabel(smc, 'Small Magellanic Cloud', { offset: new V3(0, 4.5, 0) });
  // markers
  const sunR = 26, sunTh = Math.log(sunR / rb) / pitch + Math.PI / 4;
  const sunMark = new THREE.Group(); sunMark.position.set(sunR * Math.cos(sunTh), .3, sunR * Math.sin(sunTh)); sunMark.userData = { id: 'sunMarker', priority: 3 };
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex(), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); ring.scale.set(4, 4, 1); ring.renderOrder = 5; sunMark.add(ring);
  sunMark.add(hitSphere(2.6, 'sunMarker', 3)); gal.add(sunMark); c.pickables.push(sunMark);
  c.addLabel(sunMark, '☉ You are here', { offset: new V3(0, 2.6, 0), cls: 'you', always: true });
  const sgr = hitSphere(3, 'sgrA', 2.5); gal.add(sgr); c.pickables.push(sgr); c.addLabel(sgr, 'Sagittarius A* (black hole)', { offset: new V3(0, 2.5, 0) });
  const bulge = hitSphere(8, 'bulge', .6); bulge.scale.y = .5; gal.add(bulge); c.pickables.push(bulge);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(56, 56, 2.5, 48), hitMat()); disk.userData = { id: 'spiralArm', priority: .2 }; gal.add(disk); c.pickables.push(disk);
  globs.slice(0, 8).forEach((v, i) => { const h = hitSphere(2.2, 'globular', 1.2); h.position.copy(v); gal.add(h); c.pickables.push(h); if (i === 0) c.addLabel(h, 'Globular cluster', { offset: new V3(0, 2, 0) }); });
  g.add(starfield(2500, 700, 1500, 41, .6));
  const _gv = new V3();
  c.update = (dt) => { gal.rotation.y -= dt * .012; ring.material.rotation += dt * .5; ring.material.opacity = smooth(6, 30, c.camera.position.distanceTo(sunMark.getWorldPosition(_gv))); };
  c.focusIn = () => sunMark.getWorldPosition(new V3());
  c.focusFor = k => k === 'blackhole' ? { pos: sgr.getWorldPosition(new V3()), r: 1.6 } : { pos: sunMark.getWorldPosition(new V3()), r: 1.2 };
  // dark matter halo + rotation curve
  const halo = new THREE.Group(); halo.visible = false; g.add(halo);
  const hr = rng(77), hP = [], hC = [], hS = [];
  for (let i = 0; i < 5000; i++) { const v = new V3(gauss(hr), gauss(hr), gauss(hr)).multiplyScalar(38); hP.push(v.x, v.y, v.z); hC.push(.3, .12, .55); hS.push(3 + hr() * 4); }
  halo.add(makePoints(hP, hC, hS, { opacity: .18 })); halo.add(glowSprite(0x7a3cff, 260, .22));
  const hHit = hitSphere(95, 'darkhalo', -.5); halo.add(hHit); c.pickables.push(hHit);
  const hA = new THREE.Object3D(); hA.position.set(0, 62, 0); halo.add(hA); c.addLabel(hA, 'Dark matter halo (invisible in reality)', { pick: hHit });
  const curve = document.createElement('div'); curve.className = 'specw'; curve.style.display = 'none';
  curve.innerHTML = '<svg width="210" height="74" viewBox="0 0 210 74"><line x1="18" y1="64" x2="205" y2="64" stroke="#56607a"/><line x1="18" y1="4" x2="18" y2="64" stroke="#56607a"/><path d="M18 64 C28 10 40 12 70 30 S150 52 205 57" fill="none" stroke="#ffd166" stroke-width="2" stroke-dasharray="4 3"/><path d="M18 64 C28 12 40 16 70 18 S150 17 205 16" fill="none" stroke="#b388ff" stroke-width="2.5"/><text x="22" y="72" fill="#98a2b8" font-size="8">distance from center →</text><text x="120" y="12" fill="#b388ff" font-size="8">observed</text><text x="128" y="50" fill="#ffd166" font-size="8">stars + gas only</text><text x="2" y="10" fill="#98a2b8" font-size="8">v</text></svg><span>Orbital speed vs. distance</span>';
  uiEl(curve);
  seg([['vis', 'Visible galaxy'], ['dm', 'Dark matter halo']], 'vis', k => { const on = k === 'dm'; halo.visible = on; curve.style.display = on ? '' : 'none'; if (on) showInfo('darkhalo'); });
};

/* ================= LEVEL: BLACK HOLE ================= */
BUILD.blackhole = (c) => {
  /* Scale: one unit = 6 x 10^9 m (the frame scales this group by 0.6 x 10^10 m). RS is the Schwarzschild radius of 4.3 million Suns,
     2GM/c^2 = 1.27 x 10^10 m (GM_sun = 1.32712 x 10^20 m^3/s^2). To scale: horizon RS, photon sphere 1.5 RS, shadow edge and photon ring
     (3 sqrt(3)/2 RS = 2.6 RS for a non-spinning hole), innermost stable orbit 3 RS. NOT to scale: the S-star orbits, the disc's shape and
     brightness, the probe's stretching. */
  const g = c.group, r = rng(66), RS = 1.2698e10 / 6e9, SH = 2.598 * RS;
  g.add(starfield(6000, 300, 900, 23));
  const sys = new THREE.Group(); sys.rotation.z = .18; sys.rotation.x = .05; g.add(sys);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(RS, 64, 48), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.userData = { id: 'horizon', priority: .8 }; sys.add(hole); c.pickables.push(hole);
  // the shadow: what the eye sees as black. Larger than the horizon because gravity bends light into the hole from outside it.
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(SH, 96), new THREE.MeshBasicMaterial({ color: 0x000000 })); shadow.userData = { id: 'horizon', priority: .9 }; g.add(shadow); c.pickables.push(shadow);
  const diskMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector2() }, uIn: { value: 3 * RS }, uOut: { value: 9 * RS } },
    vertexShader: LDV(`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform vec2 uCam; uniform float uIn; uniform float uOut; varying vec2 vP;
      void main(){ float rr=length(vP); float a=atan(vP.y,vP.x); float t=(rr-uIn)/(uOut-uIn);
        float sw=a+uTime*1.8/pow(rr/uIn,1.5);
        float n=fbm3(vec3(cos(sw)*1.4,sin(sw)*1.4,rr*.8)); float n2=noise3(vec3(cos(sw)*5.,sin(sw)*5.,rr*3.));
        vec3 hot=vec3(1.,.96,.88), mid=vec3(1.,.62,.22), cool=vec3(.75,.18,.05);
        vec3 col=mix(hot,mid,smoothstep(0.,.3,t)); col=mix(col,cool,smoothstep(.3,1.,t));
        float br=(.35+1.1*n+.25*n2)*(1.-smoothstep(.6,1.,t))*smoothstep(0.,.05,t)*(1.6-t)*.75;
        vec2 v=vec2(-sin(a),cos(a)); float dop=1.+.75*dot(v,uCam);
        br*=dop; gl_FragColor=vec4(col*br,clamp(br,0.,1.)); }`),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const disk = new THREE.Mesh(new THREE.RingGeometry(3 * RS, 9 * RS, 256, 8), diskMat); disk.rotation.x = -Math.PI / 2; disk.userData = { id: 'disk', priority: 1 }; sys.add(disk); c.pickables.push(disk);
  // the photon ring: a thin bright ring at the edge of the shadow, with a softer glow of bent light outside it (schematic brightness)
  const haloMatl = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDop: { value: 0 }, uSH: { value: SH } },
    vertexShader: LDV(`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform float uDop; uniform float uSH; varying vec2 vP;
      void main(){ float rr=length(vP); float x=rr/uSH; float a=atan(vP.y,vP.x);
        float ring=exp(-pow((x-1.015)/.022,2.))*.9+exp(-pow((x-1.05)/.1,2.))*.3;
        float n=fbm3(vec3(cos(a+uTime*.6)*2.,sin(a+uTime*.6)*2.,x*2.));
        float lens=exp(-pow((x-1.3)/.3,2.))*(.4+1.1*n)*(.5+.5*abs(sin(a)));
        float dop=1.+.6*uDop*(vP.x/max(rr,.001));
        vec3 col=vec3(1.,.66,.32)*lens*dop+vec3(1.,.86,.62)*ring*dop;
        float al=clamp(lens+ring,0.,1.); gl_FragColor=vec4(col,al); }`),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(SH * .97, SH * 2.4, 256, 4), haloMatl); halo.userData = { id: 'photonRing', priority: 1.5 }; g.add(halo); c.pickables.push(halo);
  c.addLabel(shadow, 'Shadow of the black hole', { offset: new V3(0, -SH * 1.15, 0), pick: shadow });
  // S2 + cluster: orbit sizes are NOT to scale (the real S2 orbit is about 2,000 AU along its long axis, far larger than this whole scene) and the periods are sped up
  const orbits = [];
  const mkOrbit = (a, e, P, rx, rz, id, color, size, ph) => {
    const piv = new THREE.Group(); piv.rotation.set(rx, 0, rz); g.add(piv);
    const b = a * Math.sqrt(1 - e * e), pts = []; for (let i = 0; i <= 200; i++) { const E = i / 200 * TAU; pts.push(new V3(a * (Math.cos(E) - e), 0, b * Math.sin(E))); }
    piv.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: id === 's2' ? .35 : .15 })));
    const star = new THREE.Group(); star.userData = { id, priority: 3 }; star.add(glowSprite(color, size, 1)); star.add(new THREE.Mesh(new THREE.SphereGeometry(size * .08, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }))); star.add(hitSphere(Math.max(1, size * .4), id, 3));
    piv.add(star); c.pickables.push(star); orbits.push({ star, a, e, b, P, ph }); return star;
  };
  const s2 = mkOrbit(64, .88, 26, .55, .25, 's2', 0xbfd8ff, 3, 0);
  c.addLabel(s2, 'Star S2 (orbit not to scale)', { offset: new V3(0, 1.4, 0) });
  for (let i = 0; i < 6; i++) mkOrbit(40 + r() * 30, .2 + r() * .6, 18 + r() * 20, r() * 3, r() * 3, 'scluster', [0xffe0b0, 0xbfd8ff, 0xffffff][i % 3], 1.6 + r(), r() * TAU);
  // jets
  const JN = 1400, jp = new Float32Array(JN * 3), jc = [], js = [], jv = [];
  for (let i = 0; i < JN; i++) { jc.push(.6, .55, 1); js.push(.5 + r() * .7); jv.push({ y: r() * 40, s: r() < .5 ? 1 : -1, a: r() * TAU, w: r() }); }
  const jg = new THREE.BufferGeometry(); jg.setAttribute('position', new THREE.BufferAttribute(jp, 3)); jg.setAttribute('aColor', new THREE.Float32BufferAttribute(jc, 3)); jg.setAttribute('aSize', new THREE.Float32BufferAttribute(js, 1));
  const jets = new THREE.Points(jg, pointsMaterial({ opacity: .8 })); jets.frustumCulled = false; jets.visible = false; sys.add(jets);
  // probe (the stretching is exaggerated: for a hole this heavy the tides at the horizon are gentle)
  let probe = null; const RMIN = RS * 1.03, RSTART = 22;
  function dropProbe() {
    if (probe) return;
    const p = new THREE.Group(); p.userData = { id: 'probe', priority: 4 };
    const pm = new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .5, 12), pm); body.rotation.x = Math.PI / 2; p.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.14, .25, 12), pm); nose.rotation.x = Math.PI / 2; nose.position.z = .37; p.add(nose);
    const gl = glowSprite(0x9ff3ff, 1.6, .9); p.add(gl); p.add(hitSphere(.8, 'probe', 4));
    sys.add(p); c.pickables.push(p);
    probe = { obj: p, mats: [pm], gl, t: 0, r: RSTART, a: Math.PI * .15, done: false };
    toast('Probe away. Watch it near the horizon. (The stretching is drawn exaggerated: at this hole\'s horizon the real tides are gentle.)', 'm');
  }
  const camLocal = new V3(), tmpM = new THREE.Matrix4(), _w = new V3();
  const radiiB = new THREE.Group(); radiiB.visible = false; g.add(radiiB); // rings that must face the viewer
  c.update = (dt, t) => {
    diskMat.uniforms.uTime.value = t; haloMatl.uniforms.uTime.value = t;
    tmpM.copy(disk.matrixWorld).invert(); camLocal.copy(c.camera.position).applyMatrix4(tmpM);
    const cl = camLocal.length() || 1; diskMat.uniforms.uCam.value.set(camLocal.x / cl, camLocal.y / cl);
    const v2 = new THREE.Vector2(camLocal.x, camLocal.y); if (v2.length() > 1e-4) { v2.normalize(); _w.set(v2.y, -v2.x, 0).applyMatrix4(disk.matrixWorld).sub(_w.clone().set(0, 0, 0).applyMatrix4(disk.matrixWorld)).applyMatrix4(c.camera.matrixWorldInverse.clone().setPosition(0, 0, 0)); haloMatl.uniforms.uDop.value = clamp(_w.x / (_w.length() || 1), -1, 1) * Math.min(1, v2.length()); }
    halo.quaternion.copy(c.camera.quaternion); shadow.quaternion.copy(c.camera.quaternion); radiiB.quaternion.copy(c.camera.quaternion);
    orbits.forEach(o => { const M = (t / o.P) * TAU + o.ph; let E = M; for (let k = 0; k < 8; k++) E = M + o.e * Math.sin(E); o.star.position.set(o.a * (Math.cos(E) - o.e), 0, o.b * Math.sin(E)); });
    if (jets.visible) { for (let i = 0; i < JN; i++) { const q = jv[i]; q.y += dt * (14 + q.w * 10); if (q.y > 45) q.y = 2.2; const rad = .15 + q.y * .045 * q.w; jp[i * 3] = Math.cos(q.a + q.y * .2) * rad; jp[i * 3 + 1] = q.s * q.y; jp[i * 3 + 2] = Math.sin(q.a + q.y * .2) * rad; } jg.attributes.position.needsUpdate = true; }
    if (probe) {
      const p = probe; p.t += dt;
      p.r = RMIN + (RSTART - RMIN) * Math.exp(-p.t * .38);
      p.a += dt * 2.2 / Math.pow(p.r / 4, 1.5) * clamp((p.r - RMIN) / 1.2, 0, 1);
      const y = 1.2 * clamp((p.r - RMIN) / 18, 0, 1);
      p.obj.position.set(Math.cos(p.a) * p.r, y, Math.sin(p.a) * p.r);
      p.obj.lookAt(_w.set(0, 0, 0).applyMatrix4(sys.matrixWorld));
      const s = clamp((3 * RS - p.r) / (1.8 * RS), 0, 1);
      p.obj.scale.set(1 - .75 * s, 1 - .75 * s, 1 + 6 * s);
      const fade = clamp((p.r - RMIN) / 1.6, 0, 1);
      p.mats.forEach(m => { m.color.setRGB(lerp(1, .62, 1 - s), lerp(.25, .95, 1 - s), lerp(.1, 1, 1 - s)); m.opacity = fade; });
      p.gl.material.color.copy(p.mats[0].color); p.gl.material.opacity = .9 * fade;
      if (p.t > 4 && !p.done) { p.done = true; fire('probe'); showInfo('probe'); }
      if (p.t > 13) { sys.remove(p.obj); c.pickables.splice(c.pickables.indexOf(p.obj), 1); probe = null; }
    }
  };
  c.canZoomIn = () => false;
  const radii = new THREE.Group(); radii.visible = false; radii.userData = { id: 'radii', priority: 2.5 }; sys.add(radii); c.pickables.push(radii);
  const ringMat = col => new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: .9, depthTest: false });
  [[RS, 0xffffff, 'Event horizon · rₛ'], [1.5 * RS, 0xffd166, 'Photon sphere · 1.5 rₛ'], [3 * RS, 0x6ee7ff, 'Innermost stable orbit (no spin) · 3 rₛ']].forEach(([rad, col, t], i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(rad - .035, rad + .035, 160), ringMat(col)); m.rotation.x = -Math.PI / 2; m.renderOrder = 6; radii.add(m);
    const a = new THREE.Object3D(); a.position.set(rad * Math.cos(.9 + i * .9), 0, rad * Math.sin(.9 + i * .9)); radii.add(a); c.addLabel(a, t, { pick: radii });
  });
  { const m = new THREE.Mesh(new THREE.RingGeometry(SH - .035, SH + .035, 160), ringMat(0xff9ec0)); m.renderOrder = 6; radiiB.add(m);
    const a = new THREE.Object3D(); a.position.set(0, -SH, 0); radiiB.add(a); c.addLabel(a, 'Shadow edge · 2.6 rₛ (as seen on the sky)', { pick: radii }); }
  const dl = new THREE.Object3D(); dl.position.set(8 * RS * .7, 0, 8 * RS * .7); sys.add(dl); c.addLabel(dl, 'Stylised accretion disc', { pick: disk });
  actBtn('Show key radii', () => { radii.visible = !radii.visible; radiiB.visible = radii.visible; if (radii.visible) showInfo('radii'); });
  actBtn('Drop a probe', dropProbe);
  seg([['off', 'No jets'], ['on', 'Show jets (like M87*)']], 'off', k => { jets.visible = k === 'on'; if (jets.visible) showInfo('jets'); });
};

/* ================= LEVEL: UNIVERSE ================= */
function galaxySpriteTex(kind) {
  return canvasTex('gal_' + kind, 256, 256, (g, w, h) => {
    const r = rng(kind.length * 17 + 3), cx = w / 2, cy = h / 2;
    if (kind === 'spiral' || kind === 'andromeda') {
      for (let i = 0; i < 5000; i++) { const arm = i % 2, t = Math.pow(r(), .7), rr = 8 + t * 100, th = arm * Math.PI + Math.log(rr / 8) / .32 + gauss(r) * .3; const x = cx + Math.cos(th) * rr + gauss(r) * 3, y = cy + Math.sin(th) * rr + gauss(r) * 3; const b = 160 + r() * 95; g.fillStyle = `rgba(${b * .8 | 0},${b * .88 | 0},${b},${.35 * (1 - t * .6)})`; g.fillRect(x, y, 1.6, 1.6); }
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 40); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(.4, 'rgba(255,215,160,.5)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    } else if (kind === 'elliptical') {
      g.translate(cx, cy); g.scale(1, .65); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 120); gr.addColorStop(0, 'rgba(255,235,200,1)'); gr.addColorStop(.25, 'rgba(255,205,150,.55)'); gr.addColorStop(1, 'rgba(255,180,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.fill();
    } else {
      for (let k = 0; k < 9; k++) { const x = cx + gauss(r) * 30, y = cy + gauss(r) * 22, rad = 12 + r() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, rad); const pink = r() < .3; gr.addColorStop(0, pink ? 'rgba(255,150,200,.8)' : 'rgba(170,200,255,.8)'); gr.addColorStop(1, 'rgba(150,180,255,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    }
  });
}
function cmbTex() {
  return canvasTex('cmb', 1024, 512, (g, w, h) => {
    g.fillStyle = '#1a4a8a'; g.fillRect(0, 0, w, h); const r = rng(1965);
    for (let i = 0; i < 7000; i++) { const x = r() * w, y = r() * h, rad = 3 + r() * 16, t = r(); const col = t < .33 ? '255,160,60' : t < .55 ? '255,220,120' : t < .8 ? '40,100,200' : '10,40,120'; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${col},.5)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  });
}
BUILD.universe = (c) => {
  const g = c.group, r = rng(2024);
  const nodes = [new V3(0, 0, 0)];
  for (let i = 0; i < 74; i++) nodes.push(new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(Math.cbrt(r()) * 165));
  const edges = new Set(), E = [];
  nodes.forEach((a, i) => { nodes.map((b, j) => [j, a.distanceTo(b)]).filter(x => x[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(([j, d]) => { const k = i < j ? i + '_' + j : j + '_' + i; if (!edges.has(k) && d < 95) { edges.add(k); E.push([i, j]); } }); });
  const P = [], C = [], S = [], DP = [], DC = [], DS = [];
  const gc = () => { const t = r(); return t < .45 ? [1, .92, .78] : t < .8 ? [.75, .85, 1] : [1, .78, .62]; };
  const nodeW = nodes.map(() => .4 + r() * 1.2);
  nodes.forEach((n, i) => {
    const cnt = Math.floor(220 * nodeW[i]);
    for (let k = 0; k < cnt; k++) { const s = k < cnt * .3 ? 1.4 : 4; const col = gc(), b = .6 + r() * .4; P.push(n.x + gauss(r) * s, n.y + gauss(r) * s, n.z + gauss(r) * s); C.push(col[0] * b, col[1] * b, col[2] * b); S.push(1.3 + r() * 1.5); }
    for (let k = 0; k < 40; k++) { DP.push(n.x + gauss(r) * 7, n.y + gauss(r) * 7, n.z + gauss(r) * 7); DC.push(.42, .18, .75); DS.push(14 + r() * 10); }
  });
  E.forEach(([i, j]) => {
    const a = nodes[i], b = nodes[j], L = a.distanceTo(b), cnt = Math.floor(L * 3.2);
    for (let k = 0; k < cnt; k++) { const t = r(); const p = new V3().lerpVectors(a, b, t); const w = 1.6 + Math.sin(t * Math.PI) * 1.4; const col = gc(), br = .35 + r() * .5; P.push(p.x + gauss(r) * w, p.y + gauss(r) * w, p.z + gauss(r) * w); C.push(col[0] * br, col[1] * br, col[2] * br); S.push(1.1 + r() * 1.2); }
    for (let k = 0; k < L / 4; k++) { const p = new V3().lerpVectors(a, b, r()); DP.push(p.x + gauss(r) * 4, p.y + gauss(r) * 4, p.z + gauss(r) * 4); DC.push(.35, .15, .65); DS.push(12 + r() * 8); }
  });
  for (let i = 0; i < 2500; i++) { P.push((r() - .5) * 360, (r() - .5) * 360, (r() - .5) * 360); C.push(.35, .38, .45); S.push(.6); }
  const web = makePoints(P, C, S); g.add(web);
  const dm = makePoints(DP, DC, DS, { opacity: .07 }); dm.visible = false; g.add(dm);
  const dmGlows = new THREE.Group(); dmGlows.visible = false; g.add(dmGlows);
  nodes.forEach((n, i) => { const s = glowSprite(0x7a3cff, 26 * nodeW[i], .25); s.position.copy(n); dmGlows.add(s); });
  // hits: clusters & filaments
  const big = nodes.map((n, i) => [i, nodeW[i]]).sort((a, b) => b[1] - a[1]).slice(0, 12);
  big.forEach(([i], k) => { if (i === 0) return; const h = hitSphere(7, 'cluster', 1); h.position.copy(nodes[i]); g.add(h); c.pickables.push(h); if (k === 1) c.addLabel(h, 'Galaxy cluster', { offset: new V3(0, 7, 0) }); });
  E.forEach(([i, j], k) => { const h = cylBetween(nodes[i], nodes[j], 3.2, hitMat(), 6); h.userData = { id: 'filament', priority: .5 }; g.add(h); c.pickables.push(h); if (k === 5) c.addLabel(h, 'Filament', { offset: new V3(0, 3, 0) }); });
  // galaxy sprites
  const mkGal = (kind, id, pos, sc, lbl, prio = 2) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: galaxySpriteTex(kind), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, rotation: r() * TAU }));
    s.scale.set(sc * 1.6, (kind === 'andromeda' ? sc * .42 : sc) * 1.6, 1); s.position.copy(pos);
    const grp = new THREE.Group(); grp.userData = { id, priority: prio }; grp.add(s); grp.add(hitSphere(sc * .4, id, prio)); g.add(grp); c.pickables.push(grp);
    if (lbl) c.addLabel(grp, lbl, { offset: new V3(0, sc * .45, 0), cls: id === 'milkyway' ? 'you' : '', always: id === 'milkyway', maxCam: id === 'andromeda' ? 110 : Infinity });
    return grp;
  };
  mkGal('spiral', 'milkyway', new V3(0, 0, 0), 6, 'Milky Way (you are here)', 3);
  mkGal('andromeda', 'andromeda', new V3(6.5, 2.5, -3), 6.5, 'Andromeda', 3);
  const kinds = [['spiral', 'galSpiral'], ['elliptical', 'galElliptical'], ['irregular', 'galIrregular']];
  const far = nodes.filter(n => n.length() > 45);
  for (let k = 0; k < 12; k++) { const [kind, id] = kinds[k % 3]; const n = far[(k * 5 + 2) % far.length]; const pos = n.clone().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(4)); mkGal(kind, id, pos, 7 + r() * 4, null); }
  // CMB shell
  const cmb = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 32), new THREE.MeshBasicMaterial({ map: cmbTex(), side: THREE.BackSide, transparent: true, opacity: .55, depthWrite: false }));
  cmb.userData = { id: 'cmb', priority: -1 }; cmb.visible = false; g.add(cmb); c.pickables.push(cmb);
  // cosmic expansion: points scale in the shader, galaxies keep their size
  const expObjs = []; g.children.forEach(o => { if (o.userData && (o.userData.id === 'milkyway' || o.userData.id === 'andromeda' || /^gal|cluster|filament/.test(o.userData.id || ''))) expObjs.push([o, o.position.clone()]); });
  let expT = -1;
  const setExp = a => { web.material.uniforms.uExpand.value = a; dm.material.uniforms.uExpand.value = a; dmGlows.children.forEach((s, i) => s.position.copy(nodes[i]).multiplyScalar(a)); expObjs.forEach(([o, p]) => o.position.copy(p).multiplyScalar(a)); };
  c.update = (dt) => {
    g.rotation.y += dt * .01;
    if (expT >= 0) { expT += dt; const a = expT < 6 ? 1 + .8 * ease(expT / 6) : expT < 7.5 ? 1.8 : 1.8 - .8 * ease(clamp((expT - 7.5) / .8, 0, 1)); setExp(a); if (expT < 7.5) message(`Space is stretching — every distance is now ${a.toFixed(2)}× larger. Farther galaxies recede faster.`); if (expT > 8.3) { expT = -1; setExp(1); } }
  };
  actBtn('⤢ Expand the universe', () => { expT = 0; showInfo('expansion'); });
  c.focusIn = () => new V3();
  c.focusFor = () => ({ pos: new V3(), r: 2.5 });
  seg([['off', 'Visible matter'], ['dm', 'Show dark matter']], 'off', k => { const on = k === 'dm'; dm.visible = on; dmGlows.visible = on; if (on) showInfo('darkmatter'); });
  let cmbOn = false;
  const cb = actBtn('🌌 Show the oldest light', () => { cmbOn = !cmbOn; cmb.visible = cmbOn; cb.innerHTML = cmbOn ? '🌌 Hide the oldest light' : '🌌 Show the oldest light'; if (cmbOn) showInfo('cmb'); });
};

// (the honey bee's ruler stop is declared in its own data: `ruler` in data/things/bee/thing.json, added by js/things.js)
