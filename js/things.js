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
  if (q.ao && TH_LK.on && bundle.buf) g.setAttribute('thAO', new THREE.BufferAttribute(thUnpack4(bundle.buf, q.ao, q.nv), 1, true));   // baked ambient occlusion (tools/things/lib/ao.mjs): the realistic look only
  return TH.geos[k] = g;
}
function thUnpack4(buf, at, n) { const by = new Uint8Array(buf, at[0], at[1]), a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = ((by[i >> 1] >> ((i & 1) * 4)) & 15) * 17; return a; }

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
  if (TH_LK.on && face.look) return thFaceSurf(face);
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
/* The same face under the realistic look: a lit surface of its kind (roughness and metalness from the kinds table), lit by the Sun and
   the environment like the rest of the thing, its normal the cut plane's, turned to the viewer. Its pattern follows what is cut
   (tools/things/lib/kinds.mjs FACE_LOOK): 'grain' cells of the palette parted by dark seams (rock, soil, flesh), 'fibre' bundles parted
   by pale sheets (a muscle cut across: fascicles in their perimysium), 'pore' dense tissue with small holes (bone), 'plain' one colour
   with a fine grain. A drawn pattern of the kind of structure at its own scale, not a photograph of a section. */
function thFaceSurf(face) {
  const lk = face.look, K = LOOK.KINDS[lk.kind] || {}, pal = (lk.palette || face.palette || [[0x888888, 1]]).slice(0, 4), cols = [], cum = []; let tot = pal.reduce((s, p) => s + p[1], 0), acc = 0;   // lk.palette: the face's colours at measured albedo, where the drawn palette was not (kinds.mjs FACE_LOOK)
  for (let i = 0; i < 4; i++) { const p = pal[Math.min(i, pal.length - 1)]; cols.push(new THREE.Color(p[0])); if (i < pal.length) acc += p[1] / tot; cum.push(i < pal.length ? acc : 2); }
  const pat = lk.pattern === 'grain' && face.kind === 'plain' ? 'plain' : lk.pattern;
  const U = { uPlane: { value: new THREE.Vector4(0, 0, 1, 0) }, uCam: { value: new V3() }, uOff: { value: new V3() }, uInv: { value: new THREE.Matrix4() }, uCell: { value: face.cell || lk.cell || .02 }, uCols: { value: cols }, uCum: { value: cum }, uEdge: { value: face.edge ?? .35 }, uOpacity: { value: 1 }, uThFill: TH_LK.fill };
  const m = new THREE.MeshStandardMaterial({ side: THREE.BackSide, transparent: true, roughness: K.rough ?? .8, metalness: K.metal || 0 });   // (clipping planes are set by the caller)
  m.uniforms = U; m.userData.noHL = true;
  LOOK.patch(m, 'thface_' + pat, sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vThW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n\tvThW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
    sh.fragmentShader = `varying vec3 vThW; uniform vec4 uPlane; uniform vec3 uCam; uniform vec3 uOff; uniform mat4 uInv; uniform float uCell; uniform vec3 uCols[4]; uniform float uCum[4]; uniform float uEdge; uniform float uOpacity; uniform float uThFill;
float thH1(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
vec3 thH3(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453); }
` + sh.fragmentShader.replace('#include <map_fragment>', `
	vec3 thDir = normalize( vThW - uCam ); float thNd = dot( uPlane.xyz, thDir ); float thT = abs( thNd ) > 1e-4 ? -( dot( uPlane.xyz, uCam ) + uPlane.w ) / thNd : 0.0;
	vec3 thPw = uCam + thDir * thT; vec3 thQ = ( uInv * vec4( thPw - uOff, 1.0 ) ).xyz / uCell;
	vec3 thIp = floor( thQ ), thFp = fract( thQ ); float thF1 = 9.0, thF2 = 9.0; vec3 thId = thIp;
	for ( int k = -1; k <= 1; k ++ ) for ( int j = -1; j <= 1; j ++ ) for ( int i = -1; i <= 1; i ++ ) { vec3 g = vec3( float( i ), float( j ), float( k ) ); float d = length( g + thH3( thIp + g ) - thFp ); if ( d < thF1 ) { thF2 = thF1; thF1 = d; thId = thIp + g; } else if ( d < thF2 ) thF2 = d; }
	float thR = thH1( thId + 3.7 ); vec3 thC = uCols[3]; if ( thR < uCum[0] ) thC = uCols[0]; else if ( thR < uCum[1] ) thC = uCols[1]; else if ( thR < uCum[2] ) thC = uCols[2];
	float thFine = thH1( floor( thQ * 9.0 ) );
	#if ${pat === 'grain' ? 1 : 0}
	thC *= .88 + .24 * thH1( thId + 9.1 ); thC = mix( thC * .45, thC, smoothstep( 0.0, uEdge * .35, thF2 - thF1 ) );
	#elif ${pat === 'fibre' ? 1 : 0}
	thC *= .9 + .14 * thH1( thId + 9.1 ) + .06 * thFine; thC = mix( mix( thC, vec3( .93, .87, .84 ), .55 ), thC, smoothstep( .015, .07, thF2 - thF1 ) );
	#elif ${pat === 'pore' ? 1 : 0}
	thC *= .95 + .08 * thFine; thC = mix( thC * vec3( .62, .45, .4 ), thC, smoothstep( .16, .24, thF1 ) );
	#else
	thC *= .96 + .08 * thFine;
	#endif
	diffuseColor = vec4( thC, uOpacity );`).replace('#include <normal_fragment_begin>', `
	float faceDirection = 1.0; vec3 thPn = dot( uPlane.xyz, uCam - thPw ) < 0.0 ? -uPlane.xyz : uPlane.xyz;
	vec3 normal = normalize( ( viewMatrix * vec4( thPn, 0.0 ) ).xyz ); vec3 geometryNormal = normal;`);
    thLkFillChunk(sh);
  });
  return m;
}
function thInked(geo, color, o = {}) {   // like inked(), but the outline respects clipping planes
  const g = new THREE.Group(), m = new THREE.Mesh(geo, illoMat(color, { double: o.double, extra: o.vc ? { vertexColors: true } : {} })); g.add(m);
  g.userData.main = m; m.matrixAutoUpdate = false;   // the group is what moves (if anything does); the meshes inside it stay at identity
  if (!TH_LK.on) { const ol = new THREE.Mesh(geo, thOutlineMat(o.ink, o.w, o.sway)); ol.userData.outline = true; g.add(ol); g.userData.ol = ol; ol.matrixAutoUpdate = false; }   // under the realistic look there is no ink: edges come from light (DESIGN 3.10)
  return g;
}
let _thShadowTex = null;
function thShadowTex() {
  if (_thShadowTex) return _thShadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  if (TH_LK.on) [[0, .5], [.25, .4], [.5, .2], [.75, .06], [.92, .01], [1, 0]].forEach(([s, a]) => gr.addColorStop(s, `rgba(10,14,8,${a})`));   // under the look: a soft falloff with no visible rim (the Sun's shadow and the baked occlusion carry the shape; this is only the contact)
  else { gr.addColorStop(0, 'rgba(10,14,8,.62)'); gr.addColorStop(.55, 'rgba(10,14,8,.28)'); gr.addColorStop(1, 'rgba(10,14,8,0)'); }
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
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
function thLocalToFrame(def, pl, p) { const x = thPlacement(def, pl), v = new THREE.Vector3(p[0], p[1], p[2]).multiplyScalar(x.s).applyQuaternion(x.q); if (pl && pl._ride) v.add(pl._ride); return v; }   // _ride: where a thing that rides its host's sway is now (thLkRide)

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

/* ---------- the realistic look (?look=2; js/look.js, docs/DESIGN.md 3.5 to 3.10): what the park's things add to the foundation ----------
   Without look=2 nothing here runs and every thing is drawn exactly as before. With it:
   - every part is a material KIND named in its data (thing.json `kind`, written by the bake from tools/things/lib/kinds.mjs);
     TH_KINDS adds the kinds the foundation's table lacks (LOOK.KINDS is the one table; a kind is never a one-off material);
   - soil, mud and stone take a photographed surface laid on from three sides at its true size (TH_SETS), fetched when a part of that
     kind is first shown; the oak's trunk takes its bark along texture coordinates that run round and up the trunk;
   - the baked shade byte is kept only where it is true colour (`shade: 'tone'`); elsewhere it was drawn as light, and is left out;
   - no ink: the part pointed at or selected takes a rim of light in the accent colour, and a see-through layer keeps its edges
     (glass, not faded paint). Every term is one patch through LOOK.patch.
   Roughness: the foundation's values where it has them; for the added kinds, chosen against photographs (no measured roughness of
   these surfaces was found), except where a source is named. Albedo stays the part's own colour (its data); `alb` is the
   linear-light range a colour of the kind should fall in, used by the bake's check (tools/things/lib/kinds.mjs), with its source. */
const TH_KINDS = {
  wing: { rough: .22 },                                         // an insect wing: a clear membrane (light goes straight through it, not scattered: no 'thin')
  mucosa: { rough: .3, sss: [.26, .08, .05] },                 // a moist lining: smoother than skin (skin 0.5: physicallybased.info "Skin I-VI")
  cap: { rough: .42, sss: [.24, .1, .06] },                    // the fly agaric's cap: a viscid, waxy skin that shines
  gill: { rough: .85, sss: [.2, .18, .14] },                   // gills and the cap's underside: matte, thin plates
  stone: { rough: .7 },                                        // pebbles and flints (surface: river pebbles)
  root: { rough: .85, sss: [.12, .1, .06] },
  stem: { rough: .55, sss: [.12, .16, .05] },                  // green stems and stalks: light enters but a stem is not a sheet
  mud: { rough: .45 },                                         // wet mud: a little shine from its film of water
  foil: { rough: .3, metal: 1 },                               // rolled copper and aluminium foil (colour = the metal's reflectance: physicallybased.info "Copper", "Aluminum")
  polymer: { rough: .4 },                                      // the pouch laminate, the separator, a circuit board
  powder: { rough: .95 },                                      // electrode coatings, pollen: a pressed powder (graphite near charcoal, albedo about 0.02 to 0.04: physicallybased.info "Charcoal"; Wikipedia "Albedo")
  cartilage: { rough: .4, sss: [.22, .14, .1] },
  shell: { rough: .4 },
  moss: { rough: .9, sss: [.14, .18, .05] },
  lichen: { rough: .85 },
  marker: { rough: .9 },                                       // a sign drawn on the model (a flow, a schematic): unlit, see TH_LK.marker
  /* a buttercup's petal: its upper epidermis is extremely flat, with a second flat reflecting surface at an air gap under it, so it
     reflects like a mirror (about twice a single surface's 4 percent, hence specular 0.08 in thLkGlossPetal) over a matte yellow
     scattered from the starch layer beneath (Vignolini et al. 2012, J. R. Soc. Interface, doi:10.1098/rsif.2011.0759; van der Kooi et
     al. 2017, J. R. Soc. Interface 14:20160933). Little light comes through it: no 'thin' (the starch layer scatters it back). */
  gloss_petal: { rough: .14, sss: [.2, .18, .08] },
};
const TH_SETS = {   // colour, normal (OpenGL), metres one picture covers, strength of the normal map. CC0: assets/ATTRIBUTION.md
  soil: ['forest_ground_06_color_512.jpg', 'forest_ground_06_normal_gl_512.jpg', 2.11, .8],
  mud: ['brown_mud_03_color_512.jpg', 'brown_mud_03_normal_gl_512.jpg', 1.3, .6],
  pebble: ['dry_river_pebbles_color_512.jpg', 'dry_river_pebbles_normal_gl_512.jpg', 2.0, .9],
};
const TH_SET_OF = { soil: 'soil', mud: 'mud', stone: 'pebble' };
const TH_LK = { on: !!(LOOK.on && LOOK.part('pbr')), sets: {}, pend: new Set(), ld: null, rimSel: new THREE.Color(0x4f86d6), rimHov: new THREE.Color(0x9fbfe8), fill: { value: .8 }, fillT: 0 };
/* A cut face is a view made to be read, like a specimen held up to the light: a face turned away from the Sun would otherwise be lit by the
   sky and the lawn alone, and its colours (the soil's horizons, white flesh) would merge into one dark tone. So the light on a cut face never
   falls below 80 percent of what a level patch of open ground gets from the Sun and sky now (a floor, not a second light: a face that the Sun
   already lights more keeps its light, and the floor follows the day down to a dusk minimum). Only cut faces take it. */
function thLkFillChunk(sh) {
  sh.uniforms.uThFill = TH_LK.fill;
  sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
	{ vec3 thY = vec3( .2126, .7152, .0722 ); float thE = dot( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, thY ) / ( dot( material.diffuseColor, thY ) + 1e-4 );
	  reflectedLight.indirectDiffuse += material.diffuseColor * max( 0.0, uThFill - thE ); }`);
  if (!/uniform float uThFill;/.test(sh.fragmentShader)) sh.fragmentShader = 'uniform float uThFill;\n' + sh.fragmentShader;
}
function thLkFill(m) { if (m && m.isMeshStandardMaterial) LOOK.patch(m, 'thfill', thLkFillChunk); }
/* A thing that stands on another (the bee on a buttercup) rides the host's sway: the same displacement the host's vertex shader gives the
   point it stands on (thMove's breeze term, TH_SWAY_GLSL), so the flower does not swing through the bee's legs. */
const _thRide = new V3();
function thLkRide(F, T) {
  const on = F.opts.placement.on, h = F._rideHost || (F._rideHost = (FR.things || []).find(f => f.opts.thing === on.thing && (f.opts.n || 0) === (on.placement || 0)));
  const H = h && h.T; if (!H || !on.at) return;
  const a = (H.def.anim || []).find(x => x.kind === 'sway'); if (!a) return;
  const p = on.at, hh = Math.min(1, Math.max(0, (p[1] - (a.from_y ?? 0)) / Math.max((a.to_y ?? 1) - (a.from_y ?? 0), 1e-4))) ** 2, amp = (a.amp_m ?? .02) * hh;
  const u = TH_SWAY.uTime.value = (performance.now() / 1000) % 3600, ph = u * (a.hz ?? .35) * 6.2832 + (p[0] * 1.7 + p[2] * 1.3) * (a.phase_k ?? 2.2);
  _thRide.set(Math.sin(ph) + .35 * Math.sin(ph * 2.7 + p[2] * 5), .12 * Math.sin(ph * 1.3), Math.cos(ph * .83 + 1.3) + .35 * Math.sin(ph * 3.1 + p[0] * 5)).multiplyScalar(amp * H.s).applyQuaternion(H.xf.q);
  /* the view rides too: a camera anchored to this thing keeps its place on her (at the bee's own scale the flower's sway is about her
     length, so a camera left still lost her from the view between the start of a flight and its end). Points worked out from the
     data (thLocalToFrame) add where she is now, so they and the picked points both move on from there. */
  const dx = _thRide.x - T.holder.position.x, dy = _thRide.y - T.holder.position.y, dz = _thRide.z - T.holder.position.z;
  if (cam.A === F) { cam.T.x += dx; cam.T.y += dy; cam.T.z += dz; }
  if (fly && fly.frame === F && fly.p) { fly.p.x += dx; fly.p.y += dy; fly.p.z += dz; }
  T.holder.position.copy(_thRide); T.holder.updateMatrix(); if (T.pl) T.pl._ride = T.holder.position;
}
/* A thin curved sheet (a petal, a leaf card) seen near its edge: the smooth shading normal can point away from the viewer while the face
   itself is toward them. The reflection then takes the full grazing-angle Fresnel and mirrors the bright sky, and the edge turns into a white
   sliver. The normal is bent just far enough to face the viewer, which is what a real sheet's surface does where it is seen.
   The same sheet lit from behind (the Sun on its far side, as when one looks up into a crown) shows the viewer its unlit face: the shading
   normals of leaf cards are rounded over the crown and can still face the Sun there, which made a mirror glint of the Sun on the shaded
   side and bleached the leaf white. The Sun's reflection is kept only where the face itself (its geometric normal) is toward the Sun. */
function thLkFaceView(m) {
  m.extensions = Object.assign(m.extensions || {}, { derivatives: true });
  LOOK.patch(m, 'thfaceview', sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	{ vec3 thV = normalize( vViewPosition ); float thNv = dot( normal, thV ); if ( thNv < .12 ) normal = normalize( normal + ( .12 - thNv ) * thV ); }`)
    .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
	#if NUM_DIR_LIGHTS > 0
	{ vec3 thG = normalize( cross( dFdx( vViewPosition ), dFdy( vViewPosition ) ) ); if ( dot( thG, vViewPosition ) < 0.0 ) thG = -thG;
	  reflectedLight.directSpecular *= smoothstep( -.02, .08, dot( thG, directionalLights[ 0 ].direction ) ); }
	#endif`); });
}
function thLkFillStep() {
  const t = performance.now(); if (t - TH_LK.fillT < 500) return; TH_LK.fillT = t;
  const s = LOOK.sun(); TH_LK.fill.value = LOOK.levelE && s ? .8 * LOOK.levelE() : .8 * Math.max(.35, s ? s.intensity * Math.max(0, s.dir.y) + .2 : 1);   // 80 percent of the light on open ground now, at any hour (the eye's adaptation keeps a night view readable)
  TH_LEAFU.fill.value = TH_LEAFU.k * TH_LK.fill.value / .8; TH_COAT.fill.value = TH_COAT.k * TH_LK.fill.value / .8;   // the crown's own scattered light (thLkLeafFill), following the day
}
if (TH_LK.on) { for (const k in TH_KINDS) if (!LOOK.KINDS[k]) LOOK.KINDS[k] = TH_KINDS[k]; const b0 = LOOK.busy; LOOK.busy = () => b0() + TH_LK.pend.size; }
function thModelNote(def) { return (TH_LK.on && (LOOK.quality === 'high' ? def.look_model_note : def.look_model_note_low)) || def.model_note || ''; }   // under the look a thing may say what the look adds (the oak's leaf clusters)
function thLkTrack(pr) { TH_LK.pend.add(pr); const done = () => TH_LK.pend.delete(pr); pr.then(done, done); return pr; }
/* what the things' surfaces still have to fetch (tests wait on it, with LOOK.ready) */
function thLkReady() { return TH_LK.pend.size ? Promise.all([...TH_LK.pend].map(p => p.catch(() => null))).then(thLkReady) : Promise.resolve(true); }
function thLkFlat(r, g, b) { const cv = document.createElement('canvas'); cv.width = cv.height = 2; const x = cv.getContext('2d'); x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, 2, 2); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function thLkImg(file) { return new Promise((res, rej) => (TH_LK.ld || (TH_LK.ld = new THREE.ImageLoader())).load('assets/look/' + file, res, undefined, () => { console.warn('look: texture', file); rej(); })); }
/* a colour map as DETAIL, as the foundation's own sets are: each channel scaled to a mean of one half (the shader doubles it), so the
   part keeps the colour its data gives and takes the photograph's variation (DESIGN 3.5). `mask`: only where it is opaque counts. */
