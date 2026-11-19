'use strict';
/* ================= MATTER & LIFE FRAMES (true sizes) ================= */
const ELJ = {}; // symbol → elements.json record
const SUBCH = '₀₁₂₃₄₅₆₇₈₉', SUPCH = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const toSub = s => String(s).replace(/\d/g, d => SUBCH[d]), toSup = s => String(s).replace(/\d/g, d => SUPCH[d]);
/* electron configuration with superscripts and the count written out: "1s" -> 1s¹, "[He] 2s2 2p2" -> [He] 2s² 2p² */
function fmtConfig(c) { return String(c || '—').replace(/(\d[spdf])(\d*)/g, (m, o, n) => o + toSup(n || '1')); }
function elInfo(sym) {
  const e = ELJ[sym]; if (!e) return { title: sym, tag: 'Element', body: '' };
  const f = [['Atomic number', e.Z], ['Atomic mass', `${(+e.mass).toFixed(3)} u`], ['Electron configuration', fmtConfig(e.config)]];
  if (e.radius_vdw_pm) f.push(['Van der Waals radius', `≈ ${Math.round(e.radius_vdw_pm)} pm (values differ a little between sources)`]);
  if (e.electronegativity) f.push(['Electronegativity', e.electronegativity]);
  if (e.ionization_eV) f.push(['First ionization energy', `${(+e.ionization_eV).toFixed(2)} eV`]);
  if (e.phase_stp) f.push(['State at room temperature', e.phase_stp]);
  if (e.melt_K) f.push(['Melts at', `${Math.round(e.melt_K)} K`]);
  if (e.discovered) f.push(['Discovered', e.discovered]);
  return { title: `${e.name} atom (${e.symbol})`, tag: `${e.category || 'Element'} · group ${e.group || '—'}, period ${e.period}`, body: `<p>${e.summary || ''}</p>`, facts: f };
}
const elColor = s => new THREE.Color(ELJ[s] && ELJ[s].color_cpk ? ELJ[s].color_cpk : '#ff66cc');
const elVdw = s => (ELJ[s] && ELJ[s].radius_vdw_pm ? Math.round(ELJ[s].radius_vdw_pm) : 170) / 100; // Å
const elHex = s => '#' + elColor(s).getHexString();
function colorKey(syms) { return '<p class="mini">Colours (a convention, atoms have no colour): ' + [...new Set(syms)].map(s => `<span style="color:${elHex(s)};text-shadow:0 0 1px #345">●</span> ${(ELJ[s] || {}).name || s}`).join(', ') + '.</p>'; }
/* Shannon (1976) effective ionic radii, 6-coordinate, in Å (Wikipedia "Ionic radius", table of Shannon values) */
const IONIC_R = { Na: 1.02, Cl: 1.81, Ca: 1.00, F: 1.33, O: 1.40, Mg: .72, Si: .40, Ti: .605, Fe: .645 };
const CRYSTAL_IONIC = { halite: ['Na', 'Cl'], fluorite: ['Ca', 'F'], hematite: ['Fe', 'O'], rutile: ['Ti', 'O'], forsterite: ['Mg', 'Si', 'O'] };
const CRYSTAL_METAL = ['iron_bcc', 'copper_fcc', 'gold_fcc', 'aluminium_fcc', 'magnetite'];
/* formula as chemists write it: subscripts, charge as a superscript, common small molecules in conventional order */
function molFormula(f) {
  let ch = 0, core = String(f || ''); const m = /([+-])(\d*)$/.exec(core);
  if (m) { ch = (m[1] === '-' ? -1 : 1) * (m[2] ? +m[2] : 1); core = core.slice(0, m.index); }
  const CONV = { H3N: 'NH₃', O2S: 'SO₂', CHN: 'HCN', H4N: 'NH₄', H2O4S: 'H₂SO₄', ClH: 'HCl', FH: 'HF', H2S: 'H₂S', NO2: 'NO₂', CHN: 'HCN' };
  let t = CONV[core] || toSub(core);
  if (ch) t += toSup(Math.abs(ch) > 1 ? Math.abs(ch) : '') + (ch > 0 ? '⁺' : '⁻');
  return { text: t, charge: ch };
}
function methodText(method) {
  const m = String(method || 'MMFF94').replace(/(\([^)]*\))\s*\1/g, '$1');
  if (/experimental/i.test(m)) return 'Geometry from experiment.';
  if (/idealized/i.test(m)) return 'Idealised shape, not a measured structure.';
  if (/placed|free-base/i.test(m)) return 'Approximate: the ring comes from a force-field calculation and the metal atom is placed by hand.';
  if (/docking/i.test(m)) return 'Approximate: the shape comes from a docking calculation.';
  if (/UFF/i.test(m)) return 'Approximate: a force-field shape (UFF) with some bond lengths rescaled.';
  return `Approximate: a computed shape (RDKit toolkit, ${m} force field), close to but not exactly the measured structure.`;
}
const MOL_GROUPS = { amino_acid: 'Amino acids', cofactor: 'Cofactors and vitamins', drug: 'Medicines', gas: 'Small molecules (gases, water, others)', hormone_neuro: 'Hormones and neurotransmitters', inorganic: 'Inorganic', lipid: 'Lipids', mineral_unit: 'Mineral building blocks', nucleotide: 'Nucleotides', organic: 'Other organic molecules', pigment: 'Pigments', polymer: 'Polymer units', sugar: 'Sugars' };
/* --- instanced atoms + bonds (Å units) ---
   o.style 'bs' (ball and stick: balls at a quarter of their van der Waals radius) or 'sf' (space-filling, true radius)
   o.radii {sym: Å} sets the radius instead (ions); o.noBonds draws no sticks; o.partOf names the molecule for atom cards */
