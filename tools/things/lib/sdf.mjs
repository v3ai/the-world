// Signed-distance modelling. A shape is a function p=[x,y,z] -> signed distance (negative inside).
// Distances stay approximate under non-uniform scale, bend, twist and noise; the mesher only needs the sign and a rough gradient.
import { noise3, fbm } from './rng.mjs';
const hyp = Math.hypot;
// ---- primitives ----
export const sphere = (r = 1) => p => hyp(p[0], p[1], p[2]) - r;
export const ellipsoid = (rx, ry, rz) => p => { const k0 = hyp(p[0] / rx, p[1] / ry, p[2] / rz), k1 = hyp(p[0] / (rx * rx), p[1] / (ry * ry), p[2] / (rz * rz)); return k1 < 1e-12 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1; };
export const capsule = (a, b, r) => { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], dd = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1e-12; return p => { const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]]; const h = Math.max(0, Math.min(1, (pa[0] * ab[0] + pa[1] * ab[1] + pa[2] * ab[2]) / dd)); return hyp(pa[0] - ab[0] * h, pa[1] - ab[1] * h, pa[2] - ab[2] * h) - r; }; };
export const roundCone = (a, b, r1, r2) => {  // iq's exact round cone between spheres (a,r1) and (b,r2)
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l2 = ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2, rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return p => {
    const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], y = pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2], z = y - l2, pp = [pa[0] * l2 - ba[0] * y, pa[1] * l2 - ba[1] * y, pa[2] * l2 - ba[2] * y];
    const x2 = pp[0] ** 2 + pp[1] ** 2 + pp[2] ** 2, y2 = y * y * l2, z2 = z * z * l2, k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
  };
};
export const box = (hx, hy, hz, round = 0) => p => { const q = [Math.abs(p[0]) - hx + round, Math.abs(p[1]) - hy + round, Math.abs(p[2]) - hz + round]; return hyp(Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0)) + Math.min(Math.max(q[0], q[1], q[2]), 0) - round; };
export const torus = (R, r) => p => hyp(hyp(p[0], p[2]) - R, p[1]) - r;     // ring in the XZ plane around Y
export const halfSpace = (n = [0, 1, 0], d = 0) => { const l = hyp(...n); n = n.map(v => v / l); return p => p[0] * n[0] + p[1] * n[1] + p[2] * n[2] - d; };  // negative below the plane
export const cylinder = (r, h) => p => { const d = [hyp(p[0], p[2]) - r, Math.abs(p[1]) - h]; return Math.min(Math.max(d[0], d[1]), 0) + hyp(Math.max(d[0], 0), Math.max(d[1], 0)); }; // axis Y, half-height h
// ---- transforms (shapes are moved by moving the query point the opposite way) ----
export const translate = (s, v) => p => s([p[0] - v[0], p[1] - v[1], p[2] - v[2]]);
export const scale = (s, k) => { const [kx, ky, kz] = Array.isArray(k) ? k : [k, k, k], m = Math.min(kx, ky, kz); return p => s([p[0] / kx, p[1] / ky, p[2] / kz]) * m; };
export function rotate(s, axis, ang) { const l = hyp(...axis), k = axis.map(v => v / l), c = Math.cos(-ang), sn = Math.sin(-ang); return p => { const d = k[0] * p[0] + k[1] * p[1] + k[2] * p[2], kx = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]]; return s([p[0] * c + kx[0] * sn + k[0] * d * (1 - c), p[1] * c + kx[1] * sn + k[1] * d * (1 - c), p[2] * c + kx[2] * sn + k[2] * d * (1 - c)]); }; }
export const rotateEuler = (s, rx, ry, rz) => rotate(rotate(rotate(s, [1, 0, 0], rx), [0, 1, 0], ry), [0, 0, 1], rz);
// ---- booleans ----
export const union = (...s) => p => { let d = Infinity; for (const f of s) { const v = f(p); if (v < d) d = v; } return d; };
export const intersect = (...s) => p => { let d = -Infinity; for (const f of s) { const v = f(p); if (v > d) d = v; } return d; };
export const subtract = (a, b) => p => Math.max(a(p), -b(p));
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
const smax = (a, b, k) => -smin(-a, -b, k);
export const smoothUnion = (k, ...s) => p => { let d = s[0](p); for (let i = 1; i < s.length; i++) d = smin(d, s[i](p), k); return d; };
export const smoothIntersect = (k, ...s) => p => { let d = s[0](p); for (let i = 1; i < s.length; i++) d = smax(d, s[i](p), k); return d; };
export const smoothSubtract = (k, a, b) => p => smax(a(p), -b(p), k);
// ---- deformations ----
export const mirror = (s, axis = 0) => p => { const q = p.slice(); q[axis] = Math.abs(q[axis]); return s(q); };   // keep the +axis half, reflect it to the other side
export const round = (s, r) => p => s(p) - r;
export const shell = (s, t) => p => Math.abs(s(p)) - t;
// bend along `axis`: the cross-section at coordinate u is rotated about the third axis by k*u radians (k = curvature, 1/m)
export function bend(s, axis = 1, toward = 0, k = 1) { const a = axis, b = toward; return p => { const u = p[a], ang = k * u, c = Math.cos(ang), sn = Math.sin(ang), q = p.slice(); q[b] = c * p[b] - sn * u; q[a] = sn * p[b] + c * u; return s(q); }; }
export function twist(s, axis = 1, k = 1) { const a = axis, b = (a + 1) % 3, c2 = (a + 2) % 3; return p => { const ang = k * p[a], c = Math.cos(ang), sn = Math.sin(ang), q = p.slice(); q[b] = c * p[b] - sn * p[c2]; q[c2] = sn * p[b] + c * p[c2]; return s(q); }; }
export const displace = (s, fn) => p => s(p) + fn(p);
export const noiseDisplace = (s, { amp = .05, freq = 4, octaves = 3, seed = 0 } = {}) => p => s(p) + amp * fbm(p[0] * freq, p[1] * freq, p[2] * freq, { octaves, seed });
export const ridgeDisplace = (s, { amp = .05, freq = 4, octaves = 3, seed = 0 } = {}) => p => s(p) + amp * (1 - 2 * Math.abs(fbm(p[0] * freq, p[1] * freq, p[2] * freq, { octaves, seed })));
export const gradient = (s, p, e = 1e-3) => [(s([p[0] + e, p[1], p[2]]) - s([p[0] - e, p[1], p[2]])) / (2 * e), (s([p[0], p[1] + e, p[2]]) - s([p[0], p[1] - e, p[2]])) / (2 * e), (s([p[0], p[1], p[2] + e]) - s([p[0], p[1], p[2] - e])) / (2 * e)];
export { noise3, fbm };
// ---- querying a shape (to place things on its surface: lichen on a rock, leaves on a twig) ----
export function surfaceHit(s, o, d, tmax = 10) { let t = 0; for (let i = 0; i < 400; i++) { const p = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t], v = s(p); if (v < 1e-4) return { p, t }; t += Math.max(v * .6, 5e-4); if (t > tmax) return null; } return null; }
export function normalAt(s, p, e = 2e-3) { const g = gradient(s, p, e), l = Math.hypot(g[0], g[1], g[2]) || 1; return [g[0] / l, g[1] / l, g[2] / l]; }
