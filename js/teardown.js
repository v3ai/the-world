'use strict';
/* =====================================================================
   TEARDOWN: the phone in your hand, down to the silicon crystal.
   Phone (mm) → SoC die (µm) → CPU core (µm) → standard cells (nm)
   → CMOS inverter layout (nm) → FinFET (nm) → silicon lattice (Å)
   Sizes follow a current flagship phone and a ~3 nm-class process.
   ===================================================================== */
const TEAR = {}; // node id → {frame, pos (frame-local), D (m)} for flying to parts
function tearReg(id, frame, pos, D) { TEAR[id] = { frame, pos: pos.clone(), D }; } // the last registration wins: the most specific (die, core) comes after the coarse phone-level one
/* Scrolling toward a block should reach the next level whatever the cursor precision: inside `rad` of the child's centre, below D1 metres, the camera target drifts to the child's centre. */
function tearAttract(F, dt, target, D1, rad) { if (cam.A === F && cam.D < D1 && cam.T.distanceTo(target) < rad) cam.T.lerp(target, 1 - Math.exp(-dt * 2.5)); }
function tearLights(F, k = 1) { if (LOOK.on && LOOK.part('rig')) return; F.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, .6 * k)); const d = new THREE.DirectionalLight(0xffffff, .8 * k); d.position.set(1, 2, 3); F.add(d); }
function partInfo(id, name, text) { return NODE[id] ? null : { title: name, tag: 'Part', body: `<p>${text || ''}</p>` }; }
function tearPart(F, geo, color, id, name, pos, o = {}) {
  const g = LOOK.on && o.mat ? TL.part(geo, o.mat) : inked(geo, color, { w: o.w || .0025, double: o.double, outline: o.outline });
  g.position.copy(pos); if (o.rot) g.rotation.set(...o.rot);
  if (id) { Object.assign(g.userData, { id, node: NODE[id] ? id : null, priority: o.pri || 2, madeOf: o.madeOf, center: () => g.position.clone(), radius: () => o.r || 1, extent: () => { if (!geo.boundingSphere) geo.computeBoundingSphere(); return { p: g.position.clone(), r: o.r || geo.boundingSphere.radius || 1 }; } }); /* extent: the whole part, which a click frames (hitExtent, js/engine.js) */ if (!NODE[id]) g.userData.info = partInfo(id, name, o.text); F.pickables.push(g); regMesh(id, g); }
  if (o.opacity !== undefined) { g.userData.main.material.opacity = o.opacity; }
  F.add(g); return g;
}
function boxGeo(w, h, d, r) { return new THREE.BoxGeometry(w, h, d); }
function rrectShape(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function slab(w, h, d, r) { const g = new THREE.ExtrudeGeometry(rrectShape(w, h, r), { depth: d, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -d / 2); return g; }
function gridTex(key, bg, line, n, o = {}) {
  return canvasTex(key, 256, 256, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = line; g.lineWidth = o.lw || 1;
    for (let i = 0; i <= n; i++) { const p = i / n * w; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke(); if (!o.cols) { g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); } }
    if (o.dots) { const r = rng(3); g.fillStyle = o.dots; for (let i = 0; i < 900; i++) g.fillRect(r() * w, r() * h, 2, 2); }
  }, { wrap: true });
}

/* ---------- the realistic look (?look=2): measured materials, bevelled solids, a studio ground. Everything below runs only with LOOK.on. ----------
   Colours of metals are the physicallybased.info values (linear sRGB, from refractiveindex.info optical constants: Al Cheng, Cu Johnson,
   Au Babar, Si Aspnes, W Werner, Ni, stainless steel); the non-metals (solder mask, mould compound, MLCC ceramic, FR-4) are estimates. */
const TL = { on: LOOK.on };
if (LOOK.on) {
  Object.assign(LOOK.KINDS, { alu: { rough: .36, metal: 1 }, copper: { rough: .22, metal: 1, env: 1.4 }, gold: { rough: .2, metal: 1 }, tungsten: { rough: .32, metal: 1 }, silicon: { rough: .16, metal: 1 }, solder: { rough: .35, metal: 1 }, steel: { rough: .28, metal: 1 }, blackglass: { rough: .05, env: 1.5 }, polymer: { rough: .5 }, mask: { rough: .42 }, mold: { rough: .55 }, ceramic: { rough: .62 }, clay: { rough: .65 }, oxide: { rough: .25 } });
  const lc = (r, g, b) => new THREE.Color().setRGB(r, g, b);
  TL.C = { alu: lc(.916, .923, .924), copper: lc(.932, .623, .522), gold: lc(1, .773, .307), silicon: lc(.345, .369, .426), tungsten: lc(.537, .536, .519), nickel: lc(.697, .641, .563), steel: lc(.669, .639, .598), solder: lc(.75, .75, .74), black: lc(.012, .012, .014), clay: lc(.5, .49, .47), mold: lc(.025, .025, .027), ceramic: lc(.33, .25, .15), nitride: lc(.5, .5, .52), oxide: lc(.62, .6, .55), pouch: lc(.46, .48, .52) };
  TL.lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  /* a material of a kind (opaque unless something fades it) */
  TL.mat = (kind, col, ex) => opaqueUnlessFading(smat(col, Object.assign({ kind }, ex || {})));
  TL.part = (geo, mat) => { const g = new THREE.Group(), m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; g.add(m); g.userData.main = m; return g; };
  /* normals averaged across edges flatter than `deg`: a bevel reads as one rounded edge, a box keeps its sharp ones. The geometry becomes non-indexed. */
  TL.crease = (g, deg = 32, q = 1e3) => {
    g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position.array, n = p.length / 9, fn = new Float32Array(n * 3), ar = new Float32Array(n), cs = Math.cos(deg * Math.PI / 180);
    const a = new V3(), b = new V3(), c = new V3(), bk = new Map(), key = i => Math.round(p[i] * q) + ',' + Math.round(p[i + 1] * q) + ',' + Math.round(p[i + 2] * q);
    for (let f = 0; f < n; f++) { a.fromArray(p, f * 9); b.fromArray(p, f * 9 + 3); c.fromArray(p, f * 9 + 6); b.sub(a); c.sub(a); b.cross(c); ar[f] = b.length(); if (ar[f] > 0) b.multiplyScalar(1 / ar[f]); fn[f * 3] = b.x; fn[f * 3 + 1] = b.y; fn[f * 3 + 2] = b.z; for (let v = 0; v < 3; v++) { const k = key(f * 9 + v * 3); (bk.get(k) || bk.set(k, []).get(k)).push(f); } }
    const nr = new Float32Array(p.length);
    for (let f = 0; f < n; f++) for (let v = 0; v < 3; v++) { const l = bk.get(key(f * 9 + v * 3)); let x = 0, y = 0, z = 0; for (const h of l) { if (fn[f * 3] * fn[h * 3] + fn[f * 3 + 1] * fn[h * 3 + 1] + fn[f * 3 + 2] * fn[h * 3 + 2] >= cs) { x += fn[h * 3] * ar[h]; y += fn[h * 3 + 1] * ar[h]; z += fn[h * 3 + 2] * ar[h]; } } const L = Math.hypot(x, y, z) || 1; nr[f * 9 + v * 3] = x / L; nr[f * 9 + v * 3 + 1] = y / L; nr[f * 9 + v * 3 + 2] = z / L; }
    g.setAttribute('normal', new THREE.BufferAttribute(nr, 3)); return g;
  };
  /* a rounded slab with a bevel (w x h outline, depth d, corner radius r, bevel b); `hole` (mm) makes it a ring */
  TL.slab = (w, h, d, r, b, hole) => {
    const s = rrectShape(w - 2 * b, h - 2 * b, Math.max(r - b, .4)); if (hole) s.holes.push(rrectShape(w - 2 * b - 2 * hole, h - 2 * b - 2 * hole, Math.max(r - b - hole, .4)));
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: 0, bevelSegments: 4, curveSegments: 12 }); g.translate(0, 0, -(d - 2 * b) / 2); return TL.crease(g);
  };
  TL.chip = (w, h, d) => TL.slab(w, h, d, Math.min(.3, w / 4), Math.min(.14, d * .22));
  /* many boxes (w,h,d,x,y,z, colour) in one geometry; vertices on the underside are darkened (contact shading baked in) */
  TL.boxes = (list, shade) => {
    const P = [], N = [], C = [];
    for (const [w, h, d, x, y, z, col] of list) { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(), p = g.attributes.position.array, nn = g.attributes.normal.array; for (let i = 0; i < p.length; i += 3) { P.push(p[i] + x, p[i + 1] + y, p[i + 2] + z); N.push(nn[i], nn[i + 1], nn[i + 2]); const k = shade && p[i + 2] < 0 && nn[i + 2] === 0 ? shade : 1; C.push((col ? col.r : 1) * k, (col ? col.g : 1) * k, (col ? col.b : 1) * k); } g.dispose(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g;
  };
  /* a studio floor: neutral grey card in the middle falling to black, with the object's contact shadow baked in (a blurred footprint) */
  TL.ground = (F, size, z, fw, fh) => {
    const key = 'real:ground:' + (fw / size).toFixed(3) + ':' + (fh / size).toFixed(3);
    const tex = TL.tex(key, 256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, '#7a7a7e'); r.addColorStop(.5, '#46464a'); r.addColorStop(1, '#101012'); g.fillStyle = r; g.fillRect(0, 0, w, h); g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = w * .035; g.fillStyle = '#000'; g.fillRect((w - fw / size * w) / 2, (h - fh / size * h) / 2, fw / size * w, fh / size * h); }, true);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), TL.mat('matte', 0xffffff, { map: tex, roughness: .9 })); m.position.z = z; m.userData.ground = true; F.add(m); return m;
  };
  /* the wiring side of a chip as a photograph shows it: a fine metal pattern over glassy layers that tint what they cover (thin-film interference).
     Packed map: G roughness, B metalness (r128 reads those channels); metal lines metalness 1, the gaps between them are dielectric. */
  const DIE_PAL = { logic: ['#7a7794', '#f4e8d0'], sram: ['#85836a', '#f6ead0'], io: ['#678590', '#f6ecd6'], bus: ['#857b74', '#f2e6d2'], fill: ['#74758a', '#e2d9ca'] };
  const dieDraw = (kind, pal, W, rm) => g => {
    const k = W / 512, r = rng(kind.length * 17 + 3), gap = rm ? '#004000' : pal[0], mt = rm ? '#007070' : pal[1], R = (x, y, w, h) => g.fillRect(x * k, y * k, Math.max(w * k, rm ? 1 : .6), Math.max(h * k, rm ? 1 : .6));
    g.fillStyle = gap; g.fillRect(0, 0, W, W); g.fillStyle = mt;
    if (kind === 'logic' || kind === 'fill') { for (let row = 0; row < 32; row++) for (let x = 0; x < 512;) { const l = 6 + r() * 46; if (r() < .8) { R(x, row * 16 + 3, l, 2); if (r() < .6) R(x, row * 16 + 9, l * .6, 2); } if (r() < .5) R(x + l * r(), row * 16 + 3, 2, 9); x += l + 2 + r() * 8; } }
    else if (kind === 'sram') { for (let y = 0; y < 512; y += 16) for (let x = 0; x < 512; x += 12) { R(x + 1, y + 1, 4, 14); R(x + 7, y + 2, 3, 6); R(x + 7, y + 10, 3, 4); } for (let y = 0; y < 512; y += 64) R(0, y + 7, 512, 2); }
    else if (kind === 'io') { for (let y = 0; y < 512; y += 64) R(0, y + 18, 512, 14); for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) { g.beginPath(); g.arc((x + 32) * k, (y + 46) * k, 14 * k, 0, 7); g.fill(); } }
    else { for (let x = 0; x < 512; x += 8) R(x + 2, 0, 3, 512); for (let i = 0; i < 80; i++) R(r() * 512, r() * 512, 30 + r() * 60, 3); }
    if (!rm) g.fillStyle = pal[1] + '70';   // the top metal's power grid, a veil over the cells
    R(0, 62, 512, 4); R(0, 318, 512, 4); R(62, 0, 4, 512); R(318, 0, 4, 512);
  };
  /* baked ambient occlusion: a transparent plane of blurred dark footprints (rects [x, y, w, h] in the scene's units) laid on a surface where things stand on it */
  TL.ao = (F, key, w, h, z, rects, blur, a = .8) => {
    const tex = TL.tex('real:ao:' + key, 512, Math.max(64, Math.round(512 * h / w)), (g, W, H) => { g.clearRect(0, 0, W, H); const k = W / w; g.shadowColor = 'rgba(0,0,0,' + a + ')'; g.shadowBlur = blur * k; g.fillStyle = '#000'; rects.forEach(([x, y, rw, rh]) => g.fillRect((x - rw / 2 + w / 2) * k, (h / 2 - y - rh / 2) * k, rw * k, rh * k)); }, false);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: 0xffffff })); m.position.z = z; m.userData.noPick = true; m.renderOrder = 1; F.add(m); return m;
  };
  TL.dieTex = kind => { const pal = DIE_PAL[kind]; return { map: TL.tex('real:die:' + kind, 512, 512, dieDraw(kind, pal, 512, false), true, true), rm: TL.tex('real:die:rm:' + kind, 256, 256, dieDraw(kind, pal, 256, true), false, true) }; };
  TL.dieMat = kind => { const t = TL.dieTex(kind), m = TL.mat('silicon', 0xffffff, { map: t.map }); if (LOOK.quality !== 'low') { m.roughnessMap = t.rm; m.metalnessMap = t.rm; m.roughness = 1; m.metalness = 1; m.needsUpdate = true; } return m; };
  /* world-unit UVs (one texel period is the same physical size on every block), used with a repeating texture */
  TL.boxUV = (w, h, d, tile) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / tile, (p.getY(i) + h / 2) / tile); return g; };
  const texs = {};
  TL.tex = (key, w, h, draw, srgb, rep) => { if (texs[key]) return texs[key]; const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.encoding = THREE.sRGBEncoding; return texs[key] = t; };
  /* UVs of a geometry from its positions: u = (x - x0) / w, v = (y - y0) / h */
  TL.uvXY = (g, x0, y0, w, h, rx = 1, ry = 1) => { const p = g.attributes.position, u = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { u[i * 2] = (p.getX(i) - x0) / w * rx; u[i * 2 + 1] = (p.getY(i) - y0) / h * ry; } g.setAttribute('uv', new THREE.BufferAttribute(u, 2)); return g; };
}

