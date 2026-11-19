// Shared helpers for the robin model (millimetres inside, metres at the end).
import * as L from '../lib/index.mjs';
export const MM = .001, D2R = Math.PI / 180;
export const add = L.add, sub = L.sub, mul = L.mul, norm = L.norm, cross = L.cross, dot = L.dot, len = L.len, lerp3 = L.lerp3;
export const S2 = [1, -1];
// ellipsoid with centre c, radii r, rotated by deg about z (nose-up positive)
export const EZ = (c, r, deg = 0) => { let s = L.ellipsoid(r[0], r[1], r[2]); if (deg) s = L.rotate(s, [0, 0, 1], deg * D2R); return L.translate(s, c); };
export const bnd = (sdf, min, max, cell, refine = 1, sm = 1) => { let m = L.meshSDF(sdf, { min, max, cell, refine }); if (sm) m = L.smooth(m, sm); return m; };
export const sp = (pts, n = 24) => L.spline(pts).sample(n);
export const tubeM = (pts, r, sides = 7, n, caps = true) => L.tube(n ? sp(pts, n) : pts, r, { sides, caps });
export const fin = m => { const o = L.scaleMesh(m, MM); if (m.shade) o.shade = m.shade; return o; };
export const mirrorZ = p => [p[0], p[1], -p[2]];
export const zs = (p, s) => [p[0], p[1], p[2] * s];
// rotation of a vector in the x-y plane by deg
export const rot2 = (v, deg) => { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2] || 0]; };
// quaternion from an orthonormal basis (columns x, y, z)
export function quatBasis(x, y, z) {
  const m00 = x[0], m01 = y[0], m02 = z[0], m10 = x[1], m11 = y[1], m12 = z[1], m20 = x[2], m21 = y[2], m22 = z[2];
  const tr = m00 + m11 + m22; let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
  return q;
}
// orthonormal frame with y along `dir`, z as close to `nrm` as possible
export function frameYZ(dir, nrm) { const y = norm(dir); let z = sub(nrm, mul(y, dot(nrm, y))); z = norm(z); const x = cross(y, z); return { x, y, z }; }
// split a mesh into sub-meshes by a classifier (p, n) -> key, using triangle centroids and face normals; shared vertices are copied
export function splitMesh(m, classify) {
  const out = {}, maps = {};
  for (let i = 0; i < m.idx.length; i += 3) {
    const a = m.idx[i], b = m.idx[i + 1], c = m.idx[i + 2], P = k => [m.pos[k * 3], m.pos[k * 3 + 1], m.pos[k * 3 + 2]];
    const pa = P(a), pb = P(b), pc = P(c), cen = [(pa[0] + pb[0] + pc[0]) / 3, (pa[1] + pb[1] + pc[1]) / 3, (pa[2] + pb[2] + pc[2]) / 3];
    const n = norm(cross(sub(pb, pa), sub(pc, pa))), key = classify(cen, n);
    if (!key) continue; const o = out[key] || (out[key] = L.newMesh()), mp = maps[key] || (maps[key] = new Map());
    for (const k of [a, b, c]) { if (!mp.has(k)) { mp.set(k, o.pos.length / 3); o.pos.push(...P(k)); } o.idx.push(mp.get(k)); }
  }
  return out;
}
// a UV sphere (a lathe of a half circle): cheap and smooth for small balls (eyes, joints)
export function ball(r, c, nSeg = 20, nRing = 12) { const prof = []; for (let i = 0; i <= nRing; i++) { const t = Math.PI * i / nRing; prof.push([Math.max(1e-4, r * Math.sin(t)), -r * Math.cos(t)]); } return L.transform(L.lathe(prof, { segments: nSeg, caps: false }), p => [p[0] + c[0], p[1] + c[1], p[2] + c[2]]); }
export { L };
