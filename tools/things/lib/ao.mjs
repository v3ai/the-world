// Ambient occlusion baked per vertex (and per instance), for the realistic look (?look=2): how much of the sky a point of the model can
// see, from rays cast over the hemisphere above its surface. js/things.js multiplies it into the light that comes from the sky and the
// ground (the environment) only, never into the Sun's: the Sun's shadow is drawn by the shadow map. No dependencies, deterministic.
//
// Stored as 4 bits a value (16 levels, two values a byte) to keep each thing under its 3 MB budget; light from the environment changes
// slowly over a surface, and the steps of a sixteenth are smoothed by the interpolation between vertices.
import { vertexNormals } from './mesh.mjs';

/* ---------- a bounding-volume tree over triangles (median split) ---------- */
export function buildBVH(tri, cov) {   // tri: Float64Array, 9 numbers a triangle; cov: what a hit on each triangle counts for (default 1)
  const n = tri.length / 9, ids = new Int32Array(n), cen = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) { ids[i] = i; for (let a = 0; a < 3; a++) cen[i * 3 + a] = (tri[i * 9 + a] + tri[i * 9 + 3 + a] + tri[i * 9 + 6 + a]) / 3; }
  const nodes = [];   // {lo, hi, l, r, s, e}
  function box(s, e) { const lo = [1e30, 1e30, 1e30], hi = [-1e30, -1e30, -1e30]; for (let k = s; k < e; k++) { const t = ids[k] * 9; for (let v = 0; v < 3; v++) for (let a = 0; a < 3; a++) { const x = tri[t + v * 3 + a]; if (x < lo[a]) lo[a] = x; if (x > hi[a]) hi[a] = x; } } return [lo, hi]; }
  function make(s, e) {
    const [lo, hi] = box(s, e), node = { lo, hi, s, e, l: -1, r: -1 }, me = nodes.length; nodes.push(node);
    if (e - s <= 4) return me;
    const ax = [0, 1, 2].reduce((b, a) => hi[a] - lo[a] > hi[b] - lo[b] ? a : b, 0), mid = (s + e) >> 1;
    const sub = Array.from(ids.subarray(s, e)).sort((p, q) => cen[p * 3 + ax] - cen[q * 3 + ax]); ids.set(sub, s);
    node.l = make(s, mid); node.r = make(mid, e); return me;
  }
  if (n) make(0, n);
  return { tri, ids, nodes, cov: cov || null, hitCover: 1 };
}
/* is anything hit within `far` along the ray? returns the nearest t, or Infinity */
export function rayHit(B, o, d, far) {
  const { tri, ids, nodes } = B; if (!nodes.length) return Infinity;
  const inv = [1 / d[0], 1 / d[1], 1 / d[2]], stack = [0]; let best = far, bi = -1;
  while (stack.length) {
    const nd = nodes[stack.pop()]; let t0 = 0, t1 = best;
    for (let a = 0; a < 3; a++) { let ta = (nd.lo[a] - o[a]) * inv[a], tb = (nd.hi[a] - o[a]) * inv[a]; if (ta > tb) { const x = ta; ta = tb; tb = x; } if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) break; }
    if (t0 > t1) continue;
    if (nd.l < 0) {
      for (let k = nd.s; k < nd.e; k++) {   // Moller-Trumbore
        const t = ids[k] * 9, e1x = tri[t + 3] - tri[t], e1y = tri[t + 4] - tri[t + 1], e1z = tri[t + 5] - tri[t + 2], e2x = tri[t + 6] - tri[t], e2y = tri[t + 7] - tri[t + 1], e2z = tri[t + 8] - tri[t + 2];
        const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x, det = e1x * px + e1y * py + e1z * pz; if (det > -1e-14 && det < 1e-14) continue;
        const id = 1 / det, sx = o[0] - tri[t], sy = o[1] - tri[t + 1], sz = o[2] - tri[t + 2], u = (sx * px + sy * py + sz * pz) * id; if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = (d[0] * qx + d[1] * qy + d[2] * qz) * id; if (v < 0 || u + v > 1) continue;
        const tt = (e2x * qx + e2y * qy + e2z * qz) * id; if (tt > 1e-9 && tt < best) { best = tt; bi = ids[k]; }
      }
    } else stack.push(nd.l, nd.r);
  }
  B.hitCover = bi >= 0 && B.cov ? B.cov[bi] : 1;
  return best;
}
/* triangles of meshes (and of instances of a mesh: inst = { mesh, flat: {stride, data} }), in the thing's own coordinates */
export function trianglesOf(meshes, insts = []) {
  let n = 0; for (const m of meshes) n += m.idx.length / 3; for (const I of insts) n += I.mesh.idx.length / 3 * (I.flat.data.length / I.flat.stride);
  const T = new Float64Array(n * 9); let w = 0;
  for (const m of meshes) for (let i = 0; i < m.idx.length; i++) { const v = m.idx[i] * 3; T[w++] = m.pos[v]; T[w++] = m.pos[v + 1]; T[w++] = m.pos[v + 2]; }
  for (const I of insts) {
    const { stride, data } = I.flat, m = I.mesh;
    for (let k = 0; k < data.length; k += stride) {
      const p = data.slice(k, k + 3), q = data.slice(k + 3, k + 7), s = stride === 8 ? [data[k + 7], data[k + 7], data[k + 7]] : data.slice(k + 7, k + 10);
      for (let i = 0; i < m.idx.length; i++) { const v = m.idx[i] * 3, r = rotq(q, [m.pos[v] * s[0], m.pos[v + 1] * s[1], m.pos[v + 2] * s[2]]); T[w++] = r[0] + p[0]; T[w++] = r[1] + p[1]; T[w++] = r[2] + p[2]; }
    }
  }
  const C = new Float32Array(n).fill(1); let c = 0; for (const m of meshes) c += m.idx.length / 3; for (const I of insts) { const k = I.mesh.idx.length / 3 * (I.flat.data.length / I.flat.stride); C.fill(I.cover ?? 1, c, c + k); c += k; }
  return { T, C };
}
export function rotq(q, v) { const [x, y, z, w] = q, ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2]; return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]; }

