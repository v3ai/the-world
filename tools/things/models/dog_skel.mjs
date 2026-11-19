// The skeleton of the dog: every bone is built from the rig (dog_rig.mjs). Returns { meshes, parts } entries.
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { P, bone, place, S, ell, ellA, rod, smoothS, unionS, subS, meshS, bothMesh, mirrorMesh, SIDES } from './dog_lib.mjs';
import { SPINE, TAIL, FORE, HIND } from './dog_rig.mjs';
import * as H from './dog_head.mjs';

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
  meshes.lumbar = chain(SPINE.lum, (i) => ({ len: .0235, w: .016, h: .016, sp: .026, spLen: .014, tw: .04 - Math.abs(i - 3) * .002, spBack: -.05 }));
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
  // ---- skull, lower jaw and teeth: built in the head frame (dog_head.mjs) ----
  meshes.skull = H.skull(); meshes.mandible = H.mandible();
  const tt = H.teeth(); meshes.teeth = tt.mesh; info.teethCount = tt.count;
  return { meshes, info };
}
