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
/* Depth buffer (switch `depth`, fixed when the page loads):
   log    (default) three's logarithmic depth: every fragment shader writes gl_FragDepth. Right at every scale, but a fragment that
          writes its own depth cannot be rejected before it is shaded, so hidden surfaces cost as much as visible ones.
   vert   the same logarithmic depth computed per vertex only (the four logdepthbuf shader chunks are replaced by their non-EXT
          branch below). Early rejection works again. Depth is then interpolated linearly across a triangle, which is wrong for a
          triangle that is large on screen and comes close to the camera (the ground under your feet): it can hide what stands on it.
   tight  ordinary depth. Each depth group (a frame and the frames co-rendered with it) is drawn in one or more slices, far to near,
          the depth buffer cleared between them, so that no slice spans a near-to-far ratio above DEPTH_SLICE (renderFramesTight).
          The near plane is at 1/500 of the viewing distance (log: 1/5000) and the far plane no further than the content reaches.
          Early rejection works and depth is exact within a slice; the cost is that a group's scenes are submitted once per slice. */
const DEPTH = PERF.flags.depth, DEPTH_SLICE = 1e5; // the largest far-to-near ratio of one slice: 24-bit depth then resolves 0.6% of the distance at the far end of a slice
if (DEPTH === 'vert') {
  const C = THREE.ShaderChunk;
  C.logdepthbuf_pars_vertex = '#ifdef USE_LOGDEPTHBUF\n\tuniform float logDepthBufFC;\n#endif';
  C.logdepthbuf_vertex = '#ifdef USE_LOGDEPTHBUF\n\tif ( isPerspectiveMatrix( projectionMatrix ) ) {\n\t\tgl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;\n\t\tgl_Position.z *= gl_Position.w;\n\t}\n#endif';
  C.logdepthbuf_pars_fragment = ''; C.logdepthbuf_fragment = '';
}
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: DEPTH !== 'tight', powerPreference: 'high-performance' });
const PIXR_BASE = Math.min(window.devicePixelRatio || 1, 2); // the scale the page was always drawn at: point sizes in the shaders are written for it
const PIXK = { value: 1 };                                    // current render scale / PIXR_BASE, a uniform shared by the point shaders, so points keep their size on screen at any scale
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
/* Opaque objects: by render order, then nearest first, so that what is in front fills the depth buffer before what it hides is shaded.
   With the logarithmic depth buffer every fragment writes its own depth and nothing is rejected early, so there the order within one
   shader program is nearest first but programs stay together (fewer state changes); with depth=tight or vert it is nearest first throughout. */
renderer.setOpaqueSort(PERF.flags.depth === 'log'
  ? (a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || a.program.id - b.program.id || a.z - b.z || a.id - b.id
  : (a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || a.z - b.z || a.id - b.id);
renderer.info.autoReset = false; // a frame is many render() calls: the loop resets the counters once per frame, so they add up (js/perf.js reads them)
let W = innerWidth, H = innerHeight, bloom = null, bloomAmt = 0, sceneTex = null;
let composer = null; // retired: frames are drawn straight to the canvas (see renderAll); the name stays for old test scripts that read it
const BLOOM_OK = !!(THREE.Pass && THREE.UnrealBloomPass) && !/Mobi|Android/i.test(navigator.userAgent);
const _v2 = new THREE.Vector2();
/* Glow. The frames are always drawn straight to the canvas, so they get the canvas's real antialiasing and its 24-bit depth buffer.
   When something should glow (bloomTarget), the finished picture is copied once into a texture and the bloom pass's own steps run on
   that: bright areas, blurs, and one additive blend back onto the canvas. No composer and no off-screen copy of the scene: the old
   path cost a 16-bit, non-antialiased render target, an extra full-screen copy, and 14 passes even where nothing glows.
   bloom=half (the default) runs the blur chain from a quarter-size bright target instead of a half-size one; its mip weights are
   shifted by one level so the glow keeps about the same width and energy. */
function setupBloom() {
  if (!BLOOM_OK) return;
  bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W, H), .55, .45, .86);
  bloomResize();
}
function bloomResize() {
  if (!bloom) return;
  const sz = renderer.getDrawingBufferSize(_v2), half = PERF.flags.bloom !== 'full';
  bloom.setSize(half ? sz.x / 2 : sz.x, half ? sz.y / 2 : sz.y);
  bloom.radius = half ? 0 : .45; bloom.compositeMaterial.uniforms.bloomFactors.value = half ? [1.26, .6, .58, .56, 0] : [1, .8, .6, .4, .2]; bloom.mips = half ? 4 : 5;
  if (sceneTex) sceneTex.dispose();
  sceneTex = new THREE.DataTexture(null, sz.x, sz.y, THREE.RGBFormat); sceneTex.minFilter = sceneTex.magFilter = THREE.LinearFilter;
}
PERF.on('bloom', bloomResize);
/* How much glow the view wants. Stars, the Sun, cells and molecules on a dark ground glow; an illustrated scene seen close, and a
   daylight scene that fills the view (the park, a landscape), do not: there the glow only washed out the sky and the paper white. */
