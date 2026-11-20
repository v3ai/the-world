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
    { const base = cmb.raycast; cmb.raycast = function (rc, out) { if (cam.D < 2e25) return; base.call(this, rc, out); }; } // the shell is only a thing to click when seen from far outside; from inside the galaxy empty sky is just empty
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
    const lgh = spaceHit(.2, { id: 'localgroup', priority: 1.5, sim: ['localgroup'], center: () => new V3(), radius: 1.5 }, { off: () => cam.D < 1e24 }); F.add(lgh); F.pickables.push(lgh);
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
    // far galaxies fade out when the view is zoomed in on the Milky Way, so Andromeda does not sit over our own disc
    F.update = () => { const k = smooth(2e20, 4e21, cam.D), dl = F.dLoc || 1; sprites.forEach(s => s.material.opacity = (.12 + .88 * k) * F.alpha * (F.C ? 1 - smooth(4 * dl, 10 * dl, s.position.distanceTo(F.C)) : 1)); };
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
        if (member ? (g.diam_kpc > 3 || /Magellan/.test(g.name)) : g.diam_kpc >= 10) { const L = spaceLabel(F, hs, g.name, member ? 30 + Math.min(g.diam_kpc, 40) / 4 : 12, { offset: new V3(0, sz * .6, 0) }); L.minSizeFn = () => cam.D > (member ? 1.5e21 : 1e22) && (!F.C || p.distanceTo(F.C) < 6 * F.dLoc); }
      });
    });
    const mwo = F.add(new THREE.Object3D()); mwo.userData = { id: 'galaxy', priority: 1 };
    const ml = spaceLabel(F, mwo, 'Milky Way', 90, { cls: 'you', offset: new V3(0, 18, 0) }); ml.minSizeFn = () => cam.D > 8e21;
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
    const cg1 = glowSprite(0xffd9a0, 6, .7), cg2 = glowSprite(0xfff3dc, 2, 1); F.add(cg1); F.add(cg2); // magnified from inside, their texture shows as blocks: fade them out when the camera is close
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
    for (let i = 0; i < 6000; i++) { const v = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(230 * Math.pow(r(), 1.7)); hP.push(v.x, v.y, v.z); hC.push(.42, .2, .8); hS.push(3 + r() * 3); }
    halo.add(makePoints(hP, hC, hS, { opacity: .5 }));
    const hg = glowSprite(0x7a4cd8, 460, .5); halo.add(hg); const hg2 = glowSprite(0x9a6cf0, 200, .45); halo.add(hg2);
    const hl = new THREE.Object3D(); hl.position.set(0, 230, 0); halo.add(hl); spaceLabel(F, hl, 'Dark matter halo (schematic): extends roughly 200 kpc', 70, {});
    seg([['vis', 'Visible galaxy'], ['dm', 'Dark matter halo']], 'vis', k => { halo.visible = k === 'dm'; if (k === 'dm') { showInfo('darkhalo'); if (cam.D < 6e21) flyTo(FR.mw, new V3(), 1.2e22); } else if (cam.D > 6e21) flyTo(FR.mw, new V3(), 2e21); });
    F.blurb = 'Our galaxy: 100–400 billion stars. The Sun is about 27,000 light-years (8.2 kpc) from the centre.';
    F.note = 'What is real: the positions of the Sun and of Sagittarius A*. What is illustrative: every other star here is generated. The number of arms, their winding and the bar angle are an artist\'s impression, not the measured arms, and the dark-matter halo (roughly 200 kpc across its radius, schematic) is a smooth glow, not a map.';
    F.update = () => { const k = smooth(1e19, 6e20, cam.D), gk = smooth(3e17, 3e19, cam.D); cg1.material.opacity = .7 * gk; cg2.material.opacity = gk; cg1.visible = cg2.visible = gk > .01; gal.material.uniforms.uMaxPx.value = lerp(1.7, 64, k); gal.material.uniforms.uOpacity.value = lerp(.55, 1, k) * F.alpha; };
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
    uniforms: { uScale: { value: PIXR_BASE }, uPixK: PIXK, uOpacity: { value: 1 }, uLim: { value: 6.8 }, uExp: { value: 0 } }, // uPixK follows the adaptive render scale (engine.js)
    vertexShader: LDV(`attribute float aMag; attribute vec3 aColor; uniform float uScale; uniform float uPixK; uniform float uLim; uniform float uExp; varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float d=max(length(mv.xyz),1e-7);
        float m=aMag+5.0*log(d)/2.302585-5.0-uExp; float b=pow(10.0,-0.4*(m-1.0));
        float s=clamp(1.5+2.6*pow(b,0.4),1.2,16.0); vA=clamp(b*2.0,0.0,1.0)*(1.0-smoothstep(uLim-1.0,uLim+1.5,m));
        vC=aColor; gl_PointSize=s*uScale*uPixK; gl_Position=projectionMatrix*mv; }`),
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
        mat.uniforms.uExp.value = 5 * Math.log10(Math.max(1, F.dLoc / 10)) + 4.5 * (1 - smooth(5, 60, F.dLoc)); // pulling far out, stars are brightened evenly so the catalogue stays visible
        if (F.conLines && F.conLines.visible && F.C) F.conLines.scale.setScalar(Math.max(5, F.C.length() * 2));
      };
    });
    const sunh = spaceHit(.0005, { id: 'sun', priority: 3, radius: 1e-6, center: () => new V3(), zoomTo: () => { flyTo(FR.solar, new V3(), 1.5e13); } }, { px: 14 }); F.add(sunh); F.pickables.push(sunh);
    const sun = markerSprite(0xfff1c8, 10); F.add(sun); spaceLabel(F, sunh, 'Sun', 100, { cls: 'you', always: true });
    seg([['off', 'No constellations'], ['on', 'Constellation lines']], store.get('const', false) ? 'on' : 'off', k => { store.set('const', k === 'on'); if (F.conLines) F.conLines.visible = k === 'on'; });
    F.blurb = '109,400 real stars from the HYG catalog, at their measured positions and colours. All stars are brightened evenly (like a long exposure) so the faint ones show; their relative brightness is true.';
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
  const hot = smooth(5000, 9000, rgb[3]); // hot stars: cooler-looking dark cells stay blue-white rather than turning orange
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Vector3(rgb[0], rgb[1], rgb[2]) }, uGran: { value: gran }, uDark: { value: new THREE.Vector3(lerp(.8, .88, hot), lerp(.66, .9, hot), lerp(.55, .96, hot)) } },
    vertexShader: LDV(`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform vec3 uCol; uniform vec3 uDark; uniform float uGran; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 p=normalize(vP)*uGran; float n=fbm3(p+vec3(0.,uTime*.06,uTime*.03)+fbm3(p*1.7-uTime*.04)); vec3 c=mix(uCol*uDark, uCol, smoothstep(.25,.8,n)); float mu=abs(dot(normalize(vN),normalize(vV))); c*=.4+.55*pow(mu,.6); gl_FragColor=vec4(c,1.); }`)
  });
}
FT.star = {
  build(F, o) {
    const P = o.P || starEstimate(o.M, o.bv), c = bvColor(o.bv), R = P.R, T = P.T;
    // the colour is the blackbody colour of the star's own temperature
    const tc = P.measured ? (() => { let best = c, bd = 1e9; for (let b = -.4; b <= 2; b += .02) { const k = bvColor(b), d = Math.abs(k[3] - T); if (d < bd) { bd = d; best = k; } } return best; })() : c;
    const mat = starSurfaceMaterial(tc, R > 100 ? 1.6 : R > 10 ? 2.4 : 3.2); mat.transparent = true; mat.depthTest = false; const m = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), mat); m.renderOrder = 10; F.add(m); // drawn after the glow sprites, which would otherwise show through it
    F.pick(m, 'starbody');   // (this call had slipped into the comment above: the star could not be clicked, and a zoom had no surface to aim at)
    const km = R * 695700, fmtL = L => L >= 100 ? Math.round(L).toLocaleString('en-US') : L >= 1 ? L.toPrecision(3) : L.toPrecision(2), a = P.measured ? '' : '≈ ';
    m.userData.info = {
      title: o.name || 'A star', tag: 'Star' + (o.sp && o.sp.text ? ` · spectral type ${o.sp.text}` : ''),
      body: `<p>A ball of hot plasma held together by its own gravity and powered by nuclear fusion in its core (a giant or supergiant has left the stable hydrogen-burning stage). The size and colour here are this star's own.${o.note ? ' ' + o.note : ''}</p>`,
      facts: [['Radius', `${a}${sig(R, 3)} × Sun (${km >= 1e6 ? sig(km / 1e6) + ' million' : sig(km)} km)`], ['Surface temperature', `${a}${sig(Math.round(T / 10) * 10, 3)} K`], ['Total luminosity', `${a}${fmtL(P.L)} × Sun`]],
      note: (P.measured ? `Measured values (${P.src}).` : 'Estimated from the star\'s colour and brightness (a bolometric correction, then L = 4πR²σT⁴); good to tens of per cent for ordinary stars, worse for giants and very red stars.') + ' The mottled surface is a schematic texture; real stars are not seen in this detail except the Sun.'
    };
    m.userData.sim = ['star']; m.userData.madeOf = 'plasma';
    // the place card of a star (it had none: flying to a star showed a name and two buttons)
    F.blurb = `${o.name || 'This star'}: a real star from the HYG catalogue, drawn at its own size and colour${o.sp && o.sp.text ? ` (spectral type ${o.sp.text})` : ''}. Radius ${a}${sig(R, 3)} times the Sun's, surface about ${sig(Math.round(T / 10) * 10, 3)} K. Click it for its card.`;
    F.note = 'The mottled surface is a schematic texture, not an image: no star but the Sun has been seen in this detail. ' + (P.measured ? `Radius, temperature and luminosity are measured values (${P.src}).` : 'Radius, temperature and luminosity are estimates from the star\'s colour and brightness, good to tens of per cent for ordinary stars and worse for giants and very red stars.');
    F.add(glowSprite(new THREE.Color(tc[0], tc[1], tc[2]).getHex(), R * 6, .7)); F.add(glowSprite(0xffffff, R * 2.2, .5));
    F.update = (dt, t) => { mat.uniforms.uTime.value = t; m.rotation.y += dt * .02; };
    surfaceAtt(F, (i, c) => i ? 0 : (c.set(0, 0, 0), R));
    F.spawn = (T2) => T2.length() < R * 1.2 ? new Frame({ type: 'plasma', name: 'Stellar plasma', unit: 1e-10, radius: 60, r0: 1e-14, r1: 1e-7, pos: T2.clone() }) : null;
  }
};
/* ---------- the Sun: photosphere and cut-away interior (unit = 1 solar radius, 6.957e8 m) ---------- */
const SUN_R_M = 6.957e8; // IAU 2015 nominal solar radius, 695,700 km
// Anchor points of a standard solar model (r/R, temperature K, density kg/m3, hydrogen mass fraction; the core's 0.38 gives helium about 60% with 2% heavier elements: Wikipedia "Sun", helium in the core risen from 24% to about 60%):
// centre 15.7 MK and 150 g/cm3 (Fiorentini and Ricci, via Wikipedia "Standard solar model" and "Solar core"); 0.19 R 10 MK, 40 g/cm3 and 0.25 R 7 MK, 20,000 kg/m3 (Solar core; Sun);
// base of the convection zone 0.713 R, about 2 MK and 200 kg/m3 (Sun); photosphere 5,772 K and about 2e-4 kg/m3 (about 1e23 particles per m3). Values between anchors are interpolated in log space: a diagram, not a model run.
const SUN_TBL = [[0, 1.57e7, 1.5e5, .38], [.19, 1e7, 4e4, .5], [.25, 7e6, 2e4, .7], [.713, 2e6, 200, .735], [1, 5772, 2e-4, .735]];
function sunAt(r) {
  r = clamp(r, 0, 1); let i = 0; while (i < SUN_TBL.length - 2 && r > SUN_TBL[i + 1][0]) i++;
  const a = SUN_TBL[i], b = SUN_TBL[i + 1], u = (r - a[0]) / (b[0] - a[0]), L = (x, y) => Math.exp(lerp(Math.log(x), Math.log(y), u));
  return { r, T: L(a[1], b[1]), rho: L(a[2], b[2]), X: lerp(a[3], b[3], u), layer: r < .25 ? 'core' : r < .713 ? 'radiative' : r < .9995 ? 'convective' : 'photosphere' };
}
function sunPhotoMat(extra) {
  const m = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uTime: { value: 0 }, uPix: { value: .01 }, uCut: { value: 0 }, uSign: { value: new V3(1, 1, 1) }, uOpacity: { value: 1 } }, extra || {}),
    vertexShader: LDV(`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform float uPix; uniform float uCut; uniform vec3 uSign; uniform float uOpacity; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      vec3 h33(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453); }
      vec2 worley(vec3 p){ vec3 i=floor(p), f=fract(p); float d1=9., d2=9.; for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){ vec3 g=vec3(float(x),float(y),float(z)); vec3 r=g+h33(i+g)-f; float d=dot(r,r); if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; } return vec2(sqrt(d1),sqrt(d2)); }
      void main(){
        if(uCut>.5 && vP.x*uSign.x>0. && vP.y*uSign.y>0. && vP.z*uSign.z>0.) discard;
        vec3 p=normalize(vP); float mu=clamp(dot(normalize(vN),normalize(vV)),0.,1.);
        float wg=1.-smoothstep(.0004,.0014,uPix);   // granules (about 1,000 km): drawn only while they are bigger than a few pixels
        float ws=1.-smoothstep(.01,.04,uPix);       // supergranule-scale mottling (about 30,000 km)
        vec3 pw=p*700.; pw+=.7*vec3(noise3(pw*.045),noise3(pw*.045+7.1),noise3(pw*.045+13.7))-.35; pw+=.18*vec3(noise3(pw*.4),noise3(pw*.4+3.3),noise3(pw*.4+9.1))-.09; vec2 g=worley(pw+vec3(uTime*.02)); float lane=smoothstep(0.,.3,g.y-g.x);
        float b=1.; vec3 lt=vec3(1.); b*=mix(1.,(.58+.42*lane)*(1.12-.4*g.x),wg); lt=mix(vec3(1.),mix(vec3(1.,.78,.55),vec3(1.),lane),wg); b*=1.+wg*(h33(floor(p*700.)).x-.5)*.08;
        vec2 sg=worley(p*23.); b*=mix(1.,.98+.03*smoothstep(0.,.5,sg.y-sg.x),ws);
        b*=1.+(fbm3(p*6.+uTime*.01)-.5)*.06;
        vec3 u=vec3(.50,.64,.80); vec3 limb=1.-u*(1.-mu);   // limb darkening: the edge is cooler, higher layer, and redder
        vec3 base=vec3(1.,.93,.76);
        gl_FragColor=vec4(base*limb*lt*b*.93,uOpacity);
      }`)
  });
  m.transparent = true; return m;
}
function sunCutMat() { // the flat faces of the cut-away: radial layers, coloured by zone (a diagram), thin dark lines at the zone boundaries
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } }, side: THREE.DoubleSide, transparent: true,
    vertexShader: LDV(`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform float uOpacity; varying vec3 vP;
      void main(){ float r=length(vP); vec3 c;
        if(r<.25){ float k=r/.25; c=mix(vec3(1.,.96,.72),vec3(1.,.78,.36),pow(k,.8)); }
        else if(r<.713){ float k=(r-.25)/.463; c=mix(vec3(1.,.62,.22),vec3(.86,.34,.12),k); }
        else { float k=(r-.713)/.287; float n=fbm3(normalize(vP)*(9.+6.*k)+uTime*.05); c=mix(vec3(.74,.22,.08),vec3(.98,.55,.16),k)*(.88+.24*n); }
        float line=smoothstep(.004,0.,abs(r-.25))+smoothstep(.004,0.,abs(r-.713)); c=mix(c,vec3(.12,.07,.05),clamp(line,0.,1.)*.8);
        float rim=smoothstep(.992,.999,r); c=mix(c,vec3(1.,.96,.82),rim);
        gl_FragColor=vec4(c*.88,uOpacity); }`)
  });
}
function sunQuarter(u, v) { // a quarter disc of radius 1 in the plane spanned by u and v
  const nr = 48, nt = 24, pos = [], idx = [];
  for (let i = 0; i <= nr; i++) for (let j = 0; j <= nt; j++) { const r = i / nr, a = j / nt * Math.PI / 2; pos.push(...u.clone().multiplyScalar(r * Math.cos(a)).addScaledVector(v, r * Math.sin(a)).toArray()); }
  for (let i = 0; i < nr; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + 1, c = a + nt + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
FT.sun = {
  build(F) {
    const mat = sunPhotoMat(), shell = new THREE.Mesh(new THREE.SphereGeometry(1, 256, 128), mat); F.add(shell);
    let cutOn = false, userCut = false; const sg = new V3(1, 1, 1), cutGrp = new THREE.Group(); F.add(cutGrp);
    const rc = THREE.Mesh.prototype.raycast, loc = new V3();
    shell.raycast = function (ray, hits) { const tmp = []; rc.call(shell, ray, tmp); tmp.forEach(h => { loc.copy(h.point).add(F.C); if (!(cutOn && loc.x * sg.x > 0 && loc.y * sg.y > 0 && loc.z * sg.z > 0)) hits.push(h); }); };
    F.pick(shell, 'sunPhoto', 2); shell.userData.madeOf = 'plasma';
    shell.userData.cutOpen = (h, peek) => { if (cutOn) return false; if (peek) return 'cut'; userCut = true; flyTo(F, new V3(.1, .08, .08), 1.2e9); return 'cut'; }; // a double click (or "Look inside"): the cut-away first (cutOpenOf, js/engine.js); with it open, the next level down at the point
    const cm = sunCutMat(), faces = [[new V3(0, 1, 0), new V3(0, 0, 1)], [new V3(1, 0, 0), new V3(0, 0, 1)], [new V3(1, 0, 0), new V3(0, 1, 0)]].map(([u, v]) => { const m = new THREE.Mesh(sunQuarter(u, v), cm); m.visible = false; cutGrp.add(m); return m; });
    const layerOf = h => { const p = h.point.clone().add(F.C); const l = sunAt(p.length()).layer; return l === 'core' ? 'sunCore' : l === 'radiative' ? 'sunRadiative' : l === 'convective' ? 'sunConvective' : 'sunPhoto'; };
    faces.forEach(m => { m.userData = { resolve: layerOf, priority: 2.2, madeOf: 'plasma' }; const r0 = m.raycast.bind(m); m.raycast = (ray, hits) => { if (cutOn) r0(ray, hits); }; F.pickables.push(m); });
    const corona = glowSprite(0xffe2a8, 5.2, .3); F.add(corona); const halo = glowSprite(0xffffff, 2.5, .25); F.add(halo); corona.renderOrder = halo.renderOrder = -1; shell.renderOrder = 0;
    const pins = [[new V3(.09, .06, 0), 'sunCore', 'Core: fusion, 15.7 million K at the centre'], [new V3(.5, .2, 0), 'sunRadiative', 'Radiative zone: 7 to 2 million K'], [new V3(.86, .3, 0), 'sunConvective', 'Convective zone: 2 million K to 5,772 K']];
    const lbls = pins.map(([p, id, t]) => { const o = new THREE.Object3D(); o.position.copy(p); o.userData = { id, priority: 2.5, madeOf: 'plasma' }; o.visible = false; cutGrp.add(o); F.label(o, t, {}); return o; });
    const cutSeg = seg([['whole', 'Whole Sun'], ['cut', 'Cut-away']], 'whole', k => { userCut = k === 'cut'; });
    F.blurb = 'The Sun at its true size: a ball of plasma 1.39 million km across. Zoom in to the surface, or open the cut-away to see its layers.';
    F.note = 'To scale: the Sun\'s size, its limb darkening and the granule size (about 1,000 km). Interior: radii, temperatures and densities come from standard solar models; the cut-away colours are a temperature diagram, not what you would see. Sunspots are not drawn.';
    F.spawnD = 6e5;   // above the floor: the patch of gas is waiting when the camera reaches the floor, and so lifts it (js/engine.js zoomFloor)
    Object.defineProperty(F, 'floorD', { get: () => cam.T.length() > .95 ? 2e5 : 0 }); // the Sun has no solid surface to land on: the view stops 200 km above the photosphere; use "See what it is made of" for the gas itself
    surfaceAtt(F, (i, c) => i ? 0 : (c.set(0, 0, 0), 1));   // aimed at the corona or the glow: the zoom lands on the photosphere
    F.spawn = T => T.length() < 1.02 ? new Frame({ type: 'plasma', name: 'Plasma inside the Sun', unit: 1e-9, radius: 40, r1: 3e-7, pos: T.clone() }) : null;
    F.update = (dt, t) => {
      const inside = cam.A === F && cam.T.length() < .5 && cam.D < 2e9, was = cutOn; cutOn = userCut || inside;
      if (cutOn && !was) { camPosIn(F, loc); sg.set(loc.x < 0 ? -1 : 1, loc.y < 0 ? -1 : 1, loc.z < 0 ? -1 : 1); cutGrp.scale.copy(sg); mat.uniforms.uSign.value.copy(sg); } // the removed octant faces the camera when the cut-away opens
      mat.uniforms.uTime.value = t; mat.uniforms.uCut.value = cutOn ? 1 : 0; cm.uniforms.uTime.value = t;
      mat.uniforms.uPix.value = Math.max(cam.D / F.unit, 1e-9) * 2 * Math.tan(25 * Math.PI / 180) / H * 1.0;
      faces.forEach(m => { m.visible = cutOn; }); lbls.forEach(o => { o.visible = cutOn; });
      cutSeg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === (cutOn ? 'cut' : 'whole')));
      corona.visible = halo.visible = cam.D > 6e8;
      if (cam.A === F && cam.T.length() > .95 && cam.D < 2.2e5 && performance.now() - (F._msg || 0) > 8000) { F._msg = performance.now(); message('The Sun has no solid surface to land on. Choose "See what it is made of" to go into its gas.'); }
    };
  }
};
/* ---------- solar system (AU, ecliptic three: Y = north ecliptic pole) ---------- */
let SOLAR = null;
const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ceres', 'Haumea', 'Makemake', 'Eris'];
// Dwarf planets that astronomy-engine does not know are placed from JPL Small-Body Database elements (data/solar.json `elements`): an osculating two-body orbit.
function keplerThree(el, ms) {
  const jd = ms / 86400000 + 2440587.5, d2r = Math.PI / 180, e = el.e;
  const M = (((el.ma_deg + el.mean_motion_deg_d * (jd - el.epoch_jd)) % 360) + 360) % 360 * d2r; let E = M + e * Math.sin(M);
  for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const x = el.a_au * (Math.cos(E) - e), y = el.a_au * Math.sqrt(1 - e * e) * Math.sin(E), w = el.peri_deg * d2r, n = el.node_deg * d2r, i = el.i_deg * d2r;
  const cw = Math.cos(w), sw = Math.sin(w), cn = Math.cos(n), sn = Math.sin(n), ci = Math.cos(i), si = Math.sin(i);
  return new V3((cn * cw - sn * sw * ci) * x + (-cn * sw - sn * cw * ci) * y, (sw * si) * x + (cw * si) * y, -((sn * cw + cn * sw * ci) * x + (-sn * sw + cn * cw * ci) * y));
}
function helioAt(name, ms) { // heliocentric ecliptic position, AU (three axes), at time ms
  const d = SOLAR && SOLAR.find(b => b.name === name); if (d && d.elements) return keplerThree(d.elements, ms);
  if (window.Astronomy) { const v = Astronomy.HelioVector(name, new Date(ms)); return eq3(v.x, v.y, v.z).applyQuaternion(Q_EQ_TO_ECL); }
  return new V3();
}
helio3 = name => helioAt(name, simTime);
// Voyager 1 and 2: JPL Horizons heliocentric vectors (ecliptic J2000, AU and AU/day) at JD 2461362.5 TDB (2026-11-18 00:00), carried forward in a straight line.
const VOYAGERS = [
  { id: 'voyager1', name: 'Voyager 1', p: [-32.22039915514457, -137.2019354088705, 99.26779061000546], v: [-1.195196945150092e-3, -7.861217678351216e-3, 5.678158648322611e-3] },
  { id: 'voyager2', name: 'Voyager 2', p: [40.00680002687236, -105.7232812437092, -90.01703017309499], v: [2.427664062065358e-3, -5.394403127429804e-3, -6.535571861190102e-3] }];
