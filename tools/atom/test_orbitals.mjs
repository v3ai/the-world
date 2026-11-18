// Numerical proof of the orbital mathematics in js/atom.js (the AQ object).
// Run:  /home/rhett/projects/how/.devtools/venv/bin/node tools/atom/test_orbitals.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', '..', 'js', 'atom.js'), 'utf8');
const ctx = vm.createContext({ console, Math });     // no THREE, no FT: only the pure maths runs
const AQ = vm.runInContext(src + '\n;AQ', ctx);

let fails = 0, checks = 0;
function check(name, ok, detail) { checks++; if (!ok) { fails++; console.log('FAIL', name, detail ?? ''); } }
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// ---------- numerical integration helpers ----------
function simpson(f, a, b, N) { if (N % 2) N++; const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
const radInt = (n, l, Z, g) => simpson(r => r * r * g(r), 0, AQ.rMaxFor(n, Z) * 1.2, 40000);

const Zs = [1, 2.5, 8];
// ---------- 1. radial normalisation, <r>, node count, orthogonality ----------
let nStates = 0;
for (const Z of Zs) for (let n = 1; n <= 7; n++) for (let l = 0; l <= Math.min(n - 1, 6); l++) {   // the brief asks for l <= 4; the interface also offers l = 5, 6 for n = 6, 7
  nStates++;
  const norm = radInt(n, l, Z, r => { const R = AQ.radial(n, l, Z, r); return R * R; });
  check(`norm n=${n} l=${l} Z=${Z}`, near(norm, 1, 1e-7), norm);
  const mr = radInt(n, l, Z, r => { const R = AQ.radial(n, l, Z, r); return r * R * R; });
  const want = (3 * n * n - l * (l + 1)) / (2 * Z);
  check(`<r> n=${n} l=${l} Z=${Z}`, near(mr, want, 1e-7), `${mr} vs ${want}`);
  // radial nodes = number of sign changes of R on (0, rmax) = n-l-1
  let sc = 0, prev = 0; const rmax = AQ.rMaxFor(n, Z);
  for (let i = 1; i <= 200000; i++) { const v = AQ.radial(n, l, Z, rmax * i / 200000); if (prev !== 0 && v * prev < 0) sc++; if (v !== 0) prev = v; }
  check(`nodes n=${n} l=${l} Z=${Z}`, sc === n - l - 1, `${sc} vs ${n - l - 1}`);
  // orthogonality of different n at the same l
  for (let n2 = l + 1; n2 < n; n2++) {
    const ov = radInt(n, l, Z, r => AQ.radial(n, l, Z, r) * AQ.radial(n2, l, Z, r));
    check(`orthogonal (${n},${n2}) l=${l} Z=${Z}`, Math.abs(ov) < 1e-7, ov);
  }
  // analytic dR/dr against a central difference
  for (const r of [0.37 / Z, 1.9 / Z, 6.3 / Z * n]) {
    const h = 1e-5, num = (AQ.radial(n, l, Z, r + h) - AQ.radial(n, l, Z, r - h)) / (2 * h), an = AQ.radialDeriv(n, l, Z, r);
    check(`dR/dr n=${n} l=${l}`, Math.abs(num - an) < 1e-6 * Math.max(1, Math.abs(an)), `${num} vs ${an}`);
  }
}
console.log(`radial: ${nStates} (n,l,Z) combinations checked (norm, <r>, nodes, orthogonality, derivative)`);
// 1s most probable radius = 1/Z
for (const Z of Zs) {
  let best = 0, br = 0; for (let i = 1; i < 100000; i++) { const r = 10 * i / 100000 / Z; const R = AQ.radial(1, 0, Z, r), p = r * r * R * R; if (p > best) { best = p; br = r; } }
  check(`1s peak radius Z=${Z}`, near(br, 1 / Z, 2e-4), br);
}
// Known value: R_10(r) = 2 Z^1.5 e^{-Zr}; R_21(r) = (1/sqrt24) Z^1.5 (Zr) e^{-Zr/2}
check('R10 closed form', near(AQ.radial(1, 0, 1, 0.7), 2 * Math.exp(-0.7), 1e-12));
check('R21 closed form', near(AQ.radial(2, 1, 1, 1.3), (1 / Math.sqrt(24)) * 1.3 * Math.exp(-0.65), 1e-12));
check('R20 closed form', near(AQ.radial(2, 0, 1, 1.3), (1 / Math.sqrt(2)) * (1 - 1.3 / 2) * Math.exp(-0.65), 1e-12));

// ---------- 2. spherical harmonics ----------
for (let l = 0; l <= 6; l++) for (let m = -l; m <= l; m++) {
  const nrm = 2 * Math.PI * simpson(th => { const t = AQ.theta(l, m, th); return t * t * Math.sin(th); }, 0, Math.PI, 20000);
  check(`int|Y|^2 l=${l} m=${m}`, near(nrm, 1, 1e-9), nrm);
  const nx = 2 * Math.PI * simpson(x => AQ.ang2(l, m, x), -1, 1, 20000);
  check(`int ang2 dx l=${l} m=${m}`, near(nx, 1, 1e-9), nx);
  for (const th of [0.4, 1.1, 2.3]) {
    const h = 1e-6, num = (AQ.theta(l, m, th + h) - AQ.theta(l, m, th - h)) / (2 * h), an = AQ.thetaDeriv(l, m, th);
    check(`dTheta l=${l} m=${m}`, Math.abs(num - an) < 1e-6, `${num} vs ${an}`);
  }
}
// orthogonality between different l and different m (same n) : int Y_lm Y*_l'm' = delta
for (const [l1, m1, l2, m2] of [[1, 0, 2, 0], [2, 1, 3, 1], [3, 2, 1, 2 - 1], [4, 2, 2, 2]]) {
  if (m1 !== m2) continue;
  const ov = 2 * Math.PI * simpson(th => AQ.theta(l1, m1, th) * AQ.theta(l2, m2, th) * Math.sin(th), 0, Math.PI, 20000);
  check(`Y orthogonal ${l1},${l2} m=${m1}`, Math.abs(ov) < 1e-9, ov);
}
// known forms: Y10 = sqrt(3/4pi) cos; Y11 = -sqrt(3/8pi) sin e^{i phi}; Y2-1 = +sqrt(15/8pi) sin cos e^{-i phi}
check('Y10', near(AQ.theta(1, 0, 0.8), Math.sqrt(3 / (4 * Math.PI)) * Math.cos(0.8), 1e-12));
check('Y11', near(AQ.theta(1, 1, 0.8), -Math.sqrt(3 / (8 * Math.PI)) * Math.sin(0.8), 1e-12));
check('Y2-1', near(AQ.theta(2, -1, 0.8), Math.sqrt(15 / (8 * Math.PI)) * Math.sin(0.8) * Math.cos(0.8), 1e-12));
check('Y20', near(AQ.theta(2, 0, 0.8), Math.sqrt(5 / (16 * Math.PI)) * (3 * Math.cos(0.8) ** 2 - 1), 1e-12));
// real orbitals are sums of +m and -m: (Y_{-m} + (-1)^m Y_m)/sqrt2 = sqrt2 Theta_{l,|m|}-part cos(m phi) (up to sign convention)
for (const [l, m] of [[1, 1], [2, 1], [2, 2], [3, 2]]) {
  const ph = 0.9, th = 1.2, Yp = [AQ.theta(l, m, th) * Math.cos(m * ph), AQ.theta(l, m, th) * Math.sin(m * ph)], Ym = [AQ.theta(l, -m, th) * Math.cos(-m * ph), AQ.theta(l, -m, th) * Math.sin(-m * ph)];
  const sg = m % 2 ? -1 : 1, re = (Ym[0] + sg * Yp[0]) / Math.SQRT2, im = (Ym[1] + sg * Yp[1]) / Math.SQRT2;
  const direct = Math.SQRT2 * AQ.theta(l, -m, th) * Math.cos(m * ph);
  check(`real combo l=${l} m=${m}`, near(re, direct, 1e-12) && Math.abs(im) < 1e-12, `${re} ${im} ${direct}`);
}

// ---------- 3. samplers: Kolmogorov-Smirnov against the exact CDF ----------
function ksD(samples, cdfAt) { const s = Float64Array.from(samples).sort(); const N = s.length; let D = 0; for (let i = 0; i < N; i++) { const F = cdfAt(s[i]); D = Math.max(D, Math.abs((i + 1) / N - F), Math.abs(i / N - F)); } return D; }
function exactCdf(f, a, b, N = 20000) { const xs = new Float64Array(N + 1), cs = new Float64Array(N + 1), h = (b - a) / N; let acc = 0, prev = f(a); for (let i = 1; i <= N; i++) { const cur = f(a + i * h); acc += 0.5 * (prev + cur) * h; cs[i] = acc; prev = cur; } for (let i = 0; i <= N; i++) { xs[i] = a + i * h; cs[i] /= acc; } return x => { const i = Math.min(N - 1, Math.max(0, Math.floor((x - a) / h))); return cs[i] + (cs[i + 1] - cs[i]) * ((x - xs[i]) / h); }; }
const NS = 30000, crit = 1.95 / Math.sqrt(NS);   // KS critical value at alpha = 0.001
let ksCount = 0, ksWorst = 0;
for (let n = 1; n <= 7; n++) for (let l = 0; l <= Math.min(n - 1, 6); l++) {
  const Z = n % 2 ? 1 : 3.7, d = AQ.sampleOrbital(n, l, 0, Z, NS, { seed: 100 + n * 10 + l });
  const F = exactCdf(r => { const R = AQ.radial(n, l, Z, r); return r * r * R * R; }, 0, AQ.rMaxFor(n, Z));
  const D = ksD(d.r, F); ksCount++; ksWorst = Math.max(ksWorst, D); check(`KS r n=${n} l=${l}`, D < crit, `D=${D} crit=${crit}`);
  // the dots really are at (s, z, phi): s^2 + z^2 = r^2
  let bad = 0; for (let i = 0; i < 2000; i++) if (Math.abs(Math.hypot(d.s[i], d.z[i]) - d.r[i]) > 1e-3 * Math.max(1, d.r[i])) bad++; check(`s,z consistent n=${n} l=${l}`, bad === 0, bad);
}
for (let l = 0; l <= 6; l++) for (let m = -l; m <= l; m++) {
  const d = AQ.sampleOrbital(l + 1, l, m, 1, NS, { seed: 5000 + 20 * l + m + 10 });
  const F = exactCdf(x => AQ.ang2(l, m, x), -1, 1);
  const D = ksD(Array.from(d.z, (z, i) => z / d.r[i]), F); ksCount++; ksWorst = Math.max(ksWorst, D); check(`KS cos(theta) l=${l} m=${m}`, D < crit, `D=${D} crit=${crit}`);
}
for (const [kind, m] of [['cos', 1], ['sin', 2], ['cos', 3]]) {
  const d = AQ.sampleOrbital(4, 3, m, 1, NS, { seed: 77 + m, kind });
  const two = 2 * Math.PI, F = kind === 'cos' ? exactCdf(p => Math.cos(m * p) ** 2, 0, two) : exactCdf(p => Math.sin(m * p) ** 2, 0, two);
  const D = ksD(Array.from(d.phi, p => ((p % two) + two) % two), F); ksCount++; ksWorst = Math.max(ksWorst, D); check(`KS phi real ${kind} m=${m}`, D < crit, `D=${D} crit=${crit}`);
}
// complex states: phi uniform
{ const d = AQ.sampleOrbital(3, 1, 1, 1, NS, { seed: 9 }); const D = ksD(d.phi, p => p / (2 * Math.PI)); ksCount++; check('KS phi uniform (complex)', D < crit, D); }
console.log(`samplers: ${ksCount} KS tests, worst D = ${ksWorst.toFixed(5)} (critical ${crit.toFixed(5)} at alpha 0.001)`);

// ---------- 4. the flow: v = Im(grad psi / psi) = m/(r sin theta) phi-hat ----------
for (const [n, l, m] of [[2, 1, 1], [2, 1, -1], [3, 2, 2], [3, 2, -1], [4, 3, 3], [5, 1, 1], [3, 2, 0], [1, 0, 0]]) {
  let worst = 0;
  for (let k = 0; k < 40; k++) {
    const r = 1 + 6 * (k % 7) / 7 + 0.01 * k, th = 0.3 + 2.4 * ((k * 37) % 41) / 41, ph = 0.2 + k * 0.7;
    const comp = [{ n, l, m, re: 1, im: 0 }];
    const p = AQ.superEval(comp, 1, r, th, ph, 0); if (p.re * p.re + p.im * p.im < 1e-14) continue;
    const v = AQ.velocitySph(comp, 1, r, th, ph, 0);
    worst = Math.max(worst, Math.abs(v.vr), Math.abs(v.vt), Math.abs(v.vp - m / (r * Math.sin(th))) / Math.max(1, Math.abs(m / (r * Math.sin(th)))));
  }
  check(`current of (${n},${l},${m}) is m/(r sin th) phi-hat`, worst < 1e-9, worst);
}
// gradient of psi against central differences of psi (Cartesian) for a superposition
{
  const comps = [{ n: 1, l: 0, m: 0, re: 0.8, im: 0 }, { n: 2, l: 1, m: 1, re: 0.3, im: 0.4 }, { n: 3, l: 2, m: -1, re: -0.2, im: 0.1 }], Z = 1, t = 1.3;
  const psi = (x, y, z) => { const r = Math.hypot(x, y, z), th = Math.acos(z / r), ph = Math.atan2(y, x); const p = AQ.superEval(comps, Z, r, th, ph, t); return [p.re, p.im]; };
  let worst = 0;
  for (const [x, y, z] of [[1.1, 0.4, 0.8], [-2, 1, 1.5], [0.5, -0.7, -1.2], [3, 2, -0.5]]) {
    const v = AQ.cartVel(comps, Z, x, y, z, t, [0, 0, 0]), h = 1e-5, p0 = psi(x, y, z), d = p0[0] ** 2 + p0[1] ** 2, num = [0, 0, 0];
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((e, i) => { const a = psi(x + h * e[0], y + h * e[1], z + h * e[2]), b = psi(x - h * e[0], y - h * e[1], z - h * e[2]); const g = [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)]; num[i] = (g[1] * p0[0] - g[0] * p0[1]) / d; });
    worst = Math.max(worst, Math.hypot(num[0] - v[0], num[1] - v[1], num[2] - v[2]));
  }
  check('analytic grad psi (superposition) matches finite differences', worst < 1e-5, worst);
}

