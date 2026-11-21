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
  if (LOOK.on) { const g = LOOK.glowOf(); if (g !== undefined) return g ? .55 : 0; }   // realistic look: glow only where the frame says it holds things that emit light (frame.glow)
  const f0 = drawn[0];
  if (f0 && f0.env && f0.env.opaque && f0.alpha > .995 && (f0.daylight || (f0.illo && cam.D < 6))) return 0;
  if (cam.A && cam.A.daylight && cam.A.alpha > .995) return 0;   // a daylight scene seen from above it (the park from 450 m, before its sky closes over the view): its clouds and lawn are not lamps
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
function rsApply(s) {
  RS.cur = s; PIXK.value = s / PIXR_BASE;
  // Setting a canvas's size clears it, even to the size it already has. A resize event that changes nothing (browsers send them) must not blank the picture.
  if (renderer.getPixelRatio() === s && canvas.width === Math.floor(W * s) && canvas.height === Math.floor(H * s)) return;
  renderer.setPixelRatio(s); renderer.setSize(W, H, false); bloomResize();
  if (drawn.length && drawn.every(f => f.cam && f.root)) { for (const f of drawn) placeFrameCam(f); renderAll(0); } // and after a real change the picture is drawn again at once, not a frame later
}
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
  if (resize.done && innerWidth === W && innerHeight === H) return; // a resize event that changes nothing: keep the picture and the scale the scaler has settled on
  resize.done = true; W = innerWidth; H = innerHeight; rsReset();
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
    if (LOOK.on) { const prev2 = building; building = this; try { LOOK.frameBuilt(this); } finally { building = prev2; } }   // the realistic look: the frame's rig, environment, exposure and glow (js/look.js)
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
const _rs = new V3(), _rt = new V3();
function reanchor() {
  for (let g = 0; g < 60 && cam.A.parent; g++) {
    const A = cam.A;
    const aim = fly ? null : zoomAim();
    // outside the frame's nominal sphere, unless the zoom is aimed at something of this very frame (a cell's wall may reach past the radius its frame was given)
    // (and a camera that is already deep inside a spawned scene, the view a fraction of the scene's size, is not thrown out of it for being a little past its nominal edge)
    const outside = A.radius !== Infinity && (A.center ? _cc.copy(cam.T).sub(A.center) : cam.T).length() > A.radius * (A.dynamic && cam.D < A.radius * A.unit * .6 ? 3 : 1.08) && !(aim && A.dynamic && frameWithin(aim.frame, A));
    // a flight heading for a frame that A is not on the way to (a sibling, or a cousin such as the skin from inside the lung): step back out
    const offPath = fly && fly.frame && A.parent && (_fp = chainOf(fly.frame), !_fp.includes(A));
    const offAim = aim && ((A.coRender && !frameWithin(aim.frame, A)) || (A.enterIf && !frameWithin(aim.frame, A) && !A.enterIf(aim)));   // the zoom is aimed at something that is not in this co-rendered thing (the ground beside it, another thing): this is not the frame to go down in
    /* A frame that was made at the zoom target (a tissue, a cell, a molecule of a material) is still a detail in the view when the camera enters it, and the target
       is still gliding toward the pointer. While that is so, its place is wherever the zoom is heading: it moves with the target instead of being left behind and
       made again (it flickered in and out). Once the view is down to its own size it stays put. */
    if (outside && !offPath && !offAim && cam.D <= A.r1 && A.dynamic && !A.pinned && !fly && cam.D > A.radius * A.unit * .6) {
      _rs.copy(cam.T); A.pos.add(_rt.copy(_rs).multiplyScalar(A.unit / A.parent.unit).applyQuaternion(A.quat));
      cam.T.set(0, 0, 0); for (let i = 0; i < anchored.length; i++) anchored[i].p.sub(_rs);
      break;
    }
    if (cam.D > A.r1 || outside || offPath || offAim) { ascend(); continue; }
    break;
  }
  for (let g = 0; g < 60; g++) {
    const A = cam.A; A.ensure(); let next = null;
    next = pickChild(A);
    if (!next && !fly && (A.spawn || (typeof DESCENT !== 'undefined' && DESCENT.covers(A))) && (cam.D < spawnDOf(A) || cam.D < emptyDOf(A)) && !(A.spawnHold && cam.D > A.spawnHold * .5)) next = trySpawn(A, !(cam.D < spawnDOf(A)));   // spawnHold: a flight that was asked to end this close (a 2.5 mm water flea) does not dive into what it is made of until you zoom in further // a flight heads for a frame that already exists: never spawn stand-ins on the way
    if (!next) break;
    A._dzStop = null;   // there is a way down here after all: a stop said in this frame (js/descent.js) no longer holds the camera
    descend(next);
  }
  // dispose dynamic frames we've left far behind
  forEachFrame(f => {
    if (f.dynamic && f.parent && !drawn.includes(f) && !chainOf(cam.A).includes(f) && cam.D > f.r1 * 3 && !(f.keep > performance.now()) && !(fly && fly.frame === f)
      && (f.entered || !chainOf(cam.A).includes(f.parent) || cam.D > (f._bornD || spawnDOf(f.parent)) * 3)) {   // a child that is still waiting goes only when the camera has pulled back threefold from where it was made
      f.dispose(); f.parent.children.splice(f.parent.children.indexOf(f), 1); if (f.proxy) f.proxy.visible = true;
    }
  });
}
// Which child frame to enter when several overlap the camera target. Prefer the one on the path of the current flight.
// Otherwise prefer a frame whose core (`core`, default `radius`, in its own units) holds the target, the smallest such core first
// (a heart sits inside the chest volume of a lung); failing that, the best fit: smallest distance from its centre relative to its radius.
// place() of a frame that is not built yet may depend on things that do not exist: a failure leaves it where it was and is reported once
function safePlace(c) { if (!c.place) return; try { c.place(); } catch (e) { if (!c._placeErr) { c._placeErr = 1; console.warn('place() failed before the frame was built:', c.name, e.message); } } }
/* What the zoom is aimed at: the surface its pivot was picked on, for as long as that pivot is in use (a zoom out, a flight or a jump drops it). A co-rendered
   child (a thing in the park, the body) is drawn and picked together with its parent, so a pivot on the parent's own content, or on another thing, means the
   pointer is NOT on that child: the camera does not go down into it, however close its bounding sphere is (the grass beside the oak leads into soil, not into the oak). */
function zoomAim() { return lastZoomHit && zoom.pivot && anchored.includes(zoom.pivot) ? lastZoomHit : null; }
function frameWithin(f, A) { for (; f; f = f.parent) if (f === A) return true; return false; }
/* below this camera distance a frame is asked for what lies under the target: its own spawnD, else the materials table's (js/descent.js) */
/* a zoom aimed at nothing (no surface under the pivot, no attractor locked) goes into what the frame's space is filled with from this distance (js/descent.js, `emptyD`):
   the gas between the planets or the stars, with the scale line saying so, rather than running on into empty space in silence */
