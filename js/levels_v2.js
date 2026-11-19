'use strict';
/* ================= LEVEL: ATOM (four models) ================= */
const CAT_COL = { nonmetal: '#2f7d4f', noble: '#6a4bb5', alkali: '#b5523b', alkaline: '#b5873b', metalloid: '#4b8db5', halogen: '#2f8f8f', transition: '#5a6478', post: '#6b7a5a' };
function ptPos(Z) {
  if (Z <= 2) return [1, Z === 1 ? 1 : 18];
  const P = Z <= 10 ? [2, 3] : Z <= 18 ? [3, 11] : [4, 19], [per, start] = P, i = Z - start;
  if (per < 4) return [per, i < 2 ? i + 1 : i + 11];
  return [4, i + 1];
}
function radialFn(n, l, p) {
  switch (n * 10 + l) {
    case 10: return Math.exp(-p); case 20: return (2 - p) * Math.exp(-p / 2); case 21: return p * Math.exp(-p / 2);
    case 30: return (27 - 18 * p + 2 * p * p) * Math.exp(-p / 3); case 31: return p * (6 - p) * Math.exp(-p / 3); case 32: return p * p * Math.exp(-p / 3);
    case 40: return (192 - 144 * p + 24 * p * p - p * p * p) * Math.exp(-p / 4); case 41: return p * (80 - 20 * p + p * p) * Math.exp(-p / 4);
  } return 0;
}
function angFn(m, x, y, z) {
  switch (m) { case 's': return 1; case 'px': return x; case 'py': return y; case 'pz': return z; case 'dxy': return 2 * x * y; case 'dyz': return 2 * y * z; case 'dxz': return 2 * x * z; case 'dx2y2': return x * x - y * y; case 'dz2': return (3 * z * z - 1) / 2; }
  return 1;
}
const ORB_NAMES = { s: 's', px: 'pₓ', py: 'p_y', pz: 'p_z', dxy: 'd_xy', dyz: 'd_yz', dxz: 'd_xz', dx2y2: 'd_x²−y²', dz2: 'd_z²' };
function slaterZeff(Z, cfg, n, l) {
  const grp = (nn, ll) => ll <= 1 ? nn + 'sp' : nn + 'spdf'[ll];
  const order = ['1sp', '2sp', '3sp', '3d', '4sp'], me = grp(n, l), mi = order.indexOf(me);
  const cnt = {}; cfg.forEach(([nn, ll, k]) => cnt[grp(nn, ll)] = (cnt[grp(nn, ll)] || 0) + k);
  let S = ((cnt[me] || 1) - 1) * (n === 1 ? .30 : .35);
  if (l <= 1) { cfg.forEach(([nn, ll, k]) => { if (nn === n - 1) S += .85 * k; else if (nn < n - 1) S += k; }); }
  else { order.slice(0, mi).forEach(gk => S += cnt[gk] || 0); }
  return Math.max(1, Z - S);
}
function orbitalList(Z) {
  const out = [];
  electronConfig(Z).forEach(([n, l, k]) => {
    const ms = l === 0 ? ['s'] : l === 1 ? ['px', 'py', 'pz'] : ['dxy', 'dyz', 'dxz', 'dx2y2', 'dz2'];
    const occ = ms.map(() => 0); for (let e = 0; e < k; e++) occ[e % ms.length]++;
    ms.forEach((m, i) => out.push({ n, l, m, e: occ[i] }));
  });
  return out;
}
function wavelengthRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 380) { r = .55; g = .35; b = 1; } else if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) { r = 1; } else { r = .6; }
  return new THREE.Color(r, g, b);
}
const colorName = nm => nm < 380 ? 'ultraviolet (invisible)' : nm < 450 ? 'violet' : nm < 490 ? 'blue' : nm < 520 ? 'cyan-green' : nm < 565 ? 'green' : nm < 590 ? 'yellow' : nm < 625 ? 'orange' : nm <= 750 ? 'red' : 'infrared (invisible)';
let atomModel = store.get('atomModel', 'quantum');
BUILD.atom = (c, opts) => {
  const sym = EL[opts.el] ? opts.el : 'O'; c.opts.el = sym; const E = EL[sym], Z = E.Z, N = E.N;
  c.intro = 'el_' + sym;
  c.scene.background = new THREE.Color(0x02030a);
  const g = c.group, r = rng(Z * 31 + 7);
  g.add(new THREE.AmbientLight(0x8899bb, .5));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(5, 8, 6); g.add(dl);
  g.add(new THREE.PointLight(0x66ccff, .9, 40));
  g.add(starfield(1500, 150, 400, 3, .8));
  const cfg = electronConfig(Z), shellsE = [0, 0, 0, 0]; cfg.forEach(([n, l, k]) => shellsE[n - 1] += k);
  const nShells = shellsE.filter(x => x).length, shellR = [3.2, 5.4, 7.6, 9.8], R = shellR[nShells - 1];
  // ---- nucleus
  const nuc = new THREE.Group(); g.add(nuc);
  const total = Z + N, nr = .42;
  const types = shuffle([...Array(Z).fill('p'), ...Array(N).fill('n')], r);
  const pts = types.map(() => new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.4));
  for (let it = 0; it < 110; it++) {
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = new V3().subVectors(pts[j], pts[i]); let L = d.length();
      if (L < 1e-4) { d.set(r() - .5, r() - .5, r() - .5); L = d.length(); }
      if (L < nr * 1.9) { d.multiplyScalar((nr * 1.9 - L) / 2 / L); pts[i].sub(d); pts[j].add(d); }
    }
    if (it < 90) pts.forEach(p => p.multiplyScalar(.97));
  }
  const pMat = smat(0xff4d4d, { roughness: .35, emissive: 0x2a0000 }), nMat = smat(0x9fb3c8, { roughness: .4, emissive: 0x06090e });
  const ngeo = new THREE.SphereGeometry(nr, 20, 14), nucleons = [];
  types.forEach((t, i) => { const m = new THREE.Mesh(ngeo, t === 'p' ? pMat : nMat); m.position.copy(pts[i]); m.userData = { id: t === 'p' ? 'proton' : 'neutron', base: pts[i].clone(), ph: r() * TAU }; nuc.add(m); c.pickables.push(m); nucleons.push(m); });
  nuc.add(glowSprite(0xff7755, 3 + Math.cbrt(total) * 1.6, .35));
  if (total > 1) { c.addLabel(nucleons[types.indexOf('p')], 'Proton', { offset: new V3(0, .5, 0) }); if (N) c.addLabel(nucleons[types.indexOf('n')], 'Neutron', { offset: new V3(0, -1.2, 0) }); }
  // ---- Dalton
  const dalton = new THREE.Group(); g.add(dalton);
  const dball = new THREE.Mesh(new THREE.SphereGeometry(R * .8, 64, 48), smat(CAT_COL[E.cat], { roughness: .55, metalness: .1 }));
  dball.userData = { id: 'model_dalton' }; dalton.add(dball); c.pickables.push(dball);
  // ---- Thomson
  const thomson = new THREE.Group(); g.add(thomson);
  const pud = new THREE.Mesh(new THREE.SphereGeometry(R * .8, 64, 48), smat(0xff8fb1, { transparent: true, opacity: .32, depthWrite: false, roughness: .6, emissive: 0x2a0812 }));
  pud.userData = { id: 'model_thomson', priority: .5 }; thomson.add(pud); c.pickables.push(pud);
  pud.add(new THREE.Mesh(new THREE.SphereGeometry(R * .805, 64, 48), fresnelMat(0xff9fc0, 2.2, .9)));
  const tE = [], eGeo = new THREE.SphereGeometry(.2, 16, 12), eMatT = smat(0x4cc9ff, { emissive: 0x1a6aa8, roughness: .3 });
  for (let i = 0; i < Z; i++) {
    const t = (i + .5) / Z, y = 1 - 2 * t, s = Math.sqrt(1 - y * y), th = i * 2.39996, rad = R * .8 * (.25 + .6 * Math.cbrt(r()));
    const m = new THREE.Mesh(eGeo, eMatT); m.position.set(Math.cos(th) * s * rad, y * rad, Math.sin(th) * s * rad); m.userData = { id: 'electron', base: m.position.clone(), ph: r() * TAU };
    thomson.add(m); c.pickables.push(m); tE.push(m);
  }
  // ---- Bohr
  const bohr = new THREE.Group(); g.add(bohr);
  const eMat = smat(0x4cc9ff, { emissive: 0x1a6aa8, roughness: .3 }), vMat = smat(0xffd166, { emissive: 0x8a5a00, roughness: .3 });
  const oMat = new THREE.MeshBasicMaterial({ color: 0x5ad1ff, transparent: true, opacity: .2 }), voMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: .3 });
  const electrons = [];
  shellsE.forEach((n, si) => {
    if (!n) return;
    const outer = si === nShells - 1, rad = shellR[si], orbits = Math.ceil(n / 2);
    for (let k = 0; k < orbits; k++) {
      const pivot = new THREE.Group();
      pivot.quaternion.setFromUnitVectors(new V3(0, 0, 1), new V3(gauss(r), gauss(r), gauss(r)).normalize()); bohr.add(pivot);
      pivot.add(new THREE.Mesh(new THREE.TorusGeometry(rad, .016, 6, 160), outer ? voMat : oMat));
      const cnt = Math.min(2, n - k * 2);
      for (let e = 0; e < cnt; e++) {
        const m = new THREE.Mesh(eGeo, outer ? vMat : eMat); m.userData = { id: outer ? 'valence' : 'electron' };
        m.add(glowSprite(outer ? 0xffd166 : 0x4cc9ff, 1.3, .9)); pivot.add(m); c.pickables.push(m);
        electrons.push({ m, rad, base: rad, a: e * Math.PI + r() * TAU, w: 1.9 * Math.pow(3.2 / rad, 1.5), shell: si + 1 });
      }
    }
  });
  const fv = electrons.find(e => e.m.userData.id === 'valence'), fi = electrons.find(e => e.m.userData.id === 'electron');
  if (fv) c.addLabel(fv.m, 'Valence electron', { offset: new V3(0, .4, 0) });
  if (fi) c.addLabel(fi.m, 'Electron', { offset: new V3(0, .4, 0) });
  // ---- Quantum orbitals
  const quantum = new THREE.Group(); g.add(quantum);
  const orbs = orbitalList(Z);
  const SHELLC = [[.55, .85, 1], [.72, .6, 1], [1, .62, .9], [1, .84, .45]];
  let r90 = 1;
  orbs.forEach(o => {
    o.zeff = slaterZeff(Z, cfg, o.n, o.l);
    const rmax = (4 * o.n * o.n + 10) / o.zeff, steps = 500, cdf = new Float64Array(steps + 1);
    for (let i = 1; i <= steps; i++) { const rr = i / steps * rmax, R_ = radialFn(o.n, o.l, o.zeff * rr); cdf[i] = cdf[i - 1] + rr * rr * R_ * R_; }
    const tot = cdf[steps], cnt = Math.max(1, o.e) * 1100, P = new Float32Array(cnt * 3), sign = new Int8Array(cnt), rs = [];
    for (let i = 0; i < cnt; i++) {
      const u = r() * tot; let lo = 0, hi = steps; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid; else hi = mid; }
      const rr = (lo + r()) / steps * rmax; let x, y, z, A;
      for (let k = 0; k < 60; k++) { z = r() * 2 - 1; const ph = r() * TAU, s = Math.sqrt(1 - z * z); x = s * Math.cos(ph); y = s * Math.sin(ph); A = angFn(o.m, x, y, z); if (r() < A * A || o.l === 0) break; }
      P[i * 3] = x * rr; P[i * 3 + 1] = z * rr; P[i * 3 + 2] = y * rr; // z-axis drawn vertical
      sign[i] = Math.sign(radialFn(o.n, o.l, o.zeff * rr) * A) || 1; rs.push(rr);
    }
    rs.sort((a, b) => a - b); o.r90 = rs[Math.floor(rs.length * .9)]; o.P = P; o.sign = sign;
  });
  r90 = Math.max(...orbs.filter(o => o.n === orbs[orbs.length - 1].n).map(o => o.r90));
  const qScale = 7.5 / r90; c.pmPerUnit = 52.918 / qScale;
  orbs.forEach(o => {
    const n = o.sign.length, pos = new Float32Array(n * 3), shellC = new Float32Array(n * 3), phaseC = new Float32Array(n * 3), sz = new Float32Array(n);
    const sc = SHELLC[o.n - 1];
    for (let i = 0; i < n; i++) {
      pos[i * 3] = o.P[i * 3] * qScale; pos[i * 3 + 1] = o.P[i * 3 + 1] * qScale; pos[i * 3 + 2] = o.P[i * 3 + 2] * qScale;
      const b = .55 + r() * .45; shellC.set([sc[0] * b, sc[1] * b, sc[2] * b], i * 3);
      const pc = o.sign[i] > 0 ? [.3, .78, 1] : [1, .55, .22]; phaseC.set([pc[0] * b, pc[1] * b, pc[2] * b], i * 3);
      sz[i] = .3 + r() * .22;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    o.aShell = new THREE.BufferAttribute(shellC, 3); o.aPhase = new THREE.BufferAttribute(phaseC, 3);
    geo.setAttribute('aColor', o.aShell); geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    o.pts = new THREE.Points(geo, pointsMaterial({ opacity: .9 })); o.pts.frustumCulled = false; quantum.add(o.pts);
    o.label = ORB_NAMES[o.m] === 's' ? `${o.n}s` : `${o.n}${ORB_NAMES[o.m]}`;
  });
  const qNuc = hitSphere(.6, 'nucleusQ', 2); qNuc.add(glowSprite(0xffb38a, .8, 1)); quantum.add(qNuc); c.pickables.push(qNuc);
  const qLab = c.addLabel(qNuc, '', { offset: new V3(0, .5, 0) });
  const qOrbLab = c.addLabel(qNuc, '', { offset: new V3(0, -8.6, 0) }); qOrbLab.el.style.display = 'none';
  let selOrb = null;
  function selectOrbital(o) {
    selOrb = o;
    orbs.forEach(x => { x.pts.visible = !o || x === o; x.pts.geometry.setAttribute('aColor', o ? x.aPhase : x.aShell); x.pts.material.uniforms.uOpacity.value = o ? 1 : .9; });
    qOrbLab.el.textContent = o ? `${o.label} orbital · blue = + phase, orange = − phase` : '';
    cfgEl.querySelectorAll('.sh').forEach(sh => sh.classList.toggle('on', o ? sh.dataset.k === `${o.n}${o.l}` : sh.dataset.k === 'all'));
    if (o) { showInfo(o.l === 0 ? 'orbital_s' : o.l === 1 ? 'orbital_p' : 'orbital_d'); if (o.l > 0) fire('orbital'); }
  }
  // ---- photon emission (Bohr)
  const photons = [];
  let jump = null;
  function emit() {
    let nm, note;
    if (sym === 'H') { const ni = [3, 3, 4, 5, 6, 2][Math.floor(r() * 6)], nf = ni === 2 ? 1 : 2; nm = 1e9 / (1.0968e7 * (1 / (nf * nf) - 1 / (ni * ni))); note = `n = ${ni} → ${nf}`; }
    else if (SPECTRA[sym]) { nm = SPECTRA[sym][Math.floor(r() * SPECTRA[sym].length)]; note = E.name + ' line'; }
    else { toast(`No spectral line data is included for ${E.name}. Try H, He, Na, Ne or Ca.`); return; }
    const ev = electrons.filter(e => e.shell === nShells); const e = ev[Math.floor(r() * ev.length)];
    const hiR = sym === 'H' ? shellR[0] + (parseInt(note.split(' ')[2]) - 1) * 2.2 : e.base + 2.2;
    jump = { e, t: 0, hiR, nm, note };
    fire('emit');
  }
  const specBar = document.createElement('div'); specBar.className = 'spec';
  const specTxt = document.createElement('span'); specTxt.textContent = 'Emitted light';
  function markLine(nm) {
    const x = clamp((nm - 380) / (750 - 380), 0, 1); const i = document.createElement('i'); i.style.left = (x * 100) + '%';
    if (nm < 380 || nm > 750) i.style.background = 'repeating-linear-gradient(#fff 0 3px,transparent 3px 6px)';
    specBar.appendChild(i); specTxt.innerHTML = `<b style="color:#fff">${nm.toFixed(1)} nm</b> · ${colorName(nm)} · ${jump ? jump.note : ''}`;
  }
  // ---- UI
  const wrap = document.createElement('div'); wrap.className = 'wrapRel';
  const elBtn = document.createElement('button'); elBtn.className = 'act'; elBtn.innerHTML = `⚛ ${E.name} (${sym}) ▾`; wrap.appendChild(elBtn);
  const pt = document.createElement('div'); pt.className = 'ptable glass';
  let gridH = '<div class="grid">';
  for (let per = 1; per <= 4; per++) for (let gr = 1; gr <= 18; gr++) {
    const e = ELEMENT_TABLE.findIndex((x, i) => { const p = ptPos(i + 1); return p[0] === per && p[1] === gr; });
    gridH += e < 0 ? '<span></span>' : `<button data-s="${ELEMENT_TABLE[e][0]}" class="${ELEMENT_TABLE[e][0] === sym ? 'on' : ''}" style="background:${CAT_COL[ELEMENT_TABLE[e][3]]}" title="${ELEMENT_TABLE[e][1]}"><small>${e + 1}</small>${ELEMENT_TABLE[e][0]}</button>`;
  }
  pt.innerHTML = gridH + '</div><div class="lg">Elements 1–36 · colors show element families</div>';
  wrap.appendChild(pt);
  elBtn.onclick = e => { e.stopPropagation(); pt.classList.toggle('open'); };
  pt.querySelectorAll('button').forEach(b => b.onclick = () => { pt.classList.remove('open'); swapTo('atom', { el: b.dataset.s }); });
  uiEl(wrap);
  const modelSeg = seg([['dalton', 'Dalton 1803'], ['thomson', 'Thomson 1904'], ['bohr', 'Bohr 1913'], ['quantum', 'Quantum 1926']], atomModel, k => { setModel(k); showInfo('model_' + k); });
  const cfgEl = document.createElement('div'); cfgEl.className = 'cfg';
  let ch = '<span class="lbl0">Electrons:</span><div class="sh on" data-k="all"><div class="bx"><i style="width:auto;padding:0 4px;color:#cfd6e6">all</i></div><span class="nm">cloud</span></div>';
  cfg.forEach(([n, l, k]) => {
    const no = 2 * l + 1, occ = Array(no).fill(0); for (let e = 0; e < k; e++) occ[e % no]++;
    ch += `<div class="sh" data-k="${n}${l}" title="${n}${LCH[l]}: ${k} electron${k > 1 ? 's' : ''}"><div class="bx">${occ.map((o, i) => `<i data-i="${i}">${o === 2 ? '↑↓' : o === 1 ? '↑' : ''}</i>`).join('')}</div><span class="nm">${n}${LCH[l]}${SUPD[k]}</span></div>`;
  });
  cfgEl.innerHTML = ch;
  cfgEl.querySelectorAll('.sh').forEach(sh => sh.onclick = ev => {
    if (atomModel !== 'quantum') { modelSeg.querySelector('[data-k=quantum]').click(); }
    if (sh.dataset.k === 'all') { selectOrbital(null); showInfo('config'); return; }
    const n = +sh.dataset.k[0], l = +sh.dataset.k[1], list = orbs.filter(o => o.n === n && o.l === l);
    const idx = ev.target.dataset && ev.target.dataset.i !== undefined ? +ev.target.dataset.i : (selOrb && list.includes(selOrb) ? (list.indexOf(selOrb) + 1) % list.length : 0);
    selectOrbital(list[idx] || list[0]);
  });
  uiEl(cfgEl);
  const specW = document.createElement('div'); specW.className = 'specw';
  const emitBtn = document.createElement('button'); emitBtn.className = 'act'; emitBtn.innerHTML = '💡 Emit light'; emitBtn.onclick = emit;
  specW.appendChild(emitBtn); specW.appendChild(specBar); specW.appendChild(specTxt); uiEl(specW);
  function setModel(k) {
    atomModel = k; store.set('atomModel', k);
    dalton.visible = k === 'dalton'; thomson.visible = k === 'thomson'; bohr.visible = k === 'bohr'; quantum.visible = k === 'quantum';
    nuc.visible = k === 'bohr'; specW.style.display = k === 'bohr' ? '' : 'none'; cfgEl.style.display = (k === 'bohr' || k === 'quantum') ? '' : 'none';
    qLab.always = false;
    if (k === 'quantum') selectOrbital(selOrb);
  }
  setModel(atomModel);
  c.update = (dt, t) => {
    for (const e of electrons) {
      e.a += e.w * dt; let rad = e.rad;
      if (jump && jump.e === e) {
        jump.t += dt; const T = jump.t;
        rad = T < .3 ? lerp(e.base, jump.hiR, ease(T / .3)) : T < .8 ? jump.hiR : T < 1 ? lerp(jump.hiR, e.base, ease((T - .8) / .2)) : e.base;
        if (T >= .8 && !jump.fired) {
          jump.fired = true; const col = wavelengthRGB(jump.nm);
          const ph = glowSprite(col, 2.2, 1); e.m.getWorldPosition(ph.position); g.add(ph);
          photons.push({ s: ph, v: ph.position.clone().normalize().multiplyScalar(14), t: 0 }); markLine(jump.nm);
        }
        if (T >= 1.05) jump = null;
      }
      e.m.position.set(Math.cos(e.a) * rad, Math.sin(e.a) * rad, 0);
    }
    for (let i = photons.length - 1; i >= 0; i--) { const p = photons[i]; p.t += dt; p.s.position.addScaledVector(p.v, dt); p.s.scale.setScalar(2.2 + Math.sin(p.t * 40) * .5); p.s.material.opacity = Math.max(0, 1 - p.t / 2); if (p.t > 2) { g.remove(p.s); p.s.material.dispose(); photons.splice(i, 1); } }
    nuc.rotation.y += dt * .25; nuc.rotation.x += dt * .07;
    for (const m of nucleons) { const u = m.userData; m.position.set(u.base.x + Math.sin(t * 9 + u.ph) * .03, u.base.y + Math.cos(t * 11 + u.ph) * .03, u.base.z); }
    for (const m of tE) { const u = m.userData; m.position.set(u.base.x + Math.sin(t * 2 + u.ph) * .12, u.base.y + Math.cos(t * 2.3 + u.ph) * .12, u.base.z); }
    quantum.rotation.y += dt * .06; bohr.rotation.y += dt * .03; dalton.rotation.y += dt * .1;
  };
  c.minDist = () => R * 1.15 + 1.5;
  c.maxDist = () => Math.max(R, 7.5) * 4.2 + 6;
  c.focusFor = () => nuc.visible ? { pos: nucleons[types.indexOf('p')].getWorldPosition(new V3()), r: nr } : { pos: new V3(), r: .3 };
  c.onActivate = () => { pt.classList.remove('open'); };
};

