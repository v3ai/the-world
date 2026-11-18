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
      vec4 c0 = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      // dots far in front of the cloud (its thin tail) are not drawn more than twice as big as dots at its centre
      gl_PointSize = max(uSize * aRnd * uPx / max(max(-mv.z, 0.5 * (-c0.z)), 1e-6), uMinPx);
      if (uCut > 0.5 && p.y < 0.0 && p.z > 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
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
      // colours: one hue per principal quantum number, slight brightness jitter
      const rr = AQ.rngMake(7), rnd2 = new Float32Array(N);
      // in a whole atom the inner shells are far smaller than the outer one, so their dots are drawn smaller (never below 30%)
      const r90s = spec.kind === 'shells' ? spec.shells.map(q => AQ.radialTable(q.n, q.l, q.zeff).sample(0.9)) : null, rOut = r90s ? Math.max(...r90s) : 1;
      const shellSize = r90s ? r90s.map(v => Math.max(0.3, Math.min(1, Math.pow(v / rOut, 0.6)))) : null;
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
      const dotB = this.extent * 0.0085 * Math.min(2.2, Math.sqrt(1e5 / N));
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

/* ===================================================================================================================
   Part 4 (stage A3): the atom in the world. FT.atom for all 118 elements, five historical models, the configuration
   strip, the orbital explorer, isotopes, the periodic-table picker (Part 5) and the topic/element cards (Part 6).
   Everything here is data-driven from ELJ (data/elements.json) and data/atomic/*.json.
   =================================================================================================================== */
var ATM = { data: {}, A: {}, ready: null, frames: new Set(), picker: null };
ATM.load = function () {
  if (ATM.ready) return ATM.ready;
  const g = p => getJSON(p).catch(() => null);
  return ATM.ready = Promise.all([g('data/atomic/zeff.json'), g('data/atomic/isotopes.json'), g('data/atomic/lines.json'), g('data/atomic/sources.json')])
    .then(([z, i, l, s]) => { ATOM_ZEFF = z; ATM.data = { zeff: z, iso: i, lines: l, src: s }; });
};
ATM.name = s => (ELJ[s] || {}).name || s;
ATM.lc = s => ATM.name(s).toLowerCase();
ATM.sgn = m => (m > 0 ? '+' : m < 0 ? '−' : '') + Math.abs(m);
ATM.sup = txt => String(txt).replace(/(\d[spdfgh])(\d+)/g, '$1<sup>$2</sup>');
ATM.cfgHTML = e => ATM.sup(e.config || '');
ATM.rad = e => e.radius_atomic_pm || e.radius_covalent_pm || 100;
ATM.isoList = function (sym) {
  const r = ATM.data.iso && ATM.data.iso[sym], e = ELJ[sym];
  if (r && r.natural && r.natural.length) return r.natural.map(x => ({ A: x.A, ab: x.abundance, stable: x.stable, hl: x.half_life_text }));
  if (r && r.longest_lived) return [{ A: r.longest_lived.A, hl: r.longest_lived.half_life_text, longest: true }];
  return [{ A: e.mostAbundantA || Math.round(e.mass) }];
};
ATM.curA = sym => { const l = ATM.isoList(sym), a = ATM.A[sym]; return a && l.some(x => x.A === a) ? a : (ELJ[sym].mostAbundantA || l[0].A); };
ATM.isoName = (sym, A) => `${ATM.name(sym)}-${A}`;
ATM.shellCounts = e => { const c = {}; Object.entries(e.subshells).forEach(([k, v]) => { c[+k[0]] = (c[+k[0]] || 0) + v; }); return c; };
ATM.fmt = (x, d) => (+x).toLocaleString('en-GB', { maximumSignificantDigits: d || 4 });
ATM.wlRGB = function (nm) {   // rough visible colour of a wavelength; outside 380-750 nm a dim stand-in (the light is invisible)
  let r = 0, g = 0, b = 0;
  if (nm < 380) return [0.55, 0.40, 0.85]; if (nm > 750) return [0.55, 0.25, 0.25];
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
  const f = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 700 ? 0.35 + 0.65 * (750 - nm) / 50 : 1;
  return [Math.min(1, r * f * 0.9), Math.min(1, g * f * 0.9), Math.min(1, b * f * 0.9)];
};
ATM.colorName = nm => nm < 380 ? 'ultraviolet (invisible)' : nm < 450 ? 'violet' : nm < 495 ? 'blue' : nm < 570 ? 'green' : nm < 590 ? 'yellow' : nm < 620 ? 'orange' : nm <= 750 ? 'red' : 'infrared (invisible)';
/* the colour used for each family; shared by the picker and by the Dalton ball */
ATM.FAMILY = [['Alkali metals', '#e07a5f', 'Alkali metals'], ['Alkaline earth metals', '#e9b44c', 'Alkaline earth metals'], ['Transition metals', '#6a8fc7', 'Transition metals'],
  ['Poor metals', '#8bb5a3', 'Post-transition metals'], ['Metalloids', '#b58fc2', 'Metalloids'], ['Nonmetals', '#6bb36b', 'Reactive nonmetals'], ['Halogens', '#d9d35f', 'Halogens'],
  ['Noble gases', '#5fc4d6', 'Noble gases'], ['Lanthanides', '#d98fa8', 'Lanthanides'], ['Actinides', '#c0707a', 'Actinides']];
ATM.famColor = cat => (ATM.FAMILY.find(f => f[0] === cat) || [0, '#999'])[1];
ATM.realName = function (l, m, kind) {
  const a = Math.abs(m);
  if (l === 0) return 's';
  if (l === 1) return m === 0 ? 'pz' : kind === 'cos' ? 'px' : 'py';
  if (l === 2) return m === 0 ? 'dz²' : a === 1 ? (kind === 'cos' ? 'dxz' : 'dyz') : (kind === 'cos' ? 'dx²−y²' : 'dxy');
  return `${'spdfghi'[l]} orbital, ` + (m === 0 ? 'axial' : kind === 'cos' ? `cos(${a}φ) type` : `sin(${a}φ) type`);
};
/* the list of choices of m for a subshell: complex family m = -l..l; real family s/pz/px/py ... */
ATM.pickList = function (l, fam) {
  const out = [];
  if (fam === 'complex') for (let m = -l; m <= l; m++) out.push({ m, real: null, label: 'm = ' + ATM.sgn(m) });
  else for (let a = 0; a <= l; a++) { out.push({ m: a, real: 'cos', label: ATM.realName(l, a, 'cos') }); if (a) out.push({ m: a, real: 'sin', label: ATM.realName(l, a, 'sin') }); }
  return out;
};
ATM.defaultPick = (l, fam) => { const L = ATM.pickList(l, fam); if (fam === 'complex') return Math.min(L.length - 1, l + 1 > L.length - 1 ? 0 : (l ? l + 1 : 0)); return 0; };

/* --- wording (shared with tools/atom/orbital_test.html) --- */
ATM.MEANS = '<p>Every dot is one place this single electron could be found. Dots are crowded where it is likely to be. They are not many electrons, and the dot size is not the electron’s size.</p>';
ATM.CERT = '<p><span class="ctag">C1</span> The wavefunction and every number it predicts are settled. <span class="ctag">C4</span> What the wavefunction <em>is</em> (a real wave, knowledge, many worlds, a pilot wave) is an open question.</p>';
ATM.slowHTML = cloud => { const k = cloud.slowText().replace('^', ''); return `10<sup>${k.slice(2)}</sup>`; };
ATM.tipOrbital = function (spec, cloud) {
  let t = ATM.MEANS;
  if (spec.real) t += `<p>This is a chemist’s orbital: an equal mixture of m = +${spec.m} and m = −${spec.m}. The two circulations cancel, so the dots have no net flow and sit still.</p>`;
  else if (spec.m === 0) t += '<p>The dots are still because this state has no circulation about the vertical axis. That does not mean the electron is at rest: its kinetic energy is not zero.</p>';
  else t += `<p>The dots drift along the flow of probability, circling the vertical axis ${spec.m > 0 ? 'anticlockwise' : 'clockwise'} as seen from above, faster near the axis. In standard quantum mechanics only the probabilities are defined; in the pilot-wave (de Broglie–Bohm) reading these would be the electron’s actual paths. Both readings predict exactly the same measurements. The motion is slowed about ${ATM.slowHTML(cloud)} times.</p>`;
  return t + ATM.CERT;
};
ATM.tipShells = function (e, method) {
  return `<p>Dots are coloured by shell (one hue for each principal quantum number n). A free atom has no preferred direction, and filled subshells are exactly spherical, so each subshell is shown averaged over orientation, with no flow.</p>` +
    `<p><b>This is the orbital approximation.</b> Each subshell is a hydrogen-like cloud shrunk by an effective nuclear charge (${e.name}: ${method === 'slater' ? 'Slater’s rules' : method === 'clementi-raimondi' ? 'Clementi–Raimondi values' : 'Clementi–Raimondi where tabulated, Slater’s rules otherwise'}), so sizes are approximate. Real electrons avoid each other in ways this picture leaves out, and in heavy atoms relativity changes the inner shells. Inner shells get a minimum number of dots so that they stay visible, so dot counts are not to scale between shells.</p>` + ATM.CERT;
};
ATM.tipSuper = function (spec, cloud, which) {
  const Z = spec.Z, dE = 0.375 * Z * Z, f = dE * AQ.HARTREE_HZ / (Z === 1 ? 1 + AQ.ME_OVER_MP : 1), lam = 299792458 / f * 1e9;
  const ex = n => { const e = n.toExponential(3).split('e+'); return `${e[0]}×10<sup>${e[1]}</sup>`; };
  let t = ATM.MEANS;
  if (which === '1s2s') t += '<p>This mixture breathes: the cloud swells and shrinks, but its centre does not move, so it makes no oscillating dipole and cannot emit a single photon this way. The beat still has frequency (E₂ − E₁)/h.</p>';
  else if (which === '1s2p0') t += `<p>Mix the 1s and 2p states and the cloud stops being still: its density sloshes up and down at (E₂ − E₁)/h ≈ ${ex(f)} Hz. That is the frequency of the ${lam.toFixed(1)} nm ultraviolet light the atom emits when it drops from 2p to 1s${Z === 1 ? ' (the Lyman-α line, observed at 121.567 nm)' : ''}. This is the link between orbitals and spectral lines.</p>`;
  else t += `<p>Mixing 1s with 2p (m = +1) makes the whole cloud circle the axis at (E₂ − E₁)/h ≈ ${ex(f)} Hz, the Lyman-α frequency again.</p>`;
  t += `<p>The dots move along the probability current. In standard quantum mechanics only the probabilities are defined; in the pilot-wave reading these would be the electron’s actual paths. Both predict the same measurements. The motion is slowed about ${ATM.slowHTML(cloud)} times. Only hydrogen-like atoms have exactly known energies, so only they are offered here.</p>`;
  return t + ATM.CERT;
};
ATM.MODELS = {
  dalton: { year: 1803, title: 'Dalton, 1803', node: 'at_model_dalton',
    what: 'Every element is made of its own kind of tiny, solid, indivisible ball, and chemical change is a rearrangement of balls.',
    evidence: 'It explained why substances combine in fixed whole-number ratios by mass, and why the masses in different compounds of the same elements come in simple multiples.',
    killed: 'In 1897 J. J. Thomson showed that cathode rays are particles about two thousand times lighter than the lightest atom, and that they come out of every kind of atom. Atoms have parts.',
    scale: 'Drawn as a ball with the element’s empirical atomic radius. The model itself says nothing about size or inside; the colour is just the element’s family.' },
  thomson: { year: 1904, title: 'Thomson, 1904', node: 'at_model_thomson',
    what: 'A ball of positive charge, with the electrons spread inside it so that the atom is neutral. (Later nicknamed the plum-pudding model.)',
    evidence: 'It explained why atoms are neutral, why electrons can be pulled out of any atom, and why atoms of one element are all alike. Thomson also worked out that electrons in such a ball would settle into rings.',
    killed: 'Geiger and Marsden (1909) fired alpha particles at gold foil and found about 1 in 8,000 bounced back. A diffuse positive ball can only give tiny nudges, so it cannot do that. Rutherford’s 1911 analysis said the positive charge sits in a tiny core.',
    scale: 'Ball drawn at the atomic radius. Electron positions are illustrative, not Thomson’s calculated rings, and the electrons are drawn as balls only so you can see them: an electron has no measured size.' },
  rutherford: { year: 1911, title: 'Rutherford, 1911', node: 'at_model_rutherford',
    what: 'All the positive charge and almost all the mass sit in a tiny nucleus; the electrons are somewhere around it in mostly empty space.',
    evidence: 'It explained the rare large-angle scattering of alpha particles, and it gave a nuclear size: the nucleus is thousands of times smaller than the atom.',
    killed: 'Classical physics says an electron circling a nucleus must radiate light and spiral in within a tiny fraction of a second, so atoms could not be stable. The model also could not explain why each element emits only particular colours.',
    scale: 'The nucleus is at its true size, so it is too small to see (the ring marks where it is). Electron paths here are only a classical picture; Rutherford’s model did not say how electrons move. Electron balls are exaggerated.' },
  bohr: { year: 1913, title: 'Bohr, 1913', node: 'at_model_bohr',
    what: 'Electrons move on circles with only certain allowed energies; light is emitted or absorbed when an electron jumps between them.',
    evidence: 'For hydrogen it reproduced the measured colours of the spectrum (the Rydberg formula) from fundamental constants, and explained why atoms are stable.',
    killed: 'It fails for atoms with more than one electron (even helium), predicts a ground state with angular momentum where there is none, cannot give the brightness of lines or their splitting in a magnetic field, and has no way to say why only certain orbits are allowed. Quantum mechanics (1925–26) replaced it.',
    scale: '' },
  quantum: { year: 1926, title: 'Quantum, 1926', node: 'at_orbital', what: '', evidence: '', killed: '', scale: '' }
};

/* ---------- the frame ---------- */
ATM.nucleusRadiusFm = A => 1.2 * Math.cbrt(A);    // empirical r0 A^(1/3) rule, r0 about 1.2 fm (an average, not a measurement for each isotope)
ATM.segEl = function (items, cur, cb, cls) {
  const d = document.createElement('div'); d.className = 'seg ' + (cls || '');
  items.forEach(([k, label, title]) => { const b = document.createElement('button'); b.textContent = label; b.dataset.k = k; if (title) b.title = title; if (k === cur) b.classList.add('on'); b.onclick = () => cb(k); d.appendChild(b); });
  d.setK = k => d.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === String(k)));
  return d;
};
ATM.selEl = function (cls, label, onChange) {
  const w = document.createElement('label'); w.className = 'asel ' + (cls || ''); w.innerHTML = `<span>${label}</span><select></select>`;
  const s = w.querySelector('select'); s.onchange = () => onChange(s.value);
  w.set = (vals, cur) => { s.innerHTML = ''; vals.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o); }); s.value = String(cur); };
  return w;
};
ATM.isoLabel = (sym, x) => `${ATM.isoName(sym, x.A)}${x.ab != null ? ` · ${(x.ab * 100).toFixed(x.ab < 0.01 ? 4 : 2)}% of natural ${ATM.lc(sym)}` : ''}${!x.stable && x.hl ? ` · half-life ${x.hl}` : ''}${x.longest ? ' (longest-lived)' : ''}`;

