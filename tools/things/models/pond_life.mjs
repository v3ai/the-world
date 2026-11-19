// The pond's animals, each built in millimetres in its own frame (x forward, y up, z across), then placed in the pond in metres:
// pond skater, water flea (Daphnia), great pond snail, southern hawker larva, common frog tadpole.
import * as L from '../lib/index.mjs';
import { POND, bedY, place, mmToM, rad, E, sp, aoShade, uvSphere } from './pond_lib.mjs';

// ---- sizes (sources in tools/things/content/pond_nodes.py and the report) ----
export const LIFE_M = {
  skater: { body: 9 },           // Gerris lacustris body 8-10 mm (Wikipedia, Gerris lacustris)
  daphnia: { body: 2.5 },        // Daphnia: usually 1-5 mm long (Wikipedia, Daphnia); the model is a 2.5 mm adult female
  snail: { h: 50, w: 25 },       // Lymnaea stagnalis shell height 45-60 mm, width 20-30 mm (Wikipedia, Lymnaea stagnalis)
  larva: { len: 42 },            // southern hawker (Aeshna cyanea) larva 38-48 mm (British Dragonfly Society species page)
  tadpole: { body: 14, tail: 20, legs: 4 },   // common frog tadpoles with hind legs: body 10-17.5 mm, tail 15-27.5 mm, hind limb 2-9 mm (Bland, Glasgow Naturalist; upland tadpoles in Perthshire, so a guide, not a norm for lowland ponds)
};
const S = [1, -1];
const bnd = (sdf, min, max, cell, refine = 1, sm = 0) => { let m = L.meshSDF(sdf, { min, max, cell, refine }); if (sm) m = L.smooth(m, sm); return m; };
const tubeM = (pts, r, sides = 6, n = 0, caps = true) => L.tube(n ? sp(pts, n) : pts, r, { sides, caps });

// =============== pond skater (Gerris lacustris), standing on the water: y = 0 is the water surface ===============
function skater() {
  const m = {};
  const bodyS = L.smoothUnion(.5, E([0, 2.4, 0], [3.3, .85, .8]), E([-2.4, 2.35, 0], [2.4, .9, .85]), E([3.4, 2.5, 0], [1.1, .8, .8]));
  m.body = L.bakeShade(bnd(bodyS, [-5.2, 1.0, -1.4], [4.9, 3.8, 1.4], .2, 1), aoShade(bodyS, .9));
  m.body = L.merge(m.body, bnd(L.union(E([4.0, 2.9, .72], [.38, .42, .35]), E([4.0, 2.9, -.72], [.38, .42, .35])), [3.4, 2.3, -1.3], [4.7, 3.5, 1.3], .08, 1));
  const leg = (pts, r0, r1, side) => tubeM(pts.map(p => [p[0], p[1], p[2] * side]), t => r0 + (r1 - r0) * t, 5, 18, true);
  const front = [], mid = [], hind = [];
  for (const s of S) {
    front.push(leg([[3.1, 2.2, .5], [4.3, 3.0, 1.5], [5.4, 2.2, 1.9], [6.1, 1.4, 1.6]], .17, .09, s));
    mid.push(leg([[.4, 2.2, .6], [1.2, 5.0, 4.2], [2.3, 2.6, 8.4], [2.9, .35, 10.6], [3.9, .05, 11.4]], .2, .08, s));
    hind.push(leg([[-1.7, 2.2, .6], [-3.0, 4.3, 3.2], [-5.6, 2.6, 6.8], [-7.6, .35, 8.7], [-9.6, .05, 9.3]], .19, .075, s));
  }
  m.front = L.merge(...front); m.mid = L.merge(...mid); m.hind = L.merge(...hind);
  // the dimples: eight shallow bowls in the film under the four feet that stand on it (a lathe of a dip with a faint raised rim)
  const bowl = L.lathe([[0, -.55], [.45, -.5], [1.0, -.3], [1.55, -.04], [2.0, .07], [2.5, .03], [3.0, 0]], { segments: 14, caps: false });
  const feet = [[3.0, 10.4], [3.0, -10.4], [-8.4, 8.9], [-8.4, -8.9]];
  m.dimples = L.merge(...feet.map(([x, z]) => L.translateMesh(bowl, [x, 0, z])));
  return m;
}

