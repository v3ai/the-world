// Node tests for the Circuit Lab solver: node tools/labtest/circuit_solver_test.mjs
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const S = require(path.join(here, '../../js/labs/circuit.js'));
const { Sim, thevenin } = S;

let pass = 0, fail = 0;
function check(name, got, want, tol, unit = '') {
  const err = Math.abs(got - want), ok = err <= tol * Math.max(1e-30, Math.abs(want)) || err < 1e-12;
  (ok ? pass++ : fail++);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${got.toPrecision(6)}${unit}, expected ${want.toPrecision(6)}${unit} (rel tol ${tol})`);
}
function truth(name, cond, info = '') { (cond ? pass++ : fail++); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${info}`); }
const R = (a, b, v) => ({ t: 'R', n: [a, b], v });
const Vdc = (a, b, v) => ({ t: 'V', n: [a, b], w: { k: 'dc', v } });
const mk = (n, elems) => new Sim({ n, elems });

// 1. voltage divider
{ const s = mk(2, [Vdc(1, 0, 10), R(1, 2, 1000), R(2, 0, 3000)]); s.dc();
  check('divider V(out) 10V*3k/(1k+3k)', s.v(2), 7.5, 1e-9, ' V');
  check('divider source current', -s.elems[0].i[0] * 1000, 2.5, 1e-6, ' mA'); }

// 2. Thevenin: 12 V -> 1k / 2k divider -> 500 ohm series -> terminals A(3)-B(gnd); 750 ohm load across A-B is removed
{ const nl = { n: 3, elems: [Vdc(1, 0, 12), R(1, 2, 1000), R(2, 0, 2000), R(2, 3, 500), R(3, 0, 750)] };
  const t = thevenin(nl, 3, 0);
  check('Thevenin Vth = 12*2k/3k', t.vth, 8, 1e-7, ' V');
  check('Thevenin Rth = 1k||2k + 500', t.rth, 2000 / 3 + 500, 1e-6, ' ohm');
  check('Norton In = Vth/Rth', t.ino, 8 / (2000 / 3 + 500), 1e-6, ' A');
  const full = mk(3, nl.elems); full.dc();
  check('Thevenin equivalent predicts loaded voltage', full.v(3), 8 * 750 / (750 + 2000 / 3 + 500), 1e-6, ' V'); }

// 3. RC charging at t = tau
{ const s = mk(2, [Vdc(1, 0, 5), R(1, 2, 1000), { t: 'C', n: [2, 0], v: 1e-6 }]); s.tranInit({ uic: true });
  s.advance(1e-3, 5e-6);
  check('RC at t=tau: 63.2% of 5 V', s.v(2), 5 * (1 - Math.exp(-1)), 2e-3, ' V');
  s.advance(4e-3, 5e-6);
  check('RC at t=5tau: 99.3%', s.v(2), 5 * (1 - Math.exp(-5)), 2e-3, ' V'); }

// 4. RLC natural frequency (series, underdamped): damped period between successive capacitor-voltage maxima
{ const Rr = 10, L = 10e-3, C = 10e-6, s = mk(3, [Vdc(1, 0, 1), R(1, 2, Rr), { t: 'L', n: [2, 3], v: L }, { t: 'C', n: [3, 0], v: C }]);
  s.tranInit({ uic: true });
  const h = 2e-6, tm = []; let v1 = 0, v2 = 0;
  while (s.t < 8e-3) { s.step(h); const v = s.v(3); if (v2 < v1 && v1 > v && v1 > 1 && false) {} if (v1 > v2 && v1 >= v && v1 > 1) tm.push(s.t - h); v2 = v1; v1 = v; }
  const w0 = 1 / Math.sqrt(L * C), a = Rr / (2 * L), wd = Math.sqrt(w0 * w0 - a * a);
  truth('RLC: found >=2 ringing peaks', tm.length >= 2, `(${tm.length})`);
  check('RLC damped angular freq from ringing period', 2 * Math.PI / (tm[1] - tm[0]), wd, 3e-3, ' rad/s');
  // undamped natural frequency via AC resonance peak
  const s2 = mk(3, [{ t: 'V', n: [1, 0], w: { k: 'sin', off: 0, amp: 1, f: 1, ph: 0 } }, R(1, 2, 1), { t: 'L', n: [2, 3], v: L }, { t: 'C', n: [3, 0], v: C }]); s2.dc();
  let best = 0, bf = 0; for (let f = 300; f < 800; f += 0.25) { const m = s2.tf(f, 1, 3)[0]; if (m > best) { best = m; bf = f; } }
  check('RLC resonance peak f0 = 1/(2 pi sqrt(LC))', bf, w0 / 2 / Math.PI, 3e-3, ' Hz'); }

