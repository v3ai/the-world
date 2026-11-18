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

/* ---------- cosmos (Mpc) ---------- */
FT.cosmos = {
  build(F) {
    F.scene.background = new THREE.Color(0x000000);
    const r = rng(2024);
    // observable-universe edge: CMB at ~13,900 Mpc comoving
    const cmb = new THREE.Mesh(new THREE.SphereGeometry(13900, 64, 32), new THREE.MeshBasicMaterial({ map: cmbTex(), side: THREE.BackSide, transparent: true, opacity: .5, depthWrite: false }));
    F.add(cmb); F.pick(cmb, 'cmb', -1); cmb.userData.noZoom = true;
    F.label(cmb, 'Cosmic microwave background — edge of the observable universe (~46 billion light-years)', { offset: new V3(0, 9000, 0) });
    // cosmic web: nodes + filaments to ~600 Mpc (statistical, not a real map), plus real nearby structures
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
      G.filter(g => g.dist_mpc > 3).forEach(g => {
        const p = raDec3(g.ra_deg, g.dec_deg, g.dist_mpc).applyQuaternion(Q_EQ_TO_GAL);
        const big = g.diam_kpc / 1000;
        const s = glowSprite(/cluster|supercluster|attractor/i.test(g.type + g.name) ? 0xffe3b0 : 0xcfe0ff, Math.max(big * .5, .05), .35); s.position.copy(p);
        const grp = new THREE.Group(); grp.add(s); const mk = markerSprite(0xcfe0ff, 5); mk.position.copy(p); grp.add(mk); grp.add(hitSphere(Math.max(big * .6, 1.2), 'cluster', 2));
        grp.userData.info = { title: g.name, tag: g.type, body: `<p>${g.note || ''}</p>`, facts: [['Distance', `≈ ${g.dist_mpc} Mpc (${(g.dist_mpc * 3.2616).toFixed(1)} million light-years)`], ['Size', `≈ ${g.diam_kpc >= 1000 ? (g.diam_kpc / 1000).toFixed(1) + ' Mpc' : g.diam_kpc + ' kpc'}`]] };
        grp.userData.id = 'cluster_' + g.name; grp.userData.priority = 2; grp.userData.sim = ['cosmos'];
        F.add(grp); F.pickables.push(grp); F.label(grp, g.name, { offset: new V3(0, Math.max(big, 2), 0) });
      });
    });
    const lg = markerSprite(0xffd166, 12); F.add(lg); F.label(lg, 'Local Group (you are here)', { cls: 'you', always: true });
    F.update = () => { cmb.material.opacity = .5 * smooth(2e24, 1.5e26, cam.D); };
  }
};
/* ---------- Local Group (kpc, galactic orientation, GC at origin) ---------- */
FT.localgroup = {
  build(F) {
    F.scene.background = new THREE.Color(0); const sprites = [];
    F.update = () => { const k = smooth(2e20, 4e21, cam.D); sprites.forEach(s => s.material.opacity = (.12 + .88 * k) * F.alpha); };
    getJSON('data/galaxies.json').then(G => {
      G.filter(g => g.dist_mpc <= 3.5 && g.name !== 'Milky Way').forEach(g => {
        const p = raDec3(g.ra_deg, g.dec_deg, g.dist_mpc * 1000).applyQuaternion(Q_EQ_TO_GAL).add(SUN_GAL);
        const kind = /S[ab]?b?c?|spiral/i.test(g.type) && !/dSph|dE|Irr|dIrr/i.test(g.type) ? 'spiral' : /E|dSph|dE/.test(g.type) ? 'elliptical' : 'irregular';
        const sz = Math.max(g.diam_kpc, .3);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: galaxySpriteTex(kind), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, rotation: g.ra_deg }));
        s.scale.set(sz * 1.3, kind === 'spiral' ? sz * .55 : sz, 1); s.position.copy(p);
        const grp = new THREE.Group(); grp.add(s); grp.add(markerSprite(0x9fc4ff, 6)); const hs = hitSphere(Math.max(sz * .5, 2), 'lg_' + g.name, 2); hs.position.copy(p); grp.add(hs);
        grp.userData.id = /Andromeda|M31/.test(g.name) ? 'andromeda' : 'lg_' + g.name; grp.userData.priority = 2;
        grp.userData.info = { title: g.name, tag: `${g.type} · ${g.group}`, body: `<p>${g.note || 'A member of our Local Group of galaxies.'}</p>`, facts: [['Distance', `≈ ${(g.dist_mpc * 1000).toFixed(0)} kpc (${(g.dist_mpc * 3.2616 * 1000).toFixed(0)} thousand light-years)`], ['Diameter', `≈ ${g.diam_kpc} kpc`]], note: g.approx ? 'Values approximate.' : '' };
        grp.userData.center = () => p.clone(); grp.userData.radius = sz;
        F.add(grp); F.pickables.push(grp); sprites.push(s);
        if (g.diam_kpc > 3 || /LMC|SMC|Magellan/.test(g.name)) F.label(hs, g.name, { offset: new V3(0, sz * .6, 0) });
      });
    });
    F.label(F.add(new THREE.Object3D()), 'Milky Way', { cls: 'you', offset: new V3(0, 18, 0) });
  }
};
/* ---------- Milky Way (kpc, galactic coordinates, GC at origin, Sun at x = -8.2) ---------- */
FT.milkyway = {
  build(F) {
    const r = rng(101), P = [], C = [], S = [];
    const push = (x, y, z, cr, cg, cb, s) => { if (Math.hypot(x - SUN_GAL.x, y - SUN_GAL.y, z - SUN_GAL.z) < .35) return; P.push(x, y, z); C.push(cr, cg, cb); S.push(s); };
    const rb = 3.2, pitch = Math.tan(12 * Math.PI / 180), arms = [[0, .3], [Math.PI, .3], [Math.PI / 2, .2], [Math.PI * 1.5, .2]], off = 2.35;
    for (let i = 0; i < 60000; i++) {
      const u = r(); let k = 0, acc = 0; for (; k < 3; k++) { acc += arms[k][1]; if (u < acc) break; }
      const rr = Math.min(16, rb + (-Math.log(1 - r() * .985)) * 3.2), th = arms[k][0] + off + Math.log(rr / rb) / pitch;
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
    const sgr = hitSphere(.5, 'sgrA', 2.5); F.add(sgr); F.pickables.push(sgr); F.label(sgr, 'Sagittarius A* (black hole)', { offset: new V3(0, .6, 0) });
    const sm = new THREE.Group(); sm.position.copy(SUN_GAL); sm.add(markerSprite(0xffd166, 14)); const sh = hitSphere(.4, 'sunMarker', 3); sm.add(sh); F.add(sm); F.pickables.push(sm);
    sm.userData.id = 'sunMarker'; sm.userData.priority = 3; sm.userData.center = () => SUN_GAL.clone(); sm.userData.radius = .01;
    F.label(sm, '☉ The Sun (you are here)', { cls: 'you', always: true, offset: new V3(0, .5, 0) });
    // dark-matter halo (toggle)
    const halo = new THREE.Group(); halo.visible = false; F.add(halo);
    const hP = [], hC = [], hS = []; for (let i = 0; i < 5000; i++) { const v = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(30); hP.push(v.x, v.y, v.z); hC.push(.3, .12, .55); hS.push(1 + r()); }
    halo.add(makePoints(hP, hC, hS, { opacity: .18 }));
    seg([['vis', 'Visible galaxy'], ['dm', 'Dark matter halo']], 'vis', k => { halo.visible = k === 'dm'; if (k === 'dm') showInfo('darkhalo'); });
    F.blurb = 'Our galaxy, seen at its true size: 100–400 billion stars. The Sun sits about 26,000 light-years from the center.';
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
    uniforms: { uScale: { value: renderer.getPixelRatio() }, uOpacity: { value: 1 }, uLim: { value: 6.8 } },
    vertexShader: LDV(`attribute float aMag; attribute vec3 aColor; uniform float uScale; uniform float uLim; varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float d=max(length(mv.xyz),1e-7);
        float m=aMag+5.0*log(d)/2.302585-5.0; float b=pow(10.0,-0.4*(m-1.0));
        float s=clamp(1.5+2.6*pow(b,0.4),1.2,16.0); vA=clamp(b*2.0,0.0,1.0)*(1.0-smoothstep(uLim-1.0,uLim+1.5,m));
        vC=aColor; gl_PointSize=s*uScale; gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(`uniform float uOpacity; varying vec3 vC; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); a=a*a*0.7+smoothstep(0.18,0.0,d)*0.6; if(vA*a<0.003) discard; gl_FragColor=vec4(vC*a*vA*uOpacity, 1.0); }`),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
}
FT.neighborhood = {
  build(F) {
    loadStars().then(({ f, meta, con }) => {
      if (!F.built) return;
      const n = f.length / 6, pos = new Float32Array(n * 3), mag = new Float32Array(n), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const x = f[i * 6], y = f[i * 6 + 1], z = f[i * 6 + 2]; pos[i * 3] = x; pos[i * 3 + 1] = z; pos[i * 3 + 2] = -y; mag[i] = f[i * 6 + 3]; const c = bvColor(f[i * 6 + 4]); col.set(c.slice(0, 3), i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(g, starMaterial()); pts.frustumCulled = false; F.add(pts); F.mats = null;
      const names = {}; meta.named.forEach(([i, nm, sp, ly]) => names[i] = [nm, sp, ly]);
      pts.userData.priority = 1;
      pts.userData.resolve = h => 'star';
      pts.userData.infoFn = h => {
        const i = h.hit.index, nm = names[i], M = f[i * 6 + 3], bv = f[i * 6 + 4], d = Math.hypot(f[i * 6], f[i * 6 + 1], f[i * 6 + 2]);
        const c = bvColor(bv), L = Math.pow(10, (4.83 - M) / 2.5);
        return { title: nm ? nm[0] : `Star HIP ${f[i * 6 + 5] | 0 || '—'}`, tag: nm && nm[1] ? `Star · spectral type ${nm[1]}` : 'Star', body: `<p>A real star from the HYG catalog, shown at its measured 3D position. Its color comes from its measured B–V color index, which tracks surface temperature.</p>`, facts: [['Distance', `${(d * 3.2616).toFixed(d < 10 ? 2 : 0)} light-years (${d.toFixed(2)} pc)`], ['Luminosity', L > 10 ? `≈ ${L.toFixed(0)} × Sun` : `≈ ${L.toPrecision(2)} × Sun`], ['Surface temperature', `≈ ${Math.round(c[3] / 100) * 100} K`], ['Absolute magnitude', M.toFixed(2)]] };
      };
      pts.userData.center = h => new V3(pos[h.hit.index * 3], pos[h.hit.index * 3 + 1], pos[h.hit.index * 3 + 2]); pts.userData.radius = () => 2e-7; F.pickables.push(pts); pts.userData.id = 'star';
      F.stars = { f, names, pts };
      const show = ['Sirius', 'Canopus', 'Arcturus', 'Vega', 'Capella', 'Rigel', 'Procyon', 'Betelgeuse', 'Altair', 'Aldebaran', 'Antares', 'Spica', 'Pollux', 'Deneb', 'Polaris', 'Rigil Kentaurus', 'Proxima Centauri', 'Barnard\'s Star', 'Fomalhaut', 'Regulus'];
      meta.named.forEach(([i, nm]) => { if (!show.includes(nm)) return; const o = new THREE.Object3D(); o.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); F.add(o); F.label(o, nm); });
      if (con && con.lines) {
        const lp = []; con.lines.forEach(([nm, segs]) => segs.forEach(([a, b]) => lp.push(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2])));
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
        F.conLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5b7bb0, transparent: true, opacity: .35, depthWrite: false })); F.conLines.visible = store.get('const', false); F.add(F.conLines);
      }
    });
    const sun = markerSprite(0xfff1c8, 10); F.add(sun); F.label(sun, '☉ Sun', { cls: 'you', always: true });
    seg([['off', 'No constellations'], ['on', 'Constellation lines']], store.get('const', false) ? 'on' : 'off', k => { store.set('const', k === 'on'); if (F.conLines) F.conLines.visible = k === 'on'; });
    F.blurb = '109,000 real stars at their measured positions (HYG catalog). Brightness changes with your distance from each star.';
    F.spawn = (T, hint) => {
      if (!hint || hint.id !== 'star' || !F.stars) return null;
      const i = hint.hit.index, f = F.stars.f; const p = new V3(f[i * 6], f[i * 6 + 2], -f[i * 6 + 1]);
      if (p.distanceTo(T) > cam.D / F.unit * 3) return null;
      return new Frame({ type: 'star', pinned: true, name: (F.stars.names[i] || ['A star'])[0], unit: 6.957e8, radius: 3000, r0: 1e7, r1: 3e14, pos: p, opts: { M: f[i * 6 + 3], bv: f[i * 6 + 4], name: (F.stars.names[i] || [])[0] } });
    };
  }
};
/* ---------- a single star (unit = solar radius) ---------- */
FT.star = {
  build(F, o) {
    const c = bvColor(o.bv), T = c[3], L = Math.pow(10, (4.83 - o.M) / 2.5), R = Math.sqrt(L) / Math.pow(T / 5772, 2);
    const mat = sunMaterial(); const m = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), mat); F.add(m); F.pick(m, 'starbody');
    m.userData.info = { title: o.name || 'A star', tag: 'Star', body: `<p>A ball of hot plasma held together by its own gravity and powered by nuclear fusion in its core. Its radius here is estimated from its luminosity and temperature (L = 4πR²σT⁴).</p>`, facts: [['Radius', `≈ ${R.toPrecision(2)} × Sun`], ['Surface temperature', `≈ ${Math.round(T / 100) * 100} K`], ['Luminosity', `≈ ${L.toPrecision(2)} × Sun`]] };
    m.userData.sim = ['star']; m.userData.madeOf = 'plasma';
    const tint = new THREE.Color(c[0], c[1], c[2]);
    const g1 = glowSprite(tint.getHex(), R * 6, .8); F.add(g1); F.add(glowSprite(0xffffff, R * 2.4, .9));
    F.update = (dt, t) => { mat.uniforms.uTime.value = t; m.rotation.y += dt * .02; };
    F.radius = Math.max(R * 50, 10);
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
    const pk = markerSprite(0xffd166, 11); pk.position.copy(latLon3(PARK.lat, PARK.lon, R * 1.001)); spin.add(pk); F.label(pk, '📍 Greenwich Park (the park)', { cls: 'you', always: true });
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
