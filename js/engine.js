'use strict';
/* =====================================================================
   Cosmic Zoom v3 engine — one continuous camera through nested real-scale frames.
   Each Frame has its own unit (meters per local unit), placement in its parent
   (pos in parent units + quaternion), and a visibility range of camera distances.
   The camera orbits a target point T (anchor-frame coords) at distance D (meters).
   ===================================================================== */
const V3 = THREE.Vector3, TAU = Math.PI * 2;
const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r()); }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const SUPM = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '.': '·' };
const sup = n => String(n).split('').map(c => SUPM[c] || c).join('');
const store = {
  get(k, d) { try { const v = localStorage.getItem('cz3_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cz3_' + k, JSON.stringify(v)); } catch (e) { } }
};
const U = { fm: 1e-15, pm: 1e-12, A: 1e-10, nm: 1e-9, um: 1e-6, mm: 1e-3, m: 1, km: 1e3, Mm: 1e6, AU: 1.495978707e11, ly: 9.4607e15, pc: 3.0857e16, kpc: 3.0857e19, Mpc: 3.0857e22 };
function fmtLen(m) {
  const a = Math.abs(m);
  const pick = [[U.Mpc * 1000, 'billion light-years', 9.4607e24], [U.ly * 1e6, 'million light-years', 9.4607e21], [U.ly * 1000, 'thousand light-years', 9.4607e18], [U.ly * .5, 'light-years', U.ly], [U.AU * .5, 'AU', U.AU], [1e9, 'million km', 1e9], [1e3, 'km', 1e3], [1, 'm', 1], [1e-2, 'cm', 1e-2], [1e-3, 'mm', 1e-3], [1e-6, 'µm', 1e-6], [1e-9, 'nm', 1e-9], [1e-12, 'pm', 1e-12], [1e-15, 'fm', 1e-15], [1e-18, 'am', 1e-18], [0, 'zm', 1e-21]];
  for (const [th, name, f] of pick) if (a >= th) { const v = a / f; return (v >= 1000 ? Math.round(v).toLocaleString('en-US') : v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + name; }
}
/* ---- logarithmic depth support for custom shaders ---- */
function LDV(src) { return '#include <common>\n#include <logdepthbuf_pars_vertex>\n' + src.replace(/\}\s*$/, '\n#include <logdepthbuf_vertex>\n}'); }
function LDF(src) { return '#include <logdepthbuf_pars_fragment>\n' + src.replace(/void main\(\)\s*\{/, 'void main(){\n#include <logdepthbuf_fragment>\n'); }

/* ================= RENDERER ================= */
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
let W = innerWidth, H = innerHeight, composer = null, bloom = null;
const BLOOM_OK = !!(THREE.EffectComposer && THREE.UnrealBloomPass) && !/Mobi|Android/i.test(navigator.userAgent);
class FramesPass extends (THREE.Pass || class { }) {
  constructor() { super(); this.needsSwap = false; this.clear = true; }
  render(r, wb, rb) { r.setRenderTarget(this.renderToScreen ? null : rb); renderFrames(r); }
}
function setupComposer() {
  if (!BLOOM_OK) return;
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new FramesPass());
  bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W, H), .55, .45, .86);
  composer.addPass(bloom);
}
function resize() {
  W = innerWidth; H = innerHeight; renderer.setSize(W, H, false);
  if (composer) composer.setSize(W, H);
  forEachFrame(f => { if (f.cam) { f.cam.aspect = W / H; f.cam.updateProjectionMatrix(); } });
}
addEventListener('resize', resize);

