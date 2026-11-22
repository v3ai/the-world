// Baking: Mesh -> the compact part format used by data/anatomy (int16 positions with scale/offset, indices), plus instance lists.
import { bounds } from './mesh.mjs';
import { applyKinds, applyFaceLooks } from './kinds.mjs';

export function quantize(m) {
  const b = bounds(m), off = [0, 1, 2].map(a => (b.min[a] + b.max[a]) / 2), sc = [0, 1, 2].map(a => Math.max((b.max[a] - b.min[a]) / 2, 1e-9) / 32767);
  const pos = new Array(m.pos.length);
  for (let i = 0; i < m.pos.length; i += 3) for (let a = 0; a < 3; a++) pos[i + a] = Math.max(-32767, Math.min(32767, Math.round((m.pos[i + a] - off[a]) / sc[a])));
  const q = { scale: sc.map(v => +v.toPrecision(9)), offset: off.map(v => +v.toPrecision(9)), pos, idx: m.idx.slice() };
  if (m.shade) q.shade = m.shade.map(v => Math.round(v * 255));   // per-vertex brightness 0..255
  if (m.ao) q.ao = Array.from(m.ao);   // ambient occlusion, 4 bits a vertex (ao.mjs)
  return q;
}
export function dequantize(q) { const p = new Array(q.pos.length); for (let i = 0; i < p.length; i += 3) for (let a = 0; a < 3; a++) p[i + a] = q.pos[i + a] * q.scale[a] + q.offset[a]; return { pos: p, idx: q.idx.slice() }; }
export function centerRadius(m) { const b = bounds(m), c = [0, 1, 2].map(a => (b.min[a] + b.max[a]) / 2); let r = 0; for (let i = 0; i < m.pos.length; i += 3) r = Math.max(r, Math.hypot(m.pos[i] - c[0], m.pos[i + 1] - c[1], m.pos[i + 2] - c[2])); return { center: c.map(round3), radius: round3(r) }; }
const round3 = v => Math.round(v * 1e4) / 1e4;

// Bounding sphere of an instanced part: all instance copies of the base mesh.
export function instancedCenterRadius(mesh, inst) {
  const f = inst.flat(), s = f.stride, pts = [], mr = centerRadius(mesh);
  for (let i = 0; i < f.data.length; i += s) pts.push({ p: f.data.slice(i, i + 3), r: mr.radius * (s === 8 ? f.data[i + 7] : Math.max(f.data[i + 7], f.data[i + 8], f.data[i + 9])) });
  const c = [0, 1, 2].map(a => pts.reduce((v, q) => v + q.p[a], 0) / pts.length); let r = 0;
  for (const q of pts) r = Math.max(r, Math.hypot(q.p[0] - c[0], q.p[1] - c[1], q.p[2] - c[2]) + q.r);
  return { center: c.map(round3), radius: round3(r) };
}
// Assemble the files for one thing. model = { thing, meshes: {key: Mesh}, instances: {key: Instances} }.
export function assemble(model) {
  const { thing, meshes = {}, instances = {}, flows = {} } = model, out = JSON.parse(JSON.stringify(thing)), problems = [];
  const mj = { format: 1, meshes: {}, instances: {} };
  for (const [k, m] of Object.entries(meshes)) mj.meshes[k] = quantize(m);
  for (const [k, inst] of Object.entries(instances)) { if (!meshes[inst.mesh]) problems.push(`instances ${k} uses unknown mesh ${inst.mesh}`); const f = inst.flat(); mj.instances[k] = { mesh: inst.mesh, stride: f.stride, n: inst.count, t: f.data }; if (inst.ao) mj.instances[k].ao = Array.from(inst.ao); }
  mj.flows = flows;
  let tris = 0;
  const tc = new Set();
  for (const p of out.parts) {
    if (p.mesh) { const m = meshes[p.mesh]; if (!m) { problems.push(`part ${p.id}: unknown mesh ${p.mesh}`); continue; } Object.assign(p, centerRadius(m)); p.tris = m.idx.length / 3; if (!tc.has(p.mesh)) { tc.add(p.mesh); tris += p.tris; } }
    else if (p.instances) { const inst = instances[p.instances]; if (!inst) { problems.push(`part ${p.id}: unknown instances ${p.instances}`); continue; } Object.assign(p, instancedCenterRadius(meshes[inst.mesh], inst)); p.count = inst.count; p.tris = meshes[inst.mesh].idx.length / 3 * inst.count; }
    else if (p.flow) {   // a flow part has no mesh: its centre and radius are those of the box that holds its paths (a flow with no paths keeps the old stand-in)
      const fl = flows[p.flow]; if (!fl) problems.push(`part ${p.id}: unknown flow ${p.flow}`); p.center = [0, 8, 0]; p.radius = 10; p.tris = 0;
      if (fl && fl.paths && fl.paths.length) { const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (const P of fl.paths) for (let i = 0; i < P.p.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P.p[i + a]); hi[a] = Math.max(hi[a], P.p[i + a]); } p.center = [0, 1, 2].map(a => +((lo[a] + hi[a]) / 2).toFixed(6)); p.radius = +(Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2).toFixed(6); }
    }
    else problems.push(`part ${p.id}: needs mesh or instances`);
  }
  const m0 = ((out.modes || [])[0] || {}).show || {}, inTier = (p, n) => (m0[p.system] > 0 || m0['*'] > 0) && (!p.lod || p.lod.split('+').includes(n) || (n === 'mid' && !out.parts.some(q => q.lod && q.lod.includes('mid')) && p.lod.split('+').includes('far')));
  const sumTier = n => out.parts.filter(p => inTier(p, n)).reduce((s, p) => s + (p.tris || 0), 0);
  out.stats = { parts: out.parts.length, uniqueMeshTris: tris, nearTris: sumTier('near'), midTris: sumTier('mid'), farTris: sumTier('far') };
  problems.push(...applyKinds(out), ...applyFaceLooks(out));   // every part and every cut face names what it is made of (kinds.mjs)
  const syss = new Set(out.systems.map(s => s.id));
  for (const p of out.parts) { if (!syss.has(p.system)) problems.push(`part ${p.id}: system ${p.system} not declared`); if (!p.node) problems.push(`part ${p.id}: no node`); if (!p.name) problems.push(`part ${p.id}: no name`); }
  for (const md of out.modes || []) for (const s of Object.keys(md.show || {})) if (s !== '*' && !syss.has(s)) problems.push(`mode ${md.id}: unknown system ${s}`);
  return { thing: out, mesh: mj, problems };
}