/* ---------- 1. the smartphone (unit mm; +Y up the long edge, +Z out of the screen) ---------- */
const PHONE = { w: 71.5, h: 147, d: 7.8 };
const SILICON_PARTS = new Set(['phone_soc', 'phone_ram', 'phone_flash', 'phone_pmic', 'phone_rf_frontend', 'phone_modem', 'phone_wifi_bt', 'phone_sensors']); // chips: silicon (the crystal oscillator is quartz; a PCB, speaker or port is not a crystal at all)
const PHONE_LABELS = { phone_soc: 'Processor and memory', phone_flash: 'Storage', phone_pmic: 'Power management', phone_rf_frontend: 'Radio front-end', phone_modem: 'Modem', phone_wifi_bt: 'Wi-Fi and Bluetooth', phone_camera: 'Camera', phone_battery: 'Battery', phone_speaker: 'Speaker', phone_charger_port: 'USB-C port', phone_vibration_motor: 'Vibration motor' };
const PHONE_PARTS = [ // id, name, pos(mm), size(mm), color, layer z (exploded), text
  ['phone_battery', 'Battery', [0, -24, 0], [62, 78, 4.6], 0x3d4a5c, -6, 'A lithium-ion pouch cell, ~4,500 mAh at 3.85 V ≈ 17 Wh.'],
  ['phone_pcb', 'Main circuit board', [0, 42, 0], [64, 52, 1], 0x1f6f4a, 0, 'A 10–12 layer board, often two boards stacked in a "sandwich".'],
  ['phone_soc', 'System-on-chip', [0, 46, 1.4], [13, 13, 1.2], 0x2b2f38, 1, 'The main processor package; the memory sits stacked on top of it.'],
  ['phone_ram', 'Memory (RAM)', [0, 46, 2.4], [12, 12, .8], 0x22252c, 1.8, 'LPDDR memory stacked on the processor (package-on-package).'],
  ['phone_flash', 'Storage (flash)', [-20, 54, 1.2], [11, 13, 1], 0x2a2d35, 1, 'NAND flash memory: trillions of charge-trapping cells.'],
  ['phone_pmic', 'Power management IC', [19, 32, 1], [7, 7, .8], 0x30343d, 1, 'Makes a dozen precise voltages from the battery.'],
  ['phone_rf_frontend', 'RF front-end', [-21, 31, 1], [9, 6, .8], 0x5a5f6b, 1, 'Amplifiers, switches and filters between antennas and modem.'],
  ['phone_modem', 'Modem', [20, 57, 1], [8, 8, .8], 0x30343d, 1, 'Turns bits into radio waveforms (and back) for 4G/5G.'],
  ['phone_wifi_bt', 'Wi-Fi / Bluetooth chip', [-23, 64, 1], [6, 5, .8], 0x30343d, 1, 'A separate radio for Wi-Fi, Bluetooth and often NFC.'],
  ['phone_sensors', 'Motion sensors (MEMS)', [26, 44, 1], [3, 3, .9], 0x4a4f5a, 1, 'Microscopic springs and masses that sense rotation and acceleration.'],
  ['phone_crystal_osc', 'Crystal oscillator', [10, 30, .9], [2.5, 2, .7], 0xc0c4cc, 1, 'A quartz crystal vibrating at a precise frequency: the clock reference.'],
  ['phone_camera', 'Camera module', [-22, 61, -1.5], [11, 11, 6], 0x15171c, -3, 'Lens stack, autofocus motor and an image sensor with ~50 million pixels.'],
  ['phone_speaker', 'Speaker', [-16, -67, 0], [16, 8, 3], 0x25282f, -1, 'A coil in a magnet field pushes a tiny diaphragm.'],
  ['phone_charger_port', 'USB-C port', [0, -71.5, 0], [9, 3, 3.2], 0xb8bcc4, 0, 'USB-C: 24 pins; carries power, data and video.'],
  ['phone_vibration_motor', 'Vibration motor', [18, -66, 0], [10, 6, 3], 0x9aa0aa, -1, 'A linear resonant actuator: a magnet mass bouncing on springs.'],
];
/* The phone under the look. The parts are placed so that nothing floats: a midframe plate on the back glass, the board and the battery on the plate, the chips on the board,
   the passives on the board, the camera through a hole in it. The positions of a few chips differ from the flat drawing's, which was a sketch (the note says the layout is illustrative). */