/* ================= FRAMES ================= */
const FT = {};           // frame type registry: FT[type] = { build(F, opts) }
let building = null;     // frame currently being built (for seg/actBtn/labels)
const _cc = new THREE.Vector3();
class Frame {
  constructor(o) {
    Object.assign(this, { name: '', unit: 1, radius: 1, r0: 0, r1: Infinity, parent: null, pos: new V3(), quat: new THREE.Quaternion(), children: [], opts: {}, dynamic: false, info: null, up: null, env: null }, o);
    this.built = false; this.alpha = 0; this.lastUsed = 0; this.cam = new THREE.PerspectiveCamera(50, W / H, 1e-3, 1e6);
  }
  ensure() {
    if (this.built) return;
    this.scene = new THREE.Scene(); this.root = new THREE.Group(); this.scene.add(this.root);
    this.pickables = []; this.labels = []; this.uiEls = []; this.update = null; this.mats = null;
    const prev = building; building = this;
    try { FT[this.type].build(this, this.opts); } catch (e) { console.error('build failed', this.type, e); }
    finally { building = prev; }
    this.built = true;
  }
  add(o) { this.root.add(o); return o; }
  pick(o, id, priority) { o.userData.id = id; if (priority !== undefined) o.userData.priority = priority; this.pickables.push(o); return o; }
  label(obj, text, o = {}) { return addLabelTo(this, obj, text, o); }
  addChild(c) { c.parent = this; this.children.push(c); return c; }
  // `center` (optional, own units) is where the content is centred when that is not the frame origin (the body's origin is at its feet)
  containsP(p) {
    if (this.radius === Infinity) return true;
    let c = this.pos; if (this.center) { c = _cc.copy(this.center).multiplyScalar(this.unit / this.parent.unit).applyQuaternion(this.quat).add(this.pos); }
    return p.distanceTo(c) <= this.radius * this.unit / this.parent.unit * 1.02;
  }
  dispose() {
    if (!this.built) return;
    this.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
    (this.labels || []).forEach(l => l.el.remove()); (this.uiEls || []).forEach(e => e.remove());
    if (this.onDispose) this.onDispose();
    this.built = false; this.scene = null; this.root = null;
  }
}
let ROOT = null;
function forEachFrame(fn, f = ROOT) { if (!f) return; fn(f); f.children.forEach(c => forEachFrame(fn, c)); }
function chainOf(f) { const a = []; while (f) { a.push(f); f = f.parent; } return a; }
// --- point/direction transforms (float64) ---
const _q = new THREE.Quaternion();
function toParentP(f, p) { return p.multiplyScalar(f.unit / f.parent.unit).applyQuaternion(f.quat).add(f.pos); }
function fromParentP(f, p) { return p.sub(f.pos).applyQuaternion(_q.copy(f.quat).invert()).multiplyScalar(f.parent.unit / f.unit); }
function toParentD(f, d) { return d.applyQuaternion(f.quat); }
function fromParentD(f, d) { return d.applyQuaternion(_q.copy(f.quat).invert()); }
function convertP(p, from, to) {
  if (from === to) return p;
  const A = chainOf(from), B = chainOf(to), lca = A.find(x => B.includes(x));
  for (let f = from; f !== lca; f = f.parent) toParentP(f, p);
  const down = B.slice(0, B.indexOf(lca)).reverse();
  for (const f of down) fromParentP(f, p);
  return p;
}
function convertD(d, from, to) {
  if (from === to) return d;
  const A = chainOf(from), B = chainOf(to), lca = A.find(x => B.includes(x));
  for (let f = from; f !== lca; f = f.parent) toParentD(f, d);
  for (const f of B.slice(0, B.indexOf(lca)).reverse()) fromParentD(f, d);
  return d;
}

