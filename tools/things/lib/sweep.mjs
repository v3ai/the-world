// Sweeps: tubes along splines, lathes, blades (leaves, petals, wings, feathers), extruded outlines.
import { add, sub, mul, dot, cross, norm, len, perp, rotAxis } from './vec.mjs';
import { newMesh, weld } from './mesh.mjs';

// Catmull-Rom spline through control points (uniform). Returns a function t in [0,1] -> point, and sample(n).
export function spline(pts) {
  const n = pts.length;
  const at = t => {
    const f = Math.max(0, Math.min(.999999, t)) * (n - 1), i = Math.floor(f), u = f - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[Math.min(n - 1, i + 1)], p3 = pts[Math.min(n - 1, i + 2)];
    const u2 = u * u, u3 = u2 * u;
    return [0, 1, 2].map(a => .5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * u + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * u2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * u3));
  };
  at.sample = k => { const o = []; for (let i = 0; i <= k; i++) o.push(at(i / k)); return o; };
  return at;
}
// Tube with varying radius along a polyline. path: array of points (use spline(...).sample(k) for smooth ones).
// radius: number or t(0..1)->r. Rings are parallel-transported so the tube does not twist. caps closes both ends with a fan.
export function tube(path, radius = .1, { sides = 8, caps = true, up } = {}) {
  const m = newMesh(), n = path.length, R = typeof radius === 'function' ? radius : () => radius;
  let T = norm(sub(path[1], path[0])), N = up ? norm(sub(up, mul(T, dot(up, T)))) : perp(T);
  if (!isFinite(N[0])) N = perp(T);
  const rings = [];
  for (let i = 0; i < n; i++) {
    const Tn = norm(i === 0 ? sub(path[1], path[0]) : i === n - 1 ? sub(path[n - 1], path[n - 2]) : sub(path[i + 1], path[i - 1]));
    if (i > 0) { const ax = cross(T, Tn), s = len(ax); if (s > 1e-9) N = rotAxis(N, mul(ax, 1 / s), Math.asin(Math.min(1, s))); T = Tn; }
    N = norm(sub(N, mul(T, dot(N, T)))); const B = cross(T, N);
    const r = Math.max(R(i / (n - 1)), 1e-6), ring = [];
    for (let a = 0; a < sides; a++) { const ang = a / sides * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang); ring.push(m.pos.length / 3); m.pos.push(path[i][0] + r * (c * N[0] + s * B[0]), path[i][1] + r * (c * N[1] + s * B[1]), path[i][2] + r * (c * N[2] + s * B[2])); }
    rings.push(ring);
  }
  for (let i = 0; i < n - 1; i++) for (let a = 0; a < sides; a++) { const b = (a + 1) % sides, p = rings[i][a], q = rings[i][b], r = rings[i + 1][b], s = rings[i + 1][a]; m.idx.push(p, q, r, p, r, s); }
  if (caps) { for (const [ring, pt, rev] of [[rings[0], path[0], true], [rings[n - 1], path[n - 1], false]]) { const c = m.pos.length / 3; m.pos.push(...pt); for (let a = 0; a < sides; a++) { const b = (a + 1) % sides; if (rev) m.idx.push(c, ring[b], ring[a]); else m.idx.push(c, ring[a], ring[b]); } } }
  return m;
}
// Surface of revolution about Y. profile: [[radius, y], ...] from bottom to top. closed: add axis caps if the ends are off-axis.
export function lathe(profile, { segments = 24, caps = true } = {}) {
  const m = newMesh(), k = profile.length;
  for (let s = 0; s < segments; s++) { const a = s / segments * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); for (const [r, y] of profile) m.pos.push(r * c, y, -r * sn); }
  const id = (s, i) => (s % segments) * k + i;
  for (let s = 0; s < segments; s++) for (let i = 0; i < k - 1; i++) { const a = id(s, i), b = id(s + 1, i), c = id(s + 1, i + 1), d = id(s, i + 1); m.idx.push(a, b, c, a, c, d); }
  if (caps) for (const [i, up] of [[0, false], [k - 1, true]]) if (profile[i][0] > 1e-9) { const c = m.pos.length / 3; m.pos.push(0, profile[i][1], 0); for (let s = 0; s < segments; s++) up ? m.idx.push(c, id(s, i), id(s + 1, i)) : m.idx.push(c, id(s + 1, i), id(s, i)); }
  return m;
}
// A thin curved blade (leaf, petal, wing, feather vane) as a closed solid of two surfaces joined at the rim.
// shape: halfWidth(t) for t in 0..1 from base to tip; length; thickness (m); fold: lift of the edges relative to the midrib (a V-fold);
// curlAlong: bend of the whole blade along its length (radians over the length); curlAcross: cupping across the width.
// Blade lies in the XY plane (x across, y along), faces +Z. Returns a Mesh.
export function blade({ length = 1, halfWidth = t => .3 * Math.sin(Math.PI * t) ** .8, thickness = .01, nAlong = 16, nAcross = 5, fold = 0, curlAlong = 0, curlAcross = 0, midribBulge = 0 } = {}) {
  const m = newMesh(), cols = nAcross * 2 + 1, rows = nAlong + 1;
  const surf = (t, s) => {   // s in -1..1
    const w = halfWidth(t), x = s * w;
    let y = t * length, z = fold * Math.abs(s) * w + curlAcross * s * s * w;
    if (curlAlong) { const ang = curlAlong * t, R = length / curlAlong; y = R * Math.sin(ang); z += R * (1 - Math.cos(ang)); }
    return [x, y, z];
  };
  const layer = side => { const base = m.pos.length / 3; for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const t = i / nAlong, s = (j / (cols - 1)) * 2 - 1, p = surf(t, s), edge = 1 - s * s, tap = Math.sqrt(Math.sin(Math.PI * t)), th = thickness * .5 * tap * (side * Math.sqrt(Math.max(edge, 0)) + (side > 0 ? midribBulge * (1 - Math.abs(s)) : 0)); m.pos.push(p[0], p[1], p[2] + th); } return base; };
  const top = layer(1), bot = layer(-1), at = (b, i, j) => b + i * cols + j;
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
    m.idx.push(at(top, i, j), at(top, i, j + 1), at(top, i + 1, j + 1), at(top, i, j), at(top, i + 1, j + 1), at(top, i + 1, j));
    m.idx.push(at(bot, i, j), at(bot, i + 1, j + 1), at(bot, i, j + 1), at(bot, i, j), at(bot, i + 1, j), at(bot, i + 1, j + 1));
  }
  // the two surfaces meet along the rim (s = ±1) and at the tip and base, where thickness and width go to zero; welding closes the solid
  return weld(m, thickness * 1e-3 + 1e-9);
}
// Extrude a simple 2D outline (CCW polygon [[x,y],...]) into a slab of the given thickness, optionally warped to curl it.
export function extrudeOutline(outline, thickness = .01, { warp } = {}) {
  let a2 = 0; for (let i = 0; i < outline.length; i++) { const p = outline[i], q = outline[(i + 1) % outline.length]; a2 += p[0] * q[1] - q[0] * p[1]; }
  if (a2 < 0) outline = outline.slice().reverse();   // always walk the rim counter-clockwise so the walls face outward
  const m = newMesh(), n = outline.length, tri = earClip(outline);
  for (const z of [thickness / 2, -thickness / 2]) for (const [x, y] of outline) m.pos.push(x, y, z);
  for (let i = 0; i < tri.length; i += 3) { m.idx.push(tri[i], tri[i + 1], tri[i + 2]); m.idx.push(n + tri[i], n + tri[i + 2], n + tri[i + 1]); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; m.idx.push(i, n + i, n + j, i, n + j, j); }
  if (warp) for (let i = 0; i < m.pos.length; i += 3) { const q = warp([m.pos[i], m.pos[i + 1], m.pos[i + 2]]); m.pos[i] = q[0]; m.pos[i + 1] = q[1]; m.pos[i + 2] = q[2]; }
  return m;
}
export function earClip(poly) {
  const n = poly.length, idx = [...Array(n).keys()], out = [];
  let a2 = 0; for (let i = 0; i < n; i++) { const p = poly[i], q = poly[(i + 1) % n]; a2 += p[0] * q[1] - q[0] * p[1]; }
  if (a2 < 0) idx.reverse();
  const cr = (a, b, c) => (poly[b][0] - poly[a][0]) * (poly[c][1] - poly[a][1]) - (poly[b][1] - poly[a][1]) * (poly[c][0] - poly[a][0]);
  const inTri = (p, a, b, c) => cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0;
  let guard = n * n;
  while (idx.length > 3 && guard-- > 0) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
      if (cr(a, b, c) <= 1e-14) continue;
      let ok = true; for (const p of idx) if (p !== a && p !== b && p !== c && inTri(p, a, b, c)) { ok = false; break; }
      if (!ok) continue;
      out.push(a, b, c); idx.splice(i, 1); cut = true; break;
    }
    if (!cut) break;
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  return out;
}