/* put the nucleus child frames of an atom frame in step with its element and isotope */
ATM.retargetNucleus = function (F) {
  const sym = F.at.el, e = ELJ[sym], A = ATM.curA(sym), N = A - e.Z;
  F.children.slice().forEach(c => {
    if (c.type !== 'nucleus') return;
    const kids = c.children.slice();
    kids.forEach(k => { k.dispose(); (function drop(x) { x.children.forEach(y => { y.dispose(); drop(y); }); })(k); if (k.dynamic) c.children.splice(c.children.indexOf(k), 1); });
    c.opts = { Z: e.Z, N, el: sym }; c.name = `${ATM.isoName(sym, A)} nucleus`;
    const was = c.built; c.dispose(); if (was && drawn.includes(c)) c.ensure();
    if (cam.A === c) { uiFrame = null; capFrame = null; }
    if (c.dynamic && !chainOf(cam.A).includes(c)) { c.parent.children.splice(c.parent.children.indexOf(c), 1); }
  });
};
ATM.relabel = function (F) {   // ruler and tour labels of the static oxygen frames follow the element
  if (F !== FR.atom || typeof LANDMARKS === 'undefined') return;
  const nm = ATM.name(F.at.el), A = ATM.curA(F.at.el);
  LANDMARKS.forEach(L => {
    if (L._atomRole === undefined) L._atomRole = L.label === 'Oxygen atom' ? 'atom' : L.label === 'Oxygen nucleus' ? 'nuc' : null;
    if (!L._atomRole) return;
    L.label = L._atomRole === 'atom' ? `${nm} atom` : `${ATM.isoName(F.at.el, A)} nucleus`; if (L._el) L._el.textContent = L.label;
  });
};