function thLkDetail(img, mask, grid) {   // grid [columns, rows]: an atlas, each cell scaled to the same mean (one photographed leaf does not carry its own hue into the crown)
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, cv.width, cv.height), a = d.data, W = cv.width, H = cv.height, gc = grid ? grid[0] : 1, gr = grid ? grid[1] : 1;
  let mk = null; if (mask) { const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const y = c2.getContext('2d'); y.drawImage(mask, 0, 0, cv.width, cv.height); mk = y.getImageData(0, 0, cv.width, cv.height).data; }
  const cell = i => { const p = i >> 2, px = p % W, py = (p / W) | 0; return Math.min(gr - 1, (py * gr / H) | 0) * gc + Math.min(gc - 1, (px * gc / W) | 0); };
  const m = [], n = []; for (let c = 0; c < gc * gr; c++) { m.push([0, 0, 0]); n.push(0); }
  for (let i = 0; i < a.length; i += 4) { if (mk && mk[i] < 128) continue; const c = cell(i); m[c][0] += a[i]; m[c][1] += a[i + 1]; m[c][2] += a[i + 2]; n[c]++; }
  const k = m.map((mc, c) => mc.map(v => 127.5 / Math.max(1, v / Math.max(1, n[c]))));
  for (let i = 0; i < a.length; i += 4) { const kc = k[cell(i)]; a[i] = Math.min(255, a[i] * kc[0]); a[i + 1] = Math.min(255, a[i + 1] * kc[1]); a[i + 2] = Math.min(255, a[i + 2] * kc[2]); if (mk) a[i + 3] = mk[i]; }
  x.putImageData(d, 0, 0); return cv;
}
function thLkSet(name) {
  if (TH_LK.sets[name]) return TH_LK.sets[name];
  const f = TH_SETS[name], s = TH_LK.sets[name] = { map: thLkFlat(128, 128, 128), normalMap: thLkFlat(128, 128, 255), size: f[2], bump: f[3] };
  s.map.anisotropy = s.normalMap.anisotropy = 8;
  thLkTrack(thLkImg(f[0]).then(im => { s.map.image = thLkDetail(im); s.map.needsUpdate = true; }).catch(() => { }));
  thLkTrack(thLkImg(f[1]).then(im => { s.normalMap.image = im; s.normalMap.needsUpdate = true; }).catch(() => { }));
  return s;
}
/* the photographed surface on one part, when it is first shown: laid on from three sides (the foundation's LK_TRI chunks) in the part's
   own metres; an instanced part is in the units of its one instance, so the scale is that of a typical instance, and it takes the colour
   detail only (DESIGN 3.6) */
function thLkApplySet(rec) {
  const name = rec.lkSet; rec.lkSet = null; const m = rec.g.userData.main.material; if (!m || !m.isMeshStandardMaterial || m.map || m.userData.pkBank) return;   // the pond's bank draws its own mud (levels_v2.js, pkbank)
  const s = thLkSet(name); m.map = s.map; m.defines = m.defines || {}; m.defines.LK_TRI = ((rec.lkUnit || 1) / s.size).toFixed(5);
  if (!rec.instanced) { m.normalMap = s.normalMap; m.normalScale.set(s.bump, s.bump); }
  m.needsUpdate = true;
}
/* texture coordinates round and up a trunk built as a grid of `cols` vertices per ring (oak.mjs barkGrid): u in bark pictures round
   the trunk (a whole number of them, so there is no seam), v in pictures up it. The bark's furrows then run along the trunk, as
   they grow, not along the world's axes. */
function thLkTrunkUV(geo, uvd, tile) {
  if (geo.attributes.uv) return; const p = geo.attributes.position, n = p.count, uv = new Float32Array(n * 2), cols = uvd.grid, rings = Math.floor(n / cols);
  for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); if (r < rings) { uv[i * 2] = c / (cols - 1) * uvd.round; } else { uv[i * 2] = uvd.round / 2; } uv[i * 2 + 1] = p.getY(i) / tile[1]; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
/* The oak's trunk under the look at the high level: relief, and moss only where it grows.
   - Relief: the bark photograph's own height map (Jolcham Oak Bark 01, Poly Haven, CC0: its displacement map, 1 x 2 m of bark) moves
     what the eye sees across the surface as a raised and fissured surface would (parallax occlusion mapping: the line of sight is
     stepped down into the bark until it meets the height, 12 steps and a final interpolation), and the deep fissures are a little
     darker (light reaches less far into them). Depth 2.5 cm from ridge to fissure floor: a judgement for a mature English oak, whose
     bark is "greyish-brown and closely grooved, with vertical plates" (Wikipedia, Quercus robur); faded out beyond 8 m, where it is
     smaller than a pixel. The silhouette stays the mesh's: parallax does not move the outline.
   - Moss: the photograph is a Korean oak's bark with moss in its fissures all over. On a tree, "the north side of trees ... will
     generally have more luxuriant moss growth on average than other sides", and mosses grow on "tree trunk bases" (Wikipedia, Moss):
     so the photograph's green is kept on the trunk's north side (the park's north, turned into the tree's own axes), at its base
     (fading out between 0.4 and 1.4 m) and deep in fissures, and elsewhere is turned to the bark's own grey-brown at the same lightness.
   The limbs keep the three-sided photograph (their own coordinates would need the generator to write them), without relief. */
const TH_BARK = { h: null, depth: .025, far: 8 };
function thLkBarkH() {
  if (TH_BARK.h) return TH_BARK.h; const t = thLkFlat(128, 128, 128); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  thLkTrack(thLkImg('jolcham_oak_bark_01_height_512.jpg').then(im => { t.image = im; t.needsUpdate = true; }));
  return TH_BARK.h = t;
}
function thParkNorth() {   // the park's north as a direction in the park's own axes (x east, y up, z south: world_common.js), from the frames
  if (TH_BARK.north) return TH_BARK.north; let n = new V3(0, 0, -1);
  try { if (typeof FR !== 'undefined' && FR.solar && FR.park) { const a = convertP(new V3(0, 0, 0), FR.solar, FR.park), b = convertP(new V3(0, 1e6, 0), FR.solar, FR.park), d = b.sub(a); d.y = 0; if (d.lengthSq() > 1e-12) n = d.normalize(); } } catch (e) { }
  return TH_BARK.north = n;
}
function thLkBarkRelief(m, T) {
  const north = thParkNorth().clone().applyQuaternion(T.qInv), F = x => x.toFixed(4), H = thLkBarkH();
  m.userData.thNorth = { value: north };
  LOOK.patch(m, 'thbarkpom', sh => {
    sh.uniforms.thBarkH = { value: H }; sh.uniforms.thNorthO = m.userData.thNorth;
    sh.vertexShader = 'varying vec3 vThON;\n' + sh.vertexShader.replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n\tvThON = objectNormal;');
    sh.fragmentShader = 'uniform sampler2D thBarkH;\nuniform vec3 thNorthO;\nvarying vec3 vThON;\nvec2 thPomUv;\nfloat thPomH;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', `{ vec3 thV = normalize( vViewPosition ), q0 = dFdx( -vViewPosition ), q1 = dFdy( -vViewPosition ); vec2 s0 = dFdx( vUv ), s1 = dFdy( vUv );
	  vec3 Nf = normalize( cross( q0, q1 ) ), q1p = cross( q1, Nf ), q0p = cross( Nf, q0 ); float D = dot( q0, q1p );
	  float fade = smoothstep( ${F(TH_BARK.far)}, ${F(TH_BARK.far * .5)}, length( vViewPosition ) ); vec2 dir = vec2( 0.0 );
	  if ( abs( D ) > 1e-14 ) { vec3 gu = ( q1p * s0.x + q0p * s1.x ) / D, gv = ( q1p * s0.y + q0p * s1.y ) / D; dir = vec2( dot( thV, gu ), dot( thV, gv ) ) / max( abs( dot( thV, Nf ) ), 0.35 ) * ${F(TH_BARK.depth)} * fade; }
	  vec2 du = dir / 12.0, uv = vUv, hit = vUv; float c = 1.0, h = texture2D( thBarkH, uv ).r, found = step( 1.0, h ), hh = h;
	  for ( int i = 0; i < 12; i ++ ) { vec2 un = uv - du; float cn = c - 1.0 / 12.0, hn = texture2D( thBarkH, un ).r, now = ( 1.0 - found ) * step( cn, hn ), a = c - h, b = hn - cn, t = a / max( a + b, 1e-4 );
	    hit = mix( hit, mix( uv, un, t ), now ); hh = mix( hh, mix( h, hn, t ), now ); found = max( found, now ); uv = un; c = cn; h = hn; }
	  thPomUv = mix( uv, hit, found ); thPomH = mix( mix( h, hh, found ), 1.0, 1.0 - fade ); }
#ifdef USE_MAP
	{ vec3 tc = pow( 2.0 * texture2D( map, thPomUv ).rgb, vec3( 0.4545 ) ); float l = dot( tc, vec3( 0.3, 0.55, 0.15 ) ), g = tc.g - max( tc.r, tc.b );
	  float y = vUv.y * 2.0, north = smoothstep( 0.05, 0.6, dot( normalize( vThON ), thNorthO ) ), base = smoothstep( 1.4, 0.4, y ), deep = smoothstep( 0.35, 0.1, thPomH );
	  float keep = clamp( max( max( north, base ), deep * 0.7 ), 0.0, 1.0 );
	  tc = mix( tc, l * vec3( 1.07, 0.98, 0.9 ), ( 1.0 - keep ) * smoothstep( 0.0, 0.06, g ) );
	  diffuseColor.rgb *= tc * mix( 0.72, 1.0, smoothstep( 0.05, 0.55, thPomH ) ); }
#endif`)
      .replace('#include <normal_fragment_maps>', THREE.ShaderChunk.normal_fragment_maps.split('texture2D( normalMap, vUv )').join('texture2D( normalMap, thPomUv )'));
  });
}
/* The oak's leaves: six photographed oak leaves (ambientCG LeafSet016, a 3 x 2 atlas, CC0) on the leaf cards, each card one of the six by
   a hash of its number, so neighbours differ. The photograph is detail (its outline, veins and variation); the colour stays the model's
   green. The middle distance's tufts are drawn from the same six leaves. At 512 px when the first leaves are shown (about 90 kB with the
   normal map); the 2048 px colour and outline (about 450 kB, each leaf about 680 x 1024 px) only once the camera is within `fine` metres
   of an oak it is looking at, so the park's views stay inside the download budget (DESIGN 3.14). */
const TH_LEAF = { p: null, atlas: null, rosette: null, fine: 12, pf: null, px: { value: 512 } };   // fine: within 12 m (the oak's own close view stands at about 9.3 m)
function thLkLeaves() {
  if (TH_LEAF.p) return TH_LEAF.p;
  TH_LEAF.atlas = thLkFlat(128, 128, 128); TH_LEAF.alpha = thLkFlat(255, 255, 255); TH_LEAF.normal = thLkFlat(128, 128, 255); TH_LEAF.rosette = thLkFlat(128, 128, 128); TH_LEAF.rosetteA = thLkFlat(255, 255, 255);
  TH_LEAF.p = thLkTrack(Promise.all([thLkImg('LeafSet016_color_512.jpg'), thLkImg('LeafSet016_opacity_512.jpg'), thLkImg('LeafSet016_normal_gl_512.jpg')]).then(([c, o, n]) => {
    /* colour and outline are two pictures: the colour opaque (round each leaf the mean grey, so filtering at the edge does not darken
       it), the outline the alpha map. A colour picture with an alpha channel would lose its colour where it is clear, and the leaf's
       edge would darken in the distance. */
    const cv = thLkDetail(c, o, [3, 2]), opaque = (src, w, h) => { const q = document.createElement('canvas'); q.width = w; q.height = h; const x = q.getContext('2d'); x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, w, h); x.drawImage(src, 0, 0, w, h); return q; };
    TH_LEAF.atlas.image = opaque(cv, cv.width, cv.height); TH_LEAF.atlas.needsUpdate = true; TH_LEAF.alpha.image = o; TH_LEAF.alpha.needsUpdate = true; TH_LEAF.normal.image = n; TH_LEAF.normal.needsUpdate = true;
    /* A tuft: a spray of about forty photographed leaves, as an oak's leaves crowd at the tips of its shoots, so that a crown seen from the
       middle distance has the mass of a real one and not a speckle with sky through every gap. The leaves are drawn back to front: those
       underneath are darker (shaded by the ones over them), and each differs a little in brightness and hue, as real leaves do (age, sun
       or shade leaf). Its outline stays ragged, made of leaf edges. */
    const S = 512, rc = document.createElement('canvas'), ra = document.createElement('canvas'); rc.width = rc.height = ra.width = ra.height = S; const g = rc.getContext('2d'), ga = ra.getContext('2d'); let sd = 7; const rn = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, S, S); ga.fillStyle = '#000'; ga.fillRect(0, 0, S, S);
    const NL = 110;   // dense enough that a crown of overlapping tufts is opaque but for its edge and a few gaps, as a July oak's is
    for (let k = 0; k < NL; k++) {
      const depth = k / (NL - 1), a = (rn() - .5) * 2 * Math.PI, rr = Math.sqrt(rn()) * .27, cx = S * (.5 + Math.cos(a) * rr), cy = S * (.55 + Math.sin(a) * rr * .85), len = S * (.26 + .1 * rn()), cell = Math.floor(rn() * 6);
      const turn = Math.atan2(cy - S * .62, cx - S * .5) + Math.PI / 2 + (rn() - .5) * 1.2;   // leaves point outward from the shoot
      g.filter = `brightness(${(.62 + .38 * depth) * (.9 + .2 * rn())}) hue-rotate(${Math.round((rn() - .5) * 8)}deg) saturate(${.85 + .3 * rn()})`;
      for (const [x, im] of [[g, cv], [ga, o]]) { x.save(); x.translate(cx, cy); x.rotate(turn); x.drawImage(im, (cell % 3) * im.width / 3, (1 - Math.floor(cell / 3)) * im.height / 2, im.width / 3, im.height / 2, -len * .33, -len * .5, len * .67, len); x.restore(); }
    }
    g.filter = 'none';
    TH_LEAF.rosette.image = rc; TH_LEAF.rosette.needsUpdate = true; TH_LEAF.rosetteA.image = ra; TH_LEAF.rosetteA.needsUpdate = true;
    { const d = ga.getImageData(0, 0, S, S).data; let c = 0; for (let i = 1; i < d.length; i += 4) c += d[i]; TH_LEAF.rosetteCov = Math.max(.02, c / (d.length / 4) / 255); }   // the share of a tuft's card that is leaf (about 8 percent)
    for (const t of [TH_LEAF.atlas, TH_LEAF.alpha, TH_LEAF.normal, TH_LEAF.rosette, TH_LEAF.rosetteA]) t.anisotropy = 4;
    /* each card shows its leaf filling it, as the drawn outline did: the leaf's own box in its cell, widened to the card's shape (0.7
       wide to 1 long), so the photograph is neither stretched nor left small in an empty margin */
    const R = document.createElement('canvas'), RW = 192, RH = 128; R.width = RW; R.height = RH; const rg = R.getContext('2d'); rg.drawImage(o, 0, 0, RW, RH); const A = rg.getImageData(0, 0, RW, RH).data;
    TH_LEAF.rects = [];
    for (let c = 0; c < 6; c++) {
      const cx = (c % 3) * RW / 3, cy = (1 - Math.floor(c / 3)) * RH / 2; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let y = cy; y < cy + RH / 2; y++) for (let x = cx; x < cx + RW / 3; x++) if (A[(y * RW + x) * 4] > 127) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); }
      if (x1 < 0) { x0 = cx; x1 = cx + RW / 3; y0 = cy; y1 = cy + RH / 2; }
      let w = x1 - x0, h = y1 - y0, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      if (w / h < .7) w = h * .7; else h = w / .7;
      const u0 = Math.max(0, (mx - w / 2) / RW), u1 = Math.min(1, (mx + w / 2) / RW), vTop = Math.max(0, (my - h / 2) / RH), vBot = Math.min(1, (my + h / 2) / RH);
      TH_LEAF.rects.push(new THREE.Vector4(u0, 1 - vBot, u1 - u0, vBot - vTop));
    }
    TH_LEAF.ok = true;
  }).catch(() => { }));
  return TH_LEAF.p;
}
function thLkLeavesFine() {   // the 2048 px colour and outline, in place of the 512 px ones (the tufts and the leaves' boxes stay as they are)
  if (TH_LEAF.pf || !TH_LEAF.ok) return;
  TH_LEAF.pf = thLkTrack(Promise.all([thLkImg('LeafSet016_color_2k.jpg'), thLkImg('LeafSet016_opacity_2k.jpg')]).then(([c, o]) => {
    const cv = thLkDetail(c, o, [3, 2]), q = document.createElement('canvas'); q.width = cv.width; q.height = cv.height; const x = q.getContext('2d'); x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, q.width, q.height); x.drawImage(cv, 0, 0);
    TH_LEAF.atlas.image = q; TH_LEAF.atlas.needsUpdate = true; TH_LEAF.alpha.image = o; TH_LEAF.alpha.needsUpdate = true; TH_LEAF.px.value = o.width;
  }).catch(() => { }));
}
/* An oak's leaves grow in clusters: alternate on the shoot but crowded at its tip, five or so radiating from almost one point (Q. robur:
   leaves 10 to 12 cm, on a stalk of 2 to 3 mm; Wikipedia, "Quercus robur"). The model places about 18,700 leaves, one card each, along its
   shoots; under the realistic look at the high level each of them is drawn as such a cluster (the card itself and four more from the same
   node, fanned round it, a little smaller, each one of the six photographed leaves), about 93,000 leaves near the eye. A real mature oak
   has a few hundred thousand: the crown is still thinner than a real one, and the model's note says the count is illustrative.
   Only on the oak being looked at (thLkSprayWrap).
   Two triangles for each added leaf (the card's fold is kept on the first). One geometry for every oak (all placements share it). */