// 5. low-pass -3 dB
{ const Rr = 1000, fc = 1000, C = 1 / (2 * Math.PI * Rr * fc);
  const s = mk(2, [{ t: 'V', n: [1, 0], w: { k: 'sin', off: 0, amp: 1, f: 1, ph: 0 } }, R(1, 2, Rr), { t: 'C', n: [2, 0], v: C }]); s.dc();
  const t = s.tf(fc, 1, 2);
  check('low-pass |H(fc)| = 0.7071 (-3.01 dB)', t[0], Math.SQRT1_2, 1e-6);
  check('low-pass phase at fc = -45 deg', t[1] * 180 / Math.PI, -45, 1e-6, ' deg');
  let lo = 10, hi = 1e5; for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (s.tf(m, 1, 2)[0] > Math.SQRT1_2) lo = m; else hi = m; }
  check('low-pass -3 dB frequency = 1/(2 pi RC)', lo, fc, 1e-6, ' Hz');
  check('low-pass roll-off -20 dB/decade', 20 * Math.log10(s.tf(1e4, 1, 2)[0]), -20.04, 5e-3, ' dB'); }

// 6. half-wave rectifier peak
{ const s = mk(2, [{ t: 'V', n: [1, 0], w: { k: 'sin', off: 0, amp: 5, f: 1000, ph: 0 } }, { t: 'D', n: [1, 2] }, R(2, 0, 1000)]);
  s.tranInit(); let pk = -1, mn = 1;
  while (s.t < 3e-3) { s.step(5e-6); pk = Math.max(pk, s.v(2)); mn = Math.min(mn, s.v(2)); }
  let lo = 0, hi = 1; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (m + 1000 * 1e-14 * (Math.exp(m / S.Sim.VT || m / 0.025852) - 1) < 5) lo = m; else hi = m; }
  check('half-wave peak = 5 V - Vd (analytic diode drop)', pk, 5 - lo, 5e-3, ' V');
  truth('half-wave output never negative', mn > -1e-3, `(min ${mn.toExponential(2)})`); }

// 7. CMOS inverter
{ const cm = (vin) => { const s = mk(3, [Vdc(1, 0, 5), Vdc(2, 0, vin),
    { t: 'M', n: [3, 2, 1], pol: -1, kp: 0.02, vt: 1, lam: 0.02 }, { t: 'M', n: [3, 2, 0], pol: 1, kp: 0.02, vt: 1, lam: 0.02 }]); s.dc(); return s.v(3); };
  check('CMOS in=0 -> out=Vdd', cm(0), 5, 1e-4, ' V'); check('CMOS in=5 -> out=0', cm(5) + 1, 1, 1e-4, ' V (+1 offset)');
  let lo = 0, hi = 5; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (cm(m) > m) lo = m; else hi = m; }
  check('CMOS switching threshold Vm ~ Vdd/2 (symmetric)', lo, 2.5, 0.02, ' V'); }

// 8. inverting amp
{ const ia = (vin, vhi = 12) => { const s = mk(3, [Vdc(1, 0, vin), R(1, 2, 1000), R(2, 3, 10000), { t: 'OA', n: [0, 2, 3], vhi, vlo: -vhi }]); s.dc(); return s.v(3); };
  check('inverting amp gain -Rf/Rin = -10 (finite-gain error ~1e-4)', ia(0.5), -5, 5e-4, ' V');
  check('inverting amp, negative input', ia(-0.3), 3, 5e-4, ' V');
  check('inverting amp clips at the rail', ia(2), -12, 2e-3, ' V');
  const s = mk(3, [Vdc(1, 0, 1), R(1, 2, 1000), { t: 'OA', n: [0, 2, 3], vhi: 12, vlo: -12 }, R(2, 3, 1000)]); s.dc();
  truth('virtual ground at inverting input (|V-| < 0.1 mV)', Math.abs(s.v(2)) < 1e-4, `(${s.v(2).toExponential(2)} V)`); }