const PHONE_LOOK = { plate: -2.4, pcbTop: -1.4, pcb: [0, 42], hole: [-22, 61, 5.9], at: { phone_battery: [0, -24, -.1], phone_pcb: [0, 42, -1.9], phone_soc: [0, 46, -.8], phone_ram: [0, 46, .2], phone_flash: [-20, 46, -.9], phone_pmic: [19, 32, -1], phone_rf_frontend: [-21, 31, -1], phone_modem: [20, 57, -1], phone_wifi_bt: [4, 63, -1], phone_sensors: [26, 44, -.95], phone_crystal_osc: [10, 30, -1.05], phone_speaker: [-16, -67, -.9], phone_charger_port: [0, -71.5, -.8], phone_vibration_motor: [18, -66, -.9] } };
function phoneScreenTex() {
  const draw = (g, w, h) => {
    const t = new Date(simTime), hh = String(t.getUTCHours()).padStart(2, '0'), mm = String(t.getUTCMinutes()).padStart(2, '0');
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0e2f57'); gr.addColorStop(.55, '#3b6f9c'); gr.addColorStop(1, '#e49a62'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = g.createRadialGradient(w * .7, h * .78, 0, w * .7, h * .78, w * .55); r.addColorStop(0, 'rgba(255,226,170,.85)'); r.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(8,24,44,.55)'; g.beginPath(); g.moveTo(0, h * .88); g.bezierCurveTo(w * .3, h * .8, w * .55, h * .93, w, h * .84); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '300 170px Inter, system-ui, sans-serif'; g.fillText(hh + ':' + mm, w / 2, 250);
    g.font = '500 34px Inter, system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(new Date(simTime).toUTCString().slice(0, 11) + '  (made-up screen)', w / 2, 310);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(w / 2 - 70, h - 36, 140, 6);
  };
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024; draw(c.getContext('2d'), 512, 1024);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.userData = { redraw: () => draw(c.getContext('2d'), 512, 1024), min: Math.floor(simTime / 6e4), at: 0 }; return t;
}
function phoneBoardTex() {
  const lay = PHONE_PARTS.filter(q => SILICON_PARTS.has(q[0]) || q[0] === 'phone_crystal_osc').map(q => { const a = PHONE_LOOK.at[q[0]]; return { x: a[0] - PHONE_LOOK.pcb[0], y: a[1] - PHONE_LOOK.pcb[1], w: q[3][0], h: q[3][1], big: q[0] === 'phone_soc' || q[0] === 'phone_flash' }; });
  const draw = (pal, W, H) => (g) => {
    const ppm = W / 64, X = x => (x + 32) * ppm, Y = y => (26 - y) * ppm, rn = rng(11);
    g.fillStyle = pal.mask; g.fillRect(0, 0, W, H); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = pal.trace; for (let i = 0; i < 170; i++) { g.lineWidth = (.1 + rn() * .12) * ppm; let x = (rn() - .5) * 62, y = (rn() - .5) * 50; g.beginPath(); g.moveTo(X(x), Y(y)); for (let k = 0; k < 3; k++) { if (rn() < .5) x += (rn() - .5) * 14; else y += (rn() - .5) * 14; g.lineTo(X(x), Y(y)); } g.stroke(); }
    if (pal.ao) { g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = .7 * ppm; g.fillStyle = '#000'; lay.forEach(c => g.fillRect(X(c.x - c.w / 2), Y(c.y + c.h / 2), c.w * ppm, c.h * ppm)); g.shadowBlur = 0; }
    g.fillStyle = pal.pad; for (let i = 0; i < 150; i++) { const x = (rn() - .5) * 62, y = (rn() - .5) * 50; g.beginPath(); g.arc(X(x), Y(y), .22 * ppm, 0, 7); g.fill(); }
    lay.forEach(c => { const n = c.big ? .5 : .65; for (let sd = 0; sd < 4; sd++) { const hor = sd < 2, len = hor ? c.w : c.h, k = Math.floor(len / n) - 1; for (let i = 0; i < k; i++) { const u = -len / 2 + (i + 1) * len / (k + 1), off = (sd % 2 ? 1 : -1) * ((hor ? c.h : c.w) / 2 + .35); const px = hor ? u : off, py = hor ? off : u; g.fillRect(X(c.x + px) - .16 * ppm, Y(c.y + py) - .16 * ppm, .32 * ppm, .32 * ppm); } } });
    g.fillStyle = pal.pad; const pr = rng(7); for (let i = 0; i < 220; i++) { /* the passives' footprints: the same sequence as the instances below */ const f = phoneLookPassive(pr); if (!f) continue; for (const s of [-1, 1]) { const dx = f.rot ? 0 : s * .55, dy = f.rot ? s * .55 : 0; g.fillRect(X(f.x - PHONE_LOOK.pcb[0] + dx) - (f.rot ? .3 : .27) * ppm, Y(f.y - PHONE_LOOK.pcb[1] + dy) - (f.rot ? .27 : .3) * ppm, (f.rot ? .6 : .54) * ppm, (f.rot ? .54 : .6) * ppm); } }
    [[-29, 23], [29, 23], [-29, -23], [29, -23]].forEach(([x, y]) => { g.beginPath(); g.arc(X(x), Y(y), 1.5 * ppm, 0, 7); g.fillStyle = pal.pad; g.fill(); g.beginPath(); g.arc(X(x), Y(y), .9 * ppm, 0, 7); g.fillStyle = pal.hole; g.fill(); });
  };
  const A = (n, W, H, pal, srgb) => TL.tex('real:pcb:' + n, W, H, draw(pal, W, H), srgb);
  const o = { map: A('a', 1024, 832, { mask: '#2b8d57', trace: '#37a468', pad: '#e2bb63', hole: '#050505', ao: true }, true) };
  if (LOOK.quality !== 'low') {
    o.rm = A('rm', 512, 416, { mask: '#007400', trace: '#007400', pad: '#003cff', hole: '#00ff00' });
    o.bump = A('b', 512, 416, { mask: '#707070', trace: '#7c7c7c', pad: '#a8a8a8', hole: '#000' });
  }
  return o;
}
/* where passive i of the board is (the same sequence for the board's footprints and for the instances), or null for the draw that is rejected */
function phoneLookPassive(pr) {
  let x, y, tries = 0, ok;
  do { x = (pr() - .5) * 60; y = 18 + pr() * 48; ok = true; tries++;
    for (const q of PHONE_PARTS) { if (!(SILICON_PARTS.has(q[0]) || q[0] === 'phone_crystal_osc')) continue; const a = PHONE_LOOK.at[q[0]]; if (Math.abs(x - a[0]) < q[3][0] / 2 + 1.4 && Math.abs(y - a[1]) < q[3][1] / 2 + 1.4) ok = false; }
    const h = PHONE_LOOK.hole; if (Math.hypot(x - h[0], y - h[1]) < h[2] + 1.2) ok = false; if (Math.abs(x) > 30 || y > 66) ok = false;
  } while (!ok && tries < 40);
  return { x, y, rot: pr() < .5, c: pr() < .6 };
}
/* the battery's pouch: crinkled aluminium foil, a sealed border, a plain label (no brand). bump = the wrinkles only. */
function phonePouchTex(bump) {
  const W = 512, H = 640;
  return TL.tex('real:pouch:' + (bump ? 'b' : 'a'), W, H, (g) => {
    const r = rng(23);
    g.fillStyle = bump ? '#808080' : '#a4a8ae'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, l = 20 + r() * 110, w = .6 + r() * 1.6; g.strokeStyle = bump ? (r() < .5 ? '#a8a8a8' : '#585858') : (r() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(40,44,52,.14)'); g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l / 2 + r() * 8, y + Math.sin(a) * l / 2 + r() * 8, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    g.fillStyle = bump ? '#707070' : '#8c9097'; g.fillRect(0, 0, W, 34); g.fillRect(0, H - 22, W, 22); g.fillRect(0, 0, 22, H); g.fillRect(W - 22, 0, 22, H);   // the sealed edge
    if (!bump) { g.fillStyle = '#dcdcd6'; g.fillRect(70, 150, W - 140, 270); g.fillStyle = '#2a2a2e'; g.textAlign = 'center'; g.font = '600 34px Inter, system-ui, sans-serif'; g.fillText('Li-ion polymer cell', W / 2, 220); g.font = '500 28px Inter, system-ui, sans-serif'; g.fillText('3.85 V   about 17 Wh', W / 2, 270); g.fillText('(model of a pouch)', W / 2, 320); g.fillStyle = '#2a2a2e'; for (let i = 0; i < 38; i++) g.fillRect(110 + i * 8, 360, 3 + (i * 7 % 3), 36); }
  }, !bump, false);
}
function phoneLook(F, layer) {
  const W = PHONE.w, H = PHONE.h, D = PHONE.d, T = TL.mat, C = TL.C;
  const alu = T('alu', C.alu.clone().multiplyScalar(.85)); alu.roughness = .5;
  const frame = tearPart(F, TL.slab(W, H, D, 9, .6, 1.2), 0, 'smartphone', 'Smartphone', new V3(), { pri: .5, mat: alu, text: 'A pocket computer, radio and camera.' });
  frame.userData.shell = true; layer(frame, 0);
  const bk = T('blackglass', new THREE.Color().setRGB(.03, .034, .04)); bk.roughness = .3;
  const back = tearPart(F, TL.slab(W - 1, H - 1, .7, 8.5, .25), 0, null, '', new V3(0, 0, -3.6), { mat: bk }); layer(back, -14);
  const disp = tearPart(F, TL.slab(W - 2, H - 2, 1.2, 8, .2), 0, 'phone_display', 'Display', new V3(0, 0, 3.1), { mat: T('polymer', C.black), text: 'An OLED panel: every pixel is three tiny light-emitting diodes.' }); layer(disp, 9);
  const scr = phoneScreenTex(); F._scr = scr;
  const fm = new THREE.MeshPhysicalMaterial({ color: C.black, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 1.2, metalness: 0 }); LOOK.dress(fm, 'blackglass'); fm.clearcoat = 1; fm.clearcoatRoughness = .03; opaqueUnlessFading(fm);
  const fg = TL.uvXY(new THREE.ShapeGeometry(rrectShape(W - 5, H - 5, 5.5), 12), -(W - 5) / 2, -(H - 5) / 2, W - 5, H - 5);
  const face = new THREE.Mesh(fg, fm); face.position.z = .62; disp.add(face);
  const gm = T('blackglass', 0xffffff); gm.roughness = .03; gm.opacity = .1;
  const glass = tearPart(F, TL.slab(W - 3, H - 3, .5, 7.5, .2), 0, 'phone_touchscreen', 'Touchscreen glass', new V3(0, 0, 3.95), { mat: gm, text: 'A transparent grid of electrodes senses your finger by the change in capacitance.' }); layer(glass, 15);
  [-1, 1].forEach((sy, i) => { const y = sy * (H / 2 - 12), bg = TL.boxes([[2.46, .8, D - 2.8, -(W / 2 - 1.2), 0, 0], [2.46, .8, D - 2.8, W / 2 - 1.2, 0, 0]]); const a = tearPart(F, bg, 0, i ? 'phone_antenna' : null, 'Antenna gaps', new V3(0, y, 0), { mat: T('polymer', new THREE.Color().setRGB(.3, .31, .32)), text: 'Parts of the metal frame are the antennas, separated by plastic gaps.' }); layer(a, 0); });
  const plate = tearPart(F, TL.slab(65.5, 144, .6, 8, .15), 0, null, '', new V3(0, 0, -2.7), { mat: T('alu', C.alu.clone().multiplyScalar(.55)) }); plate.userData.main.material.roughness = .5; layer(plate, -8);
  PHONE_PARTS.forEach(([id, name, p0, s, col, z, text]) => {
    const p = PHONE_LOOK.at[id] || p0; let geo, mat, extra = null;
    if (id === 'phone_battery') {
      geo = TL.uvXY(TL.slab(s[0], s[1], s[2], 3, .5), -s[0] / 2, -s[1] / 2, s[0], s[1]); mat = T('alu', 0xffffff, { map: phonePouchTex(false) }); mat.roughness = .55;
      if (LOOK.quality !== 'low') { mat.bumpMap = phonePouchTex(true); mat.bumpScale = 1.6; mat.needsUpdate = true; }
    }
    else if (id === 'phone_pcb') {
      const sh = rrectShape(64, 52, .1); const hp = new THREE.Path(); hp.absarc(PHONE_LOOK.hole[0] - PHONE_LOOK.pcb[0], PHONE_LOOK.hole[1] - PHONE_LOOK.pcb[1], PHONE_LOOK.hole[2], 0, Math.PI * 2, true); sh.holes.push(hp);
      geo = TL.uvXY(new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, -.5), -32, -26, 64, 52);
      const b = phoneBoardTex(); mat = T('mask', 0xffffff, { map: b.map }); if (b.rm) { mat.roughnessMap = b.rm; mat.metalnessMap = b.rm; mat.roughness = 1; mat.metalness = 1; mat.bumpMap = b.bump; mat.bumpScale = 1.2; mat.needsUpdate = true; }
    }
    else if (id === 'phone_camera') { geo = new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[2], 40).rotateX(Math.PI / 2); mat = T('alu', C.steel.clone().multiplyScalar(.35)); extra = 'lens'; }
    else if (id === 'phone_speaker') { geo = TL.chip(s[0], s[1], s[2]); mat = T('polymer', C.black); }
    else if (id === 'phone_charger_port') { geo = TL.slab(s[0], s[1], s[2], 1.4, .3); mat = T('steel', C.steel); }
    else if (id === 'phone_vibration_motor') { geo = TL.slab(s[0], s[1], s[2], 2.6, .4); mat = T('steel', C.steel); }
    else if (id === 'phone_crystal_osc') { geo = TL.chip(s[0], s[1], s[2]); mat = T('steel', C.nickel); }
    else { geo = TL.chip(s[0], s[1], s[2]); const v = { phone_rf_frontend: .1, phone_sensors: .12 }[id] || .05; mat = T('mold', new THREE.Color().setRGB(v, v, v * 1.05)); mat.roughness = .5; }
    const g = tearPart(F, geo, 0, id, name, new V3(...p), { mat, text, r: Math.max(...s) / 2, madeOf: SILICON_PARTS.has(id) ? 'silicon' : id === 'phone_crystal_osc' ? 'crystal' : null });
    if (extra === 'lens') { const lg = new THREE.CircleGeometry(s[0] / 2 - 1.6, 40).rotateY(Math.PI), lm = new THREE.MeshPhysicalMaterial({ color: C.black, clearcoat: 1, clearcoatRoughness: 0 }); LOOK.dress(lm, 'blackglass'); lm.clearcoat = 1; lm.clearcoatRoughness = 0; opaqueUnlessFading(lm); const l = new THREE.Mesh(lg, lm); l.position.z = -s[2] / 2 - .02; g.add(l); }
    layer(g, z);
    if (id !== 'phone_soc') tearReg(id, F, new V3(p[0], p[1], p[2] + z), Math.max(...s) * 4e-3);
    if (PHONE_LABELS[id]) { const L = F.label(g, PHONE_LABELS[id], { offset: new V3(0, id === 'phone_soc' ? s[1] / 2 + 1 : 0, id === 'phone_soc' ? 4 : s[2] / 2 + 1) }); L.minSizeFn = () => cam.A === F && (F.exK || 0) > .5; }
  });
  const pr = rng(7), body = new THREE.BoxGeometry(.64, .5, .5), ends = TL.boxes([[.18, .5, .5, -.41, 0, 0], [.18, .5, .5, .41, 0, 0]]);
  const pas = new THREE.InstancedMesh(body, T('ceramic', 0xffffff), 220), pe = new THREE.InstancedMesh(ends, T('solder', C.solder), 220), m4 = new THREE.Matrix4(), cr = C.ceramic, bl = C.black;
  for (let i = 0; i < 220; i++) { const f = phoneLookPassive(pr); m4.makeRotationZ(f.rot ? Math.PI / 2 : 0).setPosition(f.x, f.y, PHONE_LOOK.pcbTop + .25); pas.setMatrixAt(i, m4); pe.setMatrixAt(i, m4); pas.setColorAt(i, f.c ? cr : bl); }
  pas.userData = { id: 'phone_passives', node: NODE.phone_passives ? 'phone_passives' : null, priority: 1.5, info: partInfo('phone_passives', 'Passive components', 'Around a thousand tiny capacitors and resistors; the smallest are 0.4 × 0.2 mm (0201 parts are smaller still).') };
  layer(pas, 1); layer(pe, 1); F.add(pas); F.add(pe); F.pickables.push(pas); regMesh('phone_passives', pas);
  /* the cheap pieces that make it read as a teardown: two stamped shield cans, a flex ribbon on the battery, four screws in the board's holes (positions illustrative) */
  [[-8, 31, 10, 8], [14, 44, 10, 8]].forEach(([x, y, w, h]) => layer(tearPart(F, TL.slab(w, h, 1.3, .8, .25), 0, null, '', new V3(x, y, -.7), { mat: T('steel', new THREE.Color().setRGB(.62, .64, .67)) }), 1));
  const fx = tearPart(F, TL.boxes([[5, 56, .18, 0, 0, 0]]), 0, null, '', new V3(13, -16, 2.4), { mat: T('polymer', new THREE.Color().setRGB(.55, .3, .06)) }); fx.userData.main.material.roughness = .4; layer(fx, -6);
  const sc = [[-29, 65], [29, 65], [-29, 19], [29, 19]], sh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.05, 1.05, .45, 20).rotateX(Math.PI / 2), T('steel', C.steel), 4), sl = new THREE.InstancedMesh(TL.boxes([[1.5, .25, .1, 0, 0, 0], [.25, 1.5, .1, 0, 0, 0]]), T('mold', C.black), 4);
  sc.forEach(([x, y], i) => { m4.makeTranslation(x, y, -1.2); sh.setMatrixAt(i, m4); m4.makeTranslation(x, y, -.95); sl.setMatrixAt(i, m4); });
  layer(sh, 0); layer(sl, 0); F.add(sh, sl);
  [disp, glass].forEach(o => o.traverse(m => { if (m.material) m.userData.op0 = m.material.opacity; }));   // the fade is relative to these
  return { frame, back, disp, glass };
}
FT.phone = {
  build(F) {
    F.device = true; F.illo = true; tearLights(F); F.env = { bg: LOOK.on ? 0x0a0a0b : 0x0b1018, opaque: false };   // opaque only while the camera is in a thing inside the phone (below): then the hand is not drawn behind it
    F.blurb = 'Your phone, at true size. Zoom in and it opens up; click any part. Aim at the processor chip and keep zooming to reach a single transistor.';
    F.note = 'The outer size is a current flagship phone. The layout of the parts inside is illustrative: real phones differ in where each part sits.';
    const exp = new THREE.Group(); F.add(exp); F.layers = [];
    const layer = (obj, z) => { obj.userData.zz = z; obj.userData.z0 = obj.position.z; F.layers.push(obj); };
    // shell: frame + back glass + display + cover glass
    let frame, back, disp, glass;
    if (LOOK.on) ({ frame, back, disp, glass } = phoneLook(F, layer));
    else {
    frame = tearPart(F, slab(PHONE.w, PHONE.h, PHONE.d, 9), 0x8f96a3, 'smartphone', 'Smartphone', new V3(), { pri: .5, text: 'A pocket computer, radio and camera.' });
    frame.userData.main.material.opacity = 1; frame.userData.shell = true; layer(frame, 0);
    back = tearPart(F, slab(PHONE.w - 1, PHONE.h - 1, .7, 8.5), 0x4b5a70, null, '', new V3(0, 0, -3.6)); layer(back, -14);
    disp = tearPart(F, slab(PHONE.w - 2, PHONE.h - 2, 1.2, 8), 0x0d1118, 'phone_display', 'Display', new V3(0, 0, 3.1), { text: 'An OLED panel: every pixel is three tiny light-emitting diodes.' }); layer(disp, 9);
    const scr = canvasTex('homescreen', 256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#203a6b'); gr.addColorStop(1, '#6a3b7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const cols = ['#ffd166', '#6ee7ff', '#ff8fb1', '#9be37b', '#b388ff', '#ffa94d']; for (let i = 0; i < 20; i++) { g.fillStyle = cols[i % 6]; const x = 24 + (i % 4) * 56, y = 90 + Math.floor(i / 4) * 64; g.beginPath(); g.roundRect ? g.roundRect(x, y, 40, 40, 10) : g.rect(x, y, 40, 40); g.fill(); } g.fillStyle = '#fff'; g.font = '600 34px Inter, sans-serif'; g.fillText('12:00', 80, 60); });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.w - 5, PHONE.h - 5), new THREE.MeshBasicMaterial({ map: scr, transparent: true })); face.position.z = .62; disp.add(face);
    glass = tearPart(F, slab(PHONE.w - 1, PHONE.h - 1, .6, 8.5), 0xa9d6ff, 'phone_touchscreen', 'Touchscreen glass', new V3(0, 0, 3.9), { opacity: .18, outline: true, text: 'A transparent grid of electrodes senses your finger by the change in capacitance.' }); layer(glass, 15);
    // antenna bands in the metal frame
    [[-PHONE.h / 2 + 12], [PHONE.h / 2 - 12]].forEach(([y], i) => { const a = tearPart(F, new THREE.BoxGeometry(PHONE.w + .3, 1.2, PHONE.d + .2), 0xe0e0e0, i ? 'phone_antenna' : null, 'Antenna gaps', new V3(0, y, 0), { text: 'Parts of the metal frame are the antennas, separated by plastic gaps.' }); layer(a, 0); });
    PHONE_PARTS.forEach(([id, name, p, s, col, z, text]) => {
      const geo = id === 'phone_battery' ? slab(s[0], s[1], s[2], 3) : id === 'phone_camera' ? new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[2], 32).rotateX(Math.PI / 2) : new THREE.BoxGeometry(...s);
      const g = tearPart(F, geo, col, id, name, new V3(...p), { text, r: Math.max(...s) / 2, madeOf: SILICON_PARTS.has(id) ? 'silicon' : id === 'phone_crystal_osc' ? 'crystal' : null }); layer(g, z);
      if (id !== 'phone_soc') tearReg(id, F, new V3(p[0], p[1], p[2] + z), Math.max(...s) * 4e-3);
      if (PHONE_LABELS[id]) { const L = F.label(g, PHONE_LABELS[id], { offset: new V3(0, 0, s[2] / 2 + 1) }); L.minSizeFn = () => cam.A === F && (F.exK || 0) > .5; } // names appear when the phone is opened up
    });
    // passives: tiny 0402/0201 capacitors & resistors sprinkled on the board
    const pr = rng(7), pas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .5, .5), illoMat(0xb08850), 220), m4 = new THREE.Matrix4();
    for (let i = 0; i < 220; i++) { let x, y; do { x = (pr() - .5) * 60; y = 18 + pr() * 48; } while (Math.abs(x) < 9 && Math.abs(y - 46) < 9); m4.makeRotationZ(pr() < .5 ? 0 : Math.PI / 2).setPosition(x, y, .75); pas.setMatrixAt(i, m4); pas.setColorAt(i, new THREE.Color(pr() < .6 ? 0xb08850 : 0x222222)); }
    pas.userData = { id: 'phone_passives', node: NODE.phone_passives ? 'phone_passives' : null, priority: 1.5, info: partInfo('phone_passives', 'Passive components', 'Around a thousand tiny capacitors and resistors; the smallest are 0.4 × 0.2 mm (0201 parts are smaller still).') }; layer(pas, 1); F.add(pas); F.pickables.push(pas); regMesh('phone_passives', pas);
    }
    tearReg('smartphone', F, new V3(), .25);
    const ex = { mode: 'auto', k: 0 };
    const sg = seg([['auto', 'Auto'], ['closed', 'Closed'], ['open', 'Exploded']], 'auto', k => ex.mode = k);
    /* a result that targets a part inside the phone (search, a chip, "Show where it is"): open the phone and highlight the part while its card is open */
    F.cutOpen = (h, peek) => { if ((F.exK || 0) > .5 || ex.mode === 'open') return false; if (!peek) F.showPart(h.id, (h.obj.userData.node || h.id)); return 'cut'; };   // a double click on a part (or "Look inside"): the phone opens to that part; with it open, the next level down (the processor die under the chip, silicon)
    F.showPart = (id, card) => { ex.mode = 'open'; sg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === 'open')); F.selId = id; F.selCard = card || id; F._selObj = null; };
    F.update = (dt) => {
      if (F.selId) { const sel = infoState && infoState.node === F.selCard ? (F.pickables.find(o => o.userData.id === F.selId) || null) : null; if (sel !== F._selObj) { setHighlight(F._selObj, false); setHighlight(sel, true); F._selObj = sel; if (!sel) F.selId = null; } }
      /* A thing that lives inside the phone (the cell that takes the battery's place: data/things/index.json, `in: "phone"`) can only be seen with the phone
         opened up: on Auto the phone opens while the camera is in such a thing, or on a flight to it. */
      const inside = typeof FR !== 'undefined' ? (FR.things || []).filter(f => f.parent === F) : [], inner = inside.some(f => frameWithin(cam.A, f) || (fly && fly.frame && frameWithin(fly.frame, f)));
      const want = ex.mode === 'open' || inner ? 1 : ex.mode === 'closed' ? 0 : 1 - smooth(.09, .32, cam.D);
      /* ...and while the camera is in that thing, it is the subject: the rest of the phone goes faint and cannot be clicked, and the hand behind the phone is not
         drawn (the same getting-out-of-the-way that the park's things do for one another). inK eases between the two states. */
      ex.inK = (ex.inK || 0) + ((frameWithin(cam.A, F) && inside.some(f => frameWithin(cam.A, f)) ? 1 : 0) - (ex.inK || 0)) * Math.min(1, dt * 3); if (ex.inK < .002) ex.inK = 0; F.inK = ex.inK; F.env.opaque = ex.inK > .5;
      ex.k += (want - ex.k) * Math.min(1, dt * 4); F.exK = ex.k;
      F.layers.forEach(o => { o.position.z = o.userData.z0 + o.userData.zz * ex.k * 2.6; });
      frame.userData.main.material.opacity = LOOK.on ? 1 : 1 - .85 * ex.k; frame.userData.main.material.depthWrite = LOOK.on || ex.k < .5;
      frame.userData.noPick = disp.userData.noPick = glass.userData.noPick = ex.k > .5;   // opened up, the shell, the display and the glass are ghosts: a click goes through them to the part behind (and to a thing that stands inside the phone, which is picked by the nearest surface)
      [disp, glass].forEach(o => { o.visible = ex.k < .97; o.traverse(m => { if (m.material && m.material.opacity !== undefined && !m.userData.outline) { if (m.userData.op0 === undefined) m.userData.op0 = m.material.opacity; m.material.opacity = m.userData.op0 * (1 - ex.k); m.material.transparent = true; } }); });
      back.userData.main.material.opacity = LOOK.on ? 1 : 1 - .7 * ex.k;
      if (F._scr) { const sd = F._scr.userData, mn = Math.floor(simTime / 6e4), nw = performance.now(); if (mn !== sd.min && nw - sd.at > 1000 && (cam.A === F || (F.exK || 0) > 0)) { sd.min = mn; sd.at = nw; sd.redraw(); F._scr.needsUpdate = true; } }   // the made-up screen shows the world's own clock
      if (ex.inK > 0 || F._inWas) {
        const g = 1 - .94 * ex.inK, dyn = [frame, back, disp, glass]; F._inWas = ex.inK > 0;
        F.layers.forEach(o => {
          if (inside.some(f => f.proxy === o)) return;   // the part a thing stands in for is hidden by the engine while the thing is shown
          const isDyn = dyn.includes(o);
          o.traverse(m => { const mt = m.material; if (!mt) return; const u = mt.uniforms && mt.uniforms.uOpacity; if (u) { if (m.userData.inU === undefined) m.userData.inU = u.value; u.value = m.userData.inU * g; } else if (mt.opacity !== undefined) { if (isDyn) { mt.opacity *= g; if (g <= .5) mt.depthWrite = false; } else { if (m.userData.inOp === undefined) { m.userData.inOp = mt.opacity; m.userData.inDw = mt.depthWrite; } mt.opacity = m.userData.inOp * g; mt.depthWrite = g > .5 ? m.userData.inDw : false; } } });
          if (!isDyn || o === back) o.userData.noPick = ex.inK > .5;
        });
        frame.userData.noPick = disp.userData.noPick = glass.userData.noPick = ex.k > .5 || ex.inK > .5;
      }
    };
  }
};