/* ================= LEVEL: PROTON ================= */
BUILD.proton = (c, opts) => {
  const neutron = opts.kind === 'neutron'; c.opts.kind = neutron ? 'neutron' : 'proton'; c.intro = neutron ? 'neutron_inside' : 'proton_inside';
  c.scene.background = new THREE.Color(0x06020b);
  const g = c.group, r = rng(neutron ? 5 : 9);
  g.add(new THREE.AmbientLight(0xffffff, .7));
  const bound = new THREE.Mesh(new THREE.SphereGeometry(5.2, 64, 48), fresnelMat(0xd58bff, 2.4, 1.1, { base: .03 }));
  bound.userData = { id: c.intro, priority: 0 }; g.add(bound); c.pickables.push(bound);
  // gluon field haze
  const hp = [], hc = [], hs = [];
  for (let i = 0; i < 2600; i++) { const v = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(1.9); if (v.length() > 5) v.setLength(5 * r()); hp.push(v.x, v.y, v.z); const b = .15 + r() * .2; hc.push(b * .8, b * .45, b); hs.push(.5 + r() * .8); }
  const haze = makePoints(hp, hc, hs, { opacity: .7 }); g.add(haze);
  const flavors = neutron ? ['u', 'd', 'd'] : ['u', 'u', 'd'];
  const COLS = [new THREE.Color(0xff3b3b), new THREE.Color(0x3bff6e), new THREE.Color(0x3b8bff)];
  const quarks = flavors.map((f, i) => {
    const grp = new THREE.Group(); grp.userData = { id: f === 'u' ? 'quark_up' : 'quark_down', priority: 2 };
    const mat = new THREE.MeshStandardMaterial({ color: COLS[i].clone(), emissive: COLS[i].clone().multiplyScalar(.5), roughness: .3 });
    const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 32, 24), mat); grp.add(m);
    const gl = glowSprite(COLS[i].getHex(), 2.6, .9); grp.add(gl);
    const a = i / 3 * TAU + .3; grp.userData.home = new V3(Math.cos(a) * 2.3, Math.sin(a) * 2.3, (r() - .5) * 1.2); grp.position.copy(grp.userData.home);
    g.add(grp); c.pickables.push(grp);
    c.addLabel(grp, f === 'u' ? 'Up quark (+⅔)' : 'Down quark (−⅓)', { offset: new V3(0, .8, 0) });
    return { grp, mat, gl, col: COLS[i].clone(), target: COLS[i].clone(), ph: r() * TAU, vel: new V3() };
  });
  const tubeG = new THREE.Group(); tubeG.userData = { id: 'gluon', priority: 1 }; g.add(tubeG); c.pickables.push(tubeG);
  const tubeMats = quarks.map(q => new THREE.MeshBasicMaterial({ color: q.col.clone(), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  let tubes = [];
  const junction = new V3();
  c.addLabel(tubeG, 'Gluon field (strong force)', { offset: new V3(0, -1, 0) });
  // sea quark pairs
  const sea = new THREE.Group(); sea.userData = { id: 'seaquark', priority: 1.5 }; g.add(sea); c.pickables.push(sea);
  const pairs = [];
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Group(); const ci = i % 3;
    const qm = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 12), new THREE.MeshBasicMaterial({ color: COLS[ci], transparent: true }));
    const am = new THREE.Mesh(new THREE.TorusGeometry(.18, .06, 8, 20), new THREE.MeshBasicMaterial({ color: COLS[ci], transparent: true }));
    const link = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending }));
    p.add(qm); p.add(am); p.add(link); sea.add(p);
    pairs.push({ p, qm, am, link, t: r() * 1.2, life: .7 + r() * .8, dir: new V3(), at: new V3() });
  }
  c.addLabel(sea, 'Sea quarks (flickering pairs)', { offset: new V3(3.2, 3.2, 0) });
  let swapT = 1, pulse = null;
  const pulseS = glowSprite(0xffffff, 1.2, 0); g.add(pulseS);
  c.update = (dt, t) => {
    junction.set(0, 0, 0);
    quarks.forEach((q, i) => {
      const h = q.grp.userData.home;
      q.grp.position.set(h.x + Math.sin(t * 2.1 + q.ph) * .55, h.y + Math.cos(t * 1.7 + q.ph * 2) * .55, h.z + Math.sin(t * 1.3 + q.ph) * .6);
      junction.add(q.grp.position);
      q.col.lerp(q.target, 1 - Math.exp(-dt * 6)); q.mat.color.copy(q.col); q.mat.emissive.copy(q.col).multiplyScalar(.5); q.gl.material.color.copy(q.col); tubeMats[i].color.copy(q.col);
    });
    junction.multiplyScalar(1 / 3);
    tubes.forEach(m => { tubeG.remove(m); m.geometry.dispose(); }); tubes = [];
    quarks.forEach((q, i) => {
      const a = q.grp.position, pts = [];
      for (let k = 0; k <= 8; k++) { const s = k / 8, p = new V3().lerpVectors(a, junction, s); const w = Math.sin(s * Math.PI) * .25; p.x += Math.sin(t * 9 + k * 1.7 + i) * w; p.y += Math.cos(t * 8 + k * 1.3 + i) * w; p.z += Math.sin(t * 7 + k + i * 2) * w; pts.push(p); }
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .16 + .04 * Math.sin(t * 5 + i), 8), tubeMats[i]); tubeG.add(m); tubes.push(m);
    });
    // color swaps by gluon exchange
    swapT -= dt;
    if (swapT <= 0 && !pulse) { const i = Math.floor(r() * 3), j = (i + 1 + Math.floor(r() * 2)) % 3; pulse = { i, j, t: 0 }; swapT = .9 + r() * .8; }
    if (pulse) {
      pulse.t += dt / .35; const A = quarks[pulse.i].grp.position, B = quarks[pulse.j].grp.position;
      pulseS.position.lerpVectors(A, B, clamp(pulse.t, 0, 1)); pulseS.material.opacity = Math.sin(clamp(pulse.t, 0, 1) * Math.PI);
      if (pulse.t >= 1) { const tmp = quarks[pulse.i].target.clone(); quarks[pulse.i].target.copy(quarks[pulse.j].target); quarks[pulse.j].target.copy(tmp); pulse = null; pulseS.material.opacity = 0; }
    }
    pairs.forEach(P => {
      P.t += dt;
      if (P.t > P.life) { P.t = 0; P.life = .6 + r() * .9; P.at.set(gauss(r), gauss(r), gauss(r)).multiplyScalar(1.8); if (P.at.length() > 4.3) P.at.setLength(4.3); P.dir.set(gauss(r), gauss(r), gauss(r)).normalize(); }
      const k = Math.sin(P.t / P.life * Math.PI), sep = .15 + .55 * k;
      P.qm.position.copy(P.at).addScaledVector(P.dir, sep); P.am.position.copy(P.at).addScaledVector(P.dir, -sep); P.am.lookAt(P.qm.getWorldPosition(new V3()));
      P.link.position.copy(P.at); P.link.scale.set(1, sep * 2, 1); P.link.quaternion.setFromUnitVectors(new V3(0, 1, 0), P.dir);
      [P.qm, P.am].forEach(m => { m.material.opacity = k; m.scale.setScalar(.4 + .6 * k); }); P.link.material.opacity = .5 * k;
    });
    haze.rotation.y += dt * .1; bound.rotation.y += dt * .05;
  };
  c.focusIn = () => new V3();
  seg([['proton', 'Proton (uud)'], ['neutron', 'Neutron (udd)']], c.opts.kind, k => swapTo('proton', { kind: k }));
  actBtn('🎨 What is color charge?', () => showInfo('colorcharge'));
};

