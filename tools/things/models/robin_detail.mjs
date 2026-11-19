// Cut-open detail: the syrinx, the eye and the heart (analytic shapes, drawn larger than the bird's other organs would allow). Millimetres.
import { L, EZ, S2, add, sub, mul, norm, cross, dot, len, lerp3, bnd, sp, fin, rot2, D2R, quatBasis, frameYZ } from './robin_lib.mjs';
import { headLocal, HB } from './robin_shape.mjs';
import { SYR, HEART_B, Bp, Bi, fitIn } from './robin_in.mjs';

const shade = (m, k = 1) => { L.bakeShade(m, (p, n) => k * (.82 + .18 * Math.max(0, n[1] * .5 + .5))); return m; };
// ------------------------------------------------------------------------------------------------ syrinx
export function syrinxFrame(trachPath) {
  const n = trachPath.length, a = norm(sub(trachPath[n - 1], trachPath[n - 6])), b0 = norm([-a[1], a[0], 0]), b = b0[0] < 0 ? mul(b0, -1) : b0;   // b points forward
  const W = p => add(add(add(SYR.at, mul(a, p[0])), mul(b, p[1])), [0, 0, p[2]]);
  return { a, b, W, normal: b };
}
export function syrinx(trachPath) {
  const o = {}, fr = syrinxFrame(trachPath), W = fr.W, I = {};
  const A = 40 * D2R, dirs = S2.map(s => [Math.cos(A), 0, s * Math.sin(A)]);     // bronchi leave the fork at 40 degrees to the trachea, to the right and left lungs
  const cyl = (p0, d, r, l) => { const ax = norm(d); return p => { const q = sub(p, p0), t = dot(q, ax), perp = sub(q, mul(ax, t)); return Math.max(len(perp) - r, -t, t - l); }; };
  const outer = L.smoothUnion(.45, cyl([-12, 0, 0], [1, 0, 0], 1.25, 12.6), cyl([-.4, 0, 0], dirs[0], 1.0, 9), cyl([-.4, 0, 0], dirs[1], 1.0, 9));
  const inner = L.smoothUnion(.4, cyl([-12.5, 0, 0], [1, 0, 0], .95, 13), cyl([-.3, 0, 0], dirs[0], .72, 9.5), cyl([-.3, 0, 0], dirs[1], .72, 9.5));
  o.wall = L.transform(bnd(L.subtract(outer, inner), [-13, -2.5, -8], [4, 2.5, 8], .17, 1, 1), W);
  // pessulus: a small bony wedge standing in the middle of the fork, between the two bronchi
  o.pessulus = L.transform(L.extrudeOutline([[-.9, -.95], [.15, -.95], [1.1, 0], [.15, .95], [-.9, .95], [-1.45, 0]].map(([x, y]) => [x + .2, y * .9]), .34), p => W([p[0], p[1], p[2]]));
  // internal tympaniform membranes: thin sheets in the medial wall of each bronchus, just below the fork, that vibrate when air passes
  o.membranes = L.merge(...S2.map(s => L.transform(bnd(L.translate(L.ellipsoid(1.4, .72, .08), [1.5 * Math.cos(A), 0, s * (1.5 * Math.sin(A) - .62)]), [-.5, -1, s > 0 ? -.3 : -1.6], [3.5, 1, s > 0 ? 1.6 : .3], .09, 1, 0), W)));
  // intrinsic syringeal muscles: a small band on the outside of each bronchus; the extrinsic muscle (sternotrachealis) runs down the side of the trachea
  o.muscles = L.merge(...S2.map((s, i) => { const d = dirs[i]; const pts = [[1.5, 1.45, s * .1], [3.5, 1.3, s * 1.5], [5.2, 1.25, s * 2.6]]; return L.merge(L.tube(pts.map(W), .36, { sides: 6, caps: true }), L.tube([[-9, 1.35, s * .8], [-5, 1.45, s * .9], [-1, 1.35, s * .8]].map(W), .3, { sides: 6, caps: true })); }));
  // rings: complete rings round the windpipe, C-shaped half rings round the bronchi
  const circ = (r, a0, a1, n) => { const pts = []; for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; pts.push([Math.cos(t) * r, 0, Math.sin(t) * r]); } return pts; };
  o.ring_mesh = L.tube(circ(1.12, 0, 2 * Math.PI, 20), .13, { sides: 5, caps: false });
  o.half_mesh = L.tube(circ(.92, -.28 * Math.PI, 1.28 * Math.PI, 14), .12, { sides: 5, caps: true });
  const ri = new L.Instances('ring_mesh'), hi = new L.Instances('half_mesh');
  const qa = L.quatFromTo([0, 1, 0], fr.a);   // the ring lies round Y: turn Y onto the windpipe axis
  for (let i = 0; i < 9; i++) ri.add(W([-10.2 + i * 1.05, 0, 0]), qa, 1);
  for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) { const d = dirs[k], p0 = mul(d, .8 + i * 1.0); hi.add(W(p0), L.quatFromTo([0, 1, 0], sub(W(add(p0, d)), W(p0))), 1); }
  I.rings = ri; I.halves = hi;
  const out = {}; for (const k of ['wall', 'pessulus', 'membranes', 'muscles', 'ring_mesh', 'half_mesh']) out[k] = fin(shade(o[k], 1));
  return { meshes: out, instances: I, frame: fr };
}
// ------------------------------------------------------------------------------------------------ eye (right eye, drawn about 8 mm across)
export const EYE = (() => { const c = headLocal([4.4, 2.5, 8.2]); const e = norm([Math.cos(HB * D2R) * .38 - Math.sin(HB * D2R) * .1, Math.sin(HB * D2R) * .38 + Math.cos(HB * D2R) * .1, .9]); const up0 = [0, 1, 0]; const f = frameYZ(e, up0); return { c, ax: e }; })();
export function eyeDetail() {
  const ax = EYE.ax, up = norm(sub([0, 1, 0], mul(ax, dot([0, 1, 0], ax)))), sd = cross(ax, up), c = EYE.c;
  const W = p => add(add(add(c, mul(ax, p[0])), mul(up, p[1])), mul(sd, p[2]));
  const o = {}, R = 4.1;
  const gl = L.sphere(R), open = p => 1.3 - p[0] * 1;              // sclera opens at the front (x > 1.3 removed)
  const front = L.sphere(R);
  o.sclera = L.transform(bnd(L.intersect(L.subtract(gl, L.sphere(R - .4)), p => 1.15 - p[0]), [-4.5, -4.5, -4.5], [1.6, 4.5, 4.5], .14, 1, 1), W);
  o.scleral_ring = L.transform(bnd(L.torus(2.85, .28), [-3.3, -.6, -3.3], [3.3, .6, 3.3], .15, 1, 0), p => W([p[1] + 1.15, p[0], p[2]]));   // ring of small bones round the front of the sclera (axis along x)
  o.cornea = L.transform(bnd(L.intersect(L.subtract(L.translate(L.sphere(3.5), [-.9, 0, 0]), L.translate(L.sphere(3.05), [-.9, 0, 0])), p => 1.0 - p[0]), [.9, -3.2, -3.2], [2.8, 3.2, 3.2], .13, 1, 1), W);
  o.iris = L.transform(bnd(L.subtract(L.cylinder(2.6, .16), L.cylinder(1.1, .4)), [-2.8, -.3, -2.8], [2.8, .3, 2.8], .09, 1, 1), p => W([p[1] + .55, p[0], p[2]]));
  o.lens = L.transform(bnd(L.translate(L.ellipsoid(.95, 1.5, 1.5), [-.15, 0, 0]), [-1.5, -2, -2], [1.5, 2, 2], .13, 1, 1), W);
  o.vitreous = L.transform(bnd(L.intersect(L.sphere(R - .55), p => .9 - p[0] * 1 - 0), [-4, -4, -4], [1, 4, 4], .16, 1, 1), W);
  o.retina = L.transform(bnd(L.intersect(L.subtract(L.sphere(R - .55), L.sphere(R - .85)), p => .5 - p[0]), [-4, -4, -4], [.6, 4, 4], .13, 1, 1), W);
  o.choroid = L.transform(bnd(L.intersect(L.subtract(L.sphere(R - .4), L.sphere(R - .55)), p => .7 - p[0]), [-4, -4, -4], [.8, 4, 4], .13, 1, 1), W);
  // pecten: the pleated, blood-rich fold that stands out of the retina where the optic nerve leaves (birds' retinas have no vessels of their own)
  { const pl = []; for (let i = 0; i < 7; i++) { const z = (i - 3) * .32, h = 1.9 - Math.abs(i - 3) * .12; pl.push(L.extrudeOutline([[-2.95, -.1], [-2.95, h * .55], [-2.3, h], [-1.4, h * .75], [-1.0, .0]], .07, { warp: p => [p[0], p[1] + (i % 2 ? .12 : -.0), p[2] + z] })); }
    o.pecten = L.transform(L.merge(...pl), p => W([p[0], p[1] - .6, p[2]])); }
  o.optic_nerve = L.transform(L.tube([[-R + .4, -.7, 0], [-R - 1.4, -1.0, -.2], [-R - 3.4, -1.0, -1.0]], .42, { sides: 6, caps: true }), W);
  const out = {}; for (const [k, m] of Object.entries(o)) out[k] = fin(shade(m, 1));
  return { meshes: out, frame: { c, ax, up, sd, W } };
}
// ------------------------------------------------------------------------------------------------ heart chambers
export function heartDetail() {
  const H = HEART_B, B = (c, r, ang) => { let s = L.ellipsoid(r[0], r[1], r[2]); if (ang) s = L.rotate(s, [0, 0, 1], ang * D2R); return L.translate(s, c); };
  const ch = (c, r, ang = 0) => L.transform(bnd(B(c, r, ang), [c[0] - r[0] - .5, c[1] - r[1] - .5, c[2] - r[2] - .5], [c[0] + r[0] + .5, c[1] + r[1] + .5, c[2] + r[2] + .5], .2, 1, 1), Bp);
  const o = {};
  o.lv = ch([H[0] - .9, H[1] - .8, -.9], [2.2, 3.5, 1.5], -20); o.rv = ch([H[0] - .5, H[1] - .4, 2.0], [1.6, 3.4, 1.3], -20);
  o.la = ch([H[0] + 1.9, H[1] + 3.5, -2.3], [1.15, 1.35, 1.05]); o.ra = ch([H[0] + 1.9, H[1] + 3.5, 2.3], [1.25, 1.5, 1.15]);
  const out = {}; for (const [k, m] of Object.entries(o)) out[k] = fin(shade(m, 1));
  return out;
}