function atomSet(F, parent, atoms, bonds, o = {}) {
  const style = o.style || 'bs', grp = new THREE.Group(); parent.add(grp);
  const bySym = {}; atoms.forEach((a, i) => (bySym[a[0]] = bySym[a[0]] || []).push(i));
  const sg = new THREE.SphereGeometry(1, o.lowpoly ? 10 : 20, o.lowpoly ? 8 : 14), m4 = new THREE.Matrix4(), meshes = [];
  for (const s in bySym) {
    const idx = bySym[s], mesh = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: elColor(s), emissive: elColor(s).multiplyScalar(.28), roughness: .4, metalness: 0 }), idx.length);
    const rad = o.radii && o.radii[s] ? o.radii[s] * (style === 'sf' ? 1 : (o.ionScale || .5)) : elVdw(s) * (style === 'sf' ? 1 : .26);
    idx.forEach((ai, k) => { const a = atoms[ai]; m4.makeScale(rad, rad, rad).setPosition(a[1], a[2], a[3]); mesh.setMatrixAt(k, m4); });
    mesh.userData = {
      id: 'atom', priority: 3, madeOf: 'atom', sym: s,
      infoFn: () => { const e = elInfo(s); if (o.partOf) e.body += `<p class="mini">${o.partOf}</p>`; return e; },
      center: h => { const a = atoms[idx[h.hit.instanceId]]; return new V3(a[1], a[2], a[3]).applyMatrix4(grp.matrixWorld).add(h.frame.C); },
      radius: () => rad
    };
    mesh.userData.atomAt = id => atoms[idx[id]];
    grp.add(mesh); F.pickables.push(mesh); meshes.push(mesh);
  }
  if (bonds && bonds.length && style !== 'sf' && !o.noBonds) {
    // each bond is drawn as 1, 2 or 3 parallel sticks (order 1, 2, 3); aromatic and resonance bonds (1 < order < 2) as a thick plus a thin stick
    const adj = atoms.map(() => []); bonds.forEach(([i, j]) => { adj[i].push(j); adj[j].push(i); });
    const A = i => new V3(atoms[i][1], atoms[i][2], atoms[i][3]);
    const plan = bonds.map(([i, j, ord]) => ord >= 2.5 ? [[-.22, .065], [0, .065], [.22, .065]] : ord >= 1.95 ? [[-.13, .07], [.13, .07]] : ord > 1.05 ? [[-.07, .09], [.2, .04]] : [[0, .11]]);
    const total = plan.reduce((s, p) => s + p.length * 2, 0);
    const cg = new THREE.CylinderGeometry(1, 1, 1, 8, 1); cg.translate(0, .5, 0);
    const bm = new THREE.InstancedMesh(cg, new THREE.MeshStandardMaterial({ roughness: .5 }), total), q = new THREE.Quaternion(), up = new V3(0, 1, 0), bondOf = [];
    let k = 0;
    bonds.forEach(([i, j, ord], bi) => {
      const a = A(i), b = A(j), dir = b.clone().sub(a).normalize(), mid = a.clone().lerp(b, .5);
      let perp = null;
      for (const [c0, nb] of [[a, adj[i]], [b, adj[j]]]) { for (const n of nb) { if (n === i || n === j) continue; const v = A(n).sub(c0); v.addScaledVector(dir, -v.dot(dir)); if (v.length() > .2) { perp = v.normalize(); break; } } if (perp) break; }
      if (!perp) perp = new V3(0, 0, 1).cross(dir).length() > .1 ? new V3(0, 0, 1).cross(dir).normalize() : new V3(1, 0, 0).cross(dir).normalize();
      plan[bi].forEach(([off, rad]) => {
        [[a, atoms[i][0]], [b, atoms[j][0]]].forEach(([p, s]) => { const pp = p.clone().addScaledVector(perp, off), d = mid.clone().addScaledVector(perp, off).sub(pp), L = d.length(); q.setFromUnitVectors(up, d.normalize()); m4.compose(pp, q, new V3(rad, L, rad)); bm.setMatrixAt(k, m4); bm.setColorAt(k, elColor(s)); bondOf[k] = bi; k++; });
      });
    });
    grp.add(bm);
    bm.userData = { id: 'bond', priority: 1, infoFn: h => bondCard(atoms, bonds[bondOf[h.hit.instanceId] || 0], o) }; F.pickables.push(bm);
  }
  grp.userData.meshes = meshes;
  return grp;
}
function bondCard(atoms, b, o) {
  const [i, j, ord] = b, sa = atoms[i][0], sb = atoms[j][0], L = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]);
  const names = `${(ELJ[sa] || {}).name || sa} and ${(ELJ[sb] || {}).name || sb}`;
  const kind = o.contact ? 'contact' : ord >= 2.5 ? 'triple' : ord >= 1.95 ? 'double' : ord > 1.05 ? 'delocalised' : 'single';
  const TXT = {
    contact: 'A stick between nearest neighbours in the crystal. It marks which atoms touch; it is not a separate bond with its own electron pair.',
    single: 'One shared pair of electrons (2 electrons) holds these two atoms together.',
    double: 'Two shared pairs of electrons (4 electrons): shorter and stronger than a single bond, and it cannot twist freely.',
    triple: 'Three shared pairs of electrons (6 electrons): the shortest and strongest of the three kinds, as in nitrogen gas, N₂.',
    delocalised: 'A bond between single and double: the electrons are shared over several atoms (as in benzene or the carbonate ion), so every such bond is the same. It is drawn as a thick stick plus a thin one.',
  };
  return { title: kind === 'contact' ? 'Neighbouring atoms in a crystal' : `${kind[0].toUpperCase() + kind.slice(1)} bond`, tag: `Chemical bond · ${sa}–${sb}`, body: `<p>${TXT[kind]}</p>`, facts: [['Atoms', names], ['Length in this model', `${L.toFixed(2)} Å (${(L / 10).toFixed(3)} nm)`], ['Bond order', ord]] };
}
function spawnAtomFrom(F, T, hint, unitScale) {
  if (!hint || !hint.obj || !hint.obj.userData.sym || hint.hit == null || hint.hit.instanceId == null) {
    // nearest atom to T among this frame's atom meshes: never run on into empty space
    let best = null, bd = Infinity;
    F.pickables.forEach(m => { if (!m.isInstancedMesh || !m.userData.sym) return; const p = new V3(), M = new THREE.Matrix4(); for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); p.setFromMatrixPosition(M).applyMatrix4(m.parent.matrixWorld).add(F.C || new V3()); const d = p.distanceTo(T); if (d < bd) { bd = d; best = { sym: m.userData.sym, p: p.clone() }; } } });
    if (!best || bd > 5) return null;
    return atomFrame(best.sym, best.p, unitScale);
  }
  const p = hint.obj.userData.center({ hit: hint.hit, frame: F });
  return atomFrame(hint.obj.userData.sym, p, unitScale);
}
function atomFrame(sym, pos, unitScale) { // unitScale: parent units per Å
  return new Frame({ type: 'atom', pinned: true, name: `${(ELJ[sym] || {}).name || sym} atom`, unit: 1e-12, radius: 600, r0: 0, r1: 2.5e-9, spawnD: 2e-13, pos: pos.clone(), opts: { el: sym } });
}
function refreshCaption(F) { if (typeof capFrame !== 'undefined' && capFrame === F) capFrame = null; }
/* ---------- molecule from data/molecules (unit Å) ---------- */
const MOLIDX = { list: null };
FT.mol = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x302040, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 8, 6); F.add(dl);
    const holder = new THREE.Group(); F.add(holder);
    let style = store.get('molStyle', 'bs'), sel = null;
    const STYLE_NOTE = {
      bs: 'Ball and stick: the atoms are drawn at a quarter of their true size so the bonds show; bond lengths are true. Double and triple bonds are 2 and 3 sticks. Colours are the CPK convention, not real colours.',
      sf: 'Space-filling: each atom is drawn at its van der Waals radius, roughly the reach of its electron cloud, so bonded atoms overlap. Colours are the CPK convention, not real colours.',
    };
    const load = (id, fit) => getJSON('data/molecules_all.json').then(ALL => ALL.mols[id] || ALL.mols.water).then(M => {
      if (!F.built) return;
      holder.clear(); F.pickables.length = 0; F.mats = null;
      const c = new V3(); M.atoms.forEach(a => c.add(new V3(a[1], a[2], a[3]))); c.divideScalar(M.atoms.length);
      const atoms = M.atoms.map(a => [a[0], a[1] - c.x, a[2] - c.y, a[3] - c.z, a[4]]);
      F.molAtoms = atoms; F.mol = M;
      const fm = molFormula(M.formula), ionic = id === 'nacl_pair';
      const RES = { carbonate: 1.33, nitrate: 1.33, ozone: 1.5 };
      const bonds = RES[id] ? M.bonds.map(b => [b[0], b[1], RES[id]]) : M.bonds;
      const g = atomSet(F, holder, atoms, bonds, { style, partOf: `Part of ${M.name}, ${fm.text}. Click the molecule's name for its card.`, radii: ionic ? { Na: IONIC_R.Na, Cl: IONIC_R.Cl } : null });
      const syms = atoms.map(a => a[0]);
      let rmax = 0; atoms.forEach(a => rmax = Math.max(rmax, Math.hypot(a[1], a[2], a[3])));
      const info = {
        title: M.name, tag: `Molecule · ${fm.text}${fm.charge ? ' · an ion' : ''}`,
        body: `<p>${M.notes || ''}</p><p class="mini">${methodText(M.method)} ${ionic ? 'The two balls are drawn with their ionic radii (Na⁺ about 102 pm, Cl⁻ about 181 pm, Shannon 1976), at half size in ball and stick.' : ''} ${RES[id] ? 'The real bonds are all equal (resonance); the geometry here is only approximate.' : ''}</p>${colorKey(syms)}`,
        facts: [['Formula', fm.text], ['Net charge', fm.charge ? (fm.charge > 0 ? '+' : '−') + Math.abs(fm.charge) : '0 (neutral)'], ['Molar mass', `${(+M.mw).toFixed(2)} g/mol`], ['Atoms', M.atoms.length], ['Size', `≈ ${(2 * rmax / 10 + .3).toFixed(1)} nm across`]]
      };
      g.userData.meshes.forEach(m => m.userData.molInfo = info);
      F.info = info; F.name = o.cname || (o.stand ? 'Example molecule: ' + M.name : M.name); F.blurb = `${o.cname ? o.cname + '. ' : o.stand ? 'An example molecule that stands in for the topic you came from (the topic is bigger than one molecule). ' : ''}${M.name} (${fm.text}): ${M.atoms.length} atoms, about ${(2 * rmax / 10 + .3).toFixed(1)} nm across.`; F.note = STYLE_NOTE[style];
      if (F.molLabel) { F.molLabel.el.remove(); F.labels.splice(F.labels.indexOf(F.molLabel), 1); }
      const lo = new THREE.Object3D(); lo.position.set(0, rmax + 2, 0); lo.userData = { id: 'moleculecard', info, noZoom: true }; holder.add(lo); F.molLabel = F.label(lo, M.name);
      if (fit && cam.A === F) cam.D = Math.max(rmax * 2.6e-10, 1.2e-9);
      if (o.onLoad) o.onLoad(F);
      F.opts.mol = id; if (sel && sel.value !== id) sel.value = id;
      refreshCaption(F);
    });
    load(o.mol || 'water');
    if (!o.fixed) {
      sel = document.createElement('select'); sel.className = 'molsel'; sel.title = 'Choose any of 250 molecules'; sel.style.maxWidth = '46vw';
      getJSON('data/molecules_all.json').then(ALL => ALL.index).then(L => {
        const cats = {}; L.forEach(m => (cats[m.category] = cats[m.category] || []).push(m));
        sel.innerHTML = Object.keys(cats).sort((a, b) => (MOL_GROUPS[a] || a).localeCompare(MOL_GROUPS[b] || b)).map(k => `<optgroup label="${MOL_GROUPS[k] || k}">${cats[k].sort((a, b) => a.name.localeCompare(b.name)).map(m => `<option value="${m.id}" ${m.id === (o.mol || 'water') ? 'selected' : ''}>${m.name}</option>`).join('')}</optgroup>`).join('');
      });
      sel.onchange = () => load(sel.value, true);
      uiEl(sel);
    }
    seg([['bs', 'Ball and stick'], ['sf', 'Space-filling']], style, k => { style = k; store.set('molStyle', k); load(F.opts.mol); });
    F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
    F.update = (dt) => { holder.rotation.y += dt * .05 * (cam.D > 3e-9 ? 1 : 0); };
  }
};
/* ---------- crystal lattice (unit Å) ---------- */
FT.crystal = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x04070f };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x302040, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 8, 6); F.add(dl);
    const holder = new THREE.Group(); F.add(holder); let mode = 'small', CR = null, myLabels = [];
    const draw = () => {
      holder.clear(); F.pickables.length = 0; F.mats = null; myLabels.forEach(l => { l.el.remove(); const i = F.labels.indexOf(l); if (i >= 0) F.labels.splice(i, 1); }); myLabels = [];
      const X = CR.find(c => c.id === o.id) || CR[0], L = X.lattice.map(v => new V3(...v)), R = mode === 'big' ? 13 : 8, atoms = [];
      const n = Math.ceil(13 / Math.min(...L.map(v => v.length()))) + 1;
      const ctr = new V3().add(L[0]).add(L[1]).add(L[2]).multiplyScalar(.5);
      const inv = new THREE.Matrix4().makeBasis(L[0], L[1], L[2]).invert(), fr = new V3();
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++) X.basis.forEach(([s, fx, fy, fz]) => {
        const p = L[0].clone().multiplyScalar(i + fx).add(L[1].clone().multiplyScalar(j + fy)).add(L[2].clone().multiplyScalar(k + fz)).sub(ctr);
        if (mode === 'cell') { fr.copy(p).add(ctr).applyMatrix4(inv); if (fr.x < -1e-3 || fr.y < -1e-3 || fr.z < -1e-3 || fr.x > 1 + 1e-3 || fr.y > 1 + 1e-3 || fr.z > 1 + 1e-3) return; atoms.push([s, p.x, p.y, p.z]); }
        else if (p.length() < R) atoms.push([s, p.x, p.y, p.z]);
      });
      const ionic = CRYSTAL_IONIC[X.id], metal = CRYSTAL_METAL.includes(X.id), noBonds = !!ionic || metal;
      const bonds = [], cut = X.bond_cutoff || 2.5;
      if (!noBonds) for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const d = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]); if (d < cut && !(atoms[i][0] === 'H' && atoms[j][0] === 'H')) bonds.push([i, j, 1]); }
      const radii = ionic ? Object.fromEntries(ionic.map(s => [s, IONIC_R[s]])) : null;
      const g = atomSet(F, holder, atoms, bonds, { style: 'bs', lowpoly: atoms.length > 1500, radii, noBonds, contact: true, partOf: `Part of the ${X.name} crystal.` });
      // ice: the hydrogen bonds between molecules (O···H about 1.8 Å), dashed
      if (X.id === 'ice_ih') {
        const lp = []; for (let i = 0; i < atoms.length; i++) { if (atoms[i][0] !== 'H') continue; for (let j = 0; j < atoms.length; j++) { if (atoms[j][0] !== 'O') continue; const d = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]); if (d > 1.4 && d < 2.1) lp.push(atoms[i][1], atoms[i][2], atoms[i][3], atoms[j][1], atoms[j][2], atoms[j][3]); } }
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
        const hb = new THREE.LineSegments(lg, new THREE.LineDashedMaterial({ color: 0x7fd8ff, dashSize: .2, gapSize: .15, transparent: true, opacity: .8 })); hb.computeLineDistances(); holder.add(hb); F.pick(hb, 'hbond_water', 1.5);
      }
      // unit cell outline: thick bright edges
      const c0 = ctr.clone().negate(), corners = [];
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) corners.push(c0.clone().add(L[0].clone().multiplyScalar(a)).add(L[1].clone().multiplyScalar(b)).add(L[2].clone().multiplyScalar(c)));
      const E = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]], boxG = new THREE.Group(), em = new THREE.MeshBasicMaterial({ color: 0xffe08a });
      E.forEach(([a, b]) => { const d = corners[b].clone().sub(corners[a]), m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, d.length(), 6), em); m.position.copy(corners[a]).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); boxG.add(m); });
      holder.add(boxG); myLabels.push(F.label(boxG, 'One unit cell (the repeating block)', { offset: corners[7].clone() }));
      const ionNote = ionic ? 'Ions are drawn at half their true radius (Shannon 1976 effective radii, 6-coordinate) so you can see into the lattice; the big ones are the negative ions. No sticks: ionic crystals are held by attraction between ions, not by bonds between pairs.' : metal ? 'Atoms of a metal share their outer electrons across the whole crystal, so no sticks are drawn between pairs.' : noBonds ? '' : 'Sticks join nearest neighbours. Atoms are drawn at a quarter of their van der Waals radius.';
      const info = { title: X.name, tag: `Crystal · ${toSub(X.formula)}`, body: `<p>${X.notes || ''}</p><p class="mini">Atoms sit on a repeating 3-D lattice. The yellow box is one unit cell; a real crystal is this box copied about 10²⁰ times. ${ionNote}</p>${colorKey(atoms.map(a => a[0]))}`, facts: [['Formula', toSub(X.formula)], ['Cell edges', L.map(v => v.length().toFixed(2) + ' Å').join(' × ')], ['Atoms drawn', atoms.length]] };
      F.info = info; F.name = X.name; F.blurb = `${X.name}: ${mode === 'cell' ? 'the atoms of one unit cell' : 'a small piece of the crystal'}, at true atomic positions (ångström units).`;
      F.note = (ionic ? 'Ions at half their real radius. ' : '') + (noBonds ? 'No sticks between atoms. ' : 'Sticks join nearest neighbours. ') + 'Colours are the CPK convention.';
      g.userData.meshes.forEach(m => m.userData.molInfo = info);
      refreshCaption(F);
    };
    getJSON('data/crystals.json').then(C => { CR = C; if (!F.built) return; draw();
      const sl = document.createElement('select'); sl.className = 'molsel'; sl.title = 'Choose a crystal'; sl.style.maxWidth = '46vw';
      sl.innerHTML = CR.map(c => `<option value="${c.id}" ${c.id === o.id ? 'selected' : ''}>${c.name}</option>`).join('');
      sl.onchange = () => { o.id = sl.value; F.opts.id = sl.value; draw(); };
      const mg = seg([['cell', 'One unit cell'], ['small', 'Small crystal'], ['big', 'Larger crystal']], mode, k => { mode = k; draw(); });
      uiEl(sl); uiEl(mg); if (typeof uiFrame !== 'undefined' && uiFrame === F) { uiFrame = null; }
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
    const N = mols.length, th = 104.52 / 2 * Math.PI / 180, OH = .9572, HA = [new V3(Math.sin(th) * OH, Math.cos(th) * OH, 0), new V3(-Math.sin(th) * OH, Math.cos(th) * OH, 0)];
    const quats = mols.map(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6))), Hs = mols.map(() => [new V3(), new V3()]);
    const setH = i => { for (let k = 0; k < 2; k++) Hs[i][k].copy(HA[k]).applyQuaternion(quats[i]).add(mols[i]); };
    mols.forEach((_, i) => setH(i));
    const nb = mols.map((p, i) => { const l = []; mols.forEach((q, j) => { if (i !== j && p.distanceTo(q) < 3.7) l.push(j); }); return l; });
    // hydrogen bond between donor i (its hydrogen) and acceptor j (its oxygen): H···O under 2.4 Å and O–H···O angle over 140°
    const _a = new V3(), _b = new V3();
    const bond = (i, j) => { let n = 0; for (let k = 0; k < 2; k++) { const d = Hs[i][k].distanceTo(mols[j]); if (d < 2.4) { _a.subVectors(mols[i], Hs[i][k]); _b.subVectors(mols[j], Hs[i][k]); if (_a.angleTo(_b) > 140 * Math.PI / 180) n++; } } return n; };
    const count = i => { let n = 0; nb[i].forEach(j => { n += bond(i, j) + bond(j, i); }); return n; };
    // keep the random positions (true density) and tune only the orientations so that molecules form hydrogen bonds
    const rr = rng(77);
    for (let sweep = 0; sweep < 40; sweep++) for (let i = 0; i < N; i++) {
      const q0 = quats[i].clone(); let best = count(i), bq = q0;
      for (let t = 0; t < 8; t++) { quats[i].setFromEuler(new THREE.Euler(rr() * 6, rr() * 6, rr() * 6)); setH(i); const c = count(i); if (c > best) { best = c; bq = quats[i].clone(); } }
      quats[i].copy(bq); setH(i);
    }
    const atoms = [], bonds = [];
    mols.forEach((p, i) => { const a0 = atoms.length; atoms.push(['O', p.x, p.y, p.z], ['H', Hs[i][0].x, Hs[i][0].y, Hs[i][0].z], ['H', Hs[i][1].x, Hs[i][1].y, Hs[i][1].z]); bonds.push([a0, a0 + 1, 1], [a0, a0 + 2, 1]); });
    const g = atomSet(F, F.root, atoms, bonds, { style: 'bs', lowpoly: true, partOf: 'Part of a water molecule in a model of liquid water.' });
    const lp = []; let nbond = 0, inner = 0, innerN = 0;
    for (let i = 0; i < N; i++) { const interior = mols[i].length() < R - 4; if (interior) innerN++; nb[i].forEach(j => { for (let k = 0; k < 2; k++) { const d = Hs[i][k].distanceTo(mols[j]); if (d < 2.4) { _a.subVectors(mols[i], Hs[i][k]); _b.subVectors(mols[j], Hs[i][k]); if (_a.angleTo(_b) > 140 * Math.PI / 180) { lp.push(Hs[i][k].x, Hs[i][k].y, Hs[i][k].z, mols[j].x, mols[j].y, mols[j].z); nbond++; if (interior) inner++; } } } }); }
    const perMol = innerN ? 2 * inner / innerN : 0;   // each bond counts once for its donor and once for its acceptor, but inner counts donors only: 2x gives both ends
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const hb = new THREE.LineSegments(lg, new THREE.LineDashedMaterial({ color: 0x7fd8ff, dashSize: .2, gapSize: .15, transparent: true, opacity: .8 })); hb.computeLineDistances(); F.add(hb); F.pick(hb, 'hbond_water', 1.5);
    F.label(hb, 'Hydrogen bonds (dashed)', { offset: new V3(0, R + 1, 0) });
    const info = { title: 'Liquid water', tag: 'H₂O · about 1 g/cm³', body: `<p>Each water molecule is a bent H–O–H unit about 0.28 nm across. In the liquid they are packed almost shoulder to shoulder (33 molecules per cubic nanometer) and keep forming and breaking hydrogen bonds, each lasting only about ten trillionths of a second.</p><p class="mini">This is a model, not a snapshot of a simulation: positions are random at the right density, and each molecule was turned to make as many hydrogen bonds as it can. In this picture the molecules away from the edge average about ${perMol.toFixed(1)} hydrogen bonds each (counting a bond for both partners). For comparison, simulations of real water give about 3.5 (the counting rules differ, so compare only roughly); real water also has a tetrahedral order that this random arrangement lacks. Pure water is shown; pond, sea and cell water also hold dissolved salts and molecules.</p>`, facts: [['Molecules shown', N], ['Density', '≈ 33.4 molecules/nm³'], ['O–H bond', '0.957 Å'], ['H–O–H angle', '104.5°'], ['Hydrogen bonds drawn', nbond]] };
    g.userData.meshes.forEach(m => m.userData.molInfo = info); F.info = info;
    F.blurb = 'Liquid water: a ball about 3 nm across cut from the bulk, every atom shown.';
    F.note = 'Model, not a simulation: random positions at the true density (33 molecules per nm³), orientations tuned to form hydrogen bonds. Real molecules never stop moving. Atoms are drawn at a quarter of their true size so the bonds show.';
    F.spawn = (T, hint) => spawnAtomFrom(F, T, hint, 1e-2);
  }
};
/* ---------- gas (air, or a gas giant's hydrogen and helium) — unit nm ---------- */
FT.gas = {
  build(F, o) {
    F.env = { opaque: true, bg: 0x061022 };
    F.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, .9)); const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(5, 8, 6); F.add(dl);
    const giant = o.air === 'giant';
    const r = rng(3), R = 22, n = Math.floor(4 / 3 * Math.PI * R ** 3 * .0246);
    // humid air at sea level: about 1% water vapour, the rest dry air (N2 78.08%, O2 20.95%, Ar 0.93%, CO2 about 0.04%)
    const mix = giant ? [['H2', .898], ['He', .102]] : [['N2', .7808 * .99], ['O2', .2095 * .99], ['Ar', .0093 * .99], ['CO2', .0004 * .99], ['H2O', .01]];
    const mols = [], sumW = mix.reduce((s, m) => s + m[1], 0);
    for (let i = 0; i < n; i++) {
      let u = r() * sumW, k = 0; while (k < mix.length - 1 && u > mix[k][1]) { u -= mix[k][1]; k++; }
      const p = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(R * Math.cbrt(r())), d = new V3(gauss(r), gauss(r), gauss(r)).normalize(), v = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.3);
      mols.push({ kind: mix[k][0], p, d, v, q: new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d) });
    }
    const counts = {}; mols.forEach(m => counts[m.kind] = (counts[m.kind] || 0) + 1);
    const sg = new THREE.SphereGeometry(1, 12, 8), meshes = {};
    const mk = (s, cnt) => { const m = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: elColor(s), emissive: elColor(s).multiplyScalar(.35), roughness: .5 }), Math.max(cnt, 1)); m.count = 0; F.add(m); meshes[s] = m; return m; };
    const need = { N: (counts.N2 || 0) * 2, O: (counts.O2 || 0) * 2 + (counts.CO2 || 0) * 2 + (counts.H2O || 0), Ar: counts.Ar || 0, C: counts.CO2 || 0, H: (counts.H2O || 0) * 2 + (counts.H2 || 0) * 2, He: counts.He || 0 };
    for (const s in need) if (need[s] > 0) mk(s, need[s]);
    const hA = [new V3(Math.sin(52.26 * Math.PI / 180) * .0957, Math.cos(52.26 * Math.PI / 180) * .0957, 0), new V3(-Math.sin(52.26 * Math.PI / 180) * .0957, Math.cos(52.26 * Math.PI / 180) * .0957, 0)];
    const m4 = new THREE.Matrix4(), place = () => {
      for (const s in meshes) meshes[s].count = 0;
      const put = (s, p, rad) => { const m = meshes[s]; m4.makeScale(rad, rad, rad).setPosition(p); m.setMatrixAt(m.count++, m4); };
      mols.forEach(m => {
        const h = m.d;
        if (m.kind === 'N2') { put('N', m.p.clone().addScaledVector(h, .055), .155); put('N', m.p.clone().addScaledVector(h, -.055), .155); }
        else if (m.kind === 'O2') { put('O', m.p.clone().addScaledVector(h, .06), .152); put('O', m.p.clone().addScaledVector(h, -.06), .152); }
        else if (m.kind === 'H2') { put('H', m.p.clone().addScaledVector(h, .037), .11); put('H', m.p.clone().addScaledVector(h, -.037), .11); }
        else if (m.kind === 'Ar') put('Ar', m.p, .188);
        else if (m.kind === 'He') put('He', m.p, .14);
        else if (m.kind === 'CO2') { put('C', m.p, .17); put('O', m.p.clone().addScaledVector(h, .116), .152); put('O', m.p.clone().addScaledVector(h, -.116), .152); }
        else { put('O', m.p, .152); put('H', m.p.clone().add(hA[0].clone().applyQuaternion(m.q)), .11); put('H', m.p.clone().add(hA[1].clone().applyQuaternion(m.q)), .11); }
      });
      for (const s in meshes) { meshes[s].instanceMatrix.needsUpdate = true; meshes[s].computeBoundingSphere && meshes[s].computeBoundingSphere(); }
    };
    place();
    const cs = k => counts[k] || 0;
    const info = giant
      ? { title: 'Hydrogen and helium gas', tag: 'The air of a gas giant', body: `<p>The air of Jupiter and Saturn is mostly hydrogen and helium: about 90% H₂ molecules and 10% helium atoms by number in Jupiter (NASA planetary fact sheet). Uranus and Neptune also hold a few percent methane (CH₄), not drawn here.</p><p class="mini">Model: random positions and orientations, drawn at the same number density as air at sea level on Earth (0.025 molecules per nm³) so the pictures can be compared. The real density at a giant's cloud tops is different. Molecules are drawn at true size; motion is slowed about a trillion times.</p>`, facts: [['Molecules shown', n], ['H₂ : He', `${cs('H2')} : ${cs('He')}`], ['Mean spacing (as drawn)', '≈ 3.4 nm']] }
      : { title: 'Air', tag: 'A gas mixture at sea level', body: `<p>Air is mostly empty space. At sea level and 25 °C a cubic nanometer holds on average just 0.025 molecules, so neighbours are about 3.4 nm apart, ten times the size of a molecule. About 78% nitrogen (N₂), 21% oxygen (O₂), 0.9% argon, about 1% water vapour in humid air, and a trace of CO₂ (about 0.04%, so usually none in a view this small).</p><p class="mini">Model: random positions and orientations at the true density, a frozen snapshot. Molecules are drawn at true size. A real N₂ molecule moves about 475 m/s (calculated for 25 °C) and travels about 68 nm between collisions; motion here is slowed about a trillion times.</p>`, facts: [['Molecules shown', n], ['N₂ : O₂ : Ar : H₂O : CO₂', `${cs('N2')} : ${cs('O2')} : ${cs('Ar')} : ${cs('H2O')} : ${cs('CO2')}`], ['Mean spacing', '≈ 3.4 nm'], ['Mean free path', '≈ 68 nm']] };
    for (const s in meshes) { const m = meshes[s]; m.userData = { id: 'gasmol', priority: 3, sym: s, infoFn: () => info, madeOf: 'molecule', center: h => { const M = new THREE.Matrix4(); m.getMatrixAt(h.hit.instanceId, M); return new V3().setFromMatrixPosition(M).add(h.frame.C); }, radius: () => .3 }; F.pickables.push(m); }
    F.info = info; F.name = giant ? 'Hydrogen and helium gas' : 'Air molecules';
    F.blurb = giant ? 'Hydrogen and helium, the gas of a giant planet, at the scale of molecules.' : 'Air at the scale of molecules: mostly empty space.';
    F.note = 'Model: random snapshot at true density and true molecule size, motion slowed about a trillion times. Colours are the CPK convention.' + (giant ? ' Density drawn is that of air on Earth, for comparison.' : '');
    F.update = dt => {
      if (cam.D < 6e-9) return; // freeze when you're looking closely
      const s = dt * .25;
      mols.forEach(m => { m.p.addScaledVector(m.v, s); if (m.p.length() > R) m.p.multiplyScalar(-.98); m.d.applyAxisAngle(new V3(0, 1, 0), dt * .3); m.q.setFromUnitVectors(new V3(0, 1, 0), m.d); });
      place();
    };
    F.spawn = (T, hint) => {
      let best = null, bd = Infinity; mols.forEach(m => { const d = m.p.distanceTo(T); if (d < bd) { bd = d; best = m; } }); if (!best || bd > .8) return null;
      const id = { N2: 'nitrogen', O2: 'oxygen', CO2: 'carbon_dioxide', H2O: 'water', H2: 'hydrogen' }[best.kind];
      if (!id) return atomFrame(best.kind, best.p);
      return new Frame({ type: 'mol', pinned: true, name: { N2: 'Nitrogen, N₂', O2: 'Oxygen, O₂', CO2: 'Carbon dioxide, CO₂', H2O: 'Water, H₂O', H2: 'Hydrogen, H₂' }[best.kind], unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: best.p.clone(), opts: { mol: id, fixed: true } });
    };
  }
};
/* ---------- plasma (inside the Sun, or a star) — unit nm ---------- */
const PLASMA_SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const plasmaSci = x => { const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return `${m.toFixed(1)} × 10${e < 0 ? '⁻' : ''}${String(Math.abs(e)).split('').map(c => PLASMA_SUP[+c]).join('')}`; };
FT.plasma = {
  build(F) {
    F.env = { opaque: true, bg: 0x04070f };
    const par = F.parent, AUSUN = 695700 / 1.495978707e8; let r = null;
    if (par && par.type === 'sun') r = F.pos.length(); else if (par && par.type === 'solarsystem' && F.pos.length() < 2 * AUSUN) r = F.pos.length() / AUSUN;
    const M = r === null ? null : sunAt(r), ionised = !M || M.T > 1.5e4;
    const X = M ? M.X : .7, Z = .02, Y = 1 - X - Z, nH = X / 1.008, nHe = Y / 4.0026, ne = nH + 2 * nHe;       // moles per gram of each species
    const perM3 = M ? M.rho * 1000 * 6.02214e23 * (ionised ? nH + nHe + ne : nH + nHe) : null;                    // particles (ions and electrons, or atoms) per m3
    const Rp = ionised ? 30 : 60, vol = 4 / 3 * Math.PI * Math.pow(Rp * 1e-9, 3), Nreal = perM3 ? perM3 * vol : null;
    const N = Nreal ? Math.max(24, Math.min(2600, Math.round(Nreal))) : 2600;
    const rg = rng(4), P = [], C = [], S = [], K = [], tot = ionised ? nH + nHe + ne : nH + nHe;
    const add = (kind) => { const p = new V3(gauss(rg), gauss(rg), gauss(rg)).normalize().multiplyScalar(Rp * Math.cbrt(rg())); return p; };
    const species = ionised ? [['p', nH / tot, [1, .42, .3], 1.8], ['he', nHe / tot, [1, .82, .3], 3.2], ['e', ne / tot, [.5, .75, 1], 1.0]] : [['p', nH / tot, [1, .42, .3], 3], ['he', nHe / tot, [1, .82, .3], 5]];
    species.forEach(([k, f, c, sz]) => { const n = Math.round(N * f); for (let i = 0; i < n; i++) { const p = add(); P.push(p.x, p.y, p.z); C.push(...c); S.push(sz); K.push(k); if (!ionised) { const q = p.clone().add(new V3(gauss(rg), gauss(rg), gauss(rg)).multiplyScalar(.9)); P.push(q.x, q.y, q.z); C.push(.5, .75, 1); S.push(1.6); K.push('e'); if (k === 'he') { const q2 = p.clone().add(new V3(gauss(rg), gauss(rg), gauss(rg)).multiplyScalar(.9)); P.push(q2.x, q2.y, q2.z); C.push(.5, .75, 1); S.push(1.6); K.push('e'); } } } });
    const pts = makePoints(P, C, S); F.add(pts); F.pick(pts, 'plasma', 1); pts.userData.madeOf = null;
    const T = M ? M.T : null, vp = T ? Math.sqrt(3 * 1.380649e-23 * T / 1.67262e-27) / 1000 : null;
    const place = M ? (r > .999 ? 'the photosphere, the Sun\'s visible surface' : r < .001 ? 'the centre of the Sun (the core)' : `${(r * 100).toFixed(0)}% of the way out from the centre, in the Sun's ${M.layer} ${M.layer === 'core' ? '' : 'zone'}`.replace(' zone', ' zone').replace('core ', 'core')) : null;
    const tK = T ? (T >= 1e6 ? `${(T / 1e6).toFixed(T >= 1e7 ? 1 : 1)} million K` : `${Math.round(T).toLocaleString('en-US')} K`) : '';
    const rho = M ? (M.rho >= 1 ? `${Math.round(M.rho).toLocaleString('en-US')} kg/m³` : `${plasmaSci(M.rho)} kg/m³`) : '';
    const comp = M ? `${Math.round(X * 100)}% hydrogen and ${Math.round(Y * 100)}% helium by mass` : '';
    pts.userData.info = M ? { title: ionised ? 'Plasma inside the Sun' : 'Gas at the Sun\'s surface', tag: ionised ? 'Fully ionised plasma' : 'Hot, thinly ionised gas',
      body: ionised ? `<p>At ${tK} atoms cannot hold on to their electrons. What is left is a gas of bare hydrogen nuclei (single protons, red), helium nuclei (gold) and free electrons (blue), all moving freely, steered by electric and magnetic fields. This is the fourth state of matter, plasma.</p>`
        : `<p>At about ${tK} the gas at the Sun's surface is mostly <b>neutral atoms</b>: a proton with its electron (red and blue) and helium atoms (gold with two blue electrons). Only a small fraction are ionised. The Sun's surface is not a plasma in the sense of its hot interior.</p>`,
      facts: [['Where', place], ['Temperature', `≈ ${tK} (standard solar model)`], ['Density', `≈ ${rho}`], ['Composition', `≈ ${comp} (approximate)`], ['Particles per m³', `≈ ${plasmaSci(perM3)}`], ['Typical proton speed', `≈ ${Math.round(vp).toLocaleString('en-US')} km/s (√(3kT/m), calculated)`]],
      note: 'Conditions are interpolated between standard-solar-model values; the picture is schematic.' }
      : { title: 'Plasma', tag: 'The fourth state of matter', body: '<p>So hot that atoms are torn apart: bare nuclei (red, mostly protons) and free electrons (blue) fly separately. Plasma conducts electricity and is steered by magnetic fields. Over 99% of the visible matter in the universe is plasma, and stars are made of it.</p>', facts: [['Sun\'s surface', '≈ 5,772 K'], ['Sun\'s core', '≈ 15 million K']] };
    if (M) {
      F.name = ionised ? `Plasma inside the Sun (${r < .001 ? 'centre' : r.toFixed(2) + ' R'})` : 'Gas at the Sun\'s surface';
      if (!F.blurb || r > .001) F.blurb = `Inside the Sun, at ${place}: a patch ${Rp * 2} nm wide, ${tK}, density ${rho}. ${ionised ? 'Bare hydrogen and helium nuclei and free electrons.' : 'Mostly neutral hydrogen and helium atoms.'}`;
      F.note = `Schematic: ${N.toLocaleString('en-US')} particles are drawn${Nreal && Nreal > N * 1.5 ? ` of the roughly ${plasmaSci(Nreal)} that would fill this view (at this density the real spacing is about ${(Math.cbrt(1 / perM3) * 1e9).toFixed(3)} nm)` : Nreal ? ' (about the true number for this density)' : ''}; positions are random and the dots are far larger than real nuclei (about 10⁻¹⁵ m). Composition: ${comp} (rounded); the heavier elements (about 2%) are left out. Conditions come from a standard solar model, interpolated.`;
    } else { F.blurb = F.blurb || 'Stellar plasma at nanometer scale: free electrons and bare nuclei.'; F.note = 'Schematic: a patch of stellar plasma drawn at random; the conditions of any particular star are not modelled.'; }
    const vel = new Float32Array(P.length), sp = { p: 1, he: .5, e: 6 }; for (let i = 0; i < K.length; i++) { const k = sp[K[i]] * (T ? Math.sqrt(T / 1.57e7) : 1) * .8; vel[3 * i] = gauss(rg) * k; vel[3 * i + 1] = gauss(rg) * k; vel[3 * i + 2] = gauss(rg) * k; }
    const pos = pts.geometry.attributes.position;
    F.update = (dt, t) => {
      pts.rotation.y += dt * .04; const d = Math.min(dt, .05); // thermal motion, slowed down enormously: electrons move fastest, helium nuclei slowest
      if (ionised) for (let i = 0; i < K.length; i++) { let x = pos.array[3 * i] + vel[3 * i] * d, y = pos.array[3 * i + 1] + vel[3 * i + 1] * d, z = pos.array[3 * i + 2] + vel[3 * i + 2] * d; if (x * x + y * y + z * z > Rp * Rp) { vel[3 * i] *= -1; vel[3 * i + 1] *= -1; vel[3 * i + 2] *= -1; x = pos.array[3 * i]; y = pos.array[3 * i + 1]; z = pos.array[3 * i + 2]; } pos.array[3 * i] = x; pos.array[3 * i + 1] = y; pos.array[3 * i + 2] = z; }
      pos.needsUpdate = true;
    };
    // zooming into a nucleus goes on down: a hydrogen nucleus is a proton; a helium nucleus is two protons and two neutrons
    F.spawn = (T) => {
      const A = pos.array; let bi = -1, bd = Infinity; for (let i = 0; i < K.length; i++) { const d = Math.hypot(A[i * 3] - T.x, A[i * 3 + 1] - T.y, A[i * 3 + 2] - T.z); if (d < bd) { bd = d; bi = i; } }
      if (bi < 0 || bd > 1.2) return null;
      const at = new V3(A[bi * 3], A[bi * 3 + 1], A[bi * 3 + 2]);
      if (K[bi] === 'e') { message('An electron has no known smaller parts: it is a point, as far as any experiment can tell.'); return null; }
      if (K[bi] === 'he') return new Frame({ type: 'nucleus', pinned: true, name: 'Helium-4 nucleus', unit: 1e-15, radius: 40, r0: 1.5e-15, r1: 3e-13, spawnD: 4e-15, pos: at, opts: { Z: 2, N: 2, el: 'He' } });
      return new Frame({ type: 'proton', pinned: true, name: 'Proton', unit: 1e-15, radius: 4, r1: 1.2e-14, pos: at, opts: { kind: 'proton' } });
    };
    F.spawnD = 3e-11;
  }
};
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
/* ---------- DNA (unit nm) & cell (unit µm) via v2 ---------- */
v2frame('dna', 'dna', () => 1 / 2.4, (F, c) => {
  F.blurb = 'DNA, the double helix. Choose "Chromatin packing" to see how it is wound round proteins.';
  F.spawn = (T, hint) => {
    const id = hint && hint.id || '';
    const mol = /base_[AT]/.test(id) ? 'bp_AT' : /base_[GC]/.test(id) ? 'bp_GC' : id === 'sugar' ? 'deoxyribose' : id === 'phosphate' ? 'phosphate' : 'bp_GC';
    const nm = { bp_AT: 'Adenine-thymine base pair', bp_GC: 'Guanine-cytosine base pair', deoxyribose: 'Deoxyribose (the sugar in DNA)', phosphate: 'Phosphate group' }[mol];
    return new Frame({ type: 'mol', name: nm, unit: 1e-10, radius: 25, r1: 1.2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol, fixed: true } });
  };
  F.spawnD = 2.5e-9;
});
v2frame('cell', 'cell', (c) => c.opts.type === 'bacterium' ? .1 : 10 / 12, (F, c) => {
  const kind = c.cellKind || 'animal';
  const NAMES = { animal: 'Animal cell', plant: 'Plant cell', bacterium: 'Bacterium' };
  const BLURBS = {
    animal: 'A generic animal cell, about 20 µm across (a skin cell is one example). A human body has about 30 trillion cells of several hundred types.',
    plant: 'A plant cell, here about 30 µm long, as in a leaf. Chloroplasts capture sunlight.',
    bacterium: 'A rod-shaped bacterium, about 2 µm long. It has no nucleus: its DNA floats in the cell as a tangle called the nucleoid.',
  };
  F.name = (F.opts && F.opts.cname) || NAMES[kind]; F.blurb = (F.opts && F.opts.blurb) || BLURBS[kind];
  const nuc0 = c.nucPos.clone();
  F.chooseHit = cands => {
    let best = null; for (const k of cands) if (!best || k.pri > best.pri) best = k;
    if (!best) return null;
    const id = best.obj.userData.id;
    if (id !== 'membrane' && id !== 'cellwall' && id !== 'bacwall') return best;
    const inner = cands.find(k => k.obj.userData.id === 'cytoplasm');
    if (!inner) return best;
    // the shell wins only at the rim of the cell (a ray that skims it) or at a box edge; anywhere else the click is on the cytoplasm behind it
    let rim;
    if (id === 'cellwall') { const p = best.hit.object.worldToLocal(best.hit.point.clone()), g = best.hit.object.geometry.parameters; const e = [Math.abs(p.x) > g.width / 2 - 1.3, Math.abs(p.y) > g.height / 2 - 1.3, Math.abs(p.z) > g.depth / 2 - 1.3]; rim = e.filter(Boolean).length >= 2; }
    else { const nrm = best.hit.face.normal.clone().transformDirection(best.hit.object.matrixWorld); rim = Math.abs(nrm.dot(raycaster.ray.direction)) < .4; }
    return rim ? best : inner;
  };
  F.spawn = (T, hint) => {
    let id = hint && hint.id || '';
    if (c.patchOn) id = /phospholipid|channel|glyco/.test(id) ? id : 'phospholipid';   // the membrane patch sits at the cell centre in the drawing, but it is a patch of membrane
    const nucP = nuc0.clone().multiplyScalar(c.k);
    const dnaF = () => new Frame({ type: 'dna', name: kind === 'bacterium' ? 'DNA of the bacterium' : 'DNA', unit: 1e-9, radius: 30, r1: 2.5e-7, pos: T.clone() });
    if (kind === 'bacterium') { if (/nucleoid/.test(id) || T.distanceTo(nucP) < 3 * c.k) return dnaF(); }
    else if (!c.patchOn && (/nucle|chromatin/.test(id) || T.distanceTo(nucP) < 3.4 * c.k)) return dnaF();
    const molF = (mol, name) => new Frame({ type: 'mol', name, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol, fixed: false, cname: name } });
    if (/membrane|phospholipid|channel|glyco/.test(id)) return molF('popc', 'POPC, a common membrane phospholipid (one lipid of the bilayer)');
    if (/mito/.test(id)) return molF('atp', 'ATP, the molecule mitochondria make (the inside of a mitochondrion is not built yet)');
    if (/chloro/.test(id)) return molF('chlorophyll_a', 'Chlorophyll a, the green pigment in chloroplasts');
    if (/cellwall/.test(id)) return molF('cellotriose', 'Cellotriose: three glucose units of cellulose, the stuff of plant cell walls');
    if (/vacuole/.test(id)) return new Frame({ type: 'liquid', name: 'Water, the main ingredient of a vacuole (dissolved sugars and salts not drawn)', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
    if (/^(cytoplasm|bacwall)$/.test(id) || !id) return new Frame({ type: 'liquid', name: 'Water, the main ingredient of cytoplasm (dissolved molecules not drawn)', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
    const NONE = { ribosome: 'ribosome', er: 'endoplasmic reticulum', golgi: 'Golgi apparatus', lysosome: 'lysosome', nucleolus: 'nucleolus', flagellum: 'flagellum' };
    for (const k in NONE) if (id === k) { message(`No deeper view of the ${NONE[k]} has been built yet.`); return null; }
    return null;
  };
  F.spawnD = kind === 'bacterium' ? 6e-6 : 1.2e-6;
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
const FUNGAL = { type: 'animal', cname: 'Fungal cell (drawn as a generic animal-type cell)', blurb: 'A fungal cell: like an animal cell it has a nucleus and organelles, but it also has a rigid wall of chitin, which is not drawn here.', note: 'Fungal cells have a chitin wall that this generic cell does not show.' };
const DIATOM = { type: 'plant', cname: 'Diatom cell (drawn as a generic plant-type cell)', blurb: 'A diatom is a single-celled alga. Like a plant cell it has a nucleus and chloroplasts; it lives in a two-part shell of silica (glass), which is not drawn here.', note: 'The diatom\'s silica shell is not drawn.' };
const ALGA = { type: 'plant', cname: 'Green alga cell (drawn as a generic plant-type cell)', blurb: 'A single-celled green alga, close kin of land plants: nucleus, chloroplasts and a cell wall.', note: 'Real algal cells are often rounder and have one large chloroplast; this is the generic plant cell.' };
const POLLEN = { type: 'plant', cname: 'Pollen grain (drawn as a generic plant-type cell)', blurb: 'A pollen grain is a tiny plant body inside a tough wall of sporopollenin; it carries the male cells. The scene shows a generic plant cell, not its real structure.', note: 'A pollen grain is not like a leaf cell: this generic plant cell stands in for it.' };
const MICRO = {
  skin: { title: 'Skin surface', blurb: 'Your skin, about 1 mm across: the outer layer is flattened dead cells (corneocytes, tens of µm across) that flake off all the time. A hair is roughly 50 to 100 µm thick.', ground: ['#e9b59b', '#e2a98e', '#efc0a6', '#dca089'], cells: 30, hair: 3, bact: 40, child: 'cell' },
  fur: { title: 'Dog skin and fur', blurb: 'Fur, about 1 mm across: each hair is a tube of dead keratin cells about 50–100 µm thick.', ground: ['#c9a27e', '#b8916e', '#d6b08b'], cells: 30, hair: 40, bact: 20, child: 'cell' },
  leaf: { title: 'Leaf surface', blurb: 'A leaf, about 1 mm across: epidermis cells (jigsaw-shaped in many plants, drawn here as simple polygons) and stomata, tiny mouths (~25 µm) that let CO₂ in and water vapour out.', ground: ['#5fa64a', '#69b153', '#57983f', '#74b85b'], cells: 22, stoma: 14, bact: 10, child: 'plantcell' },
  soil: { title: 'Soil', blurb: 'Soil, about 1 mm across: mineral grains (sand ~0.1–2 mm, silt, clay), organic matter, fungal threads and bacteria — a gram of soil holds ~1 billion microbes.', ground: ['#5b4632', '#4f3c2a', '#6a523a'], grains: ['#cdb89a', '#a58e6e', '#8c7a63', '#e0d3bd'], n: 160, hyphae: 25, bact: 120, crystal: 'quartz' },
  sand: { title: 'Desert sand', blurb: 'Sand grains are mostly quartz (SiO₂) rounded by wind — each 0.06–2 mm.', ground: ['#d9b77f', '#cfa86c'], grains: ['#e8cf9c', '#d4b07a', '#f0dcb4', '#c79d63', '#b98a55'], n: 220, crystal: 'quartz' },
  regolith: { title: 'Lunar regolith', blurb: 'Moon dust: sharp, glassy fragments made by billions of years of micrometeorite impacts — no wind or water has ever rounded them.', ground: ['#5c5c5c', '#666'], grains: ['#8a8a8a', '#6f6f6f', '#a2a2a2', '#4d4d4d', '#b5b0a0'], n: 220, sharp: true, crystal: 'forsterite' },
  mars: { title: 'Martian soil', blurb: 'Mars dust is basaltic rock coated with iron oxides (rust) — that is why the planet is red.', ground: ['#8a4a2e', '#7a3f26'], grains: ['#b3623b', '#a0522d', '#c27a4f', '#7c3a21'], n: 220, crystal: 'hematite' },
  ice: { title: 'Snow and ice', blurb: 'Snow and ice: crystals of frozen water, each grain a lattice of H₂O molecules in hexagonal ice Ih.', ground: ['#dfeef8', '#cfe3f2'], grains: ['#f4fbff', '#e2f1fb', '#d0e6f6'], n: 120, crystal: 'ice_ih', glass: true },
  pond: { title: 'Pond water', blurb: 'A drop of pond water, about 1 mm across: diatoms with glass (silica) shells, green algae and bacteria drift in liquid water.', water: true, diatoms: 40, algae: 60, bact: 200, child: 'water' },
  ocean: { title: 'Sea water', blurb: 'Sea water, about 1 mm across: phytoplankton make about half of Earth\'s oxygen.', water: true, diatoms: 50, algae: 80, bact: 200, child: 'water' },
  air: { title: 'Air (aerosols)', blurb: 'Air, about 1 mm across: almost empty, with a few dust grains, pollen and cloud droplets drifting by. The gas molecules themselves are far too small to see at this scale.', air: true, child: 'gas' },
  cloudtops: { title: 'Cloud tops of a gas giant', blurb: 'Inside a giant planet\'s upper atmosphere, about 1 mm across: the gas is mostly hydrogen and helium. The cloud particles and haze that colour the planet are not drawn here.', air: 'giant', child: 'gas' },
  rock: { title: 'Rock surface', blurb: 'Granite-like rock: interlocking crystals of quartz, feldspar and mica.', ground: ['#a9a39b', '#8f8a84', '#c8c2b8', '#5f5b57', '#e6dfd2'], cells: 40, crystal: 'quartz' },
  basalt: { title: 'Basalt', blurb: 'Basalt is a dark volcanic rock made of tiny crystals (mostly pyroxene and feldspar). Landers on Venus measured rock compositions similar to basalts, and radar maps show lava plains across most of the planet.', ground: ['#4f4a44', '#5d5750', '#3f3b37', '#6b645b'], cells: 40, crystal: 'forsterite' },
  metal: { title: 'Metal surface', blurb: 'Polished iron under a microscope shows grains — each a single crystal of atoms in a cubic lattice.', ground: ['#9aa3ad', '#8c96a1', '#a7b0b9'], cells: 26, crystal: 'iron_bcc' },
};
function microFrame(kind, pos, quat) { const M = MICRO[kind] || MICRO.soil; return new Frame({ type: 'micro', name: M.title, unit: 1e-6, radius: 800, r0: 1.5e-4, r1: 6e-3, spawnD: 1.5e-4, pos: pos.clone(), quat: quat || new THREE.Quaternion(), up: new V3(0, 1, 0), opts: { kind } }); }
FT.micro = {
  build(F, o) {
    const M = MICRO[o.kind] || MICRO.soil, r = rng(o.kind.length * 13 + 5);
    F.env = { opaque: true, bg: 0x0d0f14 };
    F.add(new THREE.HemisphereLight(0xf2f6ff, 0x404040, .75)); const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(3, 8, 4); F.add(dl);
    F.name = M.title; F.blurb = M.blurb;
    const info = { title: M.title, tag: 'Microscopic view (sizes true, shapes schematic)', body: `<p>${M.blurb}</p>` };
    if (M.ground) {
      const t = M.cells ? voronoiTex('vor_' + o.kind, M.ground, M.cells * 3, 5, 7) : canvasTex('grd_' + o.kind, 256, 256, (g, w, h) => { const rr = rng(3); g.fillStyle = M.ground[0]; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = M.ground[i % M.ground.length]; g.globalAlpha = .4; g.fillRect(rr() * w, rr() * h, 2 + rr() * 4, 2 + rr() * 4); } }, { wrap: true });
      t.repeat.set(4, 4);
      const geo = new THREE.CircleGeometry(800, 96); const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, (Math.sin(x * .02) * Math.cos(y * .017) * (M.cells ? 4 : 2)) + (o.kind === 'skin' ? -6 * Math.exp(-Math.pow((x * .7 + y * .7) % 260 / 22, 2)) : 0)); }
      geo.computeVertexNormals();
      const gm = new THREE.Mesh(geo, smat(0xffffff, { map: t, roughness: .8 })); gm.rotation.x = -Math.PI / 2; F.add(gm);
      F.pick(gm, 'microsurface', 1); gm.userData.info = info; gm.userData.madeOf = M.crystal ? 'crystal' : 'cell'; gm.userData.cellOpts = { type: M.child === 'plantcell' ? 'plant' : 'animal' };
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
      for (let i = 0; i < M.hair; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 600, h = 400 + r() * 600; const c = new THREE.Mesh(new THREE.CylinderGeometry(35, 38, h, 24), smat(o.kind === 'fur' ? 0x8a6340 : 0x3b2a20, { roughness: .8 })); c.position.set(Math.cos(a) * d, h / 2 - 10, Math.sin(a) * d); c.rotation.set((r() - .5) * 1.4, 0, (r() - .5) * 1.4); F.add(c); F.pick(c, 'hair', 2); c.userData.info = { title: 'Hair', tag: 'Keratin fiber, ~70 µm thick', body: '<p>A hair is a rope of dead cells packed with keratin protein, covered in overlapping scales (the cuticle). It grows from a follicle about 1 cm per month.</p>' }; c.userData.madeOf = 'protein'; }
    }
    if (M.stoma) {
      for (let i = 0; i < M.stoma; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 650, s = new THREE.Group(); s.position.set(Math.cos(a) * d, 2, Math.sin(a) * d); s.rotation.y = r() * 6; [-1, 1].forEach(k => { const g = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), smat(0x3f8f35, { roughness: .6 })); g.scale.set(14, 6, 5); g.position.z = k * 5; s.add(g); }); F.add(s); F.pick(s, 'stoma', 2); s.userData.info = { title: 'Stoma', tag: 'A leaf\'s breathing pore', body: '<p>Two curved guard cells swell with water to open the pore and shrink to close it, balancing CO₂ intake against water loss. A leaf has thousands per square centimeter.</p>' }; s.userData.madeOf = 'cell'; s.userData.cellOpts = { type: 'plant', cname: 'Guard cell (plant cell)' }; }
    }
    if (M.bact) {
      const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(.6, 10, 8).scale(1, 1, 1.9), smat(0x9fd38a, { roughness: .5 }), M.bact), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      for (let i = 0; i < M.bact; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 500; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, M.water ? (r() - .5) * 300 : 3, Math.sin(a) * d), q, new V3(1, 1, 1)); bm.setMatrixAt(i, m4); }
      F.add(bm); F.pick(bm, 'bacterium', 3); bm.userData.info = { title: 'Bacteria', tag: 'Single-celled prokaryotes, ~1–2 µm', body: '<p>Bacteria have no nucleus; their DNA floats in a single loop. Your skin alone carries about a trillion of them, most harmless or helpful.</p>' }; bm.userData.madeOf = 'cell'; bm.userData.cellOpts = { type: 'bacterium' };
    }
    if (M.hyphae) { for (let i = 0; i < M.hyphae; i++) { const pts = []; let p = new V3((r() - .5) * 1200, 20 + r() * 60, (r() - .5) * 1200), d = new V3(gauss(r), gauss(r) * .2, gauss(r)).normalize(); for (let k = 0; k < 12; k++) { pts.push(p.clone()); d.add(new V3(gauss(r), gauss(r) * .2, gauss(r)).multiplyScalar(.3)).normalize(); p = p.clone().addScaledVector(d, 50); } const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 2.5, 6), smat(0xe9e3d0, { roughness: .6 })); F.add(t); F.pick(t, 'hypha', 2); t.userData.info = { title: 'Fungal hyphae', tag: '~5 µm threads', body: '<p>Fungi grow as networks of thread-like cells (mycelium) that digest organic matter and trade nutrients with plant roots.</p>' }; t.userData.madeOf = 'cell'; t.userData.cellOpts = FUNGAL; } }
    if (M.water) {
      F.scene.fog = new THREE.FogExp2(0x2a6f8f, .0018); F.env = { bg: 0x2a6f8f, opaque: true };
      for (let i = 0; i < M.diatoms; i++) { const s = 15 + r() * 40, m = new THREE.Mesh(new THREE.CylinderGeometry(s, s, s * .4, 32), new THREE.MeshStandardMaterial({ color: 0xc8b46a, roughness: .2, transparent: true, opacity: .75 })); m.position.set((r() - .5) * 1100, (r() - .5) * 600, (r() - .5) * 1100); m.rotation.set(r() * 6, r() * 6, 0); F.add(m); F.pick(m, 'diatom', 2); m.userData.info = { title: 'Diatom', tag: 'Algae in glass houses, 20–200 µm', body: '<p>Diatoms build intricate shells of silica (glass). They produce about a fifth of the oxygen made on Earth each year.</p>' }; m.userData.madeOf = 'cell'; m.userData.cellOpts = DIATOM; }
      const am = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), smat(0x3fa34d, { roughness: .4 }), M.algae), m4 = new THREE.Matrix4();
      for (let i = 0; i < M.algae; i++) { const s = 4 + r() * 8; m4.makeScale(s, s, s).setPosition((r() - .5) * 1100, (r() - .5) * 600, (r() - .5) * 1100); am.setMatrixAt(i, m4); }
      F.add(am); F.pick(am, 'algae', 2); am.userData.info = { title: 'Green algae', tag: 'Single-celled plants, ~5–20 µm', body: '<p>Single-celled green algae (like Chlorella) photosynthesize with the same chlorophyll as land plants — which evolved from green algae.</p>' }; am.userData.madeOf = 'cell'; am.userData.cellOpts = ALGA;
      const wv = hitSphere(900, 'water', -1); wv.userData.info = { title: 'Liquid water', tag: 'H₂O', body: '<p>At this scale water looks perfectly smooth. Zoom another 100,000 times to see individual molecules.</p>' }; wv.userData.madeOf = 'molecule'; wv.material.side = THREE.BackSide; F.add(wv); F.pickables.push(wv);
    }
    if (M.air) {
      F.env = { bg: 0x9cc8ef, opaque: true };
      const add = M.air === 'giant' ? () => { } : (n, col, smin, smax, id, inf) => { for (let i = 0; i < n; i++) { const s = smin + r() * (smax - smin), m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, id === 'pollen' ? 2 : 1), smat(col, { roughness: id === 'droplet' ? .05 : .8, transparent: id === 'droplet', opacity: id === 'droplet' ? .6 : 1 })); m.position.set((r() - .5) * 1400, (r() - .5) * 900, (r() - .5) * 1400); F.add(m); F.pick(m, id, 2); m.userData.info = inf; m.userData.madeOf = id === 'droplet' ? 'water' : id === 'pollen' ? 'cell' : 'crystal'; if (id === 'pollen') m.userData.cellOpts = POLLEN; } };
      add(10, 0xa58e6e, 1, 6, 'dust', { title: 'Dust particle', tag: '1–10 µm', body: '<p>Mineral dust, soot and sea salt: aerosols. They seed cloud droplets and scatter sunlight. Dust is a mix, so "what it is made of" shows quartz only as one common example.</p>' });
      add(6, 0xf2c94c, 12, 18, 'pollen', { title: 'Pollen grain', tag: '~25 µm', body: '<p>A pollen grain carries a plant\'s male gametes inside a tough, often spiky shell.</p>' });
      add(14, 0xdff1ff, 5, 12, 'droplet', { title: 'Cloud droplet', tag: '≈ 20 µm across (10 µm radius)', body: '<p>A cloud droplet is about a million times smaller in volume than a raindrop. It takes about a million of them merging to make one raindrop.</p>' });
      const av = hitSphere(900, 'airvol', -1); av.material.side = THREE.BackSide; av.userData.info = { title: M.air === 'giant' ? 'Hydrogen and helium gas' : 'Air', tag: 'Gas mixture', body: M.air === 'giant' ? '<p>Zoom about 10,000× more to see individual hydrogen molecules and helium atoms.</p>' : '<p>Zoom about 10,000× more to see individual nitrogen and oxygen molecules.</p>' }; av.userData.madeOf = 'molecule'; F.add(av); F.pickables.push(av);
    }
    F.info = info;
    F.spawn = (T, hint) => {
      const id = hint && hint.id || '';
      if (/microsurface/.test(id) || (!hint && M.ground)) {
        if (M.child === 'cell' || M.child === 'plantcell') return new Frame({ type: 'cell', name: M.child === 'plantcell' ? 'Plant cell' : 'Animal cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone().add(new V3(0, -10, 0)), opts: { type: M.child === 'plantcell' ? 'plant' : 'animal' } });
        if (M.crystal) return crystalFrame(M.crystal, T);
      }
      if (/grain|dust/.test(id)) return crystalFrame(M.crystal || 'quartz', T);
      if (/stoma|diatom|algae|hypha|bacterium|pollen/.test(id)) { const co = (hint && hint.obj && hint.obj.userData.cellOpts) || { type: 'animal' }; return new Frame({ type: 'cell', name: co.cname || 'Cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone(), opts: Object.assign({}, co) }); }
      if (/hair/.test(id)) return new Frame({ type: 'mol', name: 'Keratin building block', unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T.clone(), opts: { mol: 'aa_cys' } });
      if (/water|droplet/.test(id) || M.water) return new Frame({ type: 'liquid', name: 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T.clone() });
      if (/airvol/.test(id) || M.air) return new Frame({ type: 'gas', name: M.air === 'giant' ? 'Hydrogen and helium gas' : 'Air molecules', unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: T.clone(), opts: M.air === 'giant' ? { air: 'giant' } : {} });
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
  venus: { g: ['#6b5a45', '#5d4e3b', '#7a6850'], sky: 3, micro: 'basalt', h: 20 },
  cloudtops: { water: true, cloud: true, sky: 4, micro: 'cloudtops' },
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
function landscapeFrame(biome, pos, quat, body) { return new Frame({ type: 'landscape', name: biome === 'cloudtops' ? `${body} cloud tops (no solid surface)` : body ? `${body} surface` : 'Landscape', unit: 1, radius: 4000, r0: 2e-4, r1: 4e4, spawnD: .02, up: new V3(0, 1, 0), maxPolar: Math.PI / 2 - .02, pos: pos.clone(), quat: quat || new THREE.Quaternion(), opts: { biome, body } }); }
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
      if (B.cloud) wm.material = hitMat(); // no ground is drawn: the sky colour fills everything, so there is nothing to stand on (the plane stays only as a click target)
      if (B.cloud) wm.userData.info = { title: 'Cloud tops', tag: 'Giant planet atmosphere', body: '<p>Gas giants have no solid surface: hydrogen and helium get gradually denser with depth until they become liquid and, deeper still, metallic hydrogen. The visible clouds are ammonia ice and ammonium hydrosulfide.</p>' };
    } else {
      ground = terrain(4000, 160); F.add(ground); F.pick(ground, 'ground', 0); ground.userData.madeOf = B.micro;
      ground.userData.info = { title: o.body ? `${o.body} surface` : 'The ground', tag: o.biome === 'venus' ? 'About 740 K, about 93 bar' : o.biome, body: `<p>${MICRO[B.micro] ? MICRO[B.micro].blurb : ''}</p>`, note: o.body && o.body !== 'Earth' ? 'The terrain you see is a generic illustration, not a map of this place.' : undefined };
      const near = terrain(60, 120); near.position.y = .02; F.add(near); F.pick(near, 'ground', 0); near.userData = ground.userData;
    }
    if (B.trees) {
      const tr = new THREE.InstancedMesh(new THREE.ConeGeometry(3, 12, 7).translate(0, 8, 0), smat(0x2d5a27, { roughness: .9, flatShading: true }), B.trees), tk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.35, .45, 3, 6).translate(0, 1.5, 0), smat(0x5a3f2a), B.trees), m4 = new THREE.Matrix4();
      for (let i = 0; i < B.trees; i++) { const a = r() * TAU, d = 40 + Math.sqrt(r()) * 3500, s = .7 + r() * .8; m4.makeScale(s, s * (.8 + r() * .5), s).setPosition(Math.cos(a) * d, -d * d / 12742000, Math.sin(a) * d); tr.setMatrixAt(i, m4); tk.setMatrixAt(i, m4); tr.setColorAt(i, col.setHSL(.28 + r() * .06, .45, .18 + r() * .1)); }
      F.add(tr); F.add(tk); F.pick(tr, 'tree', 2); tr.userData.madeOf = 'leaf';
    }
    if (B.rocks) { const rm = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), smat(0x6e3a22, { roughness: 1, flatShading: true }), 400), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(); for (let i = 0; i < 400; i++) { const a = r() * TAU, d = 3 + Math.sqrt(r()) * 300, s = .1 + Math.pow(r(), 3) * 1.5; q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); m4.compose(new V3(Math.cos(a) * d, s * .3, Math.sin(a) * d), q, new V3(s, s * .7, s)); rm.setMatrixAt(i, m4); } F.add(rm); F.pick(rm, 'rock', 2); rm.userData.madeOf = 'rock'; }
    const sky = B.sky ? skyDome(F, B.sky, 30000) : null;
    if (B.sky) { F.env = { opaque: true, bg: 0x000000 }; F.daylight = true; }
    const bn = o.body || 'Earth', GAS = { Jupiter: ' and the temperature is about 165 K (−108 °C)', Saturn: ' and the temperature is about 134 K (−139 °C)' };
    if (o.biome === 'cloudtops') { F.blurb = `${bn} has no solid surface. This is an illustration of its cloud tops, at the level where the pressure is about 1 bar (Earth's sea-level air pressure)${GAS[bn] || ''}. Going down, the gas only gets denser and hotter: there is no ground to stand on.`; F.note = 'Illustration only: a made-up cloud deck, not an image. The real clouds lie in layers, with ammonia ice highest, then ammonium hydrosulfide, then water.'; }
    else if (o.biome === 'venus') { F.blurb = 'Venus\'s surface: about 740 K (467 °C) and 93 bar, under a thick cloud deck, on volcanic plains of basalt. Lit by the real Sun for the date shown, though very little sunlight actually reaches the ground.'; F.note = 'Illustrative: the ground, the sky and the light are generic. Known: the temperature and pressure, and that the plains are basalt (measured by Venera and Vega landers).'; }
    else if (o.body && o.body !== 'Earth') { F.blurb = `A generic rocky landscape standing in for ${bn}. Lit by the real Sun for the date shown.`; F.note = `Illustrative: this is generic procedural terrain, not a map or photograph of ${bn}. Its real surface is not drawn.`; }
    else F.blurb = 'Earth\'s surface, lit by the real Sun for this place and time.';
    F.update = () => {
      const s = sunDirIn(F); sun.position.copy(s).multiplyScalar(100); const day = smooth(-.1, .15, s.y); sun.intensity = (o.body && o.body !== 'Earth' ? .95 : 1.25) * day; hemi.intensity = .08 + .55 * day;
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
        g.globalAlpha = 1; for (let i = 0; i < 1800; i++) { const x = rr() * w, y = rr() * h, d = Math.hypot(x - w / 2, y - h / 2); if (d < 6) continue; g.fillStyle = ['#8d8a86', '#7a7773', '#9c978f', '#6d6a66'][i % 4]; g.globalAlpha = .65; g.fillRect(x, y, 3 + rr() * 6, 3 + rr() * 6); }
        g.globalAlpha = 1; g.strokeStyle = '#2d4f66'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, h * .38); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * .38 + Math.sin(x * .02) * 18 - (x > w * .4 && x < w * .6 ? 14 : 0)); g.stroke();
        g.fillStyle = '#4f8a33'; g.beginPath(); g.ellipse(w / 2, h / 2, 3, 2.4, 0, 0, TAU); g.fill(); // the park is about half a kilometre wide: a few pixels of this 80-km tile
      }
      g.globalAlpha = 1;
    }, {});
    const geo = new THREE.CircleGeometry(40, 128); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: .95, transparent: true, depthWrite: false });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a *= smoothstep(1.0, 0.75, length(vUv-0.5)*2.0);'); };
    const m = new THREE.Mesh(geo, mat); F.add(m); F.pick(m, B.water ? 'ocean' : 'land', 0); m.userData.madeOf = B.micro;
    m.userData.info = { title: o.isPark ? 'Greenwich, London (schematic tile)' : 'Earth\'s surface', tag: `${o.lat.toFixed(2)}°, ${o.lon.toFixed(2)}° · schematic`, body: o.isPark ? '<p>An 80-km-wide patch around Greenwich Park. <b>The picture is a schematic stand-in, not a map:</b> the grey blocks, the river line and the green patch are a generated pattern, not London\'s real streets, buildings or Thames. Keep zooming to land in the park.</p>' : '<p>An 80-km-wide patch of the surface, coloured by the land type under it on the globe map. It is an illustrative tile, not a map of this place. Keep zooming to land here.</p>', note: 'Schematic: not real streets, buildings or rivers.' };
    if (o.isPark) { const pk = markerSprite(0xffd166, 10); pk.position.y = .01; F.add(pk); F.label(pk, 'Greenwich Park', { cls: 'you', always: true }); }
    F.update = () => { const s = sunDirIn(F); sun.position.copy(s).multiplyScalar(100); };
    F.blurb = o.isPark ? 'Above London and Greenwich Park, where your journey started. The ground picture is a schematic tile, not a map.' : `Earth's surface at ${o.lat.toFixed(1)}°, ${o.lon.toFixed(1)}° (${o.biome}). The ground picture is an illustrative tile, not a map.`;
    F.note = 'Schematic: the blocks, river and park are a generated pattern, not real streets or buildings. The sky colour follows the Sun and altitude. The globe\'s own map is blurry below about 100 km (4096 by 2048 pixels for the whole Earth).';
    // a sky above the tile: blue by day, black above about 100 km and at night; the stars of the parent frames show through at night and from high up
    const dome = skyDome(F, 1, 1500); dome.geometry.dispose(); dome.geometry = new THREE.SphereGeometry(1500, 32, 16, 0, TAU, 0, Math.PI / 2 + .09); dome.renderOrder = -1;
    const baseUp = F.update; F.update = () => { baseUp(); const s = sunDirIn(F); dome.material.uniforms.uSun.value.copy(s); dome.material.uniforms.uOpacity.value = (1 - smooth(3e4, 1.2e5, cam.D)) * F.alpha; dome.visible = cam.D < 1.3e5; };
    if (o.isPark) { F.attract = new V3(); F.attractD = 4000; F.attractR = 1.5; } // scrolling toward the park pulls the target onto it: you land in the park, not in generic grass
    F.spawn = (T) => landscapeFrame(o.isPark ? 'grass' : o.biome, T.clone().setY(0), null, 'Earth');
    F.spawnD = 2500;
  }
};
/* ---------- the park (unit m): v2 park, real sun ---------- */
v2frame('park', 'life', () => 1, (F, c) => {
  F.env = { opaque: true, bg: 0x000000 }; F.daylight = true; // a daylight scene takes no glow while it fills the view (engine.js bloomTarget)
  F.blurb = 'Greenwich Park, London — you, a dog, trees and a pond, lit by the real Sun for this date and time.';
  const P = c.parts, up0 = F.update;
  /* The sun's shadow map is drawn again only when the sun has moved enough to shift a shadow, or while the stand-in figure (which
     breathes) is still showing, and at most ten times a second. In between, the map is still right in the park's own coordinates; only
     the scene's origin moves (it follows the camera), so the shadow matrix is shifted by that movement each frame. shadows=0 turns it off. */
  const SH = P.sun.shadow, sh = { t: -1e9, dir: new V3(), M: new THREE.Matrix4(), root: new V3(), have: false, wait: false, hv: true, d: new THREE.Matrix4() };
  SH.autoUpdate = false; P.sun.castShadow = PERF.flags.shadows; PERF.on('shadows', on => { P.sun.castShadow = !!on; sh.t = -1e9; sh.have = false; });
  const shadowStep = () => {
    if (!P.sun.castShadow) return;
    const now = performance.now();
    if (sh.wait && !SH.needsUpdate) { sh.wait = false; sh.have = true; sh.M.copy(SH.matrix); } // the map was drawn in the last frame: keep its matrix and where the origin was
    const hv = P.human.visible; // the stand-in figure is the only caster that moves; when the body has loaded it is hidden, and its shadow must go with it
    if (!sh.wait && now - sh.t > 100 && (!sh.have || sh.dir.distanceToSquared(P.sun.position) > 1.6e-3 || hv || hv !== sh.hv)) { sh.hv = hv; sh.t = now; sh.dir.copy(P.sun.position); sh.root.copy(F.root.position); SH.needsUpdate = true; sh.wait = true; sh.have = false; }
    else if (sh.have) { sh.d.makeTranslation(sh.root.x - F.root.position.x, sh.root.y - F.root.position.y, sh.root.z - F.root.position.z); SH.matrix.multiplyMatrices(sh.M, sh.d); }
  };
  F.update = (dt, t) => {
    up0(dt, t);
    const s = sunDirIn(F); c.setSun(s); const day = smooth(-.12, .12, s.y); shadowStep();
    F.env.opaque = cam.D < 300 && day > .2; P.sky.visible = cam.D < 380 && F.alpha > .6;
    if (c.scene.fog) { c.scene.fog.near = Math.max(45, cam.D * .6); c.scene.fog.far = Math.max(170, cam.D * 4); }
  };
  F.spawn = (T, hint) => {
    const id = hint && hint.id || '';
    const kind = id === 'human' ? 'skin' : /tree|flower|leaf/.test(id) ? 'leaf' : id === 'pond' ? 'pond' : /air|cloud|bird|sunSky/.test(id) ? 'air' : 'soil';
    if (kind === 'air') { const n = hint ? hint.point.clone() : T.clone(); return microFrame('air', n); }
    return microFrame(kind, T);
  };
  F.spawnD = 3e-3;
});
/* ---------- black hole at the galactic center (unit 1e10 m) ---------- */
v2frame('sgrA', 'blackhole', () => .6, (F) => { F.blurb = 'Sagittarius A*: 4.3 million Suns of mass inside an event horizon about 25 million km across (radius 12.7 million km). (Accretion flow shown brighter than reality.)'; });