/* ================= LEVEL: MOLECULE ================= */
const CPK = { H: 0xf2f2f2, C: 0x4a4a4a, N: 0x3a5cff, O: 0xff3030, P: 0xff8c1a };
const RAD_BS = { H: .42, C: .62, N: .6, O: .58, P: .7 }, RAD_VDW = { H: 1.2, C: 1.7, N: 1.55, O: 1.52, P: 1.8 };
const MOLS = (() => {
  const t = 1 / Math.sqrt(3), sa = .928 * 1.01, ca = .372 * 1.01;
  return {
    H2O: { name: 'Water', atoms: [['O', 0, 0, 0], ['H', .759, .588, 0], ['H', -.759, .588, 0]], bonds: [[0, 1, 1], [0, 2, 1]], why: 'Oxygen needs 2 more electrons for a full outer shell; each hydrogen needs 1. Sharing one pair with each H solves both!' },
    O2: { name: 'O₂', atoms: [['O', -.604, 0, 0], ['O', .604, 0, 0]], bonds: [[0, 1, 2]], why: 'Each oxygen needs 2 more electrons, so they share two pairs — a double bond.' },
    CO2: { name: 'CO₂', atoms: [['C', 0, 0, 0], ['O', -1.16, 0, 0], ['O', 1.16, 0, 0]], bonds: [[0, 1, 2], [0, 2, 2]], why: 'Carbon needs 4 electrons; each oxygen needs 2. Two double bonds fill everyone\'s shell.' },
    CH4: { name: 'CH₄', atoms: [['C', 0, 0, 0], ['H', 1.09 * t, 1.09 * t, 1.09 * t], ['H', 1.09 * t, -1.09 * t, -1.09 * t], ['H', -1.09 * t, 1.09 * t, -1.09 * t], ['H', -1.09 * t, -1.09 * t, 1.09 * t]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], why: 'Carbon has 4 valence electrons and needs 4 more — one from each of four hydrogens.' },
    NH3: { name: 'NH₃', atoms: [['N', 0, .25, 0], ['H', sa, .25 - ca, 0], ['H', sa * Math.cos(TAU / 3), .25 - ca, sa * Math.sin(TAU / 3)], ['H', sa * Math.cos(2 * TAU / 3), .25 - ca, sa * Math.sin(2 * TAU / 3)]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], why: 'Nitrogen needs 3 more electrons — it shares one pair with each of three hydrogens.' },
  };
})();
(() => {
  const A = (e, v) => [e, v.x, v.y, v.z];
  function tdirs(u, phi0) {
    const a = Math.abs(u.x) < .9 ? new V3(1, 0, 0) : new V3(0, 1, 0);
    const e1 = new V3().crossVectors(u, a).normalize(), e2 = new V3().crossVectors(u, e1).normalize();
    return [0, 1, 2].map(k => { const ph = phi0 + k * TAU / 3; return u.clone().multiplyScalar(-1 / 3).addScaledVector(e1, Math.cos(ph) * .9428).addScaledVector(e2, Math.sin(ph) * .9428).normalize(); });
  }
  const bz = { name: 'Benzene', atoms: [], bonds: [], arom: true, why: 'Each carbon bonds to two carbons and one hydrogen; its last electron joins a ring of six shared π electrons.' };
  for (let k = 0; k < 6; k++) { const a = k * TAU / 6; bz.atoms.push(['C', Math.cos(a) * 1.39, Math.sin(a) * 1.39, 0]); }
  for (let k = 0; k < 6; k++) { const a = k * TAU / 6; bz.atoms.push(['H', Math.cos(a) * 2.48, Math.sin(a) * 2.48, 0]); bz.bonds.push([k, (k + 1) % 6, 1]); bz.bonds.push([k, k + 6, 1]); }
  MOLS.C6H6 = bz;
  const C1 = new V3(0, 0, 0), C2 = new V3(1.52, 0, 0), at = [A('C', C1), A('C', C2)], bo = [[0, 1, 1]];
  tdirs(new V3(1, 0, 0), 0).forEach(d => { at.push(A('H', C1.clone().addScaledVector(d, 1.09))); bo.push([0, at.length - 1, 1]); });
  const d2 = tdirs(new V3(-1, 0, 0), Math.PI / 3), O = C2.clone().addScaledVector(d2[0], 1.43); at.push(A('O', O)); const oi = at.length - 1; bo.push([1, oi, 1]);
  [d2[1], d2[2]].forEach(d => { at.push(A('H', C2.clone().addScaledVector(d, 1.09))); bo.push([1, at.length - 1, 1]); });
  const best = tdirs(C2.clone().sub(O).normalize(), 0).sort((p, q) => O.clone().addScaledVector(q, .96).distanceTo(C1) - O.clone().addScaledVector(p, .96).distanceTo(C1))[0];
  at.push(A('H', O.clone().addScaledVector(best, .96))); bo.push([oi, at.length - 1, 1]);
  MOLS.C2H5OH = { name: 'Ethanol', atoms: at, bonds: bo, why: 'Carbon makes four bonds, oxygen two and hydrogen one — the same counting rule builds every organic molecule.' };
  const CA = new V3(0, 0, 0), CP = new V3(1.53, 0, 0), g = [A('C', CA), A('C', CP)], gb = [[0, 1, 1]];
  const dA = tdirs(new V3(1, 0, 0), 0), Nn = CA.clone().addScaledVector(dA[0], 1.47); g.push(A('N', Nn)); const ni = g.length - 1; gb.push([0, ni, 1]);
  [dA[1], dA[2]].forEach(d => { g.push(A('H', CA.clone().addScaledVector(d, 1.09))); gb.push([0, g.length - 1, 1]); });
  const dN = tdirs(CA.clone().sub(Nn).normalize(), .4); [dN[0], dN[1]].forEach(d => { g.push(A('H', Nn.clone().addScaledVector(d, 1.01))); gb.push([ni, g.length - 1, 1]); });
  const e = new V3(0, Nn.y, Nn.z).normalize(), vp = new V3(.5, 0, 0).addScaledVector(e, .866), vm = new V3(.5, 0, 0).addScaledVector(e, -.866);
  const O1 = CP.clone().addScaledVector(vp, 1.21), O2 = CP.clone().addScaledVector(vm, 1.34);
  g.push(A('O', O1)); gb.push([1, g.length - 1, 2]); g.push(A('O', O2)); const o2i = g.length - 1; gb.push([1, o2i, 1]);
  const u2 = CP.clone().sub(O2).normalize(), nrm = new V3().crossVectors(new V3(1, 0, 0), e), pa = new V3().crossVectors(nrm, u2).normalize(), cA = Math.cos(105 * Math.PI / 180), sA = Math.sin(105 * Math.PI / 180);
  const hO = [1, -1].map(s => O2.clone().addScaledVector(u2.clone().multiplyScalar(cA).addScaledVector(pa, s * sA), .97)).sort((p, q) => q.distanceTo(O1) - p.distanceTo(O1))[0];
  g.push(A('H', hO)); gb.push([o2i, g.length - 1, 1]);
  MOLS.GLY = { name: 'Glycine', atoms: g, bonds: gb, why: 'An amine group and a carboxylic acid on one carbon: link many of these through peptide bonds and you get a protein.' };
})();
const EN = { H: 2.20, C: 2.55, N: 3.04, O: 3.44, P: 2.19 };
BUILD.molecule = (c, opts) => {
  c.scene.background = new THREE.Color(0x050a16); c.scene.fog = new THREE.Fog(0x050a16, 22, 60);
  const g = c.group;
  g.add(new THREE.HemisphereLight(0xbfd8ff, 0x302040, .55));
  const dl = new THREE.DirectionalLight(0xffffff, 1.05); dl.position.set(6, 9, 8); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0x88aaff, .4); dl2.position.set(-6, -3, -5); g.add(dl2);
  const S = 2.3;
  const molG = new THREE.Group(); g.add(molG);
  // background drift
  const r = rng(11), drift = [];
  const keys = Object.keys(MOLS);
  for (let i = 0; i < 34; i++) {
    const M = MOLS[keys[i % keys.length]], dg = new THREE.Group();
    M.atoms.forEach(a => { const m = new THREE.Mesh(new THREE.SphereGeometry(RAD_BS[a[0]] * 1.6, 12, 8), smat(CPK[a[0]], { roughness: .6 })); m.position.set(a[1], a[2], a[3]).multiplyScalar(S * .8); dg.add(m); });
    const v = new V3(gauss(r), gauss(r) * .6, gauss(r)).normalize().multiplyScalar(16 + r() * 22);
    dg.position.copy(v); dg.scale.setScalar(.5); dg.rotation.set(r() * 6, r() * 6, r() * 6); g.add(dg);
    drift.push({ dg, v: new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.25), w: new V3(r(), r(), r()).multiplyScalar(.5) });
  }
  let state = { mode: 'bs', anim: null, atoms: [], bonds: [], key: null, spin: 0 };
  let polG = null, polLabels = [];
  function clearPol() { if (polG) { molG.remove(polG); polG.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); polG = null; } polLabels.forEach(L => removeLabel(c, L)); polLabels = []; }
  function applyPol() {
    clearPol(); const M = MOLS[state.key]; polG = new THREE.Group(); molG.add(polG);
    const q = M.atoms.map(() => 0);
    M.bonds.forEach(([a, b]) => { const d = .25 * (EN[M.atoms[a][0]] - EN[M.atoms[b][0]]); q[a] -= d; q[b] += d; });
    const mu = new V3();
    state.atoms.forEach((m, i) => {
      const col = q[i] < 0 ? new THREE.Color(1, 1, 1).lerp(new THREE.Color(0xff2a2a), clamp(-q[i] * 3.2, 0, 1)) : new THREE.Color(1, 1, 1).lerp(new THREE.Color(0x2a6bff), clamp(q[i] * 4, 0, 1));
      const sh = new THREE.Mesh(new THREE.SphereGeometry(RAD_VDW[m.userData.el] * S * .42, 32, 24), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: .36, depthWrite: false, roughness: .4 }));
      sh.material.userData.noHL = true; sh.position.copy(m.userData.final); polG.add(sh);
      mu.addScaledVector(m.userData.final, q[i]);
      if (Math.abs(q[i]) > .07) polLabels.push(c.addLabel(m, q[i] < 0 ? 'δ−' : 'δ+', { offset: new V3(0, -.9, 0) }));
    });
    if (mu.length() > .12) {
      const dir = mu.clone().negate().normalize(), a = dir.clone().multiplyScalar(-2.2), b = dir.clone().multiplyScalar(2.2), mat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
      const shaft = cylBetween(a, b, .08, mat); polG.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(.26, .6, 16), mat); tip.position.copy(b); tip.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir); polG.add(tip);
      const cross = cylBetween(a.clone().addScaledVector(dir, .35).add(new V3(0, .3, 0)), a.clone().addScaledVector(dir, .35).add(new V3(0, -.3, 0)), .06, mat); polG.add(cross);
      const anchor = new THREE.Object3D(); anchor.position.copy(b); polG.add(anchor);
      polLabels.push(c.addLabel(anchor, 'Net dipole (points to δ− end)', { offset: new V3(0, .5, 0) }));
    } else polLabels.push(c.addLabel(state.atoms[0], 'No net dipole — bond dipoles cancel', { offset: new V3(0, 2.2, 0) }));
  }
  function setMol(key) {
    while (molG.children.length) { const ch = molG.children.pop(); ch.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose && o.material.dispose(); }); }
    polG = null; polLabels = [];
    c.pickables.length = 0; c.labels.forEach(l => l.el.remove()); c.labels.length = 0;
    const M = MOLS[key]; state.key = key; c.opts.mol = key; c.intro = 'mol_' + key;
    const cen = new V3(); M.atoms.forEach(a => cen.add(new V3(a[1], a[2], a[3]))); cen.multiplyScalar(1 / M.atoms.length);
    state.molR = Math.max(...M.atoms.map(a => new V3(a[1], a[2], a[3]).distanceTo(cen))) * S + 1.2;
    if (state.key && c.opts) c.view.g.dist = clamp(state.molR * 3 + 4, Math.max(5.5, state.molR * 1.25 + 2), Math.max(30, state.molR * 6));
    state.atoms = M.atoms.map(([e, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), smat(CPK[e], { roughness: e === 'H' ? .35 : .28, metalness: .05 }));
      m.position.set(x, y, z).sub(cen).multiplyScalar(S); m.userData = { id: 'el_' + e, el: e, final: m.position.clone() };
      m.scale.setScalar(state.mode !== 'sf' ? RAD_BS[e] : RAD_VDW[e] * S * .42);
      const glow = glowSprite(CPK[e] === 0x4a4a4a ? 0x8899aa : CPK[e], 2.4 / m.scale.x, 0); m.add(glow); m.userData.glow = glow;
      molG.add(m); c.pickables.push(m); return m;
    });
    state.bonds = M.bonds.map(([a, b, ord]) => {
      const A = state.atoms[a].userData.final, B = state.atoms[b].userData.final;
      const bg = new THREE.Group(); bg.userData = { id: ord === 2 ? 'bond_double' : 'bond_single', priority: .9 };
      const dir = new V3().subVectors(B, A).normalize();
      let perp = new V3().crossVectors(dir, new V3(0, 0, 1)); if (perp.length() < .1) perp = new V3().crossVectors(dir, new V3(0, 1, 0)); perp.normalize();
      const offs = ord === 2 ? [-.17, .17] : [0]; const rad = ord === 2 ? .09 : .13;
      const mid = new V3().addVectors(A, B).multiplyScalar(.5);
      offs.forEach(o => {
        const pa = A.clone().addScaledVector(perp, o), pb = B.clone().addScaledVector(perp, o), pm = mid.clone().addScaledVector(perp, o);
        bg.add(cylBetween(pa, pm, rad, smat(new THREE.Color(CPK[M.atoms[a][0]]).lerp(new THREE.Color(0xcccccc), .45), { roughness: .4 })));
        bg.add(cylBetween(pm, pb, rad, smat(new THREE.Color(CPK[M.atoms[b][0]]).lerp(new THREE.Color(0xcccccc), .45), { roughness: .4 })));
      });
      bg.visible = state.mode !== 'sf'; molG.add(bg); c.pickables.push(bg); return bg;
    });
    c.addLabel(state.atoms[0], EL[M.atoms[0][0]].name, { offset: new V3(0, 1.1, 0) });
    const hi = M.atoms.findIndex(a => a[0] !== M.atoms[0][0]);
    if (hi > 0) c.addLabel(state.atoms[hi], EL[M.atoms[hi][0]].name, { offset: new V3(0, .8, 0) });
    if (M.arom) {
      const ring = new THREE.Group(); ring.userData = { id: 'delocalized', priority: 1.1 };
      const rm = new THREE.MeshBasicMaterial({ color: 0xb388ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false });
      [-.62, .62].forEach(z => { const t = new THREE.Mesh(new THREE.TorusGeometry(1.39 * S, .16, 12, 72), rm); t.position.z = z * S; ring.add(t); });
      molG.add(ring); c.pickables.push(ring); c.addLabel(ring.children[1], 'Delocalized π electrons', { offset: new V3(0, 3.6, 0) });
    }
    if (state.bonds[0]) { const L = c.addLabel(state.bonds[0], M.bonds[0][2] === 2 ? 'Double bond' : 'Bond', { offset: new V3(0, .5, 0) }); L.obj = state.bonds[0].children[1] || state.bonds[0].children[0]; }
  }
  function buildAnim(user) {
    const r2 = rng(Math.floor(performance.now()));
    state.atoms.forEach((m, i) => { m.userData.start = m.userData.final.clone().add(new V3(gauss(r2), gauss(r2), gauss(r2)).normalize().multiplyScalar(6 + r2() * 3)); m.position.copy(m.userData.start); m.userData.glow.material.opacity = .9; });
    state.bonds.forEach(b => b.scale.setScalar(.001));
    state.anim = { t: 0, user, done: false };
  }
  c.update = (dt, t) => {
    molG.rotation.y += dt * .25;
    for (const d of drift) { d.dg.position.addScaledVector(d.v, dt); d.dg.rotation.x += d.w.x * dt; d.dg.rotation.y += d.w.y * dt; if (d.dg.position.length() > 42) d.dg.position.multiplyScalar(-.9); }
    const a = state.anim;
    if (a) {
      a.t += dt;
      state.atoms.forEach((m, i) => { const k = clamp((a.t - i * .12) / 1.5, 0, 1); m.position.lerpVectors(m.userData.start, m.userData.final, easeOutBack(k)); });
      const bk = clamp((a.t - 1.55) / .45, 0, 1);
      state.bonds.forEach(b => b.scale.setScalar(Math.max(.001, easeOutBack(bk))));
      state.atoms.forEach(m => { m.userData.glow.material.opacity = a.t < 1.6 ? .9 : Math.max(0, .9 - (a.t - 1.6) * 1.5) + (a.t > 1.6 && a.t < 1.9 ? .6 : 0); });
      if (a.t > 1.7 && !a.done) {
        a.done = true;
        if (a.user) { toast(`⚡ Bonded! <span style="color:#c5cde0">${MOLS[state.key].why}</span>`, 'm'); fire('built_' + state.key); }
      }
      if (a.t > 2.8) { state.anim = null; state.atoms.forEach(m => m.userData.glow.material.opacity = 0); }
    }
  };
  function setMode(mode) {
    state.mode = mode;
    state.atoms.forEach(m => { const e = m.userData.el; m.scale.setScalar(mode !== 'sf' ? RAD_BS[e] : RAD_VDW[e] * S * .42); m.userData.glow.scale.setScalar(2.4 / m.scale.x); });
    state.bonds.forEach(b => b.visible = mode !== 'sf');
    if (mode === 'pol') applyPol(); else clearPol();
  }
  setMol(MOLS[opts.mol] ? opts.mol : 'H2O');
  c.focusIn = () => state.atoms[0].getWorldPosition(new V3());
  c.minDist = () => Math.max(5.5, state.molR * 1.25 + 2);
  c.maxDist = () => Math.max(30, state.molR * 6);
  c.view.g.dist = c.view.dist = clamp(state.molR * 3 + 4, c.minDist(), c.maxDist());
  c.zoomInTarget = () => ({ key: 'atom', opts: { el: MOLS[state.key].atoms[0][0] } });
  c.focusFor = (key, o) => { const m = state.atoms.find(a => a.userData.el === (o && o.el)) || state.atoms[0]; return { pos: m.getWorldPosition(new V3()), r: m.scale.x }; };
  seg([['H2O', 'Water'], ['O2', 'O₂'], ['CO2', 'CO₂'], ['CH4', 'Methane'], ['NH3', 'Ammonia'], ['C2H5OH', 'Ethanol'], ['C6H6', 'Benzene'], ['GLY', 'Glycine']], state.key, k => { setMol(k); setMode(state.mode); buildAnim(false); showInfo('mol_' + k); rekey(c); });
  actBtn('⚡ Build it', () => buildAnim(true));
  seg([['bs', 'Ball & stick'], ['sf', 'Space-filling'], ['pol', 'Polarity']], 'bs', k => { setMode(k); if (k === 'pol') showInfo('polarity'); });
  buildAnim(false);
};

/* ================= LEVEL: DNA ================= */
BUILD.dna = (c) => {
  c.scene.background = new THREE.Color(0x040b14); c.scene.fog = new THREE.Fog(0x040b14, 34, 90);
  const g = c.group;
  g.add(new THREE.HemisphereLight(0xcfe0ff, 0x221133, .6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(8, 10, 10); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0x7799ff, .45); dl2.position.set(-8, -4, -6); g.add(dl2);
  // floating particles
  const r = rng(5), pp = [], pc = [], ps = [];
  for (let i = 0; i < 900; i++) { pp.push(gauss(r) * 25, gauss(r) * 25, gauss(r) * 25); pc.push(.3, .5, .8); ps.push(.25 + r() * .3); }
  g.add(makePoints(pp, pc, ps, { opacity: .5 }));
  const SEQ = 'ATGGCTAGCTTACGGATCCGTAAGCTTGCATGCCTGTAA', COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
  const n = SEQ.length, rise = .64, R = 2.4, twist = TAU / 10.5, off = Math.PI * .78;
  const tilt = new THREE.Group(); tilt.rotation.z = .42; g.add(tilt);
  const helix = new THREE.Group(); tilt.add(helix);
  const BC = { A: 0x4ade80, T: 0xf87171, G: 0xfacc15, C: 0x60a5fa };
  const bMat = {}; for (const k in BC) bMat[k] = smat(BC[k], { roughness: .35, emissive: new THREE.Color(BC[k]).multiplyScalar(.12) });
  const sugarMat = smat(0xe9e2c6, { roughness: .5 }), phosMat = smat(0xff9f43, { emissive: 0x2a1400, roughness: .35 }), hbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 });
  const sG = new THREE.SphereGeometry(.36, 20, 14), pG = new THREE.SphereGeometry(.31, 18, 12), bG = new THREE.CylinderGeometry(.22, .22, 1, 14), hG = new THREE.SphereGeometry(.075, 8, 6);
  const bp = [];
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * rise, th = i * twist, letters = [SEQ[i], COMP[SEQ[i]]];
    const e = { y, th, s: [] };
    for (let s = 0; s < 2; s++) {
      const sugar = new THREE.Mesh(sG, sugarMat); sugar.userData = { id: 'sugar' };
      const base = new THREE.Mesh(bG, bMat[letters[s]]); base.userData = { id: 'base_' + letters[s] };
      const phos = i < n - 1 ? new THREE.Mesh(pG, phosMat) : null; if (phos) phos.userData = { id: 'phosphate' };
      [sugar, base, phos].forEach(m => { if (m) { helix.add(m); c.pickables.push(m); } });
      e.s.push({ sugar, base, phos });
    }
    const hb = new THREE.Group(); hb.userData = { id: 'hbond', priority: 1.2 };
    const cnt = (SEQ[i] === 'G' || SEQ[i] === 'C') ? 3 : 2;
    for (let k = 0; k < cnt; k++) { const d = new THREE.Mesh(hG, hbMat); d.position.y = (k - (cnt - 1) / 2) * .17; hb.add(d); }
    helix.add(hb); c.pickables.push(hb); e.hb = hb;
    bp.push(e);
  }
  const tubeMat = smat(0xf2c38b, { roughness: .4, emissive: 0x1a0d00 }); tubeMat.userData.noHL = true;
  const tubes = [null, null];
  const _a = new V3(), _b = new V3();
  function layout(u) {
    const pts = [[], []];
    for (let i = 0; i < n; i++) {
      const e = bp[i];
      const k = smooth(0, 1, (u * (n + 10) - (n - 1 - i)) / 10);
      const angs = [e.th, e.th + off];
      const orig = angs.map(a => new V3(R * Math.cos(a), e.y, R * Math.sin(a)));
      const mid = new V3().addVectors(orig[0], orig[1]).multiplyScalar(.5);
      for (let s = 0; s < 2; s++) {
        const o = e.s[s], a = angs[s], rr = R + k * 2.4;
        o.sugar.position.set(rr * Math.cos(a), e.y, rr * Math.sin(a));
        const dir = new V3().subVectors(mid, orig[s]); const len = dir.length() - .3; dir.normalize();
        const start = o.sugar.position.clone().addScaledVector(dir, .3);
        o.base.position.copy(start).addScaledVector(dir, len / 2);
        o.base.scale.set(1, len, 1); o.base.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
        pts[s].push(o.sugar.position.clone());
        if (o.phos) {
          const kn = smooth(0, 1, (u * (n + 10) - (n - 2 - i)) / 10), ra = R + .3 + (k + kn) * 1.2, pa = a + twist / 2;
          o.phos.position.set(ra * Math.cos(pa), e.y + rise / 2, ra * Math.sin(pa)); pts[s].push(o.phos.position.clone());
        }
      }
      e.hb.visible = k < .05;
      e.hb.position.copy(mid);
    }
    for (let s = 0; s < 2; s++) {
      if (tubes[s]) { helix.remove(tubes[s]); tubes[s].geometry.dispose(); }
      const curve = new THREE.CatmullRomCurve3(pts[s]);
      tubes[s] = new THREE.Mesh(new THREE.TubeGeometry(curve, n * 8, .12, 8, false), tubeMat); helix.add(tubes[s]);
    }
  }
  let unzip = 0, target = 0, built = false;
  layout(0);
  // codon strip
  const AA = { ATG: 'Met (start)', GCT: 'Ala', AGC: 'Ser', TTA: 'Leu', CGG: 'Arg', ATC: 'Ile', CGT: 'Arg', AAG: 'Lys', CTT: 'Leu', GCA: 'Ala', TGC: 'Cys', CTG: 'Leu', TAA: 'STOP' };
  const strip = document.createElement('div'); strip.id = 'seq';
  strip.innerHTML = '<span id="seqLbl">Gene recipe →</span>' + SEQ.match(/.{3}/g).map(cd => `<div class="codon"><span class="l">${cd.split('').map(ch => `<span style="color:#${BC[ch].toString(16).padStart(6, '0')}">${ch}</span>`).join('')}</span><span class="aa">${AA[cd]}</span></div>`).join('');
  strip.title = 'Each 3-letter codon codes for one amino acid';
  uiEl(strip);
  const ub = actBtn('🧬 Unzip & copy', () => { target = target ? 0 : 1; ub.innerHTML = target ? '🧬 Zip back up' : '🧬 Unzip & copy'; });
  c.addLabel(bp[n - 4].s[0].base, 'Base pair', { offset: new V3(0, .3, 0) });
  c.addLabel(bp[6].s[0].phos, 'Sugar-phosphate backbone', { offset: new V3(0, .5, 0) });
  c.update = (dt) => {
    // (no spin in v3)
    if (Math.abs(unzip - target) > .001) {
      unzip += Math.sign(target - unzip) * Math.min(Math.abs(target - unzip), dt / 3.2);
      layout(unzip);
      if (unzip >= .999 && !built) { built = true; fire('unzip'); showInfo('unzip'); }
      if (unzip < .5) built = false;
    }
  };
  // chromatin packing view: nucleosomes on a 30-nm-style fiber
  const chrom = new THREE.Group(); chrom.visible = false; g.add(chrom);
  const HC = [0xf472b6, 0xfb923c, 0x60a5fa, 0x34d399], fiberPts = [], cores = [];
  const nNuc = 10;
  for (let k = 0; k < nNuc; k++) {
    const ctr = new V3(Math.cos(k * 1.15) * 6.5, (k - (nNuc - 1) / 2) * 2.7, Math.sin(k * 1.15) * 6.5);
    const core = new THREE.Group(); core.position.copy(ctr); core.lookAt(new V3(0, ctr.y, 0)); core.rotateX(Math.PI / 2); core.userData = { id: 'histone', priority: 1.2 };
    for (let j = 0; j < 8; j++) { const a = (j % 4) / 4 * TAU + (j < 4 ? 0 : .4), m = new THREE.Mesh(new THREE.SphereGeometry(.85, 18, 14), smat(HC[j % 4], { roughness: .55 })); m.position.set(Math.cos(a) * .85, j < 4 ? -.45 : .45, Math.sin(a) * .85); core.add(m); }
    chrom.add(core); c.pickables.push(core); cores.push(core); core.updateMatrixWorld(true);
    for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * 1.65 * TAU; fiberPts.push(new V3(Math.cos(a) * 2.05, (t - .5) * 1.7, Math.sin(a) * 2.05).applyMatrix4(core.matrix)); }
  }
  const fiber = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fiberPts), nNuc * 70, .3, 8), smat(0x7dd3fc, { emissive: 0x0b3a52, roughness: .35 }));
  fiber.userData = { id: 'nucleosome' }; chrom.add(fiber); c.pickables.push(fiber);
  c.addLabel(cores[4], 'Histone core', { offset: new V3(0, 1.8, 0) });
  const fAnchor = new THREE.Object3D(); fAnchor.position.copy(fiberPts[Math.floor(fiberPts.length * .78)]); chrom.add(fAnchor); c.addLabel(fAnchor, 'DNA wrapped into nucleosomes', { pick: fiber });
  seg([['helix', 'Double helix'], ['fiber', 'Chromatin packing']], 'helix', k => { const f = k === 'fiber'; chrom.visible = f; tilt.visible = !f; strip.style.display = f ? 'none' : ''; ub.style.display = f ? 'none' : ''; if (f) showInfo('nucleosome'); });
  const upd0 = c.update; c.update = (dt, t) => { upd0(dt, t); };
  c.focusIn = () => new V3();
  c.focusFor = () => ({ pos: bp[Math.floor(n / 2)].s[0].base.getWorldPosition(new V3()), r: .5 });
  c.zoomInTarget = () => ({ key: 'molecule', opts: { mol: 'H2O' } });
};

