'use strict';
/* ================= HELPERS ================= */
const texCache = {};
function canvasTex(key, w, h, draw, opts = {}) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h, c);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  if (opts.wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  texCache[key] = t; return t;
}
function glowTex() {
  return canvasTex('glow', 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.65)');
    gr.addColorStop(.45, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
}
function ringTex() {
  return canvasTex('ringmark', 128, 128, (g) => {
    g.strokeStyle = 'rgba(255,220,140,1)'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke();
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 22); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(1, 'rgba(255,200,100,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 22, 0, TAU); g.fill();
  });
}
function glowSprite(color, size, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s;
}
function smat(color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .45, metalness: .05 }, o)); }
const hitMat = () => new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
function hitSphere(r, id, priority = 2) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), hitMat()); m.userData = { id, priority }; return m; }
function cylBetween(a, b, r, mat, seg = 14) {
  const d = new V3().subVectors(b, a); const len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg, 1), mat);
  m.position.copy(a).addScaledVector(d, .5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); return m;
}
function pointsMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: PIXR_BASE * (o.scale || 1) }, uPixK: PIXK, uOpacity: { value: o.opacity ?? 1 }, uExpand: { value: 1 }, uMaxPx: { value: 64 } }, // uPixK: the render scale relative to PIXR_BASE (engine.js), so points keep their size on screen when the scale adapts
    vertexShader: LDV(`attribute float aSize; attribute vec3 aColor; varying vec3 vColor; uniform float uScale; uniform float uPixK; uniform float uExpand; uniform float uMaxPx;
      void main(){ vColor=aColor; vec4 mv=modelViewMatrix*vec4(position*uExpand,1.0); gl_PointSize=min(aSize*uScale*(300.0/-mv.z), uMaxPx)*uPixK; gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(`varying vec3 vColor; uniform float uOpacity;
      void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); a*=a; gl_FragColor=vec4(vColor, a*uOpacity); }`),
    transparent: true, depthWrite: false, blending: o.blending ?? THREE.AdditiveBlending
  });
}
function makePoints(pos, col, size, o) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  const p = new THREE.Points(g, pointsMaterial(o)); p.frustumCulled = false; return p;
}
function starfield(n, rMin, rMax, seed = 7, mul = 1) {
  const r = rng(seed), pos = [], col = [], sz = [];
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * TAU, s = Math.sqrt(1 - u * u), R = lerp(rMin, rMax, r());
    pos.push(R * s * Math.cos(th), R * u, R * s * Math.sin(th));
    const t = r(); const c = t < .15 ? [1, .82, .62] : t < .35 ? [.72, .82, 1] : [1, 1, 1]; const b = .45 + r() * .55;
    col.push(c[0] * b, c[1] * b, c[2] * b); sz.push((0.7 + r() * r() * 2.6) * mul * R / 210);
  }
  return makePoints(pos, col, sz);
}
function fresnelMat(color, pow = 2, intensity = 1, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPow: { value: pow }, uInt: { value: intensity }, uBase: { value: o.base || 0 } },
    vertexShader: LDV(`varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(`uniform vec3 uColor; uniform float uPow; uniform float uInt; uniform float uBase; varying vec3 vN; varying vec3 vV;
      void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uPow); float a=clamp(f*uInt+uBase,0.,1.); gl_FragColor=vec4(uColor*a,a); }`),
    transparent: true, depthWrite: false, side: o.side || THREE.FrontSide, blending: THREE.AdditiveBlending
  });
}
function haloMat(color, k = 3) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uK: { value: k } },
    vertexShader: LDV(`varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(`uniform vec3 uColor; uniform float uK; varying vec3 vN; varying vec3 vV;
      void main(){ float d=abs(dot(normalize(vN),normalize(vV))); float a=clamp(pow(d,1.6)*uK,0.,1.); gl_FragColor=vec4(uColor*a,a); }`),
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending
  });
}
const NOISE_GLSL = `
float hash3(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise3(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
 return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm3(vec3 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise3(p); p*=2.03; a*=.5; } return v; }`;
function lonlatXY(lon, lat, w, h) { return [(lon + 180) / 360 * w, (90 - lat) / 180 * h]; }
function pathPolys(g, polys, w, h) {
  g.beginPath();
  for (const p of polys) { for (let i = 0; i < p.length; i += 2) { const [x, y] = lonlatXY(p[i], p[i + 1], w, h); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
}
function rgba(hex, a) { const c = new THREE.Color(hex); return `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${a})`; }
