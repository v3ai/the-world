// Triangle meshes and the mesher. A Mesh is { pos: number[] (x,y,z flat), idx: number[] (triangles, counter-clockwise seen from outside) }.
import { gradient } from './sdf.mjs';
export const newMesh = () => ({ pos: [], idx: [] });
export const triCount = m => m.idx.length / 3;
export const vertCount = m => m.pos.length / 3;

// ---------- surface nets (dual contouring on a grid, one vertex per cell) ----------
// opts: min,max (bounding box [x,y,z]), cell (edge length in metres) or res (cells along the longest side), refine (Newton steps per vertex)
export function meshSDF(sdf, { min, max, cell, res = 64, refine = 2 }) {
  const ext = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  cell = cell || Math.max(...ext) / res;
  const n = ext.map(e => Math.max(2, Math.ceil(e / cell))), sx = n[0] + 1, sy = n[1] + 1, sz = n[2] + 1;
  const val = new Float32Array(sx * sy * sz), gi = (i, j, k) => (k * sy + j) * sx + i;
  const P = [0, 0, 0];
  for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) { P[0] = min[0] + i * cell; P[1] = min[1] + j * cell; P[2] = min[2] + k * cell; val[gi(i, j, k)] = sdf(P); }
  const vid = new Int32Array(n[0] * n[1] * n[2]).fill(-1), ci = (i, j, k) => (k * n[1] + j) * n[0] + i;
  const m = newMesh();
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float64Array(8);
  for (let k = 0; k < n[2]; k++) for (let j = 0; j < n[1]; j++) for (let i = 0; i < n[0]; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const v = val[gi(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]; cv[c] = v; if (v < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sxp = 0, syp = 0, szp = 0, cnt = 0;
    for (const [a, b] of EDGES) {
      if ((cv[a] < 0) === (cv[b] < 0)) continue;
      const t = cv[a] / (cv[a] - cv[b]);
      sxp += (a & 1) + ((b & 1) - (a & 1)) * t; syp += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; szp += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t; cnt++;
    }
    const lo = [min[0] + i * cell, min[1] + j * cell, min[2] + k * cell];
    let p = [lo[0] + sxp / cnt * cell, lo[1] + syp / cnt * cell, lo[2] + szp / cnt * cell];
    for (let r = 0; r < refine; r++) {   // snap towards the true surface along the gradient, staying inside the cell
      const d = sdf(p), g = gradient(sdf, p, cell * .05), gl = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (gl < 1e-12) break;
      const f = Math.max(-cell * .6, Math.min(cell * .6, d)) / gl;
      p = [p[0] - g[0] * f, p[1] - g[1] * f, p[2] - g[2] * f];
      for (let a = 0; a < 3; a++) p[a] = Math.max(lo[a] + cell * .04, Math.min(lo[a] + cell * .96, p[a]));
    }
    vid[ci(i, j, k)] = m.pos.length / 3; m.pos.push(p[0], p[1], p[2]);
  }
  const quad = (a, b, c, d, flip) => {   // choose the shorter diagonal
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    const pa = m.pos, dd = (x, y) => (pa[x * 3] - pa[y * 3]) ** 2 + (pa[x * 3 + 1] - pa[y * 3 + 1]) ** 2 + (pa[x * 3 + 2] - pa[y * 3 + 2]) ** 2;
    if (flip) { const t = b; b = d; d = t; }
    if (dd(a, c) <= dd(b, d)) m.idx.push(a, b, c, a, c, d); else m.idx.push(a, b, d, b, c, d);
  };
  const cidx = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= n[0] || j >= n[1] || k >= n[2]) ? -1 : vid[ci(i, j, k)];
  for (let k = 0; k <= n[2]; k++) for (let j = 0; j <= n[1]; j++) for (let i = 0; i <= n[0]; i++) {
    const v0 = val[gi(i, j, k)];
    for (let axis = 0; axis < 3; axis++) {
      const i1 = i + (axis === 0), j1 = j + (axis === 1), k1 = k + (axis === 2);
      if (i1 > n[0] || j1 > n[1] || k1 > n[2]) continue;
      const v1 = val[gi(i1, j1, k1)];
      if ((v0 < 0) === (v1 < 0)) continue;
      const u = (axis + 1) % 3, w = (axis + 2) % 3, base = [i, j, k];
      const at = (du, dw) => { const q = base.slice(); q[u] += du; q[w] += dw; return cidx(q[0], q[1], q[2]); };
      quad(at(-1, -1), at(0, -1), at(0, 0), at(-1, 0), !(v0 < 0));   // inside -> outside along +axis: normal +axis
    }
  }
  return m;
}

