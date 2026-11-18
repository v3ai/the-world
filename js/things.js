'use strict';
/* =====================================================================
   THINGS: organisms and objects built from data (data/things/<id>/), as explorable as the human body.
   Schema and how to add a thing: tools/things/SCHEMA.md.
   Two layers:
     ThingObj   pure three.js: builds the meshes of one thing from its data, handles layer modes, cut-open views, LOD.
                Needs only THREE and the helpers of nodes.js (illoMat, toonGrad, decodePart, LDV, LDF). Used by tools/things/preview.html.
     FT.thing   the frame wrapper: a co-rendered child of the park, picked part by part, with controls and cards.
   ===================================================================== */
const TH = { index: null, defs: {}, bundles: {}, geos: {}, inst: {} };

/* ---------- data loading (thing.json is small; mesh.json is loaded once per thing and shared by every placement) ---------- */
function thLoadIndex() { return TH.index || (TH.index = getJSON('data/things/index.json').catch(() => ({ things: [] }))); }
TH.loaded = {};
function thLoadDef(id) { return TH.defs[id] || (TH.defs[id] = getJSON('data/things/' + id + '/thing.json').then(d => TH.loaded[id] = d)); }
function thLoadBundle(id) { return TH.bundles[id] || (TH.bundles[id] = getJSON('data/things/' + id + '/mesh.json')); }
function thGeo(id, bundle, key) {   // one shared BufferGeometry per mesh key
  const k = id + '/' + key; if (TH.geos[k]) return TH.geos[k];
  const q = bundle.meshes[key]; if (!q) return null;
  const g = decodePart(q);
  if (q.shade) { const c = new Float32Array(q.shade.length * 3); for (let i = 0; i < q.shade.length; i++) c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = q.shade[i] / 255; g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }   // baked brightness (occlusion, staining)
  return TH.geos[k] = g;
}

/* ---------- alpha-cut cards: a flat quad with a picture of an outline (leaves, petals): cheap enough for tens of thousands of instances ---------- */
const TH_CARDS = {};
function thCardTexture(c) {
  const key = JSON.stringify(c); if (TH_CARDS[key]) return TH_CARDS[key];
  if (c.kind === 'leaf_cluster') {   // a rosette of lobed leaves, for the middle distance
    const S = 192, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const g = cv.getContext('2d'); let sd = 7; const rn = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    const leaf = (x, y, ang, len, shade) => { g.save(); g.translate(x, y); g.rotate(ang); const wd = len * .36, N = 28; g.beginPath(); for (let i = 0; i <= N; i++) { const t = i / N, e = Math.pow(t, .85) * Math.pow(1 - t, .55) * 2.9, lob = 1 - .5 * (.5 - .5 * Math.cos(Math.PI * 8 * (t - .02))); g.lineTo(e * lob * wd, -t * len); } for (let i = N; i >= 0; i--) { const t = i / N, e = Math.pow(t, .85) * Math.pow(1 - t, .55) * 2.9, lob = 1 - .5 * (.5 - .5 * Math.cos(Math.PI * 8 * (t - .02))); g.lineTo(-e * lob * wd, -t * len); } g.closePath(); const v = Math.round(255 * shade); g.fillStyle = `rgb(${v},${v},${v})`; g.fill(); g.restore(); };
    for (let k = 0; k < 15; k++) { const a = (k / 15 - .5) * 3.1 + (rn() - .5) * .4, ring = k % 2 ? .0 : .1; leaf(S * (.5 + (rn() - .5) * .18), S * (.62 + ring + (rn() - .5) * .1), a, S * (.34 + .12 * rn()), .72 + .28 * rn()); }
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; return TH_CARDS[key] = tx;
  }
  const W = 128, H = Math.round(W / (c.aspect || .7)), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  // outline: half-width as a function of t along the length (0 = base, 1 = tip); lobes rounded, cut no deeper than `depth` of the half-width
  const hw = t => { const env = Math.pow(Math.max(t, 0), .85) * Math.pow(1 - t, .55) / (Math.pow(.85 / 1.4, .85) * Math.pow(.55 / 1.4, .55)), lob = 1 - (c.depth ?? .5) * (.5 - .5 * Math.cos(Math.PI * 2 * (c.lobes || 4) * (t - .02) )), aur = c.base_lobes ? .22 * Math.exp(-Math.pow((t - .06) / .05, 2)) : 0; return Math.min(1, env * lob * (t < .04 ? t / .04 : 1) + aur); };
  g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.beginPath(); const N = 90;
  for (let i = 0; i <= N; i++) { const t = i / N, x = W / 2 + hw(t) * W / 2 * .98, y = H * (1 - t); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const t = i / N, x = W / 2 - hw(t) * W / 2 * .98, y = H * (1 - t); g.lineTo(x, y); }
  g.closePath(); g.fill();
  if (c.veins) { g.strokeStyle = 'rgba(40,60,30,.42)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(W / 2, H); g.lineTo(W / 2, H * .02); for (let k = 1; k <= (c.lobes || 4) + 1; k++) { const t = .08 + k * (.84 / ((c.lobes || 4) + 1)), w = hw(t) * W / 2 * .85; g.moveTo(W / 2, H * (1 - t + .03)); g.lineTo(W / 2 - w, H * (1 - t - .03)); g.moveTo(W / 2, H * (1 - t + .03)); g.lineTo(W / 2 + w, H * (1 - t - .03)); } g.stroke(); }
  const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; return TH_CARDS[key] = tx;
}
function thCardUV(geo) {   // uv from the xy bounding box of a card mesh (x across, y along)
  if (geo.attributes.uv) return geo; geo.computeBoundingBox(); const b = geo.boundingBox, p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - b.min.x) / ((b.max.x - b.min.x) || 1); uv[i * 2 + 1] = (p.getY(i) - b.min.y) / ((b.max.y - b.min.y) || 1); }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
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
  const g = new THREE.Group(), m = new THREE.Mesh(geo, illoMat(color, { double: o.double, extra: o.vc ? { vertexColors: true } : {} })); g.add(m);
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