/* ================= LEVEL: CELL ================= */
function mitoTex() {
  return canvasTex('mito', 256, 128, (g, w, h) => {
    g.fillStyle = '#ff8a3d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b8461a'; g.lineWidth = 5;
    for (let x = 12; x < w; x += 20) { g.beginPath(); for (let y = 0; y <= h; y += 4) { const xx = x + Math.sin(y * .12 + x) * 4; y ? g.lineTo(xx, y) : g.moveTo(xx, y); } g.stroke(); }
  });
}
function chloroTex() {
  return canvasTex('chloro', 256, 128, (g, w, h) => {
    g.fillStyle = '#58b947'; g.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 70; i++) { const x = r() * w, y = 15 + r() * (h - 30); for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#1f6b23' : '#2e8a2f'; g.fillRect(x, y + k * 3, 14, 2.5); } }
  });
}
BUILD.cell = (c, opts) => {
  const plant = opts.type === 'plant'; c.opts.type = plant ? 'plant' : 'animal'; c.intro = plant ? 'cell_plant' : 'cell_animal';
  const bg = plant ? 0x04100a : 0x0c0510;
  c.scene.background = new THREE.Color(bg); c.scene.fog = new THREE.Fog(bg, 50, 120);
  const g = c.group, r = rng(plant ? 21 : 12);
  g.add(new THREE.HemisphereLight(0xfff0f5, 0x221133, .65));
  const dl = new THREE.DirectionalLight(0xffffff, .95); dl.position.set(10, 14, 12); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0x99aaff, .35); dl2.position.set(-10, -6, -8); g.add(dl2);
  const cell = new THREE.Group(); g.add(cell);
  let inside;
  if (!plant) {
    const sc = new V3(1, .82, .92);
    const mem = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 48), fresnelMat(0xff8fb1, 2.4, 1.15, { base: .035 }));
    mem.scale.copy(sc); mem.userData = { id: 'membrane', priority: 0 }; cell.add(mem); c.pickables.push(mem);
    const fill = new THREE.Mesh(new THREE.SphereGeometry(11.9, 48, 32), new THREE.MeshBasicMaterial({ color: 0x3a1428, transparent: true, opacity: .35, side: THREE.BackSide, depthWrite: false }));
    fill.scale.copy(sc); cell.add(fill);
    inside = (p, m) => (p.x / (12 * sc.x - m)) ** 2 + (p.y / (12 * sc.y - m)) ** 2 + (p.z / (12 * sc.z - m)) ** 2 < 1;
    c.addLabel(mem, 'Cell membrane', { offset: new V3(0, 10.4, 0) });
  } else {
    const W = 26, H = 18, D = 18;
    const wallG = new THREE.BoxGeometry(W, H, D);
    const wall = new THREE.Mesh(wallG, new THREE.MeshStandardMaterial({ color: 0x7cc46a, transparent: true, opacity: .09, depthWrite: false, side: THREE.DoubleSide }));
    wall.material.userData.noHL = true; wall.userData = { id: 'cellwall', priority: 0 }; cell.add(wall); c.pickables.push(wall);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(wallG), new THREE.LineBasicMaterial({ color: 0x9be37f, transparent: true, opacity: .8 })); cell.add(edges);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(W - .8, H - .8, D - .8), new THREE.MeshBasicMaterial({ color: 0x0f3a1c, transparent: true, opacity: .35, side: THREE.BackSide, depthWrite: false })); cell.add(inner);
    inside = (p, m) => Math.abs(p.x) < W / 2 - m && Math.abs(p.y) < H / 2 - m && Math.abs(p.z) < D / 2 - m;
    c.addLabel(wall, 'Cell wall', { offset: new V3(0, 9.6, 0) });
  }
  // nucleus
  const nucPos = plant ? new V3(-7.5, 2.5, 3) : new V3(-1.5, .6, 0);
  const NR = plant ? 3.0 : 3.4;
  const nucleus = new THREE.Group(); nucleus.position.copy(nucPos); cell.add(nucleus); c.nucPos = nucPos.clone(); c.cellPlant = plant;
  const env = new THREE.Mesh(new THREE.SphereGeometry(NR, 48, 32), smat(0x8b5cf6, { transparent: true, opacity: .4, roughness: .6, depthWrite: false }));
  env.userData = { id: 'nucleus', priority: .5 }; env.add(new THREE.Mesh(new THREE.SphereGeometry(NR * 1.01, 48, 32), fresnelMat(0xc4b5fd, 2, 1)));
  nucleus.add(env); c.pickables.push(env);
  for (let i = 0; i < 46; i++) { const v = new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(NR); const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), smat(0xddd6fe)); d.position.copy(v); env.add(d); }
  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(NR * .32, 32, 24), smat(0x4c1d95, { roughness: .7 })); nucleolus.position.set(NR * .25, NR * .12, NR * .1);
  nucleolus.userData = { id: 'nucleolus', priority: 2 }; nucleus.add(nucleolus); c.pickables.push(nucleolus);
  const chromG = new THREE.Group(); chromG.userData = { id: 'chromatin', priority: 1.5 }; nucleus.add(chromG); c.pickables.push(chromG);
  const chMat = smat(0xd8b4fe, { emissive: 0x3b1a66, roughness: .5 });
  for (let k = 0; k < 9; k++) {
    let p = new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(NR * .3); const pts = [];
    for (let s = 0; s < 26; s++) { p = p.clone().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(.45)); if (p.length() > NR * .82) p.multiplyScalar(NR * .75 / p.length()); pts.push(p); }
    chromG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .07, 6), chMat));
  }
  c.addLabel(env, 'Nucleus', { offset: new V3(0, NR + .4, 0) });
  // ER
  const erG = new THREE.Group(); erG.position.copy(nucPos); erG.userData = { id: 'er' }; cell.add(erG); c.pickables.push(erG);
  const erMat = smat(0x38bdf8, { roughness: .5, emissive: 0x05202c });
  const ribPts = [];
  for (let k = 0; k < 6; k++) {
    const rad = NR + (plant ? .8 + k * .38 : 1 + k * .55), arc = Math.PI * (.75 + r() * .5);
    const m = new THREE.Mesh(new THREE.TorusGeometry(rad, .17, 8, 64, arc), erMat);
    m.rotation.set(Math.PI / 2 + (r() - .5) * .9, (r() - .5) * .6, r() * TAU); m.scale.z = .7; erG.add(m);
    m.updateMatrix();
    for (let j = 0; j < 26; j++) { const a = r() * arc; const v = new V3(Math.cos(a) * (rad + .22), Math.sin(a) * (rad + .22), (r() - .5) * .2).applyMatrix4(m.matrix).add(nucPos); ribPts.push(v); }
  }
  const erAnchor = new THREE.Object3D(); erAnchor.position.copy(ribPts[30]).sub(nucPos); erG.add(erAnchor);
  c.addLabel(erAnchor, 'Endoplasmic reticulum', { pick: erG });
  // golgi
  const golgi = new THREE.Group(); golgi.position.copy(plant ? new V3(-7.5, -4.5, -4.5) : new V3(5.5, -2.8, 2.6)); golgi.rotation.set(.4, r() * TAU, .6);
  golgi.userData = { id: 'golgi' }; cell.add(golgi); c.pickables.push(golgi);
  const gMat = smat(0xfbbf24, { roughness: .45, emissive: 0x2a1a00 });
  for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1.1 + k * .22, .2, 8, 40, Math.PI * .85), gMat); m.position.y = k * .5; m.rotation.x = Math.PI / 2; m.scale.z = .5; golgi.add(m); }
  for (let k = 0; k < 7; k++) { const v = new THREE.Mesh(new THREE.SphereGeometry(.22 + r() * .12, 12, 8), gMat); v.position.set((r() - .5) * 4, r() * 2.5, 1.8 + r() * 1.2); golgi.add(v); }
  c.addLabel(golgi, 'Golgi apparatus', { offset: new V3(0, 2.2, 0) });
  // placement helper
  const placed = [];
  function place(minGap, avoidFn) {
    for (let tries = 0; tries < 400; tries++) {
      const p = plant ? new V3((r() - .5) * 24, (r() - .5) * 16, (r() - .5) * 16) : new V3((r() - .5) * 22, (r() - .5) * 18, (r() - .5) * 20);
      if (!inside(p, 1.6)) continue;
      if (p.distanceTo(nucPos) < NR + 2.2) continue;
      if (p.distanceTo(golgi.position) < 3) continue;
      if (avoidFn && avoidFn(p)) continue;
      if (placed.some(q => q.distanceTo(p) < minGap)) continue;
      placed.push(p); return p;
    }
    return new V3((r() - .5) * 6, (r() - .5) * 6, (r() - .5) * 6);
  }
  let vac = null;
  if (plant) {
    const vc = new V3(3.5, .5, -.5), vs = new V3(7.5, 5.8, 5.8);
    vac = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), smat(0x7dd3fc, { transparent: true, opacity: .26, depthWrite: false, roughness: .2 }));
    vac.position.copy(vc); vac.scale.copy(vs); vac.userData = { id: 'vacuole', priority: .6 };
    vac.add(new THREE.Mesh(new THREE.SphereGeometry(1.01, 48, 32), fresnelMat(0xbae6fd, 2.2, .9)));
    cell.add(vac); c.pickables.push(vac);
    c.addLabel(vac, 'Vacuole', { offset: new V3(0, 0, 0) });
    vac.userData.inVac = p => ((p.x - vc.x) / (vs.x + 1.5)) ** 2 + ((p.y - vc.y) / (vs.y + 1.5)) ** 2 + ((p.z - vc.z) / (vs.z + 1.5)) ** 2 < 1;
  }
  const avoid = vac ? vac.userData.inVac : null;
  // mitochondria
  const mitos = [], mMat = smat(0xffffff, { map: mitoTex(), roughness: .55, emissive: 0x220a00 });
  for (let k = 0; k < (plant ? 5 : 9); k++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mMat); m.scale.set(1.5, .62, .62);
    m.position.copy(place(3, avoid)); m.rotation.set(r() * 6, r() * 6, r() * 6); m.userData = { id: 'mito', ph: r() * 6 };
    cell.add(m); c.pickables.push(m); mitos.push(m);
  }
  c.addLabel(mitos[0], 'Mitochondrion', { offset: new V3(0, 1, 0) });
  // lysosomes / chloroplasts
  const chloros = [];
  if (!plant) {
    for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.5 + r() * .2, 20, 14), smat(0x84cc16, { roughness: .4, emissive: 0x0d1a00 })); m.position.copy(place(2)); m.userData = { id: 'lysosome' }; cell.add(m); c.pickables.push(m); if (k === 0) c.addLabel(m, 'Lysosome', { offset: new V3(0, .8, 0) }); }
  } else {
    const cMat = smat(0xffffff, { map: chloroTex(), roughness: .5, emissive: 0x041a04 });
    for (let k = 0; k < 14; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), cMat); m.scale.set(1.45, .55, .95);
      const p = place(2.8, avoid); m.position.copy(p); m.rotation.set(r() * 6, r() * 6, r() * 6); m.userData = { id: 'chloroplast', base: p.clone(), ph: r() * TAU };
      cell.add(m); c.pickables.push(m); chloros.push(m);
    }
    c.addLabel(chloros[0], 'Chloroplast', { offset: new V3(0, 1, 0) });
  }
  // ribosomes (instanced)
  const ribCount = ribPts.length + 420;
  const rib = new THREE.InstancedMesh(new THREE.SphereGeometry(.1, 8, 6), smat(0xe0e7ff, { emissive: 0x222244 }), ribCount);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < ribCount; i++) {
    let p;
    if (i < ribPts.length) p = ribPts[i];
    else { for (let t = 0; t < 50; t++) { p = new V3((r() - .5) * 24, (r() - .5) * 18, (r() - .5) * 20); if (inside(p, .8) && p.distanceTo(nucPos) > NR + .4 && !(avoid && avoid(p))) break; } }
    mtx.makeTranslation(p.x, p.y, p.z); rib.setMatrixAt(i, mtx);
  }
  rib.userData = { id: 'ribosome', priority: .8 }; cell.add(rib); c.pickables.push(rib);
  // cytoskeleton
  const cl = [];
  for (let k = 0; k < 60; k++) { let a, b; for (let t = 0; t < 40; t++) { a = new V3((r() - .5) * 22, (r() - .5) * 17, (r() - .5) * 18); if (inside(a, 1)) break; } b = a.clone().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(4)); for (let t = 0; t < 8 && !inside(b, 1); t++) b.lerp(a, .5); if (!inside(a, 1)) continue; cl.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cl, 3));
  cell.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .1 })));
  c.update = (dt, t) => {
    mitos.forEach(m => { m.rotation.y += dt * .1; m.position.y += Math.sin(t + m.userData.ph) * dt * .08; });
    chloros.forEach(m => { const u = m.userData; m.position.set(u.base.x + Math.sin(t * .4 + u.ph) * .6, u.base.y + Math.sin(t * .3 + u.ph) * .3, u.base.z + Math.cos(t * .4 + u.ph) * .6); m.rotation.y += dt * .05; });
    cell.rotation.y += dt * .02;
  };
  // membrane close-up: phospholipid bilayer with proteins
  const patch = new THREE.Group(); patch.visible = false; g.add(patch);
  const NL = 22, SP = .92, half = (NL - 1) * SP / 2, prot = [new V3(2.2, 0, 1.4), new V3(-4.2, 0, -3.2)];
  const lip = []; for (let i = 0; i < NL; i++) for (let j = 0; j < NL; j++) { const x = i * SP - half + (j % 2) * .3, z = j * SP - half; if (prot.some(p => Math.hypot(p.x - x, p.z - z) < (p === prot[0] ? 1.9 : 2.2))) continue; lip.push([x, z]); }
  const headG = new THREE.InstancedMesh(new THREE.SphereGeometry(.42, 12, 10), smat(0xf59e0b, { roughness: .45, emissive: 0x2a1500 }), lip.length * 2);
  const tailG = new THREE.InstancedMesh(new THREE.CylinderGeometry(.1, .08, 2.1, 6), smat(0xfde68a, { roughness: .7 }), lip.length * 4);
  const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), rr = rng(8); let hi = 0, ti = 0;
  lip.forEach(([x, z]) => [1, -1].forEach(sd => {
    const yH = sd * 2.75 + (rr() - .5) * .15; mm.makeTranslation(x, yH, z); headG.setMatrixAt(hi++, mm);
    [-.17, .17].forEach(o => { qq.setFromEuler(new THREE.Euler((rr() - .5) * .25, 0, (rr() - .5) * .25)); mm.compose(new V3(x + o, yH - sd * 1.4, z), qq, new V3(1, 1, 1)); tailG.setMatrixAt(ti++, mm); });
  }));
  headG.userData = { id: 'phospholipid' }; tailG.userData = { id: 'phospholipid' }; patch.add(headG); patch.add(tailG); c.pickables.push(headG, tailG);
  const chan = new THREE.Group(); chan.position.copy(prot[0]); chan.userData = { id: 'channel', priority: 2 };
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, m = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 6.6, 14), smat(0x8b5cf6, { roughness: .4, emissive: 0x1a0a33 })); m.position.set(Math.cos(a) * .95, 0, Math.sin(a) * .95); m.rotation.z = .12 * Math.cos(a); chan.add(m); }
  const ions = []; for (let k = 0; k < 4; k++) { const io = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 })); chan.add(io); ions.push(io); }
  patch.add(chan); c.pickables.push(chan);
  const gly = new THREE.Group(); gly.position.copy(prot[1]); gly.userData = { id: 'glycoprotein', priority: 2 };
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), smat(0x22c55e, { roughness: .6, flatShading: true })); blob.scale.set(1, 2.1, 1); gly.add(blob);
  const sugM = smat(0xf0abfc, { roughness: .5 }); let tip = new V3(0, 3.6, 0);
  for (let k = 0; k < 6; k++) { const sgm = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 8), sugM); tip = tip.clone().add(new V3((rr() - .5) * .7, .62, (rr() - .5) * .7)); sgm.position.copy(tip); gly.add(sgm); if (k === 3) { const br = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8), sugM); br.position.copy(tip).add(new V3(.6, .2, 0)); gly.add(br); } }
  patch.add(gly); c.pickables.push(gly);
  const aH = new THREE.Object3D(); aH.position.set(-half, 2.75, half); patch.add(aH); c.addLabel(aH, 'Water-loving heads', { pick: headG });
  const aT = new THREE.Object3D(); aT.position.set(-half, 0, half); patch.add(aT); c.addLabel(aT, 'Oily tails', { pick: tailG });
  c.addLabel(chan, 'Channel protein', { offset: new V3(0, 4, 0) }); c.addLabel(gly, 'Glycoprotein (ID tag)', { offset: new V3(0, 8, 0) });
  const upd0 = c.update;
  c.update = (dt, t) => { upd0(dt, t); ions.forEach((io, k) => { const y = ((t * 1.6 + k * 2.2) % 8.8) - 4.4; io.position.set(Math.sin(t * 3 + k) * .15, -y, Math.cos(t * 3 + k) * .15); io.visible = patch.visible; }); patch.rotation.y += dt * .04; };
  c.focusIn = () => nucleus.getWorldPosition(new V3());
  c.focusFor = () => ({ pos: nucleus.getWorldPosition(new V3()), r: NR });
  seg([['animal', 'Animal cell (yours)'], ['plant', 'Plant cell (leaf)']], c.opts.type, k => swapTo('cell', { type: k }));
  seg([['cell', 'Whole cell'], ['mem', 'Membrane up close']], 'cell', k => { const m = k === 'mem'; patch.visible = m; cell.visible = !m; if (m) showInfo('phospholipid'); });
};