function bloomTarget() {
  if (!bloom || PERF.flags.bloom === '0') return 0;
  const f0 = drawn[0];
  if (f0 && f0.env && f0.env.opaque && f0.alpha > .995 && (f0.daylight || (f0.illo && cam.D < 6))) return 0;
  return drawn.some(f => f.illo && f.alpha > .3 && cam.D < 6) ? 0 : .55;
}
function bloomRender() {
  const r = renderer, B = bloom, q = B.fsQuad, UB = THREE.UnrealBloomPass, n = B.mips;
  r.copyFramebufferToTexture(_v2.set(0, 0), sceneTex);
  r.getClearColor(B._oldClearColor); const oa = r.getClearAlpha(); r.setClearColor(B.clearColor, 0);
  B.highPassUniforms.tDiffuse.value = sceneTex; B.highPassUniforms.luminosityThreshold.value = B.threshold;
  q.material = B.materialHighPassFilter; r.setRenderTarget(B.renderTargetBright); r.clear(); q.render(r);
  let inp = B.renderTargetBright;
  for (let i = 0; i < n; i++) {
    const m = B.separableBlurMaterials[i]; q.material = m;
    m.uniforms.colorTexture.value = inp.texture; m.uniforms.direction.value = UB.BlurDirectionX; r.setRenderTarget(B.renderTargetsHorizontal[i]); r.clear(); q.render(r);
    m.uniforms.colorTexture.value = B.renderTargetsHorizontal[i].texture; m.uniforms.direction.value = UB.BlurDirectionY; r.setRenderTarget(B.renderTargetsVertical[i]); r.clear(); q.render(r);
    inp = B.renderTargetsVertical[i];
  }
  const cu = B.compositeMaterial.uniforms; q.material = B.compositeMaterial; cu.bloomStrength.value = B.strength; cu.bloomRadius.value = B.radius; cu.bloomTintColors.value = B.bloomTintColors;
  r.setRenderTarget(B.renderTargetsHorizontal[0]); r.clear(); q.render(r);
  q.material = B.materialCopy; B.copyUniforms.tDiffuse.value = B.renderTargetsHorizontal[0].texture; r.setRenderTarget(null); q.render(r);
  r.setClearColor(B._oldClearColor, oa);
  PERF._passes += 3 + 2 * n;
}
/* one frame of drawing: every scene, then the glow if the view wants any */
function renderAll(dt) {
  const bt = bloomTarget(); bloomAmt += (bt - bloomAmt) * (1 - Math.exp(-dt * 6)); if (Math.abs(bt - bloomAmt) < .01) bloomAmt = bt;
  renderer.setRenderTarget(null); renderFrames(renderer);
  { const ri = renderer.info.render; PERF.calls = ri.calls; PERF.tris = ri.triangles; PERF.points = ri.points; } // the scenes' own numbers, without the full-screen passes
  if (bloom && bloomAmt > .02) { bloom.strength = bloomAmt; bloomRender(); }
}
/* ================= RENDER SCALE =================
   Only the canvas's drawing buffer is scaled; the page and its panels stay at the device's own resolution.
   - A cap by pixel count: the buffer is never larger than about 2.8 million pixels (a 4K window at ratio 2 would be 33 million),
     never above the device's ratio (at most 2), never below 0.6 of the window's CSS size.
   - dpr=auto (the default): a scaler driven by the frame time moves between fixed levels. Quick to drop (about one second below
     45 frames a second; at once below 30), slow to rise (four seconds at the display's rate), a step up that has to be undone
     within ten seconds makes the next try wait 30 s longer and the third such reversal ends the tries. Frames over 100 ms (a shader
     compiling, a mesh arriving) and the slowest tenth of each half-second window are not counted, and neither are resting frames.
     If two drops in a row do not make frames faster, resolution is not what limits this machine: the scale goes back up and stays.
   - dpr=<number> fixes the scale. Under browser automation (navigator.webdriver) the scale is fixed at the cap unless dpr=auto is in
     the URL, so test screenshots do not change resolution with the machine's load. */
const RS_LEVELS = [.6, .75, 1, 1.25, 1.5, 2], RS_SLOW_MS = 22, RS_FAST_MS = 17.6, RS_MAX_PIXELS = 2.8e6;
const RS = { auto: !navigator.webdriver || PERF.flags.given.dpr === 'auto', cur: PIXR_BASE, cap: PIXR_BASE, lv: [PIXR_BASE], i: 0, win: [], sum: 0, slow: 0, fast: 0, rev: 0, lock: false, lastDir: 0, lastStep: 0, holdUntil: 0, skip: 0, before: 0, noGain: 0, from: 0, longRun: 0, log: [] };
function rsApply(s) { RS.cur = s; PIXK.value = s / PIXR_BASE; renderer.setPixelRatio(s); renderer.setSize(W, H, false); bloomResize(); }
function rsReset() { // on load, on a resize and when the switch changes: start from the cap, or from the fixed value
  const dev = Math.min(window.devicePixelRatio || 1, PERF.flags.dprMax);
  RS.cap = Math.max(.6, Math.min(dev, Math.sqrt(RS_MAX_PIXELS / Math.max(1, W * H))));
  RS.lv = RS_LEVELS.filter(l => l < RS.cap - .01); RS.lv.push(RS.cap); RS.i = RS.lv.length - 1;
  RS.win.length = 0; RS.sum = RS.slow = RS.fast = RS.rev = RS.lastDir = RS.holdUntil = RS.noGain = RS.before = RS.longRun = 0; RS.lock = false; RS.skip = 5;
  rsApply(PERF.flags.dpr === 'auto' ? RS.cap : PERF.flags.dpr);
}
function rsStep(dir, avg) {
  const now = performance.now(); RS.slow = RS.fast = 0;
  if (dir < 0) {
    if (RS.i === 0) return;
    if (RS.lastDir > 0 && now - RS.lastStep < 10000) { RS.rev++; RS.holdUntil = now + 30000 * RS.rev; if (RS.rev >= 3) RS.lock = true; } // the step up did not hold
    if (RS.lastDir >= 0) RS.from = RS.i; // where this run of drops started
    RS.before = avg; RS.i--;
  } else {
    if (RS.lock || RS.i >= RS.lv.length - 1 || now < RS.holdUntil) return;
    RS.i++; RS.before = 0;
  }
  RS.lastDir = dir; RS.lastStep = now; RS.skip = 5; RS.log.push([Math.round(now), dir, RS.lv[RS.i], +avg.toFixed(1)]); if (RS.log.length > 40) RS.log.shift();
  rsApply(RS.lv[RS.i]);
}
/* one frame interval in ms (only frames drawn at full rate are fed) */
function rsFeed(dtMs) {
  if (!RS.auto || PERF.flags.dpr !== 'auto' || RS.noGain >= 2) return;
  if (RS.skip > 0) { RS.skip--; return; }               // the frames just after a change of size include the reallocation
  if (!(dtMs > 0)) return;
  if (dtMs > 100) { if (++RS.longRun < 5) return; dtMs = Math.min(dtMs, 2000); } else RS.longRun = 0; // a one-off long frame is not evidence; five in a row are the machine's real rate
  const w = RS.win; w.push(dtMs); RS.sum += dtMs; if (!((w.length >= 20 && RS.sum >= 400) || RS.sum >= 1500)) return; // judge half a second or more at a time
  w.sort((a, b) => a - b); const n = w.length - Math.floor(w.length * .1); let t = 0; for (let i = 0; i < n; i++) t += w[i];
  const avg = t / n; w.length = 0; RS.sum = 0;
  if (RS.lastDir < 0 && RS.before) { // did the last drop help?
    if (avg > RS.before * .92) { if (++RS.noGain >= 2) { RS.i = RS.from; RS.lock = true; RS.log.push([Math.round(performance.now()), 0, RS.lv[RS.i], +avg.toFixed(1)]); rsApply(RS.lv[RS.i]); return; } } else RS.noGain = 0;
    RS.before = 0;
  }
  if (avg > RS_SLOW_MS) { RS.fast = 0; if (++RS.slow >= (avg > 33 ? 1 : 2)) rsStep(-1, avg); }
  else if (avg < RS_FAST_MS) { RS.slow = 0; if (++RS.fast >= 8) rsStep(1, avg); }
  else RS.slow = RS.fast = 0;
}
PERF.on('dpr', () => rsReset());
PERF.scaleNote = () => PERF.flags.dpr !== 'auto' ? 'fixed' : !RS.auto ? 'fixed at the cap (automation)' : `automatic, level ${RS.i + 1} of ${RS.lv.length}` + (RS.noGain >= 2 ? ', held: a lower resolution did not make frames faster' : RS.lock ? ', held after three reversals' : '');
function resize() {
  W = innerWidth; H = innerHeight; rsReset();
  forEachFrame(f => { if (f.cam) { f.cam.aspect = W / H; f.cam.updateProjectionMatrix(); } });
}
addEventListener('resize', resize);