function voyagerAt(V, ms, out) { const dd = ms / 86400000 + 2440587.5 - 2461362.5; return out.set(V.p[0] + V.v[0] * dd, V.p[2] + V.v[2] * dd, -(V.p[1] + V.v[1] * dd)); }
FT.solarsystem = {
  build(F) {
    F.scene.background = null;
    F.add(new THREE.AmbientLight(0x404a66, .25)); const pl = new THREE.PointLight(0xfff4e0, 2.2, 0, 0); F.add(pl);
    const KM = 1 / 1.495978707e8, PXK = 2 * Math.tan(25 * Math.PI / 180) / H, _v = new V3(), _w = new V3(), CP = new V3(), SUND = new V3(), PX = new V3(); let SD0 = 1, SUNHALF = 0;
    const sunR = 695700 * KM, sunMat = sunPhotoMat(), sunM = new THREE.Mesh(new THREE.SphereGeometry(sunR, 128, 64), sunMat);
    const sunGrp = new THREE.Group(); F.add(sunGrp); sunGrp.add(sunM); F.pick(sunM, 'sun'); sunM.userData.madeOf = 'plasma';
    const toSun = () => { flyTo(FR.sun, new V3(), 3e9); };
    sunM.userData.zoomTo = toSun;
    [glowSprite(0xffc070, sunR * 14, .3), glowSprite(0xfff1d0, sunR * 4, .5)].forEach(g => { g.renderOrder = -1; sunGrp.add(g); });
    if (FR.sun) FR.sun.proxy = sunGrp; // the stand-in disappears when the detailed Sun frame is fully shown
    const sunH = hitSphere(1, 'sun', 3); sunH.userData.zoomTo = toSun; sunH.userData.madeOf = 'plasma'; F.add(sunH); F.pickables.push(sunH);
    const sunMk = markerSprite(0xfff1c8, 16); F.add(sunMk); F.label(sunM, 'Sun', { offset: new V3(0, sunR * 2, 0) });
    sunM.userData.extent = sunH.userData.extent = () => ({ p: new V3(), r: sunR });   // a click frames the Sun itself (its dot has no size: the click used to select it and leave the camera 4 AU away)
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x7084b0, transparent: true, opacity: .35, depthWrite: false });
    F.bodies = {}; // a planet label shows only when it is not on top of the Sun's disc, not behind it, and far enough from the Sun on screen not to pile up
    getJSON('data/solar.json').then(SD => {
      SOLAR = SD;
      PLANETS.forEach(name => {
        const d = SD.find(b => b.name === name); if (!d) return;
        const grp = new THREE.Group(); F.add(grp);
        const rAU = d.radius_km * KM;
        const map = d.texture ? tex(d.texture) : null;
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(rAU, 48, 32), new THREE.MeshStandardMaterial({ map, color: map ? 0xffffff : new THREE.Color(d.color || '#bbbbbb'), roughness: .9 }));
        grp.add(mesh);
        if (d.ring && d.ring.texture) { const ri = d.ring.inner_km * KM, ro = d.ring.outer_km * KM, rg = new THREE.RingGeometry(ri, ro, 128, 1); const pa = rg.attributes.position, uv = rg.attributes.uv, v = new V3(); for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); uv.setXY(i, (v.length() - ri) / (ro - ri), .5); } const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: tex(d.ring.texture), transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; grp.add(ring); }
        grp.rotation.z = (d.axial_tilt_deg || 0) * Math.PI / 180;
        const mk = markerSprite(0xffffff, 7); grp.add(mk);
        const id = name === 'Earth' ? 'earthPlanet' : name.toLowerCase();
        grp.userData.id = id; grp.userData.priority = 2; grp.userData.radius = rAU; if (!d.elements) grp.userData.sim = [name === 'Pluto' ? 'dwarf:pluto' : 'planet:' + name.toLowerCase()];
        F.pickables.push(grp); const hs = hitSphere(1, id, 3); hs.userData.radius = rAU; grp.add(hs);
        grp.userData.extent = hs.userData.extent = () => ({ p: grp.position.clone(), r: rAU });   // a click frames the planet itself, not its enlarged dot
        const L = F.label(grp, name, { offset: new V3(0, rAU * 3, 0) }); L.el.dataset.pri = d.elements ? 2 : 6;   // where names collide, a planet's stays and a dwarf planet's waits
        // orbit: sample the ephemeris over one period
        { const P = d.orbital_period_days || 365, pts = [], t0 = simTime;
          for (let k = 0; k <= 180; k++) pts.push(helioAt(name, t0 + k / 180 * P * 86400000));
          F.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), orbitMat)); }
        F.bodies[name] = { grp, mesh, d, rAU, hs, L };
      });
      Object.values(F.bodies).forEach(b => { const ch = F.children.find(c => c.opts && c.opts.body === b.d.name); if (ch) ch.proxy = b.grp; });
    });
    // belts and clouds (statistical, real extents); the dots are enlarged so that they can be seen
    const r = rng(5), ap = [], ac = [], as = [];
    const kep = (a, e, i, node, w, M) => { let E = M; for (let k = 0; k < 6; k++) E = M + e * Math.sin(E); const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E); const cw = Math.cos(w), sw = Math.sin(w), cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(i), si = Math.sin(i); const X = (cn * cw - sn * sw * ci) * x + (-cn * sw - sn * cw * ci) * y, Yy = (sn * cw + cn * sw * ci) * x + (-sn * sw + cn * cw * ci) * y, Z = (sw * si) * x + (cw * si) * y; return [X, Z, -Yy]; };
    for (let k = 0; k < 6000; k++) { const p = kep(2.1 + r() * 1.2, r() * .2, Math.abs(gauss(r)) * .15, r() * TAU, r() * TAU, r() * TAU); ap.push(...p); const b = .55 + r() * .45; ac.push(b * .95, b * .85, b * .7); as.push(.004 + r() * .006); }
    const belt = makePoints(ap, ac, as); F.add(belt); F.pick(belt, 'asteroids', .3);
    const kp = [], kc = [], ks = [];
    for (let k = 0; k < 5000; k++) { const p = kep(r() < .2 ? 39.4 : 42 + r() * 6, r() * .15, Math.abs(gauss(r)) * .12, r() * TAU, r() * TAU, r() * TAU); kp.push(...p); const b = .5 + r() * .5; kc.push(b * .7, b * .85, b); ks.push(.05 + r() * .05); }
    const kb = makePoints(kp, kc, ks, { opacity: .9 }); F.add(kb); F.pick(kb, 'kuiper', .25);
    const op = [], oc = [], os = [];
    for (let k = 0; k < 4000; k++) { const v = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(Math.exp(lerp(Math.log(2000), Math.log(100000), r()))); op.push(v.x, v.y, v.z); oc.push(.6, .75, 1); os.push(v.length() * .012); }
    const oort = makePoints(op, oc, os, { opacity: .85 }); F.add(oort); oort.userData = { id: 'oort', priority: .1 }; F.pickables.push(oort);
    const ring = (R, col) => { const pts = []; for (let k = 0; k <= 180; k++) pts.push(new V3(Math.cos(k / 180 * TAU) * R, 0, Math.sin(k / 180 * TAU) * R)); const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .45, depthWrite: false })); F.add(l); return l; };
    const oortRings = [ring(2000, 0x6f8fe0), ring(100000, 0x6f8fe0)];
    const mkLbl = (pos, text, id, rule) => { const o = new THREE.Object3D(); o.position.copy(pos); o.userData = { id, priority: 2 }; F.add(o); const L = F.label(o, text, {}); if (rule) L.minSizeFn = rule; return o; };
    mkLbl(new V3(0, 0, 2.7), 'Asteroid belt (dots enlarged)', 'asteroids', () => cam.D > 3e10 && cam.D < 3e13);
    mkLbl(new V3(0, 0, 43), 'Kuiper belt (dots enlarged)', 'kuiper', () => cam.D > 3e12 && cam.D < 3e15);
    mkLbl(new V3(2000, 0, 0), 'Oort cloud, inner edge ≈ 2,000 AU (hypothesised)', 'oort', () => cam.D > 1e14);
    mkLbl(new V3(0, 0, 100000), 'Oort cloud, outer edge ≈ 100,000 AU (hypothesised)', 'oort', () => cam.D > 1e14);
    const hel = new THREE.Mesh(new THREE.SphereGeometry(120, 64, 32), fresnelMat(0x5ab4ff, 2.6, .5)); F.add(hel);
    const helH = hitSphere(122, 'heliosphere', -.2); helH.userData.noZoom = true; F.add(helH); F.pickables.push(helH);
    F.label(helH, 'Heliopause (~120 AU)', { offset: new V3(0, 120, 0) });
    const vgs = VOYAGERS.map(V => { const g = new THREE.Group(); g.add(markerSprite(0x9fffe0, 6)); const hs = hitSphere(1, V.id, 3); g.add(hs); g.userData = { id: V.id, priority: 3, noZoom: true }; F.add(g); F.pickables.push(g); const L = F.label(g, V.name, {}); return { V, g, hs, L, t: 0 }; });
    F.blurb = 'The Sun, the eight planets and the dwarf planets at their ephemeris positions for the date shown. Planets and the Sun are drawn at true size, which is why they are dots; markers and pick targets are enlarged.';
    F.note = 'Positions: planets, Pluto and the Moon from an ephemeris (astronomy-engine); the other dwarf planets from a two-body orbit (approximate); Voyagers from a straight line through JPL vectors. Not to scale: marker dots, belt dots and orbit lines. Sizes of bodies and distances between them are true.';
    F.timeNote = null;
    F.update = (dt, t) => {
      sunMat.uniforms.uTime.value = t; CP.copy(camPosIn(F, _v)); const cd0 = CP.length(); SD0 = Math.max(cd0, 1e-9);
      sunMat.uniforms.uPix.value = Math.max(cam.D / F.unit, 1e-12) / sunR * PXK;
      orbitMat.opacity = .35 * smooth(2e9, 3e10, cam.D) * F.alpha;
      sunH.scale.setScalar(Math.max(sunR * 1.1, SD0 * PXK * 14)); SUNHALF = Math.asin(Math.min(1, sunR / SD0)); SUND.copy(CP).negate().normalize();
      for (const nm in F.bodies) {
        const b = F.bodies[nm]; b.grp.position.copy(helioAt(nm, simTime));
        b.mesh.rotation.y = (simTime / 3600000 / (b.d.rotation_period_h || 24)) % 1 * TAU; // rotation follows the simulated clock: it stops when time is paused
        const dd = Math.max(PX.copy(b.grp.position).distanceTo(CP), 1e-9); b.hs.scale.setScalar(Math.max(b.rAU * 1.5, dd * PXK * 12));
        if (!b.L.hooked) { b.L.hooked = 1; b.L.minSizeFn = () => { if (FR.sun && FR.sun.alpha > .3) return false; const v = _w.copy(b.grp.position).sub(CP), dist = v.length(); v.normalize(); const behind = dist > SD0 && v.angleTo(SUND) < SUNHALF * 1.15; return !behind && b.grp.position.length() / dist / PXK > 22; }; }
      }
      if (!F._sunLbl) { F._sunLbl = 1; F.labels.forEach(L => { if (L.el.textContent === 'Sun') L.minSizeFn = () => !(FR.sun && FR.sun.alpha > .3); else if (/^Heliopause/.test(L.el.textContent)) L.minSizeFn = () => !(FR.sun && FR.sun.alpha > .3) && cam.D < 6e13; }); }
      oortRings.forEach(l => { l.visible = cam.D > 2e13; }); helH.visible = cd0 > 125; // the heliopause can be picked from outside it, never from the inner solar system
      const sc = avg => Math.min(40, Math.max(1, 1.6 * (cam.D / F.unit) / (300 * avg))); belt.material.uniforms.uScale.value = PIXR_BASE * sc(.007); kb.material.uniforms.uScale.value = PIXR_BASE * sc(.075);
      vgs.forEach(o => { voyagerAt(o.V, simTime, o.g.position); const dd = Math.max(o.g.position.distanceTo(CP), 1e-9); o.hs.scale.setScalar(dd * PXK * 12); if (performance.now() - o.t > 400) { o.t = performance.now(); o.L.el.textContent = `${o.V.name} (${Math.round(o.g.position.length())} AU from the Sun)`; } if (!o.L.hooked) { o.L.hooked = 1; o.L.minSizeFn = () => !(FR.sun && FR.sun.alpha > .3) && o.g.position.length() / Math.max(o.g.position.distanceTo(CP), 1e-9) / PXK > 14; } });
    };
  }
};
/* ---------- generic planet (unit 1000 km) ---------- */
const MOON_TEXT = {
  Phobos: 'The larger and closer of Mars\'s two small moons, a lumpy body about 27 by 22 by 18 km. It circles Mars in under 8 hours and is slowly spiralling inward.',
  Deimos: 'The smaller, outer moon of Mars: an irregular lump about 15 by 12 by 10 km that circles the planet in about 30 hours.',
  Io: 'The most volcanically active body known. Tides from Jupiter and the other big moons flex it and heat it from inside, and its thin atmosphere is mostly sulfur dioxide from the volcanoes.',
  Europa: 'A shell of ice over a global ocean of liquid water, kept liquid by tidal heating. One of the best places to look for life beyond Earth.',
  Ganymede: 'The largest moon in the solar system, bigger than the planet Mercury. It is the only moon known to have its own magnetic field.',
  Callisto: 'An ancient, heavily cratered ball of ice and rock, the outermost of Jupiter\'s four big moons.',
  Titan: 'The only moon with a thick atmosphere (mostly nitrogen, with methane). Lakes and rivers of liquid methane and ethane lie on its surface, under an orange haze.',
  Enceladus: 'A small, very bright icy moon. Geysers at its south pole spray water ice into space and feed Saturn\'s E ring, and an ocean lies under the ice.',
  Mimas: 'A small icy moon with one huge crater, Herschel, a third as wide as the moon itself.',
  Rhea: 'Saturn\'s second-largest moon, an icy world with a cratered surface.',
  Iapetus: 'A two-toned moon: its leading side is very dark and its trailing side bright. A ridge runs along its equator.',
  Tethys: 'A mid-sized moon made almost entirely of water ice: its average density is about 0.98 g/cm³, close to that of water.',
  Dione: 'A mid-sized moon of Saturn, a mix of water ice and rock with a mean density of about 1.48 g/cm³.',
  Miranda: 'The smallest of Uranus\'s five big moons, with patchwork terrain and Verona Rupes, an enormous cliff.',
  Ariel: 'One of the five large moons of Uranus, a mix of ice and rock (mean density about 1.54 g/cm³).',
  Umbriel: 'One of the five large moons of Uranus, a mix of ice and rock (mean density about 1.52 g/cm³).',
  Titania: 'The largest moon of Uranus, an icy world about half the width of our Moon.',
  Oberon: 'The outermost of the five big moons of Uranus.',
  Triton: 'Neptune\'s big moon orbits backwards, which suggests it was captured from the Kuiper belt. Geysers of nitrogen have been seen on its surface.',
  Proteus: 'Neptune\'s second-largest moon, an irregular body that circles the planet in just over a day. Its mass is poorly known.',
  Charon: 'Pluto\'s big moon, about half Pluto\'s width. The two lock the same faces towards each other and circle a point in the space between them.'
};
const fmtKm = x => x >= 1000 ? Math.round(x).toLocaleString('en-US') : String(+x.toPrecision(4));
FT.planet = {
  build(F, o) {
    const d = SOLAR && SOLAR.find(b => b.name === o.body); if (!d) return;
    F.add(new THREE.AmbientLight(0x334455, .22)); const sl = new THREE.DirectionalLight(0xffffff, { Saturn: 1.1, Uranus: 1.0, Neptune: 1.0, Mars: 1.0, Mercury: .95 }[o.body] || .8); F.add(sl); F.add(sl.target); // about 0.8: the day side of a bright texture (Venus, Jupiter) stays below white
    const R = d.radius_km / 1000, map = d.texture ? tex(d.texture) : null;
    const spin = new THREE.Group(); F.add(spin); spin.rotation.z = (d.axial_tilt_deg || 0) * Math.PI / 180;
    const body = new THREE.Group(); spin.add(body);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map, color: map ? 0xffffff : new THREE.Color(d.color || '#bbbbbb'), roughness: .95 })); body.add(mesh);
    const id = o.body === 'Pluto' ? 'pluto' : o.body.toLowerCase(); F.pick(mesh, id); mesh.userData.madeOf = /Jupiter|Saturn|Uranus|Neptune/.test(o.body) ? 'gasgiant' : 'regolith';
    if (!d.elements) mesh.userData.sim = ['planet:' + id];
    if (d.ring && d.ring.texture) { const ri = d.ring.inner_km / 1000, ro = d.ring.outer_km / 1000, rg = new THREE.RingGeometry(ri, ro, 256, 1); const pa = rg.attributes.position, uv = rg.attributes.uv, v = new V3(); for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); uv.setXY(i, (v.length() - ri) / (ro - ri), .5); } const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: tex(d.ring.texture), color: 0xdddddd, transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; spin.add(ring); F.pick(ring, 'saturn', .5); }
    const ATM = { Venus: [0xffe6b0, .22], Jupiter: [0xe8d9c0, .14], Saturn: [0xeedfb5, .14], Uranus: [0x9fe6ee, .3], Neptune: [0x7aa5ff, .3] }[o.body];
    if (ATM) F.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 64, 48), fresnelMat(ATM[0], 4, ATM[1])));
    const moons = (SOLAR || []).filter(m => m.parent === o.body);
    F.moons = moons.map(m => {
      const mr = m.radius_km / 1000, mm = new THREE.Mesh(new THREE.SphereGeometry(mr, 48, 32), new THREE.MeshStandardMaterial({ map: m.texture ? tex(m.texture) : null, color: m.texture ? 0xffffff : new THREE.Color(m.color || '#aaaaaa'), roughness: 1 }));
      const P = Math.abs(m.orbital_period_days);
      spin.add(mm); mm.userData = { id: 'moon_' + m.name, priority: 2, info: { title: m.name, tag: `Moon of ${o.body}${m.orbital_period_days < 0 ? ' · orbits backwards' : ''}`, body: `<p>${MOON_TEXT[m.name] || ''}</p>`, facts: [['Radius', `${fmtKm(m.radius_km)} km`], ['Distance from ' + o.body + '\'s centre', `${fmtKm(m.semimajor_km)} km`], ['One orbit', `${+P.toPrecision(4)} days`]], note: 'Size and orbit are true; where the moon sits on its orbit here is illustrative, and its tint is approximate (no surface map).' }, madeOf: 'regolith' }; F.pickables.push(mm);
      F.label(mm, m.name, { offset: new V3(0, mr * 1.6, 0) }); const mk = markerSprite(0xffffff, 5); mm.add(mk);
      return { mm, a: m.semimajor_km / 1000, P: Math.abs(m.orbital_period_days || 1), ph: (m.name.length * 1.7) % TAU, retro: (m.orbital_period_days || 1) < 0 };
    });
    F.radius = Math.max(R * 8, ...F.moons.map(m => m.a * 1.15), 10);
    F.update = (dt, t) => {
      body.rotation.y = (simTime / 3600000 / (d.rotation_period_h || 24)) % 1 * TAU;
      const days = simTime / 86400000; F.moons.forEach(m => { const a = m.ph + days / m.P * TAU * (m.retro ? -1 : 1); m.mm.position.set(Math.cos(a) * m.a, 0, -Math.sin(a) * m.a); });
      const s = sunDirIn(F); sl.position.copy(s).multiplyScalar(100);
    };
    F.blurb = `${o.body} at its true size${F.moons.length ? `, with ${F.moons.length === 1 ? 'its largest moon' : 'its ' + F.moons.length + ' largest moons'} at their real orbital distances` : ''}.`;
    F.note = [map ? 'The surface colours come from a published map; brightness is scaled for display.' : 'No surface map is drawn: the colour is an approximate tint.',
      F.moons.length ? 'Moon sizes and distances are true; where each moon sits on its orbit is illustrative. Smaller moons are not drawn.' : '',
      d.ring ? (d.ring.texture ? 'The ring is drawn flat, with no thickness (the real main rings are about 10 to 20 metres thick) and no shadow; its fainter parts are not drawn.' : 'The planet\'s faint rings are not drawn.') : ''].filter(Boolean).join(' ');
    surfaceAtt(F, (i, c) => { if (!i) { c.set(0, 0, 0); return R; } const m = F.moons[i - 1]; if (!m) return 0; c.copy(m.mm.position).applyQuaternion(spin.quaternion); return m.mm.geometry.parameters.radius; });
    F.spawn = (T) => { if (T.length() < R * 1.05) return spaceBodySurface(() => new V3(), () => body.getWorldQuaternion(new THREE.Quaternion()), R, T, surfaceBiome(o.body), o.body);
      for (const m of F.moons) if (T.distanceTo(m.mm.position.clone().applyQuaternion(spin.quaternion)) < m.mm.geometry.parameters.radius * 1.05) { const mm = m.mm; return spaceBodySurface(() => mm.position.clone().applyQuaternion(spin.quaternion), () => spin.quaternion.clone(), mm.geometry.parameters.radius, T, surfaceBiome(mm.userData.info.title), mm.userData.info.title); }
      return null; };
    F.spawnD = 3e5;
  }
};
/* The surface of a round body as an attractor (js/engine.js, "attractors"): a zoom that is aimed just off the body, at its glow or beside its limb, closes on the
   nearest point of the surface, so the descent lands on the body instead of stopping in the empty space beside it. bodies(i, c) writes the centre of body i into c
   (frame coordinates) and returns its radius, or 0 when there is no body i. It acts only while the target is outside a body, within `reach` radii of its surface,
   and the view is within about six radii of it. */
