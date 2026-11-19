// A boulder with a few named parts: the simplest complete thing, used to prove the pipeline end to end.
// Rock body (a granite-like coarse-grained rock, modelled), moss cushions, lichen patches (instanced), loose stones (instanced).
import * as L from '../lib/index.mjs';

const SYSTEMS = [
  { id: 'rock', label: 'Rock' },
  { id: 'growth', label: 'Living on it' },
  { id: 'debris', label: 'Loose stones' },
];
const MODES = [
  { id: 'whole', label: 'Whole', show: { '*': 1 } },
  { id: 'living', label: 'What lives on it', show: { growth: 1, rock: .3, debris: .3 } },
  { id: 'rock', label: 'Bare rock', show: { rock: 1, debris: 1, growth: 0 } },
  { id: 'cut', label: 'Cut open', cut: true, show: { '*': 1 } },
];

export default function build(_L) {
  const R = L.rng(1701);
  // ---- rock: three overlapping lumps, blended, roughened by two noise scales, flat base sunk a little below the ground ----
  const lump = (rx, ry, rz, at, yaw) => L.translate(L.rotate(L.ellipsoid(rx, ry, rz), [0, 1, 0], yaw), at);
  let body = L.smoothUnion(.1, lump(.62, .36, .5, [0, .33, 0], .3), lump(.4, .3, .34, [.38, .27, .14], -.5), lump(.34, .27, .4, [-.4, .25, -.12], .9));
  // a few cracks: thin rounded slabs cut into the surface (weathering opens joints in rock)
  const crack = (at, yaw, tilt, w, h) => L.translate(L.rotate(L.rotate(L.box(.5, h, w, w * .4), [0, 1, 0], yaw), [1, 0, 0], tilt), at);
  body = L.smoothSubtract(.02, body, L.union(crack([.1, .45, .35], .2, .5, .006, .5), crack([-.25, .3, -.3], 1.1, -.4, .005, .4), crack([.5, .25, -.1], 2.2, .3, .006, .3)));
  body = L.ridgeDisplace(body, { amp: .034, freq: 2.6, octaves: 3, seed: 7 });
  body = L.noiseDisplace(body, { amp: .006, freq: 16, octaves: 2, seed: 11 });
  const rock = L.intersect(body, L.halfSpace([0, -1, 0], .06));   // keep y > -0.06
  const bnd = { min: [-1.05, -.07, -.95], max: [1.05, .95, .95] };
  const rockMesh = L.meshSDF(rock, { ...bnd, cell: .024, refine: 2 });
  const rockShade = (p, n) => { const d = .1, ao = Math.max(0, Math.min(1, rock([p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d]) / d)), st = L.fbm(p[0] * 5, p[1] * 5, p[2] * 5, { octaves: 3, seed: 21 }), up = .5 + .5 * n[1]; return (.55 + .45 * ao) * (.8 + .3 * st) * (.88 + .12 * up); };
  L.bakeShade(rockMesh, rockShade);
  const farMesh = L.bakeShade(L.simplify(rockMesh, .12), rockShade);
  const st = L.stats(rockMesh);
  // ---- moss: cushions sitting on the upper surface ----
  const mossBlobs = [];
  for (let i = 0; i < 26; i++) {
    const a = R.range(0, Math.PI * 2), rr = Math.sqrt(R()) * .5, o = [Math.cos(a) * rr * (R() < .5 ? 1 : .8) - .05, 1.3, Math.sin(a) * rr * .8], h = L.surfaceHit(rock, o, [0, -1, 0], 3);
    if (!h || L.normalAt(rock, h.p)[1] < .55) continue;
    mossBlobs.push(L.translate(L.ellipsoid(R.range(.05, .1), R.range(.02, .035), R.range(.05, .1)), [h.p[0], h.p[1] - .004, h.p[2]]));
  }
  const moss0 = L.noiseDisplace(L.smoothUnion(.05, ...mossBlobs), { amp: .006, freq: 30, octaves: 2, seed: 3 });
  const mossMesh = L.bakeShade(L.meshSDF(moss0, { min: [-.8, .2, -.7], max: [.8, .95, .7], cell: .016, refine: 1 }), (p, n) => .72 + .28 * (.5 + .5 * L.fbm(p[0] * 40, p[1] * 40, p[2] * 40, { octaves: 2, seed: 4 })) * (.7 + .3 * n[1]));
  // ---- lichen: flat crusts, instanced, lying along the local surface normal ----
  const patch = L.lathe([[0, .16], [.55, .15], [.9, .09], [1, 0], [0, 0]], { segments: 9, caps: false });   // a flat crust: 9-sided disc, bulging a little in the middle
  const lichen = new L.Instances('patch'), lichenY = new L.Instances('patch'); const spots = [];
  const onRock = (v) => L.surfaceHit(rock, [v[0] * 1.6, .35 + v[1] * 1.4, v[2] * 1.6], L.norm([-v[0], -(v[1] * 1.4), -v[2]]), 4);
  const centres = [];
  while (centres.length < 8) { const v = R.unitVec(); if (v[1] < -.1) continue; const h = onRock(v); if (h && h.p[1] > .08) centres.push(h.p); }
  centres.forEach((c, ci) => {
    const target = ci % 3 === 0 ? lichenY : lichen, n = ci % 3 === 0 ? 22 : 55;
    let made = 0;
    for (let i = 0; i < n * 4 && made < n; i++) {
      const o = [c[0] + R.gauss() * .11, c[1] + .5 + R.gauss() * .08, c[2] + R.gauss() * .11], h = L.surfaceHit(rock, o, [0, -1, 0], 2); if (!h || h.p[1] < .04) continue;
      if (Math.hypot(h.p[0] - c[0], h.p[1] - c[1], h.p[2] - c[2]) > .3) continue;
      const nn = L.normalAt(rock, h.p), q = L.quatMul(L.quatFromTo([0, 1, 0], nn), L.quatAxisAngle([0, 1, 0], R.range(0, 6.28))), s = R.range(.008, .028) * (ci % 3 === 0 ? .9 : 1);
      target.add([h.p[0] + nn[0] * .002, h.p[1] + nn[1] * .002, h.p[2] + nn[2] * .002], q, [s, s * R.range(.6, 1.2), s * R.range(.8, 1.4)]);
      spots.push(h.p); made++;
    }
  });
  // ---- loose stones around the base: weathered fragments ----
  const stoneSdf = L.noiseDisplace(L.ellipsoid(1, .62, .8), { amp: .07, freq: 1.6, octaves: 2, seed: 5 });
  const stone = L.bakeShade(L.meshSDF(stoneSdf, { min: [-1.3, -.8, -1.1], max: [1.3, .8, 1.1], res: 8 }), (p, n) => .75 + .25 * L.fbm(p[0] * 3, p[1] * 3, p[2] * 3, { seed: 8 }));
  const stones = new L.Instances('stone');
  for (let i = 0; i < 46; i++) {
    const a = R.range(0, 6.28), d = R.range(.78, 1.5) - (R() < .3 ? .15 : 0), s = Math.pow(R(), 2) * .05 + .018;
    stones.add([Math.cos(a) * d * 1.05, s * .3, Math.sin(a) * d * .9], L.quatAxisAngle(R.unitVec(), R.range(0, 6.28)), [s * R.range(.9, 1.4), s * R.range(.6, 1), s * R.range(.8, 1.2)]);
  }
  // marker on the rock where a lichen crust meets it: the lichen patch nearest the top front
  const top = spots.slice().sort((a, b) => (b[1] - Math.abs(b[2]) * .3) - (a[1] - Math.abs(a[2]) * .3))[0] || [0, .6, .3];
  const thing = {
    id: 'boulder', title: 'Boulder', label: 'Boulder', scientific: null, node: 'boulder', main_part: 'rock',
    blurb: 'A weathered boulder in the park: bare rock with moss and lichen growing on it, and loose stones at its foot. Click any part.',
    model_note: 'A model built from typical features of a coarse-grained rock (granite), not a scan of one particular boulder. Sizes are about right for a large boulder; the grain pattern shown when cut open is illustrative.',
    size_m: { height: .67, width: 1.53, depth: 1.0 }, height_m: .67, radius_m: 1.7, draw_m: 500,
    seed: 1701,
    systems: SYSTEMS, modes: MODES,
    lod: { near_m: 15 },
    shadow: { radius_m: 1.35, opacity: .8 },
    cut: { default: 'granite', at: [0, .3, 0], faces: { moss: { kind: 'plain', palette: [[0x3c6526, 1]] }, granite: { kind: 'grains', cell: .04, edge: .5, palette: [[0x9a9fa3, .27], [0xd8b49c, .30], [0xeee6d6, .28], [0x2a2a30, .15]],
      legend: [{ name: 'Quartz (grey, glassy)', color: '#9a9fa3', node: 'rock_grains' }, { name: 'Feldspar (pink or white)', color: '#d8b49c', node: 'rock_grains' }, { name: 'Dark minerals (mica and others)', color: '#2a2a30', node: 'rock_grains' }],
      note: 'Illustrative grain pattern for a coarse-grained rock; the real arrangement in any one rock differs.' } } },
    hotspots: [{ id: 'lichen_contact', node: 'lichen_on_rock', at: top.map(v => +v.toFixed(3)), label: 'Where lichen meets rock' }],
    parts: [
      { id: 'rock', name: 'Rock', system: 'rock', node: 'boulder', color: '#7f7c75', mesh: 'rock', lod: 'near', ink_w: .0012, priority: 1.4, deeper: { type: 'crystal', id: 'quartz', D: 4e-9, button: 'See a crystal of quartz, one of its minerals' } },
      { id: 'rock_far', name: 'Rock', system: 'rock', node: 'boulder', color: '#7f7c75', mesh: 'rock_far', lod: 'far', solid: true, priority: 1.4, far_of: 'rock' },
      { id: 'moss', name: 'Moss', system: 'growth', node: 'bio_bryophytes_seedless', color: '#5f8d3a', mesh: 'moss', cutFace: 'moss', priority: 2, ink_w: .0014 },
      { id: 'lichen', name: 'Lichen', system: 'growth', node: 'bio_lichens_fungal_biotech', color: '#a9b08c', instances: 'lichen', tint: .25, priority: 2, lod: 'near' },
      { id: 'lichen_yellow', name: 'Lichen', system: 'growth', node: 'bio_lichens_fungal_biotech', color: '#d1a53c', instances: 'lichen_y', tint: .2, priority: 2, lod: 'near' },
      { id: 'stones', name: 'Loose stones', system: 'debris', node: 'boulder_debris', color: '#7d7a73', instances: 'stones', tint: .12, priority: 1.8 },
    ],
  };
  return { thing, meshes: { rock: rockMesh, rock_far: farMesh, moss: mossMesh, patch, stone }, instances: { lichen, lichen_y: lichenY, stones }, info: st };
}