const TH_SPRAY = [[0, 0, 0, 1, 0, 0], [52, -30, 26, .9, -.008, .006], [-58, 28, -30, .86, -.014, .012], [118, 34, 38, .78, -.02, -.008], [-124, -32, -34, .8, -.005, .016]];   // degrees about the leaf's normal (fan), its length (twist), its width (tilt: out of the card's plane, so a cluster is a rosette in depth and not a pile); scale; offset along it and off its face (m)
function thLkSpray(geo, key) {
  const c = TH_LEAF.spray || (TH_LEAF.spray = {}); if (c[key]) return c[key];
  geo.computeBoundingBox(); const b = geo.boundingBox, P = geo.attributes.position, UV = geo.attributes.uv, I = geo.index, pos = [], uv = [], sub = [], idx = [];
  const corners = [[b.min.x, b.min.y, 0, 0, 0], [b.max.x, b.min.y, 0, 1, 0], [b.max.x, b.max.y, -.012, 1, 1], [b.min.x, b.max.y, -.012, 0, 1]], M = new THREE.Matrix4(), E = new THREE.Euler(), v = new V3();
  TH_SPRAY.forEach(([fz, ty, tx, sc, oy, oz], k) => {
    M.makeRotationFromEuler(E.set(tx * Math.PI / 180, ty * Math.PI / 180, fz * Math.PI / 180, 'ZYX')).scale(v.set(sc, sc, sc)).setPosition(0, oy, oz);
    const base = pos.length / 3;
    if (k === 0) { for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); pos.push(v.x, v.y, v.z); uv.push(UV.getX(i), UV.getY(i)); sub.push(0); } for (let i = 0; i < I.count; i++) idx.push(I.getX(i)); return; }
    for (const q of corners) { v.set(q[0], q[1], q[2]).applyMatrix4(M); pos.push(v.x, v.y, v.z); uv.push(q[3], q[4]); sub.push(k); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('thSub', new THREE.Float32BufferAttribute(sub, 1)); g.setIndex(idx); g.computeVertexNormals();
  for (const n in geo.attributes) if (geo.attributes[n].isInstancedBufferAttribute) g.setAttribute(n, geo.attributes[n]);   // per-leaf values already made (occlusion)
  g.boundingSphere = geo.boundingSphere ? geo.boundingSphere.clone() : null; if (g.boundingSphere) g.boundingSphere.radius *= 1.6;
  g.userData.thCardN = I.count;   // the first card's indices: drawn alone where the clusters are not (see thLkSprayWrap)
  return c[key] = g;
}
/* The clusters cost triangles (twelve a leaf position, against four): they are drawn on the oak being looked at, and its other placements
   draw the first card of each only (the same geometry, a shorter draw range), so 19 oaks in view stay inside the frame budget. Each
   placement has its own geometry object over the shared buffers, so its draw range is its own. */
function thLkSprayWrap(geo) {
  const g = new THREE.BufferGeometry(); for (const n in geo.attributes) g.setAttribute(n, geo.attributes[n]); g.setIndex(geo.index);
  g.boundingSphere = geo.boundingSphere; g.boundingBox = geo.boundingBox; g.userData.thCardN = geo.userData.thCardN; return g;
}
/* A crown is lit as a volume, not as a scatter of cards: a leaf on its sunlit side is bright, one in a shaded hollow between clumps dark.
   Each leaf's shading normal is turned part of the way (TH_VOL, near leaves; more for the tufts, which stand for whole sprays) toward the
   outward direction of the clump of foliage it belongs to (the model's own clumps: the leafy shoots gathered on a 1.5 m grid, the same
   that once drew the far crown), mixed with the outward direction of the whole crown. Real foliage scatters light much like this: the
   light a crown reflects follows its outer surface far more than the angle of any one leaf (an approximation, used by most renderers of
   trees). The card's own normal and its photographed relief stay in the rest of the mix. */
const TH_VOL = { leaf: .5, tuft: .8 };
function thLkVolume(rec, geo, T) {
  if (geo.attributes.thVolN) return; const im = rec.g, n = im.count, M = im.instanceMatrix.array, out = new Float32Array(n * 3);
  let cx = 0, cy = 0, cz = 0; for (let i = 0; i < n; i++) { cx += M[i * 16 + 12]; cy += M[i * 16 + 13]; cz += M[i * 16 + 14]; } cx /= n; cy /= n; cz /= n;
  let rx = 0, ry = 0, rz = 0; for (let i = 0; i < n; i++) { rx = Math.max(rx, Math.abs(M[i * 16 + 12] - cx)); ry = Math.max(ry, Math.abs(M[i * 16 + 13] - cy)); rz = Math.max(rz, Math.abs(M[i * 16 + 14] - cz)); }
  const CL = T && T.bundle.instances.clumps ? thInst(T.bundle, 'clumps') : null, cl = [];
  if (CL) for (let j = 0; j < CL.n; j++) cl.push([CL.t[j * CL.stride], CL.t[j * CL.stride + 1], CL.t[j * CL.stride + 2]]);
  const v = new V3(), w = new V3();
  for (let i = 0; i < n; i++) {
    const x = M[i * 16 + 12], y = M[i * 16 + 13], z = M[i * 16 + 14];
    v.set((x - cx) / (rx * rx || 1), (y - cy) / (ry * ry || 1), (z - cz) / (rz * rz || 1)).normalize();
    if (cl.length) { let best = 1e9, b = null; for (const c of cl) { const d = (x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2; if (d < best) { best = d; b = c; } } w.set(x - b[0], y - b[1] + .25, z - b[2]); if (w.lengthSq() > 1e-8) v.multiplyScalar(.45).add(w.normalize().multiplyScalar(.55)).normalize(); }
    out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z;
  }
  geo.setAttribute('thVolN', new THREE.InstancedBufferAttribute(out, 3));
}
function thLkApplyLeaves(rec) {
  thLkLeaves(); if (!TH_LEAF.ok) return;   // the drawn leaf stays until the photographs have arrived
  const cluster0 = rec.pd.card.kind === 'leaf_cluster', T = rec.lkT;
  const spray0 = !cluster0 && LOOK.quality === 'high' && !rec.g.userData.keptIdx;
  if (spray0) rec.g.geometry = thLkSpray(rec.g.geometry, T.def.id + ':' + rec.pd.instances);
  rec.lkLeaf = null; const m = rec.g.userData.main.material, geo = rec.g.geometry, cluster = cluster0;
  thLkVolume(rec, geo, T);
  { const W = (cluster ? TH_VOL.tuft : TH_VOL.leaf).toFixed(2), spray = !!geo.attributes.thSub;
    LOOK.patch(m, 'thleafvol', sh => {
      sh.vertexShader = 'attribute vec3 thVolN;\nvarying vec3 vThVol;\n' + sh.vertexShader.replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n\tvThVol = normalize( normalMatrix * thVolN );');
      sh.fragmentShader = 'varying vec3 vThVol;\n' + sh.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
	{ float thBack = 0.0;   // a leaf lit from behind keeps its own normal: the light through it is the card's, not the crown's
	#if NUM_DIR_LIGHTS > 0
	  thBack = smoothstep( 0.0, 0.25, - dot( normal, directionalLights[ 0 ].direction ) );
	#endif
	  normal = normalize( mix( normal, vThVol, ${W} * ( 1.0 - thBack ) ) ); }`);
      if (spray) sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	#ifdef USE_INSTANCING
	if ( mod( floor( thCell + 0.5 ), 2.0 ) > 0.5 ) { transformed.x = -transformed.x; }   // half the clusters mirrored, so they do not repeat
	#endif`);
    }); }
  m.map = cluster ? TH_LEAF.rosette : TH_LEAF.atlas; m.alphaMap = cluster ? TH_LEAF.rosetteA : TH_LEAF.alpha; if (!m.userData.thx2) { m.userData.thx2 = true; m.color.multiplyScalar(2); }   // the detail's mean is one half: twice the colour keeps the leaf its own green (as the foundation's sets do)
  thLkLeafLight(m, rec, cluster); thLkFaceView(m);
  /* a cut-out seen from afar: the outline's mipmaps average leaf and gap, and with a fixed threshold the leaves thin away to nothing with
     distance (a crown turns to a few specks). The alpha is raised with the mip level the texture is read at, so a leaf keeps its share of
     the card at every distance (coverage-preserving alpha test). */
  /* A tuft is a sparse card (about 8 percent leaf): seen from a few hundred metres it is a pixel or two, read at the coarsest mip levels,
     where its alpha is the 8 percent average, and the test drops every tuft: the far tier's crowns vanished and left bare limbs. Beyond
     mip 5 the alpha is raised faster, so that at the coarsest level a tuft's average passes: a crown of thousands of overlapping tufts
     then reads as the dense mass a real oak's crown is from afar, not as a set of sticks. */
  const thTopK = Math.max(0, (.6 / (TH_LEAF.rosetteCov || .08) - 1 - 9 * .3) / 16);
  m.extensions = Object.assign(m.extensions || {}, { derivatives: true });
  LOOK.patch(m, 'thleafmip', sh => {
    sh.uniforms.thLeafPx = cluster ? { value: 512 } : TH_LEAF.px;   // the outline's size in pixels (the leaves' grows when the 2048 px one arrives)
    sh.fragmentShader = 'uniform float thLeafPx;\n' + sh.fragmentShader.replace('#include <alphamap_fragment>', `#include <alphamap_fragment>
	#ifdef USE_ALPHAMAP
	{ vec2 thT = vUv * thLeafPx; vec2 thDx = dFdx( thT ), thDy = dFdy( thT ); float thMip = max( 0.0, 0.5 * log2( max( dot( thDx, thDx ), dot( thDy, thDy ) ) ) );
	  diffuseColor.a *= 1.0 + max( 0.0, thMip - ${cluster ? '0.0' : '1.0'} ) * 0.3${cluster ? ` + pow( max( 0.0, thMip - 5.0 ), 2.0 ) * ${thTopK.toFixed(4)}` : ''}; }
	#endif`);
  });
  if (!cluster) {
    if (!geo.attributes.thCell) { const n = rec.g.count, c = new Float32Array(n); for (let i = 0; i < n; i++) { let h = Math.imul(i + 1, 2654435761) >>> 0; h ^= h >>> 15; c[i] = h % 6; } geo.setAttribute('thCell', new THREE.InstancedBufferAttribute(c, 1)); }
    m.normalMap = TH_LEAF.normal; m.normalScale.set(.6, .6);
    const spray = !!geo.attributes.thSub;
    LOOK.patch(m, 'thleafatlas', sh => { sh.uniforms.thRect = { value: TH_LEAF.rects }; sh.vertexShader = 'attribute float thCell;\n' + (spray ? 'attribute float thSub;\n' : '') + 'uniform vec4 thRect[6];\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n\t{ vec4 r = thRect[int( mod( thCell' + (spray ? ' + thSub * 5.0' : '') + ' + 0.5, 6.0 ) )]; vUv = r.xy + vUv * r.zw; }'); });
    if (spray0) { rec.g.geometry = thLkSprayWrap(geo); rec.lkSprayN = geo.userData.thCardN; }   // after every shared attribute is on the shared geometry
  }
  m.needsUpdate = true;
}
/* Light in a crown (both leaf looks):
   - the photograph is detail with a mean of one half (the colour is doubled to match); it is applied so that its variation is
     proportional in linear light (the colour is converted to linear light after it, so a detail multiplied in plainly would have its
     contrast raised to the power 2.2, and the pale parts of a leaf would bleach to white in sunlight);
   - each leaf differs a little in brightness and hue (thTint, a hash of its number), as sun and shade leaves and old and young ones do;
   - light comes through a leaf from behind in a bright yellow-green: chlorophyll absorbs red and blue, so what a leaf passes is
     mostly green with some yellow (a leaf transmits about as much green light as it reflects); the veins are thicker and show dark
     against the light. The photograph's own detail (its veins are paler than the blade in reflected light) is taken out of the light
     through, and the veins are darkened in it instead;
   - a card seen within about 15 degrees of edge-on thins out and is gone: a real leaf seen edge-on is a line a fraction of a millimetre
     thick, while a card's photograph smeared along its length into a streak;
   - a leaf in the shadow of others still gets 30 percent of the Sun's light: the light that comes through the leaves above and through
     the small gaps between them, which one shadow map of whole leaves cannot see (within a crown, light falls to about a tenth to a
     third of open sky: an approximation, not a model of the canopy);
   - every leaf of a crown also takes the light the crown's own leaves scatter and pass on (the green they reflect and transmit), and
     the sky's light through its gaps, beyond what the environment gives the card's own direction: a fill of `fill` times the light
     on open ground now (TH_LEAFU.fill, following the day). Without it the shaded side of a crown in sunshine went near black, darker
     than the shaded leaves in photographs of oaks (Baginton, July: #3d4f2a). A judgement. (A shaded inner mass of round clumps was tried in its place and showed as balls at every distance.) */