/* cosine-weighted directions over the hemisphere round n: a fixed spiral (Hammersley), turned by a per-point angle so that neighbours do not band */
function hemi(n, k, N, rot) {
  const u = (k + .5) / N, phi = 2.399963229728653 * k + rot, r = Math.sqrt(u), x = r * Math.cos(phi), y = r * Math.sin(phi), z = Math.sqrt(Math.max(0, 1 - u));
  const a = Math.abs(n[0]) < .9 ? [1, 0, 0] : [0, 1, 0], t = norm(cross(a, n)), b = cross(n, t);
  return [t[0] * x + b[0] * y + n[0] * z, t[1] * x + b[1] * y + n[1] * z, t[2] * x + b[2] * y + n[2] * z];
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/* visibility (1 = open sky, 0 = closed) of points p with normals n against a tree, plus an optional ground plane y = ground.
   A hit at distance t closes (1 - t/dist)^2 of its ray (near things shade more); `cover` scales what a hit counts for (a leaf card is
   only partly leaf). */
export function occlusion(B, pts, nrm, { rays = 24, dist = 1, ground = null, cover = 1, eps = 1e-4 } = {}) {   // cover: a factor on every hit (the triangle's own cover applies too)
  const out = new Float32Array(pts.length / 3), o = [0, 0, 0];
  for (let i = 0; i < out.length; i++) {
    const n = [nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]], rot = (i * 0.618034 % 1) * 6.283185307;
    o[0] = pts[i * 3] + n[0] * eps; o[1] = pts[i * 3 + 1] + n[1] * eps; o[2] = pts[i * 3 + 2] + n[2] * eps;
    let occ = 0;
    for (let k = 0; k < rays; k++) {
      const d = hemi(n, k, rays, rot); let t = rayHit(B, o, d, dist), c = cover * B.hitCover;
      if (ground !== null && d[1] < -1e-6) { const tg = (ground - o[1]) / d[1]; if (tg > 0 && tg < t) { t = tg; c = 1; } }
      if (t < dist) { const f = 1 - t / dist; occ += c * f * f; }
    }
    out[i] = 1 - occ / rays;
  }
  return out;
}
/* per vertex of a mesh */
export function vertexAO(mesh, B, opts) { return occlusion(B, mesh.pos, vertexNormals(mesh), opts); }
/* per instance: from its centre, over the hemisphere round `up` (a leaf: how deep in the crown it hangs) */
export function instanceAO(flat, B, up, opts) {
  const n = flat.data.length / flat.stride, P = new Float64Array(n * 3), N = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) { for (let a = 0; a < 3; a++) { P[i * 3 + a] = flat.data[i * flat.stride + a]; N[i * 3 + a] = up[a]; } }
  return occlusion(B, P, N, Object.assign({ eps: .02 }, opts));
}
/* 4 bits a value, two a byte (low nibble first) */
export function pack4(v) { const b = new Uint8Array(Math.ceil(v.length / 2)); for (let i = 0; i < v.length; i++) { const q = Math.max(0, Math.min(15, Math.round(v[i] * 15))); b[i >> 1] |= i & 1 ? q << 4 : q; } return b; }

