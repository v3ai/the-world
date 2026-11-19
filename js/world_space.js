'use strict';
/* ================= SPACE FRAMES (real positions, real sizes) ================= */
function bvColor(bv) {
  bv = clamp(bv, -.4, 2);
  const T = 4600 * (1 / (.92 * bv + 1.7) + 1 / (.92 * bv + .62));
  // blackbody → RGB (Tanner Helland approximation)
  const t = T / 100; let r, g, b;
  r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -.1332047592);
  g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -.0755148492);
  b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [clamp(r, 0, 255) / 255, clamp(g, 0, 255) / 255, clamp(b, 0, 255) / 255, T];
}
function sunDirIn(F) { const p = new V3(); convertP(p, FR.solar, F); return p.normalize(); }
const FR = {}; // named static frames

/* ---------- helpers shared by the large-scale views ---------- */
const LY_PER_PC = 3.26156; // IAU: 1 pc = 3.26156 light-years
const sig = (x, n = 2) => (x >= Math.pow(10, n) ? Math.round(x).toLocaleString('en-US') : String(+x.toPrecision(n)));
// one wording for a distance from the Sun: parsec units and light-years together
function spaceDist(mpc) {
  const ly = mpc * 1e6 * LY_PER_PC;
  if (mpc < 1) return `≈ ${sig(mpc * 1000)} kpc (≈ ${sig(ly / 1e3)} thousand light-years)`;
  if (mpc < 1000) return `≈ ${sig(mpc)} Mpc (≈ ${sig(ly / 1e6)} million light-years)`;
  return `≈ ${sig(mpc / 1000)} Gpc (≈ ${sig(ly / 1e9)} billion light-years)`;
}
function spaceSize(kpc, region) {
  const s = kpc >= 1000 ? `${sig(kpc / 1000)} Mpc` : `${sig(kpc)} kpc`, ly = kpc * 1e3 * LY_PER_PC;
  return `≈ ${s} (≈ ${ly >= 1e6 ? sig(ly / 1e6) + ' million' : sig(ly / 1e3) + ' thousand'} light-years)${region ? ' across, the region it spans' : ' across'}`;
}
/* A pickable sphere for something far away. Unlike a plain hit sphere it (1) is never smaller than about `px` pixels on screen
   and never larger than `maxR`, (2) is skipped when the camera is inside it, so it cannot swallow every click, (3) reports its
   centre as the hit point, so zooming onto it homes in on the object, and (4) prefers the hit nearest the cursor. */
function spaceHit(r, ud, o = {}) {
  const m = hitSphere(Math.max(r, 1e-9), ud.id, ud.priority ?? 2); Object.assign(m.userData, ud);
  const px = o.px ?? 13, w = new V3(), rel = new V3();
  m.raycast = function (rc, out) {
    if (o.off && o.off()) return;
    this.updateWorldMatrix(true, false); w.setFromMatrixPosition(this.matrixWorld);
    rel.copy(w).sub(rc.ray.origin); const t = rel.dot(rc.ray.direction); if (t <= 0) return;
    const cm = rc.camera, fr = cm && cm.isPerspectiveCamera ? 2 * Math.tan(cm.fov * Math.PI / 360) / H : .0012, dist = rel.length();
    const rEff = Math.min(Math.max(r, dist * fr * px), o.maxR || Infinity);
    if (dist < rEff) return;
    const perp = Math.sqrt(Math.max(rel.lengthSq() - t * t, 0)); if (perp > rEff) return;
    out.push({ distance: t * (1 + 3 * perp / rEff), point: w.clone(), object: this });
  };
  return m;
}
function spaceLabel(F, obj, text, pri, o) { const L = F.label(obj, text, o); L.el.dataset.pri = pri; return L; }
// a card button or double-click can name its own destination (a frame that scrolling would also reach)
{ const _zoomIntoHit = zoomIntoHit; window.zoomIntoHit = function (h) { const z = h && h.obj && h.obj.userData && h.obj.userData.zoomTo; if (z && z(h) !== false) return; return _zoomIntoHit(h); }; }
// labels sit above the canvas: pass the mouse wheel through so zooming works over a label too
{ const LL = document.getElementById('labels'); if (LL) LL.addEventListener('wheel', e => { e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, bubbles: true, cancelable: true })); }, { passive: false }); }
// where labels collide in the large-scale views, the higher-priority one stays (data-pri); the rest hide until there is room
const SPACE_TYPES = new Set(['cosmos', 'localgroup', 'milkyway', 'neighborhood', 'sgrA']);
function declutterLabels() {
  const LL = document.getElementById('labels'); if (!LL || typeof cam === 'undefined' || !cam.A) return;
  const els = Array.from(LL.children);
  if (!SPACE_TYPES.has(cam.A.type)) { els.forEach(e => { if (e.style.visibility) e.style.visibility = ''; }); return; }
  const items = els.filter(e => e.style.display !== 'none').map(e => ({ e, pri: +e.dataset.pri || 0, r: e.getBoundingClientRect() }));
  items.sort((a, b) => b.pri - a.pri || a.r.top - b.r.top);
  const kept = [];
  items.forEach(it => { const r = it.r, clash = kept.some(k => !(r.right + 4 < k.left || r.left - 4 > k.right || r.bottom + 2 < k.top || r.top - 2 > k.bottom)); it.e.style.visibility = clash ? 'hidden' : ''; if (!clash) kept.push(r); });
  els.forEach(e => { if (e.style.display === 'none' && e.style.visibility) e.style.visibility = ''; });
}
setInterval(declutterLabels, 160);
// type of a catalogue galaxy → the symbol drawn for it (explicit, not a loose regex)
function galKind(type) {
  if (/dSph|dE\b|cE\b|^E\d|elliptical|^S0|cD/i.test(type)) return 'elliptical';
  if (/Irr|I0|SB\(s\)m|SA\(s\)m|ultra-faint|dwarf|transition|group|cluster|anomaly/i.test(type)) return 'irregular';
  if (/^S[AB]?[ab(]|^SB|^SA|spiral/i.test(type)) return 'spiral';
  return 'irregular';
}
// CMB picture, drawn for this view: wraps without a seam and stretches blobs toward the poles. Illustrative colours.
function spaceCmbTex() {
  return canvasTex('cmb_illus', 1024, 512, (g, w, h) => {
    g.fillStyle = '#31568f'; g.fillRect(0, 0, w, h); const r = rng(1965);
    const pal = ['236,170,92', '246,226,176', '70,120,200', '26,52,130', '200,80,70'];
    for (let i = 0; i < 6500; i++) {
      const x = r() * w, y = r() * h, k = 1 / Math.max(.22, Math.cos((y / h - .5) * Math.PI)), rad = 4 + r() * 13, t = r();
      const col = pal[t < .22 ? 0 : t < .36 ? 1 : t < .74 ? 2 : t < .94 ? 3 : 4];
      for (const dx of [-w, 0, w]) {
        if (x + dx + rad * k < 0 || x + dx - rad * k > w) continue;
        g.save(); g.translate(x + dx, y); g.scale(k, 1);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad); gr.addColorStop(0, `rgba(${col},.42)`); gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr; g.fillRect(-rad, -rad, rad * 2, rad * 2); g.restore();
      }
    }
  });
}