/* ================= LEVEL: LIFE ================= */
function makeHuman() {
  const h = new THREE.Group();
  const skin = smat(0xc68863, { roughness: .6 }), shirt = smat(0x2f6fe4, { roughness: .7 }), pants = smat(0x26303f, { roughness: .8 }), shoe = smat(0x161616), hair = smat(0x2b1a10, { roughness: .9 });
  const add = (geo, mat, x, y, z, parent = h) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  [-1, 1].forEach(s => { add(new THREE.CylinderGeometry(.085, .075, .82, 12), pants, s * .11, .47, 0); add(new THREE.BoxGeometry(.13, .08, .26), shoe, s * .11, .04, .04); });
  add(new THREE.SphereGeometry(.19, 16, 12), pants, 0, .88, 0).scale.set(1.05, .55, .8);
  add(new THREE.CylinderGeometry(.2, .17, .6, 16), shirt, 0, 1.17, 0).scale.z = .75;
  add(new THREE.SphereGeometry(.2, 16, 12), shirt, 0, 1.45, 0).scale.set(1.25, .45, .75);
  add(new THREE.CylinderGeometry(.055, .06, .1, 10), skin, 0, 1.53, 0);
  add(new THREE.SphereGeometry(.13, 24, 18), skin, 0, 1.69, 0).scale.y = 1.12;
  add(new THREE.SphereGeometry(.137, 24, 12, 0, TAU, 0, Math.PI * .55), hair, 0, 1.71, -.008);
  [-1, 1].forEach(s => add(new THREE.SphereGeometry(.016, 8, 6), smat(0x111111), s * .045, 1.71, .118));
  const arms = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * .26, 1.44, 0); piv.rotation.z = s * .12; h.add(piv);
    add(new THREE.CylinderGeometry(.06, .052, .32, 10), shirt, 0, -.16, 0, piv);
    const fore = new THREE.Group(); fore.position.y = -.32; piv.add(fore);
    add(new THREE.CylinderGeometry(.048, .042, .29, 10), skin, 0, -.145, 0, fore);
    add(new THREE.SphereGeometry(.055, 10, 8), skin, 0, -.31, 0, fore);
    return { piv, fore };
  });
  return { h, arms };
}
function makeTree(r, s = 1) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16, .28, 2.6, 8), smat(0x6b4a2b, { roughness: .95 })); trunk.position.y = 1.3; trunk.castShadow = true; t.add(trunk);
  const greens = [0x3f8f3a, 0x4d9e3f, 0x357a33, 0x5aa84a];
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + r() * .7, 1), smat(greens[i % 4], { roughness: .85, flatShading: true }));
    f.position.set((r() - .5) * 1.6, 3 + r() * 1.4, (r() - .5) * 1.6); f.castShadow = true; t.add(f);
  }
  t.scale.setScalar(s); return t;
}
BUILD.life = (c) => {
  const g = c.group, r = rng(77);
  c.scene.fog = new THREE.Fog(0xc9e2f7, 45, 170);
  const sunDir = new V3(30, 38, 18).normalize();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir.clone() }, uDay: { value: 1 } }, side: THREE.BackSide, depthWrite: false,
    vertexShader: LDV(`varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(`uniform vec3 uSun; uniform float uDay; varying vec3 vD; void main(){ float h=max(vD.y,0.); vec3 top=vec3(.2,.45,.86), hor=vec3(.79,.88,.97); vec3 c=mix(hor,top,pow(h,.5)); float s=max(dot(normalize(vD),uSun),0.); c+=vec3(1.,.92,.75)*pow(s,300.)*1.5+vec3(1.,.85,.6)*pow(s,10.)*.25; if(vD.y<0.) c=hor; c*=mix(vec3(.03,.04,.09),vec3(1.),uDay); gl_FragColor=vec4(c,1.); }`)
  }));
  sky.userData = { id: 'air', priority: -1 }; g.add(sky); c.pickables.push(sky);
  g.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a6a2a, .75));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.15); sun.position.copy(sunDir).multiplyScalar(40); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 100 }); sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0006;
  g.add(sun); g.add(sun.target);
  const sunHit = hitSphere(18, 'sunSky', 2); sunHit.position.copy(sunDir).multiplyScalar(330); g.add(sunHit); c.pickables.push(sunHit);
  const sg = glowSprite(0xfff6dd, 70, .9); sg.position.copy(sunHit.position); g.add(sg);
  c.setSun = d => { sky.material.uniforms.uSun.value.copy(d); sun.position.copy(d).multiplyScalar(40); sunHit.position.copy(d).multiplyScalar(330); sg.position.copy(sunHit.position); const day = smooth(-.12, .12, d.y); sun.intensity = 1.15 * day; sg.visible = d.y > -.05; c.scene.fog && c.scene.fog.color.setRGB(.79 * (.08 + .92 * day), .89 * (.08 + .92 * day), .97 * (.1 + .9 * day)); sky.material.uniforms.uDay.value = day; };
  const grassTex = canvasTex('grass', 256, 256, (gg, w, h) => { gg.fillStyle = '#5d9a3e'; gg.fillRect(0, 0, w, h); const rr = rng(4); for (let i = 0; i < 2600; i++) { gg.fillStyle = ['#4f8a33', '#6aa848', '#7cb655', '#558f39', '#8a9a4a'][i % 5]; gg.globalAlpha = .5; gg.fillRect(rr() * w, rr() * h, 2 + rr() * 3, 2 + rr() * 3); } gg.globalAlpha = 1; }, { wrap: true });
  grassTex.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(170, 64), smat(0xffffff, { map: grassTex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData = { id: 'ground', priority: 0 }; g.add(ground); c.pickables.push(ground);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + r(), d = 95 + r() * 35; const hl = new THREE.Mesh(new THREE.SphereGeometry(30 + r() * 25, 24, 12), smat(0x5b8f45, { roughness: 1 })); hl.position.set(Math.cos(a) * d, -18, Math.sin(a) * d); hl.scale.y = .6; g.add(hl); }
  // grass tufts
  const gm = new THREE.InstancedMesh(new THREE.ConeGeometry(.035, .32, 4), smat(0xffffff, { roughness: .9 }), 2600);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  for (let i = 0; i < 2600; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 16; const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - 5, (z + 4) * 1.25) < 3.3) { m4.makeScale(0, 0, 0); gm.setMatrixAt(i, m4); continue; }
    q.setFromEuler(new THREE.Euler((r() - .5) * .5, r() * 6, (r() - .5) * .5)); m4.compose(new V3(x, .14, z), q, new V3(1, .6 + r() * .9, 1)); gm.setMatrixAt(i, m4);
    gm.setColorAt(i, col.setHSL(.26 + r() * .06, .5, .3 + r() * .15));
  }
  g.add(gm);
  // human
  const { h: human, arms } = makeHuman(); human.userData = { id: 'human' }; g.add(human); c.pickables.push(human);
  c.addLabel(human, 'You', { offset: new V3(0, 2.05, 0), cls: 'you' });
  // the dog is a thing built from data (data/things/dog), placed by data/things/index.json
  // trees: the English oaks are things built from data (data/things/oak, placed by data/things/index.json), not made here
  c.parts = { arms, human, sky, sun, sunHit, sg, ground, grass: gm };
  // pond
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 48), smat(0x2a78b8, { roughness: .08, metalness: .35, emissive: 0x06233a }));
  pond.rotation.x = -Math.PI / 2; pond.position.set(5, .03, -4); pond.scale.set(3, 2.3, 1); pond.userData = { id: 'pond' }; g.add(pond); c.pickables.push(pond);
  for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + r() * .14, 0), smat(0x8a8a86, { roughness: .9 })); s.position.set(5 + Math.cos(a) * 3.05, .05, -4 + Math.sin(a) * 2.35); s.castShadow = true; g.add(s); }
  c.addLabel(pond, 'Pond', { offset: new V3(0, .5, 0) });
  // flowers
  const flowers = new THREE.Group(); flowers.position.set(2.6, 0, 2.6); flowers.userData = { id: 'flower' }; g.add(flowers); c.pickables.push(flowers);
  const pcols = [0xff6fa8, 0xb07cff, 0xffffff, 0xff5a5a, 0xffa53a];
  for (let i = 0; i < 16; i++) {
    const f = new THREE.Group(); f.position.set(gauss(r) * .55, 0, gauss(r) * .55); const hgt = .25 + r() * .18;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, hgt, 5), smat(0x3f8a2a)); st.position.y = hgt / 2; f.add(st);
    const pm = smat(pcols[i % 5], { roughness: .6 });
    for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), pm); p.scale.y = .35; p.position.set(Math.cos(k / 5 * TAU) * .055, hgt, Math.sin(k / 5 * TAU) * .055); f.add(p); }
    const ce = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), smat(0xffd23a)); ce.position.y = hgt + .01; f.add(ce);
    flowers.add(f);
  }
  c.addLabel(flowers, 'Flowers', { offset: new V3(0, .8, 0) });
  // bee
  const bee = new THREE.Group(); bee.userData = { id: 'bee', priority: 3 };
  const bb = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), smat(0xffc21a)); bb.scale.set(.05, .035, .035); bee.add(bb);
  const band = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), smat(0x111111)); band.scale.set(.02, .037, .037); band.position.x = -.012; bee.add(band);
  const wings = [-1, 1].map(s => { const w = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6 })); w.scale.set(.03, .005, .02); w.position.set(0, .035, s * .025); bee.add(w); return w; });
  const beeHit = hitSphere(.28, 'bee', 3); bee.add(beeHit);
  g.add(bee); c.pickables.push(bee);
  // mushroom: now a data-driven thing (data/things/mushroom, FT.thing); this empty group keeps the old click id 'mushroom' as a place to fly to
  const mush = new THREE.Group(); mush.position.set(-3.4, .1, -1.6); mush.userData = { id: 'mushroom', node: 'park_mushroom' }; g.add(mush);
  // clouds
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const cg = new THREE.Group(); cg.userData = { id: 'cloud' };
    const cm = smat(0xffffff, { roughness: 1, emissive: 0x8a96a6 });
    for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + r() * 2, 2), cm); s.position.set((r() - .5) * 8, (r() - .3) * 2, (r() - .5) * 4); cg.add(s); }
    const a = r() * TAU, d = 40 + r() * 70; cg.position.set(Math.cos(a) * d, 26 + r() * 14, Math.sin(a) * d); g.add(cg); c.pickables.push(cg); clouds.push(cg);
  }
  // birds
  const birds = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Group(); b.userData = { id: 'bird', priority: 2 };
    const bm = smat(0x2a2a33);
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), bm); body.scale.set(.25, .08, .08); b.add(body);
    const ws = [-1, 1].map(s => { const piv = new THREE.Group(); const w = new THREE.Mesh(new THREE.BoxGeometry(.18, .01, .45), bm); w.position.z = s * .24; piv.add(w); b.add(piv); return { piv, s }; });
    b.add(hitSphere(.9, 'bird', 2));
    g.add(b); c.pickables.push(b); birds.push({ b, ws, r: 9 + i * 3, h: 8 + i * 1.5, sp: .25 + i * .05, ph: i * 2 });
  }
  c.addLabel(birds[0].b, 'Bird', { offset: new V3(0, .5, 0) });
  // every clickable park object opens its own card (data/nodes/park_*.json); objects that have no card yet keep the old INFO text
  { const PN = { pond: 'park_pond', flower: 'park_flower', bee: 'park_bee', cloud: 'park_cloud', bird: 'park_bird', sunSky: 'park_sun', air: 'park_sky', ground: 'park_ground' };
    c.pickables.forEach(o => o.traverse(m => { const n = m.userData && PN[m.userData.id]; if (n) m.userData.node = n; })); }
  c.update = (dt, t) => {
    const wave = false;
    arms[1].piv.rotation.z = lerp(arms[1].piv.rotation.z, wave ? 2.7 : .12, dt * 5);
    arms[1].fore.rotation.z = wave ? Math.sin(t * 9) * .35 : lerp(arms[1].fore.rotation.z, 0, dt * 5);
    arms[0].piv.rotation.z = -.12 - Math.sin(t * 1.3) * .02;
    human.scale.y = 1 + Math.sin(t * 2) * .006;
    const bt = t * 1.4; bee.position.set(2.6 + Math.sin(bt) * .7, .55 + Math.sin(bt * 3) * .12, 2.6 + Math.sin(bt * 2) * .5);
    bee.rotation.y = -Math.atan2(Math.cos(bt * 2) * 1.0, Math.cos(bt) * .7);
    wings.forEach((w, i) => w.rotation.x = Math.sin(t * 60) * .6 * (i ? 1 : -1));
    clouds.forEach((cg, i) => { cg.position.x += dt * .6; if (cg.position.x > 120) cg.position.x = -120; });
    birds.forEach(B => { const a = t * B.sp + B.ph; B.b.position.set(Math.cos(a) * B.r, B.h + Math.sin(t * .7 + B.ph) * .6, Math.sin(a) * B.r - 4); B.b.rotation.y = -a; B.ws.forEach(w => w.piv.rotation.x = Math.sin(t * 8 + B.ph) * .55 * w.s); });
  };
  c.focusIn = () => new V3(0, 1.2, 0);
  c.focusFor = (k, o) => (o && o.type === 'plant') ? { pos: new V3(-13, 4.2, -9), r: 1.4 } : { pos: new V3(0, 1.2, 0), r: .45 };
  c.zoomInTarget = () => ({ key: 'cell', opts: { type: 'animal' } });
};

/* ================= EARTH TEXTURES ================= */
const LAND = [
  [-168, 66, -162, 70, -150, 71, -140, 70, -128, 70, -115, 68, -100, 68, -95, 72, -85, 70, -80, 73, -75, 68, -65, 62, -62, 58, -56, 52, -60, 47, -66, 45, -70, 42, -74, 40, -76, 35, -81, 31, -80, 26, -82, 26, -84, 30, -90, 30, -97, 27, -97, 22, -94, 18, -90, 21, -87, 21, -88, 16, -84, 15, -83, 10, -80, 8, -78, 8, -80, 7, -85, 10, -87, 13, -92, 15, -96, 16, -105, 20, -110, 23, -115, 30, -118, 34, -121, 35, -124, 40, -124, 46, -125, 49, -130, 54, -135, 58, -140, 60, -146, 61, -152, 59, -158, 57, -162, 55, -160, 58, -165, 61, -166, 64],
  [-120, 75, -100, 79, -85, 81, -70, 80, -78, 74, -90, 72, -105, 72, -118, 72],
  [-73, 78, -60, 82, -30, 83, -20, 80, -20, 72, -40, 65, -50, 61, -55, 66, -60, 72],
  [-80, 9, -77, 8, -72, 12, -62, 11, -52, 5, -50, 0, -35, -5, -35, -10, -39, -15, -41, -22, -48, -27, -58, -34, -62, -39, -65, -45, -68, -52, -72, -54, -75, -50, -74, -40, -71, -30, -70, -18, -76, -14, -81, -6, -80, 0, -78, 2],
  [-9, 37, -9, 43, -2, 43.5, -1, 46, -4, 48, 0, 49, 2, 51, 5, 53, 8, 54, 8, 57, 10, 58, 6, 58, 5, 59, 5, 62, 10, 64, 15, 69, 20, 70, 25, 71, 30, 70, 40, 68, 44, 67, 50, 68, 60, 69, 70, 73, 80, 73, 90, 76, 100, 77, 110, 74, 120, 73, 130, 71, 140, 72, 150, 71, 160, 70, 170, 70, 180, 68, 180, 65, 178, 63, 170, 60, 163, 58, 160, 54, 156, 51, 155, 57, 150, 59, 143, 59, 137, 55, 140, 52, 141, 48, 135, 43, 131, 42, 129, 40, 129, 35, 126, 35, 126, 38, 125, 40, 122, 40, 121, 39, 118, 39, 119, 37, 122, 37, 120, 33, 122, 30, 120, 26, 116, 23, 111, 21, 108, 22, 106, 19, 109, 15, 109, 12, 105, 9, 103, 10, 100, 13, 99, 9, 101, 6, 104, 1, 101, 3, 98, 8, 98, 14, 97, 17, 94, 18, 92, 22, 89, 22, 86, 20, 81, 15, 80, 10, 77, 8, 76, 10, 73, 17, 72, 21, 70, 22, 67, 25, 62, 25, 57, 25, 56, 24, 58, 23, 59, 22, 57, 19, 55, 17, 52, 16, 48, 14, 45, 13, 43, 13, 42, 16, 39, 21, 37, 25, 35, 28, 34, 31, 35, 34, 36, 36, 30, 36, 27, 37, 26, 40, 23, 38, 20, 40, 19, 42, 14, 45, 16, 41, 18, 40, 16, 38, 12, 42, 10, 44, 6, 43, 3, 43, 0, 39, -1, 37, -5, 36],
  [-17, 21, -17, 15, -15, 11, -12, 8, -8, 5, -3, 5, 2, 6, 5, 6, 9, 4, 10, -2, 12, -6, 13, -12, 12, -18, 15, -27, 18, -34, 20, -35, 26, -34, 32, -29, 35, -24, 35, -19, 40, -16, 40, -10, 39, -5, 42, -1, 48, 4, 51, 11, 44, 11, 43, 12, 39, 16, 37, 20, 35, 24, 33, 28, 32, 31, 25, 32, 20, 31, 15, 32, 10, 34, 10, 37, 3, 37, -2, 35, -6, 36, -10, 30, -13, 27],
  [44, -25, 47, -25, 50, -15, 49, -12, 44, -16],
  [114, -22, 114, -34, 118, -35, 124, -33, 131, -31, 138, -35, 141, -38, 147, -38, 150, -37, 153, -30, 153, -25, 146, -19, 145, -15, 142, -11, 141, -16, 136, -12, 130, -12, 126, -14, 122, -18],
  [-5, 50, 1, 51, 2, 53, -1, 55, -2, 57, -3, 59, -6, 58, -5, 56, -5, 55, -3, 54, -4, 53, -5, 52],
  [-10, 52, -6, 52, -6, 55, -8, 55, -10, 54],
  [130, 31, 132, 34, 135, 34, 138, 35, 140, 36, 141, 39, 142, 42, 145, 44, 142, 46, 140, 42, 139, 38, 137, 37, 133, 35, 130, 33],
  [95, 5, 98, 4, 104, -2, 106, -6, 104, -5, 100, -1, 95, 3], [105, -6, 114, -7, 114, -8.5, 105, -7.5],
  [109, 1, 111, 3, 117, 7, 119, 5, 118, 1, 116, -4, 110, -3], [131, -1, 137, -2, 141, -3, 147, -6, 150, -10, 143, -9, 138, -8, 134, -4],
  [120, 18, 122, 18, 124, 13, 126, 8, 125, 6, 122, 8, 121, 13, 119, 16], [173, -35, 176, -38, 178, -38, 175, -41, 173, -40],
  [172, -41, 174, -42, 171, -45, 167, -46, 168, -44], [-24, 64, -14, 64, -14, 66, -22, 66.5], [80, 10, 82, 7, 81, 6, 80, 7], [-85, 22, -78, 23, -74, 20, -78, 20, -82, 22],
  [-180, -90, 180, -90, 180, -70, 160, -70, 140, -66, 110, -66, 90, -66, 70, -68, 50, -66, 30, -69, 10, -70, -10, -71, -30, -75, -50, -77, -58, -70, -62, -64, -66, -66, -70, -72, -90, -73, -110, -74, -130, -75, -150, -77, -170, -78, -180, -78],
];
const WATER = [
  [-95, 59, -92, 57, -85, 55, -80, 52, -79, 55, -77, 60, -78, 63, -85, 64, -88, 64, -94, 61],
  [10, 54, 14, 54, 20, 55, 22, 58, 24, 60, 30, 60, 25, 65, 22, 66, 18, 63, 17, 60, 16, 56, 12, 56],
  [48, 30, 50, 27, 52, 24, 56, 24, 56, 27, 51, 28], [47, 45, 50, 47, 53, 45, 53, 41, 54, 38, 51, 37, 49, 38, 47, 41], [28, 42, 28, 45, 33, 46, 37, 45, 41, 42, 36, 41, 30, 41],
];
const ICE = [
  [-73, 78, -60, 82, -30, 83, -20, 80, -22, 72, -40, 66, -48, 62, -52, 64, -55, 70, -62, 76],
  LAND[LAND.length - 1],
];
function earthCanvases() {
  if (earthCanvases.c) return earthCanvases.c;
  const W = 2048, H = 1024, col = document.createElement('canvas'); col.width = W; col.height = H; const g = col.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#173a62'); gr.addColorStop(.5, '#1a5b94'); gr.addColorStop(1, '#173a62'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = rng(42);
  for (let i = 0; i < 500; i++) { const x = r() * W, y = r() * H, rad = 20 + r() * 90; const gg = g.createRadialGradient(x, y, 0, x, y, rad); gg.addColorStop(0, r() < .5 ? 'rgba(10,40,80,.22)' : 'rgba(60,140,200,.1)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.save(); pathPolys(g, LAND, W, H); for (const [lw, a] of [[16, .08], [9, .14], [4, .2]]) { g.lineWidth = lw; g.strokeStyle = `rgba(90,190,220,${a})`; g.stroke(); } g.restore();
  g.save(); pathPolys(g, LAND, W, H); g.fillStyle = '#4f7d3a'; g.fill(); g.clip();
  const blob = (lon, lat, rx, ry, color, a = .95) => { const [x, y] = lonlatXY(lon, lat, W, H); const rxp = rx / 360 * W, ryp = ry / 180 * H; g.save(); g.translate(x, y); g.scale(1, ryp / rxp); const gg = g.createRadialGradient(0, 0, 0, 0, 0, rxp); gg.addColorStop(0, rgba(color, a)); gg.addColorStop(.6, rgba(color, a * .7)); gg.addColorStop(1, rgba(color, 0)); g.fillStyle = gg; g.beginPath(); g.arc(0, 0, rxp, 0, TAU); g.fill(); g.restore(); };
  [[100, 70, 70, 6, 0x8d9478], [-110, 67, 35, 5, 0x8d9478], [100, 60, 45, 8, 0x33573a], [-100, 56, 32, 7, 0x35603a], [-85, 38, 12, 7, 0x3b6a30], [15, 50, 16, 6, 0x4a7a38],
  [20, 10, 24, 5, 0x8a9a4a], [25, -12, 14, 6, 0x8a9a4a], [135, -15, 14, 4, 0x8a9a4a], [-48, -14, 9, 7, 0x7d8f45], [78, 20, 9, 7, 0x7d8f45],
  [-62, -5, 15, 10, 0x2d5e28], [21, 0, 10, 7, 0x2d5e28], [103, 12, 9, 9, 0x2f6a2a], [113, 0, 11, 6, 0x2d5e28],
  [12, 22, 30, 9, 0xd2b47a], [-4, 24, 14, 7, 0xd2b47a], [46, 23, 11, 8, 0xd2b47a], [58, 31, 9, 5, 0xc4a874], [71, 27, 5, 4, 0xc4a874], [103, 43, 15, 5, 0xc0a878], [83, 39, 9, 3, 0xcdb27f], [132, -25, 17, 9, 0xc9935a], [21, -23, 7, 6, 0xc4a874], [-112, 33, 8, 5, 0xc0a070], [-70, -23, 3, 8, 0xb59c74], [-68, -45, 5, 6, 0xb6a476],
  [88, 33, 11, 4, 0x8b8577], [-70, -15, 3, 18, 0x7d6f5e], [-112, 45, 6, 10, 0x7a7560]].forEach(b => blob(...b));
  for (let i = 0; i < 5000; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.05)'; g.fillRect(r() * W, r() * H, 2 + r() * 5, 2 + r() * 4); }
  g.restore();
  g.save(); pathPolys(g, WATER, W, H); g.fillStyle = '#1d5a8c'; g.fill(); g.restore();
  g.save(); pathPolys(g, ICE, W, H); g.fillStyle = '#eef4fa'; g.fill(); g.restore();
  g.fillStyle = 'rgba(235,243,250,.92)'; g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= W; x += 16) g.lineTo(x, (90 - 79 - Math.sin(x * .013) * 2 - Math.sin(x * .041) * 1.2) / 180 * H); g.lineTo(W, 0); g.fill();
  const mW = W / 4, mH = H / 4, mask = document.createElement('canvas'); mask.width = mW; mask.height = mH; const m = mask.getContext('2d');
  m.fillStyle = '#000'; m.fillRect(0, 0, mW, mH); pathPolys(m, LAND, mW, mH); m.fillStyle = '#f00'; m.fill(); pathPolys(m, WATER, mW, mH); m.fillStyle = '#000'; m.fill(); pathPolys(m, ICE, mW, mH); m.fillStyle = '#0f0'; m.fill(); m.fillRect(0, 0, mW, (11 / 180) * mH);
  const rough = document.createElement('canvas'); rough.width = mW; rough.height = mH; const rg = rough.getContext('2d');
  rg.fillStyle = '#6e6e6e'; rg.fillRect(0, 0, mW, mH); pathPolys(rg, LAND, mW, mH); rg.fillStyle = '#e6e6e6'; rg.fill(); pathPolys(rg, WATER, mW, mH); rg.fillStyle = '#6e6e6e'; rg.fill();
  earthCanvases.c = { col, maskData: m.getImageData(0, 0, mW, mH), mW, mH, rough };
  return earthCanvases.c;
}
function earthTex() { if (!texCache.earth) { texCache.earth = new THREE.CanvasTexture(earthCanvases().col); texCache.earth.anisotropy = 8; } return texCache.earth; }
function earthRough() { if (!texCache.earthR) texCache.earthR = new THREE.CanvasTexture(earthCanvases().rough); return texCache.earthR; }
function cloudTex() {
  return canvasTex('clouds', 1024, 512, (g, w, h) => {
    const r = rng(9);
    for (let i = 0; i < 1500; i++) {
      const t = r(); let lat = t < .28 ? gauss(r) * 7 : t < .75 ? (r() < .5 ? -1 : 1) * (48 + gauss(r) * 11) : (r() * 2 - 1) * 72;
      const lon = r() * 360 - 180, [x, y] = lonlatXY(lon, lat, w, h), rad = 4 + r() * r() * 26, a = .05 + r() * .2;
      for (const ox of [0, -w, w]) { g.save(); g.translate(x + ox, y); g.scale(2.3, 1); const gg = g.createRadialGradient(0, 0, 0, 0, 0, rad); gg.addColorStop(0, `rgba(255,255,255,${a})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gg; g.fillRect(-rad, -rad, rad * 2, rad * 2); g.restore(); }
    }
  });
}
function rockyTex(key, base, dark, light, seed, extra) {
  return canvasTex(key, 512, 256, (g, w, h) => {
    const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, rad = 15 + r() * 60; const gg = g.createRadialGradient(x, y, 0, x, y, rad); gg.addColorStop(0, rgba(dark, .45)); gg.addColorStop(1, rgba(dark, 0)); g.fillStyle = gg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rad = 1 + r() * r() * 9; g.fillStyle = rgba(dark, .5); g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); g.strokeStyle = rgba(light, .5); g.lineWidth = 1; g.beginPath(); g.arc(x - .6, y - .6, rad, Math.PI, Math.PI * 1.8); g.stroke(); }
    if (extra) extra(g, w, h, r);
  });
}
function moonTex() { return rockyTex('moon', '#a3a3a3', 0x5d5d63, 0xe0e0e0, 8); }
function bandTex(key, cols, seed, extra) {
  return canvasTex(key, 512, 256, (g, w, h) => {
    const r = rng(seed), C = cols.map(c => new THREE.Color(c)), ph = r() * 10;
    for (let y = 0; y < h; y++) { const v = y / h; const n = Math.abs(v * C.length * 1.8 + Math.sin(v * 31 + ph) * .6 + Math.sin(v * 77) * .25); const i = Math.floor(n) % C.length, f = n % 1; g.fillStyle = C[i].clone().lerp(C[(i + 1) % C.length], f * f * (3 - 2 * f)).getStyle(); g.fillRect(0, y, w, 1); }
    for (let i = 0; i < 300; i++) { const c = C[Math.floor(r() * C.length)]; g.fillStyle = `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},.28)`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 1 + r() * 3, 0, 0, TAU); g.fill(); }
    if (extra) extra(g, w, h, r);
  });
}