const TH_LEAFU = { thin: { value: new V3(.7, 1.1, .1) }, shf: { value: .3 }, fill: { value: .35 }, k: .4, tuft: 1.3 };
function thLkLeafFill(sh) {   // the crown's scattered light (see above): a fill on the leaves' diffuse light
  sh.uniforms.uThCrownFill = TH_LEAFU.fill;
  sh.fragmentShader = 'uniform float uThCrownFill;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
	reflectedLight.indirectDiffuse += material.diffuseColor * uThCrownFill;`);
}
function thLkLeafLight(m, rec, cluster) {   // cluster: a tuft card (a spray of leaves at all angles: no edge-on fade)
  if (m.userData.thLeafLight) return; m.userData.thLeafLight = true;
  const geo = rec.g.geometry, n = rec.g.count;
  if (!geo.attributes.thTint) { const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { let h = Math.imul(i + 7, 2246822519) >>> 0; h ^= h >>> 13; const b = .92 + .16 * ((h & 1023) / 1023), y = ((h >>> 10) & 1023) / 1023 - .5; c[i * 3] = b * (1 + .08 * y); c[i * 3 + 1] = b; c[i * 3 + 2] = b * (1 - .1 * y); } geo.setAttribute('thTint', new THREE.InstancedBufferAttribute(c, 3)); }   // a small spread: July leaves differ little in hue
  const thin = LOOK.part('sss') && m.defines && m.defines.LK_THIN;
  if (thin) m.defines.LK_THIN = 'thThinV';
  m.extensions = Object.assign(m.extensions || {}, { derivatives: true });
  LOOK.patch(m, 'thleaflight' + (cluster ? 'c' : ''), sh => {
    sh.uniforms.uThThin = TH_LEAFU.thin; sh.uniforms.uThShF = TH_LEAFU.shf;
    sh.vertexShader = 'attribute vec3 thTint;\nvarying vec3 vThTint;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvThTint = thTint;' + (cluster ? `\n\ttransformed.xy *= ${TH_LEAFU.tuft.toFixed(2)};` : ''));   // a tuft stands for a whole spray: drawn larger, so a crown of them closes as a July oak's does
    sh.fragmentShader = 'varying vec3 vThTint;\nuniform vec3 uThThin;\nuniform float uThShF;\nvec3 thThinV = vec3( 0.0 );\n' + sh.fragmentShader
      .replace('#include <shadowmap_pars_fragment>', THREE.ShaderChunk.shadowmap_pars_fragment.replace('float getShadow(', `float thShadow0( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord );
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) { return max( uThShF, thShadow0( shadowMap, shadowMapSize, shadowBias, shadowRadius, shadowCoord ) ); }
	float thShadow0(`))
      .replace('#include <map_fragment>', `float thDet = 1.0;
	#ifdef USE_MAP
	{ vec4 texelColor = texture2D( map, vUv ); vec3 thD = pow( 2.0 * texelColor.rgb, vec3( .4545 ) ); thDet = max( dot( thD, vec3( .2126, .7152, .0722 ) ), .35 ); diffuseColor.rgb *= .5 * thD; }
	#endif
	diffuseColor.rgb *= vThTint;
	#ifdef USE_MAP
	{ float thRel = dot( texture2D( map, vUv ).rgb, vec3( .2126, .7152, .0722 ) ) * 2.0; thThinV = uThThin * clamp( 1.0 - 2.6 * ( thRel - 1.0 ), .18, 1.15 ) / thDet; }
	#else
	thThinV = uThThin;
	#endif`)
      .replace('#include <alphatest_fragment>', cluster ? '#include <alphatest_fragment>' : `{ vec3 thG = normalize( cross( dFdx( vViewPosition ), dFdy( vViewPosition ) ) ); float thE = abs( dot( thG, normalize( vViewPosition ) ) );
	  diffuseColor.a *= 2.0 * smoothstep( 0.17, 0.3, thE ); }   // the outline erodes, then the card is gone (a screen dither drew hatched bands)
#include <alphatest_fragment>`);
  });
  LOOK.patch(m, 'thleaffill', thLkLeafFill);
}
/* Shells: a short coat (the dog's undercoat, the ears' short hair, a moss cushion's shoots) under the realistic look, at the high level only:
   o.n copies of the surface pushed out along its normal, each keeping the strands that reach it (a strand's height is a hash of where it
   grows, strands o.cell apart), darker at the root where less light gets in. One draw call of o.n instances of the mesh, while the thing
   is what the view is of and within o.near metres; shown only while the part is fully opaque, and it casts no shadow of its own.
   o.comb: the direction the coat lies (in the model's axes): each shell is pushed a little further along it than the one below, so the
   hairs lean and lie over, nose to tail, instead of standing straight out; the strands are longer along it than across (the lie of the
   coat). o.lenAt(v): the length factor where a vertex is (shorter hair on a dog's face and legs). o.bare: geometries the strands must not
   pass through: they thin to nothing within o.bareR of any of their vertices (the nose leather; the ears, which lie on the head).
   o.both: strands on both faces (a thin double-sided part, an ear). */
/* A Labrador's coat (breed standard, The Royal Kennel Club, "Retriever (Labrador)": "short dense without wave or feathering, giving fairly
   hard feel to the touch; weather-resistant undercoat"; yellows "range from light cream to fox red"). Seen in photographs it lies flat and
   smooth, follows the form like a skin, shows fine streaks along the lie of the hair and a soft sheen across it, and is fuzzy only at
   the outline. Under the realistic look:
   - the hair's direction is a field over the body (TH_DOGCOMB, model axes, x toward the nose): nose to tail on the head, neck and body,
     down the legs, along the tail toward its tip; it is the same for the skin's own surface, the shells and the sheen;
   - the shells are short (7 mm, a judgement: the coat is short, and its hairs lie at a low angle) and are pushed far along that direction,
     so the strands lie over each other like the real coat, instead of standing up as velvet;
   - the strands are long thin streaks along it (cells about 0.9 mm across and 8 mm along), and the skin underneath carries the same streaks;
   - a hair reflects light in a cone round its own axis, not round the surface's normal (Kajiya and Kay, 1989, "Rendering fur with three
     dimensional textures", SIGGRAPH): a narrow highlight across the lie of the coat, added to the Sun's light (it is shadowed with it);
   - the colour is darker and redder on the back, the ears and the top of the head, paler on the legs, chest and belly (photographs of
     yellow Labradors; the drawn single colour is the mean).
   A cue, not a simulation of each hair: the real coat has many thousands of hairs to a square centimetre. */
const TH_DOGCOMB = `vec3 thComb( vec3 p ) {
	vec3 c = vec3( -1.0, -0.12, 0.0 );
	c = mix( c, vec3( -0.15, -1.0, 0.0 ), smoothstep( 0.34, 0.24, p.y ) * step( -0.42, p.x ) );   // the legs: down
	c = mix( c, vec3( -1.0, -0.75, 0.0 ), smoothstep( -0.36, -0.42, p.x ) * smoothstep( 0.3, 0.38, p.y ) );   // the tail: toward its tip
	c = mix( c, vec3( -0.4, -1.0, 0.0 ), smoothstep( 0.4, 0.3, p.y ) * smoothstep( -0.1, 0.05, p.x ) * smoothstep( 0.1, 0.2, p.x ) );   // the chest: down
	return normalize( c ); }
float thDogPig( vec3 p, vec3 n ) {   // pigment: 1 on the flank; darker and warmer on the back and the crown, paler low down
	float back = smoothstep( 0.2, 0.9, n.y ) * smoothstep( 0.36, 0.48, p.y ), low = smoothstep( 0.3, 0.12, p.y ) + 0.6 * smoothstep( 0.0, -0.8, n.y );
	return 1.0 - 0.13 * back + 0.07 * clamp( low, 0.0, 1.0 ); }`;
const TH_EARCOMB = `vec3 thComb( vec3 p ) { return normalize( vec3( -0.25, -1.0, 0.0 ) ); }   // an ear's hair lies down it, toward its tip
float thDogPig( vec3 p, vec3 n ) { return 1.0; }`;
const TH_SHEEN = { k: .26, e: 40 };   // the sheen's strength and narrowness (judged against photographs of a yellow Labrador in sun)
function thLkHairChunks(sh, field, o) {   // shared by the coat's skin and its shells: field direction, streaks, sheen, pigment (and the lips, where the geometry has them)
  const F = x => x.toFixed(4);
  if (o.feet) {   // the lips' pigment and the parting between the toes, from the object position (see thLkDogFeet)
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
	{ float thRim = max( thEyeRim( vThOp ), thLipF( vThOp ) ); reflectedLight.indirectSpecular *= 1.0 - thRim; reflectedLight.directSpecular *= 1.0 - thRim; }   // bare, matte skin: no sheen of hair or sky on the lids' margin and the lips`);
    sh.uniforms.thToeG = { value: o.feet }; sh.uniforms.thEye = { value: TH_LK.eye || new THREE.Vector4(0, 0, 0, -1) };
    sh.fragmentShader = 'uniform vec4 thToeG[12];\nuniform vec4 thEye;\n' + TH_DOGFEET + '\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.075, 0.045, 0.04 ), max( thLipF( vThOp ), thEyeRim( vThOp ) ) ) * ( 1.0 - 0.35 * thToeF( vThOp ) ) * ( 1.0 - 0.3 * thLipS( vThOp ) );`).replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	{ float h = -0.0025 * thToeF( vThOp ); vec3 sx = dFdx( -vViewPosition ), sy = dFdy( -vViewPosition ), thR1 = cross( sy, normal ), thR2 = cross( normal, sx ); float det = dot( sx, thR1 );
	  vec2 dh = vec2( dFdx( h ), dFdy( h ) ); normal = normalize( abs( det ) * normal - sign( det ) * ( dh.x * thR1 + dh.y * thR2 ) ); }`);
  }
  sh.vertexShader = 'varying vec3 vThT;\nvarying vec3 vThB;\nvarying vec3 vThTv;\nvarying vec3 vThOp;\nvarying vec3 vThOn;\n' + field + '\n' + sh.vertexShader.replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
	{ vec3 thN0 = normalize( objectNormal ), thC0 = thComb( position ); vec3 thT0 = normalize( thC0 - thN0 * dot( thC0, thN0 ) + 1e-5 );
	  vThT = thT0; vThB = normalize( cross( thN0, thT0 ) ); vThTv = normalize( normalMatrix * thT0 ); vThOp = position; vThOn = thN0; }`);
  sh.fragmentShader = 'varying vec3 vThT;\nvarying vec3 vThB;\nvarying vec3 vThTv;\nvarying vec3 vThOp;\nvarying vec3 vThOn;\nuniform float uThSheen;\n' + field + `
float thHH( vec3 p ) { return fract( sin( dot( p, vec3( 12.9898, 78.233, 45.164 ) ) ) * 43758.5453 ); }
` + sh.fragmentShader.replace('void main() {', `void thSheenAdd( const in IncidentLight dl, const in GeometricContext g, inout ReflectedLight rl ) {
	vec3 H = normalize( dl.direction + g.viewDir ); float th = dot( vThTv, H ), s = pow( max( 0.0, 1.0 - th * th ), ${F(o.e || TH_SHEEN.e)} * 0.5 );
	rl.directSpecular += dl.color * s * uThSheen * smoothstep( -0.1, 0.3, dot( g.normal, dl.direction ) ); }
void main() {`).replace('#include <map_fragment>', `#include <map_fragment>
	{ vec3 thQ = vec3( dot( vThOp, vThT ) / ${F(o.cell * o.stretch)}, dot( vThOp, vThB ) / ${F(o.cell)}, dot( vThOp, vThOn ) / ${F(o.cell * 4.0)} );
	  /* each column of hairs starts at its own place along the lie and has its own length (a fixed grid drew wood grain, stepped at the
	     pixel), and a hair is lighter along its middle than at its sides */
	  float thCol = floor( thQ.y ), thK = 0.7 + 0.6 * thHH( vec3( thCol, 3.1, 0.0 ) ); thQ.x = thQ.x / thK + thHH( vec3( thCol, 5.7, floor( thQ.z ) ) ) * 9.0;
	  float thS = thHH( floor( thQ ) ) * 0.55 + thHH( floor( thQ * vec3( 0.5, 0.5, 1.0 ) + 7.1 ) ) * 0.45, thPf = 1.0 - 2.0 * abs( fract( thQ.y ) - 0.5 );
	  diffuseColor.rgb *= thDogPig( vThOp, vThOn ) * ( 0.92 + 0.12 * thS ) * ( 0.95 + 0.08 * thPf ); }`)
    .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.split('RE_Direct( directLight, geometry, material, reflectedLight );').join('RE_Direct( directLight, geometry, material, reflectedLight ); thSheenAdd( directLight, geometry, reflectedLight );'));
  sh.uniforms.uThSheen = { value: o.sheen ?? TH_SHEEN.k };
}
const TH_FUR = { n: 12, len: .016, cell: .0015, near: 4, comb: [-1, -.32, 0], lean: .9, stretch: 2.6, root: .62, tip: 1.12 };   // the dog: 16 mm deep, as long as the model's fur blades (tools/things/models/dog_detail.mjs); drawn within 4 m of it
const TH_FUR_NEAR = TH_FUR.near;
function thLkFur(rec, geo, o) {
  o = Object.assign({}, TH_FUR, o);
  if (!geo.attributes.thHair) {
    const P = geo.attributes.position, h = new Uint8Array(P.count), v = new V3(), w = new V3(), pts = [];
    for (const g of (o.bare || []).filter(Boolean)) { const Q = g.attributes.position, step = Math.max(1, Math.floor(Q.count / 1500)); for (let j = 0; j < Q.count; j += step) pts.push(new V3().fromBufferAttribute(Q, j)); }
    const R = o.bareR || .04;
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); let d = 1e9; for (const q of pts) { const e = q.distanceToSquared(v); if (e < d) d = e; } let f = pts.length ? Math.max(0, Math.min(1, (Math.sqrt(d) - R * .15) / R)) : 1; if (o.lenAt) f *= o.lenAt(v); h[i] = Math.round(Math.max(0, Math.min(1, f)) * 255); }
    geo.setAttribute('thHair', new THREE.BufferAttribute(h, 1, true));
  }
  const N = o.both ? o.n * 2 : o.n;
  if (!geo.attributes.thLayer) { const a = new Float32Array(N); for (let i = 0; i < N; i++) a[i] = ((i % o.n) + 1) / o.n * (i >= o.n ? -1 : 1); geo.setAttribute('thLayer', new THREE.InstancedBufferAttribute(a, 1)); }
  const m0 = rec.g.userData.main.material, m = new THREE.MeshStandardMaterial({ color: m0.color, vertexColors: m0.vertexColors, roughness: m0.roughness, metalness: 0, side: o.both ? THREE.DoubleSide : THREE.FrontSide });
  LOOK.selMark(m, m0);   // the shells show the coat's selection with it
  m.clippingPlanes = m0.clippingPlanes; if (m0.defines && m0.defines.LK_SSS) m.defines = { LK_SSS: m0.defines.LK_SSS };
  const c = o.comb ? new V3(...o.comb).normalize() : null, F = x => x.toFixed(4), st = o.comb ? o.stretch : 1;
  if (o.field) {   // the dog's coat: the hair follows a field over the body (see TH_DOGCOMB); its shells lie far over along it
    LOOK.patch(m, 'thfurf' + o.cell + (o.feet ? 'f' : ''), sh => {
      thLkHairChunks(sh, o.field, o);
      sh.vertexShader = 'attribute float thLayer;\nattribute float thHair;\nvarying float vThL;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	{ float thA = abs( thLayer ); vThL = thA / max( thHair, 1e-3 ); vec3 thN = normalize( objectNormal ), thC = thComb( position ); thC = normalize( thC - thN * dot( thC, thN ) + 1e-5 );
	  transformed += thN * thA * thHair * ${F(o.len)} + thC * thA * thA * thHair * ${F(o.len * o.lean)}; }`);
      sh.fragmentShader = 'varying float vThL;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	{ vec3 q = vec3( dot( vThOp, vThT ) / ${F(o.cell * o.stretch)}, dot( vThOp, vThB ) / ${F(o.cell)}, dot( vThOp, vThOn ) / ${F(o.cell * 3.0)} );
	  q.x = q.x / ( 0.7 + 0.6 * thHH( vec3( floor( q.y ), 3.1, 0.0 ) ) ) + thHH( vec3( floor( q.y ), 5.7, floor( q.z ) ) ) * 9.0;   // staggered columns, as on the skin
	  vec3 c = floor( q ), f = fract( q ) - .5;
	  float h = thHH( c ), r = abs( f.y - ( thHH( c + 2.9 ) - .5 ) * .5 );
	  if ( h < vThL || r > .45 * ( 1.0 - vThL ) + .06 ${o.feet ? '|| thLipF( vThOp ) > 0.3 || thEyeRim( vThOp ) > 0.5 || thToeF( vThOp ) > 0.6 + 0.3 * h' : ''} ) discard;
	  diffuseColor.rgb *= mix( ${F(o.root)}, ${F(o.tip)}, vThL ); }`);
    });
  } else
  LOOK.patch(m, 'thfur' + (c ? 'c' : '') + (o.both ? 'b' : '') + o.cell, sh => {
    sh.vertexShader = 'attribute float thLayer;\nattribute float thHair;\nvarying float vThL;\nvarying vec3 vThP;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	{ float thA = abs( thLayer ); vThL = thA / max( thHair, 1e-3 ); vThP = position; vec3 thN = normalize( objectNormal ) * sign( thLayer );
	  transformed += thN * thA * thHair * ${F(o.len)};` + (c ? `
	  vec3 thC = vec3( ${F(c.x)}, ${F(c.y)}, ${F(c.z)} ); thC = normalize( thC - thN * dot( thC, thN ) + 1e-5 ); transformed += thC * thA * thA * thHair * ${F(o.len * o.lean)};` : '') + ' }');
    sh.fragmentShader = `varying float vThL; varying vec3 vThP;
float thFH(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
` + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	{ vec3 q = vThP / vec3( ${F(o.cell * st)}, ${F(o.cell)}, ${F(o.cell)} ), c = floor( q ), f = fract( q ) - .5; float h = thFH( c ), r = length( ( f - ( vec3( thFH( c + 1.3 ), thFH( c + 2.9 ), thFH( c + 4.1 ) ) - .5 ) * .5 ) * vec3( 1.0 / ${F(st)}, 1.0, 1.0 ) );
	  if ( h < vThL || r > .5 * ( 1.0 - vThL ) + .08 ) discard;
	  diffuseColor.rgb *= mix( ${F(o.root)}, ${F(o.tip)}, vThL ) * ( .92 + .16 * thFH( c + 7.7 ) ); }`);
  });
  thLkAO(m, geo); if (o.coat) thLkCoatFill(m);
  const im = new THREE.InstancedMesh(geo, m, N), I = new THREE.Matrix4(); for (let i = 0; i < N; i++) im.setMatrixAt(i, I);
  im.matrixAutoUpdate = false; im.frustumCulled = false; im._lkNoCast = true; im.receiveShadow = LOOK.quality === 'high'; im.userData.lkFur = true; im.userData.noHit = true; im.raycast = () => { };   // noHit: the frame keeps its bound, so it is still culled when out of view (an own raycast made the engine give up its bound, and the dog and the boulders were drawn behind the camera)
  rec.g.add(im); rec.lkFur = im; rec.lkFurNear = o.near; rec.lkFurAny = o.any || 0;   // near: drawn within this distance of the thing in view; any: also of a thing beside it (the moss under the robin)
}
/* The dog's lips and nose leather under the look. A Labrador's lip margins are pigmented, dark brown to black even on a yellow dog (photograph:
   "Afra 013.jpg", Wikimedia Commons, public domain: the lip line #513c39 against a pale coat), and bare of the coat's hairs. The lip line
   is the model's own mouth groove (tools/things/models/dog_head.mjs, mouthGroove: the same head frame and curve), widened to the lip's
   margin, at most about 1.3 mm each side of it (thLipF, drawn per pixel: the coat is too coarse to carry it). The nose leather is not smooth: its surface is a mosaic of small raised polygons, each about a
   millimetre or two across (the planum nasale; a judgement from photographs, no measurement found), drawn as relief on the nose's own
   surface. */