/* ---------- 2. the SoC die (unit µm) ---------- */
const DIE = { w: 10500, h: 9800 };
const DIE_BLOCKS = [ // id, name, center µm, size µm, color, texture kind, text
  ['soc_cpu_cluster', 'CPU cluster', [-2600, 1900], [4200, 3400], 0x4f7cc9, 'logic', 'Two big performance cores and four efficiency cores, with their shared cache.'],
  ['soc_gpu', 'GPU', [2700, 2100], [4200, 3600], 0x45a77a, 'logic', 'Many simple parallel units (hundreds to thousands, depending on the chip) for graphics and maths.'],
  ['soc_npu', 'Neural engine (NPU)', [2700, -1500], [3600, 2600], 0x9b6bd6, 'logic', 'Arrays of multiply-add units for running neural networks.'],
  ['soc_cache', 'System cache (SRAM)', [-2600, -1300], [4200, 2200], 0xc9a24f, 'sram', 'Shared on-chip memory: hundreds of millions of 6-transistor SRAM cells (billions of transistors).'],
  ['soc_isp', 'Image signal processor', [-2600, -3600], [4200, 1600], 0xd9774a, 'logic', 'Turns raw sensor data into a photo: demosaic, denoise, HDR.'],
  ['soc_memory_controller', 'Memory controllers & PHY', [2700, -3750], [4200, 1300], 0x8a8f99, 'io', 'Talks to the RAM stacked above at billions of transfers per second.'],
  ['soc_interconnect', 'On-chip interconnect', [0, 0], [600, 9000], 0x6ee7ff, 'bus', 'The network-on-chip linking every block.'],
];
FT.die = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: LOOK.on ? 0x0a0a0b : 0x0b1018, opaque: true }; tearLights(F);
    F.blurb = 'The processor die: about 10 × 10 mm of silicon holding roughly 15–20 billion transistors. Each coloured block is a different kind of engine.';
    F.note = 'Illustrative floorplan, not a real chip. The kinds of block are real; their sizes and positions are schematic, because chip makers do not publish theirs.';
    F.floorD = 1e-5;
    const base = tearPart(F, LOOK.on ? TL.boxUV(DIE.w, DIE.h, 300, 1400) : new THREE.BoxGeometry(DIE.w, DIE.h, 300), 0x5a6170, 'phone_soc', 'Silicon die', new V3(0, 0, -150), { pri: .3, r: 7000, mat: LOOK.on ? TL.dieMat('fill') : undefined });
    if (!LOOK.on) base.userData.main.material.map = gridTex('die_base', '#5a6170', '#6b7383', 64);
    const blk = []; if (LOOK.on) F._lkKeyI = 1.7;   // a die is photographed in bright field: the lamp is nearly at the lens and strong
    const tex = { logic: gridTex('blk_logic', '#ffffff', 'rgba(0,0,0,.18)', 48, { dots: 'rgba(0,0,0,.25)' }), sram: gridTex('blk_sram', '#ffffff', 'rgba(0,0,0,.35)', 32, { lw: 2 }), io: gridTex('blk_io', '#ffffff', 'rgba(0,0,0,.4)', 16, { cols: true, lw: 3 }), bus: gridTex('blk_bus', '#ffffff', 'rgba(0,0,0,.3)', 8, { cols: true }) };
    DIE_BLOCKS.forEach(([id, name, c, s, col, tk, text]) => {
      const g = tearPart(F, LOOK.on ? TL.boxUV(s[0], s[1], 6, 700) : new THREE.BoxGeometry(s[0], s[1], 60), col, id, name, new V3(c[0], c[1], LOOK.on ? 3 : 30), { text, r: Math.max(...s) / 2, mat: LOOK.on ? TL.dieMat(tk) : undefined });
      if (LOOK.on) blk.push([g.userData.main.material, col]); else g.userData.main.material.map = tex[tk]; F.label(g, NODE[id] ? NODE[id].title : name, { offset: new V3(0, id === 'soc_cpu_cluster' ? -s[1] / 2 + 250 : s[1] / 2 - 300, 60) });
      tearReg(id, F, new V3(c[0], c[1], 30), Math.max(...s) * 2.2e-6);
    });
    // CPU cluster sub-blocks: 2 big cores + 4 small cores + L2
    [[-3500, 2700, 1500, 1100, 'Performance core'], [-1700, 2700, 1500, 1100, 'Performance core'], [-3900, 900, 700, 600, 'Efficiency core'], [-3100, 900, 700, 600, 'Efficiency core'], [-2300, 900, 700, 600, 'Efficiency core'], [-1500, 900, 700, 600, 'Efficiency core']].forEach(([x, y, w, h, nm], i) => {
      const g = tearPart(F, LOOK.on ? TL.boxUV(w, h, 4, 700) : new THREE.BoxGeometry(w, h, 40), i < 2 ? 0x7aa2e8 : 0x9bb8ee, 'cpu_core', nm, new V3(x, y, LOOK.on ? 8 : 80), { text: 'One processor core.', r: w / 2, mat: LOOK.on ? TL.dieMat('logic') : undefined });
      if (LOOK.on) blk.push([g.userData.main.material, i < 2 ? 0x7aa2e8 : 0x9bb8ee]); else g.userData.main.material.map = tex.logic; g.userData.zoomTo = () => { flyTo(FR.core, new V3(), 3e-3); }; if (i === 0) F.label(g, nm, { offset: new V3(0, h / 2, 40) });
    });
    if (LOOK.on) {   // a seal ring of copper inside the edge (a phone processor is flip-chip: no bond wires), a studio floor with the die's contact shadow
      const m = new THREE.Mesh(TL.boxes([[DIE.w - 200, 40, 12, 0, DIE.h / 2 - 120, 6], [DIE.w - 200, 40, 12, 0, -DIE.h / 2 + 120, 6], [40, DIE.h - 200, 12, DIE.w / 2 - 120, 0, 6], [40, DIE.h - 200, 12, -DIE.w / 2 + 120, 0, 6]]), TL.mat('copper', TL.C.copper)); F.add(m);
      TL.ground(F, 70000, -302, DIE.w, DIE.h); const note0 = 'A model of a processor die, about 10 mm across, seen from its wiring side as under a microscope. The kinds of block are real; their sizes and places are invented. The pattern is generated, not a photograph; the faint tints stand for what thin glassy layers do to light.'; F.note = note0;
      F.blurb = 'The processor die: about 10 × 10 mm of silicon holding roughly 15–20 billion transistors. Its blocks are different kinds of engine: processor cores, graphics, a neural engine, memory and the wiring between them.';
      seg([['photo', 'Microscope look'], ['kind', 'Colour the blocks']], 'photo', k => { blk.forEach(([m, hex]) => m.color.copy(k === 'kind' ? TL.lin(hex) : new THREE.Color(1, 1, 1))); F.note = k === 'kind' ? 'Colours mark the kinds of block. A real chip is not coloured like this. The floorplan is invented.' : note0; });
    }
    // bond / bump ring
    if (!LOOK.on) {
    const ring = new THREE.InstancedMesh(new THREE.CylinderGeometry(60, 60, 40, 10).rotateX(Math.PI / 2), illoMat(0xd9b45a), 160); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 160; i++) { const t = i / 160 * 4, side = Math.floor(t), f = t - side; const x = side === 0 ? -DIE.w / 2 + f * DIE.w : side === 1 ? DIE.w / 2 : side === 2 ? DIE.w / 2 - f * DIE.w : -DIE.w / 2; const y = side === 0 ? -DIE.h / 2 : side === 1 ? -DIE.h / 2 + f * DIE.h : side === 2 ? DIE.h / 2 : DIE.h / 2 - f * DIE.h; m4.makeTranslation(x * .97, y * .97, 20); ring.setMatrixAt(i, m4); }
    F.add(ring);
    }
    tearReg('phone_soc', F, new V3(), .02);
  }
};

