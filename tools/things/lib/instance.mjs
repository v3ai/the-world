// Instances: one small mesh plus many transforms. A transform is { p:[x,y,z], q:[x,y,z,w] (optional), s: uniform scale or [sx,sy,sz] }.
// Baked as a flat float array, 8 numbers per instance: x y z qx qy qz qw s (uniform scale) — or 10 with per-axis scale.
export class Instances {
  constructor(meshKey) { this.mesh = meshKey; this.list = []; }
  add(p, q = [0, 0, 0, 1], s = 1) { this.list.push({ p, q, s }); return this; }
  get count() { return this.list.length; }
  flat() { const aniso = this.list.some(t => Array.isArray(t.s)), stride = aniso ? 10 : 8, a = []; for (const t of this.list) { a.push(...t.p.map(r4), ...t.q.map(r4)); if (aniso) a.push(...(Array.isArray(t.s) ? t.s : [t.s, t.s, t.s]).map(r4)); else a.push(r4(t.s)); } return { stride, data: a }; }
}
const r4 = v => Math.round(v * 1e5) / 1e5;