/* The dog's feet: "Round, compact; well-arched toes and well-developed pads" (breed standard, The Royal Kennel Club, "Retriever
   (Labrador)"). The model's coat closes over each foot as one round shape, with the claws and pads under it, and it is too coarse (16,000
   vertices for the whole dog) to cut toes into. Under the look the coat parts between the four toes of each foot: a groove drawn as relief
   and shade on its top and front, 2.5 mm deep at the front, fading out 1.2 to 3 cm behind the claws and above 3 cm, and the coat's hairs
   thin out in it.
   The grooves lie midway between neighbouring claws, found from the claws themselves, so they always agree with the model. */
const TH_DOGFEET = `float thToeF( vec3 p ) { float g = 0.0;   // t: x of the claws' base, z of the groove, its depth and width (0.7 to 1.2), on
	for ( int i = 0; i < 12; i ++ ) { vec4 t = thToeG[ i ]; if ( t.w < 0.5 ) continue;
	  float along = smoothstep( t.x - 0.03, t.x - 0.017, p.x ) * smoothstep( t.x + 0.032, t.x + 0.018, p.x ), up = clamp( ( p.y - 0.003 ) / 0.005, 0.0, 1.0 ) * smoothstep( 0.03, 0.017, p.y );
	  float w = 0.0014 * t.z * ( 0.85 + 0.3 * smoothstep( t.x - 0.025, t.x, p.x ) );   // a little wider toward the claws
	  g = max( g, t.z * along * up * exp( - pow( ( p.z - t.y ) / w, 2.0 ) ) ); }
	return min( g, 1.0 ); }
float thLipF( vec3 p ) {   // the model's mouth groove (dog_head.mjs, mouthGroove), in its head frame: origin (30, 60.6) cm, turned -8 degrees, scale 0.97
	vec2 d = p.xy * 100.0 - vec2( 30.0, 60.6 ); float C = 0.990268, S = -0.139173, xl = ( d.x * C + d.y * S ) / 0.97, yl = ( - d.x * S + d.y * C ) / 0.97, zl = abs( p.z * 100.0 ) / 0.97;
	if ( xl < 9.0 || xl > 21.0 || zl < 1.0 ) return 0.0;
	float ym = -2.75 + ( xl < 9.0 ? 0.09 * ( 9.0 - xl ) * ( 9.0 - xl ) : 0.0 ) + 0.02 * ( xl - 13.0 );
	/* the black margin ends at the corner of the mouth, about under the eye (head frame x 11.3 cm), tapering to it and toward the front,
	   and varies a little in width along its length; the hanging upper lip hides the rest of it */
	float w = 0.13 * smoothstep( 10.2, 12.5, xl ) * ( 1.0 - 0.45 * smoothstep( 16.0, 20.5, xl ) ) * ( 0.8 + 0.2 * sin( xl * 2.3 ) );
	return clamp( 1.0 - abs( yl - ym ) / max( w, 1e-3 ), 0.0, 1.0 ) * smoothstep( 10.2, 11.2, xl ) * clamp( 21.0 - xl, 0.0, 1.0 ); }
float thLipS( vec3 p ) {   // the soft shadow the overhanging upper lip throws on the lower lip, just under the margin, as far as the corner
	vec2 d = p.xy * 100.0 - vec2( 30.0, 60.6 ); float C = 0.990268, S = -0.139173, xl = ( d.x * C + d.y * S ) / 0.97, yl = ( - d.x * S + d.y * C ) / 0.97, zl = abs( p.z * 100.0 ) / 0.97;
	if ( xl < 9.5 || xl > 21.0 || zl < 1.0 ) return 0.0;
	float ym = -2.75 + 0.02 * ( xl - 13.0 ), u = ym - yl;
	return smoothstep( -0.05, 0.1, u ) * smoothstep( 0.75, 0.15, u ) * smoothstep( 9.5, 11.5, xl ) * clamp( 21.0 - xl, 0.0, 1.0 ); }
float thEyeRim( vec3 p ) {   // the dark margin of the lids round each eye (thEye: the right eye's centre and the globe's radius)
	float r = length( vec3( p.xy, abs( p.z ) ) - thEye.xyz ); return 0.9 * smoothstep( thEye.w + 0.0035, thEye.w + 0.0015, r ); }`;
/* the dog's eye for the lids' dark margin (thEyeRim): the right globe's centre and radius, from the model's own eye */
function thLkDogEye(T) {
  if (TH_LK.eye) return TH_LK.eye; const g = thGeo(T.def.id, T.bundle, 'eye_globe'); TH_LK.eye = new THREE.Vector4(0, 0, 0, -1); if (!g) return TH_LK.eye;
  const P = g.attributes.position, c = new V3(), v = new V3(); let n = 0; for (let i = 0; i < P.count; i++) if (P.getZ(i) > 0) { c.add(v.fromBufferAttribute(P, i)); n++; } if (!n) return TH_LK.eye; c.multiplyScalar(1 / n);
  let r = 0; for (let i = 0; i < P.count; i++) if (P.getZ(i) > 0) r = Math.max(r, v.fromBufferAttribute(P, i).distanceTo(c));
  return TH_LK.eye.set(c.x, c.y, c.z, r);
}
function thComps(geo) {   // the connected pieces of a mesh (each claw), as lists of vertex indices
  const P = geo.attributes.position, I = geo.index, par = new Int32Array(P.count).map((_, i) => i), f = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  if (I) for (let i = 0; i < I.count; i += 3) { const a = f(I.getX(i)); par[f(I.getX(i + 1))] = a; par[f(I.getX(i + 2))] = a; }
  const c = new Map(); for (let i = 0; i < P.count; i++) { const r = f(i); if (!c.has(r)) c.set(r, []); c.get(r).push(i); } return [...c.values()];
}
function thLkDogFeet(claws) {   // a groove between each two neighbouring toes of a foot: [x of the claws' base, z of the groove, depth and width, 1]
  if (TH_LK.feet) return TH_LK.feet; const out = []; for (let i = 0; i < 12; i++) out.push(new THREE.Vector4(0, 0, 0, 0));
  if (!claws) return TH_LK.feet = out;
  const P = claws.attributes.position, feet = [];
  for (const ix of thComps(claws)) {   // one claw each; a dewclaw (high on the leg) has no toe
    let ymin = 1e9, x = 0, z = 0, n = 0; for (const i of ix) ymin = Math.min(ymin, P.getY(i)); if (ymin > .01) continue;
    for (const i of ix) { const y = P.getY(i); if (y < .0045 || y > .0075) continue; x += P.getX(i); z += P.getZ(i); n++; } if (!n) continue; x /= n; z /= n;
    let f = feet.find(f => Math.abs(f.x - x) < .02 && Math.sign(f.s) === Math.sign(z)); if (!f) feet.push(f = { x, s: Math.sign(z), t: [] }); f.t.push(z);
  }
  let k = 0; for (const f of feet) { f.t.sort((a, b) => a - b); for (let j = 1; j < f.t.length && k < 12; j++, k++) out[k].set(f.x, (f.t[j - 1] + f.t[j]) / 2, .75 + .45 * ((k * 0.618) % 1), 1); }   // four claws: three grooves, each its own depth and width
  return TH_LK.feet = out;
}
/* A Labrador's claws are short and blunt where they meet the ground (worn by walking); the model's are 23 mm cones, which read as
   thorns. Under the look each claw is shortened toward its base to 0.62 of its length (the dewclaw, which does not touch the ground,
   to 0.5), so its tip is blunter. A judgement from photographs. The meshes are shared with the app without the look, which does not
   run this. */
function thLkClaws(geo) {
  if (geo.userData.thShort) return; geo.userData.thShort = true; thLkDogFeet(geo);   // the grooves from the claws as the model has them
  const P = geo.attributes.position, v = new V3(), c = new V3(), tip = new V3(), base = new V3(), a = new V3();
  for (const ix of thComps(geo)) {
    c.set(0, 0, 0); let ymin = 1e9; for (const i of ix) { c.add(v.fromBufferAttribute(P, i)); ymin = Math.min(ymin, v.y); } c.multiplyScalar(1 / ix.length);
    let far = -1; for (const i of ix) { const d = v.fromBufferAttribute(P, i).distanceTo(c); if (d > far) { far = d; tip.copy(v); } }
    let md = 0; for (const i of ix) md = Math.max(md, v.fromBufferAttribute(P, i).distanceTo(tip));
    base.set(0, 0, 0); let nb = 0; for (const i of ix) { v.fromBufferAttribute(P, i); if (v.distanceTo(tip) > md * .8) { base.add(v); nb++; } } if (!nb) continue; base.multiplyScalar(1 / nb);
    a.subVectors(tip, base); const L = a.length(); if (L < 1e-5) continue; a.multiplyScalar(1 / L); const k = ymin > .01 ? .5 : .62;
    for (const i of ix) { v.fromBufferAttribute(P, i); const s = v.clone().sub(base).dot(a); if (s > 0) { v.addScaledVector(a, -s * (1 - k)); P.setXYZ(i, v.x, v.y, v.z); } }
  }
  P.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
}
function thLkNose(m) {
  LOOK.patch(m, 'thnosecobble', sh => {
    sh.vertexShader = 'varying vec3 vThNp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvThNp = position;');
    sh.fragmentShader = 'varying vec3 vThNp;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
	{ vec3 q = vThNp / 0.0014, c = floor( q ); float d1 = 9.0, d2 = 9.0;
	  for ( int i = -1; i <= 1; i ++ ) for ( int j = -1; j <= 1; j ++ ) for ( int k = -1; k <= 1; k ++ ) { vec3 g = c + vec3( float( i ), float( j ), float( k ) ), o = fract( sin( vec3( dot( g, vec3( 127.1, 311.7, 74.7 ) ), dot( g, vec3( 269.5, 183.3, 246.1 ) ), dot( g, vec3( 113.5, 271.9, 124.6 ) ) ) ) * 43758.5453 ); float d = length( g + o - q ); if ( d < d1 ) { d2 = d1; d1 = d; } else if ( d < d2 ) d2 = d; }
	  float h = smoothstep( 0.0, 0.25, d2 - d1 ) * 0.00025;
	  vec3 sx = dFdx( -vViewPosition ), sy = dFdy( -vViewPosition ); vec3 thR1 = cross( sy, normal ), thR2 = cross( normal, sx ); float det = dot( sx, thR1 );   // (three's cube-map chunk defines r1 as a macro)
	  vec2 dh = vec2( dFdx( h ), dFdy( h ) ); normal = normalize( abs( det ) * normal - sign( det ) * ( dh.x * thR1 + dh.y * thR2 ) );
	  diffuseColor.rgb *= 0.8 + 0.25 * smoothstep( 0.0, 0.3, d2 - d1 ); }`);
  });
}
/* A robin's plumage is not a painted shell: it is contour feathers, each a rounded vane on a shaft, lying over the next like roof tiles,
   all pointing back toward the tail (down the breast, back over the crown). Under the realistic look, at the high level, each plumage
   region of the model is covered with such feathers: cards placed over its surface (spaced at 0.4 of a feather's length, so each overlaps
   its neighbours by more than half), lying back along the flow at a low angle, 8 mm on the breast and belly, 9.5 mm on the back, nape
   and flanks (the face and crown, whose feathers are a few millimetres long, keep their smooth shell), lit with the body's own surface
   normal so that they read as one coat and not as scales, each a
   feather drawn as a picture (TH_FEATHER: a vane of barbs angled toward the tip, the shaft, a rounded and slightly ragged tip, a grey
   downy base hidden under the feathers in front). The feather takes the region's colour (its data, checked against a photograph: see
   tools/things/lib/kinds.mjs), so the orange breast stops where its feathers stop, overlapping the grey border, as on the bird.
   A drawn feather, not a photograph of one: no licence-clean photograph of a robin's contour feather was found. A robin has some
   1,500 to 2,500 contour feathers (a judgement for a 14 cm passerine, not a count; the model's note says the feathers are drawn). */
const TH_FEATHER = { tex: null, flight: null };
function thLkFeatherTex(flight) {
  const key = flight ? 'flight' : 'tex'; if (TH_FEATHER[key]) return TH_FEATHER[key];
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d'), im = x.createImageData(S, S), d = im.data;
  let sd = flight ? 11 : 5; const rn = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296; const jag = []; for (let i = 0; i < 64; i++) jag.push(rn());
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const t = (j + .5) / S, u = (i + .5) / S - .5, au = Math.abs(u), k = (j * S + i) * 4;
    let a = 1, g;
    if (flight) {   // a flight or tail feather: the whole card is vane (the blade's own shape is the outline); barbs, shaft, a paler fringe at the edge
      const bar = .5 + .5 * Math.sin((t * 90 - au * 70) * Math.PI), edge = au / .5;
      g = .9 + .1 * bar - .08 * Math.exp(-au * au / .0004) + .12 * Math.pow(edge, 6) + .04 * (jag[(j >> 2) & 63] - .5);
      if (au < .012) g = 1.12;   // the shaft
    } else {
      const w = .46 * Math.pow(Math.sin(Math.PI * Math.min(1, .08 + .9 * t)), .55) * (1 - .06 * jag[Math.floor(u * 90 + 45) & 63] * Math.pow(t, 6));
      if (au > w) a = 0;
      const ph = t * 70 - au * 60, bar = .5 + .5 * Math.sin(ph * Math.PI), down = Math.max(0, Math.min(1, (.42 - t) / .25));
      g = (.985 + .03 * bar) * (1 - .06 * down) + .02 * (jag[(i >> 2) & 63] - .5);   // the downy base, under the feathers in front (barely darker: a step there drew scales, not plumage)
      if (au < .01 && t < .88) g = 1.05;   // the shaft
      if (down > .6 && ((i * 7 + j * 3) % 5 === 0)) a = 0;   // the down is open
      /* the vane's edge is not a cut line: its barbs end free and part, so the outline frays into separate barb tips over the outer
         fifth of the vane (the gaps between them follow the barbs' slant), and the alpha falls off softly into them */
      const edge = (w - au) / Math.max(w, 1e-3), gap = .5 + .5 * Math.sin(ph * Math.PI * 1.7 + jag[Math.floor(t * 63) & 63] * 3);
      a *= Math.max(0, Math.min(1, (edge - .22 * gap * (1 - Math.min(1, edge / .3))) * 9));
    }
    const v = Math.round(Math.max(0, Math.min(255, g * 128)));
    d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = Math.round(a * 255);
  }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return TH_FEATHER[key] = t;
}
/* the flow of the plumage (model axes, metres; +x the way the bird faces): back over the crown, along the body (tilted about 38 degrees)
   on the back and flanks, down and back on the breast and belly */
function thRobinFlow(p, n, out) {
  const head = Math.max(0, Math.min(1, (p.y - .082) / .01)), front = Math.max(0, Math.min(1, (n.x - .1) / .5)) * (1 - head);
  out.set(-.79 - .21 * head, -.62 + .57 * head, 0); out.lerp(new V3(-.35, -.94, 0), front * .8);
  return out.sub(n.clone().multiplyScalar(out.dot(n))).normalize();
}
/* The robin's bib under the look. The model's regions (tools/things/models/robin_out.mjs) make the orange a narrow strip down the front
   of the breast with a wide grey band over the side of the breast; on the bird ("an orange breast and face lined by a bluish grey on the
   sides of the neck and chest", Wikipedia, "European robin"; photograph: "Erithacus rubecula with cocked head.jpg") the orange bib is
   unbroken from the forehead and face to the breast and wide on the side of the breast, and the grey is a narrow margin between it and
   the brown upperparts and flanks. The model's meshes are shared with the app without the look, so the bib is re-coloured here, from a
   mask over the body: a point of the face, breast or grey regions is grey within TH_BIB.grey of the nearest brown plumage (crown, nape,
   back, rump, flank), orange beyond it, blended over about a feather's width, and blends into the belly's buff-white where it meets the
   belly. The same mask colours the shell and each contour feather (by where its root is), so there is no scatter of one region's feathers
   across another. Widths a judgement from the photograph (the grey margin is a few millimetres wide on a 14 cm bird). */
const TH_BIB = { grey: .003, blend: .0025, belly: .003, orange: '#bf6834', greyC: '#8a8d9c', bellyC: '#ddd2c0', O: /^r_(face|breast|grey)(_mid)?$/ };
function thRobinMask(T) {
  if (TH_BIB.f) return TH_BIB.f;
  const pts = (ids) => { const G = 0.003, h = new Map(); for (const id of ids) { const g = thGeo(T.def.id, T.bundle, id); if (!g) continue; const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = Math.floor(x / G) + ',' + Math.floor(y / G) + ',' + Math.floor(z / G); let c = h.get(k); if (!c) h.set(k, c = []); c.push(x, y, z); } } return { G, h }; };
  const near = (S, x, y, z, R) => { const G = S.G, n = Math.ceil(R / G); let best = R * R; const cx = Math.floor(x / G), cy = Math.floor(y / G), cz = Math.floor(z / G);
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++) { const c = S.h.get((cx + i) + ',' + (cy + j) + ',' + (cz + k)); if (!c) continue; for (let q = 0; q < c.length; q += 3) { const d = (c[q] - x) ** 2 + (c[q + 1] - y) ** 2 + (c[q + 2] - z) ** 2; if (d < best) best = d; } }
    return Math.sqrt(best); };
  const B = pts(['r_crown', 'r_nape', 'r_back', 'r_rump', 'r_flank']), W = pts(['r_belly', 'r_vent']);
  const lin = h => new THREE.Color(h), Or = lin(TH_BIB.orange), Gr = lin(TH_BIB.greyC), Be = lin(TH_BIB.bellyC), c = new THREE.Color();
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  return TH_BIB.f = (x, y, z) => {
    const R = TH_BIB.grey + TH_BIB.blend, dB = near(B, x, y, z, R), dW = near(W, x, y, z, TH_BIB.belly);
    c.copy(Gr).lerp(Or, sm(TH_BIB.grey, R, dB)); c.lerp(Be, .55 * (1 - sm(0, TH_BIB.belly, dW)) * sm(TH_BIB.grey, R, dB));
    return c;
  };
}
/* Eyes under the look. The model's eyes are whole balls set almost on the head's surface (the robin's 3 mm ball 0.45 mm under it, so
   it stood out like a goggle with a pale tube round it; the dog's globe in its socket with no visible lid margin). Seen close they read as
   toy eyes. A quiet eye is better than an elaborate wrong one: each eye is sunk `d` metres into the head, toward its mid-plane, so only a low dome shows between the lids, and a ring round it takes the dark colour
   of a lid margin (`ring`). A judgement from photographs: no measurement of how far either eye stands proud was found. */
function thLkSinkEye(m, geo, d, ring, ax, shrink) {   // ax: [forward, sideways] share of the eye's outward direction (default: sideways only)
  geo.computeBoundingBox(); const b = geo.boundingBox, mid = (b.min.z + b.max.z) / 2;
  const F = x => x.toFixed(5);   // the two eyes lie either side of the head's mid-plane (z = mid): each moves in toward it
  const c = new V3(); { const P = geo.attributes.position; let n = 0; for (let i = 0; i < P.count; i++) if (P.getZ(i) > mid) { c.x += P.getX(i); c.y += P.getY(i); c.z += P.getZ(i); n++; } c.multiplyScalar(1 / Math.max(1, n)); }   // one eye's centre (the other is its mirror)
  shrink = shrink || 1;
  if (ring) m.color.set(ring);
  LOOK.patch(m, 'thsinkeye', sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	{ float thS = sign( transformed.z - ${F(mid)} ); vec3 thC = vec3( ${F(c.x)}, ${F(c.y)}, ${F(c.z - mid)} * thS + ${F(mid)} );
	  transformed = thC + ( transformed - thC ) * ${F(shrink)} - vec3( ${F((ax ? ax[0] : 0) * d)}, 0.0, thS * ${F((ax ? ax[1] : 1) * d)} ); }`); });
}
/* the bib's colour on a shell of the face, breast or grey regions, per vertex (it replaces the part's own colour; selection and light as before) */
function thLkBib(rec, geo, T) {
  if (!geo.attributes.thRC) { const P = geo.attributes.position, f = thRobinMask(T), a = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const c = f(P.getX(i), P.getY(i), P.getZ(i)); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } geo.setAttribute('thRC', new THREE.BufferAttribute(a, 3)); }
  LOOK.patch(rec.g.userData.main.material, 'thbib', sh => {
    sh.vertexShader = 'attribute vec3 thRC;\nvarying vec3 vThRC;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvThRC = thRC;');
    sh.fragmentShader = 'varying vec3 vThRC;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.rgb = vThRC;');
  });
}
/* Fur and feathers in shade: a coat is not one surface but many hairs or barbs, and light falling on it is passed on from one to the next
   before it leaves, so a pale coat's shaded side stays a mid-tone under an open sky, as in photographs of a yellow Labrador or a robin in
   sun. The environment (the sky) lights the coat at its full strength, and a fill of TH_COAT.k times the light on open ground now is added
   to its diffuse light (a judgement, smaller than the crown's). */