/* ---------- 3. one CPU core (unit µm) ---------- */
const CORE_BLOCKS = [
  ['core_fetch', 'Instruction fetch & L1 instruction cache', [-480, 300], [520, 380], 0x5aa2d9, 'sram', 'Fetches the next instructions from the L1 instruction cache.'],
  ['core_branch_predictor', 'Branch predictor', [-480, -10], [520, 200], 0xe0a64a, 'logic', 'Guesses which way each "if" will go, so the pipeline never waits.'],
  ['core_decode', 'Decode & rename', [-10, 300], [380, 380], 0x8c6bd6, 'logic', 'Turns instructions into micro-operations and renames registers.'],
  ['core_registers', 'Register file', [-10, -30], [380, 260], 0xd9574a, 'sram', 'The core\'s fastest storage: 31 programmer-visible 64-bit registers, backed by a few hundred physical ones.'],
  ['core_alu', 'Execution units (ALUs)', [420, 200], [420, 560], 0x45a77a, 'logic', 'Integer and floating-point units that add, multiply and compare.'],
  ['core_l1_cache', 'L1 data cache', [180, -330], [820, 260], 0xc9a24f, 'sram', 'A few hundred KB of the fastest memory, ~1 ns away.'],
];
FT.core = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: LOOK.on ? 0x0a0a0b : 0x0b1018, opaque: true }; tearLights(F);
    F.blurb = 'One performance core, drawn about 1.5 × 1.1 mm. Watch instructions flow through the pipeline: fetch, decode, execute, write back, billions of times a second.';
    F.note = 'Illustrative layout: the stages are real, but the blocks\' sizes and places are schematic. The glowing squares are a cartoon of instructions in flight.';
    F.floorD = 2e-6;
    const base = tearPart(F, LOOK.on ? TL.boxUV(1500, 1100, 40, 150) : new THREE.BoxGeometry(1500, 1100, 40), 0x3c4558, 'cpu_core', 'CPU core', new V3(0, 0, -20), { pri: .3, r: 900, mat: LOOK.on ? TL.dieMat('fill') : undefined });
    if (LOOK.on) { F._lkKeyI = 1.7; TL.ground(F, 9000, -42, 1500, 1100); F.note = 'A model of one processor core. The layout is invented. The moving squares are markers for instructions: nothing you could see.'; }
    const tex = { logic: gridTex('blk_logic', '#ffffff', 'rgba(0,0,0,.18)', 48, { dots: 'rgba(0,0,0,.25)' }), sram: gridTex('blk_sram', '#ffffff', 'rgba(0,0,0,.35)', 32, { lw: 2 }) };
    CORE_BLOCKS.forEach(([id, name, c, s, col, tk, text]) => {
      const g = tearPart(F, LOOK.on ? TL.boxUV(s[0], s[1], 6, 150) : new THREE.BoxGeometry(s[0], s[1], 12), col, id, name, new V3(c[0], c[1], LOOK.on ? 3 : 6), { text, r: Math.max(...s) / 2, mat: LOOK.on ? TL.dieMat(tk) : undefined }); if (!LOOK.on) g.userData.main.material.map = tex[tk]; if (id === 'core_alu') g.userData.zoomTo = () => { flyTo(FR.cells, new V3(), 6e-6); };
      F.label(g, NODE[id] ? NODE[id].title : name, { offset: new V3(0, s[1] / 2 - 40, 12) }); tearReg(id, F, new V3(c[0], c[1], 6), Math.max(...s) * 2.4e-6);
    });
    // the pipeline: glowing instruction tokens hopping between stages
    const path = [new V3(-480, 300, LOOK.on ? 9 : 20), new V3(-10, 300, LOOK.on ? 9 : 20), new V3(-10, -30, LOOK.on ? 9 : 20), new V3(420, 200, LOOK.on ? 9 : 20), new V3(180, -330, LOOK.on ? 9 : 20), new V3(-10, -30, LOOK.on ? 9 : 20)];
    const toks = [...Array(6)].map((_, i) => { const col = [0xffd166, 0x6ee7ff, 0xff8fb1, 0x9be37b, 0xb388ff, 0xffa94d][i], t = LOOK.on ? TL.part(new THREE.BoxGeometry(40, 40, 6), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })) : inked(new THREE.BoxGeometry(40, 40, 20), col); if (LOOK.on) t.userData.marker = true; F.add(t); return t; });
    const pl = new THREE.Group(); pl.userData = { id: 'core_pipeline', node: NODE.core_pipeline ? 'core_pipeline' : null, priority: 2.5, info: partInfo('core_pipeline', 'Pipeline', 'Instructions move through stages like an assembly line; several are in flight at once.') }; toks.forEach(t => pl.attach(t)); F.add(pl); F.pickables.push(pl); regMesh('core_pipeline', pl);
    F.label(toks[0], 'Instructions in the pipeline', { offset: new V3(0, 40, 0) });
    F.update = (dt, t) => { tearAttract(F, dt, new V3(420, 200, 14), 1e-4, 330); toks.forEach((k, i) => { const u = (t * .6 + i / toks.length) % 1 * (path.length - 1), a = Math.floor(u), f = smooth(0, 1, (u - a) * 1.6 - .3); k.position.lerpVectors(path[a], path[a + 1], f); }); };
    tearReg('cpu_core', F, new V3(), 2.6e-3); tearReg('core_pipeline', F, new V3(), 2.6e-3);
  }
};

