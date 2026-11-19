'use strict';
/* =====================================================================
   NODES: science as a graph of explorable things, placed inside the
   universe zoom. A node = {id, title, kind, template, parents, parts,
   made_of, processes, layers, facts, refs, ...} (data/nodes/*.json).
   ===================================================================== */
const NODE = {};
let NODES_READY = null;
function loadNodes() {
  if (!NODES_READY) NODES_READY = getJSON('data/nodes/manifest.json')
    .then(files => Promise.all(files.map(f => getJSON('data/nodes/' + f).catch(() => []))))
    .then(arrs => { arrs.flat().forEach(n => NODE[n.id] = n); return NODE; })
    .catch(() => NODE);
  return NODES_READY;
}
const nodeTitle = id => (NODE[id] && NODE[id].title) || id.replace(/_/g, ' ');
const PARTMESH = {};    // node id → [meshes] currently in the world (for highlights)
function regMesh(id, m) { (PARTMESH[id] = PARTMESH[id] || []).push(m); const nid = typeof nodeForMesh === 'function' && nodeForMesh(id); if (nid && nid !== id) (PARTMESH[nid] = PARTMESH[nid] || []).push(m); }

/* ---------- clean illustrative look: toon shading + ink outline ---------- */
let _toonGrad = null;
function toonGrad() {
  if (_toonGrad) return _toonGrad;
  const d = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 235, 235, 235, 255, 255, 255, 255, 255]);
  _toonGrad = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat); _toonGrad.minFilter = _toonGrad.magFilter = THREE.NearestFilter; _toonGrad.needsUpdate = true;
  return _toonGrad;
}
/* Opaque by default. A material made here is drawn opaque (no blending, front to back, depth written) exactly while its opacity is 1,
   and turns transparent by itself while anything sets its opacity lower: a layer peeling, a frame fading, a see-through wall.
   (`transparent` is not part of a shader's cache key in three r128, so the switch costs nothing.) Pass extra.transparent = true for a
   material that must always blend. */
function opaqueUnlessFading(m) {
  if (m._autoTr) return m; m._autoTr = true; let op = m.opacity;
  Object.defineProperty(m, 'opacity', { get() { return op; }, set(v) { op = v; this.transparent = v < .995; }, enumerable: true, configurable: true });
  m.transparent = op < .995; return m;
}
/* For a layered figure whose parts are painted in a fixed order whatever their depth (the body: skeleton first, organs after it, skin
   last, so a ghosted skull never veils the brain). Such a material always stays in the opaque pass, where parts that share a position
   are drawn in the order they were made, and blends only while its opacity is below 1; a solid part is then drawn without blending. */