function surfaceAtt(F, bodies, reach = 1.5) {
  const c = new V3(), v = new V3();
  F.att = {
    D: Infinity,
    find(P) { let best = -1, bs = Infinity; for (let i = 0; ; i++) { const r = bodies(i, c); if (!r) break; const d = (P.distanceTo(c) - r) / r; if (d > 0 && d < reach && d < bs && cam.D < r * F.unit * 6) { bs = d; best = i; } } return best; },
    pos(id, out) { const r = bodies(id, c); if (!r) return null; v.copy(cam.T).sub(c); const L = v.length(); return L <= r * 1.0002 ? null : out.copy(v).multiplyScalar(r * 1.00005 / L).add(c); }
  };
}
/* How the ground of a body is drawn when you land on it: a generic landscape of the right kind (cloud tops, Mars, Venus, an icy surface, bare rock). What that ground
   is made of, body by body, is in data/descent/assign/landscape.json; the icy bodies are the ones whose surfaces are ices there. */
const ICY_BODIES = /^(Europa|Ganymede|Callisto|Enceladus|Mimas|Tethys|Dione|Rhea|Iapetus|Titan|Miranda|Ariel|Umbriel|Titania|Oberon|Triton|Pluto|Charon|Eris|Makemake|Haumea)$/;
function surfaceBiome(body) { return /^(Jupiter|Saturn|Uranus|Neptune)$/.test(body) ? 'cloudtops' : body === 'Mars' ? 'mars' : body === 'Venus' ? 'venus' : ICY_BODIES.test(body) ? 'icemoon' : 'moonrock'; }
function spaceBodySurface(getC, getQ, R, T, biome, body) { // landscape frame glued to a rotating/moving body (parent unit = 1000 km)
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
    const sl = new THREE.DirectionalLight(0xffffff, 1.0); F.add(sl); F.add(sl.target); // 1.0: the lit half of the Moon stays below white, so craters and maria show
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
    globe.userData = { priority: 1, /* no interior view of the Earth is built: a double click goes down to the land or sea at that point (F.spawn) */ resolve: h => { if (!h || !h.uv || !EARTH_PIX) return 'earth'; const b = biomeAtUV(h.uv.x, h.uv.y); return b === 'ocean' ? 'ocean' : b === 'ice' ? 'ice' : 'land'; } }; F.pickables.push(globe);
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.006, 128, 64), new THREE.MeshStandardMaterial({ map: tex('earth_clouds.png'), transparent: true, depthWrite: false, roughness: 1 })); spin.add(clouds);
    F.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.0157, 96, 64), fresnelMat(0x6ab8ff, 3.2, 1.3))); // the glow is drawn about 100 km thick (the conventional edge of space)
    F.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 96, 64), haloMat(0x4aa0ff, 2.4)));
    const atm = hitSphere(R * 1.03, 'atmosphere', .5); atm.userData.noZoom = true; F.add(atm); F.pickables.push(atm); const eLbl = F.label(atm, 'Earth', { offset: new V3(0, R * 1.2, 0) }); eLbl.minSizeFn = () => cam.D > 3e8;
    const pk = markerSprite(0xffd166, 11); pk.position.copy(latLon3(PARK.lat, PARK.lon, R * 1.001)); spin.add(pk); pk.userData = Object.assign(pk.userData, { id: 'parkMarker', priority: 3, zoomTo: () => { flyTo(FR.park, new V3(0, 0, 0), 450); }, zoomPoint: () => { if (FR.region.place) FR.region.place(); return FR.region.pos.clone(); } }); /* the dot floats 6 km above the ground: a scroll aimed at it ends on the park itself */ F.pickables.push(pk); const pkL = F.label(pk, 'Greenwich Park', { cls: 'you', always: true }); pkL.minSizeFn = () => cam.D < 1.5e8;
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.7374, 96, 64), new THREE.MeshStandardMaterial({ map: tex('moon.jpg'), color: 0xd8d8d8, roughness: 1 })); F.add(moon);
    moon.userData = { id: 'moon', priority: 2, madeOf: 'regolith', sim: ['moon'] }; F.pickables.push(moon); F.label(moon, 'Moon', { offset: new V3(0, 1.84, 0) });   /* the dot just above the Moon's north limb (radius 1.7374): at 2.6 it floated about 140 px above the sphere once the Moon was framed */ const mkM = markerSprite(0xffffff, 6); moon.add(mkM); const mh = hitSphere(1, 'moon', 3); mh.userData.zoomTo = () => { flyTo(F, moon.position.clone(), 6e6); }; moon.add(mh); // a pick target a few pixels wide, so the Moon dot can be hit
    moon.userData.zoomTo = mh.userData.zoomTo;
    /* A click on the Moon's dot frames the Moon itself. It used to be slid to the middle of the view at the distance you were at (a dot has no size to frame),
       so the next click or double click on the spot where it had been fell on a faint star behind, and a double click there flew to that star. */
    moon.userData.extent = mh.userData.extent = () => ({ p: moon.position.clone(), r: 1.7374 });
    F.moon = moon;
    const moonCard = () => { const L = moon.userData.live, i = INFO.moon; if (!L) return i; const ph = L.phase, k = (1 - Math.cos(ph * Math.PI / 180)) / 2, nm = ph < 7.5 || ph >= 352.5 ? 'new Moon' : ph < 82.5 ? 'waxing crescent' : ph < 97.5 ? 'first quarter' : ph < 172.5 ? 'waxing gibbous' : ph < 187.5 ? 'full Moon' : ph < 262.5 ? 'waning gibbous' : ph < 277.5 ? 'last quarter' : 'waning crescent';
      return Object.assign({}, i, { facts: [['Distance on the date shown', `${Math.round(L.dist).toLocaleString('en-US')} km`], ['Phase on the date shown', `${nm}, about ${Math.round(k * 100)}% lit`]].concat(i.facts) }); };
    moon.userData.infoFn = moonCard; mh.userData.infoFn = moonCard;
    if (window.Astronomy) { const pts = [], t0 = simTime; for (let k = 0; k <= 96; k++) { const v = Astronomy.GeoMoon(new Date(t0 + k / 96 * 27.3217 * 86400000)); pts.push(eq3(v.x, v.y, v.z).multiplyScalar(149597.870)); } const ml = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: .4, depthWrite: false })); F.add(ml); F.moonRing = ml; }
    const geo = new THREE.Mesh(new THREE.TorusGeometry(42.164, .02, 4, 256), new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: .25 })); geo.rotation.x = Math.PI / 2; F.add(geo);
    { const go = new THREE.Object3D(); go.position.set(42.164, 0, 0); F.add(go); const gl = F.label(go, 'Geostationary orbit (35,786 km up)'); gl.minSizeFn = () => cam.D < 3e8; }
    const iss = new THREE.Group(); iss.add(markerSprite(0xffffff, 6)); const issH = hitSphere(1, 'iss', 3); iss.add(issH); F.add(iss); iss.userData = { id: 'iss', priority: 3, noZoom: true }; F.pickables.push(iss); const issL = F.label(iss, 'ISS (position illustrative)', { offset: new V3(0, .15, 0) }); issL.minSizeFn = () => cam.D < 6e7;
    const PXKe = 2 * Math.tan(25 * Math.PI / 180) / H;
    F.update = () => {
      spin.rotation.y = gmst(); clouds.rotation.y = (simTime / 3.6e6 * .004) % TAU;
      const s = sunDirIn(F); mat.uniforms.uSun.value.copy(s); sl.position.copy(s).multiplyScalar(100);
      if (window.Astronomy) {
        const dtt = astroDate(), v = Astronomy.GeoMoon(dtt); moon.position.copy(eq3(v.x, v.y, v.z).multiplyScalar(149597.870));
        // near side toward Earth, north pole along the Moon's rotation axis (IAU); libration is not modelled
        const toE = moon.position.clone().negate().normalize(), q1 = new THREE.Quaternion().setFromUnitVectors(new V3(1, 0, 0), toE);
        try { const ax = Astronomy.RotationAxis(Astronomy.Body.Moon, dtt), np = eq3(ax.north.x, ax.north.y, ax.north.z).normalize(), up1 = new V3(0, 1, 0).applyQuaternion(q1), pr = (x) => x.clone().addScaledVector(toE, -x.dot(toE)).normalize(), a = pr(up1), b = pr(np), ang = Math.atan2(a.clone().cross(b).dot(toE), a.dot(b)); moon.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(toE, ang).multiply(q1)); } catch (e) { moon.quaternion.copy(q1); }
        moon.userData.live = { dist: moon.position.length() * 1000, phase: Astronomy.MoonPhase(dtt) };
      }
      const camE = camPosIn(F, new V3()); issH.scale.setScalar(Math.max(.12, camE.distanceTo(iss.position) * PXKe * 12)); mh.scale.setScalar(Math.max(1.7374, camE.distanceTo(moon.position) * PXKe * 12)); atm.userData.noZoom = true; if (F.moonRing) F.moonRing.visible = cam.D > 5e7;
      const ia = (simTime / 60000 / 92.9) % 1 * TAU, ip = new V3(Math.cos(ia) * 6.79, 0, Math.sin(ia) * 6.79).applyAxisAngle(new V3(1, 0, 0), 51.6 * Math.PI / 180); iss.position.copy(ip);
    };
    F.blurb = 'Earth at its true size, turning in real time, lit by the Sun from its true direction. The Moon is at its true size, distance and position for the date shown.';
    F.note = 'True: sizes, the Sun\'s direction, the day and night line, the Moon\'s position and phase. Illustrative: the clouds are a fixed sample image, not today\'s weather; the ISS position; the blue glow, drawn about 100 km thick (the conventional edge of space), where the air really thins out gradually.';
    F.spawnD = 2e5;
    surfaceAtt(F, (i, c) => i === 0 ? (c.set(0, 0, 0), R) : i === 1 ? (c.copy(moon.position), 1.7374) : 0);   // aimed at the blue glow: the zoom lands on the ground below it
    F.spawn = (T) => {
      if (T.distanceTo(moon.position) < 1.7374 * 1.05) return spaceBodySurface(() => moon.position.clone(), () => moon.quaternion.clone(), 1.7374, T, 'moonrock', 'Moon');
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
  f.faceUp = true; f.landOn = true;
  f.place = () => { const sp = gmst(); const q = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), sp); f.pos.copy(latLon3(lat, lon, 6.371)).applyQuaternion(q); f.quat.copy(q).multiply(enuQuat(lat, lon)); };
  f.place();
  return f;
}