/* ---------- flow markers: instanced markers that travel along polylines (sap in the xylem and phloem) ---------- */
function thFlowMesh(id, bundle, pd, color) {
  const fl = bundle.flows[pd.flow], geo = thGeo(id, bundle, fl.mesh), n = fl.markers.length;
  if (!fl._prep) {   // per path: points, radii, cumulative length (computed once per bundle)
    fl._prep = fl.paths.map(P => { const pts = [], c = [0]; for (let i = 0; i < P.p.length; i += 3) pts.push(new V3(P.p[i], P.p[i + 1], P.p[i + 2])); for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + pts[i].distanceTo(pts[i - 1])); return { pts, r: P.r, c, L: c[c.length - 1] }; });
  }
  const im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true }), n); im.frustumCulled = false; im.userData.main = im;
  im.userData.flow = { im, fl, n, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new V3(), s: new V3(2.2, 2.2, 2.2), T: new V3(), N: new V3(), B: new V3(), up: new V3(0, 1, 0), ax: new V3(1, 0, 0), y: new V3(0, 1, 0) };
  return im;
}
function thFlowUpdate(f, t) {
  const { fl, im, m4, q, p, s, T, N, B } = f, prep = fl._prep;
  for (let i = 0; i < f.n; i++) {
    const mk = fl.markers[i], P = prep[mk[0]]; let u = (mk[1] + fl.dir * fl.speed * t / P.L * 6) % 1; if (u < 0) u += 1;
    const d = u * P.L; let lo = 0, hi = P.c.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P.c[mid] <= d) lo = mid; else hi = mid; }
    const k = (d - P.c[lo]) / ((P.c[hi] - P.c[lo]) || 1), a = P.pts[lo], b = P.pts[hi];
    T.subVectors(b, a).normalize(); N.crossVectors(T, f.up); if (N.lengthSq() < .05) N.crossVectors(T, f.ax); N.normalize(); B.crossVectors(T, N);
    const r = (P.r[lo] + (P.r[hi] - P.r[lo]) * k) * fl.ring, c = Math.cos(mk[2]) * r, sn = Math.sin(mk[2]) * r;
    p.set(a.x + (b.x - a.x) * k + N.x * c + B.x * sn, a.y + (b.y - a.y) * k + N.y * c + B.y * sn, a.z + (b.z - a.z) * k + N.z * c + B.z * sn);
    if (fl.dir < 0) T.negate(); q.setFromUnitVectors(f.y, T); m4.compose(p, q, s); im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
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
    this.faceMats = []; this.mode = null; this.near = true; this.tier = 0; this.cutN = new V3(0, 0, 1);
    this.lights = { hemi: new THREE.HemisphereLight(0xcfe6ff, 0x4a6a2a, .75), sun: new THREE.DirectionalLight(0xfff1d6, 1.0) };
    this.lights.sun.position.set(.4, 1, .5).multiplyScalar(40);
    this.holder.add(this.group);
    this.pivots = { wood: new THREE.Group() }; this.group.add(this.pivots.wood); this.clock = 0; this.pivotPending = true; this.pivotAng = 0;
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
      g = thInked(geo, color, { w: pd.ink_w || def.ink_w || .0018, double: !!pd.double, vc: !!geo.attributes.color });
      g.userData.main.material.clippingPlanes = null;
      if (pd.solid !== false) {   // inside faces for the cut-open view, painted with the cut-face pattern
        const fm = thFaceMat(this._faceFor(pd), this.plane); fm.clippingPlanes = this.planes; const cap = new THREE.Mesh(geo, fm); cap.visible = false; cap.userData.cap = true; cap.renderOrder = 0; g.add(cap); g.userData.cap = cap; this.faceMats.push(fm);
      }
    } else if (pd.instances) {
      const inst = this.bundle.instances[pd.instances]; geo = thGeo(def.id, this.bundle, inst.mesh);
      const ex = geo.attributes.color ? { vertexColors: true } : {}; if (pd.card) { thCardUV(geo); ex.map = thCardTexture(pd.card); ex.alphaTest = .5; }
      const mat = illoMat(color, { double: !!pd.double, extra: ex }), im = new THREE.InstancedMesh(geo, mat, inst.n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), p = new V3(), col = new THREE.Color(), t = inst.t, st = inst.stride;
      const rj = pd.tint || 0, ck = def.id + ':' + pd.instances + ':' + rj, sh = TH.inst[ck];
      if (sh) { im.instanceMatrix = sh.m; if (sh.c) im.instanceColor = sh.c; }   // the instance buffers are shared by every placement of the thing
      else {
        let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
        for (let i = 0; i < inst.n; i++) {
          const b = i * st; p.set(t[b], t[b + 1], t[b + 2]); q.set(t[b + 3], t[b + 4], t[b + 5], t[b + 6]);
          if (st === 8) s.setScalar(t[b + 7]); else s.set(t[b + 7], t[b + 8], t[b + 9]);
          m4.compose(p, q, s); im.setMatrixAt(i, m4);
          if (rj) { col.setRGB(1 + (rnd() - .5) * rj, 1 + (rnd() - .5) * rj * .8, 1 + (rnd() - .5) * rj * .8); im.setColorAt(i, col); }   // a multiplier on the part colour
        }
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; TH.inst[ck] = { m: im.instanceMatrix, c: im.instanceColor };
      }
      im.frustumCulled = false;
      g = im; g.userData.main = im;
    } else if (pd.flow) {
      g = thFlowMesh(def.id, this.bundle, pd, color);
    } else return;
    const sys = def.systems.find(s => s.id === pd.system);
    const rec = { pd, g, op: 0, tgt: 1, near: true, instanced: !!pd.instances };
    g.userData.partRec = rec; g.visible = false; rec.flow = g.userData.flow || null;
    (pd.pivot && this.pivots[pd.pivot] || this.group).add(g); this.list.push(rec); this.parts[pd.id] = rec;
  }
  _addShadow(sh) {
    const r = sh.radius_m * this.k, m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({ map: thShadowTex(), transparent: true, depthWrite: false, opacity: sh.opacity ?? 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(sh.offset ? sh.offset[0] * this.k : 0, .012, sh.offset ? sh.offset[1] * this.k : 0); m.renderOrder = -1; m.userData.shadow = true; this.shadow = m; this.holder.add(m);
  }
  _addHotspot(h) {
    const R = this.def.radius_m || 1, geo = new THREE.SphereGeometry(h.r || Math.max(.01, R * .02), 14, 10), g = inked(geo, 0xffd166, { w: .004 });
    g.children.forEach(m => { m.material.depthTest = false; m.renderOrder = m.userData.outline ? 9 : 10; });   // ink first, fill on top
    g.userData.hotspot = h; g.visible = false; g.position.set(...h.at); ((h.modes && h.modes[0] === 'wood') ? this.pivots.wood : this.group).add(g); this.hot.push(g);
  }
  modeDef(id) { return this.def.modes.find(m => m.id === id); }
  // resolve 'auto' from how near the camera is (metres from the thing)
  resolveMode(distM) { if (this.modeId !== 'auto') return this.modeDef(this.modeId); const a = this.def.auto || {}, id = distM < (a.near_m || 5) ? (a.near || 'whole') : (a.far || 'whole'); return this.modeDef(id) || this.def.modes[0]; }
  setMode(id) { this.modeId = id; this.cutPending = true; this.pivotPending = true; }
  // point the cut at a direction (thing-local, horizontal), through the cut point
  faceCut(dirLocal) {
    const n = dirLocal.clone(); n.y = 0; if (n.lengthSq() < 1e-6) n.set(0, 0, 1); n.normalize(); this.cutN.copy(n);
  }
  /* per-frame: dt seconds, camLocal = camera position in the group's parent coordinates (metres), off = world offset of the container (frame root position),
     alpha = frame alpha */
  update(dt, camLocal, off, alpha = 1) {
    const def = this.def, d = camLocal.distanceTo(this.group.position.clone().add(new V3(0, (def.radius_m || 1) * this.k * .5, 0)));
    const md = this.resolveMode(d); this.curMode = md; const cut = md && md.cut;
    const lod = def.lod, t0 = this.tier;   // three tiers: 0 near (full detail), 1 mid, 2 far; without lod.far_m the mid tier is the far one
    if (this.lodForce) this.tier = this.lodForce === 'near' ? 0 : this.lodForce === 'mid' ? 1 : 2;
    else if (lod) { const nm = lod.near_m, fm = lod.far_m || 1e9, T = this.tier, h = T === 0 ? 1.12 : .9; this.tier = d > fm * (T === 2 ? .9 : 1.12) ? 2 : d > nm * (T === 0 ? 1.12 : .9) ? 1 : 0; }
    this.near = this.tier === 0; const tierNames = this.tier === 0 ? ['near'] : this.tier === 2 ? ['far'] : (lod && lod.far_m ? ['mid'] : ['far', 'mid']), lodSnap = t0 !== this.tier;
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
    this.clock += dt; this.seeThrough = !!(md && md.groundSeeThrough);
    if (md && md.pivot) {   // turn the pivoted parts (the cut log) so that its opening faces the camera, once per mode choice
      if (this.pivotPending) { this.pivotPending = false; const dl = camLocal.clone().sub(this.group.position).applyAxisAngle(new V3(0, 1, 0), -(this.o.rotY || 0)); this.pivotAng = Math.atan2(dl.x, dl.z); }
      this.pivots[md.pivot].rotation.y += (((this.pivotAng - this.pivots[md.pivot].rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * (1 - Math.exp(-dt * 6));
    }
    for (const r of this.list) {
      const pd = r.pd, sys = pd.system, sh = (md && md.show) || {};
      let tgt = sh[sys] !== undefined ? sh[sys] : (sh['*'] !== undefined ? sh['*'] : 0);
      if (pd.opacity_max !== undefined) tgt = Math.min(tgt, pd.opacity_max);
      if (pd.parent && !cut) tgt = 0;
      let lodPart = false; if (pd.lod) { lodPart = true; if (!pd.lod.split('+').some(n => tierNames.includes(n))) tgt = 0; }
      r.tgt = tgt; if (lodPart && (lodSnap || tgt === 0)) r.op = tgt; else { r.op += (tgt - r.op) * (1 - Math.exp(-dt * 9)); if (Math.abs(r.op - tgt) < .01) r.op = tgt; }   // detail tiers swap at once, never both drawn
      const op = r.op * alpha, g = r.g, main = g.userData.main, mat = main.material;
      g.visible = op > .01;
      if (g.visible && r.flow) { thFlowUpdate(r.flow, this.clock); mat.opacity = op; continue; }
      if (g.visible) {
        mat.opacity = op; mat.transparent = op < .99; mat.depthWrite = op > .9; if (mat.clippingPlanes !== planes) { mat.clippingPlanes = planes; mat.needsUpdate = true; }
        const ol = g.userData.ol; if (ol) { ol.visible = op > .5 && !pd.noink; ol.material.uniforms.uOpacity.value = .85 * op; if (ol.material.clippingPlanes !== planes) { ol.material.clippingPlanes = planes; ol.material.needsUpdate = true; } }
        const cap = g.userData.cap; if (cap) { cap.visible = !!cut && op > .5; cap.material.uniforms.uOpacity.value = op; }
      }
    }
    for (const h of this.hot) { const hs = h.userData.hotspot; h.visible = (!!cut || !!(md && md.hotspots)) && (!hs.modes || (md && hs.modes.includes(md.id))); h.children.forEach(m => { if (m.material.uniforms && m.material.uniforms.uOpacity) m.material.uniforms.uOpacity.value = .85 * alpha; else m.material.opacity = alpha; }); }
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
    F.parts = {}; F.mode = null;
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
    const row = seg(modes, T.modeId, m => { T.setMode(m); thUpdateControls(F); });
    F.uiRow = row;
    F.cutBtn = actBtn('Turn the cut to face me', () => { T.cutPending = true; T.pivotPending = true; }); F.cutBtn.style.display = 'none';
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
  if ((F.opts.n || 0) === 0 || !def.label_first_only) { const nl = F.label(F.labelObj, def.label || def.title, { cls: 'thName', pick: mainRec && mainRec.g }); nl.minSizeFn = f => f.dLoc < (def.radius_m || 1) * k * 25; }
  thUpdateControls(F);
}
function thUpdateControls(F) {
  const T = F.T; if (!T) return;
  if (F.uiRow) F.uiRow.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === T.modeId)); const real = T.modeId === 'auto' ? null : T.modeDef(T.modeId);
  const cutOn = !!(real && (real.cut || real.pivot)) || false; F.cutBtn.style.display = cutOn ? '' : 'none';
  // the legend: a mode may bring its own (a list of coloured swatches that open cards), else the cut face of the thing
  const lg = (real && real.legend) || (real && real.cut && T.def.cut && T.def.cut.faces && (T.def.cut.faces[T.def.cut.default] || {}).legend && { title: 'On the cut face', items: T.def.cut.faces[T.def.cut.default].legend, note: T.def.cut.faces[T.def.cut.default].note });
  const key = lg ? T.modeId : '';
  if (F._legendKey !== key) {
    F._legendKey = key; F.legend.innerHTML = '';
    if (lg) {
      F.legend.innerHTML = `<span class="thLH">${lg.title || 'Legend'}</span>` + lg.items.map(l => `<button class="thLg" data-n="${l.node}"><i style="background:${l.color}"></i>${l.name}</button>`).join('') + (lg.note ? `<span class="thLN">${lg.note}</span>` : '');
      F.legend.querySelectorAll('.thLg').forEach(b => b.onclick = () => showBodyNode(b.dataset.n, null));
    }
  }
  F.legend.style.display = lg ? '' : 'none';
}
const _thV = new V3(), _thOff = new V3();
// the Roots view makes the park's ground see-through (and hides the grass) so the roots can be seen below it
let _thGround = null, _thFaded = false;
function thGroundFade(on) {
  if (on === _thFaded) return; const P = FR.park && FR.park.v2 && FR.park.v2.parts; if (!P || !P.ground) return;
  _thFaded = on; const m = P.ground.material; m.transparent = on; m.opacity = on ? .16 : 1; m.depthWrite = !on; m.needsUpdate = true; if (P.grass) P.grass.visible = !on;
}
let _thPark = null;
function thFrameUpdate(F, dt, t) {
  const T = F.T; if (!T) return;
  // sun and sky light copied from the park so shading and day/night agree
  const P = FR.park;
  if (P && P.scene) {
    if (!_thPark || _thPark.scene !== P.scene) { _thPark = { scene: P.scene, sun: null, hemi: null }; P.scene.traverse(o => { if (o.isDirectionalLight && !_thPark.sun) _thPark.sun = o; if (o.isHemisphereLight && !_thPark.hemi) _thPark.hemi = o; }); }
    if (_thPark.sun) { T.lights.sun.position.copy(_thPark.sun.position).normalize().multiplyScalar(40); T.lights.sun.intensity = _thPark.sun.intensity * .75; T.lights.sun.color.copy(_thPark.sun.color); }
    if (_thPark.hemi) { const day = Math.min(1, _thPark.sun ? _thPark.sun.intensity / 1.15 : 1); T.lights.hemi.intensity = _thPark.hemi.intensity * .55 * (.18 + .82 * day); }
    if (P.scene.fog && F.scene.fog !== P.scene.fog) F.scene.fog = P.scene.fog;
  }
  const C = F.C || _thV.set(0, 0, 0);   // camera position in frame coordinates; in the shifted frame root the camera sits at the world origin (T.camW stays 0)
  _thOff.copy(F.root.position);
  T.update(dt, C, _thOff, F.alpha);
  thGroundFade(FR.things.some(f => f.T && f.T.seeThrough && f.alpha > .5));
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
  if (d.type === 'tissue2') return tissue2Frame(d.id, T0);
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

/* "Show me where it is": goToNode() flies to the first placed thing that has a part or marker with this card */
function thFindNode(id) {
  for (const f of FR.things || []) {
    const def = TH.loaded[f.opts.thing]; if (!def) continue; const pl = f.opts.placement || {};
    const hit = def.parts.find(p => p.node === id && p.lod !== 'far') || def.parts.find(p => p.node === id), hs = (def.hotspots || []).find(h => h.node === id);
    const at = hit ? hit.center : hs ? hs.at : id === def.node ? (def.parts.find(p => p.id === def.main_part) || {}).center : null;
    if (!at) continue;
    const k = pl.scale || 1, p = new V3(...at).multiplyScalar(k).applyAxisAngle(new V3(0, 1, 0), (pl.rot || 0) * Math.PI / 180).add(new V3(0, pl.y || 0, 0));
    return { f, p, D: Math.max(((hit && hit.radius) || (def.radius_m || 1) * .5) * k * 3.2, .4) };
  }
  return null;
}
const _thGoToNode = goToNode;
goToNode = function (id) {
  const t = thFindNode(id);
  if (t) { showBodyNode(id, null); flyTo(t.f, t.p, t.D); return; }
  return _thGoToNode(id);
};

/* ---------- placing things in the park ---------- */
WORLD_EXT.push(async FR => {
  const ix = await thLoadIndex(); FR.things = FR.things || [];
  for (const e of ix.things || []) {
    let def; try { def = await thLoadDef(e.id); } catch (err) { console.error('thing data missing', e.id, err); continue; }
    thLoadBundle(e.id); def.parts.forEach(p => { if (p.deeper && p.deeper.type === 'tissue2') thLoadTissue(p.deeper.id); });
    (e.placements || []).forEach((pl, i) => {
      const R = (def.radius_m || 1) * (pl.scale || 1) * 1.15;
      const f = FR.park.addChild(new Frame({ type: 'thing', name: def.title, unit: 1, radius: R, r0: 0, r1: Math.max(R * 12, 8), up: new V3(0, 1, 0), pos: new V3(pl.at[0], 0, pl.at[1]), opts: { thing: e.id, placement: pl, n: i } }));
      f.noFade = true; f.coRender = true; f.coMax = def.draw_m || 400; f.pinned = true; f.isThing = true; f.proxy = null;
      FR.things.push(f); if (i === 0) FR['thing_' + e.id] = f;
    });
  }
});

/* =====================================================================
   TISSUE SCENES AS DATA (FT.tissue2): populations of cells described in a JSON file (data/things/tissues/<id>.json), one generic renderer.
   Units: micrometres (the frame's unit is 1e-6 m). A population is one kind of cell or structure: its shape, size, colour, node id (the card it opens),
   how the instances are arranged, and what it is made of at the next level down (`deeper`). Format: tools/things/SCHEMA.md section 5.
   ===================================================================== */
const TH_TIS = {};
function thLoadTissue(id) { return TH_TIS[id] || (TH_TIS[id] = getJSON('data/things/tissues/' + id + '.json')); }
function tissue2Frame(id, T0) {
  thLoadTissue(id);
  return new Frame({ type: 'tissue2', name: 'Inside the leaf', unit: 1e-6, radius: 400, r0: 1e-6, r1: 2e-3, spawnD: 3e-5, pos: T0.clone(), opts: { id } });
}
// an outline for instanced meshes (the engine's outlineMat does not know about instancing)
function thInstOutline(color = 0x1a1f2b, w = .003) {
  return new THREE.ShaderMaterial({
    uniforms: { uW: { value: w }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: .8 } },
    vertexShader: LDV(`uniform float uW;
void main(){ vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.0); vec3 n=normalize(normalMatrix*(mat3(instanceMatrix)*normal)); mv.xyz+=n*(-mv.z)*uW; gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(`uniform vec3 uColor; uniform float uOpacity; void main(){ gl_FragColor=vec4(uColor,uOpacity); }`), side: THREE.BackSide, transparent: true, depthWrite: false
  });
}
function thShapeGeo(kind) {
  let g;
  if (kind === 'rbox') {   // a box with rounded edges
    g = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4); const a = g.attributes.position, r = .22, q = new V3(), v = new V3(), n = new V3();
    for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); q.copy(v).clampScalar(-.5 + r, .5 - r); n.copy(v).sub(q); if (n.lengthSq() > 0) n.normalize().multiplyScalar(r); a.setXYZ(i, q.x + n.x, q.y + n.y, q.z + n.z); }
  }
  else if (kind === 'ellipsoid' || kind === 'lens') g = new THREE.SphereGeometry(.5, 14, 10);
  else if (kind === 'tube_z') g = new THREE.CylinderGeometry(.5, .5, 1, 12, 1).rotateX(Math.PI / 2);
  else if (kind === 'cylinder') g = new THREE.CylinderGeometry(.5, .5, 1, 14, 1);
  else if (kind === 'bean') { g = new THREE.TorusGeometry(.32, .17, 8, 20, Math.PI * 1.0); g.rotateX(0); g.translate(0, -.16, 0); g.rotateZ(Math.PI); g.translate(0, .16, 0); g.scale(1.25, 1, 1); }   // a curved sausage: one guard cell
  else g = new THREE.BoxGeometry(1, 1, 1);
  g.computeVertexNormals(); return g;
}
// instance transforms of one population: [{p:[x,y,z], rotY, s:[sx,sy,sz]}]
function thArrange(pop, built, rnd) {
  const a = pop.arrange || {}, sz = pop.size, out = [];
  if (a.kind === 'list') for (const it of a.items) out.push({ p: it.at.slice(), rotY: it.rotY || 0, s: sz.slice() });
  else if (a.kind === 'grid') {
    const [nx, ny, nz] = a.n, st = a.step, o = a.origin, j = a.jitter || 0;
    for (let k = 0; k < nz; k++) for (let m = 0; m < ny; m++) for (let i = 0; i < nx; i++) {
      const x = o[0] + (i + (a.stagger ? (k % 2) * a.stagger : 0)) * st[0] + sz[0] / 2, y = o[1] + m * st[1], z = o[2] + k * st[2] + sz[2] / 2;
      if ((a.skip || []).some(s => s.x && x > s.x[0] && x < s.x[1])) continue;
      out.push({ p: [x + (rnd() - .5) * j * st[0], y, z + (rnd() - .5) * j * (st[2] || 1)], rotY: 0, s: [sz[0] * (1 + (rnd() - .5) * j), sz[1] * (1 + (rnd() - .5) * j), sz[2] * (1 + (rnd() - .5) * j)] });
    }
  } else if (a.kind === 'random') {
    let guard = 0; const gap = a.gap || 0;
    while (out.length < a.n && guard++ < a.n * 80) {
      const p = [0, 1, 2].map(i => a.min[i] + (a.max[i] - a.min[i]) * rnd()); if ((a.exclude || []).some(e => p.every((v, i) => v > e.min[i] && v < e.max[i]))) continue;
      const s = sz.map(v => v * (.85 + .3 * rnd()));
      if (out.some(o => Math.abs(o.p[0] - p[0]) < (o.s[0] + s[0]) / 2 + gap && Math.abs(o.p[1] - p[1]) < (o.s[1] + s[1]) / 2 + gap && Math.abs(o.p[2] - p[2]) < (o.s[2] + s[2]) / 2 + gap)) continue;
      out.push({ p, rotY: rnd() * 3, s });
    }
  } else if (a.kind === 'inside') {
    const par = built[a.of]; if (!par) return out; const r2 = rng(a.seed || 3);
    for (const q of par) for (let k = 0; k < a.per; k++) {
      let v; do { v = [r2() * 2 - 1, r2() * 2 - 1, r2() * 2 - 1]; } while (v[0] * v[0] + v[1] * v[1] + v[2] * v[2] > 1);
      out.push({ p: [q.p[0] + v[0] * q.s[0] / 2 * a.margin, q.p[1] + v[1] * q.s[1] / 2 * a.margin, q.p[2] + v[2] * q.s[2] / 2 * a.margin], rotY: r2() * 6, s: sz.slice() });
    }
  }
  return out;
}
FT.tissue2 = {
  build(F, o) {
    F.env = { opaque: true, bg: 0xf3efe6 }; F.illo = true;
    F.add(new THREE.HemisphereLight(0xffffff, 0x998877, .75)); const kl = new THREE.DirectionalLight(0xffffff, .75); kl.position.set(2, 4, 3); F.add(kl);
    F.spawnD = 3e-5;
    F.spawn = (T0, hint) => {
      const d = hint && hint.obj && hint.obj.userData.deeper; if (!d) return null;
      if (d.type === 'mol') return new Frame({ type: 'mol', name: d.name || d.mol, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T0.clone(), opts: { mol: d.mol, fixed: false } });
      return new Frame({ type: 'cell', name: 'Plant cell', unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T0.clone().add(new V3(0, -10, 0)), opts: { type: 'plant' } });
    };
    Promise.all([thLoadTissue(o.id), loadNodes()]).then(([def]) => {
      if (!F.built) return;
      F.info = NODE[def.node] || null; F.blurb = def.blurb || ''; F.note = def.note || ''; F.name = def.title;
      F.env.bg = new THREE.Color(def.bg || '#f3efe6').getHex();
      const grp = new THREE.Group(); grp.position.set(-def.center[0], -def.center[1], -def.center[2]); F.add(grp);
      const built = {}, geos = {};
      for (const pop of def.populations) {
        const inst = thArrange(pop, built, rng((pop.arrange && pop.arrange.seed) || pop.id.length * 7 + 1)); built[pop.id] = inst; if (!inst.length) continue;
        const geo = geos[pop.shape] || (geos[pop.shape] = thShapeGeo(pop.shape)), mat = illoMat(new THREE.Color(pop.color).getHex(), { double: true });
        mat.opacity = pop.opacity ?? 1; mat.transparent = mat.opacity < .99; mat.depthWrite = mat.opacity > .9;
        const im = new THREE.InstancedMesh(geo, mat, inst.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), rr = rng(pop.id.length * 13);
        inst.forEach((t, i) => { q.setFromAxisAngle(new V3(0, 1, 0), t.rotY); m4.compose(new V3(...t.p), q, new V3(...t.s)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setRGB(1 - rr() * .08, 1 - rr() * .06, 1 - rr() * .08)); });
        im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; grp.add(im);
        const nid = NODE[pop.node] ? pop.node : null; if (!nid) console.warn('tissue2', def.id, pop.id, 'has no card', pop.node);
        im.userData = { id: pop.id, node: nid, priority: pop.priority ?? 3, deeper: pop.deeper, thing: 'tissue2', madeOf: pop.deeper ? 'cell' : undefined, info: { title: pop.name, tag: 'Inside a leaf', body: '' }, main: im };
        im.userData.resolve = () => pop.id; im.userData.pickRoot = im;
        F.pickables.push(im); if (nid) regMesh(pop.id, im);
        if (pop.ink) { const io = new THREE.InstancedMesh(geo, thInstOutline(0x1a2b1a, .0016), inst.length); io.instanceMatrix = im.instanceMatrix; io.frustumCulled = false; io.renderOrder = -1; grp.add(io); }
      }
      for (const lb of def.labels || []) { const a = new THREE.Object3D(); a.position.set(...lb.at); grp.add(a); const pm = F.pickables.find(p => p.userData.id === lb.pop); F.label(a, lb.text, { pick: pm, cls: 'thTis' }); }
    });
  }
};
