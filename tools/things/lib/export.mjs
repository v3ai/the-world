// Baking: Mesh -> the compact part format used by data/anatomy (int16 positions with scale/offset, indices), plus instance lists.
import { bounds } from './mesh.mjs';

export function quantize(m) {
  const b = bounds(m), off = [0, 1, 2].map(a => (b.min[a] + b.max[a]) / 2), sc = [0, 1, 2].map(a => Math.max((b.max[a] - b.min[a]) / 2, 1e-9) / 32767);
  const pos = new Array(m.pos.length);
  for (let i = 0; i < m.pos.length; i += 3) for (let a = 0; a < 3; a++) pos[i + a] = Math.max(-32767, Math.min(32767, Math.round((m.pos[i + a] - off[a]) / sc[a])));
  const q = { scale: sc.map(v => +v.toPrecision(9)), offset: off.map(v => +v.toPrecision(9)), pos, idx: m.idx.slice() };
  if (m.shade) q.shade = m.shade.map(v => Math.round(v * 255));   // per-vertex brightness 0..255
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
  const { thing, meshes = {}, instances = {} } = model, out = JSON.parse(JSON.stringify(thing)), problems = [];
  const mj = { format: 1, meshes: {}, instances: {} };
  for (const [k, m] of Object.entries(meshes)) mj.meshes[k] = quantize(m);
  for (const [k, inst] of Object.entries(instances)) { if (!meshes[inst.mesh]) problems.push(`instances ${k} uses unknown mesh ${inst.mesh}`); const f = inst.flat(); mj.instances[k] = { mesh: inst.mesh, stride: f.stride, n: inst.count, t: f.data }; }
  let tris = 0;
  const tc = new Set();
  for (const p of out.parts) {
    if (p.mesh) { const m = meshes[p.mesh]; if (!m) { problems.push(`part ${p.id}: unknown mesh ${p.mesh}`); continue; } Object.assign(p, centerRadius(m)); p.tris = m.idx.length / 3; if (!tc.has(p.mesh)) { tc.add(p.mesh); tris += p.tris; } }
    else if (p.instances) { const inst = instances[p.instances]; if (!inst) { problems.push(`part ${p.id}: unknown instances ${p.instances}`); continue; } Object.assign(p, instancedCenterRadius(meshes[inst.mesh], inst)); p.count = inst.count; p.tris = meshes[inst.mesh].idx.length / 3 * inst.count; }
    else problems.push(`part ${p.id}: needs mesh or instances`);
  }
  out.stats = { parts: out.parts.length, uniqueMeshTris: tris, nearTris: out.parts.filter(p => p.lod !== 'far').reduce((s, p) => s + (p.tris || 0), 0), farTris: out.parts.filter(p => p.lod === 'far' || !p.lod).reduce((s, p) => s + (p.tris || 0), 0) };
  const syss = new Set(out.systems.map(s => s.id));
  for (const p of out.parts) { if (!syss.has(p.system)) problems.push(`part ${p.id}: system ${p.system} not declared`); if (!p.node) problems.push(`part ${p.id}: no node`); if (!p.name) problems.push(`part ${p.id}: no name`); }
  for (const md of out.modes || []) for (const s of Object.keys(md.show || {})) if (s !== '*' && !syss.has(s)) problems.push(`mode ${md.id}: unknown system ${s}`);
  return { thing: out, mesh: mj, problems };
}
