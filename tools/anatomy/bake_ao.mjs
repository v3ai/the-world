#!/usr/bin/env node
/* Bake ambient occlusion per vertex into the anatomy files (data/anatomy/*.json), for the realistic look (?look=2; js/body_core.js).

   For every vertex of every part (not the detail parts of the cut-open organs), the share of the hemisphere above it that is open:
   cosine-weighted rays from just off the surface, a hit within MAXD metres closes its ray. The surface normals of the data are not
   oriented (the skin is a shell drawn from both sides), so both sides are tried and the more open one is kept: the outside of a shell.
   What can close a ray is the part's neighbourhood, the layers that are drawn with it when it is the one being looked at:
     skin                       the skin
     muscles                    muscles and bones
     bones                      bones
     the eyes                   the eyes and the skin (the lids shade them: the eyes show only where the skin is shown)
     everything else            everything but the skin, the muscles and the bones (organs, vessels, nerves)
   The result is smoothed once over each vertex's neighbours and written to data/anatomy/ao.json, {format, rays, parts: {id: base64}}:
   one byte per vertex (255 open, 0 closed), in the same order as the part's vertices. The app fetches it only under the realistic look,
   so the anatomy files themselves, and what the app fetches without the look, do not change.

   usage: node tools/anatomy/bake_ao.mjs [data/anatomy] [--rays 48] [--check]      (no dependencies)
   --check reports without writing. Deterministic: the same data gives the same bytes. */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2), DIR = args.find(a => !a.startsWith('--')) || 'data/anatomy';
const RAYS = +(args[args.indexOf('--rays') + 1] || 0) || 48, CHECK = args.includes('--check');
const MAXD = { skin: .10, muscular: .05, skeletal: .04, other: .035, eye: .02 }, EPS = .0006;

const ix = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const files = [...new Set(ix.parts.map(p => p.file))], data = {}, parts = [];
for (const f of files) { data[f] = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); for (const p of data[f].parts) if (!p.parent) parts.push(p); }
const groupOf = p => p.id === 'skin' ? 'skin' : /^eyeball_/.test(p.id) ? 'eye' : p.system === 'muscular' ? 'muscular' : p.system === 'skeletal' ? 'skeletal' : 'other';
const OCC = { skin: ['skin'], muscular: ['muscular', 'skeletal'], skeletal: ['skeletal'], other: ['other', 'eye'], eye: ['eye', 'skin'] };

/* decode exactly as js/mesh_worker.js does (same vertex order, same normals) */
function decode(p) {
  const n = p.pos.length / 3, pos = new Float32Array(p.pos.length), s = p.scale, o = p.offset;
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = p.pos[i * 3 + k] * s[k] + o[k];
  const idx = Uint32Array.from(p.idx), nrm = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const cbx = pos[c] - pos[b], cby = pos[c + 1] - pos[b + 1], cbz = pos[c + 2] - pos[b + 2], abx = pos[a] - pos[b], aby = pos[a + 1] - pos[b + 1], abz = pos[a + 2] - pos[b + 2];
    const x = cby * abz - cbz * aby, y = cbz * abx - cbx * abz, z = cbx * aby - cby * abx;
    for (const v of [a, b, c]) { nrm[v] += x; nrm[v + 1] += y; nrm[v + 2] += z; }
  }
  for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l; }
  return { pos, idx, nrm };
}