/* ================= FRAMES ================= */
const FT = {};           // frame type registry: FT[type] = { build(F, opts) }
const compileQ = [];     // frames built since the last tick: their shaders are compiled before they are first seen (compileStep)
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
    this.built = true; compileQ.push(this);
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
    if (this.root.parent) this.root.parent.remove(this.root); mergedSet.delete(this); this._merged = false; // it may be sitting in its parent's scene
    this.built = false; this.scene = null; this.root = null; this._drawnOnce = false; this._pkB = null;
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
    f._share = !!(f.coRender && f.parent && f.parent.unit === f.unit && drawn.includes(f.parent)); f._nb = false; f._culled = false;
    drawn.push(f);
    for (const c of f.children) {
      if (!c.coRender || c.unit !== f.unit || active.includes(c)) continue;
      safePlace(c);
      const a = coAlpha(c);
      c.alpha = a; c._share = true; c._nb = true;
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
/* The part of the screen that is not under a panel is where the scene's centre of interest belongs. viewOff (pixels) shifts the
   projection so the camera's target appears in the middle of that free area (card open on the right, Tracks on the left; on a
   phone the card is a sheet at the bottom). It eases in and out, and everything that projects through f.cam (picking, labels) follows. */
const viewOff = { x: 0, y: 0 };
let _voT = performance.now();
function updateViewOffset() {
  const now = performance.now(), dt = Math.min(.3, (now - _voT) / 1000); _voT = now; // real time, so it settles in about half a second even at a low frame rate
  let tx = 0, ty = 0;
  const vis = e => e && e.classList.contains('open') ? e.getBoundingClientRect() : null;
  const L = vis(document.getElementById('tracks')), I = vis(document.getElementById('info'));
  if (!L && !I) { /* no panel open: the view is centred as ever */ }
  else if (W > 860) {
    let lo = 0, hi = W;
    if (L) lo = Math.max(lo, L.right); else { const rl = document.getElementById('ruler'); if (rl && rl.offsetWidth) lo = rl.getBoundingClientRect().right; }
    if (I) hi = Math.min(hi, I.left);
    tx = (lo + hi) / 2 - W / 2; // the free area's centre, relative to the screen's centre
    tx = clamp(tx, -W * .3, W * .3);
  } else if (I) {
    const top = 96, bot = Math.min(H, I.top);
    ty = clamp((top + bot) / 2 - H / 2, -H * .3, 0);
  }
  // setViewOffset moves the window over the full image: a window shifted right shows content that sits further right, so the scene moves left by +x
  const k = 1 - Math.exp(-dt * 9), nx = -tx, ny = -ty;
  viewOff.x += (nx - viewOff.x) * k; viewOff.y += (ny - viewOff.y) * k;
  if (Math.abs(viewOff.x - nx) < .5) viewOff.x = nx; if (Math.abs(viewOff.y - ny) < .5) viewOff.y = ny;
}
function placeFrameCam(f) {
  camPosIn(f, _cp); _tp.copy(cam.T); convertP(_tp, cam.A, f);
  _dv.copy(cam.dir); convertD(_dv, cam.A, f); _uv.copy(cam.up); convertD(_uv, cam.A, f);
  f.C = (f.C || new V3()).copy(_cp);
  f.root.position.copy(_cp).negate();
  const c = f.cam, dl = cam.D / f.unit;
  c.position.set(0, 0, 0); c.up.copy(_uv); c.lookAt(_dv.negate());
  c.near = Math.max(dl * 2e-4, 1e-9); c.far = Math.max(dl * 1e7, f.radius * 8 + _cp.length() * 4);
  if (DEPTH === 'tight') { c.near = Math.max(dl * 2e-3, 1e-9); const reach = frameReach(f); if (reach > 0) c.far = Math.max(dl * 4, _cp.length() + reach); } // the near plane ten times further out (1/500 of the viewing distance) and the far plane no further than the content: fewer slices
  if (f._share) { c.near = f.parent.cam.near; c.far = f.parent.cam.far; } // same projection as the parent, so depths compare
  c.aspect = W / H;
  if (viewOff.x || viewOff.y) c.setViewOffset(W, H, viewOff.x, viewOff.y, W, H); else { if (c.view && c.view.enabled) c.clearViewOffset(); c.updateProjectionMatrix(); }
  f.dLoc = dl;
}
let simTime = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), 12, 0, 0), timeSpeed = 1, clock = 0;
/* depth=tight. How far a frame's content reaches from its origin (own units): every object under its root, by bounding sphere
   (instance bounds for instanced meshes; points that a shader spreads out by uExpand are allowed for). Worked out again every two
   seconds, once the frame has been drawn; 0 means not known yet, and the far plane then stays where it always was. */
const _frS = new THREE.Sphere(), _frV = new V3();
function frameReach(f) {
  const now = performance.now(), n = f.root.children.length + (f.pickables ? f.pickables.length : 0);
  if (f._reachT && now - f._reachT < 2000 && f._reachN === n) return f._reach;
  if (!f._drawnOnce || !f.C || f.root.parent !== f.scene && !f._merged) return f._reach || 0;
  let R = 0;
  f.root.traverse(o => {
    let d = 0;
    if (o.isInstancedMesh && o.count >= 16 && o.geometry.attributes.position) { const b = pkInstAccel(o).box; if (!b.isEmpty()) for (let i = 0; i < 8; i++) d = Math.max(d, _frV.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld).add(f.C).length()); }
    else if (o.geometry && o.geometry.isBufferGeometry && o.geometry.attributes.position) {
      const g = o.geometry; if (g.boundingSphere === null) g.computeBoundingSphere();
      _frS.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); const ex = o.material && o.material.uniforms && o.material.uniforms.uExpand ? Math.max(1, o.material.uniforms.uExpand.value) : 1;
      d = (_frV.copy(_frS.center).add(f.C).length() + _frS.radius) * ex;
    } else if (o.isSprite) d = _frV.setFromMatrixPosition(o.matrixWorld).add(f.C).length() + Math.max(o.scale.x, o.scale.y);
    if (isFinite(d) && d > R) R = d;
  });
  f._reach = R * 1.15; f._reachT = now; f._reachN = n; return f._reach;
}
/* depth=tight: each depth group in slices, far to near. A slice's far plane is the next slice's near plane (with 0.2% overlap, so the
   seam cannot show a crack; in the overlap a see-through surface is blended twice, which is why it is kept that thin and far away); three.js culls objects outside a slice, and a merged child whose bound does not reach into a slice is
   hidden for it (its instanced meshes are not culled by three). The cameras get their whole range back afterwards, for picking and labels. */
