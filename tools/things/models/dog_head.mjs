// The head of the dog, built in its own frame and placed on the neck with one rigid turn.
// Head frame (cm): origin at the occipital condyles (where the skull meets the atlas), x forward along the palate, y up, z the dog's right.
// Typical Labrador-type proportions: skull (occiput to stop) about as long as the muzzle (stop to nose), skull width about 11 cm, a defined stop.
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { P, S, ell, rod, smoothS, unionS, subS, meshS, SIDES } from './dog_lib.mjs';

export const HEAD = { o: [30, 60.6], deg: -8, sc: 1.07 };   // sc: the head is drawn 7 % larger than the first-draft sizes (a Labrador's head is broad and big)       // origin in the body frame (cm); the muzzle points 8 degrees below the palate-level line
const th = HEAD.deg * Math.PI / 180, C = Math.cos(th), Sn = Math.sin(th), SC = HEAD.sc;
export const HLcm = (x, y, z = 0) => [HEAD.o[0] + (x * C - y * Sn) * SC, HEAD.o[1] + (x * Sn + y * C) * SC, z * SC];
export const HL = (x, y, z = 0) => { const p = HLcm(x, y, z); return [p[0] * .01, p[1] * .01, p[2] * .01]; };
export const HD = (dx, dy, dz = 0) => [dx * C - dy * Sn, dx * Sn + dy * C, dz];
export const hQ = L.quatAxisAngle([0, 0, 1], th);
export const hmesh = m => L.transform(m, p => { const x = p[0] * 100, y = p[1] * 100; return [(HEAD.o[0] + (x * C - y * Sn) * SC) * .01, (HEAD.o[1] + (x * Sn + y * C) * SC) * .01, p[2] * SC]; });   // a mesh built in the head frame (metres) -> body frame
export const hell = (c, d, a, b, w) => ell(HL(...c), HD(d[0], d[1], 0), a * .01 * SC, b * .01 * SC, w * .01 * SC);
export const hrod = (a, b, r1, r2 = r1) => rod(HL(...a), HL(...b), r1 * .01 * SC, r2 * .01 * SC);
const sd = (s, f) => SIDES.map(f);
const z = (s, v) => s * v;

export const EYE_L = [11.3, 2.7, 4.2];                 // head frame, right eye
export const EYE_C = HLcm(...EYE_L);                    // body frame (cm)
export const eyeAxis = s => { const a = HD(Math.cos(.35), 0, 0); return L.norm([a[0], a[1], s * Math.sin(.35)]); };