/* ---------- large-scale view hooks (run once the frame tree exists) ---------- */
WORLD_EXT.push(async FR2 => {
  // scrolling toward the Galactic Centre pulls the zoom target onto it, so the black-hole scene is reached by scrolling
  FR2.mw.attract = new V3(); FR2.mw.attractD = 3e21; FR2.mw.attractR = .5;
  // The Local Group frame draws the galaxies out to 3.1 Mpc; the cosmos frame draws those beyond. Its sphere ends between the two (it reached 3.5 Mpc, so a scroll
  // toward NGC 253 or M82, which belong to the cosmos frame, went down into the Local Group, where they are not drawn).
  if (FR2.mw.parent && FR2.mw.parent.type === 'localgroup') FR2.mw.parent.radius = 3060;
  // the black-hole scene says what is to scale and what is not (the blurb itself is in world_matter.js; only this note is added here)
  if (FT.sgrA && !FT.sgrA._spaceNote) {
    const b = FT.sgrA.build; FT.sgrA._spaceNote = true;
    FT.sgrA.build = function (F, o) {
      b.call(this, F, o);
      F.note = 'To scale: the event horizon, the shadow (about 2.6 times the horizon radius, about 33 million km), the photon ring and the innermost stable orbit (3 times the horizon radius). Not to scale or not real: the S-star orbits (the real S2 orbit is about 1,000 AU wide, far bigger than this scene) and the bright thin disc, which Sgr A* does not have today. Orbits and the probe are sped up.';
    };
  }
});