/* ---------- 4. standard cells (unit nm) ---------- */
const CELL_H = 190; // nm, drawn row height; published analyst measurements of a 5 nm-class library give about 175-210 nm
/* The logic cells under the look: plain clay blocks in one mesh (their kinds are not shown), copper rails and wires in one mesh each, vias down to the cells, on a
   silicon slab on a studio floor. Same random draws as the flat drawing, so the layout is the same. */
function cellsLook(F, r, rows, W, cols) {
  const C = TL.C, T = TL.mat, tint = cols.map(h => TL.lin(h)), cells = [], RH = rows * CELL_H; let hl0 = null;
  F.note = 'A model, far too small to see with light: each row is about 190 nm tall, less than the wavelength of visible light. The cells are drawn as plain blocks; the wires are drawn in copper, the metal they are made of. The amber group stands for an adder.';
  const sub = tearPart(F, new THREE.BoxGeometry(W + 300, RH + 300, 60), 0, null, '', new V3(0, 0, -30), { mat: T('silicon', C.silicon) }); sub.userData.main.material.roughness = .35;
  TL.ground(F, 20000, -62, W + 300, RH + 300);
  for (let y = 0; y < rows; y++) {
    let x = -W / 2;
    while (x < W / 2) {
      const w = Math.min(W / 2 - x, 40 + Math.floor(r() * 8) * 48), hl = y === 7 && x > -300 && x < 300, c = hl ? null : tint[Math.floor(r() * 6)], cy = (y - rows / 2) * CELL_H;
      if (hl) { const am = T('clay', new THREE.Color().setRGB(.75, .5, .12)), g = tearPart(F, new THREE.BoxGeometry(w - 6, CELL_H - 10, 20), 0, 'logic_adder', 'Full adder', new V3(x + w / 2, cy, 10), { mat: am, pri: 3, text: 'A standard cell is a small pre-designed logic gate (an inverter, NAND, NOR, flip-flop and so on) made of a few transistors, chosen from a library of hundreds. In this schematic picture the kind of gate is not shown.' }); if (!hl0) hl0 = g; }
      else { const j = .93 + tint.indexOf(c) * .028; cells.push([w - 6, CELL_H - 10, 20, x + w / 2, cy, 10, C.clay.clone().multiplyScalar(j)]); }   // one clay value with a slight jitter: the kinds of cell are not shown
      x += w;
    }
  }
  const cm = T('clay', 0xffffff, { vertexColors: true }); cm.userData.noHL = true;
  const cg = tearPart(F, TL.boxes(cells, .62), 0, 'logic_cell', 'Standard cell (logic gate)', new V3(), { mat: cm, pri: 1.5, r: W / 2, text: 'A standard cell is a small pre-designed logic gate (an inverter, NAND, NOR, flip-flop and so on) made of a few transistors, chosen from a library of hundreds. In this schematic picture the kind of gate is not shown.' });
  cg.userData.zoomTo = () => { message('The simplest cell is an inverter: here is one.'); flyTo(FR.inv, new V3(), 6e-7); };
  const rails = []; for (let y = 0; y < rows; y++) rails.push([W, 14, 24, 0, (y - rows / 2 - .5) * CELL_H, 30]);
  F.add(new THREE.Mesh(TL.boxes(rails, .7), T('copper', C.copper, { vertexColors: true })));
  const wl = [], via = [], wires = new THREE.Group(); F.add(wires);
  for (let i = 0; i < 60; i++) {
    const vert = i % 2, len = 200 + r() * 1400, mx = (r() - .5) * (W - 40), my = (r() - .5) * (RH - 40), hl2 = Math.min(len / 2, vert ? RH / 2 - Math.abs(my) : W / 2 - Math.abs(mx)), L = hl2 * 2, z = 60 + vert * 30;
    wl.push([vert ? 18 : L, vert ? L : 18, 16, mx, my, z]);
    for (const e of [-1, 1]) { const vx = vert ? mx : mx + e * (L / 2 - 9), vy = vert ? my + e * (L / 2 - 9) : my; via.push([14, 14, z - 8 - 20, vx, vy, 20 + (z - 8 - 20) / 2]); }
  }
  wires.add(new THREE.Mesh(TL.boxes(wl, .8), T('copper', C.copper, { vertexColors: true })), new THREE.Mesh(TL.boxes(via, .6), T('copper', C.copper, { vertexColors: true })));
  wires.userData = { id: 'metal_interconnect', info: { title: 'Copper interconnect', tag: 'Wiring', body: '<p>Up to about 15 layers of copper wires connect the gates. The lowest layers are only tens of nanometres wide. The wires drawn here are schematic.</p>' }, priority: .8 }; F.pickables.push(wires);
  return hl0;
}
FT.cells = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: LOOK.on ? 0x0a0a0b : 0x0b1018, opaque: true }; tearLights(F);
    F.blurb = 'Inside the arithmetic unit: rows of standard cells (small logic gates), each about 150–200 nm tall in a current process, wired together by copper above them.';
    F.note = 'Schematic: the cell types, widths, placement and wiring are invented. The yellow group stands for an adder; it is not a real netlist (a one-bit full adder is about 28 transistors).';
    F.floorD = 4e-7; let hlCell = null;
    const r = rng(5), rows = 14, W = 3600;
    const cellCols = [0x4f7cc9, 0x45a77a, 0x9b6bd6, 0xc9a24f, 0xd9774a, 0x5aa2d9];
    if (LOOK.on) hlCell = cellsLook(F, r, rows, W, cellCols);
    else {
    for (let y = 0; y < rows; y++) {
      let x = -W / 2;
      while (x < W / 2) {
        const w = Math.min(W / 2 - x, 40 + Math.floor(r() * 8) * 48); const hl = y === 7 && x > -300 && x < 300;
        const g = tearPart(F, new THREE.BoxGeometry(w - 6, CELL_H - 10, 20), hl ? 0xffd166 : cellCols[Math.floor(r() * 6)], hl ? 'logic_adder' : 'logic_cell', hl ? 'Full adder' : 'Standard cell (logic gate)', new V3(x + w / 2, (y - rows / 2) * CELL_H, 10), { pri: hl ? 3 : 1.5, text: 'A standard cell is a small pre-designed logic gate (an inverter, NAND, NOR, flip-flop and so on) made of a few transistors, chosen from a library of hundreds. In this schematic picture the kind of gate is not shown.' });
        g.userData.main.material.opacity = hl ? 1 : .9; if (hl && !hlCell) hlCell = g; if (!hl) g.userData.zoomTo = () => { message('The simplest cell is an inverter: here is one.'); flyTo(FR.inv, new V3(), 6e-7); }; x += w;
      }
      // power rails
      const rail = tearPart(F, new THREE.BoxGeometry(W, 14, 24), 0xb87333, null, '', new V3(0, (y - rows / 2 - .5) * CELL_H, 30));
    }
    // copper wires on metal layers above
    const wires = new THREE.Group(); F.add(wires);
    for (let i = 0; i < 60; i++) { const vert = i % 2, len = 200 + r() * 1400; const wg = new THREE.BoxGeometry(vert ? 18 : len, vert ? len : 18, 16); const m = new THREE.Mesh(wg, illoMat(vert ? 0x6ee7ff : 0xe39b5c)); m.material.opacity = .75; const mx = (r() - .5) * (W - 40), my = (r() - .5) * (rows * CELL_H - 40), hl2 = Math.min(len / 2, vert ? rows * CELL_H / 2 - Math.abs(my) : W / 2 - Math.abs(mx)); m.scale.set(vert ? 1 : hl2 * 2 / len, vert ? hl2 * 2 / len : 1, 1); m.position.set(mx, my, 60 + vert * 30); wires.add(m); }
    wires.userData = { id: 'metal_interconnect', info: { title: 'Copper interconnect', tag: 'Wiring', body: '<p>Up to about 15 layers of copper wires connect the gates. The lowest layers are only tens of nanometres wide. The wires drawn here are schematic.</p>' }, priority: .8 }; F.pickables.push(wires);
    }
    const lab = new THREE.Object3D(); lab.position.set(0, 0, LOOK.on ? 40 : 60); F.add(lab); F.label(lab, LOOK.on ? 'Amber: stands for an adder' : 'Yellow: stands for an adder', { pick: hlCell });
    tearReg('logic_adder', F, new V3(0, 0, 10), 1.5e-6); tearReg('core_alu', F, new V3(), 6e-6);
    F.update = (dt) => tearAttract(F, dt, new V3(0, 0, 25), 1.6e-6, 900);
  }
};