// ---------------- bones ----------------
export function skullShape() {
  const sh = [];
  sh.push(hell([6, 3.4, 0], [1, 0], 5.4, 3.7, 4.5));          // braincase
  sh.push(hell([1.4, 2.4, 0], [1, 0], 2.0, 3.1, 3.0));        // occipital region
  sh.push(hrod([.8, 6.3, 0], [8.5, 6.6, 0], .35, .3));        // sagittal crest
  sh.push(hell([10.2, 3.5, 0], [1, 0], 2.4, 2.8, 3.4));       // frontal region
  sh.push(hell([14.6, 1.1, 0], [1, 0], 5.6, 2.2, 3.0));       // maxilla
  sh.push(hell([19, 1, 0], [1, 0], 1.2, 1.5, 1.9));           // premaxilla
  for (const s of SIDES) {                                    // zygomatic arch
    sh.push(hrod([11.2, .8, s * 3.6], [8.2, -.2, s * 5.2], .38));
    sh.push(hrod([8.2, -.2, s * 5.2], [4.6, -.6, s * 4.8], .38));
    sh.push(hrod([4.6, -.6, s * 4.8], [3.4, -1.7, s * 3.4], .5));
  }
  const base = smoothS(.006, ...sh);
  const orb = unionS(...SIDES.map(s => hell([10.9, 2.4, s * 4.1], [1, 0], 1.5, 1.5, 1.4)));
  const cav = unionS(hell([5.8, 3.35, 0], [1, 0], 4.5, 3.0, 3.6), hell([12, 3, 0], [1, 0], 2, 1.5, 2.2), hell([15.2, 1.2, 0], [1, 0], 3.8, 1.15, 1.1));
  return subS(subS(base, orb, .004), cav, .002);
}
export function skull() { return meshS(skullShape(), .0036); }
export function mandible() {
  const parts = [];
  for (const s of SIDES) {
    parts.push(hrod([18.4, -4.9, s * 1], [6.5, -4.6, s * 2.7], .65, .8), hell([10.5, -4.7, s * 2.4], [1, 0], 5.8, 1.3, .4), hell([4.9, -1.3, s * 3.5], [.15, 1], 3.7, .9, .4),
      D.sphereS(HL(3.9, -2.4, s * 3.5), .0058), hrod([4.2, -4.6, s * 3.3], [2.6, -4.2, s * 3.2], .45));
  }
  parts.push(hrod([18.6, -4.8, -.9], [18.6, -4.8, .9], .8));
  return meshS(smoothS(.004, ...parts), .0035);
}
// 42 teeth: upper I3 C1 P4 M2, lower I3 C1 P4 M3, each side; all crowns meet in the occlusal plane
export function teeth() {
  const T = []; // [x, z, up?, kind, rootY]
  const U = [['i', 19.4, .55], ['i', 19.2, 1.35], ['i', 18.8, 2.1], ['c', 17.2, 2.55], ['p', 15.4, 2.5], ['p', 14.1, 2.6], ['p', 12.5, 2.75], ['P', 10.4, 3.05], ['m', 8.5, 3.0], ['m', 7.2, 2.7]];
  const Lw = [['i', 18.9, .4], ['i', 18.7, 1], ['i', 18.4, 1.6], ['c', 17.9, 1.75], ['p', 15.3, 1.95], ['p', 14, 2.1], ['p', 12.7, 2.2], ['p', 11.4, 2.3], ['M', 9, 2.45], ['m', 7.4, 2.3], ['t', 6.2, 2]];
  const sz = { i: [.38, 1.0, .9], c: [.55, 2.3, .9], p: [.4, 1.1, 1.0], P: [.45, 1.5, 1.9], m: [.55, 1.0, 1.1], M: [.55, 1.5, 1.8], t: [.3, .6, .7] };
  const meshes = [];
  for (const s of SIDES) {
    for (const [k, x, zz] of U) meshes.push(tooth(sz[k], x, -1.3 + .3, s * zz, true));
    for (const [k, x, zz] of Lw) meshes.push(tooth(sz[k], x, -4.0 - .3, s * zz, false));
  }
  return { mesh: L.merge(...meshes), count: meshes.length };
}
function tooth([r, h, ex], x, yBase, zz, up) {
  const sgn = up ? -1 : 1, hh = h + .3, e = 1 + (ex - 1) * .5;
  const m = L.lathe([[0, 0], [r * 1.05, .02], [r, hh * .3], [r * .45, hh * .85], [0, hh]], { segments: 6 });
  const t = L.transform(m, p => [(x + p[0] * e) * .01, (yBase + sgn * p[1]) * .01, (zz + p[2]) * .01]);
  return hmesh(up ? L.flip(t) : t);
}

// ---------------- brain, tongue, bulbs ----------------
export function brain() {
  const hem = SIDES.map(s => hell([6.8, 3.4, s * 1.6], [1, 0], 3.8, 2.6, 1.95)), cb = hell([2.7, 2.9, 0], [1, 0], 1.7, 1.9, 2.3), bs = hrod([3.8, 1.1, 0], [.6, -.6, 0], .9, .6);
  return meshS(smoothS(.004, ...hem, cb, bs), .0028);
}
export const bulbs = () => D.bothSides(s => hell([12.3, 3, s * 1], [1, 0], 1.4, 1.1, .9), .0022);
export function tongue() { return meshS(smoothS(.004, hrod([5, -4, 0], [10, -3.7, 0], 1.5, 1.25), hell([13, -3.5, 0], [1, 0], 4.6, .75, 1.5), hrod([16, -3.5, 0], [18, -3.4, 0], .9, .6)), .0028); }
export const larynxAt = () => HL(1.5, -5.6, 0);

