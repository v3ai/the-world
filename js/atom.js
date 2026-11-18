'use strict';
/* Atoms: the periodic table, the historical models and the quantum picture.

   Part 1 (this block, no browser or three.js needed): the mathematics of hydrogen-like orbitals, the samplers that turn
   |psi|^2 into dots, the probability current (the "flow") and time-dependent superpositions. It is run by
   tools/atom/test_orbitals.mjs, which proves it numerically.
   Part 2: AtomCloud, the dot-cloud renderer (three.js points, sphere-shaded sprites, flow in the vertex shader).
   Part 3: the frame type that shows it in the world.

   Units: atomic units unless a name says otherwise (lengths in Bohr radii a0, energies in hartree, time in 2.4189e-17 s). */
var AQ = (function () {
  const A0_PM = 52.9177210544;          // Bohr radius in pm (CODATA 2022, NIST)
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

  /* ---- Bohmian / probability-current integration of a dot ensemble (Cartesian state, adaptive sub-steps) ---- */
  /* Fast velocity field v = Im(grad psi / psi) for a fixed list of components: no allocation, no inverse trigonometry.
     Same mathematics as superEval/velocitySph (the test compares them). Returns function(x, y, z, t, out). */
  function fastField(comps, Z) {
    const C = comps.map(q => {
      const S = radialSet(q.n, q.l), a = Math.abs(q.m), Q = legQ(q.l, a);
      return { l: q.l, m: q.m, a, Lc: S.c, Ld: S.d, Qc: Q.c, Qd: Q.d, Rn: Math.sqrt(Math.pow(2 * Z / q.n, 3)) * S.pref, k: 2 * Z / q.n,
        N: ((q.m > 0 && (q.m & 1)) ? -1 : 1) * angNorm(q.l, a), E: energy(q.n, Z), cr: q.re, ci: q.im };
    });
    const hor = (c, x) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; };
    return function (x, y, z, t, out) {
      const rxy2 = x * x + y * y, r = Math.sqrt(rxy2 + z * z) + 1e-12, rxy = Math.sqrt(rxy2) + 1e-12;
      const ct = z / r, st = rxy / r, cp = x / rxy, sp = y / rxy;
      let re = 0, im = 0, gr0 = 0, gr1 = 0, gt0 = 0, gt1 = 0, gp0 = 0, gp1 = 0;
      for (let j = 0; j < C.length; j++) {
        const c = C[j], rho = c.k * r, e = Math.exp(-rho / 2);
        let pl = 1; for (let i = 0; i < c.l; i++) pl *= rho;
        const L = hor(c.Lc, rho), Ld = hor(c.Ld, rho);
        const R = c.Rn * e * pl * L, Rd = c.Rn * c.k * e * ((c.l ? c.l * pl / rho : 0) * L + pl * (-0.5 * L + Ld));
        const Q = hor(c.Qc, ct), Qd = hor(c.Qd, ct);
        let sa = 1, sam1 = 1; for (let i = 0; i < c.a; i++) { sam1 = sa; sa *= st; }
        const T = c.N * sa * Q, Td = c.N * ((c.a ? c.a * sam1 * ct * Q : 0) - sa * st * Qd);
        let cm = 1, sm = 0; for (let i = 0; i < c.a; i++) { const nc = cm * cp - sm * sp; sm = sm * cp + cm * sp; cm = nc; }
        if (c.m < 0) sm = -sm;
        const E = c.E * t, pc = Math.cos(E), ps = -Math.sin(E), qr = c.cr * pc - c.ci * ps, qi = c.cr * ps + c.ci * pc;
        const a = R * T, b = Rd * T, g = R * Td / r, h = c.m * a / (r * st);
        const fr = qr * cm - qi * sm, fi = qr * sm + qi * cm;          // c e^{-iEt} e^{i m phi}
        re += a * fr; im += a * fi;
        gr0 += b * fr; gr1 += b * fi; gt0 += g * fr; gt1 += g * fi;
        gp0 += -h * fi; gp1 += h * fr;
      }
      const d = re * re + im * im + 1e-300, vr = (gr1 * re - gr0 * im) / d, vt = (gt1 * re - gt0 * im) / d, vp = (gp1 * re - gp0 * im) / d;
      out[0] = vr * st * cp + vt * ct * cp - vp * sp; out[1] = vr * st * sp + vt * ct * sp + vp * cp; out[2] = vr * ct - vt * st;
      return out;
    };
  }
  let fieldComps = null, fieldZ = 0, fieldFn = null;
  function cartVel(comps, Z, x, y, z, t, out) {
    if (fieldComps !== comps || fieldZ !== Z) { fieldFn = fastField(comps, Z); fieldComps = comps; fieldZ = Z; }
    return fieldFn(x, y, z, t, out);
  }
  /* advance positions P (Float64Array xyz triples) from t to t+dt with RK4 (order 4) or the midpoint rule (order 2, cheaper, for display).
     Each dot takes its own sub-steps so that it moves at most hmax per step; speed is capped at vmax where the current diverges at a node. */
  function advance(P, comps, Z, t, dt, opt) {
    opt = opt || {}; const vmax = opt.vmax || 6 * Z, hmax = opt.hmax || 0.15 / Z, order = opt.order || 4, n = P.length / 3, f = fastField(comps, Z);
    const k1 = [0, 0, 0], k2 = [0, 0, 0], k3 = [0, 0, 0], k4 = [0, 0, 0];
    const cap = v => { const s = Math.hypot(v[0], v[1], v[2]); if (s > vmax) { const q = vmax / s; v[0] *= q; v[1] *= q; v[2] *= q; } return v; };
    for (let i = 0; i < n; i++) {
      let x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2], tt = t, left = dt, guard = 0;
      while (left > 1e-12 && guard++ < 400) {
        cap(f(x, y, z, tt, k1));
        const sp = Math.hypot(k1[0], k1[1], k1[2]);
        let h = Math.min(left, sp > 0 ? hmax / sp : left); if (h < left * 0.002) h = left * 0.002;
        cap(f(x + 0.5 * h * k1[0], y + 0.5 * h * k1[1], z + 0.5 * h * k1[2], tt + 0.5 * h, k2));
        if (order === 2) { x += h * k2[0]; y += h * k2[1]; z += h * k2[2]; }
        else {
          cap(f(x + 0.5 * h * k2[0], y + 0.5 * h * k2[1], z + 0.5 * h * k2[2], tt + 0.5 * h, k3));
          cap(f(x + h * k3[0], y + h * k3[1], z + h * k3[2], tt + h, k4));
          x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); z += h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
        }
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

/* ===================================================================================================================
   Part 2: AtomCloud, the dot-cloud renderer. Needs THREE (r128). Does not need the frame engine, so the standalone page
   tools/atom/orbital_test.html can use it.
   Every dot is one place the electron could be found. The positions are drawn from |psi|^2 (see AQ.sampleOrbital); for a state
   with m != 0 each dot circles the quantisation axis at angular speed omega = m/s^2, computed in the vertex shader from the
   attributes (s, z, phi0, omega), so a million dots cost the CPU nothing. Superpositions of different energies move the dots
   on the CPU along the probability current (AQ.advance).
   =================================================================================================================== */
var AQ_SHELL_HUE = { 1: [0.23, 0.50, 0.94], 2: [0.17, 0.71, 0.80], 3: [0.13, 0.84, 0.56], 4: [0.37, 0.82, 0.17], 5: [0.66, 0.85, 0.09], 6: [0.91, 0.69, 0.13], 7: [0.93, 0.48, 0.13] };
var AQ_SHELL_CSS = { 1: '#3b82f0', 2: '#2bb5cc', 3: '#22d68f', 4: '#5ed12b', 5: '#a8d817', 6: '#e8b021', 7: '#ee7a21' };
var AQ_ELEMENT_NAMES = {};   // optional: symbol -> name, filled by the host for labels

var AtomCloud = (typeof THREE === 'undefined') ? null : (function () {
  const ld = (typeof LDV === 'function') ? LDV : s => s, lf = (typeof LDF === 'function') ? LDF : s => s;
  const VERT = ld(`
    attribute float aOm; attribute float aSh; attribute float aRnd; attribute vec3 aCol;
    uniform float uT; uniform float uDyn; uniform float uCut; uniform float uSize; uniform float uPx; uniform float uMinPx; uniform float uRad; uniform float uFace;
    varying vec3 vCol; varying float vSh; varying float vDepth;
    void main(){
      vec3 p;
      if (uDyn > 0.5) { p = position; }
      else { float a = position.z + aOm * uT; p = vec3(position.x * cos(a), position.x * sin(a), position.y); }
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = max(uSize * aRnd * uPx / max(-mv.z, 1e-6), uMinPx);
      if (uCut > 0.5 && p.y < 0.0 && p.z > 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vec4 c0 = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vDepth = clamp((mv.z - c0.z) / uRad * 0.5 + 0.5, 0.0, 1.0);
      vCol = aCol; vSh = aSh;
      // dots lying on a cut face are lit like the face of a solid (full light, no shadow, no depth darkening)
      if (uCut > 0.5 && ((p.y < 0.0 && p.z <= 0.0 && p.z > -uFace) || (p.z > 0.0 && p.y >= 0.0 && p.y < uFace))) { vSh = 1.0; vDepth = 1.0; }
    }`);
  const FRAG = lf(`
    uniform float uOpacity; varying vec3 vCol; varying float vSh; varying float vDepth;
    void main(){
      vec2 d = gl_PointCoord * 2.0 - 1.0; d.y = -d.y; float r2 = dot(d, d); if (r2 > 1.0) discard;
      vec3 n = vec3(d, sqrt(1.0 - r2)); vec3 L = normalize(vec3(-0.30, 0.55, 0.78));
      float dif = max(dot(n, L), 0.0);
      vec3 col = vCol * (0.70 + 0.50 * dif) * (0.66 + 0.34 * vSh) * (0.68 + 0.32 * vDepth);
      col += vec3(0.30) * pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 20.0) * (0.4 + 0.6 * vSh);
      gl_FragColor = vec4(col, uOpacity);
    }`);

  /* pale studio backdrop with a soft vignette (one texture, shared by the app frame and the test page) */
  let backdropTex = null;
  function backdrop() {
    if (backdropTex) return backdropTex;
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 118, 8, 128, 128, 190); gr.addColorStop(0, '#f6f6f4'); gr.addColorStop(0.55, '#e8e9ea'); gr.addColorStop(1, '#c3c7cc');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    backdropTex = new THREE.CanvasTexture(c); return backdropTex;
  }
  function ringTexture() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    g.lineWidth = 5; g.strokeStyle = '#1c2230'; g.beginPath(); g.arc(32, 32, 20, 0, 7); g.stroke();
    g.fillStyle = '#1c2230'; g.beginPath(); g.arc(32, 32, 4, 0, 7); g.fill();
    return new THREE.CanvasTexture(c);
  }

  class AtomCloud {
    /* o: {unit (scene units per bohr, default 1), count (dots, default 100000), cut, autoQuality} */
    constructor(o) {
      o = o || {};
      this.unit = o.unit || 1; this.count = o.count || 100000; this.cut = !!o.cut; this.autoQuality = o.autoQuality !== false;
      this.group = new THREE.Group(); this.group.rotation.x = -Math.PI / 2;      // model z (the quantisation axis) is scene up
      this.slowAuto = true; this.slow = 1e16; this.flowOn = true; this.T = 0; this.spec = null; this.label = ''; this.extent = 10;
      this.view = { px: 800 * 1.0722, fov: 50 }; this.slowFrames = 0; this.ema = 0.016; this.onQuality = null;
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uDyn: { value: 0 }, uCut: { value: this.cut ? 1 : 0 }, uSize: { value: 0.1 }, uPx: { value: 800 }, uMinPx: { value: 1.6 }, uRad: { value: 10 }, uFace: { value: 0.3 }, uOpacity: { value: 1 } },
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: true, depthWrite: true
      });
      this.points = null;
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
      this.marker = new THREE.Points(mg, new THREE.PointsMaterial({ map: ringTexture(), size: 22, sizeAttenuation: false, transparent: true, depthTest: false, depthWrite: false }));
      this.marker.frustumCulled = false; this.marker.renderOrder = 5; this.group.add(this.marker);
      this.P = null; this.simT = 0; this.simMs = 0; this.shadeAge = 0;
    }
    setView(heightPx, fovDeg) { this.view.px = heightPx / (2 * Math.tan(fovDeg * Math.PI / 360)); this.view.hpx = heightPx; }
    setCut(b) { this.cut = !!b; this.mat.uniforms.uCut.value = this.cut ? 1 : 0; if (this.spec) this._shade(); }
    setFlow(b) { this.flowOn = !!b; }
    setCount(n) { this.count = Math.max(2000, Math.round(n)); if (this.spec) this.setState(this.spec); }
    setSlow(s) { this.slowAuto = false; this.slow = s; }
    setOpacity(a) { this.mat.uniforms.uOpacity.value = a; }

    /* Describe what is on screen, for the label in the corner and the statement of what the picture means. */
    describe() { return this.label; }

    /* spec: {kind:'orbital', Z, n, l, m, real:null|'cos'|'sin', name}  one eigenstate (real = chemist's shapes, no flow)
             {kind:'shells', shells:[{n,l,e,zeff}], name}                 whole many-electron atom, orientation averaged
             {kind:'super', Z, comps:[{n,l,m,re,im}], name}                superposition of different energies (hydrogen-like only) */
    setState(spec) {
      this.spec = spec; this.T = 0; this.simT = 0; this.P = null;
      const N = spec.kind === 'super' ? Math.min(this.count, spec.maxDots || 20000) : this.count, rnd = AQ.rngMake(spec.seed || 12345);
      let s, z, ph, om, r, col = new Float32Array(N * 3), isDyn = false, shellIdx = null, pos = new Float32Array(N * 3);
      this.flows = false;
      if (spec.kind === 'orbital') {
        const Zc = spec.zeff || spec.Z || 1, kind = spec.real || 'complex', mr = AQ.meanR(spec.n, spec.l, Zc);
        const d = AQ.sampleOrbital(spec.n, spec.l, spec.m || 0, Zc, N, { rng: rnd, kind, sCap: 0.12 * mr }); s = d.s; z = d.z; ph = d.phi; om = d.om; r = d.r;
        this.flows = kind === 'complex' && spec.m !== 0; this.omegaCap = this.flows ? Math.abs(spec.m) / Math.pow(0.12 * mr, 2) : 0;
        this.sTyp = 0.75 * mr; this.hueN = [spec.n];
        this.label = spec.name || `${spec.name0 || 'hydrogen'} ${AQ.stateLabel('', spec.n, spec.l, spec.m || 0).trim()}`;
      } else if (spec.kind === 'shells') {
        const d = AQ.sampleShells(spec.shells, N, { rng: rnd }); s = d.s; z = d.z; ph = d.phi; om = d.om; r = d.r; shellIdx = d.shell; this.hueN = spec.shells.map(q => q.n);
        this.label = spec.name || 'atom';
      } else if (spec.kind === 'super') {
        isDyn = true; const Z = spec.Z || 1, d = AQ.sampleSuper(spec.comps, Z, N, 0, { rng: rnd });
        this.P = new Float64Array(3 * N); r = new Float32Array(N);
        for (let i = 0; i < N; i++) { const st = Math.sin(d.th[i]); this.P[3 * i] = d.r[i] * st * Math.cos(d.ph[i]); this.P[3 * i + 1] = d.r[i] * st * Math.sin(d.ph[i]); this.P[3 * i + 2] = d.r[i] * Math.cos(d.th[i]); r[i] = d.r[i]; }
        this.hueN = [Math.max(...spec.comps.map(c => c.n))]; this.label = spec.name || 'superposition';
        this.dE = Math.abs(AQ.energy(Math.max(...spec.comps.map(c => c.n)), Z) - AQ.energy(Math.min(...spec.comps.map(c => c.n)), Z));
      }
      // extent: radius that holds 98.5% of the dots (measured on the sample, in bohr)
      const rs = Float32Array.from(r).sort(); this.extent = rs[Math.floor(0.985 * (N - 1))] * 1.0;
      if (spec.kind === 'shells') this.extent = this.extentShells(spec);
      // colours: one hue per principal quantum number, slight brightness jitter
      const rr = AQ.rngMake(7), rnd2 = new Float32Array(N);
      // in a whole atom the inner shells are far smaller than the outer one, so their dots are drawn smaller (never below 30%)
      const shellSize = spec.kind === 'shells' ? spec.shells.map(q => Math.max(0.3, Math.min(1, Math.sqrt(AQ.radialTable(q.n, q.l, q.zeff).sample(0.9) / this.extent)))) : null;
      for (let i = 0; i < N; i++) {
        const n = shellIdx ? spec.shells[shellIdx[i]].n : this.hueN[0], h = AQ_SHELL_HUE[Math.min(7, n)] || AQ_SHELL_HUE[7], b = 0.92 + 0.16 * rr();
        col[3 * i] = Math.min(1, h[0] * b); col[3 * i + 1] = Math.min(1, h[1] * b); col[3 * i + 2] = Math.min(1, h[2] * b);
        rnd2[i] = (0.88 + 0.26 * rr()) * (shellIdx ? shellSize[shellIdx[i]] : 1);   // size of this dot relative to the base size
      }
      const geo = new THREE.BufferGeometry(), u = this.unit;
      if (isDyn) { for (let i = 0; i < 3 * N; i++) pos[i] = this.P[i] * u; }
      else for (let i = 0; i < N; i++) { pos[3 * i] = s[i] * u; pos[3 * i + 1] = z[i] * u; pos[3 * i + 2] = ph[i]; }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(isDyn ? THREE.DynamicDrawUsage : THREE.StaticDrawUsage));
      geo.setAttribute('aOm', new THREE.BufferAttribute(om ? Float32Array.from(om) : new Float32Array(N), 1));
      geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd2, 1));
      geo.setAttribute('aSh', new THREE.BufferAttribute(new Float32Array(N).fill(0.7), 1).setUsage(THREE.DynamicDrawUsage));
      this.geo = geo; this.s = s; this.zz = z; this.ph = ph; this.N = N; this.isDyn = isDyn;
      if (this.points) { this.group.remove(this.points); this.points.geometry.dispose(); }
      this.points = new THREE.Points(geo, this.mat); this.points.frustumCulled = false; this.group.add(this.points);
      this.mat.uniforms.uDyn.value = isDyn ? 1 : 0;
      // dot size: constant coverage, so fewer dots mean bigger dots
      const dotB = this.extent * 0.0105 * Math.min(2.2, Math.sqrt(1e5 / N));
      this.mat.uniforms.uSize.value = dotB * u; this.mat.uniforms.uRad.value = this.extent * u; this.mat.uniforms.uFace.value = dotB * u * 1.4;
      // slow-down: about 1e16, lower for big slow orbitals so the motion stays visible (stated on screen)
      if (this.slowAuto) {
        if (this.flows) { const per = 2 * Math.PI * this.sTyp * this.sTyp / Math.abs(spec.m); const want = 22 / (per * AQ.AU_TIME_S); this.slow = Math.max(1e14, Math.min(1e16, Math.pow(10, Math.round(Math.log10(want) * 2) / 2))); }
        else this.slow = 1e16;
      }
      this._shade();
      return this;
    }
    extentShells(spec) {
      let e = 0; spec.shells.forEach(q => { e = Math.max(e, AQ.radialTable(q.n, q.l, q.zeff).sample(0.985)); }); return e;
    }
    /* Soft self-shadowing: optical depth through the dots, seen from a ring of lights high above the cloud, averaged around the axis
       (so the picture does not change as the dots circle the axis). Dots deep inside, or under thick parts, are darker. */
    _shade() {
      const N = this.N, G = 44, E = this.extent * 1.12, cell = 2 * E / G, inv = 1 / cell, grid = new Float32Array(G * G * G), cut = this.cut;
      const x = new Float32Array(N), y = new Float32Array(N), zc = this.isDyn ? new Float32Array(N) : this.zz;
      if (this.isDyn) for (let i = 0; i < N; i++) { x[i] = this.P[3 * i]; y[i] = this.P[3 * i + 1]; zc[i] = this.P[3 * i + 2]; }
      else for (let i = 0; i < N; i++) { x[i] = this.s[i] * Math.cos(this.ph[i]); y[i] = this.s[i] * Math.sin(this.ph[i]); }
      const idx = (a, b, c) => (c * G + b) * G + a;
      for (let i = 0; i < N; i++) {
        if (cut && y[i] < 0 && zc[i] > 0) continue;
        const a = Math.floor((x[i] + E) * inv), b = Math.floor((y[i] + E) * inv), c = Math.floor((zc[i] + E) * inv);
        if (a >= 0 && b >= 0 && c >= 0 && a < G && b < G && c < G) grid[idx(a, b, c)]++;
      }
      let sum = 0, cnt = 0; for (let i = 0; i < grid.length; i++) if (grid[i] > 0) { sum += grid[i]; cnt++; }
      const ref = Math.max(1, sum / Math.max(1, cnt)) * 1.6, k = 0.085;
      const tilt = 1.0, st = Math.sin(tilt), ct = Math.cos(tilt), dirs = [];
      for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + 0.4; dirs.push([st * Math.cos(a), st * Math.sin(a), ct]); }
      const sh = this.geo.attributes.aSh.array, maxSteps = Math.ceil(2.2 * G);
      for (let i = 0; i < N; i++) {
        let acc = 0;
        for (let q = 0; q < 4; q++) {
          const d = dirs[q]; let px = (x[i] + E) * inv, py = (y[i] + E) * inv, pz = (zc[i] + E) * inv, tau = 0;
          for (let s = 0; s < maxSteps; s++) {
            px += d[0]; py += d[1]; pz += d[2];
            const a = px | 0, b = py | 0, c = pz | 0; if (px < 0 || py < 0 || pz < 0 || a >= G || b >= G || c >= G) break;
            tau += grid[idx(a, b, c)];
          }
          acc += Math.exp(-k * tau / ref);
        }
        sh[i] = acc / 4;
      }
      this.geo.attributes.aSh.needsUpdate = true;
    }
    /* per-frame update; dt in real seconds */
    update(dt) {
      if (!this.points) return;
      const U = this.mat.uniforms;
      U.uPx.value = this.view.px; U.uT.value = this.T;
      const au = dt / (AQ.AU_TIME_S * this.slow);        // atomic time units elapsed this frame
      if (this.flowOn) this.T += au;
      if (this.isDyn && this.flowOn) {
        const t0 = performance.now(), step = Math.min(au, 0.25);
        AQ.advance(this.P, this.spec.comps, this.spec.Z || 1, this.simT, step, { order: 2 }); this.simT += step;
        const pos = this.geo.attributes.position.array, u = this.unit; for (let i = 0; i < pos.length; i++) pos[i] = this.P[i] * u;
        this.geo.attributes.position.needsUpdate = true; this.simMs = performance.now() - t0;
        if (++this.shadeAge > 12) { this.shadeAge = 0; this._shade(); }
      }
      // automatic drop in dot count on a slow device
      if (this.autoQuality && !(typeof window !== 'undefined' && window.ATOM_NO_AUTOQ) && dt > 0) {
        this.ema = this.ema * 0.9 + dt * 0.1;
        if (this.ema > 0.05) this.slowFrames++; else this.slowFrames = Math.max(0, this.slowFrames - 2);
        if (this.slowFrames > 90 && this.count > 25000) { this.slowFrames = 0; this.ema = 0.016; this.setCount(this.count * 0.65); if (this.onQuality) this.onQuality(this.count); }
      }
    }
    /* what to tell the learner about the speed of the motion */
    slowText() { const e = Math.round(Math.log10(this.slow) * 10) / 10; return Number.isInteger(e) ? '10^' + e : '10^' + e.toFixed(1); }
    dispose() { if (this.points) this.points.geometry.dispose(); this.mat.dispose(); this.marker.geometry.dispose(); this.marker.material.dispose(); }
  }
  AtomCloud.backdrop = backdrop;
  return AtomCloud;
})();