// =============== water flea (Daphnia): lateral view, head to +x, back up, 2.5 mm ===============
function daphnia() {
  const m = {};
  // the carapace folds over the body like two thin valves; it is drawn as one translucent shell (a closed shape) with the tail spine
  const cp = L.translateMesh(L.scaleMesh(uvSphere(1, 22, 13), [1.25, .95, .58]), [-.1, .05, 0]);
  const spine = tubeM([[-1.05, .45, 0], [-1.45, .75, 0], [-1.9, 1.0, 0]], t => .055 * (1 - .85 * t), 5, 6, true);
  m.carapace = L.merge(cp, spine);
  const headS = L.smoothUnion(.2, E([1.4, .25, 0], [.62, .55, .45]), E([1.78, -.15, 0], [.28, .22, .2]));
  m.head = L.bakeShade(bnd(headS, [.6, -.5, -.6], [2.2, .9, .6], .09, 1), aoShade(headS, .95, .1));
  m.eye = L.translateMesh(uvSphere(.22, 10, 6), [1.95, .38, 0]);
  // second antennae: two large branched swimming limbs from the head's lower back, each with a stalk and two branches carrying setae
  const ant = [];
  for (const s of S) { const z = v => [v[0], v[1], v[2] * s];
    ant.push(tubeM([[1.05, -.05, .4], [.9, -.4, .55], [.7, -.7, .6]].map(z), t => .075 * (1 - .4 * t), 6, 8, true));
    for (const br of [[[.7, -.7, .6], [.3, -1.0, .75], [-.15, -1.1, .8], [-.55, -1.15, .8]], [[.7, -.7, .6], [.8, -1.15, .8], [.7, -1.5, .85], [.45, -1.75, .85]]]) ant.push(tubeM(br.map(z), t => .05 * (1 - .6 * t), 5, 10, true)); }
  m.antennae = L.merge(...ant);
  m.heart = L.translateMesh(L.scaleMesh(uvSphere(1, 12, 7), [.2, .14, .13]), [.4, .58, 0]);
  const gut = tubeM([[.95, -.1, 0], [.4, .05, 0], [-.2, .12, 0], [-.7, 0, 0], [-1.0, -.35, 0]], t => .095 * (1 - .25 * t) + .02, 7, 14, true);
  m.gut = L.merge(gut, L.translateMesh(L.scaleMesh(uvSphere(1, 8, 5), [.2, .1, .1]), [.78, .15, .1]), L.translateMesh(L.scaleMesh(uvSphere(1, 8, 5), [.2, .1, .1]), [.78, .15, -.1]));
  // eggs in the brood chamber on the back, behind the heart: four embryos, each about 0.35 mm
  const eg = []; [[-.15, .5, .12], [-.5, .52, -.1], [-.55, .35, .18], [-.85, .42, -.05]].forEach(c => eg.push(L.translateMesh(uvSphere(.17, 8, 5), c)));
  m.eggs = L.merge(...eg);
  // thoracic limbs (five pairs of flattened, leaf-like filtering limbs) and the post-abdomen with its claws
  const lg = []; for (let i = 0; i < 5; i++) for (const s of S) lg.push(L.translateMesh(L.scaleMesh(uvSphere(1, 6, 4), [.09, .3, .13]), [.55 - i * .27, -.48, s * .24]));
  lg.push(tubeM([[-.95, -.42, 0], [-1.2, -.55, 0], [-1.35, -.8, 0]], .08, 5, 5, true));
  m.limbs = L.merge(...lg);
  // a tiny stand-in for the swarm: the whole animal in one mesh
  m.swarm = L.merge(L.scaleMesh(uvSphere(1, 9, 6), [1.15, .9, .5]), L.translateMesh(L.scaleMesh(uvSphere(1, 7, 4), [.55, .45, .4]), [1.45, .2, 0]), L.translateMesh(uvSphere(.15, 5, 3), [1.62, .35, 0]), spine);
  return m;
}

