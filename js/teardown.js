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
function tearLights(F, k = 1) { F.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, .6 * k)); const d = new THREE.DirectionalLight(0xffffff, .8 * k); d.position.set(1, 2, 3); F.add(d); }
function partInfo(id, name, text) { return NODE[id] ? null : { title: name, tag: 'Part', body: `<p>${text || ''}</p>` }; }
function tearPart(F, geo, color, id, name, pos, o = {}) {
  const g = inked(geo, color, { w: o.w || .0025, double: o.double, outline: o.outline });
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
FT.phone = {
  build(F) {
    F.device = true; F.illo = true; tearLights(F); F.env = { bg: 0x0b1018, opaque: false };   // opaque only while the camera is in a thing inside the phone (below): then the hand is not drawn behind it
    F.blurb = 'Your phone, at true size. Zoom in and it opens up; click any part. Aim at the processor chip and keep zooming to reach a single transistor.';
    F.note = 'The outer size is a current flagship phone. The layout of the parts inside is illustrative: real phones differ in where each part sits.';
    const exp = new THREE.Group(); F.add(exp); F.layers = [];
    const layer = (obj, z) => { obj.userData.zz = z; obj.userData.z0 = obj.position.z; F.layers.push(obj); };
    // shell: frame + back glass + display + cover glass
    const frame = tearPart(F, slab(PHONE.w, PHONE.h, PHONE.d, 9), 0x8f96a3, 'smartphone', 'Smartphone', new V3(), { pri: .5, text: 'A pocket computer, radio and camera.' });
    frame.userData.main.material.opacity = 1; frame.userData.shell = true; layer(frame, 0);
    const back = tearPart(F, slab(PHONE.w - 1, PHONE.h - 1, .7, 8.5), 0x4b5a70, null, '', new V3(0, 0, -3.6)); layer(back, -14);
    const disp = tearPart(F, slab(PHONE.w - 2, PHONE.h - 2, 1.2, 8), 0x0d1118, 'phone_display', 'Display', new V3(0, 0, 3.1), { text: 'An OLED panel: every pixel is three tiny light-emitting diodes.' }); layer(disp, 9);
    const scr = canvasTex('homescreen', 256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#203a6b'); gr.addColorStop(1, '#6a3b7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const cols = ['#ffd166', '#6ee7ff', '#ff8fb1', '#9be37b', '#b388ff', '#ffa94d']; for (let i = 0; i < 20; i++) { g.fillStyle = cols[i % 6]; const x = 24 + (i % 4) * 56, y = 90 + Math.floor(i / 4) * 64; g.beginPath(); g.roundRect ? g.roundRect(x, y, 40, 40, 10) : g.rect(x, y, 40, 40); g.fill(); } g.fillStyle = '#fff'; g.font = '600 34px Inter, sans-serif'; g.fillText('12:00', 80, 60); });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.w - 5, PHONE.h - 5), new THREE.MeshBasicMaterial({ map: scr, transparent: true })); face.position.z = .62; disp.add(face);
    const glass = tearPart(F, slab(PHONE.w - 1, PHONE.h - 1, .6, 8.5), 0xa9d6ff, 'phone_touchscreen', 'Touchscreen glass', new V3(0, 0, 3.9), { opacity: .18, outline: true, text: 'A transparent grid of electrodes senses your finger by the change in capacitance.' }); layer(glass, 15);
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
      frame.userData.main.material.opacity = 1 - .85 * ex.k; frame.userData.main.material.depthWrite = ex.k < .5;
      frame.userData.noPick = disp.userData.noPick = glass.userData.noPick = ex.k > .5;   // opened up, the shell, the display and the glass are ghosts: a click goes through them to the part behind (and to a thing that stands inside the phone, which is picked by the nearest surface)
      [disp, glass].forEach(o => { o.visible = ex.k < .97; o.traverse(m => { if (m.material && m.material.opacity !== undefined && !m.userData.outline) { if (m.userData.op0 === undefined) m.userData.op0 = m.material.opacity; m.material.opacity = m.userData.op0 * (1 - ex.k); m.material.transparent = true; } }); });
      back.userData.main.material.opacity = 1 - .7 * ex.k;
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
    F.device = true; F.illo = true; F.env = { bg: 0x0b1018, opaque: true }; tearLights(F);
    F.blurb = 'The processor die: about 10 × 10 mm of silicon holding roughly 15–20 billion transistors. Each coloured block is a different kind of engine.';
    F.note = 'Illustrative floorplan, not a real chip. The kinds of block are real; their sizes and positions are schematic, because chip makers do not publish theirs.';
    F.floorD = 1e-5;
    const base = tearPart(F, new THREE.BoxGeometry(DIE.w, DIE.h, 300), 0x5a6170, 'phone_soc', 'Silicon die', new V3(0, 0, -150), { pri: .3, r: 7000 });
    base.userData.main.material.map = gridTex('die_base', '#5a6170', '#6b7383', 64);
    const tex = { logic: gridTex('blk_logic', '#ffffff', 'rgba(0,0,0,.18)', 48, { dots: 'rgba(0,0,0,.25)' }), sram: gridTex('blk_sram', '#ffffff', 'rgba(0,0,0,.35)', 32, { lw: 2 }), io: gridTex('blk_io', '#ffffff', 'rgba(0,0,0,.4)', 16, { cols: true, lw: 3 }), bus: gridTex('blk_bus', '#ffffff', 'rgba(0,0,0,.3)', 8, { cols: true }) };
    DIE_BLOCKS.forEach(([id, name, c, s, col, tk, text]) => {
      const g = tearPart(F, new THREE.BoxGeometry(s[0], s[1], 60), col, id, name, new V3(c[0], c[1], 30), { text, r: Math.max(...s) / 2 });
      g.userData.main.material.map = tex[tk]; F.label(g, NODE[id] ? NODE[id].title : name, { offset: new V3(0, id === 'soc_cpu_cluster' ? -s[1] / 2 + 250 : s[1] / 2 - 300, 60) });
      tearReg(id, F, new V3(c[0], c[1], 30), Math.max(...s) * 2.2e-6);
    });
    // CPU cluster sub-blocks: 2 big cores + 4 small cores + L2
    [[-3500, 2700, 1500, 1100, 'Performance core'], [-1700, 2700, 1500, 1100, 'Performance core'], [-3900, 900, 700, 600, 'Efficiency core'], [-3100, 900, 700, 600, 'Efficiency core'], [-2300, 900, 700, 600, 'Efficiency core'], [-1500, 900, 700, 600, 'Efficiency core']].forEach(([x, y, w, h, nm], i) => {
      const g = tearPart(F, new THREE.BoxGeometry(w, h, 40), i < 2 ? 0x7aa2e8 : 0x9bb8ee, 'cpu_core', nm, new V3(x, y, 80), { text: 'One processor core.', r: w / 2 });
      g.userData.main.material.map = tex.logic; g.userData.zoomTo = () => { flyTo(FR.core, new V3(), 3e-3); }; if (i === 0) F.label(g, nm, { offset: new V3(0, h / 2, 40) });
    });
    // bond / bump ring
    const ring = new THREE.InstancedMesh(new THREE.CylinderGeometry(60, 60, 40, 10).rotateX(Math.PI / 2), illoMat(0xd9b45a), 160); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 160; i++) { const t = i / 160 * 4, side = Math.floor(t), f = t - side; const x = side === 0 ? -DIE.w / 2 + f * DIE.w : side === 1 ? DIE.w / 2 : side === 2 ? DIE.w / 2 - f * DIE.w : -DIE.w / 2; const y = side === 0 ? -DIE.h / 2 : side === 1 ? -DIE.h / 2 + f * DIE.h : side === 2 ? DIE.h / 2 : DIE.h / 2 - f * DIE.h; m4.makeTranslation(x * .97, y * .97, 20); ring.setMatrixAt(i, m4); }
    F.add(ring);
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
    F.device = true; F.illo = true; F.env = { bg: 0x0b1018, opaque: true }; tearLights(F);
    F.blurb = 'One performance core, drawn about 1.5 × 1.1 mm. Watch instructions flow through the pipeline: fetch, decode, execute, write back, billions of times a second.';
    F.note = 'Illustrative layout: the stages are real, but the blocks\' sizes and places are schematic. The glowing squares are a cartoon of instructions in flight.';
    F.floorD = 2e-6;
    const base = tearPart(F, new THREE.BoxGeometry(1500, 1100, 40), 0x3c4558, 'cpu_core', 'CPU core', new V3(0, 0, -20), { pri: .3, r: 900 });
    const tex = { logic: gridTex('blk_logic', '#ffffff', 'rgba(0,0,0,.18)', 48, { dots: 'rgba(0,0,0,.25)' }), sram: gridTex('blk_sram', '#ffffff', 'rgba(0,0,0,.35)', 32, { lw: 2 }) };
    CORE_BLOCKS.forEach(([id, name, c, s, col, tk, text]) => {
      const g = tearPart(F, new THREE.BoxGeometry(s[0], s[1], 12), col, id, name, new V3(c[0], c[1], 6), { text, r: Math.max(...s) / 2 }); g.userData.main.material.map = tex[tk]; if (id === 'core_alu') g.userData.zoomTo = () => { flyTo(FR.cells, new V3(), 6e-6); };
      F.label(g, NODE[id] ? NODE[id].title : name, { offset: new V3(0, s[1] / 2 - 40, 12) }); tearReg(id, F, new V3(c[0], c[1], 6), Math.max(...s) * 2.4e-6);
    });
    // the pipeline: glowing instruction tokens hopping between stages
    const path = [new V3(-480, 300, 20), new V3(-10, 300, 20), new V3(-10, -30, 20), new V3(420, 200, 20), new V3(180, -330, 20), new V3(-10, -30, 20)];
    const toks = [...Array(6)].map((_, i) => { const t = inked(new THREE.BoxGeometry(40, 40, 20), [0xffd166, 0x6ee7ff, 0xff8fb1, 0x9be37b, 0xb388ff, 0xffa94d][i]); F.add(t); return t; });
    const pl = new THREE.Group(); pl.userData = { id: 'core_pipeline', node: NODE.core_pipeline ? 'core_pipeline' : null, priority: 2.5, info: partInfo('core_pipeline', 'Pipeline', 'Instructions move through stages like an assembly line; several are in flight at once.') }; toks.forEach(t => pl.attach(t)); F.add(pl); F.pickables.push(pl); regMesh('core_pipeline', pl);
    F.label(toks[0], 'Instructions in the pipeline', { offset: new V3(0, 40, 0) });
    F.update = (dt, t) => { tearAttract(F, dt, new V3(420, 200, 14), 1e-4, 330); toks.forEach((k, i) => { const u = (t * .6 + i / toks.length) % 1 * (path.length - 1), a = Math.floor(u), f = smooth(0, 1, (u - a) * 1.6 - .3); k.position.lerpVectors(path[a], path[a + 1], f); }); };
    tearReg('cpu_core', F, new V3(), 2.6e-3); tearReg('core_pipeline', F, new V3(), 2.6e-3);
  }
};

/* ---------- 4. standard cells (unit nm) ---------- */
const CELL_H = 190; // nm, drawn row height; published analyst measurements of a 5 nm-class library give about 175-210 nm
FT.cells = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: 0x0b1018, opaque: true }; tearLights(F);
    F.blurb = 'Inside the arithmetic unit: rows of standard cells (small logic gates), each about 150–200 nm tall in a current process, wired together by copper above them.';
    F.note = 'Schematic: the cell types, widths, placement and wiring are invented. The yellow group stands for an adder; it is not a real netlist (a one-bit full adder is about 28 transistors).';
    F.floorD = 4e-7; let hlCell = null;
    const r = rng(5), rows = 14, W = 3600;
    const cellCols = [0x4f7cc9, 0x45a77a, 0x9b6bd6, 0xc9a24f, 0xd9774a, 0x5aa2d9];
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
    const lab = new THREE.Object3D(); lab.position.set(0, 0, 60); F.add(lab); F.label(lab, 'Yellow: stands for an adder', { pick: hlCell });
    tearReg('logic_adder', F, new V3(0, 0, 10), 1.5e-6); tearReg('core_alu', F, new V3(), 6e-6);
    F.update = (dt) => tearAttract(F, dt, new V3(0, 0, 25), 1.6e-6, 900);
  }
};

