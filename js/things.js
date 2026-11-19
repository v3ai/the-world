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
  return TH.bundles[id] || (TH.bundles[id] = getJSON('data/things/' + id + '/mesh.json').then(async j => {
    if (j.format === 2) { const r = await fetch('data/things/' + id + '/' + j.bin); if (!r.ok) throw new Error('data/things/' + id + '/' + j.bin + ' ' + r.status); j.buf = await r.arrayBuffer(); }
    return j;
  }));
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
  const g = bundle.format === 2 ? thDecodeV2(bundle, q) : decodePart(q);
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
  return out;
}
/* thing-local point -> frame coordinates for a placement (the frame origin is the thing's base point) */
function thLocalToFrame(def, pl, p) { const x = thPlacement(def, pl); return new THREE.Vector3(p[0], p[1], p[2]).multiplyScalar(x.k).applyQuaternion(x.q); }

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
function thSwayPatch(mat, sp) {   // MeshToonMaterial: move the thing-space position (after the instance matrix) in the vertex shader
  const u = thSwayUniforms(sp); mat.userData.sway = u;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uTime: TH_SWAY.uTime }, u);
    sh.vertexShader = TH_SWAY_GLSL + '\n' + sh.vertexShader.replace('#include <project_vertex>', `vec4 thP = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  thP = instanceMatrix * thP;
#endif
  thP.xyz += thMove(thP.xyz);
  vec4 mvPosition = modelViewMatrix * thP; gl_Position = projectionMatrix * mvPosition;`);
  };
  mat.customProgramCacheKey = () => 'thsway';
}

