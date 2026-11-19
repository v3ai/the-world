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
  const body = park.addChild(new Frame({ type: 'body', name: 'Human body', unit: 1, radius: 1.0, center: new V3(0, .875, 0), r0: 0, r1: 90, up: new V3(0, 1, 0), pos: new V3(0, 0, 0) }));
  body.noFade = true; body.coRender = true; body.coMax = 400; FR.body = body;
  const devLM = buildTeardown(body);
  const AN = await loadAnatomyIndex(); await loadNodes(); if (AN) makeOrganFrames(body, AN);
  const skin = park.addChild(microFrame('skin', new V3(0, 1.2, .2)));
  skin.place = () => {
    if (skin._placed || !park.built || !park.v2) return; skin._placed = true;
    const h = park.v2.parts.human; park.root.updateMatrixWorld(true);
    const rc = new THREE.Raycaster(new V3(.6, 1.15, 3).add(park.root.position), new V3(0, 0, -1)); const hit = rc.intersectObject(h, true)[0];
    if (hit) { skin.pos.copy(hit.point).sub(park.root.position); skin.quat.setFromUnitVectors(new V3(0, 1, 0), new V3(0, 0, 1)); }
  };
  skin.faceUp = true; FR.skin = skin;
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
  // A landmark: {label, D, frame, go(then)}. `frame` is where the camera must be anchored (or inside) after the flight.
  const LM = (label, f, p, D, extra) => Object.assign({ label, D, frame: f, go: then => flyTo(f, p || new V3(), D, then) }, extra || {});
  const organ = (id, fallback) => body.children.find(c => c.type === 'organ' && c.opts.organ === id) || fallback;
  const bodyLM = (id, label, D, organId) => {
    const p = AN && AN.byId[id]; if (!p) return null;
    const o = organId && organ(organId);
    return o ? LM(label, o, new V3(), o.opts.R * 2.2, { side: true }) : LM(label, body, new V3(...p.center), D, { side: true });
  };
  LANDMARKS = [
    LM('Proton', pr, null, 3e-15),
    LM('Oxygen nucleus', nuc, null, 2.2e-14),
    LM('Oxygen atom', atom, null, 3.2e-10),
    LM('Base pair (molecule)', bp, null, 3e-9),
    LM('DNA', dna, null, 2e-8),
    LM('Skin cell', cell, null, 4e-5),
    LM('Your skin', skin, null, 1.5e-3),
    ...devLM, bodyLM('cerebrum_r', 'Your brain', .5, 'brain'), bodyLM('heart', 'Your heart', .4, 'heart'),
    LM('You', park, new V3(0, 1, 0), 6),
    LM('Greenwich Park', park, new V3(0, 0, 0), 700),
    LM('London', region, null, 8e4),
    LM('Earth', FR.earth, null, 3e7),
    LM('Earth & Moon', FR.earth, null, 1.4e9),
    LM('Inner planets', ss, null, 7e11),
    LM('Solar system', ss, null, 1.5e13),
    LM('Oort cloud', nb, null, 5e16),
    LM('Nearest stars', nb, null, 5e17),
    LM('Local stars', nb, null, 6e18),
    LM('Black hole Sgr A*', FR.sgr, null, 3e11, { side: true }),
    LM('Milky Way', mw, null, 2e21),
    LM('Local Group', lg, null, 2e23),
    LM('Cosmic web', root, null, 4e24),
    LM('Observable universe', root, null, 2e27),
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
function diveMaterial(h, quiet) {   // returns the frame it flies into, or null when there is none for this material (quiet: say nothing then)
  const kind = h.obj.userData.madeOf, F = h.frame, P = h.pointLocal.clone();
  let f = null, D = null;
  const metersPerLocal = F.unit, ud = h.obj.userData;
  if (kind === 'cell' && ud.cellOpts) { // a cell-bearing thing opens the right kind of cell (plant, bacterium, ...)
    const co = ud.cellOpts;
    f = new Frame({ type: 'cell', name: co.cname || (co.type === 'plant' ? 'Plant cell' : co.type === 'bacterium' ? 'Bacterium' : 'Animal cell'), unit: 1e-6, radius: 16, r1: 2.5e-4, pos: P, opts: Object.assign({}, co) }); D = co.type === 'bacterium' ? 6e-6 : 5e-5;
  }
  else if (kind === 'gasgiant') { const body = F.opts && F.opts.body || 'the planet'; f = new Frame({ type: 'gas', name: `Hydrogen and helium gas (${body})`, unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: P, opts: { air: 'giant' } }); D = 5e-8; }
  else if (MICRO[kind]) { f = microFrame(kind, P); D = 1.2e-3; }
  else if (kind === 'plasma') { f = new Frame({ type: 'plasma', name: 'Plasma', unit: 1e-9, radius: 40, r1: 3e-7, pos: P }); D = 6e-8; }
  else if (kind === 'gas') { f = new Frame({ type: 'gas', name: 'Gas molecules', unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: P }); D = 5e-8; }
  else if (kind === 'water') { f = new Frame({ type: 'liquid', name: 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: P }); D = 5e-9; }
  else if (kind === 'molecule') { f = /air|gas/.test(h.id) ? new Frame({ type: 'gas', name: 'Air molecules', unit: 1e-9, radius: 24, r1: 2e-7, spawnD: 1.2e-9, pos: P }) : new Frame({ type: 'liquid', name: 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: P }); D = f.type === 'gas' ? 5e-8 : 5e-9; }
  else if (kind === 'silicon') { f = crystalFrame('silicon', P); D = 4e-9; } // the chips of a phone: a silicon crystal
  else if (kind === 'crystal' || kind === 'rock') { f = crystalFrame(/ice/.test(h.id) ? 'ice_ih' : 'quartz', P); D = 4e-9; }
  else if (kind === 'cell') { f = new Frame({ type: 'cell', name: 'Animal cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: P, opts: { type: 'animal' } }); D = 5e-5; }
  else if (kind === 'leaf') { f = microFrame('leaf', P); D = 1.2e-3; }
  else if (kind === 'protein') { f = new Frame({ type: 'mol', name: 'Example molecule: cysteine, an amino acid (stands in for the protein)', unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: P, opts: { mol: 'aa_cys' } }); D = 3e-9; }
  else if (kind === 'atom') { const c = h.obj.userData.center ? h.obj.userData.center(h) : P; f = atomFrame(h.obj.userData.sym || 'O', c); D = 7e-10; }
  else if (kind === 'quarks') { f = new Frame({ type: 'proton', name: 'Nucleon', unit: 1e-15, radius: 4, r1: 4e-15, pos: h.obj.position.clone(), opts: { kind: h.id } }); D = 3.5e-15; }
  if (!f) { if (!quiet) message('Keep zooming in to see what this is made of.'); return null; }
  f.dynamic = true; f.keep = performance.now() + 60000; F.addChild(f); f.ensure();
  flyTo(f, new V3(), D);
  return f;
}
function jumpTo(f, p, D) { chainOf(f).reverse().forEach(x => { x.ensure(); if (x.place) x.place(); }); cam.A = f; cam.T.copy(p || new V3()); cam.D = D; fly = null; zoom.pending = 0; anchored.length = 0; }