// =============== great pond snail (Lymnaea stagnalis): crawling along +x on the mud, shell on its back ===============
function snail() {
  const m = {}, H = LIFE_M.snail.h, W = LIFE_M.snail.w;
  // shell: a Raup-style spiral: an oval aperture swept along a logarithmic coil. W = growth per turn (3: the last whorl is about two thirds of the height),
  // D = how close the coil runs to the axis, T = how far it slides down the axis (tall spire). Six turns; the last section is the open mouth.
  const Wg = 2.5, Dd = .03, Tt = 4.0, turns = 6.2, ns = 180, np = 20, ay = 1.28;
  const rawPts = [];
  for (let i = 0; i <= ns; i++) { const t = i / ns * turns * 2 * Math.PI, g = Math.pow(Wg, t / (2 * Math.PI)), ra = .02 * g, Rc = ra * (1 + Dd) / (1 - Dd), Yc = -Tt * Rc, ring = [];
    for (let k = 0; k < np; k++) { const f = k / np * 2 * Math.PI, cr = Math.cos(f) * ra, cy = Math.sin(f) * ra * ay; ring.push([(Rc + cr) * Math.cos(t), Yc + cy, (Rc + cr) * Math.sin(t)]); }
    rawPts.push({ ring, t, c: [Rc * Math.cos(t), Yc, Rc * Math.sin(t)] }); }
  const sh = L.newMesh(); for (const r of rawPts) for (const q of r.ring) sh.pos.push(...q);
  for (let i = 0; i < ns; i++) for (let k = 0; k < np; k++) { const a = i * np + k, b = i * np + (k + 1) % np, c = a + np, d = b + np; sh.idx.push(a, c, b, b, c, d); }
  const te = turns * 2 * Math.PI, endC = rawPts[ns].c;
  // scale to the true height along the shell's own axis: apex to the lowest point of the last whorl
  const sb = L.bounds(sh), kS = H / (sb.max[1] - sb.min[1]);
  console.log('snail shell: height', H, 'width x', ((sb.max[0] - sb.min[0]) * kS).toFixed(1), 'width z', ((sb.max[2] - sb.min[2]) * kS).toFixed(1));
  // orientation: apex up and back, mouth facing forward, down and to the right (the coil is right-handed)
  const nrm = v => L.norm(v); let A = nrm([-.6, .8, .1]), Nn = nrm([.85, -.2, .45]); Nn = nrm(L.sub(Nn, L.mul(A, L.dot(A, Nn))));
  const Rr = L.cross(A, Nn), Tn = [-Math.sin(te), 0, Math.cos(te)], Rend = [Math.cos(te), 0, Math.sin(te)];
  const rot = p => { const x = L.dot(p, Rend), y = p[1], z = L.dot(p, Tn); return [Rr[0] * x + A[0] * y + Nn[0] * z, Rr[1] * x + A[1] * y + Nn[1] * z, Rr[2] * x + A[2] * y + Nn[2] * z]; };
  let shR = L.transform(sh, p => rot([p[0] * kS, p[1] * kS, p[2] * kS]));
  const mouth = rot([endC[0] * kS, endC[1] * kS, endC[2] * kS]);
  m.shell = L.bakeShade(L.translateMesh(shR, [8 - mouth[0], 9.5 - mouth[1], 3.2 - mouth[2]]), (p, n) => .62 + .38 * (.5 + .5 * n[1]));
  m._shellBounds = L.bounds(m.shell);
  // foot and head: a long foot with a flat sole, a rounded head, a mantle collar at the shell's mouth
  const bodyS = L.smoothUnion(2.2, E([0, 4.0, 0], [18, 4.2, 6.2]), E([16, 5.2, 0], [7, 4, 4.2]), E([6, 9, 2.5], [8, 4.5, 5]));
  const cutBottom = L.intersect(bodyS, L.halfSpace([0, -1, 0], -.0));
  m.body = L.bakeShade(bnd(cutBottom, [-20, -.1, -8], [26, 14, 9], .9, 1, 1), (p) => .55 + .45 * Math.min(1, p[1] / 6));
  // two broad, flat, triangular tentacles (a pond snail's tentacles are flattened, unlike a land snail's round ones); the eyes sit at their base on the inner side
  const tentM = L.extrudeOutline([[0, -1.9], [0, 1.9], [5.6, 0]], .8);
  const tpl = s => L.transform(tentM, p => { const q = L.rotAxis(L.rotAxis([p[0], p[1], p[2]], [1, 0, 0], rad(90)), [0, 1, 0], rad(s * 38)); return [q[0] + 22.2, q[1] + 6.0, q[2] + s * 2.2]; });
  m.tentacles = L.merge(tpl(1), tpl(-1));
  m.eyes = L.merge(...S.map(s => L.translateMesh(uvSphere(.62, 8, 5), [23.2, 7.0, s * 2.0])));
  return m;
}

