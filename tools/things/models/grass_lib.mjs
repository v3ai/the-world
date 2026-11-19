// Helpers for the perennial ryegrass model: grass blades (ribbed upper sheet, smooth under sheet), open sheaths, flat slabs for cut faces.
import * as L from '../lib/index.mjs';
export const TAU = Math.PI * 2;
export function basisQuat(X, Y, Z) {
  const m00 = X[0], m01 = Y[0], m02 = Z[0], m10 = X[1], m11 = Y[1], m12 = Z[1], m20 = X[2], m21 = Y[2], m22 = Z[2], tr = m00 + m11 + m22; let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
  return q;
}
// place a mesh built in a local frame (Y up) into the world: origin O, axes X, Y, Z
export const place = (m, O, X, Y, Z) => L.transform(m, p => [O[0] + X[0] * p[0] + Y[0] * p[1] + Z[0] * p[2], O[1] + X[1] * p[0] + Y[1] * p[1] + Z[1] * p[2], O[2] + X[2] * p[0] + Y[2] * p[1] + Z[2] * p[2]]);
export function frameFromAxis(Y, az = 0) { const X0 = L.perp(Y), X = L.rotAxis(X0, Y, az), Z = L.cross(X, Y); return { X, Y, Z, q: basisQuat(X, Y, Z) }; }

// A grass blade in a local frame (Y up along the tiller). Base at P0 (on the collar), leaning toward azimuth az, tilt from vertical goes tilt0 -> tilt1 along the length.
// Returns { up, down, centre(t) } : two single-sided sheets (adaxial = ribbed, faces inward/up; abaxial = smooth, faces outward/down).
export function grassBlade({ P0, az, tilt0, tilt1, len, W, thick = .00022, rows = 12, across = 7, ribs = 9, ribAmp = .00006, keel = .18, cut = 0, bend = 1.6 }) {
  const ca = Math.cos(az), sa = Math.sin(az), S = [-sa, 0, ca], cols = across * 2 + 1, up = L.newMesh(), dn = L.newMesh(), cen = [];
  let p = P0.slice();
  const pts = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, th = tilt0 + (tilt1 - tilt0) * Math.pow(t, bend), dir = [Math.sin(th) * ca, Math.cos(th), Math.sin(th) * sa], B = [-Math.cos(th) * ca, Math.sin(th), -Math.cos(th) * sa];
    pts.push({ c: p.slice(), B, t }); cen.push(p.slice());
    const th2 = tilt0 + (tilt1 - tilt0) * Math.pow(Math.min(1, (i + 1) / rows), bend), d2 = [Math.sin(th2) * ca, Math.cos(th2), Math.sin(th2) * sa];
    p = L.add(p, L.mul(L.norm(L.add(dir, d2)), len / rows));
  }
  const lim = 1 - cut;   // cut: fraction of the length removed at the tip (a mown blade ends bluntly)
  const wAt = t => { const x = Math.min(1, t / lim); return W / 2 * (0.9 + .1 * Math.sin(Math.PI * Math.min(1, t * 6) / 2)) * Math.pow(Math.max(0, Math.min(1, (1 - x) / .2)), cut > 0 ? 0.01 : .75); };
  const mk = (m, top) => {
    for (const q of pts) for (let j = 0; j < cols; j++) {
      const s = j / (cols - 1) * 2 - 1, w = wAt(q.t) * 1, lat = s * w, rib = top ? ribAmp * (.5 + .5 * Math.cos(Math.PI * ribs * s)) * Math.min(1, 1 - Math.abs(s) ** 6) : 0;
      const off = keel * Math.abs(lat) + (top ? thick / 2 + rib : -thick / 2) - (1 - Math.abs(s)) * (top ? 0 : thick * .5);
      m.pos.push(q.c[0] + S[0] * lat + q.B[0] * off, q.c[1] + S[1] * lat + q.B[1] * off, q.c[2] + S[2] * lat + q.B[2] * off);
    }
    const nT = rows * (1 - cut) | 0 || rows; const R = cut > 0 ? Math.max(1, Math.round(rows * lim)) : rows;
    for (let i = 0; i < R; i++) for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + 1, c = a + cols + 1, d = a + cols; if (top) m.idx.push(a, b, c, a, c, d); else m.idx.push(a, c, b, a, d, c); }
  };
  mk(up, true); mk(dn, false);
  return { up, down: dn, tip: cen[rows], cen };
}

// an open sheath: a rolled sheet round the axis (Y), y0..y1, radius r0 at the base and r1 at the top, wrapped through `wrap` radians starting at angle a0 (the open slit faces the rest)
export function sheath({ y0, y1, r0, r1, a0 = 0, wrap = 5.0, rows = 5, seg = 14 }) {
  const m = L.newMesh();
  for (let i = 0; i <= rows; i++) { const t = i / rows, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * Math.pow(t, 1.5), open = 1 + 0.25 * Math.pow(t, 3);
    for (let j = 0; j <= seg; j++) { const a = a0 + (j / seg - .5) * wrap * open; m.pos.push(r * Math.cos(a), y, -r * Math.sin(a)); } }
  for (let i = 0; i < rows; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + 1, c = a + seg + 2, d = a + seg + 1; m.idx.push(a, b, c, a, c, d); }
  return m;
}
// flat section slab in the plane z = zc facing +z
export const slab = (poly, zc, t = .00004) => L.extrudeOutline(poly, t, { warp: p => [p[0], p[1], p[2] + zc] });
export const ellipse = (cx, cy, a, b, ang = 0, n = 16) => Array.from({ length: n }, (_, i) => { const t = i / n * TAU, x = a * Math.cos(t), y = b * Math.sin(t); return [cx + x * Math.cos(ang) - y * Math.sin(ang), cy + x * Math.sin(ang) + y * Math.cos(ang)]; });
export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
