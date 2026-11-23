#!/usr/bin/env node
/* Ray queries for tools/anatomy/skin_hd.py (no dependencies; the tree and the hit test are those of bake_ao.mjs).

   usage: node tools/anatomy/skin_hd_rays.mjs IN.bin OUT.bin
   IN.bin, little-endian:
     uint32 mode (0 escape, 1 openness), uint32 nV, uint32 nF, uint32 nQ, uint32 rays, float32 maxd,
     float32[nV*3] occluder vertices, uint32[nF*3] occluder triangles, float32[nQ*3] query points, float32[nQ*3] query normals
   OUT.bin: float32[nQ]
     mode 0 (escape): for each query point, the share of `rays` directions spread over the whole sphere along which a ray from just
       off the surface (on either side) leaves the mesh without hitting it within maxd. 0 means the point is shut in: the inside face
       of the skin's shell, which is never seen.
     mode 1 (openness): the share of the hemisphere above the point (cosine-weighted, on whichever side is more open) that is not
       closed within maxd: ambient occlusion, as bake_ao.mjs bakes it.
     mode 2 (thickness): how far in the surface on the other side is: the median, over `rays` directions within 25 degrees of straight
       in (against the normal), of the distance to the first hit (maxd if none). */
import fs from 'fs';

const [IN, OUT] = process.argv.slice(2);
const buf = fs.readFileSync(IN), dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const mode = dv.getUint32(0, true), nV = dv.getUint32(4, true), nF = dv.getUint32(8, true), nQ = dv.getUint32(12, true), RAYS = dv.getUint32(16, true), MAXD = dv.getFloat32(20, true);
let o = 24; const f32 = n => { const a = new Float32Array(buf.buffer.slice(buf.byteOffset + o, buf.byteOffset + o + n * 4)); o += n * 4; return a; };
const u32 = n => { const a = new Uint32Array(buf.buffer.slice(buf.byteOffset + o, buf.byteOffset + o + n * 4)); o += n * 4; return a; };
const pos = f32(nV * 3), idx = u32(nF * 3), QP = f32(nQ * 3), QN = f32(nQ * 3);