// =============== southern hawker larva (Aeshna cyanea): 42 mm, head to +x ===============
function larva() {
  const m = {};
  const headS = L.smoothUnion(.6, E([19.2, 1.6, 0], [3.0, 2.3, 3.4]));
  const eyesS = L.union(...S.map(s => E([20.0, 2.5, s * 2.9], [1.8, 1.7, 1.5])));
  m.head = L.bakeShade(bnd(headS, [15.5, -1.5, -4.5], [23, 5, 4.5], .45, 1), aoShade(headS, .9, .3));
  m.eyes = bnd(eyesS, [17.5, .3, -5], [22.5, 5, 5], .4, 1);
  const thS = L.smoothUnion(.6, E([12.0, 2.3, 0], [4.6, 2.9, 3.0]), E([8.4, 2.3, 0], [2.8, 2.5, 2.8]));
  m.thorax = L.bakeShade(bnd(thS, [5, -1, -4], [17, 6, 4], .45, 1), aoShade(thS, .9, .3));
  // abdomen: ten segments, tapering, with a groove at each joint
  const segs = []; const xs = []; let x = 6.2; const rs = [3.2, 3.5, 3.6, 3.6, 3.5, 3.3, 3.0, 2.6, 2.0, 1.4];
  for (let i = 0; i < 10; i++) { const x1 = x - 2.35 + i * .06; xs.push([x, x1]); x = x1; }
  const abd = L.smoothUnion(.12, ...xs.map(([x0, x1], i) => L.roundCone([x0, 2.0 - i * .02, 0], [x1 + .12, 2.0 - i * .02, 0], rs[i] * .92, rs[i] * .88)));
  m.abdomen = L.bakeShade(bnd(abd, [-19, -2.5, -5], [8, 6, 5], .5, 1), aoShade(abd, .85, .4));
  // wing pads: two pairs of flat sheaths lying back over the first segments, from the thorax's rear top
  const wp = []; for (const s of S) { wp.push(L.transform(L.scaleMesh(uvSphere(1, 8, 5), [6.2, .85, 1.7]), p => { const q = L.rotAxis(p, [0, 1, 0], s * .22); return [q[0] + 5.2, q[1] + 4.3, q[2] + s * 2.1]; })); wp.push(L.transform(L.scaleMesh(uvSphere(1, 8, 5), [5.2, .75, 1.5]), p => { const q = L.rotAxis(p, [0, 1, 0], s * .2); return [q[0] + 3.8, q[1] + 4.1, q[2] + s * 1.7]; })); }
  m.wingpads = L.merge(...wp);
  // legs: six, in three pairs from the thorax; femur, tibia, tarsus, held under the body
  const legs = [];
  [[14.2, 4.3], [11.4, 1.8], [8.6, -1.2]].forEach(([x0, dx], i) => { for (const s of S) {
    const spread = 4.8 + i * .6;
    legs.push(tubeM([[x0, .7, s * 2.2], [x0 + dx * .25, 1.2, s * (spread + 2.6)], [x0 + dx * .7, -1.2, s * (spread + 5.3)], [x0 + dx * 1.2, -2.8, s * (spread + 6.4)], [x0 + dx * 1.45, -3.3, s * (spread + 6.9)]], t => .62 * (1 - .65 * t), 6, 14, true)); } });
  m.legs = L.merge(...legs);
  // labial mask: the folded, hinged lower lip lying under the head and thorax, with its two hooked palps at the front
  const mask = L.merge(L.extrudeOutline([[0, -1.1], [6.2, -1.3], [7.4, -.8], [7.6, .8], [6.2, 1.3], [0, 1.1]], .5), ...S.map(s => L.transform(L.extrudeOutline([[0, 0], [1.4, .3], [2.0, -.2], [1.5, -.6], [0, -.5]], .35), p => [p[0] + 7.2, p[1] + s * .6, p[2]])));
  m.mask = L.bakeShade(L.transform(mask, p => { const q = L.rotAxis([p[0], p[1], p[2]], [1, 0, 0], rad(90)); return [q[0] + 12.6, q[1] - 1.0, q[2]]; }), () => .85);
  // caudal pyramid: three pointed appendages (the epiproct and two cerci) with two shorter paraprocts
  const cx = x - .3; const cer = [[-1, 0, 0], [-1, .1, .55], [-1, .1, -.55]].map((d, i) => tubeM([[cx + .6, 2.0, 0], [cx + .6 + d[0] * (i ? 2.2 : 3.6) * .5, 2.0 + d[1], d[2]], [cx + .6 + d[0] * (i ? 2.2 : 3.6), 2.0 + d[1] * 1.8, d[2] * 1.9]], t => .5 * (1 - .9 * t), 5, 5, true));
  m.cerci = L.merge(...cer);
  return m;
}