/* ---------- 5. a CMOS inverter, transistor level (unit nm) ---------- */
FT.inverter = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: LOOK.on ? 0x0a0a0b : 0x0b1018, opaque: true }; tearLights(F, 1.1);
    F.blurb = 'A CMOS inverter, the simplest logic gate: a p-type transistor on top, an n-type one below, sharing one gate. Fins run left to right; the gate crosses them.';
    F.note = 'Simplified: proportions are approximate and real layouts vary by process. Here the inverter is drawn with a plain input gate between two dummy gates.';
    F.floorD = 3e-8;
    const roles = [], IM = LOOK.on ? (kind, col, role) => { const m = TL.mat(kind, col); if (role !== undefined) roles.push([m, col, TL.lin(role)]); return m; } : null;
    const finH = 50, finW = 6, gatePitch = 48, finPitch = 28;
    // substrate + shallow trench isolation
    tearPart(F, new THREE.BoxGeometry(320, 300, 30), 0x6b7383, 'silicon_substrate', 'Silicon substrate', new V3(0, 0, -15), { pri: .3, mat: IM && IM('oxide', LOOK.on ? TL.C.oxide.clone().multiplyScalar(.55) : TL.C.oxide), text: 'The bulk of the chip is a single crystal of silicon; the transistors are built in its top layer. Insulating oxide fills the trenches between neighbouring fins (shallow trench isolation).' });
    const finMesh = {};
    [[60, 'p', 0xd98c8c], [-60, 'n', 0x8cb4d9]].forEach(([y0, t, col]) => {
      for (let k = 0; k < 2; k++) { const y = y0 + (k - .5) * finPitch; const fm = tearPart(F, new THREE.BoxGeometry(300, finW, finH), col, 'finfet_transistor', t === 'p' ? 'p-type fin' : 'n-type fin', new V3(0, y, finH / 2), { pri: 2, mat: IM && IM('silicon', TL.C.silicon, col), text: `${t}-type silicon fin, about ${finW} nm wide and tens of nanometres tall.` }); if (k === 0) finMesh[t] = fm; }
    });
    // gates (metal, wrapping fins) — the middle one is the inverter's input; the others are dummies
    [-1, 0, 1].forEach(i => { const g = tearPart(F, new THREE.BoxGeometry(16, 260, finH + 20), i === 0 ? 0x9aa0aa : 0x5d636e, i === 0 ? 'cmos_inverter' : null, 'Gate', new V3(i * gatePitch, 0, (finH + 20) / 2), { pri: 3, mat: IM && IM('tungsten', i === 0 ? TL.C.tungsten : TL.C.tungsten.clone().multiplyScalar(.7), i === 0 ? 0x9aa0aa : 0x5d636e), text: 'The metal gate wraps around the fins.' }); if (i === 0) F.label(g, 'Gate = input', { offset: new V3(0, 135, 40) }); });
    // source/drain epitaxy and contacts
    [[60, 0xe6a3a3], [-60, 0xa3c4e6]].forEach(([y, col]) => [-1, 1].forEach(s => { tearPart(F, new THREE.BoxGeometry(24, 70, 40), col, null, '', new V3(s * gatePitch / 2, y, finH + 4), { mat: IM && IM('silicon', TL.C.silicon, col) }); tearPart(F, new THREE.BoxGeometry(12, 60, 40), 0xd9b45a, null, '', new V3(s * gatePitch / 2, y, finH + 40), { mat: IM && IM('tungsten', TL.C.tungsten, 0xd9b45a) }); }));
    // metal-1: VDD, GND, output
    const vdd = tearPart(F, new THREE.BoxGeometry(300, 14, 14), 0xe05a5a, 'cmos_vdd', 'Power rail (VDD)', new V3(0, 130, 100), { mat: IM && IM('copper', TL.C.copper, 0xe05a5a), text: 'The supply wire: it carries the chip\'s supply voltage (a bit under 1 volt in a modern phone chip) to the p-type transistors.' }); const gnd = tearPart(F, new THREE.BoxGeometry(300, 14, 14), 0x3b6fd6, 'cmos_gnd', 'Ground rail', new V3(0, -130, 100), { mat: IM && IM('copper', TL.C.copper, 0x3b6fd6), text: 'The ground wire: the 0 volt side that the n-type transistors connect to.' });
    const out = tearPart(F, new THREE.BoxGeometry(14, 140, 14), 0xffd166, 'cmos_out', 'Output wire', new V3(gatePitch / 2, 0, 100), { mat: IM && IM('copper', TL.C.copper, 0xffd166), text: 'The output: the middle wire joins the p-type and n-type drains, and carries the inverted signal to the next gate.' });
    const lv = new THREE.Object3D(); lv.position.set(0, 140, 100); F.add(lv); F.label(lv, 'VDD (power)', { pick: vdd }); const lg = new THREE.Object3D(); lg.position.set(0, -140, 100); F.add(lg); F.label(lg, 'Ground', { pick: gnd }); F.label(out, 'Output', { offset: new V3(0, 0, 14), pick: out });
    const lp = new THREE.Object3D(); lp.position.set(-150, 60, 60); F.add(lp); F.label(lp, 'pMOS (p-type fins)', { pick: finMesh.p }); const ln = new THREE.Object3D(); ln.position.set(-150, -60, 60); F.add(ln); F.label(ln, 'nMOS (n-type fins)', { pick: finMesh.n });
    if (LOOK.on) {   // the rails stand on pillars of copper (vias); a studio floor
      F.add(new THREE.Mesh(TL.boxes([[14, 14, 93, -120, 130, 46.5], [14, 14, 93, 120, 130, 46.5], [14, 14, 93, -120, -130, 46.5], [14, 14, 93, 120, -130, 46.5]], .7), TL.mat('copper', TL.C.copper, { vertexColors: true })));
      TL.ground(F, 3000, -32, 320, 300);
      const fp = [], fy = [45, 75, -75, -45]; fy.forEach(y => fp.push([0, y, 300, 6])); [-48, 0, 48].forEach(x => fp.push([x, 0, 16, 260])); [60, -60].forEach(y => [-24, 24].forEach(x => fp.push([x, y, 24, 70])));
      TL.ao(F, 'inv', 320, 300, .2, fp, 7, .85);
      const n0 = 'A model of two transistors. No light picture of this can exist: it is smaller than the wavelength of light. It is lit like an object in a studio so its shapes can be read. Grey: silicon; dark grey: tungsten; copper: wires.';
      F.note = n0;
      seg([['mat', 'By material'], ['role', 'Colour code']], 'mat', k => { roles.forEach(([m, c, r]) => m.color.copy(k === 'role' ? r : c)); F.note = k === 'role' ? 'Colour code: warm = p-type, cool = n-type; red = power, blue = ground, yellow = output. Doping has no colour: these colours are labels, not what you would see.' : n0; });
    }
    if (LOOK.on) F.labels.forEach(l => { l.minSizeFn = () => cam.A === F; });   // the inverter's names are for the view where it is the subject
    tearReg('cmos_inverter', F, new V3(), 6e-7);
    F.update = (dt) => tearAttract(F, dt, new V3(0, -74, 0), 5e-7, 150);
  }
};