const TH_COAT = { k: .12, fill: { value: .1 } };
function thLkCoatFill(m) {
  m.envMapIntensity = 1;
  LOOK.patch(m, 'thcoatfill', sh => { sh.uniforms.uThCoatFill = TH_COAT.fill; sh.fragmentShader = 'uniform float uThCoatFill;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
	reflectedLight.indirectDiffuse += material.diffuseColor * uThCoatFill;`); });
}
function thLkPlumage(rec, geo, o) {
  const P = geo.attributes.position, N = geo.attributes.normal, I = geo.index, nt = I ? I.count / 3 : P.count / 3, tri = [], a = new V3(), b = new V3(), c = new V3(), e = new V3();
  let area = 0; for (let i = 0; i < nt; i++) { const i0 = I ? I.getX(i * 3) : i * 3, i1 = I ? I.getX(i * 3 + 1) : i * 3 + 1, i2 = I ? I.getX(i * 3 + 2) : i * 3 + 2; a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1); c.fromBufferAttribute(P, i2); area += e.subVectors(b, a).cross(c.sub(a)).length() / 2; tri.push([i0, i1, i2, area]); }
  const n = Math.max(4, Math.round(area / (o.step * o.step))), rnd = thRng(o.seed || 7), M = new THREE.Matrix4(), X = new V3(), Y = new V3(), Z = new V3(), p = new V3(), nn = new V3(), tmp = new V3(), q = new THREE.Quaternion(), sc = new V3();
  const card = new THREE.PlaneGeometry(1, 1); card.translate(0, .5, 0); const AO = geo.attributes.thAO, ao = AO ? new Float32Array(n) : null, sn = new Float32Array(n * 3), rc = o.bib ? new Float32Array(n * 3) : null, im = new THREE.InstancedMesh(card, null, n), bib = o.bib ? thRobinMask(o.T) : null;
  for (let k = 0; k < n; k++) {
    const r = rnd() * area; let lo = 0, hi = tri.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (tri[m][3] < r) lo = m + 1; else hi = m; }
    const [i0, i1, i2] = tri[lo]; let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    p.fromBufferAttribute(P, i0).multiplyScalar(1 - u - v).add(a.fromBufferAttribute(P, i1).multiplyScalar(u)).add(b.fromBufferAttribute(P, i2).multiplyScalar(v));
    nn.fromBufferAttribute(N, i0).multiplyScalar(1 - u - v).add(a.fromBufferAttribute(N, i1).multiplyScalar(u)).add(b.fromBufferAttribute(N, i2).multiplyScalar(v)).normalize();
    thRobinFlow(p, nn, Y); Y.applyAxisAngle(nn, (rnd() - .5) * .35);
    const lift = o.lift * (.7 + .6 * rnd()); Y.addScaledVector(nn, lift).normalize(); X.crossVectors(Y, nn).normalize(); Z.crossVectors(X, Y).normalize();
    const L = o.len * (.85 + .3 * rnd()), W = L * o.aspect * (.9 + .2 * rnd());
    M.makeBasis(X, Y, Z); q.setFromRotationMatrix(M); tmp.copy(p).addScaledVector(nn, o.off).addScaledVector(Y, -L * .35);   // the root sits under the feathers behind it
    M.compose(tmp, q, sc.set(W, L, 1)); im.setMatrixAt(k, M); sn[k * 3] = nn.x; sn[k * 3 + 1] = nn.y; sn[k * 3 + 2] = nn.z;
    if (ao) ao[k] = (AO.getX(i0) * (1 - u - v) + AO.getX(i1) * u + AO.getX(i2) * v) * (AO.normalized && AO.array instanceof Uint8Array ? 1 / 255 : 1);   // the shell's own occlusion where the feather grows, so card and shell are lit alike
    if (bib) { const c = bib(p.x, p.y, p.z); rc[k * 3] = c.r; rc[k * 3 + 1] = c.g; rc[k * 3 + 2] = c.b; }   // the bib's colour where the feather grows
  }
  card.setAttribute('thSN', new THREE.InstancedBufferAttribute(sn, 3)); if (rc) card.setAttribute('thRC', new THREE.InstancedBufferAttribute(rc, 3)); if (ao) card.setAttribute('thAOi', new THREE.InstancedBufferAttribute(ao, 1));
  const m0 = rec.g.userData.main.material, m = new THREE.MeshStandardMaterial({ color: m0.color, roughness: m0.roughness, metalness: 0, side: THREE.FrontSide, map: thLkFeatherTex(false), alphaTest: .5 });
  if (m0.defines && m0.defines.LK_SSS) m.defines = { LK_SSS: m0.defines.LK_SSS }; m.envMapIntensity = m0.envMapIntensity; m.userData.kind = 'feather';
  LOOK.selMark(m, m0);
  /* lit as the body's surface, so the plumage reads as one coat of feathers and not as scales: the normal is the shell's where the
     feather grows, turned across the card as the body's surface turns (a body of radius o.curve), so the light runs on from one
     feather to the next instead of stepping at each card */
  LOOK.patch(m, 'thfeathern', sh => { sh.vertexShader = 'attribute vec3 thSN;\n' + sh.vertexShader.replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
	{ vec3 thN = thSN;
	#ifdef USE_INSTANCING
	  thN += ( ( instanceMatrix * vec4( position, 1.0 ) ).xyz - ( instanceMatrix * vec4( 0.0, 0.35, 0.0, 1.0 ) ).xyz ) / ${(o.curve || .02).toFixed(4)};
	#endif
	  transformedNormal = normalize( normalMatrix * normalize( thN ) ); }`); });   // lit as the body's surface, so the plumage reads as one coat of feathers and not as scales
  if (rc) LOOK.patch(m, 'thbibcard', sh => { sh.vertexShader = 'attribute vec3 thRC;\nvarying vec3 vThRC;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvThRC = thRC;'); sh.fragmentShader = 'varying vec3 vThRC;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.rgb = vThRC;'); });
  thLkCoatFill(m); thLkAO(m, card);
  LOOK.patch(m, 'thfeathermap', sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n\t{ vec4 thF = texture2D( map, vUv ); diffuseColor.rgb *= pow( 2.0 * thF.rgb, vec3( 0.4545 ) ); diffuseColor.a *= thF.a; }\n#endif'); });   // detail with a mean of one half, proportional in linear light; its alpha is the outline
  im.material = m; im.instanceMatrix.needsUpdate = true; im.matrixAutoUpdate = false; im.frustumCulled = false; im._lkNoCast = true; im.receiveShadow = false;   // lit by the shell's normal; a shadow map read on cards lifted off the body darkened them one by one (a mosaic)
  im.userData.noHit = true; im.userData.lkFur = true;
  rec.g.add(im); rec.lkFur = im; rec.lkFurNear = o.near; rec.lkFurAny = 0;
}
/* baked ambient occlusion (per vertex, or per instance) multiplies the light from the environment only: the sky and the ground it
   reflects, diffuse and specular. The Sun's light is shadowed by the shadow map, not by this. */
function thLkAO(m, geo) {
  if (!m || !m.isMeshStandardMaterial || !geo || !LOOK.part('ao')) return; const v = !!geo.attributes.thAO, iv = !!geo.attributes.thAOi; if (!v && !iv) return;
  LOOK.patch(m, 'thao' + (v ? 'v' : '') + (iv ? 'i' : ''), sh => {
    sh.vertexShader = (v ? 'attribute float thAO;\n' : '') + (iv ? 'attribute float thAOi;\n' : '') + 'varying float vThAO;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvThAO = ' + (v && iv ? 'thAO * thAOi' : v ? 'thAO' : 'thAOi') + ';');
    sh.fragmentShader = 'varying float vThAO;\n' + sh.fragmentShader.replace('#include <aomap_fragment>', `#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= vThAO;
	reflectedLight.indirectSpecular *= mix( 1.0, vThAO, 0.85 );`);
  });
}
/* Lichen crusts: a thallus is not a disc but a rosette of lobes, or a crust broken into patches. Each patch keeps the lichen's own
   colour (its data) and takes the mottling of photographed crustose lichens (mossy_rock, enlarged), and its outline is cut into lobes
   (five to nine, a hash of where the patch is), with a paler growing margin (as in Xanthoria and Lecanora). */
