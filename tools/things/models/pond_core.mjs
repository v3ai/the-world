// The pond's body: water surface, water volume, mud block, bank, edging stones, leaf litter, rising gas bubbles.
import * as L from '../lib/index.mjs';
import { POND, sm, sOf, bedY, bankY, polarSheet, polarWall, solid, uvSphere } from './pond_lib.mjs';

export default function core(R) {
  const meshes = {}, instances = {}, flows = {}, parts = [];
  const { a: A, b: B, yw, mudBottom } = POND;
  // ---- the water surface: one see-through sheet at the water level (0.4 mm of ripple only so the light moves on it) ----
  meshes.surface = polarSheet({ nr: 30, na: 72, fy: (x, z) => yw + .0004 * Math.sin(x * 9 + z * 5) * Math.cos(z * 7 - x * 3) });
  // ---- the water as a closed volume: the surface, the wall at the water's edge and the bed seen from above ----
  { const top = polarSheet({ nr: 22, na: 64, fy: () => yw });
    const bed = L.flip(polarSheet({ nr: 22, na: 64, fy: (x, z) => bedY(x, z) }));
    const wall = polarWall({ s: 1, na: 64, y0: (x, z) => bedY(x, z), y1: () => yw });
    meshes.water = solid(top, bed, wall); }
  // ---- the mud: a block of sediment under the pond and its bank, closed so the cut-away view can show a face ----
  { const S1 = POND.bank;
    const top = polarSheet({ s1: S1, nr: 44, na: 72, fy: (x, z, s) => s <= 1 ? bedY(x, z) : bankY(s) + .0 });
    const bot = L.flip(polarSheet({ s1: S1, nr: 6, na: 72, fy: () => mudBottom }));
    const wall = polarWall({ s: S1, na: 72, y0: () => mudBottom, y1: (x, z) => bankY(sOf(x, z)) });
    meshes.mud = L.bakeShade(solid(top, bot, wall), (p) => .72 + .28 * (.5 + .5 * L.fbm(p[0] * 6, p[1] * 6, p[2] * 6, { octaves: 3, seed: 12 })) * (.8 + .2 * sm(-.6, 0, p[1]))); }
  // ---- the bank (the marginal zone): wet soil around the water's edge, one sheet laid just above the ground ----
  meshes.bank = polarSheet({ s0: .985, s1: POND.bank, nr: 8, na: 72, fy: (x, z, s) => .02 - .012 * sm(.985, 1.22, s) + .004 * L.fbm(x * 5, 0, z * 5, { seed: 2, octaves: 2 }) });
  // ---- edging stones: an irregular natural bank, not a ring. The park's old pond had a ring of grey stones; here they lie in a few drifts of
  // different sizes (from a few centimetres to about 55 cm long), some in the shallows, some well up the bank, half sunk in the mud, with bare gaps
  // between the drifts. Two shapes (a rounded cobble and a flat slab). The positions and sizes are a choice, not a survey (the card says so).
  { // (the earlier ring drew 38 x 4 numbers from the pond's random stream; they are drawn and dropped here so that everything built after this keeps its place)
    for (let i = 0; i < 38; i++) { R.range(-.3, .3); R.range(1.035, 1.11); R.range(.07, .15); R.range(0, 6.28); R.range(1, 1.5); R.range(.5, .8); R.range(.8, 1.2); }
    const SR = L.rng(4417), bankG = s => s <= 1 ? 0 : .02 - .012 * sm(.985, 1.22, s);
    const mk = (seed, amp, ry) => { const sd = L.noiseDisplace(L.ellipsoid(1, ry, .86), { amp, freq: 1.7, octaves: 3, seed }); return L.bakeShade(L.meshSDF(sd, { min: [-1.3, -1.2, -1.2], max: [1.3, 1.2, 1.2], res: 7, refine: 0 }), (p, n) => .62 + .38 * L.fbm(p[0] * 3, p[1] * 3, p[2] * 3, { seed: seed + 3 }) * (.7 + .3 * n[1])); };
    meshes.stone = mk(5, .1, .66); meshes.stone_slab = mk(15, .06, .5);
    const st = new L.Instances('stone'), sl = new L.Instances('stone_slab');
    const centres = []; for (let g = 0; g < 7; g++) { let t, ok; for (let k = 0; k < 30; k++) { t = SR.range(0, 6.2832); ok = centres.every(c => Math.abs(Math.atan2(Math.sin(t - c), Math.cos(t - c))) > .55); if (ok) break; } centres.push(t); }
    const lone = Array.from({ length: 7 }, () => SR.range(0, 6.2832));
    const stones = [];
    for (const c of centres) { const k = 2 + Math.floor(SR.range(0, 5)); for (let i = 0; i < k; i++) stones.push([c + (SR.range(0, 1) + SR.range(0, 1) - 1) * .2, true]); }
    for (const t of lone) stones.push([t, false]);
    let big = 0;
    for (const [t, grp] of stones) {
      let r = .045 * Math.exp(.9 * (SR.range(0, 1) + SR.range(0, 1) + SR.range(0, 1) - 1.5) * 1.5) + .02; r = Math.min(r, .17); if (r > .12 && ++big > 4) r = .07;
      const e = grp ? SR.range(-.1, .32) : SR.range(-.14, .5), nx = Math.cos(t) / A, nz = Math.sin(t) / B, nl = Math.hypot(nx, nz), x = Math.cos(t) * A + nx / nl * e, z = Math.sin(t) * B + nz / nl * e;
      const sOf2 = Math.hypot(x / A, z / B), gy = sOf2 < 1 ? bedY(x, z) : bankG(sOf2), slab = r < .1 ? SR() < .3 : SR() < .5;
      const sx = r * SR.range(.95, 1.7), sy = r * (slab ? SR.range(.3, .5) : SR.range(.55, .85)), sz = r * SR.range(.7, 1.2);
      const q = L.quatMul(L.quatAxisAngle([0, 1, 0], SR.range(0, 6.28)), L.quatMul(L.quatAxisAngle([1, 0, 0], SR.range(-.22, .22)), L.quatAxisAngle([0, 0, 1], SR.range(-.22, .22))));
      (slab ? sl : st).add([x, Math.max(gy, sOf2 < 1 ? gy : 0) + sy * SR.range(-.05, .3), z], q, [sx, sy, sz]);
    }
    instances.stones = st; instances.stones_slab = sl; }
  // ---- leaf litter on the bed: fallen leaves, about 90 (oak-like in outline: lobed blades; the park's oaks drop them) ----
  { const lobed = t => .5 * Math.sin(Math.PI * Math.pow(t, .8)) * (1 + .22 * Math.sin(t * Math.PI * 7)) ;
    meshes.leaf = L.bakeShade(L.blade({ length: 1, halfWidth: t => .42 * lobed(t) / .5 * .8, thickness: .006, nAlong: 5, nAcross: 1, curlAcross: .25, curlAlong: .5 }), (p, n) => .75 + .25 * n[2]);
    const lit = new L.Instances('leaf');
    for (let i = 0; i < 90; i++) { const s = R.range(.25, .92), th = R.range(0, 6.28), x = Math.cos(th) * A * s, z = Math.sin(th) * B * s, y = bedY(x, z) + .004, len = R.range(.07, .13);
      // blade lies in the xy plane facing +z: turn so it faces up (+y), then spin about the vertical
      const q = L.quatMul(L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), L.quatAxisAngle([1, 0, 0], -Math.PI / 2 + R.range(-.18, .18)));
      lit.add([x, y, z], q, len); }
    instances.litter = lit; }
  // ---- leaves floating on the surface: a few fallen oak leaves lying flat on the water (the same lobed leaf as the ones on the bed), 6 to 12 cm.
  // They lie with their upper side up and a little curl at the edge; seen from below the same leaf shows its underside (a light-through leaf, not a black cut-out).
  { const FR = L.rng(7203), lit = new L.Instances('leaf'), spots = [[.6, .9], [-.4, -1.0], [1.7, .45], [-1.9, -.5], [.1, .1], [1.0, -.9], [-1.1, .3]];
    for (const [x0, z0] of spots) { const x = x0 + FR.range(-.18, .18), z = z0 + FR.range(-.18, .18), len = FR.range(.06, .12);
      const q = L.quatMul(L.quatAxisAngle([0, 1, 0], FR.range(0, 6.28)), L.quatAxisAngle([1, 0, 0], -Math.PI / 2 + FR.range(-.06, .06)));
      lit.add([x, yw + .0004, z], q, len); }
    instances.floating_leaves = lit; }
  // ---- grass and sedge at the bank, leaning out over the water: tufts of blades 18 to 40 cm, each blade a ribbon that rises and then arches toward the water.
  // A tuft is one shape (11 blades, 88 triangles) turned to lean to the pond's middle and put where the bank is, in runs with gaps (the drifts of stones have none).
  { const tuft = L.newMesh(), TR = L.rng(61), nb = 11, ns = 4;
    for (let b = 0; b < nb; b++) {
      const ang = (b / nb) * 6.2832 + TR.range(-.3, .3), bx = Math.cos(ang) * .012, bz = Math.sin(ang) * .012, len = TR.range(.3, 1) * TR.range(.7, 1), w = TR.range(.0026, .0042), lean = TR.range(.2, 1.5), side = TR.range(-.8, .8);
      const k0 = tuft.pos.length / 3;
      for (let i = 0; i <= ns; i++) { const t = i / ns, out = lean * len * .42 * Math.pow(t, 1.6), wt = w * (1 - .85 * Math.pow(t, 2.2));   // width tapers to a point
        const cx = bx + out + Math.cos(ang) * .02 * t, cz = bz + side * len * .12 * t * t + Math.sin(ang) * .02 * t, cy = len * .75 * (t - .75 * t * t);
        tuft.pos.push(cx, cy, cz - wt, cx, cy, cz + wt); }
      for (let i = 0; i < ns; i++) { const a = k0 + i * 2; tuft.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
    meshes.tuft = L.bakeShade(tuft, p => .55 + .45 * Math.min(1, p[1] / .16));
    const tf = new L.Instances('tuft'), TF = L.rng(8801);
    for (let i = 0; i < 400 && tf.count < 190; i++) {
      const t = TF.range(0, 6.2832), e = TF.range(-.03, .3), nx = Math.cos(t) / A, nz = Math.sin(t) / B, nl = Math.hypot(nx, nz), x = Math.cos(t) * A + nx / nl * e, z = Math.sin(t) * B + nz / nl * e;
      const run = .5 + .5 * Math.sin(t * 3.1 + 1.7) * Math.sin(t * 1.3 + .4); if (run < .3 || TF() > run + .25) continue;   // runs of tufts with gaps
      const sOf2 = Math.hypot(x / A, z / B), y = sOf2 < 1 ? bedY(x, z) : .02 - .012 * sm(.985, 1.22, sOf2);   // +x of the tuft turned to the pond's middle
      tf.add([x, y, z], L.quatAxisAngle([0, 1, 0], Math.atan2(z, -x) + TF.range(-.5, .5)), TF.range(.55, 1.25)); }
    instances.bank_tufts = tf; }
  // ---- gas bubbles rising from the mud (a flow part: markers travel up fixed paths, looping; the speed is a drawing speed, not a measurement) ----
  { meshes.bubble = uvSphere(.0035, 8, 5);
    const paths = [], sources = [[-.9, .75], [.2, .95], [1.1, .3], [-.3, -.55], [.7, -.8], [-1.5, -.2], [1.9, -.6], [.1, .2]];
    for (const [x, z] of sources) { const y0 = bedY(x, z) + .01, pts = []; for (let k = 0; k <= 6; k++) pts.push(x + .012 * Math.sin(k * 1.7 + x * 5), y0 + (yw - .005 - y0) * k / 6, z + .012 * Math.cos(k * 1.3 + z * 5)); paths.push({ p: pts.map(v => Math.round(v * 1e4) / 1e4), r: [0, 0, 0, 0, 0, 0, 0] }); }
    const markers = []; paths.forEach((_, i) => { for (let j = 0; j < 4; j++) markers.push([i, Math.round((j / 4 + R.range(0, .15)) * 1e3) / 1e3, 0]); });
    // a few bubbles that have just left the mud and rest on it: 5 to 7 mm (the rising ones are drawn at the same size)
    const rest = new L.Instances('bubble'); for (const [x, z] of sources) for (let k = 0; k < 2; k++) rest.add([x + R.range(-.03, .03), bedY(x, z) + .004, z + R.range(-.03, .03)], [0, 0, 0, 1], R.range(.6, 1.2));
    instances.mud_bubbles = rest;
    flows.bubbles = { mesh: 'bubble', dir: 1, speed: .03, ring: 0, paths, markers }; }
  return { meshes, instances, flows };
}
