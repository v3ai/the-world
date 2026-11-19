'use strict';
/* =====================================================================
   Mesh worker: fetches and decodes the anatomy files and the things' mesh bundles off the main thread, so the first seconds of
   the page do not stall on JSON parsing, int16 unpacking and vertex normals. A classic worker (no modules, no imports).

   Request  { id, op: 'anatomy', url }            -> { id, ok, parts: [ {...fields of the part except pos and idx, dec} ] }
   Request  { id, op: 'thing', json, bin }        -> { id, ok, json (mesh.json, without the decoded arrays), buf (mesh.bin, handed back), meshes: { key: dec } }
   dec = { pos: Float32Array, idx: Uint16Array | Uint32Array, nrm: Float32Array, bs: [x, y, z, r] }   (all transferred, not copied)
   On failure: { id, ok: false, error }, and the page decodes on the main thread as it always did (js/nodes.js, js/things.js).

   The numbers are the same as the main-thread path produces: positions are unpacked with the same arithmetic, normals are the
   area-weighted vertex normals of BufferGeometry.computeVertexNormals (accumulated in float32, as three does), and the bounding
   sphere is the centre of the bounding box with the largest distance to a vertex, as BufferGeometry.computeBoundingSphere.
   ===================================================================== */
function vertexNormals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const cbx = pos[c] - pos[b], cby = pos[c + 1] - pos[b + 1], cbz = pos[c + 2] - pos[b + 2], abx = pos[a] - pos[b], aby = pos[a + 1] - pos[b + 1], abz = pos[a + 2] - pos[b + 2];
    const x = cby * abz - cbz * aby, y = cbz * abx - cbx * abz, z = cbx * aby - cby * abx;
    n[a] += x; n[a + 1] += y; n[a + 2] += z; n[b] += x; n[b + 1] += y; n[b + 2] += z; n[c] += x; n[c + 1] += y; n[c + 2] += z;
  }
  for (let i = 0; i < n.length; i += 3) { const x = n[i], y = n[i + 1], z = n[i + 2], l = Math.sqrt(x * x + y * y + z * z) || 1; n[i] = x / l; n[i + 1] = y / l; n[i + 2] = z / l; }
  return n;
}
function boundingSphere(pos) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < pos.length; i += 3) { const x = pos[i], y = pos[i + 1], z = pos[i + 2]; if (x < x0) x0 = x; if (y < y0) y0 = y; if (z < z0) z0 = z; if (x > x1) x1 = x; if (y > y1) y1 = y; if (z > z1) z1 = z; }
  const cx = (x0 + x1) * .5, cy = (y0 + y1) * .5, cz = (z0 + z1) * .5; let r2 = 0;
  for (let i = 0; i < pos.length; i += 3) { const dx = pos[i] - cx, dy = pos[i + 1] - cy, dz = pos[i + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
  return [cx, cy, cz, Math.sqrt(r2)];
}
function finish(pos, idx, out) { const nrm = vertexNormals(pos, idx), d = { pos, idx, nrm, bs: boundingSphere(pos) }; out.push(pos.buffer, idx.buffer, nrm.buffer); return d; }
/* format 1 (anatomy, and old thing bundles): integer positions with a scale and an offset, a plain index list */
function decodeJSONPart(p, out) {
  const n = p.pos.length / 3, pos = new Float32Array(p.pos.length), s = p.scale, o = p.offset;
  for (let i = 0; i < n; i++) { pos[i * 3] = p.pos[i * 3] * s[0] + o[0]; pos[i * 3 + 1] = p.pos[i * 3 + 1] * s[1] + o[1]; pos[i * 3 + 2] = p.pos[i * 3 + 2] * s[2] + o[2]; }
  return finish(pos, p.idx.length > 65535 ? Uint32Array.from(p.idx) : Uint16Array.from(p.idx), out);
}
/* format 2 (things): int16 positions, delta / zigzag / varint triangle indices, in one binary file */
function decodeV2(buf, q, out) {
  const p16 = new Int16Array(buf, q.pos[0], q.nv * 3), pos = new Float32Array(q.nv * 3), s = q.scale, o = q.offset;
  for (let i = 0; i < q.nv; i++) { pos[i * 3] = p16[i * 3] * s[0] + o[0]; pos[i * 3 + 1] = p16[i * 3 + 1] * s[1] + o[1]; pos[i * 3 + 2] = p16[i * 3 + 2] * s[2] + o[2]; }
  const bytes = new Uint8Array(buf, q.idx[0], q.idx[1]), idx = q.nv > 65535 ? new Uint32Array(q.ni) : new Uint16Array(q.ni); let b = 0, prev = 0;
  for (let i = 0; i < q.ni; i++) { let z = 0, m = 1, c; do { c = bytes[b++]; z += (c & 127) * m; m *= 128; } while (c & 128); prev += (z & 1) ? -((z + 1) / 2) : z / 2; idx[i] = prev; }
  return finish(pos, idx, out);
}
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }
onmessage = async e => {
  const m = e.data, out = [];
  try {
    if (m.op === 'anatomy') {
      const S = await getJSON(m.url), parts = S.parts.map(p => { const dec = decodeJSONPart(p, out), q = {}; for (const k in p) if (k !== 'pos' && k !== 'idx') q[k] = p[k]; q.dec = dec; return q; });
      postMessage({ id: m.id, ok: true, parts }, out);
    } else if (m.op === 'thing') {
      const j = await getJSON(m.json), meshes = {}; let buf = null;
      if (j.format === 2) { const r = await fetch(m.bin.replace(/[^/]*$/, j.bin)); if (!r.ok) throw new Error(j.bin + ' ' + r.status); buf = await r.arrayBuffer(); for (const k in j.meshes) meshes[k] = decodeV2(buf, j.meshes[k], out); out.push(buf); }
      else for (const k in j.meshes) { meshes[k] = decodeJSONPart(j.meshes[k], out); const q = j.meshes[k]; j.meshes[k] = Object.assign({}, q, { pos: null, idx: null }); }
      postMessage({ id: m.id, ok: true, json: j, buf, meshes }, out);
    } else throw new Error('unknown op ' + m.op);
  } catch (err) { postMessage({ id: m.id, ok: false, error: String(err && err.message || err) }); }
};