/* ---------- 5. a CMOS inverter, transistor level (unit nm) ---------- */
FT.inverter = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: 0x0b1018, opaque: true }; tearLights(F, 1.1);
    F.blurb = 'A CMOS inverter, the simplest logic gate: a p-type transistor on top, an n-type one below, sharing one gate. Fins run left to right; the gate crosses them.';
    F.note = 'Simplified: proportions are approximate and real layouts vary by process. Here the inverter is drawn with a plain input gate between two dummy gates.';
    F.floorD = 3e-8;
    const finH = 50, finW = 6, gatePitch = 48, finPitch = 28;
    // substrate + shallow trench isolation
    tearPart(F, new THREE.BoxGeometry(320, 300, 30), 0x6b7383, 'silicon_substrate', 'Silicon substrate', new V3(0, 0, -15), { pri: .3, text: 'The bulk of the chip is a single crystal of silicon; the transistors are built in its top layer. Insulating oxide fills the trenches between neighbouring fins (shallow trench isolation).' });
    const finMesh = {};
    [[60, 'p', 0xd98c8c], [-60, 'n', 0x8cb4d9]].forEach(([y0, t, col]) => {
      for (let k = 0; k < 2; k++) { const y = y0 + (k - .5) * finPitch; const fm = tearPart(F, new THREE.BoxGeometry(300, finW, finH), col, 'finfet_transistor', t === 'p' ? 'p-type fin' : 'n-type fin', new V3(0, y, finH / 2), { pri: 2, text: `${t}-type silicon fin, about ${finW} nm wide and tens of nanometres tall.` }); if (k === 0) finMesh[t] = fm; }
    });
    // gates (metal, wrapping fins) — the middle one is the inverter's input; the others are dummies
    [-1, 0, 1].forEach(i => { const g = tearPart(F, new THREE.BoxGeometry(16, 260, finH + 20), i === 0 ? 0x9aa0aa : 0x5d636e, i === 0 ? 'cmos_inverter' : null, 'Gate', new V3(i * gatePitch, 0, (finH + 20) / 2), { pri: 3, text: 'The metal gate wraps around the fins.' }); if (i === 0) F.label(g, 'Gate = input', { offset: new V3(0, 135, 40) }); });
    // source/drain epitaxy and contacts
    [[60, 0xe6a3a3], [-60, 0xa3c4e6]].forEach(([y, col]) => [-1, 1].forEach(s => { tearPart(F, new THREE.BoxGeometry(24, 70, 40), col, null, '', new V3(s * gatePitch / 2, y, finH + 4)); tearPart(F, new THREE.BoxGeometry(12, 60, 40), 0xd9b45a, null, '', new V3(s * gatePitch / 2, y, finH + 40)); }));
    // metal-1: VDD, GND, output
    const vdd = tearPart(F, new THREE.BoxGeometry(300, 14, 14), 0xe05a5a, 'cmos_vdd', 'Power rail (VDD)', new V3(0, 130, 100), { text: 'The supply wire: it carries the chip\'s supply voltage (a bit under 1 volt in a modern phone chip) to the p-type transistors.' }); const gnd = tearPart(F, new THREE.BoxGeometry(300, 14, 14), 0x3b6fd6, 'cmos_gnd', 'Ground rail', new V3(0, -130, 100), { text: 'The ground wire: the 0 volt side that the n-type transistors connect to.' });
    const out = tearPart(F, new THREE.BoxGeometry(14, 140, 14), 0xffd166, 'cmos_out', 'Output wire', new V3(gatePitch / 2, 0, 100), { text: 'The output: the middle wire joins the p-type and n-type drains, and carries the inverted signal to the next gate.' });
    const lv = new THREE.Object3D(); lv.position.set(0, 140, 100); F.add(lv); F.label(lv, 'VDD (power)', { pick: vdd }); const lg = new THREE.Object3D(); lg.position.set(0, -140, 100); F.add(lg); F.label(lg, 'Ground', { pick: gnd }); F.label(out, 'Output', { offset: new V3(0, 0, 14), pick: out });
    const lp = new THREE.Object3D(); lp.position.set(-150, 60, 60); F.add(lp); F.label(lp, 'pMOS (p-type fins)', { pick: finMesh.p }); const ln = new THREE.Object3D(); ln.position.set(-150, -60, 60); F.add(ln); F.label(ln, 'nMOS (n-type fins)', { pick: finMesh.n });
    tearReg('cmos_inverter', F, new V3(), 6e-7);
    F.update = (dt) => tearAttract(F, dt, new V3(0, -74, 0), 5e-7, 150);
  }
};