const TH_LICHEN = { t: null };
function thLkLichen(m) {
  if (!TH_LICHEN.t) { TH_LICHEN.t = thLkFlat(128, 128, 128); TH_LICHEN.t.wrapS = TH_LICHEN.t.wrapT = THREE.RepeatWrapping; thLkTrack(thLkImg('mossy_rock_color_512.jpg').then(im => { TH_LICHEN.t.image = thLkDetail(im); TH_LICHEN.t.needsUpdate = true; }).catch(() => { })); }
  m.userData.thLichen = { value: TH_LICHEN.t };
  LOOK.patch(m, 'thlichen', sh => {
    sh.uniforms.thLiTex = m.userData.thLichen;
    sh.vertexShader = 'varying vec3 vThLp;\nvarying float vThLs;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	vThLp = position;
	#ifdef USE_INSTANCING
	vThLs = fract( sin( dot( instanceMatrix[ 3 ].xyz, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 );
	#else
	vThLs = 0.5;
	#endif`);
    sh.fragmentShader = 'uniform sampler2D thLiTex;\nvarying vec3 vThLp;\nvarying float vThLs;\nfloat thLiN( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f ); float a = fract( sin( dot( i, vec2( 127.1, 311.7 ) ) ) * 43758.5 ), b = fract( sin( dot( i + vec2( 1, 0 ), vec2( 127.1, 311.7 ) ) ) * 43758.5 ), c = fract( sin( dot( i + vec2( 0, 1 ), vec2( 127.1, 311.7 ) ) ) * 43758.5 ), d = fract( sin( dot( i + vec2( 1, 1 ), vec2( 127.1, 311.7 ) ) ) * 43758.5 ); return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y ); }\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	{ float r = length( vThLp.xz ), a = atan( vThLp.z, vThLp.x ), lobes = floor( 5.0 + vThLs * 4.99 );
	  float edge = .8 + .06 * sin( a * lobes + vThLs * 40.0 ) + .05 * sin( a * ( lobes * 1.7 + 1.0 ) + vThLs * 17.0 ) + .04 * sin( a * 13.0 + vThLs * 9.0 ) + .08 * ( thLiN( vThLp.xz * 6.0 + vThLs * 9.0 ) - .5 );
	  if ( r > edge ) discard;
	  vec3 det = pow( texture2D( thLiTex, vThLp.xz * .07 + vec2( vThLs * 3.1, vThLs * 7.3 ) ).rgb * 2.0, vec3( .4545 ) );   // proportional in linear light
	  diffuseColor.rgb *= mix( vec3( 1.0 ), det, .9 ) * mix( 1.0, 1.1, smoothstep( edge - .1, edge, r ) ); }`);
  });
}
/* The fly agaric's cap: scarlet, fading toward orange at the margin, mottled where the viscid skin is thicker or thinner, with fine radial
   grooves at the very margin (it is striate there), and the skin's sheen varying with it. Its gills: crowded free lamellae seen edge-on
   from below, about 150 round the cap (drawn as light and shade between them, not as modelled plates). Patterns in the model's own
   coordinates, about the stem's axis; colours chosen against photographs of Amanita muscaria. */
const TH_NOISE = `float thN3( vec3 p ) { vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f ); float n = dot( i, vec3( 1.0, 57.0, 113.0 ) );
  return mix( mix( mix( fract( sin( n ) * 43758.5 ), fract( sin( n + 1.0 ) * 43758.5 ), f.x ), mix( fract( sin( n + 57.0 ) * 43758.5 ), fract( sin( n + 58.0 ) * 43758.5 ), f.x ), f.y ),
    mix( mix( fract( sin( n + 113.0 ) * 43758.5 ), fract( sin( n + 114.0 ) * 43758.5 ), f.x ), mix( fract( sin( n + 170.0 ) * 43758.5 ), fract( sin( n + 171.0 ) * 43758.5 ), f.x ), f.y ), f.z ); }
`;
function thLkMP(sh) { sh.vertexShader = 'varying vec3 vThMp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvThMp = position;'); sh.fragmentShader = 'varying vec3 vThMp;\n' + TH_NOISE + sh.fragmentShader; }
function thLkCap(m, ax, R) {
  LOOK.patch(m, 'thcap', sh => {
    thLkMP(sh);
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	float thR = length( vThMp.xz - vec2( ${ax[0].toFixed(4)}, ${ax[1].toFixed(4)} ) ) / ${R.toFixed(4)}, thA = atan( vThMp.z - ${ax[1].toFixed(4)}, vThMp.x - ${ax[0].toFixed(4)} );
	float thM = thN3( vThMp * 70.0 ) * .6 + thN3( vThMp * 190.0 ) * .4;
	diffuseColor.rgb = mix( diffuseColor.rgb, vec3( .9, .38, .12 ), .55 * smoothstep( .5, 1.0, thR ) ) * ( .88 + .22 * thM );
	diffuseColor.rgb *= 1.0 - .1 * smoothstep( .82, .97, thR ) * ( .5 + .5 * sin( thA * 150.0 ) );`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = clamp( roughnessFactor * ( .7 + .6 * thM ), .25, .8 );');
  });
}
function thLkGills(m, ax, R) {
  LOOK.patch(m, 'thgills', sh => {
    thLkMP(sh);
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
	{ float thR = length( vThMp.xz - vec2( ${ax[0].toFixed(4)}, ${ax[1].toFixed(4)} ) ) / ${R.toFixed(4)}, thA = atan( vThMp.z - ${ax[1].toFixed(4)}, vThMp.x - ${ax[0].toFixed(4)} );
	  float thG = .5 + .5 * sin( thA * 150.0 + thN3( vThMp * 400.0 ) * 1.5 ), thS = .5 + .5 * sin( thA * 75.0 + 1.3 );
	  diffuseColor.rgb *= mix( 1.0, mix( .62, 1.04, smoothstep( .15, .75, thG ) ) * mix( .9, 1.0, thS ), smoothstep( .14, .3, thR ) ); }`);
  });
}
/* An insect wing is a clear membrane a few micrometres thick: it hardly scatters light, so it shows what is behind it, darkened a little,
   and reflects the sky from its two surfaces (a dielectric's Fresnel reflection, about 4 percent face-on, rising toward grazing). So the
   membrane keeps 6 percent of its colour as diffuse, its reflection is added on top of what is behind (premultiplied blending: nothing
   is painted over the abdomen), and it covers only 7 percent face-on, more edge-on. The veins are their own part, opaque chitin. */
function thLkWing(m) {
  if (!m || !m.isMeshStandardMaterial) return;
  m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.roughness = .12; m.userData.thWing = true;
  if (m.defines) { delete m.defines.LK_THIN; delete m.defines.LK_SSS; }
  LOOK.patch(m, 'thwing', sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n\tdiffuseColor.rgb *= 0.06;')
      .replace('#include <output_fragment>', `{ float thWk = saturate( opacity * 2.0 ), thWF = pow( 1.0 - saturate( abs( dot( normal, normalize( vViewPosition ) ) ) ), 5.0 );
	gl_FragColor = vec4( outgoingLight * thWk, ( 0.07 + 0.45 * thWF ) * thWk ); }`);
  });
}
/* the patches every lit material of a thing takes under the look: the rim that marks the part pointed at or selected, and a see-through
   layer that keeps its edges (a ghost is brighter where it is seen edge-on, as a glass shell is) */
function thLkMarks(m) {
  if (!m || !m.isMeshStandardMaterial || m.userData.thRim) return; m.userData.noHL = true;
  m.userData.thRim = true; const ghost = m.userData.thGhost = { value: 0 };   // ghost: 1 while the part is faded to see through it (not a part that is clear by nature, like a wing)
  LOOK.selMark(m);   // the part selected or pointed at: the foundation's one selection mark (LOOK.selSet in the tick), no rim of light of its own
  LOOK.patch(m, 'thmarks', sh => {
    sh.uniforms.uThGhost = ghost;
    sh.fragmentShader = 'uniform float uThGhost;\n' + sh.fragmentShader
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n\tif ( uThGhost > 0.5 ) { float thF = 1.0 - saturate( abs( dot( normal, normalize( vViewPosition ) ) ) ); gl_FragColor.a = min( 1.0, gl_FragColor.a * mix( 0.45, 2.2, thF * thF ) ); }');
  });
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
    if (def.shadow && o.ground !== false && !(TH_LK.on && LOOK.part('shadow'))) this._addShadow(def.shadow);   // under the look the Sun's shadow map draws the shadow and the foundation the small contact under what stands on the lawn (DESIGN 3.8): a disc of our own would be a second, painted one   // the contact shadow belongs to a thing that stands on a ground
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
    if (!face && TH_LK.on && pd.kind && pd.color) return { kind: 'plain', palette: [[pd.color, 1]], look: { kind: pd.kind, pattern: 'plain' } };   // no face named: under the look the cut shows the part's own material
    return face || { kind: 'plain', palette: [[0x6b5a48, 1]] };
  }
  _sway(pd) {   // the shader motions (sway, swing) that apply to this part
    const mine = a => (a.system && a.system === pd.system) || (a.systems && a.systems.includes(pd.system)) || (a.parts && a.parts.includes(pd.id)) || a.part === pd.id;
    const sway = (this.def.anim || []).find(a => a.kind === 'sway' && mine(a)), swing = (this.def.anim || []).find(a => a.kind === 'swing' && mine(a));
    return sway || swing ? { sway: sway || null, swing: swing || null } : null;
  }
  _addPart(pd) {
    if (TH_LK.on && pd.look_lod) pd.lod = pd.look_lod;   // under the look a part may be drawn in other detail tiers (kinds.mjs LOOK_OF); the data is shared by every placement, so this is done once per part
    const def = this.def, color = new THREE.Color((TH_LK.on && pd.look_color) || pd.color || '#aaaaaa').getHex(), sw = this._sway(pd);
    let g, geo;
    if (pd.mesh) {
      geo = thGeo(def.id, this.bundle, pd.mesh); if (!geo) { console.warn('thing', def.id, 'part', pd.id, 'missing mesh', pd.mesh); return; }
      g = thInked(geo, color, { w: pd.ink_w || def.ink_w || .0018, double: !!pd.double, vc: !!geo.attributes.color && (!TH_LK.on || pd.shade === 'tone'), sway: sw });   // under the look a shade byte drawn as light is left out
      if (TH_LK.on && pd.kind === 'marker') { const mm = g.userData.main; mm.material.dispose(); mm.material = opaqueUnlessFading(new THREE.MeshBasicMaterial({ color, side: pd.double ? THREE.DoubleSide : THREE.FrontSide })); }   // a sign drawn on the model, not a material: unlit
      g.userData.main.material.clippingPlanes = null; thPatch(g.userData.main.material, sw, this.L);
      if (pd.solid !== false) {   // inside faces for the cut-open view, painted with the cut-face pattern
        const fm = thFaceMat(this._faceFor(pd), this.plane); fm.clippingPlanes = this.planes; const cap = new THREE.Mesh(geo, fm); cap.visible = false; cap.userData.cap = true; cap.renderOrder = 0; cap.matrixAutoUpdate = false; g.add(cap); g.userData.cap = cap; this.faceMats.push(fm);
      }
    } else if (pd.instances) {
      const inst = thInst(this.bundle, pd.instances); geo = thGeo(def.id, this.bundle, inst.mesh);
      const ex = geo.attributes.color && (!TH_LK.on || pd.shade === 'tone') ? { vertexColors: true } : {}; if (pd.card) { thCardUV(geo); ex.map = thCardTexture(pd.card); ex.alphaTest = .5; }
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
      const BI = this.bundle.instances[pd.instances];   // occlusion per instance (a leaf deep in the crown): one attribute on the shared geometry, so not for a placement that keeps only some instances
      if (TH_LK.on && BI && BI.ao && !kept && (!geo.userData.aoi || geo.userData.aoi === pd.instances)) { if (!geo.attributes.thAOi) geo.setAttribute('thAOi', new THREE.InstancedBufferAttribute(thUnpack4(this.bundle.buf, BI.ao, BI.n), 1, true)); geo.userData.aoi = pd.instances; }
    } else if (pd.flow) {
      g = thFlowMesh(def.id, this.bundle, pd, color);
    } else return;
    const rec = { pd, g, op: 0, tgt: 1, near: true, instanced: !!pd.instances, rank: this.rank[pd.system] };
    if (TH_LK.on && !pd.flow) this._lkDress(rec, geo);
    g.userData.partRec = rec; g.visible = false; rec.flow = g.userData.flow || null;
    (pd.pivot ? this._pivot(pd.pivot) : this.group).add(g); this.list.push(rec); this.parts[pd.id] = rec;
  }
  _lkDress(rec, geo) {   // the realistic look's extras for one part (see TH_KINDS)
    const pd = rec.pd, m = rec.g.userData.main.material; thLkMarks(m); thLkAO(m, geo);
    const cap = rec.g.userData.cap; if (cap) { cap._lkNoCast = true; cap.receiveShadow = false; }
    if (pd.look_section) thLkFill(m);   // the cut face is drawn on the solid's far inside: a shadow looked up there would be the solid's own, uncut
    if (!LOOK.part('tex') || !m.isMeshStandardMaterial) return;
    if (pd.uv && pd.uv.grid && pd.kind === 'bark' && LOOK.texSet) {   // the trunk: bark along its own coordinates, not laid on from three sides
      const s = LOOK.texSet('bark'); thLkTrunkUV(geo, pd.uv, [1, 2]); if (m.defines) delete m.defines.LK_TRI; m.map = s.map; m.normalMap = s.normalMap; m.normalScale.set(s.bump * 1.6, s.bump * 1.6); m.needsUpdate = true;
      /* the photograph is detail with a mean of one half: doubled, and proportional in linear light (as the foundation's sets are). Read
         plainly it halved the bark's colour, and the conversion to linear light then made the trunk about a fifth as bright as its data. */
      if (LOOK.quality === 'high' && this.def.id === 'oak') thLkBarkRelief(m, this); else
      LOOK.patch(m, 'thbarkuv', sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n\t{ vec4 texelColor = texture2D( map, vUv ); diffuseColor.rgb *= pow( 2.0 * texelColor.rgb, vec3( 0.4545 ) ); }\n#endif'); });   // along its own coordinates the relief is not averaged over three projections, so it takes the photograph's slopes at nearer their full strength
    }
    if (pd.kind === 'wing') thLkWing(m);
    if (pd.kind === 'gloss_petal') { LOOK.patch(m, 'thglosspetal', sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n\tmaterial.specularColor = vec3( 0.08 );'); }); thLkFaceView(m); }
    if (pd.kind === 'lichen' && rec.instanced) thLkLichen(m);
    if (this.def.id === 'mushroom' && (pd.kind === 'cap' || pd.kind === 'gill') && pd.center && !rec.instanced) {   // the fly agaric's cap and gills, about the stem's axis
      const ax = [pd.center[0], /^c_/.test(pd.id) ? 0 : pd.center[2]], R = (pd.radius || .07) * (/^c_/.test(pd.id) ? .9 : 1);
      if (pd.kind === 'cap' && /cap/.test(pd.id) && !/cuticle/.test(pd.id)) thLkCap(m, ax, R); else if (pd.kind === 'gill') thLkGills(m, ax, R);
    }
    if (pd.kind === 'moss' && !rec.instanced && LOOK.quality === 'high' && LOOK.part('fur'))   // a moss cushion is a turf of shoots a centimetre tall: shells, uneven in height (tufts), olive
      thLkFur(rec, geo, { n: 8, len: .01, cell: .0014, near: 8, any: 1.5, root: .4, tip: 1.15, lenAt: v => { const s = Math.sin(v.x * 61 + Math.sin(v.z * 47)) * Math.sin(v.z * 53 + Math.sin(v.y * 71)); return .35 + .65 * (.5 + .5 * s); } });
    if (this.def.id === 'robin' && pd.kind === 'feather' && !rec.instanced && /^r_[a-z]+(_mid)?$/.test(pd.id) && !/^r_(face|crown)/.test(pd.id) && LOOK.quality === 'high' && LOOK.part('fur')) {   // the face's and crown's feathers are a few millimetres long and read as a smooth surface: they keep the shell
      const mid = /_mid$/.test(pd.id), face = /^r_(face|crown)/.test(pd.id);
      const len = face ? .0055 : /^r_(back|flank|rump|nape)/.test(pd.id) ? .0095 : .008;   // small on the face and crown, longest on the back (judged from photographs)
      thLkPlumage(rec, geo, { step: len * (mid ? .5 : .33), len, aspect: .72, lift: .12, off: .0004, near: 7, seed: pd.id.length * 131 + pd.id.charCodeAt(2), bib: TH_BIB.O.test(pd.id), T: this });   // spaced at a third of a feather's length: each overlaps the next by two-thirds
    }
    if (this.def.id === 'robin' && /^(eye|eye_ring|og_eyeballs|ey_scleral_ring)$/.test(pd.id)) thLkSinkEye(m, geo, /^(og_|ey_)/.test(pd.id) ? .005 : .0018, pd.id === 'eye_ring' ? '#2e2620' : null, null, pd.id === 'eye_ring' ? .82 : 1);   // the eyeball of the anatomy (pale, larger than the black eye) sinks out of sight behind it; the lid ring closes in on the eye   // a quiet eye: sunk under its lids, the rim dark
    if (this.def.id === 'robin' && !rec.instanced && TH_BIB.O.test(pd.id)) thLkBib(rec, geo, this);   // the bib's orange, its narrow grey margin
    if ((this.def.id === 'robin' && pd.kind === 'feather') || (this.def.id === 'dog' && pd.kind === 'fur')) thLkCoatFill(m);   // the coat in shade stays a mid-tone
    if (this.def.id === 'robin' && rec.instanced && pd.kind === 'feather' && pd.instances !== 'rach') {   // wing and tail feathers: barbs, shaft and a paler fringe on the blade
      thCardUV(geo); const m = rec.g.userData.main.material; m.map = thLkFeatherTex(true); m.needsUpdate = true;
      LOOK.patch(m, 'thflightmap', sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n\t{ vec4 thF = texture2D( map, vUv ); diffuseColor.rgb *= pow( 2.0 * thF.rgb, vec3( 0.4545 ) ); }\n#endif'); });
    }
    if (pd.card && pd.kind === 'leaf' && (pd.card.kind === 'lobed_leaf' || pd.card.kind === 'leaf_cluster') && this.def.id === 'oak') { rec.lkLeaf = true; rec.lkT = this; }
    if (this.def.id === 'dog' && (pd.id === 'eyes' || pd.id === 'eye_front')) thLkSinkEye(m, geo, .0015, null, [.94, .34]);   // a quiet eye: sunk under its lids, which take a dark margin (thEyeRim)
    if (this.def.id === 'dog' && pd.id === 'claws') thLkClaws(geo);
    if (this.def.id === 'dog' && /^coat/.test(pd.id)) thLkDogEye(this);
    if (this.def.id === 'dog' && !rec.instanced && LOOK.quality === 'high' && LOOK.part('fur')) {
      /* a Labrador's coat is short and dense, lying nose to tail; shortest on the face and the lower legs and paws (about a third), short
         on the ears; the ears lie on the head, so the head's hairs stop short of them */
      if (pd.mesh === 'coat') thLkFur(rec, geo, { coat: true, feet: thLkDogFeet(thGeo(this.def.id, this.bundle, 'claws')), field: TH_DOGCOMB, n: 8, len: .007, cell: .0006, stretch: 8, lean: 2.4, root: .74, tip: 1.06, bare: [thGeo(this.def.id, this.bundle, 'nose'), thGeo(this.def.id, this.bundle, 'ears')], bareR: .012, lenAt: v => (v.x > .27 && v.y > .42 ? .45 + .55 * Math.max(0, Math.min(1, (.36 - v.x) / .09)) : 1) * (v.y < .3 ? .5 + .5 * Math.max(0, Math.min(1, (v.y - .1) / .2)) : 1) });
    }
    if (this.def.id === 'dog' && /^coat/.test(pd.id)) LOOK.patch(m, 'thdogcoat', sh => thLkHairChunks(sh, TH_DOGCOMB, { cell: .0006, stretch: 8, feet: thLkDogFeet(thGeo(this.def.id, this.bundle, 'claws')) }));   // the coat's skin carries the same streaks, pigment and sheen as its shells, and the lips and toes
    if (this.def.id === 'dog' && pd.id === 'ears') LOOK.patch(m, 'thdogear', sh => thLkHairChunks(sh, TH_EARCOMB, { cell: .0009, stretch: 6 }));   // the ear in the coat's own short hair (its shells drew a tweed with a jagged dark rim)
    if (this.def.id === 'dog' && pd.id === 'nose') thLkNose(m);   // the coat's skin carries the same streaks, pigment and sheen as its shells
    if (this.def.id === 'dog' && pd.id === 'fur') LOOK.patch(m, 'thdogblade', sh => {   // the coat's guard-hair blades: as short as the coat where it is short (face, legs), not a halo of spikes round the head
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
	#ifdef USE_INSTANCING
	{ vec3 thO = instanceMatrix[ 3 ].xyz; float thK = ( thO.x > .27 && thO.y > .42 ? .35 + .65 * clamp( ( .36 - thO.x ) / .09, 0.0, 1.0 ) : 1.0 ) * ( thO.y < .3 ? .3 + .7 * clamp( ( thO.y - .1 ) / .2, 0.0, 1.0 ) : 1.0 ) * smoothstep( 0.04, 0.09, thO.y ); transformed *= vec3( 1.0, thK, 1.0 ); }   // none on the toes: the pale blades there drew a dotted fringe
	#endif`);
    });
    if (TH_SET_OF[pd.kind]) {
      rec.lkSet = TH_SET_OF[pd.kind];
      if (rec.instanced) { const im = rec.g, M = new THREE.Matrix4(), s = new V3(), q = new THREE.Quaternion(), p = new V3(), sc = []; for (let i = 0; i < im.count; i += Math.max(1, Math.floor(im.count / 64))) { im.getMatrixAt(i, M); M.decompose(p, q, s); sc.push((s.x + s.y + s.z) / 3); } sc.sort((a, b) => a - b); rec.lkUnit = sc[sc.length >> 1] || 1; }
    }
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
    if (TH_LK.on) { const mm = g.userData.main; mm.material.dispose(); mm.material = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, fog: false }); }   // a marker is a pointer, not a thing in the light: unlit, untoned, no fog or occlusion, as bright as it was drawn
    g.children.forEach(m => { m.material.depthTest = false; m.renderOrder = m.userData.outline ? 9 : 10; });   // ink first, fill on top (both in the blended pass, where renderOrder decides)
    if (!TH_LK.on) thPatch(g.userData.main.material, null, this.L);
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
        if (TH_LK.on) { const rim = mat.userData.thRim; if (mat.userData.thGhost) mat.userData.thGhost.value = op < (pd.opacity_max ?? 1) * alpha - .005 ? 1 : 0; LOOK.selSet(mat, (isSel ? 1 : this.hovId === pd.id ? .55 : 0) * op); if (r.lkSet) thLkApplySet(r); if (r.lkLeaf) thLkApplyLeaves(r); if (r.lkSprayN) { r.g.geometry.setDrawRange(0, this.lkFocus ? Infinity : r.lkSprayN); if (this.lkFocus && this.dist < TH_LEAF.fine && !TH_LEAF.pf) thLkLeavesFine(); } if (r.lkFur) r.lkFur.visible = op > .95 && !cut && (this.lkFocus ? this.dist < (r.lkFurNear || TH_FUR_NEAR) : this.dist < r.lkFurAny); }
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
    if (pl.on) F.place = () => { if (TH_LK.on && F.T) thLkRide(F, F.T); };   // riding the host's sway is done where frames are placed, before the cameras are: the camera that rides with her is then where she is in the same frame
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
  F.blurb = def.blurb || ''; F.note = (F.opts.note ? F.opts.note + ' ' : '') + thModelNote(def); F.timeNote = T.timeNote || '';
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
  F._seen = performance.now(); if (TH_LK.on) thLkFillStep();
  // sun and sky light copied from the park (or from the frame the thing stands in: a landscape, the Earth) so shading and day/night agree; a thing in a device or on the stage keeps its plain pair
  const env = F.opts.env || 'park', P = env === 'park' ? FR.park : env === 'sun' ? F.parent : null;
  if (P && P.scene) {
    let hl = P._thL; if (!hl || hl.scene !== P.scene) { hl = P._thL = { scene: P.scene, sun: null, hemi: null }; P.root.traverse(o => { if (o.isDirectionalLight && !hl.sun) hl.sun = o; if (o.isHemisphereLight && !hl.hemi) hl.hemi = o; }); }
    const L = env === 'park' ? TH_LIGHT : F.thL;
    // this frame's own lights are copies of the host's (used when it is drawn alone); the reduction to sun x 0.75 and sky x 0.55 (less at night) is in the shader (thPatch)
    if (hl.sun) { T.lights.sun.position.subVectors(hl.sun.position, hl.sun.target.position).normalize().multiplyScalar(40); T.lights.sun.intensity = hl.sun.intensity; T.lights.sun.color.copy(hl.sun.color); L.uThSun.value = LOOK.on ? 1 : .75; }   // the realistic look (js/look.js) takes the light as it is
    if (hl.hemi) { const day = Math.min(1, hl.sun ? hl.sun.intensity / 1.15 : 1); T.lights.hemi.intensity = hl.hemi.intensity; T.lights.hemi.color.copy(hl.hemi.color); T.lights.hemi.groundColor.copy(hl.hemi.groundColor); /* the sky light's direction is up (the engine keeps a hemisphere light's direction independent of the camera: fixSceneLights) */ L.uThSky.value = LOOK.on ? 1 : .55 * (.18 + .82 * day); }
    else if (env === 'sun') { T.lights.hemi.intensity = .12; L.uThSky.value = 1; }   // in space there is no sky: a little fill light so the night side is not black
    if (env === 'park' && P.scene.fog && F.scene.fog !== P.scene.fog) F.scene.fog = P.scene.fog;
  }
  const C = F.C || _thV.set(0, 0, 0);   // camera position in frame coordinates; in the shifted frame root the camera sits at the world origin (T.camW stays 0)
  _thOff.copy(F.root.position);
  // the part a card is about stays selected only while its card is open
  if (F.sel || F.reveal) { const st = infoState, keep = st && ((st.h && st.h.frame === F && st.h.obj && st.h.obj.userData.id === F.sel) || (!st.h && st.node === F.selNode)); if (!keep) { F.sel = null; F.reveal = null; } }
  T.sel = F.sel; thAutoUpdate(F, dt);
  if (F.spawnHold && cam.A !== F && !fly) F.spawnHold = 0;
  if (F.T) F.T.lkFocus = cam.A === F;   // the realistic look keeps its costliest extras (the dog's undercoat) for the thing being looked at
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
const thOver = (F, rec) => typeof DESCENT !== 'undefined' && !!DESCENT.over && DESCENT.over(F, thQuery(rec));   // the thing's assignment file replaces this part's own `deeper` (`over`: the dog's tendons lead into tendon, not into its muscle scene)
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
  if (rec.pd.deeper && !thOver(F, rec)) return own(thDeepFrame(rec.pd.deeper, T0, undefined, F.unit));
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
  f.dynamic = true; f.keep = performance.now() + 60000; F.addChild(f); f.ensure(); flyTo(f, new V3(), d.D || TH_DEEP_D[d.type] || 4e-9, undefined, thSceneDir(f));
}
/* A tissue scene is a slice: a slab across x and y, thin in z, with its names on the near (+z) face (tools/things/SCHEMA.md section 5). It is entered
   looking at that face, a little from above. Without this the camera kept the direction it came with, and a slice could be seen edge-on (the dog's tendon:
   a thin column of fibres). */
