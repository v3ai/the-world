// Helpers for the dog model: all coordinates in the rig are centimetres, x forward, y up, z = the dog's right side (the dog faces +x).
// Shapes carry their own bounding box so each part can be meshed in a small box.
import * as L from '../lib/index.mjs';

export const cm = v => v * .01;
export const P = (x, y, z = 0) => [x * .01, y * .01, z * .01];
export const M3 = a => a.map(v => v * .01);
export const SIDES = [1, -1];

// a shape: { f: p -> distance (metres), lo, hi }
export const S = (f, lo, hi) => ({ f, lo, hi });
const pad3 = (c, r) => [[c[0] - r, c[1] - r, c[2] - r], [c[0] + r, c[1] + r, c[2] + r]];

// oriented ellipsoid: centre c (m), long axis direction d, semi-axes a (along d), b (up-ish), w (across); radii in metres
export function ell(c, d, a, b, w) {
  const u = L.norm(d); let t = Math.abs(u[2]) < .9 ? [0, 0, 1] : [0, 1, 0];
  let wv = L.norm(L.sub(t, L.mul(u, L.dot(t, u)))), v = L.cross(wv, u); if (v[1] < 0 && Math.abs(v[1]) > Math.abs(v[0])) { v = L.mul(v, -1); wv = L.mul(wv, -1); }
  const E = L.ellipsoid(a, b, w), r = Math.max(a, b, w), [lo, hi] = pad3(c, r);
  return S(p => { const q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; return E([L.dot(q, u), L.dot(q, v), L.dot(q, wv)]); }, lo, hi);
}
// axis-aligned ellipsoid
export function ellA(c, a, b, w) { const E = L.ellipsoid(a, b, w), r = Math.max(a, b, w), [lo, hi] = pad3(c, r); return S(p => E([p[0] - c[0], p[1] - c[1], p[2] - c[2]]), lo, hi); }
// round cone between two points (metres) with end radii
export function rod(a, b, r1, r2 = r1) { const f = L.roundCone(a, b, r1, r2), R = Math.max(r1, r2); return S(f, [Math.min(a[0], b[0]) - R, Math.min(a[1], b[1]) - R, Math.min(a[2], b[2]) - R], [Math.max(a[0], b[0]) + R, Math.max(a[1], b[1]) + R, Math.max(a[2], b[2]) + R]); }
// a rod flattened across z (scaled about its own mid-plane z0 by factor k < 1 narrows it)
export function flatZ(sh, z0, k) { const f = p => sh.f([p[0], p[1], z0 + (p[2] - z0) / k]) * Math.min(1, k); return S(f, [sh.lo[0], sh.lo[1], z0 + (sh.lo[2] - z0) * k], [sh.hi[0], sh.hi[1], z0 + (sh.hi[2] - z0) * k]); }
export function cap(a, b, r) { return rod(a, b, r, r); }
export const sphereS = (c, r) => S(L.translate(L.sphere(r), c), ...pad3(c, r));

export const unionS = (...s) => S(L.union(...s.map(x => x.f)), [0, 1, 2].map(i => Math.min(...s.map(x => x.lo[i]))), [0, 1, 2].map(i => Math.max(...s.map(x => x.hi[i]))));
export const smoothS = (k, ...s) => S(L.smoothUnion(k, ...s.map(x => x.f)), [0, 1, 2].map(i => Math.min(...s.map(x => x.lo[i])) - k), [0, 1, 2].map(i => Math.max(...s.map(x => x.hi[i])) + k));
export const subS = (a, b, k = 0) => S(k ? L.smoothSubtract(k, a.f, b.f) : L.subtract(a.f, b.f), a.lo, a.hi);
export const interS = (a, b) => S(L.intersect(a.f, b.f), [0, 1, 2].map(i => Math.max(a.lo[i], b.lo[i])), [0, 1, 2].map(i => Math.min(a.hi[i], b.hi[i])));
export const mapS = (sh, fn) => S(fn(sh.f), sh.lo, sh.hi);

export function meshS(sh, cell = .006, refine = 2) { return L.meshSDF(sh.f, { min: sh.lo, max: sh.hi, cell, refine }); }
// both sides: fn(s) -> Shape, s = +1 (dog's right, +z) and -1 (left); merged into one mesh
export function bothSides(fn, cell, refine) { return L.merge(...SIDES.map(s => meshS(fn(s), cell, refine))); }
export function oneSide(fn, s, cell, refine) { return meshS(fn(s), cell, refine); }
export const mirrorZ = v => [v[0], v[1], -v[2]];

// ---- direct mesh pieces ----
// a bone shaft: tube from a to b with radius profile (shaft radius r, bulbs at the ends rA, rB over a fraction e of the length)
export function bone(a, b, r, rA = r, rB = r, { sides = 10, e = .16, bow = 0, bowDir = [0, 0, 1], n = 14 } = {}) {
  const d = L.sub(b, a), len = L.len(d), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, p = L.add(a, L.mul(d, t)); pts.push(L.add(p, L.mul(bowDir, bow * Math.sin(Math.PI * t) * len))); }
  const prof = t => { const ka = Math.exp(-((t / e) ** 2)), kb = Math.exp(-(((1 - t) / e) ** 2)); return r + (rA - r) * ka + (rB - r) * kb; };
  return L.tube(pts, prof, { sides, caps: true });
}
// place a mesh built in local coords (x along `ex`, y along `ey`, z along ex x ey) at origin o (metres)
export function place(m, o, ex, ey) { const x = L.norm(ex), z = L.norm(L.cross(x, ey)), y = L.cross(z, x); return L.transform(m, p => [o[0] + x[0] * p[0] + y[0] * p[1] + z[0] * p[2], o[1] + x[1] * p[0] + y[1] * p[1] + z[1] * p[2], o[2] + x[2] * p[0] + y[2] * p[1] + z[2] * p[2]]); }
// a flat plate (extruded polygon, x,y in metres) of thickness t, placed
export function plate(poly, t, o, ex, ey) { return place(L.extrudeOutline(poly, t), o, ex, ey); }
export function mirrorMesh(m) { const o = L.transform(m, p => [p[0], p[1], -p[2]]); return L.flip(o); }
export function bothMesh(m) { return L.merge(m, mirrorMesh(m)); }

// a Catmull-Rom path through points given in cm -> array of metre points
export function path(ptsCm, n = 20) { return L.spline(ptsCm.map(p => P(...p))).sample(n); }
export function tubeCm(ptsCm, rf, { n = 20, sides = 8, caps = true } = {}) { return L.tube(path(ptsCm, n), rf, { sides, caps }); }
export const lerpN = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