/* ================= LEVEL: EARTH ================= */
BUILD.earth = (c) => {
  const g = c.group;
  g.add(starfield(4000, 300, 900, 13));
  const lightDir = new V3(-1, .15, .12).normalize();
  const sun = new THREE.DirectionalLight(0xffffff, 1.45); sun.position.copy(lightDir).multiplyScalar(50); g.add(sun);
  g.add(new THREE.AmbientLight(0x223355, .28));
  const sg = glowSprite(0xfff3d6, 60, 1); sg.position.copy(lightDir).multiplyScalar(500); g.add(sg);
  const tiltG = new THREE.Group(); tiltG.rotation.z = -.41; g.add(tiltG);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(5, 96, 64), new THREE.MeshStandardMaterial({ map: earthTex(), roughnessMap: earthRough(), roughness: 1, metalness: 0 }));
  earth.material.userData.noHL = true;
  const EC = earthCanvases();
  earth.userData = {
    priority: 1, resolve: hit => {
      if (!hit || !hit.uv) return 'earth';
      const x = clamp(Math.floor(hit.uv.x * EC.mW), 0, EC.mW - 1), y = clamp(Math.floor((1 - hit.uv.y) * EC.mH), 0, EC.mH - 1), i = (y * EC.mW + x) * 4;
      return EC.maskData.data[i + 1] > 128 ? 'ice' : EC.maskData.data[i] > 128 ? 'land' : 'ocean';
    }
  };
  earth.rotation.y = -1.72; tiltG.add(earth); c.pickables.push(earth);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(5.06, 96, 64), new THREE.MeshStandardMaterial({ map: cloudTex(), transparent: true, depthWrite: false, roughness: 1 }));
  clouds.rotation.y = -1.72; tiltG.add(clouds);
  const atm1 = new THREE.Mesh(new THREE.SphereGeometry(5.1, 64, 48), fresnelMat(0x6ab8ff, 3.2, 1.3)); g.add(atm1);
  const atm2 = new THREE.Mesh(new THREE.SphereGeometry(5.45, 64, 48), haloMat(0x4aa0ff, 2.6)); g.add(atm2);
  // interior cutaway (wedge facing the default camera)
  const inside = new THREE.Group(); inside.visible = false; g.add(inside);
  const phc = 1.221, ps = phc + Math.PI / 4, pl = 1.5 * Math.PI;
  const shellGeo = new THREE.SphereGeometry(5, 96, 64, ps, pl); const suv = shellGeo.attributes.uv;
  for (let i = 0; i < suv.count; i++) suv.setX(i, ((ps + suv.getX(i) * pl) / TAU) % 1);
  const shell = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({ map: earthTex(), roughness: .9 })); shell.material.userData.noHL = true; shell.userData = { id: 'crust', priority: .5 }; inside.add(shell); c.pickables.push(shell);
  const LAY = [[0, .957, 0xffe066, 'innercore'], [.957, 2.731, 0xff9a3c, 'outercore'], [2.731, 4.48, 0xd4502e, 'mantle'], [4.48, 4.86, 0xa33a22, 'mantle'], [4.86, 5, 0x6b4e3a, 'crust']];
  [phc - Math.PI / 4, phc + Math.PI / 4].forEach((phi, fi) => LAY.forEach(([a, b, col, id]) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(Math.max(a, .001), b, 96, 1, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    m.rotation.y = phi + Math.PI; m.userData = { id, priority: 2 }; inside.add(m); c.pickables.push(m);
  }));
  const ic = new THREE.Mesh(new THREE.SphereGeometry(.96, 32, 24), new THREE.MeshBasicMaterial({ color: 0xfff1a0 })); ic.userData = { id: 'innercore', priority: 3 }; ic.add(glowSprite(0xffe08a, 4, .7)); inside.add(ic); c.pickables.push(ic);
  const d1 = new V3(-Math.cos(phc - Math.PI / 4), 0, Math.sin(phc - Math.PI / 4));
  [['Inner core', 0, 1.7], ['Outer core', 1.85, .2], ['Mantle', 3.6, .5], ['Crust', 4.93, 2.4]].forEach(([t, rad, y]) => { const a = new THREE.Object3D(); a.position.copy(d1).multiplyScalar(rad).add(new V3(0, y, 0)); inside.add(a); c.addLabel(a, t); });
  // magnetic field (simplified dipole) + aurorae
  const field = new THREE.Group(); field.visible = false; tiltG.add(field);
  const fp = [];
  [1.6, 2.2, 3.0, 4.2, 5.8].forEach(Lsh => { const th0 = Math.asin(Math.sqrt(1 / Lsh)); for (let k = 0; k < 12; k++) { const ph = k / 12 * TAU; let prev = null; for (let i = 0; i <= 60; i++) { const th = th0 + (Math.PI - 2 * th0) * i / 60, rr = Lsh * Math.sin(th) ** 2 * 5; const v = new V3(rr * Math.sin(th) * Math.cos(ph), rr * Math.cos(th), rr * Math.sin(th) * Math.sin(ph)); if (prev) fp.push(prev.x, prev.y, prev.z, v.x, v.y, v.z); prev = v; } } });
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  const fMat = new THREE.LineBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(fg, fMat); lines.userData = { id: 'magnetosphere', priority: .4 }; field.add(lines); c.pickables.push(lines);
  const aur = new THREE.Group(); aur.userData = { id: 'aurora', priority: 2 }; field.add(aur); c.pickables.push(aur);
  [1, -1].forEach(sg => { [[1.95, 0x5bff9a, .8, 5.0], [2.05, 0xff5b6b, .35, 5.25]].forEach(([rad, col, op, R]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(rad * R / 5, .13, 8, 72), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); t.rotation.x = Math.PI / 2; t.position.y = sg * 4.6 * R / 5; aur.add(t); }); });
  const fA = new THREE.Object3D(); fA.position.set(13, 6, 0); field.add(fA); c.addLabel(fA, 'Magnetic field lines', { pick: lines });
  c.addLabel(aur.children[0], 'Aurora', { offset: new V3(0, .6, 0) });
  let mode = 'surf';
  seg([['surf', 'Surface'], ['in', 'Inside Earth'], ['mag', 'Magnetic field']], 'surf', k => {
    mode = k; const surf = k !== 'in';
    earth.visible = clouds.visible = atm1.visible = atm2.visible = surf; inside.visible = k === 'in'; field.visible = k === 'mag';
    if (k === 'in') showInfo('earth'); if (k === 'mag') showInfo('magnetosphere');
  });
  // moon
  const moonPiv = new THREE.Group(); moonPiv.rotation.z = .09; g.add(moonPiv);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.36, 48, 32), smat(0xffffff, { map: moonTex(), roughness: 1 })); moon.userData = { id: 'moon', priority: 2 };
  moonPiv.add(moon); c.pickables.push(moon);
  c.addLabel(moon, 'Moon', { offset: new V3(0, 1.8, 0) });
  // ISS
  const issPiv = new THREE.Group(); issPiv.rotation.x = .9; g.add(issPiv);
  const iss = new THREE.Group(); iss.userData = { id: 'iss', priority: 3 };
  const mm = smat(0xdddddd, { metalness: .5, roughness: .4 }), pm = smat(0x3a4a8a, { metalness: .6, roughness: .3, emissive: 0x0a0f2a });
  iss.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .02, .02), mm)); iss.add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .18, 8), mm));
  [-.22, -.13, .13, .22].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.07, .004, .24), pm); p.position.x = x; iss.add(p); });
  const blink = glowSprite(0xffffff, .35, .9); iss.add(blink); iss.add(hitSphere(.45, 'iss', 3)); iss.scale.setScalar(.8);
  issPiv.add(iss); c.pickables.push(iss);
  c.addLabel(iss, 'ISS', { offset: new V3(0, .35, 0) });
  c.update = (dt, t) => {
    earth.rotation.y += dt * .05; clouds.rotation.y += dt * .058;
    const ma = t * .15 + 1.2; moon.position.set(Math.cos(ma) * 20, 0, Math.sin(ma) * 20); moon.lookAt(moonPiv.position);
    const ia = t * .9; iss.position.set(Math.cos(ia) * 5.45, 0, Math.sin(ia) * 5.45); iss.rotation.y = -ia;
    blink.material.opacity = (t % 1) < .1 ? 1 : .25;
  };
  c.focusIn = () => new V3().setFromSphericalCoords(5, c.view.phi, c.view.theta);
  c.focusFor = () => ({ pos: new V3().setFromSphericalCoords(5, c.view.phi, c.view.theta), r: .35 });
  const upd0 = c.update; c.update = (dt, t) => { upd0(dt, t); fMat.opacity = .25 + .12 * Math.sin(t * 2); aur.children.forEach((m, i) => m.material.opacity = (i % 2 ? .3 : .7) + .2 * Math.sin(t * 3 + i)); };
};