// ---------- 5. superposition: dots driven by the current keep following |psi(t)|^2 ----------
{
  const Z = 1, comps = [{ n: 1, l: 0, m: 0, re: 1 / Math.SQRT2, im: 0 }, { n: 2, l: 1, m: 0, re: 1 / Math.SQRT2, im: 0 }];
  const dE = AQ.energy(2, Z) - AQ.energy(1, Z), Tper = 2 * Math.PI / dE, N = 6000;
  // frequency and wavelength of the Lyman-alpha line (reduced-mass hydrogen)
  const fInf = dE * AQ.HARTREE_HZ, fH = fInf / (1 + AQ.ME_OVER_MP);
  check('E2-E1 = 3/8 hartree', near(dE, 0.375, 1e-12));
  check('frequency of 1s+2p0 beat = 2.466e15 Hz', near(fH, 2.466e15, 5e-4), fH);
  const lam = 299792458 / fH * 1e9;
  check('Lyman-alpha wavelength: 121.567 nm observed (NIST), 121.568 nm for the bare 2-1 gap', Math.abs(lam - 121.567) < 0.002, lam);
  console.log(`1s+2p0: dE = ${dE} hartree, beat frequency ${fH.toExponential(4)} Hz (${fInf.toExponential(4)} for infinite nuclear mass), lambda = ${lam.toFixed(3)} nm, period = ${(Tper * AQ.AU_TIME_S).toExponential(3)} s`);
  const s0 = AQ.sampleSuper(comps, Z, N, 0, { seed: 21 });
  console.log(`rejection sampler efficiency: ${(N / s0.tries * 100).toFixed(1)}%`);
  const P = new Float64Array(3 * N); for (let i = 0; i < N; i++) { const st = Math.sin(s0.th[i]); P[3 * i] = s0.r[i] * st * Math.cos(s0.ph[i]); P[3 * i + 1] = s0.r[i] * st * Math.sin(s0.ph[i]); P[3 * i + 2] = s0.r[i] * Math.cos(s0.th[i]); }
  let t = 0; const dt = Tper / 40, crit2 = 1.95 * Math.sqrt(2 / N), Ds = [];   // two-sample KS, alpha = 0.001
  let worst = 0, mz = [];
  for (let step = 1; step <= 100; step++) {          // 2.5 periods
    AQ.advance(P, comps, Z, t, dt); t += dt;
    if (step % 10 === 0) {
      const ref = AQ.sampleSuper(comps, Z, N, t, { seed: 1000 + step });
      const zs = Array.from({ length: N }, (_, i) => P[3 * i + 2]).sort((a, b) => a - b), rs = Array.from({ length: N }, (_, i) => Math.hypot(P[3 * i], P[3 * i + 1], P[3 * i + 2])).sort((a, b) => a - b);
      const zr = Array.from(ref.r, (r, i) => r * Math.cos(ref.th[i])).sort((a, b) => a - b), rr = Array.from(ref.r).sort((a, b) => a - b);
      const ks2 = (A, B) => { let i = 0, j = 0, D = 0; while (i < A.length && j < B.length) { if (A[i] <= B[j]) i++; else j++; D = Math.max(D, Math.abs(i / A.length - j / B.length)); } return D; };
      const Dz = ks2(zs, zr), Dr = ks2(rs, rr); worst = Math.max(worst, Dz, Dr); Ds.push(Math.max(Dz, Dr).toFixed(3));
      const mean = a => a.reduce((x, y) => x + y, 0) / a.length; mz.push([t / Tper, mean(zs), mean(zr)]);
      check(`dots follow |psi|^2 at t=${(t / Tper).toFixed(2)}T (z, r KS)`, Dz < crit2 && Dr < crit2, `Dz=${Dz.toFixed(4)} Dr=${Dr.toFixed(4)} crit=${crit2.toFixed(4)}`);
    }
  }
  console.log(`superposition equivariance: worst two-sample KS D = ${worst.toFixed(4)} (critical ${crit2.toFixed(4)}); <z>(t/T) dots vs fresh exact sample:`);
  console.log('KS D at each check: ' + Ds.join(' '));
  console.log(mz.map(a => `${a[0].toFixed(2)}: ${a[1].toFixed(3)} / ${a[2].toFixed(3)}`).join('  '));
  // the cloud sloshes: <z>(t) has a clear cosine at the beat frequency
  const amp = Math.max(...mz.map(a => Math.abs(a[2])));
  check('1s+2p0: <z> oscillates (amplitude well above noise)', amp > 0.3, amp);
}
{ // the cheaper midpoint rule used for the on-screen animation also keeps the dots on |psi(t)|^2 (3000 dots, 2 periods, display step)
  const Z = 1, comps = [{ n: 1, l: 0, m: 0, re: 1 / Math.SQRT2, im: 0 }, { n: 2, l: 1, m: 0, re: 1 / Math.SQRT2, im: 0 }], N = 3000, Tper = 2 * Math.PI / 0.375;
  const s0 = AQ.sampleSuper(comps, Z, N, 0, { seed: 31 }), P = new Float64Array(3 * N);
  for (let i = 0; i < N; i++) { const st = Math.sin(s0.th[i]); P[3 * i] = s0.r[i] * st * Math.cos(s0.ph[i]); P[3 * i + 1] = s0.r[i] * st * Math.sin(s0.ph[i]); P[3 * i + 2] = s0.r[i] * Math.cos(s0.th[i]); }
  const dt = 0.07; let t = 0; while (t < 2 * Tper) { AQ.advance(P, comps, Z, t, dt, { order: 2 }); t += dt; }
  const ref = AQ.sampleSuper(comps, Z, N, t, { seed: 32 }), zs = Array.from({ length: N }, (_, i) => P[3 * i + 2]).sort((a, b) => a - b), zr = Array.from(ref.r, (r, i) => r * Math.cos(ref.th[i])).sort((a, b) => a - b);
  let i = 0, j = 0, D = 0; while (i < N && j < N) { if (zs[i] <= zr[j]) i++; else j++; D = Math.max(D, Math.abs(i / N - j / N)); }
  const c = 1.95 * Math.sqrt(2 / N); check('display integrator (midpoint, dt = 0.07 au) keeps dots on |psi|^2 after 2 periods', D < c, `D=${D} crit=${c}`);
  console.log(`display integrator after 2 periods: KS D = ${D.toFixed(4)} (critical ${c.toFixed(4)})`);
}
{ // 1s+2s breathes: <r> oscillates, <z> stays zero
  const Z = 1, comps = [{ n: 1, l: 0, m: 0, re: 1 / Math.SQRT2, im: 0 }, { n: 2, l: 0, m: 0, re: 1 / Math.SQRT2, im: 0 }], N = 4000;
  const dE = AQ.energy(2, Z) - AQ.energy(1, Z), T = 2 * Math.PI / dE, a = AQ.sampleSuper(comps, Z, N, 0, { seed: 3 }), b = AQ.sampleSuper(comps, Z, N, T / 2, { seed: 4 });
  const mr = s => s.r.reduce((x, y) => x + y, 0) / N;
  check('1s+2s: <r> changes between t=0 and T/2', Math.abs(mr(a) - mr(b)) > 0.3, `${mr(a)} ${mr(b)}`);
}

console.log(fails ? `\n${fails} of ${checks} checks FAILED` : `\nall ${checks} checks passed`);
process.exit(fails ? 1 : 0);
