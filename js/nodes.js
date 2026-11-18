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
function regMesh(id, m) { (PARTMESH[id] = PARTMESH[id] || []).push(m); }

/* ---------- clean illustrative look: toon shading + ink outline ---------- */
let _toonGrad = null;
function toonGrad() {
  if (_toonGrad) return _toonGrad;
  const d = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 235, 235, 235, 255, 255, 255, 255, 255]);
  _toonGrad = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat); _toonGrad.minFilter = _toonGrad.magFilter = THREE.NearestFilter; _toonGrad.needsUpdate = true;
  return _toonGrad;
}
function illoMat(color, o = {}) {
  return new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: toonGrad(), transparent: true, opacity: 1, side: o.double ? THREE.DoubleSide : THREE.FrontSide }, o.extra || {}));
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
  const g = new THREE.Group(), m = new THREE.Mesh(geo, illoMat(color, o)); g.add(m);
  if (o.outline !== false) { const ol = new THREE.Mesh(geo, outlineMat(o.ink, o.w)); ol.userData.outline = true; g.add(ol); g.userData.ol = ol; }
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
function decodePart(p) {
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
const MESH_ALIAS = { cerebrum_l: 'brain', cerebrum_r: 'brain', eyeball_l: 'eye_l', eyeball_r: 'eye_r', ribs_l: 'ribcage', ribs_r: 'ribcage', radius_l: 'radius_ulna_l', ulna_l: 'radius_ulna_l', radius_r: 'radius_ulna_r', ulna_r: 'radius_ulna_r', tibia_l: 'tibia_fibula_l', fibula_l: 'tibia_fibula_l', tibia_r: 'tibia_fibula_r', fibula_r: 'tibia_fibula_r', hip_bone_l: 'pelvis', hip_bone_r: 'pelvis', abdominal_muscles: 'rectus_abdominis', back_muscles_l: 'latissimus_dorsi', back_muscles_r: 'latissimus_dorsi', colon: 'large_intestine', rectum: 'large_intestine', appendix: 'large_intestine', superior_vena_cava: 'vena_cava', inferior_vena_cava: 'vena_cava', carotid_l: 'carotid_arteries', carotid_r: 'carotid_arteries', ureter_l: 'ureters', ureter_r: 'ureters', adrenal_l: 'adrenal_glands', adrenal_r: 'adrenal_glands', lv_cavity: 'left_ventricle', rv_cavity: 'right_ventricle', heart_valves: 'mitral_valve', papillary_muscles: 'left_ventricle', pulmonary_trunk: 'blood_vessels', pulmonary_vessels: 'blood_vessels', teeth: null, tongue: null, hyoid: null };
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
    F.parts = {}; F.mode = store.get('bodyMode', 'auto'); F.illo = true;
    const grp = new THREE.Group(); F.add(grp); F.grp = grp;
    F.blurb = 'You, as an anatomical model at true size. Pick a layer below, or zoom in: the skin turns see-through as you get close. Click any organ.';
    Promise.all([loadAnatomyIndex(), loadNodes()]).then(([A]) => {
      if (!A || !F.built) return;
      const files = [...new Set(A.parts.map(p => p.file))];
      files.forEach(file => getJSON('data/anatomy/' + file).then(S => {
        if (!F.built) return;
        S.parts.forEach(p => {
          if (p.parent) { (F.detail = F.detail || {})[p.parent] = (F.detail[p.parent] || []).concat([p]); return; }
          const g = inked(decodePart(p), (p.id === 'skin' ? 0xcf9f82 : 0) || PART_COL[p.id] || (p.color ? new THREE.Color(p.color).getHex() : 0) || SYS_COL[p.system] || 0xcccccc, { w: p.id === 'skin' ? .0012 : .0018, double: p.id === 'skin' });
          Object.assign(g.userData, { id: p.id, node: nodeForMesh(p.id), part: p, priority: p.id === 'skin' ? 1 : p.system === 'skeletal' ? 1.6 : 2.5, madeOf: 'tissue', center: () => new V3(...p.center), radius: () => p.radius });
          g.userData.main.userData.pickRoot = g;
          grp.add(g); F.pickables.push(g); F.parts[p.id] = { g, p }; regMesh(p.id, g);
          if (!g.userData.node) g.userData.info = { title: p.name, tag: p.system, body: '' };
        });
        F.mats = null; applyMode(F);
        if (FR.park && FR.park.v2 && F.parts.skin) FR.park.v2.parts.human.visible = false;
        makeOrganFrames(F, A);
      }));
      const lab = new THREE.Object3D(); lab.position.set(0, 1.95, 0); F.add(lab); F.label(lab, 'You', { cls: 'you' });
    });
    const modes = [['auto', 'Auto'], ['skin', 'Skin'], ['muscles', 'Muscles'], ['skeleton', 'Skeleton'], ['organs', 'Organs'], ['nervous', 'Nerves'], ['circulatory', 'Heart & vessels']];
    seg(modes, F.mode, k => { F.mode = k; store.set('bodyMode', k); applyMode(F); });
    F.env = { bg: 0x0e1422, opaque: false };
    F.update = (dt, t) => { applyMode(F); pulse(F, t); F.env.opaque = cam.D < .75 && chainOf(cam.A).includes(F) && !chainOf(cam.A).some(f => f.type === 'tissue' || f.type === 'cell'); };
    F.spawn = (T, hint) => {
      if (!hint || !hint.obj || !hint.obj.userData.part) return null;
      const id = hint.obj.userData.id, n = NODE[id], tis = n && n.made_of && n.made_of[0];
      return tissueFrame(tis || id, T, id);
    };
    F.spawnD = .012;
  }
};
function applyMode(F) {
  let M = MODES[F.mode];
  if (F.mode === 'auto') { const k = chainOf(cam.A).some(f => f.device) ? 1 : smooth(.35, 1.1, cam.D); M = { skin: lerp(.07, 1, k), skeletal: lerp(.22, 0, k), muscular: 0, '*': lerp(1, 0, k) }; if (cam.A !== F && !chainOf(cam.A).includes(F)) M = { skin: 1 }; }
  const focus = F.focus && F.focus.alpha > .02 ? F.focus : null;
  for (const id in F.parts) {
    const { g, p } = F.parts[id], s = sysOf(p);
    let op = M[s] !== undefined ? M[s] : (M['*'] !== undefined ? M['*'] : 0);
    if (focus) op = focus.opts.meshes.includes(id) ? (focus.alpha > .9 ? 0 : Math.max(op, .6)) : op * (1 - .93 * focus.alpha);
    const m = g.userData.main.material; m.opacity = op * F.alpha; m.depthWrite = op > .9; g.visible = op > .01;
    g.userData.ol.visible = op > .5; g.userData.ol.material.uniforms.uOpacity.value = .85 * op * F.alpha;
    g.userData.main.renderOrder = s === 'skin' ? 2 : 1;
  }
}
function pulse(F, t) { // highlight parts in the current process step
  const hl = PROC.active ? PROC.focus : null;
  for (const id in F.parts) { const m = F.parts[id].g.userData.main.material; const on = hl && hl.includes(id); m.emissive.setRGB(on ? .35 + .25 * Math.sin(t * 5) : 0, on ? .2 + .15 * Math.sin(t * 5) : 0, 0); }
}

