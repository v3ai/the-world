'use strict';
/* =====================================================================
   CELL TYPES: every kind of cell its own picture, from data.

   A spec file per type, data/cells/<id>.json (the format: docs/CONTENT.md, "A cell type"; the shape vocabulary: data/cells/_shapes.json;
   the list of every type the app reaches and where from: data/cells/_inventory.json), drawn here by generic code inside the cell frame
   (FT.cell, which keeps drawing the generic animal, plant and bacterial cells when a frame carries no spec).

   CELLS.load()                    the inventory and every spec it marks as written (awaited in buildWorld, WORLD_EXT)
   CELLS.has(id)                   is there a spec for this type
   CELLS.specFor(q)                the type a place leads to: q = {tissue: kind, variant, id} | {material} | {scene, structure} | {landmark}
   CELLS.frame(id, T, extra)       a cell frame of that type at T (parent coordinates)
   CELLS.open(id, D)               a test helper: build the cell next to the skin and put the camera in it
   The frame: unit 1 µm, radius and arrival distance from the spec's `view`; it turns its cut face to the camera that made it.
   Every named part is pickable, opens its card (a node, or the spec's own words) and carries the material it is made of, so the
   descent (js/descent.js) goes on from it to molecules and atoms.
   ===================================================================== */
const CELLS = (() => {
  const Z = { S: {}, inv: null, shapes: null, ready: false };
  const UM = 1;   // frame units per micrometre

  /* ---------- loading and lookup ---------- */
  Z.load = () => Z._p || (Z._p = (async () => {
    try {
      const [inv, shp] = await Promise.all([getJSON('data/cells/_inventory.json'), getJSON('data/cells/_shapes.json')]);
      Z.inv = inv; Z.shapes = shp.shapes || {};
      const ids = (inv.types || []).filter(t => t.spec).map(t => t.id);
      await Promise.all(ids.map(id => getJSON('data/cells/' + id + '.json').then(s => { Z.S[id] = s; }).catch(e => console.error('cells: spec missing', id, e))));
      Z.ready = true;
    } catch (e) { console.error('cells: inventory missing', e); }
  })());
  Z.has = id => !!(id && Z.S[id]);
  Z.specFor = q => {
    if (!q) return null;
    for (const id in Z.S) {
      const r = Z.S[id].reached || {};
      if (q.tissue && (r.tissue || []).some(t => t.kind === q.tissue && t.id === q.id && (t.variant || null) === (q.variant || null) && (!t.organ || new RegExp(t.organ).test(q.organ || '')))) return id;
      if (q.material && (r.materials || []).includes(q.material)) return id;
      if (q.scene && (r.tissue2 || []).some(t => t.scene === q.scene && t.structure === q.structure)) return id;
      if (q.landmark && r.landmark === q.landmark) return id;
    }
    return null;
  };
  Z.frame = (id, T, extra) => {
    const S = Z.S[id], v = S.view || {};
    const f = new Frame({ type: 'cell', name: S.name, unit: 1e-6, radius: v.radius_um || 16, r1: v.r1_m || 2.5e-4, pos: T.clone(), opts: Object.assign({ type: 'animal', spec: id, cname: S.name }, extra || {}) });
    f.viewD = v.arrive_m || 4e-5; return f;
  };
  Z.open = (id, D) => {
    const P = FR.skin; P.ensure(); const f = Z.frame(id, new V3(60, -30, 0)); f.dynamic = true; f.keep = performance.now() + 6e5; P.addChild(f);
    jumpTo(f, new V3(), D || f.viewD); return f;
  };

  /* ---------- colours: a code (the spec names the parts whose colour is real) ---------- */
  const PAL = {
    illo: { membrane: 0xf0b9c9, cytosol: 0x3a1a30, nucleus: 0x9a7ee0, chromatin: 0x6c4fb0, nucleolus: 0x4c3290, mito: 0xf08a5e, er: 0x7fb5dc, nissl: 0x6e93e6, golgi: 0xf0c85a,
      lysosome: 0xb7c06e, vesicle: 0xe7d39a, haemoglobin: 0xd8463c, rbc: 0xe0584a, spectrin: 0xf3c9a6, myofibril: 0xe07a7a, sarcoplasm: 0xc86a72, myelin: 0xf4efe2, axon: 0xf2d36b,
      dendrite: 0xf2c46a, soma: 0xf2c46a, spine: 0xf7d98a, bouton: 0xffe08a, keratin: 0xf0d68e, desmosome: 0x9c6b46, melanin: 0x5a3a22, lamellar: 0xcfe7f0, cell: 0xf2c7a8, neighbour: 0xe8c2a8 },
    real: { membrane: 0xd8c9c6, cytosol: 0x2a2d31, nucleus: 0x8e86b5, chromatin: 0x6f6496, nucleolus: 0x5d4d86, mito: 0xcf8a5f, er: 0x8aa2ad, nissl: 0x7d93b8, golgi: 0xc6a55c,
      lysosome: 0xa3a77f, vesicle: 0xd2c7a2, haemoglobin: 0x9c2f2a, rbc: 0xb8433a, spectrin: 0xd9b89a, myofibril: 0xb76b66, sarcoplasm: 0xa45f62, myelin: 0xe9e4d6, axon: 0xcdb48c,
      dendrite: 0xcdb48c, soma: 0xcdb48c, spine: 0xd8c29a, bouton: 0xdcc58e, keratin: 0xd5bd84, desmosome: 0x7d5a40, melanin: 0x4a3222, lamellar: 0xb9cdd3, cell: 0xcdb7a4, neighbour: 0xbfae9e },
  };
  const look = () => (typeof MD !== 'undefined' && MD.on) ? 'real' : 'illo';
  function colourOf(S, role) { const o = S.colours && S.colours.override && S.colours.override[role]; return o !== undefined ? new THREE.Color(o).getHex() : (PAL[look()][role] !== undefined ? PAL[look()][role] : 0xcccccc); }
  /* one material per role and variant; realistic look: the model family's (MD.mat); otherwise a plain lit surface on the dark ground */
  function makeMat(S, role, o = {}) {
    const col = o.color !== undefined ? o.color : colourOf(S, role);
    let m;
    if (look() === 'real') {
      if (o.film) { m = MD.film(col, o.film[0], o.film[1], o.kind || 'wet'); }
      else m = MD.mat(col, o.kind || 'wet', o.extra ? { extra: o.extra } : undefined);
    } else {
      m = new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: o.rough !== undefined ? o.rough : .55, metalness: 0, emissive: new THREE.Color(col).multiplyScalar(o.glow !== undefined ? o.glow : .07) }, o.extra || {}));
      if (o.film) { m.transparent = true; m.opacity = (o.film[0] + o.film[1]) * .5; m.depthWrite = false; }
    }
    if (o.side !== undefined) m.side = o.side;
    m._lkUn = true; return m;
  }
  /* striations of a striated muscle: a colour band by the cell-space x of the fragment (Z line, I band, A band with its H zone and M line), faded
     where a sarcomere is under a few pixels. sar, thick, thin in µm. */
  function striate(m, sar, thick, thin, amt) {
    const key = 'cellsStri' + sar + '_' + thick + '_' + thin + '_' + amt;
    const fn = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vCsX = ( instanceMatrix * vec4( position, 1.0 ) ).x;
      #else
        vCsX = position.x;
      #endif`).replace('void main() {', 'varying float vCsX;\nvoid main() {');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying float vCsX;\nvoid main() {').replace('#include <color_fragment>', `#include <color_fragment>
      { float S = ${sar.toFixed(4)}, s = mod( vCsX, S ), c = abs( s - 0.5 * S );
        float w = fwidth( vCsX ) / S; float vis = 1.0 - smoothstep( 0.08, 0.25, w );
        float aw = 0.5 * ${thick.toFixed(4)}, hz = max( 0.0, 0.5 * S - ${thin.toFixed(4)} );
        float A = 1.0 - smoothstep( aw - 0.03, aw + 0.03, c );
        float H = 1.0 - smoothstep( hz - 0.03, hz + 0.03, c );
        float Mline = 1.0 - smoothstep( 0.02, 0.05, c );
        float Zl = smoothstep( 0.5 * S - 0.05, 0.5 * S - 0.02, c );
        float k = 1.0 - ${amt.toFixed(3)} * ( 0.55 * A - 0.22 * A * H + 0.25 * Mline * A + 0.6 * Zl );
        diffuseColor.rgb *= mix( 1.0 - ${amt.toFixed(3)} * 0.25, k, vis ); }`);
    };
    m.extensions = Object.assign({}, m.extensions || {}, { derivatives: true });
    if (typeof LOOK !== 'undefined' && LOOK.patch) LOOK.patch(m, key, fn); else m.onBeforeCompile = fn;
    m.needsUpdate = true; return m;
  }

  /* ---------- geometry ---------- */
  class GB {   // a growing indexed mesh
    constructor() { this.p = []; this.n = []; this.i = []; }
    get vc() { return this.p.length / 3; }
    v(p, n) { this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); return this.vc - 1; }
    geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setIndex(this.vc > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1)); g.computeBoundingSphere(); return g; }
  }
  const _q = new THREE.Quaternion(), _a = new V3(), _b = new V3();
  /* a tube along points P with radii R (rotation-minimising frames), rounded ends where asked */
  function tube(gb, P, R, sides, cap0, cap1) {
    const n = P.length; if (n < 2) return;
    const T = P.map((p, i) => new V3().subVectors(P[Math.min(i + 1, n - 1)], P[Math.max(i - 1, 0)]).normalize());
    let N = Math.abs(T[0].y) < .9 ? new V3(0, 1, 0) : new V3(1, 0, 0); N.addScaledVector(T[0], -N.dot(T[0])).normalize();
    const base = gb.vc, B = new V3(), d = new V3();
    for (let i = 0; i < n; i++) {
      if (i > 0) { _q.setFromUnitVectors(T[i - 1], T[i]); N.applyQuaternion(_q); }
      B.crossVectors(T[i], N).normalize(); N.crossVectors(B, T[i]).normalize();
      for (let k = 0; k < sides; k++) { const a = k / sides * TAU; d.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a)); gb.v(_a.copy(P[i]).addScaledVector(d, R[i]), d); }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, e = b + sides; gb.i.push(a, b, c, b, e, c); }
    if (cap0) { const ap = gb.v(_a.copy(P[0]).addScaledVector(T[0], -R[0] * .8), _b.copy(T[0]).negate()); for (let k = 0; k < sides; k++) gb.i.push(ap, base + (k + 1) % sides, base + k); }
    if (cap1) { const o = base + (n - 1) * sides, ap = gb.v(_a.copy(P[n - 1]).addScaledVector(T[n - 1], R[n - 1] * .8), T[n - 1]); for (let k = 0; k < sides; k++) gb.i.push(ap, o + k, o + (k + 1) % sides); }
  }
  /* cut a closed mesh by the plane z = 0 (G space): keep z <= 0; the cut face, when asked for, is returned as its own geometry (normal +z) */
  function cutZ(geo, wantCap) {
    const pa = geo.attributes.position, na = geo.attributes.normal, ix = geo.index, P = [], N = [], segs = [];
    const V = i => ({ i, p: new V3().fromBufferAttribute(pa, i), n: na ? new V3().fromBufferAttribute(na, i) : new V3(0, 0, 1) });
    const emit = vs => { for (const v of vs) { P.push(v.p.x, v.p.y, v.p.z); N.push(v.n.x, v.n.y, v.n.z); } };
    const nt = ix ? ix.count / 3 : pa.count / 3;
    for (let t = 0; t < nt; t++) {
      const vs = [0, 1, 2].map(k => V(ix ? ix.getX(t * 3 + k) : t * 3 + k)), inn = vs.map(v => v.p.z <= 0), c = inn.filter(Boolean).length;
      if (c === 3) { emit(vs); continue; } if (c === 0) continue;
      const out = [], cut = [];
      for (let k = 0; k < 3; k++) { const a = vs[k], b = vs[(k + 1) % 3], ia = a.p.z <= 0, ib = b.p.z <= 0; if (ia) out.push(a);
        if (ia !== ib) { const [u, w] = a.i < b.i ? [a, b] : [b, a], s = u.p.z / (u.p.z - w.p.z), v = { p: u.p.clone().lerp(w.p, s), n: u.n.clone().lerp(w.n, s).normalize() }; v.p.z = 0; out.push(v); cut.push(v.p); } }   // the same edge gives the very same point from both its triangles, so the cut's outline closes
      for (let k = 1; k < out.length - 1; k++) emit([out[0], out[k], out[k + 1]]);
      if (cut.length === 2) segs.push(cut);
    }
    const body = new THREE.BufferGeometry(); body.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); body.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    let cap = null;
    if (wantCap && segs.length > 2) {
      const key = p => Math.round(p.x * 2e4) + ',' + Math.round(p.y * 2e4), adj = new Map();
      for (const [a, b] of segs) { const ka = key(a), kb = key(b); if (ka === kb) continue; if (!adj.has(ka)) adj.set(ka, { p: a, to: [] }); if (!adj.has(kb)) adj.set(kb, { p: b, to: [] }); adj.get(ka).to.push(kb); adj.get(kb).to.push(ka); }
      const used = new Set(), cp = [];
      for (const [k0] of adj) {
        if (used.has(k0)) continue; const loop = []; let k = k0, prev = null;
        for (let g = 0; g < 200000; g++) { used.add(k); const e = adj.get(k); loop.push(e.p); const nx = e.to.find(x => x !== prev && !used.has(x)); if (!nx) break; prev = k; k = nx; }
        if (loop.length < 3) continue;
        const c2 = loop.map(p => new THREE.Vector2(p.x, p.y)), tris = THREE.ShapeUtils.triangulateShape(c2, []);
        for (const [i0, i1, i2] of tris) { const a = c2[i0], b = c2[i1], c = c2[i2], z = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); const ord = z >= 0 ? [a, b, c] : [a, c, b]; for (const q of ord) cp.push(q.x, q.y, 0); }
      }
      if (cp.length) { cap = new THREE.BufferGeometry(); cap.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); const cn = new Float32Array(cp.length); for (let i = 2; i < cn.length; i += 3) cn[i] = 1; cap.setAttribute('normal', new THREE.BufferAttribute(cn, 3)); }
    }
    geo.dispose(); return { body, cap };
  }
  /* a unit-sphere mesh whose every vertex direction is moved to r(dir) * dir (star-shaped bodies) */
  function starGeo(rFn, ws, hs) { const g = new THREE.SphereGeometry(1, ws || 48, hs || 32), a = g.attributes.position, d = new V3(); for (let i = 0; i < a.count; i++) { d.fromBufferAttribute(a, i); const r = rFn(d); a.setXYZ(i, d.x * r.x, d.y * r.y, d.z * r.z); } g.computeVertexNormals(); return g; }
  const ellR = (ax, ay, az) => d => new V3(ax, ay, az);   // an ellipsoid: semi-axes

  /* ---------- the build ---------- */
  function newCtx(F, S) {
    const P = Object.assign({}, defaults(S.shape.type), S.shape);
    const G = new THREE.Group(); F.add(G);
    const ctx = { F, S, P, G, r: rng(hash(S.id)), mats: {}, counts: {}, anchors: [], parts: S.parts || {}, inside: () => false, nuclei: [], focus: { pos: new V3(), r: 10 }, near: [], noCut: false };
    ctx.mat = (role, o) => { const k = role + JSON.stringify(o || {}); return ctx.mats[k] || (ctx.mats[k] = makeMat(S, role, o)); };
    /* a pickable part: its card (a node, or the spec's own words), its material for the descent, its priority in a pick */
    ctx.ud = (partId, pri) => {
      const pd = ctx.parts[partId] || {}, node = pd.card && typeof NODE !== 'undefined' && NODE[pd.card] ? pd.card : null;
      const u = { id: 'cell_' + partId, part_: partId, node, priority: pri !== undefined ? pri : 1, material: pd.material || undefined, title: pd.name || partId };
      if (!node || pd.about) u.info = { title: pd.name || partId, tag: pd.tag || S.name, body: pd.about ? `<p>${pd.about}</p>` : '' };
      if (u.info && node) u.node = null;   // a part with its own words: those, not the general card
      return u;
    };
    ctx.tag = (obj, partId, pri) => { obj.userData = Object.assign(obj.userData || {}, ctx.ud(partId, pri)); F.pickables.push(obj); return obj; };
    ctx.mesh = (geo, role, partId, pri, mo) => { const m = new THREE.Mesh(geo, ctx.mat(role, mo)); m.matrixAutoUpdate = false; ctx.G.add(m); if (partId) ctx.tag(m, partId, pri); return m; };
    ctx.inst = (geo, role, partId, pri, mats, mo) => { if (!mats.length) return null; const im = new THREE.InstancedMesh(geo, ctx.mat(role, mo), mats.length); mats.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; ctx.G.add(im); if (partId) ctx.tag(im, partId, pri); return im; };
    ctx.anchor = (partId, p, text, pri, dimUm) => ctx.anchors.push({ partId, p: p.clone(), text, pri: pri || 2, dimUm: dimUm || 0, g: ctx.G });
    return ctx;
  }
  function defaults(type) { const s = Z.shapes && Z.shapes[type], o = {}; if (s) for (const k in s.params) o[k] = s.params[k][2]; return o; }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const M4 = () => new THREE.Matrix4();
  const place = (p, q, s) => new THREE.Matrix4().compose(p, q || new THREE.Quaternion(), s || new V3(1, 1, 1));
  const randQ = r => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * TAU, r() * TAU, r() * TAU));
  const qAlong = dir => new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dir.clone().normalize());

  /* a nucleus (ellipsoid with semi-axes ax, cut by the plane when it crosses it): envelope, chromatin face, nucleolus */
  function nucleus(ctx, c, ax, rot, o = {}) {
    const g0 = new THREE.SphereGeometry(1, 40, 28); g0.scale(ax.x, ax.y, ax.z); if (rot) g0.applyQuaternion(rot); g0.translate(c.x, c.y, c.z);
    const cuts = !ctx.noCut && c.z + Math.max(ax.x, ax.y, ax.z) > 0 && c.z - Math.max(ax.x, ax.y, ax.z) < 0;
    let body = g0, cap = null; if (cuts) { const k = cutZ(g0, true); body = k.body; cap = k.cap; }
    const env = ctx.mesh(body, 'nucleus', 'nucleus', 1.5, { side: THREE.DoubleSide }); ctx.nuclei.push({ c: c.clone(), ax: ax.clone(), rot });
    if (cap) ctx.mesh(cap, 'chromatin', 'nucleus', 1.5, { side: THREE.DoubleSide, rough: .8, kind: 'matte' });
    if (o.nucleoli) for (let k = 0; k < o.nucleoli; k++) { const R = o.nucleolusR || Math.min(ax.x, ax.y) * .22, p = c.clone().add(new V3((ctx.r() - .5) * ax.x * .5, (ctx.r() - .2) * ax.y * .5, cuts ? -R * .2 : (ctx.r() - .5) * ax.z * .4));
      const ng = new THREE.SphereGeometry(R, 20, 14); ng.translate(p.x, p.y, p.z); const kk = cuts ? cutZ(ng, true) : { body: ng }; ctx.mesh(kk.body, 'nucleolus', 'nucleolus', 1.7); if (kk.cap) ctx.mesh(kk.cap, 'nucleolus', 'nucleolus', 1.7, { side: THREE.DoubleSide, kind: 'matte' }); ctx.counts.nucleoli = (ctx.counts.nucleoli || 0) + 1; if (k === 0) ctx.anchor('nucleolus', p.clone().add(new V3(0, R, 0)), ctx.parts.nucleolus ? ctx.parts.nucleolus.name : 'Nucleolus', 2, R * 2); }
    ctx.anchor('nucleus', c.clone().add(new V3(0, ax.y * .9, -ax.z * .2)), ctx.parts.nucleus ? ctx.parts.nucleus.name : 'Nucleus', 3, ax.x * 2);
    return env;
  }
  const inNucleus = (ctx, p, m) => ctx.nuclei.some(n => { const q = p.clone().sub(n.c); if (n.rot) q.applyQuaternion(n.rot.clone().invert()); return (q.x / (n.ax.x + m)) ** 2 + (q.y / (n.ax.y + m)) ** 2 + (q.z / (n.ax.z + m)) ** 2 < 1; });
  /* points inside the kept half of the cell, clear of the nuclei (rejection sampling in the box `box`) */
  function samplePts(ctx, n, box, margin, extra) {
    const out = [], r = ctx.r; for (let t = 0; t < n * 60 && out.length < n; t++) {
      const p = new V3(box.min.x + r() * (box.max.x - box.min.x), box.min.y + r() * (box.max.y - box.min.y), box.min.z + r() * (box.max.z - box.min.z));
      if ((!ctx.noCut && p.z > -margin) || !ctx.inside(p, margin) || inNucleus(ctx, p, margin)) continue; if (extra && !extra(p)) continue; out.push(p); }
    return out;
  }
  /* the volume of the cell (µm³) and of its kept half, by sampling */
  function volumes(ctx, box0) { const box = box0.clone(), zz = Math.max(Math.abs(box.min.z), Math.abs(box.max.z)); box.min.z = -zz; box.max.z = zz;   // the whole cell, not only the kept half
    const r = rng(7), N = 30000; let a = 0, k = 0; const s = new V3().subVectors(box.max, box.min), V0 = s.x * s.y * s.z;
    for (let i = 0; i < N; i++) { const p = new V3(box.min.x + r() * s.x, box.min.y + r() * s.y, box.min.z + r() * s.z); if (ctx.inside(p, 0)) { a++; if (p.z <= 0) k++; } } return { cell: a / N * V0, kept: k / N * V0 }; }

  /* the organelles a spec asks for, in the kept half (generic: any shape that sets ctx.inside and ctx.box) */
  function organelles(ctx) {
    const O = ctx.S.organelles || {}, box = ctx.box; if (!box) return;
    const V = ctx.vol || (ctx.vol = volumes(ctx, box)), vNuc = ctx.nuclei.reduce((s, n) => s + 4 / 3 * Math.PI * n.ax.x * n.ax.y * n.ax.z, 0);
    ctx.counts.cellVolume = V.cell; ctx.counts.nucVolume = vNuc;
    const cyto = Math.max(1, V.kept - vNuc / 2);
    const mt = O.mitochondria;
    if (mt && mt.volume_fraction && !ctx.ownMito) {
      const L = (mt.size_um && mt.size_um[0]) || 1.2, Wd = (mt.size_um && mt.size_um[1]) || .4, v1 = Math.PI * (Wd / 2) ** 2 * (L - Wd) + 4 / 3 * Math.PI * (Wd / 2) ** 3;
      const want = Math.round(mt.volume_fraction.value * cyto / v1), n = Math.min(want, mt.max_drawn || 1500), pts = samplePts(ctx, n, box, Wd);
      const geo = capsuleGeo(Wd / 2, L - Wd, 10, 5); ctx.inst(geo, 'mito', 'mitochondrion', 1.2, pts.map(p => place(p, randQ(ctx.r))));
      ctx.counts.mitochondria = pts.length; ctx.counts.mitochondriaWanted = want; if (pts[0]) ctx.anchor('mitochondrion', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.parts.mitochondrion ? ctx.parts.mitochondrion.name : 'Mitochondrion', 2.4, L);
    }
    const blob = (key, role, partId, def) => {   // granules of one kind: spheres or ellipsoids, a count, a size, a place
      const o = O[key]; if (!o || !o.count || !o.count.value) return;
      const d = (o.size_um && o.size_um.value) || def, el = o.elongation || 1, n = Math.min(Math.round(o.count.value * V.kept / Math.max(1, V.cell)), o.max_drawn || 800);
      const where = o.position === 'supranuclear' && ctx.nuclei[0] ? (p => { const nu = ctx.nuclei[0]; return p.y > nu.c.y + nu.ax.y * .3 && Math.hypot(p.x - nu.c.x, p.z - nu.c.z) < Math.max(nu.ax.x, nu.ax.z) * 1.25 && p.y < nu.c.y + nu.ax.y + 2.2; }) : o.position === 'apical' ? (p => p.y > box.max.y * .3) : o.position === 'peripheral' ? (p => !ctx.inside(p, d * 4)) : null;
      const pts = samplePts(ctx, n, box, d / 2, where);
      const geo = new THREE.SphereGeometry(d / 2, 10, 8); geo.scale(el, 1, 1);
      ctx.inst(geo, role, partId, 1.3, pts.map(p => place(p, randQ(ctx.r)))); ctx.counts[key] = pts.length;
      if (pts.length) ctx.anchor(partId, pts.reduce((a, b) => b.z > a.z ? b : a), ctx.parts[partId] ? ctx.parts[partId].name : partId, 1.8, d);
    };
    blob('lysosomes', 'lysosome', 'lysosome', .5); blob('melanosomes', 'melanin', 'melanosome', .5); blob('lamellar_bodies', 'lamellar', 'lamellar_body', .25);
    blob('granules', 'vesicle', 'granule', .4); blob('lipid_droplets', 'vesicle', 'lipid_droplet', 1);
    if (O.golgi && O.golgi.stacks && ctx.nuclei[0]) golgi(ctx, O.golgi.stacks.value || 1);
    if (O.rough_er && O.rough_er.form === 'nissl' && ctx.nuclei[0]) nissl(ctx, O.rough_er);
  }
  function capsuleGeo(r, len, rad, seg) { const pts = []; for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + i / seg * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, -len / 2 + Math.sin(a) * r)); } for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, len / 2 + Math.sin(a) * r)); } pts[0].x = 1e-4; pts[pts.length - 1].x = 1e-4; return new THREE.LatheGeometry(pts, rad); }
  /* stacks of flattened, curved sacs (Golgi) beside the nucleus, on the side away from the cut */
  function golgi(ctx, stacks) {
    const nu = ctx.nuclei[0], mats = [], disc = new THREE.CylinderGeometry(.55, .55, .05, 18, 1); disc.scale(1, 1, .55);
    for (let s = 0; s < stacks; s++) { const a = -0.6 + s * .5, base = nu.c.clone().add(new V3(Math.cos(a) * (nu.ax.x + .9), nu.ax.y * .55 + .3 * s, -Math.abs(Math.sin(a)) * nu.ax.z * .4 - .6));
      const out = base.clone().sub(nu.c).normalize(); for (let k = 0; k < 5; k++) { const p = base.clone().addScaledVector(out, k * .13); if (!ctx.inside(p, .4) || p.z > -.1) continue; mats.push(place(p, qAlong(out), new V3(1 - k * .07, 1, 1 - k * .07))); } }
    const im = ctx.inst(disc, 'golgi', 'golgi', 1.3, mats); if (im && mats.length) { const p = new V3().setFromMatrixPosition(mats[0]); ctx.anchor('golgi', p, ctx.parts.golgi ? ctx.parts.golgi.name : 'Golgi apparatus', 2, 1.2); } ctx.counts.golgiStacks = stacks;
  }
  /* Nissl bodies: clusters of parallel rough-ER sacs studded with ribosomes, in the cell body and the bases of the dendrites, none in the axon hillock */
  function nissl(ctx, o) {
    const n = (o.clusters && o.clusters.value) || 30, box = ctx.box, pts = samplePts(ctx, n, box, .9, ctx.nisslOk);
    const disc = new THREE.CylinderGeometry(.75, .75, .07, 14, 1); disc.scale(1, 1, .6); const mats = [];
    for (const p of pts) { const q = randQ(ctx.r), up = new V3(0, 1, 0).applyQuaternion(q); for (let k = 0; k < 5; k++) mats.push(place(p.clone().addScaledVector(up, (k - 2) * .16), q, new V3(1 - Math.abs(k - 2) * .12, 1, 1 - Math.abs(k - 2) * .1))); }
    ctx.inst(disc, 'nissl', 'nissl', 1.3, mats); ctx.counts.nissl = pts.length; if (pts.length) ctx.anchor('nissl', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.parts.nissl ? ctx.parts.nissl.name : 'Nissl body', 2.2, 1.5);
  }
  /* the inside of the cut cell: its far wall seen from within, in the cytosol tint; a click on it is on the cytosol */
  function cytosolBack(ctx, geo) { const m = new THREE.Mesh(geo, ctx.mat('cytosol', { side: THREE.BackSide, rough: .9, glow: .02, kind: 'matte' })); m.matrixAutoUpdate = false; m.scale.setScalar(.996); m.updateMatrix(); ctx.G.add(m); ctx.tag(m, 'cytosol', -.5); return m; }

  /* ================= THE SHAPES ================= */
  const SHAPE = {};

  /* ---- a mammalian red blood cell: the Evans-Fung profile turned round its axis; cut through the axis, the cut face shows the biconcave section ---- */
  SHAPE.disc_biconcave = ctx => {
    const P = ctx.P, R0 = P.diameter_um / 2, h = rho => .5 * Math.sqrt(Math.max(0, 1 - rho * rho)) * (P.c0_um + P.c2_um * rho * rho + P.c4_um * rho ** 4);
    const prof = []; const N = 64; for (let i = 0; i <= N; i++) { const t = i / N * Math.PI / 2, rho = Math.sin(t); prof.push(new THREE.Vector2(Math.max(1e-4, rho * R0), h(rho))); }
    for (let i = N - 1; i >= 0; i--) { const t = i / N * Math.PI / 2, rho = Math.sin(t); prof.push(new THREE.Vector2(Math.max(1e-4, rho * R0), -h(rho))); }
    const lathe = new THREE.LatheGeometry(prof, 96); lathe.computeVertexNormals();
    const tilt = new THREE.Group(); tilt.rotation.set(.45, 0, 0); ctx.G.add(tilt); const G0 = ctx.G; ctx.G = tilt;   // turned so the cut face and the outside of the disc are both seen
    const k = cutZ(lathe, true);
    ctx.mesh(k.body, 'rbc', 'membrane', .8, { kind: 'wet' });
    const cap = ctx.mesh(k.cap, 'haemoglobin', 'haemoglobin', 1, { side: THREE.DoubleSide, kind: 'matte', rough: .75, glow: .22 });
    /* the membrane and the spectrin net under it, along the edge of the cut: drawn as bands far thicker than the 5 nm of the membrane */
    const edge = (inset, w, role, partId, pri) => { const gb = new GB(); const pts = [], rs = []; for (let i = 0; i < prof.length; i++) { const q = prof[i], s = Math.sign(q.y) || 1; pts.push(new V3(q.x, q.y - s * inset, .002)); rs.push(w); } const mir = pts.map(p => new V3(-p.x, p.y, p.z)).reverse();
      tube(gb, pts, rs, 5); tube(gb, mir, rs, 5); return ctx.mesh(gb.geo(), role, partId, pri); };
    edge(0, .012, 'rbc', 'membrane', 2); edge(.035, .01, 'spectrin', 'spectrin', 2.1);
    ctx.inside = (p, m) => { const r = Math.hypot(p.x, p.z) / R0; return r < 1 && Math.abs(p.y) < h(r) - (m || 0); };
    ctx.box = new THREE.Box3(new V3(-R0, -1.5, -R0), new V3(R0, 1.5, R0));
    ctx.vol = volumes(ctx, ctx.box);
    ctx.anchor('membrane', new V3(-R0 * .55, h(.55) + .05, -R0 * .3), ctx.parts.membrane.name, 3, R0 * 2);
    ctx.anchor('haemoglobin', new V3(R0 * .78, 0, 0), ctx.parts.haemoglobin.name, 3, 1);
    ctx.anchor('spectrin', new V3(-R0 * .2, h(.2) - .04, 0), ctx.parts.spectrin.name, 1.5, .3);
    /* haemoglobin, molecule by molecule, close in: a jittered lattice at the measured number per µm³ in a thin layer behind the cut face round where the camera looks */
    const crowd = ctx.S.special && ctx.S.special.find(s => s.kind === 'crowd'); if (crowd) nearCrowd(ctx, crowd, (p, m) => Math.abs(p.y) < h(Math.abs(p.x) / R0) - m && Math.abs(p.x) < R0);
    ctx.G = G0; ctx.tiltG = tilt; ctx.focus = { pos: new V3(), r: R0 };
    ctx.counts.volume = ctx.vol.cell;
  };
  /* molecules too many to draw: a slab of them at their true size behind the cut face, drawn only while the view is a fraction of a µm across */
  function nearCrowd(ctx, c, insideCut) {
    const G = ctx.G, p = c.params, ax = p.size_nm.map(x => x / 2000), cap = p.max_drawn || 6000, perUm3 = ctx.counts.perUm3 = p.count / (ctx.vol ? ctx.vol.cell : 100);
    const geo = new THREE.IcosahedronGeometry(1, 1); geo.scale(ax[0], ax[1], ax[2]);
    const im = new THREE.InstancedMesh(geo, ctx.mat(c.role || 'haemoglobin', { rough: .6 }), cap); im.count = 0; im.frustumCulled = false; (ctx.G).add(im); ctx.tag(im, c.part, 2.5);
    const a = Math.cbrt(1 / perUm3), r = rng(11), m4 = M4();
    let last = null;
    ctx.near.push(st => {
      const show = st.Dum < p.show_below_um; im.visible = show; if (!show) { last = null; return; }
      const t = st.local(G); if (last && last.distanceTo(t) < st.Dum * .25) return; last = t.clone();
      const Rw = Math.min(st.Dum * 1.1, .6), n0 = Math.ceil(Rw / a); let k = 0; const depth = Math.max(a * 1.5, Math.min(Rw * .5, cap * a ** 3 / (Math.PI * Rw * Rw) * .8));
      const ix = Math.round(t.x / a), iy = Math.round(t.y / a);
      for (let i = -n0; i <= n0 && k < cap; i++) for (let j = -n0; j <= n0 && k < cap; j++) for (let z = 0; z * a < depth && k < cap; z++) {
        const gx = (ix + i), gy = (iy + j), sd = (gx * 73856093 ^ gy * 19349663 ^ z * 83492791) >>> 0, rr = rng(sd);
        const q = new V3(gx * a + (rr() - .5) * a * .35, gy * a + (rr() - .5) * a * .35, -z * a - rr() * a * .3 + ax[2] * .3);
        if ((q.x - t.x) ** 2 + (q.y - t.y) ** 2 > Rw * Rw || !insideCut(q, a * .5)) continue;
        m4.compose(q, randQ(rr), new V3(1, 1, 1)); im.setMatrixAt(k++, m4);
      }
      im.count = k; im.instanceMatrix.needsUpdate = true; ctx.counts.crowdDrawn = k; if (im.geometry.boundingSphere) im.geometry.boundingSphere = null;
    });
  }

  /* ---- a many-sided packed cell (an epithelial cell, a keratinocyte): a polyhedron with rounded edges, cut in half ---- */
  SHAPE.polyhedron = ctx => {
    const P = ctx.P, r = ctx.r, n = P.sides, hw = P.width_um / 2, hh = P.height_um / 2, tilt = (1 - P.taper) * hw / P.height_um;
    const planes = [];
    for (let i = 0; i < n; i++) { const a = (i + .5 + (r() - .5) * P.irregularity) / n * TAU, nn = new V3(Math.cos(a), tilt, Math.sin(a)).normalize(); planes.push({ n: nn, d: hw * (1 + (r() - .5) * P.irregularity) * nn.dot(new V3(Math.cos(a), 0, Math.sin(a))) }); }
    planes.push({ n: new V3(0, 1, 0).applyAxisAngle(new V3(1, 0, 0), (r() - .5) * P.irregularity * .5), d: hh }); planes.push({ n: new V3(0, -1, 0).applyAxisAngle(new V3(0, 0, 1), (r() - .5) * P.irregularity * .5), d: hh });
    const k = 1 / Math.max(.05, P.round_um);
    const rad = d => { let s = 0; for (const pl of planes) { const c = pl.n.dot(d); if (c > 1e-4) s += Math.exp(-k * pl.d / c); } return -Math.log(Math.max(s, 1e-300)) / k; };
    ctx.inside = (p, m) => { m = m || 0; for (const pl of planes) if (pl.n.dot(p) > pl.d - P.round_um * .6 - m) return false; return true; };
    const shell = starGeo(d => { const t = rad(d); return new V3(t, t, t); }, 64, 44);
    const k2 = cutZ(shell.clone(), false); shell.dispose();
    ctx.mesh(k2.body, 'cell', 'membrane', .6, { side: THREE.FrontSide, kind: 'wet' }); cytosolBack(ctx, k2.body);
    ctx.box = new THREE.Box3(new V3(-hw * 1.3, -hh * 1.1, -hw * 1.3), new V3(hw * 1.3, hh * 1.1, 0));
    ctx.focus = { pos: new V3(), r: Math.max(hw, hh) };
    ctx.anchor('membrane', new V3(-hw * .7, hh * .9, -hw * .35), ctx.parts.membrane ? ctx.parts.membrane.name : 'Cell membrane', 2.6, P.width_um);
    ctx.planes = planes; ctx.rad = rad;
    /* the nucleus (or nuclei) from the spec: volume share and shape */
    nucleiFromSpec(ctx, new V3(0, -hh * .05, 0));
    organelles(ctx);
    /* desmosomes: plaques on the surface; keratin bundles run in from them and round the nucleus */
    if (P.desmosomes) desmosomes(ctx, P.desmosomes);
    if (P.neighbours) neighbours(ctx, shell);
  };
  function nucleiFromSpec(ctx, c0) {
    const nu = ctx.S.nucleus || {}; if (!nu.count) return;
    const vol = ctx.vol || (ctx.vol = volumes(ctx, ctx.box)); ctx.counts.cellVolume = vol.cell; const fr = nu.volume_fraction ? nu.volume_fraction.value : .1;
    const sz = nu.size_um && nu.size_um.value; let ax;
    if (sz) ax = new V3(sz[0] / 2, sz[1] / 2, sz[2] / 2); else { const v = vol.cell * fr / nu.count, rr = Math.cbrt(v * 3 / (4 * Math.PI)); const e = nu.shape === 'oval' ? [1.15, .8, 1.05] : nu.shape === 'flat' ? [1.3, .55, 1.3] : nu.shape === 'elongated' ? [1.8, .6, .9] : [1, 1, 1]; ax = new V3(rr * e[0], rr * e[1], rr * e[2]); }
    for (let i = 0; i < nu.count; i++) { const c = c0.clone().add(new V3(nu.count > 1 ? (i - (nu.count - 1) / 2) * ax.x * 2.3 : 0, 0, 0)); nucleus(ctx, c, ax, null, { nucleoli: nu.nucleoli || 1 }); }
    ctx.counts.nucFraction = nu.count * 4 / 3 * Math.PI * ax.x * ax.y * ax.z / vol.cell;
  }
  function desmosomes(ctx, n) {
    const r = ctx.r, mats = [], plaque = new THREE.CylinderGeometry(.22, .22, .06, 10, 1), Ks = [];
    const sph = new V3(); for (let t = 0; t < n * 8 && mats.length < n; t++) {
      sph.set(gauss(r), gauss(r), gauss(r)).normalize(); if (sph.z > -.02) continue; const R = ctx.rad(sph); const p = sph.clone().multiplyScalar(R + .01);
      // the outward normal of the surface there, from the nearby radii
      const e = .02, ta = new V3().crossVectors(sph, new V3(0, 1, 0)).normalize(); if (ta.lengthSq() < .1) continue; const tb = new V3().crossVectors(sph, ta);
      const p1 = sph.clone().addScaledVector(ta, e).normalize(), p2 = sph.clone().addScaledVector(tb, e).normalize();
      const A = p1.multiplyScalar(ctx.rad(p1)).sub(p), B = p2.multiplyScalar(ctx.rad(p2)).sub(p), nrm = new V3().crossVectors(A, B).normalize(); if (nrm.dot(sph) < 0) nrm.negate();
      mats.push(place(p, qAlong(nrm))); Ks.push({ p, nrm });
    }
    ctx.inst(plaque, 'desmosome', 'desmosome', 2, mats); ctx.counts.desmosomes = mats.length;
    if (Ks.length) { const best = Ks.reduce((a, b) => (b.p.y - b.p.z * .2 > a.p.y - a.p.z * .2 ? b : a)); ctx.anchor('desmosome', best.p, ctx.parts.desmosome ? ctx.parts.desmosome.name : 'Desmosome', 2.2, .5); }
    /* keratin filament bundles: from a share of the desmosomes inwards, curving round the nucleus to another (tonofilaments) */
    const kb = ctx.S.special && ctx.S.special.find(s => s.kind === 'keratin_bundles'); if (!kb || !ctx.nuclei[0]) return;
    const nu = ctx.nuclei[0], gb = new GB(), nb = Math.min(kb.params.bundles, Ks.length), wid = kb.params.drawn_um / 2;
    for (let i = 0; i < nb; i++) {
      const a = Ks[(i * 7) % Ks.length], b = Ks[(i * 13 + 5) % Ks.length]; if (a === b) continue;
      const pa = a.p.clone().addScaledVector(a.nrm, -.1), pb = b.p.clone().addScaledVector(b.nrm, -.1), mid = pa.clone().add(pb).multiplyScalar(.5);
      const away = mid.clone().sub(nu.c); const need = Math.max(nu.ax.x, nu.ax.y) + 1.1; if (away.length() < need) away.setLength(need); const ctl = nu.c.clone().add(away); ctl.z = Math.min(ctl.z, -.25);
      const curve = new THREE.QuadraticBezierCurve3(pa, ctl, pb); let run = [];
      const flush = () => { if (run.length >= 4) tube(gb, run, run.map(() => wid), 5, true, true); run = []; };
      for (const p of curve.getPoints(40)) { if (ctx.inside(p, -.05) && p.z < -wid * 1.6 && !inNucleus(ctx, p, wid * 1.5)) run.push(p); else flush(); } flush();   // a bundle passes round the nucleus, never through it, and stays behind the cut
    }
    if (gb.vc) { ctx.mesh(gb.geo(), 'keratin', 'keratin', 1.6); const p = Ks[0].p.clone().lerp(nu.c, .35); ctx.anchor('keratin', p, ctx.parts.keratin ? ctx.parts.keratin.name : 'Keratin filaments', 2.3, .6); ctx.counts.keratinBundles = nb; }
  }
  /* the cells round it, behind the cut, faint: it is one of a layer */
  function neighbours(ctx, shell) {
    const P = ctx.P, w = P.width_um, gb = [];
    const offs = [[.87, 0, -.5], [-.87, 0, -.5], [0, 0, -1]];   // the three cells behind it in its layer
    const m = ctx.mat('neighbour', { film: [.03, .32], kind: 'wet' });
    for (const [x, y, z] of offs) { const g = shell.clone ? null : null; void g; const s = starGeo(d => { const t = ctx.rad(d) * .98; return new V3(t, t, t); }, 32, 22); s.translate(x * w * 1.02, y * P.height_um * 1.02, z * w * 1.02); const k = cutZ(s, false); gb.push([k.body]); }
    const g = MDC.merge(gb); const mesh = new THREE.Mesh(g, m); mesh.matrixAutoUpdate = false; mesh.renderOrder = 2; ctx.G.add(mesh); ctx.tag(mesh, 'neighbour', -.2);
  }

  /* ---- a long striated fibre (skeletal muscle): a piece of it, a window cut into its front half; myofibrils with their bands, peripheral nuclei ---- */
  SHAPE.fibre = ctx => {
    const P = ctx.P, R = P.diameter_um / 2, L = P.drawn_length_um, W = P.window_um, Ri = R - 1.4, r = ctx.r;
    ctx.noCut = true;   // its own cut: the window
    const inWin = (x, z) => Math.abs(x) < W / 2 && z > 0;
    /* a cylinder surface along x, with the window left out */
    const cyl = (rad, nx, nt) => { const gb = new GB(), xs = []; for (let i = 0; i <= nx; i++) xs.push(-L / 2 + i / nx * L); [-W / 2, W / 2].forEach(v => xs.push(v)); xs.sort((a, b) => a - b);
      const rows = xs.map(x => { const row = []; for (let k = 0; k <= nt; k++) { const t = k / nt * TAU, nn = new V3(0, Math.cos(t), Math.sin(t)); row.push(gb.v(new V3(x, rad * nn.y, rad * nn.z), nn)); } return row; });
      for (let i = 0; i < xs.length - 1; i++) { if (xs[i + 1] - xs[i] < 1e-6) continue; for (let k = 0; k < nt; k++) { const t = (k + .5) / nt * TAU, zc = Math.sin(t), xc = (xs[i] + xs[i + 1]) / 2; if (inWin(xc, zc)) continue; const a = rows[i][k], b = rows[i][k + 1], c = rows[i + 1][k], d = rows[i + 1][k + 1]; gb.i.push(a, c, b, b, c, d); } }
      return gb.geo(); };
    const sarc = P.sarcomere_um, thick = P.thick_um, thin = P.thin_um;
    /* the mass of myofibrils under the membrane: a cylinder in the sarcoplasm's colour, banded */
    const inner = new THREE.Mesh(cyl(Ri, Math.round(L / 3), 64), striate(ctx.mat('sarcoplasm', { kind: 'wet' }), sarc, thick, thin, .55)); inner.matrixAutoUpdate = false; ctx.G.add(inner); ctx.tag(inner, 'myofibril', .5);
    /* the membrane (sarcolemma): see-through, so the banding and the nuclei under it show */
    const sl = new THREE.Mesh(cyl(R, Math.round(L / 6), 64), ctx.mat('membrane', { film: look() === 'real' ? [.02, .22] : [.12, .55], kind: 'wet' })); sl.matrixAutoUpdate = false; sl.renderOrder = 3; ctx.G.add(sl); ctx.tag(sl, 'sarcolemma', .3);
    /* the window's floor: the cut face, a bed of myofibrils lying lengthwise, one row deep, banded */
    const md = P.myofibril_um, step = md * 1.12, rows = Math.floor(2 * Ri / step), mats = [];
    for (let j = 0; j < rows; j++) { const y = -Ri + step / 2 + j * step, zz = -md * .15; if (Math.abs(y) > Ri - md * .6) continue; mats.push(place(new V3(0, y, zz), new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), Math.PI / 2), new V3(1, W, 1))); }
    const mfGeo = new THREE.CylinderGeometry(md / 2, md / 2, 1, 10, 1, true);
    /* instanced cylinders scaled along their length: the band pattern takes the instance's x, so the pattern is per µm of fibre */
    const mf = new THREE.InstancedMesh(mfGeo, striate(ctx.mat('myofibril', { kind: 'wet' }), sarc, thick, thin, .7), mats.length); mats.forEach((m, i) => mf.setMatrixAt(i, m)); mf.frustumCulled = false; ctx.G.add(mf); ctx.tag(mf, 'myofibril', 1.5);
    ctx.counts.myofibrilsDrawn = mats.length; ctx.counts.myofibrilsInSection = Math.round(.8 * Math.PI * Ri * Ri / (Math.PI * (md / 2) ** 2));
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(W, 2 * Ri), striate(ctx.mat('sarcoplasm', { kind: 'matte', rough: .8 }), sarc, thick, thin, .5)); bed.position.z = -md * .55; bed.updateMatrix(); bed.matrixAutoUpdate = false; ctx.G.add(bed); ctx.tag(bed, 'myofibril', .4);
    /* the faces where the window ends, and the two ends of the piece: myofibrils seen end on, as dots */
    const dots = canvasTex('cellsMfDots' + md, 256, 256, (g, w, h) => { g.fillStyle = '#6b3b3e'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9a3a0'; const s = w / 8; for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) { g.beginPath(); g.arc((x + (y % 2) * .5) * s, y * s * .87, s * .4, 0, TAU); g.fill(); } }, { wrap: true });
    dots.repeat.set(2 * Ri / (step * 8), 2 * Ri / (step * 8 * .87));
    const endMat = ctx.mat('sarcoplasm', { extra: { map: dots }, kind: 'matte', rough: .85, glow: .02, color: 0xffffff });
    const endG = new GB(); const disc = (x, half, nrm) => { const c = endG.v(new V3(x, 0, 0), nrm); const nt = 48, first = endG.vc; for (let k = 0; k <= nt; k++) { const t = half ? k / nt * Math.PI : k / nt * TAU; endG.v(new V3(x, Ri * Math.cos(t), Ri * Math.sin(t)), nrm); } for (let k = 0; k < nt; k++) { if (nrm.x > 0) endG.i.push(c, first + k, first + k + 1); else endG.i.push(c, first + k + 1, first + k); } };
    disc(-L / 2, false, new V3(-1, 0, 0)); disc(L / 2, false, new V3(1, 0, 0)); disc(-W / 2, true, new V3(1, 0, 0)); disc(W / 2, true, new V3(-1, 0, 0));
    const eg = endG.geo(); const uv = new Float32Array(eg.attributes.position.count * 2); for (let i = 0; i < eg.attributes.position.count; i++) { uv[2 * i] = eg.attributes.position.getY(i) / (2 * Ri) + .5; uv[2 * i + 1] = eg.attributes.position.getZ(i) / (2 * Ri) + .5; } eg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const ends = new THREE.Mesh(eg, endMat); ends.matrixAutoUpdate = false; ctx.G.add(ends); ctx.tag(ends, 'myofibril', .6);
    /* nuclei, under the membrane, flattened against it: count from the measured number per mm */
    const nu = ctx.S.nucleus || {}, per = nu.per_mm ? nu.per_mm.value : P.nuclei_per_mm, nN = Math.round(per * L / 1000), sz = (nu.size_um && nu.size_um.value) || [10, 4, 2];
    const ng = new THREE.SphereGeometry(1, 20, 12); ng.scale(sz[0] / 2, sz[2] / 2, sz[1] / 2); const nm = [];
    for (let i = 0; i < nN; i++) { const x = -L / 2 + sz[0] + r() * (L - 2 * sz[0]), t = r() * TAU, nn = new V3(0, Math.cos(t), Math.sin(t)); if (inWin(x, nn.z) || (Math.abs(x) < W / 2 + sz[0] / 2 && nn.z > -.15)) continue;
      const p = new V3(x, 0, 0).addScaledVector(nn, R - sz[2] / 2 - .25); nm.push(place(p, new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), nn))); }
    ctx.inst(ng, 'nucleus', 'nucleus', 1.6, nm); ctx.counts.nuclei = nm.length; ctx.counts.nucleiWanted = nN;
    const vis = nm.map(m => new V3().setFromMatrixPosition(m)).filter(p => Math.abs(p.x) < W * .9 && p.y > R * .3).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
    if (vis) ctx.anchor('nucleus', vis, ctx.parts.nucleus.name, 3, sz[0]);
    /* mitochondria between the myofibrils of the window floor (volume share from the spec; their placement is a choice) */
    const mt = ctx.S.organelles && ctx.S.organelles.mitochondria;
    if (mt) { const ms = mt.size_um || [1, .3], v1 = Math.PI * (ms[1] / 2) ** 2 * ms[0], slab = 2 * Ri * W * md, want = Math.round(mt.volume_fraction.value * slab / v1), n = Math.min(want, mt.max_drawn || 1500), mm = [];
      for (let i = 0; i < n; i++) { const j = Math.floor(r() * (mats.length - 1)), y0 = new V3().setFromMatrixPosition(mats[j]).y + step / 2, x = (r() - .5) * W * .98; mm.push(place(new V3(x, y0, md * .05), new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), (r() - .5) * .8), new V3(1, 1, 1))); }
      const mg = capsuleGeo(ms[1] / 2, Math.max(.01, ms[0] - ms[1]), 6, 2); ctx.inst(mg, 'mito', 'mitochondrion', 1.8, mm); ctx.counts.mitochondria = mm.length; ctx.counts.mitochondriaWanted = want;
      if (mm[0]) ctx.anchor('mitochondrion', new V3().setFromMatrixPosition(mm[Math.floor(mm.length / 3)]), ctx.parts.mitochondrion.name, 2.4, ms[0]); }
    ctx.anchor('myofibril', new V3(-W * .25, Ri * .35, md * .4), ctx.parts.myofibril.name, 3, md * 3);
    const z0 = Math.round(W * .18 / sarc) * sarc; ctx.anchor('sarcomere', new V3(z0 + sarc / 2, -Ri * .2, md * .5), ctx.parts.sarcomere ? ctx.parts.sarcomere.name : 'Sarcomere', 2.6, sarc);
    ctx.anchor('sarcolemma', new V3(W * .5 + 12, R * .7, R * .7), ctx.parts.sarcolemma.name, 2.5, R);
    if (ctx.S.view && ctx.S.view.break) { const b = ctx.S.view.break; ctx.breaks = [{ p: new V3(L / 2, R * 1.1, 0), text: b.text }, { p: new V3(-L / 2, R * 1.1, 0), text: b.text_short || b.text }]; }
    ctx.focus = { pos: new V3(), r: W / 2 };
    ctx.inside = (p, m) => Math.abs(p.x) < L / 2 && Math.hypot(p.y, p.z) < R - (m || 0);
    ctx.counts.window = W; ctx.counts.drawnLength = L;
  };

  /* ---- a neuron: cell body, dendrites grown to the measured total lengths and branch counts, spines near the eye, an axon with myelin, nodes and boutons ---- */
  /* a dendritic tree: `bps` branch points over a total length `total`, grown from `root` along `dir`, bent toward `bias`; returns polylines with radii */
  function growTree(r, root, dir, total, bps, o) {
    const segs = [{ par: -1, depth: 0, kids: [] }];
    for (let b = 0; b < bps; b++) { const leaves = segs.filter(s => !s.kids.length); const w = leaves.map(s => 1 / (1 + s.depth * (o.deep || .6))); let t = r() * w.reduce((a, c) => a + c, 0), pick = leaves[0]; for (let i = 0; i < leaves.length; i++) { t -= w[i]; if (t <= 0) { pick = leaves[i]; break; } }
      const i0 = segs.indexOf(pick); [0, 1].forEach(() => { segs.push({ par: i0, depth: pick.depth + 1, kids: [] }); pick.kids.push(segs.length - 1); }); }
    const wts = segs.map(s => (s.kids.length ? .7 : 1.6) * (.55 + r())), sw = wts.reduce((a, b) => a + b, 0); segs.forEach((s, i) => { s.len = total * wts[i] / sw; });
    const lines = [], STEP = o.step || 3;
    const walk = (i, p0, d0) => { const s = segs[i], pts = [p0.clone()], d = d0.clone(); let p = p0.clone(); const n = Math.max(2, Math.round(s.len / STEP));
      for (let k = 0; k < n; k++) { d.addScaledVector(new V3(gauss(r), gauss(r), gauss(r) * (o.flat || .35)), o.wiggle || .18); if (o.bias) d.addScaledVector(o.bias(p), o.biasK || .08); d.normalize(); p = p.clone().addScaledVector(d, s.len / n); if (o.clamp) o.clamp(p); pts.push(p); }
      const r0 = Math.max(o.rMin || .3, o.r0 * Math.pow(o.taper || .78, s.depth)), r1 = Math.max(o.rMin || .3, r0 * (s.kids.length ? .85 : .6));
      lines.push({ pts, rs: pts.map((_, k) => r0 + (r1 - r0) * k / (pts.length - 1)), depth: s.depth, terminal: !s.kids.length, kind: o.kind });
      s.kids.forEach((c, j) => { const ax = new V3(gauss(r), gauss(r), gauss(r) * .3).cross(d).normalize(), nd = d.clone().applyAxisAngle(ax, (j ? 1 : -1) * (.35 + r() * .35)); walk(c, p, nd); }); };
    walk(0, root, dir.clone().normalize()); return lines;
  }
  SHAPE.neuron = ctx => {
    const P = ctx.P, r = ctx.r, G = ctx.G, w = P.soma_w_um / 2, h = P.soma_h_um / 2;
    /* the cell body: a rounded pyramid pointing up into the apical dendrite (pyramidal), else rounder */
    const pyr = P.soma === 'pyramidal';
    const somaR = d => { const y = d.y; let s = 1; if (pyr && y > 0) s = 1 - .72 * Math.pow(y, 1.35); const yy = pyr ? (y > 0 ? 1.18 : .8) : 1; return new V3(w * s, h * yy, w * s * .92); };
    const _sd = new V3(), somaGeo = starGeo(somaR, 48, 36), insideSoma = (p, m) => { m = m || 0; _sd.set(p.x / w, p.y / h, p.z / (w * .92)); if (_sd.lengthSq() < 1e-9) return true; const rr = somaR(_sd.normalize());
      return (p.x / Math.max(.01, rr.x - m)) ** 2 + (p.y / Math.max(.01, rr.y - m)) ** 2 + (p.z / Math.max(.01, rr.z - m)) ** 2 < 1; };   // the surface along the scaled direction: the same mapping as the mesh
    ctx.inside = insideSoma; ctx.box = new THREE.Box3(new V3(-w, -h, -w), new V3(w, h * 1.2, 0));
    const k = cutZ(somaGeo, false); ctx.mesh(k.body, 'soma', 'soma', .7, { kind: 'wet' }); cytosolBack(ctx, k.body);
    ctx.anchor('soma', new V3(-w * .75, -h * .2, -w * .3), ctx.parts.soma.name, 2.8, P.soma_w_um);
    /* nucleus and organelles of the cell body */
    nucleiFromSpec(ctx, new V3(0, -h * .1, 0));
    ctx.nisslOk = p => p.y > -h * .55;   // none in the axon hillock
    organelles(ctx);
    /* dendrites: basal trees round the base, the apical trunk, obliques off it and the tuft at its top */
    const lines = [], down = new V3(0, -1, 0), up = new V3(0, 1, 0);
    const flatK = .45;   // the trees spread more across the view than toward it (so they are seen); a choice, said in the note
    const nb = P.basal_n, bpsEach = Array(nb).fill(0); for (let b = 0; b < P.basal_branch_points; b++) bpsEach[Math.floor(r() * nb)]++;
    const share = Array(nb).fill(0).map(() => .6 + r()), ssum = share.reduce((a, b) => a + b, 0);
    for (let i = 0; i < nb; i++) { const a = (i + .3 * r()) / nb * TAU, dir = new V3(Math.cos(a), -.35 - .5 * r(), Math.sin(a) * flatK).normalize(); const root = new V3(dir.x * w * .8, -h * .35 + dir.y * h * .4, dir.z * w * .5);
      growTree(r, root, dir, P.basal_total_um * share[i] / ssum, bpsEach[i], { r0: P.dendrite_um / 2, kind: 'basal', flat: flatK, bias: p => new V3(p.x, p.y - 20, p.z * .3).normalize(), biasK: .06 }).forEach(l => lines.push(l)); }
    /* the apical trunk: straight up, thinning */
    const trunk = [], trs = []; const Ltr = P.apical_trunk_um; for (let y = h * .9; y <= Ltr; y += 3) { trunk.push(new V3(Math.sin(y * .01) * 1.5, y, 0)); trs.push(Math.max(.8, P.trunk_um / 2 * (1 - .55 * y / Ltr))); }
    lines.push({ pts: trunk, rs: trs, depth: 0, kind: 'apical', terminal: false });
    const top = trunk[trunk.length - 1];
    /* obliques: off the trunk at intervals */
    const nObl = Math.max(1, Math.round(P.oblique_branch_points * .7)), oblB = Array(nObl).fill(0); for (let b = 0; b < P.oblique_branch_points - nObl + 1 && b >= 0; b++) oblB[Math.floor(r() * nObl)]++;
    for (let i = 0; i < nObl; i++) { const t = .12 + .8 * (i + r() * .5) / nObl, p = trunk[Math.floor(t * (trunk.length - 1))], side = (i % 2 ? 1 : -1), dir = new V3(side, .25 + r() * .3, (r() - .5) * flatK).normalize();
      growTree(r, p.clone(), dir, P.oblique_total_um / nObl * (.7 + .6 * r()), oblB[i], { r0: P.dendrite_um / 2 * .9, kind: 'apical', flat: flatK, bias: () => new V3(side * .4, .6, 0), biasK: .05 }).forEach(l => lines.push(l)); }
    /* the tuft: from the trunk's end up to the reach, spreading */
    const reach = P.apical_reach_um, nT = 3; const tB = Array(nT).fill(0); for (let b = 0; b < Math.max(0, P.tuft_branch_points - (nT - 1)); b++) tB[Math.floor(r() * nT)]++;
    for (let i = 0; i < nT; i++) { const dir = new V3((i - 1) * .5, 1, (r() - .5) * flatK).normalize();
      growTree(r, top.clone(), dir, P.tuft_total_um / nT, tB[i], { r0: P.dendrite_um / 2, kind: 'apical', flat: flatK, deep: .2, bias: p => new V3(p.x * .002, p.y < reach ? 1 : -1.5, 0), biasK: .1, clamp: p => { if (p.y > reach) p.y = reach; } }).forEach(l => lines.push(l)); }
    const gbD = new GB(); let total = { basal: 0, apical: 0 };
    for (const l of lines) { tube(gbD, l.pts, l.rs, l.depth < 2 ? 7 : 5, false, l.terminal); for (let i = 1; i < l.pts.length; i++) total[l.kind] += l.pts[i].distanceTo(l.pts[i - 1]); }
    ctx.mesh(gbD.geo(), 'dendrite', 'dendrite', 1, { kind: 'wet' }); ctx.counts.dendriteLength = total;
    const lb = lines.find(l => l.kind === 'basal' && l.depth === 0); if (lb) ctx.anchor('dendrite', lb.pts[Math.floor(lb.pts.length * .7)], ctx.parts.dendrite.name, 2.6, 1.5);
    ctx.anchor('apical', trunk[Math.floor(trunk.length * .35)], ctx.parts.apical ? ctx.parts.apical.name : 'Apical dendrite', 2.7, 3);
    /* spines: positions along every dendrite at the measured densities, drawn only round where the camera looks */
    const sp = []; for (const l of lines) { const dens = l.kind === 'basal' ? P.spines_basal_per_um : P.spines_apical_per_um; if (!dens) continue;
      for (let i = 1; i < l.pts.length; i++) { const a = l.pts[i - 1], b = l.pts[i], segL = a.distanceTo(b); if (l.pts === trunk && b.y < 30) continue; let nn = segL * dens; let cnt = Math.floor(nn) + (r() < nn % 1 ? 1 : 0); const t = b.clone().sub(a).normalize();
        while (cnt-- > 0) { const u = r(), p = a.clone().lerp(b, u), rad = l.rs[i - 1]; const o = new V3(gauss(r), gauss(r), gauss(r)); o.addScaledVector(t, -o.dot(t)).normalize(); const len = P.spine_um * (.5 + r()); sp.push(p.x + o.x * rad, p.y + o.y * rad, p.z + o.z * rad, o.x, o.y, o.z, len); } } }
    const spArr = new Float32Array(sp); ctx.counts.spines = spArr.length / 7;
    const spGeo = (() => { const neck = new THREE.CylinderGeometry(.07, .08, .7, 5, 1); neck.translate(0, .35, 0); const head = new THREE.IcosahedronGeometry(P.spine_head_um / 2 / P.spine_um, 0); head.translate(0, .82, 0); return MDC.merge([[neck], [head]]); })();
    const CAPS = 4000, spI = new THREE.InstancedMesh(spGeo, ctx.mat('spine', { kind: 'wet' }), CAPS); spI.count = 0; spI.frustumCulled = false; G.add(spI); ctx.tag(spI, 'spine', 2.2);
    let lastT = null, lastD = 0; const m4 = M4(), qq = new THREE.Quaternion(), vv = new V3(), ss = new V3();
    ctx.near.push(st => {
      const show = st.Dum < 90; spI.visible = show; if (!show) { lastT = null; return; }
      const t = st.local(G); if (lastT && lastT.distanceTo(t) < st.Dum * .2 && Math.abs(Math.log(st.Dum / lastD)) < .4) return; lastT = t.clone(); lastD = st.Dum;
      const Rs = Math.max(6, st.Dum * 1.4), R2 = Rs * Rs; let k = 0;
      for (let i = 0; i < spArr.length && k < CAPS; i += 7) { const dx = spArr[i] - t.x, dy = spArr[i + 1] - t.y, dz = spArr[i + 2] - t.z; if (dx * dx + dy * dy + dz * dz > R2) continue;
        vv.set(spArr[i + 3], spArr[i + 4], spArr[i + 5]); qq.setFromUnitVectors(up, vv); const L = spArr[i + 6]; m4.compose(_a.set(spArr[i], spArr[i + 1], spArr[i + 2]), qq, ss.set(L, L, L)); spI.setMatrixAt(k++, m4); }
      spI.count = k; spI.instanceMatrix.needsUpdate = true; ctx.counts.spinesDrawn = k; });
    ctx.spineAnchor = () => { const l = lines.find(x => x.kind === 'basal' && x.depth === 1) || lines[0]; return l.pts[Math.floor(l.pts.length / 2)]; };
    ctx.anchor('spine', ctx.spineAnchor().clone().add(new V3(0, .8, 0)), ctx.parts.spine.name, 2, P.spine_um);
    /* the axon: from the base of the cell body, down; initial segment bare, then myelin segments with nodes between; collaterals with boutons */
    const ax = [], axR = P.axon_um / 2; let p = new V3(0, -h * .95, 0), d = down.clone(); ax.push(p.clone()); const AXL = P.axon_drawn_um;
    for (let s = 0; s < AXL; s += 3) { d.addScaledVector(new V3(gauss(r), 0, gauss(r) * .3), .03).normalize(); d.y = Math.min(d.y, -.92); d.normalize(); p = p.clone().addScaledVector(d, 3); ax.push(p); }
    const hill = []; for (let i = 0; i <= 6; i++) { const y = -h * .95 + i * 1.2; hill.push(new V3(0, y - 8, 0)); } void hill;
    const gbA = new GB(); tube(gbA, ax, ax.map((q, i) => Math.max(axR, (P.dendrite_um * 1.3) * Math.exp(-i * .9) + axR)), 6, false, false);
    ctx.mesh(gbA.geo(), 'axon', 'axon', 1.4, { kind: 'wet' });
    const at = (dist) => { const i = Math.min(ax.length - 1, Math.max(0, Math.round(dist / 3))); return ax[i]; };
    ctx.anchor('ais', at(P.ais_um * .5).clone().add(new V3(axR + .5, 0, 0)), ctx.parts.ais ? ctx.parts.ais.name : 'Axon initial segment', 2.2, P.ais_um);
    const nodes = [];
    if (P.myelin) { const gbM = new GB(); const Ro = axR / P.g_ratio; let s = P.ais_um; while (s + 10 < AXL) { const e = Math.min(AXL, s + P.internode_um); const seg = []; for (let q = s + P.node_um / 2; q <= e - P.node_um / 2; q += 3) seg.push(at(q).clone()); if (seg.length > 1) tube(gbM, seg, seg.map(() => Ro), 10, true, true); nodes.push(e); s = e + P.node_um; }
      ctx.mesh(gbM.geo(), 'myelin', 'myelin', 1.6, { kind: 'wet', rough: .35 }); ctx.counts.internodes = nodes.length;
      ctx.anchor('myelin', at(P.ais_um + P.internode_um * .5).clone().add(new V3(Ro, 0, 0)), ctx.parts.myelin.name, 2.5, Ro * 2);
      if (nodes[0]) ctx.anchor('node', at(nodes[0]).clone().add(new V3(Ro, 0, 0)), ctx.parts.node ? ctx.parts.node.name : 'Node of Ranvier', 2.3, 1); }
    /* collaterals leave at nodes, run sideways and carry boutons */
    const gbC = new GB(), bm = [];
    for (let c = 0; c < P.collaterals && nodes.length; c++) { const s0 = nodes[Math.min(nodes.length - 1, 1 + c * 2)], p0 = at(s0).clone(), side = c % 2 ? 1 : -1; let q = p0.clone(), dd = new V3(side, -.2, (r() - .5) * .3).normalize(); const pts = [q.clone()];
      for (let s = 0; s < P.collateral_um; s += 3) { dd.addScaledVector(new V3(gauss(r), gauss(r), gauss(r) * .3), .12).normalize(); q = q.clone().addScaledVector(dd, 3); pts.push(q); if (s > 10 && (s % P.bouton_spacing_um) < 3) bm.push(place(q.clone(), null, new V3(1, 1, 1))); }
      tube(gbC, pts, pts.map(() => axR * .6), 5, false, true); }
    if (gbC.vc) ctx.mesh(gbC.geo(), 'axon', 'axon', 1.4, { kind: 'wet' });
    const bg = new THREE.IcosahedronGeometry(P.bouton_um / 2, 1); ctx.inst(bg, 'bouton', 'bouton', 2.1, bm); ctx.counts.boutons = bm.length;
    if (bm[2]) ctx.anchor('bouton', new V3().setFromMatrixPosition(bm[2]), ctx.parts.bouton.name, 2.1, P.bouton_um);
    ctx.anchor('axon', at(AXL * .55).clone().add(new V3(2, 0, 0)), ctx.parts.axon.name, 2.8, 2);
    if (ctx.S.view && ctx.S.view.break) { const end = ax[ax.length - 1]; const gbB = new GB(); [-1, 1].forEach(sg => { const c = end.clone().add(new V3(0, sg * 2.2, 0)); tube(gbB, [c.clone().add(new V3(-3, -1.2, 0)), c.clone().add(new V3(3, 1.2, 0))], [.25, .25], 5, true, true); });
      ctx.mesh(gbB.geo(), 'membrane', 'axon_break', 2, { kind: 'matte' }); ctx.breaks = [{ p: end.clone().add(new V3(4, -4, 0)), text: ctx.S.view.break.text, partId: 'axon_break' }]; }
    ctx.focus = { pos: new V3(), r: Math.max(w, h) * 1.4 }; ctx.counts.axonDrawn = AXL;
  };

  /* ---- the simpler shapes (no spec of the four exemplars uses them yet; each draws a recognisable body with its nucleus and organelles) ---- */
  SHAPE.ellipsoid = ctx => {
    const P = ctx.P, a = P.a_um / 2, b = P.b_um / 2, c = P.c_um / 2, r = ctx.r, bump = P.bumps;
    const rf = d => { const n = 1 + bump * .08 * (Math.sin(d.x * 11 + 1) * Math.sin(d.y * 13 + 2) * Math.sin(d.z * 9 + 3)); return new V3(a * n, b * n, c * n); };
    const g = starGeo(rf, 56, 40), k = cutZ(g, false); ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet' }); cytosolBack(ctx, k.body);
    ctx.inside = (p, m) => (p.x / Math.max(.01, a - (m || 0))) ** 2 + (p.y / Math.max(.01, b - (m || 0))) ** 2 + (p.z / Math.max(.01, c - (m || 0))) ** 2 < 1;
    ctx.box = new THREE.Box3(new V3(-a, -b, -c), new V3(a, b, 0)); ctx.focus = { pos: new V3(), r: Math.max(a, b, c) };
    if (P.pseudopods) { const gb = new GB(); for (let i = 0; i < P.pseudopods; i++) { const dir = new V3(gauss(r), gauss(r), -Math.abs(gauss(r)) * .5).normalize(), s = new V3(dir.x * a, dir.y * b, dir.z * c), pts = [], rs = []; for (let t = 0; t <= 1.0001; t += .1) { pts.push(s.clone().addScaledVector(dir, t * P.pseudopod_um)); rs.push(Math.min(a, b) * .18 * (1 - .7 * t)); } tube(gb, pts, rs, 8, false, true); } ctx.mesh(gb.geo(), 'cell', 'membrane', .6); }
    if (P.coat_um) { const cg = starGeo(d => { const q = rf(d); return q.addScalar(P.coat_um); }, 48, 32), kc = cutZ(cg, false); ctx.mesh(kc.body, 'neighbour', 'coat', .2, { film: [.08, .45] }); }
    ctx.anchor('membrane', new V3(-a * .7, b * .75, -c * .2), ctx.parts.membrane ? ctx.parts.membrane.name : 'Cell membrane', 2.4, a * 2);
    nucleiFromSpec(ctx, new V3(0, 0, -c * .1)); organelles(ctx);
  };
  SHAPE.spindle = ctx => {
    const P = ctx.P, L = P.length_um / 2, Wd = P.width_um / 2;
    const one = (sx) => { const rf = d => { const s = Math.pow(1 - Math.min(1, Math.abs(d.x)), .9); return new V3(L, Wd * s / Math.max(.05, Math.sqrt(1 - d.x * d.x)) * Math.sqrt(1 - d.x * d.x), Wd * P.flat * s / Math.max(.05, Math.sqrt(1 - d.x * d.x)) * Math.sqrt(1 - d.x * d.x)); };
      const g = starGeo(rf, 64, 32); if (P.bend) { const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setY(i, y - P.bend * L * .5 * (1 - (x / L) ** 2) * sx); } g.computeVertexNormals(); } if (sx < 0) g.scale(1, -1, 1); return g; };
    const shapes = P.pair ? [[1, Wd * 1.4], [-1, -Wd * 1.4]] : [[1, 0]];
    for (const [sx, off] of shapes) { const g = one(sx); g.translate(0, off, 0); const k = cutZ(g, false); ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet' }); cytosolBack(ctx, k.body); }
    ctx.inside = (p, m) => { const t = Math.abs(p.x) / L; if (t >= 1) return false; const rr = Wd * Math.pow(1 - t, .9) - (m || 0); return Math.hypot(p.y, p.z / P.flat) < rr; };
    ctx.box = new THREE.Box3(new V3(-L, -Wd, -Wd), new V3(L, Wd, 0)); ctx.focus = { pos: new V3(), r: L * .5 };
    ctx.anchor('membrane', new V3(-L * .4, Wd * .8, 0), ctx.parts.membrane ? ctx.parts.membrane.name : 'Cell membrane', 2.4, Wd * 2);
    if (!P.pair) { nucleiFromSpec(ctx, new V3()); organelles(ctx); }
  };
  SHAPE.stellate = ctx => {
    const P = ctx.P, r = ctx.r, s = P.soma_um / 2;
    const g = starGeo(d => new V3(s, s * .9, s * P.flat), 40, 28), k = cutZ(g, false); ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet' }); cytosolBack(ctx, k.body);
    ctx.inside = (p, m) => (p.x / (s - (m || 0))) ** 2 + (p.y / (s * .9 - (m || 0))) ** 2 + (p.z / Math.max(.05, s * P.flat - (m || 0))) ** 2 < 1;
    ctx.box = new THREE.Box3(new V3(-s, -s, -s), new V3(s, s, 0)); ctx.focus = { pos: new V3(), r: s * 2.5 };
    const gb = new GB(), feet = []; const each = Array(P.processes).fill(0); for (let b = 0; b < P.branch_points; b++) each[Math.floor(r() * P.processes)]++;
    for (let i = 0; i < P.processes; i++) { const a = i / P.processes * TAU + r() * .4, dir = new V3(Math.cos(a), Math.sin(a), (r() - .5) * P.flat).normalize();
      growTree(r, dir.clone().multiplyScalar(s * .85), dir, P.reach_um * 1.4, each[i], { r0: P.process_um / 2, rMin: Math.min(.3, P.process_um / 4), flat: P.flat, step: Math.max(.5, P.reach_um / 30), bias: q => q.clone().normalize(), biasK: .1 }).forEach(l => { tube(gb, l.pts, l.rs, 5, false, !P.endfeet); if (P.endfeet && l.terminal) feet.push(place(l.pts[l.pts.length - 1], null, new V3(1, 1, 1))); }); }
    ctx.mesh(gb.geo(), 'cell', 'process', 1); if (feet.length) ctx.inst(new THREE.SphereGeometry(P.endfoot_um / 2, 10, 8).scale(1, .45, 1), 'cell', 'endfoot', 1.5, feet);
    if (P.lacuna_um) { const lg = new THREE.SphereGeometry(P.lacuna_um / 2, 40, 28); lg.scale(1, .55, .7); const kl = cutZ(lg, false); ctx.mesh(kl.body, 'neighbour', 'lacuna', .1, { film: [.05, .4], side: THREE.DoubleSide }); }
    ctx.anchor('membrane', new V3(-s, s, 0), ctx.parts.membrane ? ctx.parts.membrane.name : 'Cell body', 2.4, s * 2);
    nucleiFromSpec(ctx, new V3()); organelles(ctx);
  };
  SHAPE.segmented = ctx => {
    const P = ctx.P, segs = P.segments || [], gb = new GB(), r = ctx.r; let y = 0; const total = segs.reduce((a, s) => a + s.length_um, 0); y = total / 2;
    for (const s of segs) { const pts = [], rs = []; for (let t = 0; t <= 1.0001; t += .1) { pts.push(new V3(P.bend * Math.sin((total / 2 - (y - t * s.length_um)) / total * 3) * 2, y - t * s.length_um, 0)); rs.push((s.d0_um + (s.d1_um - s.d0_um) * t) / 2); }
      const g2 = new GB(); tube(g2, pts, rs, 14, true, true); ctx.mesh(g2.geo(), s.fill === 'nucleus' ? 'nucleus' : 'cell', s.part || 'membrane', 1);
      if (s.fill === 'discs') { const mats = [], n = Math.min(400, Math.floor(s.length_um / P.disc_spacing_um)); for (let i = 0; i < n; i++) mats.push(place(new V3(0, y - (i + .5) * s.length_um / n, 0), null, new V3(1, 1, 1))); ctx.inst(new THREE.CylinderGeometry(rs[0] * .92, rs[0] * .92, Math.min(.02, s.length_um / n * .5), 16, 1), 'membrane', s.part || 'discs', 1.6, mats); }
      if (s.fill === 'mito_helix') { const mats = []; for (let t = 0; t < s.length_um; t += .1) { const a = t * 11; mats.push(place(new V3(Math.cos(a) * rs[0] * .9, y - t, Math.sin(a) * rs[0] * .9), null, new V3(1, 1, 1))); } ctx.inst(new THREE.SphereGeometry(rs[0] * .3, 6, 4), 'mito', 'mitochondrion', 1.7, mats); }
      ctx.anchor(s.part || 'membrane', new V3(rs[0] + .5, y - s.length_um / 2, 0), (ctx.parts[s.part] && ctx.parts[s.part].name) || s.part, 2.2, rs[0] * 2); y -= s.length_um; void r; }
    ctx.inside = () => false; ctx.focus = { pos: new V3(), r: total / 2 }; ctx.noCut = true;
  };
  SHAPE.rod = ctx => {
    const P = ctx.P, r = ctx.r, L = P.length_um, Wd = P.width_um / 2, pts = [], n = 60;
    for (let i = 0; i <= n; i++) { const t = i / n, x = (t - .5) * L; let yy = P.curve * L * .25 * (1 - 4 * (t - .5) ** 2), zz = 0; if (P.helix_turns) { const a = t * P.helix_turns * TAU; yy = Math.sin(a) * Wd * 2.2; zz = Math.cos(a) * Wd * 2.2; } pts.push(new V3(x, yy, zz)); }
    const gb = new GB(); tube(gb, pts, pts.map(() => Wd), 20, true, true); const g = gb.geo(), k = cutZ(g, false); ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet', side: THREE.DoubleSide }); cytosolBack(ctx, k.body);
    if (P.wall !== 'none') { const gw = new GB(); tube(gw, pts, pts.map(() => Wd * 1.08 + .02), 20, true, true); const kw = cutZ(gw.geo(), false); ctx.mesh(kw.body, 'neighbour', 'wall', .3, { film: [.08, .5] }); }
    if (P.flagella) { const gf = new GB(); for (let f = 0; f < P.flagella; f++) { const s = pts[f % 2 ? 0 : n].clone(), dir = new V3(f % 2 ? -1 : 1, (r() - .5), (r() - .5)).normalize(), fp = []; for (let t = 0; t <= P.flagellum_um; t += .1) fp.push(s.clone().addScaledVector(dir, t).add(new V3(0, Math.sin(t * 2.5) * .25, Math.cos(t * 2.5) * .25))); tube(gf, fp, fp.map(() => .012), 4); } ctx.mesh(gf.geo(), 'membrane', 'flagellum', 1.8); }
    if (P.septa) { const sm = []; for (let i = 1; i <= P.septa; i++) { const p = pts[Math.round(i / (P.septa + 1) * n)]; sm.push(place(p, new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), Math.PI / 2))); } ctx.inst(new THREE.CylinderGeometry(Wd * .98, Wd * .98, .08, 20, 1), 'neighbour', 'septum', 1.5, sm); }
    ctx.inside = (p, m) => Math.abs(p.x) < L / 2 && Math.hypot(p.y, p.z) < Wd - (m || 0); ctx.box = new THREE.Box3(new V3(-L / 2, -Wd, -Wd), new V3(L / 2, Wd, 0)); ctx.focus = { pos: new V3(), r: L / 2 };
    ctx.anchor('membrane', new V3(0, Wd * 1.2, 0), ctx.parts.membrane ? ctx.parts.membrane.name : 'Cell membrane', 2.4, Wd * 2);
    nucleiFromSpec(ctx, new V3()); organelles(ctx);
  };

  /* ---------- the frame ---------- */
  Z.build = (F, o) => {
    const S = Z.S[o.spec]; if (!S) return false;
    const L = look();
    F.illo = true; F.cellSpec = S;
    F.scene.background = new THREE.Color(L === 'real' ? MD.BG : 0x0c0510); F.env = { bg: F.scene.background.getHex(), opaque: true };
    if (L !== 'real') { F.add(new THREE.HemisphereLight(0xfff0f5, 0x221133, .65)); const dl = new THREE.DirectionalLight(0xffffff, .95); dl.position.set(10, 14, 12); F.add(dl); const dl2 = new THREE.DirectionalLight(0x99aaff, .35); dl2.position.set(-10, -6, -8); F.add(dl2); }
    /* turn the cut face to the camera that made the frame (a scene spawned at a point), or to the arrival from the skin (the ruler's skin cell) */
    if (F.dynamic && F.parent && cam.A && !F._csTurned) { F._csTurned = true; try { const z = convertD(cam.dir.clone(), cam.A, F.parent).normalize(), u = convertD(cam.up.clone(), cam.A, F.parent).normalize(); const x = new V3().crossVectors(u, z); if (x.lengthSq() > 1e-6) { x.normalize(); const y = new V3().crossVectors(z, x); F.quat.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); } } catch (e) { } }
    const ctx = newCtx(F, S);
    if (!F.dynamic && o.faceN) { const z = new V3().fromArray(o.faceN).normalize(), u = new V3().fromArray(o.faceUp || [0, 1, 0]), x = new V3().crossVectors(u, z).normalize(), y = new V3().crossVectors(z, x); ctx.G.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); }
    try { (SHAPE[S.shape.type] || SHAPE.ellipsoid)(ctx); } catch (e) { console.error('cells: shape failed', S.id, e); }
    F._cells = ctx;
    labels(F, ctx); breaks(F, ctx);
    /* the name, the one-line summary, the card, the note (it begins "Model"), and "About this picture" */
    F.name = S.name; F.blurb = S.blurb; if (typeof NODE !== 'undefined' && S.card && NODE[S.card]) F.info = NODE[S.card];
    F.note = S.note;
    if (L === 'real') { MD.kind(F, 'Model'); MD.stage(F, { near: .75, far: 2.6 }); }
    about(F, ctx);
    /* the DNA anchor (the ruler's DNA stop hangs from the nucleus of the skin cell) */
    const n0 = ctx.nuclei[0]; const nucP = n0 ? n0.c.clone().applyQuaternion(ctx.G.quaternion) : new V3();
    F.v2 = { nucPos: nucP, k: 1, key: 'cell', opts: F.opts }; F.cellNuc = n0 || null;
    /* the next level down from a part: its material, through the table (js/descent.js) */
    F.spawn = (T, hint) => (typeof DESCENT !== 'undefined' && hint && hint.obj) ? DESCENT.spawn(F, T, hint) : null;
    F.spawnD = (S.view && S.view.spawn_m) || 1.2e-6;
    /* the nearest part on the ray wins; the far wall of the cut cell (the cytosol) only where nothing else is */
    F.chooseHit = cands => { let best = null; for (const c of cands) { if (c.pri < 0) continue; if (!best || c.hit.distance < best.hit.distance - 1e-9) best = c; } return best || cands[0] || null; };
    /* details drawn near only (spines, molecules), refreshed when the view moves */
    let tLast = 0; const st = { Dum: 1e9, local: g => g.worldToLocal(F.root.localToWorld(cam.T.clone())) };   // the point looked at, in the coordinates of group g
    const u0 = F.update;
    F.update = function (dt, t) { if (u0) u0.call(this, dt, t); const now = performance.now(); if (now - tLast < 220 || !ctx.near.length) return; tLast = now;
      if (cam.A !== F) { st.Dum = 1e9; } else st.Dum = cam.D / 1e-6;
      F.root.updateMatrixWorld(true); ctx.near.forEach(fn => { try { fn(st); } catch (e) { } }); };
    return true;
  };
  /* names on the parts; each shows once its part is a few pixels across, and stands for the part (a click on it is a click on the part) */
  function labels(F, ctx) {
    const G = ctx.G, _w = new V3(), _e = new V3();
    const px = (o, f) => { const c = f.cam; if (!c) return 1e9; o.getWorldPosition(_w); _e.setFromMatrixPosition(c.matrixWorld); return 1 / Math.max(1e-30, _e.distanceTo(_w)) * H / (2 * Math.tan((c.fov || 50) * Math.PI / 360)); };
    for (const a of ctx.anchors) { const o = new THREE.Object3D(); o.position.copy(a.p); (a.g || G).add(o); o.userData = ctx.ud(a.partId, 2);
      const Lb = F.label(o, a.text, {}); Lb.el.dataset.pri = a.pri; Lb.minSizeFn = f => !a.dimUm || a.dimUm * px(o, f) >= 7; }
  }
  /* a scale break: the cell goes on past what is drawn, and says how far */
  function breaks(F, ctx) { (ctx.breaks || []).forEach(b => { const o = new THREE.Object3D(); o.position.copy(b.p); ctx.G.add(o); const pk = b.partId && F.pickables.find(x => x.userData.part_ === b.partId); if (pk) o.userData = Object.assign({}, pk.userData); const Lb = F.label(o, b.text, { always: true }); Lb.el.dataset.pri = 5; Lb.el.classList.add('cellbreak'); }); }
  /* the panel's "About this picture": the spec's paragraphs with the counts of what was drawn filled in ({drawn.x}, {cell.volume} ...) */
  function about(F, ctx) {
    const S = ctx.S, c = ctx.counts, fmt = x => (typeof x === 'number' ? (x >= 100 ? Math.round(x).toLocaleString('en-GB') : x >= 10 ? x.toFixed(0) : x.toFixed(2).replace(/0$/, '')) : String(x));
    const fill = s => String(s).replace(/\{([a-zA-Z.]+)\}/g, (m, k) => { const v = k.split('.').reduce((o, q) => (o == null ? o : o[q]), { drawn: c, c }); return v == null ? m : fmt(typeof v === 'object' ? (v.basal || 0) + (v.apical || 0) : v); });
    const paras = (S.about || []).map(s => `<p>${fill(s)}</p>`).join('');
    const src = S.sources ? '<p class="mini"><b>Sources.</b> ' + Object.values(S.sources).map(x => x.url ? `<a href="${x.url}" target="_blank" rel="noopener">${x.cite}</a>` : x.cite).join('; ') + '.</p>' : '';
    const el = document.createElement('div'); el.dataset.sec = 'About this picture'; el.dataset.secKey = 'cellsAbout'; el.innerHTML = paras + src; F.uiEls.push(el);
    if (typeof PANEL !== 'undefined' && PANEL.secs && !PANEL.secs.cellsAbout) PANEL.secs.cellsAbout = 'shut';
    F.cellCounts = c;
  }

  /* ---------- the frame type: a spec, else the generic cell as before ---------- */
  const base = FT.cell && FT.cell.build;
  FT.cell = Object.assign({}, FT.cell, { build(F, o) { if (o && o.spec && Z.S[o.spec] && Z.build(F, o)) return; return base.call(this, F, o); } });
  return Z;
})();
/* the specs are loaded with the world; the ruler's "Skin cell" is a keratinocyte of the spinous layer, 47 µm under the surface (under 18 µm
   of dead cells, halfway through the 57 µm of living epidermis of the forearm; data/cells/keratinocyte.json, view.landmark_depth_um) */
WORLD_EXT.push(async FR => {
  await CELLS.load();
  const id = CELLS.specFor({ landmark: 'Skin cell' });
  if (id && FR.cell) { const v = CELLS.S[id].view || {}; FR.cell.opts = Object.assign({}, FR.cell.opts, { spec: id, cname: CELLS.S[id].name, faceN: [0.3194, 0.2555, 0.9125], faceUp: [-0.0844, 0.9668, -0.2412] }); if (v.landmark_depth_um) FR.cell.pos.set(0, -v.landmark_depth_um, 0); FR.cell.radius = v.radius_um || FR.cell.radius; if (FR.cell.built) { FR.cell.dispose(); } }
});