/* ================= LEVEL: SOLAR ================= */
function sunMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: LDV(`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 p=normalize(vP)*3.0; float n=fbm3(p+vec3(0.,uTime*.06,uTime*.03)+fbm3(p*1.7-uTime*.04)); vec3 c=mix(vec3(1.,.38,.04),vec3(1.,.92,.55),smoothstep(.25,.8,n)); float mu=abs(dot(normalize(vN),normalize(vV))); c*=.55+.5*mu; gl_FragColor=vec4(c,1.); }`)
  });
}
BUILD.solar = (c) => {
  const g = c.group, r = rng(31);
  g.add(starfield(5000, 400, 1200, 17));
  g.add(new THREE.AmbientLight(0x404a66, .35));
  g.add(new THREE.PointLight(0xfff2dd, 2.0, 0, 0));
  const sunMat = sunMaterial();
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(4, 64, 48), sunMat); sunM.userData = { id: 'sun' }; g.add(sunM); c.pickables.push(sunM);
  const sg1 = glowSprite(0xffb347, 22, .85), sg2 = glowSprite(0xffe9b0, 11, 1); g.add(sg1); g.add(sg2);
  c.addLabel(sunM, 'Sun', { offset: new V3(0, 5, 0) });
  const PL = [
    { id: 'mercury', name: 'Mercury', r: .38, d: 8, P: .241, tilt: .03, tex: () => rockyTex('mercury', '#8f8b86', 0x5a5652, 0xbab4ac, 21) },
    { id: 'venus', name: 'Venus', r: .92, d: 11.2, P: .615, tilt: 3.09, tex: () => bandTex('venus', ['#e8cf96', '#d9b877', '#f0dcae', '#cfae6e'], 5) },
    { id: 'earthPlanet', name: 'Earth', r: 1, d: 14.6, P: 1, tilt: .41, tex: earthTex, moon: true },
    { id: 'mars', name: 'Mars', r: .55, d: 18.5, P: 1.881, tilt: .44, tex: () => rockyTex('mars', '#b5532e', 0x6e3020, 0xd8885a, 33, (gg, w, h) => { gg.fillStyle = 'rgba(245,245,250,.95)'; gg.fillRect(0, 0, w, 10); gg.fillRect(0, h - 8, w, 8); }) },
    { id: 'jupiter', name: 'Jupiter', r: 2.8, d: 30, P: 11.86, tilt: .05, tex: () => bandTex('jupiter', ['#d8c6a8', '#b98d63', '#efe3cc', '#a0704a', '#e6d3b3', '#c79e74'], 9, (gg, w, h) => { gg.fillStyle = '#e8c6a8'; gg.beginPath(); gg.ellipse(w * .65, h * .62, 32, 17, 0, 0, TAU); gg.fill(); gg.fillStyle = '#b5523b'; gg.beginPath(); gg.ellipse(w * .65, h * .62, 26, 13, 0, 0, TAU); gg.fill(); }) },
    { id: 'saturn', name: 'Saturn', r: 2.35, d: 41, P: 29.46, tilt: .47, rings: true, tex: () => bandTex('saturn', ['#e3d3a8', '#cdb88a', '#efe2bf', '#bfa77a'], 4) },
    { id: 'uranus', name: 'Uranus', r: 1.6, d: 50.5, P: 84, tilt: 1.71, tex: () => bandTex('uranus', ['#a6e4ea', '#9bd8e0', '#b4ecf0'], 6) },
    { id: 'neptune', name: 'Neptune', r: 1.55, d: 59, P: 164.8, tilt: .49, tex: () => bandTex('neptune', ['#3557c9', '#2b48ad', '#4a6de0', '#3050bb'], 7, (gg, w, h) => { gg.fillStyle = 'rgba(20,30,90,.85)'; gg.beginPath(); gg.ellipse(w * .4, h * .62, 18, 9, 0, 0, TAU); gg.fill(); }) },
  ];
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x7084b0, transparent: true, opacity: .32 });
  const orbitLine = (rad, tiltX = 0, ecc = 0) => { const p = []; for (let i = 0; i <= 256; i++) { const a = i / 256 * TAU; p.push(new V3(Math.cos(a) * rad + ecc, 0, Math.sin(a) * rad)); } const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(p), orbitMat); l.rotation.x = tiltX; return l; };
  const planets = [];
  let speed = 1, trueMode = false;
  const KEP = { mercury: [.206, 77, .387, 2440], venus: [.007, 131, .723, 6052], earthPlanet: [.017, 103, 1, 6371], mars: [.093, 336, 1.524, 3390], jupiter: [.049, 14, 5.203, 69911], saturn: [.057, 93, 9.537, 58232], uranus: [.046, 173, 19.19, 25362], neptune: [.010, 48, 30.07, 24622], pluto: [.249, 224, 39.48, 1188] };
  const AUK = 59 / 30.07, KM2U = AUK / 1.496e8;
  const ellipse = (e, wDeg) => { const b = Math.sqrt(1 - e * e), w = wDeg * Math.PI / 180, pts = []; for (let i = 0; i <= 256; i++) { const E = i / 256 * TAU, x = Math.cos(E) - e, z = -b * Math.sin(E); pts.push(new V3(x * Math.cos(w) - z * Math.sin(w), 0, x * Math.sin(w) + z * Math.cos(w))); } return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), orbitMat); };
  const kepPos = (out, a, e, wDeg, M) => { let E = M; for (let k = 0; k < 7; k++) E = M + e * Math.sin(E); const b = Math.sqrt(1 - e * e), x = a * (Math.cos(E) - e), z = -a * b * Math.sin(E), w = wDeg * Math.PI / 180; return out.set(x * Math.cos(w) - z * Math.sin(w), 0, x * Math.sin(w) + z * Math.cos(w)); };
  PL.forEach(p => {
    [p.e, p.w, p.au, p.km] = KEP[p.id];
    p.line = ellipse(p.e, p.w); p.line.scale.setScalar(p.d); g.add(p.line);
    const holder = new THREE.Group(); holder.userData = { id: p.id, r: p.r }; g.add(holder);
    const tilt = new THREE.Group(); tilt.rotation.z = p.tilt; holder.add(tilt);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 48, 32), smat(0xffffff, { map: p.tex(), roughness: .9 })); tilt.add(mesh);
    if (p.rings) {
      const ri = p.r * 1.25, ro = p.r * 2.3, rg = new THREE.RingGeometry(ri, ro, 128, 1);
      const pos = rg.attributes.position, uv = rg.attributes.uv, v = new V3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - ri) / (ro - ri), .5); }
      const rt = canvasTex('srings', 512, 4, (gg, w, h) => { for (let x = 0; x < w; x++) { const t = x / w; let a = t < .16 ? .22 : t < .5 ? .85 : t < .56 ? .05 : t < .86 ? .62 : .25 * (1 - (t - .86) / .14); if (Math.abs(t - .78) < .008) a = .15; const b = 200 + Math.sin(x * .9) * 20; gg.fillStyle = `rgba(${b},${b * .9 | 0},${b * .72 | 0},${a})`; gg.fillRect(x, 0, 1, h); } });
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; tilt.add(ring);
    }
    let moonM = null;
    if (p.moon) { moonM = new THREE.Mesh(new THREE.SphereGeometry(.27, 24, 16), smat(0xffffff, { map: moonTex(), roughness: 1 })); holder.add(moonM); }
    holder.add(hitSphere(Math.max(p.r * 1.3, 1.1), p.id, 2));
    const dot = glowSprite(0xffffff, .9, .9); dot.visible = false; holder.add(dot);
    c.pickables.push(holder);
    c.addLabel(holder, p.name, { offset: new V3(0, p.r + .7, 0) });
    planets.push(Object.assign(p, { holder, tilt, mesh, moonM, dot, M: r() * TAU }));
  });
  planets[2].M = .9;
  // belts
  const ap = [], ac = [], as = [];
  for (let i = 0; i < 3500; i++) { const a = r() * TAU, d = 22.5 + r() * 3.6; ap.push(Math.cos(a) * d, gauss(r) * .35, Math.sin(a) * d); const b = .45 + r() * .4; ac.push(b * .85, b * .78, b * .68); as.push(.12 + r() * .14); }
  const belt = makePoints(ap, ac, as); g.add(belt);
  const beltHit = new THREE.Mesh(new THREE.RingGeometry(22.3, 26.3, 64), hitMat()); beltHit.rotation.x = -Math.PI / 2; beltHit.userData = { id: 'asteroids', priority: .3 }; g.add(beltHit); c.pickables.push(beltHit);
  const kp = [], kc = [], ks = [];
  for (let i = 0; i < 4500; i++) { const a = r() * TAU, d = 64 + r() * 18; kp.push(Math.cos(a) * d, gauss(r) * 1.6, Math.sin(a) * d); const b = .35 + r() * .35; kc.push(b * .75, b * .85, b); ks.push(.18 + r() * .16); }
  const kuiper = makePoints(kp, kc, ks, { opacity: .7 }); g.add(kuiper);
  const kHit = new THREE.Mesh(new THREE.RingGeometry(63, 83, 64), hitMat()); kHit.rotation.x = -Math.PI / 2; kHit.userData = { id: 'kuiper', priority: .2 }; g.add(kHit); c.pickables.push(kHit);
  // pluto
  const plutoPiv = new THREE.Group(); plutoPiv.rotation.x = .3; g.add(plutoPiv); const plutoLine = ellipse(.249, 224); plutoLine.scale.setScalar(68); plutoPiv.add(plutoLine);
  const pluto = new THREE.Group(); pluto.userData = { id: 'pluto', r: .22 }; plutoPiv.add(pluto);
  pluto.add(new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), smat(0xc9b39a, { roughness: 1 }))); pluto.add(hitSphere(1, 'pluto', 2)); c.pickables.push(pluto);
  c.addLabel(pluto, 'Pluto', { offset: new V3(0, .7, 0) });
  let plutoA = 2; const _kp = new V3();
  function setTrue(on) {
    trueMode = on;
    planets.forEach(p => { const a = on ? p.au * AUK : p.d; p.line.scale.setScalar(a); p.tilt.scale.setScalar(on ? p.km * KM2U / p.r : 1); p.dot.visible = on; if (p.moonM) p.moonM.visible = !on; p.holder.userData.r = on ? p.km * KM2U : p.r; });
    sunM.scale.setScalar(on ? 696000 * KM2U / 4 : 1); sg1.scale.setScalar(on ? 2.4 : 22); sg2.scale.setScalar(on ? 1 : 11);
    const bs = on ? 2.7 * AUK / 24.3 : 1, ks = on ? 42 * AUK / 73 : 1; belt.scale.setScalar(bs); beltHit.scale.setScalar(bs); kuiper.scale.setScalar(ks); kHit.scale.setScalar(ks);
    plutoLine.scale.setScalar(on ? 39.48 * AUK : 68);
  }
  const YEAR = 22;
  c.follow = null;
  c.update = (dt, t) => {
    sunMat.uniforms.uTime.value = t; sunM.rotation.y += dt * .03;
    const yd = dt / YEAR * speed;
    planets.forEach(p => {
      p.M += yd / p.P * TAU; kepPos(p.holder.position, trueMode ? p.au * AUK : p.d, p.e, p.w, p.M);
      p.mesh.rotation.y += dt * (p.id === 'venus' ? -.05 : .4) * (speed ? 1 : 0);
      if (p.moonM) { const ma = t * 2 * speed; p.moonM.position.set(Math.cos(ma) * 2, 0, Math.sin(ma) * 2); }
    });
    belt.rotation.y += yd / 4.6 * TAU; kuiper.rotation.y += yd / 250 * TAU;
    plutoA += yd / 248 * TAU; kepPos(pluto.position, trueMode ? 39.48 * AUK : 68, .249, 224, plutoA);
    if (c.follow) c.follow.getWorldPosition(c.view.g.target);
  };
  const earthH = planets[2].holder;
  c.minDist = () => c.follow ? Math.max(c.follow.userData.r * 3.2, 2.2) : 22;
  c.maxDist = () => 165;
  c.canZoomIn = () => !c.follow || c.follow === earthH;
  c.noInMsg = () => c.follow ? `Only Earth has a closer view in this explorer — click Earth to land.` : '';
  c.focusIn = () => earthH.getWorldPosition(new V3());
  c.focusFor = () => ({ pos: earthH.getWorldPosition(new V3()), r: trueMode ? .05 : 1 });
  c.zoomInTarget = () => ({ key: 'earth' });
  c.onPick = (id, obj) => {
    if (obj.userData.r !== undefined && obj !== c.follow) { c.follow = obj; c.view.g.dist = Math.max(obj.userData.r * 9, 7); }
    else if (id === 'sun') { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = 45; }
  };
  c.onEmptyClick = () => { if (c.follow) { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = Math.max(c.view.g.dist, 70); } };
  seg([['0', '⏸'], ['1', '1×'], ['6', '6×'], ['30', '30×']], '1', k => speed = +k);
  actBtn('☉ Whole system', () => { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = 80; closeInfo(); });
  seg([['sq', 'Squeezed view'], ['true', 'True scale']], 'sq', k => { setTrue(k === 'true'); if (k === 'true') { c.follow = null; c.view.g.target.set(0, 0, 0); c.view.g.dist = 120; showInfo('truescale'); } });
  actBtn('📐 Kepler\'s laws', () => showInfo('kepler'));
};

/* ================= LEVEL: GALAXY ================= */
BUILD.galaxy = (c) => {
  const g = c.group, r = rng(101);
  const gal = new THREE.Group(); g.add(gal);
  const P = [], C = [], S = [];
  const push3 = (x, y, z, cr, cg, cb, s) => { P.push(x, y, z); C.push(cr, cg, cb); S.push(s); };
  const rb = 6, pitch = .23, armOff = [0, Math.PI, Math.PI / 2, Math.PI * 1.5], armW = [.34, .34, .16, .16];
  const G = [], GC = [], GS = [];
  for (let i = 0; i < 52000; i++) {
    const u = r(); const k = u < armW[0] ? 0 : u < armW[0] + armW[1] ? 1 : u < .84 ? 2 : 3;
    const rr = Math.min(56, rb + (-Math.log(1 - r() * .97)) * 12.5);
    const th = armOff[k] + Math.log(rr / rb) / pitch;
    const sp = .45 + rr * .035 + (k > 1 ? .35 : 0);
    const x = rr * Math.cos(th) + gauss(r) * sp, z = rr * Math.sin(th) + gauss(r) * sp, y = gauss(r) * (.25 + .3 * Math.exp(-rr / 12));
    const t = r();
    if (t < .012) { push3(x, y, z, .95, .45, .7, 1.4 + r() * 1.2); continue; }
    const col = t < .7 ? [.7, .82, 1] : t < .9 ? [1, 1, 1] : [1, .88, .7];
    const b = .5 + r() * .5;
    push3(x, y, z, col[0] * b, col[1] * b, col[2] * b, .6 + r() * .8);
    if (i % 9 === 0) { G.push(x, y, z); GC.push(.05, .07, .12); GS.push(7 + r() * 7); }
  }
  gal.add(makePoints(G, GC, GS));
  const barA = .45;
  for (let i = 0; i < 15000; i++) {
    const bx = gauss(r) * (i < 10000 ? 5.5 : 2.6), bz = gauss(r) * (i < 10000 ? 1.6 : 2.6), by = gauss(r) * (i < 10000 ? 1.1 : 2);
    const x = bx * Math.cos(barA) - bz * Math.sin(barA), z = bx * Math.sin(barA) + bz * Math.cos(barA);
    const b = .55 + r() * .45; push3(x, by, z, b, b * .85, b * .6, .6 + r() * .7);
  }
  for (let i = 0; i < 7000; i++) { const rr = Math.min(60, -Math.log(1 - r() * .99) * 14), th = r() * TAU, b = .15 + r() * .2; push3(rr * Math.cos(th), gauss(r) * .45, rr * Math.sin(th), b * .95, b * .9, b * .85, .4 + r() * .3); }
  const globs = [];
  for (let k = 0; k < 36; k++) {
    const v = new V3(gauss(r), gauss(r) * .8, gauss(r)).normalize().multiplyScalar(18 + r() * 42); globs.push(v);
    for (let i = 0; i < 60; i++) push3(v.x + gauss(r) * .55, v.y + gauss(r) * .55, v.z + gauss(r) * .55, 1, .88, .7, .4 + r() * .3);
  }
  gal.add(makePoints(P, C, S));
  const cg1 = glowSprite(0xffd9a0, 34, .7), cg2 = glowSprite(0xfff3dc, 12, 1); gal.add(cg1); gal.add(cg2);
  // satellites
  const mkCloud = (center, n, s, seed) => { const rr = rng(seed), p = [], cc = [], ss = []; for (let i = 0; i < n; i++) { p.push(center.x + gauss(rr) * s * (1 + rr()), center.y + gauss(rr) * s * .6, center.z + gauss(rr) * s); const b = .4 + rr() * .5; cc.push(b * .75, b * .85, b); ss.push(.5 + rr() * .5); } return makePoints(p, cc, ss); };
  const lmcP = new V3(-58, -26, 52), smcP = new V3(-44, -36, 68);
  g.add(mkCloud(lmcP, 1600, 3, 5)); g.add(mkCloud(smcP, 900, 2, 6));
  const lmc = hitSphere(6, 'lmc', 2); lmc.position.copy(lmcP); g.add(lmc); c.pickables.push(lmc); c.addLabel(lmc, 'Large Magellanic Cloud', { offset: new V3(0, 6, 0) });
  const smc = hitSphere(4.5, 'smc', 2); smc.position.copy(smcP); g.add(smc); c.pickables.push(smc); c.addLabel(smc, 'Small Magellanic Cloud', { offset: new V3(0, 4.5, 0) });
  // markers
  const sunR = 26, sunTh = Math.log(sunR / rb) / pitch + Math.PI / 4;
  const sunMark = new THREE.Group(); sunMark.position.set(sunR * Math.cos(sunTh), .3, sunR * Math.sin(sunTh)); sunMark.userData = { id: 'sunMarker', priority: 3 };
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex(), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); ring.scale.set(4, 4, 1); ring.renderOrder = 5; sunMark.add(ring);
  sunMark.add(hitSphere(2.6, 'sunMarker', 3)); gal.add(sunMark); c.pickables.push(sunMark);
  c.addLabel(sunMark, '☉ You are here', { offset: new V3(0, 2.6, 0), cls: 'you', always: true });
  const sgr = hitSphere(3, 'sgrA', 2.5); gal.add(sgr); c.pickables.push(sgr); c.addLabel(sgr, 'Sagittarius A* (black hole)', { offset: new V3(0, 2.5, 0) });
  const bulge = hitSphere(8, 'bulge', .6); bulge.scale.y = .5; gal.add(bulge); c.pickables.push(bulge);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(56, 56, 2.5, 48), hitMat()); disk.userData = { id: 'spiralArm', priority: .2 }; gal.add(disk); c.pickables.push(disk);
  globs.slice(0, 8).forEach((v, i) => { const h = hitSphere(2.2, 'globular', 1.2); h.position.copy(v); gal.add(h); c.pickables.push(h); if (i === 0) c.addLabel(h, 'Globular cluster', { offset: new V3(0, 2, 0) }); });
  g.add(starfield(2500, 700, 1500, 41, .6));
  const _gv = new V3();
  c.update = (dt) => { gal.rotation.y -= dt * .012; ring.material.rotation += dt * .5; ring.material.opacity = smooth(6, 30, c.camera.position.distanceTo(sunMark.getWorldPosition(_gv))); };
  c.focusIn = () => sunMark.getWorldPosition(new V3());
  c.focusFor = k => k === 'blackhole' ? { pos: sgr.getWorldPosition(new V3()), r: 1.6 } : { pos: sunMark.getWorldPosition(new V3()), r: 1.2 };
  // dark matter halo + rotation curve
  const halo = new THREE.Group(); halo.visible = false; g.add(halo);
  const hr = rng(77), hP = [], hC = [], hS = [];
  for (let i = 0; i < 5000; i++) { const v = new V3(gauss(hr), gauss(hr), gauss(hr)).multiplyScalar(38); hP.push(v.x, v.y, v.z); hC.push(.3, .12, .55); hS.push(3 + hr() * 4); }
  halo.add(makePoints(hP, hC, hS, { opacity: .18 })); halo.add(glowSprite(0x7a3cff, 260, .22));
  const hHit = hitSphere(95, 'darkhalo', -.5); halo.add(hHit); c.pickables.push(hHit);
  const hA = new THREE.Object3D(); hA.position.set(0, 62, 0); halo.add(hA); c.addLabel(hA, 'Dark matter halo (invisible in reality)', { pick: hHit });
  const curve = document.createElement('div'); curve.className = 'specw'; curve.style.display = 'none';
  curve.innerHTML = '<svg width="210" height="74" viewBox="0 0 210 74"><line x1="18" y1="64" x2="205" y2="64" stroke="#56607a"/><line x1="18" y1="4" x2="18" y2="64" stroke="#56607a"/><path d="M18 64 C28 10 40 12 70 30 S150 52 205 57" fill="none" stroke="#ffd166" stroke-width="2" stroke-dasharray="4 3"/><path d="M18 64 C28 12 40 16 70 18 S150 17 205 16" fill="none" stroke="#b388ff" stroke-width="2.5"/><text x="22" y="72" fill="#98a2b8" font-size="8">distance from center →</text><text x="120" y="12" fill="#b388ff" font-size="8">observed</text><text x="128" y="50" fill="#ffd166" font-size="8">stars + gas only</text><text x="2" y="10" fill="#98a2b8" font-size="8">v</text></svg><span>Orbital speed vs. distance</span>';
  uiEl(curve);
  seg([['vis', 'Visible galaxy'], ['dm', 'Dark matter halo']], 'vis', k => { const on = k === 'dm'; halo.visible = on; curve.style.display = on ? '' : 'none'; if (on) showInfo('darkhalo'); });
};