function emptyDOf(A) { return !zoomAim() && !(att.f === A && att.id >= 0) && zoom.pivot && anchored.includes(zoom.pivot) && typeof DESCENT !== 'undefined' && DESCENT.emptyD ? DESCENT.emptyD(A) : 0; }
function spawnDOf(A) { return A.spawnD || A.r0 * 1.6 || (typeof DESCENT !== 'undefined' ? DESCENT.spawnD(A) : 0); }
function pickChild(A) {
  const path = fly && fly.frame ? chainOf(fly.frame) : null, aim = path ? null : zoomAim();
  const lk = !path && att.f === A && att.id >= 0 && A.att && A.att.tol ? att.p : null;   // the zoom is closing on one of this frame's attractors: only a child that sits on that one is the way down
  let best = null, bs = Infinity;
  for (const c of A.children) {
    safePlace(c);
    if (cam.D > c.r1 || !c.containsP(cam.T)) continue;
    if (lk && c.pos.distanceTo(lk) > A.att.tol) continue;
    if (aim && c.coRender && !frameWithin(aim.frame, c)) continue;
    if (aim && c.enterIf && !frameWithin(aim.frame, c) && !c.enterIf(aim)) continue;   // a frame may say what the pointer must be on for a scroll to enter it (the phone in the hand: the skin, not a bone)
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
function trySpawn(A, emptyOnly) {   // emptyOnly: above the frame's own spawn distance, only the filling of its empty space is asked for (emptyDOf)
  let hint = null;
  if (lastZoomHit && lastZoomHit.frame === A && lastZoomHit.point.distanceTo(cam.T) < Math.max(cam.D / A.unit * 10, A.radius * 1e-4)) hint = lastZoomHit;
  // a pending (not yet entered) child near the view follows the zoom target until the camera goes into it (it used to stop following once the camera was close
  // enough to enter, so a target still gliding toward the pointer could leave it behind for good)
  const lim = cam.D / A.unit * 3; let pend = null;
  const ho = hint ? hint.obj : null;
  // (a waiting child that was made for the thing the pointer is still on is found again however far the target has moved: it is not made twice)
  for (let i = 0; i < A.children.length; i++) { const c = A.children[i]; if (c.dynamic && !c.entered && (c.pos.distanceTo(cam.T) < lim || (!c.pinned && !c.built && c._for !== undefined && c._for === ho))) { pend = c; break; } }
  // a child that was made while the pointer was on nothing (a frame-wide default) gives way when the pointer is now on a thing: that thing decides what lies below
  if (pend && pend._for === null && !pend.pinned && !pend.built && (ho || (att.f === A && att.id >= 0))) { A.children.splice(A.children.indexOf(pend), 1); pend = null; }   // (or when the zoom has locked on one of the frame's attractors: the ground below the Earth's glow, not the gas in front of it)
  if (pend) { if (!pend.pinned) pend.pos.copy(cam.T); return cam.D <= pend.r1 && pend.containsP(cam.T) ? pend : null; }
  for (let i = 0; i < A.children.length; i++) { const c = A.children[i]; if (c.dynamic && c.containsP(cam.T)) return null; }
  // A failure is not tried again on every frame: only when the target has moved by half a view, the camera has come a sixth closer, the pointer is on something
  // else (a failure without a surface under the cursor must not block a spawn that now has one), or a little time has passed (layers peel, data arrives).
  const sf = A._spawnFail, now = performance.now();
  if (sf && sf.obj === ho && now - sf.t < 400 && cam.D > sf.D * .85 && sf.p.distanceTo(cam.T) < cam.D / A.unit * .5) return null;
  /* a marker that stands for a place built in advance (`zoomPoint`: the park's dot over the globe, the place being the London region) is reached by going into that
     place, which the zoom enters when its target comes inside it: no patch of generic land is made on the way (one was made where the view's target still was,
     tens of km short of the place, and the zoom went down into it beside London) */
  if (!emptyOnly && hint && hint.obj && hint.obj.userData.zoomPoint) return null;
  let c = !emptyOnly && hint && hint.held && typeof DESCENT !== 'undefined' && DESCENT.spawnHeld ? DESCENT.spawnHeld(A, hint, cam.T.clone()) : null;   // the part the zoom has kept as its aim (zoomBy) decides, though it is see-through now
  if (!c && !emptyOnly && !hint && typeof DESCENT !== 'undefined' && DESCENT.fills && DESCENT.fills(A)) c = DESCENT.spawn(A, cam.T, null);   // pointed at nothing in a scene that is one material throughout: that material, not the nearest thing in it
  if (!c && !emptyOnly) c = A.spawn ? A.spawn(cam.T.clone(), hint) : null;
  if (!c && typeof DESCENT !== 'undefined') c = DESCENT.spawn(A, cam.T, hint);   // nothing of its own here: what the thing under the zoom point is made of (the materials table)
  if (!c) { const f = sf || (A._spawnFail = { p: new V3(), obj: null, t: 0, D: 0 }); f.p.copy(cam.T); f.obj = ho; f.t = now; f.D = cam.D; return null; }
  for (let i = A.children.length - 1; i >= 0; i--) { const o = A.children[i]; if (o.dynamic && !o.entered && !o.pinned && !o.built && o._for !== undefined && !(o.keep > now)) A.children.splice(i, 1); }   // one waiting child at a time: an earlier one, made for something else, goes
  A._spawnFail = null; c.dynamic = true; c._bornD = cam.D; c._for = ho; A.addChild(c);
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
let _coHost = null, _coHostR = 0;   // the co-rendered thing the camera is anchored in (or inside), and its size in metres
const _proxyHid = new Set();   // frames whose stand-in computeActive hid
function computeActive() {
  const ch = chainOf(cam.A).reverse(); // root ... A
  _coHost = null; for (let i = ch.length - 1; i >= 0; i--) { const f = ch[i]; if (f.coRender && f.parent && f.parent.unit === f.unit) { _coHost = f; _coHostR = (f.radius || 1) * f.unit; break; } }
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
  // ... and a frame that has left the chain shows its stand-in again (the Sun's stand-in, and with it the Sun's name, stayed hidden in the solar system for
  // good after a visit to the Sun: only frames on the chain were looked at here)
  for (const f of _proxyHid) if (!ch.includes(f) && f.proxy && !(f.coRender && f.parent && f.parent.unit === f.unit)) f.proxy.visible = true;
  _proxyHid.clear(); for (const f of ch) if (f.proxy && !f.proxy.visible) _proxyHid.add(f);
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
      if (a > .004) { drawn.push(c); coKids(c); }
    }
  }
}
/* A co-rendered neighbour's own co-rendered children are drawn with it, one level down: a thing placed in the human body (js/things.js, `in: "body"`) is
   seen from the park although the camera is anchored in neither. Same rules as above (same unit, the parent's depth buffer, picked with it). */
function coKids(p) {
  for (const c of p.children) {
    if (!c.coRender || c.unit !== p.unit || active.includes(c)) continue;
    safePlace(c);
    const a = coAlpha(c);
    c.alpha = a; c._share = true; c._nb = true;
    if (c.proxy) c.proxy.visible = !(a > .98);
    if (a > .004) drawn.push(c);
  }
}
const _cv = new V3();
// visibility of a co-rendered child: its parent's, fading out with the camera's distance from it (coMax metres, default r1)
function coAlpha(c, inChain) {
  const p = c.parent, lim = c.coMax || c.r1;
  const pa = inChain || p === cam.A ? 1 : (p.alpha ?? 1);
  if (lim === Infinity) return pa;
  const dist = camPosIn(p, _cv).distanceTo(c.pos) * p.unit;
  let a = Math.min(pa, 1 - smooth(lim * .7, lim, dist));
  // Close to one thing, the other neighbours get out of the way (the person does not stand in a close-up of the bee): beyond about 10 times the viewing distance
  // from the camera they fade out, completely by 24 times; they come back smoothly as the camera pulls back (D grows) or leaves the thing (5 sizes of it).
  if (!inChain && _coHost && c !== _coHost && cam.D < 5 * _coHostR) { const dn = Math.max(0, dist - (c.radius || 0) * c.unit); a = Math.min(a, 1 - smooth(10 * cam.D, 24 * cam.D, dn)); }
  return a;
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
   projection so the camera's target appears in the middle of that free area (the panel open on the right, Tracks on the left; on a
   phone the panel is a sheet at the bottom). It eases in and out, and everything that projects through f.cam (picking, labels) follows.
   freeArea() is that part of the screen, in CSS pixels: between the ruler (or Tracks) and the open panel, below the top controls; on a
   phone, between the top buttons and the sheet. It is read from layout positions, not from the panel's rectangle while it slides. */
const viewOff = { x: 0, y: 0, wantX: 0, wantY: 0 };   // wantX, wantY: where it is easing to
let _voT = performance.now();
function freeArea() {
  const A = { l: 0, r: W, t: 0, b: H }, pn = document.getElementById('panel'), open = pn && document.body.classList.contains('panelOpen');
  const tr = document.getElementById('tracks'), rl = document.getElementById('ruler');
  if (tr && tr.classList.contains('open') && W > 860) A.l = tr.getBoundingClientRect().right; else if (rl && rl.offsetWidth) A.l = rl.getBoundingClientRect().right;
  if (W > 860) { A.t = 56; if (open) A.r = Math.min(W, pn.offsetLeft); }
  else { A.t = 96; if (open) A.b = Math.min(H, pn.offsetTop); }
  A.tracks = !!(tr && tr.classList.contains('open')); A.panel = !!open;
  A.cx = (A.l + A.r) / 2; A.cy = (W > 860 ? H / 2 : (A.t + A.b) / 2); A.w = A.r - A.l; A.h = A.b - A.t;
  return A;
}
function updateViewOffset() {
  const now = performance.now(), dt = Math.min(.3, (now - _voT) / 1000); _voT = now; // real time, so it settles in about half a second even at a low frame rate
  let tx = 0, ty = 0;
  const A = freeArea();
  if (!A.tracks && !A.panel) { /* no panel open: the view is centred as ever */ }
  else if (W > 860) tx = clamp(A.cx - W / 2, -W * .3, W * .3); // the free area's centre, relative to the screen's centre
  else if (A.panel) { tx = A.cx - W / 2; ty = clamp(A.cy - H / 2, -H * .3, 0); } // phone: up above the sheet, and clear of the ruler strip
  // setViewOffset moves the window over the full image: a window shifted right shows content that sits further right, so the scene moves left by +x
  const k = 1 - Math.exp(-dt * 9), nx = -tx, ny = -ty; viewOff.wantX = nx; viewOff.wantY = ny;
  viewOff.x += (nx - viewOff.x) * k; viewOff.y += (ny - viewOff.y) * k;
  if (Math.abs(viewOff.x - nx) < .5) viewOff.x = nx; if (Math.abs(viewOff.y - ny) < .5) viewOff.y = ny;
}
/* Where the camera's target is drawn on the screen (CSS pixels): the centre of the free area once the shift has settled. */
function viewCentre() { return { x: W / 2 - viewOff.x, y: H / 2 - viewOff.y }; }
/* A scene is shifted so that the eye sits at its origin, and three.js takes a hemisphere light's direction (and the direction of a directional light whose target
   is not in the scene) from the light's position in the scene: so the shading used to depend on where the camera was. Here each such light is moved by the opposite
   of the shift, so that its direction is the one the frame gave it (a hemisphere light: up) wherever the camera is. A light that casts a shadow is left alone (its
   shadow camera follows it). */
const _slNew = new V3();
function fixSceneLights(f) {
  const n = f.root.children.length;
  if (f._ltN !== n) {   // the frame's content group is rebuilt rarely; look again when the root's children change. Lights in a group that only holds them (no offset, turn or scale) count too.
    f._ltN = n; f._lt = [];
    const plain = g => g.position.lengthSq() === 0 && g.quaternion.w === 1 && g.scale.x === 1 && g.scale.y === 1 && g.scale.z === 1;
    f.root.traverse(o => { if (!(o.isHemisphereLight || (o.isDirectionalLight && !o.target.parent && !o.castShadow))) return; let a = o.parent; while (a && a !== f.root && plain(a)) a = a.parent; if (a === f.root) f._lt.push(o); });
  }
  for (const o of f._lt) {
    const u = o.userData; if (!u._p0) { u._p0 = o.position.clone(); u._lw = o.position.clone(); }
    if (!o.position.equals(u._lw)) u._p0.copy(o.position);   // the frame has moved the light itself: that is the direction it wants
    o.position.copy(u._p0).sub(f.root.position); u._lw.copy(o.position);
  }
}
function placeFrameCam(f) {
  camPosIn(f, _cp); _tp.copy(cam.T); convertP(_tp, cam.A, f);
  _dv.copy(cam.dir); convertD(_dv, cam.A, f); _uv.copy(cam.up); convertD(_uv, cam.A, f);
  f.C = (f.C || new V3()).copy(_cp);
  f.root.position.copy(_cp).negate();
  fixSceneLights(f);
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
          if (LOOK.on) r.toneMappingExposure = LOOK.exposureOf(f);
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
    if (LOOK.on) r.toneMappingExposure = LOOK.exposureOf(f);   // realistic look: the page's exposure times the frame's own
    r.render(f.scene, f.cam); PERF._renders++; f._drawnOnce = true;
    if (f.postDraw) f.postDraw(r);   // a frame's own drawing after its scene (and in its depth), when it needs one
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
/* A frame that is built before it is first drawn (flyTo builds the whole path of a flight when the flight starts) has its shaders
   compiled then, one frame per tick, so the stall comes at the click and not in the middle of the flight when the frame comes into
   view. Nothing is compiled ahead for parts that are not shown (other layer modes, cut views): in three r128 compiling blocks until
   the program has linked, and doing that for every hidden variant was measured to add 42 programs and about 3.5 s of stalls to the
   first seconds on the software renderer here. Those compile when they are first shown, as they always did. */
function compileStep() {
  const f = compileQ.shift();
  if (!f || !f.built || !f.scene || f._drawnOnce) return;
  try { renderer.compile(f.scene, f.cam); } catch (e) { }
}
/* Inked outlines (the inverted hull that draws every part a second time; the ink is about 1.5 pixels wide at any distance).
   outline=all: always. outline=0: only the part under the pointer or selected. outline=near (the default): the ink fades out as the
   whole thing gets small on screen, between 70 and 40 pixels tall (px = its height in pixels): at that size the ink no longer draws an
   edge, it only darkens the figure. A thing's far detail tier has none (js/things.js). Chosen from screenshots: notes/perf.md. */
const OUTLINE_PX = [40, 70];
function outlineAmt(px) { if (LOOK.on && LOOK.part('pbr')) return 0; /* realistic look: no ink, only the hull of the part pointed at or selected */ const o = PERF.flags.outline; return o === 'all' ? 1 : o === '0' ? 0 : smooth(OUTLINE_PX[0], OUTLINE_PX[1], px); }

/* ================= INPUT: zoom-to-cursor, orbit, fly ================= */
const zoom = { pending: 0, pivot: null, pt: -1e9, px: 0, py: 0, gen: -1 }; // pending = remaining ln(D) change; pt, px, py, gen: when, where and in which state of the view the pivot was last picked
let lastInput = performance.now(), fly = null;
/* viewGen counts changes of what can be under a resting pointer other than the camera's own zoom: layers peeling, frames arriving or
   fading in, an orbit. A hover pick and the zoom pivot are worked out again only when the pointer or this has changed. */
let viewGen = 0;
function viewChanged() { viewGen++; mouse.dirty = true; }
const PIVOT_MIN_MS = 150, PIVOT_MAX_MS = 400;
const MIN_D = 1e-20, MAX_D = 3e27; // 1e-20 m: below every length that has been probed; nothing is known to have structure there
let _pvHit = null;   // the pick the last pivot came from (the zoom's target is set from it)
function pivotAt(x, y) {
  const h = pickAt(x, y, true); _pvHit = null;
  // a marker that floats above the place it stands for (the park's dot over the globe) says where a zoom aimed at it ends: userData.zoomPoint(h), in its frame's coordinates
  const zp = h && h.obj.userData.zoomPoint ? h.obj.userData.zoomPoint(h) : null;
  if (zp) { _pvHit = h; lastZoomHit = { frame: h.frame, obj: h.obj, point: zp.clone(), normal: null, id: h.id, hit: h.hit }; return convertP(zp.clone(), h.frame, cam.A); }
  if (h && !h.obj.userData.noZoom && h.meters < cam.D * 40 && (!h.obj.isSprite || h.frame === cam.A)) {
    const p = h.pointLocal.clone(); convertP(p, h.frame, cam.A);
    _pvHit = h; lastZoomHit = { frame: h.frame, obj: h.obj, point: h.pointLocal.clone(), normal: h.normalLocal, id: h.id, hit: h.hit };
    return p;
  }
  // no surface: a point along the ray at the current focus distance
  const f = cam.A; placeFrameCam(f);
  ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1); raycaster.setFromCamera(ndc, f.cam);
  const p = raycaster.ray.direction.clone().multiplyScalar(cam.D / f.unit).add(f.C);
  lastZoomHit = null;
  return p;
}
/* THE ZOOM'S TARGET. A wheel burst (or a pinch, or a held zoom button) that begins on a thing homes in on that thing. Scaling the camera about the
   point under the pointer keeps that point still, but the point a pick returns on a small thing is not on the thing (a planet's dot is a pick
   target many times its size; a pond animal or a star is a speck): one burst magnifies about three times, and a target a few pixels off slid out
   of view after two bursts, after which the zoom ran on into empty space. So the thing picked when the zoom begins is its target until the pointer
   moves by more than ZT_PX or the visitor drags, zooms out or flies:
   - the pivot follows the thing: its centre while it is smaller than about a fifth of the view, the point picked on it once it is larger than the
     view, and a blend between (so the pivot moves smoothly; moving the pivot never moves the camera). The point is kept in the thing's own
     coordinates, so a moving thing (the Moon, a pond skater) is followed. Where the pick was on a stand-in target (an enlarged dot), the point is
     where the pointer's ray meets the thing's true sphere until a pick on the thing itself gives a real one;
   - the target stays the target: a later pick under the pointer replaces its point only when it is on the same thing (or, in a thing that peels
     its layers, a part inside the target's extent, or the thing's own frame below it: a planet's globe under its dot);
   - lastZoomHit names it, so the descent (trySpawn, js/descent.js) goes into what that thing is made of.
   The frame's own attractors (an atom's nucleus, a molecule's atoms) still decide inside a frame that has them (attLock); they are asked from this pivot. */
const ZT_PX = 6;
const ztg = { f: null, obj: null, lo: null, id: null, hit: null, ud: null, x: 0, y: 0, loc: new V3(), real: false, c: new V3(), r: 0, p: new V3(), s: 0, t: 0, held: false, why: '' };
const _ztRc = new THREE.Raycaster(), _ztN = new THREE.Vector2(), _ztV = new V3(), _ztW = new V3(), _ztP = new V3();
function ztDrop(why) { if (ztg.f) { ztg.why = why || ''; } ztg.carry = null; ztg.f = null; ztg.obj = null; ztg.lo = null; ztg.hit = null; }
function ztInfo() { return ztg.f ? { id: String(ztg.id), frame: ztg.f.name || ztg.f.type, s: +ztg.s.toFixed(3), real: ztg.real } : { none: ztg.why }; }
const zoomTgtInfo = ztInfo;
/* the thing's centre (frame coordinates, into ztg.c) and radius (frame units; 0: a point) */
function ztExtent() {
  const u = ztg.ud, h = ztg.h;
  if (u.zoomPoint) { const p = u.zoomPoint(h); if (p) { ztg.c.copy(p); ztg.r = 0; return; } }
  let e = null; try { e = hitExtent(h); } catch (err) { e = null; }
  if (u.center && (!e || !e.r)) { try { ztg.c.copy(u.center(h)); } catch (err) { } const r = typeof u.radius === 'function' ? u.radius(h) : u.radius; ztg.r = u.zoomTo ? 0 : (r || 0); return; }
  if (e) { ztg.c.copy(e.p); ztg.r = e.r || 0; }
}
/* is a pick on the target? the same object (or one inside it, or the one it is inside); a part of a layered thing inside the target's extent; or the frame below the thing */
function ztOn(h) {
  if (!h || !ztg.f) return false;
  if (h.obj === ztg.obj || isUnderObj(h.obj, ztg.obj) || isUnderObj(ztg.obj, h.obj)) return true;
  if (!ztg.r || !frameWithin(h.frame, ztg.f)) return false;
  if (h.frame === ztg.f && (!ztg.f.layered || ztg.f.aimHolds)) return false;
  if (h.frame === ztg.f && typeof peelRank === 'function' && ztg.ud.part && h.obj.userData.part && peelRank(h.obj.userData.part) < peelRank(ztg.ud.part)) return false;   // a layer in front of the target (the skin over the eye) never takes it back   // another part of the same thing: the target stays (pond water is not a skater's leg, nor the mud that shows through it); only a thing that peels its layers hands the aim on to what it uncovers
  const p = convertP(h.pointLocal.clone(), h.frame, ztg.f);
  return p.distanceTo(ztg.c) <= ztg.r * 1.25 + 1e-12;
}
/* A small part under a covering layer, next to the pointer: on a body seen whole, the eye is a few pixels across under the skin, and a pointer on the brow a few
   pixels from it, which a hand cannot tell apart, means the eye (the brain behind the brow is not what anyone points at the face for). Within the forgiving
   pick's outer ring (PICK_NEAR_PX) of the pointer, an organ-rank part (not skin, muscle, bone or vessel) that is at most that ring's size on screen and lies
   just under the picked surface becomes the zoom's target; the nearest to the pointer wins. Only on a thing that peels its layers. */
const _zuS = new THREE.Sphere(), _zuV = new V3();
function ztUnder(h, x, y) {
  const F = h && h.frame; if (!F || !F.layered || !F.parts || !F.cam || typeof peelRank !== 'function' || !h.obj.userData.part || peelRank(h.obj.userData.part) >= 3 || !h.hit) return null;
  const R = PICK_NEAR_PX[PICK_NEAR_PX.length - 1], ppr = PX_PER_RAD(); let best = null, bd = Infinity;
  for (const id in F.parts) {
    const P = F.parts[id], g = P.g, m = g && g.userData.main; if (!m || !m.geometry || !P.p || peelRank(P.p) < 3 || (F.hidden && F.hidden.has(id))) continue;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    _zuS.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
    const dc = _zuV.copy(_zuS.center).sub(F.cam.position).length(), rp = _zuS.radius / dc * ppr; if (rp > R || rp <= 0) continue;
    if (_zuS.center.distanceTo(h.hit.point) > _zuS.radius * 4) continue;   // just under the surface the pointer is on
    _zuV.copy(_zuS.center).project(F.cam); if (_zuV.z > 1) continue;
    const d = Math.hypot((_zuV.x + 1) / 2 * W - x, (1 - _zuV.y) / 2 * H - y); if (d > R + rp || d >= bd || !ztFirstOrgan(F, id, _zuS.center)) continue;
    bd = d; best = { frame: F, obj: g, id, hit: null, pointLocal: _zuS.center.clone().add(F.C), normalLocal: null, under: true };
  }
  return best;
}
/* is this part the first organ-rank part on the line of sight to its centre (what shows there once skin, muscle and bone are peeled: the eye, not the cerebellum behind it)? */
function ztFirstOrgan(F, id, c) {
  _ztRc.ray.origin.copy(F.cam.position); _ztRc.ray.direction.copy(c).sub(F.cam.position); const L = _ztRc.ray.direction.length(); _ztRc.ray.direction.divideScalar(L); _ztRc.near = 0; _ztRc.far = L;
  for (const k in F.parts) { if (k === id) continue; const P = F.parts[k], m = P.g && P.g.userData.main; if (!m || !P.p || peelRank(P.p) < 3 || (F.hidden && F.hidden.has(k))) continue; if (_ztRc.intersectObject(m, false).length) { _ztRc.far = Infinity; return false; } }
  _ztRc.far = Infinity; return true;
}
function isUnderObj(o, root) { while (o) { if (o === root) return true; o = o.parent; } return false; }
function ztSet(h, x, y) {
  ztDrop();
  if (!h || !h.obj || isBackdrop(h) || pickWeak(h) || h.obj.userData.noZoom) return false;
  const ho = h.hit && h.hit.object;
  ztg.f = h.frame; ztg.obj = h.obj; ztg.id = h.id; ztg.hit = h.hit; ztg.ud = h.obj.userData; ztg.x = x; ztg.y = y; ztg.t = performance.now(); ztg.why = '';
  ztg.h = { frame: h.frame, obj: h.obj, id: h.id, hit: h.hit, pointLocal: (h.pointLocal || h.point).clone(), normalLocal: h.normalLocal || h.normal || null };
  ztg.held = !!h.frame.aimHolds; ztg.mode = null; ztg.under = !!h.under;   // under: a part still covered by the layers in front of it (ztUnder): it is the target before the peel shows it
  ztReal(ho, h.hit);
  ztExtent();
  return true;
}
/* the picked point, kept in the coordinates of the object that was hit: unless it was a stand-in pick target (an enlarged dot, a marker, a point) */
function ztReal(ho, hit) {
  const proxy = !ho || !hit || !hit.face || ho.isSprite || ho.isPoints || ho.isLine || (ho.material && ho.material.visible === false) || !ho.matrixWorld;
  ztg.real = !proxy;
  if (!proxy) { ztg.lo = ho; ztg.loc.copy(hit.point); ho.worldToLocal(ztg.loc); }
}
/* a pick made while the target holds: a better point on the target, or nothing */
function ztRefine(h) {
  if (!h || !ztOn(h)) return false;
  const ho = h.hit && h.hit.object;
  if (h.frame !== ztg.f || h.obj !== ztg.obj) {   // the thing's frame below it (a planet's globe under its dot) or a part a layered thing has uncovered: that is the target now
    if (h.frame !== ztg.f || ztg.f.layered) { const keep = ztg.held; ztg.f = h.frame; ztg.obj = h.obj; ztg.id = h.id; ztg.hit = h.hit; ztg.ud = h.obj.userData; ztg.h = { frame: h.frame, obj: h.obj, id: h.id, hit: h.hit, pointLocal: h.pointLocal.clone(), normalLocal: h.normalLocal }; ztg.held = keep && !!h.frame.aimHolds; ztExtent(); }
  }
  ztReal(ho, h.hit);
  return true;
}
/* A thing that shows other parts by distance (`aimHolds`: the pond's Auto stages) keeps the part first pointed at as the aim; but when the stage now shown is a
   layer of its own that the aimed part is not in, and the aimed part is drawn see-through by it, the stage's own first part takes over the aim (the water surface
   seen from 7 m gives way, close up, to "the open water" that stage shows: the descent goes into a drop of pond water, not into the film's skater). */
function ztHandOn(f) {
  const T = f.T, md = T && T.curMode, pd = ztg.ud && ztg.ud.part; if (!md || !pd || ztg.mode === md.id) return; ztg.mode = md.id;
  const sh = md.show && md.show[pd.system]; if (sh === undefined || sh >= .35) return;
  const L = (T.layers || []).find(l => l.id === md.id); if (!L || !L.systems || !L.systems.length || L.systems.includes(pd.system)) return;
  const np = (T.def.parts || []).find(p => p.system === L.systems[0] && f.parts && f.parts[p.id]); const g = np && f.parts[np.id].g; if (!g || !visibleChain(g)) return;
  _ztN.set(ztg.x / W * 2 - 1, -(ztg.y / H) * 2 + 1); _ztRc.setFromCamera(_ztN, f.cam);
  const hs = _ztRc.intersectObject(g, true); if (!hs.length) return;
  let o = hs[0].object; while (o && !o.userData.id) o = o.parent; if (!o) return;
  const keep = ztg.mode;
  ztSet({ frame: f, obj: o, id: o.userData.id, hit: hs[0], pointLocal: hs[0].point.clone().add(f.C), normalLocal: null }, ztg.x, ztg.y); ztg.mode = keep;
}
/* where the pivot is now (cam.A coordinates, into out), or null when there is no target any more */
function ztPivot(out) {
  const f = ztg.f; if (!f) return null;
  if (!zoom.pivot || !anchored.includes(zoom.pivot) || fly) { ztDrop('pivot gone'); return null; }
  if (!f.built || !f.C || !(chainOf(cam.A).includes(f) || drawn.includes(f)) || (!ztg.under && !visibleChain(ztg.obj))) { ztDrop('thing gone'); return null; }
  if (ztg.held) ztHandOn(f);
  ztExtent();
  // the descent has gone into something inside the thing (a scene of what it is made of, smaller than the thing): from here the new place decides
  if (cam.A !== f && frameWithin(cam.A, f) && cam.A.radius !== Infinity && (!ztg.r || cam.A.radius * cam.A.unit < ztg.r * f.unit * .5)) {
    const x = ztg.x, y = ztg.y; ztDrop('went in');
    /* a scene that is one material throughout, with things in it (a drop of pond water and what swims in it): the zoom goes on into that material, at the same
       point, until the visitor points at one of the things in it; it does not take whatever happens to drift under the resting pointer */
    if (typeof DESCENT !== 'undefined' && DESCENT.fills && DESCENT.fills(cam.A)) { ztg.carry = { x, y, f: cam.A }; lastZoomHit = null; }
    return null;
  }
  const cp = camPosIn(f, _ztV), dist = Math.max(cp.distanceTo(ztg.c), 1e-30);
  ztg.s = ztg.r / (2 * Math.tan(25 * Math.PI / 180) * dist);
  const w = ztg.r ? smooth(.05, .1, ztg.s) : 0;   // s is the radius over the view: the centre below a tenth of the view across, the picked point from a fifth up
  out.copy(ztg.c);
  if (w > 0) {
    if (ztg.real && ztg.lo && ztg.lo.parent) { ztg.lo.localToWorld(_ztW.copy(ztg.loc)).add(f.C); }
    else {   // where the pointer's ray meets the thing's sphere (or comes nearest to it)
      _ztN.set(ztg.x / W * 2 - 1, -(ztg.y / H) * 2 + 1); _ztRc.setFromCamera(_ztN, f.cam);
      const d = _ztRc.ray.direction, oc = _ztW.copy(ztg.c).sub(cp), t = oc.dot(d), q2 = oc.lengthSq() - t * t, r2 = ztg.r * ztg.r;
      if (q2 <= r2 && t > 0) _ztW.copy(d).multiplyScalar(t - Math.sqrt(r2 - q2)).add(cp);
      else { _ztW.copy(d).multiplyScalar(Math.max(t, 0)).add(cp).sub(ztg.c); const L = _ztW.length(); if (L > 0) _ztW.multiplyScalar(ztg.r / L); _ztW.add(ztg.c); }
    }
    out.lerp(_ztW, w);
  }
  if (lastZoomHit && lastZoomHit.obj === ztg.obj) lastZoomHit.point.copy(out);
  else lastZoomHit = { frame: f, obj: ztg.obj, point: out.clone(), normal: null, id: ztg.id, hit: ztg.hit, held: ztg.held };
  return convertP(out, f, cam.A);
}
function zoomBy(lnDelta, x, y) {
  lastInput = performance.now(); fly = null; cancelTour(); if (lnDelta < 0) camHold = null;
  if (lnDelta < 0 && x !== undefined && ztg.f && (Math.abs(x - ztg.x) > ZT_PX || Math.abs(y - ztg.y) > ZT_PX)) ztDrop('pointer moved');
  if (lnDelta < 0 && x !== undefined && ztg.f && zoom.pivot && anchored.includes(zoom.pivot)) {
    /* the target holds: a pick now and then only looks for a better point on it (a real surface once the thing is big enough to be hit itself) */
    const now = performance.now();
    if (now - zoom.pt > (ztg.real ? PIVOT_MAX_MS : PIVOT_MIN_MS) || zoom.gen !== viewGen) { ztRefine(pickAt(x, y, true)); zoom.pt = now; zoom.gen = viewGen; }
    zoom.px = x; zoom.py = y;
  }
  else if (lnDelta < 0 && x !== undefined && ztg.carry && zoom.pivot && anchored.includes(zoom.pivot) && Math.abs(x - ztg.carry.x) <= ZT_PX && Math.abs(y - ztg.carry.y) <= ZT_PX && chainOf(cam.A).includes(ztg.carry.f)) { zoom.px = x; zoom.py = y; }   // carried on into a scene's own material (ztPivot)
  else if (lnDelta < 0 && x !== undefined) {
    ztg.carry = null;
    /* A wheel burst keeps the pivot it has. Scaling the camera about the pivot leaves the pivot under the pointer, so picking again
       returns the same point unless the pointer moved or the view changed (viewGen): then it is picked again, at most every 150 ms;
       and in any case after 400 ms, so a slow change that nothing announced (a detail tier swapping) cannot leave it stale. */
    const now = performance.now(), age = now - zoom.pt, pv = zoom.pivot;
    const moved = Math.abs(x - zoom.px) > 1.5 || Math.abs(y - zoom.py) > 1.5 || zoom.gen !== viewGen;
    if (!pv || !anchored.includes(pv) || age > PIVOT_MAX_MS || (moved && age >= PIVOT_MIN_MS)) {
      /* The pointer has not moved and the surface the zoom was closing on is no longer under it (a tree's far shape gave way to its leaves and the pointer is
         now on a gap between them): the zoom keeps the point it had. The place where the surface was is still where the visitor is going; a zoom that was on
         a thing must not turn into a zoom into the air behind it. */
      const held = pv && anchored.includes(pv) && lastZoomHit && Math.abs(x - zoom.px) <= 1.5 && Math.abs(y - zoom.py) <= 1.5 ? lastZoomHit : null;
      const p = pivotAt(x, y), now2 = lastZoomHit;
      /* ... and where a thing changes what it shows by distance (`aimHolds`: the pond draws its water see-through once you are close, so that what swims in it
         can be seen), the part first pointed at stays the aim while it is still drawn under the pointer: scrolling at the pond's water ends in water, not
         in the mud that shows through it. (A layered thing's Auto peel is different: there the descent ends in what the peel uncovers, as before.) */
      const stays = held && now2 && held.frame === now2.frame && held.frame.aimHolds && held.obj !== now2.obj && (held.obj.userData.shown || 0) > .05 && visibleChain(held.obj);
      if (held && (!now2 || stays)) { lastZoomHit = held; if (stays) held.held = true; }
      else {
        zoom.pivot = zoom.pivot || { p }; zoom.pivot.p.copy(p); if (!anchored.includes(zoom.pivot)) anchored.push(zoom.pivot);
        if (zoomLabel && zoomLabel.t > now - 50) { ztSet(zoomLabel.h, x, y); zoomLabel = null; }   // the pointer is on a name's text: that thing is the target
        else if (now2 && _pvHit) ztSet(ztUnder(_pvHit, x, y) || _pvHit, x, y);
      }
      zoom.pt = now; zoom.px = x; zoom.py = y; zoom.gen = viewGen;
    }
  }
  else if (lnDelta > 0) { zoom.pivot = null; anchored.length = 0; ztDrop('zoom out'); }
  zoom.pending += lnDelta;
}
let zoomLabel = null;   // {h, t}: a wheel turned over a name label's text (addLabelTo)
function applyZoom(dt) {
  if (Math.abs(zoom.pending) < 1e-5) { zoom.pending = 0; return; }
  const step = zoom.pending * (1 - Math.exp(-dt * 12));
  zoom.pending -= step;
  let lam = Math.exp(step);
  if (lam < 1) { const st = zoomStretch(cam.A); if (st) lam = Math.max(Math.pow(lam, st.boost), st.to * 1.02 / cam.D); }   // an empty stretch is crossed faster, and never overshot
  let nd = clamp(cam.D * lam, MIN_D, MAX_D);
  if (lam < 1) { const fl = zoomFloor(cam.A); if (fl && nd < fl) { nd = Math.max(nd, Math.min(cam.D, fl)); if (nd >= cam.D && typeof DESCENT !== 'undefined') DESCENT.floorSay(cam.A); } } // a floor, so the camera cannot sink into an empty region
  lam = nd / cam.D;
  mouse.dirty = true; // the view moves under a resting cursor: its tooltip and highlight must follow
  if (lam < 1 && zoom.pivot && ztg.f) { const tp = ztPivot(_ztP); if (tp) zoom.pivot.p.copy(tp); }   // the zoom's target: the pivot follows the thing (above)
  const A = cam.A, a = lam < 1 ? attLock(A) : null;   // the attractor this zoom is locked on, if the frame names any (below)
  if (a && zoom.pivot) zoom.pivot.p.copy(a);          // from here on the zoom is centred on it
  if (zoom.pivot && lam < 1) { // scale camera rig about the pivot: keeps the point under the cursor fixed
    const P = zoom.pivot.p;
    cam.T.sub(P).multiplyScalar(lam).add(P);
  }
  // some frames gently pull the zoom toward one key point (the park in its region, the middle of the park while it is still seen from high above, the Galactic Centre); attractMin: only above this distance
  if (lam < 1 && A.attract && cam.D < A.attractD && cam.D > (A.attractMin || 0) && cam.T.distanceTo(A.attract) < A.attractR) { cam.T.sub(A.attract).multiplyScalar(lam).add(A.attract); if (zoom.pivot) zoom.pivot.p.copy(A.attract); }
  if (a) cam.T.sub(a).multiplyScalar(zoom.pivot ? lam : lam * lam).add(a);   // and the target closes on it as the square of the zoom
  /* A frame that is ground (a map tile, a landscape: `landOn`, the ground at y = 0) is never left hanging in the air: with no surface under the pointer (the
     pointer on the sky, or on the haze at the globe's edge when the tile was entered) the target sinks to the ground in step with the zoom, so the descent ends
     on the ground below the place pointed at and not at a point of air that then opens as soil or sea water. */
  if (lam < 1 && A.landOn && !zoomAim() && cam.T.y > 0) { cam.T.y *= lam; if (zoom.pivot) zoom.pivot.p.y *= lam; }
  cam.D = nd;
}
/* EMPTY STRETCHES. Between a scene and the much smaller one below it (grains of soil and the crystal they are made of, a cell and the water in it, a galaxy
   and its gas) there is nothing new to draw: the picture stays as it is while the scale runs on, for thousands or billions of times. A visitor turning the
   wheel through that must not think the app has hung. zoomStretch says when the camera is in such a stretch: the next level is waiting under the target
   (a child made by trySpawn, entered when the view is down to its size, `r1`) and is still more than four times smaller than the view; or the frame says
   where its own picture runs out of detail (`fineD`, metres) and the next level has not been asked for yet (spawnDOf). While it lasts
   - the zoom runs faster, by up to four times for the longest stretches (on top of the wheel's own speed-up while you keep scrolling), easing back on arrival (boost), and never past the entry;
   - the scale line says what is happening (`#capG`, written by updateCaption in js/engine_ui.js): "Zooming 1,000 times further in to reach Alpha quartz".
   A double click still jumps there in one move. Nothing here is per frame type; a frame only has to give `fineD` (and `fineNext`, a few words for what
   comes next) when its picture ends well above the distance at which it hands over. */
const _zs = { to: 0, ratio: 1, boost: 1, f: null, name: '' };
function zoomStretch(A) {
  let to = 0, f = null, name = '';
  const lim = cam.D / A.unit * 3, ho = lastZoomHit && lastZoomHit.frame === A ? lastZoomHit.obj : null;
  for (let i = 0; i < A.children.length; i++) { const c = A.children[i]; if (c.dynamic && !c.entered && c.r1 !== Infinity && (c.pos.distanceTo(cam.T) < lim || (!c.pinned && !c.built && c._for !== undefined && c._for === ho))) { to = c.r1; f = c; break; } }
  if (!f && A.fineD && cam.D < A.fineD) { to = spawnDOf(A) || 0; name = A.fineNext || ''; }
  if (!(to > 0) || cam.D < to * 4) return null;
  _zs.to = to; _zs.ratio = cam.D / to; _zs.boost = Math.min(1 + Math.log(_zs.ratio / 4) / 3, 4); _zs.f = f; _zs.name = name; return _zs;
}
/* A frame's floor (`floorD`, metres) is where its own picture ends: the camera cannot sink below it by scrolling. It holds only where nothing lies below:
   a child frame waiting under the target (spawned by the frame itself or from the materials table, js/descent.js) lifts it, so the zoom runs on into that
   frame. Where the table says that nothing true can be shown (`stop`), the place where that was said becomes a floor too, also in a frame that has none. */
function zoomFloor(A) {
  let f = A.floorD || 0; const st = A._dzStop;
  if (st) { if (cam.D > st.D * 4 || st.p.distanceTo(cam.T) > st.D / A.unit * 2) A._dzStop = null; else f = Math.max(f, st.D * .6); }
  if (!f) return 0;
  const lim = cam.D / A.unit * 3, ho = lastZoomHit && lastZoomHit.frame === A ? lastZoomHit.obj : null;   // the same test as trySpawn's: a child waiting near the target, or one made for the thing the pointer is still on
  for (let i = 0; i < A.children.length; i++) { const c = A.children[i]; if (c.dynamic && !c.entered && (c.pos.distanceTo(cam.T) < lim || (!c.pinned && !c.built && c._for !== undefined && c._for === ho))) return 0; }
  return f;
}
/* ---- attractors: a descent ends ON something ----
   A frame may name the points a zoom can end on: the nucleus of an atom, the nucleons of a nucleus, the atoms of a molecule or crystal,
   the molecules of a gas, the nuclei of a plasma, the valence quarks of a proton.
     F.att = { D,                    metres: the convergence starts once the camera is nearer than this (the view is then small enough that only one of them can be meant)
               find(P, hint) -> id,  the attractor nearest the point P (frame coordinates), or the one the pointer is on (hint = lastZoomHit in this frame, or null); -1 for none
               pos(id, out) -> out,  where it is now (frame coordinates); a falsy value when the id is no longer valid
               tol }                 optional, frame units: while the zoom is locked on an attractor, a child frame further than this from it is not entered (a fixed
                                     child that happens to sit on a neighbouring atom must not capture a zoom that is closing on this one)
   Below D the zoom locks on to the attractor nearest the pointer's pivot. From then on the camera is scaled about that point instead of about the pivot, and the
   target closes on it as the square of the zoom, so the target is drawn onto it smoothly: nothing jumps, only the point the zoom is centred on changes. The lock
   holds while the pointer rests and the camera stays in the frame; moving the pointer chooses again. Spawn functions ask attId(F) for the attractor the zoom is
   locked on, so the frame that opens is the one the zoom converged on. Nothing is allocated here, and find() runs once per lock, not per frame. */
const att = { f: null, id: -1, p: new V3(), px: 0, py: 0 };
function attId(F) { return att.f === F ? att.id : -1; }
function attLock(A) {
  const a = A.att;
  if (!a || cam.D >= a.D) { att.f = null; att.id = -1; return null; }
  if (att.f !== A || att.id < 0 || Math.abs(zoom.px - att.px) > 8 || Math.abs(zoom.py - att.py) > 8) {
    att.f = A; att.px = zoom.px; att.py = zoom.py;
    att.id = a.find(zoom.pivot ? zoom.pivot.p : cam.T, lastZoomHit && lastZoomHit.frame === A ? lastZoomHit : null);
  }
  if (att.id < 0 || !a.pos(att.id, att.p)) { att.f = null; att.id = -1; return null; }
  return att.p;
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
/* Set the view direction (in the anchor frame's coordinates) and re-level the up vector in the same call, as the engine would only do over several frames:
   a script that looks somewhere sees the finished view at once. */
function setCamDir(d, upHint) {
  cam.dir.copy(d).normalize(); const u = upHint || cam.A.up;
  if (u) { const want = u.clone().sub(cam.dir.clone().multiplyScalar(u.dot(cam.dir))); if (want.length() > .15) { cam.up.copy(want.normalize()); return; } }
  orthoUp();
}
function orthoUp() { cam.dir.normalize(); cam.up.sub(cam.dir.clone().multiplyScalar(cam.up.dot(cam.dir))).normalize(); }
// fly to a point in a frame, ending at distance Dgoal (meters). Zooms out, travels, zooms in as needed.
/* dir (optional): the direction to look from on arrival, from the target to the camera, in the frame's coordinates (a ruler stop that must show a plane from
   above: the planets' orbits were seen edge-on, as crossing lines, when the camera happened to arrive in their plane). The view turns as it flies. */
function flyTo(frame, pointLocal, Dgoal, then, dir) {
  if (typeof navFlyHook === 'function') navFlyHook(); // remember where we were, for Back
  zoom.pending = 0; zoom.pivot = null; anchored.length = 0; camHold = null; ztDrop('flight');
  chainOf(frame).reverse().forEach(f => { f.ensure(); if (f.place) f.place(); }); // the whole path must exist and be in position
  fly = { frame, p: pointLocal.clone(), Dg: Dgoal, then, t: 0, dir: dir ? dir.clone().normalize() : null };
  camHold = frame; // a flight lands in the frame it names, not in a child that happens to sit under the landing point; scrolling in again lifts this
}
/* A frame that is one-sided ground (the skin patch, a landscape or map tile) has `faceUp`: a flight must not end with the camera under it, looking up at its back
   (a dark picture): if the camera is under the surface, lift it to look down on it from the side it came from. */
const _fsV = new V3(), _fsU = new V3();
function faceSurface(f) {
  if (!f || !f.faceUp || !f.up) return;
  _fsV.copy(cam.dir); convertD(_fsV, cam.A, f); const k = _fsV.dot(f.up); if (k > .12) return;   // cam.dir points from the target to the camera: above the surface when it points the way `up` does
  _fsV.addScaledVector(f.up, -k); if (_fsV.lengthSq() < 1e-6) _fsV.set(f.up.y > .9 ? 1 : 0, 0, f.up.y > .9 ? 0 : 1);
  _fsV.normalize().multiplyScalar(.89).addScaledVector(f.up, .45); convertD(_fsV, f, cam.A);
  setCamDir(_fsV);
}
/* A frame that is ground seen from one side (the park: `up` with a `maxPolar` limit that keeps orbiting above the lawn) must not be entered from below either.
   A teleport keeps the view direction's numbers from the frame it left, which in the park's coordinates can point up from under the lawn: the lawn and the
   pond are drawn one-sided, so the park then shows no ground and everything floats. Mirror such a view to the same angle from above. */
function keepAbove(f) {
  if (!f || !f.up || f.maxPolar === undefined || f.faceUp) return;
  _fsV.copy(cam.dir); convertD(_fsV, cam.A, f); const k = _fsV.dot(f.up), lim = Math.cos(f.maxPolar);
  if (k >= lim) return;
  _fsV.addScaledVector(f.up, Math.max(-2 * k, lim - k + .02)); convertD(_fsV, f, cam.A); _fsU.copy(f.up); convertD(_fsU, f, cam.A);
  setCamDir(_fsV, _fsU);
}
function safeThen(t) { if (t) try { t(); } catch (e) { console.error('flight callback failed', e); } } // a throwing callback must not abort the frame
function stepFly(dt) {
  const F = fly; F.t += dt;
  const g = F.p.clone(); convertP(g, F.frame, cam.A);
  const distM = g.distanceTo(cam.T) * cam.A.unit;
  const wantD = Math.max(F.Dg, distM * (distM > cam.D * .6 ? 2.2 : 3)); // never zoom in faster than the target is being centred
  const lnD = Math.log(cam.D), lnW = Math.log(wantD);
  /* How fast a flight zooms: a short hop at up to about three powers of ten a second; a long one faster, so that no trip spends much more than two and a half
     seconds zooming (quarks to the cosmic web is 44 powers of ten), up to about eight powers of ten a second. It settles in under a second. */
  if (!F.rate) F.rate = clamp(Math.abs(Math.log(Math.max(F.Dg, 1e-30)) - lnD) / 2.5, 7.5, 18);
  let dl = (lnW - lnD) * (1 - Math.exp(-dt * 4)); dl = clamp(dl, -dt * F.rate, dt * F.rate);
  cam.D = Math.exp(lnD + dl);
  if (distM > cam.D * .6) { const stepM = Math.min(distM, cam.D * dt * Math.max(2.6, F.rate * .5)); cam.T.add(g.sub(cam.T).multiplyScalar(stepM / distM)); } // the slide keeps pace with the zoom, or it would be what limits a flight inward
  else cam.T.lerp(g, 1 - Math.exp(-dt * Math.max(6, F.rate * 1.25))); // centring keeps ahead of the zoom, which may never outrun it (wantD above)
  let turned = true;
  if (F.dir) {   // turn toward the asked direction, with the frame's own up (its y) kept up; the turn keeps pace with the flight
    const kt = 1 - Math.exp(-dt * Math.max(2.4, F.rate * .5));
    _fsV.copy(F.dir); convertD(_fsV, F.frame, cam.A); turned = cam.dir.dot(_fsV) > .9995;
    if (!turned) { cam.dir.lerp(_fsV, kt).normalize(); _fsU.set(0, 1, 0); convertD(_fsU, F.frame, cam.A); _fsU.addScaledVector(cam.dir, -_fsU.dot(cam.dir)); if (_fsU.lengthSq() > .02) cam.up.lerp(_fsU.normalize(), kt).normalize(); }
  }
  if (turned && distM < cam.D * .02 && Math.abs(lnW - Math.log(cam.D)) < .03) { const t = F.then; fly = null; faceSurface(F.frame); keepAbove(cam.A); safeThen(t); }
  if (fly === F && F.t > 60) { const t = F.then, d = F.dir; jumpTo(F.frame, F.p, F.Dg); if (d) setCamDir(convertD(d.clone(), F.frame, cam.A), convertD(new V3(0, 1, 0), F.frame, cam.A)); safeThen(t); } // never strand a tour: finish the trip
}
// pointer handlers
const pointers = new Map(); let dragMoved = false, downPos = null, pinchD = 0;
const mouse = { x: 0, y: 0, has: false, dirty: false, touch: false, t: 0, tipX: 0, tipY: 0 }; // dirty: the hover must be worked out again; t: when the pointer last moved
/* Wheel zoom. One notch (deltaY 100) changes the view by about a third, fine enough to place a view exactly. A scroll that keeps going in one direction speeds up,
   to about two and a half times that within a few notches (a trackpad swipe ramps the same way over about a second), so crossing many powers of ten takes a few
   swipes, not hundreds of notches; a pause of a fifth of a second, or a change of direction, drops back to the fine step. Shift still multiplies by four. */
const WHEEL_K = .003, WHEEL_BOOST_MAX = 2.5; let whT = 0, whSign = 0, whBoost = 1;
canvas.addEventListener('wheel', e => {
  e.preventDefault(); let d = e.deltaY; if (e.deltaMode === 1) d *= 16; d = clamp(d, -240, 240);
  const now = performance.now(), sg = Math.sign(d);
  whBoost = sg && sg === whSign && now - whT < 200 ? Math.min(WHEEL_BOOST_MAX, whBoost + Math.abs(d) * .004) : 1; whT = now; whSign = sg;
  zoomBy(d * WHEEL_K * whBoost * (e.shiftKey ? 4 : 1), e.clientX, e.clientY);
}, { passive: false });
/* A wheel turned over a scene's own controls (the atom's options box, a layer toolbar, the zoom buttons, the field-of-view line) zooms the scene. These boxes
   sit over the picture, and one could come to lie under a resting pointer as a new scene arrived: the zoom then stopped dead, with nothing said (inside an
   atom the options box appeared under the pointer). The wheel scrolls only what is there to be read and scrolled: the panel, the ruler, the lists. */
const WHEEL_OWN = '#panel, #panelTab, #ruler, #library, #help, #topright, #tracks, #lab, #vizModal, .pop, #labels';
function wheelScrolls(t) {
  for (let e = t; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
    if (e.matches(WHEEL_OWN)) return true;
    if (e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) return true;
  }
  return false;
}
addEventListener('wheel', e => {
  const t = e.target; if (t === canvas || !(t instanceof Element) || wheelScrolls(t)) return;
  e.preventDefault(); e.stopPropagation();
  canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, bubbles: true, cancelable: true }));
}, { passive: false, capture: true });
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
  if (pointers.size === 1) { if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) dragMoved = true; if (dragMoved) { orbit(dx, dy); fly = null; cancelTour(); ztDrop('drag'); } }
  else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinchD > 0 && d > 0) zoomBy(Math.log(pinchD / d), (a.x + b.x) / 2, (a.y + b.y) / 2); pinchD = d; }
  lastInput = performance.now();
});
function endPointer(e, click) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (click && pointers.size === 0 && !dragMoved) onClick(e.clientX, e.clientY, e.pointerType === 'touch', e.timeStamp);
  if (pointers.size < 2) pinchD = 0;
}
canvas.addEventListener('pointerup', e => endPointer(e, true));
canvas.addEventListener('pointercancel', e => endPointer(e, false));
canvas.addEventListener('pointerleave', () => { mouse.has = false; setHover(null); tipEl.classList.remove('show'); });
canvas.addEventListener('dblclick', e => e.preventDefault()); // a double click is recognised in onClick (two clicks close together, mouse or touch); the browser's own event is not used
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => addEventListener(t, () => { lastInput = performance.now(); }, { capture: true, passive: true })); // any input, anywhere on the page, ends the resting frame rate at once
let holdZoom = 0, holdT = 0;
function bindHold(el, dir) {
  const start = e => { e.preventDefault(); holdZoom = dir; }, stop = () => { holdZoom = 0; };
  el.addEventListener('pointerdown', start); el.addEventListener('pointerup', stop); el.addEventListener('pointerleave', stop); el.addEventListener('pointercancel', stop);
}
addEventListener('keydown', e => {
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === '+' || k === '=') zoomBy(-.5, W / 2, H / 2);
  else if (k === '-' || k === '_') zoomBy(.5);
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
const _pkStack = new Int32Array(512), _pkCand = [], PK_INST_HITS = 4, _pkIM = new THREE.Matrix4(), _pkRay2 = new THREE.Ray();
/* An instanced crowd is tested nearest instance first, and the test stops once four hits that are not cut away have been found and
   no remaining instance can be nearer than the last of them. A ray along a dog's back crosses the bounding spheres of hundreds of
   hairs; every pick rule in the app needs only the nearest hit of a part that is showing and not clipped (thChooseHit, the core
   sample), so the hundreds behind it are not worth an exact test each. Hits removed by the material's clipping planes do not count
   toward the four, so in a cut-open view the first hit that survives the cut is still found. */
THREE.InstancedMesh.prototype.raycast = function (rc, out) {
  const n = this.count; if (!n || this.material === undefined) return;
  if (n < 16 || !this.geometry.attributes.position) return _pkInstRay.call(this, rc, out);
  const A = pkInstAccel(this), S = A.S;
  _pkInv.copy(this.matrixWorld).invert(); _pkRay.copy(rc.ray).applyMatrix4(_pkInv);
  if (!_pkRay.intersectsBox(A.box)) return;
  const ox = _pkRay.origin.x, oy = _pkRay.origin.y, oz = _pkRay.origin.z, dx = _pkRay.direction.x, dy = _pkRay.direction.y, dz = _pkRay.direction.z;
  _pkMesh.geometry = this.geometry; _pkMesh.material = this.material;
  const C = _pkCand; C.length = 0; // candidates: [instance, where the ray enters its sphere (along the ray, in the mesh's own space)]
  const sph = i => { const k = i * 4, vx = S[k] - ox, vy = S[k + 1] - oy, vz = S[k + 2] - oz, t = vx * dx + vy * dy + vz * dz, r = S[k + 3], d2 = vx * vx + vy * vy + vz * vz - (t > 0 ? t * t : 0); if (d2 <= r * r) C.push(i, t - r); };
  if (!A.nb) { // no tree (few instances, moving instances, or not built yet): every sphere is tested, which is still far cheaper than every instance's triangles
    if (!A.tree && !this._pkQ) { this._pkQ = true; this._pkPri = 0; PK.queue.push(this); PK.sorted = false; }
    for (let i = 0; i < n; i++) sph(i);
  } else {
    const nb = A.nb, nl = A.nl, ids = A.ids, ix = 1 / dx, iy = 1 / dy, iz = 1 / dz; let sp = 0; _pkStack[sp++] = 0;
    while (sp) {
      const nd = _pkStack[--sp], b = nd * 6;
      let t0 = (nb[b] - ox) * ix, t1 = (nb[b + 3] - ox) * ix, lo = Math.min(t0, t1), hi = Math.max(t0, t1);
      t0 = (nb[b + 1] - oy) * iy; t1 = (nb[b + 4] - oy) * iy; lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
      t0 = (nb[b + 2] - oz) * iz; t1 = (nb[b + 5] - oz) * iz; lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
      if (hi < 0 || lo > hi) continue;
      const a = nl[nd * 2], c = nl[nd * 2 + 1];
      if (a < 0) { for (let j = -a - 1, e = j + c; j < e; j++) { const i = ids[j]; if (i < n) sph(i); } }
      else if (sp < 510) { _pkStack[sp++] = a; _pkStack[sp++] = c; }
    }
  }
  const m = C.length >> 1; if (!m) return;
  if (m <= PK_INST_HITS * 2) { for (let k = 0; k < m; k++) pkInstHit(this, C[k * 2], rc, out); return; }
  // many candidates: nearest first
  const ord = new Array(m); for (let k = 0; k < m; k++) ord[k] = k; ord.sort((p, q) => C[p * 2 + 1] - C[q * 2 + 1]);
  const planes = this.material.clippingPlanes, g = this.geometry; if (g.boundingBox === null) g.computeBoundingBox(); const gbox = g.boundingBox; let good = 0, far = -Infinity;
  for (let k = 0; k < m; k++) {
    const i = C[ord[k] * 2], te = C[ord[k] * 2 + 1];
    if (good >= PK_INST_HITS) { // can this instance still hold a nearer hit than the ones found? (its sphere's entry point, measured in the world)
      _pkV.copy(_pkRay.direction).multiplyScalar(Math.max(te, 0)).add(_pkRay.origin).applyMatrix4(this.matrixWorld);
      if (_pkV.distanceTo(rc.ray.origin) > far) break;
    }
    // most candidates are near misses (a thin card inside a fat sphere): the ray against the instance's own bounding box first, which costs a fifth of the exact test
    this.getMatrixAt(i, _pkLM); _pkIM.copy(_pkLM).invert(); _pkRay2.copy(_pkRay).applyMatrix4(_pkIM);
    if (!_pkRay2.intersectsBox(gbox)) continue;
    const h0 = out.length; pkInstHit(this, i, rc, out);
    for (let j = h0; j < out.length; j++) {
      const h = out[j]; let cut = false; if (planes) for (let q = 0; q < planes.length; q++) if (planes[q].distanceToPoint(h.point) < 0) { cut = true; break; }
      if (!cut) { good++; if (h.distance > far) far = h.distance; }
    }
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
    if (!o || o.userData.noPick) continue;   // noPick: a thing has made it see-through (the ground over the pond's water and the oak's roots)
    if (forZoom && o.userData.noZoom && hits.length > 1) continue;
    cands.push({ frame: f, obj: o, hit: h, pri: o.userData.priority ?? 1 });
  }
  let fb = null;
  if (f.chooseHit) fb = f.chooseHit(cands, forZoom); // a frame may apply its own rule (the body: nearest part you can actually see)
  else { let bp = -Infinity; for (const c of cands) if (c.pri > bp) { fb = c; bp = c.pri; } }
  /* a hit on what a cut-open view has cut away is no hit: nothing is drawn there (the dog's "Inside the eye" cuts the near eyeball away whole, and the
     frame's own rule, finding nothing left on the ray, fell back to it; clicks and the reframing of the cut view then went to an eyeball nobody could see) */
  if (fb && f.coreClip && f.coreClip(fb.hit.point)) fb = null;
  if (fb) fb.meters = fb.hit.distance * f.unit;
  return fb;
}
/* A FAIR PICK. What the visitor sees under the pointer is what a click selects, the hover names and a zoom goes to. Two things made that untrue for the
   small and thin things of the park, and both are settled here with a few extra rays that are cast only where they can matter:
   1. A hairline in front of something large. A buttercup stem half a pixel wide stood in front of the dog and took the click meant for the dog. When the
      nearest hit belongs to one co-rendered thing and another thing lies behind it on the same ray, the nearest one must really be under the pointer: eight
      rays on a circle of PICK_THIN_PX round the pointer are cast at it alone, and if no more than three touch it (a line gives two, a speck none) the thing
      behind wins. Asked only when the triangle that was hit is itself under a pixel and a half wide, so a solid thing is never doubted.
   2. A near miss. A click one pixel beside a mushroom's stalk, or on a gap of sky between two boughs, found only the lawn or the sky. When the ray's answer is
      nothing, the backdrop or the ground (priority 0 or less), rings of PICK_NEAR_PX round the pointer are tried against the co-rendered things whose bound
      the ray passes: the first ring that touches one decides, and of its hits the one nearest the eye, provided it is in front of the ground that was hit.
   The cost: nothing where no thing is near the ray; otherwise six to twelve rays against one or two frames' own trees. best.ndc is the ray that hit. */
const PICK_NEAR_PX = [5, 10], PICK_NEAR_N = 6, PICK_THIN_PX = 3, PICK_THIN_TRI = 1.5;
const _pkA = new V3(), _pkB3 = new V3(), _pkC = new V3(), _pkNear = [], _pkGroup = [];
function pickWeak(c) { return !c || (c.obj.userData.priority ?? 1) <= 0 || isBackdrop(c); }
/* the on-screen width, in pixels, of the triangle a ray hit (its shortest height): Infinity for a hit that is no triangle */
function pickTriPx(c) {
  const h = c.hit, o = h.object, g = o.geometry, fc = h.face, p = g && g.attributes && g.attributes.position; if (!fc || !p || fc.a === undefined) return Infinity;
  _pkA.fromBufferAttribute(p, fc.a); _pkB3.fromBufferAttribute(p, fc.b); _pkC.fromBufferAttribute(p, fc.c);
  if (o.isInstancedMesh && h.instanceId !== undefined) { o.getMatrixAt(h.instanceId, _pkLM); _pkA.applyMatrix4(_pkLM); _pkB3.applyMatrix4(_pkLM); _pkC.applyMatrix4(_pkLM); }
  _pkA.applyMatrix4(o.matrixWorld); _pkB3.applyMatrix4(o.matrixWorld); _pkC.applyMatrix4(o.matrixWorld);
  const ab = _pkA.distanceTo(_pkB3), bc = _pkB3.distanceTo(_pkC), ca = _pkC.distanceTo(_pkA), long = Math.max(ab, bc, ca); if (!(long > 0)) return 0;
  const area2 = _pkB3.sub(_pkA).cross(_pkC.sub(_pkA)).length();
  return area2 / long / Math.max(h.distance, 1e-30) * PX_PER_RAD();
}
/* is the thing that was hit only a hairline or a speck under the pointer? (rule 1) */
function pickThin(c, x, y, forZoom) {
  if (pickTriPx(c) >= PICK_THIN_TRI) return false;
  let n = 0; const f = c.frame, x0 = ndc.x, y0 = ndc.y;
  for (let i = 0; i < 8 && n < 4; i++) { const a = i * Math.PI / 4; ndc.set((x + Math.cos(a) * PICK_THIN_PX) / W * 2 - 1, -((y + Math.sin(a) * PICK_THIN_PX) / H) * 2 + 1); const k = pickFrame(f, forZoom); if (k && !pickWeak(k)) n++; }
  ndc.set(x0, y0); return n < 4;
}
/* the near miss (rule 2): the co-rendered things near the ray, ring by ring */
function pickNear(x, y, forZoom, weak) {
  const C = _pkNear; C.length = 0;
  for (let i = 0; i < drawn.length; i++) {
    const f = drawn[i]; if (!f.coRender || f.alpha < .5 || f._culled || !f.pickables || !f.cam || !f.C) continue;
    const B = f._pkB; if (!B || !B.ok || B.n !== f.pickables.length) continue;
    raycaster.setFromCamera(ndc, f.cam); _pkSph.center.copy(B.c).sub(f.C); const d = _pkSph.center.length();
    _pkSph.radius = B.r * 1.1 + PICK_NEAR_PX[PICK_NEAR_PX.length - 1] * d / PX_PER_RAD();
    if (raycaster.ray.intersectsSphere(_pkSph)) C.push(f);
  }
  if (!C.length) return null;
  const x0 = ndc.x, y0 = ndc.y, lim = weak ? weak.meters : Infinity; let best = null;
  for (let r = 0; r < PICK_NEAR_PX.length && !best; r++) {
    for (let i = 0; i < PICK_NEAR_N; i++) {
      const a = (i + r * .5) * TAU / PICK_NEAR_N, nx = (x + Math.cos(a) * PICK_NEAR_PX[r]) / W * 2 - 1, ny = -((y + Math.sin(a) * PICK_NEAR_PX[r]) / H) * 2 + 1;
      for (let k = 0; k < C.length; k++) { ndc.set(nx, ny); const c = pickFrame(C[k], forZoom); if (c && !pickWeak(c) && c.meters < lim && (!best || c.meters < best.meters)) { best = c; best.ndc = new THREE.Vector2(nx, ny); } }
    }
  }
  ndc.set(x0, y0); return best;
}
function pickAt(x, y, forZoom) {
  const t0 = performance.now();
  ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1);
  let best = null;
  // Walk inward to outward. Frames that share a depth buffer (a parent and its co-rendered children) form one group and
  // the nearest surface in the group wins; otherwise the innermost frame with a hit wins, since it is drawn on top.
  for (let i = drawn.length - 1; i >= 0 && !best;) {
    let j = i; while (j > 0 && drawn[j]._share) j--;
    const G = _pkGroup; G.length = 0;
    for (let k = j; k <= i; k++) {
      const c = pickFrame(drawn[k], forZoom); if (!c) continue;
      G.push(c); if (!best || c.meters < best.meters) best = c;
    }
    // a hairline of one thing in front of another thing: the one behind, unless the pointer is really on the hairline
    if (best && G.length > 1 && best.frame.coRender && !pickWeak(best)) {
      let behind = null; for (const c of G) if (c !== best && !pickWeak(c) && (!behind || c.meters < behind.meters)) behind = c;
      if (behind && pickThin(best, x, y, forZoom)) best = behind;
    }
    i = j - 1;
  }
  if (pickWeak(best)) { const n = pickNear(x, y, forZoom, best); if (n) best = n; }
  if (best) {
    const f = best.frame; if (!best.ndc) best.ndc = ndc.clone();
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
function setHighlight(obj, on) { // returns how many materials took the glow
  if (!obj) return 0; let n = 0;
  obj.traverse(o => { const m = o.material; if (!o.isMesh || !m || !m.emissive || m.userData.noHL) return; n++; if (m.userData.baseEm === undefined) m.userData.baseEm = m.emissive.getHex(); if (on) m.emissive.setHex(m.userData.baseEm).add(_hc); else m.emissive.setHex(m.userData.baseEm); });
  return n;
}
function setHover(o) { if (o === hovered) return; setHighlight(hovered, false); hovered = o; setHighlight(hovered, true); if (typeof selHit !== 'undefined' && selHit && selHit.obj !== o) setHighlight(selHit.obj, true); canvas.style.cursor = o ? 'pointer' : 'grab'; } // the selected thing keeps its glow when the pointer leaves it
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
/* ================= CLICK AND DOUBLE-CLICK =================
   One click (or tap) on a thing selects it: it is highlighted and its card is drawn at once, and the camera flies to frame it once the
   double-click window (DBL_MS) has passed, so a single click answers at once and a double click never starts two flights. A second click
   inside the window, near the first, is a double click: it looks inside the thing (lookInside); so is a slower one, up to DBL_LATE_MS,
   when it lands on the same thing. A click on nothing, or on the sky (isBackdrop: the park's sky dome, the
   microwave background, which the hover does not name either), deselects and does not move the camera; a double click there does nothing. A drag is not a
   click (the 6 px threshold in the pointer handlers). The panel's "Look inside" button calls lookInside with the same hit.
   While the panel is minimised a single click opens it (after the window, so a double click does not); nothing else here does. */
const DBL_MS = 300, DBL_LATE_MS = 480, DBL_PX = 22, DBL_PX_TOUCH = 40;
/* a finger is slower than a mouse button: two taps 330 ms apart (as a phone delivers them when it is busy) were two single taps, the second a framing of what the
   first had framed, and the double tap on the person did nothing. On touch the window is longer, and so the framing waits a little longer. */
const DBL_MS_TOUCH = 450, DBL_LATE_MS_TOUCH = 650;   // the flight waits DBL_MS; a slower second click (up to DBL_LATE_MS) on the same thing still counts as a double click
let lastPick = null, clickPend = null, selHit = null, lastClick = null;
const SKY_IDS = new Set(['air', 'cmb']);   // the park's sky dome and the microwave background: where you click when you click on nothing
const isBackdrop = h => !!h.obj.userData.backdrop || ((h.obj.userData.priority ?? 1) < 0 && SKY_IDS.has(h.id));
/* ts: when the click happened (the event's own time stamp), so that two clicks 200 ms apart are a double click even when a slow frame delivers the second one late */
function onClick(x, y, touch, ts) {
  const now = ts || performance.now(), lc = lastClick; _fsTok++; _fsPend = false;
  const near = lc && Math.hypot(x - lc.x, y - lc.y) < (touch ? DBL_PX_TOUCH : DBL_PX), dms = touch ? DBL_MS_TOUCH : DBL_MS, lms = touch ? DBL_LATE_MS_TOUCH : DBL_LATE_MS;
  /* measured from when the app had finished answering the first click (lc.done): on a busy phone the card of the first tap took 700 ms to draw, and the second
     tap, made as soon as the screen answered, came 850 ms after the first and was taken for a single tap */
  const since = lc ? now - Math.max(lc.t, lc.done || 0) : Infinity;
  if (near && since < dms) { // the second click of a double click: the thing the first click found
    if (clickPend) { clearTimeout(clickPend.timer); clickPend = null; } lastClick = null;
    if (lc.h) lookInside(lc.h); else lookInsideNear(lc.x, lc.y); return;
  }
  const h0 = pickPast(pickAt(x, y), x, y), h = h0 && !isBackdrop(h0) ? h0 : null;
  if (near && lc.h && h && h.obj === lc.h.obj && since < lms) { // a slow double click: the framing flight has only just begun, and the same thing is still under the pointer
    if (clickPend) { clearTimeout(clickPend.timer); clickPend = null; } lastClick = null; lookInside(selHit && selHit.obj === h.obj ? selHit : lc.h); return;
  }
  flushClick();
  const lcN = lastClick = { h, x, y, t: now, touch };
  if (!h) { deselect(); lcN.done = performance.now(); return; }
  clickThing(h, dms); lcN.done = performance.now();
}
/* One of a crowd of tiny things (a tuft of the dog's fur, a few pixels or less on the screen) is not what a click on the dog from across the lawn is about: the
   click goes to what that crowd lies on (the dog's coat), and frames that. Close enough to see the tufts, they are clicked as themselves. */
function pickPast(h, x, y) {
  if (!h || !(h.obj.isInstancedMesh || h.obj.isPoints || (h.hit && h.hit.object && h.hit.object.isInstancedMesh)) || !h.frame.cam || h.obj.userData.noPick) return h;
  const e = hitExtent(h); if (!e || !e.r) return h;
  const d = e.p.clone().sub(h.frame.C).distanceTo(h.frame.cam.position); if (!(d > 0) || e.r / d * PX_PER_RAD() >= 4) return h;
  h.obj.userData.noPick = true; let h2 = null; try { h2 = pickAt(x, y); } finally { delete h.obj.userData.noPick; }
  return h2 && h2.frame === h.frame && !isBackdrop(h2) ? h2 : h;
}
function flushClick() { const cp = clickPend; if (!cp) return; clearTimeout(cp.timer); clickPend = null; if (selHit === cp.h) frameSelected(cp.h); }
function onLabelClick(h, x, y, ts) {
  const now = ts || performance.now(), lc = lastClick;
  if (lc && lc.h && lc.h.obj === h.obj && now - lc.t < DBL_MS) { if (clickPend) { clearTimeout(clickPend.timer); clickPend = null; } lastClick = null; lookInside(lc.h); return; }
  flushClick(); lastClick = { h, x, y, t: now }; clickThing(h);
}
function clickThing(h, dms) {
  cancelTour(); lastPick = h;
  selectHit(h);
  clickPend = { h, timer: setTimeout(() => { const p = clickPend; clickPend = null; if (p && selHit === p.h) { frameSelected(p.h); if (typeof panelShow === 'function') panelShow('click'); } }, dms || DBL_MS) };
}
/* select: highlight, card. The card is the thing's own (showInfoFor); the highlight is the frame's own where it has one (the body and things outline
   the selected part), a soft glow on the object's materials where they can glow, and otherwise a ring drawn round the point (#selMark). */
function selectHit(h) {
  if (h.obj.userData.onPick) h.obj.userData.onPick(h);
  if (typeof PANEL !== 'undefined') PANEL.userSel = true;   // asked for by a click: while a trail plays, the card is scrolled into view (openPanel)
  showInfoFor(h);
  setSelected(h);
  if (typeof panelHintDone === 'function') panelHintDone();
}
function setSelected(h) {
  if (selHit && selHit.obj !== (h && h.obj)) setHighlight(selHit.obj, false);
  selHit = h || null;
  if (h) { h.glow = setHighlight(h.obj, true) > 0 || !!(h.frame && h.frame.layered); const e = hitExtent(h); h.selP = e.p; }
  if (hovered && (!h || hovered !== h.obj)) setHighlight(hovered, true);
}
function deselect() { if (typeof closeInfo === 'function') closeInfo(); }
/* The thing's own centre and radius (in its frame's units). r is null for something with no size of its own on screen: a point, a marker
   that stands for a far smaller thing, one of a crowd of instances. An object may give its own (userData.extent). */
const _exB = new THREE.Box3(), _exS = new V3();
function hitExtent(h) {
  const ud = h.obj.userData, f = h.frame, o = h.obj;
  if (ud.extent) { const e = ud.extent(h); if (e) return e; }
  const crowd = o.isPoints || o.isInstancedMesh;
  if (ud.center && !crowd) { const r = typeof ud.radius === 'function' ? ud.radius(h) : ud.radius; return { p: ud.center(h), r: ud.zoomTo || !r ? null : r }; } // with zoomTo the radius is that of a destination elsewhere
  if (crowd || !h.hit) return { p: h.pointLocal.clone(), r: null };
  if (o.isSprite || (o.isMesh && o.material && o.material.visible === false)) return { p: o.getWorldPosition(new V3()).add(f.C), r: null }; // a marker, or an unseen pick target round something too small to hit
  _exB.setFromObject(o); if (_exB.isEmpty()) return { p: h.pointLocal.clone(), r: null };
  _exB.getSize(_exS); const r = Math.max(_exS.x, _exS.y, _exS.z) / 2;
  return isFinite(r) && r > 0 ? { p: _exB.getCenter(new V3()).add(f.C), r } : { p: h.pointLocal.clone(), r: null };
}
/* The viewing distance (metres) at which a ball of radius r (frame units) fills about four fifths of the free area. */
function fitD(f, r) { const A = freeArea(); return r * f.unit / (Math.tan(25 * Math.PI / 180) * Math.max(.2, Math.min(A.w, A.h) / H) * .8); }
/* Fly to frame the selected thing: its whole extent in the free area. Already framed (its centre near the middle of the free area and its size
   comfortable): no move. Far larger than the view (the skin, the ground, a wall you are close to): no move either, a click never throws you
   far back. A thing with no size of its own is brought to the middle at the distance you are at. */
function frameSelected(h) {
  const f = h.frame; if (!f || !f.built || !chainOf(cam.A).concat(drawn).includes(f)) return;
  const e = hitExtent(h), A = freeArea(), c = viewCentre();
  const v = e.p.clone().sub(f.C).project(f.cam), sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H;
  const off = Math.hypot(sx - c.x, sy - c.y), tol = Math.min(A.w, A.h) * .2;
  let D = cam.D;
  if (e.r) {
    const dive = f.spawn ? (f.spawnD || f.r0 * 1.6) * 1.15 : 0;   // never so close that the engine takes it for a descent into the next level: a click frames, it does not go in
    const want = Math.max(fitD(f, e.r), f.floorD || 0, dive, MIN_D * 10); if (want > cam.D * 4) return; if (want < cam.D * .8 || want > cam.D * 1.25) D = want;   /* a click visibly frames: on a phone the person standing in the start view already filled 74 % of the free area's width, and the old 62 % threshold left the camera where it was; and the pond, 6 m across, needs the camera 3.2 times further out on a phone than the start view (the limit of 2.5 left it where it was) */
  }
  if (D === cam.D && off < tol && v.z < 1) return;
  h.framed = { p: e.p, D };
  flyKeep(f, e.p, D);
}
/* A cut-open view shows a part of the thing only (the dog's "Inside the eye" is one eyeball, the rest of the dog is gone), and where that is cannot be known
   from the part that was clicked: its centre may now be empty air, and the next double click in the middle of the view went into the lawn behind. So once the
   view has changed (the parts fade over about half a second of the app's clock) and the flight to the part has ended, the camera frames what of the frame can
   now be seen: a 16 by 16 grid of picks over the free area finds it, the point on it nearest the middle of what shows becomes the target,
   and the distance is set so that it fills about two thirds of the view. Skipped if the visitor has clicked, scrolled or gone elsewhere meanwhile. */
let _fsTok = 0, _fsPend = false, _fsWhy = '';   // _fsPend: a reframing is still to come (the tests wait for it); _fsWhy: what the last one did
function frameShownSoon(f) {
  const tok = ++_fsTok, c0 = clock, t0 = performance.now(), fly0 = fly; _fsPend = true; _fsWhy = 'waiting';
  const go = () => {
    if (tok !== _fsTok) return;   // a later click has taken over (and has cleared or re-set _fsPend)
    /* the parts fade on the app's clock, which runs slow when frames are slow: wait for that, not for the wall clock; and for the flight to the part to end,
       however long it takes on a slow machine (a flight the visitor replaced is another flight: then this is skipped below) */
    const wall = performance.now() - t0;
    if ((clock - c0 < .7 && wall < 20000) || (fly && fly === fly0 && wall < 120000)) { setTimeout(go, 150); return; }
    _fsPend = false;
    if (pointers.size || Math.abs(zoom.pending) > 1e-3 || fly || !f.built || !f.C || !chainOf(cam.A).concat(drawn).includes(f)) { _fsWhy = 'skipped'; return; }   // the visitor has clicked, scrolled or gone elsewhere meanwhile
    /* what of the frame can be seen now: a grid of picks over the free area (a pick knows what a cut has removed; a bounding box does not: "Inside the eye"
       keeps both eyeballs in its parts and cuts one of them away) */
    const A = freeArea(), N = 16, H2 = []; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, sx = 0, sy = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = A.l + (i + .5) / N * A.w, y = A.t + (j + .5) / N * A.h, h = pickAt(x, y);
      if (h && h.frame === f) { H2.push([x, y, h]); sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (H2.length) {
      const cx = sx / H2.length, cy = sy / H2.length, cell = Math.max(A.w, A.h) / N, ext = Math.max(x1 - x0, y1 - y0) + cell, fill = ext / Math.min(A.w, A.h), vc = viewCentre();
      let best = H2[0], bd = Infinity; for (const q of H2) { const d = Math.hypot(q[0] - cx, q[1] - cy) + (q[2].obj.userData.hotspot ? 1e4 : 0); if (d < bd) { bd = d; best = q; } }   // a point that is on the thing (on a part rather than on a marker), nearest the middle of what shows
      if (fill >= .95 || (fill > .45 && Math.hypot(best[0] - vc.x, best[1] - vc.y) < Math.min(A.w, A.h) * .12)) { _fsWhy = 'framed already'; return; }   // it covers the view, or fills it with its middle in the middle
      const D = Math.max(cam.D * clamp(fill / .7, .05, 1), (f.floorD || 0) * 2, (f.spawnD || 0) * 1.3, MIN_D * 10);   // closer, never further out: this is a look inside
      flyKeep(f, best[2].pointLocal.clone(), D); _fsWhy = 'reframed'; return;
    }
    // nothing of it in view: the bound of its parts that are drawn solid
    _pkBox.makeEmpty(); let n = 0;
    for (const p of f.pickables) { const u = p.userData; if (u.shown === undefined || u.shown < .35 || u.hotspot || !visibleChain(p)) continue; if (pkExpand(p, _pkBox)) n++; }
    if (!n || _pkBox.isEmpty()) { _fsWhy = 'nothing shown'; return; }
    const c = _pkBox.getCenter(new V3()).add(f.C), r = _pkBox.min.distanceTo(_pkBox.max) / 2 * .62;   // the box's corners reach further than the content does
    flyKeep(f, c, Math.max(fitD(f, r), (f.floorD || 0) * 2, (f.spawnD || 0) * 1.3, MIN_D * 10));
  };
  setTimeout(go, 150);
}
/* a flight that belongs to the open card (framing what was selected, looking inside it): the card stays */
function flyKeep(frame, p, D, then) { const was = typeof CARD_FRESH !== 'undefined' && CARD_FRESH; if (typeof CARD_FRESH !== 'undefined') CARD_FRESH = true; try { flyTo(frame, p, D, then); } finally { if (typeof CARD_FRESH !== 'undefined') CARD_FRESH = was; } }

/* ================= LOOK INSIDE =================
   What a double click, and the panel's "Look inside" button, do with a thing.
   0. On a layered thing whose Auto peel is on (the body, the dog, the robin, the bee; by stages the pond and the soil), one step in at that spot: the next
      layer under the pointer, shown at the distance where Auto shows it, with the card of the part now shown (layerStep, js/body_core.js). No deeper
      layer under the point: the steps below.
   1. A cut-open view of it, where one exists and is not showing yet (cutOpenOf). If the camera is not yet at the thing it also flies to frame it:
        userData.cutOpen(h, peek) / frame.cutOpen(h, peek)   the Sun's cut-away, a thing's cut or sample mode, the phone opened to the part
                                                             (peek: say whether there is one, without opening it; return false to pass)
        an organ of the body with a cut-open view (an enterOnly organ frame)
      or the scene's own whole answer, userData.lookInside(h): a Standard Model particle plays its decay or says it has no known parts.
   2. Otherwise the next level down at the point clicked. That is the descent module's job when it is loaded:
        DESCENT.inside(h)  ->  {ok: true, title, note}  or  {ok: false, reason, card}     (js/descent.js)
      It flies there itself; a refusal's reason is shown in the panel, with the card it names.
   3. Without that module (insideFallback), the entry points that exist today, in this order: userData.zoomTo(h) (the frame the object stands
      for: a star, a planet, Sgr A*; skipped when the camera is already there), userData.inner(h) (the atom's nucleus), frame.cardMadeOf (a
      part of a thing with a closer view: thGoDeeper), frame.spawn(point, hit) (the engine's descent at the clicked point), a frame that
      already sits inside the object at the point, diveMaterial (userData.madeOf). If none has anything, the camera goes as close as the
      view allows and the panel says "No closer view of this has been built yet" (notBuilt).
   It never does nothing. lastInside records what happened, for the tests: {how, frame}. When the answer is another frame, the card stays
   for the flight and the place takes the panel on arrival (selLeave). */
let selLeave = null, lastInside = null;
function organViewOf(h) { const f = h.frame, n = h.obj.userData.node; return (f.children && n && f.children.find(c => c.enterOnly && c.opts && c.opts.organ === n)) || null; }
/* the cut-open view of the thing: opens it (returns what it did) or, with peek, only says whether there is one to open */
function cutOpenOf(h, peek) {
  const ud = h.obj.userData, f = h.frame; let r = false;
  if (ud.cutOpen) { if (peek) r = ud.cutOpen(h, true); else flyKeepDo(() => { r = ud.cutOpen(h, false); }); if (r) return typeof r === 'string' ? r : 'cut'; }
  if (f.cutOpen) { if (peek) r = f.cutOpen(h, true); else flyKeepDo(() => { r = f.cutOpen(h, false); }); if (r) return typeof r === 'string' ? r : 'cut'; }
  const og = organViewOf(h); if (og && cam.A !== og) { if (!peek) { selLeaveFor(og); flyKeep(og, new V3(), og.opts.R * 2.2); } return 'cut'; }
  return null;
}
function selLeaveFor(frame, note) { selLeave = { frame, key: typeof curCard !== 'undefined' && curCard ? curCard.key : null, t: performance.now(), note: note || '' }; }
function lookInside(h) {
  cancelTour(); if (typeof panelHintDone === 'function') panelHintDone();
  if (!h || !h.obj || !h.frame || !h.frame.built) return lastInside = { how: 'none' };
  if (selHit !== h && !(selHit && selHit.obj === h.obj)) selectHit(h); // the card of what you are looking into, until the new place takes over
  const ud = h.obj.userData, f = h.frame, fly0 = fly;
  const went = (how, note) => { const moved = fly && fly !== fly0; if (moved && fly.frame !== f) selLeaveFor(fly.frame, note); return lastInside = { how, frame: moved ? fly.frame : f }; };
  let r = false;
  if (typeof layerStep === 'function') { flyKeepDo(() => { r = layerStep(h); }); if (r) return went('layer'); }   // a layered thing in Auto: one layer in at that spot (js/body_core.js)
  r = cutOpenOf(h, false);
  if (r) { if (!(fly && fly !== fly0)) { frameSelected(h); frameShownSoon(f); } return went(r); }   // a cut-open view of a thing the camera is not yet at: go to it as well (the view used to open seven metres away, where nothing could be seen to change)
  if (ud.lookInside) { flyKeepDo(() => { r = ud.lookInside(h); }); if (r !== false) return went(typeof r === 'string' ? r : 'own'); }
  if (typeof DESCENT !== 'undefined' && DESCENT && DESCENT.inside) { // the next level down: the descent module's
    flyKeepDo(() => { r = DESCENT.inside(h); });
    if (r && r.ok) return went('descent', r.note);
    if (typeof showNotBuilt === 'function') showNotBuilt(h, r && r.reason, r && r.card);
    return lastInside = { how: 'not-built', frame: f };
  }
  return insideFallback(h, went);
}
/* The next level down without the descent module: today's entry points, called as they are. */
function insideFallback(h, went) {
  const ud = h.obj.userData, f = h.frame, fly0 = fly; let r;
  const enter = (how, frame, p, D) => { selLeaveFor(frame); flyKeep(frame, p || new V3(), D); return lastInside = { how, frame }; };
  if (ud.zoomTo) {
    const st = { T: cam.T.clone(), D: cam.D, A: cam.A }; flyKeepDo(() => { r = ud.zoomTo(h); });
    // a destination that is where the camera already is (the Moon you have flown to) is no answer: go on to what is inside it
    const there = fly && fly !== fly0 && fly.frame === st.A && fly.p.distanceTo(st.T) * st.A.unit < st.D * .2 && Math.abs(Math.log(fly.Dg / st.D)) < .35;
    if (there) fly = fly0; else if (r !== false) return went('stands-for');
  }
  if (ud.inner) { flyKeepDo(() => { r = ud.inner(h); }); if (r !== false) return went(typeof r === 'string' ? r : 'inner'); }
  const node = typeof NODE !== 'undefined' && NODE[ud.node || h.id];
  const mo = f.cardMadeOf && node ? f.cardMadeOf(h, node) : null;
  if (mo) { flyKeepDo(() => mo.go()); return went('made-of'); }
  const P = h.pointLocal.clone();
  if (f.spawn) {
    let c = f.children.find(c => c.dynamic && c.containsP(P));
    if (!c) { c = f.spawn(P, { frame: f, obj: h.obj, point: P.clone(), normal: h.normalLocal, id: h.id, hit: h.hit }); if (c) { c.dynamic = true; c.keep = performance.now() + 60000; f.addChild(c); } }
    if (c) { c.ensure(); return enter('descent', c, c.center ? c.center.clone() : new V3(), frameOverviewD(c)); }
  }
  { // a frame that already sits inside the object, at the point (the processor die under the phone's chip, a planet's frame under its dot)
    const e = hitExtent(h); let best = null, bd = Infinity;
    for (const c of f.children) { if (c.coRender || c.enterOnly) continue; safePlace(c); const d = c.pos.distanceTo(e.p), d2 = c.pos.distanceTo(P), cr = c.radius === Infinity ? 0 : c.radius * c.unit / f.unit; if ((e.r && d <= e.r * 1.05 && d2 <= Math.max(cr * 2, e.r * .35)) || c.containsP(P) || (!e.r && c.containsP(e.p))) { if (d2 < bd) { bd = d2; best = c; } } }
    if (best) { best.ensure(); return enter('inner', best, best.center ? best.center.clone() : new V3(), frameOverviewD(best)); }
  }
  if (ud.madeOf && typeof diveMaterial === 'function') { flyKeepDo(() => diveMaterial(h, true)); if (fly && fly !== fly0) return went('material'); }
  return notBuilt(h);
}
function flyKeepDo(fn) { const was = typeof CARD_FRESH !== 'undefined' && CARD_FRESH; if (typeof CARD_FRESH !== 'undefined') CARD_FRESH = true; try { fn(); } finally { if (typeof CARD_FRESH !== 'undefined') CARD_FRESH = was; } }
/* a comfortable first view of a frame: its widest landmark if it has one, else a little outside its content */
function frameOverviewD(f) {
  const lms = typeof LANDMARKS !== 'undefined' ? LANDMARKS.filter(l => l.frame === f).sort((a, b) => b.D - a.D) : [];
  if (lms.length) return lms[0].D;
  const byR = f.radius !== Infinity ? f.radius * f.unit * 2.2 : Infinity, byR1 = f.r1 !== Infinity ? f.r1 * .3 : Infinity;
  return Math.max(Math.min(byR, byR1, f.r1 !== Infinity ? f.r1 * .8 : Infinity), f.floorD || 0, MIN_D * 10);
}
/* Nothing closer exists: go as close as the view allows, and say so in the panel (and in a toast, which is seen when the panel is minimised). */
function notBuilt(h) {
  const f = h.frame, e = hitExtent(h);
  const D = Math.max(f.floorD || 0, (f.spawnD || 0) * 1.5, e.r ? Math.min(fitD(f, e.r) * .45, cam.D) : cam.D * .5, MIN_D * 10);
  if (D < cam.D * .9 && chainOf(cam.A).concat(drawn).includes(f)) flyKeep(f, e.r ? e.p : h.pointLocal.clone(), D);
  if (typeof showNotBuilt === 'function') showNotBuilt(h);
  return lastInside = { how: 'not-built', frame: f };
}
/* "Look inside" with nothing selected (the place card's button): the thing in the middle of the free area. With nothing there, and without the
   descent module, the place's own next level at the camera's target (frame.spawn, or the frame that sits nearest inside it). */
/* A double click between the atoms of a molecule, in the cloud of an atom, between the nucleons of a nucleus: nothing is under the pointer, yet the place is made
   of things too small or too sparse to hit. Where the frame names the points a zoom can end on (its attractors), the nearest one to the pointer is what was meant:
   go into it. Anywhere else (the sky, the space between planets) a double click on nothing still does nothing. */
function lookInsideNear(x, y) {
  const none = { how: 'none' }, A = cam.A, a = A && A.att; if (!a || !A.spawn) return none; // nothing was looked into: lastInside is left alone
  const P = pivotAt(x, y).clone(), id = a.find(P, null), Q = new V3();
  if (id < 0 || !a.pos(id, Q)) return none;
  cancelTour(); att.f = A; att.id = id; att.p.copy(Q); att.px = zoom.px; att.py = zoom.py; // spawn functions ask attId(A) for the one that was meant
  let c = A.children.find(k => k.dynamic && k.containsP(Q));
  if (!c) { try { c = A.spawn(Q.clone(), null); } catch (e) { c = null; } if (c) { c.dynamic = true; c.keep = performance.now() + 60000; A.addChild(c); } }
  if (!c) return none;
  c.ensure(); selLeaveFor(c); flyKeep(c, c.center ? c.center.clone() : new V3(), frameOverviewD(c)); return lastInside = { how: 'descent', frame: c };
}
function lookInsidePlace() {
  const c = viewCentre(), h0 = pickAt(c.x, c.y), h = h0 && !isBackdrop(h0) ? h0 : null;
  if (h) return lookInside(h);
  if (lookInsideNear(c.x, c.y).how !== 'none') return lastInside;
  const f = cam.A;
  if (typeof DESCENT === 'undefined' || !DESCENT) {
    if (f.spawn) { const k = f.spawn(cam.T.clone(), null); if (k) { k.dynamic = true; k.keep = performance.now() + 60000; f.addChild(k); k.ensure(); flyTo(k, k.center ? k.center.clone() : new V3(), frameOverviewD(k)); return lastInside = { how: 'descent', frame: k }; } }
    const ch = f.children.filter(k => !k.coRender && !k.enterOnly).sort((a, b) => a.pos.distanceTo(cam.T) - b.pos.distanceTo(cam.T))[0];
    if (ch) { ch.ensure(); flyTo(ch, ch.center ? ch.center.clone() : new V3(), frameOverviewD(ch)); return lastInside = { how: 'inner', frame: ch }; }
  }
  if (typeof showNotBuilt === 'function') showNotBuilt(null, 'Nothing is in the middle of the view to look into. Click a thing, then choose Look inside, or double-click it.');
  return lastInside = { how: 'not-built', frame: f };
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
  el._lblHit = () => { const target = o.pick || obj; return { frame: f, obj: target, id: target.userData.id, pointLocal: target.getWorldPosition(new V3()).add(f.C), hit: null }; };
  el.addEventListener('click', ev => {   // a label is its thing: one click selects it, two look inside
    ev.stopPropagation(); const target = o.pick || obj;
    /* ... unless the label lies over something else that is drawn solid there. The names of the buttercup and of the bee float over the dog's back in the start
       view, and a click on the dog there selected a buttercup stem or went into the bee. A name is an annotation: where a model of the park (a thing, the
       body) is under the pointer, the click is on that; the name answers only over the lawn, the sky or empty space. */
    const u = pickAt(ev.clientX, ev.clientY);
    if (u && u.frame.coRender && !pickWeak(u)) { onClick(ev.clientX, ev.clientY, false, ev.timeStamp); return; }
    const h = { frame: f, obj: target, id: target.userData.id, pointLocal: target.getWorldPosition(new V3()).add(f.C), hit: null }; onLabelClick(h, ev.clientX, ev.clientY, ev.timeStamp);
  });
  return L;
}
// labels sit above the canvas: pass the mouse wheel through, so scroll-zoom works over a label too (stopImmediatePropagation: a second forwarder, if any, must not zoom twice)
/* A wheel turned with the pointer on a name's text zooms to that thing (the name is the thing: the Moon's name stands in space above it); anywhere else on the label box (its padding, the gap above the
   thing it names) the zoom goes to what is drawn under the pointer, as it would without the label. */
const _lblRange = document.createRange();
/* as for a click (above): a name over a model of the park (the bee's name over the dog's back) is an annotation, and the wheel goes to the model */
function lblOverModel(x, y) { const u = pickAt(x, y); return !!(u && u.frame.coRender && !pickWeak(u)); }
function onLabelText(el, x, y) { if (!el || !el._lblHit || !el.firstChild) return false; _lblRange.selectNodeContents(el); for (const r of _lblRange.getClientRects()) if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true; return false; }
labelLayer.addEventListener('wheel', e => { e.preventDefault(); e.stopImmediatePropagation(); const el = e.target && e.target.closest ? e.target.closest('.lbl') : null; zoomLabel = el && e.deltaY < 0 && onLabelText(el, e.clientX, e.clientY) && !lblOverModel(e.clientX, e.clientY) ? { h: el._lblHit(), t: performance.now() } : null; canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, bubbles: true, cancelable: true })); }, { passive: false });
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
  const shown = new Set(), topY = W <= 860 ? freeArea().t / H : 0;   // on a phone the top of the screen belongs to the buttons: a name is not drawn under them (the Search button sat on "Storage" in the battery view)
  for (const f of drawn) {
    if (f.alpha < .6 || !f.labels || f._culled) continue;
    if (f !== cam.A && f.dLoc < f.radius * 1e-3) continue; // outer frames: only when their structure is in view
    for (const L of f.labels) {
      if ((!labelsOn && !L.always) || !L.el.textContent || !visibleChain(L.obj)) continue;
      L.obj.getWorldPosition(_lv).add(_lo.copy(L.off).multiplyScalar(L.scaleRef ? L.scaleRef.k || 1 : 1));
      _lv.project(f.cam);
      if (_lv.z > 1 || Math.abs(_lv.x) > 1.05 || Math.abs(_lv.y) > 1.05) continue;
      if (topY && (-_lv.y * .5 + .5) < topY + 22 / H) continue;
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
/* A row of choices (a thing's layers and cut views, the body's systems). On a phone a long row covered the thing it is about (eleven buttons over the dog), so
   there it folds: the choice in force and one "Views" button that opens the whole list (css/app.css, .seg.fold); choosing closes it again. */
function seg(items, activeK, onSel) {
  const d = document.createElement('div'); d.className = 'seg';
  items.forEach(([k, label]) => { const b = document.createElement('button'); b.innerHTML = label; b.dataset.k = k; if (k === activeK) b.classList.add('on'); b.onclick = () => { d.querySelectorAll('button[data-k]').forEach(x => x.classList.toggle('on', x === b)); d.classList.remove('open'); const m = d.querySelector('.segMore'); if (m) m.setAttribute('aria-expanded', 'false'); onSel(k); }; d.appendChild(b); });
  if (items.length > 3) {
    d.classList.add('fold'); const m = document.createElement('button'); m.className = 'segMore'; m.type = 'button'; m.textContent = `Views (${items.length})`; m.setAttribute('aria-expanded', 'false'); m.title = 'Show every view of this';
    m.onclick = () => { const o = d.classList.toggle('open'); m.setAttribute('aria-expanded', String(o)); }; d.appendChild(m);
  }
  if (building) building.uiEls.push(d); return d;
}
/* A double tap (or click) whose second half lands on a control that appeared between the two (the dog's row of views comes up when the first tap selects
   it) is the double tap the visitor meant: it goes to the scene, not to the button that slid under the finger. */
let ctrlBuiltT = -1e9, canvasTapT = -1e9, canvasTapXY = null;
new MutationObserver(() => { ctrlBuiltT = performance.now(); }).observe(ctrlEl, { childList: true, subtree: true });
canvas.addEventListener('pointerup', e => { canvasTapT = performance.now(); canvasTapXY = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' }; }, true);
function ctrlSwallow(e) {
  const now = performance.now(), c = canvasTapXY;
  if (!c || now - canvasTapT > (c.touch ? DBL_LATE_MS_TOUCH : DBL_LATE_MS) || ctrlBuiltT < canvasTapT - 50 || Math.hypot(e.clientX - c.x, e.clientY - c.y) > (c.touch ? DBL_PX_TOUCH : DBL_PX)) return false;
  e.preventDefault(); e.stopPropagation(); return true;
}
ctrlEl.addEventListener('pointerdown', ctrlSwallow, true);
ctrlEl.addEventListener('click', e => { if (ctrlSwallow(e)) { const c = canvasTapXY; canvasTapXY = null; onClick(e.clientX, e.clientY, c.touch, e.timeStamp); } }, true);
function actBtn(label, onClick) { const b = document.createElement('button'); b.className = 'act'; b.innerHTML = label; b.onclick = onClick; if (building) building.uiEls.push(b); return b; }
function uiEl(el) { if (building) building.uiEls.push(el); return el; }
let uiFrame = null;
/* A frame's interface elements: buttons and selectors go to the control row at the top of the scene; anything that is there to be read
   (an element with data-sec="its title": "What this picture is", a key, a legend, the Standard Model's panel) becomes a section of the
   one panel (panelSection, js/engine_ui.js). Nothing a scene builds floats over the view as a second box. */
function updateControls(f) {
  if (f === uiFrame) return; uiFrame = f;
  const secs = document.getElementById('sceneSecs'), sec = typeof panelSection === 'function' && secs;
  ctrlEl.innerHTML = ''; if (secs) secs.innerHTML = '';
  (f.uiEls || []).forEach(e => { if (sec && e.dataset && e.dataset.sec !== undefined) secs.appendChild(panelSection(e)); else ctrlEl.appendChild(e); });
}
function toast(html, cls = '') {
  const el = document.createElement('div'); el.className = 'toast ' + cls; el.innerHTML = html;
  const box = $('#toasts'); box.appendChild(el); while (box.children.length > 2) box.firstChild.remove();
  setTimeout(() => { el.style.opacity = '0'; }, 3800); setTimeout(() => el.remove(), 4300);
}
const msg = { text: '', t: 0 };
function message(t) { msg.text = t; msg.t = performance.now(); }