/* ---------- cosmos (Mpc) ---------- */
FT.cosmos = {
  build(F) {
    F.scene.background = new THREE.Color(0x000000);
    const r = rng(2024);
    // the last-scattering surface: about 13,900 Mpc (≈ 45 billion light-years) from us in today's distances
    const cmb = new THREE.Mesh(new THREE.SphereGeometry(13900, 64, 32), new THREE.MeshBasicMaterial({ map: spaceCmbTex(), side: THREE.BackSide, transparent: true, opacity: .5, depthWrite: false }));
    F.add(cmb); F.pick(cmb, 'cmb', -1); cmb.userData.noZoom = true;
    const cl = spaceLabel(F, cmb, 'Where the oldest light came from (illustrative colours)', 60, { offset: new V3(0, 9000, 0) }); cl.minSizeFn = () => cam.D > 2e25;
    // cosmic web: ILLUSTRATIVE. Random nodes joined to their neighbours, to 650 Mpc. Not a map of real galaxies.
    const nodes = [new V3()];
    for (let i = 0; i < 260; i++) nodes.push(new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(Math.cbrt(r()) * 650));
    const P = [], C = [], S = [];
    const gc = () => { const t = r(); return t < .45 ? [1, .92, .78] : t < .8 ? [.75, .85, 1] : [1, .78, .62]; };
    nodes.forEach((n, i) => {
      if (i === 0) return;
      const w = .4 + r() * 1.3, cnt = Math.floor(160 * w);
      for (let k = 0; k < cnt; k++) { const s = k < cnt * .3 ? 1.5 : 4.5; const c = gc(), b = .6 + r() * .4; P.push(n.x + gauss(r) * s, n.y + gauss(r) * s, n.z + gauss(r) * s); C.push(c[0] * b, c[1] * b, c[2] * b); S.push(1.2 + r() * 1.6); }
      const near = nodes.map((m, j) => [j, n.distanceTo(m)]).filter(x => x[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3);
      near.forEach(([j, d]) => { if (j < i || d > 140) return; const m = nodes[j], cnt2 = Math.floor(d * 1.6); for (let k = 0; k < cnt2; k++) { const t = r(), p = new V3().lerpVectors(n, m, t), w2 = 2 + Math.sin(t * Math.PI) * 2; const c = gc(), b = .35 + r() * .45; P.push(p.x + gauss(r) * w2, p.y + gauss(r) * w2, p.z + gauss(r) * w2); C.push(c[0] * b, c[1] * b, c[2] * b); S.push(1 + r()); } });
    });
    const web = makePoints(P, C, S); F.add(web); F.pick(web, 'filament', .3);
    getJSON('data/galaxies.json').then(G => {
      if (!F.built) return;
      G.filter(g => g.dist_mpc > 3.1).forEach(g => {
        const p = raDec3(g.ra_deg, g.dec_deg, g.dist_mpc).applyQuaternion(Q_EQ_TO_GAL);
        const big = g.diam_kpc / 1000, isGroup = g.diam_kpc >= 1000 || /cluster|group|attractor|anomaly/i.test(g.type);
        const s = glowSprite(/cluster|supercluster|attractor/i.test(g.type + g.name) ? 0xffe3b0 : 0xcfe0ff, Math.max(big * .5, .05), .35); s.position.copy(p); F.add(s);
        const mk = markerSprite(0xcfe0ff, 5); mk.position.copy(p); F.add(mk);
        const info = { title: g.name, tag: g.type + (g.group ? ` · ${g.group}` : ''), body: `<p>${g.note || ''}</p>`, facts: [['Distance from the Sun', spaceDist(g.dist_mpc)], [isGroup ? 'Extent' : 'Diameter', spaceSize(g.diam_kpc, isGroup)]], note: 'Its position and distance are catalogue values. The glow is a symbol for it, not a picture.' + (g.approx ? ' Values approximate.' : '') };
        const hs = spaceHit(Math.min(Math.max(big * .5, .05), 6), { id: 'cluster_' + g.name, priority: 2, info, sim: ['cosmos'], radius: Math.max(big / 2, .02), center: () => p.clone() });
        hs.position.copy(p); F.add(hs); F.pickables.push(hs);
        const L = spaceLabel(F, hs, g.name, isGroup ? 20 + Math.min(big, 10) : 10, { offset: new V3(0, Math.max(big * .6, 1.5), 0) });
        L.minSizeFn = () => isGroup ? F.dLoc > 3 : F.dLoc < 45;
      });
    });
    const lgm = markerSprite(0xffd166, 12); F.add(lgm);
    const lgh = spaceHit(.2, { id: 'localgroup', priority: 3, sim: ['localgroup'], center: () => new V3(), radius: 1.5 }); F.add(lgh); F.pickables.push(lgh);
    spaceLabel(F, lgh, 'Local Group (you are here)', 100, { cls: 'you', always: true });
    F.update = () => { const k = smooth(5e22, 8e23, cam.D); web.material.uniforms.uOpacity.value = k; web.visible = k > .02; cmb.material.opacity = .5 * smooth(2e24, 1.5e26, cam.D); };
    F.blurb = 'The observable universe, from our Local Group out to the shell of the oldest light we can see.';
    F.note = 'What is real: the labelled galaxies and clusters, at their catalogued sky positions and distances. What is illustrative: the glowing web of points (generated at random, drawn only out to about 650 Mpc, about 2 billion light-years) and the colours of the shell, which is not the Planck map.';
  }
};
/* ---------- Local Group (kpc, galactic orientation, GC at origin) ---------- */
FT.localgroup = {
  build(F) {
    F.scene.background = new THREE.Color(0); const sprites = [];
    F.update = () => { const k = smooth(2e20, 4e21, cam.D); sprites.forEach(s => s.material.opacity = (.12 + .88 * k) * F.alpha); };
    getJSON('data/galaxies.json').then(G => {
      if (!F.built) return;
      G.filter(g => g.dist_mpc <= 3.1 && g.name !== 'Milky Way').forEach(g => {
        const p = raDec3(g.ra_deg, g.dec_deg, g.dist_mpc * 1000).applyQuaternion(Q_EQ_TO_GAL).add(SUN_GAL);
        const kind = galKind(g.type), sz = Math.max(g.diam_kpc, .3), member = g.group === 'Local Group';
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: galaxySpriteTex(kind), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, rotation: g.ra_deg * Math.PI / 180 }));
        s.scale.set(sz * 1.3, kind === 'spiral' ? sz * .55 : sz, 1); s.position.copy(p); F.add(s); sprites.push(s);
        const mk = markerSprite(member ? 0x9fc4ff : 0x8a9bb5, 6); mk.position.copy(p); F.add(mk);
        const id = /M31/.test(g.name) ? 'andromeda' : /Large Magellanic/.test(g.name) ? 'lmc' : /Small Magellanic/.test(g.name) ? 'smc' : 'lg_' + g.name;
        const facts = [['Distance from the Sun', spaceDist(g.dist_mpc)], ['Diameter', spaceSize(g.diam_kpc)], ['Group', member ? 'Local Group (a member)' : `${g.group} (a neighbour, not a Local Group member)`]];
        const note = 'Its position and distance are catalogue values. The glow is a generic symbol for its type, not a picture.' + (g.approx ? ' Values approximate.' : '');
        const info = INFO[id] ? Object.assign({}, INFO[id], { facts, note }) : { title: g.name, tag: `${g.type} · ${g.group}`, body: `<p>${g.note || 'A galaxy near the Local Group.'}</p>`, facts, note };
        const hs = spaceHit(Math.max(sz * .4, .2), { id, priority: 2, info, sim: ['localgroup'], radius: sz, center: () => p.clone() }, { px: 12 });
        hs.position.copy(p); F.add(hs); F.pickables.push(hs);
        if (member ? (g.diam_kpc > 3 || /Magellan/.test(g.name)) : g.diam_kpc >= 10) { const L = spaceLabel(F, hs, g.name, member ? 30 + Math.min(g.diam_kpc, 40) / 4 : 12, { offset: new V3(0, sz * .6, 0) }); L.minSizeFn = () => cam.D > (member ? 1.5e21 : 1e22); }
      });
    });
    const ml = spaceLabel(F, F.add(new THREE.Object3D()), 'Milky Way', 90, { cls: 'you', offset: new V3(0, 18, 0) }); ml.minSizeFn = () => cam.D > 8e21;
    F.blurb = 'The Milky Way, Andromeda, Triangulum and the smaller galaxies around them, at their catalogued positions.';
    F.note = 'What is real: each galaxy\'s sky position and distance (catalogue values). Each glow is a generic symbol for its type, not a photograph, and the Milky Way is the schematic model. Galaxies beyond about 1 Mpc (NGC 3109, Sculptor, Maffei) are neighbours, not members.';
  }
};
/* ---------- Milky Way (kpc, galactic coordinates, GC at origin, Sun at x = -8.2) ---------- */
FT.milkyway = {
  build(F) {
    const r = rng(101), P = [], C = [], S = [];
    const push = (x, y, z, cr, cg, cb, s) => { if (Math.hypot(x - SUN_GAL.x, y - SUN_GAL.y, z - SUN_GAL.z) < .35) return; P.push(x, y, z); C.push(cr, cg, cb); S.push(s); };
    // arms trail the rotation (the Galaxy turns clockwise seen from the north pole; here the angle increases that way), so the angle falls outward
    const rb = 3.2, pitch = Math.tan(12 * Math.PI / 180), arms = [[0, .3], [Math.PI, .3], [Math.PI / 2, .2], [Math.PI * 1.5, .2]], off = 2.35;
    for (let i = 0; i < 60000; i++) {
      const u = r(); let k = 0, acc = 0; for (; k < 3; k++) { acc += arms[k][1]; if (u < acc) break; }
      const rr = Math.min(16, rb + (-Math.log(1 - r() * .985)) * 3.2), th = arms[k][0] + off - Math.log(rr / rb) / pitch;
      const sp = .18 + rr * .028, x = rr * Math.cos(th) + gauss(r) * sp, z = rr * Math.sin(th) + gauss(r) * sp, y = gauss(r) * (.08 + .1 * Math.exp(-rr / 4));
      const t = r(); if (t < .012) { push(x, y, z, .95, .45, .7, .35 + r() * .3); continue; }
      const col = t < .7 ? [.7, .82, 1] : t < .9 ? [1, 1, 1] : [1, .88, .7], b = .5 + r() * .5;
      push(x, y, z, col[0] * b, col[1] * b, col[2] * b, .12 + r() * .18);
    }
    const barA = 27 * Math.PI / 180;
    for (let i = 0; i < 16000; i++) { const bx = gauss(r) * (i < 10000 ? 1.7 : .9), bz = gauss(r) * (i < 10000 ? .5 : .9), by = gauss(r) * (i < 10000 ? .3 : .6); const x = bx * Math.cos(barA) - bz * Math.sin(barA), z = bx * Math.sin(barA) + bz * Math.cos(barA); const b = .55 + r() * .45; push(x, by, z, b, b * .85, b * .6, .14 + r() * .2); }
    for (let i = 0; i < 9000; i++) { const rr = Math.min(18, -Math.log(1 - r() * .99) * 3.6), th = r() * TAU, b = .15 + r() * .2; push(rr * Math.cos(th), gauss(r) * .15, rr * Math.sin(th), b * .95, b * .9, b * .85, .12); }
    for (let k = 0; k < 150; k++) { const v = new V3(gauss(r), gauss(r) * .8, gauss(r)).normalize().multiplyScalar(2 + Math.pow(r(), 1.6) * 30); for (let i = 0; i < 25; i++) push(v.x + gauss(r) * .06, v.y + gauss(r) * .06, v.z + gauss(r) * .06, 1, .88, .7, .1); }
    const gal = makePoints(P, C, S); F.add(gal); F.pick(gal, 'spiralArm', .2);
    F.add(glowSprite(0xffd9a0, 6, .7)); F.add(glowSprite(0xfff3dc, 2, 1));
    // Sagittarius A*: a click, a double-click, a card button and scrolling onto it all lead into the black-hole scene
    const sgr = spaceHit(.0004, { id: 'sgrA', priority: 2.5, radius: 3e-9, center: () => new V3(), zoomTo: () => { flyTo(FR.sgr, new V3(), 3e11); } }, { px: 16, off: () => chainOf(cam.A).includes(FR.sgr) });
    F.add(sgr); F.pickables.push(sgr); spaceLabel(F, sgr, 'Sagittarius A* (black hole)', 90, { offset: new V3(0, .6, 0) });
    const sh = spaceHit(.01, { id: 'sunMarker', priority: 3, radius: .01, center: () => SUN_GAL.clone(), zoomTo: () => { flyTo(FR.solar, new V3(), 1.5e13); } }, { px: 16 });
    sh.position.copy(SUN_GAL); F.add(sh); F.pickables.push(sh);
    const smk = markerSprite(0xffd166, 14); smk.position.copy(SUN_GAL); F.add(smk);
    spaceLabel(F, sh, 'The Sun (you are here)', 100, { cls: 'you', always: true, offset: new V3(0, .5, 0) });
    // dark-matter halo (toggle): schematic, a smooth glow about 250 kpc in radius with a cloud of points that thins outward
    const halo = new THREE.Group(); halo.visible = false; F.add(halo);
    const hP = [], hC = [], hS = [];
    for (let i = 0; i < 6000; i++) { const v = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(250 * Math.pow(r(), 1.7)); hP.push(v.x, v.y, v.z); hC.push(.42, .2, .8); hS.push(3 + r() * 3); }
    halo.add(makePoints(hP, hC, hS, { opacity: .5 }));
    const hg = glowSprite(0x7a4cd8, 520, .5); halo.add(hg); const hg2 = glowSprite(0x9a6cf0, 200, .45); halo.add(hg2);
    const hl = new THREE.Object3D(); hl.position.set(0, 250, 0); halo.add(hl); spaceLabel(F, hl, 'Dark matter halo (schematic): extends to roughly 250 kpc', 70, {});
    seg([['vis', 'Visible galaxy'], ['dm', 'Dark matter halo']], 'vis', k => { halo.visible = k === 'dm'; if (k === 'dm') { showInfo('darkhalo'); if (cam.D < 6e21) flyTo(FR.mw, new V3(), 1.2e22); } else if (cam.D > 6e21) flyTo(FR.mw, new V3(), 2e21); });
    F.blurb = 'Our galaxy: 100–400 billion stars. The Sun is about 27,000 light-years (8.2 kpc) from the centre.';
    F.note = 'What is real: the positions of the Sun and of Sagittarius A*. What is illustrative: every other star here is generated. The number of arms, their winding and the bar angle are an artist\'s impression, not the measured arms, and the dark-matter halo (about 250 kpc, schematic) is a smooth glow, not a map.';
    F.update = () => { const k = smooth(1e19, 6e20, cam.D); gal.material.uniforms.uMaxPx.value = lerp(1.7, 64, k); gal.material.uniforms.uOpacity.value = lerp(.55, 1, k) * F.alpha; };
  }
};
/* ---------- solar neighborhood: real stars (HYG), parsecs, equatorial three ---------- */
let STAR = null;
function loadStars() {
  if (STAR) return STAR;
  STAR = Promise.all([getJSON('data/stars/stars_bin.json').then(j => { const bin = atob(j.b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }), getJSON('data/stars/stars_meta.json'), getJSON('data/stars/constellations.json').catch(() => null)]).then(([buf, meta, con]) => ({ f: new Float32Array(buf), meta, con }));
  return STAR;
}
function starMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: renderer.getPixelRatio() }, uOpacity: { value: 1 }, uLim: { value: 6.8 }, uExp: { value: 0 } },
    vertexShader: LDV(`attribute float aMag; attribute vec3 aColor; uniform float uScale; uniform float uLim; uniform float uExp; varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float d=max(length(mv.xyz),1e-7);
        float m=aMag+5.0*log(d)/2.302585-5.0-uExp; float b=pow(10.0,-0.4*(m-1.0));
        float s=clamp(1.5+2.6*pow(b,0.4),1.2,16.0); vA=clamp(b*2.0,0.0,1.0)*(1.0-smoothstep(uLim-1.0,uLim+1.5,m));
        vC=aColor; gl_PointSize=s*uScale; gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(`uniform float uOpacity; varying vec3 vC; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); a=a*a*0.7+smoothstep(0.18,0.0,d)*0.6; if(vA*a<0.003) discard; gl_FragColor=vec4(vC*a*vA*uOpacity, 1.0); }`),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
}
/* ---- what a star is, from its catalogue row ----
   Luminosity is TOTAL (bolometric): visual luminosity from the absolute magnitude plus a bolometric correction BC_V(Teff) (Flower 1996 as
   corrected by Torres 2010, AJ 140, 1158: L/Lsun = 10^(-0.4[M_V - 4.81 + BC_V + 0.08])). Teff comes from B-V (Ballesteros 2012), radius from L and
   Teff (L = 4 pi R^2 sigma T^4). A few stars have measured values in stars_meta.json ("phys"); those win. */
const BC_FLOWER = [[-0.190537291496456E+05, 0.155144866764412E+05, -0.421278819301717E+04, 0.381476328422343E+03], [-0.370510203809015E+05, 0.385672629965804E+05, -0.150651486316025E+05, 0.261724637119416E+04, -0.170623810323864E+03], [-0.118115450538963E+06, 0.137145973583929E+06, -0.636233812100225E+05, 0.147412923562646E+05, -0.170587278406872E+04, 0.788731721804990E+02]];
function starEstimate(M, bv) {
  const T = bvColor(bv)[3], lt = Math.log10(T), c = BC_FLOWER[lt < 3.7 ? 0 : lt < 3.9 ? 1 : 2];
  let bc = 0; for (let i = 0; i < c.length; i++) bc += c[i] * Math.pow(lt, i);
  const L = Math.pow(10, -.4 * (M - 4.81 + bc + .08));
  return { T, BC: bc, L, R: Math.sqrt(L) / Math.pow(T / 5772, 2), measured: false };
}
function cleanSpectral(sp) {
  let s = String(sp || '').replace(/\.{2,}/g, '').replace(/:/g, '').trim(); s = s.split(/\s*[+/]\s*|\s+comp|\s+SB/)[0].trim();
  if (!s) return { text: '', hint: '' };
  const sd = /^sd/.test(s), core = s.replace(/^sd/, ''), k = core[0], cls = { O: 'blue', B: 'blue-white', A: 'white', F: 'yellow-white', G: 'yellow', K: 'orange', M: 'red', D: 'white dwarf' }[k] || '';
  const lum = /Ia|Ib|^[OBAFGKM]\d?(\.\d)?I(?![IV])/.test(core) ? 'supergiant' : /III/.test(core) ? 'giant' : /II/.test(core) ? 'bright giant' : /IV/.test(core) ? 'subgiant' : /V/.test(core) ? 'dwarf' : '';
  return { text: s, hint: [sd ? 'subdwarf' : '', cls, lum].filter(Boolean).join(' ').replace('white dwarf dwarf', 'white dwarf') };
}
// the spheres, stick figures and names of the 88 constellations (IAU abbreviations)
const CON_NAMES = { And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aqr: 'Aquarius', Aql: 'Aquila', Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga', Boo: 'Boötes', Cae: 'Caelum', Cam: 'Camelopardalis', Cnc: 'Cancer', CVn: 'Canes Venatici', CMa: 'Canis Major', CMi: 'Canis Minor', Cap: 'Capricornus', Car: 'Carina', Cas: 'Cassiopeia', Cen: 'Centaurus', Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon', Cir: 'Circinus', Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis', CrB: 'Corona Borealis', Crv: 'Corvus', Crt: 'Crater', Cru: 'Crux', Cyg: 'Cygnus', Del: 'Delphinus', Dor: 'Dorado', Dra: 'Draco', Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax', Gem: 'Gemini', Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra', Hyi: 'Hydrus', Ind: 'Indus', Lac: 'Lacerta', Leo: 'Leo', LMi: 'Leo Minor', Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus', Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa', Mic: 'Microscopium', Mon: 'Monoceros', Mus: 'Musca', Nor: 'Norma', Oct: 'Octans', Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus', Per: 'Perseus', Phe: 'Phoenix', Pic: 'Pictor', Psc: 'Pisces', PsA: 'Piscis Austrinus', Pup: 'Puppis', Pyx: 'Pyxis', Ret: 'Reticulum', Sge: 'Sagitta', Sgr: 'Sagittarius', Sco: 'Scorpius', Scl: 'Sculptor', Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Tau: 'Taurus', Tel: 'Telescopium', Tri: 'Triangulum', TrA: 'Triangulum Australe', Tuc: 'Tucana', UMa: 'Ursa Major', UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo', Vol: 'Volans', Vul: 'Vulpecula' };
FT.neighborhood = {
  build(F) {
    loadStars().then(({ f, meta, con }) => {
      if (!F.built) return;
      const n = f.length / 6, pos = new Float32Array(n * 3), mag = new Float32Array(n), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const x = f[i * 6], y = f[i * 6 + 1], z = f[i * 6 + 2]; pos[i * 3] = x; pos[i * 3 + 1] = z; pos[i * 3 + 2] = -y; mag[i] = f[i * 6 + 3]; const c = bvColor(f[i * 6 + 4]); col.set(c.slice(0, 3), i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      const mat = starMaterial(), pts = new THREE.Points(g, mat); pts.frustumCulled = false; F.add(pts);
      const names = {}; meta.named.forEach(([i, nm, sp, ly]) => names[i] = [nm, sp, ly]);
      const phys = meta.phys || {}, notes = meta.notes || {};
      // everything the card and the star scene need to know about star i
      const starInfo = i => {
        const nm = names[i] && names[i][0], M = f[i * 6 + 3], bv = f[i * 6 + 4], d = Math.hypot(f[i * 6], f[i * 6 + 1], f[i * 6 + 2]);
        const est = starEstimate(M, bv), m = phys[nm], P = Object.assign({}, est);
        if (m) { P.measured = true; P.src = m.src; ['T', 'L', 'R'].forEach(k => { if (m[k] !== undefined) P[k] = m[k]; }); if (m.R === undefined) P.R = Math.sqrt(P.L) / Math.pow(P.T / 5772, 2); else if (m.L === undefined) P.L = P.R * P.R * Math.pow(P.T / 5772, 4); }
        return { i, nm, M, bv, d, P, sp: cleanSpectral(names[i] && names[i][1]), note: nm && notes[nm], hip: f[i * 6 + 5] | 0 };
      };
      const cardFor = i => {
        const s = starInfo(i), P = s.P, appM = s.M + 5 * Math.log10(Math.max(s.d, 1e-3) / 10);
        const fmtL = L => L >= 100 ? Math.round(L).toLocaleString('en-US') : L >= 1 ? L.toPrecision(3) : L.toPrecision(2);
        const km = P.R * 695700;
        const how = P.measured ? `Radius, temperature and luminosity are measured values (${P.src}).` : 'Temperature, luminosity and radius are estimates worked out from the star\'s colour and brightness: a bolometric correction turns visual brightness into total output, and the radius follows from that and the temperature. Good to tens of per cent for ordinary stars, worse for very red stars and giants, and too low for the hottest stars.';
        return {
          title: s.nm || `Star HIP ${s.hip || '—'}`, tag: s.sp.text ? `Star · spectral type ${s.sp.text}${s.sp.hint ? ' (' + s.sp.hint + ')' : ''}` : 'Star',
          body: `<p>A real star from the HYG catalog, drawn at its measured 3D position. Its colour comes from its measured B–V colour index, which tracks surface temperature.${s.note ? ' ' + s.note : ''}</p>`,
          facts: [['Distance from the Sun', `${sig(s.d * LY_PER_PC, s.d < 10 ? 3 : 2)} light-years (${sig(s.d, 3)} pc)`], ['Total luminosity', `${P.measured ? '' : '≈ '}${fmtL(P.L)} × Sun`], ['Radius', `${P.measured ? '' : '≈ '}${sig(P.R, 3)} × Sun (${km >= 1e6 ? sig(km / 1e6) + ' million' : sig(km)} km)`], ['Surface temperature', `${P.measured ? '' : '≈ '}${sig(Math.round(P.T / 10) * 10, 3)} K`], ['Absolute magnitude (visual)', s.M.toFixed(2)], ['Seen from Earth (apparent magnitude)', appM.toFixed(1)]],
          note: `${how} Distances come from parallax measurements; they get uncertain, by tens of per cent, beyond a few hundred light-years.`
        };
      };
      const hitOf = i => ({ id: 'star', priority: 3, starIndex: i, infoFn: h => cardFor(h && h.obj && h.obj.userData.starIndex !== undefined ? h.obj.userData.starIndex : h.hit.index), sim: ['star'] });
      // a star frame for star i, so Zoom in and the scroll wheel both reach a star with its own size and colour
      const starFrame = i => {
        const s = starInfo(i), p = new V3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        return new Frame({ type: 'star', pinned: true, name: s.nm || `Star HIP ${s.hip}`, unit: 6.957e8, radius: 8e5, r0: 1e7, r1: 3e14, pos: p, opts: { idx: i, name: s.nm, bv: s.bv, M: s.M, P: s.P, sp: s.sp, note: s.note } });
      };
      const zoomStar = i => {
        let fr = F.children.find(c => c.type === 'star' && c.opts && c.opts.idx === i);
        if (!fr) { fr = starFrame(i); fr.dynamic = true; F.addChild(fr); }
        flyTo(fr, new V3(), Math.max(fr.opts.P.R * 6.957e8 * 3.2, 1e6));
      };
      const PX = 7, PXB = 9;
      pts.raycast = function (rc, out) { // the visible star nearest the cursor; brighter stars get a larger target
        const O = rc.ray.origin, D = rc.ray.direction, rp = F.root.position, cm = rc.camera, fr = cm && cm.isPerspectiveCamera ? 2 * Math.tan(cm.fov * Math.PI / 360) / H : .0012;
        const lim = mat.uniforms.uLim.value + .3, ex = mat.uniforms.uExp.value; let best = -1, bs = 1, bt = 0, bx = 0, by = 0, bz = 0;
        for (let i = 0; i < n; i++) {
          const wx = pos[i * 3] + rp.x - O.x, wy = pos[i * 3 + 1] + rp.y - O.y, wz = pos[i * 3 + 2] + rp.z - O.z, t = wx * D.x + wy * D.y + wz * D.z; if (t <= 0) continue;
          const l2 = wx * wx + wy * wy + wz * wz, ang = Math.sqrt(Math.max(l2 - t * t, 0)) / t; if (ang > fr * (PX + PXB)) continue;
          const m = mag[i] + 5 * Math.log10(Math.sqrt(l2)) - 5 - ex; if (m > lim) continue;
          const tol = fr * (PX + PXB * clamp((lim - m) / 7, 0, 1)), sc = ang / tol; if (sc < bs) { bs = sc; best = i; bt = t; bx = wx; by = wy; bz = wz; }
        }
        if (best >= 0) out.push({ distance: bt, point: new V3(bx, by, bz).add(O), index: best, object: this });
      };
      pts.userData = Object.assign(pts.userData, { priority: 1, resolve: () => 'star', id: 'star', sim: ['star'] });
      pts.userData.infoFn = h => cardFor(h.hit.index);
      pts.userData.center = h => new V3(pos[h.hit.index * 3], pos[h.hit.index * 3 + 1], pos[h.hit.index * 3 + 2]); pts.userData.radius = () => 2e-7;
      pts.userData.zoomTo = h => zoomStar(h.hit.index);
      F.pickables.push(pts);
      F.stars = { f, names, pts, starFrame };
      const show = ['Sirius', 'Canopus', 'Arcturus', 'Vega', 'Capella', 'Rigel', 'Procyon', 'Betelgeuse', 'Altair', 'Aldebaran', 'Antares', 'Spica', 'Pollux', 'Deneb', 'Polaris', 'Rigil Kentaurus', 'Proxima Centauri', 'Barnard\'s Star', 'Fomalhaut', 'Regulus'];
      meta.named.forEach(([i, nm]) => {
        if (!show.includes(nm)) return;
        const o = new THREE.Object3D(); o.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        o.userData = Object.assign(hitOf(i), { center: () => o.position.clone(), radius: 2e-7, zoomTo: () => zoomStar(i) }); F.add(o);
        spaceLabel(F, o, nm, 40 - f[i * 6 + 3] * .5, {});
      });
      // constellation figures: drawn on a sphere around the Sun's neighbourhood, as a pattern on the sky (the stars in each figure are at very different distances)
      if (con && con.lines) {
        const lp = [], cg = new THREE.Group(); cg.visible = store.get('const', false); F.add(cg);
        const dirOf = i => { const v = new V3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); return v.length() > 0 ? v.normalize() : v; };
        con.lines.forEach(([ab, segs]) => {
          const c = new V3(); let k = 0;
          segs.forEach(([a, b]) => { const A = dirOf(a), B = dirOf(b); lp.push(A.x, A.y, A.z, B.x, B.y, B.z); c.add(A).add(B); k += 2; });
          if (k && CON_NAMES[ab]) { c.divideScalar(k); if (c.length() > .1) { c.normalize(); const o = new THREE.Object3D(); o.position.copy(c); cg.add(o); const L = spaceLabel(F, o, CON_NAMES[ab], 5, { cls: 'con' }); L.el.style.opacity = '.75'; } }
        });
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
        F.conLines = cg; cg.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5b7bb0, transparent: true, opacity: .45, depthWrite: false })));
        cg.children.forEach(o => { if (o.isLineSegments) o.frustumCulled = false; });
      }
      F.update = () => {
        mat.uniforms.uExp.value = 5 * Math.log10(Math.max(1, F.dLoc / 10)); // pulling far out, stars are brightened evenly so the catalogue stays visible
        if (F.conLines && F.conLines.visible && F.C) F.conLines.scale.setScalar(Math.max(5, F.C.length() * 2));
      };
    });
    const sunh = spaceHit(.0005, { id: 'sun', priority: 3, radius: 1e-6, center: () => new V3(), zoomTo: () => { flyTo(FR.solar, new V3(), 1.5e13); } }, { px: 14 }); F.add(sunh); F.pickables.push(sunh);
    const sun = markerSprite(0xfff1c8, 10); F.add(sun); spaceLabel(F, sunh, 'Sun', 100, { cls: 'you', always: true });
    seg([['off', 'No constellations'], ['on', 'Constellation lines']], store.get('const', false) ? 'on' : 'off', k => { store.set('const', k === 'on'); if (F.conLines) F.conLines.visible = k === 'on'; });
    F.blurb = '109,400 real stars from the HYG catalog, at their measured positions and colours. Far out, all stars are brightened evenly so you can see them; their relative brightness is true.';
    F.note = 'Real: the positions, colours and brightness of the catalogued stars. Constellation lines, if shown, are a pattern on our sky, drawn on a sphere around you: the stars in each figure are at very different distances and are not connected in space.';
    F.spawn = (T, hint) => {
      if (!F.stars) return null;
      const f = F.stars.f; let i = -1;
      if (hint && hint.id === 'star' && hint.hit && hint.hit.index !== undefined) i = hint.hit.index;
      else { let bd = cam.D / F.unit * 1.2; for (let k = 0, n = f.length / 6; k < n; k++) { const d = Math.hypot(f[k * 6] - T.x, f[k * 6 + 2] - T.y, -f[k * 6 + 1] - T.z); if (d < bd) { bd = d; i = k; } } }
      if (i < 0) return null;
      const p = new V3(f[i * 6], f[i * 6 + 2], -f[i * 6 + 1]);
      if (p.distanceTo(T) > cam.D / F.unit * 3) return null;
      return F.stars.starFrame(i);
    };
  }
};
/* ---------- a single star (unit = solar radius) ---------- */
function starSurfaceMaterial(rgb, gran) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Vector3(rgb[0], rgb[1], rgb[2]) }, uGran: { value: gran } },
    vertexShader: LDV(`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform vec3 uCol; uniform float uGran; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 p=normalize(vP)*uGran; float n=fbm3(p+vec3(0.,uTime*.06,uTime*.03)+fbm3(p*1.7-uTime*.04)); vec3 c=mix(uCol*vec3(.8,.66,.55), uCol*1.06, smoothstep(.25,.8,n)); float mu=abs(dot(normalize(vN),normalize(vV))); c*=.5+.6*pow(mu,.6); gl_FragColor=vec4(c,1.); }`)
  });
}
FT.star = {
  build(F, o) {
    const P = o.P || starEstimate(o.M, o.bv), c = bvColor(o.bv), R = P.R, T = P.T;
    // the colour is the blackbody colour of the star's own temperature
    const tc = P.measured ? (() => { let best = c, bd = 1e9; for (let b = -.4; b <= 2; b += .02) { const k = bvColor(b), d = Math.abs(k[3] - T); if (d < bd) { bd = d; best = k; } } return best; })() : c;
    const mat = starSurfaceMaterial(tc, R > 100 ? 1.6 : R > 10 ? 2.4 : 3.2); const m = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), mat); F.add(m); F.pick(m, 'starbody');
    const km = R * 695700, fmtL = L => L >= 100 ? Math.round(L).toLocaleString('en-US') : L >= 1 ? L.toPrecision(3) : L.toPrecision(2), a = P.measured ? '' : '≈ ';
    m.userData.info = {
      title: o.name || 'A star', tag: 'Star' + (o.sp && o.sp.text ? ` · spectral type ${o.sp.text}` : ''),
      body: `<p>A ball of hot plasma held together by its own gravity and powered by nuclear fusion in its core (a giant or supergiant has left the stable hydrogen-burning stage). The size and colour here are this star's own.${o.note ? ' ' + o.note : ''}</p>`,
      facts: [['Radius', `${a}${sig(R, 3)} × Sun (${km >= 1e6 ? sig(km / 1e6) + ' million' : sig(km)} km)`], ['Surface temperature', `${a}${sig(Math.round(T / 10) * 10, 3)} K`], ['Total luminosity', `${a}${fmtL(P.L)} × Sun`]],
      note: (P.measured ? `Measured values (${P.src}).` : 'Estimated from the star\'s colour and brightness (a bolometric correction, then L = 4πR²σT⁴); good to tens of per cent for ordinary stars, worse for giants and very red stars.') + ' The mottled surface is a schematic texture; real stars are not seen in this detail except the Sun.'
    };
    m.userData.sim = ['star']; m.userData.madeOf = 'plasma';
    F.add(glowSprite(new THREE.Color(tc[0], tc[1], tc[2]).getHex(), R * 6, .8)); F.add(glowSprite(0xffffff, R * 2.4, .9));
    F.update = (dt, t) => { mat.uniforms.uTime.value = t; m.rotation.y += dt * .02; };
    F.spawn = (T2) => T2.length() < R * 1.2 ? new Frame({ type: 'plasma', name: 'Stellar plasma', unit: 1e-10, radius: 60, r0: 1e-14, r1: 1e-7, pos: T2.clone() }) : null;
  }
};
/* ---------- solar system (AU, ecliptic three: Y = north ecliptic pole) ---------- */
let SOLAR = null;
const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
FT.solarsystem = {
  build(F) {
    F.scene.background = null;
    F.add(new THREE.AmbientLight(0x404a66, .25)); const pl = new THREE.PointLight(0xfff4e0, 2.2, 0, 0); F.add(pl);
    const KM = 1 / 1.495978707e8;
    const sunR = 695700 * KM, sunM = new THREE.Mesh(new THREE.SphereGeometry(sunR, 64, 48), sunMaterial()); F.add(sunM); F.pick(sunM, 'sun');
    sunM.userData.madeOf = 'plasma';
    F.add(glowSprite(0xffc070, sunR * 14, .6)); F.add(glowSprite(0xfff1d0, sunR * 4, .9));
    const sunMk = markerSprite(0xfff1c8, 16); F.add(sunMk); F.label(sunM, 'Sun', { offset: new V3(0, sunR * 2, 0) });
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x7084b0, transparent: true, opacity: .35, depthWrite: false });
    F.bodies = {};
    getJSON('data/solar.json').then(SD => {
      SOLAR = SD;
      PLANETS.forEach(name => {
        const d = SD.find(b => b.name === name); if (!d) return;
        const grp = new THREE.Group(); F.add(grp);
        const rAU = d.radius_km * KM;
        const map = d.texture ? tex(d.texture) : null;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(rAU, 48, 32), new THREE.MeshStandardMaterial({ map, color: map ? 0xffffff : 0xbbbbbb, roughness: .9 }));
        grp.add(mesh);
        if (d.ring && d.ring.texture) { const ri = d.ring.inner_km * KM, ro = d.ring.outer_km * KM, rg = new THREE.RingGeometry(ri, ro, 128, 1); const pa = rg.attributes.position, uv = rg.attributes.uv, v = new V3(); for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); uv.setXY(i, (v.length() - ri) / (ro - ri), .5); } const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: tex(d.ring.texture), transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; grp.add(ring); }
        grp.rotation.z = (d.axial_tilt_deg || 0) * Math.PI / 180 * (d.axial_tilt_deg > 90 ? 1 : 1);
        const mk = markerSprite(0xffffff, 7); grp.add(mk);
        const id = name === 'Earth' ? 'earthPlanet' : name.toLowerCase();
        grp.userData.id = id; grp.userData.priority = 2; grp.userData.radius = rAU; grp.userData.sim = [name === 'Pluto' ? 'dwarf:pluto' : 'planet:' + name.toLowerCase()];
        F.pickables.push(grp); const hs = hitSphere(rAU * 1.5, id, 2); grp.add(hs);
        F.label(grp, name, { offset: new V3(0, rAU * 3, 0) });
        // orbit: sample the real ephemeris over one period
        if (window.Astronomy) {
          const P = d.orbital_period_days || 365, pts = [], t0 = simTime;
          for (let k = 0; k <= 180; k++) { const v = Astronomy.HelioVector(name, new Date(t0 + k / 180 * P * 86400000)); pts.push(eq3(v.x, v.y, v.z).applyQuaternion(Q_EQ_TO_ECL)); }
          F.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat));
        }
        F.bodies[name] = { grp, mesh, d, rAU };
      });
      Object.values(F.bodies).forEach(b => { const ch = F.children.find(c => c.opts && c.opts.body === b.d.name); if (ch) ch.proxy = b.grp; });
    });
    // belts and clouds (statistical, real extents)
    const r = rng(5), ap = [], ac = [], as = [];
    const kep = (a, e, i, node, w, M) => { let E = M; for (let k = 0; k < 6; k++) E = M + e * Math.sin(E); const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E); const cw = Math.cos(w), sw = Math.sin(w), cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(i), si = Math.sin(i); const X = (cn * cw - sn * sw * ci) * x + (-cn * sw - sn * cw * ci) * y, Yy = (sn * cw + cn * sw * ci) * x + (-sn * sw + cn * cw * ci) * y, Z = (sw * si) * x + (cw * si) * y; return [X, Z, -Yy]; };
    for (let k = 0; k < 6000; k++) { const p = kep(2.1 + r() * 1.2, r() * .2, Math.abs(gauss(r)) * .15, r() * TAU, r() * TAU, r() * TAU); ap.push(...p); const b = .4 + r() * .4; ac.push(b * .85, b * .78, b * .68); as.push(.004 + r() * .006); }
    const belt = makePoints(ap, ac, as); F.add(belt); F.pick(belt, 'asteroids', .3);
    const kp = [], kc = [], ks = [];
    for (let k = 0; k < 5000; k++) { const p = kep(r() < .2 ? 39.4 : 42 + r() * 6, r() * .15, Math.abs(gauss(r)) * .12, r() * TAU, r() * TAU, r() * TAU); kp.push(...p); const b = .3 + r() * .35; kc.push(b * .75, b * .85, b); ks.push(.05 + r() * .05); }
    const kb = makePoints(kp, kc, ks, { opacity: .8 }); F.add(kb); F.pick(kb, 'kuiper', .25);
    const op = [], oc = [], os = [];
    for (let k = 0; k < 4000; k++) { const v = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(Math.exp(lerp(Math.log(2000), Math.log(100000), r()))); op.push(v.x, v.y, v.z); oc.push(.35, .4, .5); os.push(v.length() * .004); }
    const oort = makePoints(op, oc, os, { opacity: .6 }); F.add(oort); oort.userData = { id: 'oort', priority: .1, info: { title: 'Oort Cloud', tag: 'Icy outskirts (hypothesized)', body: '<p>A vast spherical swarm of icy bodies thought to surround the solar system from about 2,000 to 100,000 AU — up to a third of the way to the nearest star. It has never been seen directly; long-period comets are the evidence.</p>', facts: [['Extent', '≈ 2,000–100,000 AU (approx.)']] } }; F.pickables.push(oort);
    const hel = new THREE.Mesh(new THREE.SphereGeometry(120, 64, 32), fresnelMat(0x5ab4ff, 2.6, .5)); F.add(hel);
    const helH = hitSphere(122, 'heliosphere', -.2); helH.userData.info = { title: 'Heliopause', tag: 'Edge of the Sun\'s wind', body: '<p>Where the solar wind is stopped by the gas between the stars, about 120 AU from the Sun. Voyager 1 crossed it in 2012 and Voyager 2 in 2018.</p>', facts: [['Distance', '≈ 120 AU']] }; helH.userData.noZoom = true; F.add(helH); F.pickables.push(helH);
    F.label(helH, 'Heliopause (~120 AU)', { offset: new V3(0, 120, 0) });
    [['Voyager 1', 257.6, 12.1, 168], ['Voyager 2', 296.5, -57.9, 141]].forEach(([nm, ra, de, au]) => { const p = raDec3(ra, de, au).applyQuaternion(Q_EQ_TO_ECL); const m = markerSprite(0x9fffe0, 6); m.position.copy(p); F.add(m); F.label(m, `${nm} (≈${au} AU, approx.)`); });
    F.blurb = 'The Sun and planets at their real positions for the date shown, at true size. Planets are tiny dots — space is mostly empty.';
    F.timeNote = null;
    F.update = (dt, t) => {
      sunM.material.uniforms.uTime.value = t;
      orbitMat.opacity = .35 * smooth(2e9, 3e10, cam.D) * F.alpha;
      for (const nm in F.bodies) { const b = F.bodies[nm]; b.grp.position.copy(helio3(nm)); b.mesh.rotation.y += dt * TAU / Math.abs(b.d.rotation_period_h || 24) / 3600 * Math.max(timeSpeed, 1) * Math.sign(b.d.rotation_period_h || 1); }
    };
  }
};
/* ---------- generic planet (unit 1000 km) ---------- */
FT.planet = {
  build(F, o) {
    const d = SOLAR && SOLAR.find(b => b.name === o.body); if (!d) return;
    F.add(new THREE.AmbientLight(0x334455, .25)); const sl = new THREE.DirectionalLight(0xffffff, 1.3); F.add(sl); F.add(sl.target);
    const R = d.radius_km / 1000, map = d.texture ? tex(d.texture) : null;
    const spin = new THREE.Group(); F.add(spin); spin.rotation.z = (d.axial_tilt_deg || 0) * Math.PI / 180;
    const body = new THREE.Group(); spin.add(body);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map, roughness: .95 })); body.add(mesh);
    const id = o.body === 'Pluto' ? 'pluto' : o.body.toLowerCase(); F.pick(mesh, id); mesh.userData.madeOf = /Jupiter|Saturn|Uranus|Neptune/.test(o.body) ? 'gasgiant' : 'regolith';
    mesh.userData.sim = ['planet:' + id];
    if (d.ring && d.ring.texture) { const ri = d.ring.inner_km / 1000, ro = d.ring.outer_km / 1000, rg = new THREE.RingGeometry(ri, ro, 256, 1); const pa = rg.attributes.position, uv = rg.attributes.uv, v = new V3(); for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); uv.setXY(i, (v.length() - ri) / (ro - ri), .5); } const ring = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: tex(d.ring.texture), transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1 })); ring.rotation.x = -Math.PI / 2; spin.add(ring); F.pick(ring, 'saturn', .5); }
    if (/Venus|Jupiter|Saturn|Uranus|Neptune|Earth|Mars/.test(o.body)) F.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.015, 64, 48), fresnelMat(/Mars/.test(o.body) ? 0xffa070 : /Venus/.test(o.body) ? 0xffe0a0 : 0x9fd0ff, 3, .9)));
    const moons = (SOLAR || []).filter(m => m.parent === o.body);
    F.moons = moons.map(m => {
      const mr = m.radius_km / 1000, mm = new THREE.Mesh(new THREE.SphereGeometry(mr, 48, 32), new THREE.MeshStandardMaterial({ map: m.texture ? tex(m.texture) : null, color: m.texture ? 0xffffff : 0xaaaaaa, roughness: 1 }));
      spin.add(mm); mm.userData = { id: 'moon_' + m.name, priority: 2, info: { title: m.name, tag: `Moon of ${o.body}`, body: `<p>${m.notes || ''}</p>`, facts: [['Radius', `${m.radius_km} km`], ['Orbit', `${(m.semimajor_km / 1000).toFixed(0)} thousand km`], ['Period', `${m.orbital_period_days} days`]] }, madeOf: 'regolith' }; F.pickables.push(mm);
      F.label(mm, m.name, { offset: new V3(0, mr * 1.6, 0) }); const mk = markerSprite(0xffffff, 5); mm.add(mk);
      return { mm, a: m.semimajor_km / 1000, P: Math.abs(m.orbital_period_days || 1), ph: (m.name.length * 1.7) % TAU, retro: (m.orbital_period_days || 1) < 0 };
    });
    F.radius = Math.max(R * 8, ...F.moons.map(m => m.a * 1.15), 10);
    F.update = (dt, t) => {
      body.rotation.y = (simTime / 3600000 / (d.rotation_period_h || 24)) % 1 * TAU;
      const days = simTime / 86400000; F.moons.forEach(m => { const a = m.ph + days / m.P * TAU * (m.retro ? -1 : 1); m.mm.position.set(Math.cos(a) * m.a, 0, -Math.sin(a) * m.a); });
      const s = sunDirIn(F); sl.position.copy(s).multiplyScalar(100);
    };
    F.blurb = `${o.body} at its true size, with its major moons at their real orbital distances.`;
    F.spawn = (T) => { if (T.length() < R * 1.05) return bodySurface(() => new V3(), () => body.getWorldQuaternion(new THREE.Quaternion()), R, T, /Jupiter|Saturn|Uranus|Neptune/.test(o.body) ? 'cloudtops' : /Mars/.test(o.body) ? 'mars' : /Venus/.test(o.body) ? 'venus' : 'moonrock', o.body);
      for (const m of F.moons) if (T.distanceTo(m.mm.position.clone().applyQuaternion(spin.quaternion)) < m.mm.geometry.parameters.radius * 1.05) { const mm = m.mm; return bodySurface(() => mm.position.clone().applyQuaternion(spin.quaternion), () => spin.quaternion.clone(), mm.geometry.parameters.radius, T, 'moonrock', mm.userData.info.title); }
      return null; };
    F.spawnD = 3e5;
  }
};
function bodySurface(getC, getQ, R, T, biome, body) { // landscape frame glued to a rotating/moving body (parent unit = 1000 km)
  const q0 = getQ(), nl = T.clone().sub(getC()).applyQuaternion(q0.clone().invert()).normalize();
  const f = landscapeFrame(biome, new V3(), null, body); f.r1 = 2e5;
  f.place = () => { const q = getQ(); f.pos.copy(nl).multiplyScalar(R * 1.0000002).applyQuaternion(q).add(getC()); f.quat.copy(q).multiply(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), nl)); };
  f.place(); return f;
}
/* ---------- Earth (unit 1000 km, non-rotating equatorial frame; the globe spins by GMST) ---------- */
const PARK = { lat: 51.4769, lon: -0.0005, name: 'Greenwich Park, London' };
let EARTH_PIX = null;
FT.earth = {
  build(F) {
    F.add(new THREE.AmbientLight(0x223355, .08));
    const sl = new THREE.DirectionalLight(0xffffff, 1.4); F.add(sl); F.add(sl.target);
    const R = 6.371, spin = new THREE.Group(); F.add(spin); F.spin = spin;
    const day = tex('earth_day.jpg', t => { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); g.drawImage(t.image, 0, 0, 1024, 512); EARTH_PIX = g.getImageData(0, 0, 1024, 512); });
    const mat = new THREE.ShaderMaterial({
      uniforms: { tDay: { value: day }, tNight: { value: tex('earth_night.jpg') }, tSpec: { value: tex('earth_water_mask.png') }, uSun: { value: new V3(1, 0, 0) }, uOpacity: { value: 1 } },
      vertexShader: LDV(`varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`),
      fragmentShader: LDF(`uniform sampler2D tDay; uniform sampler2D tNight; uniform sampler2D tSpec; uniform vec3 uSun; uniform float uOpacity; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 n=normalize(vN); float l=dot(n,normalize(uSun)); vec3 d=texture2D(tDay,vUv).rgb; vec3 nt=texture2D(tNight,vUv).rgb;
          float w=texture2D(tSpec,vUv).r; vec3 v=normalize(cameraPosition-vW); vec3 h=normalize(normalize(uSun)+v); float sp=pow(max(dot(n,h),0.),60.)*w*0.6*step(0.,l);
          vec3 col=d*clamp(l*1.15+0.03,0.,1.)+nt*vec3(1.,.85,.6)*smoothstep(0.08,-0.15,l)*1.3+vec3(1.,.95,.85)*sp;
          gl_FragColor=vec4(col,uOpacity); }`),
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 96), mat); spin.add(globe);
    globe.userData = { priority: 1, resolve: h => { if (!h || !h.uv || !EARTH_PIX) return 'earth'; const b = biomeAtUV(h.uv.x, h.uv.y); return b === 'ocean' ? 'ocean' : b === 'ice' ? 'ice' : 'land'; } }; F.pickables.push(globe);
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.006, 128, 64), new THREE.MeshStandardMaterial({ map: tex('earth_clouds.png'), transparent: true, depthWrite: false, roughness: 1 })); spin.add(clouds);
    F.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 96, 64), fresnelMat(0x6ab8ff, 3.2, 1.3)));
    F.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 96, 64), haloMat(0x4aa0ff, 2.4)));
    const pk = markerSprite(0xffd166, 11); pk.position.copy(latLon3(PARK.lat, PARK.lon, R * 1.001)); spin.add(pk); F.label(pk, 'Greenwich Park', { cls: 'you', always: true });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.7374, 96, 64), new THREE.MeshStandardMaterial({ map: tex('moon.jpg'), roughness: 1 })); F.add(moon);
    moon.userData = { id: 'moon', priority: 2, madeOf: 'regolith', sim: ['moon'] }; F.pickables.push(moon); F.label(moon, 'Moon', { offset: new V3(0, 2.6, 0) }); moon.add(markerSprite(0xffffff, 6));
    F.moon = moon;
    const geo = new THREE.Mesh(new THREE.TorusGeometry(42.164, .02, 4, 256), new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: .25 })); geo.rotation.x = Math.PI / 2; F.add(geo);
    { const go = new THREE.Object3D(); go.position.set(42.164, 0, 0); F.add(go); F.label(go, 'Geostationary orbit (35,786 km up)'); }
    const iss = new THREE.Group(); iss.add(markerSprite(0xffffff, 6)); iss.add(hitSphere(.12, 'iss', 3)); F.add(iss); iss.userData = { id: 'iss', priority: 3 }; F.pickables.push(iss); F.label(iss, 'ISS (illustrative orbit)', { offset: new V3(0, .15, 0) });
    F.update = () => {
      spin.rotation.y = gmst(); clouds.rotation.y = (simTime / 3.6e6 * .004) % TAU;
      const s = sunDirIn(F); mat.uniforms.uSun.value.copy(s); sl.position.copy(s).multiplyScalar(100);
      if (window.Astronomy) { const v = Astronomy.GeoMoon(astroDate()); moon.position.copy(eq3(v.x, v.y, v.z).multiplyScalar(149597.870)); moon.quaternion.setFromUnitVectors(new V3(1, 0, 0), moon.position.clone().negate().normalize()); }
      const ia = (simTime / 60000 / 92.9) % 1 * TAU, ip = new V3(Math.cos(ia) * 6.79, 0, Math.sin(ia) * 6.79).applyAxisAngle(new V3(1, 0, 0), 51.6 * Math.PI / 180); iss.position.copy(ip);
    };
    F.blurb = 'Earth at its true size, turning in real time, lit by the Sun from its true direction. The Moon is at its real current position.';
    F.spawnD = 2e5;
    F.spawn = (T) => {
      if (T.distanceTo(moon.position) < 1.7374 * 1.05) return bodySurface(() => moon.position.clone(), () => moon.quaternion.clone(), 1.7374, T, 'moonrock', 'Moon');
      if (T.length() > R * 1.03) return null;
      const loc = T.clone().applyAxisAngle(new V3(0, 1, 0), -gmst()).normalize();
      const lat = Math.asin(loc.y) * 180 / Math.PI, lon = Math.atan2(-loc.z, loc.x) * 180 / Math.PI;
      const b = biomeAtLatLon(lat, lon);
      return regionFrame(F, lat, lon, b, false);
    };
  }
};
function biomeAtUV(u, v) {
  if (!EARTH_PIX) return 'grass';
  const x = clamp(Math.floor(u * 1024), 0, 1023), y = clamp(Math.floor((1 - v) * 512), 0, 511), i = (y * 1024 + x) * 4, d = EARTH_PIX.data;
  const r = d[i], g = d[i + 1], b = d[i + 2], br = (r + g + b) / 3;
  if (br > 200 && Math.abs(r - b) < 30) return 'ice';
  if (b > r + 10 && b > g - 5 && br < 120) return 'ocean';
  if (r > g + 8 && r > 110) return 'desert';
  if (g >= r && g > b) return br < 70 ? 'forest' : 'grass';
  return 'rock';
}
function biomeAtLatLon(lat, lon) { return biomeAtUV((lon + 180) / 360, (lat + 90) / 180); }
function regionFrame(earthF, lat, lon, biome, isPark) {
  const f = new Frame({ type: 'region', name: isPark ? 'Greenwich, London' : `Earth's surface (${lat.toFixed(1)}°, ${lon.toFixed(1)}°)`, unit: 1e3, radius: 40, r0: 0, r1: 1.5e6, up: new V3(0, 1, 0), maxPolar: Math.PI / 2 - .02, opts: { lat, lon, biome, isPark } });
  f.place = () => { const sp = earthF.spin ? earthF.spin.rotation.y : gmst(); const q = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), sp); f.pos.copy(latLon3(lat, lon, 6.371)).applyQuaternion(q); f.quat.copy(q).multiply(enuQuat(lat, lon)); };
  f.place();
  return f;
}