/* ================= CAMERA STATE ================= */
const cam = { A: null, T: new V3(), D: 10, dir: new V3(0, .4, 1).normalize(), up: new V3(0, 1, 0) };
const anchored = [];  // extra points that live in anchor coords and must follow re-anchoring: {p}
function rotAnchored(fn) { fn(cam.T, 'p'); fn(cam.dir, 'd'); fn(cam.up, 'd'); anchored.forEach(a => fn(a.p, 'p')); }
function ascend() { const f = cam.A; rotAnchored((v, k) => k === 'p' ? toParentP(f, v) : toParentD(f, v)); cam.A = f.parent; }
function descend(c) { rotAnchored((v, k) => k === 'p' ? fromParentP(c, v) : fromParentD(c, v)); cam.A = c; c.entered = true; }
let camHold = null; // the frame the last flight was sent to: its children are not entered on landing (only by scrolling in, or by being on a flight's path)
let lastZoomHit = null; // {frame, obj, point (frame-local), normal (frame-local)}
let _fp = null;
function reanchor() {
  for (let g = 0; g < 60 && cam.A.parent; g++) {
    const A = cam.A;
    const outside = A.radius !== Infinity && (A.center ? _cc.copy(cam.T).sub(A.center) : cam.T).length() > A.radius * 1.08;
    // a flight heading for a frame that A is not on the way to (a sibling, or a cousin such as the skin from inside the lung): step back out
    const offPath = fly && fly.frame && A.parent && (_fp = chainOf(fly.frame), !_fp.includes(A));
    if (cam.D > A.r1 || outside || offPath) { ascend(); continue; }
    break;
  }
  for (let g = 0; g < 60; g++) {
    const A = cam.A; A.ensure(); let next = null;
    next = pickChild(A);
    if (!next && A.spawn && !fly && cam.D < (A.spawnD || A.r0 * 1.6)) next = trySpawn(A); // a flight heads for a frame that already exists: never spawn stand-ins on the way
    if (!next) break;
    descend(next);
  }
  // dispose dynamic frames we've left far behind
  forEachFrame(f => {
    if (f.dynamic && f.parent && !drawn.includes(f) && !chainOf(cam.A).includes(f) && cam.D > f.r1 * 3 && !(f.keep > performance.now()) && !(fly && fly.frame === f)
      && (f.entered || !chainOf(cam.A).includes(f.parent) || cam.D > (f.parent.spawnD || f.parent.r0 * 1.6) * 3)) {
      f.dispose(); f.parent.children.splice(f.parent.children.indexOf(f), 1); if (f.proxy) f.proxy.visible = true;
    }
  });
}
// Which child frame to enter when several overlap the camera target. Prefer the one on the path of the current flight.
// Otherwise prefer a frame whose core (`core`, default `radius`, in its own units) holds the target, the smallest such core first
// (a heart sits inside the chest volume of a lung); failing that, the best fit: smallest distance from its centre relative to its radius.
// place() of a frame that is not built yet may depend on things that do not exist: a failure leaves it where it was and is reported once
function safePlace(c) { if (!c.place) return; try { c.place(); } catch (e) { if (!c._placeErr) { c._placeErr = 1; console.warn('place() failed before the frame was built:', c.name, e.message); } } }
function pickChild(A) {
  const path = fly && fly.frame ? chainOf(fly.frame) : null;
  let best = null, bs = Infinity;
  for (const c of A.children) {
    safePlace(c);
    if (cam.D > c.r1 || !c.containsP(cam.T)) continue;
    if (camHold === A && !(path && path.includes(c))) continue;
    if (c.enterOnly && !(path && path.includes(c))) continue; // entered on purpose only (a flight to it), never by scroll-zoom
    if (path && !path.includes(c) && path.includes(A) && chainOf(c).includes(fly.frame)) continue; // flying out to a frame: do not dive back into one of its children on the way
    if (path && path.includes(c)) return c;
    const k = c.unit / A.unit, dist = cam.T.distanceTo(c.pos), rad = c.radius === Infinity ? Infinity : c.radius * k;
    const core = (c.core ?? c.radius) * k;
    const s = dist <= core ? core : 1e3 + (rad === Infinity ? 1e9 : dist / rad); // inside a core: ranked by core size, below any fit score
    if (s < bs) { bs = s; best = c; }
  }
  return best;
}
function trySpawn(A) {
  let hint = null;
  if (lastZoomHit && lastZoomHit.frame === A && lastZoomHit.point.distanceTo(cam.T) < Math.max(cam.D / A.unit * 10, A.radius * 1e-4)) hint = lastZoomHit;
  if (A.children.some(c => c.dynamic && c.containsP(cam.T))) return null;
  // a pending (not yet visible) child near the view follows the zoom target until it appears
  const pend = A.children.find(c => c.dynamic && !c.entered && c.pos.distanceTo(cam.T) < cam.D / A.unit * 3);
  if (pend) { if (cam.D > pend.r1 && !pend.pinned) pend.pos.copy(cam.T); return pend.containsP(cam.T) && cam.D <= pend.r1 ? pend : null; }
  if (!hint && A._spawnFail && A._spawnFail.distanceTo(cam.T) < cam.D / A.unit * .5) return null; // a failure without a surface under the cursor must not block a spawn that now has one
  const c = A.spawn(cam.T.clone(), hint);
  if (!c) { A._spawnFail = cam.T.clone(); return null; }
  A._spawnFail = null; c.dynamic = true; A.addChild(c);
  return c.containsP(cam.T) && cam.D <= c.r1 ? c : null;
}
function camPosIn(f, out) { out.copy(cam.dir).multiplyScalar(cam.D / cam.A.unit).add(cam.T); return convertP(out, cam.A, f); }