// ---------------- the skin of the head ----------------
// Shapes in the body frame; rig.skinShape joins them to the neck. The mouth line and the eye sockets are cut by skinCuts().
export function headSkinParts() {
  const sh = [];
  sh.push(hell([6, 3.5, 0], [1, 0], 6.4, 4.5, 5.5));            // cranium with its muscles
  sh.push(hell([1.2, 2.2, 0], [1, 0], 2.6, 3.9, 3.7));          // occiput
  sh.push(hell([10.2, 3.5, 0], [1, 0], 2.7, 3.1, 4.9));         // brow and frontal region
  sh.push(hell([5.5, .6, 0], [1, 0], 3.9, 3.3, 5.9));            // temple and cheek (the broad skull; no fleshy cheek)
  sh.push(hell([9, .4, 0], [1, 0], 2.6, 2.4, 5.6));                // zygomatic arches and the orbits
  sh.push(hell([5.8, -2.6, 0], [1, 0], 3.6, 2.8, 5.0));          // jaw muscles and the angle of the jaw
  sh.push(hell([14.8, 1.0, 0], [1, 0], 6.8, 3.1, 4.3));         // muzzle (upper jaw with its flews)
  sh.push(hell([15.2, -1.5, 0], [1, 0], 5.6, 2.1, 3.7));        // the upper lip (flews)
  sh.push(hell([11.5, -4.6, 0], [1, 0], 7.6, 1.7, 3.5));        // lower jaw
  sh.push(hell([4.2, -3.6, 0], [1, 0], 4.2, 3.2, 3.4));         // throat and the angle of the jaw
  sh.push(hell([18.4, -4.5, 0], [1, 0], 2.8, 1.9, 2.4));          // chin
  sh.push(hell([20.4, 1.8, 0], [1, 0], 1.4, 1.7, 2.6));         // the nose leather lies on the muzzle tip
  for (const s of SIDES) sh.push(hell([10.6, 5.9, s * 3.7], [1, 0], 1.6, .9, 1.2));   // brow ridges over the eyes
  return sh;
}
export function skinCuts() {
  const cuts = [];
  // eye sockets: the globe shows through an almond-shaped opening with a rim (the lids)
  for (const s of SIDES) {
    const c = HLcm(EYE_L[0], EYE_L[1], 0), a = eyeAxis(s), o = [c[0] * .01, c[1] * .01, s * EYE_L[2] * .01];
    cuts.push(ell([o[0] + a[0] * .0035, o[1] + a[1] * .0035, o[2] + a[2] * .0035], HD(1, 0), .0165, .0108, .0125));
  }
  return cuts;
}
// the mouth line, from the corner of the lips to the front, as a shallow groove that follows the surface
export function mouthGroove() {
  return p => {
    const x = p[0] * 100 - HEAD.o[0], y = p[1] * 100 - HEAD.o[1], xl = (x * C + y * Sn) / SC, yl = (-x * Sn + y * C) / SC, zl = Math.abs(p[2] * 100) / SC;
    if (xl < 6 || xl > 20.5 || zl < 1.2) return 0;
    const ym = -2.75 + (xl < 9 ? .09 * (9 - xl) ** 2 : 0) + .02 * (xl - 13);
    const w = Math.max(0, 1 - Math.abs(yl - ym) / .28), a = Math.min(1, (xl - 6) / 1.5) * Math.min(1, (20.2 - xl) / 1.5);
    return .0016 * w * a;
  };
}