function paintedInOrder(m) {
  let op = m.opacity;
  Object.defineProperty(m, 'opacity', { get() { return op; }, set(v) { op = v; this.blending = v < .995 ? THREE.CustomBlending : THREE.NormalBlending; }, enumerable: true, configurable: true });
  m.transparent = false; m.blending = op < .995 ? THREE.CustomBlending : THREE.NormalBlending; return m;
}
function illoMat(color, o = {}) {
  const m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: toonGrad(), opacity: 1, side: o.double ? THREE.DoubleSide : THREE.FrontSide }, o.extra || {}));
  return o.extra && o.extra.transparent ? m : opaqueUnlessFading(m);
}
function outlineMat(color = 0x1a1f2b, w = .0022) {
  return new THREE.ShaderMaterial({
    uniforms: { uW: { value: w }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: .85 } },
    vertexShader: LDV(`uniform float uW; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vec3 n=normalize(normalMatrix*normal); mv.xyz+=n*(-mv.z)*uW; gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(`uniform vec3 uColor; uniform float uOpacity; void main(){ gl_FragColor=vec4(uColor,uOpacity); }`),
    side: THREE.BackSide, transparent: true, depthWrite: true
  });
}
function inked(geo, color, o = {}) {
  const g = new THREE.Group(), m = new THREE.Mesh(geo, illoMat(color, o)); g.add(m); m.matrixAutoUpdate = false; // the group is what gets placed; the two meshes inside it stay at identity
  if (o.outline !== false) { const ol = new THREE.Mesh(geo, outlineMat(o.ink, o.w)); ol.userData.outline = true; ol.matrixAutoUpdate = false; g.add(ol); g.userData.ol = ol; }
  g.userData.main = m; return g;
}

/* ---------- anatomy meshes ---------- */
let ANAT = null;
function loadAnatomyIndex() {
  if (!ANAT) ANAT = getJSON('data/anatomy/index.json').then(ix => {
    const parts = Array.isArray(ix) ? ix : (ix.parts || []), systems = Array.isArray(ix) ? [] : (ix.systems || []);
    return { parts, systems, byId: Object.fromEntries(parts.map(p => [p.id, p])) };
  }).catch(() => null);
  return ANAT;
}
/* Meshes are fetched and decoded in a worker (js/mesh_worker.js): JSON parsing, unpacking and vertex normals happen off the main
   thread and the typed arrays are transferred, not copied. meshWorker(msg) resolves with the worker's answer; if workers are not
   available or the worker fails, callers fall back to decoding here, as before. loadNote(label, promise) names what is still
   arriving in a small line at the bottom of the view, so a half-loaded park is not mistaken for a finished one. */
const MESHW = { url: (() => { try { return new URL('mesh_worker.js', document.currentScript.src).href; } catch (e) { return 'js/mesh_worker.js'; } })(), w: null, n: 0, wait: {}, ok: typeof Worker !== 'undefined' };
function meshWorker(msg) {
  return new Promise((res, rej) => {
    if (!MESHW.ok) { rej(new Error('no worker')); return; }
    try {
      if (!MESHW.w) {
        MESHW.w = new Worker(MESHW.url);
        MESHW.w.onmessage = e => { const p = MESHW.wait[e.data.id]; delete MESHW.wait[e.data.id]; if (p) (e.data.ok ? p.res(e.data) : p.rej(new Error(e.data.error))); };
        MESHW.w.onerror = e => { if (e && e.preventDefault) e.preventDefault(); MESHW.ok = false; const w = MESHW.wait; MESHW.wait = {}; Object.values(w).forEach(p => p.rej(new Error('mesh worker failed'))); };
      }
      const id = ++MESHW.n; MESHW.wait[id] = { res, rej }; MESHW.w.postMessage(Object.assign({ id }, msg));
    } catch (e) { MESHW.ok = false; rej(e); }
  });
}
const absURL = path => new URL(path, document.baseURI).href;
function geoFromArrays(d, copyPos) { // a geometry from arrays the worker decoded (copyPos: the caller will move the vertices, so it gets its own positions)
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(copyPos ? d.pos.slice() : d.pos, 3));
  g.setIndex(new THREE.BufferAttribute(d.idx, 1)); g.setAttribute('normal', new THREE.BufferAttribute(d.nrm, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(d.bs[0], d.bs[1], d.bs[2]), d.bs[3]); return g;
}
const ANAT_FILES = {};
function loadAnatomyFile(file) { // {parts: [...]}: each part already decoded (part.dec) when the worker did it, raw (part.pos, part.idx) otherwise
  return ANAT_FILES[file] || (ANAT_FILES[file] = meshWorker({ op: 'anatomy', url: absURL('data/anatomy/' + file) }).catch(() => getJSON('data/anatomy/' + file)));
}
const LOADING = new Map(); let _loadEl = null;
function loadNote(label, promise) {
  if (typeof document === 'undefined' || !promise || !promise.then) return promise;
  const key = {}; LOADING.set(key, label);
  const draw = () => {
    if (!_loadEl) { _loadEl = document.createElement('div'); _loadEl.id = 'loadNote'; _loadEl.setAttribute('role', 'status'); document.body.appendChild(_loadEl); }
    const names = [...new Set(LOADING.values())];
    _loadEl.textContent = names.length ? 'Still loading: ' + names.slice(0, 4).join(', ') + (names.length > 4 ? ` and ${names.length - 4} more` : '') : '';
    _loadEl.classList.toggle('on', names.length > 0);
  };
  const done = () => { LOADING.delete(key); draw(); };
  draw(); promise.then(done, done); return promise;
}
function decodePart(p) {
  if (p.dec) return geoFromArrays(p.dec, true);
  const n = p.pos.length / 3, pos = new Float32Array(p.pos.length), s = p.scale, o = p.offset;
  for (let i = 0; i < n; i++) { pos[i * 3] = p.pos[i * 3] * s[0] + o[0]; pos[i * 3 + 1] = p.pos[i * 3 + 1] * s[1] + o[1]; pos[i * 3 + 2] = p.pos[i * 3 + 2] * s[2] + o[2]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(p.idx.length > 65535 ? new THREE.Uint32BufferAttribute(p.idx, 1) : new THREE.Uint16BufferAttribute(p.idx, 1));
  g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}
const SYS_COL = { integumentary: 0xcf9f82, skin: 0xcf9f82, skeletal: 0xf1e9d2, muscular: 0xc4544e, nervous: 0xf2c94c, cardiovascular: 0xd63c3c, respiratory: 0xf29bb0, digestive: 0xe0a46a, urinary: 0x9b3d4a, endocrine: 0x9b6bd6, lymphatic: 0x5cb85c, lymphatic_immune: 0x5cb85c, sensory: 0xffffff, reproductive: 0xd98cb3 };
const PART_COL = { liver: 0x8c3a2e, heart: 0xc0392b, vena_cava: 0x3b6fd6, gallbladder: 0x4f9a4f, spleen: 0x7a3a6a, kidney_l: 0x8e3442, kidney_r: 0x8e3442, brain: 0xd99a9a, cerebrum_l: 0xd99a9a, cerebrum_r: 0xd99a9a, cerebellum: 0xc98585, brainstem: 0xc98a78, spinal_cord: 0xf2c94c, eye_l: 0xf8f8f8, eye_r: 0xf8f8f8, lung_l: 0xf4a6b8, lung_r: 0xf4a6b8, diaphragm: 0xb5524b, thyroid: 0x9b6bd6 };
const MODES = {
  skin: { skin: 1 },
  muscles: { muscular: 1, skeletal: .5, skin: .06 },
  skeleton: { skeletal: 1, skin: .06 },
  organs: { skin: .08, skeletal: .22, muscular: 0, '*': 1 },
  nervous: { nervous: 1, skeletal: .2, skin: .06 },
  circulatory: { cardiovascular: 1, skeletal: .2, skin: .06 },
  all: { skin: .1, muscular: .25, '*': 1 },
};
const MESH_ALIAS = { cerebrum_l: 'brain', cerebrum_r: 'brain', eyeball_l: 'eye_l', eyeball_r: 'eye_r', ribs_l: 'ribcage', ribs_r: 'ribcage', radius_l: 'radius_ulna_l', ulna_l: 'radius_ulna_l', radius_r: 'radius_ulna_r', ulna_r: 'radius_ulna_r', tibia_l: 'tibia_fibula_l', fibula_l: 'tibia_fibula_l', tibia_r: 'tibia_fibula_r', fibula_r: 'tibia_fibula_r', hip_bone_l: 'pelvis', hip_bone_r: 'pelvis', abdominal_muscles: 'rectus_abdominis', back_muscles_l: 'latissimus_dorsi', back_muscles_r: 'latissimus_dorsi', colon: 'large_intestine', rectum: 'large_intestine', appendix: 'large_intestine', superior_vena_cava: 'vena_cava', inferior_vena_cava: 'vena_cava', carotid_l: 'carotid_arteries', carotid_r: 'carotid_arteries', ureter_l: 'ureters', ureter_r: 'ureters', adrenal_l: 'adrenal_glands', adrenal_r: 'adrenal_glands', lv_cavity: 'left_ventricle', rv_cavity: 'right_ventricle', heart_valves: 'mitral_valve', papillary_muscles: 'left_ventricle', pulmonary_trunk: 'blood_vessels', pulmonary_vessels: 'blood_vessels', pituitary: 'pituitary_gland' };
function nodeForMesh(id) {
  if (NODE[id]) return id;
  let a = MESH_ALIAS[id]; if (a === undefined) a = id.replace(/_(l|r)$/, '');
  if (a && NODE[a]) return a; if (/^(arteries|veins)_/.test(id) && NODE.blood_vessels) return 'blood_vessels';
  return null;
}
function sysOf(p) { return p.system === 'integumentary' || p.id === 'skin' ? 'skin' : p.system; }

FT.body = {
  build(F) {
    F.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, .55)); const kl = new THREE.DirectionalLight(0xffffff, .85); kl.position.set(1.5, 3, 2.5); F.add(kl);
    F.parts = {}; F.mode = store.get('bodyMode', 'auto'); F.illo = true; F.layered = true; F.hidden = new Set(); F.sel = null; F.layerName = '';
    F.readyP = new Promise(res => { F._ready = res; });
    F.chooseHit = cands => bodyChooseHit(F, cands);
    const grp = new THREE.Group(); F.add(grp); F.grp = grp;
    F.blurb = 'You, as an anatomical model at true size. Click anywhere to see what is under that spot; double-click a part to look inside it. Zoom in and the skin turns see-through: first muscles, then bones and organs.';
    Promise.all([loadAnatomyIndex(), loadNodes()]).then(([A]) => {
      if (!A || !F.built) return;
      const files = [...new Set(A.parts.map(p => p.file))];
      /* Parts are painted in the order of the anatomy index (skeleton, muscles, nerves, vessels, organs ...), so a ghosted skull never veils the
         brain. It used to be the order in which the files happened to arrive, which changed from one page load to the next. */
      const rank = {}; A.parts.forEach((p, i) => { rank[p.id] = i; });
      loadNote('the human body', F.readyP);
      Promise.all(files.map(file => loadAnatomyFile(file).then(S => {
        if (!F.built) return;
        S.parts.forEach(p => {
          if (p.parent) { (F.detail = F.detail || {})[p.parent] = (F.detail[p.parent] || []).concat([p]); return; }
          const g = inked(decodePart(p), (p.id === 'skin' ? 0xcf9f82 : 0) || PART_COL[p.id] || (p.color ? new THREE.Color(p.color).getHex() : 0) || SYS_COL[p.system] || 0xcccccc, { w: p.id === 'skin' ? .0012 : .0018, double: p.id === 'skin', extra: { transparent: true } });
          paintedInOrder(g.userData.main.material); // layers are painted in the order the parts were made, as before; a solid part is drawn without blending
          { const om = g.userData.ol.material; om.transparent = false; om.blending = THREE.CustomBlending; } // the ink too stays in that pass (render order 0: before every part, so ghost layers veil it as they always did)
          bodySurface(g.userData.main.material); // fine grain, so a close-up of a smooth part still has something to read
          const big = () => p.radius > .1;
          Object.assign(g.userData, {
            id: p.id, node: nodeForMesh(p.id), part: p, priority: 1, madeOf: 'tissue', title: p.name, op: 1, shown: 1, rank: (rank[p.id] ?? 0) * 1e-4,
            tipFn: h => bodyTip(F, p, h),
            // a large part (skin, a long muscle) is zoomed at the clicked point; a small one at its centre
            center: h => (h && h.pointLocal && big() ? h.pointLocal.clone() : new V3(...p.center)), radius: h => (h && h.pointLocal && big() ? .05 : p.radius),
            extent: () => ({ p: new V3(...p.center), r: p.radius })   // the whole part: what a click frames
          });
          g.userData.main.userData.pickRoot = g; g.userData.main.material.userData.noHL = true;
          if (p.id === 'lung_l' || p.id === 'lung_r') { // the data is the airway tree only: wrap it in a schematic lung outline (see lungShellGeo)
            const sh = new THREE.Mesh(lungShellGeo(g.userData.main.geometry, A.byId.heart), new THREE.MeshToonMaterial({ color: 0xf0b3c0, gradientMap: toonGrad(), transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide }));
            sh.renderOrder = 3; g.add(sh); g.userData.shell = sh; sh.material.userData.noHL = true;
          }
          g.traverse(o => { o.matrixAutoUpdate = false; }); // body parts never move: their matrices are composed once (identity), not every frame
          grp.add(g); F.pickables.push(g); F.parts[p.id] = { g, p }; regMesh(p.id, g);
        });
      }))).then(() => {
        if (!F.built) return;
        F.mats = null; applyMode(F);
        if (FR.park && FR.park.v2 && F.parts.skin) FR.park.v2.parts.human.visible = false;
        F.partsReady = true; F._ready();
      });
      const lab = new THREE.Object3D(); lab.position.set(0, 1.95, 0); lab.userData.id = 'skin'; lab.userData.node = 'skin'; lab.userData.title = 'You'; F.add(lab); F.label(lab, 'You', { cls: 'you' });
    });
    const modes = [['auto', 'Auto'], ['skin', 'Skin'], ['muscles', 'Muscles'], ['skeleton', 'Skeleton'], ['organs', 'Organs'], ['nervous', 'Nerves'], ['circulatory', 'Heart & vessels']];
    F.modeSeg = seg(modes, F.mode, k => { F.mode = k; store.set('bodyMode', k); applyMode(F); });
    F.showAllBtn = actBtn('Show everything', () => { F.hidden.clear(); F.reveal = null; applyMode(F); toast('Everything is back.'); }); F.showAllBtn.style.display = 'none';
    F.env = { bg: 0x0e1422, opaque: false };
    F.update = (dt, t) => { F._k = 1 - Math.exp(-Math.min(dt, .25) * 9); bodyAutoUpdate(F, dt); applyMode(F); pulse(F, t); F.env.opaque = cam.D < .75 && chainOf(cam.A).includes(F) && !chainOf(cam.A).some(f => f.type === 'tissue' || f.type === 'cell'); };
    F.spawn = (T, hint) => {
      if (!hint || !hint.obj || !hint.obj.userData.part) return null;
      const id = hint.obj.userData.id, n = NODE[nodeForMesh(id)], tis = n && n.made_of && n.made_of[0];
      return tissueFrame(tis || id, T, id);
    };
    F.spawnD = .012; F.floorD = .0015; // no zooming into an empty gap: a part's tissue takes over at spawnD, otherwise the view stops here
  }
};
// the layers Auto shows as the camera comes closer: skin, then muscles, then bones and organs
function autoLayers(D) {
  const far = smooth(.85, 1.3, D), mid = smooth(.4, .65, D);
  const muscle = (1 - far) * mid;
  return { M: { skin: lerp(.06, 1, far), muscular: .95 * muscle + .08 * (1 - muscle) * (1 - far), skeletal: .3 * (1 - mid), '*': 1 - mid }, name: far > .5 ? 'skin' : mid > .5 ? 'muscles' : 'organs and bones' };
}
function applyMode(F) {
  let M = MODES[F.mode], layer = '';
  if (F.mode === 'auto') {
    if (chainOf(cam.A).some(f => f.device)) M = { skin: .07, skeletal: .22, muscular: 0, '*': 1 };
    else if (cam.A !== F && !chainOf(cam.A).includes(F)) M = { skin: 1, muscular: 0, skeletal: 0, '*': 0 };
    else { const A = F.auto, a = A && A.P ? { M: A.P.op, name: A.P.focus } : autoLayers(cam.D); M = a.M; layer = a.name; }
  } else if (F.reveal && F.auto && F.auto.P) M = F.auto.P.op; // a part was asked for (search, chip): everything in front of it gives way, in any mode
  if (F.reveal && F.auto && F.auto.P && F.mode !== 'auto') layer = 'showing ' + (F.parts[F.reveal.id] ? F.parts[F.reveal.id].p.name.toLowerCase() : '');
  if (F.hidden.size) { M = { '*': 1 }; if (F.mode === 'auto') layer = 'peeled'; } // something is peeled away: show what is behind it, all of it solid
  if (F.modeSeg && F._layer !== layer) { F._layer = layer; const b = F.modeSeg.querySelector('[data-k=auto]'); if (b) b.textContent = layer ? 'Auto: ' + layer : 'Auto'; }
  const focus = bodyFocus(F), hov = hovered && hovered.userData && hovered.userData.part ? hovered : null;
  let vs = 0, vi = 0; // which parts can be seen (and so picked): when that changes, the hover under a resting pointer is worked out again
  const olK = F.C ? outlineAmt(1.75 / Math.max(F.C.distanceTo(F.center || V3Z), 1e-6) * PX_PER_RAD()) : 1; // outlines fade out as the figure gets small on screen (outline=near)
  for (const id in F.parts) {
    const { g, p } = F.parts[id], u = g.userData, s = M.vessel !== undefined && isVessel(p) ? 'vessel' : sysOf(p);
    let op = M[s] !== undefined ? M[s] : (M['*'] !== undefined ? M['*'] : 0);
    if (F.reveal && F.auto && F.auto.P && !F.hidden.size) { if (F.reveal.id === id) op = 1; else if (F.auto.front && F.auto.front.has(id)) op = Math.min(op, PEEL_GHOST_MUSCLE); }
    if (F.auto && F.auto.P && !focus && !F.hidden.size && (F.mode === 'auto' || F.reveal)) { const c = F.auto.cur, k = F._k || 1; c[id] = c[id] === undefined ? op : c[id] + (op - c[id]) * k; op = c[id]; } // ease, so layers fade rather than pop
    if (focus) op = focus.opts.meshes.includes(id) ? (focus.alpha > .9 ? 0 : Math.max(op, .6) * (1 - focus.alpha)) : op * (1 - focus.alpha);
    u.op = op;
    const isSel = F.sel === id, isHov = hov === g && op >= BODY_VISIBLE_OP, hl = isSel || isHov; // a ghost layer is not highlighted by pointing at it (its ink outline made a flat blue wall)
    let ev = op; if (isSel) ev = Math.max(ev, .6); // the part a card is about is drawn solid enough to read; hovering never pulls a ghost layer back (it made a flat wall)
    const m = u.main.material; m.opacity = ev * F.alpha; m.depthWrite = ev > .9;
    if (u.shell) u.shell.material.opacity = .5 * ev * F.alpha;
    g.visible = ev > .01 && (!F.hidden.has(id) || isSel);
    u.shown = g.visible ? op : 0; vi++; if (u.shown >= BODY_VISIBLE_OP) vs = (vs * 31 + vi) | 0;
    u.ol.visible = (ev > .5 && olK > .02) || (hl && ev > .2); u.ol.material.uniforms.uOpacity.value = .85 * Math.max(ev * olK, hl ? .9 : 0) * F.alpha;
    u.ol.material.uniforms.uColor.value.setHex(hl ? 0x1e4e8f : 0x1a1f2b);
    u.main.renderOrder = (s === 'skin' ? 2 : 1) + u.rank; u.ol.renderOrder = u.rank; // ink first, then the parts in index order, the skin last
  }
  if (vs !== F._vs) { F._vs = vs; viewChanged(); }
  if (F.showAllBtn) { const n = F.hidden.size, on = n || F.reveal, d = on ? '' : 'none'; if (F.showAllBtn.style.display !== d) F.showAllBtn.style.display = d; const t = n ? `Show everything (${n} hidden)` : F.reveal ? 'Show everything' : ''; if (on && F.showAllBtn.textContent !== t) F.showAllBtn.textContent = t; }
}
// an organ view is open (the camera is inside it): the body behind it gives way
function bodyFocus(F) { const o = F.focus; return o && o.alpha > .02 && chainOf(cam.A).includes(o) ? o : null; }
function pulse(F, t) { // emissive: the current process step pulses, the hovered or selected part glows softly
  const hl = PROC.active ? PROC.focus : null, hov = hovered && hovered.userData && hovered.userData.part ? hovered : null;
  for (const id in F.parts) {
    const { g } = F.parts[id], m = g.userData.main.material, on = hl && (hl.includes(id) || hl.includes(nodeForMesh(id))), k = (F.sel === id ? .07 : 0) + (hov === g ? .06 : 0);
    m.emissive.setRGB(on ? .35 + .25 * Math.sin(t * 5) + k : k, on ? .2 + .15 * Math.sin(t * 5) + k : k * 1.05, k * 1.3);
  }
}

/* ---------- organ frame: a cut-open organ with labeled inner parts ---------- */
// The left lung, kidney and eye have no hotspot data of their own: they reuse the right-hand organ's (mirrored), which is anatomically fair.
const ORGAN_MIRROR = { lung_l: 'lung_r', kidney_l: 'kidney_r', eye_l: 'eye_r' };
function makeOrganFrames(body, A) { // built from the anatomy index, so the frames exist before any mesh has loaded
  const has = {}; Object.values(NODE).forEach(n => { if (n.hotspot && n.hotspot.of) (has[n.hotspot.of] = has[n.hotspot.of] || []).push(n.id); });
  for (const m in ORGAN_MIRROR) if (has[ORGAN_MIRROR[m]] && !has[m]) has[m] = has[ORGAN_MIRROR[m]];
  for (const oid in has) {
    if (oid === 'skin' || body.children.some(c => c.opts && c.opts.organ === oid)) continue;
    const meshes = A.parts.filter(p => !p.parent && p.id !== 'skin' && nodeForMesh(p.id) === oid).map(p => p.id); if (!meshes.length) continue;
    const c = new V3(); meshes.forEach(id => c.add(new V3(...A.byId[id].center))); c.divideScalar(meshes.length);
    let R = 0; meshes.forEach(id => R = Math.max(R, c.distanceTo(new V3(...A.byId[id].center)) + A.byId[id].radius));
    const f = body.addChild(new Frame({ type: 'organ', name: nodeTitle(oid), unit: 1, radius: R * 1.25, core: R, r0: 0, r1: Math.max(R * 5.5, .35), spawnD: R * .15, pos: c, opts: { organ: oid, meshes, R, hotspots: has[oid], mirror: !!ORGAN_MIRROR[oid] } }));
    f.pinned = true; f.enterOnly = true; f.floorD = R * .05; // cut-open views are entered on purpose (Look inside, double-click, a landmark, a jump to one of its parts), never by scrolling past
  }
}
FT.organ = {
  build(F, o) {
    const body = F.parent; F.illo = true;
    F.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, .6)); const kl = new THREE.DirectionalLight(0xffffff, .8); kl.position.set(1, 2, 3); F.add(kl);
    renderer.localClippingEnabled = true;
    const plane = new THREE.Plane(new V3(0, 0, -1), 0); // keep the back half: cut along the frontal plane
    const cutMats = []; F.cut = true;
    seg([['cut', 'Cut open'], ['whole', 'Whole']], 'cut', k => { F.cut = k === 'cut'; const cp = F.cut ? [plane] : []; cutMats.forEach(m => { m.clippingPlanes = cp; m.needsUpdate = true; }); });
    F.update = () => { plane.constant = F.root.position.z; }; // clipping planes live in world space; the frame root moves with the camera
    // a hit on the half that has been cut away does not count
    F.chooseHit = cands => { let best = null; for (const c of cands) { if (F.cut && plane.distanceToPoint(c.hit.point) < 0) continue; if (!best || c.pri > best.pri) best = c; } return best; };
    F.blurb = `${nodeTitle(o.organ)}, cut open. A model of a typical adult, simplified. Click a yellow marker or any part to learn what it does.${/^lung_/.test(o.organ) ? ' ' + LUNG_NOTE : ''}`;
    F.onDispose = () => { dead = true; if (body.focus === F) body.focus = null; };
    F.spawn = (T, hint) => {
      const id = hint && hint.obj && hint.obj.userData.node || o.organ, n = NODE[id];
      return tissueFrame((n && n.made_of && n.made_of[0]) || (NODE[o.organ] && NODE[o.organ].made_of && NODE[o.organ].made_of[0]) || o.organ, T, id);
    };
    body.focus = F;
    let dead = false;
    const fill = () => { // needs the body's meshes: if they are still loading, fill in when they arrive
      if (dead || F.filled) return;
      const c = F.pos.clone(), P = { radius: o.R }, mir = o.mirror ? -1 : 1;
      const addMesh = (geo, col, nodeId, pri, title, shell) => {
        // the three meshes of a cut-open part are painted in a fixed order (ink, lit inside, outside: renderOrder below), so all three stay in the blended pass
        const outer = new THREE.Mesh(geo, illoMat(col, { extra: { clippingPlanes: F.cut ? [plane] : [], transparent: true } }));
        if (shell) { outer.material.opacity = .38; outer.material.depthWrite = false; } // a see-through wall: what is inside it shows
        // the inside of the cut: lit from within so it reads as a hollow, not a black hole
        const inner = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: new THREE.Color(col).multiplyScalar(.75), emissive: new THREE.Color(col).multiplyScalar(.28), gradientMap: toonGrad(), side: THREE.BackSide, clippingPlanes: F.cut ? [plane] : [], transparent: true }));
        const ol = new THREE.Mesh(geo, outlineMat()); ol.material.clippingPlanes = F.cut ? [plane] : [];
        ol.renderOrder = 0; ol.material.depthWrite = false; inner.renderOrder = 1; outer.renderOrder = shell ? 4 : 2; // the ink never paints over the lit inside of the cut
        if (shell) { ol.visible = false; inner.material.opacity = .9; inner.material.emissive.multiplyScalar(1.6); }
        const g = new THREE.Group(); g.add(outer, inner, ol); g.userData = { id: nodeId, node: NODE[nodeId] ? nodeId : null, priority: pri, madeOf: 'tissue', title: title || nodeTitle(nodeId) }; g.userData.main = outer;
        F.add(g); F.pickables.push(g); regMesh(nodeId, g); cutMats.push(outer.material, inner.material, ol.material);
      };
      const det = [];
      o.meshes.forEach(mid => (body.detail && body.detail[mid] || []).forEach(p => det.push(p)));
      if (det.length) det.filter(p => !/cavity/.test(p.id)).forEach(p => { const g = decodePart(p); g.translate(-c.x, -c.y, -c.z); addMesh(g, p.color ? new THREE.Color(p.color).getHex() : 0xc0392b, nodeForMesh(p.id) || o.organ, 1, p.name); });
      else o.meshes.forEach(mid => { const src = body.parts[mid]; if (!src) return; const g = src.g.userData.main.geometry.clone(); g.translate(-c.x, -c.y, -c.z); addMesh(g, PART_COL[mid] || (src.p.color ? new THREE.Color(src.p.color).getHex() : 0) || SYS_COL[src.p.system] || 0xcccccc, o.organ, 1, src.p.name); });
      if (/^lung_/.test(o.organ)) { // the lung: its wall (schematic, see lungShellGeo) around its airway tree and the main airways
        o.meshes.forEach(mid => { const src = body.parts[mid], sh = src && src.g.userData.shell; if (!sh) return; const g = sh.geometry.clone(); g.translate(-c.x, -c.y, -c.z); addMesh(g, 0xf0b3c0, o.organ, 1, nodeTitle(o.organ), true); });
        const br = body.parts.bronchi, tr = body.parts.trachea;
        [br, tr].forEach(src => { if (!src) return; const g0 = src.g.userData.main.geometry, pa = g0.attributes.position, ix = g0.index.array, keep = [], t = new V3();
          for (let i = 0; i < ix.length; i += 3) { t.set(0, 0, 0); for (let k = 0; k < 3; k++) t.add(new V3(pa.getX(ix[i + k]), pa.getY(ix[i + k]), pa.getZ(ix[i + k]))); t.divideScalar(3); if (t.distanceTo(c) < o.R * 1.15 && (t.y < c.y + o.R * 1.05)) keep.push(ix[i], ix[i + 1], ix[i + 2]); }
          if (!keep.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', pa.clone()); g.setIndex(keep); g.computeVertexNormals(); g.translate(-c.x, -c.y, -c.z); addMesh(g, 0x9fb7d6, nodeForMesh(src.p.id) || o.organ, 1, src.p.name); });
      }
      const dotG = new THREE.SphereGeometry(P.radius * (o.hotspots.length > 6 ? .026 : .045), 16, 12); // many markers (the brain has 12) are drawn smaller so they do not pile up
      o.hotspots.forEach(hid => {
        const n = NODE[hid]; if (!n || !n.hotspot || !n.hotspot.at) return;
        const at = new V3(...n.hotspot.at); at.x *= mir; if (at.length() > P.radius * 1.6) at.setLength(P.radius * .8);
        const g = inked(dotG, 0xffd166, { w: .004, extra: { transparent: true } }); g.position.copy(at); F.add(g); // a marker is painted over everything, ink first then fill: both stay in the blended pass, where renderOrder decides
        g.userData.main.renderOrder = 11; g.userData.ol.renderOrder = 10; // marker above its own outline
        g.children.forEach(m => { m.material.depthTest = false; });
        Object.assign(g.userData, { id: hid, node: hid, priority: 4, title: n.hotspot.label || n.title, center: () => at.clone(), radius: () => P.radius * .12, madeOf: 'tissue' }); g.userData.main.userData.pickRoot = g; F.pickables.push(g); regMesh(hid, g);
        F.label(g, n.hotspot.label || n.title, { offset: new V3(0, P.radius * .07, 0) });
      });
      F.filled = true;
    };
    if (body.partsReady) fill(); else if (body.readyP) body.readyP.then(fill);
  }
};

/* ---------- tissue frame (µm): illustrative micro-anatomy ---------- */
function tissueKind(id) {
  const s = id || '';
  if (/cardiac/.test(s)) return 'cardiac'; if (/skeletal_muscle|muscle_fiber|^muscle/.test(s)) return 'skeletal'; if (/smooth/.test(s)) return 'smooth';
  if (/blood|plasma|erythro|red_blood/.test(s)) return 'blood'; if (/compact_bone|bone|osteon|osseous/.test(s)) return 'bone'; if (/cartilage/.test(s)) return 'cartilage';
  if (/adipose|fat/.test(s)) return 'adipose'; if (/nerv|neur|brain|glia|spinal/.test(s)) return 'nervous'; if (/alveol|lung|respir/.test(s)) return 'alveoli';
  if (/villi|intestin|enterocyte|columnar/.test(s)) return 'villi'; if (/hepat|liver|lobule/.test(s)) return 'liver';
  return 'epithelium';
}
function tissueFrame(nodeId, T, organId) {
  return new Frame({ type: 'tissue', name: nodeTitle(nodeId), unit: 1e-6, radius: 400, r0: 1e-6, r1: 2e-3, spawnD: 3e-5, pos: T.clone(), opts: { node: nodeId, organ: organId, kind: tissueKind(nodeId + ' ' + (organId || '')) } });
}
const TISSUE_CELL = { cardiac: 'cardiomyocyte', skeletal: 'skeletal_muscle_fiber', smooth: 'smooth_muscle_cell', blood: 'red_blood_cell', bone: 'osteocyte', cartilage: 'chondrocyte', adipose: 'adipocyte', nervous: 'neuron', alveoli: 'red_blood_cell', villi: 'enterocyte', liver: 'hepatocyte', epithelium: 'keratinocyte' };
FT.tissue = {
  build(F, o) {
    F.env = { opaque: true, bg: 0xf3efe6 }; F.illo = true;
    F.add(new THREE.HemisphereLight(0xffffff, 0x998877, .7)); const kl = new THREE.DirectionalLight(0xffffff, .7); kl.position.set(2, 4, 3); F.add(kl);
    const r = rng(o.kind.length * 17 + 3), K = o.kind, cellId = TISSUE_CELL[K];
    const pick = (g, id) => { g.userData = Object.assign(g.userData || {}, { id, node: NODE[id] ? id : null, priority: 3, madeOf: 'cell' }); if (g.userData.main) g.userData.main.userData.pickRoot = g; F.pickables.push(g); regMesh(id, g); return g; };
    const pal = { cardiac: [0xd9737a, 0x7a3b6b], skeletal: [0xd96a6a, 0x6b3b7a], smooth: [0xe08a8a, 0x6b3b7a], blood: [0xd93030, 0xf4e0b0], bone: [0xeee3c8, 0x8a7a5a], cartilage: [0xcfe3ee, 0x6a7fa0], adipose: [0xf6e7a8, 0x8a6a3a], nervous: [0xf2d36b, 0x8a5ac0], alveoli: [0xf4b6c2, 0xd93030], villi: [0xf0b98a, 0x7a4b9b], liver: [0xb5584a, 0x5a2a6a], epithelium: [0xf0c7a8, 0x7a4b9b] }[K];
    const nucMat = 0x5b3a8c;
    if (K === 'cardiac' || K === 'skeletal' || K === 'smooth') {
      const stripes = canvasTex('stripe_' + K, 64, 8, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); if (K !== 'smooth') { g.fillStyle = 'rgba(80,20,40,.35)'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 3, h); } }, { wrap: true });
      const n = K === 'skeletal' ? 14 : 26;
      for (let i = 0; i < n; i++) {
        const len = K === 'skeletal' ? 900 : K === 'cardiac' ? 110 : 160, rad = K === 'skeletal' ? 30 : K === 'cardiac' ? 9 : 4;
        const geo = K === 'smooth' ? new THREE.SphereGeometry(1, 24, 12).scale(len / 2, rad, rad).rotateZ(Math.PI / 2) : new THREE.CylinderGeometry(rad, rad, len, 24, 1).rotateZ(Math.PI / 2);
        const m = new THREE.Mesh(geo, illoMat(pal[0], { extra: { map: stripes } })); stripes.repeat.set(len / 2, 1);
        const g = new THREE.Group(); g.add(m); const ol = new THREE.Mesh(geo, outlineMat(0x3a1f2b, .003)); g.add(ol); g.userData.main = m;
        const row = Math.floor(i / (K === 'skeletal' ? 4 : 6)), col = i % (K === 'skeletal' ? 4 : 6);
        g.position.set((col - 2.5) * (K === 'cardiac' ? 120 : 30) + (row % 2) * 50, (row - 1.5) * rad * 2.4, (r() - .5) * 20);
        if (K === 'skeletal') g.position.set(0, (row - 1.5) * 64, (col - 1.5) * 64);
        g.rotation.z = (r() - .5) * (K === 'cardiac' ? .4 : .05);
        const nn = K === 'skeletal' ? 10 : 1; for (let k = 0; k < nn; k++) { const nu = inked(new THREE.SphereGeometry(1, 12, 8).scale(K === 'skeletal' ? 6 : 4, 2.5, 2.5), nucMat, { w: .003 }); nu.position.set(K === 'skeletal' ? (k - 4.5) * 85 : 0, K === 'skeletal' ? rad * .92 : 0, 0); g.add(nu); }
        F.add(pick(g, cellId));
      }
    } else if (K === 'blood' || K === 'alveoli') {
      const lathe = new THREE.LatheGeometry([...Array(14)].map((_, i) => { const t = i / 13, x = t * 3.9; return new THREE.Vector2(x, (.5 + 1.1 * Math.sin(t * Math.PI * .5) * (1 - t * t * .3)) * (1 - Math.pow(t, 6)) * (t < .4 ? .5 + t : 1)); }).concat([new THREE.Vector2(3.9, 0)]), 24);
      const rbc = new THREE.BufferGeometry().copy(lathe); const lg2 = lathe.clone().scale(1, -1, 1);
      for (let i = 0; i < 70; i++) { const g = new THREE.Group(); [rbc, lg2].forEach(gg => g.add(new THREE.Mesh(gg, illoMat(0xd93030, { double: true })))); g.userData.main = g.children[0]; g.position.set((r() - .5) * 160, (r() - .5) * 80, (r() - .5) * 160); g.rotation.set(r() * 6, r() * 6, r() * 6); F.add(pick(g, 'red_blood_cell')); }
      for (let i = 0; i < 4; i++) { const g = inked(new THREE.IcosahedronGeometry(6, 2), 0xf4f0ff); g.position.set((r() - .5) * 140, (r() - .5) * 60, (r() - .5) * 140); const nu = inked(new THREE.SphereGeometry(3, 12, 8), nucMat); nu.position.x = 2; g.add(nu); F.add(pick(g, ['neutrophil', 'lymphocyte_t', 'macrophage', 'lymphocyte_b'][i])); }
      for (let i = 0; i < 12; i++) { const g = inked(new THREE.SphereGeometry(1, 10, 8).scale(1.5, .6, 1.2), 0xd6b8f0); g.position.set((r() - .5) * 150, (r() - .5) * 70, (r() - .5) * 150); F.add(pick(g, 'platelet')); }
      if (K === 'alveoli') { for (let i = 0; i < 9; i++) { const g = inked(new THREE.SphereGeometry(100, 32, 24), 0xf4b6c2, { double: true }); g.userData.main.material.opacity = .45; g.position.set((i % 3 - 1) * 210, -150, (Math.floor(i / 3) - 1) * 210); F.add(pick(g, NODE.alveoli ? 'alveoli' : 'lung_l')); } }
    } else if (K === 'bone') {
      for (let i = 0; i < 7; i++) { const g = new THREE.Group(), cx = (i % 4 - 1.5) * 220 + (Math.floor(i / 4) * 110), cz = (Math.floor(i / 4) - .5) * 200;
        for (let k = 5; k >= 1; k--) { const ring = inked(new THREE.CylinderGeometry(k * 20, k * 20, 300, 48, 1, true), k % 2 ? 0xeee3c8 : 0xe2d3ae, { double: true }); g.add(ring); }
        const canal = inked(new THREE.CylinderGeometry(10, 10, 302, 24), 0xc0392b); g.add(canal); g.userData.main = canal.userData.main;
        for (let k = 0; k < 14; k++) { const a = r() * TAU, d = 30 + r() * 60, oc = inked(new THREE.SphereGeometry(1, 10, 8).scale(6, 3, 3), nucMat); oc.position.set(Math.cos(a) * d, (r() - .5) * 260, Math.sin(a) * d); g.add(oc); }
        g.position.set(cx, 0, cz); F.add(pick(g, NODE.osteon ? 'osteon' : 'osteocyte')); }
    } else if (K === 'adipose' || K === 'cartilage') {
      for (let i = 0; i < 40; i++) { const s = K === 'adipose' ? 45 + r() * 30 : 14; const g = inked(new THREE.IcosahedronGeometry(s, 3), pal[0]); g.position.set((i % 7 - 3) * (K === 'adipose' ? 95 : 70) + (r() - .5) * 20, (Math.floor(i / 7) - 2.5) * (K === 'adipose' ? 95 : 70), (r() - .5) * 40); const nu = inked(new THREE.SphereGeometry(1, 12, 8).scale(6, 3, 6), nucMat); nu.position.set(s * .7, 0, s * .5); g.add(nu); F.add(pick(g, cellId)); }
      if (K === 'cartilage') { const mx = inked(new THREE.BoxGeometry(520, 420, 60), 0xdfeef6); mx.userData.main.material.opacity = .5; mx.position.z = -40; F.add(pick(mx, NODE.hyaline_cartilage ? 'hyaline_cartilage' : 'chondrocyte')); }
    } else if (K === 'nervous') {
      for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const soma = inked(new THREE.IcosahedronGeometry(14, 2), pal[0]); g.add(soma); g.userData.main = soma.userData.main;
        for (let k = 0; k < 7; k++) { const pts = [new V3()]; let d = new V3(gauss(r), gauss(r), gauss(r) * .4).normalize(), p = new V3(); const L = k === 0 ? 14 : 5; for (let j = 0; j < L; j++) { d.add(new V3(gauss(r), gauss(r), gauss(r) * .3).multiplyScalar(.25)).normalize(); p = p.clone().addScaledVector(d, k === 0 ? 30 : 16); pts.push(p); } g.add(inked(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, k === 0 ? 2.2 : 1.6, 6), k === 0 ? 0xf7e3a0 : pal[0], { w: .002 })); }
        g.position.set((i % 3 - 1) * 200, (Math.floor(i / 3) - .5) * 180, (r() - .5) * 60); F.add(pick(g, 'neuron')); }
      for (let i = 0; i < 14; i++) { const g = inked(new THREE.IcosahedronGeometry(7, 1), 0x8fc0e8); g.position.set((r() - .5) * 600, (r() - .5) * 400, (r() - .5) * 80); F.add(pick(g, 'astrocyte')); }
    } else if (K === 'villi') {
      for (let i = 0; i < 25; i++) { const h = 500 + r() * 200; const g = inked(new THREE.CylinderGeometry(55, 70, h, 32), pal[0]); g.position.set((i % 5 - 2) * 170, h / 2 - 300, (Math.floor(i / 5) - 2) * 170); F.add(pick(g, NODE.villi ? 'villi' : 'enterocyte')); }
    } else if (K === 'liver') {
      for (let i = 0; i < 60; i++) { const g = inked(new THREE.BoxGeometry(24, 24, 24), pal[0]); const a = i / 60 * TAU * 3, d = 60 + (i % 20) * 12; g.position.set(Math.cos(a) * d, (r() - .5) * 20, Math.sin(a) * d); g.rotation.y = -a; const nu = inked(new THREE.SphereGeometry(5, 10, 8), nucMat); g.add(nu); F.add(pick(g, 'hepatocyte')); }
      const cv = inked(new THREE.CylinderGeometry(25, 25, 80, 24), 0x3b6fd6); F.add(pick(cv, NODE.liver_lobule ? 'liver_lobule' : 'hepatocyte'));
    } else { // stratified epithelium (skin-like) or simple layers
      for (let y = 0; y < 6; y++) for (let i = 0; i < 9; i++) for (let k = 0; k < 4; k++) {
        const flat = 1 - y / 6, w = 22 + (1 - flat) * 14, hgt = 6 + flat * 14; const g = inked(new THREE.BoxGeometry(w, hgt, w), new THREE.Color(pal[0]).offsetHSL(0, 0, (y - 3) * .025).getHex(), { w: .002 });
        g.position.set((i - 4) * (w + 2) + (y % 2) * 10, -y * (hgt + 2) * 1.2 + 40, (k - 1.5) * (w + 2)); if (y > 0) { const nu = inked(new THREE.SphereGeometry(4, 10, 8), nucMat); g.add(nu); } F.add(pick(g, y === 0 ? (NODE.stratum_corneum ? 'stratum_corneum' : cellId) : cellId));
      }
    }
    const n = NODE[o.node];
    F.info = n; F.name = n ? n.title : nodeTitle(o.node);
    F.blurb = n ? n.summary : 'Tissue: cells of a few kinds working together.';
    F.note = 'An illustration of this kind of tissue, not a microscope image: the shapes and the arrangement of the cells are simplified.';
    F.spawn = (T, hint) => { const id = hint && hint.obj && hint.obj.userData.id || cellId; return new Frame({ type: 'cell', name: nodeTitle(id), unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone(), opts: { type: 'animal', node: id } }); };
  }
};

/* ---------- node info panel ---------- */
function chipList(ids, label) {
  const ok = (ids || []).filter(Boolean); if (!ok.length) return '';
  return `<div class="refs"><div class="rh">${label}</div><div class="chips">${ok.map(i => `<button class="chip nd" data-n="${i}">${nodeTitle(i)}</button>`).join('')}</div></div>`;
}
function kindLine(n) { const k = (n.kind || '').replace(/_/g, ' '); const K = k ? k[0].toUpperCase() + k.slice(1) : ''; return n.scale_m && n.id !== 'skin' ? `${K}${K ? ', ' : ''}about ${roughLen(n.scale_m)} across` : K; }
function roughLen(m) { return fmtLen(m).replace(/^(\d+)\.\d+ /, '$1 ').replace(/^(\d)\.(\d)\d /, '$1.$2 '); }
/* Extension points for other frame types (things.js uses them; nothing here knows about things):
   CARD_HOOKS: fn(id, h, node) runs after a node card has been built (add buttons, notes).
   GOTO_HOOKS: fn(id) runs first in goToNode and returns true when it handled the jump.
   A frame with `layered = true` (and parts {id: {g, p}}, hidden Set, sel, reveal) gets the body's click features: the core sample, "Hide this", "Peel to here".
   A frame may define cardMadeOf(h, node) -> {label, go()} | null to replace the card's "See what it is made of" button. */
const CARD_HOOKS = [], GOTO_HOOKS = [];
function showBodyNode(id, h) {
  const n = NODE[id]; if (!n) return false;
  const BF = h && h.frame && h.frame.layered && h.frame.parts ? h.frame : null; // a click on a layered frame (the body, a thing): answer "what is under here?"
  if (BF) { if (h.ndc && !h.stack) h.stack = bodyCoreSample(BF, h); BF.sel = h.obj && h.obj.userData.part ? h.obj.userData.id : null; }
  else if (FR.body) FR.body.sel = null;
  if (FR.body && h) FR.body.reveal = null;
  infoState = { h, node: id };
  const L = n.layers || {};
  let basics = `<p><b>${n.summary || ''}</b></p>${L.basics ? `<p>${L.basics}</p>` : ''}`;
  if (n.did_you_know) basics += `<div class="fun"><b>Did you know?</b>${n.did_you_know}</div>`;
  if (n.formula) basics += `<div class="formula">${n.formula}</div>`;
  const canLook = h && h.frame && h.frame.children && h.frame.children.some(c => c.type === 'organ' && c.opts.organ === id);
  const hideable = BF && h.obj && h.obj.userData.part;
  const chips = (ids, cls = 'chip nd', attr = 'data-n') => chipsHtml((ids || []).filter(Boolean).map(i => `<button class="${cls}" ${attr}="${i}">${nodeTitle(i)}</button>`));
  const mo = h && h.frame && h.frame.cardMadeOf ? h.frame.cardMadeOf(h, n) : undefined; // a frame may replace the made-of button (things: the part's own `deeper`)
  const tw = (typeof TEAR !== 'undefined' && (TEAR[id] || (n.where && TEAR[n.where]))) || (n.where && /^(place|mol|crystal):/.test(n.where));
  const spec = {
    tag: kindLine(n), title: n.title, figure: '<div class="vzh" id="vizHost"></div>', core: BF && h.stack ? coreHtml(BF, h) : '', track: trackNav(id),
    basics, deeper: L.deeper, expert: L.expert, facts: n.facts,
    buttons: (h ? LOOK_BTNS : '') + (mo !== undefined ? (mo ? `<button class="zoom alt" id="madeBtn">${mo.label}</button>` : '') : h && n.made_of && n.made_of.length && !(BF && BF.type === 'body' && !canLook) ? `<button class="zoom alt" id="madeBtn">${BF && BF.type === 'body' ? 'Look at its tissue' : 'See what it is made of'}</button>` : '') + (hideable ? `<button class="zoom alt" id="hideBtn">Hide this</button>` : '')
      + (n.lab ? `<button class="zoom lab" id="labBtn">${labAvailable(n.lab.id) ? 'Open in the ' : 'Planned: '}${LAB_NAMES[n.lab.id] || n.lab.id}</button>` : '') + (tw && !h ? `<button class="zoom alt" id="whereBtn">Show where it is</button>` : ''),
    after: (/^lung_[lr]$/.test(id) && (BF && BF.type === 'body' || canLook || (h && h.frame && h.frame.type === 'organ')) ? `<p class="cnote">${LUNG_NOTE}</p>` : '') + (BF && BF.type === 'body' && mo === undefined && n.made_of && n.made_of.length && !canLook ? `<p class="cnote">There is no cut-open view of this part yet. "Look inside" (or a double click) shows an illustration of the kind of tissue it is made of, not a microscope image.</p>` : ''),
    made: (n.parts && n.parts.length ? '<div class="rs">Parts</div>' + chips(n.parts) : '') + (n.made_of && n.made_of.length ? (n.parts && n.parts.length ? '<div class="rs">Made of</div>' : '') + chips(n.made_of) : ''),
    part: chips(n.parents),
    how: n.processes && n.processes.length ? chips(n.processes, 'chip pr', 'data-p') : '',
    more: (n.related && n.related.some(i => NODE[i]) ? `<div class="refs"><div class="rh">Compare with</div>${chips(n.related.filter(i => NODE[i]))}</div>` : '')
      + (n.needs && n.needs.length ? `<div class="refs"><div class="rh">Builds on</div>${chips(n.needs)}</div>` : '')
      + (n.molecules && n.molecules.length ? `<div class="refs"><div class="rh">Key molecules</div>${chips(n.molecules.map(m => NODE[m] ? m : null))}</div>` : '')
      + (n.ext && n.ext.length ? `<div class="refs"><div class="rh">Further reading</div>${n.ext.map(e => `<a class="ref" href="${e.url}" target="_blank" rel="noopener"><b>${e.title}</b></a>`).join('')}</div>` : ''),
    books: n.refs && n.refs.length ? n.refs.map(r => bookRef(r[0], r[1])).join('') : '',
    open: n.open_questions && n.open_questions.length ? `<ul class="ev">${n.open_questions.map(q => `<li>${q}</li>`).join('')}</ul>` : '',
    cert: n.certainty,
  };
  openPanel(cardHtml(spec), { key: 'node:' + id, reopen: () => showBodyNode(id, h) });
  mountViz($('#vizHost'), id); wireTrackNav();
  wireLookBtns(h);
  const mb = $('#madeBtn'); if (mb && mo) mb.onclick = () => { closeInfo(); mo.go(); };
  else if (mb) mb.onclick = () => { closeInfo(); const f = tissueFrame(n.made_of[0], h.pointLocal || h.frame.C, id); f.dynamic = true; f.keep = performance.now() + 60000; h.frame.addChild(f); f.ensure(); flyTo(f, new V3(), 4e-4); };
  if (BF && h.stack) wireCore(BF, h);
  const hb = $('#hideBtn'); if (hb) hb.onclick = () => bodyHide(BF, h.obj.userData.id);
  const lb = $('#labBtn'); if (lb) lb.onclick = () => openLab(n.lab.id, n.lab.preset, n.title);
  const wb = $('#whereBtn'); if (wb) wb.onclick = () => goToNode(id);
  CARD_HOOKS.forEach(fn => fn(id, h, n));
  markSeen(id);
  return true;
}
function focusNode(id) { // fly to a node if it is drawn somewhere nearby, else just show its info
  const ms = (PARTMESH[id] || []).filter(m => m.parent && m.visible !== false);
  const m = ms.find(x => { let o = x; while (o && o.parent) o = o.parent; return true; });
  const F = m && drawn.find(f => f.root && isUnder(m, f.root));
  if (m && F) {
    const c = m.userData.center ? m.userData.center() : m.getWorldPosition(new V3()).add(F.C), r = m.userData.radius ? m.userData.radius() : .05;
    const h = { frame: F, obj: m, id, pointLocal: c.clone() }; showBodyNode(id, h); flyTo(F, c, Math.max(r * 4, F.unit * 1e-3));
  } else showBodyNode(id, null);
}
function isUnder(o, root) { while (o) { if (o === root) return true; o = o.parent; } return false; }

/* ---------- processes: step-by-step "how it works" ---------- */
const PROC = { active: null, i: 0, focus: [] };
function startProcess(id) {
  const n = NODE[id]; if (!n || !n.steps) return;
  PROC.active = n; PROC.i = 0; renderProc();
}
function renderProc() {
  let el = $('#proc'); if (!el) { el = document.createElement('section'); el.id = 'proc'; el.setAttribute('aria-label', 'How it works, step by step'); ($('#procSlot') || document.body).appendChild(el); } // a section of the one panel, above the card
  const n = PROC.active; if (!n) { el.classList.remove('open'); PROC.focus = []; return; }
  const s = n.steps[PROC.i]; PROC.focus = s.focus || [];
  el.innerHTML = `<div class="ph"><b>${n.title}</b><span>Step ${PROC.i + 1} of ${n.steps.length}</span><button class="x" id="procX" title="Close these steps">Close</button></div><h3>${s.title}</h3><p>${s.text}</p><div class="pb"><button id="procP" ${PROC.i ? '' : 'disabled'}>Back</button><div class="dots">${n.steps.map((_, i) => `<i class="${i === PROC.i ? 'on' : ''}"></i>`).join('')}</div><button id="procN">${PROC.i < n.steps.length - 1 ? 'Next step' : 'Finish'}</button></div>`;
  el.classList.add('open');
  $('#procX').onclick = () => { PROC.active = null; renderProc(); };
  $('#procP').onclick = () => { PROC.i = Math.max(0, PROC.i - 1); renderProc(); };
  $('#procN').onclick = () => { if (PROC.i < n.steps.length - 1) { PROC.i++; renderProc(); } else { PROC.active = null; renderProc(); } };
  const f0 = PROC.focus.find(id => (PARTMESH[id] || []).length); if (f0) focusNode(f0);
}
const GOTO_NEAR = { thyroid: 'larynx' }; // body nodes with no mesh of their own: the nearest part that has one
/* jump to a node from anywhere (search, chips): fly to the body part if it has a mesh, else show its card */
function goToNode(id, then) {
  const n = NODE[id]; if (!n) { if (then) safeThen(then); return; }
  goToNode1(id);
  if (then) afterFlight(then);
}
/* run fn when the camera flight that has just been started ends (at once if none runs) */
function afterFlight(fn) {
  let n = 0; const tick = () => { if (!fly || ++n > 4000) safeThen(fn); else setTimeout(tick, 120); };
  setTimeout(tick, 60);
}
function goToNode1(id) {
  const n = NODE[id];
  for (const fn of GOTO_HOOKS) if (fn(id)) return;
  const tw = TEAR[id] || (n.where && TEAR[n.where]) || (n.hotspot && TEAR[n.hotspot.of]);
  if (tw) { showBodyNode(id, null); if (tw.frame && tw.frame.ensure) tw.frame.ensure(); if (tw.frame && tw.frame.showPart && id !== 'smartphone') tw.frame.showPart(TEAR[id] ? id : n.where && TEAR[n.where] ? n.where : n.hotspot && n.hotspot.of, id); flyTo(tw.frame, tw.pos, tw.D); return; }
  if (n.where && !TEAR[n.where] && n.where !== id && placeGo(n.where, id)) { setTimeout(() => showBodyNode(id, null), 0); return; }
  const body = FR.body, ix = ANAT_SYNC, parts = nid => ix ? ix.parts.filter(p => !p.parent && p.id !== 'skin' && nodeForMesh(p.id) === nid) : [];
  const organOf = oid => body && body.children.find(c => c.type === 'organ' && c.opts.organ === oid);
  // 1. the part has its own cut-open view: go there. 2. it is a hotspot inside an organ: go to that organ's view, at the hotspot.
  const own = organOf(id);
  if (own) { showBodyNode(id, null); flyTo(own, new V3(), own.opts.R * 2.2); return; }
  const of0 = n.hotspot && n.hotspot.of, of = GOTO_PARENT[of0] || of0; // a tissue-level hotspot (a nephron, a long bone, the skin) belongs to the body part that holds it
  const org = of && organOf(of);
  if (org) { showBodyNode(id, null); if (of === of0 && n.hotspot.at) { const at = new V3(...n.hotspot.at); if (org.opts.mirror) at.x = -at.x; flyTo(org, at, org.opts.R * 1.2); } else flyTo(org, new V3(), org.opts.R * 2.2); return; }
  // 3. otherwise stay in the whole-body view: peel what is in front of the part, highlight it, centre it and name it
  const skinP = ix && ix.parts.filter(p => p.id === 'skin');
  let P = id === 'skin' ? skinP : parts(id);
  if (!P.length && of) P = of === 'skin' ? skinP : parts(of);
  if (!P.length && GOTO_NEAR[id]) { P = parts(GOTO_NEAR[id]); if (P.length) toast(`The model has no separate ${n.title.toLowerCase()}; showing ${nodeTitle(GOTO_NEAR[id]).toLowerCase()}, which it sits against.`); }
  if (body && P.length) {
    const c = new V3(); P.forEach(p => c.add(new V3(...p.center))); c.divideScalar(P.length);
    let R = 0; P.forEach(p => R = Math.max(R, c.distanceTo(new V3(...p.center)) + p.radius));
    showBodyNode(id, null);
    const main = P.slice().sort((a, b) => b.radius - a.radius)[0], skinOnly = main.id === 'skin';
    body.sel = main.id; if (!skinOnly) body.reveal = { id: main.id };
    if (!skinOnly) { const d = new V3(0, .05, c.z < -.02 ? -1 : 1).normalize(), u = new V3(0, 1, 0); convertD(d, body, cam.A); convertD(u, body, cam.A); cam.dir.copy(d); cam.up.copy(u); } // look at it from the side it is nearer to (the camera's vectors live in the anchor frame)
    flyTo(body, c, Math.max(Math.min(R, .6) * 3.2, .15));
    camHold = body; // the flight ends here, not in a frame that happens to sit next to the part (the phone in the hand)
    return;
  }
  showBodyNode(id, null);
}
const GOTO_PARENT = { nephron: 'kidney_r', long_bone: 'femur_r', skin: 'skin' }; // tissue-level hotspot parents with no organ view of their own
let ANAT_SYNC = null; loadAnatomyIndex().then(a => ANAT_SYNC = a);

/* ---------- "where it lives": fly to a topic's home in the world ---------- */
function parkPointOf(id, fallback) {
  const park = FR.park; if (!park || !park.built) return fallback.clone();
  const m = park.pickables.find(o => o.userData && o.userData.id === id); if (!m) return fallback.clone();
  park.root.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m); const c = b.getCenter(new V3()).sub(park.root.position);
  if (id === 'tree') c.y = b.max.y - park.root.position.y - 1; if (id === 'pond') c.y = b.max.y - park.root.position.y; return c;
}
function placeChild(parent, f, D) { f.dynamic = true; f.keep = performance.now() + 90000; parent.addChild(f); f.ensure(); flyTo(f, new V3(), D); }
function placeGo(w) {
  if (!w || !FR.park) return false;
  const micro = (kind, at) => () => { FR.park.ensure(); placeChild(FR.park, microFrame(kind, at()), 1.2e-3); };
  const P = {
    'place:park': () => flyTo(FR.park, new V3(0, 1, 0), 60),
    'place:human': () => flyTo(FR.body, new V3(0, 1, 0), 3),
    'place:skin': () => { if (FR.skin.place) FR.skin.place(); flyTo(FR.skin, new V3(), 1.5e-3); },
    'place:cell': () => flyTo(FR.cell, new V3(), 4e-5),
    'place:dna': () => flyTo(FR.dna, new V3(), 2e-8),
    'place:base_pair': () => flyTo(FR.bp, new V3(), 3e-9),
    'place:atom': () => { if (FR.atom.place) FR.atom.place(); flyTo(FR.atom, new V3(), 3.2e-10); },
    'place:earth': () => flyTo(FR.earth, new V3(), 3e7),
    'place:leaf': micro('leaf', () => parkPointOf('tree', new V3(-6, 6, -4))),
    'place:pond': micro('pond', () => parkPointOf('pond', new V3(8, 0, -6))),
    'place:soil': micro('soil', () => new V3(1.2, 0, 1.4)),
    'place:air': micro('air', () => new V3(0, 2.6, 2.5)),
  };
  if (P[w]) { P[w](); return true; }
  if (w.startsWith('mol:')) { FR.park.ensure(); placeChild(FR.park, new Frame({ type: 'mol', name: w.slice(4), unit: 1e-10, radius: 40, r1: 2.5e-8, spawnD: 1e-9, pos: new V3(1.2, .01, 1.4), opts: { mol: w.slice(4), stand: !!(arguments[1] && NODE[arguments[1]] && NODE[arguments[1]].kind !== 'molecule') } }), 3.2e-9); return true; } // a molecule topic: the molecule frame in the park, away from the DNA frames that sit in the cell
  if (w.startsWith('crystal:')) { FR.park.ensure(); placeChild(FR.park, crystalFrame(w.slice(8), new V3(1.2, 0.01, 1.4)), 4e-9); return true; }
  if (NODE[w] && w !== arguments[1]) { goToNode(w); return true; }
  return false;
}