function renderFramesTight(r) {
  r.setClearColor(0x000000, 1); r.clear(true, true, true);
  for (let i = 0; i < drawn.length;) {
    let j = i + 1; while (j < drawn.length && drawn[j]._share) j++;
    const G = []; for (let k = i; k < j; k++) { const f = drawn[k]; if (f.scene && !f._culled && !f._merged) G.push(f); }
    if (G.length) {
      let near = Infinity, far = 0; for (const f of G) { near = Math.min(near, f.cam.near); far = Math.max(far, f.cam.far); }
      const kids = []; for (const m of mergedSet) if (!m._culled && G.includes(m.parent) && m._pkB && m._pkB.ok) { const d = _frV.copy(m._pkB.c).sub(m.C).length(), rr = m._pkB.r * 1.15; kids.push([m, (d - rr) * .7, d + rr]); }
      for (const kd of kids) far = Math.max(far, kd[2] * 1.05); // the group reaches as far as its merged children do
      const n = clamp(Math.ceil(Math.log(far / near) / Math.log(DEPTH_SLICE) - 1e-9), 1, 4); // the nearest slice is as deep as a slice may be, so the split falls far away, where there is little to draw twice
      for (let s = n - 1; s >= 0; s--) {
        const pn = near * Math.pow(DEPTH_SLICE, s) * (s ? .998 : 1), pf = s === n - 1 ? far : near * Math.pow(DEPTH_SLICE, s + 1);
        r.clearDepth();
        for (const kd of kids) kd[0].root.visible = kd[2] >= pn && kd[1] <= pf;
        for (const f of G) {
          const bg = f.scene.background, c = f.cam, n0 = c.near, f0 = c.far;
          if (i > 0 || f !== drawn[0] || s < n - 1) f.scene.background = null;
          else if (f.env && f.env.bg !== undefined && !bg) { r.setClearColor(f.env.bg, 1); r.clear(true, true, true); }
          c.near = pn; c.far = pf; c.updateProjectionMatrix();
          r.render(f.scene, c); PERF._renders++; f._drawnOnce = true;
          c.near = n0; c.far = f0; c.updateProjectionMatrix(); f.scene.background = bg;
        }
      }
      for (const kd of kids) kd[0].root.visible = true;
    }
    i = j;
  }
  for (const f of mergedSet) if (!f._culled && f.parent._drawnOnce) f._drawnOnce = true;
}
function renderFrames(r) {
  if (DEPTH === 'tight') return renderFramesTight(r);
  r.setClearColor(0x000000, 1); r.clear(true, true, true);
  drawn.forEach((f, i) => {
    if (!f.scene || f._culled || f._merged) return; // a merged frame is drawn inside its parent's scene
    const bg = f.scene.background;
    if (i > 0) f.scene.background = null;
    else if (f.env && f.env.bg !== undefined && !bg) { r.setClearColor(f.env.bg, 1); r.clear(true, true, true); }
    if (!f._share) r.clearDepth();
    r.render(f.scene, f.cam); PERF._renders++; f._drawnOnce = true;
    f.scene.background = bg;
  });
  for (const f of mergedSet) if (!f._culled && f.parent._drawnOnce) f._drawnOnce = true; // its matrices were computed with the parent's
}

/* ---- fewer scenes: co-rendered children inside their parent's scene (merge=1) ----
   Every scene costs a renderer.render() call: its own traversal, light set-up, state reset and a fresh upload of the camera and
   light uniforms to every program. The park had one scene per placed thing (38 calls). A frame that sets `mergeable` and is
   co-rendered with its parent (same unit, same axes, parent drawn: `_share`) is drawn inside the parent's scene instead: its root
   group becomes a child of the parent's *scene* (not of the parent's root), and keeps the position the engine gives every root, minus
   the camera's place in the frame's own coordinates, worked out in double precision. So precision, depth, picking (per frame, through
   f.cam and f.pickables) and labels are exactly as before; only the render call is shared. A frame's own lights must not light the
   parent's scene: `onMerge(on)` tells the frame, which hides them (things then take the park's lights, scaled in their shader to
   the same result: js/things.js). A merged frame that is culled is taken out of the scene altogether, so its matrices are not even
   walked. When the parent is not drawn (the camera is deep inside the child) the root goes back to the frame's own scene. */
const mergedSet = new Set();
function setMerged(f, on) {
  if (!f.root || !f.scene) return;
  if (on) { if (!mergedSet.has(f)) { mergedSet.add(f); f._merged = true; if (f.onMerge) f.onMerge(true); } }
  else if (mergedSet.has(f)) { mergedSet.delete(f); f._merged = false; f.root.visible = true; if (f.root.parent !== f.scene) f.scene.add(f.root); if (f.onMerge) f.onMerge(false); }
}
function mergeStep() { // after computeActive, once the drawn frames are built
  const on = PERF.flags.merge;
  for (const f of mergedSet) if (!on || !f.built || !f._share || !drawn.includes(f) || !f.parent.scene) setMerged(f, false);
  if (on) for (const f of drawn) if (f.mergeable && f._share && f.built && f.parent.scene && f.quat.w > .999999) setMerged(f, true);
}
function mergePlace(f) { // after frameCull: in the parent's scene while it can be seen, in no scene while it cannot
  const want = f._culled ? null : f.parent.scene, has = f.root.parent;
  if (has !== want) { if (want) want.add(f.root); else has.remove(f.root); }
}

/* ---- work that cannot be seen is not done ----
   A co-rendered neighbour (a thing in the park that the camera is not inside) whose content is outside the view, or under about two
   pixels across, is neither drawn nor picked, and its update hook runs only every eighth frame (so its detail tier and layers are
   current when it comes back into view). The bound is the frame's pick sphere; until one exists the frame is always drawn. */
const _fcM = new THREE.Matrix4(), _fcF = new THREE.Frustum(), _fcS = new THREE.Sphere(), PX_PER_RAD = () => H / (2 * Math.tan(25 * Math.PI / 180));
function frameCull(f) {
  f._culled = false;
  const B = f._pkB; if (!f._nb || !B || !B.ok || B.n !== f.pickables.length) return;
  _fcS.center.copy(B.c).sub(f.C); _fcS.radius = B.r * 1.15;
  const d = _fcS.center.length(); if (d <= _fcS.radius) return; // the camera is inside its bound
  if (_fcS.radius / d * PX_PER_RAD() < 1) { f._culled = true; return; }
  f.cam.updateMatrixWorld(); _fcF.setFromProjectionMatrix(_fcM.multiplyMatrices(f.cam.projectionMatrix, f.cam.matrixWorldInverse));
  if (!_fcF.intersectsSphere(_fcS)) f._culled = true;
}
/* Shaders are compiled when a frame is built and again when its content has arrived (a thing's parts load after the frame exists),
   one frame per tick, so a layer mode or a cut view that has not been shown yet does not stall the frame in which it first appears. */