/* ---------- ThingObj: the meshes of one thing ---------- */
class ThingObj {
  /* def: thing.json, bundle: mesh.json, o: { placement: {scale, rot (deg), seed}, or scale / rotY (radians) / seed; hidden: Set } */
  constructor(def, bundle, o = {}) {
    this.def = def; this.bundle = bundle; this.o = o;
    const pl = o.placement || { scale: o.scale, rot: (o.rotY || 0) * 180 / Math.PI, seed: o.seed }; this.pl = pl; this.xf = thPlacement(def, pl); this.k = this.xf.k; this.u = thUnit(def, this.k);
    this.group = new THREE.Group(); this.group.scale.setScalar(this.k); this.group.quaternion.copy(this.xf.q); this.group.updateMatrix();
    this.holder = new THREE.Group();             // what the frame adds to its scene: group + shadow + hotspots (not scaled)
    this.parts = {}; this.list = []; this.hot = []; this.hidden = o.hidden || new Set(); this.sel = null;
    this.plane = new THREE.Plane(new V3(0, 0, 1), 0); this.planes = [this.plane];
    this.faceMats = []; this.mode = null; this.near = true; this.tier = 0; this.cutN = new V3(0, 0, 1); this.tierNames = ['near'];
    this.lights = { hemi: new THREE.HemisphereLight(0xcfe6ff, 0x4a6a2a, .75), sun: new THREE.DirectionalLight(0xfff1d6, 1.0) };
    this.lights.sun.position.set(.4, 1, .5).multiplyScalar(40);
    this.holder.add(this.group);
    this.pivots = {}; this.clock = 0; this.pivotPending = true;
    // layers (outermost first): what Auto peels, what the core sample and "Peel to here" work on. Default: whatever the first mode shows is one layer.
    const m0 = (def.modes[0] || {}).show || {}, dflt = def.systems.map(s => s.id).filter(s => (m0[s] ?? m0['*'] ?? 0) > 0);
    this.layers = (def.layers && def.layers.length ? def.layers : [{ systems: dflt }]).map(l => Object.assign({ ghost: .1 }, l));
    this.rank = {}; this.layers.forEach((l, i) => (l.systems || []).forEach(s => this.rank[s] = i));
    if (def.auto && def.auto.layers) { const ops = {}; this.layers.forEach((l, i) => (l.systems || []).forEach(sy => ops[sy] = i === 0 ? 1 : 0)); this.peelMode = { id: 'auto', show: Object.assign(ops, def.auto.always || {}) }; }
    this.autoOp = null; this.revealOp = null; this.revealId = null; this.revealFront = null; this.layerName = '';
    for (const pd of def.parts) this._addPart(pd);
    if (def.shadow) this._addShadow(def.shadow);
    for (const h of def.hotspots || []) this._addHotspot(h);
    this._addAnims();
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
      g.userData.main.material.clippingPlanes = null; if (sw) thSwayPatch(g.userData.main.material, sw);
      if (pd.solid !== false) {   // inside faces for the cut-open view, painted with the cut-face pattern
        const fm = thFaceMat(this._faceFor(pd), this.plane); fm.clippingPlanes = this.planes; const cap = new THREE.Mesh(geo, fm); cap.visible = false; cap.userData.cap = true; cap.renderOrder = 0; g.add(cap); g.userData.cap = cap; this.faceMats.push(fm);
      }
    } else if (pd.instances) {
      const inst = thInst(this.bundle, pd.instances); geo = thGeo(def.id, this.bundle, inst.mesh);
      const ex = geo.attributes.color ? { vertexColors: true } : {}; if (pd.card) { thCardUV(geo); ex.map = thCardTexture(pd.card); ex.alphaTest = .5; }
      const mat = illoMat(color, { double: !!pd.double, extra: ex }); if (sw) thSwayPatch(mat, sw);
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
    const r = sh.radius_m * this.k, m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({ map: thShadowTex(), transparent: true, depthWrite: false, opacity: sh.opacity ?? 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(sh.offset ? sh.offset[0] * this.k : 0, .012 * this.u, sh.offset ? sh.offset[1] * this.k : 0); m.renderOrder = -1; m.userData.shadow = true; this.shadow = m; this.holder.add(m);
  }
  _hotPivot(h) {   // which pivot group a marker rides on: its own `pivot`, else the pivot of the first of its modes that has one
    if (h.pivot) return h.pivot;
    for (const id of h.modes || []) { const m = this.modeDef(id); if (m && m.pivot) return m.pivot; }
    return null;
  }
  _addHotspot(h) {
    const R = this.def.radius_m || 1, geo = new THREE.SphereGeometry(h.r || Math.max(.01 * this.u, R * .02), 14, 10), g = inked(geo, 0xffd166, { w: .004 });
    g.children.forEach(m => { m.material.depthTest = false; m.renderOrder = m.userData.outline ? 9 : 10; });   // ink first, fill on top
    const pv = this._hotPivot(h); g.userData.hotspot = h; g.visible = false; g.position.set(...h.at); (pv ? this._pivot(pv) : this.group).add(g); this.hot.push(g);
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
    const def = this.def, camT = camLocal.clone().applyQuaternion(this.xf.q.clone().invert()).divideScalar(this.k);   // camera in thing-local coordinates
    const d = camLocal.distanceTo(new V3(0, (def.radius_m || 1) * this.k * .5, 0));
    this.dist = d; const md = this.resolveMode(d); this.curMode = md; const cut = md && md.cut; this.cutActive = !!cut;
    const lod = def.lod, t0 = this.tier;   // three tiers: 0 near (full detail), 1 mid, 2 far; without lod.far_m the mid tier is the far one
    if (this.lodForce) this.tier = this.lodForce === 'near' ? 0 : this.lodForce === 'mid' ? 1 : 2;
    else if (lod) { const nm = lod.near_m, fm = lod.far_m || 1e9, T = this.tier; this.tier = d > fm * (T === 2 ? .9 : 1.12) ? 2 : d > nm * (T === 0 ? 1.12 : .9) ? 1 : 0; }
    this.near = this.tier === 0; const tierNames = this.tier === 0 ? ['near'] : this.tier === 2 ? ['far'] : (lod && lod.far_m ? ['mid'] : ['far', 'mid']), lodSnap = t0 !== this.tier; this.tierNames = tierNames;
    // cut plane (thing-local -> scene coordinates)
    const cutDef = typeof cut === 'object' ? cut : {}, at = new V3(...(cutDef.at || def.cut && def.cut.at || [0, (def.height_m || 1) * .5, 0]));
    if (cut) {
      if (this.cutPending) { this.cutPending = false; this.aimCut(at, cutDef, camT); }
      const nC = this.cutN.clone().applyQuaternion(this.xf.q), qC = at.clone().applyMatrix4(this.group.matrix);
      this.plane.normal.copy(nC); this.plane.constant = -nC.dot(qC) - nC.dot(off);
      const inv = new THREE.Matrix4().copy(this.group.matrix).invert();
      for (const fm of this.faceMats) { const u = fm.uniforms; u.uPlane.value.set(nC.x, nC.y, nC.z, this.plane.constant); u.uCam.value.copy(this.camW || new V3()); u.uOff.value.copy(off); u.uInv.value.copy(inv); }
    }
    const planes = cut ? this.planes : [];
    this.clock += dt; this.seeThrough = !!(md && md.groundSeeThrough);
    // pivot groups: the mode's pivot turns (once per choice) so that its opening faces the camera; the others stay where they are
    if (md && md.pivot) {
      const pv = this.pivots[md.pivot] || (this._pivot(md.pivot), this.pivots[md.pivot]);
      if (this.pivotPending) { this.pivotPending = false; pv.ang = Math.atan2(camT.x - pv.at[0], camT.z - pv.at[1]); }
      pv.outer.rotation.y += (((pv.ang - pv.outer.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * (1 - Math.exp(-dt * 6));
    }
    if (this.anims.length && this.tier < 2 && alpha > .05) this._stepAnims(this.clock);
    // opacity map: the mode's, or Auto's peel, or a reveal (everything in front of a part gives way, in any mode); a peeled thing shows all its layers
    let sh = (md && md.show) || {}; const peeled = this.hidden.size > 0;
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
      g.visible = op > .01; g.userData.shown = g.visible ? r.op : 0;
      if (g.visible && r.flow) { thFlowUpdate(r.flow, this.clock); mat.opacity = op; continue; }
      if (g.visible) {
        const isSel = this.sel === pd.id;
        mat.opacity = op; mat.transparent = op < .99; mat.depthWrite = op > .9; if (mat.clippingPlanes !== planes) { mat.clippingPlanes = planes; mat.needsUpdate = true; }
        const ol = g.userData.ol; if (ol) { ol.visible = op > .5 && !pd.noink; ol.material.uniforms.uOpacity.value = .85 * op; ol.material.uniforms.uColor.value.setHex(isSel ? 0x1e4e8f : 0x1a1f2b); if (ol.material.clippingPlanes !== planes) { ol.material.clippingPlanes = planes; ol.material.needsUpdate = true; } }
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
const TH_PEEL = { K: 12, TMIN: .008, TMAX: .045 };   // the human's peel constants (body_core.js PEEL_K ...), scaled by the thing's size
FT.thing = {
  build(F, o) {
    const id = o.thing, pl = o.placement || {}; F.illo = true; F.noFade = true;   // opacity is handled per part, like the body
    renderer.localClippingEnabled = true;
    F.parts = {}; F.mode = null; F.layered = true; F.hidden = new Set(); F.sel = null; F.reveal = null;   // the body's click features (core sample, hide, peel) work on this frame too
    F.env = { bg: 0, opaque: false };
    const fogSrc = FR.park && FR.park.scene;
    if (fogSrc && fogSrc.fog) F.scene.fog = fogSrc.fog;
    F.ready = Promise.all([thLoadDef(id), thLoadBundle(id), loadNodes()]).then(([def, bundle]) => {
      if (!F.built) return;
      const T = new ThingObj(def, bundle, { placement: pl, hidden: F.hidden });
      F.T = T; T.group.position.set(0, 0, 0); T.group.updateMatrix(); T.holder.position.set(0, 0, 0);
      F.add(T.holder); F.add(T.lights.hemi); F.add(T.lights.sun); F.add(T.lights.sun.target);
      const validModes = ['auto'].concat(def.modes.map(m => m.id)); if (!def.auto) validModes.shift();
      T.setMode(validModes.includes(F.mode) ? F.mode : validModes[0]);
      thBindFrame(F, T, def);
    });
    F.update = (dt, t) => thFrameUpdate(F, dt, t);
    F.chooseHit = cands => thChooseHit(F, cands);
    F.cardMadeOf = (h, n) => thCardMadeOf(F, h, n);
    F.spawnD = .006; F.spawn = (T0, hint) => thSpawn(F, T0, hint);
    F.coreIds = () => F.T ? F.T.coreRecs().map(r => r.pd.id) : [];
    F.coreClip = p => !!F.T && F.T.isClipped(p);
  }
};
function thBindFrame(F, T, def) {
  const k = T.k, u = T.u;
  F.blurb = def.blurb || ''; F.note = def.model_note || ''; F.timeNote = T.timeNote || '';
  F.coreText = { head: 'Under this point, from the outside inward', note: `Depths are on the model of this ${(def.title || 'thing').toLowerCase()}, not a measurement of a real one.` };
  F.spawnD = .006 * u; F.floorD = .0015 * u;   // no zooming into an empty gap: a part's tissue takes over at spawnD, otherwise the view stops here
  // controls: one button per layer mode, built now so the frame's control bar is ready when the camera arrives
  const modes = (def.auto ? [['auto', def.auto.label || 'Auto']] : []).concat(def.modes.map(m => [m.id, m.label]));
  building = F;
  try {
    const row = seg(modes, T.modeId, m => { T.setMode(m); thUpdateControls(F); });
    F.uiRow = row; row.classList.add('thModes');
    F.cutBtn = actBtn('Turn the cut to face me', () => { T.faceCut(); }); F.cutBtn.style.display = 'none';
    F.showAllBtn = actBtn('Show everything', () => { F.hidden.clear(); F.reveal = null; F.sel = null; toast('Everything is back.'); }); F.showAllBtn.style.display = 'none';
    F.legend = uiEl(document.createElement('div')); F.legend.className = 'thLegend'; F.legend.style.display = 'none';
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
      madeOf: pd.deeper ? 'thing' : undefined,
      center: h => (h && h.pointLocal) ? h.pointLocal.clone() : partCenter(),
      radius: h => Math.max(.015 * u, Math.min((pd.radius || .1) * k * .3, thingR * .2))
    });
    if (rec.instanced) g.userData.resolve = hit => pd.id;
    g.userData.main.userData.pickRoot = g;
    F.pickables.push(g); F.parts[pd.id] = { g, p: g.userData.part }; regMesh(pd.id, g); if (node) regMesh(node, g);
  }
  for (const g of T.hot) {
    const h = g.userData.hotspot, node = NODE[h.node] ? h.node : null, at = new V3(...h.at).applyMatrix4(T.group.matrix);
    Object.assign(g.userData, { id: h.id || h.node, node, priority: 4, thing: def.id, frame: F, hotspot: h, madeOf: h.deeper ? 'thing' : undefined, info: { title: h.label || nodeTitle(h.node), tag: 'Marker', body: '' }, center: () => at.clone(), radius: () => (def.radius_m || 1) * k * .05 });
    g.userData.main.userData.pickRoot = g; F.pickables.push(g); regMesh(h.node, g);
    F.label(g, h.label || nodeTitle(h.node), { offset: new V3(0, (def.radius_m || 1) * k * .05, 0) });
  }
  F.labelObj = new THREE.Object3D(); F.labelObj.position.set(0, ((def.height_m || def.radius_m || 1) * k) + .12 * u, 0); F.add(F.labelObj);
  const mainRec = T.parts[def.main_part || (def.parts[0] || {}).id];
  if ((F.opts.n || 0) === 0 || !def.label_first_only) { const nl = F.label(F.labelObj, def.label || def.title, { cls: 'thName', pick: mainRec && mainRec.g }); nl.minSizeFn = f => f.dLoc < (def.label_m || (def.radius_m || 1) * k * 25); }
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
  // the part a card is about stays selected only while its card is open
  if (F.sel || F.reveal) { const st = infoState, keep = st && ((st.h && st.h.frame === F && st.h.obj && st.h.obj.userData.id === F.sel) || (!st.h && st.node === F.selNode)); if (!keep) { F.sel = null; F.reveal = null; } }
  T.sel = F.sel; thAutoUpdate(F, dt);
  TH_SWAY.uTime.value = (performance.now() / 1000) % 3600;
  T.update(dt, C, _thOff, F.alpha);
  thGroundFade(FR.things.some(f => f.T && f.T.seeThrough && f.alpha > .5));
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
    const hit = raycaster.intersectObject(m, false).find(x => !T.isClipped(x.point)); if (hit) rows.push({ id: rec.pd.id, e: hit.distance, rank: rec.rank });
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
  const fl = L[focus] || {}; return { ops, focus: fl.label || fl.id || (fl.systems || [])[0] || '' };
}
function thAutoUpdate(F, dt) {
  const T = F.T, a = T.def.auto, useAuto = !!(a && a.layers && T.modeId === 'auto'), rv = F.reveal && T.parts[F.reveal.id] && T.parts[F.reveal.id].rank !== undefined ? F.reveal : null;
  if (!useAuto && !rv) { T.revealOp = T.revealId = T.revealFront = null; return; }
  if (!T.peelScale) T.peelScale = a && a.scale || Math.max(.15, (T.def.height_m || 1) * T.k / 1.75);
  const S = F._pk = F._pk || { t: -1, key: '' }, now = performance.now();
  camPosIn(F, _tpo); const dist = _tpo.distanceTo(_tpc.set(0, (T.def.radius_m || 1) * T.k * .5, 0)), active = (a && a.active_m) || (T.def.radius_m || 1) * T.k * 2.5;
  if (useAuto && !rv && dist > active) {   // far: the outermost layer, solid
    const ops = {}; T.layers.forEach((l, i) => (l.systems || []).forEach(s => ops[s] = i === 0 ? 1 : 0)); Object.assign(ops, a.always || {});
    T.peelMode.show = ops; T.layerName = (T.layers[0].label || T.layers[0].id || ''); T.revealOp = T.revealId = T.revealFront = null; S.key = ''; return;
  }
  const key = [_tpo.x, _tpo.y, _tpo.z, cam.T.x, cam.T.y, cam.T.z, F.hidden.size, rv ? rv.id : '', T.tier].map(v => typeof v === 'number' ? v.toFixed(4) : v).join();
  if (key === S.key || now - S.t < 110) return; S.key = key; S.t = now;
  let tl = null, tgt = null; if (rv) tl = new V3(...T.parts[rv.id].pd.center).applyMatrix4(T.group.matrix);
  const rows = thRayStack(F, tl);
  if (rv) { let k = rows.findIndex(r => r.id === rv.id); if (k < 0) { const dc = _tpo.distanceTo(tl); k = rows.filter(r => r.e < dc * .97).length; } tgt = { n: k, rank: T.parts[rv.id].rank }; T.revealFront = new Set(rows.slice(0, k).filter(r => r.rank >= tgt.rank).map(r => r.id)); }
  const P = thPeel(T, rows, tgt, 1 - smooth(active * .35, active * .6, dist));
  if (useAuto) { const ops = Object.assign({}, P.ops, a.always || {}); T.peelMode.show = ops; T.layerName = P.focus; }
  if (rv) { T.revealOp = P.ops; T.revealId = rv.id; } else { T.revealOp = T.revealId = T.revealFront = null; }
  mouse.dirty = true;   // what is under a resting cursor has changed
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
  const ok = T ? cands.filter(c => !T.isClipped(c.hit.point)) : cands, vis = ok.filter(c => (c.obj.userData.shown || 0) >= .35), pool = vis.length ? vis : ok.length ? ok : cands;
  return pool.reduce((b, c) => c.hit.distance < b.hit.distance ? c : b);
}

/* ---------- what each part is made of at the next level down ---------- */
function thSpawn(F, T0, hint) {
  if (!F.T) return null;
  const hu = hint && hint.obj && hint.obj.userData; let d = null;
  if (hu && hu.hotspot && hu.hotspot.deeper) d = hu.hotspot.deeper;
  else { const pid = thVisibleAt(F), rec = pid && F.T.parts[pid]; d = rec ? rec.pd.deeper : (hu && hu.part && F.T.parts[hu.id] ? F.T.parts[hu.id].pd.deeper : null); }   // what you see now, not what was under the cursor before the layers peeled
  return d ? thDeepFrame(d, T0) : null;
}
const TH_CELLS = {
  plant: { name: 'Plant cell', opts: { type: 'plant' }, off: -10 },
  animal: { name: 'Animal cell', opts: { type: 'animal' }, off: 0 },
  fungal: { name: 'Fungal cell (generic stand-in)', opts: { type: 'animal' }, off: 0, note: 'No fungal-cell scene has been built yet, so this is the generic animal-cell scene standing in for it. A fungal cell also has a nucleus and mitochondria, but it is surrounded by a rigid cell wall and differs from an animal cell in other ways that are not drawn here.' }
};
function thCellFrame(kind, T0) {
  const c = TH_CELLS[kind] || TH_CELLS.plant, f = new Frame({ type: 'cell', name: c.name, unit: 1e-6, radius: 16, r1: 2.5e-4, pos: T0.clone().add(new V3(0, c.off, 0)), opts: Object.assign({}, c.opts) });
  if (c.note) f.note = c.note; return f;
}
function thDeepFrame(d, T0, dflt) {
  if (d.type === 'crystal') return crystalFrame(d.id, T0);
  if (d.type === 'micro') return microFrame(d.kind, T0);
  if (d.type === 'tissue') return tissueFrame(d.id, T0, d.organ);
  if (d.type === 'tissue2') return tissue2Frame(d.id, T0);
  if (d.type === 'cell') return thCellFrame(d.cell || dflt || 'plant', T0);
  if (d.type === 'mol') return new Frame({ type: 'mol', name: d.name || d.mol, unit: 1e-10, radius: 30, r1: 2e-8, spawnD: 1e-9, pos: T0.clone(), opts: { mol: d.mol, fixed: false } });
  return null;
}
const TH_DEEP_D = { crystal: 4e-9, mol: 2.5e-9, cell: 4e-5, tissue2: 4e-4, micro: 1.2e-3, tissue: 4e-4 };
function thGoDeeper(F, h, d, dflt) {
  closeInfo(); const p = h && h.pointLocal ? h.pointLocal.clone() : new V3(); const f = thDeepFrame(d, p, dflt); if (!f) return;
  f.dynamic = true; f.keep = performance.now() + 60000; F.addChild(f); f.ensure(); flyTo(f, new V3(), d.D || TH_DEEP_D[d.type] || 4e-9);
}
/* the card's "See what it is made of" button: a part's or a marker's own `deeper`; (a frame's cardMadeOf: see CARD_HOOKS in nodes.js) */
function thCardMadeOf(F, h, n) {
  const ud = h && h.obj && h.obj.userData; if (!ud || !F.T) return undefined;
  const d = ud.hotspot ? ud.hotspot.deeper : (F.T.parts[ud.id] || {}).pd && F.T.parts[ud.id].pd.deeper; if (!d) return undefined;
  return { label: d.button || 'See what it is made of', go: () => thGoDeeper(F, h, d) };
}
CARD_HOOKS.push((id, h, n) => {   // the honest "model, not a scan" note on top of every card of a thing
  const F = h && h.frame, def = (F && F.T && F.T.def) || (!h && (thFindNode(id) || {}).def); if (!def || infoEl.querySelector('.thNote')) return;
  const note = document.createElement('div'); note.className = 'note thNote'; note.textContent = def.model_note || '';
  if (note.textContent) infoEl.querySelector('.tag') && infoEl.querySelector('.tag').insertAdjacentElement('beforebegin', note);
});

/* "Show me where it is": goToNode() flies to the first placed thing that has a part or marker with this card, shows what is in front of it out of the way,
   highlights it, centres it and opens its card */
function thFindNode(id) {
  for (const f of FR.things || []) {
    const def = TH.loaded[f.opts.thing]; if (!def) continue; const pl = f.opts.placement || {}, x = thPlacement(def, pl);
    const hit = def.parts.find(p => p.node === id && p.lod !== 'far') || def.parts.find(p => p.node === id), hs = (def.hotspots || []).find(h => h.node === id);
    const at = hit ? hit.center : hs ? hs.at : id === def.node ? (def.parts.find(p => p.id === def.main_part) || {}).center : null;
    if (!at) continue;
    const u = thUnit(def, x.k), p = thLocalToFrame(def, pl, at);
    return { f, p, D: Math.max(((hit && hit.radius) || (def.radius_m || 1) * .5) * x.k * 3.2, .4 * u), part: hit || null, hs: hs && !hit ? hs : null, def };
  }
  return null;
}
function thModeFor(T, pd) {   // a layered part is revealed in place; otherwise keep the current mode if it shows the part, else the first mode that does
  const sys = pd.system, shows = m => m && ((m.show || {})[sys] ?? (m.show || {})['*'] ?? 0) >= .5 && (!pd.parent || m.cut);
  if (T.rank[sys] !== undefined && !pd.parent) return null;
  if (shows(T.modeId === 'auto' ? null : T.modeDef(T.modeId))) return null;
  const m = T.def.modes.find(shows); return m ? m.id : null;
}
function thFlyToNode(id, t) {
  const F = t.f; showBodyNode(id, null); F.selNode = id; F.ensure();
  const R = (t.def.radius_m || 1) * (F.T ? F.T.k : 1), d = new V3(t.p.x, 0, t.p.z);
  if (d.length() > R * .06) { d.y = d.length() * .12; d.normalize(); const u = new V3(0, 1, 0); convertD(d, F, cam.A); convertD(u, F, cam.A); cam.dir.copy(d); cam.up.copy(u); }   // look at it from the side it is on
  flyTo(F, t.p, t.D); camHold = F;
  F.ready.then(() => {
    const T = F.T; if (!T) return;
    if (t.part) { const mid = thModeFor(T, t.part); if (mid) { T.setMode(mid); thUpdateControls(F); } F.sel = t.part.id; if (T.parts[t.part.id] && T.parts[t.part.id].rank !== undefined) F.reveal = { id: t.part.id }; }
    else if (t.hs) { const mid = (t.hs.modes || [])[0]; if (mid && T.modeDef(mid) && T.modeId !== mid) { T.setMode(mid); thUpdateControls(F); } }
  });
}
GOTO_HOOKS.push(id => { const t = thFindNode(id); if (!t) return false; thFlyToNode(id, t); return true; });

/* ---------- placing things in the park ---------- */
/* A placement is {at:[x,z], y?, rot, scale, seed}. `on: {thing, placement, at:[x,y,z]}` instead of at/y puts it on another thing's placement, at a point given in that
   thing's own coordinates (the bee on a buttercup flower): the position follows the host's scale, heading, lean and variation. */
function thResolvePlacement(pl, ix, defs) {
  if (!pl.on) return pl;
  const host = (ix.things.find(t => t.id === pl.on.thing) || {}).placements, hp = host && host[pl.on.placement || 0], hd = defs[pl.on.thing]; if (!hp || !hd) return pl;
  const p = thLocalToFrame(hd, hp, pl.on.at);
  return Object.assign({}, pl, { at: [hp.at[0] + p.x, hp.at[1] + p.z], y: (hp.y || 0) + p.y });
}
WORLD_EXT.push(async FR => {
  const ix = await thLoadIndex(); FR.things = FR.things || []; const defs = {};
  for (const e of ix.things || []) { try { defs[e.id] = await thLoadDef(e.id); } catch (err) { console.error('thing data missing', e.id, err); } }
  for (const e of ix.things || []) {
    const def = defs[e.id]; if (!def) continue;
    thLoadBundle(e.id); def.parts.forEach(p => { if (p.deeper && p.deeper.type === 'tissue2') thLoadTissue(p.deeper.id); });
    (e.placements || []).forEach((pl0, i) => {
      const pl = thResolvePlacement(pl0, ix, defs), x = thPlacement(def, pl), R = (def.radius_m || 1) * x.k * 1.15;
      const f = FR.park.addChild(new Frame({ type: 'thing', name: def.title, unit: 1, radius: R, r0: 0, r1: Math.max(R * 12, 8), up: new V3(0, 1, 0), pos: new V3(pl.at[0], pl.y || 0, pl.at[1]), opts: { thing: e.id, placement: pl, n: i } }));
      f.noFade = true; f.coRender = true; f.coMax = def.draw_m || 400; f.pinned = true; f.isThing = true; f.proxy = null;
      FR.things.push(f); if (i === 0) { FR['thing_' + e.id] = f; if (def.ruler) EXT_LANDMARKS.push({ label: def.ruler.label, D: def.ruler.D, side: true, go: then => flyTo(f, new V3(...(def.ruler.at || [0, (def.height_m || 0) * .5, 0])), def.ruler.D, then) }); }
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
    F.spawn = (T0, hint) => { const d = hint && hint.obj && hint.obj.userData.deeper; return d ? thDeepFrame(d, T0) : null; };
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
        im.userData = { id: pop.id, node: nid, priority: pop.priority ?? 3, deeper, thing: 'tissue2', madeOf: deeper ? 'cell' : undefined, info: { title: pop.name, tag: pop.tag || def.tag || 'Inside the tissue', body: '' }, main: im };
        im.userData.resolve = () => pop.id; im.userData.pickRoot = im;
        F.pickables.push(im); if (nid) regMesh(pop.id, im);
        if (pop.ink) { const io = new THREE.InstancedMesh(geo, thInstOutline(0x1a2b1a, .0016), inst.length); io.instanceMatrix = im.instanceMatrix; io.frustumCulled = false; io.renderOrder = -1; grp.add(io); }
      }
      for (const lb of def.labels || []) { const a = new THREE.Object3D(); a.position.set(...lb.at); grp.add(a); const pm = F.pickables.find(p => p.userData.id === lb.pop); F.label(a, lb.text, { pick: pm, cls: 'thTis' }); }
    });
  }
};