/* ================= ACTIVE FRAMES & RENDER ================= */
let active = [];  // frames on the camera's chain this tick, outermost first
let drawn = [];   // everything rendered this tick, in draw order: the chain plus co-rendered neighbours (see computeActive)
function frameAlpha(f) {
  let a = 1;
  if (f !== cam.A || true) {
    if (f.r1 !== Infinity) a = Math.min(a, 1 - smooth(f.r1 * .4, f.r1, cam.D));
    if (f.r0 > 0 && f !== cam.A) a = Math.min(a, smooth(f.r0 * .25, f.r0, cam.D));
  }
  return a;
}
function computeActive() {
  const ch = chainOf(cam.A).reverse(); // root ... A
  const list = [];
  for (const f of ch) {
    let a = f === cam.A ? Math.max(frameAlpha(f), cam.D < f.r0 ? 1 : 0) : frameAlpha(f);
    if (f.coRender && f.parent && f.parent.unit === f.unit) a = coAlpha(f, true); // in the chain: only the distance fade, never the parent's r0 fade
    // a neighbour looks the same whether or not the camera is anchored in it
    f.alpha = a; if (a > .004) list.push(f);
  }
  if (!list.includes(cam.A)) list.push(cam.A);
  // an inner frame with an opaque environment hides everything behind it
  let start = 0; for (let i = list.length - 1; i >= 0; i--) if (list[i].env && list[i].env.opaque && list[i].alpha > .995) { start = i; break; }
  active = list.slice(start);
  // proxies: hide the parent's stand-in when its child frame is fully shown
  for (const f of ch) if (f.proxy) f.proxy.visible = !(f.alpha > .98 && active.includes(f));
  // Neighbours. A child marked coRender (same unit as its parent) is drawn whenever its parent is, even when the camera
  // is not anchored inside it, and shares the parent's depth buffer so near things hide far things across frames.
  drawn = [];
  for (const f of active) {
    f._share = !!(f.coRender && f.parent && f.parent.unit === f.unit && drawn.includes(f.parent));
    drawn.push(f);
    for (const c of f.children) {
      if (!c.coRender || c.unit !== f.unit || active.includes(c)) continue;
      safePlace(c);
      const a = coAlpha(c);
      c.alpha = a; c._share = true;
      if (c.proxy) c.proxy.visible = !(a > .98);
      if (a > .004) drawn.push(c);
    }
  }
}
const _cv = new V3();
// visibility of a co-rendered child: its parent's, fading out with the camera's distance from it (coMax metres, default r1)
function coAlpha(c, inChain) {
  const p = c.parent, lim = c.coMax || c.r1;
  const pa = inChain || p === cam.A ? 1 : (p.alpha ?? 1);
  if (lim === Infinity) return pa;
  const dist = camPosIn(p, _cv).distanceTo(c.pos) * p.unit;
  return Math.min(pa, 1 - smooth(lim * .7, lim, dist));
}
function applyFade(f) {
  const a = f.alpha;
  if (f.noFade || (a > .995 && !f._faded)) return;
  if (!f.mats) { f.mats = []; f.root.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if (!f.mats.includes(m)) f.mats.push(m); }); }); f.mats.forEach(m => { m.userData.baseOp = m.uniforms && m.uniforms.uOpacity ? m.uniforms.uOpacity.value : m.opacity; m.userData.baseTr = m.transparent; }); }
  const done = a > .995;
  f.mats.forEach(m => {
    const b = m.userData.baseOp ?? 1;
    if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = b * a;
    else { m.opacity = b * a; m.transparent = done ? m.userData.baseTr : true; }
  });
  f._faded = !done;
}
const _cp = new V3(), _tp = new V3(), _dv = new V3(), _uv = new V3();
function placeFrameCam(f) {
  camPosIn(f, _cp); _tp.copy(cam.T); convertP(_tp, cam.A, f);
  _dv.copy(cam.dir); convertD(_dv, cam.A, f); _uv.copy(cam.up); convertD(_uv, cam.A, f);
  f.C = (f.C || new V3()).copy(_cp);
  f.root.position.copy(_cp).negate();
  const c = f.cam, dl = cam.D / f.unit;
  c.position.set(0, 0, 0); c.up.copy(_uv); c.lookAt(_dv.negate());
  c.near = Math.max(dl * 2e-4, 1e-9); c.far = Math.max(dl * 1e7, f.radius * 8 + _cp.length() * 4);
  if (f._share) { c.near = f.parent.cam.near; c.far = f.parent.cam.far; } // same projection as the parent, so depths compare
  c.aspect = W / H; c.updateProjectionMatrix();
  f.dLoc = dl;
}
let simTime = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), 12, 0, 0), timeSpeed = 1, clock = 0;
function renderFrames(r) {
  r.setClearColor(0x000000, 1); r.clear(true, true, true);
  drawn.forEach((f, i) => {
    if (!f.scene) return;
    const bg = f.scene.background;
    if (i > 0) f.scene.background = null;
    else if (f.env && f.env.bg !== undefined && !bg) { r.setClearColor(f.env.bg, 1); r.clear(true, true, true); }
    if (!f._share) r.clearDepth();
    r.render(f.scene, f.cam);
    f.scene.background = bg;
  });
}