/* ---------- organ frame: a cut-open organ with labeled inner parts ---------- */
function makeOrganFrames(body, A) {
  const has = {}; Object.values(NODE).forEach(n => { if (n.hotspot && n.hotspot.of) (has[n.hotspot.of] = has[n.hotspot.of] || []).push(n.id); });
  for (const oid in has) {
    if (oid === 'skin' || body.children.some(c => c.opts && c.opts.organ === oid)) continue;
    const meshes = Object.keys(body.parts).filter(id => nodeForMesh(id) === oid && id !== 'skin'); if (!meshes.length) continue;
    const c = new V3(); meshes.forEach(id => c.add(new V3(...body.parts[id].p.center))); c.divideScalar(meshes.length);
    let R = 0; meshes.forEach(id => R = Math.max(R, c.distanceTo(new V3(...body.parts[id].p.center)) + body.parts[id].p.radius));
    const f = body.addChild(new Frame({ type: 'organ', name: nodeTitle(oid), unit: 1, radius: R * 1.6, r0: 0, r1: Math.max(R * 7, .35), spawnD: R * .15, pos: c, opts: { organ: oid, meshes, R, hotspots: has[oid] } }));
    f.pinned = true;
  }
}
FT.organ = {
  build(F, o) {
    const body = F.parent; if (!body.parts) return; F.illo = true;
    body.focus = F;
    F.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, .6)); const kl = new THREE.DirectionalLight(0xffffff, .8); kl.position.set(1, 2, 3); F.add(kl);
    const c = F.pos.clone(), P = { radius: o.R };
    renderer.localClippingEnabled = true;
    const plane = new THREE.Plane(new V3(0, 0, -1), 0); // keep the back half: cut along the frontal plane
    const cutMats = [];
    const addMesh = (geo, col, nodeId, pri) => {
      const outer = new THREE.Mesh(geo, illoMat(col, { extra: { clippingPlanes: [plane] } }));
      const inner = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: new THREE.Color(col).multiplyScalar(.8), gradientMap: toonGrad(), side: THREE.BackSide, clippingPlanes: [plane], transparent: true }));
      const ol = new THREE.Mesh(geo, outlineMat()); ol.material.clippingPlanes = [plane];
      const g = new THREE.Group(); g.add(outer, inner, ol); g.userData = { id: nodeId, node: NODE[nodeId] ? nodeId : null, priority: pri, madeOf: 'tissue' }; g.userData.main = outer;
      F.add(g); F.pickables.push(g); regMesh(nodeId, g); cutMats.push(outer.material, inner.material, ol.material);
    };
    const det = [];
    o.meshes.forEach(mid => (body.detail && body.detail[mid] || []).forEach(p => det.push(p)));
    if (det.length) det.filter(p => !/cavity/.test(p.id)).forEach(p => { const g = decodePart(p); g.translate(-c.x, -c.y, -c.z); addMesh(g, p.color ? new THREE.Color(p.color).getHex() : 0xc0392b, nodeForMesh(p.id) || o.organ, p.detail ? 2 : 1.5); });
    else o.meshes.forEach(mid => { const src = body.parts[mid]; const g = src.g.userData.main.geometry.clone(); g.translate(-c.x, -c.y, -c.z); addMesh(g, PART_COL[mid] || (src.p.color ? new THREE.Color(src.p.color).getHex() : 0) || SYS_COL[src.p.system] || 0xcccccc, o.organ, 1); });
    seg([['cut', 'Cut open'], ['whole', 'Whole']], 'cut', k => { const cp = k === 'cut' ? [plane] : []; cutMats.forEach(m => { m.clippingPlanes = cp; m.needsUpdate = true; }); });
    const dotG = new THREE.SphereGeometry(P.radius * .045, 16, 12);
    F.update = () => { plane.constant = F.root.position.z; }; // clipping planes live in world space; the frame root moves with the camera
    o.hotspots.forEach((hid, i) => {
      const n = NODE[hid]; if (!n || !n.hotspot || !n.hotspot.at) return;
      const at = new V3(...n.hotspot.at); if (at.length() > P.radius * 1.6) at.setLength(P.radius * .8);
      const g = inked(dotG, 0xffd166, { w: .004 }); g.position.copy(at); F.add(g); g.children.forEach(m => { m.material.depthTest = false; m.renderOrder = 10; });
      Object.assign(g.userData, { id: hid, node: hid, priority: 4, center: () => at.clone(), radius: () => P.radius * .12, madeOf: 'tissue' }); g.userData.main.userData.pickRoot = g; F.pickables.push(g); regMesh(hid, g);
      F.label(g, n.hotspot.label || n.title, { offset: new V3(0, P.radius * .07, 0) });
    });
    F.blurb = `${nodeTitle(o.organ)}, cut open. Click a yellow marker to learn what each part does.`;
    F.onDispose = () => { if (body.focus === F) body.focus = null; };
    F.spawn = (T, hint) => {
      const id = hint && hint.obj && hint.obj.userData.node || o.organ, n = NODE[id];
      return tissueFrame((n && n.made_of && n.made_of[0]) || (NODE[o.organ] && NODE[o.organ].made_of && NODE[o.organ].made_of[0]) || o.organ, T, id);
    };
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
      for (let i = 0; i < 25; i++) { const h = 500 + r() * 200; const g = inked(new THREE.CapsuleGeometry ? new THREE.CylinderGeometry(55, 70, h, 32) : new THREE.CylinderGeometry(55, 70, h, 32), pal[0]); g.position.set((i % 5 - 2) * 170, h / 2 - 300, (Math.floor(i / 5) - 2) * 170); F.add(pick(g, NODE.villi ? 'villi' : 'enterocyte')); }
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
    F.spawn = (T, hint) => { const id = hint && hint.obj && hint.obj.userData.id || cellId; return new Frame({ type: 'cell', name: nodeTitle(id), unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T.clone(), opts: { type: 'animal', node: id } }); };
  }
};

