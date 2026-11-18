'use strict';
/* ================= ASSEMBLE THE WORLD ================= */
const MPC = 3.0856775814913673e22, KPC = 3.0856775814913673e19, PC = 3.0856775814913673e16, AU = 1.495978707e11;
async function buildWorld() {
  const [solar, elements] = await Promise.all([getJSON('data/solar.json'), getJSON('data/elements.json').catch(() => [])]);
  SOLAR = solar;
  const catMap = { 'noble gas': 'noble', 'alkali metal': 'alkali', 'alkaline earth metal': 'alkaline', 'metalloid': 'metalloid', 'halogen': 'halogen', 'transition metal': 'transition', 'post-transition metal': 'post', 'nonmetal': 'nonmetal' };
  elements.forEach(e => { ELJ[e.symbol] = e; if (!EL[e.symbol]) EL[e.symbol] = { sym: e.symbol, name: e.name, Z: e.Z, N: Math.max(0, (e.mostAbundantA || Math.round(e.mass)) - e.Z), cat: catMap[(e.category || '').toLowerCase()] || 'post', line: e.summary || '' }; });

  const root = new Frame({ type: 'cosmos', name: 'Observable universe', unit: MPC, radius: 15000, r0: 0, r1: Infinity });
  const lg = root.addChild(new Frame({ type: 'localgroup', name: 'Local Group', unit: KPC, radius: 3500, r1: 6e23 }));
  const mw = lg.addChild(new Frame({ type: 'milkyway', name: 'Milky Way', unit: KPC, radius: 60, r1: 3e22 }));
  FR.mw = mw; FR.lg = lg; FR.root = root;
  FR.sgr = mw.addChild(new Frame({ type: 'sgrA', name: 'Sagittarius A*', unit: 1e10, radius: 80, r1: 4e13 }));
  const nb = mw.addChild(new Frame({ type: 'neighborhood', name: 'Solar neighborhood', unit: PC, radius: 2500, r1: 3e20, spawnD: 3e14, pos: SUN_GAL.clone(), quat: Q_EQ_TO_GAL.clone() }));
  FR.nb = nb;
  const ss = nb.addChild(new Frame({ type: 'solarsystem', name: 'Solar system', unit: AU, radius: 1.3e5, r1: 4e16, quat: Q_ECL_TO_EQ.clone() }));
  FR.solar = ss;
  PLANETS.forEach(name => {
    const d = solar.find(b => b.name === name); if (!d) return;
    if (name === 'Earth') {
      const e = ss.addChild(new Frame({ type: 'earth', name: 'Earth', unit: 1e6, radius: 450, r1: 3e9, quat: Q_EQ_TO_ECL.clone(), opts: { body: 'Earth' } }));
      e.place = () => e.pos.copy(helio3('Earth')); e.place(); FR.earth = e;
      return;
    }
    const moons = solar.filter(m => m.parent === name), R = d.radius_km / 1000;
    const rad = Math.max(R * 8, ...moons.map(m => m.semimajor_km / 1000 * 1.15), 10);
    const f = ss.addChild(new Frame({ type: 'planet', name, unit: 1e6, radius: rad, r1: Math.max(rad * 1e6 * 2.5, R * 1e6 * 40), opts: { body: name } }));
    f.place = () => f.pos.copy(helio3(name)); f.place(); FR[name] = f;
  });
  // the park in Greenwich and a "made of" chain through your hand
  const region = FR.earth.addChild(regionFrame(FR.earth, PARK.lat, PARK.lon, 'grass', true)); FR.region = region;
  const park = region.addChild(new Frame({ type: 'park', name: 'Greenwich Park', unit: 1, radius: 500, r0: 2e-4, r1: 3500, up: new V3(0, 1, 0), maxPolar: Math.PI / 2 - .03 }));
  FR.park = park;
  const body = park.addChild(new Frame({ type: 'body', name: 'Human body', unit: 1, radius: 1.3, r0: 0, r1: 90, up: new V3(0, 1, 0), pos: new V3(0, 0, 0) }));
  body.noFade = true; body.coRender = true; body.coMax = 400; FR.body = body;
  const devLM = buildTeardown(body);
  const AN = await loadAnatomyIndex(); loadNodes();
  const bodyLM = (id, label, D) => { const p = AN && AN.byId[id]; return p ? { label, D, side: true, go: then => flyTo(body, new V3(...p.center), D, then) } : null; };
  const skin = park.addChild(microFrame('skin', new V3(0, 1.2, .2)));
  skin.place = () => {
    if (skin._placed || !park.built || !park.v2) return; skin._placed = true;
    const h = park.v2.parts.human; park.root.updateMatrixWorld(true);
    const rc = new THREE.Raycaster(new V3(.6, 1.15, 3).add(park.root.position), new V3(0, 0, -1)); const hit = rc.intersectObject(h, true)[0];
    if (hit) { skin.pos.copy(hit.point).sub(park.root.position); skin.quat.setFromUnitVectors(new V3(0, 1, 0), new V3(0, 0, 1)); }
  };
  FR.skin = skin;
  const cell = skin.addChild(new Frame({ type: 'cell', name: 'Skin cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: new V3(0, -12, 0), opts: { type: "animal" } }));
  FR.cell = cell;
  const dna = cell.addChild(new Frame({ type: 'dna', name: 'DNA', unit: 1e-9, radius: 30, r1: 2.5e-7 }));
  dna.place = () => { if (cell.v2 && cell.v2.nucPos) dna.pos.copy(cell.v2.nucPos).multiplyScalar(cell.v2.k); };
  FR.dna = dna;
  const bp = dna.addChild(new Frame({ type: 'mol', name: 'A–T base pair', unit: 1e-10, radius: 25, r1: 1.2e-8, spawnD: 1e-9, opts: { mol: 'bp_AT', fixed: true } }));
  FR.bp = bp;
  const atom = bp.addChild(atomFrame('O', new V3()));
  atom.place = () => { if (bp.molAtoms) { const a = bp.molAtoms.find(a => a[0] === 'O'); if (a) atom.pos.set(a[1], a[2], a[3]); } };
  FR.atom = atom;
  const nuc = atom.addChild(new Frame({ type: 'nucleus', name: 'Oxygen nucleus', unit: 1e-15, radius: 40, r0: 1.5e-15, r1: 3e-13, spawnD: 4e-15, opts: { Z: 8, N: 8, el: 'O' } }));
  FR.nuc = nuc;
  const pr = nuc.addChild(new Frame({ type: 'proton', name: 'Proton', unit: 1e-15, radius: 4, r1: 1.2e-14, opts: { kind: 'proton' } }));
  pr.place = () => { if (nuc.nucleons) { const m = nuc.nucleons.find(m => m.userData.id === 'proton'); pr.pos.copy(m.position); } };
  FR.proton = pr;

  for (const ext of WORLD_EXT) { try { await ext(FR); } catch (e) { console.error('world extension failed', e); } }
  const go = (f, p, D) => then => flyTo(f, p || new V3(), D, then);
  LANDMARKS = [
    { label: 'Proton', D: 3e-15, go: then => { FR.nuc.ensure(); pr.place(); flyTo(pr, new V3(), 3e-15, then); } },
    { label: 'Oxygen nucleus', D: 2.2e-14, go: go(nuc, null, 2.2e-14) },
    { label: 'Oxygen atom', D: 3.2e-10, go: then => { atom.place(); flyTo(atom, new V3(), 3.2e-10, then); } },
    { label: 'Base pair (molecule)', D: 3e-9, go: go(bp, null, 3e-9) },
    { label: 'DNA', D: 2e-8, go: go(dna, null, 2e-8) },
    { label: 'Skin cell', D: 4e-5, go: go(cell, null, 4e-5) },
    { label: 'Your skin', D: 1.5e-3, go: then => { skin.place(); flyTo(skin, new V3(), 1.5e-3, then); } },
    ...devLM, bodyLM('cerebrum_r', 'Your brain', .5), bodyLM('heart', 'Your heart', .4),
    { label: 'You', D: 6, go: go(park, new V3(0, 1, 0), 6) },
    { label: 'Greenwich Park', D: 700, go: go(park, new V3(0, 0, 0), 700) },
    { label: 'London', D: 8e4, go: go(region, null, 8e4) },
    { label: 'Earth', D: 3e7, go: go(FR.earth, null, 3e7) },
    { label: 'Earth & Moon', D: 1.4e9, go: go(FR.earth, null, 1.4e9) },
    { label: 'Inner planets', D: 7e11, go: go(ss, null, 7e11) },
    { label: 'Solar system', D: 1.5e13, go: go(ss, null, 1.5e13) },
    { label: 'Oort cloud', D: 5e16, go: go(ss, null, 5e16) },
    { label: 'Nearest stars', D: 5e17, go: go(nb, null, 5e17) },
    { label: 'Local stars', D: 6e18, go: go(nb, null, 6e18) },
    { label: 'Black hole Sgr A*', D: 3e11, side: true, go: go(FR.sgr, null, 3e11) },
    { label: 'Milky Way', D: 2e21, go: go(mw, null, 2e21) },
    { label: 'Local Group', D: 2e23, go: go(lg, null, 2e23) },
    { label: 'Cosmic web', D: 4e24, go: go(root, null, 4e24) },
    { label: 'Observable universe', D: 2e27, go: go(root, null, 2e27) },
  ].filter(Boolean).concat(EXT_LANDMARKS);
  return root;
}
function startView() {
  const park = FR.park;
  // make sure the chain down to the park exists and is placed
  chainOf(park).reverse().forEach(f => { f.ensure(); if (f.place) f.place(); });
  cam.A = park; cam.T.set(0, 1.1, 0); cam.D = 7; cam.dir.set(.35, .28, 1).normalize(); cam.up.set(0, 1, 0);
}
/* "What is it made of?" — jump straight to the material, wherever you are */
function diveMaterial(h) {
  const kind = h.obj.userData.madeOf, F = h.frame, P = h.pointLocal.clone();
  let f = null, D = null;
  const metersPerLocal = F.unit;
  if (MICRO[kind]) { f = microFrame(kind, P); D = 1.2e-3; }
  else if (kind === 'plasma') { f = new Frame({ type: 'plasma', name: 'Plasma', unit: 1e-9, radius: 40, r1: 3e-7, pos: P }); D = 6e-8; }
  else if (kind === 'gasgiant' || kind === 'gas') { f = new Frame({ type: 'gas', name: 'Gas molecules', unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: P }); D = 5e-8; }
  else if (kind === 'water') { f = new Frame({ type: 'liquid', name: 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: P }); D = 5e-9; }
  else if (kind === 'molecule') { f = /air|gas/.test(h.id) ? new Frame({ type: 'gas', name: 'Air molecules', unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: P }) : new Frame({ type: 'liquid', name: 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: P }); D = f.type === 'gas' ? 5e-8 : 5e-9; }
  else if (kind === 'crystal' || kind === 'rock') { f = crystalFrame(/ice/.test(h.id) ? 'ice_ih' : 'quartz', P); D = 4e-9; }
  else if (kind === 'cell') { f = new Frame({ type: 'cell', name: 'Cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: P, opts: { type: 'animal' } }); D = 5e-5; }
  else if (kind === 'leaf') { f = microFrame('leaf', P); D = 1.2e-3; }
  else if (kind === 'protein') { f = new Frame({ type: 'mol', name: 'Amino acid', unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: P, opts: { mol: 'aa_cys' } }); D = 3e-9; }
  else if (kind === 'atom') { const c = h.obj.userData.center ? h.obj.userData.center(h) : P; f = atomFrame(h.obj.userData.sym || 'O', c); D = 7e-10; }
  else if (kind === 'quarks') { f = new Frame({ type: 'proton', name: 'Nucleon', unit: 1e-15, radius: 4, r1: 4e-15, pos: h.obj.position.clone(), opts: { kind: h.id } }); D = 3.5e-15; }
  if (!f) { message('Keep zooming in to see what this is made of.'); return; }
  f.dynamic = true; f.keep = performance.now() + 60000; F.addChild(f); f.ensure();
  flyTo(f, new V3(), D);
}
function jumpTo(f, p, D) { chainOf(f).reverse().forEach(x => { x.ensure(); if (x.place) x.place(); }); cam.A = f; cam.T.copy(p || new V3()); cam.D = D; fly = null; zoom.pending = 0; anchored.length = 0; }