/* ================= INPUT: zoom-to-cursor, orbit, fly ================= */
const zoom = { pending: 0, pivot: null }; // pending = remaining ln(D) change
let lastInput = performance.now(), fly = null;
const MIN_D = 1e-20, MAX_D = 3e27; // 1e-20 m: below every length that has been probed; nothing is known to have structure there
function pivotAt(x, y) {
  const h = pickAt(x, y, true);
  if (h && !h.obj.userData.noZoom && h.meters < cam.D * 40 && (!h.obj.isSprite || h.frame === cam.A)) {
    const p = h.pointLocal.clone(); convertP(p, h.frame, cam.A);
    lastZoomHit = { frame: h.frame, obj: h.obj, point: h.pointLocal.clone(), normal: h.normalLocal, id: h.id, hit: h.hit };
    return p;
  }
  // no surface: a point along the ray at the current focus distance
  const f = cam.A; placeFrameCam(f);
  ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); raycaster.setFromCamera(ndc, f.cam);
  const p = raycaster.ray.direction.clone().multiplyScalar(cam.D / f.unit).add(f.C);
  lastZoomHit = null;
  return p;
}
function zoomBy(lnDelta, x, y) {
  lastInput = performance.now(); fly = null; cancelTour(); if (lnDelta < 0) camHold = null;
  if (lnDelta < 0 && x !== undefined) { const p = pivotAt(x, y); zoom.pivot = zoom.pivot || { p }; zoom.pivot.p.copy(p); if (!anchored.includes(zoom.pivot)) anchored.push(zoom.pivot); }
  else if (lnDelta > 0) { zoom.pivot = null; anchored.length = 0; }
  zoom.pending += lnDelta;
}
function applyZoom(dt) {
  if (Math.abs(zoom.pending) < 1e-5) { zoom.pending = 0; return; }
  const step = zoom.pending * (1 - Math.exp(-dt * 12));
  zoom.pending -= step;
  let lam = Math.exp(step);
  let nd = clamp(cam.D * lam, MIN_D, MAX_D);
  if (lam < 1 && cam.A.floorD) nd = Math.max(nd, Math.min(cam.D, cam.A.floorD)); // a floor, so the camera cannot sink into an empty region
  lam = nd / cam.D;
  mouse.dirty = true; // the view moves under a resting cursor: its tooltip and highlight must follow
  if (zoom.pivot && lam < 1) { // scale camera rig about the pivot: keeps the point under the cursor fixed
    const P = zoom.pivot.p;
    cam.T.sub(P).multiplyScalar(lam).add(P);
  }
  const A = cam.A; // some frames gently pull the zoom toward a key point (e.g. the invisible nucleus)
  if (lam < 1 && A.attract && cam.D < A.attractD && cam.T.distanceTo(A.attract) < A.attractR) { cam.T.sub(A.attract).multiplyScalar(lam).add(A.attract); if (zoom.pivot) zoom.pivot.p.copy(A.attract); }
  cam.D = nd;
}
function orbit(dx, dy) {
  const f = cam.A, k = .006;
  const upAxis = f.up ? f.up.clone() : cam.up.clone();
  const qy = new THREE.Quaternion().setFromAxisAngle(upAxis, -dx * k);
  cam.dir.applyQuaternion(qy); cam.up.applyQuaternion(qy);
  const right = new V3().crossVectors(cam.up, cam.dir).normalize();
  const qx = new THREE.Quaternion().setFromAxisAngle(right, -dy * k);
  const nd = cam.dir.clone().applyQuaternion(qx);
  if (f.up) { const pol = Math.acos(clamp(nd.dot(f.up), -1, 1)); if (pol < (f.minPolar ?? .02) || pol > (f.maxPolar ?? Math.PI - .02)) return; }
  cam.dir.copy(nd); cam.up.applyQuaternion(qx);
}
function levelUp(dt) {
  const f = cam.A; if (!f.up) return;
  const want = f.up.clone().sub(cam.dir.clone().multiplyScalar(f.up.dot(cam.dir)));
  if (want.length() < .15) return;
  want.normalize(); cam.up.lerp(want, 1 - Math.exp(-dt * 3)).normalize();
}
function orthoUp() { cam.dir.normalize(); cam.up.sub(cam.dir.clone().multiplyScalar(cam.up.dot(cam.dir))).normalize(); }
// fly to a point in a frame, ending at distance Dgoal (meters). Zooms out, travels, zooms in as needed.
function flyTo(frame, pointLocal, Dgoal, then) {
  if (typeof navFlyHook === 'function') navFlyHook(); // remember where we were, for Back
  zoom.pending = 0; zoom.pivot = null; anchored.length = 0; camHold = null;
  chainOf(frame).reverse().forEach(f => { f.ensure(); if (f.place) f.place(); }); // the whole path must exist and be in position
  fly = { frame, p: pointLocal.clone(), Dg: Dgoal, then, t: 0 };
  camHold = frame; // a flight lands in the frame it names, not in a child that happens to sit under the landing point; scrolling in again lifts this
}
function safeThen(t) { if (t) try { t(); } catch (e) { console.error('flight callback failed', e); } } // a throwing callback must not abort the frame
function stepFly(dt) {
  const F = fly; F.t += dt;
  const g = F.p.clone(); convertP(g, F.frame, cam.A);
  const distM = g.distanceTo(cam.T) * cam.A.unit;
  const wantD = Math.max(F.Dg, distM * (distM > cam.D * .6 ? 2.2 : 3)); // never zoom in faster than the target is being centred
  const lnD = Math.log(cam.D), lnW = Math.log(wantD);
  let dl = (lnW - lnD) * (1 - Math.exp(-dt * 2.6)); dl = clamp(dl, -dt * 4.2, dt * 4.2);
  cam.D = Math.exp(lnD + dl);
  if (distM > cam.D * .6) { const stepM = Math.min(distM, cam.D * dt * 1.6); cam.T.add(g.sub(cam.T).multiplyScalar(stepM / distM)); }
  else cam.T.lerp(g, 1 - Math.exp(-dt * 4));
  if (distM < cam.D * .02 && Math.abs(lnW - Math.log(cam.D)) < .03) { const t = F.then; fly = null; safeThen(t); }
  if (fly === F && F.t > 60) { const t = F.then; jumpTo(F.frame, F.p, F.Dg); safeThen(t); } // never strand a tour: finish the trip
}
// pointer handlers
const pointers = new Map(); let dragMoved = false, downPos = null, pinchD = 0;
const mouse = { x: 0, y: 0, has: false, dirty: false, touch: false };
canvas.addEventListener('wheel', e => { e.preventDefault(); let d = e.deltaY; if (e.deltaMode === 1) d *= 16; d = clamp(d, -240, 240); zoomBy(d * .0016 * (e.shiftKey ? 4 : 1), e.clientX, e.clientY); }, { passive: false });
canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); mouse.touch = e.pointerType === 'touch';
  if (pointers.size === 1) { dragMoved = false; downPos = { x: e.clientX, y: e.clientY }; }
  else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); dragMoved = true; }
  lastInput = performance.now(); closePops();
});
canvas.addEventListener('pointermove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; mouse.dirty = true;
  const p = pointers.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 1) { if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) dragMoved = true; if (dragMoved) { orbit(dx, dy); fly = null; cancelTour(); } }
  else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinchD > 0 && d > 0) zoomBy(Math.log(pinchD / d), (a.x + b.x) / 2, (a.y + b.y) / 2); pinchD = d; }
  lastInput = performance.now();
});
function endPointer(e, click) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (click && pointers.size === 0 && !dragMoved) onClick(e.clientX, e.clientY);
  if (pointers.size < 2) pinchD = 0;
}
canvas.addEventListener('pointerup', e => endPointer(e, true));
canvas.addEventListener('pointercancel', e => endPointer(e, false));
canvas.addEventListener('pointerleave', () => { mouse.has = false; setHover(null); });
canvas.addEventListener('dblclick', e => { cancelTour(); const h = pickAt(e.clientX, e.clientY); if (h) zoomIntoHit(h); });
let holdZoom = 0;
function bindHold(el, dir) {
  const start = e => { e.preventDefault(); holdZoom = dir; }, stop = () => { holdZoom = 0; };
  el.addEventListener('pointerdown', start); el.addEventListener('pointerup', stop); el.addEventListener('pointerleave', stop); el.addEventListener('pointercancel', stop);
}
addEventListener('keydown', e => {
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === '/') { e.preventDefault(); openLibrary(true); return; }
  if (k === '+' || k === '=') zoomBy(-.25, W / 2, H / 2);
  else if (k === '-' || k === '_') zoomBy(.25);
  else if (k === 'Escape') { closeInfo(); closePops(); fly = null; cancelTour(); $('#help').classList.add('hide'); }
  else if (k === 'ArrowLeft') orbit(-25, 0); else if (k === 'ArrowRight') orbit(25, 0);
  else if (k === 'ArrowUp') orbit(0, -17); else if (k === 'ArrowDown') orbit(0, 17);
  else return;
  lastInput = performance.now();
});