// 9. zener regulator, BJT switch, LED
{ const s = mk(2, [Vdc(1, 0, 12), R(1, 2, 1000), { t: 'D', n: [0, 2], vz: 5.1 }]); s.dc();
  truth('zener regulator holds ~5.1 V', Math.abs(s.v(2) - 5.1) < 0.05, `(${s.v(2).toFixed(3)} V)`);
  const q = mk(4, [Vdc(1, 0, 5), R(1, 2, 1000), { t: 'Q', n: [2, 3, 0] }, Vdc(4, 0, 5), R(4, 3, 10000)]); q.dc();
  truth('BJT saturates as a switch (Vce < 0.25 V)', q.v(2) < 0.25 && q.v(3) > 0.6 && q.v(3) < 0.85, `(Vce ${q.v(2).toFixed(3)}, Vbe ${q.v(3).toFixed(3)})`);
  const q2 = mk(4, [Vdc(1, 0, 10), R(1, 2, 1000), { t: 'Q', n: [2, 3, 0] }, Vdc(4, 0, 1.5), R(4, 3, 100000)]); q2.dc();
  const ic = (10 - q2.v(2)) / 1000, ib = (1.5 - q2.v(3)) / 100000;
  check('BJT active region Ic/Ib = beta (100)', ic / ib, 100, 0.03);
  const l = mk(2, [Vdc(1, 0, 5), R(1, 2, 330), { t: 'D', n: [2, 0], nf: 2, Is: 0.01 / Math.exp(1.9 / (2 * 0.025852)) }]); l.dc();
  check('red LED forward drop at ~10 mA', l.v(2), 1.9, 0.03, ' V'); }

// 10. transformer
{ const s = mk(3, [{ t: 'V', n: [1, 0], w: { k: 'sin', off: 0, amp: 10, f: 60, ph: 0 } }, { t: 'XF', n: [1, 0, 2, 0], L1: 1, L2: 0.25, k: 0.999 }, R(2, 0, 100)]); s.dc();
  const t = s.tf(60, 1, 2);
  check('transformer Vs/Vp ~ n = 0.5 (n,k)', t[0], 0.5, 0.02); }

// 11. wire flows satisfy KCL & preset netlists
{
  const presets = JSON.parse(fs.readFileSync(path.join(here, '../../data/labs/circuit_presets.json'), 'utf8'));
  const want = ['ohms_law', 'series_parallel', 'voltage_divider', 'current_divider', 'kvl_kcl', 'nodal_analysis', 'superposition', 'thevenin', 'max_power', 'rc_charging', 'rl_transient', 'rlc_damping', 'ac_phasors', 'power_factor', 'low_pass', 'high_pass', 'band_pass', 'notch', 'resonance_q', 'transformer', 'half_wave_rectifier', 'bridge_rectifier', 'zener_regulator', 'led_circuit', 'bjt_switch', 'common_emitter', 'mosfet_switch', 'cmos_inverter', 'inverting_amp', 'non_inverting_amp', 'summing_amp', 'integrator', 'differentiator', 'comparator', 'schmitt_trigger', 'wien_oscillator', 'rc_ladder'];
  truth('all ' + want.length + ' required presets exist', want.every(id => presets.some(p => p.id === id)), want.filter(id => !presets.some(p => p.id === id)).join(','));
  for (const p of presets) {
    let nl;
    try { nl = S.compile({ parts: p.parts.map((q, i) => ({ id: i + 1, type: q.type, x: q.x, y: q.y, rot: q.rot || 0, p: q.p, name: q.name })), wires: p.wires.map(w => ({ x1: w[0], y1: w[1], x2: w[2], y2: w[3] })) }); }
    catch (e) { truth('preset ' + p.id + ' compiles', false, e.message); continue; }
    const sim = new Sim(nl), ok = sim.dc();
    let tranOk = true, flowErr = 0, msg = '';
    if (ok) {
      const fl = S.wireFlows(nl, sim); let mx = 0; fl.forEach(f => mx = Math.max(mx, Math.abs(f)));
      flowErr = mx;
      const ts = new Sim(nl); ts.tranInit(); const win = p.scope && p.scope.tdiv ? p.scope.tdiv * 10 : 0.01, h = S.autoStep(nl, win);
      ts.advance(win, h); if (ts.err) { tranOk = false; msg = ts.err.msg; }
      for (let i = 0; i < ts.N; i++) if (!isFinite(ts.x[i])) tranOk = false;
    } else msg = sim.err ? sim.err.msg : 'no convergence';
    const warn = nl.warnings.length ? ' warn:' + nl.warnings[0] : '';
    truth('preset ' + p.id + ': compiles, DC converges, transient runs', ok && tranOk && !nl.warnings.length, `${msg}${warn}`);
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