// =============== common frog tadpole with hind legs ===============
function tadpole() {
  const m = {}, T = LIFE_M.tadpole;
  const bodyS = L.smoothUnion(2, E([0, 4.4, 0], [7.2, 4.5, 4.9]), E([-5, 4.2, 0], [4.5, 3.6, 3.2]), E([6.2, 3.7, 0], [3.2, 2.6, 2.7]));
  m.body = L.bakeShade(bnd(bodyS, [-10, 0, -6], [11, 9.5, 6], .5, 1, 1), (p, n) => .55 + .25 * (.5 + .5 * n[1]) + .2 * L.fbm(p[0] * .6, p[1] * .6, p[2] * .6, { seed: 9 }));
  m.eyes = L.merge(...S.map(s => L.translateMesh(uvSphere(.85, 9, 5), [4.0, 7.4, s * 3.2])));
  // tail: muscle (a tapering rounded bar, 20 mm) with a thin fin above and below
  const muscle = L.roundCone([-7, 4.1, 0], [-7 - T.tail, 3.8, 0], 2.6, .35);
  const fin = L.extrudeOutline([[-7, 7.2], [-12, 8.9], [-18, 7.9], [-24.5, 4.3], [-26.8, 3.9], [-24.5, 3.4], [-18, -.1], [-12, -.7], [-7, .7]], .35);
  m.tail = L.merge(bnd(muscle, [-29, 0, -3], [-6, 8, 3], .5, 1, 1), fin);
  // two hind legs, 4 mm, with a folded foot
  const legs = []; for (const s of S) legs.push(tubeM([[-8.5, 1.6, s * 3.2], [-9.9, .9, s * 4.6], [-11.4, .3, s * 4.9], [-12.6, .25, s * 4.3]], t => .55 * (1 - .6 * t), 6, 8, true));
  m.legs = L.merge(...legs);
  m.swarm = L.merge(L.translateMesh(L.scaleMesh(uvSphere(1, 10, 6), [7.2, 4.5, 4.9]), [0, 4.4, 0]), L.translateMesh(L.scaleMesh(uvSphere(1, 8, 5), [10, 3, .6]), [-16, 5.2, 0]));
  return m;
}

export default function life(R) {
  const meshes = {}, instances = {}, place_ = {};
  const sk = skater(), dp = daphnia(), sn = snail(), lv = larva(), tp = tadpole();
  const at = (m, o) => place(mmToM(m), o);
  // ---- where they are (metres in the pond; y is the water surface 0.02 for the skater) ----
  const P = {
    skater: { at: [.9, POND.yw, .55], yaw: .5 },
    daphnia: { at: [.28, -.22, -.4], yaw: 0.35 },
    snail: { at: [-.55, bedY(-.55, -.3) + .0005, -.3], yaw: 2.4 },
    larva: { at: [.62, bedY(.62, -.55) + .004, -.55], yaw: 1.6 },
    tadpole: { at: [-2.15, bedY(-2.15, -.5) + .09, -.5], yaw: 2.2 },
  };
  for (const [k, v] of Object.entries(sk)) if (k !== '_shellBounds') meshes['skater_' + k] = at(v, P.skater);
  for (const [k, v] of Object.entries(dp)) if (k !== 'swarm') meshes['daphnia_' + k] = at(v, P.daphnia);
  for (const [k, v] of Object.entries(sn)) if (!k.startsWith('_')) meshes['snail_' + k] = at(v, P.snail);
  for (const [k, v] of Object.entries(lv)) meshes['larva_' + k] = at(v, P.larva);
  for (const [k, v] of Object.entries(tp)) if (k !== 'swarm') meshes['tadpole_' + k] = at(v, P.tadpole);
  // the swarm: more water fleas and tadpoles, one mesh each, instanced (the whole animal in one piece; the hero above has its parts)
  meshes.daphnia_swarm_m = mmToM(dp.swarm); meshes.tadpole_swarm_m = mmToM(tp.swarm);
  const ds = new L.Instances('daphnia_swarm_m'); const centres = [[.4, -.2, -.3], [-.2, -.3, .1], [.9, -.15, .2], [-.8, -.25, -.7], [1.0, -.3, -.8]];
  for (const [cx, cy, cz] of centres) for (let i = 0; i < 4; i++) ds.add([cx + R.range(-.22, .22), cy + R.range(-.08, .08), cz + R.range(-.22, .22)], L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), R.range(.7, 1.1));
  instances.daphnia_swarm = ds;
  const ts = new L.Instances('tadpole_swarm_m');
  [[-2.3, -.35], [-2.4, -.7], [-2.05, -.15], [-2.5, -.2], [-2.2, -.95]].forEach(([x, z], i) => ts.add([x, bedY(x, z) + R.range(.08, .16), z], L.quatMul(L.quatAxisAngle([0, 1, 0], R.range(0, 6.28)), L.quatAxisAngle([0, 0, 1], R.range(-.15, .15))), R.range(.7, 1)));
  instances.tadpole_swarm = ts;
  // far stand-ins are not needed: everything here is millimetres to centimetres and shows only close up
  return { meshes, instances, P, feet: sk };
}
