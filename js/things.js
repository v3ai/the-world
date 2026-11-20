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
function thLoadBundle(id) {   // format 1: everything in mesh.json; format 2: mesh.json is the index and mesh.bin holds the numbers (tools/things/lib/export.mjs, pack)
  if (TH.bundles[id]) return TH.bundles[id];
  const here = () => getJSON('data/things/' + id + '/mesh.json').then(async j => {   // on the main thread, as before: used when the worker is not available
    if (j.format === 2) { const r = await fetch('data/things/' + id + '/' + j.bin); if (!r.ok) throw new Error('data/things/' + id + '/' + j.bin + ' ' + r.status); j.buf = await r.arrayBuffer(); }
    return j;
  });
  // in the worker (js/mesh_worker.js): every mesh arrives decoded, with normals and bounding sphere (bundle.dec[key]); mesh.bin is handed back for the instance lists and shade bytes
  const w = typeof meshWorker === 'function' ? meshWorker({ op: 'thing', json: absURL('data/things/' + id + '/mesh.json'), bin: absURL('data/things/' + id + '/mesh.bin') }).then(r => { const j = r.json; j.buf = r.buf; j.dec = r.meshes; return j; }).catch(here) : here();
  w.then(b => { (TH.done = TH.done || {})[id] = b; }, () => { });
  return TH.bundles[id] = w;
}
function thDecodeV2(bundle, q) {   // int16 positions, delta/zigzag/varint triangle indices, optional uint8 shade
  const buf = bundle.buf, p16 = new Int16Array(buf, q.pos[0], q.nv * 3), pos = new Float32Array(q.nv * 3), s = q.scale, o = q.offset;
  for (let i = 0; i < q.nv; i++) { pos[i * 3] = p16[i * 3] * s[0] + o[0]; pos[i * 3 + 1] = p16[i * 3 + 1] * s[1] + o[1]; pos[i * 3 + 2] = p16[i * 3 + 2] * s[2] + o[2]; }
  const bytes = new Uint8Array(buf, q.idx[0], q.idx[1]), idx = q.nv > 65535 ? new Uint32Array(q.ni) : new Uint16Array(q.ni); let b = 0, prev = 0;
  for (let i = 0; i < q.ni; i++) { let z = 0, m = 1, c; do { c = bytes[b++]; z += (c & 127) * m; m *= 128; } while (c & 128); prev += (z & 1) ? -((z + 1) / 2) : z / 2; idx[i] = prev; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}
function thInst(bundle, key) {   // {mesh, stride, n, t: flat x y z qx qy qz qw s (sx sy sz)} for either format
  const I = bundle.instances[key]; if (!I || I.t) return I; if (I._d) return I._d;
  const n = I.n, st = I.stride, buf = bundle.buf, P = new Uint16Array(buf, I.p[0], n * 3), Q = new Int16Array(buf, I.q[0], n * 4), S = new Float32Array(buf, I.s[0], n * (st - 7)), t = new Float32Array(n * st);
  for (let i = 0; i < n; i++) { for (let a = 0; a < 3; a++) t[i * st + a] = I.min[a] + P[i * 3 + a] * I.pscale[a]; for (let a = 0; a < 4; a++) t[i * st + 3 + a] = Q[i * 4 + a] / 32767; for (let a = 0; a < st - 7; a++) t[i * st + 7 + a] = S[i * (st - 7) + a]; }
  return I._d = { mesh: I.mesh, stride: st, n, t };
}
function thGeo(id, bundle, key) {   // one shared BufferGeometry per mesh key
  const k = id + '/' + key; if (TH.geos[k]) return TH.geos[k];
  const q = bundle.meshes[key]; if (!q) return null;
  const g = bundle.dec && bundle.dec[key] ? geoFromArrays(bundle.dec[key]) : bundle.format === 2 ? thDecodeV2(bundle, q) : decodePart(q);
  if (q.shade) { const sh = bundle.format === 2 ? new Uint8Array(bundle.buf, q.shade[0], q.nv) : q.shade, c = new Float32Array(sh.length * 3); for (let i = 0; i < sh.length; i++) c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = sh[i] / 255; g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }   // baked brightness (occlusion, staining)
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
function thOutlineMat(color = 0x1a1f2b, w = .0022, sway) {
  const sw = sway ? Object.assign({ uTime: TH_SWAY.uTime }, thSwayUniforms(sway)) : {};
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uW: { value: w }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: .85 } }, sw),
    vertexShader: LDV((sway ? TH_SWAY_GLSL + '\n' : '') + `uniform float uW;
#include <clipping_planes_pars_vertex>
void main(){ vec4 mvPosition=modelViewMatrix*vec4(position${sway ? '+thMove(position)' : ''},1.0); vec3 n=normalize(normalMatrix*normal); mvPosition.xyz+=n*(-mvPosition.z)*uW; gl_Position=projectionMatrix*mvPosition;
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
  const ol = new THREE.Mesh(geo, thOutlineMat(o.ink, o.w, o.sway)); ol.userData.outline = true; g.add(ol); g.userData.ol = ol; g.userData.main = m;
  m.matrixAutoUpdate = ol.matrixAutoUpdate = false;   // the group is what moves (if anything does); the meshes inside it stay at identity
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

/* ---------- placement: size, lean, variation (all from data, deterministic per placement seed) ---------- */
function thRng(seed) { let a = (seed >>> 0) + 0x9e3779b9; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* Sizes that were once absolute metres (the smallest pick radius, a hotspot marker, the shadow's height, the label's lift, the nearest fly-to distance)
   are written for a thing about half a metre across or more and shrink in proportion for smaller ones, so a 14 mm bee is handled like a dog. */
function thUnit(def, k) { return Math.min(1, (def.radius_m || 1) * (k || 1) / .5); }
/* Where one placement puts its thing: scale k, yaw, lean quaternion (the whole group's rotation), and which groups of instances are kept.
   def.variation = { scale:[min,max], yaw: true (random heading unless the placement gives `rot`), lean_deg: max lean,
                     groups: [{ id, n, keep:[min,max], always:[group indices], members:{ <instances key>: <instances per group> } }] }
   A placement with a `seed` varies; one without stays exactly as written. */
function thPlacement(def, pl) {
  const v = def.variation, out = { k: pl.scale || 1, rotY: (pl.rot || 0) * Math.PI / 180, lean: 0, keep: null };
  out.fu = 1 / (pl.unit || 1);   // frame units per metre: a thing's frame has the unit of the frame it stands in (1 m in the park, 1 mm in the phone), set by thPlace
  if (v && pl.seed !== undefined) {
    const r = thRng(((pl.seed | 0) + 1) * 7919);
    const a = r(), b = r(), c = r(), d = r();
    if (v.scale) out.k *= v.scale[0] + (v.scale[1] - v.scale[0]) * a;
    if (v.yaw && pl.rot === undefined) out.rotY = b * Math.PI * 2;
    if (v.lean_deg) { out.leanAz = c * Math.PI * 2; out.lean = v.lean_deg * (.3 + .7 * d) * Math.PI / 180; }
    for (const g of v.groups || []) {
      const lo = g.keep ? g.keep[0] : g.n, hi = g.keep ? g.keep[1] : g.n, want = Math.max(1, Math.round(lo + (hi - lo) * r())), set = new Set(g.always || []);
      const order = Array.from({ length: g.n }, (_, i) => i).sort((p, q) => r() - .5); for (const i of order) { if (set.size >= want) break; set.add(i); }
      (out.keep = out.keep || {})[g.id] = set;
    }
  }
  out.q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), out.rotY);
  if (out.lean) out.q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(out.leanAz), 0, Math.sin(out.leanAz)), out.lean));
  if (pl.tilt) out.q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pl.tilt[0] * Math.PI / 180, pl.tilt[1] * Math.PI / 180, pl.tilt[2] * Math.PI / 180, 'XYZ')));   // `tilt` [rx, ry, rz] degrees: the model's own attitude (a thing lying on its side), applied before the heading
  out.s = out.k * out.fu;   // frame units per model metre: the scale of the drawn group (k stays the true-size factor, in metres per model metre)
  return out;
}
/* thing-local point -> frame coordinates for a placement (the frame origin is the thing's base point) */
function thLocalToFrame(def, pl, p) { const x = thPlacement(def, pl); return new THREE.Vector3(p[0], p[1], p[2]).multiplyScalar(x.s).applyQuaternion(x.q); }

/* ---------- animation as data (def.anim) ----------
   Entries: { part | parts | system, kind, ... }.
   kind 'sway': a gentle breeze moves the free end of stems and leaves, done in the vertex shader (cost: nothing per frame):
        { kind:'sway', system:'leaves', from_y, to_y (thing-local heights over which it grows), amp_m (displacement at to_y), hz, label }
   kind 'swing': the free end of a long part bends back and forth (a tail wag) in the vertex shader, so it works on a single mesh that holds the whole body:
        { kind:'swing', systems|parts, pivot:[x,y,z], dir:[unit vector pointing away from the base], from, to (metres along dir over which it grows from 0 to full), axis:[x,y,z], amp_deg, hz, shown_hz, lat_axis, lat:[r0, r1] (fade out sideways), sym: true (the two sides turn opposite ways: wings; `from`/`to` then count |distance| along dir), label }
   kind 'wag' | 'flap' | 'sweep': a part turns back and forth about an axis through a point: { kind, part, pivot:[x,y,z], axis:[x,y,z], amp_deg, hz (real), shown_hz (drawn), phase, label }
   kind 'breathe' | 'pulse': a part swells and shrinks about a point: { kind, part, pivot, amp (fraction), hz, shown_hz, phase, label }
   `hz` is the real frequency if known. If `shown_hz` is given and slower, the slow-motion factor hz/shown_hz is stated on screen (frame.timeNote);
   `illustrative: true` says on screen that the motion is a sketch, not a measurement. */
const TH_SWAY = { uTime: { value: 0 } };
const TH_SWAY_GLSL = `uniform float uTime; uniform vec4 uSw; uniform vec2 uSw2; uniform vec2 uWg; uniform float uWgS; uniform vec4 uWgR; uniform vec3 uWgP; uniform vec3 uWgD; uniform vec3 uWgA; uniform vec3 uWgL;
vec3 thMove(vec3 p){
  float h = clamp((p.y - uSw.x) / max(uSw.y - uSw.x, 1e-4), 0., 1.); h *= h; float ph = uTime * uSw.w * 6.2832 + dot(p.xz, vec2(1.7, 1.3)) * uSw2.x;
  vec3 d = vec3(sin(ph) + .35 * sin(ph * 2.7 + p.z * 5.), .12 * sin(ph * 1.3), cos(ph * .83 + 1.3) + .35 * sin(ph * 3.1 + p.x * 5.)) * uSw.z * h;
  vec3 r = p - uWgP; float sd = dot(r, uWgD), side = uWgS > .5 ? (sd < 0. ? -1. : 1.) : 1.; if (uWgS > .5) sd = abs(sd); float w = smoothstep(uWgR.x, uWgR.y, sd) * (1. - smoothstep(uWgR.z, uWgR.w, abs(dot(r, uWgL))));
  float a = sin(uTime * uWg.x * 6.2832) * uWg.y * w * side, c = cos(a), sn = sin(a); vec3 q = r * c + cross(uWgA, r) * sn + uWgA * dot(uWgA, r) * (1. - c);
  return d + (q - r);
}`;
function thSwayUniforms(sp) {   // sp = { sway: entry|null, swing: entry|null }
  const a = sp.sway || {}, g = sp.swing || {}, V = (v, d) => new THREE.Vector3(...(v || d));
  return { uSw: { value: new THREE.Vector4(a.from_y ?? 0, a.to_y ?? 1, sp.sway ? (a.amp_m ?? .02) : 0, a.hz ?? .35) }, uSw2: { value: new THREE.Vector2(a.phase_k ?? 2.2, 0) },
    uWg: { value: new THREE.Vector2(g.shown_hz || g.hz || 1, (g.amp_deg || 0) * Math.PI / 180) }, uWgS: { value: g.sym ? 1 : 0 }, uWgR: { value: new THREE.Vector4(g.from ?? 0, g.to ?? 1, g.lat ? g.lat[0] : 1e3, g.lat ? g.lat[1] : 2e3) },
    uWgP: { value: V(g.pivot, [0, 0, 0]) }, uWgD: { value: V(g.dir, [1, 0, 0]).normalize() }, uWgA: { value: V(g.axis, [0, 1, 0]).normalize() }, uWgL: { value: V(g.lat_axis, [0, 0, 1]).normalize() } };
}
/* Every lit material of a thing goes through thPatch.
   Light: a thing is lit by the park's sun and sky at reduced strength (sun x 0.75, sky x 0.55 and less at night), so that toon shading
   reads well at any sun angle. That reduction is done here, in the shader, on the light the scene provides: TH_LIGHT.uThSun and uThSky
   scale the direct and the ambient light. So a thing looks the same whether it is drawn in its own scene (with copies of the park's
   two lights) or inside the park's scene (with the park's own lights): see "fewer scenes" in js/engine.js. Outside the park (the
   preview tool) both factors are 1.
   Sway (sp, optional): moves the thing-space position, after the instance matrix, in the vertex shader. */
const TH_LIGHT = { uThSun: { value: 1 }, uThSky: { value: 1 } };
const TH_STUDIO = { uThSun: { value: 1 }, uThSky: { value: 1 } };   // a thing that does not stand under the park's sky (in the phone, on the neutral stage) takes its host's lights as they are
function thPatch(mat, sp, L) {
  const u = sp ? thSwayUniforms(sp) : null; if (u) mat.userData.sway = u;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, L || TH_LIGHT);
    sh.fragmentShader = 'uniform float uThSun; uniform float uThSky;\n' + sh.fragmentShader.replace('vec3 outgoingLight =', 'reflectedLight.directDiffuse *= uThSun; reflectedLight.indirectDiffuse *= uThSky;\n\tvec3 outgoingLight =');
    if (!u) return;
    Object.assign(sh.uniforms, { uTime: TH_SWAY.uTime }, u);
    sh.vertexShader = TH_SWAY_GLSL + '\n' + sh.vertexShader.replace('#include <project_vertex>', `vec4 thP = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  thP = instanceMatrix * thP;
#endif
  thP.xyz += thMove(thP.xyz);
  vec4 mvPosition = modelViewMatrix * thP; gl_Position = projectionMatrix * mvPosition;`);
  };
  mat.customProgramCacheKey = () => u ? 'thlit+sway' : 'thlit';
}

const TH_HOT_PX = 6;   // the largest radius, in screen pixels, at which a hotspot marker is drawn
/* ---------- ThingObj: the meshes of one thing ---------- */
class ThingObj {
  /* def: thing.json, bundle: mesh.json, o: { placement: {scale, rot (deg), seed}, or scale / rotY (radians) / seed; hidden: Set } */
  constructor(def, bundle, o = {}) {
    this.def = def; this.bundle = bundle; this.o = o;
    const pl = o.placement || { scale: o.scale, rot: (o.rotY || 0) * 180 / Math.PI, seed: o.seed }; this.pl = pl; this.xf = thPlacement(def, pl); this.qInv = this.xf.q.clone().invert(); this._camT = new V3(); this._c0 = new V3(); this.k = this.xf.k; this.u = thUnit(def, this.k);
    this.s = this.xf.s; this.fu = this.xf.fu; this.unit = 1 / this.fu;   // s: frame units per model metre (the group's scale); fu: frame units per metre; k: the true-size factor
    this.L = o.light || TH_LIGHT; this._hp = new V3();
    this.group = new THREE.Group(); this.group.scale.setScalar(this.s); this.group.quaternion.copy(this.xf.q); this.group.updateMatrix();
    this.holder = new THREE.Group();             // what the frame adds to its scene: group + shadow + hotspots (not scaled)
    this.parts = {}; this.list = []; this.hot = []; this.hidden = o.hidden || new Set(); this.sel = null;
    this.plane = new THREE.Plane(new V3(0, 0, 1), 0); this.planes = [this.plane];
    this.faceMats = []; this.mode = null; this.near = true; this.tier = 0; this.cutN = new V3(0, 0, 1); this.tierNames = ['near'];
    this.lights = o.light ? { hemi: new THREE.HemisphereLight(0xffffff, 0x8899aa, .6), sun: new THREE.DirectionalLight(0xffffff, .8) } : { hemi: new THREE.HemisphereLight(0xcfe6ff, 0x4a6a2a, .75), sun: new THREE.DirectionalLight(0xfff1d6, 1.0) };   // its own lights, used when it is drawn in a scene of its own: copies of the park's sun and sky, or (o.light) the plain pair the device and stage scenes use
    if (o.light) this.lights.sun.position.set(1, 2, 3).multiplyScalar(20); else this.lights.sun.position.set(.4, 1, .5).multiplyScalar(40);
    this.holder.add(this.group);
    this.pivots = {}; this.clock = 0; this.pivotPending = true;
    // layers (outermost first): what Auto peels, what the core sample and "Peel to here" work on. Default: whatever the first mode shows is one layer.
    const m0 = (def.modes[0] || {}).show || {}, dflt = def.systems.map(s => s.id).filter(s => (m0[s] ?? m0['*'] ?? 0) > 0);
    this.layers = (def.layers && def.layers.length ? def.layers : [{ systems: dflt }]).map(l => Object.assign({ ghost: .1 }, l));
    this.rank = {}; this.layers.forEach((l, i) => (l.systems || []).forEach(s => this.rank[s] = i));
    if (def.auto && def.auto.layers) { const ops = {}; this.layers.forEach((l, i) => (l.systems || []).forEach(sy => ops[sy] = i === 0 ? 1 : 0)); this.peelMode = { id: 'auto', show: Object.assign(ops, def.auto.always || {}) }; }
    this.autoOp = null; this.revealOp = null; this.revealId = null; this.revealFront = null; this.layerName = '';
    for (const pd of def.parts) this._addPart(pd);
    if (def.shadow && o.ground !== false) this._addShadow(def.shadow);   // the contact shadow belongs to a thing that stands on a ground
    for (const h of def.hotspots || []) this._addHotspot(h);
    this._addAnims();
    // parts that no animation moves keep the matrix they have (identity): it is not composed again every frame
    { const moving = new Set(this.anims.map(e => e.rec)); for (const r of this.list) if (!moving.has(r)) { r.g.updateMatrix(); r.g.matrixAutoUpdate = false; } for (const h of this.hot) { h.updateMatrix(); h.traverse(o => { o.matrixAutoUpdate = false; }); } if (this.shadow) { this.shadow.updateMatrix(); this.shadow.matrixAutoUpdate = false; } }
    this.olK = 1; this.hovId = null;   // set by the frame: how strongly outlines are drawn (0..1), and the part under the pointer
    this.setMode((def.auto ? 'auto' : (def.modes[0] || {}).id));
  }
  _pivot(name) {   // a group that turns about the vertical axis through def.pivots[name].at ([x, z]); its parts and hotspots live inside
    let p = this.pivots[name]; if (p) return p.inner;
    const at = (this.def.pivots && this.def.pivots[name] && this.def.pivots[name].at) || [0, 0], outer = new THREE.Group(), inner = new THREE.Group();
    outer.position.set(at[0], 0, at[1]); inner.position.set(-at[0], 0, -at[1]); outer.add(inner); this.group.add(outer);
    this.pivots[name] = { outer, inner, at }; return inner;
  }
  _faceFor(pd) {
    const key = pd.cutFace || (this.def.cut && this.def.cut.default), face = key && this.def.cut && this.def.cut.faces && this.def.cut.faces[key];
    return face || { kind: 'plain', palette: [[0x6b5a48, 1]] };
  }
  _sway(pd) {   // the shader motions (sway, swing) that apply to this part
    const mine = a => (a.system && a.system === pd.system) || (a.systems && a.systems.includes(pd.system)) || (a.parts && a.parts.includes(pd.id)) || a.part === pd.id;
    const sway = (this.def.anim || []).find(a => a.kind === 'sway' && mine(a)), swing = (this.def.anim || []).find(a => a.kind === 'swing' && mine(a));
    return sway || swing ? { sway: sway || null, swing: swing || null } : null;
  }
  _addPart(pd) {
    const def = this.def, color = new THREE.Color(pd.color || '#aaaaaa').getHex(), sw = this._sway(pd);
    let g, geo;
    if (pd.mesh) {
      geo = thGeo(def.id, this.bundle, pd.mesh); if (!geo) { console.warn('thing', def.id, 'part', pd.id, 'missing mesh', pd.mesh); return; }
      g = thInked(geo, color, { w: pd.ink_w || def.ink_w || .0018, double: !!pd.double, vc: !!geo.attributes.color, sway: sw });
      g.userData.main.material.clippingPlanes = null; thPatch(g.userData.main.material, sw, this.L);
      if (pd.solid !== false) {   // inside faces for the cut-open view, painted with the cut-face pattern
        const fm = thFaceMat(this._faceFor(pd), this.plane); fm.clippingPlanes = this.planes; const cap = new THREE.Mesh(geo, fm); cap.visible = false; cap.userData.cap = true; cap.renderOrder = 0; cap.matrixAutoUpdate = false; g.add(cap); g.userData.cap = cap; this.faceMats.push(fm);
      }
    } else if (pd.instances) {
      const inst = thInst(this.bundle, pd.instances); geo = thGeo(def.id, this.bundle, inst.mesh);
      const ex = geo.attributes.color ? { vertexColors: true } : {}; if (pd.card) { thCardUV(geo); ex.map = thCardTexture(pd.card); ex.alphaTest = .5; }
      const mat = illoMat(color, { double: !!pd.double, extra: ex }); thPatch(mat, sw, this.L);
      const rj = pd.tint || 0, ck = def.id + ':' + pd.instances + ':' + rj;
      let sh = TH.inst[ck];
      if (!sh) {   // one master set of instance matrices per thing, shared by every placement (built once)
        const t = inst.t, st = inst.stride, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), p = new V3(), col = new THREE.Color();
        const M = new Float32Array(inst.n * 16), C = rj ? new Float32Array(inst.n * 3) : null; let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
        for (let i = 0; i < inst.n; i++) {
          const b = i * st; p.set(t[b], t[b + 1], t[b + 2]); q.set(t[b + 3], t[b + 4], t[b + 5], t[b + 6]);
          if (st === 8) s.setScalar(t[b + 7]); else s.set(t[b + 7], t[b + 8], t[b + 9]);
          m4.compose(p, q, s); m4.toArray(M, i * 16);
          if (C) { col.setRGB(1 + (rnd() - .5) * rj, 1 + (rnd() - .5) * rj * .8, 1 + (rnd() - .5) * rj * .8); col.toArray(C, i * 3); }   // a multiplier on the part colour
        }
        sh = TH.inst[ck] = { M, C, n: inst.n, mat: new THREE.InstancedBufferAttribute(M, 16), col: C ? new THREE.InstancedBufferAttribute(C, 3) : null };
      }
      // this placement may keep only some groups of the instances (which flowers are open): then it gets its own copy of the kept rows
      let kept = null; const vg = (def.variation && def.variation.groups || []).find(g => g.members && g.members[pd.instances]);
      if (vg && this.xf.keep && this.xf.keep[vg.id]) { const per = vg.members[pd.instances], set = this.xf.keep[vg.id]; kept = []; for (let i = 0; i < sh.n; i++) if (set.has(Math.floor(i / per))) kept.push(i); }
      let im;
      if (kept) {
        const M = new Float32Array(kept.length * 16), C = sh.C ? new Float32Array(kept.length * 3) : null; kept.forEach((i, j) => { M.set(sh.M.subarray(i * 16, i * 16 + 16), j * 16); if (C) C.set(sh.C.subarray(i * 3, i * 3 + 3), j * 3); });
        im = new THREE.InstancedMesh(geo, mat, kept.length); im.instanceMatrix = new THREE.InstancedBufferAttribute(M, 16); if (C) im.instanceColor = new THREE.InstancedBufferAttribute(C, 3);
        im.userData.keptIdx = kept;
      } else { im = new THREE.InstancedMesh(geo, mat, sh.n); im.instanceMatrix = sh.mat; if (sh.col) im.instanceColor = sh.col; }
      im.frustumCulled = false; g = im; g.userData.main = im;
    } else if (pd.flow) {
      g = thFlowMesh(def.id, this.bundle, pd, color);
    } else return;
    const rec = { pd, g, op: 0, tgt: 1, near: true, instanced: !!pd.instances, rank: this.rank[pd.system] };
    g.userData.partRec = rec; g.visible = false; rec.flow = g.userData.flow || null;
    (pd.pivot ? this._pivot(pd.pivot) : this.group).add(g); this.list.push(rec); this.parts[pd.id] = rec;
  }
  _addShadow(sh) {
    const r = sh.radius_m * this.s, m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({ map: thShadowTex(), transparent: true, depthWrite: false, opacity: sh.opacity ?? 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(sh.offset ? sh.offset[0] * this.s : 0, .012 * this.u * this.fu, sh.offset ? sh.offset[1] * this.s : 0); m.renderOrder = -1; m.userData.shadow = true; this.shadow = m; this.holder.add(m);
  }
  _hotPivot(h) {   // which pivot group a marker rides on: its own `pivot`, else the pivot of the first of its modes that has one
    if (h.pivot) return h.pivot;
    for (const id of h.modes || []) { const m = this.modeDef(id); if (m && m.pivot) return m.pivot; }
    return null;
  }
  _addHotspot(h) {
    const R = this.def.radius_m || 1, geo = new THREE.SphereGeometry(h.r || Math.max(.01 * this.u, R * .02), 14, 10), g = inked(geo, 0xffd166, { w: .004, extra: { transparent: true } });
    g.children.forEach(m => { m.material.depthTest = false; m.renderOrder = m.userData.outline ? 9 : 10; });   // ink first, fill on top (both in the blended pass, where renderOrder decides)
    thPatch(g.userData.main.material, null, this.L);
    const pv = this._hotPivot(h); g.userData.hotspot = h; g.userData.r0 = geo.parameters.radius; g.userData.pv = pv || null; g.visible = false; g.position.set(...h.at); (pv ? this._pivot(pv) : this.group).add(g); this.hot.push(g);
  }
  _addAnims() {
    this.anims = []; this.notes = [];
    for (const a of this.def.anim || []) {
      if (a.kind === 'sway' || a.kind === 'swing') {
        const slow = a.shown_hz && a.hz ? a.hz / a.shown_hz : 1, txt = a.note || (slow > 1.5 ? `${a.label || a.kind}: drawn about ${Math.round(slow)} times slower than real` + (a.hz ? ` (really about ${a.hz} per second)` : '') : a.kind === 'sway' ? `${a.label || 'Sway'}: a gentle breeze, illustrative, not simulated wind` : `${a.label || 'Motion'}: illustrative, not a measured movement`);
        if (a.note !== null && !this.notes.includes(txt)) this.notes.push(txt); continue;
      }
      const ids = a.parts || (a.part ? [a.part] : this.def.parts.filter(p => p.system === a.system).map(p => p.id));
      for (const id of ids) { const rec = this.parts[id]; if (!rec) continue; this.anims.push({ a, rec, piv: new V3(...(a.pivot || [0, 0, 0])), ax: new V3(...(a.axis || [0, 1, 0])).normalize(), sg: a.mirror && a.mirror.includes(id) ? -1 : 1 }); }
      const slow = a.shown_hz && a.hz ? a.hz / a.shown_hz : 1;
      if (slow > 1.5) this.notes.push(`${a.label || a.kind}: drawn about ${slow >= 100 ? Math.round(slow / 10) * 10 : Math.round(slow)} times slower than real` + (a.hz ? ` (really about ${a.hz} per second)` : ''));
      else if (a.illustrative) this.notes.push(`${a.label || a.kind}: illustrative motion, not a measurement`);
    }
    this.timeNote = this.notes.join('; ');
  }
  _stepAnims(t) {
    const q = new THREE.Quaternion(), v = new V3();
    for (const e of this.anims) {
      const a = e.a, hz = a.shown_hz || a.hz || 1, w = Math.sin(Math.PI * 2 * hz * t + (a.phase || 0) + (e.sg < 0 ? Math.PI : 0)), g = e.rec.g;
      if (a.kind === 'breathe' || a.kind === 'pulse') { const s = 1 + (a.amp || .05) * w; g.scale.setScalar(s); g.position.copy(e.piv).multiplyScalar(1 - s); g.quaternion.identity(); }
      else { q.setFromAxisAngle(e.ax, (a.amp_deg || 10) * Math.PI / 180 * w * (a.kind === 'wag' || a.kind === 'sweep' ? 1 : 1)); g.quaternion.copy(q); g.scale.setScalar(1); v.copy(e.piv).applyQuaternion(q); g.position.copy(e.piv).sub(v); }
    }
  }
  modeDef(id) { return this.def.modes.find(m => m.id === id); }
  // resolve 'auto' from how near the camera is (metres from the thing) or from what is under the view (def.auto.layers)
  resolveMode(distM) {
    if (this.modeId !== 'auto') return this.modeDef(this.modeId);
    const a = this.def.auto || {};
    if (a.layers) return this.peelMode || (this.peelMode = { id: 'auto', show: {} });
    let id; if (a.stages) { id = (a.stages[a.stages.length - 1] || {}).mode; for (const s of a.stages) if (s.max_m !== undefined && distM <= s.max_m) { id = s.mode; break; } }
    else id = distM < (a.near_m || 5) ? (a.near || 'whole') : (a.far || 'whole');
    return this.modeDef(id) || this.def.modes[0];
  }
  setMode(id) { this.modeId = id; this.cutPending = true; this.pivotPending = true; }
  inTier(pd) { return !pd.lod || pd.lod.split('+').some(n => this.tierNames.includes(n)); }
  /* the parts a core sample, a hover and a peel work on: in the current detail tier, not a cut-view detail unless the cut is on, not a flow marker */
  coreRecs() { return this.list.filter(r => !r.flow && this.inTier(r.pd) && (!r.pd.parent || this.cutActive) && (r.rank !== undefined || r.tgt > .05) && r.g.userData.main); }
  isClipped(p) { return !!this.cutActive && this.plane.distanceToPoint(p) < -1e-4; }
  // point the cut: through `at`, facing away from the camera (horizontal), or along a fixed `normal` (sign chosen so the far half is kept)
  aimCut(at, cutDef, camThing) {
    const n = new V3();
    if (cutDef.normal) { n.set(...cutDef.normal).normalize(); if (n.dot(at.clone().sub(camThing)) < 0) n.negate(); }
    else { n.copy(at).sub(camThing); n.y = 0; if (n.lengthSq() < 1e-10) n.set(0, 0, 1); n.normalize(); }
    this.cutN.copy(n);
  }
  faceCut() { this.cutPending = true; this.pivotPending = true; }
  /* per-frame: dt seconds, camLocal = camera position in the group's parent coordinates (metres), off = world offset of the container (frame root position), alpha = frame alpha */
  update(dt, camLocal, off, alpha = 1) {
    const def = this.def, camT = this._camT.copy(camLocal).applyQuaternion(this.qInv).divideScalar(this.s);   // camera in thing-local coordinates (model metres)
    const d = camLocal.distanceTo(this._c0.set(0, (def.radius_m || 1) * this.s * .5, 0).applyQuaternion(this.xf.q)) * this.unit;   // metres from the thing's middle
    this.dist = d; const md = this.resolveMode(d); this.curMode = md; const cut = md && md.cut; this.cutActive = !!cut;
    const lod = def.lod, t0 = this.tier;   // three tiers: 0 near (full detail), 1 mid, 2 far; without lod.far_m the mid tier is the far one
    if (this.lodForce) this.tier = this.lodForce === 'near' ? 0 : this.lodForce === 'mid' ? 1 : 2;
    else if (lod) { const nm = lod.near_m, fm = lod.far_m || 1e9, T = this.tier; this.tier = d > fm * (T === 2 ? .9 : 1.12) ? 2 : d > nm * (T === 0 ? 1.12 : .9) ? 1 : 0; }
    this.near = this.tier === 0; const tierNames = this.tier === 0 ? ['near'] : this.tier === 2 ? ['far'] : (lod && lod.far_m ? ['mid'] : ['far', 'mid']), lodSnap = t0 !== this.tier; this.tierNames = tierNames;
    // cut plane (thing-local -> scene coordinates)
    if (cut) {
      const cutDef = typeof cut === 'object' ? cut : {}, at = new V3(...(cutDef.at || def.cut && def.cut.at || [0, (def.height_m || 1) * .5, 0]));
      if (this.cutPending) { this.cutPending = false; this.aimCut(at, cutDef, camT); }
      const nC = this.cutN.clone().applyQuaternion(this.xf.q), qC = at.clone().applyMatrix4(this.group.matrix);
      this.plane.normal.copy(nC); this.plane.constant = -nC.dot(qC) - nC.dot(off);
      const inv = new THREE.Matrix4().copy(this.group.matrix).invert();
      for (const fm of this.faceMats) { const u = fm.uniforms; u.uPlane.value.set(nC.x, nC.y, nC.z, this.plane.constant); u.uCam.value.copy(this.camW || new V3()); u.uOff.value.copy(off); u.uInv.value.copy(inv); }
    }
    const planes = cut ? this.planes : [];
    this.clock += dt; TH_SWAY.uTime.value = (performance.now() / 1000) % 3600; this.seeThrough = !!(md && md.groundSeeThrough) || !!this.autoGround;
    // pivot groups: the mode's pivot turns (once per choice) so that its opening faces the camera; the others stay where they are
    if (md && md.pivot) {
      const pv = this.pivots[md.pivot] || (this._pivot(md.pivot), this.pivots[md.pivot]);
      if (this.pivotPending) { this.pivotPending = false; pv.ang = Math.atan2(camT.x - pv.at[0], camT.z - pv.at[1]); }
      pv.outer.rotation.y += (((pv.ang - pv.outer.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * (1 - Math.exp(-dt * 6));
    }
    if (this.anims.length && this.tier < 2 && alpha > .05) this._stepAnims(this.clock);
    // opacity map: the mode's, or Auto's peel, or a reveal (everything in front of a part gives way, in any mode); a peeled thing shows all its layers
    let sh = (md && md.show) || {}; const peeled = this.hidden.size > 0; let vs = this.cutActive ? 1 : 0, vi = 0;   // vs: which parts can be seen (and so picked)
    if (this.revealOp && this.revealId) sh = Object.assign({}, sh, this.revealOp);
    for (const r of this.list) {
      const pd = r.pd, sys = pd.system;
      let tgt = sh[sys] !== undefined ? sh[sys] : (sh['*'] !== undefined ? sh['*'] : 0);
      if (r.rank !== undefined) { if (peeled) tgt = 1; else if (this.revealFront && this.revealFront.has(pd.id)) tgt = Math.min(tgt, this.layers[r.rank].ghost); if (this.revealId === pd.id && !peeled) tgt = 1; }
      if (this.sel === pd.id && r.rank !== undefined) tgt = Math.max(tgt, .6);
      if (this.hidden.has(pd.id) && this.sel !== pd.id) tgt = 0;
      if (pd.opacity_max !== undefined) tgt = Math.min(tgt, pd.opacity_max);
      if (pd.parent && !cut) tgt = 0;
      let lodPart = false; if (pd.lod) { lodPart = true; if (!pd.lod.split('+').some(n => tierNames.includes(n))) tgt = 0; }
      r.tgt = tgt; if (lodPart && (lodSnap || tgt === 0)) r.op = tgt; else { r.op += (tgt - r.op) * (1 - Math.exp(-dt * 9)); if (Math.abs(r.op - tgt) < .01) r.op = tgt; }   // detail tiers swap at once, never both drawn
      const op = r.op * alpha, g = r.g, main = g.userData.main, mat = main.material;
      g.visible = op > .01; g.userData.shown = g.visible ? r.op : 0; vi++; if (g.userData.shown >= .35) vs = (vs * 31 + vi) | 0;
      if (g.visible && r.flow) { thFlowUpdate(r.flow, this.clock); mat.opacity = op; continue; }
      if (g.visible) {
        const isSel = this.sel === pd.id;
        mat.opacity = op; mat.transparent = op < .99; mat.depthWrite = op > .9; if (mat.clippingPlanes !== planes) { mat.clippingPlanes = planes; mat.needsUpdate = true; }
        const ol = g.userData.ol, olK = isSel || this.hovId === pd.id ? 1 : this.olK; if (ol) { ol.visible = op > .5 && !pd.noink && olK > .02; ol.material.uniforms.uOpacity.value = .85 * op * olK; ol.material.uniforms.uColor.value.setHex(isSel ? 0x1e4e8f : 0x1a1f2b); if (ol.material.clippingPlanes !== planes) { ol.material.clippingPlanes = planes; ol.material.needsUpdate = true; } }
        const cap = g.userData.cap; if (cap) { cap.visible = !!cut && op > .5; cap.material.uniforms.uOpacity.value = op; cap.material.transparent = op < .995; }
      }
    }
    const pxr = typeof PX_PER_RAD === 'function' ? PX_PER_RAD() : 860;
    for (const h of this.hot) {
      const hs = h.userData.hotspot; h.visible = (!!cut || !!(md && md.hotspots)) && (!hs.modes || (md && hs.modes.includes(md.id))); h.children.forEach(m => { if (m.material.uniforms && m.material.uniforms.uOpacity) m.material.uniforms.uOpacity.value = .85 * alpha; else m.material.opacity = alpha; });
      if (!h.visible) continue;
      /* A marker is a pointer, not a part: it has a size in the model (so it is not lost from afar) but is never drawn wider than about TH_HOT_PX * 2 pixels,
         so that in a close view (a 13 mm syrinx) it does not cover what it points at. Its place: `at`, turned with the pivot it rides on. */
      const p = this._hp.set(hs.at[0], hs.at[1], hs.at[2]), pv = h.userData.pv && this.pivots[h.userData.pv];
      if (pv) { const a = pv.outer.rotation.y, x = p.x - pv.at[0], z = p.z - pv.at[1], c = Math.cos(a), sn = Math.sin(a); p.x = pv.at[0] + x * c + z * sn; p.z = pv.at[1] - x * sn + z * c; }
      const sc = Math.min(1, TH_HOT_PX * p.distanceTo(camT) / (pxr * h.userData.r0));
      if (Math.abs(sc - h.scale.x) > .02 * h.scale.x) { h.scale.setScalar(sc); h.updateMatrix(); }
    }
    if (this.shadow) this.shadow.material.opacity = (def.shadow.opacity ?? 1) * alpha;
    this.shownSig = vs;
    return md;
  }
  dispose() { this.holder.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); }
}

/* ---------- FT.thing: a placed thing inside a frame ---------- */
const TH_PEEL = { K: 12, TMIN: .008, TMAX: .045 };   // the human's peel constants (body_core.js PEEL_K ...), scaled by the thing's size
FT.thing = {
  build(F, o) {
    const id = o.thing, pl = o.placement || {}; F.illo = true; F.noFade = true;   // opacity is handled per part, like the body
    const env = o.env || 'park';   // whose light it stands in: 'park' (the park's sun and sky), 'sun' (the sun and sky of the frame it stands in), 'studio' (the plain pair of the device and stage scenes)
    F.mergeable = o.merge !== false;   // drawn inside its host's scene whenever the host is drawn (js/engine.js, "fewer scenes"); its own two lights are then switched off
    F.onMerge = on => { if (F.T) F.T.lights.hemi.visible = F.T.lights.sun.visible = !on; };
    renderer.localClippingEnabled = true;
    F.parts = {}; F.mode = null; F.layered = true; F.hidden = new Set(); F.sel = null; F.reveal = null;   // the body's click features (core sample, hide, peel) work on this frame too
    F.env = { bg: 0, opaque: false };
    const fogSrc = env === 'park' && FR.park && FR.park.scene;
    if (fogSrc && fogSrc.fog) F.scene.fog = fogSrc.fog;
    if (env === 'sun') F.thL = { uThSun: { value: .75 }, uThSky: { value: .55 } };
    F.ready = Promise.all([thLoadDef(id), thLoadBundle(id), loadNodes()]).then(([def, bundle]) => {
      if (!F.built) return;
      const T = new ThingObj(def, bundle, { placement: pl, hidden: F.hidden, light: env === 'park' ? null : env === 'sun' ? F.thL : TH_STUDIO, ground: o.ground !== false });
      if (env === 'sun') { T.lights.hemi.color.setHex(0xcfe6ff); T.lights.hemi.groundColor.setHex(0x4a4a3a); T.lights.sun.color.setHex(0xfff1d6); }
      F.T = T; T.group.position.set(0, 0, 0); T.group.updateMatrix(); T.holder.position.set(0, 0, 0);
      F.add(T.holder); F.add(T.lights.hemi); F.add(T.lights.sun); F.add(T.lights.sun.target); F.onMerge(!!F._merged);
      const validModes = ['auto'].concat(def.modes.map(m => m.id)); if (!def.auto) validModes.shift();
      T.setMode(validModes.includes(F.mode) ? F.mode : validModes[0]);
      thBindFrame(F, T, def);
      if (F.thHost && F.thHost.onBuilt) F.thHost.onBuilt(F);
    });
    F.onDispose = () => { const mine = new Set(F.pickables); for (const k in PARTMESH) { const a = PARTMESH[k]; if (a.some(m => mine.has(m))) PARTMESH[k] = a.filter(m => !mine.has(m)); } if (F.T) F.T.dispose(); F.T = null; if (F.proxy) F.proxy.visible = true; F.proxy = null; F._vs = F._legendKey = F._lastModeId = undefined; };   // a thing that is far away gives its meshes back (thSweep); it is built again when the camera returns
    F.update = (dt, t) => thFrameUpdate(F, dt, t);
    F.chooseHit = cands => thChooseHit(F, cands);
    F.cardMadeOf = (h, n) => thCardMadeOf(F, h, n);
    F.cutOpen = (h, peek) => thCutOpen(F, h, peek);   // a double click, or the card's "Look inside": the thing's cut-open view first (cutOpenOf, js/engine.js)
    F.spawnD = .006; F.spawn = (T0, hint) => thSpawn(F, T0, hint);
    F.coreIds = () => F.T ? F.T.coreRecs().map(r => r.pd.id) : [];
    F.coreClip = p => !!F.T && F.T.isClipped(p);
  }
};
function thBindFrame(F, T, def) {
  const k = T.s, u = T.u, fu = T.fu;   // k: frame units per model metre (in the park: the placement's scale); fu: frame units per metre
  F.blurb = def.blurb || ''; F.note = (F.opts.note ? F.opts.note + ' ' : '') + (def.model_note || ''); F.timeNote = T.timeNote || '';
  F.coreText = { head: 'Under this point, from the outside inward', note: `Depths are on the model of this ${(def.title || 'thing').toLowerCase()}, not a measurement of a real one.` };
  F.spawnD = .006 * u; F.floorD = .0015 * u;   // no zooming into an empty gap: a part's tissue takes over at spawnD, otherwise the view stops here
  // controls: one button per layer mode, built now so the frame's control bar is ready when the camera arrives
  const modes = (def.auto ? [['auto', def.auto.label || 'Auto']] : []).concat(def.modes.map(m => [m.id, m.label]));
  building = F;
  try {
    const row = seg(modes, T.modeId, m => thChooseMode(F, m));
    F.uiRow = row; row.classList.add('thModes');
    F.cutBtn = actBtn('Turn the cut to face me', () => { T.faceCut(); }); F.cutBtn.style.display = 'none';
    F.showAllBtn = actBtn('Show everything', () => { F.hidden.clear(); F.reveal = null; F.sel = null; toast('Everything is back.'); }); F.showAllBtn.style.display = 'none';
    F.legend = uiEl(document.createElement('div')); F.legend.className = 'thLegend'; F.legend.style.display = 'none'; F.legend.dataset.sec = 'Legend'; F.legend.dataset.secKey = 'legend:' + def.id; F.legend.dataset.secOpen = 'always';   // data-sec: a section of the one panel, not a box over the scene (updateControls, js/engine.js)
  } finally { building = null; }
  uiFrame = null; capFrame = null;
  // pickable parts, following the conventions of the body (userData.part / center / radius / madeOf)
  for (const rec of T.list) {
    const pd = rec.pd, g = rec.g, thingR = (def.radius_m || 1) * k;
    const node = NODE[pd.node] ? pd.node : null; if (!node) console.warn('thing', def.id, 'part', pd.id, 'has no node card:', pd.node);
    const pc = new V3(...(pd.center || [0, 0, 0]));
    const partCenter = () => pc.clone().applyMatrix4(T.group.matrix);
    Object.assign(g.userData, {
      id: pd.id, node, part: { id: pd.id, name: pd.name, system: pd.system, center: pd.center, radius: pd.radius, parent: pd.parent || null }, thing: def.id, frame: F,
      info: { title: pd.name, tag: (def.systems.find(s => s.id === pd.system) || {}).label || pd.system, body: '' },
      priority: pd.priority ?? (pd.parent ? 2 : 1.5), shown: 0,
      madeOf: pd.deeper ? 'thing' : undefined, material: pd.material,
      center: h => (h && h.pointLocal) ? h.pointLocal.clone() : partCenter(),
      radius: h => Math.max(pd.fly_m !== undefined ? pd.fly_m * k * .5 : Math.min(.015 * u * fu, (pd.radius || .1) * k * 1.2), Math.min((pd.radius || .1) * k * .3, thingR * .2)),   /* the smallest distance a flight to the part goes to: part.fly_m, else the default for a hand-sized thing but no larger than 1.2 radii of a tiny part */
      /* what a click frames: the whole part; for one of a crowd (a leaf, a hair) the point clicked, at the size of one instance */
      extent: h => rec.instanced || rec.flow ? { p: h && h.pointLocal ? h.pointLocal.clone() : partCenter(), r: thInstSize(T, rec, h) } : { p: partCenter(), r: Math.max((pd.radius || .1) * k, 1e-9) }
    });
    if (rec.instanced) g.userData.resolve = hit => pd.id;
    g.userData.main.userData.pickRoot = g;
    F.pickables.push(g); F.parts[pd.id] = { g, p: g.userData.part }; regMesh(pd.id, g); if (node) regMesh(node, g);
  }
  for (const g of T.hot) {
    const h = g.userData.hotspot, node = NODE[h.node] ? h.node : null, at = new V3(...h.at).applyMatrix4(T.group.matrix);
    Object.assign(g.userData, { id: h.id || h.node, node, priority: 4, thing: def.id, frame: F, hotspot: h, madeOf: h.deeper ? 'thing' : undefined, info: { title: h.label || nodeTitle(h.node), tag: 'Marker', body: '' }, center: () => at.clone(), radius: () => (def.radius_m || 1) * k * .05, extent: () => ({ p: at.clone(), r: (def.radius_m || 1) * k * .12 }) });
    g.userData.main.userData.pickRoot = g; F.pickables.push(g); regMesh(h.node, g);
    const hl = F.label(g, h.label || nodeTitle(h.node), { offset: new V3(0, (def.radius_m || 1) * k * .05, 0) });
    hl.minSizeFn = () => hovered === g || (F.selNode === h.node && !!infoState && infoState.node === h.node);   // a marker's name shows only while it is pointed at (or its card is open): a label above each marker covered its neighbours, and a click on one opened another's card
  }
  F.labelObj = new THREE.Object3D(); if (F.opts.labelAt) F.labelObj.position.set(...F.opts.labelAt).multiplyScalar(k).applyQuaternion(T.xf.q); else F.labelObj.position.set(0, ((def.height_m || def.radius_m || 1) * k) + .12 * u * fu, 0).applyQuaternion(T.xf.q); F.add(F.labelObj);
  const mainRec = T.parts[def.main_part || (def.parts[0] || {}).id];
  if ((F.opts.n || 0) === 0 || !def.label_first_only) { const nl = F.label(F.labelObj, def.label || def.title, { cls: 'thName', pick: mainRec && mainRec.g }); nl.minSizeFn = f => f.dLoc < (def.label_m ? def.label_m * fu : (def.radius_m || 1) * k * 25) && (!F.opts.labelIf || F.opts.labelIf(F)); }
  thUpdateControls(F);
}
/* A view chosen by its button: the choice stands on its own, so a part that a card or a jump had revealed (kept showing through every view) is let go;
   and the camera turns to where the view says it is best seen from (mode.view). */
function thChooseMode(F, m) { const T = F.T; if (!T) return; F.reveal = null; F.sel = null; T.setMode(m); thUpdateControls(F); if (m !== 'auto') thModeView(F, T.modeDef(m)); }
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
  F.legend.style.display = lg ? '' : 'none'; if (lg) F.legend.dataset.sec = lg.title || 'Legend';
}
const _thV = new V3(), _thOff = new V3();
// the Roots view makes the park's ground see-through (and hides the grass) so the roots can be seen below it
let _thGround = null, _thFaded = false;
function thGroundFade(on) {
  if (on === _thFaded) return; const P = FR.park && FR.park.v2 && FR.park.v2.parts; if (!P || !P.ground) return;
  _thFaded = on; const m = P.ground.material; m.transparent = on; m.opacity = on ? .16 : 1; m.depthWrite = !on; m.needsUpdate = true; if (P.grass) P.grass.visible = !on;
  P.ground.userData.noPick = on; if (P.grass) P.grass.userData.noPick = on;   // see-through ground cannot be clicked: what is below it can (it used to open "Ground and soil")
}
function thFrameUpdate(F, dt, t) {
  const T = F.T; if (!T) return;
  F._seen = performance.now();
  // sun and sky light copied from the park (or from the frame the thing stands in: a landscape, the Earth) so shading and day/night agree; a thing in a device or on the stage keeps its plain pair
  const env = F.opts.env || 'park', P = env === 'park' ? FR.park : env === 'sun' ? F.parent : null;
  if (P && P.scene) {
    let hl = P._thL; if (!hl || hl.scene !== P.scene) { hl = P._thL = { scene: P.scene, sun: null, hemi: null }; P.root.traverse(o => { if (o.isDirectionalLight && !hl.sun) hl.sun = o; if (o.isHemisphereLight && !hl.hemi) hl.hemi = o; }); }
    const L = env === 'park' ? TH_LIGHT : F.thL;
    // this frame's own lights are copies of the host's (used when it is drawn alone); the reduction to sun x 0.75 and sky x 0.55 (less at night) is in the shader (thPatch)
    if (hl.sun) { T.lights.sun.position.copy(hl.sun.position).normalize().multiplyScalar(40); T.lights.sun.intensity = hl.sun.intensity; T.lights.sun.color.copy(hl.sun.color); L.uThSun.value = .75; }
    if (hl.hemi) { const day = Math.min(1, hl.sun ? hl.sun.intensity / 1.15 : 1); T.lights.hemi.intensity = hl.hemi.intensity; T.lights.hemi.color.copy(hl.hemi.color); T.lights.hemi.groundColor.copy(hl.hemi.groundColor); /* the sky light's direction is up (the engine keeps a hemisphere light's direction independent of the camera: fixSceneLights) */ L.uThSky.value = .55 * (.18 + .82 * day); }
    else if (env === 'sun') { T.lights.hemi.intensity = .12; L.uThSky.value = 1; }   // in space there is no sky: a little fill light so the night side is not black
    if (env === 'park' && P.scene.fog && F.scene.fog !== P.scene.fog) F.scene.fog = P.scene.fog;
  }
  const C = F.C || _thV.set(0, 0, 0);   // camera position in frame coordinates; in the shifted frame root the camera sits at the world origin (T.camW stays 0)
  _thOff.copy(F.root.position);
  // the part a card is about stays selected only while its card is open
  if (F.sel || F.reveal) { const st = infoState, keep = st && ((st.h && st.h.frame === F && st.h.obj && st.h.obj.userData.id === F.sel) || (!st.h && st.node === F.selNode)); if (!keep) { F.sel = null; F.reveal = null; } }
  T.sel = F.sel; thAutoUpdate(F, dt);
  if (F.spawnHold && cam.A !== F && !fly) F.spawnHold = 0;
  if (cam.A === F && cam.D <= F.floorD * 1.25) { const nw = performance.now(); if (nw - (F._flT || 0) > 600) { F._flT = nw; thAtFloor(F); } } else if (F.floorNode && cam.D > F.floorD * 3) F.floorNode = null;
  T.olK = T.tier === 2 && PERF.flags.outline !== 'all' ? 0 : outlineAmt(2 * (T.def.radius_m || 1) * T.k / Math.max(T.dist || 1e-6, 1e-6) * PX_PER_RAD()); T.hovId = hovered && hovered.userData.frame === F ? hovered.userData.id : null;   // outline=near: no ink on the far detail tier, and it fades out as the thing gets small on screen
  if (F._arr === undefined) F._arr = 0; if (F._arr < 1) F._arr = Math.min(1, F._arr + dt / .4);   // a thing that has just loaded fades in over 0.4 s
  T.update(dt, C, _thOff, F.alpha * F._arr);
  if (T.shownSig !== F._vs) { F._vs = T.shownSig; viewChanged(); }   // the parts that can be seen have changed: the hover under a resting pointer is worked out again
  if (env === 'park') thGroundFade(FR.things.some(f => f.T && f.T.seeThrough && f.alpha > .5 && f.parent === FR.park));
  if (F._lastModeId !== T.modeId) { F._lastModeId = T.modeId; thUpdateControls(F); F.mode = T.modeId; }
  const n = F.hidden.size, on = n || F.reveal, dsp = on ? '' : 'none'; if (F.showAllBtn.style.display !== dsp) F.showAllBtn.style.display = dsp;
  const txt = n ? `Show everything (${n} hidden)` : 'Show everything'; if (on && F.showAllBtn.textContent !== txt) F.showAllBtn.textContent = txt;
  if (T.modeId === 'auto' && F.uiRow && T.def.auto && T.def.auto.layers && F._layerTxt !== T.layerName) { F._layerTxt = T.layerName; const b = F.uiRow.querySelector('[data-k=auto]'); if (b) b.textContent = (T.def.auto.label || 'Auto') + (T.layerName ? ': ' + T.layerName : ''); }
}
/* ---------- Auto layers and reveal: the human's ray-based peel, for any thing that declares def.layers ----------
   The camera looks along a ray through the zoom target; the layers (def.layers, outermost first) found on that ray decide what peels:
   a layer turns see-through when the camera is closer to its surface than about K times the gap to the next layer behind it, and each deeper
   layer waits for the one in front. The innermost layer on the ray is the end of the descent and is never peeled. */
const _tpo = new V3(), _tpd = new V3(), _tpc = new V3();
function thRayStack(F, targetFrame) {
  const T = F.T; camPosIn(F, _tpo);
  if (targetFrame) _tpd.copy(targetFrame).sub(_tpo); else { _tpc.copy(cam.T); convertP(_tpc, cam.A, F); _tpd.copy(_tpc).sub(_tpo); }
  if (_tpd.lengthSq() < 1e-14) _tpd.copy(cam.dir).negate(); _tpd.normalize();
  raycaster.ray.origin.copy(_tpo).sub(F.C); raycaster.ray.direction.copy(_tpd); raycaster.near = 0; raycaster.far = Infinity;
  const rows = [];
  for (const rec of T.coreRecs()) {
    if (rec.instanced || rec.rank === undefined || T.hidden.has(rec.pd.id)) continue;
    const m = rec.g.userData.main; m.updateWorldMatrix(true, false);
    const hit = raycaster.intersectObject(m, false).find(x => !T.isClipped(x.point)); if (hit) rows.push({ id: rec.pd.id, e: hit.distance * T.unit, rank: rec.rank });   // e: metres along the ray (the peel constants are metres)
  }
  rows.sort((a, b) => a.e - b.e); return rows;
}
function thPeel(T, rows, tgt, near = 0) {   // near: how close the camera is (0 far .. 1 inside); an empty ray with the camera close means it is inside the thing: everything in front is peeled
  const L = T.layers, nl = L.length, sc = T.peelScale, n = rows.length, pr = new Array(nl).fill(0); let focus = 0;
  if (tgt) { for (let r = 0; r < nl; r++) pr[r] = r < tgt.rank ? 1 : 0; focus = tgt.rank; }
  else if (!n && nl > 1) { for (let k = 0; k < nl - 1; k++) pr[k] = near; focus = near > .5 ? nl - 1 : 0; }
  else if (n && nl > 1) {
    let prevT = Infinity, prevRank = -1, prevPi = 1;
    for (let i = 0; i < n; i++) {
      const r = rows[i]; let j = i + 1; while (j < n && rows[j].rank <= r.rank) j++;
      if (j >= n && r.rank >= nl - 1) { r.pi = 0; continue; }   // nothing deeper behind it and it is the innermost layer: the end of the descent
      if (r.rank !== prevRank) { r.T = Math.min(TH_PEEL.K * Math.min(Math.max(j < n ? rows[j].e - r.e : .025 * sc, TH_PEEL.TMIN * sc), TH_PEEL.TMAX * sc), prevT * .5); prevT = r.T; prevRank = r.rank; r.pi = Math.min(prevPi, 1 - smooth(r.T, r.T * 1.6, r.e)); prevPi = r.pi; }
      else { const p0 = rows[i - 1]; r.T = p0.T; r.pi = p0.pi; }
    }
    let fi = rows.findIndex(r => r.pi < .5); if (fi < 0) fi = n - 1; const fr = rows[fi].rank; focus = fr;
    for (let k = 0; k < nl; k++) { const ix = rows.findIndex(r => r.rank === k); pr[k] = ix >= 0 && ix <= fi ? rows[ix].pi : (k < fr ? 1 : 0); }
  }
  const ops = {};
  for (let k = 0; k < nl; k++) {
    const l = L[k], deeper = rows.some(r => r.rank > k), outer = k ? pr[k - 1] : 1;
    let op = outer * ((1 - pr[k]) * (deeper && l.see_through !== undefined ? l.see_through : 1) + pr[k] * l.ghost);
    if (tgt) op = k < tgt.rank ? l.ghost : k === tgt.rank ? 1 : .5;
    (l.systems || []).forEach(s => ops[s] = op);
  }
  const fl = L[focus] || {}; return { ops, rank: focus, focus: fl.label || fl.id || (fl.systems || [])[0] || '' };
}
function thAutoUpdate(F, dt) {
  const T = F.T, a = T.def.auto, useAuto = !!(a && a.layers && T.modeId === 'auto'), rv = F.reveal && T.parts[F.reveal.id] && T.parts[F.reveal.id].rank !== undefined ? F.reveal : null;
  if (!useAuto && !rv) { T.revealOp = T.revealId = T.revealFront = null; T.autoGround = false; return; }
  if (!T.peelScale) T.peelScale = a && a.scale || Math.max(.15, (T.def.height_m || 1) * T.k / 1.75);
  const S = F._pk = F._pk || { t: -1, key: '' }, now = performance.now();
  camPosIn(F, _tpo); const dist = _tpo.distanceTo(_tpc.set(0, (T.def.radius_m || 1) * T.s * .5, 0).applyQuaternion(T.xf.q)) * T.unit, active = (a && a.active_m) || (T.def.radius_m || 1) * T.k * 2.5;
  if (useAuto && !rv && dist > active) {   // far: the outermost layer, solid
    const ops = {}; T.layers.forEach((l, i) => (l.systems || []).forEach(s => ops[s] = i === 0 ? 1 : 0)); Object.assign(ops, a.always || {});
    T.peelMode.show = ops; T.layerName = (T.layers[0].label || T.layers[0].id || ''); T.revealOp = T.revealId = T.revealFront = null; T.autoGround = false; S.key = ''; return;
  }
  const key = [_tpo.x, _tpo.y, _tpo.z, cam.T.x, cam.T.y, cam.T.z, F.hidden.size, rv ? rv.id : '', T.tier].map(v => typeof v === 'number' ? v.toFixed(4) : v).join();
  if (key === S.key || now - S.t < 110) return; S.key = key; S.t = now;
  let tl = null, tgt = null; if (rv) tl = new V3(...T.parts[rv.id].pd.center).applyMatrix4(T.group.matrix);
  const rows = thRayStack(F, tl);
  if (rv) { let k = rows.findIndex(r => r.id === rv.id); if (k < 0) { const dc = _tpo.distanceTo(tl) * T.unit; k = rows.filter(r => r.e < dc * .97).length; } tgt = { n: k, rank: T.parts[rv.id].rank }; T.revealFront = new Set(rows.slice(0, k).filter(r => r.rank >= tgt.rank).map(r => r.id)); }
  const P = thPeel(T, rows, tgt, 1 - smooth(active * .35, active * .6, dist));
  if (useAuto) { const ops = Object.assign({}, P.ops, a.always || {}); T.peelMode.show = ops; T.layerName = P.focus; }
  // `auto.ground_see_through`: the layer rank (true = 1) from which the park's ground is drawn see-through, so that what lies below it can be seen and clicked
  T.autoGround = a && a.ground_see_through !== undefined && a.ground_see_through !== false ? P.rank >= (a.ground_see_through === true ? 1 : a.ground_see_through) : false;
  if (rv) { T.revealOp = P.ops; T.revealId = rv.id; } else { T.revealOp = T.revealId = T.revealFront = null; }
}
/* The zoom floor of a thing: where a part has a closer view (its `deeper`) the tissue scene has already taken over; where it has none, the view stops here. Say so, and
   have that part's card open, instead of ending on a blank stop. (Rate-limited by the caller: one ray test per part, a few times a second.) */
function thAtFloor(F) {
  const pid = thVisibleAt(F), rec = pid && F.T.parts[pid]; if (!rec || rec.pd.deeper) return;
  if (typeof DESCENT !== 'undefined' && (DESCENT.has(F, thQuery(rec)) || F._dzStop)) return;   // the materials table knows what it is made of (the zoom goes on), or has said why it stops
  const node = NODE[rec.pd.node] ? rec.pd.node : null; if (!node || F.floorNode === node) return;
  F.floorNode = node;
  if (!(infoState && infoState.node === node)) { showBodyNode(node, { frame: F, obj: rec.g, id: pid, pointLocal: cam.T.clone() }); }
  if (infoState && infoState.node === node && !infoEl.querySelector('.thFloor')) { const d = document.createElement('div'); d.className = 'note thFloor'; d.textContent = 'No closer view has been built for this part yet: the model stops here.'; const tg = infoEl.querySelector('.tag'); if (tg) tg.insertAdjacentElement('beforebegin', d); }
  toast(`No closer view has been built for this part yet (${rec.pd.name.toLowerCase()}). The model stops here; the card says what it is made of.`);
}
/* which part is visibly under the camera's target right now (nearest, un-clipped, drawn at least about a third solid) */
function thVisibleAt(F) {
  const T = F.T; if (!T) return null;
  camPosIn(F, _tpo); _tpc.copy(cam.T); convertP(_tpc, cam.A, F); _tpd.copy(_tpc).sub(_tpo); if (_tpd.lengthSq() < 1e-14) return null; _tpd.normalize();
  raycaster.ray.origin.copy(_tpo).sub(F.C); raycaster.ray.direction.copy(_tpd); raycaster.near = 0; raycaster.far = Infinity;
  let best = null;
  for (const rec of T.list) {
    if (rec.flow || !rec.g.visible || rec.op < .35) continue;
    const m = rec.g.userData.main; m.updateWorldMatrix(true, false);
    const hit = raycaster.intersectObject(m, false).find(x => !T.isClipped(x.point)); if (hit && (!best || hit.distance < best.d)) best = { d: hit.distance, id: rec.pd.id };
  }
  return best && best.id;
}
/* Pick rule: markers first; then the nearest part that is actually showing and not cut away (never a peeled, see-through layer: its name would be wrong) */
function thChooseHit(F, cands) {
  if (!cands.length) return null; const T = F.T;
  let top = null; for (const c of cands) if (c.pri >= 3 && (!top || c.pri > top.pri || (c.pri === top.pri && c.hit.distance < top.hit.distance))) top = c;
  if (top) return top;
  const ok = T ? cands.filter(c => !T.isClipped(c.hit.point)) : cands, vis = ok.filter(c => (c.obj.userData.shown || 0) >= .35); if (!vis.length && typeof PICK_HOVER !== 'undefined' && PICK_HOVER) return null;   // a tooltip never names a see-through layer
  const pool = vis.length ? vis : ok.length ? ok : cands;
  return pool.reduce((b, c) => c.hit.distance < b.hit.distance ? c : b);
}

/* ---------- what each part is made of at the next level down ---------- */
/* The part under the zoom point: the one the pointer is on, as long as it is still showing (a layer that has peeled to a ghost no longer counts: then it is the
   part that is visibly under the target now); a marker's own `deeper` comes first. What it is made of: its own `deeper`, else its material (the part's
   `material`, or the thing's assignment file data/descent/assign/<thing>.json: js/descent.js). */
function thPartAt(F, hint) {
  const hu = hint && hint.obj && hint.obj.userData, own = hu && hu.part && F.T.parts[hu.id];
  if (own && (hu.shown || 0) >= .35 * Math.min(1, own.pd.opacity_max ?? 1)) return own;
  const pid = thVisibleAt(F); return (pid && F.T.parts[pid]) || own || null;
}
const thQuery = rec => ({ id: rec.pd.id, node: rec.pd.node, system: rec.pd.system, what: rec.pd.name, obj: rec.g, u: rec.g.userData });
function thSpawn(F, T0, hint) {
  if (!F.T) return null;
  const hu = hint && hint.obj && hint.obj.userData;
  let rec = null;
  if (hu && hu.hotspot) {   // a marker: its own `deeper`; else what the part it names is made of (the first part with the marker's card); else nothing (the table then says it is only a marker)
    if (hu.hotspot.deeper) return thDeepFrame(hu.hotspot.deeper, T0, undefined, F.unit);
    rec = F.T.list.find(r => r.pd.node === hu.hotspot.node && !r.flow) || null; if (!rec) return null;
  } else rec = thPartAt(F, hint);
  if (!rec) return null;
  /* The scene of one part is larger than a thin part (a tissue scene's frame is 3 mm, a coating of the cell 0.07 mm). Once it has been entered and left, a zoom
     that is aimed at another part of the thing must not fall into it again: it is entered again only with the pointer on the part it was made for. */
  const forObj = hint && hint.obj;   // what the pointer was on when the scene was made (a peeled layer in front of the part, or a marker, is not the part itself)
  const own = f => { if (f && forObj) f.enterIf = aim => !f.entered || aim.frame !== F || aim.obj === rec.g || aim.obj === forObj; return f; };
  if (rec.pd.deeper) return own(thDeepFrame(rec.pd.deeper, T0, undefined, F.unit));
  return own(typeof DESCENT !== 'undefined' ? DESCENT.spawnFor(F, thQuery(rec), T0) : null);
}
const TH_CELLS = {
  plant: { name: 'Plant cell', opts: { type: 'plant' }, off: -10 },
  animal: { name: 'Animal cell', opts: { type: 'animal' }, off: 0 },
  fungal: { name: 'Fungal cell (generic stand-in)', opts: { type: 'animal', cname: 'Fungal cell (generic stand-in)' }, off: 0, note: 'No fungal-cell scene has been built yet, so this is the generic animal-cell scene standing in for it. A fungal cell also has a nucleus and mitochondria, but it is surrounded by a rigid cell wall and differs from an animal cell in other ways that are not drawn here.' }
};
function thCellFrame(kind, T0, pu = 1e-6) {   // pu: the parent frame's unit; the cell's offset below the point is in micrometres
  const c = TH_CELLS[kind] || TH_CELLS.plant, f = new Frame({ type: 'cell', name: c.name, unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T0.clone().add(new V3(0, c.off * 1e-6 / pu, 0)), opts: Object.assign({}, c.opts) });
  if (c.note) f.note = c.note; return f;
}
function thDeepFrame(d, T0, dflt, pu = 1e-6) {
  if (d.type === 'crystal') return crystalFrame(d.id, T0);
  if (d.type === 'micro') return microFrame(d.kind, T0);
  if (d.type === 'tissue') return tissueFrame(d.id, T0, d.organ);
  if (d.type === 'tissue2') return tissue2Frame(d.id, T0);
  if (d.type === 'cell') return thCellFrame(d.cell || dflt || 'plant', T0, pu);
  if (d.type === 'liquid') return new Frame({ type: 'liquid', name: d.name || 'Liquid water', unit: 1e-10, radius: 18, r1: 2e-8, spawnD: 1e-9, pos: T0.clone() });   // the 3 nm ball of liquid water (a tissue scene's water, a film of pond water)
  if (d.type === 'mol') return new Frame({ type: 'mol', name: d.name || d.mol, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T0.clone(), opts: { mol: d.mol, fixed: false } });
  return null;
}
const TH_DEEP_D = { liquid: 5e-9, crystal: 4e-9, mol: 2.5e-9, cell: 4e-5, tissue2: 4e-4, micro: 1.2e-3, tissue: 4e-4 };
function thGoDeeper(F, h, d, dflt) {
  closeInfo(); const p = h && h.pointLocal ? h.pointLocal.clone() : new V3(); const f = thDeepFrame(d, p, dflt, F.unit); if (!f) return;
  f.dynamic = true; f.keep = performance.now() + 60000; F.addChild(f); f.ensure(); flyTo(f, new V3(), d.D || TH_DEEP_D[d.type] || 4e-9);
}
/* the size (frame units) of the one instance that was clicked, for framing it: the instance's scale times its mesh's radius */
const _thIM = new THREE.Matrix4(), _thIS = new V3();
function thInstSize(T, rec, h) {
  const m = h && h.hit && h.hit.object, i = h && h.hit ? h.hit.instanceId : undefined;
  if (m && m.isInstancedMesh && i !== undefined && m.geometry) { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); m.getMatrixAt(i, _thIM); _thIS.setFromMatrixScale(_thIM); return Math.max(m.geometry.boundingSphere.radius * Math.max(_thIS.x, _thIS.y, _thIS.z) * T.s, 1e-9); }
  return null;
}
/* The cut-open view of a thing, for a double click on one of its parts or its card's "Look inside": when the thing has a cut or sample mode near the
   part and no cut is showing yet, the mode whose cut passes nearest the point clicked (the dog's eye opens "Inside the eye", its chest "Inside the
   heart" or "Cut in half"; the oak's trunk the wood sample). Returns 'cut', or false when there is none to open (the next level down is then the
   part's own closer view: thGoDeeper, called by the engine). peek: only say whether there is one. */
function thCutOpen(F, h, peek) {
  const T = F.T; if (!T || !h.pointLocal) return false;
  const ud = h.obj.userData, rec = T.parts[ud.id], pd = rec && rec.pd; if (ud.hotspot) return false;
  const cur = T.modeId === 'auto' ? null : T.modeDef(T.modeId); if (cur && (cur.cut || cur.pivot)) return false;
  const p = h.pointLocal.clone().applyMatrix4(_thIM.copy(T.group.matrix).invert()), R = T.def.radius_m || 1, reach = Math.max((pd && pd.radius) || 0, R * .35);
  let best = null, bd = reach;
  for (const m of T.def.modes) {
    if (!m.cut && !m.pivot) continue;
    const at = m.cut ? (m.cut.at || (T.def.cut && T.def.cut.at)) : ((T.def.pivots || {})[m.pivot] || {}).at; if (!at) continue;
    const dd = at.length === 2 ? Math.hypot(at[0] - p.x, at[1] - p.z) : Math.hypot(at[0] - p.x, at[1] - p.y, at[2] - p.z);
    if (dd < bd - 1e-9) { bd = dd; best = m; }
  }
  if (!best) return false;
  if (!peek) {
    T.setMode(best.id); thUpdateControls(F); toast(`${best.label}: a cut-open view. Double-click a part again to go further in.`);
    if (!thModeView(F, best) && cam.A !== F && R * T.k < cam.D * .22) { const c = thLocalToFrame(T.def, T.pl, [0, (T.def.height_m || 0) / 2, 0]); flyKeep(F, c, R * T.k * 2.6, () => { if (F.T) F.T.faceCut(); }); camHold = F; }   // a small thing seen from afar (the cell in the opened phone): come up to it
  }
  return 'cut';
}
/* the card's "See what it is made of" button: a part's or a marker's own `deeper`; (a frame's cardMadeOf: see CARD_HOOKS in nodes.js) */
function thCardMadeOf(F, h, n) {
  const ud = h && h.obj && h.obj.userData; if (!ud || !F.T) return undefined;
  const d = ud.hotspot ? ud.hotspot.deeper : (F.T.parts[ud.id] || {}).pd && F.T.parts[ud.id].pd.deeper; if (!d) return undefined;
  return { label: d.button || 'See what it is made of', go: () => thGoDeeper(F, h, d) };
}
CARD_HOOKS.push((id, h, n) => {   // a structure in a tissue scene: the scene's own tag in front of the card's kind line ("Inside a leaf · Cell, about 20 µm across")
  const ud = h && h.obj && h.obj.userData; if (!ud || ud.thing !== 'tissue2' || !ud.info || !ud.info.tag) return;
  const tg = infoEl.querySelector('.tag'); if (tg && !tg.dataset.scene) { tg.dataset.scene = '1'; tg.textContent = ud.info.tag + (tg.textContent ? ' · ' + tg.textContent : ''); }
});
CARD_HOOKS.push((id, h, n) => {   // the zoom floor reached on this part: say so on its card
  const F = h && h.frame; if (!F || !F.floorNode || F.floorNode !== id || infoEl.querySelector('.thFloor')) return;
  const d = document.createElement('div'); d.className = 'note thFloor'; d.textContent = 'No closer view has been built for this part yet: the model stops here.';
  const tg = infoEl.querySelector('.tag'); if (tg) tg.insertAdjacentElement('beforebegin', d);
});
CARD_HOOKS.push((id, h, n) => {   // the honest "model, not a scan" note on top of every card of a thing
  const F = h && h.frame, def = (F && F.T && F.T.def) || (!h && (thFindNode(id) || {}).def); if (!def || infoEl.querySelector('.thNote')) return;
  const note = document.createElement('div'); note.className = 'note thNote'; note.textContent = def.model_note || '';
  if (note.textContent) infoEl.querySelector('.tag') && infoEl.querySelector('.tag').insertAdjacentElement('beforebegin', note);
});

/* "Show me where it is": goToNode() flies to the first placed thing that has a part or marker with this card, shows what is in front of it out of the way,
   highlights it, centres it and opens its card */
/* One representative instance of an instanced part (a leaf, an acorn, a petal, a stamen, a hair), chosen the same way every time: among the instances this
   placement keeps, those within reach (on a tall thing the lowest third by height; on a small one all), then the one farthest from the thing's axis (the
   outermost, so nothing stands in front of it). Returns {p: thing-local centre, size: its radius in thing units} or null when the bundle has not arrived. */
const _thRepCache = {};
function thRepInstance(def, pl, pd) {
  const b = TH.done && TH.done[def.id]; if (!b || !pd.instances) return null;
  const x = thPlacement(def, pl), ck = def.id + ':' + pd.id + ':' + (pl.seed ?? 'x') + ':' + (pl.scale || 1); if (_thRepCache[ck]) return _thRepCache[ck];
  const inst = thInst(b, pd.instances); if (!inst || !inst.n) return null; const t = inst.t, st = inst.stride;
  let ids = []; const vg = (def.variation && def.variation.groups || []).find(g => g.members && g.members[pd.instances]);
  if (vg && x.keep && x.keep[vg.id]) { const per = vg.members[pd.instances], set = x.keep[vg.id]; for (let i = 0; i < inst.n; i++) if (set.has(Math.floor(i / per))) ids.push(i); } else for (let i = 0; i < inst.n; i++) ids.push(i);
  if (!ids.length) return null;
  let y0 = 1e9, y1 = -1e9, cx = 0, cz = 0; for (const i of ids) { const y = t[i * st + 1]; y0 = Math.min(y0, y); y1 = Math.max(y1, y); cx += t[i * st]; cz += t[i * st + 2]; } cx /= ids.length; cz /= ids.length;
  const tall = (def.height_m || def.radius_m || 1) > 2, lim = tall ? y0 + (y1 - y0) * .34 : 1e9;
  let best = -1, bs = -1; for (const i of ids) { if (t[i * st + 1] > lim) continue; const s = Math.hypot(t[i * st] - cx, t[i * st + 2] - cz); if (s > bs + 1e-9) { bs = s; best = i; } }
  if (best < 0) best = ids[0];
  const q = (def.height_m || def.radius_m || 1), geo = thGeo(def.id, b, inst.mesh), br = geo && geo.boundingSphere ? geo.boundingSphere.radius : .02, sc = st === 8 ? t[best * st + 7] : Math.max(t[best * st + 7], t[best * st + 8], t[best * st + 9]);
  return _thRepCache[ck] = { p: [t[best * st], t[best * st + 1], t[best * st + 2]], size: Math.max(br * sc, 1e-4), i: best };
}
/* The nearest a flight to a part goes: `part.fly_m` (metres) if it says, else 0.4 m for a hand-sized thing (scaled down with the thing, `u`), but never more than 4 radii of a small part itself:
   a 2.5 mm water flea or a 9 mm pond skater is brought properly into view, not left a speck at 0.4 m. */
function thMinFly(part, k, u) { if (!part) return .4 * u; if (part.fly_m !== undefined) return part.fly_m * k; return part.radius ? Math.min(.4 * u, Math.max(part.radius * k * 4, 1e-3)) : .4 * u; }
/* a flow part (sap in the xylem) has no mesh and its stored centre is a stand-in: its true centre is the middle of the box that holds its paths */
function thFlowCentre(def, part) {
  const b = TH.done && TH.done[def.id], fl = b && b.flows && b.flows[part.flow]; if (!fl) return null;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const P of fl.paths) for (let i = 0; i < P.p.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P.p[i + a]); hi[a] = Math.max(hi[a], P.p[i + a]); }
  return { c: [0, 1, 2].map(a => (lo[a] + hi[a]) / 2), r: Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 };
}
/* The vertex of a part's mesh nearest to its stored centre. A thin or curved part (a muscle sheet, a bone shaft) has a centre in the air or inside a neighbour; the flight aims at a point that is on the part
   itself when the centre is more than a fifth of the part's radius from it. Cached per part. */
const _thSurf = {};
function thSurfacePoint(def, part) {
  const b = TH.done && TH.done[def.id]; if (!b || !part.mesh || !part.center) return null;
  const ck = def.id + ':' + part.id; if (ck in _thSurf) return _thSurf[ck];
  const g = thGeo(def.id, b, part.mesh), pos = g && g.attributes.position; if (!pos) return _thSurf[ck] = null;
  const c = part.center; let bd = 1e18, bi = -1; for (let i = 0; i < pos.count; i++) { const dx = pos.getX(i) - c[0], dy = pos.getY(i) - c[1], dz = pos.getZ(i) - c[2], d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bi = i; } }
  if (!(bi >= 0 && Math.sqrt(bd) > .2 * (part.radius || 0))) return _thSurf[ck] = null;
  /* A mesh of a few large flat faces (a box, a pouch) has its corners far from the middle of its faces: there the nearest point of the surface itself is used,
     not the nearest corner (which would aim the flight at an edge of the part). Only for small meshes; a dense organic mesh keeps its nearest vertex. */
  const ix = g.index; let out = [pos.getX(bi), pos.getY(bi), pos.getZ(bi)];
  if (ix && ix.count <= 6000) {
    const P = new V3(c[0], c[1], c[2]), tri = new THREE.Triangle(), q = new V3(); let b2 = Infinity;
    for (let t = 0; t < ix.count; t += 3) { tri.a.fromBufferAttribute(pos, ix.getX(t)); tri.b.fromBufferAttribute(pos, ix.getX(t + 1)); tri.c.fromBufferAttribute(pos, ix.getX(t + 2)); tri.closestPointToPoint(P, q); const d = q.distanceToSquared(P); if (d < b2 - 1e-18) { b2 = d; out = [q.x, q.y, q.z]; } }
  }
  return _thSurf[ck] = out;
}
/* The separate pieces of a part's mesh (several small bones or petals baked into one mesh): connected sets of triangles, found once per mesh by joining
   triangles that share a corner (corners at the same place count as one); pieces whose bounds overlap are one piece (a ring of touching scales).
   Returns [{c: [x, y, z], r}] with the largest first, or null (no bundle yet, or too large a mesh to be worth it). */
const _thPieces = {};
function thPieces(def, part) {
  const b = TH.done && TH.done[def.id]; if (!b || !part.mesh) return null;
  const ck = def.id + ':' + part.mesh; if (ck in _thPieces) return _thPieces[ck];
  const g = thGeo(def.id, b, part.mesh), pos = g && g.attributes.position, idx = g && g.index; if (!pos || !idx || pos.count > 150000) return _thPieces[ck] = null;
  const n = pos.count, par = new Int32Array(n), A = pos.array, I = idx.array; for (let i = 0; i < n; i++) par[i] = i;
  const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, join = (a, b) => { a = find(a); b = find(b); if (a !== b) par[b] = a; };
  const seen = new Map(), q = 1 / Math.max(1e-12, (part.radius || 1) * 2e-5);
  for (let i = 0; i < n; i++) { const k = Math.round(A[i * 3] * q) + ',' + Math.round(A[i * 3 + 1] * q) + ',' + Math.round(A[i * 3 + 2] * q), j = seen.get(k); if (j === undefined) seen.set(k, i); else join(j, i); }
  for (let t = 0; t < I.length; t += 3) { join(I[t], I[t + 1]); join(I[t], I[t + 2]); }
  const comp = new Map();
  for (let i = 0; i < n; i++) { const r = find(i); let c = comp.get(r); if (!c) comp.set(r, c = { lo: [1e30, 1e30, 1e30], hi: [-1e30, -1e30, -1e30] }); for (let a = 0; a < 3; a++) { const v = A[i * 3 + a]; if (v < c.lo[a]) c.lo[a] = v; if (v > c.hi[a]) c.hi[a] = v; } }
  let P = [...comp.values()]; const ball = c => { c.c = [0, 1, 2].map(a => (c.lo[a] + c.hi[a]) / 2); c.r = Math.hypot(c.hi[0] - c.lo[0], c.hi[1] - c.lo[1], c.hi[2] - c.lo[2]) / 2; return c; }; P.forEach(ball);
  if (P.length > 1 && P.length <= 1500) {   // overlapping pieces are one
    const pp = P.map((_, i) => i), f2 = i => { while (pp[i] !== i) { pp[i] = pp[pp[i]]; i = pp[i]; } return i; };
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], c = P[j]; if (Math.hypot(a.c[0] - c.c[0], a.c[1] - c.c[1], a.c[2] - c.c[2]) < .6 * (a.r + c.r)) { const x = f2(i), y = f2(j); if (x !== y) pp[y] = x; } }
    const M = new Map(); P.forEach((c, i) => { const r = f2(i), m = M.get(r); if (!m) M.set(r, { lo: c.lo.slice(), hi: c.hi.slice() }); else for (let a = 0; a < 3; a++) { m.lo[a] = Math.min(m.lo[a], c.lo[a]); m.hi[a] = Math.max(m.hi[a], c.hi[a]); } });
    P = [...M.values()].map(ball);
  }
  return _thPieces[ck] = P.map(c => ({ c: c.c, r: c.r })).sort((a, b) => b.r - a.r);
}
/* One representative piece of a part that is made of several separate small pieces, chosen as a representative instance is (thRepInstance): within reach,
   then the outermost. null when the part is one piece, or its largest piece is most of it. */
function thRepPiece(def, part) {
  const P = thPieces(def, part); if (!P || P.length < 2 || !(part.radius > 0) || P[0].r > .45 * part.radius) return null;
  const big = P.filter(p => p.r >= .3 * P[0].r); if (big.length < 2) return null;
  let y0 = 1e30, y1 = -1e30, cx = 0, cz = 0; for (const p of big) { y0 = Math.min(y0, p.c[1]); y1 = Math.max(y1, p.c[1]); cx += p.c[0]; cz += p.c[2]; } cx /= big.length; cz /= big.length;
  const tall = (def.height_m || def.radius_m || 1) > 2, lim = tall ? y0 + (y1 - y0) * .34 : 1e30;
  let best = null, bs = -1; for (const p of big) { if (p.c[1] > lim) continue; const s = Math.hypot(p.c[0] - cx, p.c[2] - cz); if (s > bs + 1e-12) { bs = s; best = p; } }
  best = best || big[0]; return { p: best.c, size: best.r };
}
/* where a flight to one of a crowd ends: about six sizes of the one instance or piece away, no nearer than a flight to a part of that size would go, and never further than half the thing */
function thOneD(def, x, part, size) { const u = thUnit(def, x.k); return Math.min(Math.max(size * x.k * 6, thMinFly({ radius: size, fly_m: part.fly_m }, x.k, u)), (def.radius_m || 1) * x.k * .5); }
function thFindNode(id0) {
  for (const f of FR.things || []) {
    const def = TH.loaded[f.opts.thing]; if (!def) continue; const pl = f.opts.placement || {}, x = thPlacement(def, pl);
    const id = (def.answers || []).includes(id0) ? def.node : id0;   // `answers`: other cards this thing is the model of (the phone's short battery card): going to one of them leads to the thing, with its own card
    const hit = def.parts.find(p => p.node === id && p.lod !== 'far') || def.parts.find(p => p.node === id), hs = (def.hotspots || []).find(h => h.node === id);
    const fc = hit && hit.flow ? thFlowCentre(def, hit) : null;
    const pcs = hit && !fc && hit.mesh && hit.lod !== 'far' ? thRepPiece(def, hit) : null;   // a part made of several separate small pieces: one of them
    const sp = hit && !fc && !pcs && !hit.instances && (hit.radius || 0) * x.k > .03 ? thSurfacePoint(def, hit) : null;   // only for parts of a hand's size or more: a tiny part's centre is on it
    const at = fc ? fc.c : pcs ? pcs.p : sp ? sp : hit ? hit.center : hs ? hs.at : id === def.node ? (def.parts.find(p => p.id === def.main_part) || {}).center : null;
    if (!at) continue;
    const u = thUnit(def, x.k), rep = hit && hit.instances && hit.lod !== 'far' ? thRepInstance(def, pl, hit) : null, p = thLocalToFrame(def, pl, rep ? rep.p : at);
    const D = rep ? thOneD(def, x, hit, rep.size) : pcs ? thOneD(def, x, hit, pcs.size) : Math.max((fc ? fc.r : (hit && hit.radius) || (def.radius_m || 1) * .5) * x.k * 3.2, thMinFly(hit, x.k, u));
    return { id, f, p, pc: hit && !hit.instances && !pcs ? thLocalToFrame(def, pl, hit.center) : null, D, part: hit || null, hs: hs && !hit ? hs : null, def, pl, inst: !!(hit && hit.instances && hit.lod !== 'far'), rep, piece: pcs, one: !!(rep || pcs) };
  }
  return null;
}
function thModeFor(T, pd) {   // a layered part is revealed in place; otherwise keep the current mode if it shows the part, else the first mode that does
  const sys = pd.system, shows = m => m && ((m.show || {})[sys] ?? (m.show || {})['*'] ?? 0) >= .5 && (!pd.parent || m.cut);
  if (T.rank[sys] !== undefined && !pd.parent) return null;
  if (shows(T.modeId === 'auto' ? null : T.modeDef(T.modeId))) return null;
  const m = T.def.modes.find(shows); return m ? m.id : null;
}
/* A part can be hidden by another thing standing in front of it (the bee sits on the buttercup: its petals block the view of a leg from one side). Once the flight
   has landed, if what is at the target's pixel belongs to another frame, look from another side (same distance, a few directions: current heading first, then the
   others round the target, higher first) until the target is in the clear. One pick per direction, once per jump. */
function thClearView(F, id, own, pc) {
  if (cam.A !== F || !F.C || fly) return true;
  if (own && F.T && (F.T.cutActive || (F.T.curMode && F.T.curMode.pivot))) own = false;   // in a cut or pivoted view what is in front is the cut's business
  const P = new V3().copy(cam.T), d0 = cam.dir.clone(), up = F.up || new V3(0, 1, 0), at1 = P => { const v = P.clone().sub(F.C).project(F.cam); return pickAt((v.x + 1) / 2 * W, (1 - v.y) / 2 * H); };
  const blockedH = h => !!(h && h.frame && h.meters < cam.D * .97 && (h.frame !== F || (own && h.obj.userData.node !== id && !h.obj.userData.resolve && (h.obj.userData.shown || 0) >= .35)));   // something nearer than the target: another frame's, or (a second look, once the layers have settled) a solid part of this thing's own that is not it
  const blocked = () => { for (const f of drawn) placeFrameCam(f); return blockedH(at1(P)) || (pc && blockedH(at1(pc))); };   // the aim point and (for a part) its centre must both be in the clear
  const turned = () => { const T = F.T; if (T && (T.cutActive || (T.curMode && T.curMode.pivot))) T.faceCut(); };   // a cut or pivoted view faces the camera: aim it again after the camera has moved
  if (!blocked()) return true;
  const az0 = Math.atan2(d0.z, d0.x);
  for (const el of [.45, .9, .1, -.3, -.7, -.95]) for (let k = 0; k < 8; k++) {
    const az = az0 + k * Math.PI / 4;
    if (F.opts.ground && P.y + el * cam.D / F.unit < -F.pos.y + .1 * cam.D / F.unit) continue;   // never from beneath the ground
    cam.dir.set(Math.cos(az) * Math.sqrt(Math.max(0, 1 - el * el)), el, Math.sin(az) * Math.sqrt(Math.max(0, 1 - el * el)));
    setCamDir(cam.dir, up); if (!blocked()) { turned(); return true; }
  }
  setCamDir(d0, up); return false;
}
/* A thing that stands on a ground is never looked at from beneath it. dir: the direction from the target to the camera (frame coordinates, unit length), p: the
   target, D: the viewing distance in metres. If the camera would end up under the ground plane (a root, a worm, a soil layer: the target itself is below it),
   the view is lifted until the camera is a little above the ground, first by standing further back (up to three times), then by looking more steeply down.
   Returns the distance to use; dir is changed in place. */
function thAboveGround(F, p, D, dir) {
  if (!F.opts.ground) return D;
  const gy = -F.pos.y, need = () => (gy - p.y) / (D / F.unit) + .14;   // the least dir.y that keeps the camera above the ground, with a margin of a seventh of the distance
  if (dir.y >= need()) return D;
  const D0 = D; if (need() > .6) D = Math.min(D0 * 3, Math.max(D0, (gy - p.y) * F.unit / (.6 - .14)));
  const y = Math.min(.94, need()), h = Math.hypot(dir.x, dir.z), k = Math.sqrt(1 - y * y);
  if (h < 1e-6) dir.set(0, y, k); else dir.set(dir.x / h * k, y, dir.z / h * k);
  return D;
}
function thFlyToNode(id, t) {
  const F = t.f; showBodyNode(id, null); F.selNode = id; F.ensure();
  const R = (t.def.radius_m || 1) * thPlacement(t.def, t.pl).s, d = new V3(t.p.x, 0, t.p.z), up = F.up ? F.up.clone() : null;
  const look = dv => { const d2 = dv.clone(); convertD(d2, F, cam.A); cam.dir.copy(d2); if (up) { const u = up.clone(); convertD(u, F, cam.A); cam.up.copy(u); } else orthoUp(); };
  if (F.opts.view) look(new V3(...F.opts.view).normalize());   // a thing that lies in a device is looked at from the side that is open (the phone: from the screen side)
  else if (d.length() > R * .06) { d.y = d.length() * .12; d.normalize(); look(d); }   // look at it from the side it is on
  if (F.opts.ground) { const dv = cam.dir.clone(); convertD(dv, cam.A, F); dv.normalize(); const y0 = dv.y; t.D = thAboveGround(F, t.p, t.D, dv); if (dv.y !== y0) look(dv); }   // never from beneath the ground
  F.spawnHold = t.D;
  flyTo(F, t.p, t.D, () => { if (F.T && (F.T.cutActive || (F.T.curMode && F.T.curMode.pivot))) F.T.faceCut(); /* the cut was aimed when the flight began, from far away: aim it again from where the camera has landed */ const t0 = performance.now(), tries = [350, 1100, 2000, 3200, 4500]; let k = 0; const again = () => { if (cam.A !== F || fly || lastInput > t0 + 200 || !(infoState && infoState.node === id)) return; thClearView(F, id, k >= 1); if (++k < tries.length) setTimeout(again, tries[k] - tries[k - 1]); }; /* every time: the picking trees of a crowd are built in idle time, so an early look can miss what is in front */ setTimeout(again, tries[0]); }); camHold = F;
  F.ready.then(() => {
    const T = F.T; if (!T) return;
    if (t.part && !t.one && fly && fly.frame === F) {   // the meshes had not arrived when the flight began: now one instance, or one piece, can be chosen
      const x = thPlacement(t.def, t.pl), r = t.inst ? thRepInstance(t.def, t.pl, t.part) : t.part.mesh && t.part.lod !== 'far' ? thRepPiece(t.def, t.part) : null;
      if (r) { fly.p.copy(thLocalToFrame(t.def, t.pl, r.p)); fly.Dg = thOneD(t.def, x, t.part, r.size); t.p = fly.p.clone(); t.one = true; if (F.opts.ground) { const dv = cam.dir.clone(); convertD(dv, cam.A, F); dv.normalize(); const y0 = dv.y; fly.Dg = thAboveGround(F, fly.p, fly.Dg, dv); if (dv.y !== y0) look(dv); } F.spawnHold = fly.Dg; }
    }
    if (t.part) {
      const mid = thModeFor(T, t.part); if (mid) { T.setMode(mid); thUpdateControls(F); } F.sel = t.part.id; if (T.parts[t.part.id] && T.parts[t.part.id].rank !== undefined) F.reveal = { id: t.part.id };
      // a part below the ground, shown in a view that is cut along a fixed plane: stand in front of the cut face (on the side the camera is nearer to), above the ground
      const md = T.modeId === 'auto' ? null : T.modeDef(T.modeId), cn = md && md.cut && md.cut.normal;
      if (cn && F.opts.ground && fly && fly.frame === F && fly.p.y < -F.pos.y) {
        const n = new V3(cn[0], 0, cn[2]).applyQuaternion(T.xf.q); n.y = 0;
        if (n.lengthSq() > 1e-6) {
          n.normalize(); const at = thLocalToFrame(t.def, t.pl, md.cut.at || (t.def.cut && t.def.cut.at) || [0, 0, 0]), side = n.dot(fly.p.clone().sub(at)), dv = cam.dir.clone(); convertD(dv, cam.A, F);
          if (Math.abs(side) > 1e-6 * F.radius ? side > 0 : n.dot(dv) < 0) n.negate();   // the half beyond the plane is the one that is kept: stand on the side from which the part lies beyond it (a part on the plane: the side the camera is nearer to)
          fly.Dg = thAboveGround(F, fly.p, fly.Dg, n); look(n); F.spawnHold = fly.Dg;
        }
      }
      const mv = (md || T.curMode || {}).view; if (mv && mv.dir && t.part.parent) look(new V3(...mv.dir).applyQuaternion(T.xf.q).normalize());   // a detail of a cut view: from where the view shows its face
    }
    else if (t.hs) {
      const mid = (t.hs.modes || [])[0]; if (mid && T.modeDef(mid) && T.modeId !== mid) { T.setMode(mid); thUpdateControls(F); }
      const mv = mid && T.modeDef(mid) && T.modeDef(mid).view; if (mv && mv.dir) look(new V3(...mv.dir).applyQuaternion(T.xf.q).normalize());
      if (!mid) {   // a marker that is never drawn (a card about a tissue scene inside the thing): peel what is in front of the nearest part that lies below the surface layer
        const a = new V3(...t.hs.at); let best = null, bd = 1e9;
        for (const rec of T.list) { if (rec.rank === undefined || !(rec.rank > 0) || rec.pd.parent || rec.instanced || !rec.pd.center) continue; const d = a.distanceTo(new V3(...rec.pd.center)) - (rec.pd.radius || 0); if (d < bd) { bd = d; best = rec; } }
        if (best) F.reveal = { id: best.pd.id };
      }
    }
  });
}
/* A view (a layer mode) may say where it is best seen from: mode.view = { dir: [x, y, z] (from the thing toward the camera, thing coordinates), at: [x, y, z], D: metres }.
   Choosing the view (its button, a double click that opens it) turns the camera there: a cut along a fixed plane is seen face on, not edge on. */
function thModeView(F, md) {
  const T = F.T, v = md && md.view; if (!T || !v || !(frameWithin(cam.A, F) || drawn.includes(F))) return false;
  const at = thLocalToFrame(T.def, T.pl, v.at || (md.cut && md.cut.at) || [0, (T.def.height_m || 0) / 2, 0]), dv = new V3(...(v.dir || [0, 0, 1])).applyQuaternion(T.xf.q).normalize();
  let D = (v.D || (T.def.radius_m || 1) * 2.4) * T.k; D = thAboveGround(F, at, D, dv);
  convertD(dv, F, cam.A); cam.dir.copy(dv); if (F.up) { const u = F.up.clone(); convertD(u, F, cam.A); cam.up.copy(u); } else orthoUp();
  flyKeep(F, at, D, () => { if (F.T) F.T.faceCut(); }); camHold = F; F.spawnHold = D; return true;
}
GOTO_HOOKS.push(id => { const t = thFindNode(id); if (!t) return false; thFlyToNode(t.id, t); return true; });

/* ---------- placing things: in the park, and anywhere else ----------
   A placement (data/things/index.json) says where one copy of a thing stands. `in` names the place; without it the thing stands in the park.

     in            where                                                  the placement's other fields
     (none) park   the park's lawn                                        at [x, z] metres, y, or on {thing, placement, at}
     phone         the phone in the hand (js/teardown.js)                 part: a teardown part id (the thing takes that part's place), or at [x, y, z] in mm
     body          the standing human                                     at [x, y, z] metres in the body's own coordinates (feet at the origin)
     organ:<id>    the cut-open view of an organ                          at [x, y, z] metres from the organ's centre
     earth         a spot on the Earth's surface                          lat, lon (degrees), place (its name), biome, at [x, z] metres from the spot
     orbit         a circular orbit round the Earth                       alt_km, incl_deg, period_min, phase_deg
     floating      nowhere: alone on a neutral ground with a scale bar    (nothing)
     <FR key>      any fixed frame (skin, cell, region ...)               at [x, y, z] in that frame's own units; light, merge, ground
   and for all of them: rot (degrees about the vertical), tilt [rx, ry, rz], scale, seed.

   THE RULE. A thing is drawn at its true size in a frame of its own that takes the UNIT of the frame it stands in (its host: 1 m in the park, 1 mm in the
   phone, 1000 km round the Earth) and is CO-RENDERED with it: drawn whenever the host is drawn, in the same depth buffer, picked together with it
   (nearest surface wins), and, where it has the host's axes and can live with the host's lights, inside the host's scene (one render call). The model
   itself stays in metres; the group that holds it is scaled by 1 / unit. So everything a park thing can do works unchanged: detail tiers, layers and
   Auto, cut views, markers, picking and hover names, click and double click, goToNode and search flights, the core sample, tissue scenes and the
   descent to atoms, neighbours fading out of a close-up.
   HAND-OVER. Where the host already draws a plain stand-in for the thing (the phone's battery block), the resolver names it as the frame's `proxy`: the
   engine hides it while the thing is shown, and the thing's far detail tier is what is seen from a distance.
   FAR AWAY. A thing outside the park that has not been drawn for a while is disposed (its meshes and materials are freed) and built again on return.

   A resolver is TH_HOSTS.<name>(pl, def, R, arg) -> { host: Frame, pos: V3 (host units, the thing's base point), quat?, up?, env: 'park' | 'sun' | 'studio',
   ground?, merge?, coMax?, r1?, note?, view?, place?(f), onBuilt?(f), keep? } or null. R is the thing's radius in metres; `arg` is what follows the colon. */
const TH_HOSTS = {};
const thAt3 = (a, d) => new V3(...(a && a.length === 3 ? a : d || [0, 0, 0]));
TH_HOSTS.park = (pl, def, R) => ({ host: FR.park, pos: new V3(pl.at[0], pl.y || 0, pl.at[1]), up: new V3(0, 1, 0), env: 'park', ground: true, merge: true, coMax: def.draw_m || 400, r1: Math.max(R * 12, 8), keep: true });
/* any fixed frame, by its key in FR: `at` in the host's own units */
TH_HOSTS.frame = (pl, def, R, key) => { const host = FR[key]; return host ? { host, pos: thAt3(pl.at), up: host.up ? host.up.clone() : null, env: pl.light || 'studio', merge: !!pl.merge, ground: !!pl.ground } : null; };
TH_HOSTS.body = (pl, def, R) => FR.body ? { host: FR.body, pos: thAt3(pl.at), up: new V3(0, 1, 0), env: 'studio', merge: false, ground: false } : null;
TH_HOSTS.organ = (pl, def, R, arg) => { const host = FR.body && FR.body.children.find(c => c.type === 'organ' && c.opts && c.opts.organ === arg); return host ? { host, pos: thAt3(pl.at), up: null, env: 'studio', merge: false, ground: false } : null; };
/* In the phone, taking the place of one of its parts (the battery block): the thing's middle sits on the part's middle and follows it as the phone opens up;
   the part itself is the stand-in the engine hides while the thing is shown. The model is written in the phone's own axes (y along the long edge, z out of the screen). */
TH_HOSTS.phone = (pl, def, R) => {
  const host = FR.phone; if (!host) return null;
  const half = (def.height_m || 0) / 2 * (pl.scale || 1) / host.unit, P = typeof PHONE_PARTS !== 'undefined' && pl.part ? PHONE_PARTS.find(p => p[0] === pl.part) : null;
  const pos = thAt3(pl.at, P ? P[2] : null); pos.y -= half;
  const part = () => host.built && pl.part ? host.pickables.find(o => o.userData && o.userData.id === pl.part) || null : null;
  return {
    host, pos, up: null, env: 'studio', merge: true, ground: false, view: [.32, .3, 1],
    /* The cell fills half the phone, so a sphere about its base point would hold the phone's own centre and the plain view of the phone would count as a view
       of the cell. Its frame is therefore the ball about its middle (def.bound_m), and it is entered only from close by (2.6 sizes), where it fills the view. */
    center: new V3(0, half, 0), radius: (def.bound_m || R) * (pl.scale || 1) / host.unit * 1.1, r1: (def.bound_m || R) * (pl.scale || 1) * 5,
    labelAt: [0, (def.height_m || 0) * .5, (def.size_m && def.size_m.thickness || 0) * .5],
    place: f => { const g = part(); if (!g) return; f.pos.copy(g.position); f.pos.y -= half; if (f.T && f.proxy !== g) f.proxy = g; },
    labelIf: f => (host.exK || 0) > .5 && cam.A !== f   // its name shows when the phone is opened up, like the names of the phone's own parts (and not once the camera is in it)
  };
};
/* A spot on the Earth's surface: a 40 km map tile at the latitude and longitude and a landscape of the biome there, both fixed, like Greenwich and its park.
   Things placed at the same `place` (or the same latitude and longitude) share them. */
TH_HOSTS.earth = (pl, def, R) => {
  const E = FR.earth; if (!E || typeof regionFrame !== 'function' || typeof landscapeFrame !== 'function' || pl.lat === undefined || pl.lon === undefined) return null;
  const key = pl.place || (pl.lat.toFixed(3) + ',' + pl.lon.toFixed(3)); TH.places = TH.places || {};
  let L = TH.places[key];
  if (!L) {
    const biome = pl.biome || 'grass', reg = E.addChild(regionFrame(E, pl.lat, pl.lon, biome, false)); reg.pinned = true;
    L = reg.addChild(landscapeFrame(biome, new V3(), null, 'Earth')); L.pinned = true; if (pl.place) { reg.name = pl.place + ' (map)'; L.name = pl.place; }
    TH.places[key] = L; L.region = reg;
  }
  const a = pl.at || [0, 0];
  return { host: L, pos: new V3(a[0], pl.y || 0, a[1]), up: new V3(0, 1, 0), env: 'sun', ground: true, merge: true, coMax: def.draw_m || 400, r1: Math.max(R * 12, 8) };
};
/* A circular orbit round the Earth, drawn in the Earth's frame the way the ISS marker is: the period comes from the data (a sourced figure), not from a formula here. */
TH_HOSTS.orbit = (pl, def, R) => {
  const host = FR.earth; if (!host || !pl.period_min) return null;
  const r = (6371 + (pl.alt_km || 0)) * 1e3 / host.unit, T = pl.period_min * 60000, inc = (pl.incl_deg || 0) * Math.PI / 180, ph = (pl.phase_deg || 0) * Math.PI / 180, ax = new V3(1, 0, 0);
  const at = out => { const a = (simTime / T) % 1 * Math.PI * 2 + ph; return out.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyAxisAngle(ax, inc); };
  return { host, pos: at(new V3()), up: null, env: 'sun', merge: false, ground: false, coMax: def.draw_m || R * 4000, r1: Math.max(R * 40, 50), place: f => { at(f.pos); if (!fly && camHold === f && cam.A === host) cam.T.copy(f.pos); /* it moves several kilometres between two frames: a flight that has just ended at it is held on it until the camera is inside its frame, which then carries the camera along */ }, note: 'Its place on the orbit is illustrative: the orbit has the right height, tilt and period, but not the real position for this moment.' };
};
/* Nowhere: a thing with no home in the world model yet stands alone on a neutral ground with a scale bar (FT.thstage). Reached by search or a link only. */
TH_HOSTS.floating = (pl, def, R) => {
  const unit = Math.pow(10, Math.floor(Math.log10(Math.max(R, 1e-12))));   // a round unit near the thing's own size, so a virus and a turbine both get sound numbers
  const stage = FR.root.addChild(new Frame({ type: 'thstage', name: 'Shown out of context', unit, radius: R / unit * 9, r0: 0, r1: 4e24, up: new V3(0, 1, 0), maxPolar: Math.PI / 2 - .03, opts: { R: R / unit, title: def.title } }));
  stage.pinned = true; stage.enterOnly = true; stage.floorD = R * .02; stage.ceilD = R * 60;
  return { host: stage, pos: new V3(), up: new V3(0, 1, 0), env: 'studio', merge: true, ground: true, r1: R * 30, coMax: R * 4000, note: `Shown out of context: ${(def.title || 'this').toLowerCase()} has no place in the world model yet, so it stands alone on a neutral ground. It is drawn at its true size: the bar on the ground gives the scale.` };
};
/* the bar of a neutral stage: the round length (1, 2 or 5 times a power of ten) nearest the thing's width */
function thNiceLen(m) { const e = Math.pow(10, Math.floor(Math.log10(m))), f = m / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; }
FT.thstage = {
  build(F, o) {
    F.illo = true; F.device = true; F.env = { bg: 0xf1ede4, opaque: true };
    F.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, .6)); const d = new THREE.DirectionalLight(0xffffff, .8); d.position.set(1, 2, 3); F.add(d);
    const R = o.R, gr = new THREE.Mesh(new THREE.CircleGeometry(R * 7, 72).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe6e0d3 })); gr.position.y = -R * .004; gr.matrixAutoUpdate = false; gr.updateMatrix(); F.add(gr);
    gr.userData = { id: 'th_stage', priority: 0, noZoom: true, info: { title: 'A neutral ground', tag: 'Not a place', body: `<p>${o.title || 'This thing'} has no place in the world model yet (no room, street or workshop has been built for it), so it is shown here alone. The ground and the bar are not part of it. Its size is true.</p>` } }; F.pickables.push(gr);
    // the scale bar: alternating dark and light fifths, lying on the ground in front of the thing
    const L = thNiceLen(R * 1.6 * F.unit) / F.unit, bar = new THREE.Group(), seg = L / 5, h = R * .012;
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(seg, h, R * .05), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xf7f4ec : 0x2b2f38 })); m.position.set(-L / 2 + seg * (i + .5), h / 2, 0); m.matrixAutoUpdate = false; m.updateMatrix(); bar.add(m); }
    bar.position.set(0, 0, R * 1.9); F.add(bar);
    bar.userData = { id: 'th_scalebar', priority: 1, noZoom: true, info: { title: 'Scale bar: ' + fmtLen(L * F.unit), tag: 'Not part of the thing', body: `<p>The bar is ${fmtLen(L * F.unit)} long, in five equal parts. The thing behind it is drawn at its true size.</p>` } }; F.pickables.push(bar);
    const lo = new THREE.Object3D(); lo.position.set(0, h * 4, R * 1.9); F.add(lo); F.label(lo, fmtLen(L * F.unit), { cls: 'thName', pick: bar, always: true });
    F.blurb = `${o.title || 'This thing'}, shown on its own.`;
    F.note = `Out of context: it has no place in the world model yet, so it stands alone on a neutral ground. Its size is true: the bar is ${fmtLen(L * F.unit)} long.`;
    let said = 0;
    F.update = () => {   // there is no wider picture to zoom out into: the view stops a little way out
      if (cam.D <= F.ceilD || !frameWithin(cam.A, F) || fly) return;
      cam.D = F.ceilD; if (zoom.pending > 0) zoom.pending = 0;
      const now = performance.now(); if (now - said > 15000) { said = now; message('This thing is shown out of context: there is no wider view of where it belongs. Search, the ruler or Back lead elsewhere.'); }
    };
  }
};
/* One placement -> one frame. Also usable from the console, to try a place before writing it into the index:
   thLoadDef('boulder').then(d => thPlace('boulder', d, { in: 'floating' }, 9)) */
function thPlace(id, def, pl0, i, ix, defs) {
  const pl1 = ix ? thResolvePlacement(pl0, ix, defs) : pl0, key = pl1.in || 'park', c = key.indexOf(':'), name = c < 0 ? key : key.slice(0, c), arg = c < 0 ? '' : key.slice(c + 1);
  const Rm = (def.radius_m || 1) * thPlacement(def, pl1).k * 1.15;
  let h = null; try { h = TH_HOSTS[name] ? TH_HOSTS[name](pl1, def, Rm, arg) : FR[name] && FR[name] instanceof Frame ? TH_HOSTS.frame(pl1, def, Rm, name) : null; } catch (e) { console.error('thing', id, 'placement', i, e); }
  if (!h || !h.host) { console.error('thing', id, 'placement', i, ': there is no such place to stand in:', key); return null; }
  const host = h.host, pl = Object.assign({}, pl1, { unit: host.unit });
  const f = host.addChild(new Frame({ type: 'thing', name: def.title, unit: host.unit, radius: Rm / host.unit, r0: 0, r1: h.r1 || Rm * 12, up: h.up || null, pos: h.pos, quat: h.quat || new THREE.Quaternion(),
    opts: { thing: id, placement: pl, n: i || 0, env: h.env || 'studio', ground: !!h.ground, merge: !!h.merge, note: h.note || '', view: h.view || null, labelIf: h.labelIf || null, labelAt: h.labelAt || null } }));
  if (h.center) f.center = h.center; if (h.radius) f.radius = h.radius;   // a resolver may give the ball that holds the thing (its middle, in frame units from the base point, and its radius) when the default, a ball about the base point, would take in too much of the host
  f.noFade = true; f.coRender = true; f.coMax = h.coMax || Rm * 800; f.pinned = true; f.isThing = true; f.proxy = null; f.thHost = h; f.thFar = !h.keep;
  if (h.place) f.place = () => h.place(f);
  FR.things.push(f);
  if (!FR['thing_' + id]) { FR['thing_' + id] = f; if (def.ruler) EXT_LANDMARKS.push({ label: def.ruler.label, D: def.ruler.D, frame: f, side: true, go: then => flyTo(f, thLocalToFrame(def, pl, def.ruler.at || [0, (def.height_m || 0) * .5, 0]), def.ruler.D, then) }); }
  return f;
}
/* A placement is {at:[x,z], y?, rot, scale, seed}. `on: {thing, placement, at:[x,y,z]}` instead of at/y puts it on another thing's placement, at a point given in that
   thing's own coordinates (the bee on a buttercup flower): the position follows the host's scale, heading, lean and variation. */
function thResolvePlacement(pl, ix, defs) {
  if (!pl.on) return pl;
  const host = (ix.things.find(t => t.id === pl.on.thing) || {}).placements, hp = host && host[pl.on.placement || 0], hd = defs[pl.on.thing]; if (!hp || !hd) return pl;
  const p = thLocalToFrame(hd, hp, pl.on.at);
  return Object.assign({}, pl, { at: [hp.at[0] + p.x, hp.at[1] + p.z], y: (hp.y || 0) + p.y });
}
/* A thing outside the park that has not been drawn for a while gives back its meshes and materials; the engine builds it again when its host is next drawn. */
const TH_FAR_MS = 25000;
function thSweep() {
  const now = performance.now(), ch = chainOf(cam.A), path = fly && fly.frame ? chainOf(fly.frame) : [];
  for (const f of FR.things || []) if (f.thFar && f.built && f.T && !drawn.includes(f) && !ch.includes(f) && !path.includes(f) && now - (f._seen || 0) > TH_FAR_MS) { f.dispose(); TH.swept = (TH.swept || 0) + 1; }
}
WORLD_EXT.push(async FR => {
  const ix = await thLoadIndex(); FR.things = FR.things || []; const defs = {};
  for (const e of ix.things || []) { try { defs[e.id] = await thLoadDef(e.id); } catch (err) { console.error('thing data missing', e.id, err); } }
  for (const e of ix.things || []) {
    const def = defs[e.id]; if (!def) continue;
    const inPark = (e.placements || []).some(pl => !pl.in || pl.in === 'park');
    if (inPark) loadNote(def.label || def.title || e.id, thLoadBundle(e.id));   // what stands in the park is fetched at once; a thing elsewhere when its frame is first built
    def.parts.forEach(p => { if (p.deeper && p.deeper.type === 'tissue2') thLoadTissue(p.deeper.id); });
    (e.placements || []).forEach((pl0, i) => thPlace(e.id, def, pl0, i, ix, defs));
  }
  setInterval(thSweep, 4000);
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
  return new Frame({ type: 'tissue2', name: 'Inside the tissue', unit: 1e-6, radius: 3000, r0: 1e-6, r1: 3e-2, spawnD: 3e-5, pos: T0.clone(), opts: { id } });
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
  else if (kind === 'tube_x') g = new THREE.CylinderGeometry(.5, .5, 1, 12, 1).rotateZ(Math.PI / 2);
  else if (kind === 'cylinder') g = new THREE.CylinderGeometry(.5, .5, 1, 14, 1);
  else if (kind === 'bean') { g = new THREE.TorusGeometry(.32, .17, 8, 20, Math.PI * 1.0); g.rotateX(0); g.translate(0, -.16, 0); g.rotateZ(Math.PI); g.translate(0, .16, 0); g.scale(1.25, 1, 1); }   // a curved sausage: one guard cell
  else g = new THREE.BoxGeometry(1, 1, 1);
  g.computeVertexNormals(); return g;
}
// instance transforms of one population: [{p:[x,y,z], rotY, s:[sx,sy,sz]}]
function thArrange(pop, built, rnd) {
  const a = pop.arrange || {}, sz = pop.size, out = [];
  if (a.kind === 'list') for (const it of a.items) out.push({ p: it.at.slice(), rotY: it.rotY || 0, rot: it.rot, dir: it.dir, s: it.size ? it.size.slice() : sz.slice() });
  else if (a.kind === 'grid') {
    const [nx, ny, nz] = a.n, st = a.step, o = a.origin, j = a.jitter || 0;
    for (let k = 0; k < nz; k++) for (let m = 0; m < ny; m++) for (let i = 0; i < nx; i++) {
      const x = o[0] + (i + (a.stagger ? (k % 2) * a.stagger : 0)) * st[0] + sz[0] / 2, y = o[1] + m * st[1], z = o[2] + k * st[2] + sz[2] / 2;
      if ((a.skip || []).some(s => s.x && x > s.x[0] && x < s.x[1])) continue;
      out.push({ p: [x + (rnd() - .5) * j * st[0], y, z + (rnd() - .5) * j * (st[2] || 1)], rotY: 0, rot: a.rot, dir: a.dir, s: [sz[0] * (1 + (rnd() - .5) * j), sz[1] * (1 + (rnd() - .5) * j), sz[2] * (1 + (rnd() - .5) * j)] });
    }
  } else if (a.kind === 'random') {
    let guard = 0; const gap = a.gap || 0;
    while (out.length < a.n && guard++ < a.n * 80) {
      const p = [0, 1, 2].map(i => a.min[i] + (a.max[i] - a.min[i]) * rnd()); if ((a.exclude || []).some(e => p.every((v, i) => v > e.min[i] && v < e.max[i]))) continue;
      const s = sz.map(v => v * (.85 + .3 * rnd()));
      if (out.some(o => Math.abs(o.p[0] - p[0]) < (o.s[0] + s[0]) / 2 + gap && Math.abs(o.p[1] - p[1]) < (o.s[1] + s[1]) / 2 + gap && Math.abs(o.p[2] - p[2]) < (o.s[2] + s[2]) / 2 + gap)) continue;
      out.push({ p, rotY: rnd() * 3, free: a.orient === 'free' ? [rnd(), rnd(), rnd()] : null, s });
    }
  } else if (a.kind === 'inside') {
    const par = built[a.of]; if (!par) return out; const r2 = rng(a.seed || 3);
    for (const q of par) for (let k = 0; k < a.per; k++) {
      let v; do { v = [r2() * 2 - 1, r2() * 2 - 1, r2() * 2 - 1]; } while (v[0] * v[0] + v[1] * v[1] + v[2] * v[2] > 1);
      out.push({ p: [q.p[0] + v[0] * q.s[0] / 2 * a.margin, q.p[1] + v[1] * q.s[1] / 2 * a.margin, q.p[2] + v[2] * q.s[2] / 2 * a.margin], rotY: r2() * 6, free: a.orient === 'free' ? [r2(), r2(), r2()] : null, s: sz.slice() });
    }
  }
  return out;
}
/* Orientation of one instance: a list item may give `rot: [rx, ry, rz]` degrees (full 3D), or `dir: [x, y, z]` (the direction its long axis points:
   z for tube_z, x for tube_x, y otherwise), or `rotY` about the vertical (the old way); random and inside arrangements take `orient: 'free'` for a random 3D
   orientation. A population's own `rot` [rx, ry, rz] degrees is applied first (the shape's rest orientation). */
const TH_AXIS = { tube_z: [0, 0, 1], tube_x: [1, 0, 0] }, _thY = new V3(0, 1, 0);
function thTissueQuat(t, pop, q) {
  if (t.dir) q.setFromUnitVectors(new V3(...(TH_AXIS[pop.shape] || [0, 1, 0])), new V3(...t.dir).normalize());
  else if (t.rot) q.setFromEuler(new THREE.Euler(t.rot[0] * Math.PI / 180, t.rot[1] * Math.PI / 180, t.rot[2] * Math.PI / 180, 'XYZ'));
  else if (t.free) { const [a, b, c] = t.free, r1 = Math.sqrt(1 - a), r2 = Math.sqrt(a); q.set(r1 * Math.sin(2 * Math.PI * b), r1 * Math.cos(2 * Math.PI * b), r2 * Math.sin(2 * Math.PI * c), r2 * Math.cos(2 * Math.PI * c)); }
  else q.setFromAxisAngle(_thY, t.rotY || 0);
  if (pop.rot) q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pop.rot[0] * Math.PI / 180, pop.rot[1] * Math.PI / 180, pop.rot[2] * Math.PI / 180, 'XYZ')));
  return q;
}
/* what a structure in a tissue scene is made of at the next level: its `deeper` ({type:'mol', mol, name} | {type:'cell', cell?} | {type:'none'}); a cell opens the scene's
   own cell type (scene.cell: 'plant' | 'animal' | 'fungal', default plant) unless the population says otherwise */
function thTissueDeeper(def, pop) {
  const d = pop.deeper; if (!d || d.type === 'none') return null;
  if (d.type === 'cell') return Object.assign({}, d, { cell: d.cell || def.cell || 'plant', button: d.button || (((d.cell || def.cell) === 'fungal') ? 'Look inside a cell (generic stand-in)' : 'Look inside this cell') });
  if (d.type === 'mol') return Object.assign({}, d, { button: d.button || 'See the molecule: ' + (d.name || d.mol) });
  return d;
}
FT.tissue2 = {
  build(F, o) {
    F.env = { opaque: true, bg: 0xf3efe6 }; F.illo = true;
    F.add(new THREE.HemisphereLight(0xffffff, 0x998877, .75)); const kl = new THREE.DirectionalLight(0xffffff, .75); kl.position.set(2, 4, 3); F.add(kl);
    F.spawnD = 3e-5;
    F.update = dt => { if (cam.A === F) { F._age = (F._age || 0) + dt; if (F._age < 1.8) cam.T.multiplyScalar(Math.exp(-dt * 4)); } };   // arriving by scroll-zoom: glide to the scene instead of staying where the cursor was
    /* What a structure is made of: its own `deeper`, else its `material` (js/descent.js). With the pointer between structures, the nearest one answers:
       a descent in a tissue never ends in the gap between two cells. */
    F.spawn = (T0, hint) => {
      let o = hint && hint.obj && hint.obj.userData.thing === 'tissue2' ? hint.obj : null;
      if (!o) { let bd = Infinity; for (const p of F.pickables) { const c = p.userData.cen; if (!c) continue; for (let i = 0; i < c.length; i += 4) { const d = Math.hypot(c[i] - T0.x, c[i + 1] - T0.y, c[i + 2] - T0.z) - c[i + 3]; if (d < bd) { bd = d; o = p; } } } }
      if (!o) return null; const u = o.userData;
      if (u.deeper) {   // a cell of this scene opens the generic cell of its kind: its name says which cell it stands for
        const f = thDeepFrame(u.deeper, T0), t = u.info && u.info.title;
        if (f && f.type === 'cell' && t) f.opts.cname = f.opts.cname ? `${t}: a fungal cell (generic stand-in)` : `${t}: drawn as a generic ${f.opts.type === 'plant' ? 'plant' : 'animal'} cell`;
        return f;
      }
      return typeof DESCENT !== 'undefined' ? DESCENT.spawnFor(F, { id: u.id, node: u.node, what: u.info && u.info.title, u }, T0) : null;
    };
    F.cardMadeOf = (h, n) => { const d = h && h.obj && h.obj.userData.deeper; return d ? { label: d.button, go: () => thGoDeeper(h.frame, h, d) } : null; };
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
        inst.forEach((t, i) => { thTissueQuat(t, pop, q); m4.compose(new V3(...t.p), q, new V3(...t.s)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setRGB(1 - rr() * .08, 1 - rr() * .06, 1 - rr() * .08)); });
        im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; grp.add(im);
        const nid = NODE[pop.node] ? pop.node : null, deeper = thTissueDeeper(def, pop); if (!nid) console.warn('tissue2', def.id, pop.id, 'has no card', pop.node);
        im.userData = { id: pop.id, node: nid, priority: pop.priority ?? 3, deeper, thing: 'tissue2', madeOf: deeper ? 'cell' : undefined, material: pop.material, info: { title: pop.name, tag: pop.tag || def.tag || 'Inside the tissue', body: '' }, main: im };
        { const cen = im.userData.cen = new Float32Array(inst.length * 4), gp = grp.position; inst.forEach((t, i) => { cen[i * 4] = t.p[0] + gp.x; cen[i * 4 + 1] = t.p[1] + gp.y; cen[i * 4 + 2] = t.p[2] + gp.z; cen[i * 4 + 3] = Math.min(t.s[0], t.s[1], t.s[2]) / 2; }); }   // centres (frame coordinates) and half the smallest side, for "the structure nearest this point"
        im.userData.resolve = () => pop.id; im.userData.pickRoot = im;
        F.pickables.push(im); if (nid) regMesh(pop.id, im);
        if (pop.ink) { const io = new THREE.InstancedMesh(geo, thInstOutline(0x1a2b1a, .0016), inst.length); io.instanceMatrix = im.instanceMatrix; io.frustumCulled = false; io.renderOrder = -1; grp.add(io); }
      }
      for (const lb of def.labels || []) { const a = new THREE.Object3D(); a.position.set(...lb.at); grp.add(a); const pm = F.pickables.find(p => p.userData.id === lb.pop); F.label(a, lb.text, { pick: pm, cls: 'thTis' }); }
    });
  }
};