FT.atom = {
  build(F, o) {
    const sym0 = ELJ[o.el] ? o.el : (console.error('atom frame: unknown element', o.el), 'O');
    const S = F.at = { el: sym0, model: store.get('atomModel', 'quantum'), qmode: 'atom', src: 'sub', sub: null, fam: 'complex', n: 2, l: 1, pick: 0, sup: '1s2p0', cut: false, flow: true,
      count: store.get('atomCount', 100000), bi: 3, bf: 2, extentPm: 150, spec: null, anim: null, track: [], lbls: [], J: null };
    if (!ATM.MODELS[S.model]) S.model = 'quantum';
    S.home = sym0; ATM.frames.add(F);
    F.illo = true; F.env = { opaque: true, bg: 0xe9eaec }; F.scene.background = AtomCloud.backdrop();
    F.add(new THREE.AmbientLight(0xffffff, 0.72)); const dl = new THREE.DirectionalLight(0xffffff, 0.85); dl.position.set(-3, 5, 6); F.add(dl);
    const cloud = new AtomCloud({ unit: AQ.A0_PM, count: S.count, cut: false }); F.add(cloud.group); F.cloud = cloud;
    cloud.group.remove(cloud.marker); cloud.marker.scale.set(1, 1, 1); F.add(cloud.marker);
    const gModel = new THREE.Group(); F.add(gModel);
    const mkAnchor = () => { const a = new THREE.Object3D(); F.add(a); return a; };
    // pickable proxies: the whole atom, and the nucleus (higher priority, so a click on the middle opens the nucleus card)
    const hitMain = hitSphere(100, 'at_atom_main', 1); hitMain.userData.noZoom = true; hitMain.userData.center = () => new V3(); F.add(hitMain);
    const nucHit = hitSphere(3, 'at_nucleus', 4); F.add(nucHit);
    nucHit.userData.center = () => new V3(); nucHit.userData.radius = () => 3; nucHit.userData.madeOf = null; nucHit.userData.title = 'Nucleus';
    const nucTrue = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), smat(0xc0453a, { roughness: 0.5 })); F.add(nucTrue);
    F.pickables.push(hitMain, nucHit);
    const nucAnchor = mkAnchor(); const nucLbl = F.label(nucAnchor, 'Nucleus (true size, far too small to see)', { offset: new V3(0, 0, 0) });
    // ---------- interface ----------
    const btnEl = actBtn('', () => ATM.openPicker(F));
    const modelSeg = seg([['dalton', 'Dalton 1803'], ['thomson', 'Thomson 1904'], ['rutherford', 'Rutherford 1911'], ['bohr', 'Bohr 1913'], ['quantum', 'Quantum 1926']], S.model, k => { S.model = k; store.set('atomModel', k); refresh(true); });
    const panel = uiEl(document.createElement('div')); panel.className = 'atomOpts glass';
    const modeSeg = ATM.segEl([['atom', 'Whole atom', 'Every occupied subshell, averaged over direction'], ['sub', 'One subshell', 'Pick a subshell in the strip and see one orbital'], ['free', 'Any n, l, m', 'Hydrogen-like atom: this nucleus with a single electron in any state'], ['super', 'Two states', 'Mix two energy states: the cloud moves']], S.qmode === 'orbital' ? 'sub' : S.qmode, k => setMode(k), 'modeSeg');
    const strip = document.createElement('div'); strip.className = 'cfgStrip';
    const nSel = ATM.selEl('', 'n', v => { S.n = +v; S.l = Math.min(S.l, S.n - 1); S.pick = ATM.defaultPick(S.l, S.fam); refresh(); });
    const lSel = ATM.selEl('', 'l', v => { S.l = +v; S.pick = ATM.defaultPick(S.l, S.fam); refresh(); });
    const pSel = ATM.selEl('wide', 'state', v => { S.pick = +v; refresh(); });
    const famSeg = ATM.segEl([['complex', 'With a definite rotation (m)', 'm = −l ... +l: these states have a flow'], ['real', 'Chemist’s shapes (x, y, z)', 'Real orbitals: sums of +m and −m, no net flow']], S.fam, k => { S.fam = k; S.pick = ATM.defaultPick(S.l, k); refresh(); }, 'famSeg');
    const supSel = ATM.selEl('wide', 'mix', v => { S.sup = v; refresh(); });
    supSel.set([['1s2p0', '1s + 2p (m = 0): sloshes, makes light'], ['1s2p1', '1s + 2p (m = +1): circles'], ['1s2s', '1s + 2s: breathes, no single-photon light']], S.sup);
    const cutBtn = document.createElement('button'); cutBtn.className = 'tog'; cutBtn.onclick = () => { S.cut = !S.cut; cloud.setCut(S.cut); syncToggles(); };
    const flowBtn = document.createElement('button'); flowBtn.className = 'tog'; flowBtn.onclick = () => { S.flow = !S.flow; cloud.setFlow(S.flow); syncToggles(); };
    const dotSel = ATM.selEl('', 'dots', v => { S.count = +v; store.set('atomCount', S.count); cloud.setCount(S.count); });
    dotSel.set([[25000, '25,000'], [50000, '50,000'], [100000, '100,000'], [200000, '200,000']], S.count);
    cloud.onQuality = n => { dotSel.set([[25000, '25,000'], [50000, '50,000'], [100000, '100,000'], [200000, '200,000'], [Math.round(n), Math.round(n).toLocaleString() + ' (auto)']], Math.round(n)); };
    const isoSel = ATM.selEl('wide', 'isotope', v => { ATM.A[S.el] = +v; ATM.retargetNucleus(F); ATM.relabel(F); updateNote(); });
    const row = cls => { const r = document.createElement('div'); r.className = 'arow ' + cls; panel.appendChild(r); return r; };
    const r1 = row('r1'), r2 = row('r2'), r3 = row('r3'), r4 = row('r4'), r5 = row('r5');
    r1.append(modeSeg); r2.append(strip); r3.append(famSeg, nSel, lSel, pSel, supSel); r4.append(cutBtn, flowBtn, dotSel); r5.append(isoSel);
    const specBox = uiEl(document.createElement('div')); specBox.className = 'atomSpec glass';
    // Bohr controls
    const bohrBar = uiEl(document.createElement('div')); bohrBar.className = 'atomOpts glass bohrBar';
    const biSel = ATM.selEl('', 'from n', v => { S.bi = +v; if (S.bf >= S.bi) S.bf = S.bi - 1; syncBohr(); refresh(); });
    const bfSel = ATM.selEl('', 'to n', v => { S.bf = +v; syncBohr(); });
    const emitBtn = document.createElement('button'); emitBtn.className = 'act'; emitBtn.textContent = 'Let it jump and emit light'; emitBtn.onclick = () => bohrEmit();
    bohrBar.append(biSel, bfSel, emitBtn);
    const note = document.createElement('div'); note.className = 'atomNote glass'; document.body.appendChild(note);
    F.onDispose = () => { cloud.dispose(); note.remove(); ATM.frames.delete(F); clearModel(); };
    note.addEventListener('click', ev => { const b = ev.target.closest('[data-n]'); if (b) { showBodyNode(b.dataset.n, null); } const t = ev.target.closest('.noteHead'); if (t) note.classList.toggle('shut'); });

    function syncToggles() {
      cutBtn.textContent = S.cut ? 'Put the quarter back' : 'Cut away a quarter'; cutBtn.classList.toggle('on', S.cut);
      flowBtn.textContent = 'Flow: ' + (S.flow ? 'on' : 'off'); flowBtn.classList.toggle('on', S.flow);
    }
    function syncBohr() {
      const mx = 6; biSel.set(Array.from({ length: mx - 1 }, (_, i) => [i + 2, 'n = ' + (i + 2)]), S.bi); bfSel.set(Array.from({ length: S.bi - 1 }, (_, i) => [i + 1, 'n = ' + (i + 1)]), Math.min(S.bf, S.bi - 1));
      S.bf = Math.min(S.bf, S.bi - 1);
    }
    function setMode(k) {
      S.qmode = k === 'sub' ? 'orbital' : k; S.src = k === 'free' ? 'free' : 'sub';
      if (k === 'sub' && !S.sub) S.sub = Object.keys(ELJ[S.el].subshells).pop();
      if (k === 'sub') { const [n, l] = [+S.sub[0], 'spdfgh'.indexOf(S.sub[1])]; S.n = n; S.l = l; S.pick = ATM.defaultPick(l, S.fam); }
      if (k === 'free') { S.n = Math.max(S.n, 2); S.l = Math.min(S.l, S.n - 1); S.pick = ATM.defaultPick(S.l, S.fam); }
      refresh();
    }
    function clearModel() {
      S.track.forEach(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); S.track = [];
      while (gModel.children.length) gModel.remove(gModel.children[0]);
      S.lbls.forEach(L => { L.el.remove(); const i = F.labels.indexOf(L); if (i >= 0) F.labels.splice(i, 1); }); S.lbls = []; S.anim = null; S.J = null;
    }
    const keep = o => { S.track.push(o); return o; };
    function addLbl(obj, text, off) { const L = F.label(obj, text, { offset: off || new V3() }); S.lbls.push(L); return L; }

    /* ---- the models ---- */
    function buildDalton(e) {
      const R = ATM.rad(e), m = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), keep(smat(new THREE.Color(ATM.famColor(e.category)), { roughness: 0.55 }))); keep(m.geometry); gModel.add(m);
      S.extentPm = R * 1.25; S.anim = dt => { m.rotation.y += dt * 0.1; };
    }
    function buildThomson(e) {
      const Z = e.Z, R = ATM.rad(e), sph = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), keep(new THREE.MeshStandardMaterial({ color: 0xe59a9a, transparent: true, opacity: 0.30, roughness: 0.7, depthWrite: false })));
      keep(sph.geometry); sph.renderOrder = 2; gModel.add(sph);
      const er = Math.min(R * 0.07, R * 0.34 / Math.cbrt(Z) * 1.0), geo = keep(new THREE.SphereGeometry(er, 16, 12)), im = new THREE.InstancedMesh(geo, keep(smat(0x1f4e8f, { roughness: 0.35 })), Z), M = new THREE.Matrix4();
      for (let i = 0; i < Z; i++) {   // golden-angle spiral filling the ball evenly: illustrative positions
        const u = 1 - 2 * (i + 0.5) / Z, rr = R * 0.8 * Math.cbrt(((i * 0.6180339887) % 1) * 0.9 + 0.1), th = i * 2.399963229728653, s = Math.sqrt(1 - u * u);
        M.makeTranslation(rr * s * Math.cos(th), rr * u, rr * s * Math.sin(th)); im.setMatrixAt(i, M);
      }
      im.userData = { id: 'at_model_electron', priority: 2, title: 'Electron (drawn as a ball)', node: null, onPick: () => { im.userData.node = (typeof NODE !== 'undefined' && NODE.sm_electron) ? 'sm_electron' : 'at_model_thomson'; } };
      gModel.add(im); F.pickables.push(im); S.extentPm = R * 1.25;
    }
    function buildRutherford(e) {
      const Z = e.Z, R = ATM.rad(e), er = Math.min(R * 0.035, 4), geo = keep(new THREE.SphereGeometry(er, 14, 10)), im = new THREE.InstancedMesh(geo, keep(smat(0x1f4e8f, { roughness: 0.35 })), Z), M = new THREE.Matrix4(), rn = AQ.rngMake(Z * 13 + 5);
      const el = [];
      for (let i = 0; i < Z; i++) {
        const r = R * (0.22 + 0.78 * Math.cbrt(rn())), a = new V3(rn() - 0.5, rn() - 0.5, rn() - 0.5).normalize(), b = new V3(rn() - 0.5, rn() - 0.5, rn() - 0.5); b.addScaledVector(a, -b.dot(a)).normalize();
        el.push({ r, a, b, ph: rn() * 6.283, w: 0.9 * Math.pow(R * 0.22 / r, 1.5) + 0.12 });
      }
      const upd = dt => { for (const q of el) { q.ph += q.w * dt; const c = Math.cos(q.ph) * q.r, s = Math.sin(q.ph) * q.r; M.makeTranslation(q.a.x * c + q.b.x * s, q.a.y * c + q.b.y * s, q.a.z * c + q.b.z * s); } };
      const place = () => { el.forEach((q, i) => { const c = Math.cos(q.ph) * q.r, s = Math.sin(q.ph) * q.r; M.makeTranslation(q.a.x * c + q.b.x * s, q.a.y * c + q.b.y * s, q.a.z * c + q.b.z * s); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; };
      im.userData = { id: 'at_model_electron', priority: 2, title: 'Electron (drawn as a ball)', node: null, onPick: () => { im.userData.node = (typeof NODE !== 'undefined' && NODE.sm_electron) ? 'sm_electron' : 'at_model_rutherford'; } };
      im.frustumCulled = false; place(); gModel.add(im); F.pickables.push(im); S.anim = dt => { el.forEach(q => { q.ph += q.w * dt; }); place(); }; S.extentPm = R * 1.25;
    }
    function bohrRadiusPm(n) { return n * n * AQ.A0_PM; }
    function ringMesh(R, tube, col) { const m = new THREE.Mesh(keep(new THREE.TorusGeometry(R, tube, 6, 160)), keep(new THREE.MeshBasicMaterial({ color: col }))); keep(m.geometry); return m; }
    function buildBohr(e) {
      const hue = n => new THREE.Color(...(AQ_SHELL_HUE[Math.min(7, n)] || AQ_SHELL_HUE[7]));
      if (e.Z === 1) {
        const nmax = 6, shown = Math.max(S.bi, 4); S.extentPm = bohrRadiusPm(shown) * 1.2;
        for (let n = 1; n <= nmax; n++) {
          const R = bohrRadiusPm(n), r = ringMesh(R, Math.max(0.5, bohrRadiusPm(shown) * 0.0035), hue(n).multiplyScalar(0.9)); gModel.add(r);
          const a = new THREE.Object3D(); a.position.set(R * Math.cos(0.9), R * Math.sin(0.9), 0); gModel.add(a); addLbl(a, `n = ${n}  (${R.toFixed(n === 1 ? 1 : 0)} pm)`, new V3());
        }
        const eg = keep(new THREE.SphereGeometry(Math.max(2, bohrRadiusPm(shown) * 0.012), 14, 10)), em = new THREE.Mesh(eg, keep(smat(0x1f4e8f, { roughness: 0.35 })));
        em.userData = { id: 'at_model_electron', priority: 2, title: 'Electron (drawn as a ball)', onPick: () => { em.userData.node = (typeof NODE !== 'undefined' && NODE.sm_electron) ? 'sm_electron' : 'at_model_bohr'; } }; gModel.add(em); F.pickables.push(em);
        const st = { ph: 0, rad: bohrRadiusPm(S.bi), n: S.bi };
        // photon: a short wave packet that leaves along a fixed direction
        const mkPhoton = () => {
          const pts = [], L = 1, nW = 4; for (let i = 0; i <= 80; i++) { const t = i / 80; pts.push(new V3(t * L, 0.06 * Math.sin(t * nW * 6.283) * Math.sin(t * 3.1416), 0)); }
          const g = keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.012, 5, false)); const mt = keep(new THREE.MeshBasicMaterial({ color: 0xcc3333 })); const m = new THREE.Mesh(g, mt); m.visible = false; gModel.add(m); return m;
        };
        const ph = mkPhoton(), shownR = bohrRadiusPm(shown);
        S.J = { phase: 'idle', t: 0, ph };
        S.anim = dt => {
          const J = S.J; st.ph += dt * 1.6 / Math.pow(st.n, 1.5) * 2;
          if (J.phase === 'jump') { J.t += dt / 0.8; const k = Math.min(1, J.t); st.rad = bohrRadiusPm(J.ni) + (bohrRadiusPm(J.nf) - bohrRadiusPm(J.ni)) * (k * k * (3 - 2 * k)); if (k >= 1) { J.phase = 'fly'; J.t = 0; st.n = J.nf; ph.visible = true; const rgb = ATM.wlRGB(J.nm); ph.material.color.setRGB(rgb[0], rgb[1], rgb[2]); ph.userData.dir = new V3(Math.cos(J.ang), Math.sin(J.ang), 0); } }
          else if (J.phase === 'fly') { J.t += dt; const d = ph.userData.dir, L = shownR * 0.5, dist = st.rad * 0.5 + J.t * shownR * 0.6; ph.position.copy(d).multiplyScalar(dist); ph.scale.set(L, L, L); ph.rotation.z = Math.atan2(d.y, d.x); if (J.t > 2.6) { ph.visible = false; J.phase = 'wait'; J.t = 0; } }
          else if (J.phase === 'wait') { J.t += dt; if (J.t > 1.2) { J.phase = 'idle'; st.rad = bohrRadiusPm(S.bi); st.n = S.bi; } }
          else { st.rad = bohrRadiusPm(S.bi); st.n = S.bi; }
          em.position.set(st.rad * Math.cos(st.ph), st.rad * Math.sin(st.ph), 0);
        };
        S.bohrJump = (ni, nf, nm) => { S.J.phase = 'jump'; S.J.t = 0; S.J.ni = ni; S.J.nf = nf; S.J.nm = nm; S.J.ang = Math.atan2(em.position.y, em.position.x); };
      } else {
        // a shell diagram: the electrons per shell come from the real configuration; ring spacing is NOT to scale and these are not orbits
        const cnt = ATM.shellCounts(e), ns = Math.max(...Object.keys(cnt).map(Number)), R = ATM.rad(e), er = Math.max(1.2, R * 0.028);
        S.extentPm = R * 1.45; const egeo = keep(new THREE.SphereGeometry(er, 12, 9)), items = [];
        for (let n = 1; n <= ns; n++) {
          const rr = R * 0.22 + (R * 1.1 - R * 0.22) * (n - 1) / Math.max(1, ns - 1) * (ns > 1 ? 1 : 0) + (ns === 1 ? R * 0.5 : 0);
          gModel.add(ringMesh(rr, Math.max(0.35, R * 0.004), hue(n).multiplyScalar(0.9)));
          const em = new THREE.InstancedMesh(egeo, keep(smat(hue(n), { roughness: 0.4 })), cnt[n]); em.frustumCulled = false;
          em.userData = { id: 'at_model_electron', priority: 2, title: `Electron in shell n = ${n}`, onPick: () => { em.userData.node = (typeof NODE !== 'undefined' && NODE.sm_electron) ? 'sm_electron' : 'at_model_bohr'; } };
          gModel.add(em); F.pickables.push(em); items.push({ em, rr, k: cnt[n], n });
          const a = new THREE.Object3D(); a.position.set(rr * Math.cos(0.8), rr * Math.sin(0.8), 0); gModel.add(a); addLbl(a, `${cnt[n]}`, new V3());
        }
        const M = new THREE.Matrix4(); let t = 0;
        const upd = () => items.forEach(q => { for (let i = 0; i < q.k; i++) { const a = t * 0.9 / q.n + i * 6.2832 / q.k; M.makeTranslation(q.rr * Math.cos(a), q.rr * Math.sin(a), 0); q.em.setMatrixAt(i, M); } q.em.instanceMatrix.needsUpdate = true; });
        upd(); S.anim = dt => { t += dt; upd(); };
      }
    }

    /* ---- quantum states ---- */
    function currentSpec() {
      const e = ELJ[S.el], sf = atomShellsFor(S.el); if (!sf) return null;
      const Z = e.Z, nm = ATM.lc(S.el), ion = Z === 1 ? 'hydrogen' : `${nm} with one electron (${S.el}<sup>${Z - 1}+</sup>)`;
      if (S.qmode === 'atom') return { spec: { kind: 'shells', shells: sf.shells, name: `${nm}, Z = ${Z}: all ${Z} electron${Z > 1 ? 's' : ''}` }, html: `${e.name}, Z = ${Z}: ${Z > 1 ? 'every occupied subshell' : 'the single 1s electron'}`, kind: 'shells' };
      if (S.qmode === 'super') {
        const c = 1 / Math.SQRT2, P = { '1s2p0': [{ n: 1, l: 0, m: 0, re: c, im: 0 }, { n: 2, l: 1, m: 0, re: c, im: 0 }], '1s2p1': [{ n: 1, l: 0, m: 0, re: c, im: 0 }, { n: 2, l: 1, m: 1, re: c, im: 0 }], '1s2s': [{ n: 1, l: 0, m: 0, re: c, im: 0 }, { n: 2, l: 0, m: 0, re: c, im: 0 }] }[S.sup];
        const t = { '1s2p0': '1s + 2p (m = 0)', '1s2p1': '1s + 2p (m = +1)', '1s2s': '1s + 2s' }[S.sup];
        return { spec: { kind: 'super', Z, comps: P, name: `${nm}: ${t}` }, html: `${ion}: ${t}`, kind: 'super' };
      }
      const L = ATM.pickList(S.l, S.fam), pk = L[Math.min(S.pick, L.length - 1)];
      if (S.src === 'free') {
        const lab = S.fam === 'complex' ? `n = ${S.n}, l = ${S.l}, m = ${ATM.sgn(pk.m)}` : `n = ${S.n}, l = ${S.l}, ${pk.label} (real orbital)`;
        return { spec: { kind: 'orbital', Z, n: S.n, l: S.l, m: pk.m, real: pk.real, name: `${nm} ${lab}` }, html: `${ion} ${lab}`, kind: 'orbital', free: true, pk };
      }
      const key = S.sub, zf = (sf.shells.find(q => q.key === key) || {}).zeff || Z, occ = e.subshells[key] || 0;
      const lab = S.fam === 'complex' ? `m = ${ATM.sgn(pk.m)}` : `${pk.label} (real orbital)`;
      return { spec: { kind: 'orbital', Z, zeff: zf, n: S.n, l: S.l, m: pk.m, real: pk.real, name: `${nm} ${key}, ${lab}` }, html: `${e.name}, ${key} subshell (${occ} electron${occ > 1 ? 's' : ''}), ${lab}`, kind: 'orbital', pk, key, zf, occ };
    }
    function buildStrip(e) {
      strip.innerHTML = '';
      const lab = document.createElement('span'); lab.className = 'stl'; lab.textContent = 'Electrons by subshell:'; strip.appendChild(lab);
      Object.entries(e.subshells).forEach(([k, occ]) => {
        const l = 'spdfgh'.indexOf(k[1]), cap = 2 * (2 * l + 1), b = document.createElement('button'); b.className = 'sub' + (S.qmode === 'orbital' && S.src === 'sub' && S.sub === k ? ' on' : '');
        b.dataset.k = k; b.style.setProperty('--c', AQ_SHELL_CSS[Math.min(7, +k[0])]); b.innerHTML = `${k}<sup>${occ}</sup>`;
        b.title = `${k}: ${occ} of ${cap} electrons. Show this subshell's orbitals.`; b.onclick = () => { S.sub = k; setMode('sub'); modeSeg.setK('sub'); };
        strip.appendChild(b);
      });
    }

    function nucleusInfo() {
      const e = ELJ[S.el], A = ATM.curA(S.el), N = A - e.Z, Rf = ATM.nucleusRadiusFm(A), rat = ATM.rad(e) / (Rf * 1e-3), mu = 0.000548579909, frac = 1 - e.Z * mu / (e.mass || A);
      return { title: `Nucleus of ${ATM.isoName(S.el, A)}`, tag: 'Atomic nucleus', body: `<p>${e.Z} proton${e.Z > 1 ? 's' : ''} and ${N} neutron${N === 1 ? '' : 's'}: ${A} nucleons packed together. The nucleus is at its true size here: about ${Rf.toFixed(1)} femtometres across the radius, which is roughly ${ATM.fmt(rat, 2)} times smaller than the atom’s empirical radius, so at this zoom it is far too small to see. The electrons together weigh only about ${(100 * (1 - frac)).toFixed(3)}% of the atom, so the nucleus holds about ${(100 * frac).toFixed(2)}% of the mass.</p><p>Keep zooming in at the centre to go inside.</p>`,
        facts: [['Protons (Z)', e.Z], ['Neutrons (N)', N], ['Mass number (A)', A], ['Radius ≈ 1.2 × A^⅓ fm', `≈ ${Rf.toFixed(1)} fm`]], deep: { d: 'The size rule R ≈ r₀ A^⅓ with r₀ ≈ 1.2 fm says nuclear matter has almost constant density, so volume grows in proportion to the number of nucleons. It is an average over nuclei; measured charge radii vary from it by tenths of a femtometre.', x: 'Mass fraction here is 1 − Z mₑ / m(atom), ignoring electron binding energy (about 10⁻⁷ of the mass for light atoms). The radius rule is an empirical average, not a measurement of this isotope.', r: [] } };
    }
    nucHit.userData.infoFn = nucleusInfo;

    function fit() { if (cam.A === F && !fly) flyTo(F, new V3(), Math.max(S.extentPm * 3.6e-12, 3e-13)); }
    F.fit = fit;
    function updateProxies() {
      const e = ELJ[S.el], A = ATM.curA(S.el), rn = ATM.nucleusRadiusFm(A) * 1e-3;
      hitMain.scale.setScalar(S.extentPm / 100); nucTrue.scale.setScalar(rn); nucHit.scale.setScalar(Math.max(1, S.extentPm / 60) / 3 * 3 / 3);
      nucHit.userData.radius = () => Math.max(1, S.extentPm / 60);
      F.r1 = Math.max(2.5e-9, S.extentPm * 1e-12 * 16); F.radius = Math.max(600, S.extentPm * 1.6);
      hitMain.userData.title = `${e.name} atom`;
      hitMain.userData.node = null; hitMain.userData.infoFn = null;
      if (S.model === 'quantum') {
        if (S.qmode === 'atom') hitMain.userData.node = 'at_el_' + S.el;
        else if (S.qmode === 'super') hitMain.userData.node = 'at_superposition';
        else hitMain.userData.node = 'at_orbital';
      } else hitMain.userData.node = ATM.MODELS[S.model].node;
      if (typeof NODE !== 'undefined' && !NODE[hitMain.userData.node]) { hitMain.userData.node = null; hitMain.userData.infoFn = () => elInfo(S.el); }
      if (S.model === 'quantum' && S.qmode === 'atom') hitMain.userData.title = `${e.name} atom (click for the element card)`;
      cloud.marker.visible = true;
      nucAnchor.position.set(0, 0, 0); nucLbl.el.textContent = S.model === 'quantum' || S.model === 'bohr' || S.model === 'rutherford' ? 'Nucleus (true size, far too small to see)' : '';
      if (S.model === 'dalton' || S.model === 'thomson') { cloud.marker.visible = false; nucLbl.el.textContent = ''; }
    }
    function updateNote() {
      const e = ELJ[S.el], M = ATM.MODELS[S.model]; let h = '', head = '', links = [];
      const fromMol = F.parent && /^(mol|crystal|liquid|gas)$/.test(F.parent.type);
      if (S.model === 'quantum') {
        const cs = S.cs || (S.cs = currentSpec()); if (!cs) { note.innerHTML = ''; return; }
        head = cs.html; const sp = cs.spec;
        if (cs.kind === 'shells') { h = ATM.tipShells(e, (ATOM_ZEFF.elements[S.el] || {}).method); links = [['at_orbital', 'Electron cloud and orbitals'], ['at_configuration', 'Electron configuration'], ['at_zeff', 'Effective nuclear charge']]; }
        else if (cs.kind === 'orbital') {
          h = ATM.tipOrbital(sp, cloud); links = [['at_orbital', 'Electron cloud and orbitals'], ['at_quantum_numbers', 'Quantum numbers'], ['at_probability_current', 'The flow of probability']];
          if (!cs.free) h = `<p>${cs.key} holds ${cs.occ} electron${cs.occ > 1 ? 's' : ''} here (at most ${2 * (2 * sp.l + 1)}: two for each of the ${2 * sp.l + 1} orbitals, with opposite spins). One orbital is shown, as a hydrogen-like cloud shrunk by an effective nuclear charge of ${cs.zf.toFixed(2)}, so its size is approximate. In a many-electron atom the occupied orbitals together make a spherical atom; this is one piece of it.</p>` + h;
          else if (e.Z > 1) h = `<p>This is not the ${ATM.lc(S.el)} atom but a hydrogen-like ion: the ${ATM.lc(S.el)} nucleus with a single electron. For one electron the mathematics is exact (apart from relativity, which matters more as Z grows), so the shapes and sizes are exact, and the cloud is ${e.Z}× tighter than in hydrogen.</p>` + h;
        } else { h = ATM.tipSuper(sp, cloud, S.sup); links = [['at_spectra', 'Atomic spectra'], ['at_wavefunction', 'Wavefunction and probability']]; if (e.Z > 1) h = `<p>A hydrogen-like ion of ${ATM.lc(S.el)} (one electron).</p>` + h; }
      } else {
        head = M.title; h = `<p><b>The idea.</b> ${M.what}</p><p><b>What it explained.</b> ${M.evidence}</p><p><b>What ended it.</b> ${M.killed}</p>`;
        if (S.model === 'bohr') h += e.Z === 1 ? '<p><b>What is exact.</b> This is hydrogen, where the model’s ring radii n²a₀ and its line colours are correct (the radii as mean distances are not: the true electron has no orbit). Choose two levels and press the button to see the light the jump would give, computed from the Rydberg formula.</p><p class="scale">Electron and photon sizes are exaggerated; the photon wave is a drawing, not a measurement.</p>' : `<p><b>What this shows.</b> A shell diagram: the number of electrons in each shell n, added up from the real configuration of ${ATM.lc(S.el)}. The ring spacing is not to scale and these are not orbits: Bohr’s picture only works for one-electron atoms. For this element the quantum view is the better description.</p>`;
        else if (M.scale) h += `<p class="scale"><b>What is drawn.</b> ${M.scale}</p>`;
        links = [['at_models', 'The historical models'], [M.node, M.title]];
      }
      if (fromMol) h += `<p class="from"><b>You came here from a molecule.</b> This is a free atom, alone in space. In a molecule the outer electrons are shared in bonds, so the outer cloud there is reshaped, while the inner shells are almost unchanged.</p>`;
      note.innerHTML = `<button class="noteHead" aria-label="Show or hide the explanation"><span class="nl">${head}</span><span class="nx">What this picture is</span></button><div class="noteBody">${h}<div class="nlinks">${links.filter(l => typeof NODE === 'undefined' || NODE[l[0]]).map(l => `<button class="chip" data-n="${l[0]}">${l[1]}</button>`).join(' ')}</div></div>`;
    }
    function updateUI() {
      const e = ELJ[S.el], isQ = S.model === 'quantum', isB = S.model === 'bohr';
      btnEl.innerHTML = `Element: ${e.name} (${e.symbol}) · periodic table`;
      modelSeg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === S.model));
      panel.style.display = isQ ? '' : 'none'; specBox.style.display = isB || isQ && S.qmode === 'super' ? '' : 'none'; bohrBar.style.display = isB && e.Z === 1 ? '' : 'none';
      const mode = S.qmode === 'orbital' ? (S.src === 'free' ? 'free' : 'sub') : S.qmode === 'free' ? 'free' : S.qmode;
      modeSeg.setK(S.qmode === 'orbital' ? (S.src === 'free' ? 'free' : 'sub') : S.qmode);
      r2.style.display = S.qmode === 'orbital' && S.src === 'sub' || S.qmode === 'atom' ? '' : 'none'; buildStrip(e);
      const orb = S.qmode === 'orbital';
      famSeg.style.display = orb ? '' : 'none'; nSel.style.display = lSel.style.display = orb && S.src === 'free' ? '' : 'none'; pSel.style.display = orb ? '' : 'none'; supSel.style.display = S.qmode === 'super' ? '' : 'none';
      r3.style.display = orb || S.qmode === 'super' ? '' : 'none';
      if (orb) {
        if (S.src === 'free') { nSel.set([1, 2, 3, 4, 5, 6, 7].map(v => [v, 'n = ' + v]), S.n); lSel.set([...Array(S.n).keys()].map(v => [v, `l = ${v} (${'spdfghi'[v]})`]), S.l); }
        const L = ATM.pickList(S.l, S.fam); S.pick = Math.min(S.pick, L.length - 1); pSel.set(L.map((q, i) => [i, q.label]), S.pick);
      }
      const iso = ATM.isoList(S.el); r5.style.display = iso.length > 1 ? '' : 'none'; isoSel.set(iso.map(x => [x.A, ATM.isoLabel(S.el, x)]), ATM.curA(S.el));
      cutBtn.style.display = isQ ? '' : 'none'; flowBtn.style.display = isQ && (S.qmode === 'super' || S.qmode === 'orbital' && S.src && cloud.flows) ? '' : 'none';
      syncToggles();
      // spectrum widget
      if (isB || isQ && S.qmode === 'super') specBox.innerHTML = specHTML();
      F.blurb = `${e.name} atom, drawn with ${isQ ? 'the quantum model' : ATM.MODELS[S.model].title + '’s model'}. The nucleus is at its true size: invisible at this zoom.`;
      F.note = isQ ? 'Sizes in the many-electron cloud are approximate (orbital approximation).' : 'A historical model, drawn to show the idea, not the truth.';
      if (typeof capFrame !== 'undefined' && capFrame === F) { const n = document.getElementById('capN'), d = document.getElementById('capD'), t = document.getElementById('capNote'); if (n) n.textContent = F.name; if (d) d.textContent = F.blurb; if (t) t.textContent = F.note; }
    }
    function specHTML() {
      const e = ELJ[S.el], lines = [], L = ATM.data.lines; let cap = '';
      if (S.model === 'quantum') return '<div class="sh">Light from this atom</div><p>The beat of the two states, (E₂ − E₁)/h, is the frequency of the light the atom gives out when it drops from the upper to the lower state. For hydrogen that is the 121.567 nm line of the Lyman series.</p>';
      if (e.Z === 1 && L) { L.hydrogen.lines.filter(x => x.wl_air_nm && x.wl_air_nm > 380 && x.wl_air_nm < 780).forEach(x => lines.push({ nm: x.wl_air_nm, t: `n = ${x.n_upper} → ${x.n_lower}, ${x.wl_air_nm.toFixed(2)} nm` })); cap = 'The visible hydrogen lines (Balmer series, computed from the Rydberg formula; wavelengths in air).'; }
      else if (L && L.elements[e.symbol] && L.elements[e.symbol].length) { L.elements[e.symbol].forEach(x => lines.push({ nm: x.wl_nm, t: `${x.wl_nm.toFixed(3)} nm (relative intensity ${x.intensity})` })); cap = `The strongest visible lines of neutral ${ATM.lc(S.el)} listed by the NIST Atomic Spectra Database (air wavelengths; intensities are NIST’s own scale, so only compare within one element). They come from transitions between many-electron levels, which a Bohr diagram cannot calculate.`; }
      else cap = `No visible emission lines were retrieved for ${ATM.lc(S.el)}; that does not mean it emits none.`;
      const tick = x => `<i style="left:${((x.nm - 380) / 400 * 100).toFixed(2)}%;background:rgb(${ATM.wlRGB(x.nm).map(v => Math.round(v * 255)).join(',')})" title="${x.t}"></i>`;
      return `<div class="sh">Visible spectrum, 380–780 nm</div><div class="sbar">${lines.map(tick).join('')}<b id="sHi" style="display:none"></b></div><p id="sTxt">${cap}</p>`;
    }
    function bohrEmit() {
      const ni = S.bi, nf = S.bf, D = ATM.data.lines && ATM.data.lines.hydrogen; if (!D || !S.bohrJump || S.J.phase !== 'idle') return;
      const RH = D.R_H_per_m, vac = 1e9 / (RH * (1 / (nf * nf) - 1 / (ni * ni))), ent = D.lines.find(x => x.n_lower === nf && x.n_upper === ni), air = ent && ent.wl_air_nm, nm = air || vac;
      S.bohrJump(ni, nf, nm);
      const ser = ent ? ent.series : nf === 3 ? 'Paschen' : nf === 4 ? 'Brackett' : 'Pfund';
      const txt = $('#sTxt'), hi = $('#sHi');
      if (txt) txt.innerHTML = `<b>n = ${ni} → ${nf}</b> (${ser} series): ${vac.toFixed(2)} nm in vacuum${air ? `, ${air.toFixed(2)} nm in air` : ''}: ${ATM.colorName(vac)}. The energy given to the photon is 13.6 eV × (1/${nf}² − 1/${ni}²) = ${(13.605693 * (1 / (nf * nf) - 1 / (ni * ni))).toFixed(3)} eV (reduced-mass correction ignored here).`;
      if (hi) { if (nm > 380 && nm < 780) { hi.style.display = ''; hi.style.left = ((nm - 380) / 400 * 100) + '%'; } else hi.style.display = 'none'; }
    }

    function refresh(fitAfter) {
      const e = ELJ[S.el]; S.cs = null; clearModel();
      F.pickables.length = 0; F.pickables.push(hitMain, nucHit);
      if (S.model === 'quantum') {
        gModel.visible = false; cloud.group.visible = true;
        if (!ATOM_ZEFF) { ATM.load().then(() => { if (F.built) refresh(); }); return; }
        const cs = S.cs = currentSpec(); if (!cs) return;
        cloud.setCut(S.cut); cloud.setFlow(S.flow); cloud.setState(cs.spec); S.extentPm = cloud.extent * AQ.A0_PM;
        if (cs.kind === 'orbital' && cloud.flows === false) S.flowNote = 0;
      } else {
        cloud.group.visible = false; gModel.visible = true;
        ({ dalton: buildDalton, thomson: buildThomson, rutherford: buildRutherford, bohr: buildBohr }[S.model])(e);
        if (S.model === 'bohr' && e.Z === 1) syncBohr();
      }
      updateProxies(); updateNote(); updateUI();
      if (fitAfter) fit();
    }
    F.refreshAtom = refresh;
    F.setElement = (sym, o2) => {
      if (!ELJ[sym]) return; S.el = sym; F.opts.el = sym; F.name = `${ATM.name(sym)} atom`; S.sub = null; S.bi = 3; S.bf = 2;
      if (S.qmode === 'orbital' && S.src === 'sub') S.qmode = 'atom';
      if (S.qmode === 'atom' || S.src === 'sub') { /* keep */ }
      ATM.retargetNucleus(F); ATM.relabel(F); refresh(!(o2 && o2.noFit));
    };
    F.spawnD = 2e-13; F.attract = new V3(); F.attractD = 1.2e-10; F.attractR = 250;
    F.spawn = T => {
      if (T.length() >= 0.5) return null;
      const e = ELJ[S.el], A = ATM.curA(S.el);
      return new Frame({ type: 'nucleus', pinned: true, name: `${ATM.isoName(S.el, A)} nucleus`, unit: 1e-15, radius: 40, r0: 1.5e-15, r1: 3e-13, spawnD: 4e-15, pos: new V3(), opts: { Z: e.Z, N: A - e.Z, el: S.el } });
    };
    F.update = dt => {
      const v = new THREE.Vector2(); renderer.getDrawingBufferSize(v); cloud.setView(v.y, 50);
      if (S.model === 'quantum') cloud.update(dt);
      if (S.anim) S.anim(dt);
      const on = typeof capFrame !== 'undefined' && capFrame === F; note.classList.toggle('on', on);
      // arriving by a landmark flight that ends too close for this atom: ease back so the whole atom is in view
      if (cam.A !== F) S.fitDone = false;
      else if (!S.fitDone && !fly) { S.fitDone = true; if (cam.D < S.extentPm * 2.6e-12) fit(); }
    };
    F.name = F.name || `${ATM.name(S.el)} atom`;
    syncToggles(); syncBohr();
    ATM.load().then(() => { if (F.built) refresh(); });
    refresh();
  }
};