/* ---------- large-scale view hooks (run once the frame tree exists) ---------- */
WORLD_EXT.push(async FR2 => {
  // scrolling toward the Galactic Centre or the Sun pulls the zoom target onto it, so the black-hole scene and the solar system are reached by scrolling too
  FR2.mw.attract = new V3(); FR2.mw.attractD = 3e21; FR2.mw.attractR = .5;
  FR2.nb.attract = new V3(); FR2.nb.attractD = 4e17; FR2.nb.attractR = .6;
  // the black-hole scene says what is to scale and what is not
  if (FT.sgrA && !FT.sgrA._spaceNote) {
    const b = FT.sgrA.build; FT.sgrA._spaceNote = true;
    FT.sgrA.build = function (F, o) {
      b.call(this, F, o);
      F.blurb = 'Sagittarius A*: about 4.3 million Suns inside an event horizon about 25 million km across (radius 12.7 million km).';
      F.note = 'To scale: the event horizon, the shadow (about 2.6 times the horizon radius, about 33 million km), the photon ring and the innermost stable orbit (3 times the horizon radius). Not to scale or not real: the S-star orbits (the real S2 orbit is about 1,000 AU wide, far bigger than this scene) and the bright thin disc, which Sgr A* does not have today. Orbits and the probe are sped up.';
    };
  }
});