function compileStep() {
  let f = compileQ.shift();
  if (!f) for (const d of drawn) if (d.built && d.pickables && d._cmpK !== d.pickables.length) { f = d; break; }
  const now = performance.now();
  if (!f) { // a scene that has taken in merged children: once, when no more have arrived for three seconds and the camera rests (it walks the whole scene)
    for (const d of drawn) if (d._cmpDirty && now - d._cmpDirty > 3000 && !fly && now - lastInput > 1000) { d._cmpDirty = 0; try { renderer.compile(d.scene, d.cam); } catch (e) { } break; }
    return;
  }
  if (!f.built || !f.scene) return;
  f._cmpK = f.pickables.length;
  try {
    if (f._merged) { // drawn inside its parent's scene now; compile the form it takes when drawn alone as well (its own lights), so entering it does not stall
      f.parent._cmpDirty = now;
      const back = f.root.parent; f.scene.add(f.root); if (f.onMerge) f.onMerge(false);
      renderer.compile(f.scene, f.cam);
      if (back) back.add(f.root); else f.scene.remove(f.root); if (f.onMerge) f.onMerge(true);
    } else renderer.compile(f.scene, f.cam);
  } catch (e) { }
}
/* Inked outlines (the inverted hull that draws every part a second time; the ink is about 1.5 pixels wide at any distance).
   outline=all: always. outline=0: only the part under the pointer or selected. outline=near (the default): the ink fades out as the
   whole thing gets small on screen, between 70 and 40 pixels tall (px = its height in pixels): at that size the ink no longer draws an
   edge, it only darkens the figure. A thing's far detail tier has none (js/things.js). Chosen from screenshots: notes/perf.md. */
const OUTLINE_PX = [40, 70];
function outlineAmt(px) { const o = PERF.flags.outline; return o === 'all' ? 1 : o === '0' ? 0 : smooth(OUTLINE_PX[0], OUTLINE_PX[1], px); }

/* ================= INPUT: zoom-to-cursor, orbit, fly ================= */
const zoom = { pending: 0, pivot: null, pt: -1e9, px: 0, py: 0, gen: -1 }; // pending = remaining ln(D) change; pt, px, py, gen: when, where and in which state of the view the pivot was last picked
let lastInput = performance.now(), fly = null;
/* viewGen counts changes of what can be under a resting pointer other than the camera's own zoom: layers peeling, frames arriving or
   fading in, an orbit. A hover pick and the zoom pivot are worked out again only when the pointer or this has changed. */
let viewGen = 0;
function viewChanged() { viewGen++; mouse.dirty = true; }
const PIVOT_MIN_MS = 150, PIVOT_MAX_MS = 400;
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
  if (lnDelta < 0 && x !== undefined) {
    /* A wheel burst keeps the pivot it has. Scaling the camera about the pivot leaves the pivot under the pointer, so picking again
       returns the same point unless the pointer moved or the view changed (viewGen): then it is picked again, at most every 150 ms;
       and in any case after 400 ms, so a slow change that nothing announced (a detail tier swapping) cannot leave it stale. */
    const now = performance.now(), age = now - zoom.pt, pv = zoom.pivot;
    const moved = Math.abs(x - zoom.px) > 1.5 || Math.abs(y - zoom.py) > 1.5 || zoom.gen !== viewGen;
    if (!pv || !anchored.includes(pv) || age > PIVOT_MAX_MS || (moved && age >= PIVOT_MIN_MS)) {
      const p = pivotAt(x, y); zoom.pivot = zoom.pivot || { p }; zoom.pivot.p.copy(p); if (!anchored.includes(zoom.pivot)) anchored.push(zoom.pivot);
      zoom.pt = now; zoom.px = x; zoom.py = y; zoom.gen = viewGen;
    }
  }
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
  viewGen++;
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
const mouse = { x: 0, y: 0, has: false, dirty: false, touch: false, t: 0, tipX: 0, tipY: 0 }; // dirty: the hover must be worked out again; t: when the pointer last moved
canvas.addEventListener('wheel', e => { e.preventDefault(); let d = e.deltaY; if (e.deltaMode === 1) d *= 16; d = clamp(d, -240, 240); zoomBy(d * .0016 * (e.shiftKey ? 4 : 1), e.clientX, e.clientY); }, { passive: false });
canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); mouse.touch = e.pointerType === 'touch';
  if (pointers.size === 1) { dragMoved = false; downPos = { x: e.clientX, y: e.clientY }; }
  else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); dragMoved = true; }
  lastInput = performance.now(); closePops();
});
canvas.addEventListener('pointermove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; mouse.dirty = true; mouse.t = lastInput = performance.now();
  if (Math.abs(mouse.x - mouse.tipX) > 5 || Math.abs(mouse.y - mouse.tipY) > 5) tipEl.classList.remove('show'); // the tooltip belongs to where the pointer rested: it does not trail behind a moving pointer
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
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => addEventListener(t, () => { lastInput = performance.now(); }, { capture: true, passive: true })); // any input, anywhere on the page, ends the resting frame rate at once
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
  else if (k === 'Escape') { const vm = document.getElementById('vizModal'); if (vm && vm.classList.contains('open')) { vm.classList.remove('open'); return; } closeInfo(); closePops(); fly = null; cancelTour(); $('#help').classList.add('hide'); }
  else if (k === 'ArrowLeft') orbit(-25, 0); else if (k === 'ArrowRight') orbit(25, 0);
  else if (k === 'ArrowUp') orbit(0, -17); else if (k === 'ArrowDown') orbit(0, 17);
  else return;
  lastInput = performance.now();
});

/* ================= PICK ACCELERATION =================
   A pick must never stall a frame. Four things keep it to a fraction of a millisecond:
   1. Each frame's pickable content has a bounding sphere (pkFrameSphere); a ray that misses it touches nothing in the frame.
   2. Only visible objects are walked (a hit on a hidden object was thrown away afterwards anyway).
   3. Every mesh of 64 triangles or more gets a bounding-volume tree (three-mesh-bvh, js/vendor/), built in idle slices while the
      camera rests (pkIdle): first the meshes a ray has already reached, then those in view, then the hidden ones. Until its tree
      exists a mesh is tested the plain way. The tree is built over a copy of the index, so the drawn geometry and its triangle
      order are untouched. All hits are returned, as before: the body's core sample and pick rules need them.
   4. An InstancedMesh (leaves, hair, grass) gets one bounding sphere per instance, held in a small tree of boxes in the mesh's own
      space, shared by every mesh that uses the same instance matrices. A ray visits only the instances whose spheres it crosses, so a
      single leaf is still picked exactly, without a loop over tens of thousands of instances.
   PK.log holds the build times (ms) for the report in the meter. */