/* ---------- 6. one FinFET, cut open (unit nm) ---------- */
FT.finfet = {
  build(F) {
    F.device = true; F.illo = true; F.env = { bg: 0x0b1018, opaque: true }; tearLights(F, 1.1);
    F.blurb = 'One FinFET transistor, cut open: a silicon fin about 5–7 nm wide wrapped on three sides by the gate. A voltage on the gate opens a channel for electrons between source and drain.';
    F.note = 'Cartoon: electrons are enlarged and drawn as dots moving at constant speed. Real electrons have no size, and the carriers in the channel form a quantum charge layer. In the OFF state a voltage barrier, not an absence of electrons, holds them back, and a small leakage current still flows.';
    F.floorD = 1e-8;
    renderer.localClippingEnabled = true;
    const cut = new THREE.Plane(new V3(0, -1, 0), 0);
    const parts = {};
    const add = (geo, col, id, name, pos, text, clip = true, op) => { const g = tearPart(F, geo, col, id, name, pos, { text, pri: 3 }); parts[name] = g; if (clip) g.traverse(m => { if (m.material) m.material.clippingPlanes = [cut]; }); if (op) g.userData.main.material.opacity = op; return g; };
    add(new THREE.BoxGeometry(120, 6, 46), 0x8cb4d9, 'silicon_channel', 'Silicon fin (channel)', new V3(0, 0, 23), 'The channel: where the current flows when the transistor is on. Only a few dozen atoms across.');
    add(new THREE.BoxGeometry(18, 10, 52), 0xe6c84f, null, 'Gate oxide (high-k)', new V3(0, 0, 25), 'A ~1–2 nm layer of hafnium oxide insulates the gate from the channel.', true, .6);
    add(new THREE.BoxGeometry(16, 60, 62), 0x9aa0aa, 'finfet_transistor', 'Metal gate', new V3(0, 0, 31), 'The gate. Its voltage pulls electrons into the fin to switch the transistor on.', true, .85);
    [-1, 1].forEach(s => { add(new THREE.BoxGeometry(40, 22, 50), 0xa3c4e6, s < 0 ? 'finfet_source' : 'finfet_drain', s < 0 ? 'Source' : 'Drain', new V3(s * 40, 0, 26), 'Heavily doped silicon grown on the fin: where electrons enter (source) and leave (drain).'); add(new THREE.BoxGeometry(6, 64, 62), 0xd4d4d4, null, 'Spacer', new V3(s * 11, 0, 31), 'Insulating spacers separate the gate from source and drain.', true, .5); });
    tearPart(F, new THREE.BoxGeometry(160, 120, 20), 0x6b7383, null, '', new V3(0, 0, -10));
    // electrons flowing source → drain through the channel
    const eG = new THREE.SphereGeometry(1.4, 10, 8), es = [...Array(30)].map(() => { const m = new THREE.Mesh(eG, new THREE.MeshBasicMaterial({ color: 0x6ee7ff })); F.add(m); return m; });
    const er = rng(3); es.forEach(e => e.userData.ph = er());
    const lb = (t, p, pick) => { const o = new THREE.Object3D(); o.position.copy(p); F.add(o); F.label(o, t, { pick }); };
    lb('Gate', new V3(0, 0, 66), parts['Metal gate']); lb('Source', new V3(-40, 0, 55), parts['Source']); lb('Drain', new V3(40, 0, 55), parts['Drain']); lb('Fin, about 5–7 nm wide', new V3(0, -8, 4), parts['Silicon fin (channel)']);
    let on = true; seg([['on', 'Gate ON (1)'], ['off', 'Gate OFF (0)']], 'on', k => on = k === 'on');
    F.update = (dt, t) => { tearAttract(F, dt, new V3(0, 0, 23), 9e-8, 70); cut.constant = F.root.position.y; es.forEach((e, i) => { const u = (t * .35 + e.userData.ph) % 1; e.visible = true; if (on) e.position.set(-60 + u * 120, (Math.sin(i * 7) * 2), 8 + (i % 6) * 6); else { const w = .5 + .5 * Math.sin(t * 2.1 + i * 1.7); e.position.set(i % 2 ? 16 + w * 40 : -16 - w * 40, (Math.sin(i * 7) * 2), 8 + (i % 6) * 6); } }); }; // OFF: the electrons stay in the source and the drain; a barrier, not an absence, stops them
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
  const fin = inv.addChild(new Frame({ type: 'finfet', name: 'FinFET transistor', unit: 1e-9, radius: 90, r1: 7e-7, pos: new V3(0, -74, 0) }));
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