/* ================= LEVEL: BLACK HOLE ================= */
BUILD.blackhole = (c) => {
  const g = c.group, r = rng(66);
  g.add(starfield(6000, 300, 900, 23));
  const sys = new THREE.Group(); sys.rotation.z = .18; sys.rotation.x = .05; g.add(sys);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 48), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.userData = { id: 'horizon', priority: 2 }; sys.add(hole); c.pickables.push(hole);
  const diskMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector2() }, uIn: { value: 2.6 }, uOut: { value: 11 } },
    vertexShader: LDV(`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform vec2 uCam; uniform float uIn; uniform float uOut; varying vec2 vP;
      void main(){ float rr=length(vP); float a=atan(vP.y,vP.x); float t=(rr-uIn)/(uOut-uIn);
        float sw=a+uTime*1.8/pow(rr/uIn,1.5);
        float n=fbm3(vec3(cos(sw)*1.4,sin(sw)*1.4,rr*1.6)); float n2=noise3(vec3(cos(sw)*5.,sin(sw)*5.,rr*6.));
        vec3 hot=vec3(1.,.96,.88), mid=vec3(1.,.62,.22), cool=vec3(.75,.18,.05);
        vec3 col=mix(hot,mid,smoothstep(0.,.3,t)); col=mix(col,cool,smoothstep(.3,1.,t));
        float br=(.35+1.1*n+.25*n2)*(1.-smoothstep(.6,1.,t))*smoothstep(0.,.05,t)*(1.6-t);
        vec2 v=vec2(-sin(a),cos(a)); float dop=1.+.75*dot(v,uCam);
        br*=dop; gl_FragColor=vec4(col*br,clamp(br,0.,1.)); }`),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const disk = new THREE.Mesh(new THREE.RingGeometry(2.6, 11, 256, 8), diskMat); disk.rotation.x = -Math.PI / 2; disk.userData = { id: 'disk', priority: 1 }; sys.add(disk); c.pickables.push(disk);
  const haloMatl = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDop: { value: 0 } },
    vertexShader: LDV(`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`),
    fragmentShader: LDF(NOISE_GLSL + `uniform float uTime; uniform float uDop; varying vec2 vP;
      void main(){ float rr=length(vP); float a=atan(vP.y,vP.x);
        float ring=exp(-pow((rr-2.3)/.05,2.))*.9+exp(-pow((rr-2.38)/.18,2.))*.35;
        float n=fbm3(vec3(cos(a+uTime*.6)*2.,sin(a+uTime*.6)*2.,rr*2.));
        float lens=exp(-pow((rr-2.95)/.6,2.))*(.45+1.2*n)*(.5+.5*abs(sin(a)));
        float dop=1.+.6*uDop*(vP.x/max(rr,.001));
        vec3 col=vec3(1.,.66,.32)*lens*dop+vec3(1.,.86,.62)*ring*dop;
        float al=clamp(lens+ring,0.,1.); gl_FragColor=vec4(col,al); }`),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const halo = new THREE.Mesh(new THREE.RingGeometry(2.05, 4.6, 256, 4), haloMatl); halo.userData = { id: 'photonRing', priority: 1.5 }; g.add(halo); c.pickables.push(halo);
  c.addLabel(hole, 'Event horizon', { offset: new V3(0, -3.2, 0) });
  // S2 + cluster
  const orbits = [];
  const mkOrbit = (a, e, P, rx, rz, id, color, size, ph) => {
    const piv = new THREE.Group(); piv.rotation.set(rx, 0, rz); g.add(piv);
    const b = a * Math.sqrt(1 - e * e), pts = []; for (let i = 0; i <= 200; i++) { const E = i / 200 * TAU; pts.push(new V3(a * (Math.cos(E) - e), 0, b * Math.sin(E))); }
    piv.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: id === 's2' ? .35 : .15 })));
    const star = new THREE.Group(); star.userData = { id, priority: 3 }; star.add(glowSprite(color, size, 1)); star.add(new THREE.Mesh(new THREE.SphereGeometry(size * .08, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }))); star.add(hitSphere(Math.max(1, size * .4), id, 3));
    piv.add(star); c.pickables.push(star); orbits.push({ star, a, e, b, P, ph }); return star;
  };
  const s2 = mkOrbit(24, .6, 26, .55, .25, 's2', 0xbfd8ff, 3, 0);
  c.addLabel(s2, 'Star S2', { offset: new V3(0, 1.4, 0) });
  for (let i = 0; i < 6; i++) mkOrbit(16 + r() * 22, .2 + r() * .6, 18 + r() * 20, r() * 3, r() * 3, 'scluster', [0xffe0b0, 0xbfd8ff, 0xffffff][i % 3], 1.6 + r(), r() * TAU);
  // jets
  const JN = 1400, jp = new Float32Array(JN * 3), jc = [], js = [], jv = [];
  for (let i = 0; i < JN; i++) { jc.push(.6, .55, 1); js.push(.5 + r() * .7); jv.push({ y: r() * 40, s: r() < .5 ? 1 : -1, a: r() * TAU, w: r() }); }
  const jg = new THREE.BufferGeometry(); jg.setAttribute('position', new THREE.BufferAttribute(jp, 3)); jg.setAttribute('aColor', new THREE.Float32BufferAttribute(jc, 3)); jg.setAttribute('aSize', new THREE.Float32BufferAttribute(js, 1));
  const jets = new THREE.Points(jg, pointsMaterial({ opacity: .8 })); jets.frustumCulled = false; jets.visible = false; sys.add(jets);
  // probe
  let probe = null;
  function dropProbe() {
    if (probe) return;
    const p = new THREE.Group(); p.userData = { id: 'probe', priority: 4 };
    const pm = new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .5, 12), pm); body.rotation.x = Math.PI / 2; p.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.14, .25, 12), pm); nose.rotation.x = Math.PI / 2; nose.position.z = .37; p.add(nose);
    const gl = glowSprite(0x9ff3ff, 1.6, .9); p.add(gl); p.add(hitSphere(.8, 'probe', 4));
    sys.add(p); c.pickables.push(p);
    probe = { obj: p, mats: [pm], gl, t: 0, r: 22, a: Math.PI * .15, done: false };
    toast('🚀 Probe away! Watch what happens as it nears the horizon…', 'm');
  }
  const camLocal = new V3(), tmpM = new THREE.Matrix4(), _w = new V3();
  c.update = (dt, t) => {
    diskMat.uniforms.uTime.value = t; haloMatl.uniforms.uTime.value = t;
    tmpM.copy(disk.matrixWorld).invert(); camLocal.copy(c.camera.position).applyMatrix4(tmpM);
    const cl = camLocal.length() || 1; diskMat.uniforms.uCam.value.set(camLocal.x / cl, camLocal.y / cl);
    const v2 = new THREE.Vector2(camLocal.x, camLocal.y); if (v2.length() > 1e-4) { v2.normalize(); _w.set(v2.y, -v2.x, 0).applyMatrix4(disk.matrixWorld).sub(_w.clone().set(0, 0, 0).applyMatrix4(disk.matrixWorld)).applyMatrix4(c.camera.matrixWorldInverse.clone().setPosition(0, 0, 0)); haloMatl.uniforms.uDop.value = clamp(_w.x / (_w.length() || 1), -1, 1) * Math.min(1, v2.length()); }
    halo.quaternion.copy(c.camera.quaternion);
    orbits.forEach(o => { const M = (t / o.P) * TAU + o.ph; let E = M; for (let k = 0; k < 6; k++) E = M + o.e * Math.sin(E); o.star.position.set(o.a * (Math.cos(E) - o.e), 0, o.b * Math.sin(E)); });
    if (jets.visible) { for (let i = 0; i < JN; i++) { const q = jv[i]; q.y += dt * (14 + q.w * 10); if (q.y > 45) q.y = 2.2; const rad = .15 + q.y * .045 * q.w; jp[i * 3] = Math.cos(q.a + q.y * .2) * rad; jp[i * 3 + 1] = q.s * q.y; jp[i * 3 + 2] = Math.sin(q.a + q.y * .2) * rad; } jg.attributes.position.needsUpdate = true; }
    if (probe) {
      const p = probe; p.t += dt;
      p.r = 2.06 + (22 - 2.06) * Math.exp(-p.t * .38);
      p.a += dt * 2.2 / Math.pow(p.r / 4, 1.5) * clamp((p.r - 2.06) / 1.2, 0, 1);
      const y = 1.2 * clamp((p.r - 2.06) / 18, 0, 1);
      p.obj.position.set(Math.cos(p.a) * p.r, y, Math.sin(p.a) * p.r);
      p.obj.lookAt(_w.set(0, 0, 0).applyMatrix4(sys.matrixWorld));
      const s = clamp((9 - p.r) / 6.5, 0, 1);
      p.obj.scale.set(1 - .75 * s, 1 - .75 * s, 1 + 6 * s);
      const fade = clamp((p.r - 2.06) / 1.6, 0, 1);
      p.mats.forEach(m => { m.color.setRGB(lerp(1, .62, 1 - s), lerp(.25, .95, 1 - s), lerp(.1, 1, 1 - s)); m.opacity = fade; });
      p.gl.material.color.copy(p.mats[0].color); p.gl.material.opacity = .9 * fade;
      if (p.t > 4 && !p.done) { p.done = true; fire('probe'); showInfo('probe'); }
      if (p.t > 13) { sys.remove(p.obj); c.pickables.splice(c.pickables.indexOf(p.obj), 1); probe = null; }
    }
  };
  c.canZoomIn = () => false;
  const radii = new THREE.Group(); radii.visible = false; radii.userData = { id: 'radii', priority: 2.5 }; sys.add(radii); c.pickables.push(radii);
  [[2, 0xffffff, 'Event horizon · rₛ'], [3, 0xffd166, 'Photon sphere · 1.5 rₛ'], [6, 0x6ee7ff, 'ISCO (no spin) · 3 rₛ']].forEach(([rad, col, t], i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(rad - .035, rad + .035, 160), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: .9, depthTest: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 6; radii.add(m);
    const a = new THREE.Object3D(); a.position.set(rad * Math.cos(.9 + i * .5), 0, rad * Math.sin(.9 + i * .5)); radii.add(a); c.addLabel(a, t, { pick: radii });
  });
  actBtn('◎ Key radii', () => { radii.visible = !radii.visible; if (radii.visible) showInfo('radii'); });
  actBtn('🚀 Drop a probe', dropProbe);
  seg([['off', 'No jets'], ['on', 'Show jets (like M87*)']], 'off', k => { jets.visible = k === 'on'; if (jets.visible) showInfo('jets'); });
};

/* ================= LEVEL: UNIVERSE ================= */
function galaxySpriteTex(kind) {
  return canvasTex('gal_' + kind, 256, 256, (g, w, h) => {
    const r = rng(kind.length * 17 + 3), cx = w / 2, cy = h / 2;
    if (kind === 'spiral' || kind === 'andromeda') {
      for (let i = 0; i < 5000; i++) { const arm = i % 2, t = Math.pow(r(), .7), rr = 8 + t * 100, th = arm * Math.PI + Math.log(rr / 8) / .32 + gauss(r) * .3; const x = cx + Math.cos(th) * rr + gauss(r) * 3, y = cy + Math.sin(th) * rr + gauss(r) * 3; const b = 160 + r() * 95; g.fillStyle = `rgba(${b * .8 | 0},${b * .88 | 0},${b},${.35 * (1 - t * .6)})`; g.fillRect(x, y, 1.6, 1.6); }
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 40); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(.4, 'rgba(255,215,160,.5)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    } else if (kind === 'elliptical') {
      g.translate(cx, cy); g.scale(1, .65); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 120); gr.addColorStop(0, 'rgba(255,235,200,1)'); gr.addColorStop(.25, 'rgba(255,205,150,.55)'); gr.addColorStop(1, 'rgba(255,180,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.fill();
    } else {
      for (let k = 0; k < 9; k++) { const x = cx + gauss(r) * 30, y = cy + gauss(r) * 22, rad = 12 + r() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, rad); const pink = r() < .3; gr.addColorStop(0, pink ? 'rgba(255,150,200,.8)' : 'rgba(170,200,255,.8)'); gr.addColorStop(1, 'rgba(150,180,255,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    }
  });
}
function cmbTex() {
  return canvasTex('cmb', 1024, 512, (g, w, h) => {
    g.fillStyle = '#1a4a8a'; g.fillRect(0, 0, w, h); const r = rng(1965);
    for (let i = 0; i < 7000; i++) { const x = r() * w, y = r() * h, rad = 3 + r() * 16, t = r(); const col = t < .33 ? '255,160,60' : t < .55 ? '255,220,120' : t < .8 ? '40,100,200' : '10,40,120'; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${col},.5)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  });
}
BUILD.universe = (c) => {
  const g = c.group, r = rng(2024);
  const nodes = [new V3(0, 0, 0)];
  for (let i = 0; i < 74; i++) nodes.push(new V3(gauss(r), gauss(r), gauss(r)).normalize().multiplyScalar(Math.cbrt(r()) * 165));
  const edges = new Set(), E = [];
  nodes.forEach((a, i) => { nodes.map((b, j) => [j, a.distanceTo(b)]).filter(x => x[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(([j, d]) => { const k = i < j ? i + '_' + j : j + '_' + i; if (!edges.has(k) && d < 95) { edges.add(k); E.push([i, j]); } }); });
  const P = [], C = [], S = [], DP = [], DC = [], DS = [];
  const gc = () => { const t = r(); return t < .45 ? [1, .92, .78] : t < .8 ? [.75, .85, 1] : [1, .78, .62]; };
  const nodeW = nodes.map(() => .4 + r() * 1.2);
  nodes.forEach((n, i) => {
    const cnt = Math.floor(220 * nodeW[i]);
    for (let k = 0; k < cnt; k++) { const s = k < cnt * .3 ? 1.4 : 4; const col = gc(), b = .6 + r() * .4; P.push(n.x + gauss(r) * s, n.y + gauss(r) * s, n.z + gauss(r) * s); C.push(col[0] * b, col[1] * b, col[2] * b); S.push(1.3 + r() * 1.5); }
    for (let k = 0; k < 40; k++) { DP.push(n.x + gauss(r) * 7, n.y + gauss(r) * 7, n.z + gauss(r) * 7); DC.push(.42, .18, .75); DS.push(14 + r() * 10); }
  });
  E.forEach(([i, j]) => {
    const a = nodes[i], b = nodes[j], L = a.distanceTo(b), cnt = Math.floor(L * 3.2);
    for (let k = 0; k < cnt; k++) { const t = r(); const p = new V3().lerpVectors(a, b, t); const w = 1.6 + Math.sin(t * Math.PI) * 1.4; const col = gc(), br = .35 + r() * .5; P.push(p.x + gauss(r) * w, p.y + gauss(r) * w, p.z + gauss(r) * w); C.push(col[0] * br, col[1] * br, col[2] * br); S.push(1.1 + r() * 1.2); }
    for (let k = 0; k < L / 4; k++) { const p = new V3().lerpVectors(a, b, r()); DP.push(p.x + gauss(r) * 4, p.y + gauss(r) * 4, p.z + gauss(r) * 4); DC.push(.35, .15, .65); DS.push(12 + r() * 8); }
  });
  for (let i = 0; i < 2500; i++) { P.push((r() - .5) * 360, (r() - .5) * 360, (r() - .5) * 360); C.push(.35, .38, .45); S.push(.6); }
  const web = makePoints(P, C, S); g.add(web);
  const dm = makePoints(DP, DC, DS, { opacity: .07 }); dm.visible = false; g.add(dm);
  const dmGlows = new THREE.Group(); dmGlows.visible = false; g.add(dmGlows);
  nodes.forEach((n, i) => { const s = glowSprite(0x7a3cff, 26 * nodeW[i], .25); s.position.copy(n); dmGlows.add(s); });
  // hits: clusters & filaments
  const big = nodes.map((n, i) => [i, nodeW[i]]).sort((a, b) => b[1] - a[1]).slice(0, 12);
  big.forEach(([i], k) => { if (i === 0) return; const h = hitSphere(7, 'cluster', 1); h.position.copy(nodes[i]); g.add(h); c.pickables.push(h); if (k === 1) c.addLabel(h, 'Galaxy cluster', { offset: new V3(0, 7, 0) }); });
  E.forEach(([i, j], k) => { const h = cylBetween(nodes[i], nodes[j], 3.2, hitMat(), 6); h.userData = { id: 'filament', priority: .5 }; g.add(h); c.pickables.push(h); if (k === 5) c.addLabel(h, 'Filament', { offset: new V3(0, 3, 0) }); });
  // galaxy sprites
  const mkGal = (kind, id, pos, sc, lbl, prio = 2) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: galaxySpriteTex(kind), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, rotation: r() * TAU }));
    s.scale.set(sc * 1.6, (kind === 'andromeda' ? sc * .42 : sc) * 1.6, 1); s.position.copy(pos);
    const grp = new THREE.Group(); grp.userData = { id, priority: prio }; grp.add(s); grp.add(hitSphere(sc * .4, id, prio)); g.add(grp); c.pickables.push(grp);
    if (lbl) c.addLabel(grp, lbl, { offset: new V3(0, sc * .45, 0), cls: id === 'milkyway' ? 'you' : '', always: id === 'milkyway', maxCam: id === 'andromeda' ? 110 : Infinity });
    return grp;
  };
  mkGal('spiral', 'milkyway', new V3(0, 0, 0), 6, 'Milky Way (you are here)', 3);
  mkGal('andromeda', 'andromeda', new V3(6.5, 2.5, -3), 6.5, 'Andromeda', 3);
  const kinds = [['spiral', 'galSpiral'], ['elliptical', 'galElliptical'], ['irregular', 'galIrregular']];
  const far = nodes.filter(n => n.length() > 45);
  for (let k = 0; k < 12; k++) { const [kind, id] = kinds[k % 3]; const n = far[(k * 5 + 2) % far.length]; const pos = n.clone().add(new V3(gauss(r), gauss(r), gauss(r)).multiplyScalar(4)); mkGal(kind, id, pos, 7 + r() * 4, null); }
  // CMB shell
  const cmb = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 32), new THREE.MeshBasicMaterial({ map: cmbTex(), side: THREE.BackSide, transparent: true, opacity: .55, depthWrite: false }));
  cmb.userData = { id: 'cmb', priority: -1 }; cmb.visible = false; g.add(cmb); c.pickables.push(cmb);
  // cosmic expansion: points scale in the shader, galaxies keep their size
  const expObjs = []; g.children.forEach(o => { if (o.userData && (o.userData.id === 'milkyway' || o.userData.id === 'andromeda' || /^gal|cluster|filament/.test(o.userData.id || ''))) expObjs.push([o, o.position.clone()]); });
  let expT = -1;
  const setExp = a => { web.material.uniforms.uExpand.value = a; dm.material.uniforms.uExpand.value = a; dmGlows.children.forEach((s, i) => s.position.copy(nodes[i]).multiplyScalar(a)); expObjs.forEach(([o, p]) => o.position.copy(p).multiplyScalar(a)); };
  c.update = (dt) => {
    g.rotation.y += dt * .01;
    if (expT >= 0) { expT += dt; const a = expT < 6 ? 1 + .8 * ease(expT / 6) : expT < 7.5 ? 1.8 : 1.8 - .8 * ease(clamp((expT - 7.5) / .8, 0, 1)); setExp(a); if (expT < 7.5) message(`Space is stretching — every distance is now ${a.toFixed(2)}× larger. Farther galaxies recede faster.`); if (expT > 8.3) { expT = -1; setExp(1); } }
  };
  actBtn('⤢ Expand the universe', () => { expT = 0; showInfo('expansion'); });
  c.focusIn = () => new V3();
  c.focusFor = () => ({ pos: new V3(), r: 2.5 });
  seg([['off', 'Visible matter'], ['dm', 'Show dark matter']], 'off', k => { const on = k === 'dm'; dm.visible = on; dmGlows.visible = on; if (on) showInfo('darkmatter'); });
  let cmbOn = false;
  const cb = actBtn('🌌 Show the oldest light', () => { cmbOn = !cmbOn; cmb.visible = cmbOn; cb.innerHTML = cmbOn ? '🌌 Hide the oldest light' : '🌌 Show the oldest light'; if (cmbOn) showInfo('cmb'); });
};