const PK = { lib: window.MeshBVHLib || null, minTris: 64, built: 0, ms: 0, maxMs: 0, maxTris: 0, tris: 0, failed: 0, queue: [], sorted: true, scanT: 0, inst: 0, instTrees: 0, instMs: 0 };
const _pkMeshRay = THREE.Mesh.prototype.raycast, _pkInstRay = THREE.InstancedMesh.prototype.raycast, _pkAccel = PK.lib && PK.lib.acceleratedRaycast;
const _pkSph = new THREE.Sphere(), _pkInv = new THREE.Matrix4(), _pkRay = new THREE.Ray(), _pkLM = new THREE.Matrix4(), _pkWM = new THREE.Matrix4(), _pkMesh = new THREE.Mesh(), _pkTmp = [], _pkBox = new THREE.Box3(), _pkV = new V3(), _pkHits = [];
function pkTris(g) { return g.index ? g.index.count / 3 : g.attributes.position ? g.attributes.position.count / 3 : 0; }
function pkCan(g) { // is a tree worth building for this geometry, and can the library handle it?
  if (!_pkAccel || !g || !g.isBufferGeometry || g._pkNo) return false;
  const p = g.attributes.position;
  return !!p && !p.isInterleavedBufferAttribute && !g.morphAttributes.position && g.drawRange.start === 0 && g.drawRange.count === Infinity && pkTris(g) >= PK.minTris;
}
function pkBuild(g) {
  const t0 = performance.now();
  try {
    // the tree sorts an index in place: give it its own copy, so the order in which the triangles are drawn does not change
    const pg = new THREE.BufferGeometry(); pg.attributes = g.attributes; pg.groups = g.groups; if (g.index) pg.setIndex(g.index.clone());
    if (g.boundingBox) pg.boundingBox = g.boundingBox;
    const bt = new PK.lib.MeshBVH(pg, { verbose: false }); bt._pv = g.attributes.position.version; g.boundsTree = bt;
  } catch (e) { g._pkNo = true; PK.failed++; return false; }
  const ms = performance.now() - t0, n = pkTris(g); PK.built++; PK.ms += ms; PK.tris += n; if (ms > PK.maxMs) { PK.maxMs = ms; PK.maxTris = n; }
  return true;
}
THREE.Mesh.prototype.raycast = function (rc, out) {
  const g = this.geometry; let bt = g && g.boundsTree;
  if (bt && (bt._pv !== g.attributes.position.version || g.drawRange.count !== Infinity)) { // rewritten since the tree was built; a geometry that keeps changing is tested the plain way
    g.boundsTree = bt = null; if ((g._pkRe = (g._pkRe || 0) + 1) > 2) g._pkNo = true;
  }
  if (bt) return _pkAccel.call(this, rc, out);
  /* No tree yet: answer the plain way now and have the tree built in the next idle slice. A build inside a pick would cost more than
     the one plain test it replaces (measured: about 0.3 ms per thousand triangles to build, about 0.1 ms to test them plainly), and a pick must stay short. */
  if (this.material !== undefined && !g._pkQ0 && pkCan(g)) {
    if (g.boundingSphere === null) g.computeBoundingSphere();
    _pkSph.copy(g.boundingSphere).applyMatrix4(this.matrixWorld);
    if (!rc.ray.intersectsSphere(_pkSph)) return;
    g._pkQ0 = true; pkEnqueue(g, 0);
  }
  _pkMeshRay.call(this, rc, out);
};
/* per-instance bounding spheres (in the mesh's own space) and a tree of boxes over them; cached on the instance-matrix attribute */
function pkInstAccel(im) {
  const at = im.instanceMatrix, g = im.geometry; let A = at._pk;
  if (A && A.v === at.version && A.g === g) return A;
  const t0 = performance.now(), dyn = A ? A.dyn + 1 : 0, n = at.count, a = at.array;
  if (g.boundingSphere === null) g.computeBoundingSphere();
  const c = g.boundingSphere.center, r = g.boundingSphere.radius, S = A && A.S.length === n * 4 ? A.S : new Float32Array(n * 4), box = new THREE.Box3();
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0, o = 0, k = 0; i < n; i++, o += 16, k += 4) {
    const x = a[o] * c.x + a[o + 4] * c.y + a[o + 8] * c.z + a[o + 12], y = a[o + 1] * c.x + a[o + 5] * c.y + a[o + 9] * c.z + a[o + 13], z = a[o + 2] * c.x + a[o + 6] * c.y + a[o + 10] * c.z + a[o + 14];
    const sx = a[o] * a[o] + a[o + 1] * a[o + 1] + a[o + 2] * a[o + 2], sy = a[o + 4] * a[o + 4] + a[o + 5] * a[o + 5] + a[o + 6] * a[o + 6], sz = a[o + 8] * a[o + 8] + a[o + 9] * a[o + 9] + a[o + 10] * a[o + 10];
    const R = r * Math.sqrt(Math.max(sx, sy, sz)); S[k] = x; S[k + 1] = y; S[k + 2] = z; S[k + 3] = R;
    if (x - R < x0) x0 = x - R; if (y - R < y0) y0 = y - R; if (z - R < z0) z0 = z - R; if (x + R > x1) x1 = x + R; if (y + R > y1) y1 = y + R; if (z + R > z1) z1 = z + R;
  }
  box.min.set(x0, y0, z0); box.max.set(x1, y1, z1);
  A = at._pk = { v: at.version, g, n, S, box, dyn, nb: null, nl: null, ids: null, tree: n < 256 || dyn >= 3 }; // tree: built, or not wanted (few instances; or matrices rewritten every frame, such as flow markers: those are scanned in a line)
  PK.inst++; PK.instMs += performance.now() - t0;
  return A;
}
function pkInstTree(A) { // the tree of boxes over the instance spheres, built when a ray first reaches the set (or in an idle slice)
  const t0 = performance.now(), n = A.n, S = A.S, ids = new Uint32Array(n), nb = [], nl = []; for (let i = 0; i < n; i++) ids[i] = i;
  const build = (lo, hi) => {
    let ax0 = Infinity, ay0 = Infinity, az0 = Infinity, ax1 = -Infinity, ay1 = -Infinity, az1 = -Infinity, cx0 = Infinity, cy0 = Infinity, cz0 = Infinity, cx1 = -Infinity, cy1 = -Infinity, cz1 = -Infinity;
    for (let j = lo; j < hi; j++) {
      const k = ids[j] * 4, x = S[k], y = S[k + 1], z = S[k + 2], R = S[k + 3];
      if (x - R < ax0) ax0 = x - R; if (y - R < ay0) ay0 = y - R; if (z - R < az0) az0 = z - R; if (x + R > ax1) ax1 = x + R; if (y + R > ay1) ay1 = y + R; if (z + R > az1) az1 = z + R;
      if (x < cx0) cx0 = x; if (y < cy0) cy0 = y; if (z < cz0) cz0 = z; if (x > cx1) cx1 = x; if (y > cy1) cy1 = y; if (z > cz1) cz1 = z;
    }
    const ix = nl.length / 2; nb.push(ax0, ay0, az0, ax1, ay1, az1); nl.push(0, 0);
    if (hi - lo <= 8) { nl[ix * 2] = -(lo + 1); nl[ix * 2 + 1] = hi - lo; return ix; }
    const ex = cx1 - cx0, ey = cy1 - cy0, ez = cz1 - cz0, ax = ex >= ey && ex >= ez ? 0 : ey >= ez ? 1 : 2, mid = ax === 0 ? (cx0 + cx1) / 2 : ax === 1 ? (cy0 + cy1) / 2 : (cz0 + cz1) / 2;
    let i = lo, j = hi - 1;
    while (i <= j) { if (S[ids[i] * 4 + ax] < mid) i++; else { const t = ids[i]; ids[i] = ids[j]; ids[j] = t; j--; } }
    if (i - lo < (hi - lo) >> 3 || hi - i < (hi - lo) >> 3) i = (lo + hi) >> 1; // a lopsided split (clustered or coincident instances): split by count, so the tree stays shallow
    const L = build(lo, i), Rr = build(i, hi); nl[ix * 2] = L; nl[ix * 2 + 1] = Rr; return ix;
  };
  build(0, n); A.nb = new Float32Array(nb); A.nl = new Int32Array(nl); A.ids = ids; A.tree = true;
  PK.instTrees++; PK.instMs += performance.now() - t0;
}
function pkInstHit(im, i, rc, out) { // the exact test of one instance, as three.js does it
  im.getMatrixAt(i, _pkLM); _pkWM.multiplyMatrices(im.matrixWorld, _pkLM); _pkMesh.matrixWorld = _pkWM;
  _pkMesh.raycast(rc, _pkTmp);
  for (let k = 0; k < _pkTmp.length; k++) { const h = _pkTmp[k]; h.instanceId = i; h.object = im; out.push(h); }
  _pkTmp.length = 0;
}
const _pkStack = new Int32Array(512);
THREE.InstancedMesh.prototype.raycast = function (rc, out) {
  const n = this.count; if (!n || this.material === undefined) return;
  if (n < 16 || !this.geometry.attributes.position) return _pkInstRay.call(this, rc, out);
  const A = pkInstAccel(this), S = A.S;
  _pkInv.copy(this.matrixWorld).invert(); _pkRay.copy(rc.ray).applyMatrix4(_pkInv);
  if (!_pkRay.intersectsBox(A.box)) return;
  const ox = _pkRay.origin.x, oy = _pkRay.origin.y, oz = _pkRay.origin.z, dx = _pkRay.direction.x, dy = _pkRay.direction.y, dz = _pkRay.direction.z;
  _pkMesh.geometry = this.geometry; _pkMesh.material = this.material;
  const sph = i => { const k = i * 4, vx = S[k] - ox, vy = S[k + 1] - oy, vz = S[k + 2] - oz, t = vx * dx + vy * dy + vz * dz, d2 = vx * vx + vy * vy + vz * vz - (t > 0 ? t * t : 0); return d2 <= S[k + 3] * S[k + 3]; };
  if (!A.nb) { // no tree (few instances, moving instances, or not built yet): every sphere is tested, which is still far cheaper than every instance's triangles
    if (!A.tree && !this._pkQ) { this._pkQ = true; this._pkPri = 0; PK.queue.push(this); PK.sorted = false; }
    for (let i = 0; i < n; i++) if (sph(i)) pkInstHit(this, i, rc, out); return;
  }
  const nb = A.nb, nl = A.nl, ids = A.ids, ix = 1 / dx, iy = 1 / dy, iz = 1 / dz; let sp = 0; _pkStack[sp++] = 0;
  while (sp) {
    const nd = _pkStack[--sp], b = nd * 6;
    let t0 = (nb[b] - ox) * ix, t1 = (nb[b + 3] - ox) * ix, lo = Math.min(t0, t1), hi = Math.max(t0, t1);
    t0 = (nb[b + 1] - oy) * iy; t1 = (nb[b + 4] - oy) * iy; lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
    t0 = (nb[b + 2] - oz) * iz; t1 = (nb[b + 5] - oz) * iz; lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
    if (hi < 0 || lo > hi) continue;
    const a = nl[nd * 2], c = nl[nd * 2 + 1];
    if (a < 0) { for (let j = -a - 1, e = j + c; j < e; j++) { const i = ids[j]; if (i < n && sph(i)) pkInstHit(this, i, rc, out); } }
    else if (sp < 510) { _pkStack[sp++] = a; _pkStack[sp++] = c; }
  }
};
/* the bounding sphere of everything pickable in a frame, in the frame's own coordinates. It is worked out in idle slices (pkIdle, every half
   second while the camera rests), never inside a pick; until a frame has one, or after its content changed, the frame is simply not skipped. */