/* ================= PICKING / HOVER ================= */
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
raycaster.params.Points = { threshold: 1 }; raycaster.params.Line = { threshold: 1 };
function pickFrame(f, forZoom) { // best candidate inside one frame: highest priority, then nearest
  if (f.alpha < .5 || !f.pickables || !f.cam) return null;
  raycaster.setFromCamera(ndc, f.cam);
  raycaster.params.Points.threshold = f.dLoc * .012; raycaster.params.Line.threshold = f.dLoc * .01;
  const hits = raycaster.intersectObjects(f.pickables, true);
  const cands = [];
  for (const h of hits) {
    if (!visibleChain(h.object)) continue;
    let o = h.object; while (o && !o.userData.id && !o.userData.resolve) o = o.parent;
    if (!o) continue;
    if (forZoom && o.userData.noZoom && hits.length > 1) continue;
    cands.push({ frame: f, obj: o, hit: h, pri: o.userData.priority ?? 1 });
  }
  let fb = null;
  if (f.chooseHit) fb = f.chooseHit(cands, forZoom); // a frame may apply its own rule (the body: nearest part you can actually see)
  else { let bp = -Infinity; for (const c of cands) if (c.pri > bp) { fb = c; bp = c.pri; } }
  if (fb) fb.meters = fb.hit.distance * f.unit;
  return fb;
}
function pickAt(x, y, forZoom) {
  ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1);
  let best = null;
  // Walk inward to outward. Frames that share a depth buffer (a parent and its co-rendered children) form one group and
  // the nearest surface in the group wins; otherwise the innermost frame with a hit wins, since it is drawn on top.
  for (let i = drawn.length - 1; i >= 0 && !best;) {
    let j = i; while (j > 0 && drawn[j]._share) j--;
    for (let k = j; k <= i; k++) {
      const c = pickFrame(drawn[k], forZoom); if (!c) continue;
      if (!best || c.meters < best.meters) best = c;
    }
    i = j - 1;
  }
  if (!best) return null;
  const f = best.frame; best.ndc = ndc.clone();
  best.pointLocal = best.hit.point.clone().add(f.C);
  best.normalLocal = best.hit.face ? best.hit.face.normal.clone().transformDirection(best.hit.object.matrixWorld) : null;
  best.id = best.obj.userData.resolve ? best.obj.userData.resolve(best.hit) : best.obj.userData.id;
  return best;
}
function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
let hovered = null;
const _hc = new THREE.Color(.22, .24, .3);
function setHighlight(obj, on) {
  if (!obj) return;
  obj.traverse(o => { const m = o.material; if (!o.isMesh || !m || !m.emissive || m.userData.noHL) return; if (m.userData.baseEm === undefined) m.userData.baseEm = m.emissive.getHex(); if (on) m.emissive.setHex(m.userData.baseEm).add(_hc); else m.emissive.setHex(m.userData.baseEm); });
}
function setHover(o) { if (o === hovered) return; setHighlight(hovered, false); hovered = o; setHighlight(hovered, true); canvas.style.cursor = o ? 'pointer' : 'grab'; }
const tipEl = $('#tip');
function doHover() {
  mouse.dirty = false;
  if (!mouse.has || mouse.touch || pointers.size) { tipEl.classList.remove('show'); return; }
  const h = pickAt(mouse.x, mouse.y);
  if (h && (h.obj.userData.priority ?? 1) >= 0) {
    const ud = h.obj.userData, tf = ud.tipFn && ud.tipFn(h), d = tf ? { title: tf } : (ud.infoFn && ud.infoFn(h)) || ud.info || INFO[h.id] || (ud.title ? { title: ud.title } : null);
    setHover(h.obj);
    if (d) { tipEl.textContent = d.title; tipEl.classList.add('show'); tipEl.style.left = (mouse.x + 14) + 'px'; tipEl.style.top = (mouse.y + 14) + 'px'; } else tipEl.classList.remove('show');
  } else { setHover(null); tipEl.classList.remove('show'); }
}
let lastPick = null;
function onClick(x, y) {
  const h = pickAt(x, y);
  if (!h) { closeInfo(); return; }
  lastPick = h;
  if (h.obj.userData.onPick) h.obj.userData.onPick(h);
  showInfoFor(h);
}
function objRadiusLocal(obj) {
  if (obj.userData.radius && typeof obj.userData.radius === 'number') return obj.userData.radius;
  if (obj.isInstancedMesh || obj.isPoints) return null;
  const b = new THREE.Box3().setFromObject(obj), s = new V3(); b.getSize(s); const r = Math.max(s.x, s.y, s.z) / 2;
  return isFinite(r) && r > 0 ? r : null;
}
function zoomIntoHit(h) {
  const f = h.frame; let p, r;
  if (h.obj.userData.id === 'air' && f === FR.park && typeof placeGo === 'function') { placeGo('place:air'); return; } // the sky is not a place to fly to: go into the air itself
  const og = f.children && h.obj.userData.node && f.children.find(c => c.enterOnly && c.opts && c.opts.organ === h.obj.userData.node); // an organ you can see has a cut-open view: double-click goes inside, on purpose
  if (og) { flyTo(og, new V3(), og.opts.R * 2.2); return; }
  if (h.obj.userData.center) { p = h.obj.userData.center(h); r = (typeof h.obj.userData.radius === 'function' ? h.obj.userData.radius(h) : h.obj.userData.radius) || 1; }
  else {
    const rr = objRadiusLocal(h.obj);
    if (rr && rr < f.dLoc * 3) { p = new V3(); h.obj.getWorldPosition(p).add(f.C); r = rr; }
    else { p = h.pointLocal.clone(); r = f.dLoc * .05; }
  }
  lastZoomHit = { frame: f, obj: h.obj, point: h.pointLocal.clone(), normal: h.normalLocal, id: h.id, hit: h.hit };
  flyTo(f, p, Math.max(r * f.unit * 3.2, MIN_D * 10));
}