/* a bounding-volume tree over triangles, for "is anything within d along this ray" */
function bvh(meshes) {
  let nt = 0; for (const m of meshes) nt += m.idx.length / 3;
  const T = new Float32Array(nt * 9), C = new Float32Array(nt * 3); let t = 0;
  for (const m of meshes) for (let i = 0; i < m.idx.length; i += 3, t++) for (let k = 0; k < 3; k++) { const v = m.idx[i + k] * 3; for (let j = 0; j < 3; j++) { T[t * 9 + k * 3 + j] = m.pos[v + j]; C[t * 3 + j] += m.pos[v + j] / 3; } }
  const order = new Uint32Array(nt).map((_, i) => i), nodes = [];   // node: [minx, miny, minz, maxx, maxy, maxz, left|start, right|-count]
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
const stack = new Int32Array(256);
function hits(B, ox, oy, oz, dx, dy, dz, tmax) {
  const { T, N, order } = B, ix = 1 / dx, iy = 1 / dy, iz = 1 / dz; let sp = 0; stack[sp++] = 0;
  while (sp) {
    const n = stack[--sp] * 8;
    let t0 = (N[n] - ox) * ix, t1 = (N[n + 3] - ox) * ix; if (t0 > t1) { const q = t0; t0 = t1; t1 = q; }
    let u0 = (N[n + 1] - oy) * iy, u1 = (N[n + 4] - oy) * iy; if (u0 > u1) { const q = u0; u0 = u1; u1 = q; }
    let w0 = (N[n + 2] - oz) * iz, w1 = (N[n + 5] - oz) * iz; if (w0 > w1) { const q = w0; w0 = w1; w1 = q; }
    const near = Math.max(t0, u0, w0, 0), far = Math.min(t1, u1, w1, tmax); if (near > far) continue;
    if (N[n + 7] < 0) {
      for (let i = N[n + 6], e = i - N[n + 7]; i < e; i++) {
        const q = order[i] * 9, ax = T[q], ay = T[q + 1], az = T[q + 2];
        const e1x = T[q + 3] - ax, e1y = T[q + 4] - ay, e1z = T[q + 5] - az, e2x = T[q + 6] - ax, e2y = T[q + 7] - ay, e2z = T[q + 8] - az;
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz;
        if (Math.abs(det) < 1e-12) continue; const inv = 1 / det, sx = ox - ax, sy = oy - ay, sz = oz - az, u = (sx * px + sy * py + sz * pz) * inv; if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) continue;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv; if (t > 0 && t < tmax) return true;
      }
    } else { stack[sp++] = N[n + 6]; stack[sp++] = N[n + 7]; }
  }
  return false;
}
/* cosine-weighted directions about +z (stratified, fixed), turned about the normal by a per-vertex angle so the pattern does not band */
const DIRS = []; { const g = Math.ceil(Math.sqrt(RAYS)); for (let i = 0; i < g && DIRS.length < RAYS; i++) for (let j = 0; j < g && DIRS.length < RAYS; j++) { const u = (i + .5) / g, v = (j + .5) / g, r = Math.sqrt(u), a = 2 * Math.PI * v; DIRS.push([r * Math.cos(a), r * Math.sin(a), Math.sqrt(1 - u)]); } }
function openness(B, p, n, side, rot, maxd) {
  const nx = n[0] * side, ny = n[1] * side, nz = n[2] * side;
  let tx = Math.abs(nx) < .9 ? 1 : 0, ty = tx ? 0 : 1, tz = 0; const d0 = tx * nx + ty * ny; tx -= d0 * nx; ty -= d0 * ny; tz -= d0 * nz; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
  const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx, c = Math.cos(rot), s = Math.sin(rot);
  const ox = p[0] + nx * EPS, oy = p[1] + ny * EPS, oz = p[2] + nz * EPS; let open = 0;
  for (const [a0, b0, w] of DIRS) { const a = a0 * c - b0 * s, b = a0 * s + b0 * c, dx = tx * a + bx * b + nx * w, dy = ty * a + by * b + ny * w, dz = tz * a + bz * b + nz * w; if (!hits(B, ox, oy, oz, dx, dy, dz, maxd)) open++; }
  return open / DIRS.length;
}

const dec = new Map(); for (const p of parts) dec.set(p, decode(p));
const trees = {};
for (const g in OCC) { const ms = parts.filter(p => OCC[g].includes(groupOf(p))).map(p => dec.get(p)); trees[g] = bvh(ms); console.log('tree', g, ms.length, 'parts', trees[g].T.length / 9, 'triangles'); }
let total = 0, bytes = 0; const t0 = Date.now(), OUT = { format: 'anatomy-ao-1', rays: RAYS, maxd: MAXD, parts: {} };
for (const p of parts) {
  const g = groupOf(p), B = trees[g], { pos, idx, nrm } = dec.get(p), n = pos.length / 3, ao = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const P = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], Nv = [nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]], rot = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 6.2832;
    ao[i] = Math.max(openness(B, P, Nv, 1, rot, MAXD[g]), openness(B, P, Nv, -1, rot, MAXD[g]));
  }
  const nb = Array.from({ length: n }, () => new Set()); for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) { const a = idx[t + k], b = idx[t + (k + 1) % 3]; nb[a].add(b); nb[b].add(a); }
  const sm = new Uint8Array(n); for (let i = 0; i < n; i++) { let s = ao[i] * 2, c = 2; nb[i].forEach(j => { s += ao[j]; c++; }); sm[i] = Math.round(255 * s / c); }
  OUT.parts[p.id] = Buffer.from(sm).toString('base64'); total += n; bytes += OUT.parts[p.id].length;
  const mean = sm.reduce((a, b) => a + b, 0) / n / 255; console.log(p.id.padEnd(24), String(n).padStart(6), 'vertices, mean openness', mean.toFixed(2));
}
console.log(`${total} vertices, ${bytes} bytes of base64, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!CHECK) { fs.writeFileSync(path.join(DIR, 'ao.json'), JSON.stringify(OUT)); console.log('ao.json', fs.statSync(path.join(DIR, 'ao.json')).size, 'bytes'); }
