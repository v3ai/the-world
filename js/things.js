'use strict';
/* =====================================================================
   THINGS: organisms and objects built from data (data/things/<id>/), as explorable as the human body.
   Schema and how to add a thing: tools/things/SCHEMA.md.
   Two layers:
     ThingObj   pure three.js: builds the meshes of one thing from its data, handles layer modes, cut-open views, LOD.
                Needs only THREE and the helpers of nodes.js (illoMat, toonGrad, decodePart, LDV, LDF). Used by tools/things/preview.html.
     FT.thing   the frame wrapper: a co-rendered child of the park, picked part by part, with controls and cards.
   ===================================================================== */
const TH = { index: null, defs: {}, bundles: {}, geos: {} };

/* ---------- data loading (thing.json is small; mesh.json is loaded once per thing and shared by every placement) ---------- */
function thLoadIndex() { return TH.index || (TH.index = getJSON('data/things/index.json').catch(() => ({ things: [] }))); }
function thLoadDef(id) { return TH.defs[id] || (TH.defs[id] = getJSON('data/things/' + id + '/thing.json')); }
function thLoadBundle(id) { return TH.bundles[id] || (TH.bundles[id] = getJSON('data/things/' + id + '/mesh.json')); }
function thGeo(id, bundle, key) {   // one shared BufferGeometry per mesh key
  const k = id + '/' + key; if (TH.geos[k]) return TH.geos[k];
  const q = bundle.meshes[key]; if (!q) return null;
  return TH.geos[k] = decodePart(q);
}