/* ================= LABELS ================= */
const labelLayer = $('#labels');
let labelsOn = store.get('labels', true);
function addLabelTo(f, obj, text, o = {}) {
  const el = document.createElement('div'); el.className = 'lbl' + (o.cls ? ' ' + o.cls : ''); el.textContent = text; el.style.display = 'none';
  labelLayer.appendChild(el);
  const L = { el, obj, off: o.offset || new V3(), always: !!o.always, maxPx: o.maxPx, minPx: o.minPx };
  f.labels.push(L);
  el.addEventListener('click', ev => { ev.stopPropagation(); const target = o.pick || obj; const h = { frame: f, obj: target, id: target.userData.id, pointLocal: target.getWorldPosition(new V3()).add(f.C), hit: null }; if (target.userData.onPick) target.userData.onPick(h); showInfoFor(h); });
  return L;
}
const _lv = new V3(), _lo = new V3();
function updateLabels() {
  const shown = new Set();
  for (const f of drawn) {
    if (f.alpha < .6 || !f.labels) continue;
    if (f !== cam.A && f.dLoc < f.radius * 1e-3) continue; // outer frames: only when their structure is in view
    for (const L of f.labels) {
      if ((!labelsOn && !L.always) || !L.el.textContent || !visibleChain(L.obj)) continue;
      L.obj.getWorldPosition(_lv).add(_lo.copy(L.off).multiplyScalar(L.scaleRef ? L.scaleRef.k || 1 : 1));
      _lv.project(f.cam);
      if (_lv.z > 1 || Math.abs(_lv.x) > 1.05 || Math.abs(_lv.y) > 1.05) continue;
      if (L.minSizeFn && !L.minSizeFn(f)) continue;
      shown.add(L.el);
      L.el.style.display = 'block';
      L.el.style.transform = `translate(${(_lv.x * .5 + .5) * W}px,${(-_lv.y * .5 + .5) * H}px) translate(-50%,-120%)`;
    }
  }
  for (const el of labelLayer.children) if (!shown.has(el)) el.style.display = 'none';
}