function pkExpand(o, box) {
  if (o.isInstancedMesh && o.count >= 16 && o.geometry.attributes.position) {
    const b = pkInstAccel(o).box; if (b.isEmpty()) return true;
    for (let i = 0; i < 8; i++) box.expandByPoint(_pkV.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld));
  } else if (o.geometry && o.geometry.isBufferGeometry && o.geometry.attributes.position) {
    const g = o.geometry; if (g.boundingSphere === null) g.computeBoundingSphere();
    _pkSph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); if (!(_pkSph.radius >= 0) || !isFinite(_pkSph.radius)) return false;
    box.expandByPoint(_pkV.copy(_pkSph.center).addScalar(_pkSph.radius)); box.expandByPoint(_pkV.copy(_pkSph.center).addScalar(-_pkSph.radius));
  } else if (o.isSprite) {
    _pkV.setFromMatrixPosition(o.matrixWorld); const r = Math.max(o.scale.x, o.scale.y) * (o.material && o.material.sizeAttenuation === false ? 1e9 : 1); if (r > 1e8) return false;
    box.expandByPoint(_pkSph.center.copy(_pkV).addScalar(r)); box.expandByPoint(_pkSph.center.copy(_pkV).addScalar(-r));
  }
  if (Object.prototype.hasOwnProperty.call(o, 'raycast')) return false; // an object with its own hit test may answer outside its geometry (a star's screen-sized target): no sphere test for this frame
  for (let i = 0; i < o.children.length; i++) if (!pkExpand(o.children[i], box)) return false;
  return true;
}
function pkFrameSphere(f, refresh) {
  const B = f._pkB || (f._pkB = { c: new V3(), r: 0, n: -1, t: -1e9, ok: false, fr: 0 });
  if (B.n !== f.pickables.length) { B.n = f.pickables.length; B.ok = false; B.fr = PERF.frame; B.t = -1e9; return B; } // new content: no sphere test until it has been drawn once
  if (!refresh) return B;
  const now = performance.now(); if (now - B.t < 500) return B;
  if (!f._drawnOnce || !f.C || PERF.frame <= B.fr) return B; // nothing has computed its world matrices yet
  B.t = now; B.ok = false;
  _pkBox.makeEmpty(); let ok = true;
  for (let i = 0; i < f.pickables.length && ok; i++) ok = pkExpand(f.pickables[i], _pkBox);
  if (!ok || _pkBox.isEmpty()) return B;
  _pkBox.getCenter(B.c); B.r = _pkBox.min.distanceTo(_pkBox.max) / 2; B.c.add(f.C); B.ok = isFinite(B.r);
  return B;
}
function pkFrameHit(f, ray) { // could this ray touch anything pickable in the frame?
  const B = pkFrameSphere(f, false); if (!B.ok) return true;
  _pkSph.center.copy(B.c).sub(f.C); _pkSph.radius = B.r * 1.1 + f.dLoc * .03;
  return ray.intersectsSphere(_pkSph);
}
function pkWalk(o, rc, out) { // like Raycaster.intersectObject(o, true), but hidden objects and what is under them are skipped
  if (!o.visible) return;
  if (o.layers.test(rc.layers)) o.raycast(rc, out);
  const ch = o.children; for (let i = 0; i < ch.length; i++) pkWalk(ch[i], rc, out);
}
/* trees ahead of time: the meshes now in view, the smallest first, a few milliseconds per frame and only while the camera rests */
function pkEnqueue(g, pri) { // pri 0: a ray reached it without a tree; 1: in view; 2: pickable but hidden (another layer mode or detail tier)
  if (g.boundsTree || !pkCan(g)) return;
  if (g._pkQ) { if (pri < g._pkPri) { g._pkPri = pri; PK.sorted = false; } return; }
  g._pkQ = true; g._pkPri = pri; PK.queue.push(g); PK.sorted = false;
}
function pkScan() {
  const add = (o, vis) => {
    vis = vis && o.visible;
    if (o.isInstancedMesh) { if (vis && o.count >= 256 && o.geometry.attributes.position) { const A = o.instanceMatrix._pk; if ((!A || !A.tree) && !o._pkQ) { o._pkQ = true; o._pkPri = 1; PK.queue.push(o); PK.sorted = false; } } }
    else if (o.isMesh && o.geometry) pkEnqueue(o.geometry, vis ? 1 : 2);
    for (let i = 0; i < o.children.length; i++) add(o.children[i], vis);
  };
  for (const f of drawn) if (f.pickables && f.alpha >= .5 && !f._culled) for (const p of f.pickables) add(p, visibleChain(p));
}
function pkIdle(budgetMs, deep) { // deep: the camera has rested for a while, so the trees of hidden parts may be built too
  const t0 = performance.now();
  if (t0 - PK.scanT > 700) { PK.scanT = t0; pkScan(); }
  for (const f of drawn) { if (f.pickables && f.alpha >= .5 && !f._culled) pkFrameSphere(f, true); if (performance.now() - t0 > budgetMs) return; } // kept fresh here, so a pick never pays for them
  const Q = PK.queue; if (!Q.length) return;
  if (!PK.sorted) { const k = x => x.isInstancedMesh ? x.count / 4 : pkTris(x); Q.sort((a, b) => a._pkPri - b._pkPri || k(a) - k(b)); PK.sorted = true; }
  while (Q.length && performance.now() - t0 < budgetMs) {
    if (Q[0]._pkPri > 1 && !deep) return;
    const g = Q.shift();
    if (g.isInstancedMesh) { g._pkQ = false; const A = pkInstAccel(g); if (!A.tree) pkInstTree(A); }
    else { g._pkQ = false; if (!g.boundsTree && pkCan(g)) pkBuild(g); }
  }
}