// ---------------- the nose leather, ears ----------------
export function nose() {
  const body = hell([20.7, 1.8, 0], [1, 0], 1.6, 1.8, 2.65);
  const slit = s => ell(HL(21.9, 1.8, s * 1.05), HD(.55, 0, s), .008, .0042, .003);
  return meshS(subS(body, unionS(slit(1), slit(-1)), .0015), .003);
}
// a thin double-walled sheet over a grid: fn(u, v) -> [outerPoint, innerPoint] (u, v in 0..1)
function slab(nu, nv, fn) {
  const m = L.newMesh(), id = (k, i, j) => k * (nu + 1) * (nv + 1) + i * (nv + 1) + j;
  for (const k of [0, 1]) for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) m.pos.push(...fn(i / nu, j / nv)[k]);
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = id(0, i, j), b = id(0, i + 1, j), c = id(0, i + 1, j + 1), d = id(0, i, j + 1); m.idx.push(a, b, c, a, c, d);
    const e = id(1, i, j), f = id(1, i + 1, j), g = id(1, i + 1, j + 1), h = id(1, i, j + 1); m.idx.push(e, g, f, e, h, g);
  }
  const rim = (p, q) => { m.idx.push(p, q, id(1, 0, 0) * 0 + q + (nu + 1) * (nv + 1), p, q + (nu + 1) * (nv + 1), p + (nu + 1) * (nv + 1)); };
  for (let j = 0; j < nv; j++) { rim(id(0, 0, j), id(0, 0, j + 1)); rim(id(0, nu, j + 1), id(0, nu, j)); }
  for (let i = 0; i < nu; i++) { rim(id(0, i + 1, 0), id(0, i, 0)); rim(id(0, i, nv), id(0, i + 1, nv)); }
  return m;
}
// pendant, triangular ears with rounded tips, set rather far back and hanging close to the head: the sheet is laid on the skin
export function ears(skinF) {
  const out = [];
  for (const s of SIDES) {
    const surfZ = (xl, yl) => { const o = HL(xl, yl, s * 9), h = L.surfaceHit(skinF, o, [0, 0, -s], .2); return h ? h.p[2] * 100 * s : 4.5; };
    const W = 3.7, len = 10;
    const f = (u, v) => {
      const vv = v, wv = W * (1 - .62 * vv) * (vv > .88 ? Math.sqrt(Math.max(0, 1 - ((vv - .88) / .12) ** 2 * .95)) : 1), uu = (u * 2 - 1) * wv;
      const xl = 5.4 - 1.3 * vv + uu * .95, yl = 6.6 - 9.4 * vv;
      const zs = surfZ(xl, yl) + .22 + .5 * Math.pow(Math.abs(u * 2 - 1), 2) * (1 - vv * .6) + .5 * vv * vv;
      const a = HL(xl, yl, s * (zs + .28)), b = HL(xl, yl, s * zs);
      return [a, b];
    };
    let m = slab(10, 16, f); if (s < 0) m = L.flip(m); out.push(m);
  }
  return L.merge(...out);
}

// ---------------- inside the nose and ear ----------------
export function turbinates() {
  const r = L.rng(21), olf = new L.Instances('turb_plate'), resp = new L.Instances('turb_plate');
  for (let i = 0; i < 46; i++) {
    const back = i < 28, x = back ? 12.2 + r() * 2.8 : 15.6 + r() * 3.2, ang = r() * Math.PI * 2, rad = (.35 + r() * .55) * (back ? 1 : .8), sz = back ? .6 + r() * .4 : .6 + r() * .5;
    const o = HL(x, 1.25 + Math.sin(ang) * rad * 1.05, Math.cos(ang) * rad * .95);
    (back ? olf : resp).add(o, L.quatMul(hQ, L.quatAxisAngle([1, 0, 0], ang + Math.PI / 2)), sz);
  }
  return { olf, resp };
}
export function earInner() {
  const m = {};
  const mk = s => {
    const Z = v => s * v;
    const canal = L.tube(L.spline([HL(4.7, 5, Z(4.4)), HL(4.4, 2.6, Z(4.7)), HL(3.6, -.4, Z(4.7)), HL(2.9, -1.9, Z(4.2))]).sample(18), .0036, { sides: 10 });
    const drum = D.place(L.lathe([[0, 0], [.0052, 0]], { segments: 14, caps: false }), HL(2.75, -1.95, Z(4.0)), HD(0, 1), [0, 0, s]);
    const bulla = D.meshS(D.ell(HL(2.6, -2.1, Z(2.9)), HD(0, 1, .2 * s), .0115, .0105, .0098), .0018);
    const cochlea = L.tube(L.spline([...Array(22)].map((_, i) => { const t = i / 21, a = t * Math.PI * 5.2, rr = .45 * (1 - .75 * t); return HL(2.6 + Math.cos(a) * rr, -1.8 + t * .4, Z(2.2) + Math.sin(a) * rr); })).sample(60), .0012, { sides: 5 });
    const canals = L.merge(...[0, 1, 2].map(k => L.tube(L.spline([...Array(14)].map((_, i) => { const a = i / 13 * Math.PI * 1.7 + .3, R = .55; const dx = k === 0 ? Math.cos(a) * R : 0, dy = k === 1 ? Math.cos(a) * R : k === 0 ? Math.sin(a) * R : Math.sin(a) * R, dz = k === 0 ? 0 : k === 1 ? Math.sin(a) * R : Math.cos(a) * R; return HL(2.2 + dx, .2 + dy * .8, Z(1.9) + dz); })).sample(30), .0008, { sides: 5 })));
    return { canal, drum, bulla, cochlea, canals };
  };
  const a = mk(1), b = mk(-1); for (const k of Object.keys(a)) m['ear_' + k] = L.merge(a[k], b[k]);
  return m;
}
