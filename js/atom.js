'use strict';
/* Atoms: the periodic table, the historical models and the quantum picture.

   Part 1 (this block, no browser or three.js needed): the mathematics of hydrogen-like orbitals, the samplers that turn
   |psi|^2 into dots, the probability current (the "flow") and time-dependent superpositions. It is run by
   tools/atom/test_orbitals.mjs, which proves it numerically.
   Part 2: AtomCloud, the dot-cloud renderer (three.js points, sphere-shaded sprites, flow in the vertex shader).
   Part 3: the frame type that shows it in the world.

   Units: atomic units unless a name says otherwise (lengths in Bohr radii a0, energies in hartree, time in 2.4189e-17 s). */
var AQ = (function () {
  const A0_PM = 52.9177210903;          // Bohr radius in pm (CODATA 2018)
  const AU_TIME_S = 2.4188843265857e-17; // atomic unit of time in seconds (CODATA 2018)
  const HARTREE_HZ = 6.579683920502e15;  // hartree / h, in Hz (CODATA 2018)
  const ME_OVER_MP = 1 / 1836.15267343;  // electron-to-proton mass ratio (CODATA 2018)
  const LTR = 'spdfghik';
  const FACT = [1]; for (let i = 1; i < 40; i++) FACT[i] = FACT[i - 1] * i;
  const binom = (a, b) => (b < 0 || b > a) ? 0 : FACT[a] / (FACT[b] * FACT[a - b]);

  /* ---- associated Laguerre L^alpha_k(x) = sum_i (-1)^i C(k+alpha, k-i) x^i / i!  (coefficients, lowest power first) ---- */
  function laguerreCoef(k, alpha) {
    const c = [];
    for (let i = 0; i <= k; i++) c.push((i % 2 ? -1 : 1) * binom(k + alpha, k - i) / FACT[i]);
    return c;
  }
  const polyVal = (c, x) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; };
  const polyDer = c => c.length < 2 ? [0] : c.slice(1).map((v, i) => v * (i + 1));

  /* ---- radial function R_nl(r) for nuclear charge Z, r in bohr ---- */
  const radCache = {};
  function radialSet(n, l) {
    const key = n * 10 + l; if (radCache[key]) return radCache[key];
    const k = n - l - 1, c = laguerreCoef(k, 2 * l + 1);
    return radCache[key] = { c, d: polyDer(c), k, pref: Math.sqrt(FACT[n - l - 1] / (2 * n * FACT[n + l])) };
  }
  function radial(n, l, Z, r) {
    const S = radialSet(n, l), rho = 2 * Z * r / n;
    return Math.sqrt(Math.pow(2 * Z / n, 3)) * S.pref * Math.exp(-rho / 2) * Math.pow(rho, l) * polyVal(S.c, rho);
  }
  /* dR/dr (analytic) */
  function radialDeriv(n, l, Z, r) {
    const S = radialSet(n, l), rho = 2 * Z * r / n, e = Math.exp(-rho / 2), N = Math.sqrt(Math.pow(2 * Z / n, 3)) * S.pref;
    const L = polyVal(S.c, rho), Ld = polyVal(S.d, rho);
    // d/drho [ e^{-rho/2} rho^l L ] = e^{-rho/2} rho^l [ (l/rho - 1/2) L + L' ]   (l/rho * rho^l = l rho^(l-1))
    const pl = l === 0 ? 1 : Math.pow(rho, l), plm1 = l === 0 ? 0 : l * Math.pow(rho, l - 1);
    return N * (2 * Z / n) * e * (plm1 * L + pl * (-0.5 * L + Ld));
  }

  /* ---- angular part. Y_l^m = Theta_lm(theta) e^{i m phi}, Condon-Shortley phase, Theta real ---- */
  const legCache = {};
  function legendrePoly(l) {          // coefficients of P_l(x), lowest power first
    if (legCache[l]) return legCache[l];
    let p0 = [1], p1 = [0, 1];
    if (l === 0) return legCache[l] = p0;
    for (let k = 2; k <= l; k++) {     // k P_k = (2k-1) x P_{k-1} - (k-1) P_{k-2}
      const nx = new Array(k + 1).fill(0);
      p1.forEach((v, i) => { nx[i + 1] += (2 * k - 1) * v / k; });
      p0.forEach((v, i) => { nx[i] -= (k - 1) * v / k; });
      p0 = p1; p1 = nx;
    }
    return legCache[l] = p1;
  }
  const qCache = {};
  function legQ(l, m) {                // Q = d^m P_l / dx^m
    const key = l * 10 + m; if (qCache[key]) return qCache[key];
    let c = legendrePoly(l); for (let i = 0; i < m; i++) c = polyDer(c);
    return qCache[key] = { c, d: polyDer(c) };
  }
  const angNorm = (l, m) => Math.sqrt((2 * l + 1) / (4 * Math.PI) * FACT[l - m] / FACT[l + m]);   // m >= 0
  /* Theta_lm(theta) and its derivative with respect to theta. */
  function theta(l, m, th) {
    const a = Math.abs(m), Q = legQ(l, a), x = Math.cos(th), s = Math.sin(th);
    const sg = (m > 0 && (m & 1)) ? -1 : 1;
    return sg * angNorm(l, a) * (a === 0 ? 1 : Math.pow(s, a)) * polyVal(Q.c, x);
  }
  function thetaDeriv(l, m, th) {
    const a = Math.abs(m), Q = legQ(l, a), x = Math.cos(th), s = Math.sin(th);
    const sg = (m > 0 && (m & 1)) ? -1 : 1, N = sg * angNorm(l, a);
    const t1 = a === 0 ? 0 : a * Math.pow(s, a - 1) * x * polyVal(Q.c, x);
    const t2 = -Math.pow(s, a + 1) * polyVal(Q.d, x);
    return N * (t1 + t2);
  }
  /* |Y_l^m|^2 as a function of cos(theta) (without the phi factor) */
  function ang2(l, m, x) { const s2 = Math.max(0, 1 - x * x), a = Math.abs(m), Q = legQ(l, a), q = polyVal(Q.c, x), N = angNorm(l, a); return N * N * Math.pow(s2, a) * q * q; }

  /* ---- full complex wavefunction of one eigenstate, with the spherical components of its gradient ---- */
  function eigen(n, l, m, Z, r, th, ph) {
    const R = radial(n, l, Z, r), Rd = radialDeriv(n, l, Z, r), T = theta(l, m, th), Td = thetaDeriv(l, m, th);
    const c = Math.cos(m * ph), s = Math.sin(m * ph), sin = Math.sin(th);
    const re = R * T * c, im = R * T * s;
    return {
      re, im,
      gr: [Rd * T * c, Rd * T * s],                                   // d/dr
      gt: [R * Td * c / r, R * Td * s / r],                           // (1/r) d/dtheta
      gp: [-m * im / (r * sin), m * re / (r * sin)]                   // (1/(r sin)) d/dphi = i m psi / (r sin)
    };
  }
  const energy = (n, Z) => -Z * Z / (2 * n * n);

  /* superposition psi(t) = sum c_k psi_k exp(-i E_k t). comps = [{n,l,m,re,im}] (c = re + i im). Returns psi and grad (complex, spherical). */
  function superEval(comps, Z, r, th, ph, t, out) {
    let re = 0, im = 0, gr0 = 0, gr1 = 0, gt0 = 0, gt1 = 0, gp0 = 0, gp1 = 0;
    for (let k = 0; k < comps.length; k++) {
      const q = comps[k], e = eigen(q.n, q.l, q.m, Z, r, th, ph), E = energy(q.n, Z);
      const pc = Math.cos(E * t), ps = -Math.sin(E * t);                 // e^{-iEt}
      const cr = q.re * pc - q.im * ps, ci = q.re * ps + q.im * pc;       // c e^{-iEt}
      re += cr * e.re - ci * e.im; im += cr * e.im + ci * e.re;
      gr0 += cr * e.gr[0] - ci * e.gr[1]; gr1 += cr * e.gr[1] + ci * e.gr[0];
      gt0 += cr * e.gt[0] - ci * e.gt[1]; gt1 += cr * e.gt[1] + ci * e.gt[0];
      gp0 += cr * e.gp[0] - ci * e.gp[1]; gp1 += cr * e.gp[1] + ci * e.gp[0];
    }
    out = out || {}; out.re = re; out.im = im; out.gr = [gr0, gr1]; out.gt = [gt0, gt1]; out.gp = [gp0, gp1]; return out;
  }
  /* v = Im(grad psi / psi) in spherical components (atomic units, hbar = m_e = 1) */
  function velocitySph(comps, Z, r, th, ph, t) {
    const p = superEval(comps, Z, r, th, ph, t), d = p.re * p.re + p.im * p.im;
    const im = g => (g[1] * p.re - g[0] * p.im) / d;
    return { vr: im(p.gr), vt: im(p.gt), vp: im(p.gp), rho: d };
  }

  /* ---- samplers ---- */
  function rngMake(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gaussRng(rnd) { return () => { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }; }

  /* Tabulated inverse CDF of a non-negative density f on [a,b]: returns {x, cdf, sample(u)} with linear interpolation inside bins. */
  function tabulate(f, a, b, N) {
    const x = new Float64Array(N + 1), cdf = new Float64Array(N + 1), h = (b - a) / N;
    let prev = f(a), acc = 0; x[0] = a; cdf[0] = 0;
    for (let i = 1; i <= N; i++) {
      x[i] = a + i * h; const cur = f(x[i]);
      acc += 0.5 * (prev + cur) * h; cdf[i] = acc; prev = cur;
    }
    const tot = acc; for (let i = 0; i <= N; i++) cdf[i] /= tot;
    const sample = u => {
      let lo = 0, hi = N;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cdf[mid] <= u) lo = mid; else hi = mid; }
      const d = cdf[hi] - cdf[lo]; return d > 0 ? x[lo] + (u - cdf[lo]) / d * h : x[lo];
    };
    return { x, cdf, total: tot, sample, N };
  }
  /* radius (bohr) beyond which the radial density is utterly negligible */
  const rMaxFor = (n, Z) => (2 * n * n + 25 * n) / Z;
  const radialTables = {};
  function radialTable(n, l, Z) {   // r from r^2 R^2
    const key = n + '_' + l + '_' + Z; if (radialTables[key]) return radialTables[key];
    return radialTables[key] = tabulate(r => { const R = radial(n, l, Z, r); return r * r * R * R; }, 0, rMaxFor(n, Z), 16384);
  }
  const cosTables = {};
  function cosTable(l, m) {         // cos(theta) from |Theta_lm|^2
    const key = l * 10 + Math.abs(m); if (cosTables[key]) return cosTables[key];
    return cosTables[key] = tabulate(x => ang2(l, m, x), -1, 1, 8192);
  }
  const phiTables = {};
  function phiTable(m) {            // phi for a real orbital: density cos^2(m phi) on [0, 2pi)
    const key = Math.abs(m); if (phiTables[key]) return phiTables[key];
    return phiTables[key] = tabulate(p => { const c = Math.cos(key * p); return c * c; }, 0, 2 * Math.PI, 4096);
  }

  /* Dots for one eigenstate. kind: 'complex' (definite m: flows) or 'cos' / 'sin' (real orbital, no flow).
     Returns {s, z, phi, om, r, th} Float32/64 arrays. Positions are x = s cos(phi), y = s sin(phi), z (axis vertical).
     omega = m / s^2 (atomic units), capped at |m|/sCap^2 near the axis for display (sCap given, 0 = no cap). */
  function sampleOrbital(n, l, m, Z, count, opt) {
    opt = opt || {}; const rnd = opt.rng || rngMake(opt.seed || 1), kind = opt.kind || 'complex';
    const rt = radialTable(n, l, Z), ct = cosTable(l, m), pt = (kind !== 'complex' && m !== 0) ? phiTable(m) : null;
    const o = { s: new Float32Array(count), z: new Float32Array(count), phi: new Float32Array(count), om: new Float32Array(count), r: new Float32Array(count), th: new Float32Array(count) };
    const sCap = opt.sCap || 0, flows = kind === 'complex' && m !== 0;
    for (let i = 0; i < count; i++) {
      const r = rt.sample(rnd()), x = ct.sample(rnd()), sn = Math.sqrt(Math.max(0, 1 - x * x));
      let ph = pt ? pt.sample(rnd()) : rnd() * 2 * Math.PI;
      if (kind === 'sin' && m !== 0) ph += Math.PI / (2 * Math.abs(m));   // sin(m phi) = cos(m (phi - pi/2m))
      const s = r * sn;
      o.r[i] = r; o.th[i] = Math.acos(x); o.s[i] = s; o.z[i] = r * x; o.phi[i] = ph;
      if (flows) { const se = Math.max(s, sCap); o.om[i] = m / (se * se); }
    }
    return o;
  }
  /* Orientation-averaged shells for a many-electron atom. shells = [{n,l,e,zeff}]. Each subshell is a hydrogen-like cloud
     shrunk by zeff, spherical because filled subshells are exactly spherical and a free atom has no preferred direction. */
  function sampleShells(shells, count, opt) {
    opt = opt || {}; const rnd = opt.rng || rngMake(opt.seed || 1), minShare = opt.minShare == null ? 0.025 : opt.minShare;
    const tot = shells.reduce((a, s) => a + s.e, 0); let share = shells.map(s => Math.max(s.e / tot, minShare)); const ss = share.reduce((a, b) => a + b, 0); share = share.map(v => v / ss);
    const o = { s: new Float32Array(count), z: new Float32Array(count), phi: new Float32Array(count), om: new Float32Array(count), r: new Float32Array(count), th: new Float32Array(count), shell: new Uint8Array(count) };
    let k = 0;
    shells.forEach((sh, j) => {
      const c = j === shells.length - 1 ? count - k : Math.round(share[j] * count), rt = radialTable(sh.n, sh.l, sh.zeff);
      for (let i = 0; i < c && k < count; i++, k++) {
        const r = rt.sample(rnd()), x = 2 * rnd() - 1, sn = Math.sqrt(1 - x * x);
        o.r[k] = r; o.th[k] = Math.acos(x); o.s[k] = r * sn; o.z[k] = r * x; o.phi[k] = rnd() * 2 * Math.PI; o.shell[k] = j;
      }
    });
    return o;
  }
  /* Exact rejection sampling from |psi(t)|^2 of a superposition (no fallback: loops until accepted).
     Proposal: pick component k with probability |c_k|^2 / sum, draw from |psi_k|^2; accept with |sum|^2 / (K sum |c_k psi_k|^2), which is <= 1. */
  function sampleSuper(comps, Z, count, t, opt) {
    opt = opt || {}; const rnd = opt.rng || rngMake(opt.seed || 1), K = comps.length;
    const w = comps.map(c => c.re * c.re + c.im * c.im), W = w.reduce((a, b) => a + b, 0), cum = []; let a = 0; w.forEach(v => { a += v / W; cum.push(a); });
    const tabs = comps.map(c => [radialTable(c.n, c.l, Z), cosTable(c.l, c.m)]);
    const out = { r: new Float64Array(count), th: new Float64Array(count), ph: new Float64Array(count) }; let got = 0, tries = 0;
    while (got < count) {
      tries++; let u = rnd(), k = 0; while (k < K - 1 && u > cum[k]) k++;
      const r = tabs[k][0].sample(rnd()), x = tabs[k][1].sample(rnd()), th = Math.acos(x), ph = rnd() * 2 * Math.PI;
      const p = superEval(comps, Z, r, th, ph, t), dens = p.re * p.re + p.im * p.im;
      let bound = 0;
      for (let j = 0; j < K; j++) { const e = eigen(comps[j].n, comps[j].l, comps[j].m, Z, r, th, ph); bound += w[j] * (e.re * e.re + e.im * e.im); }
      if (rnd() * K * bound <= dens) { out.r[got] = r; out.th[got] = th; out.ph[got] = ph; got++; }
    }
    out.tries = tries; return out;
  }

  /* ---- Bohmian / probability-current integration of a dot ensemble (Cartesian state, RK4 with adaptive sub-steps) ---- */
  function cartVel(comps, Z, x, y, z, t, out) {
    const r = Math.sqrt(x * x + y * y + z * z), rr = Math.max(r, 1e-9), th = Math.acos(Math.max(-1, Math.min(1, z / rr))), ph = Math.atan2(y, x);
    const sn = Math.max(Math.sin(th), 1e-6), v = velocitySph(comps, Z, rr, th, ph, t);
    const cp = Math.cos(ph), sp = Math.sin(ph), ct = Math.cos(th), st = Math.sin(th);
    // r-hat = (st cp, st sp, ct); theta-hat = (ct cp, ct sp, -st); phi-hat = (-sp, cp, 0)
    out[0] = v.vr * st * cp + v.vt * ct * cp - v.vp * sp;
    out[1] = v.vr * st * sp + v.vt * ct * sp + v.vp * cp;
    out[2] = v.vr * ct - v.vt * st;
    return out;
  }
  /* advance positions P (Float64Array xyz triples) from t to t+dt. Speed is capped at vmax (atomic units) where the current diverges at a node. */
  function advance(P, comps, Z, t, dt, opt) {
    opt = opt || {}; const vmax = opt.vmax || 6 * Z, hmax = opt.hmax || 0.15 / Z, n = P.length / 3;
    const k1 = [0, 0, 0], k2 = [0, 0, 0], k3 = [0, 0, 0], k4 = [0, 0, 0];
    const cap = v => { const s = Math.hypot(v[0], v[1], v[2]); if (s > vmax) { const f = vmax / s; v[0] *= f; v[1] *= f; v[2] *= f; } return v; };
    for (let i = 0; i < n; i++) {
      let x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2], tt = t, left = dt, guard = 0;
      while (left > 1e-12 && guard++ < 400) {
        cap(cartVel(comps, Z, x, y, z, tt, k1));
        const sp = Math.hypot(k1[0], k1[1], k1[2]);
        let h = Math.min(left, sp > 0 ? hmax / sp : left, left); if (h < left * 0.002) h = left * 0.002;
        cap(cartVel(comps, Z, x + 0.5 * h * k1[0], y + 0.5 * h * k1[1], z + 0.5 * h * k1[2], tt + 0.5 * h, k2));
        cap(cartVel(comps, Z, x + 0.5 * h * k2[0], y + 0.5 * h * k2[1], z + 0.5 * h * k2[2], tt + 0.5 * h, k3));
        cap(cartVel(comps, Z, x + h * k3[0], y + h * k3[1], z + h * k3[2], tt + h, k4));
        x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); z += h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
        tt += h; left -= h;
      }
      P[3 * i] = x; P[3 * i + 1] = y; P[3 * i + 2] = z;
    }
  }

  /* ---- small helpers used by the interface ---- */
  const meanR = (n, l, Z) => (3 * n * n - l * (l + 1)) / (2 * Z);
  const stateLabel = (name, n, l, m) => `${name} n = ${n}, l = ${l}, m = ${m > 0 ? '+' : m < 0 ? '−' : ''}${Math.abs(m)}`;
  /* extent that holds 97% of the radial probability, in bohr */
  function rQuantile(n, l, Z, q) { return radialTable(n, l, Z).sample(q); }
  return { A0_PM, AU_TIME_S, HARTREE_HZ, ME_OVER_MP, LTR, laguerreCoef, polyVal, radial, radialDeriv, theta, thetaDeriv, ang2, eigen, energy, superEval, velocitySph, rngMake, gaussRng,
    tabulate, radialTable, cosTable, rMaxFor, sampleOrbital, sampleShells, sampleSuper, cartVel, advance, meanR, stateLabel, rQuantile };
})();
