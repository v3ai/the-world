// Shared numbers and helpers for the soil block (tools/things/models/soil*.mjs). Metres unless a name says mm.
import * as L from '../lib/index.mjs';

// The block: a cut block of park soil, x across (1.5 m), z deep (0.8 m), y from the surface (0) down to -1.2 m.
export const BLK = { w: 1.5, d: 0.8, h: 1.2, z0: -0.4, z1: 0.02 };   // the soil is a slab behind the cut face: z from -0.4 to just past the cut plane (z = 0)
// Horizon boundaries (m below the surface, mean depth). TYPICAL values for a temperate loamy or sandy park soil, not from a local survey (the cards say so).
export const HOR = { o: [0, -.03], a: [-.03, -.25], b: [-.25, -.80], c: [-.80, -1.2] };
export const wob = (x, z, k, amp = .012) => amp * L.fbm(x * 2.2 + k * 7, k, z * 2.2, { seed: 40 + k, octaves: 2 });   // boundary undulation, same function on both sides of a boundary
// depth of boundary k (0 = top of O, 1 = O/A, 2 = A/B, 3 = B/C, 4 = bottom)
export const bnd = (k, x, z) => k === 0 ? 0 : k === 4 ? -BLK.h : [0, -.03, -.25, -.80][k] + wob(x, z, k, k === 1 ? .004 : k === 2 ? .02 : .03);

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// add a triangle, wound so its normal agrees with the expected outward direction
function tri(m, a, b, c, n) { const p = m.pos, A = [p[a * 3], p[a * 3 + 1], p[a * 3 + 2]], B = [p[b * 3], p[b * 3 + 1], p[b * 3 + 2]], C = [p[c * 3], p[c * 3 + 1], p[c * 3 + 2]]; const g = cr(sub(B, A), sub(C, A)); if (g[0] * n[0] + g[1] * n[1] + g[2] * n[2] >= 0) m.idx.push(a, b, c); else m.idx.push(a, c, b); }
// a closed slab of the block between two undulating surfaces y = f0(x,z) (top) and y = f1(x,z) (bottom)
export function slab(f0, f1, { nx = 30, nz = 8, w = BLK.w, za = BLK.z0, zb = BLK.z1 } = {}) {
  const m = L.newMesh(), id = (kind, i, j) => (kind * (nx + 1) * (nz + 1)) + j * (nx + 1) + i;
  for (let kind = 0; kind < 2; kind++) for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = -w / 2 + w * i / nx, z = za + (zb - za) * j / nz; m.pos.push(x, (kind ? f1 : f0)(x, z), z); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    tri(m, id(0, i, j), id(0, i + 1, j), id(0, i + 1, j + 1), [0, 1, 0]); tri(m, id(0, i, j), id(0, i + 1, j + 1), id(0, i, j + 1), [0, 1, 0]);
    tri(m, id(1, i, j), id(1, i + 1, j), id(1, i + 1, j + 1), [0, -1, 0]); tri(m, id(1, i, j), id(1, i + 1, j + 1), id(1, i, j + 1), [0, -1, 0]);
  }
  const wall = (pts, n) => { for (let k = 0; k < pts.length - 1; k++) { const [t0, b0] = pts[k], [t1, b1] = pts[k + 1]; tri(m, t0, b0, b1, n); tri(m, t0, b1, t1, n); } };
  wall(Array.from({ length: nx + 1 }, (_, i) => [id(0, i, 0), id(1, i, 0)]), [0, 0, -1]);
  wall(Array.from({ length: nx + 1 }, (_, i) => [id(0, i, nz), id(1, i, nz)]), [0, 0, 1]);
  wall(Array.from({ length: nz + 1 }, (_, j) => [id(0, 0, j), id(1, 0, j)]), [-1, 0, 0]);
  wall(Array.from({ length: nz + 1 }, (_, j) => [id(0, nx, j), id(1, nx, j)]), [1, 0, 0]);
  return m;
}
export const rad = d => d * Math.PI / 180;
export const mm = m => L.scaleMesh(m, .001);
export const place = (m, at, s = 1, yaw = 0) => L.transform(m, p => { let x = p[0] * s, y = p[1] * s, z = p[2] * s; if (yaw) { const c = Math.cos(yaw), sn = Math.sin(yaw); [x, z] = [x * c + z * sn, -x * sn + z * c]; } return [x + at[0], y + at[1], z + at[2]]; });
export function uvSphere(r, nu = 8, nv = 5) {
  const m = L.newMesh();
  for (let j = 0; j <= nv; j++) { const v = j / nv * Math.PI; for (let i = 0; i < nu; i++) { const u = i / nu * Math.PI * 2; m.pos.push(r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)); } }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * nu + i, b = j * nu + (i + 1) % nu, c = a + nu, d = b + nu; if (j > 0) m.idx.push(a, b, c); if (j < nv - 1) m.idx.push(b, d, c); }
  const w = L.weld(m, 1e-9); return L.signedVolume(w) < 0 ? L.flip(w) : w;
}
export const ell = (c, r, yaw = 0) => { let s = L.ellipsoid(r[0], r[1], r[2]); if (yaw) s = L.rotate(s, [0, 1, 0], yaw); return L.translate(s, c); };
export const spl = (pts, n = 12) => L.spline(pts).sample(n);
export const tubeM = (pts, r, sides = 6, n = 0, caps = true) => L.tube(n ? spl(pts, n) : pts, r, { sides, caps });
export const sdfMesh = (sdf, min, max, cell, refine = 1, sm = 0) => { let m = L.meshSDF(sdf, { min, max, cell, refine }); if (sm) m = L.smooth(m, sm); return m; };
export const aoShade = (sdf, tone = 1, d = .18, k = 1) => (p, n) => { const a = Math.max(0, Math.min(1, sdf([p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d]) / d)); return tone * (1 - k * .5 + k * .5 * a); };
// quaternion that turns +z onto direction d
export const qz = d => L.quatFromTo([0, 0, 1], d);