const thSceneDir = f => f && f.type === 'tissue2' ? new V3(0, .3, 1) : undefined;
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
  const sys = pd && pd.system, inner = sys && T.rank[sys] > 0;   // a part of an inner layer, uncovered to be clicked (the dog's tendons, its kidneys)
  for (const m of T.def.modes) {
    if (!m.cut && !m.pivot) continue;
    if (inner && ((m.show || {})[sys] ?? (m.show || {})['*'] ?? 0) < .5) continue;   // a cut view that does not draw it is no way into it: the foreleg's tendons opened "Inside the heart"
    if (inner && m.cut && m.cut.normal && pd.center && pd.radius && (m.cut.at || (T.def.cut && T.def.cut.at))) {   // ... nor one whose plane misses it: the cut face is capped, and what lies behind the cap is hidden (the dog's kidneys in "Cut in half")
      const a = m.cut.at || T.def.cut.at, n = new V3(...m.cut.normal).normalize();
      if (Math.abs(n.dot(new V3(...pd.center).sub(new V3(...a)))) > pd.radius) continue;
    }
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
  const d = ud.hotspot ? ud.hotspot.deeper : (F.T.parts[ud.id] || {}).pd && F.T.parts[ud.id].pd.deeper; if (!d || (!ud.hotspot && thOver(F, F.T.parts[ud.id]))) return undefined;
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
  const note = document.createElement('div'); note.className = 'note thNote'; note.textContent = thModelNote(def);
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
      const mid = thModeFor(T, t.part); if (mid) { T.setMode(mid); thUpdateControls(F); } F.sel = t.part.id; F.reveal = T.parts[t.part.id] && T.parts[t.part.id].rank !== undefined ? { id: t.part.id } : null;   // a reveal left from the part before would draw its layer in a view that does not show it
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
      else if (cn && !F.opts.ground && fly && fly.frame === F) {   // a fixed cut keeps the half beyond the plane: if the camera would land on the part's side, the part's aim point is cut away, so come from the other side (the view's own direction, mirrored if need be)
        const n = new V3(...cn).applyQuaternion(T.xf.q).normalize(), at = thLocalToFrame(t.def, t.pl, md.cut.at || (t.def.cut && t.def.cut.at) || [0, 0, 0]), side = n.dot(fly.p.clone().sub(at)), Dl = fly.Dg / F.unit;
        const away = d => Math.sign(side + Dl * n.dot(d)) === Math.sign(side), cur = cam.dir.clone(); convertD(cur, cam.A, F); cur.normalize();
        if (Math.abs(side) > 1e-6 * F.radius && away(cur)) { const dv = md.view && md.view.dir ? new V3(...md.view.dir).applyQuaternion(T.xf.q).normalize() : cur; if (away(dv)) dv.addScaledVector(n, -2 * n.dot(dv)); look(dv); }
      }
      const mv = (md || T.curMode || {}).view; if (mv && mv.dir && (t.part.parent || t.part.flow)) look(new V3(...mv.dir).applyQuaternion(T.xf.q).normalize());   // a detail of a cut view: from where the view shows its face; a flow (ions between the sheets): from where its view shows it
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
  const T = F.T, v = md && ((TH_LK.on && md.look_view) || md.view); if (!T || !v || !(frameWithin(cam.A, F) || drawn.includes(F))) return false;
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
  return { host: L, pos: new V3(a[0], pl.y ?? thGroundY(L, a[0], a[1]), a[1]), up: new V3(0, 1, 0), env: 'sun', ground: true, faceUp: true, merge: true, coMax: def.draw_m || 400, r1: Math.max(R * 12, 8) };
};
/* The height of a landscape's ground as drawn at (x, z). It is not 0 there: the far terrain is a coarse mesh (cells 50 m wide) and, where the relief is high
   (the rock biome rises 120 m), its faces stand metres above the fine "flat where you stand" mesh within the middle 60 m, which they hide. A thing placed at
   y = 0 was sunk 1.2 m into the visible ground (and hidden by it seen from one side). It stands on whichever surface is on top. */
const thGroundY = (L, x, z) => {
  L.ensure(); L.root.updateMatrixWorld(true);
  const o = L.root.position, rc = new THREE.Raycaster(new V3(x, 1e5, z).add(o), new V3(0, -1, 0)), g = L.pickables.filter(m => m.userData.id === 'ground');
  const h = rc.intersectObjects(g, false)[0]; return h ? h.point.y - o.y : 0;
};
/* A circular orbit round the Earth, drawn in the Earth's frame the way the ISS marker is: the period comes from the data (a sourced figure), not from a formula here. */
TH_HOSTS.orbit = (pl, def, R) => {
  const host = FR.earth; if (!host || !pl.period_min) return null;
  const r = (6371 + (pl.alt_km || 0)) * 1e3 / host.unit, T = pl.period_min * 60000, inc = (pl.incl_deg || 0) * Math.PI / 180, ph = (pl.phase_deg || 0) * Math.PI / 180, ax = new V3(1, 0, 0);
  const at = out => { const a = (simTime / T) % 1 * Math.PI * 2 + ph; return out.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyAxisAngle(ax, inc); };
  /* It moves at several kilometres a second. While a flight is heading for it (or has just ended at it) and the camera is still in the Earth's frame, the camera's
     target is carried along by the same step, so the flight closes in as on a thing that stands still; once inside its frame, the frame carries the camera. */
  const last = new V3();
  const place = f => { last.copy(f.pos); at(f.pos); if (cam.A === host && (fly ? fly.frame && chainOf(fly.frame).includes(f) : camHold === f)) cam.T.add(last.sub(f.pos).negate()); };
  return { host, pos: at(new V3()), up: null, env: 'sun', merge: false, ground: false, coMax: def.draw_m || R * 4000, r1: Math.max(R * 40, 50), place, note: 'Its place on the orbit is illustrative: the orbit has the right height, tilt and period, but not the real position for this moment.' };
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
  if (h.faceUp) f.faceUp = true;   // it stands on one-sided ground (a landscape): a flight to it does not end with the camera under that ground (faceSurface, js/engine.js)
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
    /* under the realistic look a tissue is a model in the studio, like the cell and the molecules (world_matter.js, MD): the graphite ground
       and its depth cue, the studio's lamp, materials of a kind, see-through layers as films, no ink outlines, and the note says Model */
    const TS = typeof MD !== 'undefined' && MD.on;
    if (TS) { MD.kind(F, 'Model', 'Colours are a code to tell the parts apart.'); MD.stage(F, { near: .8, far: 2.6 }); }
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
    /* what a click picks: the highest priority on the ray, as everywhere, but a see-through layer (a cartilage's matrix, a capsule, a fat cell's thin rim) only
       where nothing solid is on the ray behind it: what is seen through it is what is clicked (the chondrocytes inside the matrix) */
    F.chooseHit = cands => { const solid = cands.filter(c => (c.obj.userData.op ?? 1) >= .6), L = solid.length ? solid : cands; let b = null; for (const c of L) if (!b || c.pri > b.pri) b = c; return b; };
    F.cardMadeOf = (h, n) => { const d = h && h.obj && h.obj.userData.deeper; return d ? { label: d.button, go: () => thGoDeeper(h.frame, h, d) } : null; };
    Promise.all([thLoadTissue(o.id), loadNodes()]).then(([def]) => {
      if (!F.built) return;
      F.info = NODE[def.node] || null; F.blurb = def.blurb || ''; F.note = def.note || ''; F.name = def.title;
      if (!TS) F.env.bg = new THREE.Color(def.bg || '#f3efe6').getHex();
      const grp = new THREE.Group(); grp.position.set(-def.center[0], -def.center[1], -def.center[2]); F.add(grp);
      const built = {}, geos = {};
      for (const pop of def.populations) {
        const inst = thArrange(pop, built, rng((pop.arrange && pop.arrange.seed) || pop.id.length * 7 + 1)); built[pop.id] = inst; if (!inst.length) continue;
        const geo = geos[pop.shape] || (geos[pop.shape] = thShapeGeo(pop.shape)), op = pop.opacity ?? 1, c0 = new THREE.Color(pop.color).getHex();
        let mat;
        if (TS && op < .99) { mat = MD.film(c0, Math.min(.9, op * .7), Math.min(.95, op * 1.3 + .1)); mat.side = THREE.DoubleSide; mat.depthWrite = op > .9; }   // a see-through layer (mucus, a basement membrane): clearer face on, denser edge on
        else if (TS) { mat = MD.mat(c0, 'wet', { double: true, instanced: true }); }
        else { mat = illoMat(c0, { double: true }); mat.opacity = op; mat.transparent = mat.opacity < .99; mat.depthWrite = mat.opacity > .9; }
        const im = new THREE.InstancedMesh(geo, mat, inst.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), rr = rng(pop.id.length * 13);
        inst.forEach((t, i) => { thTissueQuat(t, pop, q); m4.compose(new V3(...t.p), q, new V3(...t.s)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setRGB(1 - rr() * .08, 1 - rr() * .06, 1 - rr() * .08)); });
        im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; grp.add(im);
        const nid = NODE[pop.node] ? pop.node : null, deeper = thTissueDeeper(def, pop); if (!nid) console.warn('tissue2', def.id, pop.id, 'has no card', pop.node);
        im.userData = { id: pop.id, node: nid, priority: pop.priority ?? 3, op, deeper, thing: 'tissue2', madeOf: deeper ? 'cell' : undefined, material: pop.material, info: { title: pop.name, tag: pop.tag || def.tag || 'Inside the tissue', body: '' }, main: im };
        { const cen = im.userData.cen = new Float32Array(inst.length * 4), gp = grp.position; inst.forEach((t, i) => { cen[i * 4] = t.p[0] + gp.x; cen[i * 4 + 1] = t.p[1] + gp.y; cen[i * 4 + 2] = t.p[2] + gp.z; cen[i * 4 + 3] = Math.min(t.s[0], t.s[1], t.s[2]) / 2; }); }   // centres (frame coordinates) and half the smallest side, for "the structure nearest this point"
        im.userData.resolve = () => pop.id; im.userData.pickRoot = im;
        F.pickables.push(im); if (nid) regMesh(pop.id, im);
        if (pop.ink && !TS) { const io = new THREE.InstancedMesh(geo, thInstOutline(0x1a2b1a, .0016), inst.length); io.instanceMatrix = im.instanceMatrix; io.frustumCulled = false; io.renderOrder = -1; grp.add(io); }
      }
      for (const lb of def.labels || []) { const a = new THREE.Object3D(); a.position.set(...lb.at); grp.add(a); const pm = F.pickables.find(p => p.userData.id === lb.pop); F.label(a, lb.text, { pick: pm, cls: 'thTis' }); }
    });
  }
};