/* ---------- materials ---------- */
// back-face ink outline that also honours clipping planes (the cut-open view)
function thOutlineMat(color = 0x1a1f2b, w = .0022) {
  return new THREE.ShaderMaterial({
    uniforms: { uW: { value: w }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: .85 } },
    vertexShader: LDV(`uniform float uW;
#include <clipping_planes_pars_vertex>
void main(){ vec4 mvPosition=modelViewMatrix*vec4(position,1.0); vec3 n=normalize(normalMatrix*normal); mvPosition.xyz+=n*(-mvPosition.z)*uW; gl_Position=projectionMatrix*mvPosition;
#include <clipping_planes_vertex>
}`),
    fragmentShader: LDF(`uniform vec3 uColor; uniform float uOpacity;
#include <clipping_planes_pars_fragment>
void main(){
#include <clipping_planes_fragment>
gl_FragColor=vec4(uColor,uOpacity); }`),
    side: THREE.BackSide, transparent: true, depthWrite: true, clipping: true
  });
}
// The face you see where a thing is cut open: the inside back-faces of the clipped solid are painted with a pattern
// evaluated where the view ray meets the cut plane, in the thing's own coordinates. kind 'grains' = Voronoi cells
// (rock, wood fibres, flesh ...); 'plain' = one colour. A picture of the kind of structure, not of the real arrangement.
function thFaceMat(face, plane) {
  const pal = (face.palette || [[0x888888, 1]]).slice(0, 4), cols = [], cum = []; let tot = pal.reduce((s, p) => s + p[1], 0), acc = 0;
  for (let i = 0; i < 4; i++) { const p = pal[Math.min(i, pal.length - 1)]; cols.push(new THREE.Color(p[0])); if (i < pal.length) acc += p[1] / tot; cum.push(i < pal.length ? acc : 2); }
  return new THREE.ShaderMaterial({
    uniforms: { uPlane: { value: new THREE.Vector4(0, 0, 1, 0) }, uCam: { value: new V3() }, uOff: { value: new V3() }, uInv: { value: new THREE.Matrix4() }, uCell: { value: face.cell || .02 }, uCols: { value: cols }, uCum: { value: cum }, uEdge: { value: face.edge ?? .35 }, uOpacity: { value: 1 }, uPlain: { value: face.kind === 'plain' ? 1 : 0 } },
    vertexShader: LDV(`varying vec3 vW;
#include <clipping_planes_pars_vertex>
void main(){ vec4 mvPosition=modelViewMatrix*vec4(position,1.0); vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*mvPosition;
#include <clipping_planes_vertex>
}`),
    fragmentShader: LDF(`varying vec3 vW; uniform vec4 uPlane; uniform vec3 uCam; uniform vec3 uOff; uniform mat4 uInv; uniform float uCell; uniform vec3 uCols[4]; uniform float uCum[4]; uniform float uEdge; uniform float uOpacity; uniform float uPlain;
#include <clipping_planes_pars_fragment>
float h1(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
vec3 h3(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453); }
void main(){
#include <clipping_planes_fragment>
  vec3 dir=normalize(vW-uCam); float nd=dot(uPlane.xyz,dir); float t=nd>1e-4 ? -(dot(uPlane.xyz,uCam)+uPlane.w)/nd : 0.0;
  vec3 pw=uCam+dir*t; vec3 q=(uInv*vec4(pw-uOff,1.0)).xyz/uCell;
  vec3 ip=floor(q), fp=fract(q); float f1=9.0,f2=9.0; vec3 id=ip;
  for(int k=-1;k<=1;k++)for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){ vec3 g=vec3(float(i),float(j),float(k)); vec3 o=h3(ip+g); float d=length(g+o-fp); if(d<f1){ f2=f1; f1=d; id=ip+g; } else if(d<f2) f2=d; }
  float r=h1(id+3.7); vec3 c=uCols[3]; if(r<uCum[0]) c=uCols[0]; else if(r<uCum[1]) c=uCols[1]; else if(r<uCum[2]) c=uCols[2];
  c*=.86+.28*h1(id+9.1);
  float edge=smoothstep(0.0,uEdge*.35,f2-f1);
  c=mix(c*.35,c,mix(edge,1.0,uPlain));
  gl_FragColor=vec4(c,uOpacity); }`),
    side: THREE.BackSide, transparent: true, clipping: true
  });
}
function thInked(geo, color, o = {}) {   // like inked(), but the outline respects clipping planes
  const g = new THREE.Group(), m = new THREE.Mesh(geo, illoMat(color, { double: o.double })); g.add(m);
  const ol = new THREE.Mesh(geo, thOutlineMat(o.ink, o.w)); ol.userData.outline = true; g.add(ol); g.userData.ol = ol; g.userData.main = m;
  return g;
}
let _thShadowTex = null;
function thShadowTex() {
  if (_thShadowTex) return _thShadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(10,14,8,.62)'); gr.addColorStop(.55, 'rgba(10,14,8,.28)'); gr.addColorStop(1, 'rgba(10,14,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _thShadowTex = new THREE.CanvasTexture(c); return _thShadowTex;
}

/* ---------- ThingObj: the meshes of one thing ---------- */
class ThingObj {
  /* def: thing.json, bundle: mesh.json, o: { scale, rotY (radians), seed } */
  constructor(def, bundle, o = {}) {
    this.def = def; this.bundle = bundle; this.o = o; this.k = o.scale || 1;
    this.group = new THREE.Group(); this.group.scale.setScalar(this.k); this.group.rotation.y = o.rotY || 0; this.group.updateMatrix();
    this.holder = new THREE.Group();             // what the frame adds to its scene: group + shadow + hotspots (not scaled)
    this.parts = {}; this.list = []; this.hot = [];
    this.plane = new THREE.Plane(new V3(0, 0, 1), 0); this.planes = [this.plane];
    this.faceMats = []; this.mode = null; this.near = true; this.cutN = new V3(0, 0, 1);
    this.lights = { hemi: new THREE.HemisphereLight(0xcfe6ff, 0x4a6a2a, .75), sun: new THREE.DirectionalLight(0xfff1d6, 1.0) };
    this.lights.sun.position.set(.4, 1, .5).multiplyScalar(40);
    this.holder.add(this.group);
    for (const pd of def.parts) this._addPart(pd);
    if (def.shadow) this._addShadow(def.shadow);
    for (const h of def.hotspots || []) this._addHotspot(h);
    this.setMode((def.auto ? 'auto' : (def.modes[0] || {}).id));
  }
  _faceFor(pd) {
    const key = pd.cutFace || (this.def.cut && this.def.cut.default), face = key && this.def.cut && this.def.cut.faces && this.def.cut.faces[key];
    return face || { kind: 'plain', palette: [[0x6b5a48, 1]] };
  }
  _addPart(pd) {
    const def = this.def, color = new THREE.Color(pd.color || '#aaaaaa').getHex();
    let g, geo;
    if (pd.mesh) {
      geo = thGeo(def.id, this.bundle, pd.mesh); if (!geo) { console.warn('thing', def.id, 'part', pd.id, 'missing mesh', pd.mesh); return; }
      g = thInked(geo, color, { w: pd.ink_w || def.ink_w || .0018, double: !!pd.double });
      g.userData.main.material.clippingPlanes = null;
      if (pd.solid !== false) {   // inside faces for the cut-open view, painted with the cut-face pattern
        const fm = thFaceMat(this._faceFor(pd), this.plane); fm.clippingPlanes = this.planes; const cap = new THREE.Mesh(geo, fm); cap.visible = false; cap.userData.cap = true; cap.renderOrder = 0; g.add(cap); g.userData.cap = cap; this.faceMats.push(fm);
      }
    } else if (pd.instances) {
      const inst = this.bundle.instances[pd.instances]; geo = thGeo(def.id, this.bundle, inst.mesh);
      const mat = illoMat(color, { double: !!pd.double }), im = new THREE.InstancedMesh(geo, mat, inst.n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), p = new V3(), col = new THREE.Color(), t = inst.t, st = inst.stride;
      const rj = pd.tint || 0; let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < inst.n; i++) {
        const b = i * st; p.set(t[b], t[b + 1], t[b + 2]); q.set(t[b + 3], t[b + 4], t[b + 5], t[b + 6]);
        if (st === 8) s.setScalar(t[b + 7]); else s.set(t[b + 7], t[b + 8], t[b + 9]);
        m4.compose(p, q, s); im.setMatrixAt(i, m4);
        if (rj) { col.set(color); col.offsetHSL((rnd() - .5) * rj * .2, 0, (rnd() - .5) * rj); im.setColorAt(i, col); }
      }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false;
      g = im; g.userData.main = im;
    } else return;
    const sys = def.systems.find(s => s.id === pd.system);
    const rec = { pd, g, op: 0, tgt: 1, near: true, instanced: !!pd.instances };
    g.userData.partRec = rec; g.visible = false;
    this.group.add(g); this.list.push(rec); this.parts[pd.id] = rec;
  }
  _addShadow(sh) {
    const r = sh.radius_m * this.k, m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({ map: thShadowTex(), transparent: true, depthWrite: false, opacity: sh.opacity ?? 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(sh.offset ? sh.offset[0] * this.k : 0, .012, sh.offset ? sh.offset[1] * this.k : 0); m.renderOrder = -1; m.userData.shadow = true; this.shadow = m; this.holder.add(m);
  }
  _addHotspot(h) {
    const R = this.def.radius_m || 1, geo = new THREE.SphereGeometry(Math.max(.012, R * .035), 14, 10), g = inked(geo, 0xffd166, { w: .004 });
    g.children.forEach(m => { m.material.depthTest = false; m.renderOrder = 10; });
    g.userData.hotspot = h; g.visible = false; g.position.set(...h.at); this.group.add(g); this.hot.push(g);
  }
  modeDef(id) { return this.def.modes.find(m => m.id === id); }
  // resolve 'auto' from how near the camera is (metres from the thing)
  resolveMode(distM) { if (this.modeId !== 'auto') return this.modeDef(this.modeId); const a = this.def.auto || {}, id = distM < (a.near_m || 5) ? (a.near || 'whole') : (a.far || 'whole'); return this.modeDef(id) || this.def.modes[0]; }
  setMode(id) { this.modeId = id; this.cutPending = true; }
  // point the cut at a direction (thing-local, horizontal), through the cut point
  faceCut(dirLocal) {
    const n = dirLocal.clone(); n.y = 0; if (n.lengthSq() < 1e-6) n.set(0, 0, 1); n.normalize(); this.cutN.copy(n);
  }
  /* per-frame: dt seconds, camLocal = camera position in the group's parent coordinates (metres), off = world offset of the container (frame root position),
     alpha = frame alpha */
  update(dt, camLocal, off, alpha = 1) {
    const def = this.def, d = camLocal.distanceTo(this.group.position.clone().add(new V3(0, (def.radius_m || 1) * this.k * .5, 0)));
    const md = this.resolveMode(d); this.curMode = md; const cut = md && md.cut;
    const lod = def.lod; if (lod) { if (this.near && d > lod.near_m * 1.15) this.near = false; else if (!this.near && d < lod.near_m * .9) this.near = true; }
    // cut plane (thing-local normal -> container coordinates)
    const cutDef = typeof cut === 'object' ? cut : {}, at = new V3(...(cutDef.at || def.cut && def.cut.at || [0, (def.height_m || 1) * .5, 0]));
    if (cut) {
      if (this.cutPending) { this.cutPending = false; const dl = this.group.position.clone().sub(camLocal).applyAxisAngle(new V3(0, 1, 0), -(this.o.rotY || 0)); this.faceCut(dl); }
      const nC = this.cutN.clone().applyAxisAngle(new V3(0, 1, 0), this.o.rotY || 0), qC = at.clone().multiplyScalar(this.k).applyAxisAngle(new V3(0, 1, 0), this.o.rotY || 0).add(this.group.position);
      this.plane.normal.copy(nC); this.plane.constant = -nC.dot(qC) - nC.dot(off);
      const inv = new THREE.Matrix4().copy(this.group.matrix).invert();
      for (const fm of this.faceMats) { const u = fm.uniforms; u.uPlane.value.set(nC.x, nC.y, nC.z, this.plane.constant); u.uCam.value.copy(this.camW || new V3()); u.uOff.value.copy(off); u.uInv.value.copy(inv); }
    }
    const planes = cut ? this.planes : [];
    for (const r of this.list) {
      const pd = r.pd, sys = pd.system, sh = (md && md.show) || {};
      let tgt = sh[sys] !== undefined ? sh[sys] : (sh['*'] !== undefined ? sh['*'] : 0);
      if (pd.parent && !cut) tgt = 0;
      if (pd.lod === 'far' && this.near) tgt = 0; if (pd.lod === 'near' && !this.near) tgt = 0;
      r.tgt = tgt; r.op += (tgt - r.op) * (1 - Math.exp(-dt * 9)); if (Math.abs(r.op - tgt) < .01) r.op = tgt;
      const op = r.op * alpha, g = r.g, main = g.userData.main, mat = main.material;
      g.visible = op > .01;
      if (g.visible) {
        mat.opacity = op; mat.transparent = op < .99; mat.depthWrite = op > .9; if (mat.clippingPlanes !== planes) { mat.clippingPlanes = planes; mat.needsUpdate = true; }
        const ol = g.userData.ol; if (ol) { ol.visible = op > .5 && !pd.noink; ol.material.uniforms.uOpacity.value = .85 * op; if (ol.material.clippingPlanes !== planes) { ol.material.clippingPlanes = planes; ol.material.needsUpdate = true; } }
        const cap = g.userData.cap; if (cap) { cap.visible = !!cut && op > .5; cap.material.uniforms.uOpacity.value = op; }
      }
    }
    for (const h of this.hot) { h.visible = !!cut || !!(md && md.hotspots); h.children.forEach(m => { if (m.material.uniforms && m.material.uniforms.uOpacity) m.material.uniforms.uOpacity.value = .85 * alpha; else m.material.opacity = alpha; }); }
    if (this.shadow) this.shadow.material.opacity = (def.shadow.opacity ?? 1) * alpha;
    return md;
  }
  dispose() { this.holder.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); }
}

/* ---------- FT.thing: a placed thing inside a frame ---------- */
const TH_WAIT = {};   // frames that built before their mesh data arrived
FT.thing = {
  build(F, o) {
    const id = o.thing, pl = o.placement || {}; F.illo = true; F.noFade = true;   // opacity is handled per part, like the body
    renderer.localClippingEnabled = true;
    F.parts = {}; F.mode = store.get('thing:' + id + ':mode', null);
    F.env = { bg: 0, opaque: false };
    const fogSrc = FR.park && FR.park.scene;
    if (fogSrc && fogSrc.fog) F.scene.fog = fogSrc.fog;
    Promise.all([thLoadDef(id), thLoadBundle(id), loadNodes()]).then(([def, bundle]) => {
      if (!F.built) return;
      const T = new ThingObj(def, bundle, { scale: pl.scale || 1, rotY: (pl.rot || 0) * Math.PI / 180 });
      F.T = T; T.group.position.set(0, pl.y || 0, 0); T.group.updateMatrix(); T.holder.position.set(0, 0, 0);
      F.add(T.holder); F.add(T.lights.hemi); F.add(T.lights.sun); F.add(T.lights.sun.target);
      const validModes = ['auto'].concat(def.modes.map(m => m.id)); if (!def.auto) validModes.shift();
      T.setMode(validModes.includes(F.mode) ? F.mode : validModes[0]);
      thBindFrame(F, T, def);
    });
    F.update = (dt, t) => thFrameUpdate(F, dt, t);
    F.spawnD = .006;
    F.spawn = (T0, hint) => thSpawn(F, T0, hint);
  }
};
function thBindFrame(F, T, def) {
  const k = T.k;
  F.blurb = def.blurb || ''; F.note = def.model_note || '';
  // controls: one button per layer mode, built now so the frame's control bar is ready when the camera arrives
  const modes = (def.auto ? [['auto', def.auto.label || 'Auto']] : []).concat(def.modes.map(m => [m.id, m.label]));
  building = F;
  try {
    const row = seg(modes, T.modeId, m => { T.setMode(m); store.set('thing:' + def.id + ':mode', m); thUpdateControls(F); });
    F.uiRow = row;
    F.cutBtn = actBtn('Turn the cut to face me', () => { T.cutPending = true; }); F.cutBtn.style.display = 'none';
    F.legend = uiEl(document.createElement('div')); F.legend.className = 'thLegend'; F.legend.style.display = 'none';
  } finally { building = null; }
  uiFrame = null; capFrame = null;
  // pickable parts, following the conventions of the body (userData.part / center / radius / madeOf)
  for (const rec of T.list) {
    const pd = rec.pd, g = rec.g, thingR = (def.radius_m || 1) * k;
    const node = NODE[pd.node] ? pd.node : null; if (!node) console.warn('thing', def.id, 'part', pd.id, 'has no node card:', pd.node);
    const pc = new V3(...(pd.center || [0, 0, 0]));
    const partCenter = () => pc.clone().applyMatrix4(T.group.matrix).add(new V3(0, 0, 0));
    Object.assign(g.userData, {
      id: pd.id, node, part: { id: pd.id, name: pd.name, system: pd.system, center: pd.center, radius: pd.radius, parent: pd.parent || null }, thing: def.id, frame: F,
      info: { title: pd.name, tag: (def.systems.find(s => s.id === pd.system) || {}).label || pd.system, body: '' },
      priority: pd.priority ?? (pd.parent ? 2 : 1.5),
      madeOf: pd.deeper ? 'thing' : undefined,
      center: h => (h && h.pointLocal) ? h.pointLocal.clone() : partCenter(),
      radius: h => Math.max(.015, Math.min((pd.radius || .1) * k * .3, thingR * .2))
    });
    if (rec.instanced) g.userData.resolve = hit => pd.id;
    g.userData.main.userData.pickRoot = g;
    F.pickables.push(g); F.parts[pd.id] = { g, p: g.userData.part }; regMesh(pd.id, g); if (node) regMesh(node, g);
  }
  for (const g of T.hot) {
    const h = g.userData.hotspot, node = NODE[h.node] ? h.node : null, at = new V3(...h.at).applyMatrix4(T.group.matrix);
    Object.assign(g.userData, { id: h.id || h.node, node, priority: 4, thing: def.id, frame: F, info: { title: h.label || nodeTitle(h.node), tag: 'Marker', body: '' }, center: () => at.clone(), radius: () => (def.radius_m || 1) * k * .05 });
    g.userData.main.userData.pickRoot = g; F.pickables.push(g); regMesh(h.node, g);
    F.label(g, h.label || nodeTitle(h.node), { offset: new V3(0, (def.radius_m || 1) * k * .05, 0) });
  }
  F.labelObj = new THREE.Object3D(); F.labelObj.position.set(0, ((def.height_m || def.radius_m || 1) * k) + .12, 0).add(new V3(0, 0, 0)); F.add(F.labelObj);
  const mainRec = T.parts[def.main_part || (def.parts[0] || {}).id];
  const nl = F.label(F.labelObj, def.label || def.title, { cls: 'thName', pick: mainRec && mainRec.g }); nl.minSizeFn = f => f.dLoc < (def.radius_m || 1) * k * 25;
  thUpdateControls(F);
}
function thUpdateControls(F) {
  const T = F.T; if (!T) return; const md = T.resolveMode(1e9), real = T.modeId === 'auto' ? null : T.modeDef(T.modeId);
  const cutOn = !!(real && real.cut) || false; F.cutBtn.style.display = cutOn ? '' : 'none';
  const face = T.def.cut && T.def.cut.faces && T.def.cut.faces[T.def.cut.default];
  F.legend.style.display = cutOn && face && face.legend ? '' : 'none';
  if (cutOn && face && face.legend && !F.legend.childElementCount) {
    F.legend.innerHTML = '<span class="thLH">On the cut face</span>' + face.legend.map(l => `<button class="thLg" data-n="${l.node}"><i style="background:${l.color}"></i>${l.name}</button>`).join('') + (face.note ? `<span class="thLN">${face.note}</span>` : '');
    F.legend.querySelectorAll('.thLg').forEach(b => b.onclick = () => showBodyNode(b.dataset.n, null));
  }
}
const _thV = new V3(), _thOff = new V3();
let _thPark = null;
function thFrameUpdate(F, dt, t) {
  const T = F.T; if (!T) return;
  // sun and sky light copied from the park so shading and day/night agree
  const P = FR.park;
  if (P && P.scene) {
    if (!_thPark || _thPark.scene !== P.scene) { _thPark = { scene: P.scene, sun: null, hemi: null }; P.scene.traverse(o => { if (o.isDirectionalLight && !_thPark.sun) _thPark.sun = o; if (o.isHemisphereLight && !_thPark.hemi) _thPark.hemi = o; }); }
    if (_thPark.sun) { T.lights.sun.position.copy(_thPark.sun.position).normalize().multiplyScalar(40); T.lights.sun.intensity = _thPark.sun.intensity; T.lights.sun.color.copy(_thPark.sun.color); }
    if (_thPark.hemi) { const day = Math.min(1, _thPark.sun ? _thPark.sun.intensity / 1.15 : 1); T.lights.hemi.intensity = _thPark.hemi.intensity * (.18 + .82 * day); }
    if (P.scene.fog && F.scene.fog !== P.scene.fog) F.scene.fog = P.scene.fog;
  }
  const C = F.C || _thV.set(0, 0, 0);   // camera position in frame coordinates; in the shifted frame root the camera sits at the world origin (T.camW stays 0)
  _thOff.copy(F.root.position);
  T.update(dt, C, _thOff, F.alpha);
  if (F._lastModeId !== T.modeId) { F._lastModeId = T.modeId; thUpdateControls(F); F.mode = T.modeId; }
}
/* what each part is made of at the next level down */
function thSpawn(F, T0, hint) {
  const pd = hint && hint.obj && hint.obj.userData.part; if (!pd || !F.T) return null;
  const rec = F.T.parts[pd.id], d = rec && rec.pd.deeper; if (!d) return null;
  return thDeepFrame(d, T0);
}
function thDeepFrame(d, T0) {
  if (d.type === 'crystal') return crystalFrame(d.id, T0);
  if (d.type === 'micro') return microFrame(d.kind, T0);
  if (d.type === 'tissue') return tissueFrame(d.id, T0, d.organ);
  return null;
}
/* the "See what it is made of" button on a thing's card (showBodyNode only knows body tissue, so we take over its button) */
const _thShowBodyNode = showBodyNode;
showBodyNode = function (id, h) {
  const r = _thShowBodyNode(id, h);
  if (r && h && h.obj && h.obj.userData && h.obj.userData.thing) thDecorateCard(id, h);
  return r;
};
function thDecorateCard(id, h) {
  const F = h.obj.userData.frame || h.frame, rec = F && F.T && F.T.parts[h.obj.userData.id], pd = rec && rec.pd, def = F && F.T && F.T.def;
  const old = document.getElementById('madeBtn'); if (old) old.remove();
  const row = infoEl.querySelector('.btnrow');
  if (def && !infoEl.querySelector('.thNote')) {
    const note = document.createElement('div'); note.className = 'note thNote'; note.textContent = def.model_note || '';
    if (note.textContent) infoEl.querySelector('.tag') && infoEl.querySelector('.tag').insertAdjacentElement('beforebegin', note);
  }
  if (!pd || !pd.deeper || !row) return;
  const b = document.createElement('button'); b.className = 'zoom alt'; b.id = 'madeBtn'; b.innerHTML = `<span>${pd.deeper.button || 'See what it is made of'}</span><span>▾</span>`;
  b.onclick = () => {
    closeInfo(); const p = h.pointLocal ? h.pointLocal.clone() : new V3(...(pd.center || [0, 0, 0])); const f = thDeepFrame(pd.deeper, p); if (!f) return;
    f.dynamic = true; f.keep = performance.now() + 60000; F.addChild(f); f.ensure(); flyTo(f, new V3(), pd.deeper.D || 4e-9);
  };
  row.appendChild(b);
}

/* ---------- placing things in the park ---------- */
WORLD_EXT.push(async FR => {
  const ix = await thLoadIndex(); FR.things = FR.things || [];
  for (const e of ix.things || []) {
    let def; try { def = await thLoadDef(e.id); } catch (err) { console.error('thing data missing', e.id, err); continue; }
    thLoadBundle(e.id);
    (e.placements || []).forEach((pl, i) => {
      const R = (def.radius_m || 1) * (pl.scale || 1) * 1.15;
      const f = FR.park.addChild(new Frame({ type: 'thing', name: def.title, unit: 1, radius: R, r0: 0, r1: Math.max(R * 40, 30), up: new V3(0, 1, 0), pos: new V3(pl.at[0], 0, pl.at[1]), opts: { thing: e.id, placement: pl, n: i } }));
      f.noFade = true; f.coRender = true; f.coMax = def.draw_m || 400; f.pinned = true; f.isThing = true; f.proxy = null;
      FR.things.push(f); if (i === 0) FR['thing_' + e.id] = f;
    });
  }
});
