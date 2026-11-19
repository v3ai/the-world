// The skeleton of the dog: every bone is built from the rig (dog_rig.mjs). Returns { meshes, parts } entries.
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { P, bone, place, S, ell, ellA, rod, smoothS, unionS, subS, meshS, bothMesh, mirrorMesh, SIDES } from './dog_lib.mjs';
import { SPINE, TAIL, FORE, HIND } from './dog_rig.mjs';

const sp = pts => L.spline(pts.map(p => P(...p)));
const tan = (f, t) => L.norm(L.sub(f(Math.min(.999, t + .01)), f(Math.max(0, t - .01))));

// frame at spine position: origin, forward tangent (x), up (y), right = z
function vertFrame(o, tn) { const z = [0, 0, 1], up = L.norm(L.cross(z, tn)); return { o, x: tn, y: up }; }

// one vertebra in local coords (x forward along the spine, y up, z right): centrum, arch, spinous process, transverse processes
function vertebra({ len, w, h, sp: spH, spLen, tw, tl = len * .9, spBack = .3 }) {
  const parts = [];
  parts.push(L.transform(D.bone([-len / 2, 0, 0], [len / 2, 0, 0], w * .5, w * .62, w * .62, { sides: 8, e: .22, n: 4 }), p => [p[0], p[1] * (h / w), p[2]]));
  const poly = [[-spLen * .5, 0], [-spLen * .35 - spBack * spLen, spH], [spLen * .25 - spBack * spLen, spH], [spLen * .5, 0]].map(([x, y]) => [x, y + h * .35]);
  parts.push(L.extrudeOutline(poly, Math.max(.0016, w * .12)));
  if (tw > 0) for (const s of SIDES) parts.push(L.transform(D.bone([0, h * .1, 0], [0, h * .1, s * tw], w * .16, w * .2, w * .12, { sides: 5, e: .3, n: 3 }), p => [p[0] + (s > 0 ? 0 : 0), p[1], p[2]]));
  return L.merge(...parts.filter(Boolean));
}
function chain(ptsCm, spec, labelFn) {
  const f = sp(ptsCm), n = ptsCm.length, out = [];
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1), o = f(t), tn = tan(f, t), fr = vertFrame(o, tn); const sz = spec(i, n); out.push(place(vertebra(sz), o, tn, fr.y)); }
  return L.merge(...out);
}
export function skeleton() {
  const meshes = {}, info = {};
  // ---- vertebrae ----
  meshes.cervical = chain(SPINE.cerv, (i) => i === 0 ? { len: .028, w: .02, h: .018, sp: .004, spLen: .01, tw: .045, spBack: 0 } : i === 1 ? { len: .042, w: .018, h: .02, sp: .03, spLen: .04, tw: .018 } : { len: .03, w: .017, h: .018, sp: .012 + (i - 2) * .004, spLen: .016, tw: .022 + i * .002 });
  meshes.thoracic = chain(SPINE.thor, (i) => ({ len: .019, w: .014, h: .015, sp: .056 - i * .0042 + (i === 0 ? -.012 : 0), spLen: .014, tw: .014, spBack: .42 }));
  meshes.lumbar = chain(SPINE.lum, (i) => ({ len: .031, w: .016, h: .016, sp: .026, spLen: .016, tw: .04 - Math.abs(i - 3) * .002, spBack: -.05 }));
  // sacrum: three fused, with the wings that meet the pelvis
  { const f = sp(SPINE.sac), parts = []; for (let i = 0; i < 3; i++) { const t = i / 2, o = f(t), tn = tan(f, t); parts.push(place(vertebra({ len: .022, w: .018, h: .016, sp: .014, spLen: .014, tw: i === 0 ? .03 : .012 }), o, tn, [0, 1, 0])); }
    meshes.sacrum = L.merge(...parts); }
  // tail: 20 caudal vertebrae along a path, shrinking
  { const f = sp(TAIL), parts = []; const n = 20; for (let i = 0; i < n; i++) { const t = i / (n - 1) * .985, o = f(t), tn = tan(f, t), k = 1 - .72 * (i / n); parts.push(place(vertebra({ len: .0215 * (1 - .35 * i / n), w: .015 * k, h: .014 * k, sp: i < 5 ? .008 * (1 - i / 6) : 0, spLen: .008, tw: i < 6 ? .012 * (1 - i / 7) : 0 }), o, tn, [0, 1, 0])); }
    meshes.caudal = L.merge(...parts); }
  // ---- ribs ----
  { const zmax = [3.5, 4.8, 5.8, 6.6, 7.2, 7.6, 7.9, 8.1, 8.2, 8.0, 7.5, 6.5, 5.5];
    const stern = [[19.5, 33.2], [16.5, 31.8], [13.5, 31], [10.5, 30.5], [7.5, 30.2], [4.5, 30], [1.5, 30], [-1.5, 30.2], [-4.5, 30.6], [-7.5, 32], [-9.5, 34.2], [-11, 36.5], [-12.5, 39.5]];
    const bones = [], carts = [];
    for (let i = 0; i < 13; i++) for (const s of SIDES) {
      const [xv, yv] = SPINE.thor[i], [xs, ys] = stern[i], H = yv - ys, zm = zmax[i];
      const pts = [[xv, yv - .6, s * 1.8], [xv - .8, yv - .17 * H, s * zm * .86], [xv + (xs - xv) * .42, yv - .5 * H, s * zm], [xv + (xs - xv) * .78, yv - .8 * H, s * zm * .7], [xs, ys, s * 1.4]];
      const f = L.spline(pts.map(p => P(...p))), n = 28, w = i < 9 ? .0042 : .0036, cut = i < 9 ? .72 : i < 12 ? .6 : .9;
      const pb = [], pc = []; for (let k = 0; k <= n; k++) { const t = k / n; (t <= cut ? pb : pc).push(f(t)); } pc.unshift(pb[pb.length - 1]);
      bones.push(L.tube(pb, t => w * (1.5 - .5 * Math.min(1, t * 3)) * (i < 9 ? 1 : .85), { sides: 6 }));
      if (pc.length > 2 && i < 12) carts.push(L.tube(pc, w * .85, { sides: 6 }));
    }
    meshes.ribs = L.merge(...bones); meshes.costal = L.merge(...carts);
    // sternum: eight sternebrae in a row, then the xiphoid cartilage
    const sb = []; const sp0 = P(21, 33.5, 0), sp1 = P(-9, 31.8, 0); for (let i = 0; i < 8; i++) { const t = i / 7, a = L.lerp3(sp0, sp1, t), b = L.lerp3(sp0, sp1, Math.min(1, t + .1)); sb.push(D.bone(L.lerp3(sp0, sp1, t), L.lerp3(sp0, sp1, Math.min(1, t + .118)), .0072, .0084, .0084, { sides: 8, e: .2, n: 4 })); }
    sb.push(L.tube([P(-9.5, 31.7), P(-12, 31), P(-14, 31.2)], t => .01 * (1 - .5 * t), { sides: 6 }));
    meshes.sternum = L.merge(...sb); }
  // ---- skull and mandible (signed-distance models) ----
  { const sh = [];
    sh.push(ell(P(34.5, 63, 0), [1, 0, 0], .052, .036, .04));                       // braincase
    sh.push(rod(P(40, 62, 0), P(51.5, 57.4, 0), .029, .017));                          // muzzle (nasal and maxillary bones), wide at the carnassials
    sh.push(ell(P(45, 60.5, 0), [1, -.15, 0], .06, .025, .042));                         // upper jaw and palate (cheek teeth row)
    sh.push(rod(P(31.5, 61.5, 0), P(31, 64.5, 0), .018, .014));                         // occipital region
    for (const s of SIDES) { sh.push(rod(P(39, 62.5, s * 4.2), P(36, 59.5, s * 6), .004, .004)); sh.push(rod(P(36, 59.5, s * 6), P(32.8, 60.6, s * 4.8), .004, .004)); }   // zygomatic arch
    const base = smoothS(.01, ...sh);
    const orb = unionS(...SIDES.map(s => ell(P(43, 64, s * 4.8), [1, 0, 0], .016, .016, .016)));
    const cav = unionS(ell(P(35.4, 63, 0), [1, 0, 0], .037, .026, .029), ell(P(46.5, 59.6, 0), [1, -.18, 0], .058, .0125, .0115), ell(P(40.8, 61.2, 0), [1, -.3, 0], .008, .006, .006));
    const skull = subS(subS(base, unionS(orb), .004), cav, .002);
    meshes.skull = meshS(skull, .0036);
    // lower jaw
    const jaw = []; for (const s of SIDES) { jaw.push(rod(P(37, 57, s * 4), P(49.5, 53.3, s * 2.2), .0062, .005)); jaw.push(rod(P(37, 57, s * 4), P(36.2, 62, s * 4.2), .006, .004)); jaw.push(ell(P(36.5, 58, s * 4.3), [0, 1, 0], .008, .018, .003)); }
    jaw.push(ell(P(49.5, 53.5, 0), [1, 0, 0], .008, .007, .018));
    meshes.mandible = meshS(smoothS(.006, ...jaw), .0035); }
  // teeth: 42 as separate small cones, instanced from one mesh
  const teeth = []; // [x,y,z,kind, upper]
  { const rowU = (x, y, z) => teeth.push([x, y, z, 1]), rowL = (x, y, z) => teeth.push([x, y, z, 0]);
    for (const s of SIDES) {
      // upper: I3, C1, P4, M2 (11 per side = 22), lower: I3, C1, P4, M3 (12 per side = 24)... counts: upper 6+2+8+4=20, lower 6+2+8+6=22 -> 42
      for (let i = 0; i < 3; i++) if (true) { teeth.push({ p: [51.1 - i * .0, 54.2, s * (.9 + i * 1.05)], k: 'i', up: 1 }); teeth.push({ p: [50.6, 52.9, s * (.7 + i * .85)], k: 'i', up: 0 }); }
      teeth.push({ p: [48.3, 54.1, s * 3.2], k: 'c', up: 1 }); teeth.push({ p: [48.6, 52.3, s * 2.5], k: 'c', up: 0 });
      for (let i = 0; i < 4; i++) { teeth.push({ p: [46.2 - i * 1.5, 54.3 - i * .1, s * (3.7 + i * .1)], k: 'p', up: 1 }); teeth.push({ p: [46.3 - i * 1.5, 52.2 - i * .1, s * (3.1 + i * .05)], k: 'p', up: 0 }); }
      for (let i = 0; i < 2; i++) teeth.push({ p: [39.8 - i * 1.5, 55.6, s * 4.1], k: 'm', up: 1 });
      for (let i = 0; i < 3; i++) teeth.push({ p: [40.1 - i * 1.4, 53.2, s * 3.8], k: 'm', up: 0 });
    } }
  const tooth = { i: [.0042, .009], c: [.0055, .016], p: [.0055, .011], m: [.0075, .009] };
  const tm = L.merge(...teeth.filter(t => !Array.isArray(t)).map(t => { const [r, h] = tooth[t.k], sgn = t.up ? -1 : 1; const m = L.lathe([[0, 0], [r, 0.001], [r * .95, h * .3], [r * .35, h * .85], [0, h]], { segments: 6 }); return L.transform(m, p => [t.p[0] * .01 + p[0], t.p[1] * .01 + sgn * p[1], t.p[2] * .01 + p[2]]); }));
  // lathe is built about +y pointing up; upper teeth point down, so mirror y
  meshes.teeth = tm; info.teethCount = teeth.filter(t => !Array.isArray(t)).length;
  return { meshes, info };
}