/* ---------------------------------------------------------------------------------------------------------------
   Format 2 (compact binary): mesh.json holds only the index (offsets, scales, flows); mesh.bin holds the numbers.
   Per mesh:      pos   Int16 x3 per vertex (position = pos * scale + offset), 4-byte aligned
                  idx   triangle indices, delta from the previous index, zigzag, LEB128 varint (about 1.2 bytes per index)
                  shade Uint8 per vertex (optional)
                  ao    ambient occlusion, 4 bits per vertex, two a byte, low nibble first (optional; ao.mjs); also per instance
   Per instances: p Int16 x3 per instance (min + p * pscale per axis), q Int16 x4 (quaternion x y z w, / 32767), s Float32 x1 or x3 (stride 8 or 10)
   Everything is little-endian. Loader: js/things.js (thLoadBundle, thGeo, thInstT). */
export function pack(mj) {
  const chunks = []; let size = 0;
  const put = (u8) => { const off = size, pad = (4 - (u8.length % 4)) % 4; chunks.push(u8); if (pad) chunks.push(new Uint8Array(pad)); size += u8.length + pad; return [off, u8.length]; };
  const out = { format: 2, bin: 'mesh.bin', meshes: {}, instances: {}, flows: mj.flows || {} };
  for (const [k, q] of Object.entries(mj.meshes)) {
    const nv = q.pos.length / 3, ni = q.idx.length, pos = new Int16Array(q.pos), vb = [];
    let prev = 0; for (let i = 0; i < ni; i++) { let d = q.idx[i] - prev; prev = q.idx[i]; let z = d < 0 ? (-d * 2 - 1) : d * 2; while (z >= 128) { vb.push((z & 127) | 128); z = Math.floor(z / 128); } vb.push(z); }
    const e = { scale: q.scale, offset: q.offset, nv, ni, pos: put(new Uint8Array(pos.buffer)), idx: put(Uint8Array.from(vb)) };
    if (q.shade) e.shade = put(Uint8Array.from(q.shade));
    if (q.ao) e.ao = put(Uint8Array.from(q.ao));   // 4 bits a vertex, low nibble first
    out.meshes[k] = e;
  }
  for (const [k, I] of Object.entries(mj.instances)) {
    const st = I.stride, n = I.n, t = I.t, mn = [1e30, 1e30, 1e30], mx = [-1e30, -1e30, -1e30];
    for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], t[i * st + a]); mx[a] = Math.max(mx[a], t[i * st + a]); }
    const ps = [0, 1, 2].map(a => Math.max(mx[a] - mn[a], 1e-9) / 65535), P = new Uint16Array(n * 3), Q = new Int16Array(n * 4), S = new Float32Array(n * (st - 7));
    for (let i = 0; i < n; i++) {
      for (let a = 0; a < 3; a++) P[i * 3 + a] = Math.round((t[i * st + a] - mn[a]) / ps[a]);
      let qq = t.slice(i * st + 3, i * st + 7); const l = Math.hypot(...qq) || 1; qq = qq.map(v => v / l);
      for (let a = 0; a < 4; a++) Q[i * 4 + a] = Math.round(qq[a] * 32767);
      for (let a = 0; a < st - 7; a++) S[i * (st - 7) + a] = t[i * st + 7 + a];
    }
    out.instances[k] = { mesh: I.mesh, stride: st, n, min: mn.map(v => +v.toPrecision(9)), pscale: ps.map(v => +v.toPrecision(9)), p: put(new Uint8Array(P.buffer)), q: put(new Uint8Array(Q.buffer)), s: put(new Uint8Array(S.buffer)) };
    if (I.ao) out.instances[k].ao = put(Uint8Array.from(I.ao));   // 4 bits an instance
  }
  return { json: out, bin: Buffer.concat(chunks.map(c => Buffer.from(c.buffer, c.byteOffset, c.length))) };
}