// ---------- mesh operations ----------
export function bounds(m) { const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (let i = 0; i < m.pos.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], m.pos[i + a]); hi[a] = Math.max(hi[a], m.pos[i + a]); } return { min: lo, max: hi }; }
export function merge(...ms) { const o = newMesh(); for (const m of ms) { const b = o.pos.length / 3; for (const v of m.pos) o.pos.push(v); for (const i of m.idx) o.idx.push(i + b); } return o; }
export function transform(m, fn) { const o = { pos: m.pos.slice(), idx: m.idx.slice() }; const p = [0, 0, 0]; for (let i = 0; i < o.pos.length; i += 3) { p[0] = o.pos[i]; p[1] = o.pos[i + 1]; p[2] = o.pos[i + 2]; const q = fn(p) || p; o.pos[i] = q[0]; o.pos[i + 1] = q[1]; o.pos[i + 2] = q[2]; } return o; }
export const translateMesh = (m, v) => transform(m, p => [p[0] + v[0], p[1] + v[1], p[2] + v[2]]);
export const scaleMesh = (m, s) => transform(m, p => Array.isArray(s) ? [p[0] * s[0], p[1] * s[1], p[2] * s[2]] : [p[0] * s, p[1] * s, p[2] * s]);
export function flip(m) { const o = { pos: m.pos.slice(), idx: m.idx.slice() }; for (let i = 0; i < o.idx.length; i += 3) { const t = o.idx[i + 1]; o.idx[i + 1] = o.idx[i + 2]; o.idx[i + 2] = t; } return o; }
export function signedVolume(m) { let v = 0; const p = m.pos; for (let i = 0; i < m.idx.length; i += 3) { const a = m.idx[i] * 3, b = m.idx[i + 1] * 3, c = m.idx[i + 2] * 3; v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]); } return v / 6; }
export function area(m) { let s = 0; const p = m.pos; for (let i = 0; i < m.idx.length; i += 3) s += triArea(p, m.idx[i], m.idx[i + 1], m.idx[i + 2]); return s; }
function triArea(p, a, b, c) { a *= 3; b *= 3; c *= 3; const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2]; return .5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx); }
// Merge vertices closer than eps, drop triangles that collapse. Returns a new mesh.
export function weld(m, eps = 1e-6) {
  const map = new Map(), remap = new Array(m.pos.length / 3), o = newMesh(), q = 1 / eps;
  for (let i = 0; i < m.pos.length; i += 3) {
    const key = Math.round(m.pos[i] * q) + ',' + Math.round(m.pos[i + 1] * q) + ',' + Math.round(m.pos[i + 2] * q);
    let id = map.get(key); if (id === undefined) { id = o.pos.length / 3; map.set(key, id); o.pos.push(m.pos[i], m.pos[i + 1], m.pos[i + 2]); }
    remap[i / 3] = id;
  }
  for (let i = 0; i < m.idx.length; i += 3) { const a = remap[m.idx[i]], b = remap[m.idx[i + 1]], c = remap[m.idx[i + 2]]; if (a !== b && b !== c && a !== c) o.idx.push(a, b, c); }
  return o;
}
export function dropDegenerate(m, minArea = 1e-12) { const o = { pos: m.pos, idx: [] }; for (let i = 0; i < m.idx.length; i += 3) if (triArea(m.pos, m.idx[i], m.idx[i + 1], m.idx[i + 2]) > minArea) o.idx.push(m.idx[i], m.idx[i + 1], m.idx[i + 2]); return o; }
function adjacency(m) { const nv = m.pos.length / 3, adj = Array.from({ length: nv }, () => new Set()); for (let i = 0; i < m.idx.length; i += 3) for (let e = 0; e < 3; e++) { const a = m.idx[i + e], b = m.idx[i + (e + 1) % 3]; adj[a].add(b); adj[b].add(a); } return adj; }
// Taubin smoothing: smooths without shrinking the shape (lambda > 0, mu < 0).
export function smooth(m, iters = 2, lambda = .5, mu = -.53) {
  const adj = adjacency(m), nv = m.pos.length / 3; let p = Float64Array.from(m.pos);
  for (let it = 0; it < iters * 2; it++) {
    const f = it % 2 ? mu : lambda, q = Float64Array.from(p);
    for (let v = 0; v < nv; v++) { const a = adj[v]; if (!a.size) continue; let x = 0, y = 0, z = 0; for (const u of a) { x += p[u * 3]; y += p[u * 3 + 1]; z += p[u * 3 + 2]; } x /= a.size; y /= a.size; z /= a.size; q[v * 3] += f * (x - p[v * 3]); q[v * 3 + 1] += f * (y - p[v * 3 + 1]); q[v * 3 + 2] += f * (z - p[v * 3 + 2]); }
    p = q;
  }
  return { pos: Array.from(p), idx: m.idx.slice() };
}
// Vertex-clustering simplification: all vertices in one grid cell become one vertex. Cheap and robust; used for far-LOD stand-ins.
export function simplify(m, cell) {
  const map = new Map(), sum = [], remap = new Array(m.pos.length / 3);
  for (let i = 0; i < m.pos.length; i += 3) {
    const key = Math.floor(m.pos[i] / cell) + ',' + Math.floor(m.pos[i + 1] / cell) + ',' + Math.floor(m.pos[i + 2] / cell);
    let id = map.get(key); if (id === undefined) { id = sum.length; map.set(key, id); sum.push([0, 0, 0, 0]); }
    const s = sum[id]; s[0] += m.pos[i]; s[1] += m.pos[i + 1]; s[2] += m.pos[i + 2]; s[3]++; remap[i / 3] = id;
  }
  const o = newMesh(); for (const s of sum) o.pos.push(s[0] / s[3], s[1] / s[3], s[2] / s[3]);
  const seen = new Set();
  for (let i = 0; i < m.idx.length; i += 3) { const a = remap[m.idx[i]], b = remap[m.idx[i + 1]], c = remap[m.idx[i + 2]]; if (a === b || b === c || a === c) continue; const k = [a, b, c].sort((x, y) => x - y).join(','); if (seen.has(k)) continue; seen.add(k); o.idx.push(a, b, c); }
  return o;
}
// Mesh health: edge manifoldness, Euler characteristic, degenerate triangles, signed volume.
export function stats(m) {
  const nv = m.pos.length / 3, nf = m.idx.length / 3, edges = new Map();
  for (let i = 0; i < m.idx.length; i += 3) for (let e = 0; e < 3; e++) { const a = m.idx[i + e], b = m.idx[i + (e + 1) % 3], k = a < b ? a * nv + b : b * nv + a, ent = edges.get(k) || [0, 0]; ent[a < b ? 0 : 1]++; edges.set(k, ent); }
  let open = 0, nonManifold = 0, inconsistent = 0;
  for (const [, [f, r]] of edges) { if (f + r === 1) open++; else if (f + r > 2) nonManifold++; else if (f !== 1 || r !== 1) inconsistent++; }
  let used = new Set(m.idx).size;
  let degenerate = 0; for (let i = 0; i < m.idx.length; i += 3) if (triArea(m.pos, m.idx[i], m.idx[i + 1], m.idx[i + 2]) < 1e-14) degenerate++;
  return { verts: nv, usedVerts: used, tris: nf, edges: edges.size, euler: used - edges.size + nf, open, nonManifold, inconsistent, degenerate, volume: signedVolume(m), area: area(m), closed: open === 0 && nonManifold === 0 && inconsistent === 0 };
}

// Area-weighted vertex normals (unit), flat array.
export function vertexNormals(m) {
  const n = new Float64Array(m.pos.length), p = m.pos;
  for (let i = 0; i < m.idx.length; i += 3) { const a = m.idx[i] * 3, b = m.idx[i + 1] * 3, c = m.idx[i + 2] * 3, ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2], x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx; for (const k of [a, b, c]) { n[k] += x; n[k + 1] += y; n[k + 2] += z; } }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return Array.from(n);
}
// Bake a per-vertex brightness (0..1) into m.shade: fn(position, normal) -> number. Multiplies the part colour at runtime (ambient occlusion, staining, tone).
export function bakeShade(m, fn) { const nr = vertexNormals(m); m.shade = []; for (let i = 0; i < m.pos.length; i += 3) m.shade.push(Math.max(0, Math.min(1, fn([m.pos[i], m.pos[i + 1], m.pos[i + 2]], [nr[i], nr[i + 1], nr[i + 2]])))); return m; }