/* ---------- 6. one FinFET, cut open (unit nm) ---------- */
FT.finfet = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: LOOK.on ? 0x0a0a0b : 0x0b1018, opaque: true }; tearLights(F, 1.1);
    F.blurb = 'One FinFET transistor, cut open: a silicon fin about 5–7 nm wide wrapped on three sides by the gate. A voltage on the gate opens a channel for electrons between source and drain.';
    F.note = 'Cartoon: electrons are enlarged and drawn as dots moving at constant speed. Real electrons have no size, and the carriers in the channel form a quantum charge layer. In the OFF state a voltage barrier, not an absence of electrons, holds them back, and a small leakage current still flows.';
    F.floorD = 1e-8;
    renderer.localClippingEnabled = true;
    const cut = new THREE.Plane(new V3(0, -1, 0), 0);
    const parts = {};
    /* under the look the transistor is cut for real: every part is its own half, with a lit cut face (nothing hollow, no clipping). The faces of parts that overlap
       at the cut stand 0.3 nm apart so the innermost (fin, then oxide, then gate) shows. */
    const CUT = { 'Silicon fin (channel)': ['silicon', 'silicon', .9], 'Gate oxide (high-k)': ['oxide', 'oxide', .6], 'Metal gate': ['tungsten', 'tungsten', .3], 'Source': ['silicon', 'silicon', 0], 'Drain': ['silicon', 'silicon', 0], 'Spacer': ['nitride', 'nitride', 0] };
    const half = (g, off) => { const q = g.parameters, h = q.height; return new THREE.BoxGeometry(q.width, h / 2 + off, q.depth).translate(0, (h / 2 - off) / 2, 0); };   // the half on the +y side: its cut face looks at the camera, which stands on the -y side of the frame
    const SEC = { silicon: [.46, .52, .64], oxide: [.82, .8, .7], tungsten: [.58, .58, .6], nitride: [.66, .68, .72] };   // sectioned faces: lit, not metal, so the cut can be read (a drawing convention, not photographic colour)
    const add = (geo, col, id, name, pos, text, clip = true, op) => { const cu = LOOK.on && CUT[name], g = tearPart(F, cu ? half(geo, cu[2]) : geo, col, id, name, pos, { text, pri: 3, mat: cu ? TL.mat('polymer', new THREE.Color().setRGB(...SEC[cu[1]]).multiplyScalar(name === 'Source' || name === 'Drain' ? 1.12 : 1)) : undefined }); parts[name] = g; if (clip && !LOOK.on) g.traverse(m => { if (m.material) m.material.clippingPlanes = [cut]; }); if (op && !LOOK.on) g.userData.main.material.opacity = op; return g; };
    add(new THREE.BoxGeometry(120, 6, 46), 0x8cb4d9, 'silicon_channel', 'Silicon fin (channel)', new V3(0, 0, 23), 'The channel: where the current flows when the transistor is on. Only a few dozen atoms across.');
    add(new THREE.BoxGeometry(18, 10, 52), 0xe6c84f, null, 'Gate oxide (high-k)', new V3(0, 0, 25), 'A ~1–2 nm layer of hafnium oxide insulates the gate from the channel.', true, .6);
    add(new THREE.BoxGeometry(16, 60, 62), 0x9aa0aa, 'finfet_transistor', 'Metal gate', new V3(0, 0, 31), 'The gate. Its voltage pulls electrons into the fin to switch the transistor on.', true, .85);
    [-1, 1].forEach(s => { add(new THREE.BoxGeometry(40, 22, 50), 0xa3c4e6, s < 0 ? 'finfet_source' : 'finfet_drain', s < 0 ? 'Source' : 'Drain', new V3(s * 40, 0, 26), 'Heavily doped silicon grown on the fin: where electrons enter (source) and leave (drain).'); add(new THREE.BoxGeometry(6, 64, 62), 0xd4d4d4, null, 'Spacer', new V3(s * 11, 0, 31), 'Insulating spacers separate the gate from source and drain.', true, .5); });
    if (LOOK.on) { tearPart(F, new THREE.BoxGeometry(160, 60, 20).translate(0, 30, 0), 0, null, '', new V3(0, 0, -10), { mat: TL.mat('polymer', new THREE.Color().setRGB(.36, .36, .38)) }); TL.ground(F, 1600, -20.5, 160, 120); F.note = 'A model of one transistor, cut in half. The blue dots are markers for electrons: real electrons have no size, and in the channel they form a thin layer of charge. In the OFF state a voltage barrier, not an absence of electrons, holds them back, and a small leakage current still flows.'; }
    else tearPart(F, new THREE.BoxGeometry(160, 120, 20), 0x6b7383, null, '', new V3(0, 0, -10));
    // electrons flowing source → drain through the channel
    const eG = new THREE.SphereGeometry(1.4, 10, 8), eIM = LOOK.on ? new THREE.InstancedMesh(eG, new THREE.MeshBasicMaterial({ color: 0x6ee7ff, toneMapped: false }), 30) : null, eM = new THREE.Matrix4();
    if (eIM) { eIM.userData.marker = true; eIM.frustumCulled = false; F.add(eIM); }
    const es = eIM ? [...Array(30)].map(() => ({ position: new V3(), userData: {}, visible: true })) : [...Array(30)].map(() => { const m = new THREE.Mesh(eG, new THREE.MeshBasicMaterial({ color: 0x6ee7ff })); F.add(m); return m; });
    const er = rng(3); es.forEach(e => e.userData.ph = er());
    const lb = (t, p, pick) => { const o = new THREE.Object3D(); o.position.copy(p); F.add(o); F.label(o, t, { pick }); };
    lb('Gate', new V3(0, 0, 66), parts['Metal gate']); lb('Source', new V3(-40, 0, 55), parts['Source']); lb('Drain', new V3(40, 0, 55), parts['Drain']); lb(LOOK.on ? 'Fin, about 5–7 nm thick' : 'Fin, about 5–7 nm wide', LOOK.on ? new V3(-48, -6, 3) : new V3(0, -8, 4), parts['Silicon fin (channel)']);
    let on = true; seg([['on', 'Gate ON (1)'], ['off', 'Gate OFF (0)']], 'on', k => on = k === 'on');
    F.update = (dt, t) => {
      if (LOOK.on) {   // arriving, the view turns once to look at the cut face from about 30 degrees above, the fin upright
        if (cam.A !== F) { if (!frameWithin(cam.A, F)) F._o = 0; } else if (F._o !== 1) { F._o = F._o || .001; const w = new V3(.42, -.72, .55).normalize(), k = 1 - Math.exp(-dt * 3.5); cam.dir.lerp(w, k).normalize(); const u = new V3(0, 0, 1).addScaledVector(cam.dir, -cam.dir.z).normalize(); cam.up.lerp(u, k).normalize(); if (cam.dir.dot(w) > .9995) F._o = 1; }
      }
      tearAttract(F, dt, new V3(0, 0, 23), 9e-8, 70); cut.constant = F.root.position.y; es.forEach((e, i) => { const u = (t * .35 + e.userData.ph) % 1; e.visible = true; const ey = LOOK.on ? -2 : Math.sin(i * 7) * 2, ez = LOOK.on ? 28 + (i % 6) * 3 : 8 + (i % 6) * 6; if (on) e.position.set(-60 + u * 120, ey, ez); else { const w = .5 + .5 * Math.sin(t * 2.1 + i * 1.7); e.position.set(i % 2 ? 16 + w * 40 : -16 - w * 40, ey, ez); } /* under the look the markers ride in the channel and stand on the cut face, where they can be seen */ }); if (eIM) { es.forEach((e, i) => eIM.setMatrixAt(i, eM.makeTranslation(e.position.x, e.position.y, e.position.z))); eIM.instanceMatrix.needsUpdate = true; } }; // OFF: the electrons stay in the source and the drain; a barrier, not an absence, stops them
    tearReg('finfet_transistor', F, new V3(0, 0, 23), 1.6e-7); tearReg('silicon_channel', F, new V3(0, 0, 23), 3e-9);
  }
};

/* ---------- assemble the chain inside the body frame (phone in your right hand) ---------- */
function buildTeardown(body) {
  const phone = body.addChild(new Frame({ type: 'phone', name: 'Your smartphone', unit: 1e-3, radius: 100, r0: 0, r1: .9, pos: new V3(-.3, .83, .12), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-.25, -.35, 0)) }));
  phone.pinned = true; phone.floorD = 2e-3;
  phone.enterIf = aim => aim.frame !== body || aim.id === 'skin';   // the phone lies in the hand: scrolling in at the hand's skin reaches it; a bone, muscle or vessel of the hand that you point at is not the phone
  const die = phone.addChild(new Frame({ type: 'die', name: 'Processor die', unit: 1e-6, radius: 7600, r0: 0, r1: .02, pos: new V3(0, 46, 1.6), up: new V3(0, 1, 0) }));
  const core = die.addChild(new Frame({ type: 'core', name: 'CPU core', unit: 1e-6, radius: 950, r1: 8e-3, pos: new V3(-3500, 2700, 100) }));
  const cells = core.addChild(new Frame({ type: 'cells', name: 'Logic gates', unit: 1e-9, radius: 2600, r1: 2.2e-5, pos: new V3(420, 200, 14) }));
  const inv = cells.addChild(new Frame({ type: 'inverter', name: 'CMOS inverter', unit: 1e-9, radius: 260, r1: 2.2e-6, pos: new V3(0, 0, 25) }));
  const fin = inv.addChild(new Frame({ type: 'finfet', name: 'FinFET transistor', unit: 1e-9, radius: 90, r1: LOOK.on ? 5.5e-7 : 7e-7, pos: new V3(0, -74, 0) }));
  const si = fin.addChild(crystalFrame('silicon', new V3(0, 0, 23))); si.name = 'Silicon crystal (the channel)';
  [phone, die, core, cells, inv, fin, si].forEach(f => f.pinned = true);
  // where each part lives, so search and tracks can fly straight to it
  PHONE_PARTS.forEach(([id, , p, s]) => tearReg(id, phone, new V3(...p), Math.max(...s) * 4e-3));
  tearReg('smartphone', phone, new V3(), .3); tearReg('phone_display', phone, new V3(0, 0, 3), .25); tearReg('phone_touchscreen', phone, new V3(0, 0, 4), .25); tearReg('phone_antenna', phone, new V3(0, 61, 0), .06); tearReg('phone_passives', phone, new V3(15, 40, 1), .03);
  DIE_BLOCKS.forEach(([id, , c, s]) => tearReg(id, die, new V3(c[0], c[1], 30), Math.max(...s) * 2.2e-6));
  CORE_BLOCKS.forEach(([id, , c, s]) => tearReg(id, core, new V3(c[0], c[1], 6), Math.max(...s) * 2.4e-6));
  tearReg('phone_soc', die, new V3(), .011); tearReg('cpu_core', core, new V3(), 2.6e-3); tearReg('core_pipeline', core, new V3(), 2.6e-3); tearReg('soc_cpu_cluster', die, new V3(-2600, 1900, 30), 9e-3);
  tearReg('logic_adder', cells, new V3(0, 0, 10), 1.5e-6); tearReg('logic_cell', cells, new V3(-800, 300, 10), 1.2e-6); tearReg('silicon_substrate', inv, new V3(0, 0, -15), 5e-7); tearReg('cmos_vdd', inv, new V3(0, 130, 100), 4e-7); tearReg('cmos_gnd', inv, new V3(0, -130, 100), 4e-7); tearReg('cmos_out', inv, new V3(24, 0, 100), 4e-7); tearReg('cmos_inverter', inv, new V3(), 6e-7);
  tearReg('finfet_transistor', fin, new V3(0, 0, 23), 1.6e-7); tearReg('silicon_channel', si, new V3(), 3e-9);
  Object.assign(FR, { phone, die, core, cells, inv, fin, si });
  return [
    { label: 'Your phone', frame: phone, D: .3, side: true, go: then => flyTo(phone, new V3(), .3, then) },
    { label: 'Phone processor', frame: die, D: .012, side: true, go: then => flyTo(die, new V3(), .012, then) },
    { label: 'CPU core', frame: core, D: 3e-3, side: true, go: then => flyTo(core, new V3(), 3e-3, then) },
    { label: 'Logic gates', frame: cells, D: 6e-6, side: true, go: then => flyTo(cells, new V3(), 6e-6, then) },
    { label: 'Transistor', frame: fin, D: 2.4e-7, side: true, go: then => flyTo(fin, new V3(0, 0, 23), 2.4e-7, then) },
  ];
}