/* ================= UI HELPERS (controls belong to frames) ================= */
const ctrlEl = $('#controls');
function seg(items, activeK, onSel) {
  const d = document.createElement('div'); d.className = 'seg';
  items.forEach(([k, label]) => { const b = document.createElement('button'); b.innerHTML = label; b.dataset.k = k; if (k === activeK) b.classList.add('on'); b.onclick = () => { d.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); onSel(k); }; d.appendChild(b); });
  if (building) building.uiEls.push(d); return d;
}
function actBtn(label, onClick) { const b = document.createElement('button'); b.className = 'act'; b.innerHTML = label; b.onclick = onClick; if (building) building.uiEls.push(b); return b; }
function uiEl(el) { if (building) building.uiEls.push(el); return el; }
let uiFrame = null;
function updateControls(f) {
  if (f === uiFrame) return; uiFrame = f;
  ctrlEl.innerHTML = ''; (f.uiEls || []).forEach(e => ctrlEl.appendChild(e));
}
function toast(html, cls = '') {
  const el = document.createElement('div'); el.className = 'toast ' + cls; el.innerHTML = html;
  const box = $('#toasts'); box.appendChild(el); while (box.children.length > 2) box.firstChild.remove();
  setTimeout(() => { el.style.opacity = '0'; }, 3800); setTimeout(() => el.remove(), 4300);
}
const msg = { text: '', t: 0 };
function message(t) { msg.text = t; msg.t = performance.now(); }