function bvh(pos, idx) {
  const nt = idx.length / 3, T = new Float32Array(nt * 9), C = new Float32Array(nt * 3);
  for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k] * 3; for (let j = 0; j < 3; j++) { T[t * 9 + k * 3 + j] = pos[v + j]; C[t * 3 + j] += pos[v + j] / 3; } }
  const order = new Uint32Array(nt).map((_, i) => i), nodes = [];
  function box(s, e) { const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]; for (let i = s; i < e; i++) { const q = order[i] * 9; for (let k = 0; k < 9; k++) { const j = k % 3, v = T[q + k]; if (v < b[j]) b[j] = v; if (v > b[j + 3]) b[j + 3] = v; } } return b; }
  function build(s, e) {
    const b = box(s, e), id = nodes.length; nodes.push(null);
    if (e - s <= 4) { nodes[id] = [...b, s, -(e - s)]; return id; }
    let ax = 0, w = -1; for (let j = 0; j < 3; j++) if (b[j + 3] - b[j] > w) { w = b[j + 3] - b[j]; ax = j; }
    const sub = Array.from(order.subarray(s, e)).sort((x, y) => C[x * 3 + ax] - C[y * 3 + ax]); order.set(sub, s);
    const m = (s + e) >> 1, l = build(s, m), r = build(m, e); nodes[id] = [...b, l, r]; return id;
  }
  build(0, nt);
  const N = new Float32Array(nodes.length * 8); nodes.forEach((n, i) => N.set(n, i * 8));
  return { T, N, order };
}
const stack = new Int32Array(512);
function hits(B, ox, oy, oz, dx, dy, dz, tmax, nearest) {   // nearest: the distance to the first hit (tmax if none) instead of whether there is one
  let best = tmax;
  const { T, N, order } = B, ix = 1 / dx, iy = 1 / dy, iz = 1 / dz; let sp = 0; stack[sp++] = 0;
  while (sp) {
    const n = stack[--sp] * 8;
    let t0 = (N[n] - ox) * ix, t1 = (N[n + 3] - ox) * ix; if (t0 > t1) { const q = t0; t0 = t1; t1 = q; }
    let u0 = (N[n + 1] - oy) * iy, u1 = (N[n + 4] - oy) * iy; if (u0 > u1) { const q = u0; u0 = u1; u1 = q; }
    let w0 = (N[n + 2] - oz) * iz, w1 = (N[n + 5] - oz) * iz; if (w0 > w1) { const q = w0; w0 = w1; w1 = q; }
    const near = Math.max(t0, u0, w0, 0), far = Math.min(t1, u1, w1, best); if (near > far) continue;
    if (N[n + 7] < 0) {
      for (let i = N[n + 6], e = i - N[n + 7]; i < e; i++) {
        const q = order[i] * 9, ax = T[q], ay = T[q + 1], az = T[q + 2];
        const e1x = T[q + 3] - ax, e1y = T[q + 4] - ay, e1z = T[q + 5] - az, e2x = T[q + 6] - ax, e2y = T[q + 7] - ay, e2z = T[q + 8] - az;
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz;
        if (Math.abs(det) < 1e-14) continue; const inv = 1 / det, sx = ox - ax, sy = oy - ay, sz = oz - az, u = (sx * px + sy * py + sz * pz) * inv; if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) continue;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv; if (t > 0 && t < best) { if (!nearest) return true; best = t; }
      }
    } else { stack[sp++] = N[n + 6]; stack[sp++] = N[n + 7]; }
  }
  return nearest ? best : false;
}
const t0 = Date.now(), B = bvh(pos, idx); console.log('tree', nF, 'triangles', ((Date.now() - t0) / 1000).toFixed(1), 's');
const EPS = 2e-4, res = new Float32Array(nQ);
if (mode === 0) {
  // directions over the whole sphere (a Fibonacci spiral), tried from both sides of the surface
  const D = []; for (let i = 0; i < RAYS; i++) { const z = 1 - 2 * (i + .5) / RAYS, r = Math.sqrt(1 - z * z), a = i * 2.39996323; D.push([r * Math.cos(a), r * Math.sin(a), z]); }
  for (let q = 0; q < nQ; q++) {
    const px = QP[q * 3], py = QP[q * 3 + 1], pz = QP[q * 3 + 2], nx = QN[q * 3], ny = QN[q * 3 + 1], nz = QN[q * 3 + 2]; let open = 0;
    for (const [dx, dy, dz] of D) { const s = dx * nx + dy * ny + dz * nz >= 0 ? 1 : -1; if (!hits(B, px + nx * EPS * s, py + ny * EPS * s, pz + nz * EPS * s, dx, dy, dz, MAXD)) open++; }
    res[q] = open / RAYS;
  }
} else if (mode === 2) {
  const D = []; for (let i = 0; i < RAYS; i++) { const a = i * 2.39996323, r = Math.sin(25 * Math.PI / 180) * Math.sqrt((i + .5) / RAYS); D.push([r * Math.cos(a), r * Math.sin(a), Math.sqrt(1 - r * r)]); }
  for (let q = 0; q < nQ; q++) {
    const nx = -QN[q * 3], ny = -QN[q * 3 + 1], nz = -QN[q * 3 + 2];
    let tx = Math.abs(nx) < .9 ? 1 : 0, ty = tx ? 0 : 1, tz = 0; const d0 = tx * nx + ty * ny; tx -= d0 * nx; ty -= d0 * ny; tz -= d0 * nz; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx, ox = QP[q * 3] + nx * EPS, oy = QP[q * 3 + 1] + ny * EPS, oz = QP[q * 3 + 2] + nz * EPS, T = [];
    for (const [a, b, w] of D) T.push(hits(B, ox, oy, oz, tx * a + bx * b + nx * w, ty * a + by * b + ny * w, tz * a + bz * b + nz * w, MAXD, true));
    T.sort((x, y) => x - y); res[q] = T[T.length >> 1];
  }
} else {
  const D = []; { const g = Math.ceil(Math.sqrt(RAYS)); for (let i = 0; i < g && D.length < RAYS; i++) for (let j = 0; j < g && D.length < RAYS; j++) { const u = (i + .5) / g, v = (j + .5) / g, r = Math.sqrt(u), a = 2 * Math.PI * v; D.push([r * Math.cos(a), r * Math.sin(a), Math.sqrt(1 - u)]); } }
  const side = (q, sd, rot) => {
    const nx = QN[q * 3] * sd, ny = QN[q * 3 + 1] * sd, nz = QN[q * 3 + 2] * sd;
    let tx = Math.abs(nx) < .9 ? 1 : 0, ty = tx ? 0 : 1, tz = 0; const d0 = tx * nx + ty * ny; tx -= d0 * nx; ty -= d0 * ny; tz -= d0 * nz; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx, c = Math.cos(rot), s = Math.sin(rot);
    const ox = QP[q * 3] + nx * EPS, oy = QP[q * 3 + 1] + ny * EPS, oz = QP[q * 3 + 2] + nz * EPS; let open = 0;
    for (const [a0, b0, w] of D) { const a = a0 * c - b0 * s, b = a0 * s + b0 * c; if (!hits(B, ox, oy, oz, tx * a + bx * b + nx * w, ty * a + by * b + ny * w, tz * a + bz * b + nz * w, MAXD)) open++; }
    return open / D.length;
  };
  for (let q = 0; q < nQ; q++) { const rot = (Math.sin(q * 12.9898) * 43758.5453 % 1) * 6.2832; res[q] = Math.max(side(q, 1, rot), side(q, -1, rot)); }
}
fs.writeFileSync(OUT, Buffer.from(res.buffer));
console.log(nQ, 'queries,', RAYS, 'rays,', ((Date.now() - t0) / 1000).toFixed(1), 's');
