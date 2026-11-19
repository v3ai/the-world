'use strict';
/* ================= MATTER & LIFE FRAMES (true sizes) ================= */
const ELJ = {}; // symbol → elements.json record
function elInfo(sym) {
  const e = ELJ[sym]; if (!e) return { title: sym, tag: 'Element', body: '' };
  const f = [['Atomic number', e.Z], ['Atomic mass', `${(+e.mass).toFixed(3)} u`], ['Electron configuration', e.config || '—']];
  if (e.radius_vdw_pm) f.push(['Van der Waals radius', `${e.radius_vdw_pm} pm`]);
  if (e.electronegativity) f.push(['Electronegativity', e.electronegativity]);
  if (e.ionization_eV) f.push(['First ionization energy', `${(+e.ionization_eV).toFixed(2)} eV`]);
  if (e.phase_stp) f.push(['State at room temperature', e.phase_stp]);
  if (e.melt_K) f.push(['Melts at', `${Math.round(e.melt_K)} K`]);
  if (e.discovered) f.push(['Discovered', e.discovered]);
  return { title: `${e.name} atom (${e.symbol})`, tag: `${e.category || 'Element'} · group ${e.group || '—'}, period ${e.period}`, body: `<p>${e.summary || ''}</p>`, facts: f };
}
const elColor = s => new THREE.Color(ELJ[s] && ELJ[s].color_cpk ? ELJ[s].color_cpk : '#ff66cc');
const elVdw = s => (ELJ[s] && ELJ[s].radius_vdw_pm ? ELJ[s].radius_vdw_pm : 170) / 100; // Å
/* --- instanced atoms + bonds (Å units) --- */
function atomSet(F, parent, atoms, bonds, o = {}) {
  const style = o.style || 'bs', grp = new THREE.Group(); parent.add(grp);
  const bySym = {}; atoms.forEach((a, i) => (bySym[a[0]] = bySym[a[0]] || []).push(i));
  const sg = new THREE.SphereGeometry(1, o.lowpoly ? 10 : 20, o.lowpoly ? 8 : 14), m4 = new THREE.Matrix4(), meshes = [];
  for (const s in bySym) {
    const idx = bySym[s], mesh = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: elColor(s), emissive: elColor(s).multiplyScalar(.28), roughness: .4, metalness: 0 }), idx.length);
    const rad = elVdw(s) * (style === 'sf' ? 1 : .26);
    idx.forEach((ai, k) => { const a = atoms[ai]; m4.makeScale(rad, rad, rad).setPosition(a[1], a[2], a[3]); mesh.setMatrixAt(k, m4); });
    mesh.userData = {
      id: 'atom', priority: 3, madeOf: 'atom', sym: s,
      infoFn: () => elInfo(s),
      center: h => { const a = atoms[idx[h.hit.instanceId]]; return new V3(a[1], a[2], a[3]).applyMatrix4(grp.matrixWorld).add(h.frame.C); },
      radius: () => rad
    };
    mesh.userData.atomAt = id => atoms[idx[id]];
    grp.add(mesh); F.pickables.push(mesh); meshes.push(mesh);
  }
  if (bonds && bonds.length && style !== 'sf') {
    const cg = new THREE.CylinderGeometry(.11, .11, 1, 8, 1); cg.translate(0, .5, 0);
    const bm = new THREE.InstancedMesh(cg, new THREE.MeshStandardMaterial({ roughness: .5 }), bonds.length * 2), q = new THREE.Quaternion(), up = new V3(0, 1, 0);
    let k = 0;
    bonds.forEach(([i, j, ord]) => {
      const a = new V3(...atoms[i].slice(1, 4)), b = new V3(...atoms[j].slice(1, 4)), mid = a.clone().lerp(b, .5);
      [[a, atoms[i][0]], [b, atoms[j][0]]].forEach(([p, s]) => { const d = mid.clone().sub(p), L = d.length(); q.setFromUnitVectors(up, d.normalize()); const w = ord >= 2 ? 1.45 : 1; m4.compose(p, q, new V3(w, L, w)); bm.setMatrixAt(k, m4); bm.setColorAt(k, elColor(s)); k++; });
    });
    grp.add(bm); bm.userData = { id: 'bond', priority: 1 }; F.pickables.push(bm);
  }
  grp.userData.meshes = meshes;
  return grp;
}
function spawnAtomFrom(F, T, hint, unitScale) {
  if (!hint || !hint.obj || !hint.obj.userData.sym || hint.hit == null || hint.hit.instanceId == null) {
    // nearest atom to T among this frame's atom meshes
    let best = null, bd = Infinity;
    F.pickables.forEach(m => { if (!m.isInstancedMesh || !m.userData.sym) return; const p = new V3(), M = new THREE.Matrix4(); for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); p.setFromMatrixPosition(M).applyMatrix4(m.parent.matrixWorld).add(F.C || new V3()); const d = p.distanceTo(T); if (d < bd) { bd = d; best = { sym: m.userData.sym, p: p.clone() }; } } });
    if (!best || bd > 3 * unitScale) return null;
    return atomFrame(best.sym, best.p, unitScale);
  }
  const p = hint.obj.userData.center({ hit: hint.hit, frame: F });
  return atomFrame(hint.obj.userData.sym, p, unitScale);
}
function atomFrame(sym, pos, unitScale) { // unitScale: parent units per Å
  return new Frame({ type: 'atom', pinned: true, name: `${(ELJ[sym] || {}).name || sym} atom`, unit: 1e-12, radius: 600, r0: 0, r1: 2.5e-9, spawnD: 2e-13, pos: pos.clone(), opts: { el: sym } });
}
/* ---------- molecule from data/molecules (unit Å) ---------- */
const MOLIDX = { list: null };
FT.mol = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x302040, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 8, 6); F.add(dl);
    const holder = new THREE.Group(); F.add(holder);
    let style = store.get('molStyle', 'bs');
    const load = id => getJSON('data/molecules_all.json').then(ALL => ALL.mols[id] || ALL.mols.water).then(M => {
      if (!F.built) return;
      holder.clear(); F.pickables.length = 0; F.mats = null;
      const c = new V3(); M.atoms.forEach(a => c.add(new V3(a[1], a[2], a[3]))); c.divideScalar(M.atoms.length);
      const atoms = M.atoms.map(a => [a[0], a[1] - c.x, a[2] - c.y, a[3] - c.z, a[4]]);
      F.molAtoms = atoms; F.mol = M;
      const g = atomSet(F, holder, atoms, M.bonds, { style });
      const info = { title: M.name, tag: `Molecule · ${M.formula}`, body: `<p>${M.notes || ''}</p><p class="mini">Shape computed with the RDKit toolkit (${M.method || 'MMFF94 force field'}). Atoms are colored by element; zoom into any atom.</p>`, facts: [['Formula', M.formula], ['Molar mass', `${(+M.mw).toFixed(2)} g/mol`], ['Atoms', M.atoms.length]] };
      g.userData.meshes.forEach(m => m.userData.molInfo = info);
      F.info = info; F.name = M.name; F.blurb = `${M.name} (${M.formula}) at true size: the scale bar shows ångströms (0.1 nm).`;
      if (F.molLabel) { F.molLabel.el.remove(); F.labels.splice(F.labels.indexOf(F.molLabel), 1); }
      let rmax = 0; atoms.forEach(a => rmax = Math.max(rmax, Math.hypot(a[1], a[2], a[3])));
      const lo = new THREE.Object3D(); lo.position.set(0, rmax + 2, 0); holder.add(lo); F.molLabel = F.label(lo, M.name);
      if (o.onLoad) o.onLoad(F);
      F.opts.mol = id;
    });
    load(o.mol || 'water');
    if (!o.fixed) {
      const sel = document.createElement('select'); sel.className = 'molsel'; sel.title = 'Choose any of 250 molecules';
      getJSON('data/molecules_all.json').then(ALL => ALL.index).then(L => {
        const cats = {}; L.forEach(m => (cats[m.category] = cats[m.category] || []).push(m));
        sel.innerHTML = Object.keys(cats).sort().map(k => `<optgroup label="${k}">${cats[k].sort((a, b) => a.name.localeCompare(b.name)).map(m => `<option value="${m.id}" ${m.id === (o.mol || 'water') ? 'selected' : ''}>${m.name}</option>`).join('')}</optgroup>`).join('');
      });
      sel.onchange = () => load(sel.value);
      uiEl(sel);
    }
    seg([['bs', 'Ball & stick'], ['sf', 'Space-filling (true size)']], style, k => { style = k; store.set('molStyle', k); load(F.opts.mol); });
    F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
    F.update = (dt) => { holder.rotation.y += dt * .05 * (cam.D > 3e-9 ? 1 : 0); };
  }
};
/* ---------- crystal lattice (unit Å) ---------- */
FT.crystal = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x302040, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 8, 6); F.add(dl);
    getJSON('data/crystals.json').then(CR => {
      if (!F.built) return;
      const X = CR.find(c => c.id === o.id) || CR[0], L = X.lattice.map(v => new V3(...v)), R = o.R || 13, atoms = [];
      const n = Math.ceil(R / Math.min(...L.map(v => v.length()))) + 1;
      const ctr = new V3().add(L[0]).add(L[1]).add(L[2]).multiplyScalar(.5);
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++) X.basis.forEach(([s, fx, fy, fz]) => {
        const p = L[0].clone().multiplyScalar(i + fx).add(L[1].clone().multiplyScalar(j + fy)).add(L[2].clone().multiplyScalar(k + fz)).sub(ctr);
        if (p.length() < R) atoms.push([s, p.x, p.y, p.z]);
      });
      const bonds = [], cut = X.bond_cutoff || 2.5;
      for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const d = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]); if (d < cut && !(atoms[i][0] === 'H' && atoms[j][0] === 'H')) bonds.push([i, j, 1]); }
      const g = atomSet(F, F.root, atoms, bonds, { style: 'bs', lowpoly: atoms.length > 1500 });
      // unit cell outline
      const c0 = ctr.clone().negate(), corners = [];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) corners.push(c0.clone().add(L[0].clone().multiplyScalar(a)).add(L[1].clone().multiplyScalar(b)).add(L[2].clone().multiplyScalar(c)));
      const E = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]], lp = [];
      E.forEach(([a, b]) => lp.push(corners[a].x, corners[a].y, corners[a].z, corners[b].x, corners[b].y, corners[b].z));
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      const box = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .8 })); F.add(box);
      F.label(box, 'Unit cell (repeats in all directions)', { offset: corners[7].clone() });
      const info = { title: X.name, tag: `Crystal · ${X.formula}`, body: `<p>${X.notes || ''}</p><p class="mini">Atoms sit on a repeating 3-D lattice. The yellow box is one unit cell; the solid is this box copied ~10²⁰ times in every direction.</p>`, facts: [['Formula', X.formula], ['Cell edges', L.map(v => v.length().toFixed(2) + ' Å').join(' × ')]] };
      F.info = info; F.name = X.name; F.blurb = `${X.name}: a crystal lattice at true atomic scale (ångströms).`;
      g.userData.meshes.forEach(m => m.userData.molInfo = info);
    });
    F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
  }
};
/* ---------- liquid water (unit Å) ---------- */
FT.liquid = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, .75)); const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(5, 8, 6); F.add(dl);
    const r = rng(9), R = 16, mols = [], cell = 3, grid = new Map(), key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    const target = Math.floor(4 / 3 * Math.PI * R ** 3 * .0334);
    for (let t = 0; t < target * 40 && mols.length < target; t++) {
      const p = new V3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).multiplyScalar(R); if (p.length() > R) continue;
      let ok = true; const [cx, cy, cz] = key(p.x, p.y, p.z).split(',').map(Number);
      for (let a = -1; a <= 1 && ok; a++) for (let b = -1; b <= 1 && ok; b++) for (let c = -1; c <= 1 && ok; c++) (grid.get(`${cx + a},${cy + b},${cz + c}`) || []).forEach(q => { if (q.distanceTo(p) < 2.72) ok = false; });
      if (!ok) continue; mols.push(p); const k = key(p.x, p.y, p.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p);
    }
    const atoms = [], bonds = [], th = 104.52 / 2 * Math.PI / 180, OH = .9572;
    mols.forEach(p => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6));
      const h1 = new V3(Math.sin(th) * OH, Math.cos(th) * OH, 0).applyQuaternion(q).add(p), h2 = new V3(-Math.sin(th) * OH, Math.cos(th) * OH, 0).applyQuaternion(q).add(p);
      const i = atoms.length; atoms.push(['O', p.x, p.y, p.z], ['H', h1.x, h1.y, h1.z], ['H', h2.x, h2.y, h2.z]); bonds.push([i, i + 1, 1], [i, i + 2, 1]);
    });
    const g = atomSet(F, F.root, atoms, bonds, { style: 'bs', lowpoly: true });
    // hydrogen bonds: H…O within 2.2 Å
    const lp = [];
    for (let i = 0; i < atoms.length; i++) { if (atoms[i][0] !== 'H') continue; const h = new V3(atoms[i][1], atoms[i][2], atoms[i][3]); for (let j = 0; j < atoms.length; j += 3) { if (Math.floor(i / 3) * 3 === j) continue; const d = Math.hypot(atoms[j][1] - h.x, atoms[j][2] - h.y, atoms[j][3] - h.z); if (d > 1.5 && d < 2.25) lp.push(h.x, h.y, h.z, atoms[j][1], atoms[j][2], atoms[j][3]); } }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const hb = new THREE.LineSegments(lg, new THREE.LineDashedMaterial({ color: 0x7fd8ff, dashSize: .2, gapSize: .15, transparent: true, opacity: .75 })); hb.computeLineDistances(); F.add(hb); F.pick(hb, 'hbond', 1.5);
    F.label(hb, 'Hydrogen bonds (dashed)', { offset: new V3(0, R + 1, 0) });
    const info = { title: 'Liquid water', tag: 'H₂O · 1 g/cm³', body: '<p>Each water molecule is a bent O–H–H unit about 0.28 nm across. In the liquid they are packed almost shoulder to shoulder (33 molecules per cubic nanometer), constantly forming and breaking hydrogen bonds — each lasts only about a trillionth of a second. This is a snapshot; in reality everything here jiggles at hundreds of meters per second.</p>', facts: [['Molecules shown', mols.length], ['Density', '≈ 33.4 molecules/nm³'], ['O–H bond', '0.957 Å'], ['H–O–H angle', '104.5°']] };
    g.userData.meshes.forEach(m => m.userData.molInfo = info); F.info = info;
    F.blurb = 'A droplet of liquid water at true scale, every atom shown (snapshot — real motion is ~10¹² times faster).';
    F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
  }
};
/* ---------- gas (air) — unit nm ---------- */
FT.gas = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, .8)); const dl = new THREE.DirectionalLight(0xffffff, .7); dl.position.set(5, 8, 6); F.add(dl);
    const r = rng(3), R = 22, n = Math.floor(4 / 3 * Math.PI * R ** 3 * .0246), sp = [];
    const mix = [['N2', .7808, 'N', .110], ['O2', .2095, 'O', .121], ['Ar', .0093, 'Ar', 0], ['CO2', .0004, 'C', .116], ['H2O', .01, 'O', 0]];
    const parts = { N: [], O: [], Ar: [], C: [], H: [] }, mols = [];
    for (let i = 0; i < n; i++) {
      let u = r(), k = 0; while (k < mix.length - 1 && u > mix[k][1]) { u -= mix[k][1]; k++; }
      const p = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(R * Math.cbrt(r())), d = new V3(gauss(r), gauss(r), gauss(r)).normalize(), v = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.3);
      mols.push({ kind: mix[k][0], p, d, v });
    }
    const counts = {}; mols.forEach(m => counts[m.kind] = (counts[m.kind] || 0) + 1);
    const sg = new THREE.SphereGeometry(1, 12, 8), meshes = {};
    const mk = (s, cnt) => { const m = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: elColor(s), roughness: .5 }), Math.max(cnt, 1)); m.count = 0; F.add(m); meshes[s] = m; return m; };
    const need = { N: counts.N2 * 2 || 0, O: (counts.O2 || 0) * 2 + (counts.CO2 || 0) * 2 + (counts.H2O || 0), Ar: counts.Ar || 0, C: counts.CO2 || 0, H: (counts.H2O || 0) * 2 };
    for (const s in need) mk(s, need[s]);
    const m4 = new THREE.Matrix4(), place = () => {
      for (const s in meshes) meshes[s].count = 0;
      const put = (s, p, rad) => { const m = meshes[s]; m4.makeScale(rad, rad, rad).setPosition(p); m.setMatrixAt(m.count++, m4); };
      mols.forEach((m, i) => {
        const h = m.d.clone();
        if (m.kind === 'N2') { put('N', m.p.clone().addScaledVector(h, .055), .155); put('N', m.p.clone().addScaledVector(h, -.055), .155); }
        else if (m.kind === 'O2') { put('O', m.p.clone().addScaledVector(h, .06), .152); put('O', m.p.clone().addScaledVector(h, -.06), .152); }
        else if (m.kind === 'Ar') put('Ar', m.p, .188);
        else if (m.kind === 'CO2') { put('C', m.p, .17); put('O', m.p.clone().addScaledVector(h, .116), .152); put('O', m.p.clone().addScaledVector(h, -.116), .152); }
        else { put('O', m.p, .152); put('H', m.p.clone().addScaledVector(h, .096), .11); put('H', m.p.clone().addScaledVector(h.applyAxisAngle(new V3(0, 0, 1), 1.82), .096), .11); }
      });
      for (const s in meshes) { meshes[s].instanceMatrix.needsUpdate = true; meshes[s].computeBoundingSphere && meshes[s].computeBoundingSphere(); }
    };
    place();
    const info = { title: 'Air', tag: 'A gas mixture at sea level', body: '<p>Air is mostly empty space. At sea level a cubic nanometer holds on average just 0.025 molecules — the gaps are about 3.3 nm, ten times the size of the molecules. 78% nitrogen (N₂, blue pairs), 21% oxygen (O₂, red pairs), almost 1% argon, and traces of CO₂ and water vapour. Real molecules fly at ~500 m/s and collide billions of times a second; here motion is slowed about a trillion-fold.</p>', facts: [['Molecules shown', n], ['Mean spacing', '≈ 3.3 nm'], ['Mean free path', '≈ 68 nm'], ['N₂ : O₂ : Ar', '78 : 21 : 0.9 %']] };
    for (const s in meshes) { const m = meshes[s]; m.userData = { id: 'gasmol', priority: 3, sym: s, infoFn: () => info, madeOf: 'molecule', center: h => { const M = new THREE.Matrix4(); m.getMatrixAt(h.hit.instanceId, M); return new V3().setFromMatrixPosition(M).add(h.frame.C); }, radius: () => .3 }; F.pickables.push(m); }
    F.info = info; F.blurb = 'Air at true scale: mostly empty space. Motion slowed ~10¹²×.';
    F.update = dt => {
      if (cam.D < 6e-9) return; // freeze when you're looking closely
      const s = dt * .25;
      mols.forEach(m => { m.p.addScaledVector(m.v, s); if (m.p.length() > R) m.p.multiplyScalar(-.98); m.d.applyAxisAngle(new V3(0, 1, 0), dt * .3); });
      place();
    };
    F.spawn = (T, hint) => {
      let best = null, bd = Infinity; mols.forEach(m => { const d = m.p.distanceTo(T); if (d < bd) { bd = d; best = m; } }); if (!best || bd > .8) return null;
      const id = { N2: 'nitrogen', O2: 'oxygen', CO2: 'carbon_dioxide', H2O: 'water' }[best.kind];
      if (!id) return atomFrame('Ar', best.p);
      return new Frame({ type: 'mol', pinned: true, name: best.kind, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: best.p.clone(), opts: { mol: id, fixed: true } });
    };
  }
};
/* ---------- plasma (stellar photosphere / corona) — unit nm ---------- */
FT.plasma = {
  build(F) {
    F.env = { opaque: true, bg: 0x04070f };
    const r = rng(4), P = [], C = [], S = [];
    for (let i = 0; i < 2600; i++) { const p = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(30 * Math.cbrt(r())); const e = r() < .5; P.push(p.x, p.y, p.z); if (e) { C.push(.45, .7, 1); S.push(.25); } else { C.push(1, .45, .3); S.push(.45); } }
    const pts = makePoints(P, C, S); F.add(pts); F.pick(pts, 'plasma', 1);
    pts.userData.info = { title: 'Plasma', tag: 'The fourth state of matter', body: '<p>So hot that atoms are torn apart: bare nuclei (red — mostly protons) and free electrons (blue) fly separately. Plasma conducts electricity and is steered by magnetic fields. Over 99% of the visible matter in the universe is plasma — stars are made of it.</p>', facts: [['Sun\'s surface', '≈ 5,800 K'], ['Sun\'s core', '≈ 15 million K']] };
    F.blurb = 'Stellar plasma at nanometer scale: free electrons and bare nuclei.';
    F.update = (dt, t) => { pts.rotation.y += dt * .04; };
  }
};
/* ---------- atom (unit pm) wraps the v2 quantum atom at true size ---------- */
v2frame('atom', 'atom', c => c.pmPerUnit, (F, c, g, k) => {
  // put the nucleus at its TRUE size (~1/50,000 of the atom); a marker shows where it is
  let nucG = null; g.children.forEach(ch => ch.traverse(o => { if (!nucG && o.userData && (o.userData.id === 'proton' || o.userData.id === 'neutron')) nucG = o.parent; }));
  const E = EL[c.opts.el] || { Z: 8, N: 8 }, A = E.Z + E.N;
  const trueR = 1.2 * Math.cbrt(A) * 1e-3 / k; // in v2 units
  const v2R = .42 * 1.25 * Math.cbrt(A);
  const mk = markerSprite(0xff7755, 9); F.add(mk); mk.userData = { id: 'nucleus_atom', priority: 4, center: () => new V3(), radius: 1e-3 * 1.2 * Math.cbrt(A) * 4 }; F.pickables.push(mk);
  F.label(mk, 'Nucleus (true size — 99.97% of the mass)', { offset: new V3(0, 0, 0) });
  let real = store.get('realNuc', true);
  const apply = () => { if (nucG) nucG.scale.setScalar(real ? trueR / v2R : 1); mk.visible = true; };
  apply();
  seg([['real', 'Nucleus: true size'], ['big', 'Nucleus: enlarged']], real ? 'real' : 'big', kk => { real = kk === 'real'; store.set('realNuc', real); apply(); });
  F.blurb = `${E.name || ''} atom at true size: the electron cloud is ~100,000× wider than the nucleus at its center.`;
  F.radius = 600;
  F.spawn = (T) => T.length() < .5 ? new Frame({ type: 'nucleus', pinned: true, name: 'Atomic nucleus', unit: 1e-15, radius: 40, r0: 1.5e-15, r1: 3e-13, spawnD: 4e-15, pos: new V3(), opts: { Z: E.Z, N: E.N, el: c.opts.el } }) : null;
  F.spawnD = 2e-13;
  F.attract = new V3(); F.attractD = 1.2e-10; F.attractR = 250;
});
/* ---------- nucleus (unit fm) ---------- */
FT.nucleus = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.AmbientLight(0x8899bb, .55)); const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5, 8, 6); F.add(dl);
    const Z = o.Z || 8, N = o.N || 8, A = Z + N, r = rng(A * 7), rn = .84, pts = [];
    const types = shuffle([...Array(Z).fill('p'), ...Array(N).fill('n')], r);
    types.forEach(() => pts.push(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.5)));
    for (let it = 0; it < 160; it++) { for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = new V3().subVectors(pts[j], pts[i]); let L = d.length(); if (L < 1e-4) { d.set(r() - .5, r() - .5, r() - .5); L = d.length(); } if (L < 1.7) { d.multiplyScalar((1.7 - L) / 2 / L); pts[i].sub(d); pts[j].add(d); } } if (it < 130) pts.forEach(p => p.multiplyScalar(.97)); }
    const pm = smat(0xff4d4d, { roughness: .35, emissive: 0x2a0000 }), nm = smat(0x9fb3c8, { roughness: .4, emissive: 0x06090e }), geo = new THREE.SphereGeometry(rn, 32, 24);
    F.nucleons = [];
    types.forEach((t, i) => { const m = new THREE.Mesh(geo, t === 'p' ? pm : nm); m.position.copy(pts[i]); F.pick(m, t === 'p' ? 'proton' : 'neutron', 3); m.userData.madeOf = 'quarks'; F.add(m); F.nucleons.push(m); });
    const Rn = 1.2 * Math.cbrt(A);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(Rn * 1.15, 48, 32), fresnelMat(0xff9966, 2.2, .5)); F.add(shell);
    F.label(F.nucleons[types.indexOf('p')], 'Proton', { offset: new V3(0, 1.1, 0) }); if (N) F.label(F.nucleons[types.indexOf('n')], 'Neutron', { offset: new V3(0, -1.3, 0) });
    F.info = { title: `Nucleus of ${o.el || ''} (${Z} protons, ${N} neutrons)`, tag: 'Atomic nucleus', body: '<p>Protons and neutrons (nucleons) packed together by the residual strong force, which overpowers the protons\' electric repulsion at distances below ~2.5 fm. Nuclear matter has a nearly constant density of about 2×10¹⁷ kg/m³ — a teaspoon would weigh about a billion tonnes.</p>', facts: [['Radius', `≈ ${Rn.toFixed(1)} fm (1.2·A^⅓)`], ['Nucleon radius', '≈ 0.84 fm']] };
    F.blurb = `An atomic nucleus at true size: ${Rn.toFixed(1)} femtometers (10⁻¹⁵ m) across. Each ball is a proton (red) or neutron (gray).`;
    F.update = (dt, t) => { F.nucleons.forEach((m, i) => m.position.copy(pts[i]).addScaledVector(new V3(Math.sin(t * 3 + i), Math.cos(t * 2.6 + i * 2), Math.sin(t * 2.2 + i * 3)), .035)); };
    F.spawn = (T, hint) => {
      let best = null, bd = Infinity; F.nucleons.forEach(m => { const d = m.position.distanceTo(T); if (d < bd) { bd = d; best = m; } }); if (!best || bd > 1.6) return null;
      return new Frame({ type: 'proton', pinned: true, name: best.userData.id === 'proton' ? 'Proton' : 'Neutron', unit: 1e-15, radius: 4, r1: 1.2e-14, pos: best.position.clone(), opts: { kind: best.userData.id } });
    };
  }
};
v2frame('proton', 'proton', () => .84 / 5.2, (F) => { F.blurb = 'Inside a nucleon: three valence quarks bound by gluons, in a seething sea of virtual quark–antiquark pairs (quantum chromodynamics).'; });
/* ---------- DNA (unit nm) & cell (unit µm) via v2 ---------- */
v2frame('dna', 'dna', () => 1 / 2.4, (F, c) => {
  F.blurb = 'DNA at true scale: 2 nm wide, 0.34 nm between base pairs. Zoom into a base pair to see every atom.';
  F.spawn = (T, hint) => {
    const id = hint && hint.id || '';
    const mol = /base_[AT]/.test(id) ? 'bp_AT' : /base_[GC]/.test(id) ? 'bp_GC' : id === 'sugar' ? 'deoxyribose' : id === 'phosphate' ? 'phosphate' : 'bp_GC';
    return new Frame({ type: 'mol', name: mol, unit: 1e-10, radius: 25, r1: 1.2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol, fixed: true } });
  };
  F.spawnD = 2.5e-9;
});
v2frame('cell', 'cell', () => 10 / 12, (F, c) => {
  F.blurb = c.cellPlant ? 'A plant cell from a leaf, about 40 µm long — chloroplasts capture sunlight.' : 'One of your skin cells at true size: about 20 µm across, with ~37 trillion like it in your body.';
  F.spawn = (T, hint) => {
    const id = hint && hint.id || '';
    const nucP = c.nucPos.clone().multiplyScalar(c.k);
    if (/nucle|chromatin/.test(id) || T.distanceTo(nucP) < 3.4 * c.k) return new Frame({ type: 'dna', name: 'DNA', unit: 1e-9, radius: 30, r1: 2.5e-7, pos: T.clone() });
    const mol = /membrane|phospholipid|channel|glyco/.test(id) ? 'popc' : /mito/.test(id) ? 'atp' : /chloro/.test(id) ? 'chlorophyll_a' : /vacuole/.test(id) ? null : /wall/.test(id) ? 'cellotriose' : /ribosome|er|golgi/.test(id) ? 'aa_gly' : null;
    if (!mol) return new Frame({ type: 'liquid', name: 'Cytosol water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
    return new Frame({ type: 'mol', name: mol, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol, fixed: false } });
  };
  F.spawnD = 1.2e-6;
});
/* ---------- micro scale (unit µm): tissue surfaces, grains, pond life, aerosols ---------- */
function voronoiTex(key, cols, n, line, seed, w = 512) {
  return canvasTex(key, w, w, (g) => {
    const r = rng(seed), P = []; for (let i = 0; i < n; i++) P.push([r() * w, r() * w, cols[i % cols.length]]);
    const img = g.createImageData(w, w), d = img.data;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      let b1 = 1e9, b2 = 1e9, c = null; for (const p of P) { let dx = Math.abs(x - p[0]), dy = Math.abs(y - p[1]); dx = Math.min(dx, w - dx); dy = Math.min(dy, w - dy); const dd = dx * dx + dy * dy; if (dd < b1) { b2 = b1; b1 = dd; c = p[2]; } else if (dd < b2) b2 = dd; }
      const e = Math.sqrt(b2) - Math.sqrt(b1), k = (y * w + x) * 4, edge = e < line ? .55 + .45 * e / line : 1;
      const col = new THREE.Color(c); d[k] = col.r * 255 * edge; d[k + 1] = col.g * 255 * edge; d[k + 2] = col.b * 255 * edge; d[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { wrap: true });
}
const MICRO = {
  skin: { title: 'Skin surface', blurb: 'Your skin at 0.1 mm: the outer layer is flattened dead cells (corneocytes, ~40 µm across) that flake off — you shed about 40,000 every minute. A hair is ~70 µm thick.', ground: ['#e9b59b', '#e2a98e', '#efc0a6', '#dca089'], cells: 30, hair: 3, bact: 40, child: 'cell' },
  fur: { title: 'Dog skin and fur', blurb: 'Fur at 0.1 mm: each hair is a tube of dead keratin cells about 50–100 µm thick.', ground: ['#c9a27e', '#b8916e', '#d6b08b'], cells: 30, hair: 40, bact: 20, child: 'cell' },
  leaf: { title: 'Leaf surface', blurb: 'A leaf at 0.1 mm: jigsaw-shaped epidermis cells and stomata — tiny mouths (~25 µm) that let CO₂ in and water vapour out.', ground: ['#5fa64a', '#69b153', '#57983f', '#74b85b'], cells: 22, stoma: 14, bact: 10, child: 'plantcell' },
  soil: { title: 'Soil', blurb: 'Soil at 0.1 mm: mineral grains (sand ~0.1–2 mm, silt, clay), organic matter, fungal threads and bacteria — a gram of soil holds ~1 billion microbes.', ground: ['#5b4632', '#4f3c2a', '#6a523a'], grains: ['#cdb89a', '#a58e6e', '#8c7a63', '#e0d3bd'], n: 160, hyphae: 25, bact: 120, crystal: 'quartz' },
  sand: { title: 'Desert sand', blurb: 'Sand grains are mostly quartz (SiO₂) rounded by wind — each 0.06–2 mm.', ground: ['#d9b77f', '#cfa86c'], grains: ['#e8cf9c', '#d4b07a', '#f0dcb4', '#c79d63', '#b98a55'], n: 220, crystal: 'quartz' },
  regolith: { title: 'Lunar regolith', blurb: 'Moon dust: sharp, glassy fragments made by billions of years of micrometeorite impacts — no wind or water has ever rounded them.', ground: ['#5c5c5c', '#666'], grains: ['#8a8a8a', '#6f6f6f', '#a2a2a2', '#4d4d4d', '#b5b0a0'], n: 220, sharp: true, crystal: 'forsterite' },
  mars: { title: 'Martian soil', blurb: 'Mars dust is basaltic rock coated with iron oxides (rust) — that is why the planet is red.', ground: ['#8a4a2e', '#7a3f26'], grains: ['#b3623b', '#a0522d', '#c27a4f', '#7c3a21'], n: 220, crystal: 'hematite' },
  ice: { title: 'Snow and ice', blurb: 'Snow and ice: crystals of frozen water, each grain a lattice of H₂O molecules in hexagonal ice Ih.', ground: ['#dfeef8', '#cfe3f2'], grains: ['#f4fbff', '#e2f1fb', '#d0e6f6'], n: 120, crystal: 'ice_ih', glass: true },
  pond: { title: 'Pond water', blurb: 'A drop of pond water at 0.1 mm: diatoms with glass (silica) shells, green algae and bacteria drift in liquid water.', water: true, diatoms: 40, algae: 60, bact: 200, child: 'water' },
  ocean: { title: 'Sea water', blurb: 'Sea water at 0.1 mm: phytoplankton make about half of Earth\'s oxygen.', water: true, diatoms: 50, algae: 80, bact: 200, child: 'water' },
  air: { title: 'Air (aerosols)', blurb: 'Air at 0.1 mm: almost empty, with a few dust grains, pollen and cloud droplets drifting by. The gas molecules themselves are far too small to see at this scale.', air: true, child: 'gas' },
  rock: { title: 'Rock surface', blurb: 'Granite-like rock: interlocking crystals of quartz, feldspar and mica.', ground: ['#a9a39b', '#8f8a84', '#c8c2b8', '#5f5b57', '#e6dfd2'], cells: 40, crystal: 'quartz' },
  metal: { title: 'Metal surface', blurb: 'Polished iron under a microscope shows grains — each a single crystal of atoms in a cubic lattice.', ground: ['#9aa3ad', '#8c96a1', '#a7b0b9'], cells: 26, crystal: 'iron_bcc' },
};
function microFrame(kind, pos, quat) { const M = MICRO[kind] || MICRO.soil; return new Frame({ type: 'micro', name: M.title, unit: 1e-6, radius: 800, r0: 1.5e-4, r1: 6e-3, spawnD: 1.5e-4, pos: pos.clone(), quat: quat || new THREE.Quaternion(), up: new V3(0, 1, 0), opts: { kind } }); }
FT.micro = {
  build(F, o) {
    const M = MICRO[o.kind] || MICRO.soil, r = rng(o.kind.length * 13 + 5);
    F.env = { opaque: true, bg: 0x0d0f14 };
    F.add(new THREE.HemisphereLight(0xf2f6ff, 0x404040, .75)); const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(3, 8, 4); F.add(dl);
    F.name = M.title; F.blurb = M.blurb;
    const info = { title: M.title, tag: 'Microscopic view (true scale, µm)', body: `<p>${M.blurb}</p>` };
    if (M.ground) {
      const t = M.cells ? voronoiTex('vor_' + o.kind, M.ground, M.cells * 3, 5, 7) : canvasTex('grd_' + o.kind, 256, 256, (g, w, h) => { const rr = rng(3); g.fillStyle = M.ground[0]; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = M.ground[i % M.ground.length]; g.globalAlpha = .4; g.fillRect(rr() * w, rr() * h, 2 + rr() * 4, 2 + rr() * 4); } }, { wrap: true });
      t.repeat.set(4, 4);
      const geo = new THREE.CircleGeometry(800, 96); const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, (Math.sin(x * .02) * Math.cos(y * .017) * (M.cells ? 4 : 2)) + (o.kind === 'skin' ? -6 * Math.exp(-Math.pow((x * .7 + y * .7) % 260 / 22, 2)) : 0)); }
      geo.computeVertexNormals();
      const gm = new THREE.Mesh(geo, smat(0xffffff, { map: t, roughness: .8 })); gm.rotation.x = -Math.PI / 2; F.add(gm);
      F.pick(gm, 'microsurface', 1); gm.userData.info = info; gm.userData.madeOf = M.crystal ? 'crystal' : 'cell';
    }
    const sg = new THREE.IcosahedronGeometry(1, 1);
    if (M.grains) {
      const pa = sg.attributes.position, gg = sg.clone(), ga = gg.attributes.position;
      for (let i = 0; i < ga.count; i++) { const v = new V3().fromBufferAttribute(ga, i); v.multiplyScalar(M.sharp ? .75 + Math.abs(Math.sin(v.x * 9 + v.y * 7)) * .5 : .9 + Math.sin(v.x * 5 + v.z * 3) * .1); ga.setXYZ(i, v.x, v.y, v.z); }
      gg.computeVertexNormals(); if (M.sharp) { gg.deleteAttribute('normal'); gg.computeVertexNormals(); }
      const im = new THREE.InstancedMesh(gg, smat(0xffffff, { roughness: M.glass ? .1 : .75, flatShading: !!M.sharp, transparent: !!M.glass, opacity: M.glass ? .85 : 1 }), M.n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < M.n; i++) { const s = Math.exp(lerp(Math.log(8), Math.log(220), Math.pow(r(), 1.6))), a = r() * TAU, d = Math.sqrt(r()) * 700; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, s * .5, Math.sin(a) * d), q, new V3(s, s * (.7 + r() * .4), s * (.8 + r() * .4))); im.setMatrixAt(i, m4); im.setColorAt(i, new THREE.Color(M.grains[i % M.grains.length])); }
      F.add(im); F.pick(im, 'grain', 2); im.userData.info = { title: 'Mineral grain', tag: M.title, body: `<p>${M.blurb}</p><p>Zoom into a grain to see its crystal lattice.</p>` }; im.userData.madeOf = 'crystal';
    }
    if (M.hair) {
      for (let i = 0; i < M.hair; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 600, h = 400 + r() * 600; const c = new THREE.Mesh(new THREE.CylinderGeometry(35, 38, h, 24), smat(o.kind === 'fur' ? 0x8a6340 : 0x3b2a20, { roughness: .45 })); c.position.set(Math.cos(a) * d, h / 2 - 10, Math.sin(a) * d); c.rotation.set((r() - .5) * 1.4, 0, (r() - .5) * 1.4); F.add(c); F.pick(c, 'hair', 2); c.userData.info = { title: 'Hair', tag: 'Keratin fiber, ~70 µm thick', body: '<p>A hair is a rope of dead cells packed with keratin protein, covered in overlapping scales (the cuticle). It grows from a follicle about 1 cm per month.</p>' }; c.userData.madeOf = 'protein'; }
    }
    if (M.stoma) {
      for (let i = 0; i < M.stoma; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 650, s = new THREE.Group(); s.position.set(Math.cos(a) * d, 2, Math.sin(a) * d); s.rotation.y = r() * 6; [-1, 1].forEach(k => { const g = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), smat(0x3f8f35, { roughness: .6 })); g.scale.set(14, 6, 5); g.position.z = k * 5; s.add(g); }); F.add(s); F.pick(s, 'stoma', 2); s.userData.info = { title: 'Stoma', tag: 'A leaf\'s breathing pore', body: '<p>Two curved guard cells swell with water to open the pore and shrink to close it, balancing CO₂ intake against water loss. A leaf has thousands per square centimeter.</p>' }; s.userData.madeOf = 'cell'; }
    }
    if (M.bact) {
      const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(.6, 10, 8).scale(1, 1, 1.9), smat(0x9fd38a, { roughness: .5 }), M.bact), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < M.bact; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 500; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, M.water ? (r() - .5) * 300 : 3, Math.sin(a) * d), q, new V3(1, 1, 1)); bm.setMatrixAt(i, m4); }
      F.add(bm); F.pick(bm, 'bacterium', 3); bm.userData.info = { title: 'Bacteria', tag: 'Single-celled prokaryotes, ~1–2 µm', body: '<p>Bacteria have no nucleus; their DNA floats in a single loop. Your skin alone carries about a trillion of them, most harmless or helpful.</p>' }; bm.userData.madeOf = 'cell';
    }
    if (M.hyphae) { for (let i = 0; i < M.hyphae; i++) { const pts = []; let p = new V3((r() - .5) * 1200, 20 + r() * 60, (r() - .5) * 1200), d = new V3(gauss(r), gauss(r) * .2, gauss(r)).normalize(); for (let k = 0; k < 12; k++) { pts.push(p.clone()); d.add(new V3(gauss(r), gauss(r) * .2, gauss(r)).multiplyScalar(.3)).normalize(); p = p.clone().addScaledVector(d, 50); } const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 2.5, 6), smat(0xe9e3d0, { roughness: .6 })); F.add(t); F.pick(t, 'hypha', 2); t.userData.info = { title: 'Fungal hyphae', tag: '~5 µm threads', body: '<p>Fungi grow as networks of thread-like cells (mycelium) that digest organic matter and trade nutrients with plant roots.</p>' }; t.userData.madeOf = 'cell'; } }
    if (M.water) {
      F.scene.fog = new THREE.FogExp2(0x2a6f8f, .0018); F.env = { bg: 0x2a6f8f, opaque: true };
      for (let i = 0; i < M.diatoms; i++) { const s = 15 + r() * 40, m = new THREE.Mesh(new THREE.CylinderGeometry(s, s, s * .4, 32), new THREE.MeshStandardMaterial({ color: 0xc8b46a, roughness: .2, transparent: true, opacity: .75 })); m.position.set((r() - .5) * 1100, (r() - .5) * 600, (r() - .5) * 1100); m.rotation.set(r() * 6, r() * 6, 0); F.add(m); F.pick(m, 'diatom', 2); m.userData.info = { title: 'Diatom', tag: 'Algae in glass houses, 20–200 µm', body: '<p>Diatoms build intricate shells of silica (glass). They produce about a fifth of the oxygen made on Earth each year.</p>' }; m.userData.madeOf = 'cell'; }
      const am = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), smat(0x3fa34d, { roughness: .4 }), M.algae), m4 = new THREE.Matrix4();
      for (let i = 0; i < M.algae; i++) { const s = 4 + r() * 8; m4.makeScale(s, s, s).setPosition((r() - .5) * 1100, (r() - .5) * 600, (r() - .5) * 1100); am.setMatrixAt(i, m4); }
      F.add(am); F.pick(am, 'algae', 2); am.userData.info = { title: 'Green algae', tag: 'Single-celled plants, ~5–20 µm', body: '<p>Single-celled green algae (like Chlorella) photosynthesize with the same chlorophyll as land plants — which evolved from green algae.</p>' }; am.userData.madeOf = 'cell';
      const wv = hitSphere(900, 'water', -1); wv.userData.info = { title: 'Liquid water', tag: 'H₂O', body: '<p>At this scale water looks perfectly smooth. Zoom another 100,000 times to see individual molecules.</p>' }; wv.userData.madeOf = 'molecule'; wv.material.side = THREE.BackSide; F.add(wv); F.pickables.push(wv);
    }
    if (M.air) {
      F.env = { bg: 0x9cc8ef };
      const add = (n, col, smin, smax, id, inf) => { for (let i = 0; i < n; i++) { const s = smin + r() * (smax - smin), m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, id === 'pollen' ? 2 : 1), smat(col, { roughness: id === 'droplet' ? .05 : .8, transparent: id === 'droplet', opacity: id === 'droplet' ? .6 : 1 })); m.position.set((r() - .5) * 1400, (r() - .5) * 900, (r() - .5) * 1400); F.add(m); F.pick(m, id, 2); m.userData.info = inf; m.userData.madeOf = id === 'droplet' ? 'water' : 'crystal'; } };
      add(10, 0xa58e6e, 1, 6, 'dust', { title: 'Dust particle', tag: '1–10 µm', body: '<p>Mineral dust, soot and sea salt — aerosols. They seed cloud droplets and scatter sunlight.</p>' });
      add(6, 0xf2c94c, 12, 18, 'pollen', { title: 'Pollen grain', tag: '~25 µm', body: '<p>A pollen grain carries a plant\'s male gametes inside a tough, often spiky shell.</p>' });
      add(14, 0xdff1ff, 5, 12, 'droplet', { title: 'Cloud droplet', tag: '~10 µm', body: '<p>A cloud droplet is about a million times smaller in volume than a raindrop. It takes about a million of them merging to make one raindrop.</p>' });
      const av = hitSphere(900, 'airvol', -1); av.material.side = THREE.BackSide; av.userData.info = { title: 'Air', tag: 'Gas mixture', body: '<p>Zoom about 10,000× more to see individual nitrogen and oxygen molecules.</p>' }; av.userData.madeOf = 'molecule'; F.add(av); F.pickables.push(av);
    }
    F.info = info;
    F.spawn = (T, hint) => {
      const id = hint && hint.id || '';
      if (/microsurface/.test(id) || (!hint && M.ground)) {
        if (M.child === 'cell' || M.child === 'plantcell') return new Frame({ type: 'cell', name: 'Cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone().add(new V3(0, -10, 0)), opts: { type: M.child === 'plantcell' ? 'plant' : 'animal' } });
        if (M.crystal) return crystalFrame(M.crystal, T);
      }
      if (/grain|dust/.test(id)) return crystalFrame(M.crystal || 'quartz', T);
      if (/stoma|diatom|algae|hypha|bacterium|pollen/.test(id)) return new Frame({ type: 'cell', name: 'Cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone(), opts: { type: /stoma|diatom|algae|pollen/.test(id) ? 'plant' : 'animal' } });
      if (/hair/.test(id)) return new Frame({ type: 'mol', name: 'Keratin building block', unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol: 'aa_cys' } });
      if (/water|droplet/.test(id) || M.water) return new Frame({ type: 'liquid', name: 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
      if (/airvol/.test(id) || M.air) return new Frame({ type: 'gas', name: 'Air molecules', unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: T.clone() });
      return null;
    };
  }
};
function crystalFrame(id, T) { return new Frame({ type: 'crystal', name: 'Crystal lattice', unit: 1e-10, radius: 16, r1: 3e-8, spawnD: 1e-9, pos: T.clone(), opts: { id } }); }
/* ---------- landscapes (unit m): biome ground, sky, sun ---------- */
const BIOME = {
  grass: { g: ['#4f8a33', '#5d9a3e', '#6aa848', '#55803a'], trees: 260, sky: 1, micro: 'soil', h: 25 },
  forest: { g: ['#2f5e2a', '#3a6b31', '#294f25'], trees: 1400, sky: 1, micro: 'soil', h: 40 },
  desert: { g: ['#d9b77f', '#e3c48e', '#cfa86c'], dunes: true, sky: 1, micro: 'sand', h: 30 },
  ice: { g: ['#eef6fb', '#dfeef8', '#f7fbff'], sky: 1, micro: 'ice', h: 20 },
  rock: { g: ['#8f8a84', '#a19a90', '#7b746c'], sky: 1, micro: 'rock', h: 120 },
  ocean: { water: true, sky: 1, micro: 'ocean' },
  moonrock: { g: ['#7d7d7d', '#8c8c8c', '#6c6c6c'], craters: true, sky: 0, micro: 'regolith', h: 15 },
  mars: { g: ['#9a4f2c', '#a85a33', '#8a4426'], rocks: true, sky: 2, micro: 'mars', h: 40 },
  venus: { g: ['#8a6a3a', '#7c5e33'], sky: 3, micro: 'rock', h: 20 },
  cloudtops: { water: true, cloud: true, sky: 4, micro: 'air' },
};
const SKYCOL = { 1: [[.2, .45, .86], [.79, .88, .97]], 2: [[.55, .42, .3], [.85, .68, .5]], 3: [[.65, .52, .25], [.85, .72, .4]], 4: [[.55, .6, .75], [.85, .82, .75]] };
function skyDome(F, kind, R) {
  const [top, hor] = SKYCOL[kind] || SKYCOL[1];
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: new V3(0, 1, 0) }, uTop: { value: new V3(...top) }, uHor: { value: new V3(...hor) }, uOpacity: { value: 1 } }, side: THREE.BackSide, depthWrite: false, transparent: true,
    vertexShader: LDV(`varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(`uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHor; uniform float uOpacity; varying vec3 vD; void main(){ float h=max(vD.y,0.); float day=smoothstep(-.15,.12,uSun.y); vec3 c=mix(uHor,uTop,pow(h,.5)); float s=max(dot(normalize(vD),normalize(uSun)),0.);
      vec3 sunset=vec3(1.,.5,.25)*pow(1.-h,6.)*pow(s,4.)*smoothstep(.35,0.,abs(uSun.y)); c=c*day+sunset+vec3(1.,.95,.85)*pow(s,900.)*3.*step(-.02,uSun.y); c=max(c,vec3(.005,.008,.02));
      gl_FragColor=vec4(c,uOpacity*clamp(day*1.4+.05,0.,1.)); }`)
  }));
  F.add(m); return m;
}
function landscapeFrame(biome, pos, quat, body) { return new Frame({ type: 'landscape', name: body ? `${body} surface` : 'Landscape', unit: 1, radius: 4000, r0: 2e-4, r1: 4e4, spawnD: .02, up: new V3(0, 1, 0), maxPolar: Math.PI / 2 - .02, pos: pos.clone(), quat: quat || new THREE.Quaternion(), opts: { biome, body } }); }
FT.landscape = {
  build(F, o) {
    const B = BIOME[o.biome] || BIOME.grass, r = rng(o.biome.length * 31 + 3);
    const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a4a3a, .6); F.add(hemi); const sun = new THREE.DirectionalLight(0xfff1d6, 1.2); F.add(sun); F.add(sun.target);
    const col = new THREE.Color(), gcol = B.g ? B.g.map(c => new THREE.Color(c)) : null;
    const terrain = (Rr, seg) => {
      const geo = new THREE.PlaneGeometry(Rr * 2, Rr * 2, seg, seg); geo.rotateX(-Math.PI / 2); const pa = geo.attributes.position, cols = [];
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), z = pa.getZ(i), dd = Math.hypot(x, z);
        let h = (Math.sin(x * .0021) * Math.cos(z * .0017) + .5 * Math.sin(x * .0063 + 1) * Math.sin(z * .0051)) * (B.h || 0);
        if (B.dunes) h += Math.pow(Math.abs(Math.sin(x * .006 + Math.sin(z * .002) * 2)), 1.5) * 18;
        if (B.craters) [[300, 200, 120], [-800, 400, 300], [100, -900, 200], [-60, -40, 25]].forEach(([cx, cz, cr]) => { const d = Math.hypot(x - cx, z - cz) / cr; if (d < 1.3) h += d < 1 ? -cr * .18 * (1 - d * d) : cr * .06 * (1.3 - d) / .3; });
        h *= smooth(0, 60, dd); // flat where you stand
        pa.setY(i, h - dd * dd / 12742000 * 1); // Earth-curvature drop
        const c = gcol[(Math.floor(Math.abs(Math.sin(x * .013) * Math.cos(z * .011) * 7 + Math.sin(x * .07 + z * .05) * 2)) % gcol.length)]; const v = .85 + .15 * Math.sin(x * .9 + z * 1.3);
        cols.push(c.r * v, c.g * v, c.b * v);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
      return new THREE.Mesh(geo, smat(0xffffff, { vertexColors: true, roughness: .95 }));
    };
    let ground = null;
    if (B.water) {
      const wm = new THREE.Mesh(new THREE.CircleGeometry(4000, 96).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: B.cloud ? 0xd9c7a2 : 0x1b4f7a, roughness: B.cloud ? 1 : .12, metalness: B.cloud ? 0 : .3 })); F.add(wm); ground = wm;
      F.pick(wm, B.cloud ? 'cloudtop' : 'ocean', 1); wm.userData.madeOf = B.cloud ? 'gas' : 'water';
      if (B.cloud) wm.userData.info = { title: 'Cloud tops', tag: 'Giant planet atmosphere', body: '<p>Gas giants have no solid surface: hydrogen and helium get gradually denser with depth until they become liquid and, deeper still, metallic hydrogen. The visible clouds are ammonia ice and ammonium hydrosulfide.</p>' };
    } else {
      ground = terrain(4000, 160); F.add(ground); F.pick(ground, 'ground', 0); ground.userData.madeOf = B.micro;
      ground.userData.info = { title: o.body ? `${o.body} surface` : 'The ground', tag: o.biome, body: `<p>${MICRO[B.micro] ? MICRO[B.micro].blurb : ''}</p>` };
      const near = terrain(60, 120); near.position.y = .02; F.add(near); F.pick(near, 'ground', 0); near.userData = ground.userData;
    }
    if (B.trees) {
      const tr = new THREE.InstancedMesh(new THREE.ConeGeometry(3, 12, 7).translate(0, 8, 0), smat(0x2d5a27, { roughness: .9, flatShading: true }), B.trees), tk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.35, .45, 3, 6).translate(0, 1.5, 0), smat(0x5a3f2a), B.trees), m4 = new THREE.Matrix4();
      for (let i = 0; i < B.trees; i++) { const a = r() * TAU, d = 40 + Math.sqrt(r()) * 3500, s = .7 + r() * .8; m4.makeScale(s, s * (.8 + r() * .5), s).setPosition(Math.cos(a) * d, -d * d / 12742000, Math.sin(a) * d); tr.setMatrixAt(i, m4); tk.setMatrixAt(i, m4); tr.setColorAt(i, col.setHSL(.28 + r() * .06, .45, .18 + r() * .1)); }
      F.add(tr); F.add(tk); F.pick(tr, 'tree', 2); tr.userData.madeOf = 'leaf';
    }
    if (B.rocks) { const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), smat(0x6e3a22, { roughness: 1, flatShading: true }), 400), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); for (let i = 0; i < 400; i++) { const a = r() * TAU, d = 3 + Math.sqrt(r()) * 300, s = .1 + Math.pow(r(), 3) * 1.5; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, s * .3, Math.sin(a) * d), q, new V3(s, s * .7, s)); rm.setMatrixAt(i, m4); } F.add(rm); F.pick(rm, 'rock', 2); rm.userData.madeOf = 'rock'; }
    const sky = B.sky ? skyDome(F, B.sky, 30000) : null;
    if (B.sky) F.env = { opaque: true, bg: 0x000000 };
    F.blurb = o.body && o.body !== 'Earth' ? `Standing on ${o.body}. Lit by the real Sun for the date shown.` : 'Earth\'s surface, lit by the real Sun for this place and time.';
    F.update = () => {
      const s = sunDirIn(F); sun.position.copy(s).multiplyScalar(100); const day = smooth(-.1, .15, s.y); sun.intensity = 1.25 * day; hemi.intensity = .08 + .55 * day;
      if (sky) { sky.material.uniforms.uSun.value.copy(s); F.env.opaque = day > .25; }
    };
    F.spawn = (T, hint) => {
      const id = hint && hint.id || 'ground';
      const kind = id === 'tree' ? 'leaf' : id === 'ocean' ? 'ocean' : id === 'cloudtop' ? 'air' : id === 'rock' ? (o.biome === 'mars' ? 'mars' : 'rock') : B.micro;
      return microFrame(kind, T);
    };
  }
};
/* ---------- region (unit km): a 40-km patch of the surface ---------- */
FT.region = {
  build(F, o) {
    const B = BIOME[o.biome] || BIOME.grass, r = rng(Math.round(o.lat * 100 + o.lon));
    F.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a4a3a, .5)); const sun = new THREE.DirectionalLight(0xffffff, 1.2); F.add(sun);
    const cols = B.water ? ['#1b4f7a', '#21577f', '#1a4a72'] : B.g;
    const t = canvasTex('reg_' + o.biome + (o.isPark ? 'p' : ''), 512, 512, (g, w, h) => {
      const rr = rng(5); g.fillStyle = cols[0]; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = .35; g.beginPath(); g.ellipse(rr() * w, rr() * h, 5 + rr() * 40, 5 + rr() * 30, rr() * 3, 0, TAU); g.fill(); }
      if (o.isPark) { // a city: grey blocks, a river
        g.globalAlpha = 1; for (let i = 0; i < 1800; i++) { const x = rr() * w, y = rr() * h, d = Math.hypot(x - w / 2, y - h / 2); if (d < 28) continue; g.fillStyle = ['#8d8a86', '#7a7773', '#9c978f', '#6d6a66'][i % 4]; g.globalAlpha = .65; g.fillRect(x, y, 3 + rr() * 6, 3 + rr() * 6); }
        g.globalAlpha = 1; g.strokeStyle = '#2d4f66'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, h * .38); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .38 + Math.sin(x * .02) * 18 - (x > w * .4 && x < w * .6 ? 14 : 0)); g.stroke();
        g.fillStyle = '#4f8a33'; g.beginPath(); g.ellipse(w / 2, h / 2, 26, 20, 0, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
    }, {});
    const geo = new THREE.CircleGeometry(40, 128); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: .95, transparent: true, depthWrite: false });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a *= smoothstep(1.0, 0.75, length(vUv-0.5)*2.0);'); };
    const m = new THREE.Mesh(geo, mat); F.add(m); F.pick(m, B.water ? 'ocean' : 'land', 0); m.userData.madeOf = B.micro;
    m.userData.info = { title: o.isPark ? 'Greenwich, London' : 'Earth\'s surface', tag: `${o.lat.toFixed(2)}°, ${o.lon.toFixed(2)}° · ${o.biome}`, body: '<p>A 80-km-wide patch of the surface. Keep zooming to land here.</p>' };
    if (o.isPark) { const pk = markerSprite(0xffd166, 10); pk.position.y = .01; F.add(pk); F.label(pk, 'Greenwich Park', { cls: 'you', always: true }); }
    F.update = () => { const s = sunDirIn(F); sun.position.copy(s).multiplyScalar(100); };
    F.blurb = o.isPark ? 'London from above. The park is where your journey started.' : `Earth's surface at ${o.lat.toFixed(1)}°, ${o.lon.toFixed(1)}° (${o.biome}). Textures at this scale are illustrative.`;
    F.spawn = (T) => landscapeFrame(o.isPark ? 'grass' : o.biome, T.clone().setY(0), null, 'Earth');
    F.spawnD = 2500;
  }
};
/* ---------- the park (unit m): v2 park, real sun ---------- */
v2frame('park', 'life', () => 1, (F, c) => {
  F.env = { opaque: true, bg: 0x000000 };
  F.blurb = 'Greenwich Park, London — you, a dog, trees and a pond, lit by the real Sun for this date and time.';
  const P = c.parts, up0 = F.update;
  F.update = (dt, t) => {
    up0(dt, t);
    const s = sunDirIn(F); c.setSun(s); const day = smooth(-.12, .12, s.y);
    F.env.opaque = cam.D < 300 && day > .2; P.sky.visible = cam.D < 380 && F.alpha > .6;
    if (c.scene.fog) { c.scene.fog.near = Math.max(45, cam.D * .6); c.scene.fog.far = Math.max(170, cam.D * 4); }
  };
  F.spawn = (T, hint) => {
    const id = hint && hint.id || '';
    const kind = id === 'human' ? 'skin' : id === 'dog' ? 'fur' : /tree|flower|leaf/.test(id) ? 'leaf' : id === 'pond' ? 'pond' : /air|cloud|bird|sunSky/.test(id) ? 'air' : id === 'bee' ? 'fur' : 'soil';
    if (id === 'bee' && typeof tissue2Frame === 'function') return tissue2Frame('bee_eye', T);              // a bee opens into its compound eye
    if (kind === 'air') { const n = hint ? hint.point.clone() : T.clone(); return microFrame('air', n); }
    return microFrame(kind, T);
  };
  F.spawnD = 3e-3;
});
/* ---------- black hole at the galactic center (unit 1e10 m) ---------- */
v2frame('sgrA', 'blackhole', () => .6, (F) => { F.blurb = 'Sagittarius A*: 4.3 million Suns of mass inside an event horizon 24 million km across. (Accretion flow shown brighter than reality.)'; });