/* What is baked for each thing, in groups: a group's `meshes` take a value per vertex, its `instances` one per instance (over the
   hemisphere round `up`), all against the group's occluders: the meshes (`occluders`) and instance sets (`occInst`: [key, cover], a leaf
   card being only partly leaf) drawn with them in the same detail tier, and the ground (y = 0) where the thing stands on one.
   `dist`: how far a ray looks, about the size of the hollows that matter (the crown over the trunk, under the dog's chin, the cap over the stem). */
export const AO_OF = {
  oak: [
    { meshes: ['trunk', 'branches'], instances: ['leaves'], up: [0, 1, 0], occluders: ['trunk', 'branches', 'twigs'], occInst: [['leaves', .5]], ground: 0, dist: 6, rays: 24, instRays: 16 },
    { meshes: ['mid_trunk', 'mid_limbs'], instances: ['tufts'], up: [0, 1, 0], occluders: ['mid_trunk', 'mid_limbs'], occInst: [['tufts', .45]], ground: 0, dist: 6, rays: 24, instRays: 16 },
  ],
  dog: [{ meshes: ['coat', 'ears', 'paw_pads', 'nose'], occluders: ['coat', 'ears'], ground: 0, dist: .25, rays: 24 }, { meshes: ['coat_mid'], occluders: ['coat_mid', 'ears'], ground: 0, dist: .25, rays: 24 }],
  mushroom: [{ meshes: ['cap', 'cap_under', 'gills', 'stipe', 'ring', 'bulb'], occluders: ['cap', 'cap_under', 'gills', 'stipe', 'ring', 'bulb'], ground: 0, dist: .06, rays: 24 }],
  robin: [{ meshes: ['r_belly', 'r_flank', 'r_breast', 'r_rump', 'r_vent', 'r_grey', 'r_back', 'r_nape', 'r_face', 'r_crown', 'bill_up', 'bill_lo', 'leg_shin', 'leg_ankle', 'leg_tarsus', 'leg_toes', 'leg_hallux'],
    occluders: ['r_belly', 'r_flank', 'r_breast', 'r_rump', 'r_vent', 'r_grey', 'r_back', 'r_nape', 'r_face', 'r_crown', 'bill_up', 'bill_lo'], ground: 0, dist: .03, rays: 24 }],
  flower: [{ meshes: ['basal_leaves', 'stem_leaves', 'stems', 'petioles'], occluders: ['basal_leaves', 'stem_leaves', 'stems', 'petioles'], ground: 0, dist: .06, rays: 24 }],
  boulder: [{ meshes: ['rock', 'moss'], occluders: ['rock', 'moss'], ground: 0, dist: .5, rays: 24 }],
  grass: [{ meshes: ['blade_up', 'blade_down', 'sheaths'], occluders: ['blade_up', 'blade_down', 'sheaths'], ground: 0, dist: .05, rays: 16 }],
};
/* bake: adds `ao` (packed bytes) to the named meshes and instance sets of a built model; returns a line for the log */
export function bakeAO(id, built) {
  const G = AO_OF[id]; if (!G) return '';
  const t0 = Date.now(), M = built.meshes, I = built.instances || {}; let nv = 0, ni = 0, nt = 0;
  for (const S of G) {
    const insts = (S.occInst || []).map(([k, cover]) => ({ mesh: M[I[k].mesh], flat: I[k].flat(), cover }));
    const tc = trianglesOf(S.occluders.map(k => M[k]), insts), B = buildBVH(tc.T, tc.C); nt += tc.C.length;
    for (const k of S.meshes) { const m = M[k]; m.ao = pack4(vertexAO(m, B, { rays: S.rays, dist: S.dist, ground: S.ground })); nv += m.pos.length / 3; }
    for (const k of S.instances || []) { const inst = I[k]; inst.ao = pack4(instanceAO(inst.flat(), B, S.up, { rays: S.instRays || 16, dist: S.dist, ground: S.ground })); ni += inst.count; }
  }
  return `ambient occlusion: ${nv} vertices, ${ni} instances, ${nt} occluding triangles, ${Date.now() - t0} ms`;
}
