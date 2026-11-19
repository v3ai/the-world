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
  // ---- edging stones: 36 weathered stones around the water's edge (the park's old pond also had a ring of grey stones) ----
  { const sd = L.noiseDisplace(L.ellipsoid(1, .62, .82), { amp: .08, freq: 1.6, octaves: 2, seed: 5 });
    meshes.stone = L.bakeShade(L.meshSDF(sd, { min: [-1.3, -.9, -1.2], max: [1.3, .9, 1.2], res: 6, refine: 0 }), (p, n) => .7 + .3 * L.fbm(p[0] * 3, p[1] * 3, p[2] * 3, { seed: 8 }) * (.75 + .25 * n[1]));
    const st = new L.Instances('stone'); const n = 38;
    for (let i = 0; i < n; i++) { const t = (i + R.range(-.3, .3)) / n * Math.PI * 2, sOff = R.range(1.035, 1.11), x = Math.cos(t) * A * sOff, z = Math.sin(t) * B * sOff, r = R.range(.07, .15);
      st.add([x, .02 + r * .12, z], L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), [r * R.range(1, 1.5), r * R.range(.5, .8), r * R.range(.8, 1.2)]); }
    instances.stones = st; }
  // ---- leaf litter on the bed: fallen leaves, about 90 (oak-like in outline: lobed blades; the park's oaks drop them) ----
  { const lobed = t => .5 * Math.sin(Math.PI * Math.pow(t, .8)) * (1 + .22 * Math.sin(t * Math.PI * 7)) ;
    meshes.leaf = L.bakeShade(L.blade({ length: 1, halfWidth: t => .42 * lobed(t) / .5 * .8, thickness: .006, nAlong: 5, nAcross: 1, curlAcross: .25, curlAlong: .5 }), (p, n) => .75 + .25 * n[2]);
    const lit = new L.Instances('leaf');
    for (let i = 0; i < 90; i++) { const s = R.range(.25, .92), th = R.range(0, 6.28), x = Math.cos(th) * A * s, z = Math.sin(th) * B * s, y = bedY(x, z) + .004, len = R.range(.07, .13);
      // blade lies in the xy plane facing +z: turn so it faces up (+y), then spin about the vertical
      const q = L.quatMul(L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), L.quatAxisAngle([1, 0, 0], -Math.PI / 2 + R.range(-.18, .18)));
      lit.add([x, y, z], q, len); }
    instances.litter = lit; }
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
