// Shared numbers and helpers for the pond (tools/things/models/pond*.mjs). Metres unless a name says mm.
import * as L from '../lib/index.mjs';

// ---- the pond's shape: a model, chosen to match the park's old pond (an ellipse 6 m by 4.6 m) and a typical wildlife-pond profile ----
export const POND = {
  a: 3.0, b: 2.3,          // semi-axes of the water edge (m): the park's old pond disc was scaled 3 x 2.3
  yw: 0.02,                // water level above the park's ground (m)
  depth: 0.6,              // deepest water (m): a model choice for a garden or park pond, not a measurement of a particular one
  shelfY: -0.17,           // the marginal shelf is about 0.17 m below the surface at its outer edge... see bedY
  bank: 1.22,              // the bank ring ends at this multiple of the water edge
  mudBottom: -0.9,         // the bottom of the cut-away block of mud (m)
};
export const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const sOf = (x, z) => Math.hypot(x / POND.a, z / POND.b);
export const bedY = (x, z) => {
  const s = sOf(x, z);
  let d = POND.depth - .40 * sm(.5, .8, s) - .17 * sm(.86, 1.0, s);   // 0.6 m deep in the middle, a shelf about 0.2 m deep, a rim at 0.03 m
  d += .025 * L.fbm(x * 1.3, 0, z * 1.3, { seed: 5, octaves: 2 }) * sm(.1, .4, s) * (1 - sm(.9, 1, s));
  return -d;
};
export const bankY = s => -.03 + .03 * sm(1.0, 1.1, s);

// rotate a vector by yaw about +y, then pitch about +z, then roll about +x (all radians)
export function xf(p, { yaw = 0, pitch = 0, roll = 0 } = {}) {
  let v = p;
  if (roll) v = L.rotAxis(v, [1, 0, 0], roll);
  if (pitch) v = L.rotAxis(v, [0, 0, 1], pitch);
  if (yaw) v = L.rotAxis(v, [0, 1, 0], yaw);
  return v;
}
export const place = (m, { at = [0, 0, 0], s = 1, ...r } = {}) => L.transform(m, p => { const q = xf([p[0] * s, p[1] * s, p[2] * s], r); return [q[0] + at[0], q[1] + at[1], q[2] + at[2]]; });
export const mmToM = m => L.scaleMesh(m, .001);
export const rad = d => d * Math.PI / 180;

// polar grid over the ellipse: rings of na vertices at s = s0..s1 (nr rings); fy(x, z, s) gives the height. Open sheet, normals up unless flipped.
export function polarSheet({ s0 = 0, s1 = 1, nr = 24, na = 64, fy, flip = false, A = POND.a, B = POND.b }) {
  const m = L.newMesh(), ring = [];
  const vert = (s, a) => { const x = Math.cos(a) * A * s, z = Math.sin(a) * B * s; m.pos.push(x, fy(x, z, s), z); return m.pos.length / 3 - 1; };
  if (s0 === 0) { m.pos.push(0, fy(0, 0, 0), 0); ring.push([0]); }
  for (let i = s0 === 0 ? 1 : 0; i <= nr; i++) { const s = s0 + (s1 - s0) * i / nr, r = []; for (let k = 0; k < na; k++) r.push(vert(s, k / na * Math.PI * 2)); ring.push(r); }
  for (let i = 0; i < ring.length - 1; i++) {
    const r0 = ring[i], r1 = ring[i + 1];
    for (let k = 0; k < na; k++) {
      const k2 = (k + 1) % na;
      if (r0.length === 1) m.idx.push(r0[0], r1[k2], r1[k]);   // up-facing: viewed from +y the angle runs clockwise in x,z (a -> z), so wind accordingly
      else { m.idx.push(r0[k], r1[k2], r1[k], r0[k], r0[k2], r1[k2]); }
    }
  }
  if (flip) return L.flip(m);
  return m;
}
// a vertical wall around the ellipse at s between heights y0(x,z) (bottom) and y1(x,z) (top), facing outward
export function polarWall({ s = 1, na = 64, y0, y1, A = POND.a, B = POND.b, ny = 1 }) {
  const m = L.newMesh();
  for (let k = 0; k < na; k++) { const a = k / na * Math.PI * 2, x = Math.cos(a) * A * s, z = Math.sin(a) * B * s, lo = y0(x, z), hi = y1(x, z); for (let j = 0; j <= ny; j++) m.pos.push(x, lo + (hi - lo) * j / ny, z); }
  for (let k = 0; k < na; k++) { const k2 = (k + 1) % na; for (let j = 0; j < ny; j++) { const a = k * (ny + 1) + j, b = k2 * (ny + 1) + j; m.idx.push(a, b + 1, b, a, a + 1, b + 1); } }
  return m;
}
// make a closed solid outward-facing whatever the winding the parts came with
export function solid(...ms) { const m = L.weld(L.merge(...ms), 1e-6); return L.signedVolume(m) < 0 ? L.flip(m) : m; }
export const sphereMesh = (r, n = 8) => L.meshSDF(L.sphere(r), { min: [-r * 1.2, -r * 1.2, -r * 1.2], max: [r * 1.2, r * 1.2, r * 1.2], res: n, refine: 0 });
// a low-polygon UV sphere, n segments (cheap instanced bubbles and eggs)
export function uvSphere(r, nu = 8, nv = 5) {
  const m = L.newMesh();
  for (let j = 0; j <= nv; j++) { const v = j / nv * Math.PI; for (let i = 0; i < nu; i++) { const u = i / nu * Math.PI * 2; m.pos.push(r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)); } }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * nu + i, b = j * nu + (i + 1) % nu, c = a + nu, d = b + nu; if (j > 0) m.idx.push(a, c, b); if (j < nv - 1) m.idx.push(b, c, d); }
  return m;
}
export const E = (c, r, yaw = 0) => { let s = L.ellipsoid(r[0], r[1], r[2]); if (yaw) s = L.rotate(s, [0, 1, 0], yaw); return L.translate(s, c); };
export const sp = (pts, n = 12) => L.spline(pts).sample(n);
export const aoShade = (sdf, tone = 1, d = .18, k = 1) => (p, n) => { const a = Math.max(0, Math.min(1, sdf([p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d]) / d)); return tone * (1 - k * .5 + k * .5 * a); };