/* ---------- the Sun frame, its ruler stops, the Oort landmark and the time controls ---------- */
WORLD_EXT.push(async FR2 => {
  const sun = FR2.solar.addChild(new Frame({ type: 'sun', name: 'The Sun', unit: SUN_R_M, radius: 1.6, r0: 0, r1: 3e10 })); FR2.sun = sun;
  const inside = (label, D, p, extra) => ({ label, D, frame: sun, side: true, go: then => { sun.ensure(); cam.dir.set(.62, .5, .6).normalize(); cam.up.set(0, 1, 0); flyTo(sun, p, D, then); }, ...extra });
  EXT_LANDMARKS.push({ label: 'The Sun', D: 3e9, frame: sun, go: then => flyTo(sun, new V3(), 3e9, then) });
  EXT_LANDMARKS.push(inside('Inside the Sun (cut-away)', 1.2e9, new V3(.1, .08, .08)));
  EXT_LANDMARKS.push(inside('The Sun\'s core', 2.6e8, new V3(.05, .04, .04)));
  // the ruler stop "Oort cloud" is set by world_build.js inside the neighbourhood frame, where no Oort cloud is drawn: put it inside the solar-system frame
  let tries = 0; const hook = setInterval(() => {
    if (typeof LANDMARKS === 'undefined' || !LANDMARKS.length) { if (++tries > 200) clearInterval(hook); return; }
    clearInterval(hook);
    const L = LANDMARKS.find(l => l.label === 'Oort cloud'); if (L) { L.D = 4e15; L.frame = FR2.solar; L.go = then => flyTo(FR2.solar, new V3(), 4e15, then); }
    const K = LANDMARKS.find(l => l.label === 'Solar system'); if (K) K.label = 'Solar system (to Neptune)';
    dispatchEvent(new Event('resize'));
  }, 100);
  // time controls: run backwards, faster, jump to a date
  let t2 = 0; const th = setInterval(() => {
    const bs = document.getElementById('timeS'), bn = document.getElementById('timeNow'); if (!bs || !bn || !bs.onclick) { if (++t2 > 300) clearInterval(th); return; }
    clearInterval(th);
    const speeds = [[1, '1×'], [60, '1 min/s'], [3600, '1 h/s'], [86400, '1 day/s'], [86400 * 30, '1 month/s'], [86400 * 365.25, '1 year/s'], [0, 'Paused'], [-86400, '−1 day/s'], [-86400 * 30, '−1 month/s'], [-86400 * 365.25, '−1 year/s']];
    let si = 0; const apply = () => { timeSpeed = speeds[si][0]; bs.textContent = speeds[si][1]; };
    bs.title = 'Time speed: click to cycle through forward, paused and backward speeds; the date is in UTC'; bs.onclick = () => { si = (si + 1) % speeds.length; apply(); };
    bn.title = 'Set the clock to the present moment (the app starts at 12:00 UTC today)';
    const tt = document.getElementById('timeT'); if (tt) tt.style.whiteSpace = 'nowrap'; const tb = document.getElementById('timebar'); if (tb) tb.style.cssText += ';display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;align-items:center';
    const dt = document.createElement('input'); dt.type = 'date'; dt.id = 'timeDate'; dt.title = 'Jump to a date (12:00 UTC)'; dt.setAttribute('aria-label', 'Jump to a date'); dt.style.cssText = 'font:inherit;font-size:12px;padding:2px 4px;border:1px solid var(--rule);border-radius:3px;background:var(--paper);color:var(--ink);width:118px';
    bn.after(dt);
    dt.onchange = () => { if (dt.value) { const [y, m, d] = dt.value.split('-').map(Number); simTime = Date.UTC(y, m - 1, d, 12, 0, 0); timeSpeed = 0; si = 6; apply(); } };
  }, 200);
});