/* ===================================================================================================================
   Part 3: the frame. FT.atomq is the experimental frame that shows an AtomCloud inside the world engine (logarithmic depth,
   fading, picking, the frame's own camera). Stage A3 turns this into FT.atom for all 118 elements.
   opts: {kind:'orbital', Z, n, l, m, real} | {kind:'shells', el:'O'} | {kind:'super', ...}   (see AtomCloud.setState)
   Frame unit is the picometre: one Bohr radius = AQ.A0_PM scene units.
   =================================================================================================================== */
function atomShellsFor(sym) {
  const e = (typeof ELJ !== 'undefined' && ELJ[sym]); if (!e || !e.subshells) return null;
  const zf = (ATOM_ZEFF && ATOM_ZEFF.elements && ATOM_ZEFF.elements[sym] && ATOM_ZEFF.elements[sym].zeff) || {};
  return { e, shells: Object.entries(e.subshells).map(([k, occ]) => ({ n: +k[0], l: 'spdfgh'.indexOf(k[1]), e: occ, zeff: zf[k] || Math.max(1, e.Z - occ), key: k })) };
}
var ATOM_ZEFF = null;
if (typeof FT !== 'undefined' && AtomCloud) {
  FT.atomq = {
    build(F, o) {
      F.illo = true; F.env = { opaque: true, bg: 0xe9eaec };
      F.scene.background = AtomCloud.backdrop();
      const cloud = new AtomCloud({ unit: AQ.A0_PM, count: o.count || (window.ATOM_COUNT || 100000), cut: !!o.cut });
      F.add(cloud.group); F.cloud = cloud;
      const start = () => {
        let spec = o;
        if (o.el) { const sf = atomShellsFor(o.el); if (!sf) return; spec = { kind: 'shells', shells: sf.shells, name: `${sf.e.name}, Z = ${sf.e.Z}` }; }
        cloud.setState(spec); F.extent = cloud.extent * AQ.A0_PM;
      };
      if (o.el && !ATOM_ZEFF) getJSON('data/atomic/zeff.json').then(z => { ATOM_ZEFF = z; if (F.built) start(); }); else start();
      F.update = dt => { const v = new THREE.Vector2(); renderer.getDrawingBufferSize(v); cloud.setView(v.y, 50); cloud.update(dt); };
      F.onDispose = () => cloud.dispose();
    }
  };
}