/* ---------- node info panel ---------- */
function chipList(ids, label) {
  const ok = (ids || []).filter(Boolean); if (!ok.length) return '';
  return `<div class="refs"><div class="rh">${label}</div><div class="chips">${ok.map(i => `<button class="chip nd" data-n="${i}">${nodeTitle(i)}</button>`).join('')}</div></div>`;
}
function kindLine(n) { const k = (n.kind || '').replace(/_/g, ' '); const K = k ? k[0].toUpperCase() + k.slice(1) : ''; return n.scale_m ? `${K}${K ? ', ' : ''}about ${roughLen(n.scale_m)} across` : K; }
function roughLen(m) { return fmtLen(m).replace(/^(\d+)\.\d+ /, '$1 ').replace(/^(\d)\.(\d)\d /, '$1.$2 '); }
function showBodyNode(id, h) {
  const n = NODE[id]; if (!n) return false;
  infoState = { h, node: id };
  const L = n.layers || {};
  let basics = `<div class="body"><p><b>${n.summary || ''}</b></p>${L.basics ? `<p>${L.basics}</p>` : ''}</div>`;
  if (n.facts && n.facts.length) basics += '<dl>' + n.facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('') + '</dl>';
  if (n.did_you_know) basics += `<div class="fun"><b>Did you know?</b>${n.did_you_know}</div>`;
  let html = `<div class="tag">${kindLine(n)}</div><h2>${n.title}</h2>${certBadge(n.certainty)}<div class="vzh" id="vizHost"></div>`;
  html += trackNav(id);
  if (n.formula) basics += `<div class="formula">${n.formula}</div>`;
  html += layered([['Basics', basics], ['Deeper', L.deeper ? `<div class="body"><p>${L.deeper}</p></div>` : ''], ['Expert', L.expert ? `<div class="body expert"><p>${L.expert}</p></div>` : '']]);
  const canLook = h && h.frame && h.frame.children && h.frame.children.some(c => c.type === 'organ' && c.opts.organ === id);
  html += `<div class="btnrow">${h ? `<button class="zoom" id="zoomBtn">${canLook ? 'Look inside' : 'Zoom in'}</button>` : ''}${h && n.made_of && n.made_of.length ? `<button class="zoom alt" id="madeBtn"><span>See what it is made of</span><span>▾</span></button>` : ''}</div>`;
  const tw = (typeof TEAR !== 'undefined' && (TEAR[id] || (n.where && TEAR[n.where]))) || (n.where && /^(place|mol|crystal):/.test(n.where));
  if (n.lab || (tw && !h)) html += `<div class="btnrow">${n.lab ? `<button class="zoom lab" id="labBtn">${labAvailable(n.lab.id) ? 'Open in the ' : 'Planned: '}${LAB_NAMES[n.lab.id] || n.lab.id}</button>` : ''}${tw && !h ? `<button class="zoom alt" id="whereBtn">Show where it is</button>` : ''}</div>`;
  if (n.processes && n.processes.length) html += `<div class="refs"><div class="rh">How it works</div><div class="chips">${n.processes.map(p => `<button class="chip pr" data-p="${p}">${nodeTitle(p)}</button>`).join('')}</div></div>`;
  html += chipList(n.parts, 'Parts');
  html += chipList(n.made_of, 'Made of');
  html += chipList(n.parents, 'Part of');
  html += chipList(n.needs, 'Builds on');
  if (n.ext && n.ext.length) html += `<div class="refs"><div class="rh">Further reading</div>${n.ext.map(e => `<a class="ref" href="${e.url}" target="_blank" rel="noopener"><b>${e.title}</b></a>`).join('')}</div>`;
  if (n.molecules && n.molecules.length) html += chipList(n.molecules.map(m => NODE[m] ? m : null), 'Key molecules');
  if (n.open_questions && n.open_questions.length) html += `<div class="refs"><div class="rh">Open questions</div><ul class="ev">${n.open_questions.map(q => `<li>${q}</li>`).join('')}</ul></div>`;
  if (n.refs && n.refs.length) html += `<div class="refs"><div class="rh">Textbook sections</div>${n.refs.map(r => bookRef(r[0], r[1])).join('')}</div>`;
  openPanel(html);
  mountViz($('#vizHost'), id); wireTrackNav();
  const zb = $('#zoomBtn'); if (zb) zb.onclick = () => { const ch = h.frame.children.find(c => c.type === 'organ' && c.opts.organ === id); if (ch) flyTo(ch, new V3(), ch.opts.R * 2.2); else zoomIntoHit(h); };
  const mb = $('#madeBtn'); if (mb) mb.onclick = () => { closeInfo(); const f = tissueFrame(n.made_of[0], h.pointLocal || h.frame.C, id); f.dynamic = true; f.keep = performance.now() + 60000; h.frame.addChild(f); f.ensure(); flyTo(f, new V3(), 4e-4); };
  infoEl.querySelectorAll('.nd').forEach(b => b.onclick = () => (TEAR[b.dataset.n] ? goToNode(b.dataset.n) : focusNode(b.dataset.n)));
  const lb = $('#labBtn'); if (lb) lb.onclick = () => openLab(n.lab.id, n.lab.preset, n.title);
  const wb = $('#whereBtn'); if (wb) wb.onclick = () => goToNode(id);
  infoEl.querySelectorAll('.pr').forEach(b => b.onclick = () => startProcess(b.dataset.p));
  markSeen(id);
  return true;
}
function focusNode(id) { // fly to a node if it is drawn somewhere nearby, else just show its info
  const ms = (PARTMESH[id] || []).filter(m => m.parent && m.visible !== false);
  const m = ms.find(x => { let o = x; while (o && o.parent) o = o.parent; return true; });
  const F = m && active.find(f => f.root && isUnder(m, f.root));
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
  let el = $('#proc'); if (!el) { el = document.createElement('div'); el.id = 'proc'; el.className = 'glass'; document.body.appendChild(el); }
  const n = PROC.active; if (!n) { el.classList.remove('open'); PROC.focus = []; return; }
  const s = n.steps[PROC.i]; PROC.focus = s.focus || [];
  el.innerHTML = `<div class="ph"><b>${n.title}</b><span>Step ${PROC.i + 1} of ${n.steps.length}</span><button class="x" id="procX" aria-label="Close">×</button></div><h3>${s.title}</h3><p>${s.text}</p><div class="pb"><button id="procP" ${PROC.i ? '' : 'disabled'}>Back</button><div class="dots">${n.steps.map((_, i) => `<i class="${i === PROC.i ? 'on' : ''}"></i>`).join('')}</div><button id="procN">${PROC.i < n.steps.length - 1 ? 'Next step' : 'Finish'}</button></div>`;
  el.classList.add('open');
  $('#procX').onclick = () => { PROC.active = null; renderProc(); };
  $('#procP').onclick = () => { PROC.i = Math.max(0, PROC.i - 1); renderProc(); };
  $('#procN').onclick = () => { if (PROC.i < n.steps.length - 1) { PROC.i++; renderProc(); } else { PROC.active = null; renderProc(); } };
  const f0 = PROC.focus.find(id => (PARTMESH[id] || []).length); if (f0) focusNode(f0);
}
/* jump to a node from anywhere (search, chips): fly to the body part if it has a mesh, else show its card */
function goToNode(id) {
  const n = NODE[id]; if (!n) return;
  const tw = TEAR[id] || (n.where && TEAR[n.where]) || (n.hotspot && TEAR[n.hotspot.of]);
  if (tw) { showBodyNode(id, null); flyTo(tw.frame, tw.pos, tw.D); return; }
  if (n.where && !TEAR[n.where] && n.where !== id && placeGo(n.where)) { setTimeout(() => showBodyNode(id, null), 0); return; }
  const body = FR.body, ix = ANAT_SYNC, find = nid => ix && ix.parts.find(p => !p.parent && nodeForMesh(p.id) === nid);
  const org = n.hotspot && body && body.children.find(c => c.type === 'organ' && c.opts.organ === n.hotspot.of);
  if (org && n.hotspot.at) { showBodyNode(id, null); flyTo(org, new V3(...n.hotspot.at), org.opts.R * 1.2); return; }
  const P = find(id) || (n.hotspot && find(n.hotspot.of));
  if (body && P) { showBodyNode(id, null); flyTo(body, new V3(...P.center), Math.max(P.radius * 4, .15)); return; }
  showBodyNode(id, null);
}
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
  if (w.startsWith('mol:')) { FR.cell.ensure(); placeChild(FR.cell, new Frame({ type: 'mol', name: w.slice(4), unit: 1e-10, radius: 40, r1: 2.5e-8, spawnD: 1e-9, pos: new V3(3, 2, 0), opts: { mol: w.slice(4) } }), 3.2e-9); return true; }
  if (w.startsWith('crystal:')) { FR.park.ensure(); placeChild(FR.park, crystalFrame(w.slice(8), new V3(1.2, 0.01, 1.4)), 4e-9); return true; }
  if (NODE[w] && w !== arguments[1]) { goToNode(w); return true; }
  return false;
}
