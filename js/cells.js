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
  /* the arrival distance (m): a compact cell is framed whole, filling about two thirds of the height of the view beside the panel (its half-size from the
     shape's own parameters, times 3.1 at the camera's 50 degrees); a cell that reaches far (a neuron, a fibre, a star of processes) keeps the spec's choice,
     which frames its body. */
  function arriveOf(S) {
    const P = Object.assign({}, defaults(S.shape.type), S.shape), v = S.view || {}; let h = 0;
    if (P.type === 'ellipsoid') h = Math.max(P.a_um, P.b_um, P.c_um) / 2 + (P.pseudopods ? P.pseudopod_um * .7 : 0);
    else if (P.type === 'polyhedron') h = Math.hypot(P.width_um * .55, P.height_um / 2 + (P.apical !== 'none' ? P.apical_um : 0)) * 1.08;
    else if (P.type === 'disc_biconcave') h = P.diameter_um / 2;
    if (!h) return v.arrive_m || 4e-5;
    return h * 3.1e-6;
  }
  Z.frame = (id, T, extra) => {
    const S = Z.S[id], v = S.view || {}, D = arriveOf(S);
    const f = new Frame({ type: 'cell', name: S.name, unit: 1e-6, radius: Math.max(v.radius_um || 16, D * 1e6 * .45), r1: Math.max(v.r1_m || 2.5e-4, D * 4), pos: T.clone(), opts: Object.assign({ type: 'animal', spec: id, cname: S.name }, extra || {}) });
    f.viewD = D; return f;
  };
  Z.arriveOf = id => Z.S[id] ? arriveOf(Z.S[id]) : null;
  Z.open = (id, D) => {
    const P = FR.skin; P.ensure(); const f = Z.frame(id, new V3(60, -30, 0)); f.dynamic = true; f.keep = performance.now() + 6e5; P.addChild(f);
    const A = cam.A, d = cam.dir.clone(), u = cam.up.clone();
    jumpTo(f, new V3(), D || f.viewD);
    if (A) { cam.dir.copy(convertD(d, A, f).normalize()); cam.up.copy(convertD(u, A, f).normalize()); }   // the view keeps its direction, as a flight in would: the cut face is turned to it
    return f;
  };

  /* ---------- colours: a code (the spec names the parts whose colour is real) ---------- */
  const PAL = {
    illo: { membrane: 0xf0b9c9, cytosol: 0x3a1a30, nucleus: 0x9a7ee0, chromatin: 0x6c4fb0, nucleolus: 0x4c3290, mito: 0xf08a5e, er: 0x7fb5dc, nissl: 0x6e93e6, golgi: 0xf0c85a,
      lysosome: 0xb7c06e, vesicle: 0xe7d39a, haemoglobin: 0xd8463c, rbc: 0xe0584a, spectrin: 0xf3c9a6, myofibril: 0xe07a7a, sarcoplasm: 0xc86a72, myelin: 0xf4efe2, axon: 0xf2d36b,
      dendrite: 0xf2c46a, soma: 0xf2c46a, spine: 0xf7d98a, bouton: 0xffe08a, keratin: 0xf0d68e, desmosome: 0x9c6b46, melanin: 0x5a3a22, lamellar: 0xcfe7f0, cell: 0xf2c7a8, neighbour: 0xe8c2a8, lipid: 0xf4d97a, disc: 0x5a2f3a, bile: 0x8fae3e, glycogen: 0xc0587e, dense: 0x3a1f2c, collagen: 0xe9e1cf, dust: 0x2a2624, debris: 0x8a6a4a, wall: 0xd6e3b0, chloroplast: 0x4f9a3a, grana: 0x2f6a28, vacuole: 0xbfe0d8 },
    real: { membrane: 0xd8c9c6, cytosol: 0x4a4c52, nucleus: 0x8e86b5, chromatin: 0x6f6496, nucleolus: 0x5d4d86, mito: 0xcf8a5f, er: 0x8aa2ad, nissl: 0x7d93b8, golgi: 0xc6a55c,
      lysosome: 0xa3a77f, vesicle: 0xd2c7a2, haemoglobin: 0x9c2f2a, rbc: 0xb8433a, spectrin: 0xd9b89a, myofibril: 0xb76b66, sarcoplasm: 0xa45f62, myelin: 0xe9e4d6, axon: 0xcdb48c,
      dendrite: 0xcdb48c, soma: 0xcdb48c, spine: 0xd8c29a, bouton: 0xdcc58e, keratin: 0xd5bd84, desmosome: 0x7d5a40, melanin: 0x4a3222, lamellar: 0xb9cdd3, cell: 0xcdb7a4, neighbour: 0xbfae9e, lipid: 0xe2c46a, disc: 0x4c2a30, bile: 0x7f9a44, glycogen: 0xa45a74, dense: 0x2e2328, collagen: 0xd8d0bf, dust: 0x2b2826, debris: 0x7d644a, wall: 0xb9c49a, chloroplast: 0x3f7a2e, grana: 0x2a5524, vacuole: 0xa9c4bf },
  };
  const look = () => (typeof MD !== 'undefined' && MD.on) ? 'real' : 'illo';
  function colourOf(S, role) { let o = S.colours && S.colours.override && S.colours.override[role]; if (o && typeof o === 'object') o = o[look()];   // an override may differ by look: {illo, real}
  return o !== undefined ? new THREE.Color(o).getHex() : (PAL[look()][role] !== undefined ? PAL[look()][role] : 0xcccccc); }
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
  function tube(gb, P, R, sides, cap0, cap1, fl = 1) {   // fl: the section's depth over its width (1 round, below 1 a flat ribbon)
    const n = P.length; if (n < 2) return;
    const T = P.map((p, i) => new V3().subVectors(P[Math.min(i + 1, n - 1)], P[Math.max(i - 1, 0)]).normalize());
    let N = Math.abs(T[0].y) < .9 ? new V3(0, 1, 0) : new V3(1, 0, 0); N.addScaledVector(T[0], -N.dot(T[0])).normalize();
    const base = gb.vc, B = new V3(), d = new V3();
    for (let i = 0; i < n; i++) {
      if (i > 0) { _q.setFromUnitVectors(T[i - 1], T[i]); N.applyQuaternion(_q); }
      B.crossVectors(T[i], N).normalize(); N.crossVectors(B, T[i]).normalize();
      for (let k = 0; k < sides; k++) { const a = k / sides * TAU; d.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a) * fl); gb.v(_a.copy(P[i]).addScaledVector(d, R[i]), _b.copy(N).multiplyScalar(Math.cos(a) * fl).addScaledVector(B, Math.sin(a)).normalize()); }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, e = b + sides; gb.i.push(a, b, c, b, e, c); }
    if (cap0) { const ap = gb.v(_a.copy(P[0]).addScaledVector(T[0], -R[0] * .8), _b.copy(T[0]).negate()); for (let k = 0; k < sides; k++) gb.i.push(ap, base + (k + 1) % sides, base + k); }
    if (cap1) { const o = base + (n - 1) * sides, ap = gb.v(_a.copy(P[n - 1]).addScaledVector(T[n - 1], R[n - 1] * .8), T[n - 1]); for (let k = 0; k < sides; k++) gb.i.push(ap, o + k, o + (k + 1) % sides); }
  }
  /* cut a closed mesh by the plane z = 0 (G space): keep z <= 0; the cut face, when asked for, is returned as its own geometry (normal +z) */
  function cutZ(geo, wantCap) {
    const pa = geo.attributes.position, na = geo.attributes.normal, ix = geo.index, P = [], N = [], segs = [];
    /* vertices at the same place (a sphere's seam and poles) are one vertex here: an edge on the seam then gives the very same cut point from both its
       triangles; otherwise float rounding split the outline there, and the cut face was filled as two pieces with a sliver between them */
    const canon = new Int32Array(pa.count), seen = new Map(); for (let i = 0; i < pa.count; i++) { const k = Math.round(pa.getX(i) * 1e4) + ',' + Math.round(pa.getY(i) * 1e4) + ',' + Math.round(pa.getZ(i) * 1e4); const j = seen.get(k); if (j === undefined) { seen.set(k, i); canon[i] = i; } else canon[i] = j; }
    const V = i0 => { const i = canon[i0]; return { i, p: new V3().fromBufferAttribute(pa, i), n: na ? new V3().fromBufferAttribute(na, i0) : new V3(0, 0, 1) }; };
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
  /* a sphere to be cut by z = 0: turned a little first, so that no ring of its vertices (its seam) lies in the cutting plane, which left a sliver in the cut face */
  const cutSphere = (R, ws, hs) => new THREE.SphereGeometry(R, ws, hs).rotateX(.37).rotateY(.23);

  /* ---------- the build ---------- */
  function newCtx(F, S) {
    const P = Object.assign({}, defaults(S.shape.type), S.shape);
    const G = new THREE.Group(); F.add(G);
    const ctx = { F, S, P, G, r: rng(hash(S.id)), mats: {}, counts: {}, anchors: [], parts: S.parts || {}, inside: () => false, nuclei: [], focus: { pos: new V3(), r: 10 }, near: [], noCut: false };
    /* the spec's own id for a part the code draws under a common name (a spec may call its mitochondria "mitochondria", its microvilli "brush_border") */
    ctx.pid = id => { if (ctx.parts[id]) return id; for (const a of PART_ALIAS[id] || []) if (ctx.parts[a]) return a; return id; };
    ctx.pname = (id, dflt) => { const p = ctx.parts[ctx.pid(id)] || DEF_PART[ctx.pid(id)]; return (p && p.name) || dflt; };
    ctx.mat = (role, o) => { const k = role + JSON.stringify(o || {}); return ctx.mats[k] || (ctx.mats[k] = makeMat(S, role, o)); };
    /* a pickable part: its card (a node, or the spec's own words), its material for the descent, its priority in a pick */
    ctx.ud = (partId, pri) => {
      partId = ctx.pid(partId);
      const pd = ctx.parts[partId] || DEF_PART[partId] || {}, node = pd.card && typeof NODE !== 'undefined' && NODE[pd.card] ? pd.card : null;
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
  /* a part drawn that the spec does not name (most specs name these; a few leave one out): the words, card and material every cell shares, so a double click
     on it still goes on down */
  const DEF_PART = { golgi: { name: 'Golgi apparatus', card: 'golgi_apparatus', material: 'membrane' }, lysosome: { name: 'Lysosome', card: 'lysosome', material: 'membrane' },
    nucleolus: { name: 'Nucleolus', card: 'nucleus', material: 'rna' }, nucleus: { name: 'Nucleus', card: 'nucleus', material: 'cell_nucleus' }, cytosol: { name: 'Cytosol', card: null, material: 'water' },
    mitochondrion: { name: 'Mitochondrion', card: 'mitochondrion', material: 'mitochondrion' }, membrane: { name: 'Cell membrane', card: 'cell_membrane', material: 'membrane' },
    spine: { name: 'Dendritic spine', card: 'synapse', material: 'membrane' }, neighbour: { name: 'Neighbouring cell', card: null, material: 'membrane' },
    granule: { name: 'Granule', card: null, material: 'protein' }, lamellar_body: { name: 'Lamellar body', card: null, material: 'membrane' },
    keratin: { name: 'Keratin filaments', card: null, material: 'keratin' }, pseudopod: { name: 'Pseudopod', card: null, material: 'membrane' }, spectrin: { name: 'Spectrin network', card: null, material: 'protein' } };
  const PART_ALIAS = { mitochondrion: ['mitochondria'], microvilli: ['microvillus', 'brush_border', 'apical_processes'], process: ['processes'], pseudopod: ['pseudopods'],
    granule: ['granules', 'phagosome'], membrane: ['soma'], intercalated_disc: ['disc'], lipid_droplet: ['droplet'], cilia: ['cilium'] };
  function defaults(type) { const s = Z.shapes && Z.shapes[type], o = {}; if (s) for (const k in s.params) { const p = s.params[k]; o[k] = typeof p[0] === "string" ? p[p.length - 3] : p[2]; } return o; }   // a text parameter lists its allowed values first: its default is the third from the end
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const M4 = () => new THREE.Matrix4();
  const place = (p, q, s) => new THREE.Matrix4().compose(p, q || new THREE.Quaternion(), s || new V3(1, 1, 1));
  const randQ = r => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * TAU, r() * TAU, r() * TAU));
  const qAlong = dir => new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dir.clone().normalize());

  /* a nucleus (ellipsoid with semi-axes ax, cut by the plane when it crosses it): envelope, chromatin face, nucleolus */
  function nucleus(ctx, c, ax, rot, o = {}) {
    const g0 = cutSphere(1, 40, 28);
    if (o.indent) { const a = g0.attributes.position; for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i), z = a.getZ(i); if (x > 0) a.setX(i, x - .55 * x * x * Math.exp(-(y * y + z * z) / .3)); } g0.computeVertexNormals(); }   // a kidney-shaped nucleus: a dent on one side
    g0.scale(ax.x, ax.y, ax.z); if (rot) g0.applyQuaternion(rot); g0.translate(c.x, c.y, c.z);
    const cuts = !ctx.noCut && c.z + Math.max(ax.x, ax.y, ax.z) > 0 && c.z - Math.max(ax.x, ax.y, ax.z) < 0;
    let body = g0, cap = null; if (cuts) { const k = cutZ(g0, true); body = k.body; cap = k.cap; }
    const env = ctx.mesh(body, 'nucleus', 'nucleus', 1.5, { side: THREE.DoubleSide }); ctx.nuclei.push({ c: c.clone(), ax: ax.clone(), rot });
    if (cap) ctx.mesh(cap, 'chromatin', 'nucleus', 1.5, { side: THREE.DoubleSide, rough: .8, kind: 'matte' });
    if (o.nucleoli) for (let k = 0; k < o.nucleoli; k++) { const R = o.nucleolusR || Math.min(ax.x, ax.y) * .22, p = c.clone().add(new V3((ctx.r() - .5) * ax.x * .5, (ctx.r() - .2) * ax.y * .5, cuts ? -R * .2 : (ctx.r() - .5) * ax.z * .4));
      const ng = cutSphere(R, 20, 14); ng.translate(p.x, p.y, p.z); const kk = cuts ? cutZ(ng, true) : { body: ng }; ctx.mesh(kk.body, 'nucleolus', 'nucleolus', 1.7); if (kk.cap) ctx.mesh(kk.cap, 'nucleolus', 'nucleolus', 1.7, { side: THREE.DoubleSide, kind: 'matte' }); ctx.counts.nucleoli = (ctx.counts.nucleoli || 0) + 1; if (k === 0) ctx.anchor('nucleolus', p.clone().add(new V3(0, R, 0)), ctx.parts.nucleolus ? ctx.pname('nucleolus', 'Nucleolus') : 'Nucleolus', 2, R * 2); }
    ctx.anchor('nucleus', c.clone().add(new V3(0, ax.y * .9, -ax.z * .2)), ctx.parts.nucleus ? ctx.pname('nucleus', 'Nucleus') : 'Nucleus', 3, ax.x * 2);
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
      const want = Math.round(mt.volume_fraction.value * cyto / v1), n = Math.min(want, mt.max_drawn || 1500), pts = samplePts(ctx, n, box, Wd, mt.position === 'basal' ? (p => p.y < box.min.y + (box.max.y - box.min.y) * .45) : mt.position === 'apical' ? (p => p.y > box.max.y * .2) : ctx.organOk);
      if (mt.rows_um) pts.forEach(p => { p.x = (Math.round(p.x / mt.rows_um - .5) + .5) * mt.rows_um; });   // in rows between the folds of the base (a kidney tubule cell)
      const rotM = mt.align === 'y' ? () => new THREE.Quaternion().setFromEuler(new THREE.Euler((ctx.r() - .5) * .2, ctx.r() * TAU, (ctx.r() - .5) * .2)) : () => randQ(ctx.r);   // standing upright
      const geo = capsuleGeo(Wd / 2, L - Wd, 10, 5); ctx.inst(geo, 'mito', 'mitochondrion', 1.2, pts.map(p => place(p, rotM())));
      ctx.counts.mitochondria = pts.length; ctx.counts.mitochondriaWanted = want; if (pts[0]) ctx.anchor('mitochondrion', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.parts.mitochondrion ? ctx.pname('mitochondrion', 'Mitochondrion') : 'Mitochondrion', 2.4, L);
    }
    const blob = (key, role, partId, def) => {   // granules of one kind: spheres or ellipsoids, a count, a size, a place
      const o = O[key]; if (!o || !o.count || !o.count.value || (ctx.skipBlob && ctx.skipBlob[key])) return;
      const d = (o.size_um && o.size_um.value) || def, el = o.elongation || 1, n = Math.min(Math.round(o.count.value * V.kept / Math.max(1, V.cell)), o.max_drawn || 800);
      const yMid = (box.min.y + box.max.y) / 2, where = o.position === 'apical_half' ? (p => p.y > yMid + (box.max.y - box.min.y) * .04) : o.position === 'supranuclear' && ctx.nuclei[0] ? (p => { const nu = ctx.nuclei[0]; return p.y > nu.c.y + nu.ax.y * .3 && Math.hypot(p.x - nu.c.x, p.z - nu.c.z) < Math.max(nu.ax.x, nu.ax.z) * 1.25 && p.y < nu.c.y + nu.ax.y + 2.2; }) : o.position === 'apical' ? (p => p.y > box.max.y * .3) : o.position === 'peripheral' ? (p => !ctx.inside(p, d * 4)) : null;
      const pts = samplePts(ctx, n, box, d / 2, where || ctx.organOk);
      const lo = pts.length > 400 || d < .5, geo = new THREE.SphereGeometry(d / 2, lo ? 7 : 10, lo ? 5 : 8), upright = o.axis === 'y'; if (upright) geo.scale(1, el, 1); else geo.scale(el, 1, 1);   // many small granules: fewer facets each (a neutrophil's 1,500 granules); axis y: standing along the cell's height (an RPE cell's melanosomes)
      /* axis layer: lying in the plane of a flat layer, side by side in bundles that each run their own way, a little disordered (a tapetal cell's rodlets) */
      const nrmL = ctx.lid ? new V3(0, 0, 1) : new V3(0, 1, 0), bundleQ = p => { const gx = Math.floor(p.x / 3.5), gy = Math.floor((ctx.lid ? p.y : p.z) / 3.5), h = Math.sin(gx * 127.1 + gy * 311.7) * 43758.5453, ang = (h - Math.floor(h)) * Math.PI + (ctx.r() - .5) * .25;
        return new THREE.Quaternion().setFromAxisAngle(nrmL, ang).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), (ctx.r() - .5) * .15)).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), (ctx.r() - .5) * .12)); };
      ctx.inst(geo, role, partId, 1.3, pts.map(p => place(p, o.axis === 'layer' ? bundleQ(p) : upright ? new THREE.Quaternion().setFromEuler(new THREE.Euler((ctx.r() - .5) * .5, ctx.r() * TAU, (ctx.r() - .5) * .5, 'YXZ')) : randQ(ctx.r)))); ctx.counts[key] = pts.length;
      if (pts.length) ctx.anchor(partId, pts.reduce((a, b) => b.z > a.z ? b : a), ctx.pname(partId, partId.charAt(0).toUpperCase() + partId.slice(1).replace(/_/g, ' ')), 1.8, d);
    };
    blob('lysosomes', 'lysosome', 'lysosome', .5); blob('melanosomes', 'melanin', 'melanosome', .5); blob('lamellar_bodies', 'lamellar', 'lamellar_body', .25);
    blob('granules', 'vesicle', 'granule', .4); blob('lipid_droplets', 'lipid', 'lipid_droplet', 1);
    if (O.golgi && O.golgi.stacks && ctx.nuclei[0]) golgi(ctx, O.golgi.stacks.value || 1);
    if (O.rough_er && O.rough_er.form === 'nissl' && ctx.nuclei[0]) nissl(ctx, O.rough_er);
  }
  function capsuleGeo(r, len, rad, seg) { const pts = []; for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + i / seg * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, -len / 2 + Math.sin(a) * r)); } for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, len / 2 + Math.sin(a) * r)); } pts[0].x = 1e-4; pts[pts.length - 1].x = 1e-4; return new THREE.LatheGeometry(pts, rad); }
  /* stacks of flattened, curved sacs (Golgi) beside the nucleus, on the side away from the cut */
  function golgi(ctx, stacks) {
    const nu = ctx.nuclei[0], mats = [], disc = new THREE.CylinderGeometry(.55, .55, .05, 18, 1); disc.scale(1, 1, .55);
    for (let s = 0; s < stacks; s++) { const a = -0.6 + s * .5, base = nu.c.clone().add(new V3(Math.cos(a) * (nu.ax.x + .9), nu.ax.y * .55 + .3 * s, -Math.abs(Math.sin(a)) * nu.ax.z * .4 - .6));
      const out = base.clone().sub(nu.c).normalize(); for (let k = 0; k < 5; k++) { const p = base.clone().addScaledVector(out, k * .13); if (!ctx.inside(p, .4) || p.z > -.1) continue; mats.push(place(p, qAlong(out), new V3(1 - k * .07, 1, 1 - k * .07))); } }
    const im = ctx.inst(disc, 'golgi', 'golgi', 1.3, mats); if (im && mats.length) { const p = new V3().setFromMatrixPosition(mats[0]); ctx.anchor('golgi', p, ctx.parts.golgi ? ctx.pname('golgi', 'Golgi') : 'Golgi apparatus', 2, 1.2); } ctx.counts.golgiStacks = stacks;
  }
  /* Nissl bodies: clusters of parallel rough-ER sacs studded with ribosomes, in the cell body and the bases of the dendrites, none in the axon hillock */
  function nissl(ctx, o) {
    const n = (o.clusters && o.clusters.value) || 30, box = ctx.box, pts = samplePts(ctx, n, box, .9, ctx.nisslOk);
    const disc = new THREE.CylinderGeometry(.75, .75, .07, 14, 1); disc.scale(1, 1, .6); const mats = [];
    for (const p of pts) { const q = randQ(ctx.r), up = new V3(0, 1, 0).applyQuaternion(q); for (let k = 0; k < 5; k++) mats.push(place(p.clone().addScaledVector(up, (k - 2) * .16), q, new V3(1 - Math.abs(k - 2) * .12, 1, 1 - Math.abs(k - 2) * .1))); }
    ctx.inst(disc, 'nissl', 'nissl', 1.3, mats); ctx.counts.nissl = pts.length; if (pts.length) ctx.anchor('nissl', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.parts.nissl ? ctx.pname('nissl', 'Nissl') : 'Nissl body', 2.2, 1.5);
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
    ctx.anchor('membrane', new V3(-R0 * .55, h(.55) + .05, -R0 * .3), ctx.pname('membrane', 'Membrane'), 3, R0 * 2);
    ctx.anchor('haemoglobin', new V3(R0 * .78, 0, 0), ctx.pname('haemoglobin', 'Haemoglobin'), 3, 1);
    ctx.anchor('spectrin', new V3(-R0 * .2, h(.2) - .04, 0), ctx.pname('spectrin', 'Spectrin'), 1.5, .3);
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
    /* a flat cell (a scale, a squame, a cell of a lining one sheet thick) is cut through its own plane, not across it: lid off, its top half lifted away, so
       the cut face shows the whole cell from above with its nucleus. M maps the cell's own
       coordinates (y its height) into the cut's (z toward the viewer). */
    const lid = P.height_um < P.width_um * .3, M = (x, y, z) => lid ? new V3(x, -z, y) : new V3(x, y, z), Mv = v => M(v.x, v.y, v.z);
    const planes = [];
    for (let i = 0; i < n; i++) { const a = (i + .5 + (r() - .5) * P.irregularity) / n * TAU, nn = new V3(Math.cos(a), tilt, Math.sin(a)).normalize(); planes.push({ n: nn, d: hw * (1 + (r() - .5) * P.irregularity) * nn.dot(new V3(Math.cos(a), 0, Math.sin(a))) }); }
    planes.push({ n: new V3(0, 1, 0).applyAxisAngle(new V3(1, 0, 0), (r() - .5) * P.irregularity * .5), d: hh }); planes.push({ n: new V3(0, -1, 0).applyAxisAngle(new V3(0, 0, 1), (r() - .5) * P.irregularity * .5), d: hh });
    const planes0 = planes.map(pl => ({ n: pl.n.clone(), d: pl.d }));   // in the cell's own frame: the shell is built there, its poles on the faces, then turned
    if (lid) planes.forEach(pl => { pl.n = Mv(pl.n); });
    const k = 1 / Math.max(.05, P.round_um);
    const radOf = PL => d => { let s = 0; for (const pl of PL) { const c = pl.n.dot(d); if (c > 1e-4) s += Math.exp(-k * pl.d / c); } return -Math.log(Math.max(s, 1e-300)) / k; }, rad = radOf(planes), rad0 = radOf(planes0);
    ctx.inside = (p, m) => { m = m || 0; for (const pl of planes) if (pl.n.dot(p) > pl.d - P.round_um * .6 - m) return false; return true; };
    const shell = starGeo(d => { const t = rad0(d); return new V3(t, t, t); }, lid ? 96 : 64, lid ? 64 : 44); if (lid) shell.rotateX(Math.PI / 2);   // (x, y, z) -> (x, -z, y), as M
    const km = (ctx.S.special || []).find(s => s.kind === 'keratin_matrix');   // a dead scale packed solid with keratin: its cut face is that filling
    const k2 = cutZ(shell.clone(), !!km);
    ctx.mesh(k2.body, 'cell', 'membrane', .6, { side: THREE.FrontSide, kind: 'wet' }); cytosolBack(ctx, k2.body);
    if (km && k2.cap) keratinFill(ctx, k2.cap, km, P.width_um);
    if (lid && P.neighbours && km) stack(ctx, shell, km);
    /* a flat cell whose top face matters (ridges on a corneal surface cell): the lid is lifted off only the right half, so the left half shows the top */
    if (lid && P.half_lid) { const g = shell.clone(); g.rotateY(Math.PI); const t = cutZ(g, false).body; t.rotateY(Math.PI); t.rotateY(-Math.PI / 2); const h = cutZ(t, false).body; h.rotateY(Math.PI / 2);
      ctx.mesh(h, 'cell', 'membrane', .6, { side: THREE.FrontSide, kind: 'wet' }); ctx.halfLid = true; }
    shell.dispose();
    ctx.box = lid ? new THREE.Box3(new V3(-hw * 1.3, -hw * 1.3, -hh * 1.1), new V3(hw * 1.3, hw * 1.3, 0)) : new THREE.Box3(new V3(-hw * 1.3, -hh * 1.1, -hw * 1.3), new V3(hw * 1.3, hh * 1.1, 0));
    ctx.focus = { pos: new V3(), r: Math.max(hw, hh) };
    ctx.anchor('membrane', M(-hw * .7, hh * .9, -hw * .35), ctx.pname('membrane', 'Cell membrane'), 2.6, P.width_um);
    ctx.planes = planes; ctx.rad = rad; ctx.ext = lid ? new V3(P.width_um, P.width_um, P.height_um) : new V3(P.width_um, P.height_um, P.width_um); ctx.lid = lid;
    /* the nucleus (or nuclei) from the spec: volume share and shape; low in a column when it is basal, high when apical */
    ctx.nucAt = (pos, ax) => { const ay = lid ? ax.z : ax.y, m = Math.min(1.2, P.height_um * .08) + P.round_um * .5; const y = /basal/.test(pos) ? Math.min(0, -hh + ay + m) : /apical/.test(pos) ? Math.max(0, hh - ay - m) : lid ? 0 : -hh * .05; return M(0, y, 0); };
    const plant = (ctx.S.special || []).find(x => x.kind === 'plant_cell');
    if (plant) { const c = (plant.params || {}).cytoplasm_um || 2; ctx.inVacuole = p => p.length() < ctx.rad(p.clone().normalize()) - c - P.round_um * .3; ctx.organOk = p => !ctx.inVacuole(p); ctx.plantLayer = c;
      ctx.nucAt = (pos, ax) => M(-(hw - P.round_um * .4 - ax.x * .85), hh * .1, 0); }
    nucleiFromSpec(ctx, M(0, lid ? 0 : -hh * .05, 0));
    organelles(ctx);
    if (!lid) apicalFringe(ctx);
    /* desmosomes: plaques on the surface; keratin bundles run in from them and round the nucleus */
    if (P.desmosomes) desmosomes(ctx, P.desmosomes, !!km);
    if (P.neighbours && !lid) neighbours(ctx, shell);   // a flat cell's neighbours would lie in the plane of its cut, over the edges of the view
    if (lid) ctx.counts.cutFlat = 1;
  };
  /* the nucleus (or nuclei) a spec asks for. Its axes: size_um (a {value} or a bare list), else its volume share and the shape word. The axes follow the
     cell's form (the longest along the cell's longest extent: standing in a column, lying in a flat cell, along a spindle); its place: position
     (basal, apical, central; a shape may say where those are, ctx.nucAt). Shapes: round, oval, flat, elongated (cigar), indented (kidney), lobed (lobes: n,
     the lobes joined by thin strands: one nucleus, as in a neutrophil). */
  function nucAxes(ctx, nu, vol) {
    const sv = nu.size_um && (Array.isArray(nu.size_um) ? nu.size_um : nu.size_um.value);
    if (Array.isArray(sv)) return new V3(sv[0] / 2, sv[1] / 2, sv[2] / 2);
    const fr = nu.volume_fraction ? nu.volume_fraction.value : .1, v = vol.cell * fr / nu.count, rr = Math.cbrt(v * 3 / (4 * Math.PI)), s = String(nu.shape || 'round');
    const e = /lob/.test(s) ? [1, 1, 1] : /oval|indent|kidney|bean/.test(s) ? [1.15, .8, 1.05] : /flat/.test(s) ? [1.3, .55, 1.3] : /elong|cigar|rod/.test(s) ? [1.8, .6, .9] : [1, 1, 1];
    const k = Math.cbrt(1 / (e[0] * e[1] * e[2])); return new V3(rr * e[0] * k, rr * e[1] * k, rr * e[2] * k);
  }
  function nucOrient(ctx, ax) {
    const E = ctx.ext; if (!E) return ax; const ev = [E.x, E.y, E.z], mx = Math.max(...ev), mn = Math.min(...ev); if (mx / mn < 1.15) return ax;
    const a = [ax.x, ax.y, ax.z].sort((p, q) => p - q), ord = [0, 1, 2].sort((p, q) => ev[p] - ev[q]), o = [0, 0, 0]; ord.forEach((ci, k) => { o[ci] = a[k]; });
    return new V3(o[0], o[1], o[2]);
  }
  function nucleiFromSpec(ctx, c0) {
    const nu = ctx.S.nucleus || {}; if (!nu.count) return;
    const vol = ctx.vol || (ctx.vol = volumes(ctx, ctx.box)); ctx.counts.cellVolume = vol.cell;
    const shape = String(nu.shape || 'round'), lobes = /lob/.test(shape) ? Math.max(2, nu.lobes || 3) : 0;
    let ax = nucOrient(ctx, nucAxes(ctx, nu, vol));
    const c1 = ctx.nucAt ? ctx.nucAt(String(nu.position || 'central'), ax) : c0;
    for (let i = 0; i < nu.count; i++) {
      const c = c1.clone().add(new V3(nu.count > 1 ? (i - (nu.count - 1) / 2) * ax.x * 2.3 : 0, 0, 0));
      if (lobes) lobedNucleus(ctx, c, ax, lobes); else nucleus(ctx, c, ax, null, { nucleoli: nu.nucleoli === undefined ? 1 : nu.nucleoli, indent: /indent|kidney|bean/.test(shape) });
    }
    ctx.counts.nuclei = nu.count; if (lobes) ctx.counts.lobes = lobes;
    ctx.counts.nucFraction = nu.count * 4 / 3 * Math.PI * ax.x * ax.y * ax.z / vol.cell;
  }
  /* a nucleus of several lobes (a neutrophil): sausage-shaped lobes in a curved chain, joined end to end by thin strands of chromatin, the whole drawn as one
     tube whose radius swells into each lobe and narrows to the strand between. Its volume is the spec's (the measured share of the cell); the lobes' length
     over thickness and the strands' 0.4 µm are illustrative. The chain lies just behind the cut, whole, so every lobe and strand is seen. */
  function lobedNucleus(ctx, c, ax, n) {
    const V = 4 / 3 * Math.PI * ax.x * ax.y * ax.z, Vl = V / n, E = ctx.ext || new V3(ax.x * 2, ax.y * 2, ax.z * 2), Rc = Math.min(E.x, E.y, E.z);
    const gap = .6, rb = .2, nuS = ctx.S.nucleus || {};
    /* the lobe's radius rl (the spec's lobe_um, else from a compact shape) and its end-to-end length 2 k rl, from its volume (a cylinder of length 2 rl (k - 1) with
       two half-sphere ends) */
    const rl = nuS.lobe_um ? nuS.lobe_um / 2 : Math.cbrt(Vl / (Math.PI * (2 * .25 + 4 / 3))), k = Math.max(1, (Vl - 4 / 3 * Math.PI * rl ** 3) / (Math.PI * rl * rl) / (2 * rl) + 1);
    const len = 2 * k * rl, Ltot = n * len + (n - 1) * gap, rho = Math.max(rl, Rc - rl - .2), sweep = Ltot / rho, a0 = Math.PI * .5 - sweep / 2 + Math.PI, zc = -rl - .15;   // a C round the middle of the cell, its gap at the top
    const zOf = s => sweep > 1.85 * Math.PI ? (s / Ltot - .5) * (sweep - 1.85 * Math.PI) / (.15 * Math.PI) * -1.2 : 0;   // a C too long to close flat: its ends pass one behind the other
    const radAt = s => { for (let i = 0; i < n; i++) { const s0 = i * (len + gap), s1 = s0 + len; if (s >= s0 - 1e-6 && s <= s1 + 1e-6) { const u = Math.min(s - s0, s1 - s), q = Math.max(0, rl - u) / rl; return Math.max(rb, rl * Math.sqrt(Math.max(0, 1 - q * q))); } } return rb; };
    const pts = [], rs = [], N = 260; for (let i = 0; i <= N; i++) { const s = i / N * Ltot, t = a0 + s / rho; pts.push(new V3(Math.cos(t) * rho, Math.sin(t) * rho * .96, zc + zOf(s) + .15 * Math.sin(s / Ltot * Math.PI * n))); rs.push(i === 0 || i === N ? .02 : radAt(s)); }
    const gb = new GB(); tube(gb, pts, rs, 18, true, true); const g = gb.geo();
    const kk = !ctx.noCut ? cutZ(g, true) : { body: g }; ctx.mesh(kk.body, 'nucleus', 'nucleus', 1.5, { side: THREE.DoubleSide }); if (kk.cap) ctx.mesh(kk.cap, 'chromatin', 'nucleus', 1.5, { side: THREE.DoubleSide, rough: .8, kind: 'matte' });
    for (let i = 0; i <= N; i += 6) if (rs[i] > .3) ctx.nuclei.push({ c: pts[i].clone(), ax: new V3(rs[i], rs[i], rs[i]).multiplyScalar(1.05), rot: null });
    const mid0 = pts[Math.round(N * len / 2 / Ltot)];
    ctx.anchor('nucleus', mid0.clone().add(new V3(0, rl * .9, rl * .5)), ctx.pname('nucleus', 'Nucleus'), 3, rl * 2);
    const sb = pts[Math.round(N * (len + gap / 2) / Ltot)]; ctx.anchor('nucleus', sb.clone().add(new V3(0, 0, .3)), 'Strand joining two lobes', 2.2, rb * 2);
    ctx.counts.lobeThick = rl * 2; ctx.counts.lobeLength = len; ctx.counts.strand = rb * 2;
  }
  /* what stands on the top face of an epithelial cell: microvilli (a brush border), cilia or stereocilia, at their true width and length, close-packed over the
     flat of the top face (the number from the spec's microvilli or brush_border entry when it gives one) */
  function apicalFringe(ctx) {
    const P = ctx.P, kind = P.apical; if (!kind || kind === 'none' || !(P.apical_um > 0)) return;
    const sp = (ctx.S.special || []).find(s => /microvill|brush|cilia|stereocil|apical_process/.test(s.kind)) || {}, pr = sp.params || {};
    const d = pr.diameter_um || pr.width_um || (kind === 'cilia' ? .25 : kind === 'stereocilia' ? .3 : .1), L = P.apical_um, hw = P.width_um / 2, hh = P.height_um / 2;
    const top = ctx.planes[ctx.planes.length - 2], area = P.sides * hw * hw * Math.tan(Math.PI / P.sides);
    let s = kind === 'cilia' ? d * 2.2 : d * 1.9; if (pr.count > 0) s = Math.max(d * 1.15, Math.sqrt(area * 2 / Math.sqrt(3) / pr.count));
    const nMax = 7000, mats = [], up = new V3(0, 1, 0), r = ctx.r, edge = Math.max(P.round_um * 1.1, s);
    const bl = (ctx.S.special || []).find(x => x.kind === 'apical_bleb'), blR = bl ? ((bl.params || {}).diameter_um || P.width_um * .55) / 2 : 0;   // none where a bleb is swelling out
    for (let j = 0, z = -hw * 1.3; z < 0 && mats.length < nMax; z += s * .866, j++) for (let x = -hw * 1.3 + (j % 2) * s * .5; x < hw * 1.3 && mats.length < nMax; x += s) {
      const px = x + (r() - .5) * s * .25, pz = z + (r() - .5) * s * .25; if (pz > -d * .6 || Math.hypot(px, pz) < blR) continue;
      const y = (top.d - top.n.x * px - top.n.z * pz) / top.n.y; if (!ctx.inside(new V3(px, y - edge - P.round_um - .05, pz), edge)) continue;
      const len = L * (kind === 'stereocilia' ? .6 + .4 * Math.max(0, -x / hw) : .94 + r() * .12), q = new THREE.Quaternion().setFromUnitVectors(up, new V3((r() - .5) * .08, 1, (r() - .5) * .08).normalize());
      const dv = new V3(px, y, pz).normalize(), base = dv.multiplyScalar(ctx.rad(dv) - .04);   // rooted on the drawn (rounded) surface, not on the ideal plane above it
      mats.push(place(base, q, new V3(1, len + .04, 1)));
    }
    if (!mats.length) return;
    const geo = capsuleGeo(d / 2, 1, 7, 2); geo.translate(0, .5, 0);   // unit length: scaled by each instance; the rounded tip stretches with it, a small error at this size
    const part = kind === 'cilia' ? 'cilia' : 'microvilli';
    ctx.inst(geo, 'cell', part, 1.4, mats, pr.film ? { film: look() === 'real' ? [.22, .6] : [.3, .7], kind: 'wet' } : { kind: 'wet' });   // film: see-through, so what they carry shows (an RPE cell's processes)
    ctx.counts.apical = mats.length; ctx.counts.apicalWanted = pr.count || null;
    /* melanosomes carried up into the processes (an RPE cell): a share of the processes each hold one, low in it, standing along it */
    const mo = (ctx.S.organelles || {}).melanosomes; if (mo && mo.in_processes > 0) { const md = (mo.size_um && mo.size_um.value) || .5, el = mo.elongation || 1, mm = [], r = ctx.r;
      for (let i = 0; i < mats.length && mm.length < mo.in_processes; i += Math.max(1, Math.floor(mats.length / mo.in_processes))) { const b = new V3().setFromMatrixPosition(mats[i]); mm.push(place(b.add(new V3(0, md * el * .5 + .2 + r() * L * .35, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - .5) * .12, r() * TAU, (r() - .5) * .12)))); }
      const g = new THREE.SphereGeometry(md / 2, 10, 8); g.scale(1, el, 1); ctx.inst(g, 'melanin', 'melanosome', 1.5, mm); ctx.counts.melanosomesInProcesses = mm.length; }
    const m = new V3().setFromMatrixPosition(mats[Math.floor(mats.length * .8)]); ctx.anchor(part, m.add(new V3(0, L, 0)), ctx.pname(part, kind === 'cilia' ? 'Cilia' : 'Microvilli'), 2.3, L);
  }
  function desmosomes(ctx, n, noBundles) {
    const r = ctx.r, mats = [], plaque = new THREE.CylinderGeometry(.22, .22, .06, 10, 1), Ks = [];
    const sph = new V3(); for (let t = 0; t < n * 8 && mats.length < n; t++) {
      sph.set(gauss(r), gauss(r), gauss(r)).normalize(); if (sph.z > -.02) continue; const R = ctx.rad(sph); const p = sph.clone().multiplyScalar(R + .01);
      // the outward normal of the surface there, from the nearby radii
      const e = .02, ta = new V3().crossVectors(sph, new V3(0, 1, 0)).normalize(); if (ta.lengthSq() < .1) continue; const tb = new V3().crossVectors(sph, ta);
      const p1 = sph.clone().addScaledVector(ta, e).normalize(), p2 = sph.clone().addScaledVector(tb, e).normalize();
      const A = p1.multiplyScalar(ctx.rad(p1)).sub(p), B = p2.multiplyScalar(ctx.rad(p2)).sub(p), nrm = new V3().crossVectors(A, B).normalize(); if (nrm.dot(sph) < 0) nrm.negate();
      if (ctx.lid && Math.abs(nrm.z) > .45) continue;   // a flat cell is joined to its neighbours at its edges, not on its faces
      mats.push(place(p, qAlong(nrm))); Ks.push({ p, nrm });
    }
    ctx.inst(plaque, 'desmosome', 'desmosome', 2, mats); ctx.counts.desmosomes = mats.length;
    if (Ks.length) { const best = Ks.reduce((a, b) => (b.p.y - b.p.z * .2 > a.p.y - a.p.z * .2 ? b : a)); ctx.anchor('desmosome', best.p, ctx.parts.desmosome ? ctx.pname('desmosome', 'Desmosome') : 'Desmosome', 2.2, .5); }
    /* keratin filament bundles: from a share of the desmosomes inwards, curving round the nucleus to another (tonofilaments) */
    const kb = ctx.S.special && ctx.S.special.find(s => s.kind === 'keratin_bundles'); if (!kb || !ctx.nuclei[0] || noBundles) return;
    /* each bundle runs in from one desmosome's plaque, turns round the nucleus (a basket round it) and out to another plaque some way round the cell */
    const nu = ctx.nuclei[0], gb = new GB(), nb = Math.min(kb.params.bundles, Ks.length), wid = kb.params.drawn_um / 2, rr = rng(hash(ctx.S.id) + 17);
    const need = Math.max(nu.ax.x, nu.ax.y, nu.ax.z) + Math.max(.6, wid * 3), dirOf = p => { const d = p.clone().sub(nu.c); d.z = Math.min(d.z, -.15 * d.length()); return d.normalize(); };
    let drawn = 0;
    for (let i = 0; i < nb * 4 && drawn < nb; i++) {
      const a = Ks[Math.floor(rr() * Ks.length)]; let b = null;
      for (let t = 0; t < 20; t++) { const c = Ks[Math.floor(rr() * Ks.length)], ang = dirOf(a.p).angleTo(dirOf(c.p)); if (c !== a && ang > .9 && ang < 2.4) { b = c; break; } } if (!b) continue;
      const pa = a.p.clone().addScaledVector(a.nrm, -.12), pb = b.p.clone().addScaledVector(b.nrm, -.12), da = dirOf(pa), db = dirOf(pb), ang = da.angleTo(db), ax = new V3().crossVectors(da, db).normalize();
      const R = need * (1 + .25 * rr()), ctl = [pa, pa.clone().lerp(nu.c.clone().addScaledVector(da, R), .55)];
      for (let k = 0; k <= 6; k++) { const d = da.clone().applyAxisAngle(ax, ang * k / 6); const q = nu.c.clone().addScaledVector(d, R * (1 + .08 * Math.sin(k * 1.3))); q.z = Math.min(q.z, -wid * 2.5); ctl.push(q); }
      ctl.push(pb.clone().lerp(nu.c.clone().addScaledVector(db, R), .55), pb);
      /* long legs (a flat cell's, from its far edge in to the nucleus) wander a little, as bundles do, instead of running as straight chords */
      for (let k = ctl.length - 1; k > 0; k--) { const u = ctl[k - 1], v = ctl[k], L = u.distanceTo(v); if (L < 4) continue; const side = new V3().crossVectors(v.clone().sub(u), new V3(0, 0, 1)).normalize();
        const m1 = u.clone().lerp(v, .35).addScaledVector(side, L * .07 * (rr() - .5) * 2), m2 = u.clone().lerp(v, .7).addScaledVector(side, L * .07 * (rr() - .5) * 2); ctl.splice(k, 0, m1, m2); }
      const curve = new THREE.CatmullRomCurve3(ctl, false, 'centripetal'); let run = [], any = false;
      const flush = () => { if (run.length >= 4) { tube(gb, run, run.map(() => wid), 5, true, true); any = true; } run = []; };
      for (const p of curve.getPoints(70)) { if (ctx.inside(p, wid * .5) && p.z < -wid * 1.6 && !inNucleus(ctx, p, wid * 1.5)) run.push(p); else flush(); } flush();   // a bundle passes round the nucleus, never through it, stays inside the cell and behind the cut
      if (any) drawn++;
    }
    if (gb.vc) { const kp = kb.part || 'keratin'; ctx.mesh(gb.geo(), 'keratin', kp, 1.6); const p = Ks[0].p.clone().lerp(nu.c, .35); ctx.anchor(kp, p, ctx.parts[kp] ? ctx.pname(kp, 'Keratin') : 'Keratin filaments', 2.3, .6); ctx.counts.keratinBundles = drawn; }
  }
  /* the keratin that fills a dead scale, on its cut face: a felt of filaments in a matrix (a texture; each drawn strand stands for many 8 to 10 nm filaments) */
  function keratinFill(ctx, cap, km, w) {
    const pa = cap.attributes.position, uv = new Float32Array(pa.count * 2), rep = w / ((km.params && km.params.texture_um) || 6); for (let i = 0; i < pa.count; i++) { uv[2 * i] = pa.getX(i) / w * rep; uv[2 * i + 1] = pa.getY(i) / w * rep; } cap.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const tex = canvasTex('cellsKeratinFelt', 512, 512, (g, W, H) => { g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, W, H); const r = rng(5); g.lineCap = 'round';
      for (let i = 0; i < 1400; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 20 + r() * 50, bend = (r() - .5) * 30, l = 150 + Math.floor(r() * 105); g.strokeStyle = `rgba(${l},${l},${l},.55)`; g.lineWidth = 1.5 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L / 2 - Math.sin(a) * bend, y + Math.sin(a) * L / 2 + Math.cos(a) * bend, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
        for (const dx of [-W, W]) { if ((dx < 0 && x + L > W) || (dx > 0 && x < L)) { g.beginPath(); g.moveTo(x + dx, y); g.lineTo(x + dx + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); } } } }, { wrap: true });
    const m = ctx.mesh(cap, 'keratin', 'keratin', 1.2, { side: THREE.DoubleSide, kind: 'matte', rough: .85, glow: .12, extra: { map: tex } });
    ctx.anchor('keratin', new V3(w * .12, -w * .1, 0), ctx.pname('keratin', 'Keratin'), 2.6, w * .3); ctx.counts.keratinFill = 1; return m;
  }
  /* a flat cell's stack: the scales below it in their layer, overlapping it, faint (the one cut open lies on top) */
  function stack(ctx, shell, km) {
    const P = ctx.P, w = P.width_um, h = P.height_um, gb = [];
    for (const [x, y, k] of [[.36, -.22, 1], [-.3, .28, 2], [.05, .42, 3]]) { const g = shell.clone(); g.translate(x * w, y * w, -k * (h + .25)); gb.push([g]); }
    const mesh = new THREE.Mesh(MDC.merge(gb), ctx.mat(km ? 'keratin' : 'neighbour', { film: look() === 'real' ? [.25, .6] : [.2, .55], kind: 'wet' })); mesh.matrixAutoUpdate = false; mesh.renderOrder = 2; ctx.G.add(mesh); ctx.tag(mesh, 'neighbour', -.2);
    ctx.anchor('neighbour', new V3(.36 * w + w * .3, -.22 * w - w * .2, -(h + .25)), ctx.pname('neighbour', 'Neighbouring cell'), 1.8, w); ctx.counts.stacked = 3;
  }
  /* the cells round it, behind the cut, faint: it is one of a layer */
  function neighbours(ctx, shell) {
    const P = ctx.P, w = P.width_um, gb = [];
    const offs = ctx.lid ? [[.87, .5, 0], [-.87, .5, 0], [0, -1, 0], [.87, -.5, 0]] : [[.87, 0, -.5], [-.87, 0, -.5], [0, 0, -1]];   // the cells behind it in its layer (beside it, for a flat cell cut through its plane)
    const m = ctx.mat('neighbour', { film: look() === 'real' ? [.07, .45] : [.03, .32], kind: 'wet' });
    for (const [x, y, z] of offs) { const g = shell.clone ? null : null; void g; const s = starGeo(d => { const t = ctx.rad(d) * .98; return new V3(t, t, t); }, 32, 22); s.translate(x * w * 1.02, y * (ctx.lid ? w : P.height_um) * 1.02, z * w * 1.02); const k = cutZ(s, false); gb.push([k.body]); }
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
    const inner = new THREE.Mesh(cyl(Ri, Math.round(L / 3), 64), striate(ctx.mat('sarcoplasm', { kind: look() === 'real' ? 'matte' : 'wet', rough: .82 }), sarc, thick, thin, .55)); inner.matrixAutoUpdate = false; ctx.G.add(inner); ctx.tag(inner, 'myofibril', .5);
    /* the membrane (sarcolemma): see-through, so the banding and the nuclei under it show */
    const sleeve = () => ctx.mat('sarcoplasm', { film: look() === 'real' ? [.03, .2] : [.06, .3], kind: 'matte', rough: .85, glow: .02 });   // a thin clear film in the muscle's own tone, so the banding under it shows and it never reads as a glossy pipe
    ctx.sleeve = sleeve;
    const sl = new THREE.Mesh(cyl(R, Math.round(L / 6), 64), sleeve()); sl.matrixAutoUpdate = false; sl.renderOrder = 3; ctx.G.add(sl); ctx.tag(sl, 'sarcolemma', .3);
    /* the window's floor: the cut face, a bed of myofibrils lying lengthwise, one row deep, banded */
    const md = P.myofibril_um, step = md * 1.12, rows = Math.floor(2 * Ri / step), mats = [];
    /* a central nucleus (cardiac): the myofibrils part round it, leaving the clear zone beside it */
    const nuS = ctx.S.nucleus || {}, central = P.nucleus_position === 'central', nsz0 = (nuS.size_um && (Array.isArray(nuS.size_um) ? nuS.size_um : nuS.size_um.value)) || [10, 4, 2];
    const nCent = central ? Math.max(1, Math.round((nuS.per_mm ? nuS.per_mm.value : P.nuclei_per_mm) * L / 1000)) : 0, nucX = []; for (let i = 0; i < nCent; i++) nucX.push(nCent === 1 ? -W * .12 : -W * .3 + i * W * .6 / Math.max(1, nCent - 1));
    const qx = new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), Math.PI / 2);
    for (let j = 0; j < rows; j++) { const y = -Ri + step / 2 + j * step, zz = -md * .15; if (Math.abs(y) > Ri - md * .6) continue;
      let segs = [[-W / 2, W / 2]];
      for (const x0 of nucX) if (Math.abs(y) < nsz0[1] / 2 + md * .9) { const g0 = x0 - nsz0[0] / 2 - 2, g1 = x0 + nsz0[0] / 2 + 2; segs = segs.flatMap(([u, v]) => [[u, Math.min(v, g0)], [Math.max(u, g1), v]]).filter(([u, v]) => v - u > .5); }
      for (const [u, v] of segs) mats.push(place(new V3((u + v) / 2, y, zz), qx, new V3(1, v - u, 1))); }
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
    if (!P.branched) { disc(-L / 2, false, new V3(-1, 0, 0)); disc(L / 2, false, new V3(1, 0, 0)); }
    disc(-W / 2, true, new V3(1, 0, 0)); disc(W / 2, true, new V3(-1, 0, 0));
    const eg = endG.geo(); const uv = new Float32Array(eg.attributes.position.count * 2); for (let i = 0; i < eg.attributes.position.count; i++) { uv[2 * i] = eg.attributes.position.getY(i) / (2 * Ri) + .5; uv[2 * i + 1] = eg.attributes.position.getZ(i) / (2 * Ri) + .5; } eg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const ends = new THREE.Mesh(eg, endMat); ends.matrixAutoUpdate = false; ctx.G.add(ends); ctx.tag(ends, 'myofibril', .6);
    /* nuclei, under the membrane, flattened against it: count from the measured number per mm */
    const nu = ctx.S.nucleus || {}, per = nu.per_mm ? nu.per_mm.value : P.nuclei_per_mm, nN = central ? 0 : Math.round(per * L / 1000), sz = nsz0;
    if (central) { ctx.noCut = false; for (const x0 of nucX) nucleus(ctx, new V3(x0, 0, -md * .3), new V3(sz[0] / 2, sz[1] / 2, sz[2] / 2), null, { nucleoli: nu.nucleoli === undefined ? 1 : nu.nucleoli }); ctx.noCut = true; ctx.counts.nuclei = nucX.length; ctx.counts.nucleiWanted = nucX.length; }
    const ng = new THREE.SphereGeometry(1, 20, 12); ng.scale(sz[0] / 2, sz[2] / 2, sz[1] / 2); const nm = [];
    for (let i = 0; i < nN; i++) { const x = -L / 2 + sz[0] + r() * (L - 2 * sz[0]), t = r() * TAU, nn = new V3(0, Math.cos(t), Math.sin(t)); if (inWin(x, nn.z) || (Math.abs(x) < W / 2 + sz[0] / 2 && nn.z > -.15)) continue;
      const p = new V3(x, 0, 0).addScaledVector(nn, R - sz[2] / 2 - .25); nm.push(place(p, new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), nn))); }
    if (!central) { ctx.inst(ng, 'nucleus', 'nucleus', 1.6, nm); ctx.counts.nuclei = nm.length; ctx.counts.nucleiWanted = nN; }
    const vis = nm.map(m => new V3().setFromMatrixPosition(m)).filter(p => Math.abs(p.x) < W * .9 && p.y > R * .3).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
    if (vis && !central) ctx.anchor('nucleus', vis, ctx.pname('nucleus', 'Nucleus'), 3, sz[0]);
    /* mitochondria between the myofibrils of the window floor (volume share from the spec; their placement is a choice) */
    const mt = ctx.S.organelles && ctx.S.organelles.mitochondria;
    if (mt) { const ms = mt.size_um || [1, .3], v1 = Math.PI * (ms[1] / 2) ** 2 * ms[0], slab = 2 * Ri * W * md, want = Math.round(mt.volume_fraction.value * slab / v1), n = Math.min(want, mt.max_drawn || 1500), mm = [];
      for (let i = 0; i < n; i++) { const j = Math.floor(r() * (mats.length - 1)), y0 = new V3().setFromMatrixPosition(mats[j]).y + step / 2, x = (r() - .5) * W * .98; if (nucX.some(x0 => Math.abs(x - x0) < sz[0] / 2 + 1.2 && Math.abs(y0) < sz[1] / 2 + .6)) continue; mm.push(place(new V3(x, y0, md * .05), new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), (r() - .5) * .8), new V3(1, 1, 1))); }
      const mg = capsuleGeo(ms[1] / 2, Math.max(.01, ms[0] - ms[1]), 6, 2); ctx.inst(mg, 'mito', 'mitochondrion', 1.8, mm); ctx.counts.mitochondria = mm.length; ctx.counts.mitochondriaWanted = want;
      if (mm[0]) ctx.anchor('mitochondrion', new V3().setFromMatrixPosition(mm[Math.floor(mm.length / 3)]), ctx.pname('mitochondrion', 'Mitochondrion'), 2.4, ms[0]); }
    ctx.anchor('myofibril', new V3(-W * .25, Ri * .35, md * .4), ctx.pname('myofibril', 'Myofibril'), 3, md * 3);
    const z0 = Math.round(W * .18 / sarc) * sarc; ctx.anchor('sarcomere', new V3(z0 + sarc / 2, -Ri * .2, md * .5), ctx.parts.sarcomere ? ctx.pname('sarcomere', 'Sarcomere') : 'Sarcomere', 2.6, sarc);
    ctx.anchor('sarcolemma', new V3(W * .5 + 12, R * .7, R * .7), ctx.pname('sarcolemma', 'Sarcolemma'), 2.5, R);
    if (ctx.S.view && ctx.S.view.break) { const b = ctx.S.view.break; ctx.breaks = [{ p: new V3(L / 2, R * 1.1, 0), text: b.text }, { p: new V3(-L / 2, R * 1.1, 0), text: b.text_short || b.text }]; }
    if (P.branched) branchedEnds(ctx, R, Ri, L, sarc, thick, thin);
    ctx.focus = { pos: new V3(), r: W / 2 };
    ctx.inside = (p, m) => Math.abs(p.x) < L / 2 && Math.hypot(p.y, p.z) < R - (m || 0);
    ctx.counts.window = W; ctx.counts.drawnLength = L;
  };

  /* the ends of a branched striated cell (a heart muscle cell): it forks near one end, and each end is an intercalated disc, a stepped dark junction where
     the next cell begins (a stub of each neighbour is drawn, faint). The steps are the disc's runs across the fibre and along it; their size is illustrative. */
  function branchedEnds(ctx, R, Ri, L, sarc, thick, thin) {
    const G = ctx.G, rr = ctx.r, discs = [];
    const piece = (len, rad, cap0, cap1) => { const gb = new GB(); const nt = 48, nx = Math.max(2, Math.round(len / 3)); const rows = [];
      for (let i = 0; i <= nx; i++) { const x = i / nx * len, row = []; for (let k = 0; k <= nt; k++) { const t = k / nt * TAU, nn = new V3(0, Math.cos(t), Math.sin(t)); row.push(gb.v(new V3(x, rad * nn.y, rad * nn.z), nn)); } rows.push(row); }
      for (let i = 0; i < nx; i++) for (let k = 0; k < nt; k++) { const a = rows[i][k], b = rows[i][k + 1], c = rows[i + 1][k], d = rows[i + 1][k + 1]; gb.i.push(a, c, b, b, c, d); }
      return gb.geo(); };
    /* the branch: from the trunk's side near the +x end, out at an angle; drawn along its own x so its bands lie across it */
    /* the fork on the left of the window (the side the panel never covers), the branch running up and out to its own disc: a Y */
    const W = ctx.P.window_um, ang = .55, x0 = W / 2 + 4, len = Math.max(30, L / 2 - x0 + 22), rb = R * .75, bg = new THREE.Group(); bg.position.set(-x0, R * .35, -R * .1); bg.rotation.z = Math.PI - ang; G.add(bg);
    const inner = new THREE.Mesh(piece(len, rb - 1, false, false), striate(ctx.mat('sarcoplasm', { kind: look() === 'real' ? 'matte' : 'wet', rough: .82 }), sarc, thick, thin, .55)); bg.add(inner); ctx.tag(inner, 'myofibril', .5);
    const film = new THREE.Mesh(piece(len, rb, false, false), ctx.sleeve()); film.renderOrder = 3; bg.add(film); ctx.tag(film, 'sarcolemma', .3);
    discs.push({ g: bg, x: len, r: rb }); discs.push({ g: G, x: L / 2, r: R }); discs.push({ g: G, x: -L / 2, r: R, flip: true });
    /* each disc: a stepped plate across the end, dark, and the neighbour's stub beyond it */
    const stepW = 3.2, stepH = 1.6, nb = ctx.mat('neighbour', { film: [.05, .35], kind: 'wet' });
    for (const d of discs) {
      const gb = new GB(), nt = 64, nr = 18, s = d.flip ? -1 : 1, off = (y, z) => s * stepH * (.5 + .5 * Math.tanh(4 * Math.sin((y + z * .3) / stepW * Math.PI)));
      const idx = []; for (let i = 0; i <= nr; i++) { const row = []; const rad = d.r * i / nr; for (let k = 0; k <= nt; k++) { const t = k / nt * TAU, y = rad * Math.cos(t), z = rad * Math.sin(t); row.push(gb.v(new V3(d.x + off(y, z) - s * stepH * .5, y, z), new V3(s, 0, 0))); } idx.push(row); }
      for (let i = 0; i < nr; i++) for (let k = 0; k < nt; k++) { const a = idx[i][k], b = idx[i][k + 1], c = idx[i + 1][k], e = idx[i + 1][k + 1]; if (s > 0) gb.i.push(a, c, b, b, c, e); else gb.i.push(a, b, c, b, e, c); }
      const m = new THREE.Mesh(gb.geo(), ctx.mat('disc', { kind: 'matte', rough: .7, side: THREE.DoubleSide })); d.g.add(m); ctx.tag(m, 'intercalated_disc', 1.8);
      const stub = new THREE.Mesh(piece(9, d.r * .98), nb); stub.position.x = d.flip ? d.x - 9 - stepH : d.x + stepH; stub.renderOrder = 2; d.g.add(stub); ctx.tag(stub, ctx.parts.neighbour ? 'neighbour' : 'sarcolemma', -.2);
      d.g.updateMatrixWorld(true);
    }
    const p = new V3(-L / 2 - 1, R * .6, 0); ctx.anchor('intercalated_disc', p, ctx.pname('intercalated_disc', 'Intercalated disc'), 2.8, R);
    const bp = new V3(Math.cos(Math.PI - ang) * len * .55 - x0, Math.sin(Math.PI - ang) * len * .55 + R * .35 + rb, 0); ctx.anchor('branch', bp, ctx.pname('branch', 'Branch'), 2.6, rb * 2);
    ctx.counts.branches = 1; ctx.counts.discs = discs.length;
  }

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
    /* the cell body: a rounded pyramid pointing up into the apical dendrite (pyramidal); a many-cornered star whose corners run out into the primary dendrites
       (stellate, a motor neuron); a spindle drawn out top and bottom into its dendrite and axon (bipolar); else round */
    const pyr = P.soma === 'pyramidal', star = P.soma === 'stellate', bip = P.soma === 'bipolar', flatK = .45;   // flatK: the trees spread more across the view than toward it (so they are seen); a choice, said in the note
    const nb = P.basal_n, roots = []; for (let i = 0; i < nb; i++) { const a = (i + .3 * r()) / nb * TAU + .4; roots.push(star ? new V3(Math.cos(a), Math.sin(a) * .95, (r() - .5) * flatK * 1.2).normalize() : new V3(Math.cos(a), -.35 - .5 * r(), Math.sin(a) * flatK).normalize()); }
    if (star) roots.push(new V3(0, -1, 0));   // the axon hillock is a corner too
    const somaR = d => { const y = d.y; let s = 1, yy = 1;
      if (pyr) { if (y > 0) s = 1 - .72 * Math.pow(y, 1.35); yy = y > 0 ? 1.18 : .8; }
      else if (star) { let k = 0; for (const q of roots) { const c = d.x * q.x + d.y * q.y + d.z * q.z; if (c > .6) k = Math.max(k, Math.pow((c - .6) / .4, 3)); } s = .86 + .5 * k; yy = s; }
      else if (bip) { s = Math.max(.35, 1 - .55 * Math.pow(Math.abs(y), 2.2)); yy = 1 + .35 * Math.pow(Math.abs(y), 3); }
      return new V3(w * s, h * yy, w * s * .92); };
    const _sd = new V3(), somaGeo = starGeo(somaR, 48, 36), insideSoma = (p, m) => { m = m || 0; _sd.set(p.x / w, p.y / h, p.z / (w * .92)); if (_sd.lengthSq() < 1e-9) return true; const rr = somaR(_sd.normalize());
      return (p.x / Math.max(.01, rr.x - m)) ** 2 + (p.y / Math.max(.01, rr.y - m)) ** 2 + (p.z / Math.max(.01, rr.z - m)) ** 2 < 1; };   // the surface along the scaled direction: the same mapping as the mesh
    ctx.inside = insideSoma; ctx.box = new THREE.Box3(new V3(-w, -h, -w), new V3(w, h * 1.2, 0));
    const k = cutZ(somaGeo, false); ctx.mesh(k.body, 'soma', 'soma', .7, { kind: 'wet' }); cytosolBack(ctx, k.body);
    ctx.anchor('soma', new V3(-w * .75, -h * .2, -w * .3), ctx.pname('soma', 'Soma'), 2.8, P.soma_w_um);
    /* nucleus and organelles of the cell body */
    nucleiFromSpec(ctx, new V3(0, -h * .1, 0));
    ctx.nisslOk = p => p.y > -h * .55;   // none in the axon hillock
    organelles(ctx);
    /* dendrites: basal trees round the base, the apical trunk, obliques off it and the tuft at its top */
    const lines = [], down = new V3(0, -1, 0), up = new V3(0, 1, 0);
    const bpsEach = Array(nb).fill(0); for (let b = 0; b < P.basal_branch_points; b++) bpsEach[Math.floor(r() * nb)]++;
    const share = Array(nb).fill(0).map(() => .6 + r()), ssum = share.reduce((a, b) => a + b, 0);
    for (let i = 0; i < nb; i++) { const dir = roots[i]; const root = star ? new V3(dir.x * w * 1.05, dir.y * h * 1.05, dir.z * w * .9) : new V3(dir.x * w * .8, -h * .35 + dir.y * h * .4, dir.z * w * .5);
      growTree(r, root, dir, P.basal_total_um * share[i] / ssum, bpsEach[i], { r0: P.dendrite_um / 2, kind: 'basal', flat: flatK, step: star ? 6 : 3, taper: star ? .84 : .78, bias: star ? (q => q.clone().normalize()) : (q => new V3(q.x, q.y - 20, q.z * .3).normalize()), biasK: star ? .05 : .06 }).forEach(l => lines.push(l)); }
    /* the apical trunk: straight up, thinning (none in a cell without an apical dendrite) */
    const trunk = [], trs = []; const Ltr = P.apical_trunk_um, y0 = h * (bip ? 1.25 : .9); if (Ltr > 0) { const L1 = Math.max(Ltr, y0 + 2); for (let y = y0; y <= L1 + 1e-6; y += Math.min(3, (L1 - y0) / 2)) { trunk.push(new V3(Math.sin(y * .01) * 1.5, y, 0)); trs.push(Math.max(Math.min(.8, P.trunk_um / 2), P.trunk_um / 2 * (1 - .55 * y / L1))); } }
    if (trunk.length > 1) lines.push({ pts: trunk, rs: trs, depth: 0, kind: 'apical', terminal: !(P.tuft_total_um > 0) && !(P.oblique_total_um > 0) });
    const top = trunk[trunk.length - 1];
    /* obliques: off the trunk at intervals */
    const nObl = trunk.length > 1 && P.oblique_total_um > 0 ? Math.max(1, Math.round(P.oblique_branch_points * .7)) : 0, oblB = Array(nObl).fill(0); for (let b = 0; b < P.oblique_branch_points - nObl + 1 && b >= 0; b++) oblB[Math.floor(r() * nObl)]++;
    for (let i = 0; i < nObl; i++) { const t = .12 + .8 * (i + r() * .5) / nObl, p = trunk[Math.floor(t * (trunk.length - 1))], side = (i % 2 ? 1 : -1), dir = new V3(side, .25 + r() * .3, (r() - .5) * flatK).normalize();
      growTree(r, p.clone(), dir, P.oblique_total_um / nObl * (.7 + .6 * r()), oblB[i], { r0: P.dendrite_um / 2 * .9, kind: 'apical', flat: flatK, bias: () => new V3(side * .4, .6, 0), biasK: .05 }).forEach(l => lines.push(l)); }
    /* the tuft: from the trunk's end up to the reach, spreading */
    const reach = P.apical_reach_um, nT = top && P.tuft_total_um > 0 ? 3 : 0; const tB = Array(nT).fill(0); for (let b = 0; b < Math.max(0, P.tuft_branch_points - (nT - 1)); b++) tB[Math.floor(r() * nT)]++;
    for (let i = 0; i < nT; i++) { const dir = new V3((i - 1) * .5, 1, (r() - .5) * flatK).normalize();
      growTree(r, top.clone(), dir, P.tuft_total_um / nT, tB[i], { r0: P.dendrite_um / 2, kind: 'apical', flat: flatK, deep: .2, bias: p => new V3(p.x * .002, p.y < reach ? 1 : -1.5, 0), biasK: .1, clamp: p => { if (p.y > reach) p.y = reach; } }).forEach(l => lines.push(l)); }
    const gbD = new GB(); let total = { basal: 0, apical: 0 };
    for (const l of lines) { tube(gbD, l.pts, l.rs, l.depth < 2 ? 7 : 5, false, l.terminal); for (let i = 1; i < l.pts.length; i++) total[l.kind] += l.pts[i].distanceTo(l.pts[i - 1]); }
    ctx.mesh(gbD.geo(), 'dendrite', 'dendrite', 1, { kind: 'wet' }); ctx.counts.dendriteLength = total;
    const lb = lines.find(l => l.kind === 'basal' && l.depth === 0); if (lb) ctx.anchor('dendrite', lb.pts[Math.floor(lb.pts.length * .7)], ctx.pname('dendrite', 'Dendrite'), 2.6, 1.5);
    if (trunk.length > 1 && ctx.parts.apical) ctx.anchor('apical', trunk[Math.floor(trunk.length * .35)], ctx.pname('apical', 'Apical'), 2.7, 3);
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
    if (spArr.length && ctx.parts.spine) ctx.anchor('spine', ctx.spineAnchor().clone().add(new V3(0, .8, 0)), ctx.pname('spine', 'Spine'), 2, P.spine_um);
    /* the axon: from the base of the cell body, down; initial segment bare, then myelin segments with nodes between; collaterals with boutons */
    const ax = [], axR = P.axon_um / 2; let p = new V3(0, -h * .95, 0), d = down.clone(); ax.push(p.clone()); const AXL = P.axon_drawn_um;
    for (let s = 0; s < AXL; s += 3) { d.addScaledVector(new V3(gauss(r), 0, gauss(r) * .3), .03).normalize(); d.y = Math.min(d.y, -.92); d.normalize(); p = p.clone().addScaledVector(d, 3); ax.push(p); }
    const hill = []; for (let i = 0; i <= 6; i++) { const y = -h * .95 + i * 1.2; hill.push(new V3(0, y - 8, 0)); } void hill;
    const gbA = new GB(); tube(gbA, ax, ax.map((q, i) => Math.max(axR, (P.dendrite_um * 1.3) * Math.exp(-i * .9) + axR)), 6, false, false);
    ctx.mesh(gbA.geo(), 'axon', 'axon', 1.4, { kind: 'wet' });
    const at = (dist) => { const i = Math.min(ax.length - 1, Math.max(0, Math.round(dist / 3))); return ax[i]; };
    ctx.anchor('ais', at(P.ais_um * .5).clone().add(new V3(axR + .5, 0, 0)), ctx.parts.ais ? ctx.pname('ais', 'Ais') : 'Axon initial segment', 2.2, P.ais_um);
    const nodes = [];
    if (P.myelin) { const gbM = new GB(); const Ro = axR / P.g_ratio; let s = P.ais_um; while (s + 10 < AXL) { const e = Math.min(AXL, s + P.internode_um); const seg = []; for (let q = s + P.node_um / 2; q <= e - P.node_um / 2; q += 3) seg.push(at(q).clone()); if (seg.length > 1) tube(gbM, seg, seg.map(() => Ro), 10, true, true); nodes.push(e); s = e + P.node_um; }
      ctx.mesh(gbM.geo(), 'myelin', 'myelin', 1.6, { kind: 'wet', rough: .35 }); ctx.counts.internodes = nodes.length;
      ctx.anchor('myelin', at(P.ais_um + P.internode_um * .5).clone().add(new V3(Ro, 0, 0)), ctx.pname('myelin', 'Myelin'), 2.5, Ro * 2);
      if (nodes[0]) ctx.anchor('node', at(nodes[0]).clone().add(new V3(Ro, 0, 0)), ctx.parts.node ? ctx.pname('node', 'Node') : 'Node of Ranvier', 2.3, 1); }
    /* collaterals leave at nodes, run sideways and carry boutons */
    const gbC = new GB(), bm = [];
    for (let c = 0; c < P.collaterals && nodes.length; c++) { const s0 = nodes[Math.min(nodes.length - 1, 1 + c * 2)], p0 = at(s0).clone(), side = c % 2 ? 1 : -1; let q = p0.clone(), dd = new V3(side, -.2, (r() - .5) * .3).normalize(); const pts = [q.clone()];
      for (let s = 0; s < P.collateral_um; s += 3) { dd.addScaledVector(new V3(gauss(r), gauss(r), gauss(r) * .3), .12).normalize(); q = q.clone().addScaledVector(dd, 3); pts.push(q); if (s > 10 && (s % P.bouton_spacing_um) < 3) bm.push(place(q.clone(), null, new V3(1, 1, 1))); }
      tube(gbC, pts, pts.map(() => axR * .6), 5, false, true); }
    if (gbC.vc) ctx.mesh(gbC.geo(), 'axon', 'axon', 1.4, { kind: 'wet' });
    const bg = new THREE.IcosahedronGeometry(P.bouton_um / 2, 1); ctx.inst(bg, 'bouton', 'bouton', 2.1, bm); ctx.counts.boutons = bm.length;
    if (bm[2]) ctx.anchor('bouton', new V3().setFromMatrixPosition(bm[2]), ctx.pname('bouton', 'Bouton'), 2.1, P.bouton_um);
    ctx.anchor('axon', at(AXL * .55).clone().add(new V3(2, 0, 0)), ctx.pname('axon', 'Axon'), 2.8, 2);
    if (ctx.S.view && ctx.S.view.break) { const end = ax[ax.length - 1]; const gbB = new GB(); [-1, 1].forEach(sg => { const c = end.clone().add(new V3(0, sg * 2.2, 0)); tube(gbB, [c.clone().add(new V3(-3, -1.2, 0)), c.clone().add(new V3(3, 1.2, 0))], [.25, .25], 5, true, true); });
      ctx.mesh(gbB.geo(), 'membrane', 'axon_break', 2, { kind: 'matte' }); ctx.breaks = [{ p: end.clone().add(new V3(4, -4, 0)), text: ctx.S.view.break.text, partId: 'axon_break' }]; }
    ctx.focus = { pos: new V3(), r: Math.max(w, h) * 1.4 }; ctx.counts.axonDrawn = AXL;
  };

  /* ---- the simpler shapes (no spec of the four exemplars uses them yet; each draws a recognisable body with its nucleus and organelles) ---- */
  SHAPE.ellipsoid = ctx => {
    const P = ctx.P, a = P.a_um / 2, b = P.b_um / 2, c = P.c_um / 2, r = ctx.r, bump = P.bumps, S = ctx.S;
    /* one fat droplet filling the cell (a white fat cell): the droplet, the thin rim of cytoplasm round it, and the nucleus pressed flat against the edge, where it
       bulges the cell's outline */
    const ld = (S.organelles || {}).lipid_droplets, uni = (S.special || []).some(s => s.kind === 'unilocular_droplet') || (ld && ld.count && ld.count.value === 1 && ld.size_um && ld.size_um.value > Math.min(a, b, c));
    const Rd = uni ? Math.min(ld && ld.size_um ? ld.size_um.value / 2 : Math.min(a, b, c) * .95, Math.min(a, b, c) - .3) : 0;
    const nDir = new V3(-.62, .78, 0).normalize(), nu = S.nucleus || {}, nsz = nu.size_um && (Array.isArray(nu.size_um) ? nu.size_um : nu.size_um.value) || [12, 3, 12];
    /* the signet ring: the flat nucleus lies inside the thin rim, swelling the outline a little and pressing a hollow into the droplet */
    const rim0 = Math.min(a, b, c) - Rd, bulge = uni && nu.count ? Math.max(0, nsz[1] - rim0) * .45 : 0, dent = uni && nu.count ? Math.max(0, nsz[1] + .95 - rim0 - bulge) : 0, bw = (nsz[0] / 2) / Math.max(1, Rd);
    const lump = d => bump * .08 * (Math.sin(d.x * 11 + 1) * Math.sin(d.y * 13 + 2) * Math.sin(d.z * 9 + 3)) + bump * .035 * Math.sin(d.x * 29 + d.y * 23 + 1.3) * Math.sin(d.z * 31 - d.y * 17);
    const rf = d => { let n = 1 + lump(d); if (bulge) { const ang = Math.acos(Math.max(-1, Math.min(1, d.dot(nDir)))); n += bulge / Math.min(a, b, c) * Math.exp(-((ang / (bw * 1.2)) ** 4)); } return new V3(a * n, b * n, c * n); };
    const g = starGeo(rf, 72, 50), k = cutZ(g, false); ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet' }); cytosolBack(ctx, k.body);
    ctx.inside = (p, m) => (p.x / Math.max(.01, a - (m || 0))) ** 2 + (p.y / Math.max(.01, b - (m || 0))) ** 2 + (p.z / Math.max(.01, c - (m || 0))) ** 2 < 1;
    ctx.box = new THREE.Box3(new V3(-a, -b, -c), new V3(a, b, 0)); ctx.focus = { pos: new V3(), r: Math.max(a, b, c) }; ctx.ext = new V3(a, b, c);
    /* pseudopods: blunt, bending fingers and flat ruffled sheets reaching out from the cell's back half (they come and go in minutes) */
    if (P.pseudopods) { const gb = new GB(), gs = new GB(); for (let i = 0; i < P.pseudopods; i++) { const dir = new V3(gauss(r), gauss(r), -Math.abs(gauss(r)) * .6 - .15).normalize(), s0 = new V3(dir.x * a, dir.y * b, dir.z * c).multiplyScalar(.82), pts = [], rs = [], d = dir.clone(), sheet = i % 3 === 2, r0 = Math.min(a, b) * (sheet ? .16 : .13) * (.8 + r() * .4), L = P.pseudopod_um * (.6 + r() * .7);
        let p = s0.clone(); for (let t = 0; t <= 1.0001; t += .08) { pts.push(p.clone()); rs.push(r0 * (t < .15 ? 1.9 - 6 * t : 1 - .35 * t)); d.addScaledVector(new V3(gauss(r), gauss(r), gauss(r)), .12).normalize(); p = p.clone().addScaledVector(d, L * .08 + (t < .1 ? Math.min(a, b) * .03 : 0)); }
        tube(sheet ? gs : gb, pts, rs, 10, false, true, sheet ? .3 : 1); }
      ctx.mesh(gb.geo(), 'cell', 'pseudopod', .7, { kind: 'wet' }); if (gs.vc) ctx.mesh(gs.geo(), 'cell', 'pseudopod', .7, { kind: 'wet', side: THREE.DoubleSide });
      ctx.anchor('pseudopod', new V3(-a * 1.1, -b * .4, -c * .3), ctx.pname('pseudopod', 'Pseudopod'), 1.9, P.pseudopod_um); }
    if (P.coat_um) { const cg = starGeo(d => { const q = rf(d); return q.addScalar(P.coat_um); }, 48, 32), kc = cutZ(cg, false); ctx.mesh(kc.body, 'neighbour', 'coat', .2, { film: [.08, .45] }); }
    if (uni) ctx.anchor('membrane', new V3(a * .62, -b * .76, -c * .2), ctx.pname('membrane', 'Cell membrane'), 2.4, a * 2);   // away from the nucleus, so the two names do not meet
    else ctx.anchor('membrane', new V3(-a * .7, b * .75, -c * .2), ctx.pname('membrane', 'Cell membrane'), 2.4, a * 2);
    if (uni) {
      const dg = cutSphere(1, 96, 64), dpa = dg.attributes.position, dd = new V3(); for (let i = 0; i < dpa.count; i++) { dd.fromBufferAttribute(dpa, i).normalize(); const ang = Math.acos(Math.max(-1, Math.min(1, dd.dot(nDir)))), rr = Rd - dent * Math.exp(-((ang / (bw * 1.12)) ** 4)); dpa.setXYZ(i, dd.x * rr, dd.y * rr, dd.z * rr); } dg.computeVertexNormals();
      const kd = cutZ(dg, true); ctx.mesh(kd.body, 'lipid', 'lipid_droplet', 1.2, { kind: 'wet' }); if (kd.cap) ctx.mesh(kd.cap, 'lipid', 'lipid_droplet', 1.2, { side: THREE.DoubleSide, kind: 'matte', rough: .5, glow: .12 });
      ctx.anchor('lipid_droplet', new V3(Rd * .25, -Rd * .2, 0), ctx.pname('lipid_droplet', 'Fat droplet'), 3, Rd * 2); ctx.counts.droplet = Rd * 2; ctx.counts.rim = Math.min(a, b, c) - Rd;
      ctx.organOk = p => p.length() > Rd + .15;
      if (nu.count) {   // the nucleus: a flat lens bent round the droplet, half in the kept half so the cut shows its section
        const t1 = new V3(0, 0, 1).cross(nDir).normalize(), t2 = new V3(0, 0, 1), Rm = Math.min(a, b, c) + bulge - .8 - nsz[1] / 2, ng = cutSphere(1, 40, 24), pa = ng.attributes.position;   // its outer face just under the membrane
        for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) * nsz[0] / 2, y = pa.getY(i) * nsz[1] / 2, z = pa.getZ(i) * nsz[2] / 2, q = nDir.clone().multiplyScalar(Rm).addScaledVector(t1, x).addScaledVector(t2, z).normalize().multiplyScalar(Rm + y); pa.setXYZ(i, q.x, q.y, q.z); }
        ng.computeVertexNormals(); const kn = cutZ(ng, true); ctx.mesh(kn.body, 'nucleus', 'nucleus', 1.5, { side: THREE.DoubleSide }); if (kn.cap) ctx.mesh(kn.cap, 'chromatin', 'nucleus', 1.5, { side: THREE.DoubleSide, rough: .8, kind: 'matte' });
        const nc = nDir.clone().multiplyScalar(Rm); ctx.nuclei.push({ c: nc, ax: new V3(nsz[0] / 2, nsz[1] / 2, nsz[2] / 2), rot: new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), nDir) });
        ctx.anchor('nucleus', nc.clone().addScaledVector(nDir, -nsz[1] * .2).addScaledVector(t1, nsz[0] * .2), ctx.pname('nucleus', 'Nucleus'), 3, nsz[0]); ctx.counts.nuclei = 1; ctx.counts.dent = dent;
        ctx.vol = ctx.vol || volumes(ctx, ctx.box); ctx.counts.cellVolume = ctx.vol.cell;
      }
      ctx.skipBlob = { lipid_droplets: true }; organelles(ctx); return;
    }
    nucleiFromSpec(ctx, new V3(0, 0, -c * .1)); organelles(ctx);
  };
  SHAPE.spindle = ctx => {
    const P = ctx.P, L = P.length_um / 2, Wd = P.width_um / 2;
    const one = (sx) => { const rf = d => { const s = Math.pow(1 - Math.min(1, Math.abs(d.x)), .9); return new V3(L, Wd * s / Math.max(.05, Math.sqrt(1 - d.x * d.x)) * Math.sqrt(1 - d.x * d.x), Wd * P.flat * s / Math.max(.05, Math.sqrt(1 - d.x * d.x)) * Math.sqrt(1 - d.x * d.x)); };
      const g = starGeo(rf, 64, 32); if (P.bend) { const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setY(i, y - P.bend * L * .5 * (1 - (x / L) ** 2) * sx); } g.computeVertexNormals(); } if (sx < 0) g.scale(1, -1, 1); return g; };
    ctx.spindleGeo = one; const shapes = P.pair ? [[1, Wd * 1.4], [-1, -Wd * 1.4]] : [[1, 0]];
    for (const [sx, off] of shapes) { const g = one(sx); g.translate(0, off, 0); const k = cutZ(g, false); ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet' }); cytosolBack(ctx, k.body); }
    ctx.inside = (p, m) => { const t = Math.abs(p.x) / L; if (t >= 1) return false; const rr = Wd * Math.pow(1 - t, .9) - (m || 0); return Math.hypot(p.y, p.z / P.flat) < rr; };
    ctx.box = new THREE.Box3(new V3(-L, -Wd, -Wd), new V3(L, Wd, 0)); ctx.focus = { pos: new V3(), r: L * .5 }; ctx.ext = new V3(L, Wd, Wd * P.flat);
    ctx.anchor('membrane', new V3(-L * .4, Wd * .8, 0), ctx.parts.membrane ? ctx.pname('membrane', 'Membrane') : 'Cell membrane', 2.4, Wd * 2);
    if (!P.pair) { nucleiFromSpec(ctx, new V3()); organelles(ctx); }
    /* thin branching processes from the rim of a flat cell (a fibroblast), in its own plane */
    if (P.processes > 0) { const r = ctx.r, gb = new GB();
      for (let i = 0; i < P.processes; i++) { const u = (r() - .5) * 1.5, side = i % 2 ? 1 : -1, x = u * L, rr = Wd * Math.pow(1 - Math.min(1, Math.abs(u)), .9), root = new V3(x, side * rr * .92, -Wd * P.flat * .15), dir = new V3(Math.sign(u) * .9 + u * .6, side * .7, -.08).normalize();
        growTree(r, root, dir, P.process_reach_um * (.6 + r() * .8), 1 + Math.floor(r() * 2), { r0: P.process_um / 2, rMin: Math.min(.25, P.process_um / 4), flat: .08, step: Math.max(1, P.process_reach_um / 18), wiggle: .22, bias: q => new V3(0, Math.sign(q.y), 0), biasK: .04 }).forEach(l => tube(gb, l.pts, l.rs, 6, false, true)); }
      ctx.mesh(gb.geo(), 'cell', 'processes', 1, { film: look() === 'real' ? [.3, .7] : [.4, .8], kind: 'wet' }); ctx.anchor('processes', new V3(L * .25, Wd * 1.4, 0), ctx.pname('processes', 'Cell processes'), 2.2, P.process_um); ctx.counts.processes = P.processes; }
  };
  SHAPE.stellate = ctx => {
    const P = ctx.P, r = ctx.r, s = P.soma_um / 2;
    const g = starGeo(d => new V3(s, s * .9, s * P.flat), 40, 28), k = cutZ(g, false); ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet' }); cytosolBack(ctx, k.body);
    ctx.inside = (p, m) => (p.x / (s - (m || 0))) ** 2 + (p.y / (s * .9 - (m || 0))) ** 2 + (p.z / Math.max(.05, s * P.flat - (m || 0))) ** 2 < 1;
    ctx.box = new THREE.Box3(new V3(-s, -s, -s), new V3(s, s, 0)); ctx.focus = { pos: new V3(), r: s * 2.5 }; ctx.ext = new V3(s, s * .9, s * P.flat);
    const gb = new GB(), feet = [], arms = []; const each = Array(P.processes).fill(0); for (let b = 0; b < P.branch_points; b++) each[Math.floor(r() * P.processes)]++;
    const V = P.endfeet && P.vessel_um > 0 ? { R: P.vessel_um / 2, y: -P.reach_um * .5, z: 0 } : null;   // a capillary under the cell, its axis along x
    for (let i = 0; i < P.processes; i++) { const a = i / P.processes * TAU + r() * .4, dir = new V3(Math.cos(a), Math.sin(a), (r() - .5) * P.flat).normalize();
      growTree(r, dir.clone().multiplyScalar(s * .85), dir, P.reach_um * 1.4, each[i], { r0: P.process_um / 2, rMin: Math.min(.3, P.process_um / 4), flat: P.flat, step: Math.max(.5, P.reach_um / 30), bias: q => q.clone().normalize(), biasK: .1 }).forEach(l => { arms.push(l);
        /* with a blood vessel drawn (an astrocyte), only the processes that reach toward it end on it, in end-feet flattened against its wall; the rest end fine */
        const tip = l.pts[l.pts.length - 1], toV = V && l.terminal && Math.hypot(tip.y - V.y, tip.z - V.z) < V.R + P.reach_um * .12;   // only the tips that already lie close to it
        if (toV) { const ax = new V3(tip.x, V.y, V.z), nrm = tip.clone().sub(ax).setX(0).normalize(), on = ax.clone().addScaledVector(nrm, V.R + P.endfoot_um * .12); l.pts.push(tip.clone().lerp(on, .5), on); l.rs.push(l.rs[l.rs.length - 1], l.rs[l.rs.length - 1]); tube(gb, l.pts, l.rs, 5, false, false); feet.push(place(on, qAlong(nrm), new V3(1, 1, 1))); }
        else { tube(gb, l.pts, l.rs, 5, false, !(P.endfeet && !V)); if (P.endfeet && !V && l.terminal) feet.push(place(tip, null, new V3(1, 1, 1))); } }); }
    if (V) { const vg = new THREE.CylinderGeometry(V.R, V.R, P.reach_um * 3.2, 40, 1, true, Math.PI / 2, Math.PI); vg.rotateZ(Math.PI / 2); vg.translate(0, V.y, V.z); const vm = ctx.mesh(vg, 'rbc', 'vessel', .3, { film: look() === 'real' ? [.08, .35] : [.08, .35], side: THREE.DoubleSide }); vm.renderOrder = 1;
      ctx.anchor('vessel', new V3(-P.reach_um * .9, V.y + V.R * .6, V.z), ctx.pname('vessel', 'Capillary'), 1.9, V.R * 2); ctx.counts.endfeet = feet.length; }
    ctx.mesh(gb.geo(), 'cell', 'process', 1); if (feet.length) ctx.inst(new THREE.SphereGeometry(P.endfoot_um / 2, 10, 8).scale(1, V ? .3 : .45, 1), 'cell', 'endfoot', 1.5, feet);
    if (P.lacuna_um) { const lg = new THREE.SphereGeometry(P.lacuna_um / 2, 40, 28); lg.scale(1, .55, .7); const kl = cutZ(lg, false); ctx.mesh(kl.body, 'neighbour', 'lacuna', .1, { film: [.05, .4], side: THREE.DoubleSide }); }
    ctx.anchor('membrane', new V3(-s, s, 0), ctx.parts.membrane ? ctx.pname('membrane', 'Membrane') : 'Cell body', 2.4, s * 2);
    nucleiFromSpec(ctx, new V3()); organelles(ctx);
    /* pigment along the arms (a melanocyte): melanosomes in a row down each arm thick enough to hold them, half sunk in its surface */
    const mo = (ctx.S.organelles || {}).melanosomes; if (mo && mo.in_processes) { const d = (mo.size_um && mo.size_um.value) || .5, el = mo.elongation || 1, step = d * .7, mm = [], X = new V3(1, 0, 0);
      for (const l of arms) for (let i = 1; i < l.pts.length && mm.length < 5000; i++) { const a = l.pts[i - 1], b = l.pts[i], L = a.distanceTo(b), rad = l.rs[i - 1]; if (rad < d * .5) continue; const t = b.clone().sub(a).normalize();
        for (let u = r() * step; u < L; u += step * (.8 + r() * .4)) { const o = new V3(gauss(r), gauss(r), gauss(r)); o.addScaledVector(t, -o.dot(t)).normalize(); const p = a.clone().lerp(b, u / L).addScaledVector(o, rad * (.3 + .45 * r())); mm.push(place(p, new THREE.Quaternion().setFromUnitVectors(X, t))); } }
      const g = new THREE.SphereGeometry(d / 2, 7, 5); g.scale(el, 1, 1); ctx.inst(g, 'melanin', 'melanosome', 1.35, mm); ctx.counts.melanosomesInArms = mm.length; }
  };
  SHAPE.segmented = ctx => {
    const P = ctx.P, segs = P.segments || [], gb = new GB(), r = ctx.r; let y = 0; const total = segs.reduce((a, s) => a + s.length_um, 0); y = total / 2;
    for (const s of segs) { const pts = [], rs = []; for (let t = 0; t <= 1.0001; t += .1) { pts.push(new V3(P.bend * Math.sin((total / 2 - (y - t * s.length_um)) / total * 3) * 2, y - t * s.length_um, 0)); rs.push((s.d0_um + (s.d1_um - s.d0_um) * t) / 2); }
      const g2 = new GB(); tube(g2, pts, rs, 14, true, true); ctx.mesh(g2.geo(), s.fill === 'nucleus' ? 'nucleus' : 'cell', s.part || 'membrane', 1, s.fill === 'mito_packed' ? { film: look() === 'real' ? [.2, .6] : [.22, .62], kind: 'wet' } : undefined);   // see-through where it holds packed mitochondria
      if (s.fill === 'discs') { const mats = [], n = Math.min(400, Math.floor(s.length_um / P.disc_spacing_um)); for (let i = 0; i < n; i++) mats.push(place(new V3(0, y - (i + .5) * s.length_um / n, 0), null, new V3(1, 1, 1))); ctx.inst(new THREE.CylinderGeometry(rs[0] * .92, rs[0] * .92, Math.min(.02, s.length_um / n * .5), 16, 1), 'membrane', s.part || 'discs', 1.6, mats); }
      /* mitochondria packed side by side, long and standing along the cell, inside the segment (a cone's ellipsoid): a ring round a central one, row on row */
      if (s.fill === 'mito_packed') { const mats = [], R0 = rs[0], mr = R0 * .17, ml = Math.min(2, s.length_um / 4), ring = Math.max(5, Math.floor(TAU * R0 * .58 / (mr * 2.3)));
        for (let t = ml / 2 + mr; t < s.length_um - ml / 2 - mr; t += ml + mr * 2.4) { const yy = y - t, off = (t * 1.7) % TAU; mats.push(place(new V3((r() - .5) * mr * .3, yy, (r() - .5) * mr * .3))); for (let k = 0; k < ring; k++) { const a = off + k / ring * TAU; mats.push(place(new V3(Math.cos(a) * R0 * .58, yy + (r() - .5) * mr, Math.sin(a) * R0 * .58))); } }
        ctx.inst(capsuleGeo(mr, ml, 8, 3), 'mito', 'mitochondrion', 1.7, mats); ctx.counts.mitochondria = mats.length; }
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
    ctx.inside = (p, m) => Math.abs(p.x) < L / 2 && Math.hypot(p.y, p.z) < Wd - (m || 0); ctx.box = new THREE.Box3(new V3(-L / 2, -Wd, -Wd), new V3(L / 2, Wd, 0)); ctx.focus = { pos: new V3(), r: L / 2 }; ctx.ext = new V3(L, Wd, Wd);
    ctx.anchor('membrane', new V3(0, Wd * 1.2, 0), ctx.parts.membrane ? ctx.pname('membrane', 'Membrane') : 'Cell membrane', 2.4, Wd * 2);
    nucleiFromSpec(ctx, new V3()); organelles(ctx);
  };

  /* ---- a sheet wrapped round a channel (a capillary's endothelial cell): one thin cell curled round the lumen, its nucleus bulging into the blood; the tube is
     cut along its length so the inside of its back half is seen. Neighbours finish the ring and go on along the vessel, faint; the junctions are dark seams. ---- */
  SHAPE.wrapped_sheet = ctx => {
    const P = ctx.P, S = ctx.S, r = ctx.r, Rl = P.lumen_um / 2, t = P.thickness_um, L = P.length_um, span = P.wrap * TAU, phi0 = -P.seam_deg * Math.PI / 180;   // phi: round the tube, 0 at the back (-z)
    const tilt = new THREE.Group(); tilt.rotation.set(-.42, .5, 0); ctx.G.add(tilt); const G0 = ctx.G; ctx.G = tilt;   // turned so the curve of the channel is seen
    const at = (x, ph, rad) => new V3(x, Math.sin(ph) * rad, -Math.cos(ph) * rad);
    const nu = S.nucleus || {}, nsz = (nu.size_um && (Array.isArray(nu.size_um) ? nu.size_um : nu.size_um.value)) || [12, 5, 3], nL = nsz[0] / 2, nW = nsz[1] / 2, nT = nsz[2];
    const rcN = Rl + t - .12 - nT / 2;   // the nucleus: its outer face just under the outer membrane, the rest bulging into the channel
    const endTaper = x => 1 - Math.pow(Math.min(1, Math.abs(x) / (L / 2)), 6) * .0;   // (square ends: the junctions are drawn as seams)
    const bump = (x, ph) => { const q = (x / (nL + .3)) ** 2 + (ph * rcN / (nW + .3)) ** 2; return q < 1 ? (nT + .24 - t) * Math.sqrt(1 - q) : 0; };
    const ri = () => Rl, ro = () => Rl + t; void bump;   // the nucleus itself is the bulge into the channel: the sheet's faces run on through it, hidden inside it
    /* the sheet: inner and outer faces over (x, phi), closed at its four edges */
    const gb = new GB(), nx = 120, nt = 160, sheet = (rf, flip) => { const base = gb.vc; for (let i = 0; i <= nx; i++) { const x = -L / 2 + i / nx * L; for (let j = 0; j <= nt; j++) { const ph = phi0 + j / nt * span, rr = rf(x, ph); gb.v(at(x, ph, rr), new V3(0, Math.sin(ph), -Math.cos(ph)).multiplyScalar(flip ? -1 : 1)); } }
      for (let i = 0; i < nx; i++) for (let j = 0; j < nt; j++) { const a = base + i * (nt + 1) + j, b = a + 1, c = a + nt + 1, d = c + 1; if (flip) gb.i.push(a, b, c, b, d, c); else gb.i.push(a, c, b, b, c, d); } return base; };
    const bIn = sheet(ri, true), bOut = sheet(ro, false), idx = (base, i, j) => base + i * (nt + 1) + j;
    for (let i = 0; i < nx; i++) for (const j of [0, nt]) { const a = idx(bIn, i, j), b = idx(bIn, i + 1, j), c = idx(bOut, i, j), d = idx(bOut, i + 1, j); if (j) gb.i.push(a, b, c, b, d, c); else gb.i.push(a, c, b, b, c, d); }
    for (let j = 0; j < nt; j++) for (const i of [0, nx]) { const a = idx(bIn, i, j), b = idx(bIn, i, j + 1), c = idx(bOut, i, j), d = idx(bOut, i, j + 1); if (i) gb.i.push(a, c, b, b, c, d); else gb.i.push(a, b, c, b, d, c); }
    const g = gb.geo(); g.computeVertexNormals(); const k = cutZ(g, true);
    ctx.mesh(k.body, 'cell', 'membrane', .6, { kind: 'wet', side: THREE.DoubleSide }); if (k.cap) ctx.mesh(k.cap, 'cytosol', 'cytosol', .5, { side: THREE.DoubleSide, kind: 'matte', glow: .05 });
    /* the nucleus: a lens bent to the curve of the channel */
    const ng = cutSphere(1, 40, 28), pa = ng.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) * nL, u = pa.getY(i) * nW, w = pa.getZ(i) * nT / 2, q = at(x, u / rcN, rcN + w); pa.setXYZ(i, q.x, q.y, q.z); } ng.computeVertexNormals();
    const kn = cutZ(ng, true); ctx.mesh(kn.body, 'nucleus', 'nucleus', 1.5, { side: THREE.DoubleSide }); if (kn.cap) ctx.mesh(kn.cap, 'chromatin', 'nucleus', 1.5, { side: THREE.DoubleSide, rough: .8, kind: 'matte' });
    const nC = at(0, 0, rcN); ctx.nuclei.push({ c: nC.clone(), ax: new V3(nL, nW, nT / 2), rot: null }); ctx.counts.nuclei = 1;
    ctx.anchor('nucleus', at(-nL * .2, 0, rcN - nT / 2 - .2), ctx.pname('nucleus', 'Nucleus'), 3, nsz[0]);
    /* inside the sheet (for the organelles), its box, its focus */
    const phOf = p => { let ph = Math.atan2(p.y, -p.z) - phi0; ph = ((ph % TAU) + TAU) % TAU; return ph; };
    ctx.inside = (p, m) => { m = m || 0; if (Math.abs(p.x) > L / 2 - m) return false; const ph = phOf(p); if (ph < m / Rl || ph > span - m / Rl) return false; const rr = Math.hypot(p.y, p.z), a = phi0 + ph; return rr > ri(p.x, a > Math.PI ? a - TAU : a) + m && rr < Rl + t - m; };
    ctx.box = new THREE.Box3(new V3(-L / 2, -Rl - t - .1, -Rl - t - .1), new V3(L / 2, Rl + t + .1, 0)); ctx.focus = { pos: new V3(0, 0, -Rl * .5), r: L / 2 };
    ctx.ext = new V3(L, Rl, Rl); ctx.vol = volumes(ctx, ctx.box); ctx.counts.cellVolume = ctx.vol.cell;
    organelles(ctx);
    /* the coat on the blood face (glycocalyx) and the basement membrane outside, as films */
    const film = (rf, role, part, a) => { const gf = new GB(), base = gf.vc; for (let i = 0; i <= 60; i++) { const x = -L / 2 + i / 60 * L; for (let j = 0; j <= 80; j++) { const ph = phi0 + j / 80 * span; gf.v(at(x, ph, rf(x, ph)), new V3(0, Math.sin(ph), -Math.cos(ph))); } }
      for (let i = 0; i < 60; i++) for (let j = 0; j < 80; j++) { const a0 = base + i * 81 + j; gf.i.push(a0, a0 + 81, a0 + 1, a0 + 1, a0 + 81, a0 + 82); } const kf = cutZ(gf.geo(), false); const m = ctx.mesh(kf.body, role, part, .15, { film: a, kind: 'wet', side: THREE.DoubleSide }); m.renderOrder = 2; return m; };
    if (ctx.parts.glycocalyx) { film((x, ph) => ri(x, ph) - (P.coat_um || .45), 'lamellar', 'glycocalyx', [.1, .35]); ctx.anchor('glycocalyx', at(L * .3, -.5, Rl - (P.coat_um || .45)), ctx.pname('glycocalyx', 'Glycocalyx'), 1.6, .45); }
    if (ctx.parts.basement_membrane) { film(() => Rl + t + .08, 'neighbour', 'basement_membrane', [.05, .3]); }
    /* caveolae: small pits on both faces at their true size (about 75 nm), seen only close up; a share of the measured number */
    const cv = (S.special || []).find(x => x.kind === 'crowd' && x.part === 'caveola'); if (cv) { const cs = cv.params.size_nm[0] / 1000, n = Math.min(cv.params.max_drawn || 900, 4000), mm = [];
      for (let i = 0; i < n * 3 && mm.length < n; i++) { const x = (r() - .5) * L * .98, ph = phi0 + r() * span, out = r() < .5, rr = out ? Rl + t - cs * .2 : ri(x, ph) + cs * .2, q = at(x, ph, rr); if (q.z > 0) continue; mm.push(place(q)); }
      ctx.inst(new THREE.SphereGeometry(cs / 2, 8, 6), 'lamellar', 'caveola', 2, mm); ctx.counts.caveolae = mm.length; if (mm[0]) ctx.anchor('caveola', new V3().setFromMatrixPosition(mm[0]), ctx.pname('caveola', 'Caveola'), 2, cs); }
    /* the rest of the ring and the cells before and after along the vessel: faint; the junctions where they meet it, dark seams */
    const nb = ctx.mat('neighbour', { film: look() === 'real' ? [.1, .5] : [.08, .45], kind: 'wet', side: THREE.DoubleSide }), gn = new GB();
    const patch = (x0, x1, p0, p1) => { const base = gn.vc, NX = 24, NT = Math.max(4, Math.round((p1 - p0) / TAU * 80)); for (let i = 0; i <= NX; i++) { const x = x0 + i / NX * (x1 - x0); for (let j = 0; j <= NT; j++) { const ph = p0 + j / NT * (p1 - p0); gn.v(at(x, ph, Rl + t * .5), new V3(0, Math.sin(ph), -Math.cos(ph))); } }
      for (let i = 0; i < NX; i++) for (let j = 0; j < NT; j++) { const a0 = base + i * (NT + 1) + j; gn.i.push(a0, a0 + NT + 1, a0 + 1, a0 + 1, a0 + NT + 1, a0 + NT + 2); } };
    patch(-L / 2, L / 2, phi0 + span, phi0 + TAU); patch(L / 2, L / 2 + 10, 0, TAU); patch(-L / 2 - 10, -L / 2, 0, TAU);
    const kN = cutZ(gn.geo(), false); const mN = new THREE.Mesh(kN.body, nb); mN.matrixAutoUpdate = false; mN.renderOrder = 2; ctx.G.add(mN); ctx.tag(mN, 'neighbour', -.2);
    ctx.anchor('neighbour', at(L / 2 + 5, -.9, Rl + t), ctx.pname('neighbour', 'Neighbouring cell'), 1.8, 10);
    const gj = new GB(), jr = .09, seamX = ph => { const pts = []; for (let i = 0; i <= 40; i++) pts.push(at(-L / 2 + i / 40 * L, ph, Rl + t * .5)); tube(gj, pts, pts.map(() => jr), 5); }, seamR = x => { const pts = []; for (let j = 0; j <= 90; j++) pts.push(at(x, j / 90 * TAU, Rl + t * .5)); tube(gj, pts, pts.map(() => jr), 5); };
    seamX(phi0); seamX(phi0 + span); seamR(L / 2); seamR(-L / 2);
    const kj = cutZ(gj.geo(), false); ctx.mesh(kj.body, 'desmosome', 'junction', 1.7, { kind: 'matte' }); ctx.anchor('junction', at(-L * .3, phi0, Rl + t), ctx.pname('junction', 'Junction'), 2, .3);
    ctx.anchor('membrane', at(L * .32, .7, Rl + t), ctx.pname('membrane', 'Cell membrane'), 2.4, L);
    if (ctx.parts.lumen) ctx.anchor('lumen', at(-L * .38, 1.0, Rl * .4), ctx.pname('lumen', 'Channel (lumen)'), 1.5, P.lumen_um);
    ctx.G = G0; ctx.tiltG = tilt; ctx.counts.lumen = P.lumen_um; ctx.counts.wrapDeg = Math.round(P.wrap * 360);
    tilt.updateMatrixWorld(true);
  };

  /* ================= FEATURES: drawn on any shape from the spec's `special` list (kind -> drawer), after the shape itself ================= */
  const FEATURE = {};
  /* a polyhedron's side face: its outward normal, a point on it, and its two in-face directions (along, up) */
  function sideFace(ctx, pick) {
    const n = ctx.P.sides, faces = ctx.planes.slice(0, n).map((pl, i) => ({ i, n: pl.n.clone(), d: pl.d }));
    const f = faces.reduce((a, b) => (pick(b) > pick(a) ? b : a)); const up = new V3(0, 1, 0).addScaledVector(f.n, -f.n.y).normalize(), along = new V3().crossVectors(up, f.n).normalize();
    return Object.assign(f, { c: f.n.clone().multiplyScalar(f.d), up, along });
  }
  /* microvilli standing on one side face (a hepatocyte's face toward the blood channel), at their true size: a fuzz at the arrival distance */
  FEATURE.side_microvilli = (ctx, sp) => {
    if (!ctx.planes) return; const pr = sp.params || {}, f = sideFace(ctx, x => -x.n.x - Math.abs(x.n.z) * .6), L = pr.length_um || .5, d = pr.diameter_um || .1, step = pr.spacing_um || .35, mats = [], r = ctx.r, hh = ctx.P.height_um / 2, hw = ctx.P.width_um;
    for (let u = -hw; u < hw; u += step) for (let v = -hh; v < hh; v += step) { const p0 = f.c.clone().addScaledVector(f.along, u + (r() - .5) * step * .4).addScaledVector(f.up, v + (r() - .5) * step * .4); if (p0.z > -d) continue;
      const dv = p0.clone().normalize(), rr = ctx.rad(dv); const base = dv.multiplyScalar(rr - .03); if (!ctx.inside(base.clone().addScaledVector(f.n, -ctx.P.round_um * 1.2), 0) || Math.abs(base.clone().sub(f.c).dot(f.n)) > ctx.P.round_um * .4) continue;
      mats.push(place(base, qAlong(f.n.clone().add(new V3((r() - .5) * .3, (r() - .5) * .3, (r() - .5) * .3))), new V3(1, L + .03, 1))); }
    const geo = capsuleGeo(d / 2, 1, 6, 2); geo.translate(0, .5, 0); ctx.inst(geo, 'cell', sp.part || 'microvilli', 1.4, mats, { kind: 'wet' }); ctx.counts.sideMicrovilli = mats.length;
    if (mats[0]) ctx.anchor(sp.part || 'microvilli', new V3().setFromMatrixPosition(mats[Math.floor(mats.length * .6)]).addScaledVector(f.n, L + .3), ctx.pname(sp.part || 'microvilli', 'Microvilli'), 2.3, L);
    /* the blood channel beyond that face (a sinusoid), faint */
    if (pr.channel_um) { const R = pr.channel_um / 2, g = new THREE.CylinderGeometry(R, R, ctx.P.height_um * 2.2, 40, 1, true, Math.PI / 2, Math.PI); g.translate(f.c.x + f.n.x * (R + L + .8), 0, 0); const k = { body: g };   // the back half of the channel, cut open like the cell
      const m = ctx.mesh(k.body, 'rbc', pr.channel_part || 'sinusoid', .1, { film: look() === 'real' ? [.04, .22] : [.04, .22], side: THREE.DoubleSide }); m.renderOrder = 2;
      ctx.anchor(pr.channel_part || 'sinusoid', new V3(f.c.x + f.n.x * (R + L + .6), hh * .6, Math.min(-.5, f.c.z + f.n.z * R)), ctx.pname(pr.channel_part || 'sinusoid', 'Blood channel'), 1.9, R * 2); }
  };
  /* a channel grooved into the faces shared with neighbours (a bile canaliculus): a tube half in this cell's wall, along the face at mid height */
  FEATURE.canaliculus = (ctx, sp) => {
    if (!ctx.planes) return; const pr = sp.params || {}, R = (pr.diameter_um || 1) / 2, n = ctx.P.sides, gb = new GB(); let shown = null;
    const faces = ctx.planes.slice(0, n).filter(pl => pl.n.x > -.3 && pl.n.z < .5).sort((a, b) => b.n.x - a.n.x).slice(0, pr.faces || 2);   // the right-hand face first, so the channel shows in the cut as a round hole at the cell's edge
    for (const pl of faces) { const up = new V3(0, 1, 0), along = new V3().crossVectors(up, pl.n).normalize(), c = pl.n.clone().multiplyScalar(pl.d).addScaledVector(up, (pr.height || 0) * ctx.P.height_um), pts = [];
      for (let u = -ctx.P.width_um; u <= ctx.P.width_um; u += .3) { const p = c.clone().addScaledVector(along, u); if (p.z > -R * 1.2) continue; const dv = p.clone().normalize(); if (!ctx.inside(dv.clone().multiplyScalar(ctx.rad(dv) - ctx.P.round_um * 1.5), 0)) continue; pts.push(dv.multiplyScalar(ctx.rad(dv) - R * .15)); }
      if (pts.length > 3) { tube(gb, pts, pts.map(() => R), 12, true, true); const near = pts.reduce((a, b) => b.z > a.z ? b : a); if (!shown || near.z > shown.z) shown = near; } }
    if (!gb.vc) return; ctx.mesh(gb.geo(), 'bile', sp.part || 'canaliculus', 1.8, { kind: 'wet' }); ctx.counts.canaliculi = faces.length;
    if (shown) ctx.anchor(sp.part || 'canaliculus', shown.clone().add(new V3(0, R * 2, 0)), ctx.pname(sp.part || 'canaliculus', 'Bile canaliculus'), 2.4, R * 2);
  };
  /* rough endoplasmic reticulum: stacks of flat, slightly curved sacs (cisternae) studded with ribosomes, scattered through the cytoplasm */
  FEATURE.rough_er_stacks = (ctx, sp) => {
    const pr = sp.params || {}; if (!ctx.box) return; const n = pr.stacks || 40, w = pr.width_um || 2.4, gap = pr.spacing_um || .14, k = pr.sheets || 5, pts = samplePts(ctx, n, ctx.box, w * .5, ctx.organOk), mats = [], dots = [];
    const sheet = new THREE.CylinderGeometry(.5, .5, .04, 20, 1); sheet.scale(1, 1, .42);
    for (const p of pts) { const q = randQ(ctx.r), nrm = new V3(0, 1, 0).applyQuaternion(q); for (let j = 0; j < k; j++) { const c = p.clone().addScaledVector(nrm, (j - (k - 1) / 2) * gap); if (inNucleus(ctx, c, .2) || !ctx.inside(c, .1)) continue; const s = w * (1 - Math.abs(j - (k - 1) / 2) * .08); mats.push(place(c, q, new V3(s, 1, s))); } }
    ctx.inst(sheet, 'er', sp.part || 'rough_er', 1.25, mats); ctx.counts.erSheets = mats.length; ctx.counts.erStacks = pts.length;
    if (pts[0]) ctx.anchor(sp.part || 'rough_er', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.pname(sp.part || 'rough_er', 'Rough endoplasmic reticulum'), 2.2, w);
  };
  /* glycogen: rosettes of small granules in clumps (each granule drawn about 0.1 µm) */
  FEATURE.glycogen = (ctx, sp) => {
    const pr = sp.params || {}; if (!ctx.box) return; const n = pr.clumps || 40, per = pr.per_clump || 24, R = pr.clump_um ? pr.clump_um / 2 : .5, g = pr.granule_um || .1, pts = samplePts(ctx, n, ctx.box, R, ctx.organOk), mats = [], r = ctx.r;
    for (const p of pts) for (let j = 0; j < per; j++) { const o = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(R * .45); mats.push(place(p.clone().add(o))); }
    ctx.inst(new THREE.IcosahedronGeometry(g / 2, 0), 'glycogen', sp.part || 'glycogen', 1.1, mats); ctx.counts.glycogenClumps = pts.length;
    if (pts[0]) ctx.anchor(sp.part || 'glycogen', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.pname(sp.part || 'glycogen', 'Glycogen'), 1.9, R * 2);
  };
  /* folds of the base and sides (a kidney tubule cell): thin upright folds of membrane from the base, with the mitochondria standing in rows between them */
  FEATURE.basal_folds = (ctx, sp) => {
    const pr = sp.params || {}; if (!ctx.box) return; const P = ctx.P, hh = P.height_um / 2, hw = P.width_um / 2, step = pr.spacing_um || .9, top = -hh + P.height_um * (pr.height || .55), mats = [], plate = new THREE.BoxGeometry(.05, 1, 1);
    for (let x = Math.ceil(-hw / step) * step; x < hw; x += step) for (let z = -hw; z < -.15; z += .6) { const y0 = -hh, p = new V3(x, (y0 + top) / 2, z); if (!ctx.inside(new V3(x, y0 + P.round_um * 1.5, z), .1)) continue; mats.push(place(p, null, new V3(1, top - y0, .62))); }
    ctx.inst(plate, 'lamellar', sp.part || 'basolateral_folds', 1.15, mats, { film: [.35, .7] }); ctx.counts.folds = Math.round(2 * hw / step);
    ctx.foldsX = { step, top, hw }; if (mats[0]) ctx.anchor(sp.part || 'basolateral_folds', new V3(-hw * .5, -hh * .6, -.5), ctx.pname(sp.part || 'basolateral_folds', 'Folds'), 2, step);
  };
  /* a dome of cytoplasm swelling from the free face, about to pinch off (apocrine secretion) */
  FEATURE.apical_bleb = (ctx, sp) => {
    if (!ctx.planes) return; const pr = sp.params || {}, P = ctx.P, R = (pr.diameter_um || P.width_um * .55) / 2, top = ctx.planes[ctx.planes.length - 2], y = top.d / top.n.y - P.round_um * .4;
    const g = cutSphere(R, 40, 28); g.scale(1, (pr.height || .8), 1); g.translate(0, y + R * .35, 0); const k = cutZ(g, false); ctx.mesh(k.body, 'cell', sp.part || 'bleb', .9, { kind: 'wet' }); cytosolBack(ctx, k.body);
    const gr = (ctx.S.organelles || {}).granules, mm = []; if (gr) { const d = (gr.size_um && gr.size_um.value) || .5; for (let i = 0; i < (pr.granules || 10) * 4 && mm.length < (pr.granules || 10); i++) { const p = new V3((ctx.r() - .5) * R * 1.6, y + R * .25 + (ctx.r() - .2) * R * .6, -ctx.r() * R * .7); if ((p.x / R) ** 2 + ((p.y - y - R * .25) / (R * .8)) ** 2 + (p.z / R) ** 2 > .7 || p.y < y + .2) continue; mm.push(place(p)); } ctx.inst(new THREE.SphereGeometry(d / 2, 10, 8), 'vesicle', 'granule', 1.3, mm); }
    ctx.anchor(sp.part || 'bleb', new V3(R * .4, y + R * (pr.height || .8) * 1.1, -R * .3), ctx.pname(sp.part || 'bleb', 'Apical bleb'), 2.5, R * 2); ctx.counts.bleb = R * 2;
  };
  /* a thin sheet the cell rests on (a basement membrane), under its base, faint */
  FEATURE.basement_membrane = (ctx, sp) => {
    if (!ctx.planes) return; const P = ctx.P, w = P.width_um * 2.4, g = new THREE.BoxGeometry(w, (sp.params && sp.params.thickness_um) || .1, w * .6); const bot = ctx.planes[ctx.planes.length - 1], y = -bot.d / Math.max(.2, -bot.n.y);
    g.translate(0, y - .08, -w * .3); const m = ctx.mesh(g, 'neighbour', sp.part || 'basement_membrane', .2, { film: look() === 'real' ? [.35, .6] : [.35, .6], kind: 'matte' }); m.renderOrder = 1;
    ctx.anchor(sp.part || 'basement_membrane', new V3(P.width_um * .75, y - .2, -1), ctx.pname(sp.part || 'basement_membrane', 'Basement membrane'), 1.8, P.width_um);
  };
  /* microplicae: low winding ridges of membrane over the free face (a corneal surface cell), which hold the tear film */
  FEATURE.microplicae = (ctx, sp) => {
    if (!ctx.planes) return; const pr = sp.params || {}, P = ctx.P, r = ctx.r, hw = P.width_um / 2, hh = P.height_um / 2, gap = pr.spacing_um || .8, rr = (pr.height_um || .3) / 2, gb = new GB(); let n = 0;
    /* in the cut's frame: the top face points up (+y) on an upright cell, toward the viewer (+z) on a flat one cut through its own plane; on a flat cell only the
       half whose lid is kept (x < 0) carries them, and on an upright one only the half behind the cut */
    const U = ctx.lid ? (a, b, h) => new V3(a, b, h) : (a, b, h) => new V3(a, h, b), ok = q => ctx.lid ? q.x < -.3 && ctx.halfLid : q.z < -rr * 2;
    for (let b = -hw * 1.2; b < hw * 1.2; b += gap) { let pts = []; const ph = r() * TAU, k = 1.2 + r() * .8;
      const flush = () => { if (pts.length > 2) { tube(gb, pts, pts.map(() => rr), 5, true, true); n++; } pts = []; };
      for (let a = -hw * 1.2; a < hw * 1.2; a += .25) { const bb = b + Math.sin(a * k + ph) * gap * .35, q = U(a, bb, hh); if (!ok(q) || r() < .01) { flush(); continue; }
        const d = q.clone().normalize(), R = ctx.rad(d), pp = d.multiplyScalar(R - rr * .5), lev = ctx.lid ? pp.z : pp.y; if (lev < hh - P.round_um * .35) { flush(); continue; } pts.push(pp); }
      flush(); }
    if (gb.vc) ctx.mesh(gb.geo(), 'cell', sp.part || 'microplicae', 1.3, { kind: 'wet' }); ctx.counts.microplicae = n;
    ctx.anchor(sp.part || 'microplicae', ctx.lid ? new V3(-hw * .45, hw * .35, hh + .3) : new V3(hw * .3, hh + .3, -hw * .4), ctx.pname(sp.part || 'microplicae', 'Microplicae'), 2.3, rr * 2);
  };
  /* hemidesmosomes: rivets on the base that hold the cell to the basement membrane (a basal epithelial cell) */
  FEATURE.hemidesmosomes = (ctx, sp) => {
    if (!ctx.planes) return; const pr = sp.params || {}, P = ctx.P, bot = ctx.planes[ctx.planes.length - 1], y = -bot.d / Math.max(.2, -bot.n.y), hw = P.width_um / 2, mats = [], s = pr.spacing_um || 1.2;
    for (let x = -hw; x < hw; x += s) for (let z = -s * .6; z > -hw; z -= s) { const p = new V3(x + (ctx.r() - .5) * s * .4, y + .02, z + (ctx.r() - .5) * s * .4); if (!ctx.inside(new V3(p.x, y + P.round_um * 1.8 + .3, p.z), P.round_um * .3)) continue; mats.push(place(p)); }
    ctx.inst(new THREE.CylinderGeometry(.2, .2, .07, 10, 1), 'desmosome', sp.part || 'hemidesmosome', 2, mats); ctx.counts.hemidesmosomes = mats.length;
    if (mats[0]) ctx.anchor(sp.part || 'hemidesmosome', new V3().setFromMatrixPosition(mats[Math.floor(mats.length * .7)]), ctx.pname(sp.part || 'hemidesmosome', 'Hemidesmosome'), 2.2, .4);
  };
  /* a plant cell (a palisade cell of a leaf): the wall outside the membrane, the big central vacuole filling most of the cell, and the chloroplasts lying flat
     in the thin layer of cytoplasm between the two, pressed against the wall. Chloroplast count and volume from the spec; their shape (a lens 1 : 0.85 : 0.45) is
     drawn to that volume. Only the back half is drawn, so about half the count shows. */
  FEATURE.plant_cell = (ctx, sp) => {
    if (!ctx.planes) return; const pr = sp.params || {}, P = ctx.P, r = ctx.r, c = pr.cytoplasm_um || 2, wall = pr.wall_um || .5;
    /* the wall: a shell just outside the membrane, cut open like the cell */
    const rad = ctx.rad, wg = starGeo(d => { const t = rad(d) + wall; return new V3(t, t, t); }, 72, 48), kw = cutZ(wg, false);
    ctx.mesh(kw.body, 'wall', sp.wall_part || 'wall', .5, { film: look() === 'real' ? [.25, .6] : [.25, .6], kind: 'matte', side: THREE.DoubleSide });
    /* the vacuole: the cell shrunk by the cytoplasm's thickness, a clear sac */
    const vg = starGeo(d => { const t = Math.max(.5, rad(d) - c - P.round_um * .3); return new V3(t, t, t); }, 72, 48), kv = cutZ(vg, false);
    ctx.mesh(kv.body, 'vacuole', sp.vacuole_part || 'vacuole', .7, { film: look() === 'real' ? [.12, .45] : [.14, .5], kind: 'wet', side: THREE.DoubleSide });
    /* its share of the cell, for the words */
    const vol = ctx.vol || volumes(ctx, ctx.box); let inV = 0, inC = 0; for (let i = 0; i < 6000; i++) { const p = new V3(ctx.box.min.x + r() * (ctx.box.max.x - ctx.box.min.x), ctx.box.min.y + r() * (ctx.box.max.y - ctx.box.min.y), ctx.box.min.z + r() * (ctx.box.max.z - ctx.box.min.z)); if (!ctx.inside(p, 0)) continue; inC++; if (ctx.inVacuole ? ctx.inVacuole(p) : ctx.inside(p, c)) inV++; }
    ctx.counts.vacuoleShare = Math.round(inV / Math.max(1, inC) * 100);
    /* chloroplasts: flat lenses against the wall, in the layer */
    const n = Math.round((pr.chloroplasts || 100) / 2), v1 = pr.chloroplast_fl || 30, l = Math.cbrt(v1 / (4 / 3 * Math.PI * .5 * .425 * .225)), mats = [], gr = [];
    const g = new THREE.SphereGeometry(.5, 18, 12); g.scale(l, l * .45, l * .85);
    for (let t = 0; t < n * 80 && mats.length < n; t++) { const d = new V3(gauss(r), gauss(r), gauss(r)).normalize(); if (d.z > -.05) continue; const R0 = rad(d), p = d.clone().multiplyScalar(R0);
      const pl = ctx.planes.reduce((a, b) => (b.n.dot(p) - b.d > a.n.dot(p) - a.d ? b : a)); const q = p.clone().addScaledVector(pl.n, -(P.round_um * .6 + l * .225 + .3));
      if (q.z > -l * .45 || !ctx.inside(q, 0) || inNucleus(ctx, q, l * .45) || mats.some(m => new V3().setFromMatrixPosition(m).distanceTo(q) < l * .9)) continue;
      const qa = qAlong(pl.n).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), r() * TAU)); mats.push(place(q, qa)); }
    ctx.inst(g, 'chloroplast', sp.part || 'chloroplast', 1.6, mats, { kind: 'wet' }); ctx.counts.chloroplasts = mats.length; ctx.counts.chloroplastLength = Math.round(l * 10) / 10;
    if (mats[0]) { const best = mats.map(m => new V3().setFromMatrixPosition(m)).reduce((a, b) => (b.z > a.z ? b : a)); ctx.anchor(sp.part || 'chloroplast', best, ctx.pname(sp.part || 'chloroplast', 'Chloroplast'), 2.6, l); }
    ctx.anchor(sp.vacuole_part || 'vacuole', new V3(P.width_um * .08, -P.height_um * .15, -P.width_um * .3), ctx.pname(sp.vacuole_part || 'vacuole', 'Central vacuole'), 2.4, P.width_um);
    ctx.anchor(sp.wall_part || 'wall', new V3(P.width_um * .5 + wall, P.height_um * .3, 0), ctx.pname(sp.wall_part || 'wall', 'Cell wall'), 2.2, wall);
  };
  /* the matrix round a cell that lies alone in it (a chondrocyte in its lacuna): a faint block of matrix cut open with the cell, and the cavity's wall */
  FEATURE.matrix_block = (ctx, sp) => {
    const pr = sp.params || {}, E = ctx.ext || new V3(10, 10, 10), w = pr.size_um || Math.max(E.x, E.y) * 5, R = Math.max(E.x, E.y, E.z) + (ctx.P.coat_um || 0) + (pr.gap_um || .3);
    const g = new THREE.BoxGeometry(w, w * .8, w, 1, 1, 1); g.translate(0, 0, -w / 2); const m = ctx.mesh(g, 'collagen', sp.part || 'matrix', .05, { film: look() === 'real' ? [.06, .2] : [.05, .18], kind: 'matte', side: THREE.BackSide }); m.renderOrder = 0;
    const lg = new THREE.SphereGeometry(1, 48, 32); lg.scale(E.x + R - Math.max(E.x, E.y, E.z), E.y + R - Math.max(E.x, E.y, E.z), E.z + R - Math.max(E.x, E.y, E.z)); const kl = cutZ(lg, false);
    const ml = ctx.mesh(kl.body, 'collagen', sp.lacuna_part || 'lacuna', .15, { film: look() === 'real' ? [.12, .45] : [.12, .45], kind: 'matte', side: THREE.DoubleSide }); ml.renderOrder = 1;
    ctx.anchor(sp.part || 'matrix', new V3(-w * .3, w * .25, -w * .2), ctx.pname(sp.part || 'matrix', 'Matrix'), 1.6, w); ctx.anchor(sp.lacuna_part || 'lacuna', new V3(R * .72, -R * .72, -.3), ctx.pname(sp.lacuna_part || 'lacuna', 'Lacuna'), 1.9, R * 2);
  };
  /* the marginal band (a platelet): a bundle of microtubules coiled round the rim of the flat disc, which holds its shape; the back half of the ring */
  FEATURE.marginal_band = (ctx, sp) => {
    const pr = sp.params || {}, E = ctx.ext; if (!E) return; const inset = pr.inset_um || .18, rb = (pr.thickness_um || .12) / 2, turns = pr.coils || 3, pts = [], rs = [];
    for (let i = 0; i <= 96; i++) { const a = Math.PI + i / 96 * Math.PI, k = Math.sin(i / 96 * Math.PI * turns * 2) * rb * .8; pts.push(new V3(Math.cos(a) * (E.x - inset - rb) + k * Math.cos(a), k * .6, Math.sin(a) * (E.z - inset - rb))); rs.push(rb); }
    const gb = new GB(); tube(gb, pts, rs, 8, true, true); ctx.mesh(gb.geo(), 'er', sp.part || 'marginal_band', 1.8, { kind: 'matte' });
    ctx.anchor(sp.part || 'marginal_band', pts[60], ctx.pname(sp.part || 'marginal_band', 'Marginal band'), 2.4, rb * 2); ctx.counts.marginalBand = 1;
  };
  /* dense bodies (smooth muscle): small dark bodies through the cytoplasm and plaques on the membrane, and the contractile filament bundles strung between
     them at a slant to the cell's length, a lattice that shortens the cell when it pulls */
  FEATURE.dense_bodies = (ctx, sp) => {
    const pr = sp.params || {}; if (!ctx.box) return; const r = ctx.r, n = pr.count || 220, d = pr.size_um || .4, pts = samplePts(ctx, n, ctx.box, .2, ctx.organOk), mats = [];
    for (const p of pts) mats.push(place(p, new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), (r() - .5) * .6), new V3(1.8, 1, 1)));
    ctx.inst(new THREE.SphereGeometry(d / 2, 8, 6), 'dense', sp.part || 'dense_body', 1.6, mats); ctx.counts.denseBodies = pts.length;
    const gb = new GB(), X = new V3(1, 0, 0), fr = pr.filament_um ? pr.filament_um / 2 : .04; let nf = 0;
    for (const a of pts) { const near = pts.filter(b => b !== a && b.x > a.x).map(b => ({ b, d: a.distanceTo(b), ang: b.clone().sub(a).angleTo(X) })).filter(q => q.d > 1 && q.d < (pr.reach_um || 5) && q.ang > .18 && q.ang < .7).sort((p, q) => p.d - q.d).slice(0, 2);
      for (const q of near) { const m = a.clone().lerp(q.b, .5); if (!ctx.inside(m, .05) || inNucleus(ctx, m, .1)) continue; tube(gb, [a, m, q.b], [fr, fr, fr], 4); nf++; } }
    if (gb.vc) ctx.mesh(gb.geo(), 'myofibril', sp.filaments_part || 'contractile', 1.4, { kind: 'matte' }); ctx.counts.filamentBundles = nf;
    if (pts[0]) { const top = pts.reduce((a, b) => b.z > a.z ? b : a); ctx.anchor(sp.part || 'dense_body', top, ctx.pname(sp.part || 'dense_body', 'Dense body'), 2.3, d * 2); ctx.anchor(sp.filaments_part || 'contractile', top.clone().add(new V3(1.2, .6, 0)), ctx.pname(sp.filaments_part || 'contractile', 'Contractile filaments'), 2.2, 1); }
  };
  /* more cells of the same kind round it, faint: a bundle of smooth muscle cells, or tenocytes in their row */
  FEATURE.bundle = (ctx, sp) => {
    if (!ctx.spindleGeo) return; const pr = sp.params || {}, P = ctx.P, L = P.length_um, W = P.width_um, gb = [], offs = pr.offsets || [[.5, 1.05, -.6], [-.45, -1.05, -.5], [.05, 0, -1.5], [-.5, 1.1, -1.3]];
    for (const [fx, fy, fz] of offs) { const g = ctx.spindleGeo(1); g.translate(fx * L, fy * W, fz * W); const k = cutZ(g, false); gb.push([k.body]); }
    const m = new THREE.Mesh(MDC.merge(gb), ctx.mat(pr.role || 'neighbour', { film: look() === 'real' ? [.1, .5] : [.08, .45], kind: 'wet' })); m.matrixAutoUpdate = false; m.renderOrder = 2; ctx.G.add(m); ctx.tag(m, 'neighbour', -.2);
    ctx.anchor('neighbour', new V3(offs[0][0] * L + L * .2, offs[0][1] * W, offs[0][2] * W), ctx.pname('neighbour', 'Neighbouring cell'), 1.8, W); ctx.counts.bundle = offs.length;
  };
  /* the collagen fibres a tendon cell lies between, and the thin wings of cytoplasm it reaches round them */
  FEATURE.collagen_fibres = (ctx, sp) => {
    const pr = sp.params || {}, P = ctx.P, R = (pr.diameter_um || 22) / 2, Lc = (pr.length_um || P.length_um * 3), th = P.width_um * .3,   // the cell sits in the groove between the two fibres, its edges tucked behind them
      gb = new GB(), wing = new GB();
    const axes = [[0, th + R + .15, -R * .35], [0, -(th + R + .15), -R * .35]];
    for (const [x, y, z] of axes) { const g = new THREE.CylinderGeometry(R, R, Lc, 48, 1, true); g.rotateZ(Math.PI / 2); g.translate(x, y, z); const k = cutZ(g, false); const m = ctx.mesh(k.body, 'collagen', sp.part || 'collagen', .4, { film: look() === 'real' ? [.2, .55] : [.16, .5], kind: 'matte', side: THREE.DoubleSide }); m.renderOrder = 1;
      /* the fibre's fibrils, as fine lines along it on its near face */
      const lines = []; for (let j = 0; j < 14; j++) { const a = j / 14 * TAU, yy = y + Math.cos(a) * R * .985, zz = z + Math.sin(a) * R * .985; if (zz > -.1) continue; lines.push([new V3(-Lc / 2, yy, zz), new V3(Lc / 2, yy, zz)]); }
      for (const [a, b] of lines) tube(gb, [a, b], [.05, .05], 3);
      /* a wing: a thin sheet from the cell's edge spreading round the fibre both ways from where the cell touches it */
      const ul = Math.hypot(y, z), uy = -y / ul, uz = -z / ul, wy = -uz, wz = uy, base = wing.vc, NX = 20, NA = 16, span = (pr.wing_deg || 70) * Math.PI / 180, wl = P.length_um * .85, Rw = R + .12;
      for (let i = 0; i <= NX; i++) { const xx = -wl / 2 + i / NX * wl, taper = Math.max(.15, Math.sin(Math.PI * i / NX)); for (let j = 0; j <= NA; j++) { const a = (j / NA * 2 - 1) * span * taper, cy = Math.cos(a) * uy + Math.sin(a) * wy, cz = Math.cos(a) * uz + Math.sin(a) * wz; wing.v(new V3(xx, y + Rw * cy, z + Rw * cz), new V3(0, cy, cz)); } }
      for (let i = 0; i < NX; i++) for (let j = 0; j < NA; j++) { const q = base + i * (NA + 1) + j; wing.i.push(q, q + NA + 1, q + 1, q + 1, q + NA + 1, q + NA + 2); } }
    ctx.mesh(gb.geo(), 'collagen', sp.part || 'collagen', .45, { film: [.12, .3], kind: 'matte', rough: .9 });
    const kw = cutZ(wing.geo(), false); ctx.mesh(kw.body, 'cell', sp.wing_part || 'processes', 1.1, { side: THREE.DoubleSide, kind: 'wet' });
    ctx.anchor(sp.part || 'collagen', new V3(-P.length_um * .9, th + R * 1.4, -R * .2), ctx.pname(sp.part || 'collagen', 'Collagen fibre'), 1.9, R * 2);
    ctx.anchor(sp.wing_part || 'processes', new V3(P.length_um * .15, th + 1.6, -1), ctx.pname(sp.wing_part || 'processes', 'Wing of cytoplasm'), 2.1, 2); ctx.counts.fibres = axes.length;
  };
  /* swallowed things in sacs (phagosomes): a clear sac with its contents, a dark particle or debris; and empty or lipid-filled vacuoles (a foamy cell) */
  FEATURE.phagosomes = (ctx, sp) => {
    const pr = sp.params || {}; if (!ctx.box) return; const r = ctx.r, n = pr.count || 12, d = pr.size_um || 1.5, pts = samplePts(ctx, n, ctx.box, d / 2 + .1, ctx.organOk), sacs = [], bits = [];
    for (const p of pts) { sacs.push(place(p)); const k = pr.content === 'dust' ? 1 + Math.floor(r() * 3) : 1; for (let j = 0; j < k; j++) bits.push(place(p.clone().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(d * .12)), randQ(r), new V3(.6 + r() * .5, .5 + r() * .4, .6 + r() * .4).multiplyScalar(pr.content === 'dust' ? .55 : 1))); }
    ctx.inst(new THREE.SphereGeometry(d / 2, 16, 12), 'vesicle', sp.part || 'phagosome', 1.3, sacs, { film: [.25, .65], kind: 'wet' });
    ctx.inst(new THREE.IcosahedronGeometry(d * .28, 0), pr.content === 'dust' ? 'dust' : 'debris', sp.content_part || sp.part || 'phagosome', 1.4, bits, { kind: 'matte', rough: .9 });
    ctx.counts[sp.count_key || 'phagosomes'] = pts.length;
    if (pts[0]) ctx.anchor(sp.content_part || sp.part || 'phagosome', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.pname(sp.content_part || sp.part || 'phagosome', 'Phagosome'), 2.4, d);
  };
  FEATURE.vacuoles = (ctx, sp) => {
    const pr = sp.params || {}; if (!ctx.box) return; const n = pr.count || 30, d = pr.size_um || .8, pts = samplePts(ctx, n, ctx.box, d / 2 + .05, ctx.organOk);
    ctx.inst(new THREE.SphereGeometry(d / 2, 12, 9), pr.role || 'lamellar', sp.part || 'vacuole', 1.2, pts.map(p => place(p, null, new V3(1, 1, 1).multiplyScalar(.7 + ctx.r() * .6))), { film: [.3, .75], kind: 'wet' });
    ctx.counts[sp.count_key || 'vacuoles'] = pts.length; if (pts[0]) ctx.anchor(sp.part || 'vacuole', pts.reduce((a, b) => b.z > a.z ? b : a), ctx.pname(sp.part || 'vacuole', 'Vacuole'), 2, d);
  };
  /* lamellipodia: thin ruffled sheets of membrane spreading from the cell's edge, folded in waves (a macrophage's ruffled border) */
  FEATURE.ruffles = (ctx, sp) => {
    const pr = sp.params || {}, E = ctx.ext; if (!E || !pr.sheets) return; const r = ctx.r, gb = new GB(), ext = pr.sheet_um || 5;
    for (let s = 0; s < pr.sheets; s++) { const th0 = (pr.arc_from || -.6) + (s + r() * .5) / pr.sheets * (pr.arc || 2.6), dTh = .3 + r() * .25, base = gb.vc, NU = 28, NV = 8, waves = 3 + Math.floor(r() * 3), amp = ext * (.18 + r() * .12), tiltZ = -.25 - r() * .5;
      for (let i = 0; i <= NU; i++) { const th = th0 + (i / NU - .5) * dTh * 2; for (let j = 0; j <= NV; j++) { const v = j / NV, rad = (1 - .06 + v * ext / Math.max(E.x, E.y)), w = Math.sin(i / NU * Math.PI * waves + s) * amp * v * Math.sin(Math.PI * i / NU);
        const p = new V3(Math.cos(th) * E.x * rad, Math.sin(th) * E.y * rad, tiltZ * E.z * .5 + w + v * tiltZ * ext * .4); gb.v(p, new V3(0, 0, 1)); } }
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const q = base + i * (NV + 1) + j; gb.i.push(q, q + NV + 1, q + 1, q + 1, q + NV + 1, q + NV + 2); } }
    const g = gb.geo(); g.computeVertexNormals(); const k = cutZ(g, false); ctx.mesh(k.body, 'cell', sp.ruffle_part || 'pseudopod', .75, { film: look() === 'real' ? [.3, .7] : [.35, .75], side: THREE.DoubleSide, kind: 'wet' });
    ctx.anchor(sp.ruffle_part || 'pseudopod', new V3(E.x * 1.15, E.y * .25, -E.z * .3), pr.label || 'Ruffles (lamellipodia)', 2, ext); ctx.counts.ruffles = pr.sheets;
  };

  function features(ctx) { for (const sp of ctx.S.special || []) { const f = FEATURE[sp.kind]; if (f) { try { f(ctx, sp); } catch (e) { console.error('cells: feature failed', ctx.S.id, sp.kind, e); } } } }

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
    if (ctx.tiltG) { const G0 = ctx.G; ctx.G = ctx.tiltG; features(ctx); ctx.G = G0; } else features(ctx);
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
    /* A zoom that reaches the next level with nothing picked under the pointer (a scroll toward a point) goes into the part nearest that point: the
       cell never ends in a zoom to nothing. */
    const nearestPart = T => {
      const w = F.root.localToWorld(T.clone()), m4 = new THREE.Matrix4(), p = new V3(), b = new THREE.Box3(); let best = null, bd = Infinity;
      for (const o of F.pickables) {
        const u = o.userData || {}; if (!u.material || (u.priority ?? 1) < 0 || !o.visible) continue; let d;
        if (o.isInstancedMesh) { d = Infinity; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const r = o.geometry.boundingSphere.radius;
          for (let i = 0; i < o.count; i += Math.max(1, Math.floor(o.count / 400))) { o.getMatrixAt(i, m4); p.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); d = Math.min(d, p.distanceTo(w) - r); } }
        else d = b.setFromObject(o).distanceToPoint(w);
        if (d < bd - 1e-9 || (Math.abs(d - bd) <= 1e-9 && (u.priority ?? 1) > ((best && best.userData.priority) ?? 1))) { bd = d; best = o; }
      }
      return best;
    };
    F.spawn = (T, hint) => {
      if (typeof DESCENT === 'undefined') return null;
      let h = hint && hint.obj ? hint : null;
      if (!h) { const o = nearestPart(T); if (o) h = { obj: o, frame: F, id: o.userData.id }; }
      return h ? DESCENT.spawn(F, T, h) : null;
    };
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