/* ================= PICKING / HOVER ================= */
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
raycaster.params.Points = { threshold: 1 }; raycaster.params.Line = { threshold: 1 };
function pickFrame(f, forZoom) { // best candidate inside one frame: highest priority, then nearest
  if (f.alpha < .5 || !f.pickables || !f.cam || f._culled) return null;
  raycaster.setFromCamera(ndc, f.cam);
  raycaster.params.Points.threshold = f.dLoc * .012; raycaster.params.Line.threshold = f.dLoc * .01;
  if (!pkFrameHit(f, raycaster.ray)) return null;
  const hits = _pkHits; hits.length = 0;
  for (let i = 0; i < f.pickables.length; i++) { const p = f.pickables[i]; if (visibleChain(p)) pkWalk(p, raycaster, hits); }
  hits.sort((a, b) => a.distance - b.distance);
  const cands = [];
  for (const h of hits) {
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
  const t0 = performance.now();
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
  if (best) {
    const f = best.frame; best.ndc = ndc.clone();
    best.pointLocal = best.hit.point.clone().add(f.C);
    best.normalLocal = best.hit.face ? best.hit.face.normal.clone().transformDirection(best.hit.object.matrixWorld) : null;
    best.id = best.obj.userData.resolve ? best.obj.userData.resolve(best.hit) : best.obj.userData.id;
  }
  PERF.pickDone(performance.now() - t0);
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
const HOVER_REST_MS = 70;
/* The hover (highlight and tooltip) is worked out once the pointer has moved and then rested for HOVER_REST_MS, or when the view under a
   resting pointer has changed and come to rest; never while the camera moves (the loop decides: see engine_ui.js). */
function doHover() {
  mouse.dirty = false;
  if (!mouse.has || mouse.touch || pointers.size) { tipEl.classList.remove('show'); return; }
  const h = pickAt(mouse.x, mouse.y);
  mouse.tipX = mouse.x; mouse.tipY = mouse.y;
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
  const zt = h && h.obj && h.obj.userData && h.obj.userData.zoomTo; if (zt && zt(h) !== false) return; // an object can name its own destination (a frame that scrolling would also reach)
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
// labels sit above the canvas: pass the mouse wheel through, so scroll-zoom works over a label too (stopImmediatePropagation: a second forwarder, if any, must not zoom twice)
labelLayer.addEventListener('wheel', e => { e.preventDefault(); e.stopImmediatePropagation(); canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, bubbles: true, cancelable: true })); }, { passive: false });
// where labels collide, the one with the higher data-pri stays (then the upper one); the rest hide until there is room. Re-evaluated every 160 ms, in every scene.
let lblClashT = 0;
function declutterLabels(now) {
  if (now - lblClashT < 160) return; lblClashT = now;
  const items = []; for (const el of labelLayer.children) if (el.style.display !== 'none') items.push({ e: el, pri: +el.dataset.pri || 0, r: el.getBoundingClientRect() }); else if (el.classList.contains('lblhide')) el.classList.remove('lblhide');
  items.sort((a, b) => b.pri - a.pri || a.r.top - b.r.top);
  const kept = [];
  for (const it of items) { const r = it.r, clash = kept.some(k => !(r.right + 4 < k.left || r.left - 4 > k.right || r.bottom + 2 < k.top || r.top - 2 > k.bottom)); it.e.classList.toggle('lblhide', clash); if (!clash) kept.push(r); }
}
const _lv = new V3(), _lo = new V3();
function updateLabels() {
  const shown = new Set();
  for (const f of drawn) {
    if (f.alpha < .6 || !f.labels || f._culled) continue;
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
  declutterLabels(performance.now());
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
